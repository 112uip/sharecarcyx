const mysql = require('mysql2/promise');

class DataStore {
  constructor() {
    this.config = {
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'car_share'
    };
    this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      charset: 'utf8mb4',
      connectionLimit: 10
    });
  }

  async init() {
    const adminPool = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      charset: 'utf8mb4',
      connectionLimit: 3
    });
    await adminPool.query(`CREATE DATABASE IF NOT EXISTS \`${this.config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await adminPool.end();

    // 创建基础表（如果不存在）
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        id_card VARCHAR(64) NOT NULL,
        driver_license VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        credit INT NOT NULL,
        created_at BIGINT NOT NULL,
        wallet_address VARCHAR(64) NULL,
        id_card_photo VARCHAR(128) NULL,
        driver_license_photo VARCHAR(128) NULL,
        account_id VARCHAR(64) NULL
      )
    `);

    // 确保 users 表有所有需要的列
    await this.ensureColumn('users', 'wallet_address', 'VARCHAR(64) NULL');
    await this.ensureColumn('users', 'id_card_photo', 'VARCHAR(128) NULL');
    await this.ensureColumn('users', 'id_card_back_photo', 'VARCHAR(128) NULL');
    await this.ensureColumn('users', 'driver_license_photo', 'VARCHAR(128) NULL');
    await this.ensureColumn('users', 'account_id', 'VARCHAR(64) NULL');

    // 创建 cars 表（如果不存在）
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id VARCHAR(32) PRIMARY KEY,
        model VARCHAR(128) NOT NULL,
        plate VARCHAR(32) NOT NULL,
        battery INT NOT NULL,
        location VARCHAR(120) NOT NULL,
        status VARCHAR(32) NOT NULL,
        seats INT NOT NULL DEFAULT 5,
        price_per_hour INT NOT NULL DEFAULT 35,
        brand VARCHAR(64) NULL,
        type VARCHAR(64) NULL
      )
    `);

    // 确保 cars 表有所有需要的列
    await this.ensureColumn('cars', 'seats', 'INT NOT NULL DEFAULT 5');
    await this.ensureColumn('cars', 'price_per_hour', 'INT NOT NULL DEFAULT 35');
    await this.ensureColumn('cars', 'brand', 'VARCHAR(64) NULL');
    await this.ensureColumn('cars', 'type', 'VARCHAR(64) NULL');

    // 创建 orders 表（如果不存在）
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        car_id VARCHAR(32) NOT NULL,
        hours INT NOT NULL,
        status VARCHAR(32) NOT NULL,
        deposit INT NOT NULL,
        estimated_fee INT NOT NULL,
        pickup_photo_hash TEXT NULL,
        return_photo_hash TEXT NULL,
        pickup_iot TEXT NULL,
        return_iot TEXT NULL,
        issue_reported TINYINT(1) NOT NULL DEFAULT 0,
        issue_type VARCHAR(64) NULL,
        issue_detail TEXT NULL,
        issue_status VARCHAR(32) NULL,
        issue_reported_at BIGINT NULL,
        issue_resolved_at BIGINT NULL,
        issue_resolved_by VARCHAR(128) NULL,
        issue_resolve_note TEXT NULL,
        final_fee INT NULL,
        refund_requested TINYINT(1) NOT NULL DEFAULT 0,
        refund_status VARCHAR(32) NULL,
        refund_dispatcher_approved TINYINT(1) NULL,
        refund_admin_approved TINYINT(1) NULL,
        refund_amount INT NULL,
        refund_note TEXT NULL,
        refund_processed_at BIGINT NULL,
        refund_processed_by VARCHAR(128) NULL,
        eth_refund_tx_hash VARCHAR(128) NULL,
        eth_refund_to VARCHAR(64) NULL,
        eth_refund_amount DECIMAL(16,8) NULL,
        usage_fee_paid TINYINT(1) NOT NULL DEFAULT 0,
        usage_fee_tx_hash VARCHAR(128) NULL,
        deposit_tx_hash VARCHAR(128) NULL,
        created_at BIGINT NOT NULL
      )
    `);

    // 确保 orders 表有所有需要的列
    await this.ensureColumn('orders', 'issue_type', 'VARCHAR(64) NULL');
    await this.ensureColumn('orders', 'issue_detail', 'TEXT NULL');
    await this.ensureColumn('orders', 'issue_status', 'VARCHAR(32) NULL');
    await this.ensureColumn('orders', 'issue_reported_at', 'BIGINT NULL');
    await this.ensureColumn('orders', 'issue_resolved_at', 'BIGINT NULL');
    await this.ensureColumn('orders', 'issue_resolved_by', 'VARCHAR(128) NULL');
    await this.ensureColumn('orders', 'issue_resolve_note', 'TEXT NULL');
    await this.ensureColumn('orders', 'refund_requested', 'TINYINT(1) NOT NULL DEFAULT 0');
    await this.ensureColumn('orders', 'refund_status', 'VARCHAR(32) NULL');
    await this.ensureColumn('orders', 'refund_dispatcher_approved', 'TINYINT(1) NULL');
    await this.ensureColumn('orders', 'refund_admin_approved', 'TINYINT(1) NULL');
    await this.ensureColumn('orders', 'refund_amount', 'INT NULL');
    await this.ensureColumn('orders', 'refund_note', 'TEXT NULL');
    await this.ensureColumn('orders', 'refund_processed_at', 'BIGINT NULL');
    await this.ensureColumn('orders', 'refund_processed_by', 'VARCHAR(128) NULL');
    await this.ensureColumn('orders', 'eth_refund_tx_hash', 'VARCHAR(128) NULL');
    await this.ensureColumn('orders', 'eth_refund_to', 'VARCHAR(64) NULL');
    await this.ensureColumn('orders', 'eth_refund_amount', 'DECIMAL(16,8) NULL');
    await this.ensureColumn('orders', 'usage_fee_paid', 'TINYINT(1) NOT NULL DEFAULT 0');
    await this.ensureColumn('orders', 'usage_fee_tx_hash', 'VARCHAR(128) NULL');
    await this.ensureColumn('orders', 'deposit_tx_hash', 'VARCHAR(128) NULL');
    await this.ensureColumn('orders', 'escrow_deposit_tx_hash', 'VARCHAR(128) NULL');
    await this.ensureColumn('orders', 'escrow_completed_tx_hash', 'VARCHAR(128) NULL');
    await this.ensureColumn('orders', 'escrow_refund_tx_hash', 'VARCHAR(128) NULL');
    // 退押金相关字段
    await this.ensureColumn('orders', 'deposit_refund_requested', 'TINYINT(1) NOT NULL DEFAULT 0');
    await this.ensureColumn('orders', 'deposit_refund_status', 'VARCHAR(32) NULL');
    await this.ensureColumn('orders', 'deposit_refund_reason', 'VARCHAR(255) NULL');
    await this.ensureColumn('orders', 'deposit_refund_applied_at', 'BIGINT NULL');
    await this.ensureColumn('orders', 'deposit_refund_processed_at', 'BIGINT NULL');
    await this.ensureColumn('orders', 'deposit_refund_processed_by', 'VARCHAR(128) NULL');
    await this.ensureColumn('orders', 'deposit_refund_note', 'TEXT NULL');
    await this.ensureColumn('orders', 'deposit_refund_tx_hash', 'VARCHAR(128) NULL');
    await this.ensureColumn('orders', 'deposit_refund_to', 'VARCHAR(64) NULL');
    await this.ensureColumn('orders', 'deposit_escrow_refund_tx_hash', 'VARCHAR(128) NULL');
    await this.ensureColumn('orders', 'deposit_eth_amount', 'DECIMAL(16,8) NULL');

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id VARCHAR(64) PRIMARY KEY,
        car_id VARCHAR(32) NOT NULL,
        dispatcher VARCHAR(128) NOT NULL,
        action VARCHAR(64) NOT NULL,
        note TEXT NULL,
        timestamp BIGINT NOT NULL
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id VARCHAR(64) PRIMARY KEY,
        role VARCHAR(32) NOT NULL,
        username VARCHAR(64) NOT NULL,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(128) NOT NULL,
        created_at BIGINT NOT NULL,
        UNIQUE KEY uniq_role_username (role, username)
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS chain_blocks (
        block_index INT PRIMARY KEY,
        previous_hash VARCHAR(128) NOT NULL,
        timestamp BIGINT NOT NULL,
        validator VARCHAR(64) NOT NULL,
        reason VARCHAR(64) NULL,
        hash VARCHAR(128) NOT NULL
      )
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS chain_transactions (
        id VARCHAR(64) PRIMARY KEY,
        block_index INT NULL,
        type VARCHAR(64) NOT NULL,
        payload JSON NOT NULL,
        timestamp BIGINT NOT NULL,
        KEY idx_block_index (block_index)
      )
    `);
  }

  async ensureColumn(tableName, columnName, columnDefinition) {
    const [rows] = await this.pool.query(
      `SELECT COUNT(1) AS cnt
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [this.config.database, tableName, columnName]
    );
    if (Number(rows[0]?.cnt || 0) === 0) {
      await this.pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
    }
  }

  async getUsers() {
    const [rows] = await this.pool.query(
      `SELECT id, name, id_card, driver_license, status, credit, created_at, wallet_address, id_card_photo, id_card_back_photo, driver_license_photo, account_id FROM users ORDER BY created_at ASC`
    );
    return rows.map((item) => ({
      id: item.id,
      name: item.name,
      idCard: item.id_card,
      driverLicense: item.driver_license,
      status: item.status,
      credit: item.credit,
      createdAt: Number(item.created_at),
      walletAddress: item.wallet_address || null,
      idCardPhoto: item.id_card_photo || null,
      idCardBackPhoto: item.id_card_back_photo || null,
      driverLicensePhoto: item.driver_license_photo || null,
      accountId: item.account_id || null
    }));
  }

  async saveUsers(users) {
    await this.pool.query('DELETE FROM users');
    for (const user of users) {
      await this.pool.query(
        `INSERT INTO users (id, name, id_card, driver_license, status, credit, created_at, wallet_address, id_card_photo, id_card_back_photo, driver_license_photo, account_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.name,
          user.idCard,
          user.driverLicense,
          user.status,
          user.credit,
          Number(user.createdAt || Date.now()),
          user.walletAddress || null,
          user.idCardPhoto || null,
          user.idCardBackPhoto || null,
          user.driverLicensePhoto || null,
          user.accountId || null
        ]
      );
    }
  }

  async getCars() {
    let rows;
    try {
      [rows] = await this.pool.query(
        `SELECT id, model, plate, battery, location, status, seats, price_per_hour, brand, type FROM cars ORDER BY id ASC`
      );
    } catch (err) {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        [rows] = await this.pool.query(
          `SELECT id, model, plate, battery, location, status FROM cars ORDER BY id ASC`
        );
      } else {
        throw err;
      }
    }
    return rows.map((item) => ({
      id: item.id,
      model: item.model,
      plate: item.plate,
      battery: item.battery,
      location: item.location,
      status: item.status,
      seats: item.seats != null ? Number(item.seats) : 5,
      pricePerHour: item.price_per_hour != null ? Number(item.price_per_hour) : 35,
      brand: item.brand || '',
      type: item.type || ''
    }));
  }

  async saveCars(cars) {
    await this.pool.query('DELETE FROM cars');
    for (const car of cars) {
      await this.pool.query(
        `INSERT INTO cars (id, model, plate, battery, location, status, seats, price_per_hour, brand, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          car.id,
          car.model,
          car.plate,
          car.battery,
          car.location,
          car.status,
          car.seats != null ? Number(car.seats) : 5,
          car.pricePerHour != null ? Number(car.pricePerHour) : 35,
          car.brand || null,
          car.type || null
        ]
      );
    }
  }

  async getOrders() {
    const [rows] = await this.pool.query(
      `SELECT id, user_id, car_id, hours, status, deposit, estimated_fee, pickup_photo_hash, return_photo_hash,
              pickup_iot, return_iot, issue_reported, issue_type, issue_detail, issue_status, issue_reported_at,
              issue_resolved_at, issue_resolved_by, issue_resolve_note, final_fee, created_at,
              refund_requested, refund_status, refund_dispatcher_approved, refund_admin_approved,
              refund_amount, refund_note, refund_processed_at, refund_processed_by,
              eth_refund_tx_hash, eth_refund_to, eth_refund_amount,
              usage_fee_paid, usage_fee_tx_hash, deposit_tx_hash,
              escrow_deposit_tx_hash, escrow_completed_tx_hash, escrow_refund_tx_hash,
              deposit_refund_requested, deposit_refund_status, deposit_refund_reason,
              deposit_refund_applied_at, deposit_refund_processed_at, deposit_refund_processed_by,
              deposit_refund_note, deposit_refund_tx_hash, deposit_refund_to,
              deposit_escrow_refund_tx_hash, deposit_eth_amount
       FROM orders ORDER BY created_at ASC`
    );
    return rows.map((item) => ({
      id: item.id,
      userId: item.user_id,
      carId: item.car_id,
      hours: item.hours,
      status: item.status,
      deposit: item.deposit,
      estimatedFee: item.estimated_fee,
      pickupPhotoHash: item.pickup_photo_hash,
      returnPhotoHash: item.return_photo_hash,
      pickupIot: item.pickup_iot,
      returnIot: item.return_iot,
      issueReported: Boolean(item.issue_reported),
      issueType: item.issue_type,
      issueDetail: item.issue_detail,
      issueStatus: item.issue_status,
      issueReportedAt: item.issue_reported_at ? Number(item.issue_reported_at) : null,
      issueResolvedAt: item.issue_resolved_at ? Number(item.issue_resolved_at) : null,
      issueResolvedBy: item.issue_resolved_by,
      issueResolveNote: item.issue_resolve_note,
      finalFee: item.final_fee,
      refundRequested: item.refund_requested ? true : false,
      refundStatus: item.refund_status || null,
      refundDispatcherApproved: item.refund_dispatcher_approved !== null && item.refund_dispatcher_approved !== undefined ? (item.refund_dispatcher_approved ? true : false) : null,
      refundAdminApproved: item.refund_admin_approved !== null && item.refund_admin_approved !== undefined ? (item.refund_admin_approved ? true : false) : null,
      refundAmount: item.refund_amount,
      refundNote: item.refund_note || null,
      refundProcessedAt: item.refund_processed_at ? Number(item.refund_processed_at) : null,
      refundProcessedBy: item.refund_processed_by || null,
      ethRefundTxHash: item.eth_refund_tx_hash || null,
      ethRefundTo: item.eth_refund_to || null,
      ethRefundAmount: item.eth_refund_amount ? Number(item.eth_refund_amount) : null,
      usageFeePaid: Boolean(item.usage_fee_paid),
      usageFeeTxHash: item.usage_fee_tx_hash || null,
      depositTxHash: item.deposit_tx_hash || null,
      escrowDepositTxHash: item.escrow_deposit_tx_hash || null,
      escrowCompletedTxHash: item.escrow_completed_tx_hash || null,
      escrowRefundTxHash: item.escrow_refund_tx_hash || null,
      // 退押金字段
      depositRefundRequested: Boolean(item.deposit_refund_requested),
      depositRefundStatus: item.deposit_refund_status || null,
      depositRefundReason: item.deposit_refund_reason || null,
      depositRefundAppliedAt: item.deposit_refund_applied_at ? Number(item.deposit_refund_applied_at) : null,
      depositRefundProcessedAt: item.deposit_refund_processed_at ? Number(item.deposit_refund_processed_at) : null,
      depositRefundProcessedBy: item.deposit_refund_processed_by || null,
      depositRefundNote: item.deposit_refund_note || null,
      depositRefundTxHash: item.deposit_refund_tx_hash || null,
      depositRefundTo: item.deposit_refund_to || null,
      depositEscrowRefundTxHash: item.deposit_escrow_refund_tx_hash || null,
      depositEthAmount: item.deposit_eth_amount ? Number(item.deposit_eth_amount) : null,
      createdAt: Number(item.created_at)
    }));
  }

  async saveOrders(orders) {
    await this.pool.query('DELETE FROM orders');
    const orderColumns = [
      'id',
      'user_id',
      'car_id',
      'hours',
      'status',
      'deposit',
      'estimated_fee',
      'pickup_photo_hash',
      'return_photo_hash',
      'pickup_iot',
      'return_iot',
      'issue_reported',
      'issue_type',
      'issue_detail',
      'issue_status',
      'issue_reported_at',
      'issue_resolved_at',
      'issue_resolved_by',
      'issue_resolve_note',
      'final_fee',
      'created_at',
      'refund_requested',
      'refund_status',
      'refund_dispatcher_approved',
      'refund_admin_approved',
      'refund_amount',
      'refund_note',
      'refund_processed_at',
      'refund_processed_by',
      'eth_refund_tx_hash',
      'eth_refund_to',
      'eth_refund_amount',
      'usage_fee_paid',
      'usage_fee_tx_hash',
      'deposit_tx_hash',
      'escrow_deposit_tx_hash',
      'escrow_completed_tx_hash',
      'escrow_refund_tx_hash',
      // 退押金字段
      'deposit_refund_requested',
      'deposit_refund_status',
      'deposit_refund_reason',
      'deposit_refund_applied_at',
      'deposit_refund_processed_at',
      'deposit_refund_processed_by',
      'deposit_refund_note',
      'deposit_refund_tx_hash',
      'deposit_refund_to',
      'deposit_escrow_refund_tx_hash',
      'deposit_eth_amount'
    ];
    const placeholders = orderColumns.map(() => '?').join(', ');
    const insertSql = `INSERT INTO orders (${orderColumns.join(', ')}) VALUES (${placeholders})`;

    for (const order of orders) {
      const hours = Number(order.hours);
      const deposit = Number(order.deposit);
      const estimatedFee = Number(order.estimatedFee);
      const values = [
        order.id,
        order.userId,
        order.carId,
        Number.isFinite(hours) ? hours : 0,
        order.status,
        Number.isFinite(deposit) ? deposit : 0,
        Number.isFinite(estimatedFee) ? estimatedFee : 0,
        order.pickupPhotoHash ?? null,
        order.returnPhotoHash ?? null,
        order.pickupIot ?? null,
        order.returnIot ?? null,
        order.issueReported ? 1 : 0,
        order.issueType ?? null,
        order.issueDetail ?? null,
        order.issueStatus ?? null,
        order.issueReportedAt != null ? Number(order.issueReportedAt) : null,
        order.issueResolvedAt != null ? Number(order.issueResolvedAt) : null,
        order.issueResolvedBy ?? null,
        order.issueResolveNote ?? null,
        order.finalFee == null ? null : Number(order.finalFee),
        Number(order.createdAt) || Date.now(),
        order.refundRequested ? 1 : 0,
        order.refundStatus ?? null,
        order.refundDispatcherApproved !== null && order.refundDispatcherApproved !== undefined
          ? (order.refundDispatcherApproved ? 1 : 0)
          : null,
        order.refundAdminApproved !== null && order.refundAdminApproved !== undefined
          ? (order.refundAdminApproved ? 1 : 0)
          : null,
        order.refundAmount ?? null,
        order.refundNote ?? null,
        order.refundProcessedAt != null ? Number(order.refundProcessedAt) : null,
        order.refundProcessedBy ?? null,
        order.ethRefundTxHash ?? null,
        order.ethRefundTo ?? null,
        order.ethRefundAmount != null && order.ethRefundAmount !== undefined ? Number(order.ethRefundAmount) : null,
        order.usageFeePaid ? 1 : 0,
        order.usageFeeTxHash ?? null,
        order.depositTxHash ?? null,
        order.escrowDepositTxHash ?? null,
        order.escrowCompletedTxHash ?? null,
        order.escrowRefundTxHash ?? null,
        // 退押金字段值
        order.depositRefundRequested ? 1 : 0,
        order.depositRefundStatus ?? null,
        order.depositRefundReason ?? null,
        order.depositRefundAppliedAt != null ? Number(order.depositRefundAppliedAt) : null,
        order.depositRefundProcessedAt != null ? Number(order.depositRefundProcessedAt) : null,
        order.depositRefundProcessedBy ?? null,
        order.depositRefundNote ?? null,
        order.depositRefundTxHash ?? null,
        order.depositRefundTo ?? null,
        order.depositEscrowRefundTxHash ?? null,
        order.depositEthAmount != null && order.depositEthAmount !== undefined ? Number(order.depositEthAmount) : null
      ];
      if (values.length !== orderColumns.length) {
        throw new Error(
          `saveOrders: 列数(${orderColumns.length})与值数(${values.length})不一致，请检查 dataStore.saveOrders`
        );
      }
      await this.pool.query(insertSql, values);
    }
  }

  async getMaintenanceLogs() {
    const [rows] = await this.pool.query(
      `SELECT id, car_id, dispatcher, action, note, timestamp FROM maintenance_logs ORDER BY timestamp ASC`
    );
    return rows.map((item) => ({
      id: item.id,
      carId: item.car_id,
      dispatcher: item.dispatcher,
      action: item.action,
      note: item.note,
      timestamp: Number(item.timestamp)
    }));
  }

  async saveMaintenanceLogs(logs) {
    await this.pool.query('DELETE FROM maintenance_logs');
    for (const log of logs) {
      await this.pool.query(
        `INSERT INTO maintenance_logs (id, car_id, dispatcher, action, note, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [log.id, log.carId, log.dispatcher, log.action, log.note, Number(log.timestamp)]
      );
    }
  }

  async getAccounts() {
    const [rows] = await this.pool.query(
      `SELECT id, role, username, password, display_name, created_at FROM accounts ORDER BY created_at ASC`
    );
    return rows.map((item) => ({
      id: item.id,
      role: item.role,
      username: item.username,
      password: item.password,
      displayName: item.display_name,
      createdAt: Number(item.created_at)
    }));
  }

  async saveAccounts(accounts) {
    await this.pool.query('DELETE FROM accounts');
    for (const account of accounts) {
      await this.pool.query(
        `INSERT INTO accounts (id, role, username, password, display_name, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          account.id,
          account.role,
          account.username,
          account.password,
          account.displayName,
          Number(account.createdAt)
        ]
      );
    }
  }

  async savePendingTransaction(tx) {
    await this.pool.query(
      `INSERT IGNORE INTO chain_transactions (id, block_index, type, payload, timestamp)
       VALUES (?, ?, ?, ?, ?)`,
      [tx.id, null, tx.type, JSON.stringify(tx.payload), Number(tx.timestamp)]
    );
  }

  async saveBlock(block) {
    await this.pool.query(
      `INSERT IGNORE INTO chain_blocks (block_index, previous_hash, timestamp, validator, reason, hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [block.index, block.previousHash, Number(block.timestamp), block.validator, block.reason || null, block.hash]
    );
  }

  async attachTransactionsToBlock(txIds, blockIndex) {
    if (!txIds.length) {
      return;
    }
    const inList = txIds.map(() => '?').join(', ');
    await this.pool.query(
      `UPDATE chain_transactions SET block_index = ? WHERE id IN (${inList})`,
      [blockIndex, ...txIds]
    );
  }

  async getBlocksWithTransactions() {
    const [blockRows] = await this.pool.query(
      `SELECT block_index, previous_hash, timestamp, validator, reason, hash
       FROM chain_blocks ORDER BY block_index ASC`
    );
    const [txRows] = await this.pool.query(
      `SELECT id, block_index, type, payload, timestamp
       FROM chain_transactions ORDER BY timestamp ASC`
    );

    const txMap = new Map();
    for (const tx of txRows) {
      if (tx.block_index === null || tx.block_index === undefined) {
        continue;
      }
      if (!txMap.has(tx.block_index)) {
        txMap.set(tx.block_index, []);
      }
      txMap.get(tx.block_index).push({
        id: tx.id,
        type: tx.type,
        payload: typeof tx.payload === 'string' ? JSON.parse(tx.payload) : tx.payload,
        timestamp: Number(tx.timestamp)
      });
    }

    return blockRows.map((block) => ({
      index: Number(block.block_index),
      previousHash: block.previous_hash,
      timestamp: Number(block.timestamp),
      validator: block.validator,
      reason: block.reason,
      transactions: txMap.get(Number(block.block_index)) || [],
      hash: block.hash
    }));
  }
}

module.exports = DataStore;
