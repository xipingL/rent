// pages/garage-detail/garage-detail.js
Page({
  data: {
    loading: true,
    vehicle: null,
    rentalHistory: []
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
          wx.showToast({ title: '车辆不存在', icon: 'error' })
          setTimeout(() => wx.navigateBack(), 1500)
          return
        }

        const vehicle = carRes.data[0]

        // 处理车辆照片 - 转换为临时URL
        const processPhotos = (vehicleData) => {
          return new Promise((resolve) => {
            if (vehicleData.photos && vehicleData.photos.length > 0) {
              wx.cloud.getTempFileURL({
                fileList: vehicleData.photos,
                success: (photoRes) => {
                  vehicleData.photosUrls = photoRes.fileList.map(f => f.tempFileURL)
                  resolve(vehicleData)
                },
                fail: () => {
                  vehicleData.photosUrls = []
                  resolve(vehicleData)
                }
              })
            } else {
              vehicleData.photosUrls = []
              resolve(vehicleData)
            }
          })
        }

        // 获取该车辆的租聘历史记录
        db.collection('rental')
          .where({
            carId: options.id,
            is_delete: false
          })
          .orderBy('createTime', 'desc')
          .get({
            success: async (rentalRes) => {
              console.log()
              const vehicleWithPhotos = await processPhotos(vehicle)
              wx.hideLoading(rentalRes.data)
              this.setData({
                loading: false,
                vehicle: vehicleWithPhotos,
                rentalHistory: rentalRes.data || []
              })
            },
            fail: (err) => {
              wx.hideLoading()
              console.error('获取租聘记录失败', err)
              this.setData({
                loading: false,
                vehicle: vehicle,
                rentalHistory: []
              })
            }
          })
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

  // 跳转到编辑
  goToEdit() {
    const { vehicle } = this.data
    if (vehicle) {
      wx.navigateTo({
        url: `/subPackages/car/pages/garage-edit/garage-edit?id=${vehicle._id}`
      })
    }
  },

  // 删除车辆
  deleteVehicle() {
    const { vehicle } = this.data
    if (!vehicle) return

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该车辆吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          const db = wx.cloud.database()
          db.collection('car').doc(vehicle._id).update({
            data: {
              is_delete: true
            },
            success: () => {
              wx.hideLoading()
              wx.showToast({ title: '删除成功', icon: 'success' })
              setTimeout(() => wx.navigateBack(), 1500)
            },
            fail: (err) => {
              wx.hideLoading()
              console.error('删除失败', err)
              wx.showToast({ title: '删除失败', icon: 'error' })
            }
          })
        }
      }
    })
  },

  // 获取状态文字
  getStatusText(status) {
    const statusMap = {
      0: '空闲',
      1: '租聘中',
      2: '待结算'
    }
    return statusMap[status] || '未知'
  }
})