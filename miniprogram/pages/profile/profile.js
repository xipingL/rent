// pages/profile/profile.js
Page({
  onLoad() {
    // 页面加载时执行的逻辑
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ active: 3 });
    }
  },

  // 跳转到历史订单
  goToHistory() {
    wx.navigateTo({ url: '/subPackages/order/pages/order-history/order-history' });
  }
});