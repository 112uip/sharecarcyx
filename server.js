require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const CarShareService = require("./src/services/carShareService");
const logger = require('./src/utils/logger');

const app = express();
const port = process.env.PORT || 3000;
let service;

// JSON 请求体解析
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保目录存在
const photosDir = path.join(__dirname, "frontend", "public", "cars", "photos");
const userPhotosDir = path.join(__dirname, "frontend", "public", "users", "photos");
[photosDir, userPhotosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const userStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, userPhotosDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `USER-${Date.now()}${ext}`);
  },
});
const uploadUserPhotos = multer({
  storage: userStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|jpg|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 jpg、png、gif、webp 格式的图片"));
    }
  },
});

const carStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, photosDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.originalname.replace(/\.[^.]+$/, '')}${ext}`);
  },
});
const upload = multer({
  storage: carStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|jpg|gif|webp)$/.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("仅支持 jpeg/png/gif/webp 格式的图片"));
    }
  },
});

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.get("/api/cars", async (req, res) => {
  try {
    res.json(await service.listCars());
  } catch (error) {
    logger.error('Error listing cars:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/auth/submit", async (req, res) => {
  try {
    const { name, idCard, driverLicense, idCardPhoto, idCardBackPhoto, driverLicensePhoto, accountId } = req.body;
    const user = await service.submitIdentity(name, idCard, driverLicense, idCardPhoto, idCardBackPhoto, driverLicensePhoto, accountId);
    logger.info(`Identity submitted: ${user.id}`);
    res.status(201).json(user);
  } catch (error) {
    logger.error('Error submitting identity:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/auth/upload-photos", uploadUserPhotos.fields([
  { name: 'idCardPhoto', maxCount: 1 },
  { name: 'idCardBackPhoto', maxCount: 1 },
  { name: 'driverLicensePhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    const files = req.files;
    const result = {};
    if (files.idCardPhoto && files.idCardPhoto[0]) {
      result.idCardPhoto = files.idCardPhoto[0].filename;
    }
    if (files.idCardBackPhoto && files.idCardBackPhoto[0]) {
      result.idCardBackPhoto = files.idCardBackPhoto[0].filename;
    }
    if (files.driverLicensePhoto && files.driverLicensePhoto[0]) {
      result.driverLicensePhoto = files.driverLicensePhoto[0].filename;
    }
    logger.info(`User photos uploaded:`, result);
    res.json(result);
  } catch (error) {
    logger.error('Error uploading photos:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/accounts/register", async (req, res) => {
  try {
    const { role, username, password, displayName } = req.body;
    const account = await service.registerAccount(role, username, password, displayName);
    logger.info(`Account registered: ${account.username} (${account.role})`);
    res.status(201).json(account);
  } catch (error) {
    logger.error('Error registering account:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/accounts/login", async (req, res) => {
  try {
    const { role, username, password } = req.body;
    const session = await service.loginAccount(role, username, password);
    logger.info(`User logged in: ${username} (${role})`);
    res.json(session);
  } catch (error) {
    logger.error('Error logging in:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/users/:userId/wallet", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const user = await service.updateUserWallet(req.params.userId, walletAddress);
    logger.info(`Wallet address updated for user: ${req.params.userId}`);
    res.json({ success: true, walletAddress: user.walletAddress });
  } catch (error) {
    logger.error('Error updating wallet address:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/users/me", async (req, res) => {
  try {
    const { accountId } = req.query;
    if (!accountId) {
      return res.status(400).json({ message: "缺少账户ID" });
    }
    const user = await service.getUserByAccountId(accountId);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.post("/api/admin/approve/:userId", async (req, res) => {
  try {
    const user = await service.approveUser(req.params.userId, "admin-001");
    logger.info(`User approved: ${req.params.userId} -> ${user.id}`);
    res.json(user);
  } catch (error) {
    logger.error('Error approving user:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/admin/pending-users", async (req, res) => {
  try {
    const users = await service.listPendingUsers();
    res.json(users);
  } catch (error) {
    logger.error('Error listing pending users:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/admin/cars", async (req, res) => {
  try {
    const car = await service.addCar(req.body);
    logger.info(`Car added: ${car.id} ${car.model}`);
    res.status(201).json(car);
  } catch (error) {
    logger.error('Error adding car:', error);
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/admin/cars/:id", async (req, res) => {
  try {
    const car = await service.updateCar(req.params.id, req.body);
    logger.info(`Car updated: ${car.id} ${car.model}`);
    res.json(car);
  } catch (error) {
    logger.error('Error updating car:', error);
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/admin/cars/:id", async (req, res) => {
  try {
    const removed = await service.deleteCar(req.params.id);
    logger.info(`Car deleted: ${removed.id}`);
    res.json({ message: '删除成功', car: removed });
  } catch (error) {
    logger.error('Error deleting car:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { userId, carId, hours, txHash } = req.body;
    const order = await service.createOrder(userId, carId, Number(hours), txHash);
    logger.info(`Order created: ${order.id}`);
    res.status(201).json(order);
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/orders/:orderId/pickup", async (req, res) => {
  try {
    const { pickupPhotoHash, pickupIot } = req.body;
    const order = await service.pickupCar(req.params.orderId, pickupPhotoHash, pickupIot);
    logger.info(`Car picked up for order: ${req.params.orderId}`);
    res.json(order);
  } catch (error) {
    logger.error('Error picking up car:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/orders/:orderId/report-issue", async (req, res) => {
  try {
    const { issueType, detail, requestRefund } = req.body;
    const order = await service.reportIssue(req.params.orderId, issueType, detail, requestRefund);
    logger.info(`Issue reported for order: ${req.params.orderId}, refund requested: ${requestRefund}`);
    res.json(order);
  } catch (error) {
    logger.error('Error reporting issue:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/orders/:orderId/return", async (req, res) => {
  try {
    const { returnPhotoHash, returnIot } = req.body;
    const order = await service.returnCar(req.params.orderId, returnPhotoHash, returnIot);
    logger.info(`Car returned for order: ${req.params.orderId}`);
    res.json(order);
  } catch (error) {
    logger.error('Error returning car:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/orders/:orderId/pay-usage-fee", async (req, res) => {
  try {
    const { txHash } = req.body;
    const order = await service.payUsageFee(req.params.orderId, txHash);
    logger.info(`Usage fee paid for order: ${req.params.orderId}, txHash: ${txHash}`);
    res.json(order);
  } catch (error) {
    logger.error('Error paying usage fee:', error);
    res.status(400).json({ message: error.message });
  }
});

// 记录用户存入托管合约的交易哈希（由前端在存款成功后调用）
app.post("/api/orders/:orderId/escrow-tx", async (req, res) => {
  try {
    const { txHash } = req.body;
    const order = await service.recordEscrowDeposit(req.params.orderId, txHash);
    logger.info(`Escrow deposit tx recorded for order: ${req.params.orderId}, txHash: ${txHash}`);
    res.json(order);
  } catch (error) {
    logger.error('Error recording escrow deposit tx:', error);
    res.status(400).json({ message: error.message });
  }
});

// 用户申请退押金（与其它订单子路由放在一起，避免遗漏注册）
app.post("/api/orders/:orderId/apply-deposit-refund", async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await service.applyForDepositRefund(req.params.orderId, reason);
    logger.info(`Deposit refund applied for order: ${req.params.orderId}`);
    res.json(order);
  } catch (error) {
    logger.error('Error applying deposit refund:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/orders/history/:userId", async (req, res) => {
  try {
    const records = await service.listUserOrders(req.params.userId);
    res.json(records);
  } catch (error) {
    logger.error('Error querying user order history:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/dispatcher/maintenance", async (req, res) => {
  try {
    const { carId, dispatcher, action, note, targetStatus, resolvedOrderId } = req.body;
    const log = await service.createMaintenanceLog(carId, dispatcher, action, note, targetStatus, resolvedOrderId);
    logger.info(`Maintenance log created for car: ${carId}`);
    res.status(201).json(log);
  } catch (error) {
    logger.error('Error creating maintenance log:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/dispatcher/issues", async (req, res) => {
  try {
    const issues = await service.listDispatcherIssues();
    res.json(issues);
  } catch (error) {
    logger.error('Error listing dispatcher issues:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/dispatcher/issues/:orderId/resolve", async (req, res) => {
  try {
    const { dispatcher, targetStatus, note, refundApproved } = req.body;
    const result = await service.resolveIssue(req.params.orderId, dispatcher, targetStatus, note, refundApproved);
    logger.info(`Issue resolved for order: ${req.params.orderId}, refund approved by dispatcher: ${refundApproved}`);
    res.json(result);
  } catch (error) {
    logger.error('Error resolving dispatcher issue:', error);
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/admin/refund-requests", async (req, res) => {
  try {
    const requests = await service.listRefundRequests();
    res.json(requests);
  } catch (error) {
    logger.error('Error listing refund requests:', error);
    res.status(400).json({ message: error.message });
  }
});

// 获取所有待审核的退押金申请
app.get("/api/admin/deposit-refund-requests", async (req, res) => {
  try {
    const requests = await service.listDepositRefundRequests();
    res.json(requests);
  } catch (error) {
    logger.error('Error listing deposit refund requests:', error);
    res.status(400).json({ message: error.message });
  }
});

// 管理员审核退押金
app.post("/api/admin/deposit-refund/:orderId", async (req, res) => {
  try {
    const { adminId, approved, note, txHash } = req.body;
    const result = await service.processDepositRefund(req.params.orderId, adminId, approved, note, txHash);
    logger.info(`Deposit refund processed for order: ${req.params.orderId}, approved: ${approved}, txHash: ${txHash || 'none'}`);
    res.json(result);
  } catch (error) {
    logger.error('Error processing deposit refund:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/admin/refund/:orderId", async (req, res) => {
  try {
    const { adminId, approved, refundAmount, note } = req.body;
    const result = await service.processRefund(req.params.orderId, adminId, approved, refundAmount, note);
    logger.info(`Refund processed for order: ${req.params.orderId}, approved: ${approved}`);
    res.json(result);
  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(400).json({ message: error.message });
  }
});

// 查询订单的链上托管状态
app.get("/api/orders/:orderId/escrow-state", async (req, res) => {
  try {
    const { getEscrowState } = require("./src/utils/ethEscrow");
    const state = await getEscrowState(req.params.orderId);
    res.json(state || { available: false, reason: "合约未配置或查询失败" });
  } catch (error) {
    logger.error('Error querying escrow state:', error);
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/admin/cars/:id/photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "未上传图片文件" });
    }
    const carId = req.params.id;
    const photoFilename = req.file.filename;
    await service.updateCar(carId, { photo: photoFilename });
    logger.info(`Car ${carId} photo uploaded: ${photoFilename}`);
    res.json({ photo: photoFilename });
  } catch (error) {
    logger.error('Error uploading car photo:', error);
    res.status(400).json({ message: error.message });
  }
});

app.use("/cars/photos", express.static(photosDir));
app.use("/users/photos", express.static(userPhotosDir));

app.get("/api/chain", (req, res) => {
  res.json(service.ledger.blocks);
});

app.get("/api/admin/car-evidence", async (req, res) => {
  try {
    const evidenceData = await service.getCarEvidence();
    res.json(evidenceData);
  } catch (error) {
    logger.error('Error getting car evidence:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/state", async (req, res) => {
  res.json(await service.getOverview());
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

async function bootstrap() {
  service = await CarShareService.create();

  app.listen(port, () => {
    logger.info(`CarShare consortium prototype running at http://localhost:${port}`);
    console.log(`CarShare consortium prototype running at http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start service:', error);
  console.error(error);
  process.exit(1);
});
