# 云开发 quickstart

这是云开发的快速启动指引，其中演示了如何上手使用云开发的三大基础能力：

- 数据库：一个既可在小程序前端操作，也能在云函数中读写的 JSON 文档型数据库
- 文件存储：在小程序前端直接上传/下载云端文件，在云开发控制台可视化管理
- 云函数：在云端运行的代码，微信私有协议天然鉴权，开发者只需编写业务逻辑代码

## 参考文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## 表
### 目录
| 序号 | 表名 | 中文说明 |
| ---- | ---- | -------- |
| 1    | car  | 车辆表   |
| 2    | rent | 租聘表   |

### 1. car 车辆表

| 字段名        | 类型    | 允许空 | 默认值  | 备注                 |
| ------------ |  -----  | -----  | ------ | -------------------- |
| _id          | string  | NO     | —      | 车辆ID                |
| _openid      | string  | NO     | —      | 操作人ID              |
| carname      | string  | NO     | —      | 车辆名                |
| cover_image  | object  | YES    | —      | 封面图像              |
| detail_image | object  | YES    | —      | 详情图像              |
| status       | number  | NO     | 0      |  0=空闲 1=租聘中      |
| is_delete    | boolean | NO     | false  |  是否删除             |
| mark         | string  | YES    | —      |  备注                 |
| create_time  | date    | NO     | CURRENT_TIMESTAMP |  创建时间 |
| update_time  | date    | NO     | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |


### 2. rent 租聘表

| 字段名            | 类型    | 允许空 | 默认值  | 备注                 |
| ---------------- |  -----  | -----  | ------ | -------------------- |
| _id              | string  | NO     | —      | 租聘ID                |
| _openid          | string  | NO     | —      | 操作人ID              |
| car_id           | string  | NO     | —      | 车辆ID                |
| renter_detail    | object  | NO     | —      | 租聘人身份证照片       |
| renter_name      | string  | NO     | —      | 租聘人姓名             |
| status           | number  | NO     | 0      |  0=未结算 1=已结算     |
| settlement_photos| array   | YES    | —      |  结算照片（最多3张）    |
| settlement_notes | string  | YES    | —      |  结算备注             |
| settlement_time  | date    | YES    | —      |  结算时间             |
| is_delete        | boolean | NO     | false  |  是否删除             |
| mark             | string  | YES    | —      |  备注                 |
| start_time       | date    | NO     | -      |  租聘开始时间  |
| end_time         | date    | NO     | -      |  租聘结束时间  |
| create_time      | date    | NO     | CURRENT_TIMESTAMP |  创建时间  |
| update_time      | date    | NO     | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

### 索引(暂未做处理)


### 其他
