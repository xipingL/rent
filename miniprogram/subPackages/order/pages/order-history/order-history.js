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
  async loadOrders() {
    wx.showLoading({ title: '加载中...' })

    const db = wx.cloud.database()

    try {
      // 获取当前用户未删除的订单
      const res = await db.collection('rental')
        .where({
          is_delete: false,
          create_by: app.globalData.openId
        })
        .orderBy('startTime', 'desc')
        .get()

      let orders = res.data || []

      // 收集所有 carId
      const carIds = [...new Set(orders.map(order => order.carId))]

      if (carIds.length > 0) {
        // 查询相关车辆信息（同样需要过滤）
        const carRes = await db.collection('car')
          .where({
            _id: db.command.in(carIds),
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
    const { searchText, orders } = this.data
    if (!searchText) {
      this.loadOrders()
      return
    }

    // 按关键词筛选
    const filtered = orders.filter(order => {
      const keyword = searchText.toLowerCase()
      return (
        (order.name && order.name.toLowerCase().includes(keyword)) ||
        (order.plateNo && order.plateNo.toLowerCase().includes(keyword)) ||
        (order.renterName && order.renterName.toLowerCase().includes(keyword))
      )
    })

    this.setData({ orders: filtered })
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
  }
})