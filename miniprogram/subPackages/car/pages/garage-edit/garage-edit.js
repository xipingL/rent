// pages/garage-edit/garage-edit.js
const app = getApp()

Page({
  data: {
    loading: true,
    isEdit: false,
    vehicleId: null,
    coverImage: '',
    photosTempPaths: [],
    originalCoverImage: '',
    originalPhotos: [],
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

  onLoad(options) {
    if (options.id) {
      // 编辑模式
      this.setData({ isEdit: true })
      wx.setNavigationBarTitle({ title: '编辑车辆' })
      this.loadVehicle(options.id)
    } else {
      // 新增模式
      this.setData({ loading: false })
      wx.setNavigationBarTitle({ title: '新增车辆' })
    }
  },

  loadVehicle(id) {
    wx.showLoading({ title: '加载中...' })
    const db = wx.cloud.database()
    db.collection('car').where({
      _id: id,
      is_delete: false
    }).get({
      success: (res) => {
        wx.hideLoading()
        if (res.data && res.data.length > 0) {
          const vehicle = res.data[0]
          this.setData({
            loading: false,
            vehicleId: vehicle._id,
            coverImage: vehicle.image || '',
            photosTempPaths: vehicle.photos || [],
            originalCoverImage: vehicle.image || '',
            originalPhotos: vehicle.photos || [],
            formData: {
              name: vehicle.name || '',
              brand: vehicle.brand || '',
              frameNo: vehicle.frameNo || '',
              plateNo: vehicle.plateNo || '',
              color: vehicle.color || '',
              battery: vehicle.battery || '',
              note: vehicle.note || ''
            }
          })
        } else {
          wx.showToast({ title: '车辆不存在', icon: 'error' })
          setTimeout(() => wx.navigateBack(), 1500)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('获取车辆信息失败', err)
        wx.showToast({ title: '加载失败', icon: 'error' })
        setTimeout(() => wx.navigateBack(), 1500)
      }
    })
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

  chooseCover() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          coverImage: res.tempFilePaths[0]
        })
      }
    })
  },

  // 选择照片
  choosePhoto() {
    const count = 9 - this.data.photosTempPaths.length
    wx.chooseImage({
      count: count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          photosTempPaths: [...this.data.photosTempPaths, ...res.tempFilePaths]
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

  // 上传文件到云存储
  uploadFile(tempPath) {
    return new Promise((resolve, reject) => {
      const cloudPath = `vehicle-photos/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempPath,
        success: (res) => resolve(res.fileID),
        fail: (err) => reject(err)
      })
    })
  },

  saveVehicle() {
    const { formData, isEdit, vehicleId, coverImage, photosTempPaths, originalCoverImage, originalPhotos } = this.data

    // 验证必填字段
    if (!formData.name.trim()) {
      wx.showToast({ title: '请输入车辆名称', icon: 'error' })
      return
    }
    if (!formData.plateNo.trim()) {
      wx.showToast({ title: '请输入牌照号', icon: 'error' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    const db = wx.cloud.database()

    // 判断封面是否被修改（选择了新图片）
    const isCoverChanged = coverImage && coverImage !== originalCoverImage && coverImage.startsWith('http://tmp/')
    // 判断照片是否被修改（选择了新图片）
    const isPhotosChanged = photosTempPaths.some(p => p.startsWith('http://tmp/'))

    // 如果封面被修改了，上传新封面；否则保持原封面
    const uploadCover = isCoverChanged
      ? this.uploadFile(coverImage)
      : Promise.resolve(coverImage || '')

    // 如果照片被修改了，分别处理原照片和新照片
    let uploadPhotos
    if (isPhotosChanged) {
      // 分离原照片（cloud://）和新照片（http://tmp/）
      const originalPhotos = photosTempPaths.filter(p => p.startsWith('cloud://'))
      const newPhotos = photosTempPaths.filter(p => p.startsWith('http://tmp/'))
      // 只上传新照片
      uploadPhotos = Promise.all(newPhotos.map(f => this.uploadFile(f)))
        .then(newPhotoIds => {
          // 合并：原照片 + 新上传的照片
          return [...originalPhotos, ...newPhotoIds]
        })
    } else {
      uploadPhotos = Promise.resolve(photosTempPaths)
    }

    Promise.all([uploadCover, uploadPhotos])
      .then(([coverFileID, photosFileIDs]) => {
        if (isEdit) {
          // 编辑模式：更新车辆
          db.collection('car').doc(vehicleId).update({
            data: {
              name: formData.name,
              brand: formData.brand,
              frameNo: formData.frameNo,
              plateNo: formData.plateNo,
              color: formData.color,
              battery: formData.battery,
              note: formData.note,
              image: coverFileID,
              photos: photosFileIDs,
              updateTime: db.serverDate()
            },
            success: () => {
              wx.hideLoading()
              wx.showToast({ title: '修改成功', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            },
            fail: (err) => {
              wx.hideLoading()
              console.error('修改失败', err)
              wx.showToast({ title: '修改失败', icon: 'error' })
            }
          })
        } else {
          // 新增模式：添加车辆
          db.collection('car').add({
            data: {
              name: formData.name,
              brand: formData.brand,
              frameNo: formData.frameNo,
              plateNo: formData.plateNo,
              color: formData.color,
              battery: formData.battery,
              note: formData.note,
              image: coverFileID || 'cloud://placeholder.jpg',
              photos: photosFileIDs,
              status: 0,
              is_delete: false,
              createTime: db.serverDate()
            },
            success: () => {
              wx.hideLoading()
              wx.showToast({ title: '新增成功', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            },
            fail: (err) => {
              wx.hideLoading()
              console.error('新增失败', err)
              wx.showToast({ title: '新增失败', icon: 'error' })
            }
          })
        }
      })
      .catch((err) => {
        wx.hideLoading()
        console.error('上传失败', err)
        wx.showToast({ title: '上传失败', icon: 'error' })
      })
  }
})
