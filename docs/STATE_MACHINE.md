State Machine

Overview

Every escrow order follows a strict state machine.

The state machine prevents invalid actions and ensures predictable protocol behavior.

---

States

InEscrow

Initial state after escrow creation.

Allowed actions:

- Confirm Receipt
- Refund
- Open Dispute

---

Disputed

State entered after a dispute is opened.

Allowed actions:

- Resolve To Seller
- Resolve To Buyer

---

Completed

Terminal state.

Reached when:

- Buyer confirms receipt
- Arbitrator resolves in favor of seller

No further actions allowed.

---

Refunded

Terminal state.

Reached when:

- Seller refunds buyer
- Arbitrator resolves in favor of buyer

No further actions allowed.

---

Valid Transitions

InEscrow

- Completed
- Refunded
- Disputed

Disputed

- Completed
- Refunded

---

Invalid Transitions

Rejected transitions include:

- Completed → Refunded
- Completed → Disputed
- Refunded → Completed
- Refunded → Disputed
- Disputed → Disputed

---

State Machine Diagram

See:

"assets/diagrams/state-machine.png"

---

Design Goal

The state machine guarantees:

- Predictable order lifecycle
- Protection against invalid actions
- Secure dispute handling
- Consistent escrow accounting