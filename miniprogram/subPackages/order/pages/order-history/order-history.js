// pages/order-history/order-history.js
const app = getApp()

Page({
  data: {
    searchText: '',
    startTime: '',
    endTime: '',
    orders: []
  },

  onLoad() {
    this.loadOrders()
  },

  // 加载订单数据
  async loadOrders(params = {}) {
    wx.showLoading({ title: '加载中...' })

    const db = wx.cloud.database()
    const _ = db.command

    try {
      let carIds = null

      // 如果有搜索内容（车辆名称/牌照号），先查询匹配的车辆
      if (params.searchText) {
        const carRes = await db.collection('car')
          .where({
            create_by: app.globalData.openId,
            is_delete: false,
            $or: [
              { name: db.RegExp({ regexp: params.searchText, options: 'i' }) },
              { plateNo: db.RegExp({ regexp: params.searchText, options: 'i' }) }
            ]
          })
          .get()

        if (carRes.data && carRes.data.length > 0) {
          carIds = carRes.data.map(car => car._id)
        }
      }

      // 构建查询条件
      const queryCondition = {
        is_delete: false,
        create_by: app.globalData.openId
      }

      // 如果有搜索内容，构建 $or 条件
      if (params.searchText) {
        const orConditions = []

        // 租车人名称搜索（直接在 rental 表）
        orConditions.push({
          renterName: db.RegExp({ regexp: params.searchText, options: 'i' })
        })

        // 如果有匹配的车辆，添加车辆ID条件
        if (carIds && carIds.length > 0) {
          orConditions.push({ carId: _.in(carIds) })
        }

        if (orConditions.length > 0) {
          queryCondition.$or = orConditions
        }
      }

      // 如果有起始时间
      if (params.startTime) {
        const startDate = new Date(params.startTime)
        startDate.setHours(0, 0, 0, 0)
        queryCondition.startTime = _.gte(startDate)
      }

      // 如果有结束时间
      if (params.endTime) {
        const endDate = new Date(params.endTime)
        endDate.setHours(23, 59, 59, 999)
        queryCondition.startTime = queryCondition.startTime
          ? _.and(queryCondition.startTime, _.lte(endDate))
          : _.lte(endDate)
      }

      // 获取当前用户未删除的订单
      const res = await db.collection('rental')
        .where(queryCondition)
        .orderBy('startTime', 'desc')
        .get()

      let orders = res.data || []

      // 收集所有 carId
      const orderCarIds = [...new Set(orders.map(order => order.carId))]

      if (orderCarIds.length > 0) {
        // 查询相关车辆信息
        const carRes = await db.collection('car')
          .where({
            _id: _.in(orderCarIds),
            create_by: app.globalData.openId
          })
          .get()

        const carMap = {}
        carRes.data.forEach(car => {
          carMap[car._id] = car
        })

        // 关联车辆信息，并处理续租订单的用户信息
        orders = orders.map(order => {
          if (carMap[order.carId]) {
            order.name = carMap[order.carId].name
            order.plateNo = carMap[order.carId].plateNo
            order.carImage = carMap[order.carId].image || ''
          }
          // 如果是续租订单，从父订单获取用户信息
          if (order.type === 1 && order.parentRentalId) {
            const parentOrder = orders.find(o => o._id === order.parentRentalId)
            if (parentOrder) {
              order.renterName = parentOrder.renterName
              order.renterPhone = parentOrder.renterPhone
            }
          }
          // 格式化日期
          if (order.startTime) {
            order.startTimeStr = this.formatDate(order.startTime)
          }
          if (order.expireTime) {
            order.expireTimeStr = this.formatDate(order.expireTime)
          }
          if (order.settleTime) {
            order.settleTimeStr = this.formatDate(order.settleTime)
          }
          // 计算租期天数
          if (order.startTime && order.expireTime) {
            const start = new Date(order.startTime)
            const end = order.settleTime ? new Date(order.settleTime) : new Date(order.expireTime)
            const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
            order.rentalDays = diff > 0 ? diff : 0
          }
          return order
        })
      }

      wx.hideLoading()

      this.setData({
        orders: orders
      })
    } catch (err) {
      wx.hideLoading()
      console.error('获取订单失败', err)
      wx.showToast({ title: '加载失败', icon: 'error' })
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 格式化日期
  formatDate(date) {
    if (!date) return '-'
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return '-'
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchText: e.detail.value
    })
  },

  // 搜索
  onSearch() {
    const { searchText, startTime, endTime } = this.data
    this.loadOrders({ searchText, startTime, endTime })
  },

  // 开始时间变化
  onStartTimeChange(e) {
    const startTime = e.detail.value
    const { endTime } = this.data

    if (endTime && startTime > endTime) {
      wx.showToast({ title: '起始时间不能晚于截止时间', icon: 'none' })
      return
    }

    this.setData({ startTime })
    this.loadOrders({ searchText: this.data.searchText, startTime, endTime })
  },

  // 结束时间变化
  onEndTimeChange(e) {
    const endTime = e.detail.value
    const { startTime } = this.data

    if (startTime && endTime < startTime) {
      wx.showToast({ title: '截止时间不能早于起始时间', icon: 'none' })
      return
    }

    this.setData({ endTime })
    this.loadOrders({ searchText: this.data.searchText, startTime, endTime })
  }
})