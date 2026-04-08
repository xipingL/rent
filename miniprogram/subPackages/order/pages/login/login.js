// pages/login/login.js
const app = getApp()

Page({
  data: {

  },

  onLoad() {
    // 如果已经登录，直接跳转
    if (app.globalData.isLoggedIn) {
      wx.switchTab({ url: '/pages/home/home' })
    }
  },

  handleLogin(e) {
    console.log('登录按钮点击', e)
  },

  getPhoneNumber(e) {
    console.log('手机号授权回调', e.detail)
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 获取手机号成功，标记登录状态并保存到本地
      app.globalData.isLoggedIn = true
      app.globalData.hasPhone = true
      wx.setStorageSync('isLoggedIn', true)

      wx.switchTab({ url: '/pages/home/home' })
    }
  }
})
