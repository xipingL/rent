// pages/lease-new/lease-new.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    columns: [{
      values:['0年', '1年', '2年', '3年'],
      className: 'year',
    },
    {
      values:['0月', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      className: 'month',
    },
    {
      values:['0日', '1日', '2日', '3日', '4日', '5日', '6日', '7日', '8日', '9日', 
              '10日', '11日', '12日', '13日', '14日', '15日', '16日', '17日', '18日', '19日', 
              '20日', '21日', '22日', '23日', '24日', '25日', '26日', '27日', '28日', '29日', '30日', '31日'],
      className: 'day',
    }] ,
    active: 1,
    date_show: false,
    range_show: false,
    car: {},
    renter: {
      name: '',
      id_card_image: []
    },
    car_change_field: {},
    cover_image: [],
    detail_image: [],
    rent_info: {
      picker_time: new Date().getTime(),
      start_time: new Date().getTime(),
      duration_picker_time: "",
      end_time: null,
      timeout: ""
    },
    minDate: new Date().getTime(),
    maxDate: new Date(2027, 1, 1).getTime(),
    steps: [
      {
        desc: '修改车辆信息',
        status: 'process', // 'process', 'finish', 'error'
        icon: 'car-o'
      },
      {
        desc: '填写租车人信息',
        status: 'wait',
        icon: 'contact'
      },
      {
        desc: '填写租聘信息',
        status: 'wait',
        icon: 'calendar-o'
      },
    ],

    // Enhanced validation state management
    validation: {
      step0: { 
        valid: false, 
        errors: [] 
      },
      step1: { 
        valid: false, 
        errors: [] 
      },
      step2: { 
        valid: false, 
        errors: [] 
      }
    },

    // Enhanced change tracking for vehicle modifications
    changeTracking: {
      vehicle: {
        hasChanges: false,
        originalData: {},
        changes: {},
        changeHistory: []
      }
    },

    // Confirmation dialog state management
    showConfirmDialog: false,
    confirmationData: {
      vehicle: {},
      renter: {},
      lease: {}
    },

    // Enhanced loading and button states
    loading: false,
    loadingAction: '', // 'next', 'submit', 'upload', 'validation'
    submitDisabled: true,
    nextDisabled: true,
    uploadingCover: false,
    uploadingDetail: false,
    uploadingIdCard: false,

    // Enhanced duplicate submission prevention
    isProcessing: false,
    lastSubmissionTime: 0,
    submissionCooldown: 2000, // 2 seconds cooldown
    operationLocks: {}, // Track specific operation locks
    buttonClickCounts: {}, // Track button click counts for debugging
    lastOperationId: null, // Track last operation ID

    // Upload progress tracking
    uploadProgress: {},
    batchUploadProgress: {
      total: 0,
      completed: 0,
      failed: 0,
      percentage: 0,
      isComplete: false
    },

    // Network status tracking
    networkStatus: 'unknown', // 'connected', 'disconnected', 'unknown'
    networkType: 'unknown',
    hasPendingOperations: false,
    pendingOperationType: '',

    // Field-specific validation feedback
    fieldValidation: {},

    // Error display state for UI feedback
    errorDisplay: {},

    formatter(type, value) {
      if (type === 'year') {
        return `${value}年`;
      } else if (type === 'month') {
        return `${value}月`;
      } else if (type === 'day') {
        return `${value}日`
      } else if (type === 'hour') {
        return `${value}时`
      } else if (type === 'minute') {
        return `${value}分`
      } else {
        return value
      }
    },
  },
  onConfirmRange(e) {
    const {rent_info} = this.data
    const {index} = e.detail
    
    // Comprehensive duration validation
    const validationResult = this.validateDuration(index)
    
    if (!validationResult.isValid) {
      this.showFieldValidationFeedback('duration', validationResult.feedbackType)
      wx.showToast({
        title: validationResult.message,
        icon: 'none',
        duration: 2500
      })
      return
    }

    const {range_format, expire_time} = this.formatDuration(index)

    // Valid duration selected
    rent_info.duration_picker_time = range_format
    rent_info.timeout = expire_time
    rent_info.end_time = new Date(expire_time).getTime()
    
    this.setData({
      range_show: false,
      rent_info: rent_info
    })
    
    // Provide positive feedback for valid duration
    this.showFieldValidationFeedback('duration', 'valid')
    
    // Show success feedback
    wx.showToast({
      title: '租赁时长设置成功',
      icon: 'success',
      duration: 1500
    })
    
    // Trigger validation with error display for step 2 and update end date display
    this.validateStepWithErrorDisplay(2)
    this.updateEndDateDisplay()
  },

  // Enhanced method to recalculate end time when start time changes
  recalculateEndTimeIfNeeded() {
    const {rent_info} = this.data
    if (rent_info.duration_picker_time && rent_info.duration_picker_time !== '' && rent_info.start_time) {
      const endTimeResult = this.calculateEndTime(rent_info.start_time, rent_info.duration_picker_time)
      
      if (endTimeResult.success) {
        rent_info.end_time = endTimeResult.endTime
        rent_info.timeout = endTimeResult.formattedEndTime
        
        this.setData({
          rent_info: rent_info
        })
        
        // Show feedback about recalculation
        wx.showToast({
          title: '到期时间已更新',
          icon: 'success',
          duration: 1000
        })
        
        // Trigger validation after recalculation
        this.validateStepWithErrorDisplay(2)
      } else {
        // Handle calculation error
        wx.showToast({
          title: '到期时间计算失败，请重新选择',
          icon: 'none',
          duration: 2000
        })
      }
    }
  },

  // Enhanced end time calculation method
  calculateEndTime(startTime, durationString) {
    try {
      // Parse the duration string (e.g., "1年2月15日")
      const durationMatch = durationString.match(/(\d+)年(\d+)月(\d+)日/)
      if (!durationMatch) {
        return { success: false, error: 'Invalid duration format' }
      }
      
      const years = parseInt(durationMatch[1]) || 0
      const months = parseInt(durationMatch[2]) || 0
      const days = parseInt(durationMatch[3]) || 0
      
      // Create end date by adding duration to start date
      const startDate = new Date(startTime)
      const endDate = new Date(startDate)
      
      // Add years, months, and days
      endDate.setFullYear(endDate.getFullYear() + years)
      endDate.setMonth(endDate.getMonth() + months)
      endDate.setDate(endDate.getDate() + days)
      
      // Validate the calculated end date
      const now = new Date().getTime()
      const maxDate = this.data.maxDate
      
      if (endDate.getTime() <= startDate.getTime()) {
        return { success: false, error: 'End date must be after start date' }
      }
      
      if (endDate.getTime() > maxDate) {
        return { success: false, error: 'End date exceeds maximum allowed date' }
      }
      
      return {
        success: true,
        endTime: endDate.getTime(),
        formattedEndTime: this.formatDate(endDate.getTime()),
        duration: {
          years: years,
          months: months,
          days: days,
          totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
        }
      }
    } catch (error) {
      console.error('End time calculation error:', error)
      return { success: false, error: error.message }
    }
  },

  // Real-time end date update when start time or duration changes
  updateEndDateDisplay() {
    const {rent_info} = this.data
    
    // Only calculate if both start time and duration are set
    if (rent_info.start_time && rent_info.duration_picker_time) {
      const endTimeResult = this.calculateEndTime(rent_info.start_time, rent_info.duration_picker_time)
      
      if (endTimeResult.success) {
        // Update end time data
        rent_info.end_time = endTimeResult.endTime
        rent_info.timeout = endTimeResult.formattedEndTime
        
        // Store additional calculation details for display
        const calculationDetails = {
          startTime: rent_info.start_format_time,
          duration: rent_info.duration_picker_time,
          endTime: endTimeResult.formattedEndTime,
          totalDays: endTimeResult.duration.totalDays,
          isValid: true
        }
        
        this.setData({
          rent_info: rent_info,
          endDateCalculation: calculationDetails
        })
        
        // Trigger validation to update UI state
        this.validateStepWithErrorDisplay(2)
      } else {
        // Clear end time if calculation fails
        rent_info.end_time = null
        rent_info.timeout = ''
        
        this.setData({
          rent_info: rent_info,
          endDateCalculation: {
            isValid: false,
            error: endTimeResult.error
          }
        })
      }
    } else {
      // Clear end time if prerequisites are not met
      rent_info.end_time = null
      rent_info.timeout = ''
      
      this.setData({
        rent_info: rent_info,
        endDateCalculation: {
          isValid: false,
          error: 'Missing start time or duration'
        }
      })
    }
  },
  onCancelRange() {
    this.setData({
      range_show: false
    })
  },
  formatDate: function(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false // 24小时制
    }).replace(/\//g, '-');
  },
  // 根据租聘时长 格式化 并得到到期时间
  formatDuration: function(index) {
    const {rent_info} = this.data
    const d = new Date(rent_info.start_time)
    let value = ""
    if (index[0] != 0) {
      value += `${index[0]}年`
      d.setFullYear(d.getFullYear() + index[0]);
    }
    if (index[1] != 0) {
      value += `${index[1]}月`
      d.setMonth(d.getMonth() + index[1]);
    }
    if (index[2] != 0) {
      value += `${index[2]}天`
      d.setDate(d.getDate() + index[2]);
    }
    return { "range_format" :value, "expire_time": this.formatDate(d.getTime())}
  },
  onDisplayDate() {
    this.setData({
      date_show: true
    })
  },
  onDisplayRange() {
    this.setData({
      range_show: true
    })
  },
  onCloseDate() {
    const {rent_info} = this.data
    rent_info.picker_time = rent_info.start_time
    this.setData({
      rent_info: rent_info,
      date_show: false
    })
  },

  onConfirmDate() {
    const {rent_info} = this.data
    const selectedTime = rent_info.picker_time
    const now = new Date().getTime()
    
    // Comprehensive date validation with detailed feedback
    const validationResult = this.validateStartDate(selectedTime)
    
    if (!validationResult.isValid) {
      this.showFieldValidationFeedback('start_time', validationResult.feedbackType)
      wx.showToast({
        title: validationResult.message,
        icon: 'none',
        duration: 2500
      })
      return
    }
    
    // Valid date selected
    rent_info.start_time = rent_info.picker_time
    rent_info.start_format_time = this.formatDate(rent_info.picker_time)
    
    this.setData({
      rent_info: rent_info, 
      date_show: false
    })
    
    // Provide positive feedback for valid date
    this.showFieldValidationFeedback('start_time', 'valid')
    
    // Show success feedback
    wx.showToast({
      title: '开始时间设置成功',
      icon: 'success',
      duration: 1500
    })
    
    // Trigger validation with error display for step 2 and update end date display
    this.validateStepWithErrorDisplay(2)
    this.updateEndDateDisplay()
  },
  onInput(event) {
    const {rent_info} = this.data
    const selectedTime = event.detail
    rent_info.picker_time = selectedTime
    
    // Real-time validation for date selection with comprehensive feedback
    const validationResult = this.validateStartDate(selectedTime)
    
    // Provide immediate feedback for date selection
    this.showFieldValidationFeedback('start_time', validationResult.feedbackType)
    
    this.setData({
      rent_info: rent_info,
    });
  },

  // Comprehensive start date validation method
  validateStartDate(selectedTime) {
    const now = new Date().getTime()
    const oneHourFromNow = now + (60 * 60 * 1000) // 1 hour buffer
    const oneYearFromNow = now + (365 * 24 * 60 * 60 * 1000)
    
    // Check if date is in the past
    if (selectedTime <= now) {
      return {
        isValid: false,
        feedbackType: 'past',
        message: '开始时间不能是过去时间，请选择当前时间之后'
      }
    }
    
    // Check if date is too soon (within 1 hour) - warning but not blocking
    if (selectedTime < oneHourFromNow) {
      return {
        isValid: true, // Allow but warn
        feedbackType: 'soon',
        message: '开始时间较近，建议至少提前1小时预约',
        isWarning: true
      }
    }
    
    // Check if date is too far in the future
    if (selectedTime > oneYearFromNow) {
      return {
        isValid: false,
        feedbackType: 'too_far',
        message: '开始时间不能超过一年后，请选择一年内的时间'
      }
    }
    
    // Valid date
    return {
      isValid: true,
      feedbackType: 'valid',
      message: '开始时间设置正确'
    }
  },

  // Comprehensive duration validation method
  validateDuration(index) {
    const years = index[0] || 0
    const months = index[1] || 0
    const days = index[2] || 0
    
    // Check if duration is zero
    if (years === 0 && months === 0 && days === 0) {
      return {
        isValid: false,
        feedbackType: 'zero',
        message: '租赁时长不能为零，请至少选择1天'
      }
    }
    
    // Check if duration is too short (less than 1 day) - warning
    if (years === 0 && months === 0 && days < 1) {
      return {
        isValid: false,
        feedbackType: 'too_short',
        message: '租赁时长至少需要1天'
      }
    }
    
    // Check if duration is too long (more than 3 years)
    const totalDays = (years * 365) + (months * 30) + days
    if (totalDays > (3 * 365)) {
      return {
        isValid: false,
        feedbackType: 'too_long',
        message: '租赁时长不能超过3年，请调整时长'
      }
    }
    
    // Check for invalid date combinations (e.g., start date + duration exceeds max date)
    const {rent_info} = this.data
    if (rent_info.start_time) {
      const startDate = new Date(rent_info.start_time)
      const endDate = new Date(startDate)
      endDate.setFullYear(endDate.getFullYear() + years)
      endDate.setMonth(endDate.getMonth() + months)
      endDate.setDate(endDate.getDate() + days)
      
      const maxDate = this.data.maxDate
      if (endDate.getTime() > maxDate) {
        return {
          isValid: false,
          feedbackType: 'exceeds_max',
          message: '结束时间超出系统允许范围，请缩短租赁时长'
        }
      }
    }
    
    // Valid duration
    return {
      isValid: true,
      feedbackType: 'valid',
      message: '租赁时长设置正确'
    }
  },

  // Validate date combinations to prevent invalid scenarios
  validateDateCombination() {
    const {rent_info} = this.data
    const errors = []
    
    // Check if start date and duration are both set
    if (!rent_info.start_time || !rent_info.duration_picker_time) {
      return { isValid: false, errors: ['请先设置开始时间和租赁时长'] }
    }
    
    // Check if end date is calculated
    if (!rent_info.end_time) {
      errors.push('结束时间计算失败，请重新选择租赁时长')
    }
    
    // Check if end date is after start date
    if (rent_info.end_time <= rent_info.start_time) {
      errors.push('结束时间必须晚于开始时间')
    }
    
    // Check if lease duration is reasonable (at least 1 day)
    const durationMs = rent_info.end_time - rent_info.start_time
    const oneDayMs = 24 * 60 * 60 * 1000
    if (durationMs < oneDayMs) {
      errors.push('租赁时长至少需要1天')
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    }
  },

  // Enhanced navigation methods with validation control
  previousStep() {
    const {active} = this.data
    
    // Enhanced duplicate submission prevention for backward navigation
    if (!this.acquireOperationLock('back_navigation')) {
      return
    }
    
    // Track button clicks
    if (!this.trackButtonClick('previous')) {
      this.releaseOperationLock('back_navigation')
      return
    }
    
    // Prevent navigation during loading (but allow during processing for back navigation)
    if (this.data.loading) {
      this.releaseOperationLock('back_navigation')
      wx.showToast({
        title: '请等待当前操作完成',
        icon: 'none',
        duration: 1500
      })
      return
    }
    
    // Allow backward navigation without validation restrictions
    if (active >= 1) {
      // Set loading state for navigation
      this.setLoadingState(true, 'navigation')
      
      setTimeout(() => {
        this.setData({
          active: active - 1
        })
        
        // Update button states when navigating backward
        this.updateNavigationButtonStates()
        
        // Update step progress indicators
        this.updateStepProgressIndicators()
        this.updateStepIndicatorsWithDetails()
        
        // Clear loading state
        this.setLoadingState(false)
        this.releaseOperationLock('back_navigation')
        
        // Show feedback about backward navigation
        wx.showToast({
          title: `返回到第${active}步`,
          icon: 'none',
          duration: 1000
        })
      }, 300) // Brief loading state for smooth UX
    } else {
      this.releaseOperationLock('back_navigation')
    }
  },

  nextStep(e) {
    console.log(e)
    const {active} = this.data
    
    // Enhanced duplicate submission prevention with operation locking
    if (!this.acquireOperationLock('navigation')) {
      return
    }
    
    // Track button clicks for debugging and rate limiting
    if (!this.trackButtonClick('next')) {
      this.releaseOperationLock('navigation')
      return
    }
    
    // Comprehensive duplicate submission prevention
    if (!this.preventDuplicateSubmission('navigation')) {
      this.releaseOperationLock('navigation')
      return
    }
    
    // Set processing state to prevent duplicate submissions
    const now = Date.now()
    this.setData({
      isProcessing: true,
      lastSubmissionTime: now
    })
    
    // Disable all interactions during processing
    this.disableAllInteractions()
    
    // Set loading state based on action
    const loadingAction = active === 2 ? 'submit' : 'next'
    this.setLoadingState(true, loadingAction)
    
    // Comprehensive validation before allowing forward navigation
    const validationResult = this.validateCurrentStepForNavigation(active)
    
    if (!validationResult.canProceed) {
      // Clear loading and processing states
      this.setLoadingState(false)
      this.setData({ isProcessing: false })
      this.enableAllInteractions()
      this.releaseOperationLock('navigation')
      
      // Show validation errors and prevent navigation
      this.handleNavigationValidationFailure(active, validationResult)
      return
    }

    // Simulate processing time for better UX
    setTimeout(() => {
      // Proceed with navigation
      if (active <= 1) {
        this.setData({
          active: active + 1
        })
        
        // Update button states after navigation
        this.updateNavigationButtonStates()
        
        // Update step progress indicators
        this.updateStepProgressIndicators()
        this.updateStepIndicatorsWithDetails()
        
        // Clear loading and processing states
        this.setLoadingState(false)
        this.setData({ isProcessing: false })
        this.enableAllInteractions()
        this.releaseOperationLock('navigation')
        
        // Show success feedback for step completion
        wx.showToast({
          title: `第${active + 1}步完成，进入第${active + 2}步`,
          icon: 'success',
          duration: 1500
        })
        
        // Trigger validation for the new step to update UI
        setTimeout(() => {
          this.validateStepWithErrorDisplay(active + 1)
        }, 100)
        
      } else if (active === 2) {
        // Final step - show confirmation dialog
        this.showLeaseConfirmation()
        
        // Clear loading and processing states
        this.setLoadingState(false)
        this.setData({ isProcessing: false })
        this.enableAllInteractions()
        this.releaseOperationLock('navigation')
      }
    }, 800) // Processing simulation time
  },

  // Enhanced loading state management
  setLoadingState(isLoading, action = '') {
    this.setData({
      loading: isLoading,
      loadingAction: isLoading ? action : ''
    })
    
    // Update button states when loading state changes
    if (!isLoading) {
      this.updateNavigationButtonStates()
    }
  },

  // Enhanced duplicate submission prevention with user feedback
  preventDuplicateSubmission() {
    const {loading, isProcessing, lastSubmissionTime, submissionCooldown} = this.data
    const now = Date.now()
    
    // Check if currently processing
    if (loading || isProcessing) {
      wx.showToast({
        title: '请等待当前操作完成',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    
    // Check cooldown period
    if (now - lastSubmissionTime < submissionCooldown) {
      const remainingTime = Math.ceil((submissionCooldown - (now - lastSubmissionTime)) / 1000)
      wx.showToast({
        title: `请等待 ${remainingTime} 秒后再试`,
        icon: 'none',
        duration: 1500
      })
      return false
    }
    
    return true
  },

  // Enhanced button state management with detailed states
  updateNavigationButtonStates() {
    const {active, validation, loading, isProcessing} = this.data
    
    // Update next button state based on current step validation
    const currentStepValid = validation[`step${active}`] ? validation[`step${active}`].valid : false
    const allStepsValid = validation.step0.valid && validation.step1.valid && validation.step2.valid
    
    // Disable buttons during loading or processing
    const nextDisabled = !currentStepValid || loading || isProcessing
    const submitDisabled = !allStepsValid || loading || isProcessing
    
    this.setData({
      nextDisabled: nextDisabled,
      submitDisabled: submitDisabled
    })
    
    // Update button visual feedback
    this.updateButtonVisualFeedback(currentStepValid, allStepsValid)
  },

  // Update button visual feedback based on validation state
  updateButtonVisualFeedback(currentStepValid, allStepsValid) {
    const {active} = this.data
    
    // Store button feedback state for UI
    const buttonFeedback = {
      nextButton: {
        canProceed: currentStepValid,
        reason: currentStepValid ? '' : '请完善当前步骤信息',
        icon: currentStepValid ? 'success' : 'warning-o',
        color: currentStepValid ? '#07c160' : '#ff976a'
      },
      submitButton: {
        canProceed: allStepsValid,
        reason: allStepsValid ? '信息完整，可以提交' : '请完善所有必填信息',
        icon: allStepsValid ? 'success' : 'warning-o',
        color: allStepsValid ? '#07c160' : '#ff976a'
      }
    }
    
    this.setData({
      buttonFeedback: buttonFeedback
    })
  },

  // Comprehensive validation for navigation control
  validateCurrentStepForNavigation(stepIndex) {
    const validation = this.data.validation
    let canProceed = false
    let errors = []
    let blockingIssues = []
    let warnings = []

    // Validate the current step
    const isStepValid = this.validateStep(stepIndex)
    
    if (!isStepValid) {
      const stepErrors = validation[`step${stepIndex}`].errors || []
      
      // Categorize errors into blocking issues and warnings
      stepErrors.forEach(error => {
        if (this.isBlockingError(error.field, error.message)) {
          blockingIssues.push(error)
        } else {
          warnings.push(error)
        }
      })
      
      // Only block navigation for critical errors
      canProceed = blockingIssues.length === 0
      errors = [...blockingIssues, ...warnings]
    } else {
      canProceed = true
    }

    return {
      canProceed: canProceed,
      isValid: isStepValid,
      errors: errors,
      blockingIssues: blockingIssues,
      warnings: warnings,
      stepIndex: stepIndex
    }
  },

  // Determine if an error should block navigation
  isBlockingError(fieldName, message) {
    const blockingFields = {
      0: ['carname'], // Step 0: Vehicle name is required
      1: ['name', 'id_card_image'], // Step 1: Renter name and ID cards are required
      2: ['start_time', 'duration'] // Step 2: Start time and duration are required
    }
    
    const currentStep = this.data.active
    const stepBlockingFields = blockingFields[currentStep] || []
    
    return stepBlockingFields.includes(fieldName)
  },

  // Handle validation failure during navigation
  handleNavigationValidationFailure(stepIndex, validationResult) {
    const {blockingIssues, warnings} = validationResult
    
    if (blockingIssues.length > 0) {
      // Show blocking issues that prevent navigation
      this.showNavigationBlockedDialog(stepIndex, blockingIssues)
    } else if (warnings.length > 0) {
      // Show warnings but allow navigation with confirmation
      this.showNavigationWarningsDialog(stepIndex, warnings)
    } else {
      // Fallback: show general validation error
      this.showErrorGuidance(stepIndex)
    }
    
    // Update UI to highlight validation errors
    this.updateErrorDisplayState(stepIndex, validationResult.errors)
  },

  // Show dialog for blocking validation issues
  showNavigationBlockedDialog(stepIndex, blockingIssues) {
    const stepNames = ['车辆信息', '租车人信息', '租赁信息']
    const stepName = stepNames[stepIndex] || `第${stepIndex + 1}步`
    
    let content = `请完善${stepName}中的必填项：\n\n`
    blockingIssues.forEach((issue, index) => {
      const guidance = this.getActionableGuidance(issue.field)
      content += `${index + 1}. ${guidance}\n`
    })
    
    wx.showModal({
      title: '无法进入下一步',
      content: content,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#07c160',
      success: (res) => {
        if (res.confirm) {
          // Focus on the first error field if possible
          this.focusOnErrorField(blockingIssues[0].field)
        }
      }
    })
  },

  // Show dialog for navigation warnings (non-blocking)
  showNavigationWarningsDialog(stepIndex, warnings) {
    const stepNames = ['车辆信息', '租车人信息', '租赁信息']
    const stepName = stepNames[stepIndex] || `第${stepIndex + 1}步`
    
    let content = `${stepName}中有以下提醒：\n\n`
    warnings.forEach((warning, index) => {
      content += `${index + 1}. ${warning.message}\n`
    })
    content += '\n是否继续进入下一步？'
    
    wx.showModal({
      title: '信息提醒',
      content: content,
      confirmText: '继续',
      cancelText: '返回修改',
      confirmColor: '#07c160',
      success: (res) => {
        if (res.confirm) {
          // Allow navigation despite warnings
          this.proceedWithNavigation()
        }
        // If cancelled, stay on current step
      }
    })
  },

  // Proceed with navigation (used for warning override)
  proceedWithNavigation() {
    const {active} = this.data
    
    if (active <= 1) {
      this.setData({
        active: active + 1
      })
      
      this.updateNavigationButtonStates()
      
      wx.showToast({
        title: `进入第${active + 2}步`,
        icon: 'success',
        duration: 1500
      })
    } else if (active === 2) {
      this.showLeaseConfirmation()
    }
  },

  // Focus on error field (helper for better UX)
  focusOnErrorField(fieldName) {
    // This is a placeholder for field focusing logic
    // In a real implementation, you might scroll to the field or highlight it
    console.log(`Focusing on error field: ${fieldName}`)
    
    // Show field-specific guidance
    const guidance = this.getActionableGuidance(fieldName)
    setTimeout(() => {
      wx.showToast({
        title: guidance,
        icon: 'none',
        duration: 3000
      })
    }, 500)
  },

  // Update step progress indicators with validation status
  updateStepProgressIndicators() {
    const {active, validation, steps} = this.data
    const updatedSteps = [...steps]
    
    // Update each step's status based on validation and current position
    updatedSteps.forEach((step, index) => {
      const stepValidation = validation[`step${index}`]
      
      if (index < active) {
        // Completed steps - show validation status
        if (stepValidation && stepValidation.valid) {
          step.status = 'finish'
          step.icon = 'success'
        } else {
          step.status = 'error'
          step.icon = 'warning-o'
        }
      } else if (index === active) {
        // Current step - show current status
        if (stepValidation && stepValidation.valid) {
          step.status = 'finish'
          step.icon = 'success'
        } else {
          step.status = 'process'
          // Use original icons for current step
          const originalIcons = ['car-o', 'contact', 'calendar-o']
          step.icon = originalIcons[index]
        }
      } else {
        // Future steps - show waiting status
        step.status = 'wait'
        const originalIcons = ['car-o', 'contact', 'calendar-o']
        step.icon = originalIcons[index]
      }
    })
    
    this.setData({
      steps: updatedSteps
    })
  },

  // Update step indicators with detailed status information
  updateStepIndicatorsWithDetails() {
    const {active, validation} = this.data
    const stepDetails = []
    
    // Generate detailed status for each step
    for (let i = 0; i < 3; i++) {
      const stepValidation = validation[`step${i}`]
      const isCurrentStep = i === active
      const isCompletedStep = i < active
      const isFutureStep = i > active
      
      let status = 'wait'
      let statusText = '待完成'
      let statusColor = '#969799'
      let showValidationIcon = false
      let validationIcon = ''
      let validationColor = ''
      
      if (isCompletedStep) {
        if (stepValidation && stepValidation.valid) {
          status = 'finish'
          statusText = '已完成'
          statusColor = '#07c160'
          showValidationIcon = true
          validationIcon = 'success'
          validationColor = '#07c160'
        } else {
          status = 'error'
          statusText = '有错误'
          statusColor = '#ee0a24'
          showValidationIcon = true
          validationIcon = 'warning-o'
          validationColor = '#ee0a24'
        }
      } else if (isCurrentStep) {
        if (stepValidation && stepValidation.valid) {
          status = 'finish'
          statusText = '信息完整'
          statusColor = '#07c160'
          showValidationIcon = true
          validationIcon = 'success'
          validationColor = '#07c160'
        } else {
          status = 'process'
          statusText = '进行中'
          statusColor = '#1989fa'
          if (stepValidation && stepValidation.errors && stepValidation.errors.length > 0) {
            statusText = '待完善'
            showValidationIcon = true
            validationIcon = 'warning-o'
            validationColor = '#ff976a'
          }
        }
      } else {
        // Future step
        status = 'wait'
        statusText = '待完成'
        statusColor = '#969799'
      }
      
      stepDetails.push({
        index: i,
        status: status,
        statusText: statusText,
        statusColor: statusColor,
        showValidationIcon: showValidationIcon,
        validationIcon: validationIcon,
        validationColor: validationColor,
        isCurrentStep: isCurrentStep,
        isCompletedStep: isCompletedStep,
        isFutureStep: isFutureStep,
        errorCount: stepValidation && stepValidation.errors ? stepValidation.errors.length : 0
      })
    }
    
    this.setData({
      stepDetails: stepDetails
    })
  },

  // Provide clear visual feedback for current step
  highlightCurrentStep() {
    const {active} = this.data
    
    // Update step highlighting
    this.updateStepProgressIndicators()
    this.updateStepIndicatorsWithDetails()
    
    // Show step transition feedback
    const stepNames = ['车辆信息', '租车人信息', '租赁信息']
    const currentStepName = stepNames[active] || `第${active + 1}步`
    
    // Subtle feedback for step highlighting (don't show toast to avoid spam)
    console.log(`Current step highlighted: ${currentStepName}`)
  },
  afterCover(event) {
    if (!event.detail.file) {
      wx.showToast({ title: '请选择图片', icon: 'none' });
      return
    }
    
    // Validate file before upload
    const fileValidation = this.validateUploadFile(event.detail.file, 'cover')
    if (!fileValidation.isValid) {
      wx.showToast({
        title: fileValidation.message,
        icon: 'none',
        duration: 2500
      })
      return
    }
    
    const {car_change_field} = this.data
    var timestamp = (new Date()).valueOf();
    
    // Set uploading state with progress tracking
    this.setData({
      uploadingCover: true,
      uploadProgress: {
        cover: { uploading: true, progress: 0, status: 'uploading' }
      }
    })

    // Show upload start feedback
    wx.showToast({ 
      title: '开始上传封面图片...', 
      icon: 'loading',
      duration: 1000
    });

    // Upload with retry mechanism
    this.uploadFileWithRetry(
      event.detail.file.url,
      `img/${timestamp}.png`,
      'cover',
      0, // retry count
      (fileID) => {
        // Success callback
        const newFileList = [{url: fileID, name: '封面'}];
        car_change_field.cover_image = newFileList
        
        // Track cover image change
        this.trackVehicleChange('cover_image', this.data.cover_image, newFileList, 'add')
        
        this.setData({
          cover_image: newFileList,
          car_change_field: car_change_field,
          uploadingCover: false,
          uploadProgress: {
            cover: { uploading: false, progress: 100, status: 'success' }
          }
        });
        
        // Trigger validation with error display after upload
        this.validateStepWithErrorDisplay(0)
        
        // Clear success status after delay
        setTimeout(() => {
          this.setData({
            uploadProgress: {
              cover: { uploading: false, progress: 0, status: 'idle' }
            }
          })
        }, 2000)
      },
      (error) => {
        // Error callback
        this.setData({
          uploadingCover: false,
          uploadProgress: {
            cover: { uploading: false, progress: 0, status: 'error' }
          }
        })
        
        // Clear error status after delay
        setTimeout(() => {
          this.setData({
            uploadProgress: {
              cover: { uploading: false, progress: 0, status: 'idle' }
            }
          })
        }, 3000)
      }
    )
  },
  afterDetail(event) {
    if (!event.detail.file) {
      wx.showToast({ title: '请选择图片', icon: 'none' });
      return
    }
    
    // Validate file before upload
    const fileValidation = this.validateUploadFile(event.detail.file, 'detail')
    if (!fileValidation.isValid) {
      wx.showToast({
        title: fileValidation.message,
        icon: 'none',
        duration: 2500
      })
      return
    }
    
    console.log(event.detail.file.url)
    const {detail_image, car_change_field} = this.data
    var timestamp = (new Date()).valueOf();
    const currentIndex = detail_image.length;
    
    // Set uploading state with progress tracking
    this.setData({
      uploadingDetail: true,
      uploadProgress: {
        ...this.data.uploadProgress,
        [`detail_${currentIndex}`]: { uploading: true, progress: 0, status: 'uploading' }
      }
    })

    // Show upload start feedback
    wx.showToast({ 
      title: `正在上传第${currentIndex + 1}张详细图片...`, 
      icon: 'loading',
      duration: 1000
    });

    // Upload with retry mechanism
    this.uploadFileWithRetry(
      event.detail.file.url,
      `img/${timestamp}.png`,
      'detail',
      0, // retry count
      (fileID) => {
        // Success callback
        detail_image.push({url: fileID, name: `备注${detail_image.length+1}`});
        console.log('detail:')
        console.log(this.data.detail_image)
        car_change_field.detail_image = detail_image
        
        // Track detail image addition
        this.trackVehicleChange('detail_image', this.data.detail_image, detail_image, 'add')
        
        this.setData({
          detail_image: detail_image, 
          car_change_field: car_change_field,
          uploadingDetail: false,
          uploadProgress: {
            ...this.data.uploadProgress,
            [`detail_${currentIndex}`]: { uploading: false, progress: 100, status: 'success' }
          }
        });
        
        // Trigger validation with error display after upload
        this.validateStepWithErrorDisplay(0)
        
        // Clear success status after delay
        setTimeout(() => {
          const newProgress = {...this.data.uploadProgress}
          if (newProgress[`detail_${currentIndex}`]) {
            newProgress[`detail_${currentIndex}`].status = 'idle'
          }
          this.setData({
            uploadProgress: newProgress
          })
        }, 2000)
      },
      (error) => {
        // Error callback
        this.setData({
          uploadingDetail: false,
          uploadProgress: {
            ...this.data.uploadProgress,
            [`detail_${currentIndex}`]: { uploading: false, progress: 0, status: 'error' }
          }
        })
        
        // Clear error status after delay
        setTimeout(() => {
          const newProgress = {...this.data.uploadProgress}
          if (newProgress[`detail_${currentIndex}`]) {
            newProgress[`detail_${currentIndex}`].status = 'idle'
          }
          this.setData({
            uploadProgress: newProgress
          })
        }, 3000)
      }
    )
  },
  afterRenterDetail(event) {
    if (!event.detail.file) {
      wx.showToast({ title: '请选择图片', icon: 'none' });
      return
    }
    
    const {renter} = this.data
    const currentCount = renter.id_card_image.length;
    
    // Enforce exactly 2 photos limit - prevent upload if already have 2
    if (currentCount >= 2) {
      wx.showToast({ 
        title: '身份证照片只能上传正反两面', 
        icon: 'none',
        duration: 2000
      });
      return
    }
    
    // Validate file before upload
    console.log(event.detail)
    const fileValidation = this.validateUploadFile(event.detail.file, 'id_card')
    if (!fileValidation.isValid) {
      wx.showToast({
        title: fileValidation.message,
        icon: 'none',
        duration: 2500
      })
      return
    }
    
    console.log(event.detail.file.url)
    
    var timestamp = (new Date()).valueOf();
    
    // Set uploading state with progress tracking
    this.setData({
      uploadingIdCard: true,
      uploadProgress: {
        ...this.data.uploadProgress,
        [`id_card_${currentCount}`]: { uploading: true, progress: 0, status: 'uploading' }
      }
    })

    // Determine photo type and name based on current count
    const photoType = currentCount === 0 ? 'front' : 'back'
    const photoName = currentCount === 0 ? '身份证正面' : '身份证反面'
    const sideName = currentCount === 0 ? '正面' : '反面';
    
    // Show upload start feedback with specific side information
    wx.showToast({ 
      title: `正在上传身份证${sideName}...`, 
      icon: 'loading',
      duration: 1000
    });

    // Upload with retry mechanism
    this.uploadFileWithRetry(
      event.detail.file.url,
      `img/${timestamp}.png`,
      'id_card',
      0, // retry count
      (fileID) => {
        // Success callback
        renter.id_card_image.push({
          url: fileID, 
          name: photoName,
          type: photoType
        });
        
        this.setData({
          renter: renter,
          uploadingIdCard: false,
          uploadProgress: {
            ...this.data.uploadProgress,
            [`id_card_${currentCount}`]: { uploading: false, progress: 100, status: 'success' }
          }
        });
        
        // Show completion message when both photos are uploaded
        if (renter.id_card_image.length === 2) {
          setTimeout(() => {
            wx.showToast({
              title: '身份证正反两面已上传完成',
              icon: 'success',
              duration: 2000
            })
          }, 500)
        }
        
        // Trigger validation with error display after upload
        this.validateStepWithErrorDisplay(1)
        
        // Clear success status after delay
        setTimeout(() => {
          const newProgress = {...this.data.uploadProgress}
          if (newProgress[`id_card_${currentCount}`]) {
            newProgress[`id_card_${currentCount}`].status = 'idle'
          }
          this.setData({
            uploadProgress: newProgress
          })
        }, 2000)
      },
      (error) => {
        // Error callback
        this.setData({
          uploadingIdCard: false,
          uploadProgress: {
            ...this.data.uploadProgress,
            [`id_card_${currentCount}`]: { uploading: false, progress: 0, status: 'error' }
          }
        })
        
        // Clear error status after delay
        setTimeout(() => {
          const newProgress = {...this.data.uploadProgress}
          if (newProgress[`id_card_${currentCount}`]) {
            newProgress[`id_card_${currentCount}`].status = 'idle'
          }
          this.setData({
            uploadProgress: newProgress
          })
        }, 3000)
      }
    )
  },

  deleteRenterDetail(event) {
    const {renter} = this.data
    const index = event.detail.index
    const deletedPhoto = renter.id_card_image[index]
    const detailUrl = [deletedPhoto.url]
    
    // Show feedback about which photo is being deleted
    wx.showToast({
      title: `删除${deletedPhoto.name}`,
      icon: 'none',
      duration: 1500
    })
    
    // Remove the photo from the array
    renter.id_card_image = renter.id_card_image.filter((_, i) => i !== index)
    
    // Update photo types after deletion to maintain front/back order
    // If we have 1 photo left after deletion, it should be marked as 'front'
    if (renter.id_card_image.length === 1) {
      renter.id_card_image[0].type = 'front'
      renter.id_card_image[0].name = '身份证正面'
    }
    
    this.setData({
      renter: renter
    })
    
    // Delete from cloud storage
    wx.cloud.deleteFile({
      fileList: detailUrl,
      success: res => {
        console.log('ID card photo deleted:', res.fileList)
      },
      fail: console.error
    })
    
    // Trigger validation with error display after deletion
    this.validateStepWithErrorDisplay(1)
  },

  // Enhanced method for deleting specific ID card photos from separate upload areas
  deleteSpecificIdCard(event) {
    const index = event.currentTarget.dataset.index
    const {renter} = this.data
    
    if (!renter.id_card_image[index]) {
      wx.showToast({
        title: '照片不存在',
        icon: 'none',
        duration: 1500
      })
      return
    }
    
    const deletedPhoto = renter.id_card_image[index]
    const detailUrl = [deletedPhoto.url]
    
    // Show confirmation dialog for deletion
    wx.showModal({
      title: '确认删除',
      content: `确定要删除${deletedPhoto.name}吗？`,
      confirmText: '删除',
      confirmColor: '#ee0a24',
      success: (res) => {
        if (res.confirm) {
          // Show feedback about which photo is being deleted
          wx.showToast({
            title: `正在删除${deletedPhoto.name}`,
            icon: 'loading',
            duration: 1000
          })
          
          // Remove the photo from the array
          renter.id_card_image = renter.id_card_image.filter((_, i) => i !== index)
          
          // Update photo types after deletion to maintain front/back order
          // If we have 1 photo left after deletion, it should be marked as 'front'
          if (renter.id_card_image.length === 1) {
            renter.id_card_image[0].type = 'front'
            renter.id_card_image[0].name = '身份证正面'
          }
          
          this.setData({
            renter: renter
          })
          
          // Delete from cloud storage
          wx.cloud.deleteFile({
            fileList: detailUrl,
            success: res => {
              console.log('ID card photo deleted:', res.fileList)
              wx.showToast({
                title: `${deletedPhoto.name}已删除`,
                icon: 'success',
                duration: 1500
              })
            },
            fail: (error) => {
              console.error('Failed to delete from cloud:', error)
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none',
                duration: 2000
              })
            }
          })
          
          // Trigger validation with error display after deletion
          this.validateStepWithErrorDisplay(1)
        }
      }
    })
  },
  deleteCover(index) {
    const {cover_image, car_change_field} = this.data
    const coverUrl = cover_image.map(item => item.url);
    
    // Track cover image removal
    this.trackVehicleChange('cover_image', cover_image, [], 'remove')
    
    wx.cloud.deleteFile({
      fileList: coverUrl,
      success: res => {
        console.log(res.fileList)
      },
      fail: console.error
    })
    car_change_field.cover_image = []
    this.setData({
      cover_image: [],
      car_change_field: car_change_field
    })
    // Trigger validation with error display after deletion
    this.validateStepWithErrorDisplay(0)
  },
  deleteDetail(event) {
    const {detail_image, car_change_field} = this.data
    const oldDetailImages = [...detail_image]
    const remaing_detail_image = detail_image.filter((_, i) => i !== event.detail.index)
    
    // Track detail image removal
    this.trackVehicleChange('detail_image', oldDetailImages, remaing_detail_image, 'remove')
    
    car_change_field.detail_image = remaing_detail_image
    this.setData({
      detail_image: remaing_detail_image,
      car_change_field: car_change_field
    })
    const deleteFileList = []
    deleteFileList.push(detail_image[event.detail.index].url)
    wx.cloud.deleteFile({
      fileList: deleteFileList,
      success: res => {
        console.log('detail:')
        console.log(this.data.detail_image)
      },
      fail: console.error
    })
    // Trigger validation with error display after deletion
    this.validateStepWithErrorDisplay(0)
  },
  recordCarName(e) {
    const {car, car_change_field, changeTracking} = this.data
    const text = e.detail.value
    const oldValue = car.carname
    
    // Update car name
    car.carname = text
    if (car.carname !== text) {
      car_change_field.carname = text
    }
    
    this.setData({
      car: car,
      car_change_field: car_change_field
    })
    
    // Track the change
    if (oldValue !== text) {
      this.trackVehicleChange('carname', oldValue, text, 'modify')
    }
    
    // Real-time validation with error display
    this.validateStepWithErrorDisplay(0)
    this.showFieldValidationFeedback('carname', text)
  },

  // Real-time validation for vehicle name on input (not just blur)
  onCarNameInput(e) {
    const {car, car_change_field} = this.data
    const text = e.detail.value
    const oldValue = car.carname
    
    // Update car name immediately on input
    car.carname = text
    if (car.carname !== text) {
      car_change_field.carname = text
    }
    
    this.setData({
      car: car,
      car_change_field: car_change_field
    })
    
    // Track the change (throttled to avoid too many change events)
    if (oldValue !== text) {
      clearTimeout(this.carnameChangeTimeout)
      this.carnameChangeTimeout = setTimeout(() => {
        this.trackVehicleChange('carname', oldValue, text, 'modify')
      }, 500)
    }
    
    // Real-time validation with immediate feedback
    this.validateStepWithErrorDisplay(0)
    this.showFieldValidationFeedback('carname', text)
  },
  
  recordMark(e) {
    const {car, car_change_field} = this.data
    const text = e.detail.value
    const oldValue = car.mark
    
    // Update car mark/notes
    car.mark = text
    if (car.mark !== text) {
      car_change_field.mark = text
    }
    
    this.setData({
      car: car,
      car_change_field: car_change_field
    })
    
    // Track the change
    if (oldValue !== text) {
      this.trackVehicleChange('mark', oldValue, text, 'modify')
    }
    
    // Real-time validation with error display
    this.validateStepWithErrorDisplay(0)
    this.showFieldValidationFeedback('mark', text)
  },

  // Real-time validation for vehicle mark/notes on input
  onCarMarkInput(e) {
    const {car, car_change_field} = this.data
    const text = e.detail.value
    const oldValue = car.mark
    
    // Update car mark immediately on input
    car.mark = text
    if (car.mark !== text) {
      car_change_field.mark = text
    }
    
    this.setData({
      car: car,
      car_change_field: car_change_field
    })
    
    // Track the change (throttled to avoid too many change events)
    if (oldValue !== text) {
      clearTimeout(this.carmarkChangeTimeout)
      this.carmarkChangeTimeout = setTimeout(() => {
        this.trackVehicleChange('mark', oldValue, text, 'modify')
      }, 500)
    }
    
    // Real-time validation with immediate feedback
    this.validateStepWithErrorDisplay(0)
    this.showFieldValidationFeedback('mark', text)
  },

  onRenterNameChange(e) {
    const {renter} = this.data
    const text = e.detail.value
    
    renter.name = text
    this.setData({
      renter: renter
    })
    
    // Real-time validation with error display
    this.validateStepWithErrorDisplay(1)
    this.showFieldValidationFeedback('renter_name', text)
  },

  // Real-time validation for renter name on input (immediate feedback)
  onRenterNameInput(e) {
    const {renter} = this.data
    const text = e.detail.value
    
    // Update renter name immediately on input
    renter.name = text
    this.setData({
      renter: renter
    })
    
    // Real-time validation with immediate feedback
    this.validateStepWithErrorDisplay(1)
    this.showFieldValidationFeedback('renter_name', text)
  },

  // Enhanced real-time validation feedback for individual fields
  showFieldValidationFeedback(fieldName, value) {
    let isValid = true
    let message = ''
    let guidance = ''

    switch(fieldName) {
      case 'carname':
        if (!value || value.trim() === '') {
          isValid = false
          message = '请输入车辆名称'
          guidance = '车辆名称不能为空'
        } else if (value.trim().length < 2) {
          isValid = false
          message = '车辆名称至少需要2个字符'
          guidance = '请输入更详细的车辆名称'
        } else if (value.trim().length > 50) {
          isValid = false
          message = '车辆名称不能超过50个字符'
          guidance = '请简化车辆名称'
        } else {
          isValid = true
          message = '车辆名称格式正确'
          guidance = ''
        }
        break
        
      case 'mark':
        if (value && value.trim().length > 100) {
          isValid = false
          message = '车辆备注不能超过100个字符'
          guidance = '请简化备注内容'
        } else {
          isValid = true
          message = value && value.trim() ? '备注格式正确' : ''
          guidance = ''
        }
        break
        
      case 'renter_name':
        if (!value || value.trim() === '') {
          isValid = false
          message = '请输入租车人姓名'
          guidance = '租车人姓名不能为空'
        } else if (value.trim().length < 2) {
          isValid = false
          message = '租车人姓名至少需要2个字符'
          guidance = '请输入完整的真实姓名'
        } else if (value.trim().length > 20) {
          isValid = false
          message = '租车人姓名不能超过20个字符'
          guidance = '请输入简化的姓名'
        } else {
          isValid = true
          message = '姓名格式正确'
          guidance = ''
        }
        break
        
      case 'start_time':
        if (value === 'past') {
          isValid = false
          message = '开始时间不能是过去时间'
          guidance = '请选择当前时间之后的时间'
        } else if (value === 'soon') {
          isValid = true // Warning but not blocking
          message = '开始时间较近，建议提前预约'
          guidance = '建议至少提前1小时预约'
        } else if (value === 'too_far') {
          isValid = false
          message = '开始时间不能超过一年后'
          guidance = '请选择一年内的开始时间'
        } else if (value === 'valid') {
          isValid = true
          message = '开始时间设置正确'
          guidance = ''
        }
        break
        
      case 'duration':
        if (value === 'zero' || value === '') {
          isValid = false
          message = '请选择有效的租赁时长'
          guidance = '租赁时长不能为零'
        } else if (value === 'too_short') {
          isValid = false
          message = '租赁时长至少需要1天'
          guidance = '请选择至少1天的租赁期限'
        } else if (value === 'too_long') {
          isValid = false
          message = '租赁时长不能超过3年'
          guidance = '请调整为3年以内的租赁期限'
        } else if (value === 'exceeds_max') {
          isValid = false
          message = '结束时间超出允许范围'
          guidance = '请缩短租赁时长或调整开始时间'
        } else if (value === 'valid') {
          isValid = true
          message = '租赁时长设置正确'
          guidance = ''
        } else if (value && value !== '') {
          isValid = true
          message = '租赁时长设置正确'
          guidance = ''
        }
        break
    }

    // Store field-specific validation state for UI feedback
    const fieldValidation = this.data.fieldValidation || {}
    fieldValidation[fieldName] = { 
      valid: isValid, 
      message: message,
      guidance: guidance
    }
    
    this.setData({
      fieldValidation: fieldValidation
    })

    // Provide immediate visual feedback for critical errors
    if (!isValid && (fieldName === 'start_time' || fieldName === 'duration')) {
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 1500
      })
    }

    // Update error display state for this field
    this.updateFieldErrorDisplay(fieldName, isValid, message)
  },

  // Update error display for individual fields
  updateFieldErrorDisplay(fieldName, isValid, message) {
    // Determine which step this field belongs to
    let stepIndex = 0
    if (fieldName === 'renter_name' || fieldName === 'id_card_image') {
      stepIndex = 1
    } else if (fieldName === 'start_time' || fieldName === 'duration' || fieldName === 'end_time') {
      stepIndex = 2
    }

    const errorDisplay = this.data.errorDisplay || {}
    if (!errorDisplay[`step${stepIndex}`]) {
      errorDisplay[`step${stepIndex}`] = {}
    }

    // Map field names to error display field names
    const fieldMapping = {
      'carname': 'carname',
      'mark': 'mark', 
      'renter_name': 'name',
      'start_time': 'start_time',
      'duration': 'duration',
      'end_time': 'end_time'
    }

    const mappedFieldName = fieldMapping[fieldName] || fieldName

    errorDisplay[`step${stepIndex}`][mappedFieldName] = {
      hasError: !isValid,
      message: isValid ? '' : message
    }

    this.setData({
      errorDisplay: errorDisplay
    })
  },

  // Enhanced validation methods
  validateStep(stepIndex) {
    const validation = this.data.validation
    let isValid = false
    let errors = []

    switch(stepIndex) {
      case 0:
        // Validate vehicle information (step 0)
        if (!this.data.car.carname || this.data.car.carname.trim() === '') {
          errors.push({ field: 'carname', message: '请输入车辆名称' })
        }
        
        // Vehicle name should not be too short or contain only spaces
        if (this.data.car.carname && this.data.car.carname.trim().length < 2) {
          errors.push({ field: 'carname', message: '车辆名称至少需要2个字符' })
        }
        
        // Optional: Validate vehicle mark/notes if provided
        if (this.data.car.mark && this.data.car.mark.trim().length > 100) {
          errors.push({ field: 'mark', message: '车辆备注不能超过100个字符' })
        }
        
        isValid = errors.length === 0
        validation.step0 = { valid: isValid, errors: errors }
        break

      case 1:
        // Validate renter information (step 1)
        if (!this.data.renter.name || this.data.renter.name.trim() === '') {
          errors.push({ field: 'name', message: '请输入租车人姓名' })
        }
        
        // Renter name should be reasonable length
        if (this.data.renter.name && this.data.renter.name.trim().length < 2) {
          errors.push({ field: 'name', message: '租车人姓名至少需要2个字符' })
        }
        
        if (this.data.renter.name && this.data.renter.name.trim().length > 20) {
          errors.push({ field: 'name', message: '租车人姓名不能超过20个字符' })
        }
        
        // Enhanced ID card photo validation - exactly 2 photos required
        const idCardCount = this.data.renter.id_card_image ? this.data.renter.id_card_image.length : 0
        
        if (idCardCount === 0) {
          errors.push({ field: 'id_card_image', message: '请上传身份证正反两面照片' })
        } else if (idCardCount === 1) {
          // Check if we have front or back, provide specific guidance
          const hasfront = this.data.renter.id_card_image.some(img => img.type === 'front')
          const hasBack = this.data.renter.id_card_image.some(img => img.type === 'back')
          
          if (hasfront && !hasBack) {
            errors.push({ field: 'id_card_image', message: '请上传身份证反面照片' })
          } else if (hasBack && !hasfront) {
            errors.push({ field: 'id_card_image', message: '请上传身份证正面照片' })
          } else {
            errors.push({ field: 'id_card_image', message: '请上传身份证反面照片' })
          }
        } else if (idCardCount > 2) {
          errors.push({ field: 'id_card_image', message: '身份证照片只能上传正反两面，请删除多余照片' })
        }
        // If exactly 2 photos, validate they are front and back
        else if (idCardCount === 2) {
          const hasfront = this.data.renter.id_card_image.some(img => img.type === 'front')
          const hasBack = this.data.renter.id_card_image.some(img => img.type === 'back')
          
          if (!hasfront || !hasBack) {
            errors.push({ field: 'id_card_image', message: '请确保上传身份证正面和反面各一张' })
          }
        }
        
        isValid = errors.length === 0
        validation.step1 = { valid: isValid, errors: errors }
        break

      case 2:
        // Validate lease information (step 2) with comprehensive validation
        const now = new Date().getTime()
        const startTime = this.data.rent_info.start_time
        
        // Validate start date using comprehensive validation
        if (!startTime) {
          errors.push({ field: 'start_time', message: '请选择租赁开始时间' })
        } else {
          const startValidation = this.validateStartDate(startTime)
          if (!startValidation.isValid) {
            errors.push({ field: 'start_time', message: startValidation.message })
          }
        }
        
        // Validate lease duration using comprehensive validation
        const durationTime = this.data.rent_info.duration_picker_time
        if (!durationTime || durationTime === '') {
          errors.push({ field: 'duration', message: '请选择租赁时长' })
        } else if (durationTime === '0年0月0日') {
          errors.push({ field: 'duration', message: '租赁时长不能为零' })
        } else {
          // Parse duration and validate
          const durationMatch = durationTime.match(/(\d+)年(\d+)月(\d+)日/)
          if (durationMatch) {
            const years = parseInt(durationMatch[1])
            const months = parseInt(durationMatch[2])
            const days = parseInt(durationMatch[3])
            const durationValidation = this.validateDuration([years, months, days])
            
            if (!durationValidation.isValid) {
              errors.push({ field: 'duration', message: durationValidation.message })
            }
          }
        }
        
        // Validate end time is calculated and reasonable
        if (!this.data.rent_info.end_time) {
          errors.push({ field: 'end_time', message: '请重新选择租赁时长以计算结束时间' })
        } else {
          // Validate date combination
          const combinationValidation = this.validateDateCombination()
          if (!combinationValidation.isValid) {
            combinationValidation.errors.forEach(error => {
              errors.push({ field: 'end_time', message: error })
            })
          }
        }
        
        isValid = errors.length === 0
        validation.step2 = { valid: isValid, errors: errors }
        break
    }

    // Update validation state
    this.setData({
      validation: validation
    })

    // Update navigation button states after validation
    this.updateNavigationButtonStates()
    
    // Update step progress indicators in real-time
    this.updateStepProgressIndicators()
    this.updateStepIndicatorsWithDetails()

    return isValid
  },

  updateValidationState() {
    // Validate all steps and update overall state
    this.validateStep(0)
    this.validateStep(1)
    this.validateStep(2)
  },

  canNavigateNext() {
    const currentStep = this.data.active
    return this.validateStep(currentStep)
  },

  showValidationErrors(stepIndex) {
    const errors = this.data.validation[`step${stepIndex}`].errors
    if (errors.length > 0) {
      // Show the first error as a toast for immediate feedback
      const firstError = errors[0]
      wx.showToast({
        title: firstError.message,
        icon: 'none',
        duration: 3000
      })
      
      // Update UI to show all field-specific errors
      this.updateErrorDisplayState(stepIndex, errors)
    }
  },

  // Provide clear guidance for error correction with actionable steps
  showErrorGuidance(stepIndex) {
    const errors = this.data.validation[`step${stepIndex}`].errors
    if (errors.length === 0) return
    
    let guidance = '请完善以下信息：\n\n'
    errors.forEach((error, index) => {
      const actionableGuidance = this.getActionableGuidance(error.field)
      guidance += `${index + 1}. ${actionableGuidance}\n`
    })
    
    wx.showModal({
      title: '信息不完整',
      content: guidance,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#07c160'
    })
  },

  // Provide actionable guidance for each field
  getActionableGuidance(fieldName) {
    const guidanceMap = {
      'carname': '请在"车名"字段输入车辆名称，至少2个字符',
      'mark': '车辆备注字数过多，请控制在100字以内',
      'name': '请在"姓名"字段输入租车人真实姓名，2-20个字符',
      'id_card_image': '请点击上传按钮，上传身份证正面和反面照片各一张',
      'start_time': '请点击"租聘起始时间"选择未来的开始时间',
      'duration': '请点击"租聘时长"选择有效的租赁期限',
      'end_time': '请重新选择租赁时长，系统将自动计算结束时间'
    }
    
    return guidanceMap[fieldName] || '请检查并完善此项信息'
  },

  // Provide clear guidance for error correction
  showErrorGuidance(stepIndex) {
    const errors = this.data.validation[`step${stepIndex}`].errors
    if (errors.length === 0) return
    
    let guidance = '请完善以下信息：\n'
    errors.forEach((error, index) => {
      guidance += `${index + 1}. ${error.message}\n`
    })
    
    wx.showModal({
      title: '信息不完整',
      content: guidance,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // Enhanced confirmation data preparation with comprehensive formatting
  prepareConfirmationData() {
    const vehicleChanges = this.getVehicleChangesSummary()
    const leaseDetails = this.calculateLeaseDetails()
    
    const confirmationData = {
      vehicle: {
        name: this.data.car.carname || '未设置',
        mark: this.data.car.mark || '无备注',
        cover_image: this.data.cover_image || [],
        detail_image: this.data.detail_image || [],
        changes: this.data.car_change_field || {},
        hasChanges: this.data.changeTracking?.vehicle?.hasChanges || false,
        changesSummary: vehicleChanges,
        changeHistory: this.data.changeTracking?.vehicle?.changeHistory || [],
        // Enhanced display formatting
        coverImageCount: (this.data.cover_image || []).length,
        detailImageCount: (this.data.detail_image || []).length,
        displayName: this.formatVehicleDisplayName(),
        displayMark: this.formatVehicleDisplayMark()
      },
      renter: {
        name: this.data.renter.name || '未填写',
        id_card_image: this.data.renter.id_card_image || [],
        id_card_count: (this.data.renter.id_card_image || []).length,
        id_card_status: this.formatIdCardStatus(),
        // Enhanced display formatting
        displayName: this.formatRenterDisplayName(),
        verificationStatus: this.getRenterVerificationStatus(),
        hasValidIdCards: this.validateIdCardCompleteness()
      },
      lease: {
        start_time: this.data.rent_info.start_format_time || '未选择',
        duration: this.data.rent_info.duration_picker_time || '未选择',
        end_time: this.data.rent_info.timeout || '未计算',
        // Enhanced lease details
        totalDays: leaseDetails.totalDays,
        isValidDateRange: leaseDetails.isValid,
        displayStartTime: this.formatDisplayDateTime(this.data.rent_info.start_time),
        displayEndTime: this.formatDisplayDateTime(this.data.rent_info.end_time),
        displayDuration: this.formatDisplayDuration(),
        leaseStatus: this.getLeaseValidationStatus()
      },
      // Overall validation status
      validation: {
        allValid: this.isAllDataValid(),
        vehicleValid: this.data.validation?.step0?.valid || false,
        renterValid: this.data.validation?.step1?.valid || false,
        leaseValid: this.data.validation?.step2?.valid || false,
        errorCount: this.getTotalErrorCount(),
        warningCount: this.getTotalWarningCount()
      },
      // Metadata for display
      metadata: {
        preparationTime: new Date().getTime(),
        preparationTimeFormatted: this.formatDate(new Date().getTime()),
        totalSteps: 3,
        completedSteps: this.getCompletedStepsCount()
      }
    }

    // Store confirmation data for dialog display
    this.setData({
      confirmationData: confirmationData
    })

    // Log confirmation data for debugging
    console.log('Confirmation data prepared:', confirmationData)

    return confirmationData
  },

  // Helper method to format vehicle display name
  formatVehicleDisplayName() {
    const name = this.data.car.carname
    if (!name || name.trim() === '') {
      return '未设置车辆名称'
    }
    return name.trim()
  },

  // Helper method to format vehicle display mark
  formatVehicleDisplayMark() {
    const mark = this.data.car.mark
    if (!mark || mark.trim() === '') {
      return '无备注信息'
    }
    return mark.trim()
  },

  // Helper method to format renter display name
  formatRenterDisplayName() {
    const name = this.data.renter.name
    if (!name || name.trim() === '') {
      return '未填写姓名'
    }
    return name.trim()
  },

  // Enhanced ID card status formatting
  formatIdCardStatus() {
    const count = (this.data.renter.id_card_image || []).length
    
    switch(count) {
      case 0:
        return '未上传身份证照片'
      case 1:
        return '已上传1张，还需1张'
      case 2:
        return '已上传正反两面'
      default:
        return `已上传${count}张（超出要求）`
    }
  },

  // Get renter verification status
  getRenterVerificationStatus() {
    const count = (this.data.renter.id_card_image || []).length
    const hasName = this.data.renter.name && this.data.renter.name.trim() !== ''
    
    if (hasName && count === 2) {
      return {
        status: 'complete',
        message: '信息完整',
        color: '#07c160',
        icon: 'success'
      }
    } else if (hasName || count > 0) {
      return {
        status: 'partial',
        message: '信息不完整',
        color: '#ff976a',
        icon: 'warning-o'
      }
    } else {
      return {
        status: 'empty',
        message: '未填写信息',
        color: '#ee0a24',
        icon: 'close'
      }
    }
  },

  // Validate ID card completeness
  validateIdCardCompleteness() {
    const idCards = this.data.renter.id_card_image || []
    if (idCards.length !== 2) return false
    
    // Check if we have both front and back
    const hasFront = idCards.some(card => card.type === 'front')
    const hasBack = idCards.some(card => card.type === 'back')
    
    return hasFront && hasBack
  },

  // Calculate comprehensive lease details
  calculateLeaseDetails() {
    const {rent_info} = this.data
    
    if (!rent_info.start_time || !rent_info.end_time) {
      return {
        totalDays: 0,
        isValid: false,
        error: 'Missing start or end time'
      }
    }
    
    const startTime = new Date(rent_info.start_time)
    const endTime = new Date(rent_info.end_time)
    const diffTime = endTime.getTime() - startTime.getTime()
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return {
      totalDays: totalDays,
      isValid: totalDays > 0,
      startDate: startTime,
      endDate: endTime,
      durationMs: diffTime,
      error: totalDays <= 0 ? 'Invalid date range' : null
    }
  },

  // Format display date and time
  formatDisplayDateTime(timestamp) {
    if (!timestamp) return '未设置'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    let relativeText = ''
    if (diffDays === 0) {
      relativeText = '（今天）'
    } else if (diffDays === 1) {
      relativeText = '（明天）'
    } else if (diffDays > 1 && diffDays <= 7) {
      relativeText = `（${diffDays}天后）`
    } else if (diffDays > 7) {
      relativeText = `（${Math.ceil(diffDays / 7)}周后）`
    } else if (diffDays < 0) {
      relativeText = '（已过期）'
    }
    
    return this.formatDate(timestamp) + ' ' + relativeText
  },

  // Format display duration
  formatDisplayDuration() {
    const duration = this.data.rent_info.duration_picker_time
    if (!duration || duration === '') {
      return '未选择时长'
    }
    
    // Parse duration and add additional context
    const match = duration.match(/(\d+)年(\d+)月(\d+)日/)
    if (match) {
      const years = parseInt(match[1])
      const months = parseInt(match[2])
      const days = parseInt(match[3])
      
      let displayText = duration
      let contextText = ''
      
      // Add context based on duration length
      const totalDays = (years * 365) + (months * 30) + days
      if (totalDays <= 7) {
        contextText = '（短期租赁）'
      } else if (totalDays <= 30) {
        contextText = '（月租）'
      } else if (totalDays <= 365) {
        contextText = '（长期租赁）'
      } else {
        contextText = '（超长期租赁）'
      }
      
      return displayText + ' ' + contextText
    }
    
    return duration
  },

  // Get lease validation status
  getLeaseValidationStatus() {
    const {rent_info} = this.data
    
    if (!rent_info.start_time) {
      return {
        status: 'incomplete',
        message: '未选择开始时间',
        color: '#ee0a24',
        icon: 'close'
      }
    }
    
    if (!rent_info.duration_picker_time) {
      return {
        status: 'incomplete',
        message: '未选择租赁时长',
        color: '#ee0a24',
        icon: 'close'
      }
    }
    
    if (!rent_info.end_time) {
      return {
        status: 'error',
        message: '结束时间计算失败',
        color: '#ee0a24',
        icon: 'warning-o'
      }
    }
    
    // Validate date range
    const now = new Date().getTime()
    if (rent_info.start_time <= now) {
      return {
        status: 'warning',
        message: '开始时间已过期',
        color: '#ff976a',
        icon: 'warning-o'
      }
    }
    
    if (rent_info.end_time <= rent_info.start_time) {
      return {
        status: 'error',
        message: '日期范围无效',
        color: '#ee0a24',
        icon: 'close'
      }
    }
    
    return {
      status: 'complete',
      message: '租赁信息完整',
      color: '#07c160',
      icon: 'success'
    }
  },

  // Check if all data is valid for submission
  isAllDataValid() {
    const {validation} = this.data
    return validation?.step0?.valid && validation?.step1?.valid && validation?.step2?.valid
  },

  // Get total error count across all steps
  getTotalErrorCount() {
    const {validation} = this.data
    let totalErrors = 0
    
    if (validation?.step0?.errors) totalErrors += validation.step0.errors.length
    if (validation?.step1?.errors) totalErrors += validation.step1.errors.length
    if (validation?.step2?.errors) totalErrors += validation.step2.errors.length
    
    return totalErrors
  },

  // Get total warning count (for future use)
  getTotalWarningCount() {
    // This could be enhanced to track warnings separately from errors
    return 0
  },

  // Get count of completed steps
  getCompletedStepsCount() {
    const {validation} = this.data
    let completedSteps = 0
    
    if (validation?.step0?.valid) completedSteps++
    if (validation?.step1?.valid) completedSteps++
    if (validation?.step2?.valid) completedSteps++
    
    return completedSteps
  },

  // Enhanced method to show lease confirmation dialog
  showLeaseConfirmation() {
    // Prevent duplicate confirmation dialogs
    if (!this.preventDuplicateSubmission()) {
      return
    }
    
    // Set loading state for validation
    this.setLoadingState(true, 'validation')
    
    // Show loading feedback
    wx.showLoading({
      title: '正在验证信息...',
      mask: true
    })
    
    // Validate all steps before showing confirmation
    setTimeout(() => {
      this.updateValidationState()
      const {validation} = this.data
      
      // Hide loading
      wx.hideLoading()
      this.setLoadingState(false)
      
      // Check if all steps are valid
      if (!validation.step0.valid || !validation.step1.valid || !validation.step2.valid) {
        // Show detailed validation errors
        this.showValidationErrorsDialog()
        return
      }

      // Prepare comprehensive confirmation data
      const confirmationData = this.prepareConfirmationData()
      
      // Additional validation checks
      const finalValidation = this.performFinalValidation(confirmationData)
      if (!finalValidation.canProceed) {
        this.showFinalValidationErrors(finalValidation.errors)
        return
      }
      
      // Show confirmation dialog with prepared data
      this.setData({
        showConfirmDialog: true
      })
      
      // Show success feedback for validation completion
      wx.showToast({
        title: '信息验证完成',
        icon: 'success',
        duration: 1500
      })
      
      // Log confirmation display
      console.log('Lease confirmation dialog displayed with data:', confirmationData)
      
    }, 800) // Brief validation time for better UX
  },

  // Enhanced method to hide confirmation dialog
  hideConfirmDialog() {
    // Show cancellation feedback
    wx.showToast({
      title: '已取消确认',
      icon: 'none',
      duration: 1500
    })
    
    // Hide dialog and reset states
    this.setData({
      showConfirmDialog: false,
      isProcessing: false // Reset processing state when dialog is cancelled
    })
    
    // Log cancellation
    console.log('Lease confirmation dialog cancelled by user')
  },

  // Enhanced method to confirm lease creation
  confirmLeaseCreation() {
    // Enhanced duplicate submission prevention with operation locking
    if (!this.acquireOperationLock('lease_creation')) {
      return
    }
    
    // Track button clicks
    if (!this.trackButtonClick('confirm')) {
      this.releaseOperationLock('lease_creation')
      return
    }
    
    // Comprehensive duplicate submission prevention
    if (!this.preventDuplicateSubmission('lease_creation')) {
      this.releaseOperationLock('lease_creation')
      return
    }
    
    // Set processing state
    const now = Date.now()
    this.setData({
      isProcessing: true,
      lastSubmissionTime: now,
      hasPendingOperations: true,
      pendingOperationType: 'lease_creation'
    })
    
    // Disable all interactions during processing
    this.disableAllInteractions()
    
    // Set loading state for submission
    this.setLoadingState(true, 'submit')
    
    // Hide dialog immediately to show processing
    this.setData({
      showConfirmDialog: false
    })
    
    // Show processing feedback
    wx.showLoading({
      title: '正在创建租赁记录...',
      mask: true
    })
    
    // Log confirmation start
    console.log('Lease creation confirmed, starting processing...')
    
    // Perform comprehensive lease creation
    this.performLeaseCreation()
  },

  // Comprehensive lease creation method with network error handling
  performLeaseCreation() {
    // Check network connectivity before starting
    this.checkNetworkConnectivity().then((isConnected) => {
      if (!isConnected) {
        this.handleLeaseCreationError('network_error', { 
          errMsg: 'Network not available',
          errCode: -1 
        })
        return
      }
      
      // Proceed with lease creation
      this.executeLeaseCreation()
    }).catch((error) => {
      console.error('Network check failed:', error)
      // Proceed anyway but with network warning
      this.executeLeaseCreation()
    })
  },

  // Execute the actual lease creation with retry mechanism
  executeLeaseCreation(retryCount = 0) {
    const maxRetries = 3
    const db = wx.cloud.database()
    const {car, renter, rent_info, cover_image, detail_image} = this.data
    
    // Prepare rent record data with all form information
    const rentRecord = {
      // Vehicle information
      car_id: car._id,
      car_name: car.carname,
      car_mark: car.mark || '',
      car_cover_image: cover_image.length > 0 ? cover_image[0] : null,
      car_detail_images: detail_image || [],
      
      // Renter information
      renter_name: renter.name,
      renter_id_card_images: renter.id_card_image || [],
      
      // Lease information
      start_time: rent_info.start_time,
      start_format_time: rent_info.start_format_time,
      duration: rent_info.duration_picker_time,
      end_time: rent_info.end_time,
      end_format_time: rent_info.timeout,
      
      // Status and metadata
      status: 0, // 0 = active lease
      create_time: new Date().getTime(),
      create_format_time: this.formatDate(new Date().getTime()),
      
      // Additional tracking information
      total_days: this.calculateLeaseDetails().totalDays,
      lease_type: this.determineLeaseDuration(),
      
      // Change tracking (if vehicle was modified)
      vehicle_changes: this.data.changeTracking?.vehicle?.hasChanges ? 
        this.data.changeTracking.vehicle.changes : {},
      has_vehicle_changes: this.data.changeTracking?.vehicle?.hasChanges || false,
      
      // Retry tracking
      retry_count: retryCount,
      creation_attempts: retryCount + 1
    }
    
    console.log('Creating rent record (attempt ' + (retryCount + 1) + '):', rentRecord)
    
    // Step 1: Create rent record with timeout and retry logic
    const createPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Database operation timeout'))
      }, 15000) // 15 second timeout
      
      db.collection('rent').add({
        data: rentRecord,
        success: (rentResult) => {
          clearTimeout(timeoutId)
          resolve(rentResult)
        },
        fail: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        }
      })
    })
    
    createPromise.then((rentResult) => {
      console.log('Rent record created successfully:', rentResult)
      
      // Step 2: Update vehicle status to rented (status = 1)
      this.updateVehicleStatusWithRetry(car._id, rentResult._id, 0)
      
    }).catch((error) => {
      console.error('Failed to create rent record:', error)
      
      // Check if this is a network-related error that should be retried
      if (this.isRetryableNetworkError(error) && retryCount < maxRetries) {
        console.log(`Retrying lease creation (${retryCount + 1}/${maxRetries})...`)
        
        // Show retry feedback to user
        wx.showToast({
          title: `网络不稳定，正在重试 (${retryCount + 1}/${maxRetries})`,
          icon: 'loading',
          duration: 2000
        })
        
        // Retry after a delay with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000) // Max 5 seconds
        setTimeout(() => {
          this.executeLeaseCreation(retryCount + 1)
        }, retryDelay)
        
      } else {
        // Max retries reached or non-retryable error
        const errorType = this.categorizeNetworkError(error)
        this.handleLeaseCreationError(errorType, error)
      }
    })
  },

  // Update vehicle status to rented with retry mechanism
  updateVehicleStatusWithRetry(carId, rentId, retryCount = 0) {
    const maxRetries = 3
    const db = wx.cloud.database()
    const {car_change_field} = this.data
    
    // Prepare vehicle update data
    const updateData = {
      status: 1, // Set to rented
      current_rent_id: rentId,
      last_rent_time: new Date().getTime(),
      ...car_change_field // Include any vehicle modifications
    }
    
    console.log('Updating vehicle status (attempt ' + (retryCount + 1) + '):', updateData)
    
    // Create promise with timeout for vehicle update
    const updatePromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Vehicle update timeout'))
      }, 10000) // 10 second timeout
      
      db.collection('car').doc(carId).update({
        data: updateData,
        success: (updateResult) => {
          clearTimeout(timeoutId)
          resolve(updateResult)
        },
        fail: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        }
      })
    })
    
    updatePromise.then((updateResult) => {
      console.log('Vehicle status updated successfully:', updateResult)
      
      // Step 3: Save all uploaded images to rent record (if any new images)
      this.saveUploadedImagesWithRetry(rentId, 0)
      
    }).catch((error) => {
      console.error('Failed to update vehicle status:', error)
      
      // Check if this is a network-related error that should be retried
      if (this.isRetryableNetworkError(error) && retryCount < maxRetries) {
        console.log(`Retrying vehicle update (${retryCount + 1}/${maxRetries})...`)
        
        // Show retry feedback to user
        wx.showToast({
          title: `更新车辆状态重试中 (${retryCount + 1}/${maxRetries})`,
          icon: 'loading',
          duration: 2000
        })
        
        // Retry after a delay
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 3000) // Max 3 seconds
        setTimeout(() => {
          this.updateVehicleStatusWithRetry(carId, rentId, retryCount + 1)
        }, retryDelay)
        
      } else {
        // Max retries reached or non-retryable error
        const errorType = this.categorizeNetworkError(error)
        this.handleLeaseCreationError(errorType, error)
      }
    })
  },

  // Save all uploaded images to rent record with retry mechanism
  saveUploadedImagesWithRetry(rentId, retryCount = 0) {
    const maxRetries = 2 // Lower retry count for image saving as it's less critical
    const {cover_image, detail_image, renter} = this.data
    const db = wx.cloud.database()
    
    // Collect all image URLs for the rent record
    const allImages = {
      cover_images: cover_image || [],
      detail_images: detail_image || [],
      id_card_images: renter.id_card_image || []
    }
    
    // Create promise with timeout for image saving
    const savePromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Image saving timeout'))
      }, 8000) // 8 second timeout
      
      // Update rent record with complete image information
      db.collection('rent').doc(rentId).update({
        data: {
          all_images: allImages,
          image_count: {
            cover: allImages.cover_images.length,
            detail: allImages.detail_images.length,
            id_card: allImages.id_card_images.length,
            total: allImages.cover_images.length + allImages.detail_images.length + allImages.id_card_images.length
          },
          images_saved_time: new Date().getTime(),
          image_save_attempts: retryCount + 1
        },
        success: (imageResult) => {
          clearTimeout(timeoutId)
          resolve(imageResult)
        },
        fail: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        }
      })
    })
    
    savePromise.then((imageResult) => {
      console.log('Images saved to rent record successfully:', imageResult)
      
      // All steps completed successfully
      this.handleLeaseCreationSuccess(rentId)
      
    }).catch((error) => {
      console.error('Failed to save images to rent record:', error)
      
      // Check if this is a network-related error that should be retried
      if (this.isRetryableNetworkError(error) && retryCount < maxRetries) {
        console.log(`Retrying image save (${retryCount + 1}/${maxRetries})...`)
        
        // Show retry feedback to user
        wx.showToast({
          title: `保存图片重试中 (${retryCount + 1}/${maxRetries})`,
          icon: 'loading',
          duration: 1500
        })
        
        // Retry after a delay
        const retryDelay = 1000 * (retryCount + 1) // 1s, 2s delays
        setTimeout(() => {
          this.saveUploadedImagesWithRetry(rentId, retryCount + 1)
        }, retryDelay)
        
      } else {
        // This is not critical - lease is already created, just log the error
        console.warn('Lease created successfully but image saving failed after retries')
        
        // Still proceed with success since the main lease creation succeeded
        this.handleLeaseCreationSuccess(rentId)
        
        // Show warning to user about image saving failure
        setTimeout(() => {
          wx.showToast({
            title: '租赁创建成功，但图片保存可能不完整',
            icon: 'none',
            duration: 3000
          })
        }, 2000)
      }
    })
  },

  // Determine lease duration type for categorization
  determineLeaseDuration() {
    const totalDays = this.calculateLeaseDetails().totalDays
    
    if (totalDays <= 7) {
      return 'short_term' // 短期租赁
    } else if (totalDays <= 30) {
      return 'monthly' // 月租
    } else if (totalDays <= 365) {
      return 'long_term' // 长期租赁
    } else {
      return 'extended' // 超长期租赁
    }
  },

  // Handle successful lease creation
  handleLeaseCreationSuccess(rentId) {
    // Clear all loading states
    this.setLoadingState(false)
    this.setData({ isProcessing: false })
    wx.hideLoading()
    
    console.log('Lease creation completed successfully, rent ID:', rentId)
    
    // Show success message with details
    const {car, renter, rent_info} = this.data
    const successMessage = `租赁创建成功！\n\n车辆：${car.carname}\n租车人：${renter.name}\n租期：${rent_info.duration_picker_time}\n\n即将返回车库页面`
    
    wx.showModal({
      title: '创建成功',
      content: successMessage,
      showCancel: false,
      confirmText: '返回车库',
      confirmColor: '#07c160',
      success: (res) => {
        if (res.confirm) {
          // Navigate back to garage page on success
          this.navigateBackToGarage()
        }
      }
    })
    
    // Also show a toast for immediate feedback
    wx.showToast({
      title: '租赁创建成功',
      icon: 'success',
      duration: 2000
    })
    
    // Log success metrics
    this.logLeaseCreationSuccess(rentId)
  },

  // Handle lease creation errors gracefully
  handleLeaseCreationError(errorType, error) {
    // Clear all loading states
    this.setLoadingState(false)
    this.setData({ isProcessing: false })
    wx.hideLoading()
    
    console.error('Lease creation failed:', errorType, error)
    
    // Determine error message based on error type
    let errorTitle = '创建失败'
    let errorMessage = '租赁创建过程中发生错误，请重试。'
    let showRetry = true
    
    switch(errorType) {
      case 'rent_creation':
        errorTitle = '租赁记录创建失败'
        errorMessage = '无法创建租赁记录，请检查网络连接后重试。\n\n如果问题持续存在，请联系客服。'
        break
        
      case 'vehicle_update':
        errorTitle = '车辆状态更新失败'
        errorMessage = '租赁记录已创建，但车辆状态更新失败。\n\n请手动检查车辆状态或联系客服处理。'
        showRetry = false // Don't retry vehicle update as rent record is already created
        break
        
      case 'network_error':
        errorTitle = '网络连接失败'
        errorMessage = '网络连接不稳定，请检查网络后重试。\n\n建议切换到稳定的网络环境。'
        break
        
      case 'validation_error':
        errorTitle = '数据验证失败'
        errorMessage = '提交的数据不完整或格式错误，请检查所有信息后重试。'
        showRetry = false // Don't retry validation errors
        break
        
      default:
        errorTitle = '未知错误'
        errorMessage = `发生未知错误：${error.errMsg || error.message || '请重试'}\n\n如果问题持续存在，请联系客服。`
    }
    
    // Show error dialog with appropriate options
    const buttons = showRetry ? 
      { showCancel: true, confirmText: '重试', cancelText: '稍后再试' } :
      { showCancel: false, confirmText: '知道了' }
    
    wx.showModal({
      title: errorTitle,
      content: errorMessage,
      confirmColor: showRetry ? '#07c160' : '#ee0a24',
      ...buttons,
      success: (res) => {
        if (res.confirm && showRetry) {
          // Retry lease creation
          this.retryLeaseCreation()
        } else {
          // Maintain form state on errors - don't navigate away
          this.maintainFormStateOnError()
        }
      }
    })
    
    // Show error toast for immediate feedback
    wx.showToast({
      title: errorType === 'network_error' ? '网络错误' : '创建失败',
      icon: 'error',
      duration: 2000
    })
    
    // Log error for debugging
    this.logLeaseCreationError(errorType, error)
  },

  // Navigate back to garage page after successful creation
  navigateBackToGarage() {
    // Add a small delay for better UX
    setTimeout(() => {
      wx.navigateBack({
        delta: 1, // Go back to previous page (garage)
        success: () => {
          console.log('Successfully navigated back to garage page')
          
          // Show final success message on garage page
          setTimeout(() => {
            wx.showToast({
              title: '租赁已创建',
              icon: 'success',
              duration: 1500
            })
          }, 500)
        },
        fail: (error) => {
          console.error('Failed to navigate back:', error)
          
          // Fallback: redirect to garage page
          wx.redirectTo({
            url: '/pages/garage/garage',
            success: () => {
              console.log('Redirected to garage page as fallback')
            },
            fail: (redirectError) => {
              console.error('Failed to redirect to garage:', redirectError)
              
              // Last resort: show message to user
              wx.showModal({
                title: '导航失败',
                content: '无法自动返回车库页面，请手动返回。',
                showCancel: false,
                confirmText: '知道了'
              })
            }
          })
        }
      })
    }, 1000)
  },

  // Retry lease creation after error
  retryLeaseCreation() {
    // Show retry feedback
    wx.showToast({
      title: '正在重试...',
      icon: 'loading',
      duration: 1000
    })
    
    // Wait a moment then retry
    setTimeout(() => {
      // Validate data again before retry
      this.updateValidationState()
      const {validation} = this.data
      
      if (!validation.step0.valid || !validation.step1.valid || !validation.step2.valid) {
        // Data is no longer valid, show validation errors
        wx.showModal({
          title: '数据验证失败',
          content: '重试前发现数据不完整，请检查所有信息后再次提交。',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#ee0a24'
        })
        return
      }
      
      // Data is still valid, retry creation
      this.performLeaseCreation()
      
    }, 1500)
  },

  // Maintain form state when errors occur
  maintainFormStateOnError() {
    // Reset processing states but keep form data
    this.setData({
      isProcessing: false,
      loading: false,
      loadingAction: '',
      showConfirmDialog: false
    })
    
    // Update button states
    this.updateNavigationButtonStates()
    
    // Show guidance message
    wx.showToast({
      title: '表单数据已保留',
      icon: 'none',
      duration: 2000
    })
    
    console.log('Form state maintained after error, user can retry when ready')
  },

  // Log successful lease creation for analytics
  logLeaseCreationSuccess(rentId) {
    const logData = {
      event: 'lease_creation_success',
      rent_id: rentId,
      car_id: this.data.car._id,
      car_name: this.data.car.carname,
      renter_name: this.data.renter.name,
      lease_duration: this.data.rent_info.duration_picker_time,
      total_days: this.calculateLeaseDetails().totalDays,
      lease_type: this.determineLeaseDuration(),
      has_vehicle_changes: this.data.changeTracking?.vehicle?.hasChanges || false,
      creation_time: new Date().getTime(),
      page_load_time: this.data.pageLoadTime || null,
      form_completion_time: new Date().getTime() - (this.data.pageLoadTime || new Date().getTime())
    }
    
    console.log('Lease creation success logged:', logData)
    
    // In a real app, you might send this to analytics service
    // wx.reportAnalytics('lease_creation_success', logData)
  },

  // Log lease creation errors for debugging
  logLeaseCreationError(errorType, error) {
    const logData = {
      event: 'lease_creation_error',
      error_type: errorType,
      error_message: error.errMsg || error.message || 'Unknown error',
      error_code: error.errCode || null,
      car_id: this.data.car._id,
      car_name: this.data.car.carname,
      renter_name: this.data.renter.name,
      lease_duration: this.data.rent_info.duration_picker_time,
      error_time: new Date().getTime(),
      page_load_time: this.data.pageLoadTime || null,
      user_agent: wx.getSystemInfoSync()
    }
    
    console.error('Lease creation error logged:', logData)
    
    // In a real app, you might send this to error tracking service
    // wx.reportAnalytics('lease_creation_error', logData)
  },

  // Check network connectivity before critical operations
  checkNetworkConnectivity() {
    return new Promise((resolve, reject) => {
      wx.getNetworkType({
        success: (res) => {
          const networkType = res.networkType
          console.log('Network type:', networkType)
          
          // Check if network is available
          if (networkType === 'none') {
            resolve(false)
          } else if (networkType === 'unknown') {
            // Unknown network type, assume connected but warn
            console.warn('Unknown network type detected')
            resolve(true)
          } else {
            // Network is available (wifi, 2g, 3g, 4g, 5g)
            resolve(true)
          }
        },
        fail: (error) => {
          console.error('Failed to get network type:', error)
          reject(error)
        }
      })
    })
  },

  // Categorize network errors for appropriate handling
  categorizeNetworkError(error) {
    const errorMsg = error.errMsg || error.message || ''
    const errorCode = error.errCode || error.code || 0
    
    // Network connectivity errors
    if (errorMsg.includes('network') || errorMsg.includes('timeout') || 
        errorMsg.includes('连接') || errorCode === -1) {
      return 'network_error'
    }
    
    // Database/Cloud function errors
    if (errorMsg.includes('database') || errorMsg.includes('cloud') ||
        errorCode >= 10000 && errorCode < 20000) {
      return 'database_error'
    }
    
    // Permission/Authentication errors
    if (errorMsg.includes('permission') || errorMsg.includes('auth') ||
        errorCode >= 20000 && errorCode < 30000) {
      return 'permission_error'
    }
    
    // Quota/Limit errors
    if (errorMsg.includes('quota') || errorMsg.includes('limit') ||
        errorCode >= 30000 && errorCode < 40000) {
      return 'quota_error'
    }
    
    // Validation errors
    if (errorMsg.includes('validation') || errorMsg.includes('invalid') ||
        errorCode >= 40000 && errorCode < 50000) {
      return 'validation_error'
    }
    
    // Default to general error
    return 'general_error'
  },

  // Check if an error is retryable based on its type
  isRetryableNetworkError(error) {
    const errorType = this.categorizeNetworkError(error)
    const errorMsg = error.errMsg || error.message || ''
    
    // Retryable error types
    const retryableTypes = ['network_error', 'database_error', 'general_error']
    
    // Specific retryable error messages
    const retryableMessages = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'busy',
      'overload',
      '网络',
      '连接',
      '超时',
      '繁忙'
    ]
    
    // Check if error type is retryable
    if (retryableTypes.includes(errorType)) {
      return true
    }
    
    // Check if error message indicates a retryable condition
    const isRetryableMessage = retryableMessages.some(msg => 
      errorMsg.toLowerCase().includes(msg.toLowerCase())
    )
    
    return isRetryableMessage
  },

  // Enhanced network error handling with user guidance
  handleNetworkError(error, operation = 'operation') {
    console.error('Network error during ' + operation + ':', error)
    
    const errorType = this.categorizeNetworkError(error)
    let title = '网络错误'
    let content = '网络连接出现问题，请检查网络后重试。'
    let showRetry = true
    
    switch(errorType) {
      case 'network_error':
        title = '网络连接失败'
        content = '无法连接到服务器，请检查网络连接：\n\n1. 确认WiFi或移动网络已连接\n2. 尝试切换网络环境\n3. 检查网络信号强度'
        break
        
      case 'database_error':
        title = '数据库连接失败'
        content = '数据库服务暂时不可用，请稍后重试：\n\n1. 服务器可能正在维护\n2. 请等待几分钟后重试\n3. 如持续出现请联系客服'
        break
        
      case 'permission_error':
        title = '权限验证失败'
        content = '访问权限验证失败：\n\n1. 请重新登录小程序\n2. 检查账户权限设置\n3. 联系管理员确认权限'
        showRetry = false
        break
        
      case 'quota_error':
        title = '服务限制'
        content = '服务使用已达到限制：\n\n1. 请稍后再试\n2. 联系客服了解详情\n3. 升级服务套餐'
        showRetry = false
        break
        
      default:
        title = '操作失败'
        content = `${operation}失败：${error.errMsg || error.message}\n\n请稍后重试，如问题持续请联系客服。`
    }
    
    return new Promise((resolve) => {
      wx.showModal({
        title: title,
        content: content,
        showCancel: showRetry,
        confirmText: showRetry ? '重试' : '知道了',
        cancelText: '稍后再试',
        confirmColor: showRetry ? '#07c160' : '#ee0a24',
        success: (res) => {
          if (res.confirm && showRetry) {
            resolve('retry')
          } else {
            resolve('cancel')
          }
        }
      })
    })
  },

  // Monitor network status changes during operation
  monitorNetworkStatus() {
    wx.onNetworkStatusChange((res) => {
      console.log('Network status changed:', res)
      
      if (!res.isConnected) {
        // Network disconnected during operation
        wx.showToast({
          title: '网络连接已断开',
          icon: 'none',
          duration: 3000
        })
        
        // Update UI state to reflect network issues
        this.setData({
          networkStatus: 'disconnected',
          networkType: 'none'
        })
        
      } else {
        // Network reconnected
        wx.showToast({
          title: '网络已重新连接',
          icon: 'success',
          duration: 2000
        })
        
        // Update UI state
        this.setData({
          networkStatus: 'connected',
          networkType: res.networkType
        })
        
        // If there were pending operations, offer to retry
        if (this.data.hasPendingOperations) {
          setTimeout(() => {
            wx.showModal({
              title: '网络已恢复',
              content: '检测到网络已恢复，是否重试之前失败的操作？',
              confirmText: '重试',
              cancelText: '稍后',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  this.retryPendingOperations()
                }
              }
            })
          }, 1000)
        }
      }
    })
  },

  // Comprehensive file validation before upload
  validateUploadFile(file, fileType) {
    const validations = {
      isValid: true,
      message: '',
      warnings: []
    }
    
    // Check if file exists
    if (!file) {
      validations.isValid = false
      validations.message = '未选择文件'
      return validations
    }
    
    // File size validation
    const maxSizes = {
      cover: 10 * 1024 * 1024,    // 10MB for cover images
      detail: 10 * 1024 * 1024,   // 10MB for detail images
      id_card: 15 * 1024 * 1024   // 15MB for ID card images (higher quality needed)
    }
    
    const maxSize = maxSizes[fileType] || 10 * 1024 * 1024
    if (file.size && file.size > maxSize) {
      validations.isValid = false
      validations.message = `图片大小不能超过${Math.round(maxSize / (1024 * 1024))}MB`
      return validations
    }
    
    // File type validation (if available)
    if (file.type) {
      console.log(file.type)
      const allowedTypes = ['image']
      // const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        validations.isValid = false
        validations.message = '只支持 JPG、PNG、WebP 格式的图片'
        return validations
      }
    }
    
    // File name validation
    if (file.name) {
      const fileName = file.name.toLowerCase()
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp']
      const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
      
      if (!hasValidExtension) {
        validations.isValid = false
        validations.message = '文件格式不支持，请选择图片文件'
        return validations
      }
    }
    
    // File path validation
    if (file.url || file.path) {
      const filePath = file.url || file.path
      if (!filePath || filePath.trim() === '') {
        validations.isValid = false
        validations.message = '文件路径无效'
        return validations
      }
    }
    
    // Size warnings (not blocking)
    if (file.size) {
      const sizeInMB = file.size / (1024 * 1024)
      if (sizeInMB > 5) {
        validations.warnings.push(`图片较大(${sizeInMB.toFixed(1)}MB)，上传可能需要更长时间`)
      }
      if (sizeInMB < 0.1) {
        validations.warnings.push('图片较小，可能影响显示质量')
      }
    }
    
    // Type-specific validations
    switch(fileType) {
      case 'id_card':
        // ID card images should be reasonably sized for OCR
        if (file.size && file.size < 100 * 1024) { // Less than 100KB
          validations.warnings.push('身份证图片可能过小，建议使用更清晰的照片')
        }
        break
        
      case 'cover':
        // Cover images should be good quality
        if (file.size && file.size < 200 * 1024) { // Less than 200KB
          validations.warnings.push('封面图片可能过小，建议使用更高质量的图片')
        }
        break
    }
    
    return validations
  },

  // Universal file upload method with retry mechanism
  uploadFileWithRetry(filePath, cloudPath, fileType, retryCount = 0, successCallback, errorCallback) {
    const maxRetries = 3
    const uploadTimeout = 30000 // 30 seconds timeout
    
    console.log(`Uploading ${fileType} file (attempt ${retryCount + 1}/${maxRetries + 1}):`, filePath)
    
    // Create upload promise with timeout
    const uploadPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Upload timeout'))
      }, uploadTimeout)
      
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
        success: (res) => {
          clearTimeout(timeoutId)
          resolve(res)
        },
        fail: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        }
      })
    })
    
    uploadPromise.then((res) => {
      console.log(`${fileType} upload successful:`, res)
      
      // Show success feedback
      const successMessages = {
        cover: '封面图片上传成功',
        detail: '详细图片上传成功',
        id_card: '身份证照片上传成功'
      }
      
      wx.showToast({
        title: successMessages[fileType] || '图片上传成功',
        icon: 'success',
        duration: 1500
      })
      
      // Call success callback
      if (successCallback) {
        successCallback(res.fileID)
      }
      
    }).catch((error) => {
      console.error(`${fileType} upload failed:`, error)
      
      // Check if this is a retryable error and we haven't exceeded max retries
      if (this.isRetryableUploadError(error) && retryCount < maxRetries) {
        console.log(`Retrying ${fileType} upload (${retryCount + 1}/${maxRetries})...`)
        
        // Show retry feedback
        wx.showToast({
          title: `上传失败，正在重试 (${retryCount + 1}/${maxRetries})`,
          icon: 'loading',
          duration: 2000
        })
        
        // Retry with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000) // Max 5 seconds
        setTimeout(() => {
          this.uploadFileWithRetry(filePath, cloudPath, fileType, retryCount + 1, successCallback, errorCallback)
        }, retryDelay)
        
      } else {
        // Max retries reached or non-retryable error
        this.handleUploadError(error, fileType, retryCount, maxRetries)
        
        // Call error callback
        if (errorCallback) {
          errorCallback(error)
        }
      }
    })
  },

  // Check if upload error is retryable
  isRetryableUploadError(error) {
    const errorMsg = error.errMsg || error.message || ''
    const errorCode = error.errCode || error.code || 0
    
    // Retryable error conditions
    const retryableConditions = [
      // Network-related errors
      errorMsg.includes('network'),
      errorMsg.includes('timeout'),
      errorMsg.includes('connection'),
      errorMsg.includes('网络'),
      errorMsg.includes('连接'),
      errorMsg.includes('超时'),
      
      // Temporary server errors
      errorMsg.includes('busy'),
      errorMsg.includes('overload'),
      errorMsg.includes('temporary'),
      errorMsg.includes('繁忙'),
      errorMsg.includes('临时'),
      
      // Specific error codes that are retryable
      errorCode === -1,           // Network error
      errorCode === 10001,        // System error
      errorCode === 10002,        // Service busy
      errorCode >= 50000          // Cloud service temporary errors
    ]
    
    return retryableConditions.some(condition => condition === true)
  },

  // Handle upload errors with user-friendly messages
  handleUploadError(error, fileType, retryCount, maxRetries) {
    const errorType = this.categorizeUploadError(error)
    const fileTypeNames = {
      cover: '封面图片',
      detail: '详细图片',
      id_card: '身份证照片'
    }
    
    const fileTypeName = fileTypeNames[fileType] || '图片'
    let title = '上传失败'
    let content = `${fileTypeName}上传失败，请重试。`
    let showRetry = true
    
    switch(errorType) {
      case 'network_error':
        title = '网络上传失败'
        content = `${fileTypeName}上传失败，网络连接不稳定：\n\n1. 检查网络连接\n2. 尝试切换网络环境\n3. 确保网络信号良好`
        break
        
      case 'file_too_large':
        title = '文件过大'
        content = `${fileTypeName}文件过大，无法上传：\n\n1. 请压缩图片后重试\n2. 或选择其他图片\n3. 建议图片大小在10MB以内`
        showRetry = false
        break
        
      case 'invalid_file':
        title = '文件格式错误'
        content = `${fileTypeName}格式不支持：\n\n1. 请选择JPG、PNG格式图片\n2. 确保文件未损坏\n3. 重新拍照或选择其他图片`
        showRetry = false
        break
        
      case 'quota_exceeded':
        title = '存储空间不足'
        content = `云存储空间不足，无法上传：\n\n1. 请联系管理员\n2. 清理不必要的文件\n3. 升级存储套餐`
        showRetry = false
        break
        
      case 'permission_denied':
        title = '权限不足'
        content = `没有上传权限：\n\n1. 请重新登录\n2. 联系管理员确认权限\n3. 检查账户状态`
        showRetry = false
        break
        
      default:
        title = '上传失败'
        content = `${fileTypeName}上传失败 (已重试${retryCount}次)：\n\n${error.errMsg || error.message}\n\n请稍后重试或联系客服。`
    }
    
    // Show error dialog with retry option if applicable
    if (showRetry) {
      wx.showModal({
        title: title,
        content: content,
        confirmText: '重试',
        cancelText: '取消',
        confirmColor: '#07c160',
        success: (res) => {
          if (res.confirm) {
            // User wants to retry - this would need to be handled by the calling method
            wx.showToast({
              title: '请重新选择图片上传',
              icon: 'none',
              duration: 2000
            })
          }
        }
      })
    } else {
      wx.showModal({
        title: title,
        content: content,
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#ee0a24'
      })
    }
  },

  // Categorize upload errors for appropriate handling
  categorizeUploadError(error) {
    const errorMsg = error.errMsg || error.message || ''
    const errorCode = error.errCode || error.code || 0
    
    // File size errors
    if (errorMsg.includes('file too large') || errorMsg.includes('size') || 
        errorCode === 40001 || errorCode === 40002) {
      return 'file_too_large'
    }
    
    // File format errors
    if (errorMsg.includes('invalid file') || errorMsg.includes('format') ||
        errorMsg.includes('type') || errorCode === 40003) {
      return 'invalid_file'
    }
    
    // Network errors
    if (errorMsg.includes('network') || errorMsg.includes('timeout') ||
        errorMsg.includes('connection') || errorCode === -1) {
      return 'network_error'
    }
    
    // Quota/Storage errors
    if (errorMsg.includes('quota') || errorMsg.includes('storage') ||
        errorMsg.includes('space') || errorCode >= 50001 && errorCode <= 50010) {
      return 'quota_exceeded'
    }
    
    // Permission errors
    if (errorMsg.includes('permission') || errorMsg.includes('auth') ||
        errorCode >= 20001 && errorCode <= 20010) {
      return 'permission_denied'
    }
    
    // Default to general error
    return 'general_error'
  },

  // Clean up failed uploads
  cleanupFailedUpload(cloudPath) {
    if (!cloudPath) return
    
    wx.cloud.deleteFile({
      fileList: [cloudPath],
      success: (res) => {
        console.log('Cleaned up failed upload:', res)
      },
      fail: (error) => {
        console.warn('Failed to cleanup upload:', error)
      }
    })
  },

  // Enhanced duplicate submission prevention with operation locking
  acquireOperationLock(operationType) {
    const {operationLocks} = this.data
    const now = Date.now()
    
    // Check if operation is already locked
    if (operationLocks[operationType]) {
      const lockAge = now - operationLocks[operationType].timestamp
      
      // Auto-release locks older than 30 seconds (safety mechanism)
      if (lockAge > 30000) {
        console.warn(`Auto-releasing stale ${operationType} lock (${lockAge}ms old)`)
        delete operationLocks[operationType]
      } else {
        console.log(`Operation ${operationType} is locked, rejecting request`)
        wx.showToast({
          title: '操作正在进行中，请稍候',
          icon: 'none',
          duration: 1500
        })
        return false
      }
    }
    
    // Acquire lock
    operationLocks[operationType] = {
      timestamp: now,
      operationId: this.generateOperationId()
    }
    
    this.setData({
      operationLocks: operationLocks,
      lastOperationId: operationLocks[operationType].operationId
    })
    
    console.log(`Acquired ${operationType} lock:`, operationLocks[operationType].operationId)
    return true
  },

  // Release operation lock
  releaseOperationLock(operationType) {
    const {operationLocks} = this.data
    
    if (operationLocks[operationType]) {
      console.log(`Released ${operationType} lock:`, operationLocks[operationType].operationId)
      delete operationLocks[operationType]
      
      this.setData({
        operationLocks: operationLocks
      })
    }
  },

  // Generate unique operation ID for tracking
  generateOperationId() {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  // Track button clicks for debugging and rate limiting
  trackButtonClick(buttonType) {
    const {buttonClickCounts} = this.data
    const now = Date.now()
    
    if (!buttonClickCounts[buttonType]) {
      buttonClickCounts[buttonType] = {
        count: 0,
        lastClick: 0,
        recentClicks: []
      }
    }
    
    const buttonData = buttonClickCounts[buttonType]
    buttonData.count++
    buttonData.lastClick = now
    
    // Keep track of recent clicks (last 10 seconds)
    buttonData.recentClicks = buttonData.recentClicks.filter(clickTime => now - clickTime < 10000)
    buttonData.recentClicks.push(now)
    
    // Detect rapid clicking (more than 5 clicks in 3 seconds)
    const rapidClicks = buttonData.recentClicks.filter(clickTime => now - clickTime < 3000)
    if (rapidClicks.length > 5) {
      console.warn(`Rapid clicking detected for ${buttonType}:`, rapidClicks.length, 'clicks in 3 seconds')
      wx.showToast({
        title: '点击过于频繁，请稍后再试',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    
    this.setData({
      buttonClickCounts: buttonClickCounts
    })
    
    return true
  },

  // Enhanced duplicate submission prevention with comprehensive checks
  preventDuplicateSubmission(operationType = 'general') {
    const {loading, isProcessing, lastSubmissionTime, submissionCooldown, operationLocks} = this.data
    const now = Date.now()
    
    // Check if currently processing
    if (loading || isProcessing) {
      wx.showToast({
        title: '请等待当前操作完成',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    
    // Check operation-specific locks
    if (operationLocks[operationType]) {
      const lockAge = now - operationLocks[operationType].timestamp
      if (lockAge < 30000) { // Lock is still valid
        wx.showToast({
          title: `${operationType}操作正在进行中`,
          icon: 'none',
          duration: 1500
        })
        return false
      }
    }
    
    // Check cooldown period
    if (now - lastSubmissionTime < submissionCooldown) {
      const remainingTime = Math.ceil((submissionCooldown - (now - lastSubmissionTime)) / 1000)
      wx.showToast({
        title: `请等待 ${remainingTime} 秒后再试`,
        icon: 'none',
        duration: 1500
      })
      return false
    }
    
    // Check network status
    if (this.data.networkStatus === 'disconnected') {
      wx.showToast({
        title: '网络连接不可用，请检查网络',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    
    return true
  },

  // Disable all interactive elements during processing
  disableAllInteractions() {
    this.setData({
      submitDisabled: true,
      nextDisabled: true,
      uploadingCover: true,
      uploadingDetail: true,
      uploadingIdCard: true,
      interactionsDisabled: true
    })
  },

  // Re-enable interactive elements after processing
  enableAllInteractions() {
    // Update button states based on validation
    this.updateNavigationButtonStates()
    
    this.setData({
      uploadingCover: false,
      uploadingDetail: false,
      uploadingIdCard: false,
      interactionsDisabled: false
    })
  },

  // Monitor for potential memory leaks or stuck states
  monitorSystemHealth() {
    const {operationLocks, buttonClickCounts} = this.data
    const now = Date.now()
    
    // Check for stale locks
    Object.keys(operationLocks).forEach(operationType => {
      const lockAge = now - operationLocks[operationType].timestamp
      if (lockAge > 60000) { // 1 minute
        console.warn(`Detected stale ${operationType} lock, auto-releasing`)
        this.releaseOperationLock(operationType)
      }
    })
    
    // Check for excessive button clicking
    Object.keys(buttonClickCounts).forEach(buttonType => {
      const buttonData = buttonClickCounts[buttonType]
      if (buttonData.count > 100) { // More than 100 clicks total
        console.warn(`Excessive clicking detected for ${buttonType}:`, buttonData.count, 'total clicks')
      }
    })
    
    // Check for stuck processing states
    if (this.data.isProcessing) {
      const processingAge = now - this.data.lastSubmissionTime
      if (processingAge > 120000) { // 2 minutes
        console.warn('Detected stuck processing state, auto-clearing')
        this.setData({
          isProcessing: false,
          loading: false,
          loadingAction: ''
        })
        this.enableAllInteractions()
      }
    }
  },

  // Show detailed validation errors when confirmation is blocked
  showValidationErrorsDialog() {
    const {validation} = this.data
    let errorMessage = '请完善以下信息后再提交：\n\n'
    let errorCount = 0
    
    // Collect errors from all steps
    if (!validation.step0.valid && validation.step0.errors) {
      errorMessage += '车辆信息：\n'
      validation.step0.errors.forEach(error => {
        errorMessage += `• ${error.message}\n`
        errorCount++
      })
      errorMessage += '\n'
    }
    
    if (!validation.step1.valid && validation.step1.errors) {
      errorMessage += '租车人信息：\n'
      validation.step1.errors.forEach(error => {
        errorMessage += `• ${error.message}\n`
        errorCount++
      })
      errorMessage += '\n'
    }
    
    if (!validation.step2.valid && validation.step2.errors) {
      errorMessage += '租赁信息：\n'
      validation.step2.errors.forEach(error => {
        errorMessage += `• ${error.message}\n`
        errorCount++
      })
    }
    
    wx.showModal({
      title: `发现 ${errorCount} 个问题`,
      content: errorMessage,
      showCancel: true,
      confirmText: '去完善',
      cancelText: '稍后处理',
      confirmColor: '#07c160',
      success: (res) => {
        if (res.confirm) {
          // Navigate to the first invalid step
          const firstInvalidStep = this.getFirstInvalidStep()
          if (firstInvalidStep !== -1) {
            this.setData({
              active: firstInvalidStep
            })
            this.updateNavigationButtonStates()
            this.updateStepProgressIndicators()
            
            wx.showToast({
              title: `已切换到第${firstInvalidStep + 1}步`,
              icon: 'none',
              duration: 1500
            })
          }
        }
      }
    })
  },

  // Perform final validation before showing confirmation
  performFinalValidation(confirmationData) {
    const errors = []
    const warnings = []
    
    // Vehicle validation
    if (!confirmationData.vehicle.name || confirmationData.vehicle.name === '未设置') {
      errors.push('车辆名称未设置')
    }
    
    if (confirmationData.vehicle.coverImageCount === 0) {
      warnings.push('未上传车辆封面图片')
    }
    
    // Renter validation
    if (!confirmationData.renter.name || confirmationData.renter.name === '未填写') {
      errors.push('租车人姓名未填写')
    }
    
    if (!confirmationData.renter.hasValidIdCards) {
      errors.push('身份证照片不完整')
    }
    
    // Lease validation
    if (!confirmationData.lease.isValidDateRange) {
      errors.push('租赁日期范围无效')
    }
    
    const now = new Date().getTime()
    if (confirmationData.lease.start_time && new Date(confirmationData.lease.start_time).getTime() <= now) {
      errors.push('租赁开始时间已过期')
    }
    
    return {
      canProceed: errors.length === 0,
      errors: errors,
      warnings: warnings,
      hasWarnings: warnings.length > 0
    }
  },

  // Show final validation errors
  showFinalValidationErrors(errors) {
    let errorMessage = '提交前发现以下问题：\n\n'
    errors.forEach((error, index) => {
      errorMessage += `${index + 1}. ${error}\n`
    })
    errorMessage += '\n请返回修改后重试。'
    
    wx.showModal({
      title: '无法提交',
      content: errorMessage,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#ee0a24'
    })
  },

  // Get the first invalid step for navigation
  getFirstInvalidStep() {
    const {validation} = this.data
    
    if (!validation.step0.valid) return 0
    if (!validation.step1.valid) return 1
    if (!validation.step2.valid) return 2
    
    return -1 // All steps are valid
  },

  // Enhanced duplicate submission prevention with user feedback
  preventDuplicateSubmission() {
    const {loading, isProcessing, lastSubmissionTime, submissionCooldown} = this.data
    const now = Date.now()
    
    // Check if currently processing
    if (loading || isProcessing) {
      wx.showToast({
        title: '请等待当前操作完成',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    
    // Check cooldown period
    if (now - lastSubmissionTime < submissionCooldown) {
      const remainingTime = Math.ceil((submissionCooldown - (now - lastSubmissionTime)) / 1000)
      wx.showToast({
        title: `请等待 ${remainingTime} 秒后再试`,
        icon: 'none',
        duration: 1500
      })
      return false
    }
    
    return true
  },

  // Helper methods for WXML validation display
  hasFieldError(stepIndex, fieldName) {
    const errorDisplay = this.data.errorDisplay || {}
    const stepErrors = errorDisplay[`step${stepIndex}`] || {}
    return stepErrors[fieldName] && stepErrors[fieldName].hasError
  },

  getFieldErrorMessage(stepIndex, fieldName) {
    const errorDisplay = this.data.errorDisplay || {}
    const stepErrors = errorDisplay[`step${stepIndex}`] || {}
    return stepErrors[fieldName] ? stepErrors[fieldName].message : ''
  },

  validateStepWithErrorDisplay(stepIndex) {
    const isValid = this.validateStep(stepIndex)
    if (!isValid) {
      this.showValidationErrors(stepIndex)
    }
    return isValid
  },

  updateErrorDisplayState(stepIndex, errors) {
    const errorDisplay = this.data.errorDisplay || {}
    if (!errorDisplay[`step${stepIndex}`]) {
      errorDisplay[`step${stepIndex}`] = {}
    }

    // Clear previous errors for this step
    errorDisplay[`step${stepIndex}`] = {}

    // Set new errors
    errors.forEach(error => {
      errorDisplay[`step${stepIndex}`][error.field] = {
        hasError: true,
        message: error.message
      }
    })

    this.setData({
      errorDisplay: errorDisplay
    })
  },

  // Enhanced change tracking methods
  initializeChangeTracking() {
    const {car} = this.data
    const changeTracking = {
      vehicle: {
        hasChanges: false,
        originalData: {
          carname: car.carname || '',
          mark: car.mark || '',
          cover_image: car.cover_image ? [car.cover_image] : [],
          detail_image: car.detail_image || []
        },
        changes: {},
        changeHistory: []
      }
    }
    
    this.setData({
      changeTracking: changeTracking
    })
  },

  trackVehicleChange(fieldName, oldValue, newValue, changeType = 'modify') {
    const {changeTracking} = this.data
    const timestamp = new Date().getTime()
    
    // Record the change
    const change = {
      field: fieldName,
      oldValue: oldValue,
      newValue: newValue,
      changeType: changeType, // 'modify', 'add', 'remove'
      timestamp: timestamp,
      formatted_time: this.formatDate(timestamp)
    }
    
    // Add to change history
    changeTracking.vehicle.changeHistory.push(change)
    
    // Update current changes
    if (changeType === 'remove') {
      delete changeTracking.vehicle.changes[fieldName]
    } else {
      changeTracking.vehicle.changes[fieldName] = newValue
    }
    
    // Check if there are any changes from original
    const hasChanges = this.hasVehicleChanges()
    changeTracking.vehicle.hasChanges = hasChanges
    
    this.setData({
      changeTracking: changeTracking
    })
    
    // Update validation state when changes occur
    this.validateStepWithErrorDisplay(0)
    
    console.log('Vehicle change tracked:', change)
    console.log('Current changes:', changeTracking.vehicle.changes)
  },

  hasVehicleChanges() {
    const {changeTracking, car, cover_image, detail_image} = this.data
    const original = changeTracking.vehicle.originalData
    
    // Check text fields
    if (car.carname !== original.carname) return true
    if (car.mark !== original.mark) return true
    
    // Check cover image
    const currentCoverCount = cover_image.length
    const originalCoverCount = original.cover_image.length
    if (currentCoverCount !== originalCoverCount) return true
    
    // Check detail images
    const currentDetailCount = detail_image.length
    const originalDetailCount = original.detail_image.length
    if (currentDetailCount !== originalDetailCount) return true
    
    return false
  },

  getVehicleChangesSummary() {
    const {changeTracking, car, cover_image, detail_image} = this.data
    const original = changeTracking.vehicle.originalData
    const changes = []
    
    // Check text field changes
    if (car.carname !== original.carname) {
      changes.push({
        field: '车辆名称',
        oldValue: original.carname || '(空)',
        newValue: car.carname || '(空)',
        type: 'text'
      })
    }
    
    if (car.mark !== original.mark) {
      changes.push({
        field: '车辆备注',
        oldValue: original.mark || '(空)',
        newValue: car.mark || '(空)',
        type: 'text'
      })
    }
    
    // Check cover image changes
    const currentCoverCount = cover_image.length
    const originalCoverCount = original.cover_image.length
    if (currentCoverCount !== originalCoverCount) {
      changes.push({
        field: '封面图片',
        oldValue: `${originalCoverCount}张`,
        newValue: `${currentCoverCount}张`,
        type: 'image'
      })
    }
    
    // Check detail images changes
    const currentDetailCount = detail_image.length
    const originalDetailCount = original.detail_image.length
    if (currentDetailCount !== originalDetailCount) {
      changes.push({
        field: '详细图片',
        oldValue: `${originalDetailCount}张`,
        newValue: `${currentDetailCount}张`,
        type: 'image'
      })
    }
    
    return changes
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // Track page load time for analytics
    this.setData({
      pageLoadTime: new Date().getTime()
    })
    
    // Initialize network monitoring
    this.monitorNetworkStatus()
    
    // Initialize system health monitoring
    this.systemHealthInterval = setInterval(() => {
      this.monitorSystemHealth()
    }, 30000) // Check every 30 seconds
    
    // Check initial network connectivity
    this.checkNetworkConnectivity().then((isConnected) => {
      this.setData({
        networkStatus: isConnected ? 'connected' : 'disconnected'
      })
      
      if (!isConnected) {
        wx.showToast({
          title: '网络连接不可用，请检查网络设置',
          icon: 'none',
          duration: 3000
        })
      }
    }).catch((error) => {
      console.warn('Initial network check failed:', error)
    })
    
    const db = wx.cloud.database()
    const {cover_image, minDate, rent_info} = this.data
    const maxDate = new Date(minDate);
    maxDate.setFullYear(maxDate.getFullYear() + 3);
    rent_info.start_format_time = this.formatDate(rent_info.start_time)
    
    db.collection('car').doc(options.id).get({
      success: res => {
        console.log(res.data)
        const car = res.data
        cover_image[0] = car.cover_image
        this.setData({
          car: car,
          cover_image: cover_image,
          detail_image: car.detail_image,
          maxDate: maxDate.getTime()
        })
        // Initialize validation after data is loaded
        this.updateValidationState()
        // Initialize change tracking after data is loaded
        this.initializeChangeTracking()
        // Initialize end date calculation if data is available
        this.updateEndDateDisplay()
        // Initialize navigation button states
        this.updateNavigationButtonStates()
        // Initialize step progress indicators
        this.updateStepProgressIndicators()
        this.updateStepIndicatorsWithDetails()
      },
      fail: (error) => {
        console.error('Failed to load car data:', error)
        
        // Handle network error during data loading
        this.handleNetworkError(error, '加载车辆信息').then((action) => {
          if (action === 'retry') {
            // Retry loading car data
            setTimeout(() => {
              this.onLoad(options)
            }, 1000)
          } else {
            // Show error and navigate back
            wx.showModal({
              title: '加载失败',
              content: '无法加载车辆信息，请返回重试。',
              showCancel: false,
              confirmText: '返回',
              success: () => {
                wx.navigateBack()
              }
            })
          }
        })
      }
    })
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
    // Clean up system health monitoring
    if (this.systemHealthInterval) {
      clearInterval(this.systemHealthInterval)
      this.systemHealthInterval = null
    }
    
    // Release any remaining operation locks
    const {operationLocks} = this.data
    Object.keys(operationLocks).forEach(operationType => {
      console.log(`Cleaning up ${operationType} lock on page unload`)
      this.releaseOperationLock(operationType)
    })
    
    // Clear any pending operations
    this.setData({
      hasPendingOperations: false,
      pendingOperationType: '',
      isProcessing: false,
      loading: false
    })
    
    // Remove network status change listener
    wx.offNetworkStatusChange()
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