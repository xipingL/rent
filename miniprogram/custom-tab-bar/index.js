Component({
	data: {
		active: 0,
		list: [
			{
				icon: 'home-o',
				text: '首页',
				url: '/pages/index/index'
			},
			{
				icon: 'clock-o',
				text: '通知',
				url: '/pages/notice/notice'
      }
      ,
			{
				icon: 'user-o',
				text: '个人',
				url: '/pages/user/user'
			}
		]
	},

	methods: {
		onChange(event) {
      this.setData({ active: event.detail });
      console.log(this.data.list[event.detail].url)
			wx.switchTab({
				url: this.data.list[event.detail].url
			});
		},

		init() {
			const page = getCurrentPages().pop();
			this.setData({
				active: this.data.list.findIndex(item => item.url === `/${page.route}`)
			});
		}
	}
});
