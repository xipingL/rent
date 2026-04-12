// pages/settle/settle.js
const app = getApp()

Page({
  data: {
    loading: true,
    vehicle: null,
    rentals: [],
    settlePhotos: [],
    remark: ''
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '异常数据', icon: 'error' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    wx.showLoading({ title: '加载中...' })

    const db = wx.cloud.database()
    // 获取车辆信息
    db.collection('car').where({
      _id: options.id,
      is_delete: false
    }).get({
      success: (carRes) => {
        if (!carRes.data || carRes.data.length === 0) {
          wx.hideLoading()
          wx.showToast({ title: '异常数据', icon: 'error' })
          setTimeout(() => wx.navigateBack(), 1500)
          return
        }
        const vehicle = carRes.data[0]

        // 权限校验：只有创建人可以操作
        if (vehicle.create_by !== app.globalData.openId) {
          wx.hideLoading()
          wx.showToast({ title: '无权操作此车辆', icon: 'none' })
          setTimeout(() => wx.navigateBack(), 1500)
          return
        }

        // 获取该车辆所有生效中的租聘记录（只查询自己的）
        db.collection('rental')
          .where({
            carId: options.id,
            status: 0,
            is_delete: false,
            create_by: app.globalData.openId
          })
          .orderBy('createTime', 'asc')
          .get({
            success: (rentalRes) => {
              const rentals = rentalRes.data || []

              // 获取首次租聘的车辆照片临时URL
              if (rentals.length > 0 && rentals[0].vehiclePhotos && rentals[0].vehiclePhotos.length > 0) {
                wx.cloud.getTempFileURL({
                  fileList: rentals[0].vehiclePhotos,
                  success: (photoRes) => {
                    const vehiclePhotosUrls = photoRes.fileList.map(f => f.tempFileURL)
                    rentals[0].vehiclePhotosUrls = vehiclePhotosUrls
                    wx.hideLoading()
                    this.setData({
                      vehicle: vehicle,
                      rentals: rentals,
                      loading: false
                    })
                  },
                  fail: (err) => {
                    console.error('获取车辆照片失败', err)
                    wx.hideLoading()
                    this.setData({
                      vehicle: vehicle,
                      rentals: rentals,
                      loading: false
                    })
                  }
                })
              } else {
                wx.hideLoading()
                this.setData({
                  vehicle: vehicle,
                  rentals: rentals,
                  loading: false
                })
              }
            },
            fail: (err) => {
              wx.hideLoading()
              console.error('获取租聘记录失败', err)
              wx.showToast({ title: '加载失败', icon: 'error' })
              this.setData({ loading: false })
              setTimeout(() => wx.navigateBack(), 1500)
            }
          })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('获取车辆信息失败', err)
        wx.showToast({ title: '异常数据', icon: 'error' })
        this.setData({ loading: false })
        setTimeout(() => wx.navigateBack(), 1500)
      }
    })
  },

  goBack() {
    wx.navigateBack()
  },

  // 选择结算照片
  chooseSettlePhoto() {
    const count = 6 - this.data.settlePhotos.length
    wx.chooseImage({
      count: count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          settlePhotos: [...this.data.settlePhotos, ...res.tempFilePaths]
        })
      }
    })
  },

  // 删除结算照片
  deleteSettlePhoto(e) {
    const index = e.currentTarget.dataset.index
    const settlePhotos = this.data.settlePhotos
    settlePhotos.splice(index, 1)
    this.setData({ settlePhotos })
  },

  // 备注输入
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 上传文件到云存储
  uploadFile(tempPath) {
    return new Promise((resolve, reject) => {
      const cloudPath = `settle/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempPath,
        success: (res) => resolve(res.fileID),
        fail: (err) => reject(err)
      })
    })
  },

  confirmSettle() {
    const { vehicle, rentals, settlePhotos, remark } = this.data

    if (!rentals || rentals.length === 0) {
      wx.showToast({ title: '无有效租聘记录', icon: 'error' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    // 上传结算照片
    const uploadPromises = settlePhotos.length > 0
      ? settlePhotos.map(f => this.uploadFile(f))
      : [Promise.resolve([])]

    Promise.all(uploadPromises)
      .then((photoIds) => {
        const db = wx.cloud.database()

        // 更新所有生效中的租聘记录状态为已结算
        const updatePromises = rentals.map(rental => {
          return db.collection('rental').doc(rental._id).update({
            data: {
              status: 2,
              settleTime: db.serverDate(),
              settlePhotos: photoIds,
              remark: remark
            }
          })
        })

        // 更新车辆状态为空闲（2 → 0）
        updatePromises.push(
          db.collection('car').doc(vehicle._id).update({
            data: { status: 0 }
          })
        )

        return Promise.all(updatePromises)
      })
      .then(() => {
        // 写入操作日志
        app.addOperationLog({
          collection: 'rental',
          record_id: rentals[0]._id,
          action: 'settle',
          car_id: vehicle._id,
          remark: remark || '结算完成'
        })

        wx.hideLoading()
        wx.showToast({ title: '结算成功', icon: 'success' })
        setTimeout(() => wx.redirectTo({ url: '/pages/home/home' }), 1500)
      })
      .catch((err) => {
        wx.hideLoading()
        console.error('结算失败', err)
        wx.showToast({ title: '结算失败', icon: 'error' })
      })
  }
})