// pages/operation-log/operation-log.js
const app = getApp()

Page({
  data: {
    loading: true,
    logs: [],
    actionText: {
      create: '创建车辆',
      update: '编辑车辆',
      delete: '删除',
      rent: '租车',
      renew: '续租',
      settle: '结算'
    }
  },

  onLoad() {
    this.loadLogs()
  },

  goBack() {
    wx.navigateBack()
  },

  // 格式化日期时间
  formatDateTime(date) {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hour = String(d.getHours()).padStart(2, '0')
    const minute = String(d.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 格式化日期（年月日）
  formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  async loadLogs() {
    wx.showLoading({ title: '加载中...' })

    try {
      const db = wx.cloud.database()
      const _ = db.command

      // 查询当前用户的操作记录
      const res = await db.collection('operation_log')
        .where({
          operator: app.globalData.openId
        })
        .orderBy('createTime', 'desc')
        .get()

      const logs = res.data || []

      // 获取所有涉及的 car_id
      const carIds = [...new Set(logs.map(log => log.car_id).filter(Boolean))]

      // 查询车辆信息（包含已删除的）
      const carMap = {}
      if (carIds.length > 0) {
        const carRes = await db.collection('car')
          .where({ _id: _.in(carIds) })
          .field({ name: true, plateNo: true, is_delete: true })
          .get()
        carRes.data.forEach(car => {
          carMap[car._id] = car
        })
      }

      // 处理日志，生成友好描述
      const processedLogs = logs.map(log => {
        const car = carMap[log.car_id]
        const carName = car ? `${car.name}[${car.plateNo}]` : null
        const carDeleted = !car || car.is_delete

        let friendlyRemark = ''

        switch (log.action) {
          case 'create':
            friendlyRemark = carDeleted
              ? '创建车辆（车辆已删除）'
              : `创建车辆：${carName}`
            break
          case 'update':
            friendlyRemark = carDeleted
              ? '编辑车辆（车辆已删除）'
              : `编辑车辆：${carName}`
            break
          case 'delete':
            friendlyRemark = '删除车辆'
            break
          case 'rent':
            if (carDeleted) {
              friendlyRemark = '租车（车辆已删除）'
            } else {
              // 解析 remark 格式：租车人，日期至日期
              const parts = (log.remark || '').split('，')
              const renter = parts[0] || '未知'
              const dates = parts[1] || ''
              friendlyRemark = `${renter} 租 ${carName}，${dates}`
            }
            break
          case 'renew':
            if (carDeleted) {
              friendlyRemark = '续租（车辆已删除）'
            } else {
              // 解析 remark 格式：租车人，续租X天，到期时间XXX
              const parts = (log.remark || '').split('，')
              const renter = parts[0] || '未知'
              const duration = parts[1] || ''
              friendlyRemark = `${renter} 续租 ${carName}，${duration}`
            }
            break
          case 'settle':
            if (carDeleted) {
              friendlyRemark = log.remark || '结算（车辆已删除）'
            } else {
              // 解析 remark 格式：租车人，车款名[车牌]，已归还
              const parts = (log.remark || '').split('，')
              const renter = parts[0] || '未知'
              friendlyRemark = `${renter} 归还 ${carName}`
            }
            break
          default:
            friendlyRemark = log.remark || '未知操作'
        }

        return {
          ...log,
          createTimeStr: this.formatDateTime(log.createTime),
          friendlyRemark
        }
      })

      this.setData({
        loading: false,
        logs: processedLogs
      })
    } catch (err) {
      console.error('获取操作记录失败', err)
      wx.showToast({ title: '加载失败', icon: 'error' })
      this.setData({ loading: false })
    } finally {
      wx.hideLoading()
    }
  }
})