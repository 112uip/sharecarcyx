# 联盟链共享汽车原型系统

基于联盟区块链技术的共享汽车服务平台原型，支持多角色协同、智能计费、车况存证和运营可追踪。

## 项目特性

- **多角色协同**：支持租客、管理员、调度员三种角色，各司其职
- **联盟链技术**：模拟联盟区块链架构，实现数据上链和多方共识
- **智能合约**：包含完整的Solidity智能合约，支持真实部署
- **实名认证**：用户身份认证和资质审批流程
- **订单管理**：完整的订单生命周期管理（创建、取车、还车、结算）
- **车况存证**：支持IoT数据上链，确保车况真实可追溯
- **异常处理**：故障上报和处理机制
- **调度维护**：车辆维护和状态同步

## 技术栈

- **后端**：Node.js + Express
- **前端**：原生 HTML/CSS/JavaScript
- **区块链**：Solidity 0.8.24 + 自定义联盟链模拟
- **合约编译**：solc 0.8.30

## 项目结构

```
car share/
├── contracts/              # Solidity智能合约
│   └── ConsortiumCarShare.sol
├── artifacts/              # 编译后的合约文件
│   ├── ConsortiumCarShare.abi.json
│   └── ConsortiumCarShare.bytecode.txt
├── scripts/                # 编译脚本
│   └── compile-contract.js
├── src/
│   ├── blockchain/         # 区块链模拟
│   │   └── ledger.js
│   └── services/           # 业务逻辑
│       └── carShareService.js
├── public/                 # 前端文件
│   └── index.html
├── server.js               # 服务器入口
├── package.json
└── README.md
```

## 安装步骤

1. **克隆项目**
   ```bash
   cd "e:\论文\share car\car share"
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **编译智能合约**（可选）
   ```bash
   npm run contract:compile
   ```

## 运行项目

1. **启动服务器**
   ```bash
   npm start
   ```

2. **访问应用**
   打开浏览器访问：http://localhost:3000

## 使用说明

### 角色说明

- **租客**：提交实名认证、创建订单、取还车、上报故障
- **管理员**：审批用户资质、管理车辆、查看系统状态
- **调度员**：车辆维护、状态更新、车况同步

### 业务流程

1. **身份认证**
   - 租客提交实名信息（姓名、身份证、驾照）
   - 管理员审批用户资质

2. **预约下单**
   - 通过认证的用户选择车辆和时长
   - 系统锁定车辆并创建订单

3. **取车存证**
   - 用户取车并上传照片和IoT数据
   - 数据上链存证

4. **使用过程**
   - 可上报车辆故障
   - 系统记录使用情况

5. **还车结算**
   - 用户还车并上传还车数据
   - 系统自动计算费用并结算

6. **调度维护**
   - 调度员执行维护操作
   - 更新车辆状态和电量

## API接口

### 用户认证
- `POST /api/auth/submit` - 提交实名认证
- `POST /api/accounts/register` - 注册账号
- `POST /api/accounts/login` - 登录

### 订单管理
- `POST /api/orders` - 创建订单
- `POST /api/orders/:orderId/pickup` - 取车
- `POST /api/orders/:orderId/return` - 还车
- `POST /api/orders/:orderId/report-issue` - 上报故障

### 车辆管理
- `GET /api/cars` - 获取车辆列表
- `POST /api/dispatcher/maintenance` - 提交维护记录

### 系统管理
- `POST /api/admin/approve/:userId` - 审批用户
- `GET /api/state` - 获取系统状态
- `GET /api/chain` - 获取区块链数据

## 环境变量

创建 `.env` 文件配置以下变量：

```env
PORT=3000
DEPOSIT_AMOUNT=800
PRICE_PER_HOUR=35
DAMAGE_FEE=120
```

## 开发说明

### 编译智能合约

```bash
npm run contract:compile
```

编译后的文件会保存在 `artifacts/` 目录。

### 数据存储

当前版本使用内存存储，重启服务器会清空数据。如需持久化，可以扩展数据存储层。

## 注意事项

1. 当前为原型系统，密码使用明文存储，生产环境需要加密
2. 区块链为模拟实现，真实部署需要使用以太坊或其他区块链平台
3. 智能合约已编写完成，可以部署到真实网络
4. 前端界面为原型设计，可根据需求进一步美化

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系项目维护者。