# 电瓶车租赁管理系统

电瓶车租赁小程序，使用微信云开发。

## 数据库集合

### car（车辆集合）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 车辆ID（自动生成） |
| name | string | 车款名称，如"雅迪DT3" |
| brand | string | 品牌，如"雅迪" |
| frameNo | string | 车架号 |
| plateNo | string | 车牌号，如"A88888" |
| color | string | 车辆颜色 |
| battery | string | 电池型号 |
| note | string | 备注信息 |
| image | string | 封面图片的云存储文件ID |
| photos | array | 车辆照片的云存储文件ID列表 |
| status | number | 车辆状态：0=空闲可租，1=租聘中，2=租聘结束待归还 |
| is_delete | boolean | 是否删除：false=未删除，true=已删除 |
| create_by | string | 创建人 openId |
| createTime | Date | 创建时间 |

---

### rental（租聘订单集合）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 订单ID（自动生成） |
| carId | string | 关联的车辆ID |
| renterName | string | 租车人姓名 |
| renterPhone | string | 租车人手机号 |
| renterOpenId | string | 租车人OpenID（用于发送订阅消息） |
| idCardFront | string | 身份证正面照片的云存储文件ID |
| idCardBack | string | 身份证反面照片的云存储文件ID |
| vehiclePhotos | array | 车辆照片的云存储文件ID列表 |
| startTime | Date | 起租时间 |
| duration | number | 租聘时长（天数） |
| expireTime | Date | 到期时间 |
| status | number | 订单状态：0=租聘中，1=待结算，2=已结算 |
| type | number | 订单类型：0=首次租聘，1=续租 |
| parentRentalId | string | 父订单ID（续租时关联首次租聘订单） |
| settleTime | Date | 结算时间 |
| settlePhotos | array | 结算照片的云存储文件ID列表 |
| remark | string | 结算备注 |
| is_delete | boolean | 是否删除：false=未删除，true=已删除 |
| create_by | string | 操作人 openId |
| createTime | Date | 创建时间 |

---

### operation_log（操作日志集合）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 日志ID（自动生成） |
| operator | string | 操作人 openId |
| action | string | 操作类型：create/update/delete/rent/renew/settle |
| collection | string | 被操作集合：car/rental |
| record_id | string | 被操作记录ID |
| car_id | string | 关联车辆ID |
| remark | string | 操作备注（租聘/续租时记录租车人及租期信息） |
| createTime | Date | 操作时间 |

---

### user（用户集合）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 用户ID（自动生成） |
| openId | string | 微信 openId（唯一标识） |
| name | string | 用户昵称/姓名（默认"商家用户"） |
| avatar | string | 头像 URL（默认空） |
| createTime | Date | 注册时间 |
| updateTime | Date | 更新时间 |

---

## 状态说明

### 车辆状态 (car.status)
- `0` - 空闲可租
- `1` - 租聘中
- `2` - 租聘结束待归还

### 订单状态 (rental.status)
- `0` - 进行中
- `1` - 待结算
- `2` - 已完成

### 订单类型 (rental.type)
- `0` - 首次租聘
- `1` - 续租

---

## 云开发文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

---

## TODO

- [ ] 商家报表导出功能
- [ ] 数据库权限规则配置（防止抓包绕过）
- [ ] 价格/押金体系设计
- [ ] 逾期费用计算规则

---

## 代码规范

### 变量命名规则

| 类型 | 规则 | 示例 |
|------|------|------|
| 普通变量 | camelCase | `userName`, `carId`, `openId` |
| 常量 | UPPER_SNAKE_CASE | `MAX_COUNT`, `DEFAULT_STATUS` |
| 函数名 | camelCase + 动词前缀 | `getOpenId()`, `addOperationLog()` |
| 页面 data | camelCase | `userInfo`, `vehicleList` |
| 云数据库集合名 | 小写单数 | `car`, `rental`, `user` |
| 文件名 | kebab-case | `car-add`, `order-history` |
| CSS 类名 | kebab-case | `.menu-item`, `.avatar-wrapper` |
