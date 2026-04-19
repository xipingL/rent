// pages/rental/rental.js
const app = getApp()

Page({
  data: {
    loading: true,
    vehicle: null,
    name: '',
    phone: '',
    idCardFront: '',
    idCardBack: '',
    vehiclePhotos: [],
    startTime: Date.now(),      // 时间戳，用于计算
    startTimeStr: '',           // 格式化字符串，用于展示
    minDate: new Date().getTime() - 7 * 24 * 60 * 60 * 1000,
    showPicker: false,
    duration: 7,
    customDuration: '',
    customDurationText: '',
    showExpirePicker: false,
    durationColumns: [
      { values: ['0年', '1年', '2年', '3年', '4年', '5年', '6年', '7年', '8年', '9年', '10年'], className: 'year' },
      { values: ['0月', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], className: 'month' },
      { values: ['0天', '1天', '2天', '3天', '4天', '5天', '6天', '7天', '8天', '9天', '10天', '11天', '12天', '13天', '14天', '15天', '16天', '17天', '18天', '19天', '20天', '21天', '22天', '23天', '24天', '25天', '26天', '27天', '28天', '29天', '30天', '31天'], className: 'day', defaultIndex: 1 }
    ],
    selectedDuration: [0, 0, 1],
    expireTime: 0,              // 时间戳，用于计算
    expireTimeStr: ''           // 格式化字符串，用于展示
  },

  initDurationColumns() {
    const years = Array.from({length: 11}, (_, i) => i + '年')
    const months = Array.from({length: 13}, (_, i) => i + '月')
    const days = Array.from({length: 32}, (_, i) => i + '日')
    this.setData({
      durationColumns: [years, months, days]
    })
  },

  onLoad(options) {
    if (!options.id) {
      wx.showToast({ title: '异常数据', icon: 'error' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }

    wx.showLoading({ title: '加载中...' })

    const db = wx.cloud.database()
    db.collection('car').doc(options.id).get({
      success: (res) => {
        wx.hideLoading()
        if (!res.data) {
          wx.showToast({ title: '异常数据，请删除或联系管理员', icon: 'error' })
          this.setData({ loading: false })
          setTimeout(() => wx.navigateBack(), 1500)
          return
        }

        // 权限校验：只有创建人可以操作租车
        if (res.data.create_by !== app.globalData.openId) {
          wx.showToast({ title: '无权操作此车辆', icon: 'none' })
          this.setData({ loading: false })
          setTimeout(() => wx.navigateBack(), 1500)
          return
        }

        if (res.data.status !== 0) {
          wx.showToast({ title: '该车辆不可租聘', icon: 'error' })
          this.setData({ loading: false })
          setTimeout(() => wx.navigateBack(), 1500)
          return
        }

        this.setData({
          loading: false,
          vehicle: res.data,
          startTime: Date.now(),
          startTimeStr: this.formatDate(new Date())
        })
        this.calculateExpireTime()
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('获取车辆信息失败', err)
        wx.showToast({ title: '异常数据，请删除或联系管理员', icon: 'error' })
        this.setData({ loading: false })
        setTimeout(() => wx.navigateBack(), 1500)
      }
    })
  },

  formatDateOnly(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  formatTimeOnly(date) {
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${hour}:${minute}`
  },

  formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  addDays(date, days) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  },

  calculateExpireTime() {
    const { startTime, duration, customDuration } = this.data
    const days = duration === -1 ? (parseInt(customDuration) || 0) : duration
    if (days > 0 && startTime) {
      const expireMs = startTime + days * 24 * 60 * 60 * 1000
      this.setData({
        expireTime: expireMs,
        expireTimeStr: this.formatDate(new Date(expireMs))
      })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onPhoneInput(e) {
    let value = e.detail.value
    value = value.replace(/\D/g, '')
    if (value.length > 11) {
      value = value.slice(0, 11)
    }
    this.setData({ phone: value })
  },

  showDateTimePicker() {
    this.setData({ showPicker: true })
  },

  closeDateTimePicker() {
    this.setData({ showPicker: false })
  },

  showExpireDatePicker() {
    this.setData({ showExpirePicker: true })
  },

  closeExpireDatePicker() {
    this.setData({ showExpirePicker: false })
  },

  onDurationChange(e) {
    const { column, value } = e.detail
    const selected = [...this.data.selectedDuration]
    selected[column] = value
    this.setData({ selectedDuration: selected })
  },

  onDurationConfirm(e) {

    const values = e.detail.index
    // 从字符串中提取数字，如 "1年" -> 1
    const yearStr = values[0] || '0年'
    const monthStr = values[1] || '0月'
    const dayStr = values[2] || '0天'

    const year = parseInt(yearStr) || 0
    const month = parseInt(monthStr) || 0
    const day = parseInt(dayStr) || 0
    const totalDays = year * 365 + month * 30 + day
    let text = ''
    if (year > 0) text += year + '年'
    if (month > 0) text += month + '月'
    if (day > 0) text += day + '日'

    this.setData({
      customDuration: totalDays.toString(),
      customDurationText: text || '请选择租聘时长',
      showExpirePicker: false
    })
    this.calculateExpireTime()
  },

  onDateTimeConfirm(event) {
    // picker 返回的就是时间戳
    let timestamp = event.detail
    if (!timestamp || isNaN(timestamp)) {
      timestamp = Date.now()
    }
    this.setData({
      startTime: timestamp,
      startTimeStr: this.formatDate(new Date(timestamp)),
      showPicker: false
    })
    this.calculateExpireTime()
  },

  selectDuration(e) {
    const days = parseInt(e.currentTarget.dataset.days)
    this.setData({ duration: days })
    this.calculateExpireTime()
  },

  // 选择身份证正面
  chooseIdCardFront() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ idCardFront: res.tempFilePaths[0] })
      }
    })
  },

  // 选择身份证反面
  chooseIdCardBack() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ idCardBack: res.tempFilePaths[0] })
      }
    })
  },

  // 选择车辆照片
  chooseVehiclePhoto() {
    const count = 9 - this.data.vehiclePhotos.length
    wx.chooseImage({
      count: count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          vehiclePhotos: [...this.data.vehiclePhotos, ...res.tempFilePaths]
        })
      }
    })
  },

  // 删除车辆照片
  deleteVehiclePhoto(e) {
    const index = e.currentTarget.dataset.index
    const vehiclePhotos = this.data.vehiclePhotos
    vehiclePhotos.splice(index, 1)
    this.setData({ vehiclePhotos })
  },

  // 上传文件到云存储
  uploadFile(tempPath) {
    return new Promise((resolve, reject) => {
      const cloudPath = `rental/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempPath,
        success: (res) => resolve(res.fileID),
        fail: (err) => reject(err)
      })
    })
  },

  // 表单验证
  validateForm() {
    const { name, phone, idCardFront, idCardBack, startTime, duration, customDuration } = this.data

    if (!name.trim()) {
      wx.showToast({ title: '请输入租车人姓名', icon: 'error' })
      return false
    }
    if (!phone) {
      wx.showToast({ title: '请输入手机号码', icon: 'error' })
      return false
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号码格式不正确', icon: 'error' })
      return false
    }
    if (!idCardFront) {
      wx.showToast({ title: '请上传身份证', icon: 'error' })
      return false
    }
    if (!idCardBack) {
      wx.showToast({ title: '请上传身份证', icon: 'error' })
      return false
    }
    if (!startTime) {
      wx.showToast({ title: '请选择起租时间', icon: 'error' })
      return false
    }
    if (duration === -1 && (!customDuration || parseInt(customDuration) <= 0)) {
      wx.showToast({ title: '请输入正确的租聘天数', icon: 'error' })
      return false
    }
    if (duration !== -1 && duration <= 0) {
      wx.showToast({ title: '请选择租聘时长', icon: 'error' })
      return false
    }
    return true
  },

  confirmRental() {
    if (!this.validateForm()) {
      return
    }

    const { idCardFront, idCardBack, vehiclePhotos, vehicle, name, phone, startTime, duration, customDuration, expireTime } = this.data
    const filesToUpload = [idCardFront, idCardBack, ...vehiclePhotos]
    const openid = app.globalData.openId || ''

    wx.showLoading({ title: '提交中...' })

    // 请求订阅消息（等待用户响应后再继续）
    wx.requestSubscribeMessage({
      tmplIds: ['Kpp_Cw-mOX28aKmWmvfcE-XCmi8YtkpU6_el84_4Ttc'],
      success: (res) => {
        console.log('订阅消息请求成功', res)
      },
      fail: (err) => {
        console.error('订阅消息请求失败', err)
      }
    }).finally(() => {
      // 无论订阅消息结果如何，都继续保存流程
      this.doSave(openid, filesToUpload)
    })
  },

  doSave(openid, filesToUpload) {
    const { vehicle, name, phone, startTime, duration, customDuration, expireTime } = this.data

    Promise.all(filesToUpload.map(f => this.uploadFile(f)))
      .then((fileIDs) => {
        const [idCardFrontCloud, idCardBackCloud, ...vehiclePhotoClouds] = fileIDs
        const actualDuration = duration === -1 ? parseInt(customDuration) : duration

        const db = wx.cloud.database()
        return db.collection('rental').add({
          data: {
            carId: vehicle._id,
            renterName: name,
            renterPhone: phone,
            renterOpenId: openid,
            idCardFront: idCardFrontCloud,
            idCardBack: idCardBackCloud,
            vehiclePhotos: vehiclePhotoClouds.length > 0 ? vehiclePhotoClouds : (vehicle.photos || []),
            startTime: new Date(startTime),
            duration: actualDuration,
            expireTime: new Date(expireTime),
            status: 0,
            type: 0,
            is_delete: false,
            create_by: app.globalData.openId,
            createTime: db.serverDate()
          }
        }).then(res => {
          // 同时更新车辆状态和写入日志
          return Promise.all([
            db.collection('car').doc(vehicle._id).update({
              data: { status: 1 }
            }),
            app.addOperationLog({
              collection: 'rental',
              record_id: res._id,
              action: 'rent',
              car_id: vehicle._id,
              remark: `${name}，${this.formatDateOnly(new Date(startTime))}至${this.formatDateOnly(new Date(expireTime))}`
            })
          ]).then(() => res)
        }).then(res => {
          // 所有操作完成，立即跳转
          wx.hideLoading()
          wx.redirectTo({ url: '/subPackages/car/pages/garage/garage' })
          return res
        })
      })
      .catch((err) => {
        wx.hideLoading()
        console.error('保存租聘信息失败', err)
        wx.showToast({ title: '保存失败，请重试', icon: 'error' })
      })
  }
})
