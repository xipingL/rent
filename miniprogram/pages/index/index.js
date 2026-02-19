// pages/index/index.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rate: 0,
    showText: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const db = wx.cloud.database()
    db.collection('car').get({
      success: res => {
        const resList = res.data
        let freeNum = 0
        if (resList.length != 0) {
          resList.forEach((item, index) => {
            if (item.status == 0) {
              freeNum = freeNum + 1
            }
          });
          const rate = freeNum / resList.length * 100;
          this.setData({
            rate: rate,
            showText: `${freeNum}/${resList.length}`
          })
        }
      }
    })
  },
  navigateToGarage() {
    wx.navigateTo({
      url: '/pages/garage/garage',
  })
  }, 


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    
    this.getTabBar().init();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})