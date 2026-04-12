// pages/garage-detail/garage-detail.js
const app = getApp()

Page({
  data: {
    loading: true,
    vehicle: null,
    rentalHistory: [],
    canOperate: false  // 是否有操作权限
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '异常数据', icon: 'error' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    this.setData({ carId: options.id })
    this.loadData(options.id)
  },

  loadData(carId) {
    wx.showLoading({ title: '加载中...' })

    const db = wx.cloud.database()

    // 获取车辆信息
    db.collection('car').where({
      _id: carId,
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

        // 权限校验：只有创建人可以操作
        const canOperate = vehicle.create_by === app.globalData.openId
        this.setData({ canOperate })

        if (!canOperate) {
          wx.showToast({ title: '无权查看此车辆', icon: 'none' })
          setTimeout(() => wx.navigateBack(), 1500)
          return
        }

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

        // 获取该车辆的租聘历史记录（只显示自己的订单）
        db.collection('rental')
          .where({
            carId: carId,
            is_delete: false,
            create_by: app.globalData.openId
          })
          .orderBy('createTime', 'desc')
          .get({
            success: async (rentalRes) => {
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

    // 权限校验
    if (vehicle.create_by !== app.globalData.openId) {
      wx.showToast({ title: '无权删除此车辆', icon: 'none' })
      return
    }

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
              // 写入操作日志
              app.addOperationLog({
                collection: 'car',
                record_id: vehicle._id,
                action: 'delete',
                car_id: vehicle._id,
                remark: '删除车辆'
              })

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

  // 标记车辆为租出（状态 0 → 1）
  markAsRented() {
    const { vehicle } = this.data
    if (!vehicle) return

    // 权限校验
    if (vehicle.create_by !== app.globalData.openId) {
      wx.showToast({ title: '无权操作', icon: 'none' })
      return
    }

    // 状态校验：只有空闲状态可以标记为租出
    if (vehicle.status !== 0) {
      wx.showToast({ title: '当前状态无法标记为租出', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认租出',
      content: '确认将此车辆标记为已租出？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          const db = wx.cloud.database()
          db.collection('car').doc(vehicle._id).update({
            data: {
              status: 1
            },
            success: () => {
              // 写入操作日志
              app.addOperationLog({
                collection: 'car',
                record_id: vehicle._id,
                action: 'update',
                car_id: vehicle._id,
                remark: '车辆租出'
              })

              wx.hideLoading()
              wx.showToast({ title: '操作成功', icon: 'success' })

              // 刷新数据
              this.loadData(vehicle._id)
            },
            fail: (err) => {
              wx.hideLoading()
              console.error('操作失败', err)
              wx.showToast({ title: '操作失败', icon: 'error' })
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