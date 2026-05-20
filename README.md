## MultiPayment DApp ##

## Overview
A Solidity + React decentralized payment system supporting direct ETH payments and escrow-based transactions. This project demonstrates a complete Web3 payment lifecycle including wallet connection, smart contract interaction, escrow fund locking, order tracking, receipt confirmation, and refund handling.
Features
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

## Direct Payment:
Buyer → Contract → Seller
Status: Completed

## Escrow Payment:
Buyer → Contract
Status: In Escrow
Confirm Receipt → Seller receives funds
Refund → Buyer receives funds back
Order Status Flow
InEscrow → Completed
InEscrow → Refunded
Completed and refunded orders are terminal states.

## Project Structure
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
├── hardhat.config.js
├── package.json
└── README.md
```
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
```
 frontend/src/contract/contractAddress.js
 export const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```  
7. Start frontend:
```bash
   cd frontend
   npm install
   npm run dev
```
8. Open:
```
 http://localhost:5173
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
- 
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
Learning Goals
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
