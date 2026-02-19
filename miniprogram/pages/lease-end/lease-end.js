// pages/lease-end/lease-end.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    carId: '',
    vehicleInfo: {
      _id: '',
      carname: '',
      cover_image: {},
      status: 0
    },
    rentalRecords: [],
    settlementPhotos: [],
    settlementNotes: '',
    notesCharCount: 0,
    showConfirmDialog: false,
    dialogSummary: {
      vehicleName: '',
      totalRecords: 0,
      photoCount: 0,
      hasNotes: false
    },
    loading: false,
    settlementProcessing: false,
    retryCount: {
      vehicleInfo: 0,
      rentalRecords: 0
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.car_id) {
      this.setData({
        carId: options.car_id
      });
      this.loadVehicleInfo();
      this.loadRentalRecords();
    } else {
      // 处理缺失car_id参数的情况
      this.handleInvalidCarId('缺少车辆ID参数');
    }
  },

  /**
   * 处理无效car_id参数
   */
  handleInvalidCarId(message) {
    wx.showModal({
      title: '参数错误',
      content: message || '车辆ID无效，无法加载车辆信息',
      showCancel: true,
      cancelText: '返回车库',
      confirmText: '重试',
      success: (res) => {
        if (res.confirm) {
          // 用户选择重试，重新加载页面
          if (this.data.carId) {
            this.loadVehicleInfo();
            this.loadRentalRecords();
          } else {
            // 如果仍然没有car_id，返回车库
            this.navigateBackToGarage();
          }
        } else if (res.cancel) {
          // 用户选择返回车库
          this.navigateBackToGarage();
        }
      },
      fail: () => {
        // 模态框显示失败，直接返回车库
        this.navigateBackToGarage();
      }
    });
  },

  /**
   * 导航回车库页面
   */
  navigateBackToGarage() {
    wx.switchTab({
      url: '/pages/garage/garage',
      fail: () => {
        // 如果切换标签页失败，尝试普通导航
        wx.navigateTo({
          url: '/pages/garage/garage',
          fail: () => {
            // 如果都失败了，显示错误提示
            wx.showToast({
              title: '无法返回车库页面',
              icon: 'error'
            });
          }
        });
      }
    });
  },

  /**
   * 处理网络错误并提供重试选项
   */
  handleNetworkError(operation, error, retryCallback) {
    console.error(`${operation}失败:`, error);
    
    const retryCount = this.data.retryCount[operation] || 0;
    const maxRetries = 3;
    
    if (retryCount < maxRetries) {
      wx.showModal({
        title: '网络错误',
        content: `${operation}失败，是否重试？(${retryCount + 1}/${maxRetries})`,
        showCancel: true,
        cancelText: '取消',
        confirmText: '重试',
        success: (res) => {
          if (res.confirm) {
            // 增加重试计数
            const newRetryCount = { ...this.data.retryCount };
            newRetryCount[operation] = retryCount + 1;
            this.setData({ retryCount: newRetryCount });
            
            // 执行重试回调
            if (typeof retryCallback === 'function') {
              retryCallback();
            }
          } else {
            // 用户取消重试，重置重试计数
            const newRetryCount = { ...this.data.retryCount };
            newRetryCount[operation] = 0;
            this.setData({ retryCount: newRetryCount });
          }
        }
      });
    } else {
      // 达到最大重试次数
      wx.showModal({
        title: '网络错误',
        content: `${operation}多次失败，请检查网络连接后重新进入页面`,
        showCancel: true,
        cancelText: '返回车库',
        confirmText: '重新加载',
        success: (res) => {
          if (res.confirm) {
            // 重置重试计数并重新加载页面
            this.setData({
              retryCount: {
                vehicleInfo: 0,
                rentalRecords: 0
              }
            });
            this.loadVehicleInfo();
            this.loadRentalRecords();
          } else {
            this.navigateBackToGarage();
          }
        }
      });
    }
  },

  /**
   * 加载车辆信息
   */
  loadVehicleInfo() {
    const db = wx.cloud.database();
    const carId = this.data.carId;
    
    if (!carId) {
      this.handleInvalidCarId('车辆ID不能为空');
      return;
    }

    this.setData({
      loading: true
    });

    db.collection('car').doc(carId).get({
      success: (res) => {
        if (res.data) {
          this.setData({
            vehicleInfo: {
              _id: res.data._id,
              carname: res.data.carname || '',
              cover_image: res.data.cover_image || {},
              status: res.data.status || 0
            },
            loading: false
          });
          
          // 成功后重置重试计数
          const newRetryCount = { ...this.data.retryCount };
          newRetryCount.vehicleInfo = 0;
          this.setData({ retryCount: newRetryCount });
        } else {
          this.setData({
            loading: false
          });
          this.handleInvalidCarId('车辆信息不存在');
        }
      },
      fail: (err) => {
        this.setData({
          loading: false
        });
        
        // 检查是否是因为car_id无效导致的错误
        if (err.errCode === -1 || (err.errMsg && err.errMsg.includes('invalid objectid'))) {
          this.handleInvalidCarId('车辆ID格式无效');
        } else {
          // 网络或数据库错误，提供重试机制
          this.handleNetworkError('加载车辆信息', err, () => {
            this.loadVehicleInfo();
          });
        }
      }
    });
  },

  /**
   * 加载租赁记录
   */
  loadRentalRecords() {
    const db = wx.cloud.database();
    const carId = this.data.carId;
    
    if (!carId) {
      this.handleInvalidCarId('车辆ID不能为空');
      return;
    }

    this.setData({
      loading: true
    });

    db.collection('rent')
      .where({
        car_id: carId,
        status: 0  // 0=未结算
      })
      .orderBy('start_time', 'asc')  // 按开始时间升序排列
      .get({
        success: (res) => {
          if (res.data) {
            this.setData({
              rentalRecords: res.data,
              loading: false
            });
            
            // 成功后重置重试计数
            const newRetryCount = { ...this.data.retryCount };
            newRetryCount.rentalRecords = 0;
            this.setData({ retryCount: newRetryCount });
          } else {
            this.setData({
              rentalRecords: [],
              loading: false
            });
          }
        },
        fail: (err) => {
          this.setData({
            rentalRecords: [],
            loading: false
          });
          
          // 网络或数据库错误，提供重试机制
          this.handleNetworkError('加载租赁记录', err, () => {
            this.loadRentalRecords();
          });
        }
      });
  },

  /**
   * 格式化日期显示
   */
  formatDate(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  /**
   * 处理照片上传完成事件
   */
  afterPhotoUpload(event) {
    const { file } = event.detail;
    const currentPhotos = this.data.settlementPhotos;
    
    // 检查照片数量限制
    if (currentPhotos.length >= 3) {
      wx.showToast({
        title: '最多只能上传3张照片',
        icon: 'error'
      });
      return;
    }

    // 显示上传中状态
    wx.showLoading({
      title: '上传中...'
    });

    // 上传到微信云存储
    wx.cloud.uploadFile({
      cloudPath: `settlement-photos/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${file.url.split('.').pop()}`,
      filePath: file.url,
      success: (res) => {
        wx.hideLoading();
        
        // 创建照片对象
        const photoObj = {
          url: res.fileID,
          name: file.name || `照片${currentPhotos.length + 1}`,
          size: file.size || 0
        };

        // 添加到照片数组
        const updatedPhotos = [...currentPhotos, photoObj];
        this.setData({
          settlementPhotos: updatedPhotos
        });

        wx.showToast({
          title: '上传成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('照片上传失败:', err);
        
        // 提供重试选项
        wx.showModal({
          title: '上传失败',
          content: '照片上传失败，是否重试？',
          showCancel: true,
          cancelText: '取消',
          confirmText: '重试',
          success: (res) => {
            if (res.confirm) {
              // 重试上传
              this.afterPhotoUpload(event);
            }
          }
        });
      }
    });
  },

  /**
   * 删除照片
   */
  deletePhoto(event) {
    const { index } = event.detail;
    const currentPhotos = this.data.settlementPhotos;
    
    if (index < 0 || index >= currentPhotos.length) {
      wx.showToast({
        title: '删除失败',
        icon: 'error'
      });
      return;
    }

    const photoToDelete = currentPhotos[index];
    
    // 显示删除中状态
    wx.showLoading({
      title: '删除中...'
    });

    // 从云存储删除文件
    wx.cloud.deleteFile({
      fileList: [photoToDelete.url],
      success: (res) => {
        wx.hideLoading();
        
        // 从数组中移除照片
        const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
        this.setData({
          settlementPhotos: updatedPhotos
        });

        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('删除照片失败:', err);
        
        // 即使云存储删除失败，也从本地数组中移除
        const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
        this.setData({
          settlementPhotos: updatedPhotos
        });

        wx.showToast({
          title: '删除成功',
          icon: 'success'
        });
      }
    });
  },

  /**
   * 处理照片大小超限
   */
  onPhotoOversize(event) {
    wx.showToast({
      title: '照片大小不能超过5MB',
      icon: 'error'
    });
  },

  /**
   * 处理结算备注输入变化
   */
  onNotesChange(event) {
    const { value } = event.detail;
    
    // 强制执行500字符限制
    let notes = value;
    if (notes.length > 500) {
      notes = notes.substring(0, 500);
      wx.showToast({
        title: '备注不能超过500字',
        icon: 'error'
      });
    }
    
    this.setData({
      settlementNotes: notes,
      notesCharCount: notes.length
    });
  },

  /**
   * 显示结算确认对话框
   */
  showSettlementDialog() {
    // 防止重复提交
    if (this.data.loading || this.data.settlementProcessing) {
      wx.showToast({
        title: '正在处理中，请稍候',
        icon: 'loading'
      });
      return;
    }
    
    // 验证结算表单
    const { settlementPhotos, settlementNotes, vehicleInfo, rentalRecords } = this.data;
    
    // 检查是否有照片或备注
    if (settlementPhotos.length === 0 && settlementNotes.trim() === '') {
      wx.showToast({
        title: '请至少上传一张照片或填写备注',
        icon: 'error'
      });
      return;
    }
    
    // 检查是否有未结算的租赁记录
    if (rentalRecords.length === 0) {
      wx.showToast({
        title: '没有需要结算的租赁记录',
        icon: 'error'
      });
      return;
    }
    
    // 准备对话框摘要信息
    const dialogSummary = {
      vehicleName: vehicleInfo.carname || '未知车辆',
      totalRecords: rentalRecords.length,
      photoCount: settlementPhotos.length,
      hasNotes: settlementNotes.trim().length > 0
    };
    
    // 更新数据并显示对话框
    this.setData({
      dialogSummary: dialogSummary,
      showConfirmDialog: true
    });
  },

  /**
   * 取消结算对话框
   */
  cancelSettlement() {
    // 关闭对话框，不进行任何处理
    this.setData({
      showConfirmDialog: false
    });
  },

  /**
   * 确认结算
   */
  confirmSettlement() {
    // 防止重复提交
    if (this.data.settlementProcessing) {
      wx.showToast({
        title: '正在处理中，请稍候',
        icon: 'loading'
      });
      return;
    }
    
    const { carId, rentalRecords, settlementPhotos, settlementNotes } = this.data;
    
    // 显示加载状态
    this.setData({
      settlementProcessing: true,
      showConfirmDialog: false
    });
    
    wx.showLoading({
      title: '结算处理中...',
      mask: true
    });

    const db = wx.cloud.database();
    const settlementTime = new Date();
    
    // 准备结算数据
    const settlementData = {
      settlement_photos: settlementPhotos,
      settlement_notes: settlementNotes,
      settlement_time: settlementTime,
      status: 1  // 1=已结算
    };

    // 使用事务处理确保数据一致性
    db.runTransaction({
      success: async (transaction) => {
        try {
          // 1. 更新所有未结算的租赁记录
          const updatePromises = rentalRecords.map(record => {
            return transaction.collection('rent').doc(record._id).update({
              data: settlementData
            });
          });
          
          await Promise.all(updatePromises);
          
          // 2. 更新车辆状态为空闲
          await transaction.collection('car').doc(carId).update({
            data: {
              status: 0  // 0=空闲
            }
          });
          
          // 事务成功完成
          wx.hideLoading();
          this.setData({
            settlementProcessing: false
          });
          
          // 显示成功消息并导航回车库页面
          wx.showToast({
            title: '结算成功',
            icon: 'success',
            duration: 2000,
            success: () => {
              setTimeout(() => {
                wx.navigateBack({
                  delta: 1,
                  fail: () => {
                    // 如果无法返回，则跳转到车库页面
                    wx.switchTab({
                      url: '/pages/garage/garage'
                    });
                  }
                });
              }, 2000);
            }
          });
          
        } catch (error) {
          // 事务内部错误，抛出异常触发回滚
          throw error;
        }
      },
      fail: (err) => {
        // 事务失败，自动回滚
        console.error('结算事务失败:', err);
        wx.hideLoading();
        this.setData({
          settlementProcessing: false
        });
        
        // 提供重试选项，保持用户输入的数据
        wx.showModal({
          title: '结算失败',
          content: '网络错误导致结算失败，您的照片和备注已保存，是否重试？',
          showCancel: true,
          cancelText: '稍后重试',
          confirmText: '立即重试',
          success: (res) => {
            if (res.confirm) {
              // 重试结算
              this.confirmSettlement();
            } else {
              // 用户选择稍后重试，显示结算对话框让用户可以再次尝试
              this.setData({
                showConfirmDialog: true
              });
            }
          }
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})