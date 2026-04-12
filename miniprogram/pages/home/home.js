// pages/home/home.js
const app = getApp()

Page({
  data: {
    rentalCount: 0,
    todayOrders: 0,
    stats: {
      totalCars: 0,
      rentingCars: 0,
      idleCars: 0,
      pendingSettle: 0
    }
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    this.loadStats();
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ active: 0 });
    }
  },

  // 加载统计数据
  async loadStats() {
    const db = wx.cloud.database()

    try {
      // 查询当前用户的车辆
      const carRes = await db.collection('car')
        .where({
          is_delete: false,
          create_by: app.globalData.openId
        })
        .get()

      const cars = carRes.data || []
      const totalCars = cars.length
      const rentingCars = cars.filter(c => c.status === 1).length
      const idleCars = cars.filter(c => c.status === 0).length
      const pendingSettle = cars.filter(c => c.status === 2).length

      // 查询今日订单数
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const orderRes = await db.collection('rental')
        .where({
          is_delete: false,
          create_by: app.globalData.openId,
          createTime: db.command.gte(today)
        })
        .count()

      this.setData({
        stats: {
          totalCars,
          rentingCars,
          idleCars,
          pendingSettle
        },
        rentalCount: rentingCars,
        todayOrders: orderRes.total || 0
      })
    } catch (e) {
      console.error('加载统计数据失败', e)
      this.setData({
        rentalCount: 0,
        todayOrders: 0
      })
    }
  },

  // 跳转到我的车库
  goToGarage() {
    wx.navigateTo({ url: '/subPackages/car/pages/garage/garage' });
  },

  // 跳转到租车 - 先选择车辆
  goToRental() {
    wx.navigateTo({ url: '/subPackages/car/pages/garage/garage?action=rental' });
  },

  // 跳转到结算（退租）- 先选择车辆
  goToSettle() {
    wx.navigateTo({ url: '/subPackages/car/pages/garage/garage?action=settle' });
  },

  // 跳转到续租 - 先选择车辆
  goToRenew() {
    wx.navigateTo({ url: '/subPackages/car/pages/garage/garage?action=renew' });
  },

  // 跳转到订单列表
  goToOrders() {
    wx.navigateTo({ url: '/pages/orders/orders' });
  },

  // 跳转到添加车辆
  goToAddVehicle() {
    wx.navigateTo({ url: '/subPackages/car/pages/car-add/car-add' });
  },

  // 跳转到历史订单
  goToOrderHistory() {
    wx.navigateTo({ url: '/subPackages/order/pages/order-history/order-history' });
  },

  // 跳转到统计
  goToStats() {
    wx.switchTab({ url: '/pages/stats/stats' });
  }
});
