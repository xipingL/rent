// pages/garage/garage.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    willDeleteCar: {},
    show: false,
    empty: false,
    carList: []
  },

  turnToCreateCar(e) {
    wx.navigateTo({
      url: "/pages/car-add/car-add"
    })
  },
  turnToEditCar(e) {
    wx.navigateTo({
        url: `/pages/car-edit/car-edit?id=${e.target.id}`
      })
  },
  turnToLeaseNew(e) {
    wx.navigateTo({
      url: `/pages/lease-new/lease-new?id=${e.target.id}`
    })
  },
  turnToLeaseExtend(e) {
    wx.navigateTo({
        url: `/pages/lease-extend/lease-extend?id=${e.target.id}`
      })
  },
  turnToLeaseEnd(e) {
    wx.navigateTo({
      url: `/pages/lease-end/lease-end?car_id=${e.target.id}`
    })
  },

  deleteCar(e) {   
    const {willDeleteCar} = this.data
    willDeleteCar.carname = e.target.dataset.name
    willDeleteCar.id = e.target.id
    this.setData({
      show: true,
      willDeleteCar: willDeleteCar
    })
  },

  onClose() {
    this.setData({
      show: false
    })
  },

  sureDialog(e) {
    const db = wx.cloud.database()
    const id = this.data.willDeleteCar.id
    db.collection('car').doc(id).update({
      data: {
        is_delete: true
      },
      success:res => {
        const remaining = this.data.carList.filter(item => item._id !== id);
        const empty = remaining.length == 0 ? true : false
        this.setData({
          empty: empty,
          carList: remaining
        })
      }
    });
    this.setData({
      show: false
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const db = wx.cloud.database()
    db.collection('car').where(
      {is_delete: false}
    )
    .get({
      success: res => {
        const resList = res.data
        if (resList.length != 0) {
          this.setData({
            carList: resList
          })
        } else {
          this.setData({
            empty: true
          })
        }
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