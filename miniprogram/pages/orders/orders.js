// pages/orders/orders.js
Page({
  data: {
    loading: true,
    orders: [],
    status0Orders: [],
    status1Orders: [],
    timer: null
  },

  onLoad() {
    this.loadOrders()
    this.startTimer()
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ active: 1 });
    }
    this.loadOrders()
  },

  onUnload() {
    this.stopTimer()
  },

  startTimer() {
    // 每分钟更新一次剩余时间
    this.timer = setInterval(() => {
      this.updateRemainingTime()
    }, 60000) // 60000ms = 1分钟
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  updateRemainingTime() {
    const { status0Orders, status1Orders } = this.data

    const updateOrders = (orders) => {
      return orders.map(order => {
        return {
          ...order,
          remainingText: this.calculateRemaining(order.expireTime)
        }
      })
    }

    this.setData({
      status0Orders: updateOrders(status0Orders),
      status1Orders: updateOrders(status1Orders)
    })
  },

  async loadOrders() {
    wx.showLoading({ title: '加载中...' })

    const db = wx.cloud.database()

    try {
      // 获取首次租聘订单 (type = 0, status != 2, is_delete = false)
      const rentalRes = await db.collection('rental')
        .where({
          type: 0,
          status: db.command.neq(2),
          is_delete: false
        })
        .orderBy('expireTime', 'asc')
        .get()

      const orders = rentalRes.data || []

      // 收集所有 carId
      const carIds = [...new Set(orders.map(order => order.carId))]

      if (carIds.length === 0) {
        wx.hideLoading()
        this.setData({
          loading: false,
          orders: [],
          status0Orders: [],
          status1Orders: []
        })
        return
      }

      // 查询所有相关车辆信息
      const carRes = await db.collection('car')
        .where({
          _id: db.command.in(carIds),
          is_delete: false
        })
        .get()

      wx.hideLoading()

      const carMap = {}
      carRes.data.forEach(car => {
        carMap[car._id] = car
      })

      // 获取所有封面图片的临时URL
      const coverFileIDs = carRes.data.map(car => car.image).filter(Boolean)
      const coverUrls = {}

      if (coverFileIDs.length > 0) {
        try {
          const coverRes = await wx.cloud.getTempFileURL({
            fileList: coverFileIDs
          })
          coverRes.fileList.forEach(file => {
            if (file.fileID && file.tempFileURL) {
              coverUrls[file.fileID] = file.tempFileURL
            }
          })
        } catch (err) {
          console.error('获取封面URL失败', err)
        }
      }

      // 按 status 分组并关联车辆信息
      const status0Orders = []
      const status1Orders = []

      orders.forEach(order => {
        order.remainingText = this.calculateRemaining(order.expireTime)
        // 关联车辆信息
        if (carMap[order.carId]) {
          order.carName = carMap[order.carId].name
          order.carPlateNo = carMap[order.carId].plateNo
          // 关联封面图片
          const coverId = carMap[order.carId].image
          if (coverId && coverUrls[coverId]) {
            order.carCoverUrl = coverUrls[coverId]
          }
        }
        if (order.status === 0) {
          status0Orders.push(order)
        } else if (order.status === 1) {
          status1Orders.push(order)
        }
      })

      this.setData({
        loading: false,
        orders: orders,
        status0Orders: status0Orders,
        status1Orders: status1Orders
      })
    } catch (err) {
      wx.hideLoading()
      console.error('获取订单失败', err)
      wx.showToast({ title: '加载失败', icon: 'error' })
      this.setData({ loading: false })
    }
  },

  // 计算剩余时间
  calculateRemaining(expireTime) {
    if (!expireTime) return '无'

    const now = new Date()
    // expireTime 可能是 Date 对象或时间戳
    const expireDate = expireTime instanceof Date
      ? expireTime
      : new Date(expireTime)
    const diff = expireDate - now

    if (diff < 0) {
      // 已过期
      const absDiff = Math.abs(diff)
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))
      let result = ''
      if (days > 0) result += `${days}天`
      if (hours > 0) result += `${hours}小时`
      if (minutes > 0 || result === '') result += `${minutes}分钟`
      return result
    } else {
      // 未过期
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      let result = ''
      if (days > 0) result += `${days}天`
      if (hours > 0) result += `${hours}小时`
      if (minutes > 0 || result === '') result += `${minutes}分钟`
      return result
    }
  },

  // 跳转到续租
  goToRenew(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/subPackages/order/pages/renew/renew?id=${id}` })
  },

  // 跳转到结算
  goToSettle(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/subPackages/order/pages/settle/settle?id=${id}` })
  }
})