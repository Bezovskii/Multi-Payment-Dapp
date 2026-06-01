// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract MultiPayment {
    enum PaymentType {
        Direct,
        Escrow
    }

    enum OrderStatus {
        InEscrow,
        Disputed,
        Completed,
        Refunded
    }

    struct Order {
        uint256 id;
        address buyer;
        address seller;
        address token; // address(0) = ETH, otherwise ERC20
        uint256 amount;
        PaymentType paymentType;
        OrderStatus status;
        bool exists;
    }

    uint256 public nextOrderId = 1;
    address public arbitrator;

    mapping(uint256 => Order) public orderById;

    event DirectPaymentCreated(uint256 indexed id, address indexed buyer, address indexed seller, address token, uint256 amount);
    event EscrowPaymentCreated(uint256 indexed id, address indexed buyer, address indexed seller, address token, uint256 amount);
    event PaymentReceivedConfirmed(uint256 indexed id, address indexed seller, address indexed buyer, address token, uint256 amount);
    event EscrowPaymentRefunded(uint256 indexed id, address indexed buyer, address indexed seller, address token, uint256 amount);
    event DisputeOpened(uint256 indexed id, address indexed openedBy);
    event DisputeResolved(uint256 indexed id, address indexed resolver, bool releasedToSeller, address token, uint256 amount);

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "not arbitrator");
        _;
    }

    constructor(address _arbitrator) {
        require(_arbitrator != address(0), "invalid arbitrator");
        arbitrator = _arbitrator;
    }

    function createDirectPayment(address seller) external payable {
        require(seller != address(0), "invalid seller");
        require(msg.value > 0, "amount must be more than 0");

        uint256 orderId = nextOrderId++;

        orderById[orderId] = Order({
            id: orderId,
            buyer: msg.sender,
            seller: seller,
            token: address(0),
            amount: msg.value,
            paymentType: PaymentType.Direct,
            status: OrderStatus.Completed,
            exists: true
        });

        (bool success, ) = payable(seller).call{value: msg.value}("");
        require(success, "transfer failed");

        emit DirectPaymentCreated(orderId, msg.sender, seller, address(0), msg.value);
    }

    function createEscrowPayment(address seller) external payable {
        require(seller != address(0), "invalid seller");
        require(msg.value > 0, "amount must be more than 0");

        uint256 orderId = nextOrderId++;

        orderById[orderId] = Order({
            id: orderId,
            buyer: msg.sender,
            seller: seller,
            token: address(0),
            amount: msg.value,
            paymentType: PaymentType.Escrow,
            status: OrderStatus.InEscrow,
            exists: true
        });

        emit EscrowPaymentCreated(orderId, msg.sender, seller, address(0), msg.value);
    }

    function createERC20DirectPayment(address seller, address token, uint256 amount) external {
        require(seller != address(0), "invalid seller");
        require(token != address(0), "invalid token");
        require(amount > 0, "amount must be more than 0");

        IERC20 erc20 = IERC20(token);

        require(erc20.balanceOf(msg.sender) >= amount, "balance too low");
        require(erc20.allowance(msg.sender, address(this)) >= amount, "allowance too low");

        uint256 orderId = nextOrderId++;

        orderById[orderId] = Order({
            id: orderId,
            buyer: msg.sender,
            seller: seller,
            token: token,
            amount: amount,
            paymentType: PaymentType.Direct,
            status: OrderStatus.Completed,
            exists: true
        });

        bool success = erc20.transferFrom(msg.sender, seller, amount);
        require(success, "transfer failed");

        emit DirectPaymentCreated(orderId, msg.sender, seller, token, amount);
    }

    function createERC20EscrowPayment(address seller, address token, uint256 amount) external {
        require(seller != address(0), "invalid seller");
        require(token != address(0), "invalid token");
        require(amount > 0, "amount must be more than 0");

        IERC20 erc20 = IERC20(token);

        require(erc20.balanceOf(msg.sender) >= amount, "balance too low");
        require(erc20.allowance(msg.sender, address(this)) >= amount, "allowance too low");

        uint256 orderId = nextOrderId++;

        orderById[orderId] = Order({
            id: orderId,
            buyer: msg.sender,
            seller: seller,
            token: token,
            amount: amount,
            paymentType: PaymentType.Escrow,
            status: OrderStatus.InEscrow,
            exists: true
        });

        bool success = erc20.transferFrom(msg.sender, address(this), amount);
        require(success, "transfer failed");

        emit EscrowPaymentCreated(orderId, msg.sender, seller, token, amount);
    }

    function confirmReceipt(uint256 orderId) external {
        Order storage currentOrder = orderById[orderId];

        require(currentOrder.exists, "order does not exist");
        require(currentOrder.paymentType == PaymentType.Escrow, "only escrow");
        require(currentOrder.status == OrderStatus.InEscrow, "not in escrow");
        require(msg.sender == currentOrder.buyer, "only buyer");

        currentOrder.status = OrderStatus.Completed;

        _payout(currentOrder.token, currentOrder.seller, currentOrder.amount);

        emit PaymentReceivedConfirmed(orderId, currentOrder.seller, currentOrder.buyer, currentOrder.token, currentOrder.amount);
    }

    function refund(uint256 orderId) external {
        Order storage currentOrder = orderById[orderId];

        require(currentOrder.exists, "order does not exist");
        require(currentOrder.paymentType == PaymentType.Escrow, "only escrow");
        require(currentOrder.status == OrderStatus.InEscrow, "not in escrow");
        require(msg.sender == currentOrder.seller, "only seller can refund");

        currentOrder.status = OrderStatus.Refunded;

        _payout(currentOrder.token, currentOrder.buyer, currentOrder.amount);

        emit EscrowPaymentRefunded(orderId, currentOrder.buyer, currentOrder.seller, currentOrder.token, currentOrder.amount);
    }

    function openDispute(uint256 orderId) external {
        Order storage currentOrder = orderById[orderId];

        require(currentOrder.exists, "order does not exist");
        require(currentOrder.paymentType == PaymentType.Escrow, "only escrow");
        require(currentOrder.status == OrderStatus.InEscrow, "not in escrow");

        require(
            msg.sender == currentOrder.buyer || msg.sender == currentOrder.seller,
            "only participant"
        );

        currentOrder.status = OrderStatus.Disputed;

        emit DisputeOpened(orderId, msg.sender);
    }

    function resolveDispute(uint256 orderId, bool releaseToSeller) external onlyArbitrator {
        Order storage currentOrder = orderById[orderId];

        require(currentOrder.exists, "order does not exist");
        require(currentOrder.paymentType == PaymentType.Escrow, "only escrow");
        require(currentOrder.status == OrderStatus.Disputed, "not disputed");

        if (releaseToSeller) {
            currentOrder.status = OrderStatus.Completed;
            _payout(currentOrder.token, currentOrder.seller, currentOrder.amount);
        } else {
            currentOrder.status = OrderStatus.Refunded;
            _payout(currentOrder.token, currentOrder.buyer, currentOrder.amount);
        }

        emit DisputeResolved(orderId, msg.sender, releaseToSeller, currentOrder.token, currentOrder.amount);
    }

    function _payout(address token, address receiver, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = payable(receiver).call{value: amount}("");
            require(success, "transfer failed");
        } else {
            bool success = IERC20(token).transfer(receiver, amount);
            require(success, "transfer failed");
        }
    }
}