pragma solidity ^0.8.24;

contract ConsortiumCarShare {
    enum UserStatus {
        None,
        Pending,
        Approved,
        Rejected
    }

    enum CarStatus {
        None,
        Available,
        Reserved,
        InUse,
        Maintenance
    }

    enum OrderStatus {
        None,
        Reserved,
        InUse,
        Completed,
        Cancelled
    }

    struct User {
        address account;
        string name;
        string idCardHash;
        string driverLicenseHash;
        UserStatus status;
        uint256 credit;
    }

    struct Car {
        string carId;
        string model;
        string plate;
        string location;
        uint256 battery;
        CarStatus status;
        bool exists;
    }

    struct Order {
        uint256 id;
        address renter;
        bytes32 carKey;
        uint256 plannedHours;
        uint256 deposit;
        uint256 estimatedFee;
        uint256 finalFee;
        bool issueReported;
        string pickupPhotoHash;
        string pickupIotHash;
        string returnPhotoHash;
        string returnIotHash;
        uint256 createdAt;
        uint256 pickupAt;
        uint256 returnAt;
        OrderStatus status;
    }

    struct MaintenanceLog {
        uint256 id;
        bytes32 carKey;
        address dispatcher;
        string action;
        string note;
        uint256 timestamp;
    }

    address public admin;
    uint256 public depositAmount = 0.2 ether;
    uint256 public pricePerHour = 0.01 ether;
    uint256 public damageFee = 0.03 ether;
    uint256 public nextOrderId = 1;
    uint256 public nextMaintenanceId = 1;

    mapping(address => User) public users;
    mapping(address => bool) public dispatchers;
    mapping(bytes32 => Car) private cars;
    mapping(uint256 => Order) public orders;
    mapping(uint256 => MaintenanceLog) public maintenanceLogs;
    bytes32[] public carKeys;
    uint256[] public orderIds;
    uint256[] public maintenanceIds;

    event IdentitySubmitted(address indexed user, string name);
    event UserApproved(address indexed user, bool approved);
    event CarUpserted(string carId, CarStatus status);
    event OrderCreated(uint256 indexed orderId, address indexed user, string carId);
    event CarPickedUp(uint256 indexed orderId);
    event IssueReported(uint256 indexed orderId, string issueType);
    event CarReturned(uint256 indexed orderId, uint256 finalFee, uint256 refundedAmount);
    event MaintenanceUpdated(uint256 indexed maintenanceId, string carId, string action);

    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    modifier onlyDispatcher() {
        require(dispatchers[msg.sender], "only dispatcher");
        _;
    }

    modifier onlyApprovedUser() {
        require(users[msg.sender].status == UserStatus.Approved, "user not approved");
        _;
    }

    constructor(address[] memory initialDispatchers) {
        admin = msg.sender;
        for (uint256 i = 0; i < initialDispatchers.length; i++) {
            dispatchers[initialDispatchers[i]] = true;
        }
    }

    function setDispatcher(address account, bool allowed) external onlyAdmin {
        dispatchers[account] = allowed;
    }

    function setPricing(uint256 newDepositAmount, uint256 newPricePerHour, uint256 newDamageFee) external onlyAdmin {
        require(newDepositAmount > 0 && newPricePerHour > 0, "invalid pricing");
        depositAmount = newDepositAmount;
        pricePerHour = newPricePerHour;
        damageFee = newDamageFee;
    }

    function submitIdentity(string calldata name, string calldata idCardHash, string calldata driverLicenseHash) external {
        User storage user = users[msg.sender];
        require(user.status == UserStatus.None || user.status == UserStatus.Rejected, "already submitted");
        users[msg.sender] = User({
            account: msg.sender,
            name: name,
            idCardHash: idCardHash,
            driverLicenseHash: driverLicenseHash,
            status: UserStatus.Pending,
            credit: 100
        });
        emit IdentitySubmitted(msg.sender, name);
    }

    function approveUser(address account, bool approved) external onlyAdmin {
        User storage user = users[account];
        require(user.status == UserStatus.Pending, "status invalid");
        user.status = approved ? UserStatus.Approved : UserStatus.Rejected;
        emit UserApproved(account, approved);
    }

    function upsertCar(
        string calldata carId,
        string calldata model,
        string calldata plate,
        string calldata location,
        uint256 battery,
        CarStatus status
    ) external onlyAdmin {
        bytes32 key = _carKey(carId);
        if (!cars[key].exists) {
            carKeys.push(key);
            cars[key].exists = true;
        }
        cars[key].carId = carId;
        cars[key].model = model;
        cars[key].plate = plate;
        cars[key].location = location;
        cars[key].battery = battery;
        cars[key].status = status;
        emit CarUpserted(carId, status);
    }

    function getCar(string calldata carId) external view returns (Car memory) {
        return cars[_carKey(carId)];
    }

    function getCarCount() external view returns (uint256) {
        return carKeys.length;
    }

    function getCarByIndex(uint256 index) external view returns (Car memory) {
        require(index < carKeys.length, "index overflow");
        return cars[carKeys[index]];
    }

    function createOrder(string calldata carId, uint256 plannedHours) external payable onlyApprovedUser returns (uint256) {
        require(plannedHours > 0, "invalid hours");
        require(msg.value == depositAmount, "invalid deposit");
        bytes32 key = _carKey(carId);
        Car storage car = cars[key];
        require(car.exists, "car not exists");
        require(car.status == CarStatus.Available, "car unavailable");

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            renter: msg.sender,
            carKey: key,
            plannedHours: plannedHours,
            deposit: msg.value,
            estimatedFee: plannedHours * pricePerHour,
            finalFee: 0,
            issueReported: false,
            pickupPhotoHash: "",
            pickupIotHash: "",
            returnPhotoHash: "",
            returnIotHash: "",
            createdAt: block.timestamp,
            pickupAt: 0,
            returnAt: 0,
            status: OrderStatus.Reserved
        });
        orderIds.push(orderId);
        car.status = CarStatus.Reserved;
        emit OrderCreated(orderId, msg.sender, carId);
        return orderId;
    }

    function pickupCar(uint256 orderId, string calldata pickupPhotoHash, string calldata pickupIotHash) external {
        Order storage order = orders[orderId];
        require(order.renter == msg.sender, "not renter");
        require(order.status == OrderStatus.Reserved, "status invalid");
        order.pickupPhotoHash = pickupPhotoHash;
        order.pickupIotHash = pickupIotHash;
        order.pickupAt = block.timestamp;
        order.status = OrderStatus.InUse;
        cars[order.carKey].status = CarStatus.InUse;
        emit CarPickedUp(orderId);
    }

    function reportIssue(uint256 orderId, string calldata issueType, string calldata detail) external {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.InUse, "status invalid");
        require(order.renter == msg.sender || dispatchers[msg.sender] || msg.sender == admin, "no permission");
        order.issueReported = true;
        emit IssueReported(orderId, string(abi.encodePacked(issueType, ":", detail)));
    }

    function returnCar(
        uint256 orderId,
        string calldata returnPhotoHash,
        string calldata returnIotHash,
        uint256 actualHours,
        bool adminConfirmedDamage
    ) external payable {
        Order storage order = orders[orderId];
        require(order.renter == msg.sender || msg.sender == admin, "no permission");
        require(order.status == OrderStatus.InUse, "status invalid");
        uint256 billedHours = actualHours == 0 ? 1 : actualHours;
        uint256 usageFee = billedHours * pricePerHour;
        uint256 penalty = (order.issueReported || adminConfirmedDamage) ? damageFee : 0;
        uint256 finalFee = usageFee + penalty;
        uint256 refundedAmount = 0;

        order.returnPhotoHash = returnPhotoHash;
        order.returnIotHash = returnIotHash;
        order.returnAt = block.timestamp;
        order.finalFee = finalFee;
        order.status = OrderStatus.Completed;
        cars[order.carKey].status = CarStatus.Available;

        if (order.deposit > finalFee) {
            refundedAmount = order.deposit - finalFee;
            (bool ok, ) = payable(order.renter).call{value: refundedAmount}("");
            require(ok, "refund failed");
        } else if (finalFee > order.deposit) {
            uint256 extra = finalFee - order.deposit;
            require(msg.value == extra, "missing extra payment");
        } else {
            require(msg.value == 0, "unexpected value");
        }

        emit CarReturned(orderId, finalFee, refundedAmount);
    }

    function updateMaintenance(
        string calldata carId,
        string calldata action,
        string calldata note,
        uint256 newBattery,
        CarStatus newStatus
    ) external onlyDispatcher returns (uint256) {
        bytes32 key = _carKey(carId);
        Car storage car = cars[key];
        require(car.exists, "car not exists");
        car.battery = newBattery;
        car.status = newStatus;

        uint256 maintenanceId = nextMaintenanceId++;
        maintenanceLogs[maintenanceId] = MaintenanceLog({
            id: maintenanceId,
            carKey: key,
            dispatcher: msg.sender,
            action: action,
            note: note,
            timestamp: block.timestamp
        });
        maintenanceIds.push(maintenanceId);
        emit MaintenanceUpdated(maintenanceId, carId, action);
        return maintenanceId;
    }

    function getOrderCount() external view returns (uint256) {
        return orderIds.length;
    }

    function getMaintenanceCount() external view returns (uint256) {
        return maintenanceIds.length;
    }

    function withdraw(address payable to, uint256 amount) external onlyAdmin {
        require(address(this).balance >= amount, "insufficient");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "withdraw failed");
    }

    function _carKey(string memory carId) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(carId));
    }
}
