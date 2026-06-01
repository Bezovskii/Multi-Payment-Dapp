Architecture

Overview

The ESCT Multi-Payment Escrow Engine is a decentralized payment protocol designed to support secure ETH and ERC20 transactions through direct transfers, escrow protection, dispute handling, and arbitration.

The protocol is built around a single smart contract that manages payment creation, state transitions, dispute resolution, and fund settlement.

---

Participants

Buyer

The buyer initiates a payment and funds the transaction.

Capabilities:

- Create direct payments
- Create escrow payments
- Confirm receipt
- Open disputes

---

Seller

The seller receives funds after successful settlement.

Capabilities:

- Receive direct payments
- Refund escrow payments
- Open disputes

---

Arbitrator

The arbitrator resolves disputed escrow transactions.

Capabilities:

- Resolve disputes in favor of the buyer
- Resolve disputes in favor of the seller

---

Payment Types

Direct Payment

Flow:

Buyer → Contract → Seller

Characteristics:

- Immediate settlement
- No dispute process
- No escrow custody

---

Escrow Payment

Flow:

Buyer → Contract → Escrow

Characteristics:

- Funds remain locked
- Buyer confirms delivery
- Seller can refund
- Dispute mechanism available

---

ERC20 Support

The protocol supports ERC20 token payments through:

- Token approval
- TransferFrom execution
- Escrow custody
- Token settlement

Supported actions:

- ERC20 Direct Payment
- ERC20 Escrow Payment

---

Dispute Flow

1. Escrow payment is created.
2. Buyer or seller opens a dispute.
3. Order enters the Disputed state.
4. Arbitrator reviews the case.
5. Arbitrator resolves to:
   - Seller (fund release)
   - Buyer (refund)

---

Architecture Diagram

See:

"assets/diagrams/architecture.png"