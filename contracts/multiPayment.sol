// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
        uint256 amount;
        PaymentType paymentType;
        OrderStatus status;
        bool exists;
    }

    uint256 public nextOrderId = 1;
    address public arbitrator;

    mapping(uint256 => Order) public orderById;

    event DirectPaymentCreated(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event EscrowPaymentCreated(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event PaymentReceivedConfirmed(
        uint256 indexed id,
        address indexed seller,
        address indexed buyer,
        uint256 amount
    );

    event EscrowPaymentRefunded(
        uint256 indexed id,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event DisputeOpened(
        uint256 indexed id,
        address indexed openedBy
    );

    event DisputeResolved(
        uint256 indexed id,
        address indexed resolver,
        bool releasedToSeller,
        uint256 amount
    );

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

        uint256 orderId = nextOrderId;
        nextOrderId++;

        orderById[orderId] = Order({
            id: orderId,
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            paymentType: PaymentType.Direct,
            status: OrderStatus.Completed,
            exists: true
        });

        (bool success, ) = payable(seller).call{value: msg.value}("");
        require(success, "transfer failed");

        emit DirectPaymentCreated(orderId, msg.sender, seller, msg.value);
    }

    function createEscrowPayment(address seller) external payable {
        require(seller != address(0), "invalid seller");
        require(msg.value > 0, "amount must be more than 0");

        uint256 orderId = nextOrderId;
        nextOrderId++;

        orderById[orderId] = Order({
            id: orderId,
            buyer: msg.sender,
            seller: seller,
            amount: msg.value,
            paymentType: PaymentType.Escrow,
            status: OrderStatus.InEscrow,
            exists: true
        });

        emit EscrowPaymentCreated(orderId, msg.sender, seller, msg.value);
    }

    function confirmReceipt(uint256 orderId) external {
        Order storage currentOrder = orderById[orderId];

        require(currentOrder.exists, "order does not exist");
        require(currentOrder.paymentType == PaymentType.Escrow, "only escrow");
        require(currentOrder.status == OrderStatus.InEscrow, "not in escrow");
        require(msg.sender == currentOrder.buyer, "only buyer");

        currentOrder.status = OrderStatus.Completed;

        (bool success, ) = payable(currentOrder.seller).call{
            value: currentOrder.amount
        }("");
        require(success, "transfer failed");

        emit PaymentReceivedConfirmed(
            orderId,
            currentOrder.seller,
            currentOrder.buyer,
            currentOrder.amount
        );
    }

    function refund(uint256 orderId) external {
        Order storage currentOrder = orderById[orderId];

        require(currentOrder.exists, "order does not exist");
        require(currentOrder.paymentType == PaymentType.Escrow, "only escrow");
        require(currentOrder.status == OrderStatus.InEscrow, "not in escrow");
        require(msg.sender == currentOrder.seller, "only seller can refund");

        currentOrder.status = OrderStatus.Refunded;

        (bool success, ) = payable(currentOrder.buyer).call{
            value: currentOrder.amount
        }("");
        require(success, "refund failed");

        emit EscrowPaymentRefunded(
            orderId,
            currentOrder.buyer,
            currentOrder.seller,
            currentOrder.amount
        );
    }

    function openDispute(uint256 orderId) external {
        Order storage currentOrder = orderById[orderId];

        require(currentOrder.exists, "order does not exist");
        require(currentOrder.paymentType == PaymentType.Escrow, "only escrow");
        require(currentOrder.status == OrderStatus.InEscrow, "not in escrow");

        require(
            msg.sender == currentOrder.buyer ||
                msg.sender == currentOrder.seller,
            "only participant"
        );

        currentOrder.status = OrderStatus.Disputed;

        emit DisputeOpened(orderId, msg.sender);
    }

    function resolveDispute(
        uint256 orderId,
        bool releaseToSeller
    ) external onlyArbitrator {
        Order storage currentOrder = orderById[orderId];

        require(currentOrder.exists, "order does not exist");
        require(currentOrder.paymentType == PaymentType.Escrow, "only escrow");
        require(currentOrder.status == OrderStatus.Disputed, "not disputed");

        if (releaseToSeller) {
            currentOrder.status = OrderStatus.Completed;

            (bool success, ) = payable(currentOrder.seller).call{
                value: currentOrder.amount
            }("");
            require(success, "transfer failed");
        } else {
            currentOrder.status = OrderStatus.Refunded;

            (bool success, ) = payable(currentOrder.buyer).call{
                value: currentOrder.amount
            }("");
            require(success, "refund failed");
        }

        emit DisputeResolved(
            orderId,
            msg.sender,
            releaseToSeller,
            currentOrder.amount
        );
    }
}