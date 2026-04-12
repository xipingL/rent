// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: {
      name: '商家用户',
      avatar: ''
    },
    openIdShort: ''
  },

  onLoad() {
    // 页面加载时执行的逻辑
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ active: 3 });
    }

    // 更新用户信息
    this.updateUserInfo();
  },

  // 更新用户信息
  updateUserInfo() {
    const userInfo = app.globalData.userInfo || { name: '商家用户', avatar: '' }
    const openId = app.globalData.openId || ''

    // 显示 openId 短版本（前后各4位）
    let openIdShort = ''
    if (openId) {
      if (openId.length > 8) {
        openIdShort = openId.substring(0, 4) + '...' + openId.substring(openId.length - 4)
      } else {
        openIdShort = openId
      }
    }

    this.setData({
      userInfo,
      openIdShort
    })
  },

  // 选择头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...' })

        const tempFilePath = res.tempFilePaths[0]

        // 上传到云存储
        const cloudPath = `user-avatar/${app.globalData.openId}-${Date.now()}.jpg`
        try {
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: tempFilePath,
          })

          // 获取临时 URL
          const tempURLRes = await wx.cloud.getTempFileURL({
            fileList: [uploadRes.fileID],
          })

          const avatarUrl = tempURLRes.fileList[0].tempFileURL

          // 更新到数据库
          await app.updateUser({ avatar: avatarUrl })

          // 更新本地显示
          this.setData({
            'userInfo.avatar': avatarUrl
          })

          wx.hideLoading()
          wx.showToast({ title: '头像已更新', icon: 'success' })
        } catch (e) {
          wx.hideLoading()
          console.error('上传头像失败', e)
          wx.showToast({ title: '上传失败', icon: 'error' })
        }
      }
    })
  },

  // 编辑名字
  editName() {
    wx.showModal({
      title: '修改名称',
      editable: true,
      placeholderText: '请输入名称',
      content: this.data.userInfo.name || '',
      success: async (res) => {
        if (res.confirm && res.content && res.content.trim()) {
          const newName = res.content.trim()

          // 更新到数据库
          await app.updateUser({ name: newName })

          // 更新本地显示
          this.setData({
            'userInfo.name': newName
          })

          wx.showToast({ title: '名称已更新', icon: 'success' })
        }
      }
    })
  },

  // 复制 openId
  copyOpenId() {
    const openId = app.globalData.openId || ''
    if (openId) {
      wx.setClipboardData({
        data: openId,
        success: () => {
          wx.showToast({ title: '已复制', icon: 'success' })
        }
      })
    }
  },

  // 跳转到历史订单
  goToHistory() {
    wx.navigateTo({ url: '/subPackages/order/pages/order-history/order-history' });
  }
});
