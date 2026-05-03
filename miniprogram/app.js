// app.js
App({
  globalData: {
    // env 参数说明：
    // env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会请求到哪个云环境的资源
    // 此处请填入环境 ID, 环境 ID 可在微信开发者工具右上顶部工具栏点击云开发按钮打开获取
    env: "",
    openId: null,
    userInfo: null,  // 用户信息 { name, avatar }
  },

  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 获取用户 openId
    this.getOpenId();
  },

  // 获取用户 openId（通过云函数）
  getOpenId() {
    wx.showLoading({ title: '初始化...' });
    wx.cloud.callFunction({
      name: 'getOpenId',
      success: (res) => {
        wx.hideLoading();
        console.log('获取 openId 成功:', res.result.openId);
        this.globalData.openId = res.result.openId;
        // openId 获取成功后，初始化用户信息
        this.initUser();
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取 openId 失败:', err);
        wx.showToast({ title: '获取用户信息失败', icon: 'none' });
      }
    });
  },

  // 初始化用户信息（检查/创建）
  async initUser() {
    if (!this.globalData.openId) return;

    const db = wx.cloud.database();
    try {
      // 查询用户是否已存在
      const res = await db.collection('user')
        .where({ openId: this.globalData.openId })
        .get();

      if (res.data && res.data.length > 0) {
        // 用户已存在，读取信息
        this.globalData.userInfo = {
          _id: res.data[0]._id,
          name: res.data[0].name || '商家用户',
          avatar: res.data[0].avatar || '',
        };
      } else {
        // 用户不存在，创建默认记录
        const addRes = await db.collection('user').add({
          data: {
            openId: this.globalData.openId,
            name: '商家用户',
            avatar: '',
            createTime: db.serverDate(),
          },
        });
        this.globalData.userInfo = {
          _id: addRes._id,
          name: '商家用户',
          avatar: '',
        };
      }
      console.log('用户信息:', this.globalData.userInfo);
    } catch (e) {
      console.error('初始化用户信息失败', e);
    }
  },

  // 更新用户信息
  async updateUser(data) {
    if (!this.globalData.openId || !this.globalData.userInfo) return;

    const db = wx.cloud.database();
    try {
      await db.collection('user')
        .doc(this.globalData.userInfo._id)
        .update({
          data: {
            ...data,
            updateTime: db.serverDate(),
          },
        });

      // 更新全局数据
      this.globalData.userInfo = {
        ...this.globalData.userInfo,
        ...data,
      };
      console.log('用户信息已更新:', this.globalData.userInfo);
    } catch (e) {
      console.error('更新用户信息失败', e);
    }
  },

  // 写入操作日志
  async addOperationLog({ collection, record_id, action, car_id, remark }) {
    if (!this.globalData.openId) {
      console.error('openId 不存在，无法写入操作日志');
      return;
    }

    const db = wx.cloud.database();
    try {
      await db.collection('operation_log').add({
        data: {
          operator: this.globalData.openId,
          action,
          collection,
          record_id,
          car_id,
          remark,
          createTime: db.serverDate(),
        },
      });
    } catch (e) {
      console.error('写入操作日志失败', e);
    }
  },
});