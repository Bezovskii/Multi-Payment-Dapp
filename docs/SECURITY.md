Security Considerations

Overview

The ESCT Multi-Payment Escrow Engine is designed around a state-driven escrow architecture supporting ETH and ERC20 payments. Security measures focus on protecting user funds, preventing unauthorized actions, and ensuring valid state transitions.

---

Access Control

The protocol enforces strict role-based permissions:

Buyer

Allowed to:

- Create payments
- Confirm receipt
- Open disputes

Restricted from:

- Refunding payments
- Resolving disputes

Seller

Allowed to:

- Receive direct payments
- Refund escrow payments
- Open disputes

Restricted from:

- Confirming receipt
- Resolving disputes

Arbitrator

Allowed to:

- Resolve disputed escrow payments

Restricted from:

- Creating or modifying payments
- Accessing non-disputed settlements

---

State Transition Validation

Orders follow a controlled state machine:

InEscrow

- Completed
- Refunded
- Disputed

Disputed

- Completed
- Refunded

Completed and Refunded are terminal states.

The protocol rejects invalid transitions.

Examples:

- Confirming an already completed payment
- Refunding a completed payment
- Resolving a dispute twice

---

Input Validation

The protocol validates:

- Non-zero payment amounts
- Valid seller addresses
- Existing order identifiers
- Valid ERC20 token addresses
- ERC20 balances and allowances

---

Escrow Protection

Escrow payments remain locked inside the contract until one of the following occurs:

1. Buyer confirms receipt
2. Seller refunds buyer
3. Arbitrator resolves dispute

Funds cannot be withdrawn through any alternative path.

---

ERC20 Security

ERC20 payments require:

- Sufficient token balance
- Sufficient allowance
- Successful token transfer execution

Failed transfers revert the transaction.

---

Testing Coverage

The protocol currently includes 49 passing tests covering:

- Direct ETH payments
- Escrow ETH payments
- Direct ERC20 payments
- Escrow ERC20 payments
- Refund flows
- Dispute flows
- Arbitration flows
- Access control
- State transition validation

---

Future Security Improvements

Planned improvements include:

- Foundry fuzz testing
- Foundry invariant testing
- Formal security review
- Gas optimization review
- Additional edge-case testing