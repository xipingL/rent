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
    vehicles: [],
    filteredVehicles: [],  // 过滤后的车辆列表
    selectMode: '',  // '' | 'rental' | 'settle' | 'renew'
    selectHint: ''
  },

  onLoad(options) {
    // 处理从首页跳转过来的场景
    if (options.carStatus !== undefined) {
      const carStatus = parseInt(options.carStatus)
      // currentTab: 0=全部, 1=空闲(0), 2=租聘中(1), 3=待结算(2)
      const tabMap = { 0: 1, 1: 2, 2: 3 }
      const statusMap = {
        0: { mode: 'rental', hint: '请选择要租聘的车辆', title: '租聘' },
        1: { mode: 'renew', hint: '请选择要续租的车辆', title: '续租' },
        2: { mode: 'settle', hint: '请选择要结算的车辆', title: '结算' }
      }
      const config = statusMap[carStatus]
      if (config) {
        this.setData({
          selectMode: config.mode,
          selectHint: config.hint,
          currentTab: tabMap[carStatus]
        })
        wx.setNavigationBarTitle({ title: config.title })
      }
    }
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
        is_delete: false,
        create_by: app.globalData.openId
      })
      .get({
        success: (res) => {
          wx.hideLoading()
          const { selectMode } = this.data
          const filteredVehicles = this.filterVehicles(res.data, selectMode)
          this.setData({
            vehicles: res.data,
            filteredVehicles
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
    const tabIndex = parseInt(e.currentTarget.dataset.idx)
    const { vehicles, selectMode } = this.data

    // 选择模式下，切换标签也要重新过滤
    let filteredVehicles = vehicles
    if (selectMode) {
      filteredVehicles = this.filterVehiclesByTab(vehicles, tabIndex, selectMode)
    }

    this.setData({
      currentTab: tabIndex,
      filteredVehicles
    })
  },

  // 根据 tab 和 mode 过滤车辆
  filterVehicles(vehicles, selectMode) {
    const modeToStatus = {
      rental: 0,   // 租聘：只显示空闲
      renew: 1,    // 续租：只显示租聘中
      settle: 2    // 结算：只显示待结算
    }
    const targetStatus = modeToStatus[selectMode]
    if (targetStatus === undefined) {
      return vehicles  // 普通模式返回全部
    }
    return vehicles.filter(v => v.status === targetStatus)
  },

  // 根据 tab 过滤（选择模式下）
  filterVehiclesByTab(vehicles, tabIndex, selectMode) {
    // tabIndex: 0=全部, 1=空闲(0), 2=租聘中(1), 3=待结算(2)
    const modeToStatus = {
      rental: 0,
      renew: 1,
      settle: 2
    }

    // 如果是全部，直接返回该模式对应的状态车辆
    if (tabIndex === 0) {
      return this.filterVehicles(vehicles, selectMode)
    }

    // 如果选择了具体 tab
    const tabStatusMap = { 1: 0, 2: 1, 3: 2 }
    const tabStatus = tabStatusMap[tabIndex]
    const modeStatus = modeToStatus[selectMode]

    // 如果点击的 tab 和 mode 对应的状态一致，显示该状态车辆
    if (tabStatus === modeStatus) {
      return vehicles.filter(v => v.status === tabStatus)
    }

    // 不一致则返回空
    return []
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

  // 选择车辆（选择模式下）
  selectVehicle(e) {
    const id = e.currentTarget.dataset.id
    const { selectMode } = this.data

    // 直接跳转到对应页面（不需要校验，因为已经过滤过了）
    if (selectMode === 'rental') {
      wx.navigateTo({ url: `/subPackages/order/pages/rental/rental?id=${id}` })
    } else if (selectMode === 'settle') {
      wx.navigateTo({ url: `/subPackages/order/pages/settle/settle?id=${id}` })
    } else if (selectMode === 'renew') {
      wx.navigateTo({ url: `/subPackages/order/pages/renew/renew?id=${id}` })
    }
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
    const vehicle = this.data.vehicles.find(v => v._id == id)

    // 权限校验
    if (!vehicle || vehicle.create_by !== app.globalData.openId) {
      wx.showToast({ title: '无权删除此车辆', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除该车辆吗？相关订单也将被删除！',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
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
                is_delete: true
              },
              success: () => {
                // 写入操作日志
                app.addOperationLog({
                  collection: 'car',
                  record_id: id,
                  action: 'delete',
                  car_id: id,
                  remark: '删除车辆'
                })
                console.log('云数据库记录已更新为删除')
              },
              fail: (err) => {
                console.error('删除云数据库记录失败', err)
              }
            })
          }

          // 从本地删除
          const vehicles = this.data.vehicles.filter(v => v._id != id)
          const filteredVehicles = this.filterVehicles(vehicles, this.data.selectMode)
          app.globalData.vehicles = vehicles
          this.setData({ vehicles, filteredVehicles })
          wx.showToast({ title: '删除成功' })
        }
      }
    })
  }
})
