import { ethers } from "ethers";
import { useState } from "react";

import { contractAddress } from "./contract/contractAddress.js";
import contractABI from "./contract/MultiPaymentABI.json";

function App() {
  const [account, setAccount] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);
  const [contract, setContract] = useState(null);

  const [sellerAddress, setSellerAddress] = useState("");
  const [amount, setAmount] = useState("");

  const [orderId, setOrderId] = useState("");
  const [lastOrderId, setLastOrderId] = useState("");
  const [orderData, setOrderData] = useState(null);

  const [arbitrator, setArbitrator] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask is not installed");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);
      setWalletConnected(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const multiPaymentContract = new ethers.Contract(
        contractAddress,
        contractABI.abi,
        signer
      );

      const arb = await multiPaymentContract.arbitrator();

      setContract(multiPaymentContract);
      setArbitrator(arb);
      setMessage("Wallet and contract connected.");
    } catch (error) {
      console.error("CONNECT ERROR:", error);
      alert(error.shortMessage || error.message || "Wallet connection failed");
    }
  }

  function validatePaymentInputs() {
    if (!contract) {
      alert("Connect wallet first");
      return false;
    }

    if (!ethers.isAddress(sellerAddress)) {
      alert("Invalid seller address");
      return false;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Amount must be greater than 0");
      return false;
    }

    return true;
  }

  async function createDirectPayment() {
    if (!validatePaymentInputs()) return;

    try {
      setLoading(true);
      setMessage("Direct payment transaction pending...");

      const tx = await contract.createDirectPayment(sellerAddress, {
        value: ethers.parseEther(amount),
      });

      await tx.wait();

      const nextId = await contract.nextOrderId();
      const createdId = Number(nextId) - 1;

      setLastOrderId(createdId.toString());
      setOrderId(createdId.toString());
      setMessage(`Direct payment completed. Order ID: ${createdId}`);
    } catch (error) {
      console.error("DIRECT PAYMENT ERROR:", error);
      alert(error.shortMessage || error.message || "Direct payment failed");
    } finally {
      setLoading(false);
    }
  }

  async function createEscrowPayment() {
    if (!validatePaymentInputs()) return;

    try {
      setLoading(true);
      setMessage("Escrow payment transaction pending...");

      const tx = await contract.createEscrowPayment(sellerAddress, {
        value: ethers.parseEther(amount),
      });

      await tx.wait();

      const nextId = await contract.nextOrderId();
      const createdId = Number(nextId) - 1;

      setLastOrderId(createdId.toString());
      setOrderId(createdId.toString());
      setMessage(`Escrow payment created. Order ID: ${createdId}`);
    } catch (error) {
      console.error("ESCROW PAYMENT ERROR:", error);
      alert(error.shortMessage || error.message || "Escrow payment failed");
    } finally {
      setLoading(false);
    }
  }

  async function readOrder() {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }

    if (!orderId || Number(orderId) <= 0) {
      alert("Enter a valid order ID");
      return;
    }

    try {
      setLoading(true);
      setMessage("Reading order...");

      const cleanOrderId = Number(orderId);
      const order = await contract.orderById(cleanOrderId);

      setOrderData({
        id: order[0].toString(),
        buyer: order[1],
        seller: order[2],
        amount: ethers.formatEther(order[3]),
        paymentType: Number(order[4]),
        status: Number(order[5]),
        exists: order[6],
      });

      setMessage("Order loaded.");
    } catch (error) {
      console.error("READ ORDER ERROR:", error);
      alert(error.shortMessage || error.message || "Failed to read order");
    } finally {
      setLoading(false);
    }
  }

  async function confirmReceipt() {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }

    if (!orderId || Number(orderId) <= 0) {
      alert("Enter a valid order ID");
      return;
    }

    if (orderData && orderData.status !== 0) {
      alert("Order is not in escrow");
      return;
    }

    try {
      setLoading(true);
      setMessage("Confirm receipt transaction pending...");

      const tx = await contract.confirmReceipt(Number(orderId));
      await tx.wait();

      setMessage("Receipt confirmed. Funds released to seller.");
      await readOrder();
    } catch (error) {
      console.error("CONFIRM RECEIPT ERROR:", error);
      alert(error.shortMessage || error.message || "Confirm receipt failed");
    } finally {
      setLoading(false);
    }
  }

  async function refundOrder() {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }

    if (!orderId || Number(orderId) <= 0) {
      alert("Enter a valid order ID");
      return;
    }

    if (orderData && orderData.status !== 0) {
      alert("Order is not in escrow");
      return;
    }

    try {
      setLoading(true);
      setMessage("Refund transaction pending...");

      const tx = await contract.refund(Number(orderId));
      await tx.wait();

      setMessage("Refund completed. Funds returned to buyer.");
      await readOrder();
    } catch (error) {
      console.error("REFUND ERROR:", error);
      alert(error.shortMessage || error.message || "Refund failed");
    } finally {
      setLoading(false);
    }
  }

  async function openDispute() {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }

    if (!orderId || Number(orderId) <= 0) {
      alert("Enter a valid order ID");
      return;
    }

    if (orderData && orderData.status !== 0) {
      alert("Only orders in escrow can be disputed");
      return;
    }

    try {
      setLoading(true);
      setMessage("Opening dispute...");

      const tx = await contract.openDispute(Number(orderId));
      await tx.wait();

      setMessage("Dispute opened.");
      await readOrder();
    } catch (error) {
      console.error("OPEN DISPUTE ERROR:", error);
      alert(error.shortMessage || error.message || "Open dispute failed");
    } finally {
      setLoading(false);
    }
  }

  async function resolveDispute(releaseToSeller) {
    if (!contract) {
      alert("Connect wallet first");
      return;
    }

    if (!orderId || Number(orderId) <= 0) {
      alert("Enter a valid order ID");
      return;
    }

    if (orderData && orderData.status !== 1) {
      alert("Order is not disputed");
      return;
    }

    try {
      setLoading(true);
      setMessage("Resolving dispute...");

      const tx = await contract.resolveDispute(
        Number(orderId),
        releaseToSeller
      );

      await tx.wait();

      setMessage(
        releaseToSeller
          ? "Dispute resolved: funds released to seller."
          : "Dispute resolved: buyer refunded."
      );

      await readOrder();
    } catch (error) {
      console.error("RESOLVE DISPUTE ERROR:", error);
      alert(error.shortMessage || error.message || "Resolve dispute failed");
    } finally {
      setLoading(false);
    }
  }

  function getPaymentTypeName(paymentType) {
    if (paymentType === 0) return "Direct";
    if (paymentType === 1) return "Escrow";
    return "Unknown";
  }

  function getStatusName(status) {
    if (status === 0) return "In Escrow";
    if (status === 1) return "Disputed";
    if (status === 2) return "Completed";
    if (status === 3) return "Refunded";
    return "Unknown";
  }

  const isArbitrator =
    account && arbitrator && account.toLowerCase() === arbitrator.toLowerCase();

  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f4f6f8",
      padding: "40px",
      fontFamily: "Arial, sans-serif",
    },
    container: {
      maxWidth: "900px",
      margin: "0 auto",
    },
    header: {
      textAlign: "center",
      marginBottom: "25px",
    },
    card: {
      background: "white",
      padding: "24px",
      borderRadius: "14px",
      marginBottom: "20px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    },
    input: {
      display: "block",
      width: "100%",
      padding: "12px",
      marginBottom: "12px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "14px",
    },
    button: {
      padding: "10px 16px",
      marginRight: "10px",
      marginTop: "8px",
      borderRadius: "8px",
      border: "none",
      cursor: loading ? "not-allowed" : "pointer",
      background: "#111827",
      color: "white",
    },
    secondaryButton: {
      padding: "10px 16px",
      marginRight: "10px",
      marginTop: "8px",
      borderRadius: "8px",
      border: "1px solid #111827",
      cursor: loading ? "not-allowed" : "pointer",
      background: "white",
      color: "#111827",
    },
    dangerButton: {
      padding: "10px 16px",
      marginRight: "10px",
      marginTop: "8px",
      borderRadius: "8px",
      border: "1px solid #991b1b",
      cursor: loading ? "not-allowed" : "pointer",
      background: "white",
      color: "#991b1b",
    },
    message: {
      padding: "12px",
      background: "#eef6ff",
      borderRadius: "8px",
      marginTop: "15px",
      color: "#1f2937",
    },
    dataBox: {
      background: "#f9fafb",
      padding: "16px",
      borderRadius: "10px",
      marginTop: "16px",
      wordBreak: "break-all",
    },
    badge: {
      display: "inline-block",
      padding: "6px 10px",
      borderRadius: "999px",
      background: "#e5e7eb",
      marginTop: "8px",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1>MultiPayment DApp</h1>
          <p>Direct, escrow, and dispute-based ETH payments.</p>

          <button
            onClick={connectWallet}
            disabled={loading}
            style={styles.button}
          >
            Connect Wallet
          </button>

          {walletConnected && (
            <div style={{ marginTop: "12px" }}>
              <p>Wallet connected ✅</p>
              <p>Account: {account}</p>
              <p>Contract connected: {contract ? "Yes ✅" : "No ❌"}</p>
              <p>Arbitrator: {arbitrator}</p>
              <p style={styles.badge}>
                Role: {isArbitrator ? "Arbitrator" : "User"}
              </p>
            </div>
          )}

          {message && <div style={styles.message}>{message}</div>}
          {loading && <p>Transaction pending...</p>}
        </div>

        <div style={styles.card}>
          <h2>Create Payment</h2>

          <input
            type="text"
            placeholder="Seller address"
            value={sellerAddress}
            onChange={(e) => setSellerAddress(e.target.value)}
            style={styles.input}
          />

          <input
            type="text"
            placeholder="Amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.input}
          />

          <button
            onClick={createDirectPayment}
            disabled={loading}
            style={styles.secondaryButton}
          >
            Create Direct Payment
          </button>

          <button
            onClick={createEscrowPayment}
            disabled={loading}
            style={styles.button}
          >
            Create Escrow Payment
          </button>

          {lastOrderId && <p>Latest Order ID: {lastOrderId}</p>}
        </div>

        <div style={styles.card}>
          <h2>Read / Manage Order</h2>

          <input
            type="text"
            placeholder="Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            style={styles.input}
          />

          <button onClick={readOrder} disabled={loading} style={styles.button}>
            Read Order
          </button>

          <button
            onClick={confirmReceipt}
            disabled={loading}
            style={styles.secondaryButton}
          >
            Confirm Receipt
          </button>

          <button
            onClick={refundOrder}
            disabled={loading}
            style={styles.secondaryButton}
          >
            Refund
          </button>

          <button
            onClick={openDispute}
            disabled={loading}
            style={styles.dangerButton}
          >
            Open Dispute
          </button>

          {isArbitrator && (
            <>
              <button
                onClick={() => resolveDispute(true)}
                disabled={loading}
                style={styles.secondaryButton}
              >
                Resolve to Seller
              </button>

              <button
                onClick={() => resolveDispute(false)}
                disabled={loading}
                style={styles.secondaryButton}
              >
                Resolve to Buyer
              </button>
            </>
          )}

          {orderData && (
            <div style={styles.dataBox}>
              <h3>Order Data</h3>
              <p>ID: {orderData.id}</p>
              <p>Buyer: {orderData.buyer}</p>
              <p>Seller: {orderData.seller}</p>
              <p>Amount: {orderData.amount} ETH</p>
              <p>Payment Type: {getPaymentTypeName(orderData.paymentType)}</p>
              <p>Status: {getStatusName(orderData.status)}</p>
              <p>Exists: {orderData.exists ? "Yes" : "No"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;