// index.js
Page({
  data: {
    coverList: [],
    fileList: [],
    load: false,
  },

  afterCover(event) {
    if (!event.detail.file) {
      wx.showToast({ title: '请选择图片', icon: 'none' });
    } else {
      var timestamp = (new Date()).valueOf();
      wx.cloud.uploadFile({
        cloudPath: `img/${timestamp}.png`,
        filePath: event.detail.file.url,
        success: res => {
          wx.showToast({ title: '上传成功', icon: 'none' });
          const newFileList = [{url: res.fileID, name: '封面'}];
          this.setData({coverList: newFileList });
        },
        fail: e => {
          console.error(e)
          wx.showToast({ title: '上传失败', icon: 'none' });
      }
    });
    }
  },
  afterDetail(event) {
    if (!event.detail.file) {
      wx.showToast({ title: '请选择图片', icon: 'none' });
    } else {
      var timestamp = (new Date()).valueOf();
      const {fileList} = this.data
      wx.cloud.uploadFile({
        cloudPath: `img/${timestamp}.png`,
        filePath: event.detail.file.url,
        success: res => {
          wx.showToast({ title: '上传成功', icon: 'none' });
          fileList.push({url: res.fileID, name: `备注${fileList.length+1}`});
          this.setData({fileList: fileList });
        },
        fail: e => {
          console.error(e)
          wx.showToast({ title: '上传失败', icon: 'none' });
      }
    });
  }
}
  ,
  deleteCover(index) {
    const coverUrl = this.data.coverList.map(item => item.url);
    wx.cloud.deleteFile({
      fileList: coverUrl,
      success: res => {
        console.log(res.fileList)
      },
      fail: console.error
    })
    this.setData({
      coverList: this.data.list.filter((_, i) => i !== idx)
    })
  }
  ,
  deleteDetail(index) {
    const detailUrl = this.data.fileList.map(item => item.url);
    this.setData({
      fileList: this.data.fileList.filter((_, i) => i !== index)
    })
    wx.cloud.deleteFile({
      fileList: detailUrl,
      success: res => {
        console.log(res.fileList)
      },
      fail: console.error
    })
  },

  formSubmit(e) {
    this.setData({
      load: true
    })

    const {coverList, fileList} = this.data
    console.log(coverList)
    if(coverList.length == 0) {
      wx.showToast({ title: '请上传车辆图片', icon: 'none' });
    }
    const inputs = e.detail.value
    if (!inputs.carname) {
      wx.showToast({ title: '请填写车名', icon: 'none' });
    }
    const db = wx.cloud.database()
    db.collection('car').add({
      // data 字段表示需新增的 JSON 数据
      data: {
        carname: inputs.carname,
        mark: inputs.mark,
        cover_image: coverList[0],
        detail_image: fileList,
        create_time: new Date(),
        update_time: new Date(),
        status: 0,
        is_delete: false
      },
      success: res => {
        // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
        this.setData({
          load: false
        })
        wx.navigateTo({
          url: "/pages/garage/garage"
        })
      }
    })


  },
  
});
