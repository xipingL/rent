const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 工具函数：格式化时间为可读字符串
function formatTime(time) {
  const date = new Date(time instanceof Date ? time : time)
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// 工具函数：安全获取时间戳
function toTimestamp(time) {
  if (time instanceof Date) return time.getTime()
  if (typeof time === 'object' && time.getTime) return time.getTime()
  return Number(time)
}

exports.main = async (event, context) => {
  const nowMs = Date.now()
  const log = console.log

  log(`[${formatTime(nowMs)}] 检查过期订单任务开始`)

  const db = cloud.database()
  const _ = db.command

  try {
    // 1. 查询所有租聘中的订单
    const { data: rentals } = await db.collection('rental')
      .where({ status: 0, is_delete: false })
      .get()

    log(`共 ${rentals.length} 个租聘中订单`)

    // 2. 筛选过期订单
    const expiredRentals = rentals.filter(r => {
      if (!r.expireTime) return false
      const expireMs = toTimestamp(r.expireTime)
      return expireMs < nowMs
    })

    if (expiredRentals.length === 0) {
      return { success: true, message: '无过期订单', checkTime: formatTime(nowMs) }
    }

    log(`过期订单: ${expiredRentals.length} 个`)

    // 3. 批量查询车辆信息（优化：避免循环查库）
    const carIds = [...new Set(expiredRentals.map(r => r.carId).filter(Boolean))]
    const carMap = {}

    if (carIds.length > 0) {
      const { data: cars } = await db.collection('car')
        .where({ _id: _.in(carIds), is_delete: false })
        .field({ plateNo: true })
        .get()

      cars.forEach(c => { carMap[c._id] = c.plateNo || '未知' })
    }

    // 4. 发送订阅消息
    let sentCount = 0
    await Promise.allSettled(expiredRentals.map(async rental => {
      if (!rental.renterOpenId) return

      const plateNo = carMap[rental.carId] || '未知'

      try {
        await cloud.openapi.subscribeMessage.send({
          touser: rental.renterOpenId,
          templateId: 'Kpp_Cw-mOX28aKmWmvfcE-XCmi8YtkpU6_el84_4Ttc',
          page: 'pages/orders/orders?id=' + rental._id,
          data: {
            car_number2: { value: plateNo },
            time3: { value: formatTime(rental.startTime) },
            time6: { value: formatTime(rental.expireTime) }
          }
        })
        sentCount++
        log(`提醒发送成功: ${rental._id}`)
      } catch (err) {
        log(`提醒发送失败: ${rental._id}`, err.message)
      }
    }))

    // 5. 批量更新过期订单状态
    const expiredIds = expiredRentals.map(r => r._id)
    const { updated } = await db.collection('rental')
      .where({ _id: _.in(expiredIds), status: 0, is_delete: false })
      .update({ data: { status: 1 } })

    // 6. 更新关联车辆状态
    const uniqueCarIds = [...new Set(expiredRentals.map(r => r.carId).filter(Boolean))]
    await Promise.all(uniqueCarIds.map(async carId => {
      const { total } = await db.collection('rental')
        .where({ carId, status: 0, is_delete: false })
        .count()

      if (total === 0) {
        await db.collection('car')
          .where({ _id: carId, is_delete: false })
          .update({ data: { status: 2 } })
        log(`车辆 ${carId} 状态已更新为待归还`)
      }
    }))

    log(`任务完成: 检查${expiredRentals.length}个, 发送${sentCount}个, 更新${updated}个`)

    return {
      success: true,
      expiredCount: expiredRentals.length,
      sentCount,
      updatedCount: updated,
      checkTime: formatTime(nowMs)
    }
  } catch (err) {
    log('任务执行失败:', err.message)
    return { success: false, error: err.message }
  }
}
