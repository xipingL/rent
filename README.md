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
| status | number | 车辆状态：0=空闲可租，1=租聘中 |
| is_delete | boolean | 是否删除：false=未删除，true=已删除 |
| createTime | Date | 创建时间 |

---

### rental（租聘订单集合）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 订单ID（自动生成） |
| carId | string | 关联的车辆ID |
| renterName | string | 租车人姓名 |
| renterPhone | string | 租车人手机号 |
| idCardFront | string | 身份证正面照片的云存储文件ID |
| idCardBack | string | 身份证反面照片的云存储文件ID |
| vehiclePhotos | array | 车辆照片的云存储文件ID列表 |
| startTime | string | 起租时间，格式："YYYY-MM-DD HH:mm" |
| duration | number | 租聘时长（天数） |
| expireTime | string | 到期时间，格式："YYYY-MM-DD HH:mm" |
| status | number | 订单状态：0=进行中，1=待结算，2=已完成 |
| type | number | 订单类型：0=首次租聘，1=续租 |
| parentRentalId | string | 父订单ID（续租时关联首次租聘订单） |
| settleTime | Date | 结算时间 |
| settlePhotos | array | 结算照片的云存储文件ID列表 |
| remark | string | 结算备注 |
| is_delete | boolean | 是否删除：false=未删除，true=已删除 |
| createTime | Date | 创建时间 |

---

## 状态说明

### 车辆状态 (car.status)
- `0` - 空闲可租
- `1` - 租聘中

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
