const crypto = require("crypto");
const bcrypt = require('bcrypt');
const ConsortiumLedger = require("../blockchain/ledger");
const DataStore = require("../utils/dataStore");

class CarShareService {
  constructor() {
    this.dataStore = new DataStore();
    this.ledger = new ConsortiumLedger(["operator-node", "municipal-node", "insurance-node"], this.dataStore);
    this.users = [];
    this.cars = [];
    this.orders = [];
    this.maintenanceLogs = [];
    this.accounts = [];
    this.sessions = new Map();
    this.depositAmount = parseInt(process.env.DEPOSIT_AMOUNT) || 800;
    this.pricePerHour = parseInt(process.env.PRICE_PER_HOUR) || 35;
    this.damageFee = parseInt(process.env.DAMAGE_FEE) || 120;
  }

  static async create() {
    const service = new CarShareService();
    await service.initialize();
    return service;
  }

  async initialize() {
    await this.dataStore.init();
    this.users = await this.dataStore.getUsers();
    this.cars = await this.dataStore.getCars();
    if (this.cars.length === 0) {
      this.cars = [
        { id: "CAR-001", model: "BYD Dolphin", plate: "粤A12345", battery: 81, location: "南山科技园", status: "available", seats: 5, pricePerHour: 35, brand: "比亚迪", type: "小型纯电轿车" },
        { id: "CAR-002", model: "Tesla Model 3", plate: "粤B22334", battery: 63, location: "福田中心区", status: "available", seats: 5, pricePerHour: 55, brand: "特斯拉", type: "中型纯电轿车" },
        { id: "CAR-003", model: "AION Y", plate: "粤C33445", battery: 48, location: "罗湖口岸", status: "maintenance", seats: 5, pricePerHour: 40, brand: "埃安", type: "紧凑型纯电SUV" },
        { id: "CAR-004", model: "NIO ET5", plate: "粤D44556", battery: 75, location: "宝安中心", status: "available", seats: 5, pricePerHour: 65, brand: "蔚来", type: "中型纯电轿车" },
        { id: "CAR-005", model: "Xpeng P7", plate: "粤E55667", battery: 92, location: "龙岗万达广场", status: "available", seats: 5, pricePerHour: 50, brand: "小鹏", type: "中型纯电轿车" },
        { id: "CAR-006", model: "Li Auto L8", plate: "粤F66778", battery: 68, location: "福田CBD", status: "available", seats: 6, pricePerHour: 80, brand: "理想", type: "中大型增程SUV" },
        { id: "CAR-007", model: "Maybach S-Class", plate: "粤G77889", battery: 85, location: "南山万象城", status: "available", seats: 4, pricePerHour: 200, brand: "奔驰", type: "大型豪华轿车" },
        { id: "CAR-008", model: "Xiaomi SU7", plate: "粤H88990", battery: 95, location: "前海深港合作区", status: "available", seats: 5, pricePerHour: 60, brand: "小米", type: "中大型纯电轿车" },
        { id: "CAR-009", model: "Porsche Taycan", plate: "粤J99001", battery: 78, location: "华侨城", status: "available", seats: 4, pricePerHour: 180, brand: "保时捷", type: "中大型纯电轿跑" },
        { id: "CAR-010", model: "Hongguang Mini EV", plate: "粤K00112", battery: 72, location: "龙华壹方城", status: "available", seats: 4, pricePerHour: 15, brand: "五菱", type: "超小型纯电轿车" },
        { id: "CAR-011", model: "Ora Good Cat", plate: "粤L01223", battery: 88, location: "南山海岸城", status: "available", seats: 5, pricePerHour: 30, brand: "欧拉", type: "小型纯电轿车" },
        { id: "CAR-012", model: "BYD Seal", plate: "粤M02334", battery: 91, location: "福田cocopark", status: "available", seats: 5, pricePerHour: 50, brand: "比亚迪", type: "中型纯电轿车" },
        { id: "CAR-013", model: "Tesla Model Y", plate: "粤N03445", battery: 82, location: "罗湖万象城", status: "available", seats: 5, pricePerHour: 65, brand: "特斯拉", type: "中型纯电SUV" },
        { id: "CAR-014", model: "BMW iX3", plate: "粤P04556", battery: 77, location: "南山万象天地", status: "available", seats: 5, pricePerHour: 70, brand: "宝马", type: "中型纯电SUV" },
        { id: "CAR-015", model: "Mercedes EQS", plate: "粤Q05667", battery: 93, location: "福田香格里拉", status: "available", seats: 5, pricePerHour: 150, brand: "奔驰", type: "大型纯电轿车" },
        { id: "CAR-016", model: "Audi e-tron GT", plate: "粤R06778", battery: 86, location: "华侨城洲际酒店", status: "available", seats: 4, pricePerHour: 160, brand: "奥迪", type: "中大型纯电轿跑" },
        { id: "CAR-017", model: "NIO ES8", plate: "粤S07889", battery: 79, location: "深圳湾体育中心", status: "available", seats: 6, pricePerHour: 90, brand: "蔚来", type: "中大型纯电SUV" },
        { id: "CAR-018", model: "Zeekr 001", plate: "粤T08990", battery: 90, location: "宝安壹方城", status: "available", seats: 5, pricePerHour: 75, brand: "极氪", type: "中大型纯电猎装轿跑" },
        { id: "CAR-019", model: "Li Auto L9", plate: "粤U09001", battery: 83, location: "南山欢乐海岸", status: "available", seats: 6, pricePerHour: 120, brand: "理想", type: "大型增程SUV" }
      ];
      await this.dataStore.saveCars(this.cars);
    }
    this.orders = await this.dataStore.getOrders();
    this.maintenanceLogs = await this.dataStore.getMaintenanceLogs();
    this.accounts = await this.dataStore.getAccounts();
    await this.ledger.init();
  }

  async saveData() {
    await this.dataStore.saveUsers(this.users);
    await this.dataStore.saveCars(this.cars);
    await this.dataStore.saveOrders(this.orders);
    await this.dataStore.saveMaintenanceLogs(this.maintenanceLogs);
    await this.dataStore.saveAccounts(this.accounts);
  }

  async refreshState() {
    this.users = await this.dataStore.getUsers();
    this.cars = await this.dataStore.getCars();
    this.orders = await this.dataStore.getOrders();
    this.maintenanceLogs = await this.dataStore.getMaintenanceLogs();
    this.accounts = await this.dataStore.getAccounts();
  }

  async registerAccount(role, username, password, displayName) {
    await this.refreshState();
    const allowedRoles = ["renter", "admin", "dispatcher"];
    if (!allowedRoles.includes(role)) {
      throw new Error("角色不合法");
    }
    if (!username || !password) {
      throw new Error("账号或密码不能为空");
    }
    const existing = this.accounts.find((item) => item.username === username && item.role === role);
    if (existing) {
      throw new Error("该角色下账号已存在");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const account = {
      id: crypto.randomUUID(),
      role,
      username,
      password: hashedPassword,
      displayName: displayName || username,
      createdAt: Date.now()
    };
    this.accounts.push(account);
    await this.ledger.queueTransaction("account_registered", {
      accountId: account.id,
      role: account.role,
      username: account.username
    });
    await this.ledger.commitBlock("operator-node", "account-register");
    await this.saveData();
    return {
      id: account.id,
      role: account.role,
      username: account.username,
      displayName: account.displayName
    };
  }

  async loginAccount(role, username, password) {
    await this.refreshState();
    const account = this.accounts.find(
      (item) => item.role === role && item.username === username
    );
    if (!account) {
      throw new Error("账号、密码或角色不匹配");
    }
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      throw new Error("账号、密码或角色不匹配");
    }
    const token = crypto.randomUUID();
    const session = {
      token,
      accountId: account.id,
      role: account.role,
      username: account.username,
      displayName: account.displayName,
      loginAt: Date.now()
    };
    this.sessions.set(token, session);
    await this.ledger.queueTransaction("account_login", {
      accountId: account.id,
      role: account.role,
      username: account.username
    });
    await this.ledger.commitBlock("municipal-node", "account-login");
    return session;
  }

  async submitIdentity(name, idCard, driverLicense) {
    await this.refreshState();
    if (!name || !idCard || !driverLicense) {
      throw new Error("姓名、身份证号、驾驶证号不能为空");
    }
    if (!this.isValidChineseIdCard(idCard)) {
      throw new Error("身份证号格式或校验位不正确");
    }
    const exists = this.users.find((item) => item.idCard === String(idCard).toUpperCase());
    if (exists) {
      throw new Error("该身份证号已提交认证");
    }
    const user = {
      id: this.generateSystemUserId(),
      name,
      idCard: String(idCard).toUpperCase(),
      driverLicense,
      status: "pending",
      credit: 100,
      createdAt: Date.now()
    };
    this.users.push(user);
    await this.ledger.queueTransaction("identity_submitted", {
      userId: user.id,
      name: user.name
    });
    await this.ledger.commitBlock("operator-node", "identity-submission");
    await this.saveData();
    return user;
  }

  generateSystemUserId() {
    const usedIds = new Set(this.users.map((item) => String(item.id)));
    for (let i = 0; i < 200; i += 1) {
      const id = `USR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      if (!usedIds.has(id)) {
        return id;
      }
    }
    const fallback = crypto.randomUUID();
    if (!usedIds.has(fallback)) {
      return fallback;
    }
    throw new Error("系统用户ID生成失败，请重试");
  }

  isValidChineseIdCard(idCard) {
    const normalized = String(idCard || "").trim().toUpperCase();
    return /^\d{17}[\dX]$/.test(normalized);
  }

  async approveUser(userId, adminName) {
    await this.refreshState();
    const user = this.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("用户不存在");
    }
    user.status = "approved";
    await this.ledger.queueTransaction("identity_approved", {
      userId,
      adminName
    });
    await this.ledger.commitBlock("municipal-node", "identity-approval");
    await this.saveData();
    return user;
  }

  async listCars() {
    await this.refreshState();
    return this.cars;
  }

  async addCar(carData) {
    await this.refreshState();
    if (!carData.model || !carData.plate) {
      throw new Error('车型和牌照为必填项');
    }
    const id = (carData.id && carData.id.trim()) || `CAR-${String(this.cars.length + 1).padStart(3, '0')}`;
    if (this.cars.find((c) => c.id === id)) {
      throw new Error(`车辆 ID ${id} 已存在`);
    }
    const newCar = {
      id,
      model: carData.model.trim(),
      plate: carData.plate.trim(),
      battery: Number(carData.battery) >= 0 ? Number(carData.battery) : 100,
      location: (carData.location && carData.location.trim()) || '未知',
      status: carData.status || 'available',
      seats: Number(carData.seats) > 0 ? Number(carData.seats) : 5,
      pricePerHour: Number(carData.pricePerHour) > 0 ? Number(carData.pricePerHour) : 35,
      brand: carData.brand || '',
      type: carData.type || '',
      photo: carData.photo || '',
    };
    this.cars.push(newCar);
    await this.saveData();
    return newCar;
  }

  async updateCar(id, updates) {
    await this.refreshState();
    const idx = this.cars.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`车辆 ${id} 不存在`);
    }
    const allowed = ['model', 'plate', 'battery', 'location', 'status', 'seats', 'pricePerHour', 'brand', 'type', 'photo'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        if (key === 'battery' || key === 'seats' || key === 'pricePerHour') {
          this.cars[idx][key] = Number(updates[key]);
        } else {
          this.cars[idx][key] = updates[key];
        }
      }
    }
    await this.saveData();
    return this.cars[idx];
  }

  async deleteCar(id) {
    await this.refreshState();
    const idx = this.cars.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`车辆 ${id} 不存在`);
    }
    const active = ['available', 'reserved', 'in_use'];
    if (active.includes(this.cars[idx].status)) {
      throw new Error('只能删除非活跃状态（已归还/维护中）的车辆');
    }
    const [removed] = this.cars.splice(idx, 1);
    await this.saveData();
    return removed;
  }

  async createOrder(userId, carId, hours) {
    await this.refreshState();
    const user = this.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("用户不存在");
    }
    if (user.status !== "approved") {
      throw new Error("用户尚未通过认证");
    }
    const car = this.cars.find((item) => item.id === carId);
    if (!car) {
      throw new Error("车辆不存在");
    }
    if (car.status !== "available") {
      throw new Error("车辆当前不可用");
    }
    const order = {
      id: crypto.randomUUID(),
      userId,
      carId,
      hours,
      status: "reserved",
      deposit: this.depositAmount,
      estimatedFee: this.pricePerHour * hours,
      pickupPhotoHash: null,
      returnPhotoHash: null,
      pickupIot: null,
      returnIot: null,
      issueReported: false,
      issueType: null,
      issueDetail: null,
      issueStatus: null,
      issueReportedAt: null,
      issueResolvedAt: null,
      issueResolvedBy: null,
      issueResolveNote: null,
      finalFee: null,
      createdAt: Date.now()
    };
    this.orders.push(order);
    car.status = "reserved";
    await this.ledger.queueTransaction("order_created", {
      orderId: order.id,
      userId,
      carId
    });
    await this.ledger.commitBlock("operator-node", "order-created");
    await this.saveData();
    return order;
  }

  async pickupCar(orderId, pickupPhotoHash, pickupIot) {
    await this.refreshState();
    const order = this.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("订单不存在");
    }
    if (order.status !== "reserved") {
      throw new Error("订单状态不允许取车");
    }
    order.status = "in_use";
    order.pickupPhotoHash = pickupPhotoHash;
    order.pickupIot = pickupIot;
    const car = this.cars.find((item) => item.id === order.carId);
    car.status = "in_use";
    await this.ledger.queueTransaction("car_picked_up", {
      orderId,
      pickupPhotoHash,
      pickupIot
    });
    await this.ledger.commitBlock("insurance-node", "pickup-proof");
    await this.saveData();
    return order;
  }

  async reportIssue(orderId, issueType, detail) {
    await this.refreshState();
    const order = this.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("订单不存在");
    }
    order.issueReported = true;
    order.issueType = issueType || "other";
    order.issueDetail = detail || "";
    order.issueStatus = "pending_dispatcher";
    order.issueReportedAt = Date.now();
    order.issueResolvedAt = null;
    order.issueResolvedBy = null;
    order.issueResolveNote = null;
    const car = this.cars.find((item) => item.id === order.carId);
    if (car && car.status === "in_use") {
      car.status = "maintenance";
    }
    await this.ledger.queueTransaction("issue_reported", {
      orderId,
      issueType,
      detail
    });
    await this.ledger.commitBlock("operator-node", "issue-reported");
    await this.saveData();
    return order;
  }

  async listDispatcherIssues() {
    await this.refreshState();
    return this.orders
      .filter((item) => item.issueReported && item.issueStatus !== "resolved")
      .sort((a, b) => (b.issueReportedAt || b.createdAt) - (a.issueReportedAt || a.createdAt));
  }

  async resolveIssue(orderId, dispatcher, targetStatus, note) {
    await this.refreshState();
    const order = this.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("订单不存在");
    }
    if (!order.issueReported) {
      throw new Error("该订单没有故障上报");
    }
    const car = this.cars.find((item) => item.id === order.carId);
    if (!car) {
      throw new Error("车辆不存在");
    }
    const allowedStatus = ["available", "maintenance"];
    const finalStatus = targetStatus || "maintenance";
    if (!allowedStatus.includes(finalStatus)) {
      throw new Error("处理后的车辆状态不合法");
    }

    car.status = finalStatus;
    order.issueStatus = "resolved";
    order.issueResolvedAt = Date.now();
    order.issueResolvedBy = dispatcher || "dispatcher";
    order.issueResolveNote = note || "";

    const maintenanceLog = {
      id: crypto.randomUUID(),
      carId: car.id,
      dispatcher: order.issueResolvedBy,
      action: "issue_resolved",
      note: `${order.issueType || "故障"}: ${order.issueDetail || ""} ${order.issueResolveNote || ""}`.trim(),
      targetStatus: finalStatus,
      timestamp: Date.now()
    };
    this.maintenanceLogs.push(maintenanceLog);

    await this.ledger.queueTransaction("issue_resolved", {
      orderId,
      carId: car.id,
      dispatcher: order.issueResolvedBy,
      targetStatus: finalStatus,
      note: order.issueResolveNote
    });
    await this.ledger.commitBlock("municipal-node", "issue-resolved");
    await this.saveData();
    return { order, car };
  }

  async returnCar(orderId, returnPhotoHash, returnIot) {
    await this.refreshState();
    const order = this.orders.find((item) => item.id === orderId);
    if (!order) {
      throw new Error("订单不存在");
    }
    if (order.status !== "in_use") {
      throw new Error("订单状态不允许还车");
    }
    order.status = "completed";
    order.returnPhotoHash = returnPhotoHash;
    order.returnIot = returnIot;
    const useHours = Math.max(1, Math.ceil((Date.now() - order.createdAt) / (1000 * 60 * 60)));
    const usageFee = useHours * this.pricePerHour;
    const damageFee = order.issueReported ? this.damageFee : 0;
    order.finalFee = usageFee + damageFee;
    const car = this.cars.find((item) => item.id === order.carId);
    car.status = "available";
    car.battery = Math.max(10, car.battery - Math.floor(Math.random() * 25));
    await this.ledger.queueTransaction("car_returned", {
      orderId,
      returnPhotoHash,
      returnIot,
      finalFee: order.finalFee,
      depositReturned: Math.max(0, order.deposit - damageFee)
    });
    await this.ledger.commitBlock("insurance-node", "return-settlement");
    await this.saveData();
    return order;
  }

  async createMaintenanceLog(carId, dispatcher, action, note, targetStatus, resolvedOrderId) {
    await this.refreshState();
    const car = this.cars.find((item) => item.id === carId);
    if (!car) {
      throw new Error("车辆不存在");
    }
    const allowedStatus = ["available", "reserved", "in_use", "maintenance"];
    if (targetStatus && !allowedStatus.includes(targetStatus)) {
      throw new Error("车辆状态不合法");
    }
    car.status = targetStatus || (action === "repairing" ? "maintenance" : "available");
    if (action === "charged") {
      car.battery = 95;
    }
    const log = {
      id: crypto.randomUUID(),
      carId,
      dispatcher,
      action,
      note,
      targetStatus: car.status,
      timestamp: Date.now()
    };

    if (resolvedOrderId) {
      const issueOrder = this.orders.find((item) => item.id === resolvedOrderId);
      if (issueOrder && issueOrder.issueReported) {
        issueOrder.issueStatus = "resolved";
        issueOrder.issueReported = false;
        issueOrder.issueResolvedAt = Date.now();
        issueOrder.issueResolvedBy = dispatcher || "dispatcher";
        issueOrder.issueResolveNote = note || "";
      }
    }
    this.maintenanceLogs.push(log);
    await this.ledger.queueTransaction("maintenance_updated", log);
    await this.ledger.commitBlock("municipal-node", "maintenance");
    await this.saveData();
    return log;
  }

  async listUserOrders(userId) {
    if (!userId) {
      throw new Error("用户ID不能为空");
    }
    await this.refreshState();
    const user = this.users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("用户不存在");
    }
    return this.orders
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((order) => ({
        ...order,
        returnedSuccessfully: order.status === "completed" && Boolean(order.returnPhotoHash) && Boolean(order.returnIot)
      }));
  }

  async listPendingUsers() {
    await this.refreshState();
    return this.users.filter((item) => item.status === "pending");
  }

  async getOverview() {
    await this.refreshState();
    return {
      users: this.users,
      cars: this.cars,
      orders: this.orders,
      maintenanceLogs: this.maintenanceLogs,
      accounts: this.accounts.map((item) => ({
        id: item.id,
        role: item.role,
        username: item.username,
        displayName: item.displayName,
        createdAt: item.createdAt
      })),
      chainHeight: this.ledger.blocks.length
    };
  }
}

module.exports = CarShareService;
