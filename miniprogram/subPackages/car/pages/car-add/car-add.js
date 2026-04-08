// pages/car-add/car-add.js
const app = getApp()

Page({
  data: {
    coverTempPath: '',   // 封面临时路径
    photosTempPaths: [],  // 照片临时路径列表
    formData: {
      name: '',
      brand: '',
      frameNo: '',
      plateNo: '',
      color: '',
      battery: '',
      note: ''
    }
  },

  goBack() {
    wx.navigateBack()
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  // 选择封面（仅保存临时路径，不上传）
  chooseCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.setData({
          coverTempPath: tempFilePath
        })
      }
    })
  },

  // 选择照片（仅保存临时路径，不上传）
  choosePhoto() {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        this.setData({
          photosTempPaths: [...this.data.photosTempPaths, ...tempFilePaths]
        })
      }
    })
  },

  // 删除照片
  deletePhoto(e) {
    const index = e.currentTarget.dataset.index
    const photosTempPaths = this.data.photosTempPaths
    photosTempPaths.splice(index, 1)
    this.setData({ photosTempPaths })
  },

  // 保存车辆
  saveVehicle() {
    const { formData, coverTempPath, photosTempPaths } = this.data

    // 验证表单
    if (!formData.name) {
      this.showErrorModal('请输入车款名')
      return
    }
    if (!formData.brand) {
      this.showErrorModal('请输入品牌')
      return
    }
    if (!formData.frameNo) {
      this.showErrorModal('请输入车架号')
      return
    }
    if (!formData.plateNo) {
      this.showErrorModal('请输入牌照号')
      return
    }
    if (!formData.color) {
      this.showErrorModal('请输入颜色')
      return
    }
    if (!formData.battery) {
      this.showErrorModal('请输入电池型号')
      return
    }
    if (!coverTempPath) {
      this.showErrorModal('请上传封面图片')
      return
    }
    if (photosTempPaths.length === 0) {
      this.showErrorModal('请上传车辆照片')
      return
    }

    wx.showLoading({ title: '保存中...' })

    // 直接上传封面到云存储
    const coverCloudPath = `vehicle-covers/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
    wx.cloud.uploadFile({
      cloudPath: coverCloudPath,
      filePath: coverTempPath,
      success: (coverRes) => {
        // 封面上传成功后，批量上传照片
        this.uploadPhotosAndSave(coverRes.fileID, photosTempPaths, formData)
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('封面上传失败', err)
        this.showErrorModal('封面上传失败')
      }
    })
  },

  // 上传照片并保存到数据库
  uploadPhotosAndSave(coverFileID, photosTempPaths, formData) {
    if (photosTempPaths.length === 0) {
      // 没有照片，直接保存
      this.saveToDatabase(coverFileID, [])
      return
    }

    let uploadedCount = 0
    const photosFileIDs = []

    photosTempPaths.forEach((tempPath, index) => {
      const cloudPath = `vehicle-photos/${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}.jpg`

      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempPath,
        success: (res) => {
          photosFileIDs.push(res.fileID)
          uploadedCount++

          if (uploadedCount === photosTempPaths.length) {
            this.saveToDatabase(coverFileID, photosFileIDs)
          }
        },
        fail: (err) => {
          uploadedCount++
          console.error('照片上传失败', err)
          if (uploadedCount === photosTempPaths.length) {
            this.saveToDatabase(coverFileID, photosFileIDs)
          }
        }
      })
    })
  },

  // 保存到云数据库
  saveToDatabase(coverFileID, photosFileIDs) {
    const { formData } = this.data

    const db = wx.cloud.database()
    db.collection('car').add({
      data: {
        name: formData.name,
        brand: formData.brand,
        frameNo: formData.frameNo,
        plateNo: formData.plateNo,
        color: formData.color,
        battery: formData.battery,
        note: formData.note || '',
        image: coverFileID,
        photos: photosFileIDs,
        status: 0,
        is_delete: false,
        createTime: db.serverDate()
      },
      success: (res) => {
        wx.hideLoading()

        // 更新本地数据
        const vehicles = app.globalData.vehicles || []
        vehicles.push({
          id: res._id,
          thumb: '🛵',
          status: 0,
          image: coverFileID,
          ...formData
        })
        app.globalData.vehicles = vehicles

        wx.showToast({ title: '新增成功', icon: 'success' })
        setTimeout(() => {
          wx.redirectTo({
            url: '/subPackages/car/pages/garage/garage'
          })
        }, 1500)
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('保存失败', err)
        this.showErrorModal('保存失败，请重试')
      }
    })
  },

  showErrorModal(message) {
    wx.showToast({
      title: message,
      icon: 'error',
      duration: 2000,
      mask: true
    })
  }
})
