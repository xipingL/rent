// pages/order-history/order-history.js
Page({
  data: {
    searchText: '',
    startTime: '',
    endTime: '',
    orders: [
      {
        id: 1,
        name: '雅迪DT3',
        plateNo: 'A88888',
        thumb: '🛵',
        startTime: '2024-01-10 09:30',
        endTime: '2024-01-15 18:20',
        renter: '张三',
        phone: '138****8888'
      },
      {
        id: 2,
        name: '爱玛晴天',
        plateNo: 'A99999',
        thumb: '🚲',
        startTime: '2024-01-05 14:00',
        endTime: '2024-01-08 10:15',
        renter: '李四',
        phone: '139****9999'
      },
      {
        id: 3,
        name: '新日小宇宙',
        plateNo: 'A66666',
        thumb: '🛵',
        startTime: '2023-12-28 11:00',
        endTime: '2024-01-03 16:30',
        renter: '赵六',
        phone: '136****6666'
      },
      {
        id: 4,
        name: '小牛MQi2',
        plateNo: 'A55555',
        thumb: '🚲',
        startTime: '2023-12-20 09:00',
        endTime: '2023-12-25 17:45',
        renter: '钱七',
        phone: '135****5555'
      }
    ]
  },

  onLoad() {
    // 页面加载时执行的逻辑
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      searchText: e.detail.value
    })
  },

  // 起始时间变化
  onStartTimeChange(e) {
    this.setData({
      startTime: e.detail.value
    })
  },

  // 结束时间变化
  onEndTimeChange(e) {
    this.setData({
      endTime: e.detail.value
    })
  }
})