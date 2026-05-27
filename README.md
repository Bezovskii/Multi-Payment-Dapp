# Multi-Payment-Dapp

A decentralized multi-payment escrow system built with Solidity, Hardhat, React, Ethers.js, and MetaMask.

## Supports:

Direct ETH payments
Escrow ETH payments
Refund system
Dispute system
Arbitrator resolution
Frontend wallet integration
Full automated smart contract testing

## Demo
https://www.linkedin.com/feed/update/urn:li:ugcPost:7465519460720971778/

## Features:

## Direct Payment
Buyer sends ETH directly to seller instantly.
Buyer → Seller
Used for trusted fast transactions.


## Escrow Payment
Funds are locked inside the smart contract until buyer confirms receipt.
Buyer → Smart Contract → Seller
Used for safer peer-to-peer transactions.

## Refund System
Seller can refund escrowed ETH back to buyer.

## Dispute System
Buyer or seller can open a dispute.
An arbitrator resolves the dispute and releases funds to:
Seller
OR
Buyer


# Tech Stack:

## Smart Contract

.Solidity

.Hardhat

.Ethers.js

## Frontend

.React

.Vite

.Ethers.js

.MetaMask

## Testing
.Mocha

.Chai

## Project Structure:
```
Multi-Payment-Dapp/
│
├── contracts/
│   └── multiPayment.sol
│
├── scripts/
│   └── deploy.js
│
├── test/
│   ├── helpers/
│   │   └── setup.js
│   │
│   ├── multiPayment.CreateDirectPayment.test.js
│   ├── multiPayment.CreateEscrowPayment.test.js
│   ├── multiPayment.confirmReceipt.test.js
│   ├── multiPayment.refund.test.js
│   ├── multiPayment.stateTransitions.test.js
│   └── multiPayment.dispute.test.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── contract/
│   │   │   ├── MultiPaymentABI.json
│   │   │   └── contractAddress.js
│   │   │
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── artifacts/
├── cache/
├── hardhat.config.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```
# Smart Contract Architecture:

## Payment Types
```
enum PaymentType {
    Direct,
    Escrow
}
```

## Order Status
```
enum OrderStatus {
    Pending,
    Completed,
    Refunded,
    Disputed
}
```
# Core Functions:

## Create Direct Payment
```
createDirectPayment(address seller)
```
Transfers ETH instantly to seller.

## Create Escrow Payment
```
createEscrowPayment(address seller)
```
Locks ETH inside smart contract.

## Confirm Receipt
```
confirmReceipt(uint256 orderId)
```
Buyer releases escrow funds to seller.

## Refund
```
refund(uint256 orderId)
```
Seller refunds buyer.

## Open Dispute
```
openDispute(uint256 orderId)
```
Buyer or seller opens dispute.

## Resolve Dispute
```
resolveDispute(uint256 orderId, bool releaseToSeller)
```
Arbitrator resolves dispute.

# Security Logic

## The contract prevents:

.Double confirmations

.Double refunds

.Invalid state transitions

.Unauthorized dispute resolutions

.Unauthorized refunds

.Unauthorized confirmations

.Resolving non-disputed orders

.Using escrow logic on direct payments

# Test Coverage
## createDirectPayment
.seller zero address revert

.zero ETH revert

.direct transfer success

.event emission validation


## createEscrowPayment
.seller zero address revert

.zero ETH revert

.escrow storage validation

.event emission validation

## confirmReceipt
.order existence checks

.escrow-only validation

.buyer-only validation

.double confirmation prevention

.ETH release validation

.event emission validation

## refund
.order existence checks

.escrow-only validation

.seller-only validation

.double refund prevention

.ETH refund validation

.event emission validation

## dispute system
.openDispute

.buyer can open dispute

.seller can open dispute

.random user blocked

.direct payment protection

.completed order protection

.refunded order protection

## resolveDispute
.arbitrator-only access

.seller resolution

.buyer resolution

.invalid dispute protection

.double resolution prevention

.disputed state protection

.confirm blocked during dispute

.refund blocked during dispute

## Frontend Features
.MetaMask wallet connection

.Live account detection

.Role detection

.Create direct payment

.Create escrow payment

.Read order data

.Confirm receipt

.Refund escrow

.Open dispute

.Resolve dispute to seller

.Resolve dispute to buyer

# Local Development

## Install dependencies
```bash
npm install
```
## Frontend
```bash
cd frontend
npm install
```
## Start Hardhat Node
```bash
npx hardhat node
```
## Deploy Contract
```bash
npx hardhat run scripts/deploy.js --network localhost
```
## Start Frontend
```bash
cd frontend
npm run dev
```
## Run Tests
```bash
npx hardhat test
```
# Example Workflow

## Escrow Flow:

## Buyer
Creates escrow payment.

## Seller
Waits for confirmation.

## Buyer
Confirms receipt.

## Smart Contract
Releases ETH to seller.

# Dispute Flow:

## Buyer or Seller
Opens dispute.

## Arbitrator
Reviews dispute.

## Arbitrator
Releases funds to buyer or seller.

# Future Improvements
.ERC20 support (USDT / USDC)

.Sepolia deployment

.Telegram bot integration

.Backend indexing

.Event history

.Transaction analytics

.Multi-chain support

.Reputation system

.AI-assisted dispute analysis

# Author:

## Behzad Khoshian

# GitHub:

https://github.com/Bezovskii
