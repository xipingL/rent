// pages/stats/stats.js
Page({
  data: {
    currentTab: 'today',
    weekTooltip: { show: false, x: 0, y: 0, label: '', value: 0 },
    monthTooltip: { show: false, x: 0, y: 0, label: '', value: 0 }
  },

  onLoad() {
    this.weekData = [120, 132, 101, 134, 90, 230, 210];
    this.monthData = [45, 67, 89, 56, 78, 90, 65, 88, 72, 95, 83, 61, 77, 92, 68, 85, 73, 96, 84, 62, 79, 88, 74, 91, 82, 66, 80, 93, 71, 87];
    this.weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    this.weekPoints = [];
    this.monthPoints = [];
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ active: 2 });
    }
  },

  // 切换标签页
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    const prevTab = this.data.currentTab;

    this.setData({
      currentTab: tab,
      weekTooltip: { show: false },
      monthTooltip: { show: false }
    });

    if (tab === 'week' && prevTab !== 'week') {
      wx.nextTick(() => {
        this.drawWeekChart();
      });
    }

    if (tab === 'month' && prevTab !== 'month') {
      wx.nextTick(() => {
        this.drawMonthChart();
      });
    }
  },

  // 点击本周图表
  tapWeekChart(e) {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    this.handleChartTap(x, y, this.weekPoints, this.weekLabels, 'week');
  },

  // 点击本月图表
  tapMonthChart(e) {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    this.handleChartTap(x, y, this.monthPoints, null, 'month');
  },

  // 处理图表点击
  handleChartTap(touchX, touchY, points, labels, type) {
    if (!points || points.length === 0) return;

    const hitRadius = 40;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const distance = Math.sqrt(Math.pow(touchX - point.x, 2) + Math.pow(touchY - point.y, 2));

      if (distance <= hitRadius) {
        let label, value;
        if (type === 'week' && labels) {
          label = labels[i];
          value = this.weekData[i];
        } else {
          label = `${i + 1}日`;
          value = this.monthData[i];
        }

        let tooltipX = point.x - 30;
        let tooltipY = point.y - 70;

        if (tooltipX < 10) tooltipX = 10;
        if (tooltipX > 260) tooltipX = 260;
        if (tooltipY < 10) tooltipY = point.y + 20;

        if (type === 'week') {
          this.setData({
            weekTooltip: { show: true, x: tooltipX, y: tooltipY, label, value }
          });
        } else {
          this.setData({
            monthTooltip: { show: true, x: tooltipX, y: tooltipY, label, value }
          });
        }
        return;
      }
    }

    if (type === 'week') {
      this.setData({ weekTooltip: { show: false } });
    } else {
      this.setData({ monthTooltip: { show: false } });
    }
  },

  // 获取canvas节点（带重试机制）
  getCanvasNode(canvasId, retries = 3) {
    return new Promise((resolve) => {
      const tryGetNode = (attempt) => {
        const query = wx.createSelectorQuery().in(this);
        query.select(`#${canvasId}`)
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res && res[0] && res[0].node) {
              const canvas = res[0].node;
              const width = res[0].width;
              const height = res[0].height;
              canvas.width = width;
              canvas.height = height;
              resolve({ canvas, width, height });
            } else if (attempt < retries) {
              setTimeout(() => tryGetNode(attempt + 1), 100);
            } else {
              console.error(`${canvasId} canvas not found after ${retries} attempts`);
              resolve(null);
            }
          });
      };
      tryGetNode(1);
    });
  },

  // 绘制本周折线图
  async drawWeekChart() {
    const result = await this.getCanvasNode('weekChart');
    if (!result) return;

    const { canvas, width, height } = result;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const data = this.weekData;
    const maxValue = Math.max(...data);
    const xStep = chartWidth / (data.length - 1);
    const yScale = chartHeight / maxValue;

    this.weekPoints = data.map((value, index) => ({
      x: padding.left + index * xStep,
      y: padding.top + chartHeight - value * yScale
    }));

    // 网格线
    ctx.strokeStyle = '#f1f2f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // X轴标签
    ctx.fillStyle = '#636e72';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    this.weekLabels.forEach((label, index) => {
      const x = padding.left + index * xStep;
      ctx.fillText(label, x, height - 8);
    });

    // Y轴标签
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = Math.round(maxValue - (maxValue / 4) * i);
      const y = padding.top + (chartHeight / 4) * i + 6;
      ctx.fillText(value.toString(), padding.left - 8, y);
    }

    // 渐变填充
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(232, 67, 147, 0.4)');
    gradient.addColorStop(1, 'rgba(232, 67, 147, 0.05)');

    ctx.beginPath();
    ctx.moveTo(this.weekPoints[0].x, padding.top + chartHeight);
    this.weekPoints.forEach((point, index) => {
      if (index === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const prev = this.weekPoints[index - 1];
        const cpx = (prev.x + point.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, point.y, point.x, point.y);
      }
    });
    ctx.lineTo(this.weekPoints[this.weekPoints.length - 1].x, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 折线
    ctx.beginPath();
    this.weekPoints.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        const prev = this.weekPoints[index - 1];
        const cpx = (prev.x + point.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, point.y, point.x, point.y);
      }
    });
    ctx.strokeStyle = '#e84393';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 数据点
    this.weekPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e84393';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  },

  // 绘制本月折线图
  async drawMonthChart() {
    const result = await this.getCanvasNode('monthChart');
    if (!result) return;

    const { canvas, width, height } = result;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const data = this.monthData;
    const maxValue = Math.max(...data);
    const xStep = chartWidth / (data.length - 1);
    const yScale = chartHeight / maxValue;

    this.monthPoints = data.map((value, index) => ({
      x: padding.left + index * xStep,
      y: padding.top + chartHeight - value * yScale
    }));

    // 网格线
    ctx.strokeStyle = '#f1f2f6';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // X轴标签（每隔5天显示）
    ctx.fillStyle = '#636e72';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < data.length; i += 5) {
      const x = padding.left + i * xStep;
      ctx.fillText(`${i + 1}日`, x, height - 8);
    }

    // Y轴标签
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = Math.round(maxValue - (maxValue / 4) * i);
      const y = padding.top + (chartHeight / 4) * i + 6;
      ctx.fillText(value.toString(), padding.left - 8, y);
    }

    // 渐变填充
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(232, 67, 147, 0.4)');
    gradient.addColorStop(1, 'rgba(232, 67, 147, 0.05)');

    ctx.beginPath();
    ctx.moveTo(this.monthPoints[0].x, padding.top + chartHeight);
    this.monthPoints.forEach((point, index) => {
      if (index === 0) {
        ctx.lineTo(point.x, point.y);
      } else {
        const prev = this.monthPoints[index - 1];
        const cpx = (prev.x + point.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, point.y, point.x, point.y);
      }
    });
    ctx.lineTo(this.monthPoints[this.monthPoints.length - 1].x, padding.top + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 折线
    ctx.beginPath();
    this.monthPoints.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        const prev = this.monthPoints[index - 1];
        const cpx = (prev.x + point.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, point.y, point.x, point.y);
      }
    });
    ctx.strokeStyle = '#e84393';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 数据点（每隔5天显示一个）
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e84393';
    ctx.lineWidth = 2;
    this.monthPoints.forEach((point, index) => {
      if (index % 5 === 0) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    });
  }
});