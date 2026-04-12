// pages/renew/renew.js
const app = getApp()

Page({
  data: {
    loading: true,
    vehicle: null,
    rentals: [],
    renewCount: 0,
    duration: 1,
    customDuration: '',
    customDurationText: '',
    showExpirePicker: false,
    durationColumns: [
      { values: ['0年', '1年', '2年', '3年', '4年', '5年', '6年', '7年', '8年', '9年', '10年'], className: 'year' },
      { values: ['0月', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], className: 'month' },
      { values: ['0天', '1天', '2天', '3天', '4天', '5天', '6天', '7天', '8天', '9天', '10天', '11天', '12天', '13天', '14天', '15天', '16天', '17天', '18天', '19天', '20天', '21天', '22天', '23天', '24天', '25天', '26天', '27天', '28天', '29天', '30天', '31天'], className: 'day', defaultIndex: 1 }
    ],
    selectedDuration: [0, 0, 1],
    expireTime: '',
    remainingTime: '',
    remainingType: '' // 'remaining' 或 'expired'
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

        // 获取该车辆所有生效中的租聘记录
        db.collection('rental')
          .where({
            carId: options.id,
            status: 0,
            is_delete: false
          })
          .orderBy('createTime', 'asc')
          .get({
            success: (rentalRes) => {
              wx.hideLoading()

              if (rentalRes.data && rentalRes.data.length > 0) {
                let rentals = rentalRes.data

                // 如果有续租订单，需要从首次租聘订单获取用户信息
                const firstRental = rentals.find(r => r.type === 0)
                if (firstRental) {
                  rentals = rentals.map(r => ({
                    ...r,
                    renterName: firstRental.renterName,
                    renterPhone: firstRental.renterPhone
                  }))
                }

                // 计算续租次数（type=1的记录数量）
                db.collection('rental')
                  .where({
                    carId: options.id,
                    type: 1
                  })
                  .count({
                    success: (countRes) => {
                      // 使用最后一条记录的到期时间作为参考
                      const latestRental = rentals[rentals.length - 1]
                      this.setData({
                        loading: false,
                        vehicle: vehicle,
                        rentals: rentals,
                        renewCount: countRes.total,
                        expireTime: latestRental.expireTime
                      })
                      this.calculateRemainingTime()
                      this.calculateExpireTime()
                    }
                  })
              } else {
                this.setData({
                  loading: false,
                  vehicle: vehicle,
                  rentals: [],
                  expireTime: ''
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

  selectDuration(e) {
    const days = parseInt(e.currentTarget.dataset.days)
    this.setData({ duration: days })
    this.calculateExpireTime()
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
      customDurationText: text || '请选择续租时长',
      showExpirePicker: false
    })
    this.calculateExpireTime()
  },

  calculateRemainingTime() {
    const { rentals } = this.data
    if (!rentals || rentals.length === 0) return

    // 使用最新一条租聘记录的到期时间
    const latestRental = rentals[rentals.length - 1]
    const now = new Date()
    const expireDate = latestRental.expireTime instanceof Date ? latestRental.expireTime : new Date(latestRental.expireTime)
    const diff = expireDate - now

    let text = ''
    let type = ''

    if (diff > 0) {
      // 未过期
      type = 'remaining'
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      if (days > 0) {
        text = `剩余 ${days}天 ${hours}小时`
      } else {
        text = `剩余 ${hours}小时`
      }
    } else {
      // 已过期
      type = 'expired'
      const absDiff = Math.abs(diff)
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      if (days > 0) {
        text = `已过期 ${days}天 ${hours}小时`
      } else {
        text = `已过期 ${hours}小时`
      }
    }

    this.setData({
      remainingTime: text,
      remainingType: type
    })
  },

  calculateExpireTime() {
    const { rentals, duration, customDuration } = this.data
    if (!rentals || rentals.length === 0) return

    const actualDuration = duration === -1 ? (parseInt(customDuration) || 0) : duration
    if (actualDuration <= 0) return

    // 使用最新一条租聘记录的到期时间
    const latestRental = rentals[rentals.length - 1]
    const expireDate = latestRental.expireTime instanceof Date ? latestRental.expireTime : new Date(latestRental.expireTime)
    expireDate.setDate(expireDate.getDate() + actualDuration)

    const year = expireDate.getFullYear()
    const month = String(expireDate.getMonth() + 1).padStart(2, '0')
    const day = String(expireDate.getDate()).padStart(2, '0')
    const hour = String(expireDate.getHours()).padStart(2, '0')
    const minute = String(expireDate.getMinutes()).padStart(2, '0')

    this.setData({
      expireTime: `${year}-${month}-${day} ${hour}:${minute}`
    })
  },

  confirmRenew() {
    const { vehicle, rentals, duration, customDuration, expireTime } = this.data

    if (!rentals || rentals.length === 0) {
      wx.showToast({ title: '无有效租聘记录', icon: 'error' })
      return
    }

    const actualDuration = duration === -1 ? (parseInt(customDuration) || 0) : duration
    if (actualDuration <= 0) {
      wx.showToast({ title: '请选择续租时长', icon: 'error' })
      return
    }

    wx.showLoading({ title: '保存中...' })

    // 使用最新一条租聘记录
    const latestRental = rentals[rentals.length - 1]

    const db = wx.cloud.database()
    db.collection('rental').add({
      data: {
        carId: vehicle._id,
        parentRentalId: latestRental._id,
        startTime: latestRental.expireTime,
        duration: actualDuration,
        expireTime: expireTime,
        status: 0,
        type: 1,
        is_delete: false,
        createTime: db.serverDate()
      },
      success: (res) => {
        wx.hideLoading()
        wx.showToast({ title: '续租成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('续租失败', err)
        wx.showToast({ title: '续租失败', icon: 'error' })
      }
    })
  }
})
