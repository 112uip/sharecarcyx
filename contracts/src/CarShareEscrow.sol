// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CarShareEscrow - 共享汽车押金托管合约
/// @notice 押金从用户钱包转入合约锁定，完成订单后释放给平台，提交故障退费后原路退回用户
/// @dev 适用于 Hardhat/本地 Ganache 测试网络
contract CarShareEscrow {
    /* ================================================
     *  状态枚举
     * ================================================ */
    // 0: 资金已托管，等待取车
    // 1: 用户已取车，订单进行中
    // 2: 订单正常完成，资金已释放给平台
    // 3: 故障退费，资金已退回用户
    // 4: 管理员取消，资金已退还用户
    enum OrderState { InEscrow, InUse, Completed, Refunded, Cancelled }

    /* ================================================
     *  数据结构
     * ================================================ */
    struct Order {
        bytes32 orderId;      // 订单唯一标识（后端 UUID 的 keccak256 哈希）
        address payableUser;  // 用户钱包地址（退费时转至此）
        uint256 amount;       // 托管金额（wei）
        OrderState state;
        uint256 createdAt;    // 创建时间戳
        uint256 completedAt;  // 完成/退费时间戳
        string  reason;       // 备注（故障描述 / 完成原因）
    }

    /* ================================================
     *  状态变量
     * ================================================ */
    // 系统管理员地址（平台收款钱包）
    address payable public platformWallet;

    // 平台管理员多签阈值（预留扩展）
    uint256 public minApprovalAmount = 0;

    // 订单映射
    mapping(bytes32 => Order) public orders;

    // 用户地址 → 订单ID列表（方便查询）
    mapping(address => bytes32[]) public userOrders;

    // 平台累计收益
    uint256 public platformRevenue;

    // 事件
    event EscrowCreated(bytes32 indexed orderId, address indexed user, uint256 amount, uint256 timestamp);
    event EscrowStarted(bytes32 indexed orderId, uint256 timestamp);
    event EscrowCompleted(bytes32 indexed orderId, uint256 amount, uint256 timestamp);
    event EscrowRefunded(bytes32 indexed orderId, address indexed user, uint256 amount, uint256 timestamp);
    event EscrowCancelled(bytes32 indexed orderId, address indexed user, uint256 amount, uint256 timestamp);
    event PlatformWalletUpdated(address indexed oldWallet, address indexed newWallet);

    /* ================================================
     *  构造函数
     * ================================================ */
    constructor(address _platformWallet) {
        require(_platformWallet != address(0), "Platform wallet cannot be zero address");
        platformWallet = payable(_platformWallet);
    }

    /* ================================================
     *  用户端：创建托管（用户转账入口）
     * ================================================ */
    /// @notice 用户调用此方法存入押金（需配合前端 + 后端验证）
    receive() external payable {
        revert("use createEscrow() to deposit");
    }

    /// @notice 用户调用此方法存入押金（需配合前端 + 后端验证）
    /// @param _orderId        订单ID哈希（防止重复创建）
    /// @param _orderIdRaw     原始订单ID字符串（用于事件日志可读性）
    /// @return success        是否创建成功
    function createEscrow(bytes32 _orderId, string calldata _orderIdRaw) external payable returns (bool success) {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        require(orders[_orderId].createdAt == 0, "Order escrow already exists");
        require(bytes(_orderIdRaw).length > 0, "Order ID cannot be empty");

        orders[_orderId] = Order({
            orderId: _orderId,
            payableUser: msg.sender,
            amount: msg.value,
            state: OrderState.InEscrow,
            createdAt: block.timestamp,
            completedAt: 0,
            reason: ""
        });

        userOrders[msg.sender].push(_orderId);

        emit EscrowCreated(_orderId, msg.sender, msg.value, block.timestamp);
        return true;
    }

    /* ================================================
     *  用户端：取车（状态：InEscrow → InUse）
     * ================================================ */
    /// @notice 用户取车时调用，将状态标记为使用中
    /// @param _orderId 订单ID
    function startUsing(bytes32 _orderId) external {
        Order storage o = orders[_orderId];
        require(o.createdAt > 0, "Order escrow does not exist");
        require(o.payableUser == msg.sender, "Caller is not the payer");
        require(o.state == OrderState.InEscrow, "Order is not in escrow state");

        o.state = OrderState.InUse;
        emit EscrowStarted(_orderId, block.timestamp);
    }

    /* ================================================
     *  用户端：完成订单（触发差额付款后再调用此方法）
     * ================================================ */
    /// @notice 用户点击"完成订单"时调用，将资金从托管释放给平台
    /// @param _orderId    订单ID
    /// @param _note       备注（如"正常完成"）
    function completeEscrow(bytes32 _orderId, string calldata _note) external {
        Order storage o = orders[_orderId];
        require(o.createdAt > 0, "Order escrow does not exist");
        // InUse 和 InEscrow 均可完成（未取车直接完成的边缘情况）
        require(o.state == OrderState.InUse || o.state == OrderState.InEscrow,
                "Order must be in use or escrow state");

        o.state = OrderState.Completed;
        o.completedAt = block.timestamp;
        o.reason = _note;

        // 将托管资金转给平台
        platformRevenue += o.amount;
        (bool ok, ) = platformWallet.call{value: o.amount}("");
        require(ok, "Transfer to platform wallet failed");

        emit EscrowCompleted(_orderId, o.amount, block.timestamp);
    }

    /* ================================================
     *  用户端 / 管理员端：退费（故障退费）
     * ================================================ */
    /// @notice 提交故障并经管理员审核通过后，调用此方法原路退费给用户
    /// @param _orderId    订单ID
    /// @param _reason     退费原因（故障描述）
    function refundEscrow(bytes32 _orderId, string calldata _reason) external {
        Order storage o = orders[_orderId];
        require(o.createdAt > 0, "Order escrow does not exist");
        require(o.state == OrderState.InEscrow || o.state == OrderState.InUse,
                "Order cannot be refunded in current state");

        uint256 refundAmount = o.amount;
        o.state = OrderState.Refunded;
        o.completedAt = block.timestamp;
        o.reason = _reason;

        // 原路退回用户
        (bool ok, ) = o.payableUser.call{value: refundAmount}("");
        require(ok, "Refund to user failed");

        emit EscrowRefunded(_orderId, o.payableUser, refundAmount, block.timestamp);
    }

    /* ================================================
     *  管理员端：取消订单（特殊情况下使用）
     * ================================================ */
    /// @notice 仅平台管理员（合约部署者）可调用
    /// @param _orderId    订单ID
    /// @param _reason     取消原因
    function cancelEscrow(bytes32 _orderId, string calldata _reason) external {
        require(msg.sender == platformWallet, "Only platform wallet can cancel");
        Order storage o = orders[_orderId];
        require(o.createdAt > 0, "Order escrow does not exist");
        require(o.state == OrderState.InEscrow || o.state == OrderState.InUse,
                "Order cannot be cancelled in current state");

        uint256 cancelAmount = o.amount;
        o.state = OrderState.Cancelled;
        o.completedAt = block.timestamp;
        o.reason = _reason;

        (bool ok, ) = o.payableUser.call{value: cancelAmount}("");
        require(ok, "Refund on cancel failed");

        emit EscrowCancelled(_orderId, o.payableUser, cancelAmount, block.timestamp);
    }

    /* ================================================
     *  查询接口
     * ================================================ */
    /// @notice 查询订单托管状态
    function getOrderState(bytes32 _orderId) external view returns (OrderState state, uint256 amount, uint256 createdAt) {
        Order storage o = orders[_orderId];
        return (o.state, o.amount, o.createdAt);
    }

    /// @notice 查询某用户所有托管订单
    function getUserOrders(address _user) external view returns (bytes32[] memory) {
        return userOrders[_user];
    }

    /// @notice 查询合约余额（调试用）
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice 更新平台收款地址（仅平台管理员）
    function updatePlatformWallet(address _newWallet) external {
        require(msg.sender == platformWallet, "Only platform wallet can update");
        require(_newWallet != address(0), "New wallet cannot be zero address");
        emit PlatformWalletUpdated(platformWallet, _newWallet);
        platformWallet = payable(_newWallet);
    }
}
