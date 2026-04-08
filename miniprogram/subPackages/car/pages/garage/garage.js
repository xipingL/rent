// pages/garage/garage.js
const app = getApp()

Page({
  data: {
    currentTab: 0,
    filterStatus: ['', 0, 1, 2],
    statusText: {
      0: '空闲',
      1: '租聘中',
      2: '待结算'
    },
    vehicles: []
  },

  onLoad() {
    this.loadVehicles()
  },

  onShow() {
    this.loadVehicles()
  },

  loadVehicles() {
    wx.showLoading({ title: '加载中...' })

    const db = wx.cloud.database()
    db.collection('car')
      .where({
        is_delete: false
      })
      .get({
        success: (res) => {
          wx.hideLoading()
          this.setData({
            vehicles: res.data
          })
          app.globalData.vehicles = res.data
        },
        fail: (err) => {
          wx.hideLoading()
          console.error('获取车辆列表失败', err)
          wx.showToast({ title: '加载失败', icon: 'error' })
        }
      })
  },

  // 切换标签页
  switchTab(e) {
    this.setData({
      currentTab: parseInt(e.currentTarget.dataset.idx)
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 跳转到添加车辆
  goToAdd() {
    wx.navigateTo({
      url: '/subPackages/car/pages/car-add/car-add'
    })
  },

  // 跳转到租车
  goToRental(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/subPackages/order/pages/rental/rental?id=${id}`
    })
  },

  // 跳转到续租
  goToRenew(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/subPackages/order/pages/renew/renew?id=${id}`
    })
  },

  // 跳转到结算
  goToSettle(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/subPackages/order/pages/settle/settle?id=${id}`
    })
  },

  // 跳转到详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/subPackages/car/pages/garage-detail/garage-detail?id=${id}`
    })
  },

  // 跳转到编辑
  goToEdit(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/subPackages/car/pages/garage-edit/garage-edit?id=${id}`
    })
  },

  // 删除车辆
  deleteVehicle(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该车辆吗？相关订单也将被删除！',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          const vehicle = this.data.vehicles.find(v => v._id == id)
          if (vehicle) {
            // 删除云存储中的图片
            const filesToDelete = []
            if (vehicle.image) {
              filesToDelete.push(vehicle.image)
            }
            if (vehicle.photos && vehicle.photos.length > 0) {
              filesToDelete.push(...vehicle.photos)
            }

            if (filesToDelete.length > 0) {
              wx.cloud.deleteFile({
                fileList: filesToDelete,
                success: (deleteRes) => {
                  console.log('云存储图片已删除', deleteRes)
                },
                fail: (err) => {
                  console.error('删除云存储图片失败', err)
                }
              })
            }

            // 从云数据库更新 is_delete 为 1
            const db = wx.cloud.database()
            db.collection('car').doc(id).update({
              data: {
                is_delete: 1
              },
              success: () => {
                console.log('云数据库记录已更新为删除')
              },
              fail: (err) => {
                console.error('删除云数据库记录失败', err)
              }
            })
          }

          // 从本地删除
          const vehicles = this.data.vehicles.filter(v => v._id != id)
          app.globalData.vehicles = vehicles
          this.setData({ vehicles })
          wx.showToast({ title: '删除成功' })
        }
      }
    })
  }
})
