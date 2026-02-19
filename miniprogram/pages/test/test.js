// pages/test/test.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    fileList: []
  },
  afterDetail(event) {
    if (!event.detail.file) {
      wx.showToast({ title: '请选择图片', icon: 'none' });
    } else {
      console.log(event.detail.file.url)
      const {fileList} = this.data
      var timestamp = (new Date()).valueOf();
      wx.cloud.uploadFile({
        cloudPath: `image/${timestamp}.png`,
        filePath: event.detail.file.url,
        success: res => {
          wx.showToast({ title: '上传成功', icon: 'none' });
          console.log(res)
          fileList.push({url: res.fileID, name: `备注${fileList.length+1}`});
          console.log('detail:')
          console.log(this.data.fileList)
          this.setData({
            fileList: fileList, 
          });
        },
        fail: e => {
          console.error(e)
          wx.showToast({ title: '上传失败', icon: 'none' });
        }
      });
    }
  },
  deleteDetail(event) {
    const {fileList} = this.data
    const remaing_detail_image = fileList.filter((_, i) => i !== event.detail.index)
    this.setData({
      fileList: remaing_detail_image
    })
    const deleteFileList = []
    deleteFileList.push(fileList[event.detail.index].url)
    wx.cloud.deleteFile({
      fileList: deleteFileList,
      success: res => {
        console.log('detail:')
        console.log(this.data.fileList)
      },
      fail: console.error
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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