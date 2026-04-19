// pages/operation-log/operation-log.js
const app = getApp()

Page({
  data: {
    loading: true,
    logs: [],
    filteredLogs: [],
    searchText: '',
    startTime: '',
    endTime: '',
    selectedAction: { value: '', label: '全部操作' },
    actionOptions: [
      { value: '', label: '全部操作' },
      { value: 'create', label: '创建车辆' },
      { value: 'update', label: '编辑车辆' },
      { value: 'delete', label: '删除车辆' },
      { value: 'rent', label: '租车' },
      { value: 'renew', label: '续租' },
      { value: 'settle', label: '结算' }
    ],
    actionText: {
      create: '创建车辆',
      update: '编辑车辆',
      delete: '删除车辆',
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

  // 操作类型选择
  onActionChange(e) {
    const index = e.detail.value
    const action = this.data.actionOptions[index]
    this.setData({ selectedAction: action })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value })
  },

  // 开始时间变化
  onStartTimeChange(e) {
    const startTime = e.detail.value
    const { endTime } = this.data
    if (endTime && startTime > endTime) {
      wx.showToast({ title: '起始时间不能晚于截止时间', icon: 'none' })
      return
    }
    this.setData({ startTime })
  },

  // 结束时间变化
  onEndTimeChange(e) {
    const endTime = e.detail.value
    const { startTime } = this.data
    if (startTime && endTime < startTime) {
      wx.showToast({ title: '截止时间不能早于起始时间', icon: 'none' })
      return
    }
    this.setData({ endTime })
  },

  // 搜索
  onSearch() {
    const { logs, searchText, startTime, endTime, selectedAction } = this.data

    let filtered = logs

    // 按操作类型筛选
    if (selectedAction.value) {
      filtered = filtered.filter(log => log.action === selectedAction.value)
    }

    // 按搜索文本筛选（匹配备注信息）
    if (searchText) {
      const keyword = searchText.toLowerCase()
      filtered = filtered.filter(log =>
        (log.friendlyRemark && log.friendlyRemark.toLowerCase().includes(keyword)) ||
        (log.remark && log.remark.toLowerCase().includes(keyword))
      )
    }

    // 按时间范围筛选
    if (startTime) {
      const startDate = new Date(startTime)
      startDate.setHours(0, 0, 0, 0)
      filtered = filtered.filter(log => {
        if (!log.createTime) return false
        const logDate = new Date(log.createTime)
        return logDate >= startDate
      })
    }

    if (endTime) {
      const endDate = new Date(endTime)
      endDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(log => {
        if (!log.createTime) return false
        const logDate = new Date(log.createTime)
        return logDate <= endDate
      })
    }

    this.setData({ filteredLogs: filtered })
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
        logs: processedLogs,
        filteredLogs: processedLogs
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