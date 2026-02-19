// pages/lease-extend/lease-extend.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    car: {},
    
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const db = wx.cloud.database()
    db.collection('car').doc(options.id).get({
        success: res => {
          console.log(res.data)
          const car = res.data
          db.collection('rent').where({
            car_id: car._id
          })
          .get({
              success: function(res1) {
                  console.log(res1)
              }
          })
          
          this.setData({
            car: car,
          })
        }
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