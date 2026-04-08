Component({
	data: {
		active: 0,
		list: [
			{
				icon: 'home-o',
				text: '首页',
				url: '/pages/home/home'
			},
			{
				icon: 'orders-o',
				text: '订单',
				url: '/pages/orders/orders'
			},
			{
				icon: 'chart-trending-o',
				text: '统计',
				url: '/pages/stats/stats'
			},
			{
				icon: 'user-o',
				text: '我的',
				url: '/pages/profile/profile'
			}
		]
	},

	methods: {
		onChange(event) {
			this.setData({ active: event.detail });
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
