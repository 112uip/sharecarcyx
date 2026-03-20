# API 文档

## 基础信息

- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`

## 认证说明

当前版本使用会话机制，登录后返回session token，后续请求需要携带token（待实现）。

## 接口列表

### 1. 用户认证

#### 1.1 提交实名认证

**接口**: `POST /api/auth/submit`

**描述**: 用户提交实名认证信息

**请求参数**:
```json
{
  "name": "张三",
  "idCard": "440101199901011234",
  "driverLicense": "DL-44010001"
}
```

**响应示例**:
```json
{
  "id": "uuid",
  "name": "张三",
  "idCard": "440101199901011234",
  "driverLicense": "DL-44010001",
  "status": "pending",
  "credit": 100
}
```

**错误响应**:
```json
{
  "message": "错误信息"
}
```

---

#### 1.2 注册账号

**接口**: `POST /api/accounts/register`

**描述**: 注册新账号

**请求参数**:
```json
{
  "role": "renter",
  "username": "user001",
  "password": "password123",
  "displayName": "用户001"
}
```

**角色类型**:
- `renter`: 租客
- `admin`: 管理员
- `dispatcher`: 调度员

**响应示例**:
```json
{
  "id": "uuid",
  "role": "renter",
  "username": "user001",
  "displayName": "用户001"
}
```

---

#### 1.3 登录

**接口**: `POST /api/accounts/login`

**描述**: 用户登录

**请求参数**:
```json
{
  "role": "renter",
  "username": "user001",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "token": "uuid",
  "accountId": "uuid",
  "role": "renter",
  "username": "user001",
  "displayName": "用户001",
  "loginAt": 1234567890
}
```

---

### 2. 订单管理

#### 2.1 创建订单

**接口**: `POST /api/orders`

**描述**: 创建新的租车订单

**请求参数**:
```json
{
  "userId": "uuid",
  "carId": "CAR-001",
  "hours": 2
}
```

**响应示例**:
```json
{
  "id": "uuid",
  "userId": "uuid",
  "carId": "CAR-001",
  "hours": 2,
  "status": "reserved",
  "deposit": 800,
  "estimatedFee": 70,
  "createdAt": 1234567890
}
```

**错误响应**:
- 用户不存在
- 用户尚未通过认证
- 车辆不存在
- 车辆当前不可用

---

#### 2.2 取车

**接口**: `POST /api/orders/:orderId/pickup`

**描述**: 用户取车并上传存证信息

**请求参数**:
```json
{
  "pickupPhotoHash": "pickup-1234567890",
  "pickupIot": {
    "odometer": 12580,
    "battery": 78
  }
}
```

**响应示例**:
```json
{
  "id": "uuid",
  "status": "in_use",
  "pickupPhotoHash": "pickup-1234567890",
  "pickupIot": {
    "odometer": 12580,
    "battery": 78
  }
}
```

---

#### 2.3 上报故障

**接口**: `POST /api/orders/:orderId/report-issue`

**描述**: 上报车辆故障

**请求参数**:
```json
{
  "issueType": "minor_collision",
  "detail": "车辆右后视镜轻微剐蹭"
}
```

**响应示例**:
```json
{
  "id": "uuid",
  "issueReported": true
}
```

---

#### 2.4 还车

**接口**: `POST /api/orders/:orderId/return`

**描述**: 用户还车并结算

**请求参数**:
```json
{
  "returnPhotoHash": "return-1234567890",
  "returnIot": {
    "odometer": 12630,
    "battery": 63
  }
}
```

**响应示例**:
```json
{
  "id": "uuid",
  "status": "completed",
  "returnPhotoHash": "return-1234567890",
  "returnIot": {
    "odometer": 12630,
    "battery": 63
  },
  "finalFee": 70,
  "returnAt": 1234567890
}
```

---

### 3. 车辆管理

#### 3.1 获取车辆列表

**接口**: `GET /api/cars`

**描述**: 获取所有车辆信息

**响应示例**:
```json
[
  {
    "id": "CAR-001",
    "model": "BYD Dolphin",
    "plate": "粤A12345",
    "battery": 81,
    "location": "南山科技园",
    "status": "available"
  }
]
```

**车辆状态**:
- `available`: 可用
- `reserved`: 已预约
- `in_use`: 使用中
- `maintenance`: 维护中

---

### 4. 系统管理

#### 4.1 审批用户

**接口**: `POST /api/admin/approve/:userId`

**描述**: 管理员审批用户资质

**响应示例**:
```json
{
  "id": "uuid",
  "name": "张三",
  "status": "approved",
  "credit": 100
}
```

---

#### 4.2 提交维护记录

**接口**: `POST /api/dispatcher/maintenance`

**描述**: 调度员提交车辆维护记录

**请求参数**:
```json
{
  "carId": "CAR-001",
  "dispatcher": "dispatcher-01",
  "action": "charged",
  "note": "调度员执行例行维护"
}
```

**维护动作**:
- `charged`: 充电完成
- `cleaned`: 清洁完成
- `repairing`: 维修中

**响应示例**:
```json
{
  "id": "uuid",
  "carId": "CAR-001",
  "dispatcher": "dispatcher-01",
  "action": "charged",
  "note": "调度员执行例行维护",
  "timestamp": 1234567890
}
```

---

#### 4.3 获取系统状态

**接口**: `GET /api/state`

**描述**: 获取系统整体状态

**响应示例**:
```json
{
  "users": [],
  "cars": [],
  "orders": [],
  "maintenanceLogs": [],
  "accounts": [],
  "chainHeight": 5
}
```

---

#### 4.4 获取区块链数据

**接口**: `GET /api/chain`

**描述**: 获取完整的区块链数据

**响应示例**:
```json
[
  {
    "index": 0,
    "previousHash": "0",
    "timestamp": 1234567890,
    "validator": "genesis",
    "transactions": [],
    "hash": "genesis"
  }
]
```

---

## 错误码说明

| HTTP状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

## 业务流程示例

### 完整的租车流程

1. **用户注册**
   ```bash
   POST /api/accounts/register
   ```

2. **用户登录**
   ```bash
   POST /api/accounts/login
   ```

3. **提交实名认证**
   ```bash
   POST /api/auth/submit
   ```

4. **管理员审批用户**
   ```bash
   POST /api/admin/approve/{userId}
   ```

5. **创建订单**
   ```bash
   POST /api/orders
   ```

6. **取车存证**
   ```bash
   POST /api/orders/{orderId}/pickup
   ```

7. **还车结算**
   ```bash
   POST /api/orders/{orderId}/return
   ```

8. **调度维护**
   ```bash
   POST /api/dispatcher/maintenance
   ```

---

## 注意事项

1. 当前版本为原型系统，密码已使用bcrypt加密
2. 数据持久化使用JSON文件存储，重启服务器数据不会丢失
3. 所有操作都会记录到区块链模拟系统中
4. 日志文件保存在 `logs/` 目录下
5. 数据文件保存在 `data/` 目录下