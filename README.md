# MultiPayment DApp

<<<<<<< HEAD
## Overview

A Solidity + React decentralized payment system supporting direct ETH payments and escrow-based transactions. This project demonstrates a complete Web3 payment lifecycle including wallet connection, smart contract interaction, escrow fund locking, order tracking, receipt confirmation, and refund handling.
---

## Features

- Direct ETH payments
- Escrow-based ETH payments
- Order tracking by ID
- Buyer receipt confirmation
- Refund system
- MetaMask wallet connection
- React frontend with ethers.js
- Hardhat local blockchain development
- Smart contract state management
- Frontend order visualization
  
## Tech Stack

- Solidity
- Hardhat
- JavaScript
- React
- Vite
- ethers.js
- MetaMask
  
## Smart Contract Overview

The 'MultiPayment' contract supports two payment types.

### Direct Payment
```
Buyer → Contract → Seller
Status: Completed
```

###Escrow Payment
```
Buyer → Contract
Status: In Escrow
Confirm Receipt → Seller receives funds
Refund → Buyer receives funds back
Order Status Flow
InEscrow → Completed
InEscrow → Refunded
```

Completed and refunded orders are terminal states.
### Project Structure
```
Multi-Payment-Dapp/
├── contracts/
│   └── MultiPayment.sol
├── test/
│   └── smart contract tests
├── scripts/
│   └── deploy.js
├── frontend/
│   └── React + ethers.js frontend
=======
A Solidity-based multi-payment engine supporting both direct ETH payments and escrow-based payments.
This project is designed as a portfolio-grade Web3 payment system showing smart contract architecture, state-machine logic, access control, ETH fund handling, events, and automated Hardhat testing.

---

## Overview

MultiPayment DApp supports two payment flows:

### 1. Direct Payment
```
Buyer sends ETH and the seller receives it immediately.

Buyer → Contract → Seller
Status: Completed
```
### 2. Escrow Payment
```
Buyer sends ETH into the contract. Funds stay locked until either:

- buyer confirms receipt → seller receives funds
- seller refunds → buyer receives funds back

Buyer → Contract
Contract → Seller   // confirm receipt
Contract → Buyer    // refund

```
## Core Features

- Native ETH direct payments
- Native ETH escrow payments
- Buyer-confirmed escrow release
- Seller-approved refund
- Order tracking by ID
- Role-based access control
- Event emission for frontend integration
- State transition protection
- Multi-order independence
- Full Hardhat test coverage for v1 logic

---

## Smart Contract Architecture

### Payment Types
```
enum PaymentType {
    Direct,
    Escrow
}
```
### Order Statuses
```
enum OrderStatus {
    InEscrow,
    Completed,
    Refunded
}
```
### Order Model
```
struct Order {
    uint256 id;
    address buyer;
    address seller;
    uint256 amount;
    PaymentType paymentType;
    OrderStatus status;
    bool exists;
}
```
Orders are stored by ID:
```
mapping(uint256 => Order) public orderById;
```

## State Machine

### Direct Payment
```
Created → Completed
Direct payments complete immediately because funds are forwarded to the seller in the same transaction.
```
### Escrow Payment
```
InEscrow → Completed
InEscrow → Refunded
```
Final states are protected:
```
Completed → no further action
Refunded → no further action
```

## Contract Functions

### createDirectPayment(address seller)

Creates a direct ETH payment.

Requirements:

- seller cannot be zero address
- msg.value must be greater than zero

Result:

- creates order
- marks status as Completed
- transfers ETH to seller
- emits DirectPaymentCreated

---

### createEscrowPayment(address seller)

Creates an escrow payment.

Requirements:

- seller cannot be zero address
- msg.value must be greater than zero

Result:

- creates order
- marks status as InEscrow
- keeps ETH inside contract
- emits EscrowPaymentCreated

---

### confirmReceipt(uint256 orderId)

Buyer confirms receipt and releases escrow funds to seller.

Requirements:

- order must exist
- payment type must be Escrow
- status must be InEscrow
- caller must be buyer

Result:

- status becomes Completed
- ETH transfers to seller
- emits PaymentReceivedConfirmed

---

### refund(uint256 orderId)

Seller refunds buyer before escrow completion.

Requirements:

- order must exist
- payment type must be Escrow
- status must be InEscrow
- caller must be seller

Result:

- status becomes Refunded
- ETH transfers back to buyer
- emits EscrowPaymentRefunded

---

## Testing

The project includes Hardhat tests covering:

- direct payment success flow
- escrow payment success flow
- refund success flow
- confirm receipt success flow
- zero address reverts
- zero ETH reverts
- invalid order reverts
- wrong caller reverts
- wrong payment type reverts
- double confirm protection
- double refund protection
- refund after completion protection
- confirm after refund protection
- event emission
- ETH balance changes
- multiple escrow order independence

Current result:
```
23 passing
```
Run tests:
```bash
npx hardhat test
```
Compile:
```bash
npx hardhat compile
```
---

## Tech Stack

- Solidity ^0.8.20
- Hardhat
- Ethers.js
- Mocha
- Chai

---

## Project Structure

```
Multi-Payment-Dapp/
│
├── contracts/
│   └── MultiPayment.sol
│
├── test/
│   ├── helpers/
│   │   └── setup.js
│   ├── multiPayment.CreateDirectPayment.test.js
│   ├── multiPayment.CreateEscrowPayment.test.js
│   ├── multiPayment.confirmReceipt.test.js
│   ├── multiPayment.refund.test.js
│   └── multiPayment.stateTransitions.test.js
│
>>>>>>> 19126ed800e16e2c9d4bc7a88ac02d59b2c4586c
├── hardhat.config.js
├── package.json
└── README.md
```
<<<<<<< HEAD
## Run Locally
1. Install dependencies:
```bash
   npm install
```
2. Compile contracts:
```bash
   npx hardhat compile
```
3. Run tests:
```bash
   npx hardhat test
```
4. Start local blockchain:
```bash
   npx hardhat node
```
5. Deploy contract:
```bash
   npx hardhat run scripts/deploy.js --network localhost
```
6. Update frontend contract address:
```bash
   frontend/src/contract/contractAddress.js
```
7. Start frontend:
```bash
   cd frontend
   npm install
   npm run dev
```
```
Open: http://localhost:5173
```
## Frontend Flow

1. Connect MetaMask
2. Enter seller address
3. Enter ETH amount
4. Choose Direct or Escrow Payment
5. Read order by ID
6. Confirm receipt or refund escrow orders

## Example Escrow Lifecycle

Buyer creates escrow
↓
Funds locked in contract
↓
Seller delivers product/service
↓
Buyer confirms receipt
↓
Funds released to seller

## Example Refund Lifecycle

Buyer creates escrow
↓
Problem occurs
↓
Seller refunds buyer
↓
Funds returned from contract

## Current Limitations

- ETH only
- No ERC20/stablecoin support yet
- No dispute/arbitration system yet
- No backend/database yet
- No event indexing yet
- No multi-user authentication yet
- Local/test environment only
  
## Roadmap

V2 — Dispute System
- Buyer/seller dispute flow
- Arbitrator role
- Dispute resolution states
- Partial/full refund logic

V3 — ERC20 Support
- USDT/USDC support
- Token allowance flow
- ERC20 escrow lifecycle

V4 — Backend + Event History
- Order history storage
- Event listener service
- User order tracking
- Analytics dashboard

V5 — Marketplace / Telegram Integration
- Telegram bot integration
- Escrow payment links
- Marketplace use cases
- Order tracking via bot
  
## Use Case

This project is designed for peer-to-peer transactions where two parties do not fully trust each other.

# Example:

A buyer wants to purchase a second-hand item from a seller. Instead of sending money directly, the buyer locks funds in escrow. The seller delivers the item. The buyer confirms receipt. The smart contract releases funds to the seller.

## Learning Goals

- Smart contract architecture
- Escrow systems
- Solidity state machines
- Frontend-blockchain interaction
- ethers.js
- MetaMask integration
- Web3 transaction lifecycle
- Decentralized payment systems
  
## Author

Behzad Khoshian

GitHub:
https://github.com/Bezovskii
=======
---

## How to Run Locally

Install dependencies:

```bash
npm install
```
Compile contracts:

```bash
npx hardhat compile
```
Run tests:

```bash
npx hardhat test
```
---

## Security-Oriented Design Choices

This project uses:

- explicit order existence checks
- strict payment type validation
- strict order status validation
- caller role validation
- final-state protection
- checks-effects-interactions pattern
- low-level call result validation for ETH transfers

Example:

```
currentOrder.status = OrderStatus.Completed;

(bool success, ) = payable(currentOrder.seller).call{
    value: currentOrder.amount
}("");

require(success, "transfer failed");
```



## Current Version

### V1: MultiPayment Core Engine

Implemented:

- direct ETH payment
- escrow ETH payment
- buyer confirmation
- seller refund
- full test suite

---

## Roadmap

### V1.1 — Frontend

Planned frontend features:

- connect MetaMask
- create direct payment
- create escrow payment
- confirm receipt
- refund escrow
- read order by ID
- display order status

### V2 — Dispute System

Planned dispute features:

- open dispute
- arbiter role
- resolve dispute to buyer
- resolve dispute to seller
- block confirm/refund while disputed
- dispute-specific tests

### V3 — ERC20 Support

Planned token support:

- USDT/USDC-style payments
- ERC20 direct payment
- ERC20 escrow payment
- allowance validation
- token transfer safety tests

---

## Purpose

This project is part of my blockchain developer portfolio.

It demonstrates my ability to:

- design Solidity smart contracts
- model payment flows as a state machine
- handle ETH safely
- write automated smart contract tests
- structure a Web3 backend project
- prepare a contract for frontend integration

---

## Author

Built by Behzad Khoshian

GitHub: https://github.com/Bezovskii
>>>>>>> 19126ed800e16e2c9d4bc7a88ac02d59b2c4586c
