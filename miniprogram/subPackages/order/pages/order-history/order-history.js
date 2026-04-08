// pages/order-history/order-history.js
Page({
  data: {
    searchText: '',
    startTime: '',
    endTime: '',
    orders: [],
    allOrders: []  // 保存原始订单数据用于搜索
  },

  onLoad() {
    this.loadOrders()
  },

  // 加载订单数据
  async loadOrders() {
    wx.showLoading({ title: '加载中...' })

    const db = wx.cloud.database()

    try {
      // 获取所有未删除的订单
      const res = await db.collection('rental')
        .where({
          is_delete: false
        })
        .orderBy('startTime', 'desc')
        .get()

      let orders = res.data || []

      // 收集所有 carId
      const carIds = [...new Set(orders.map(order => order.carId))]

      if (carIds.length > 0) {
        // 查询相关车辆信息
        const carRes = await db.collection('car')
          .where({
            _id: db.command.in(carIds)
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
            order.brand = carMap[order.carId].brand
            order.plateNo = carMap[order.carId].plateNo
            order.carNote = carMap[order.carId].note
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
          return order
        })
      }

      wx.hideLoading()

      this.setData({
        orders: orders,
        allOrders: orders
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

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchText: e.detail.value
    })
  },

  // 搜索
  onSearch() {
    const { searchText, startTime, endTime, allOrders } = this.data

    // 如果没有搜索条件，重新加载所有订单
    if (!searchText && !startTime && !endTime) {
      this.loadOrders()
      return
    }

    // 筛选订单（基于原始订单数据）
    const filtered = allOrders.filter(order => {
      // 关键词筛选（模糊匹配）
      let keywordMatch = true
      if (searchText) {
        const keyword = searchText.toLowerCase()
        keywordMatch = (
          (order.renterName && order.renterName.toLowerCase().includes(keyword)) ||
          (order.remark && order.remark.toLowerCase().includes(keyword)) ||
          (order.renterPhone && order.renterPhone.toLowerCase().includes(keyword)) ||
          (order.name && order.name.toLowerCase().includes(keyword)) ||
          (order.brand && order.brand.toLowerCase().includes(keyword)) ||
          (order.plateNo && order.plateNo.toLowerCase().includes(keyword)) ||
          (order.carNote && order.carNote.toLowerCase().includes(keyword))
        )
      }

      // 日期筛选
      let dateMatch = true
      if (startTime || endTime) {
        // 提取订单的开始和到期日期（只取年月日部分）
        const orderStart = order.startTime ? order.startTime.split(' ')[0] : ''
        const orderExpire = order.expireTime ? order.expireTime.split(' ')[0] : ''

        if (startTime && endTime) {
          // 两者都有：订单时间段与筛选时间段有交集
          // 订单开始 <= 筛选结束 且 订单到期 >= 筛选开始
          dateMatch = orderStart <= endTime && orderExpire >= startTime
        } else if (startTime) {
          // 只有起始时间：订单到期时间 >= 起始时间
          dateMatch = orderExpire >= startTime
        } else if (endTime) {
          // 只有截止时间：订单开始时间 <= 截止时间
          dateMatch = orderStart <= endTime
        }
      }

      // 两个条件独立，都满足才匹配
      return keywordMatch && dateMatch
    })

    this.setData({ orders: filtered })
  },

  // 开始时间变化
  onStartTimeChange(e) {
    this.setData({
      startTime: e.detail.value
    })
  },

  // 结束时间变化
  onEndTimeChange(e) {
    this.setData({
      endTime: e.detail.value
    })
  }
})