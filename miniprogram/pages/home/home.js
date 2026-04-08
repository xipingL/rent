// pages/home/home.js
Page({
  data: {
    rentalCount: 0,
    todayOrders: 0
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
  loadStats() {
    const app = getApp();
    const vehicles = app.globalData?.vehicles || [];
    const rentingCount = vehicles.filter(v => v.status === 'renting').length;
    this.setData({
      rentalCount: rentingCount || 128,
      todayOrders: 36
    });
  },

  // 跳转到我的车库
  goToGarage() {
    wx.navigateTo({ url: '/subPackages/car/pages/garage/garage' });
  },

  // 跳转到租车
  goToRental() {
    wx.navigateTo({ url: '/subPackages/order/pages/rental/rental' });
  },

  // 跳转到结算（退租）
  goToSettle() {
    wx.navigateTo({ url: '/subPackages/order/pages/settle/settle' });
  },

  // 跳转到续租
  goToRenew() {
    wx.navigateTo({ url: '/subPackages/order/pages/renew/renew' });
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