// pitlane-api/services/mempoolScanner.js
const { ethers } = require("ethers");
require("dotenv").config();

// --- Configuration ---
const ALCHEMY_WSS_URL = process.env.ALCHEMY_WSS_URL; // Example: wss://eth-sepolia.g.alchemy.com/v2/KEY
const F1_TICKET_CONTRACT_ADDRESS = process.env.F1_TICKET_CONTRACT_ADDRESS; // Example: 0xYourContractAddress

let provider = null;
let ioInstance = null; // Will store Socket.IO instance globally

// --- Helper: Check config validity ---
const isScannerConfigured = () => {
  const wssOk = !!ALCHEMY_WSS_URL && !ALCHEMY_WSS_URL.includes("YOUR_ALCHEMY_API_KEY");
  const contractOk =
    !!F1_TICKET_CONTRACT_ADDRESS &&
    ethers.utils.isAddress(F1_TICKET_CONTRACT_ADDRESS);
  return wssOk && contractOk;
};

/**
 * Starts the Mempool Scanner service.
 * @param {object} io - The Socket.IO server instance.
 */
const startScanner = (io) => {
  if (!isScannerConfigured()) {
    console.warn(
      "⚠️ Mempool Scanner: Missing or invalid .env configuration (WSS URL or contract address)."
    );
    return;
  }

  if (!io) {
    console.error("❌ Mempool Scanner: Socket.IO server instance not provided!");
    return;
  }

  ioInstance = io; // Save Socket.IO instance for future emits

  console.log("🔌 Connecting to Ethereum WebSocket provider...");

  try {
    // Initialize ethers WebSocket provider
    provider = new ethers.providers.WebSocketProvider(ALCHEMY_WSS_URL);

    // Listen for all pending transactions
    provider.on("pending", async (txHash) => {
      if (!txHash) return;

      try {
        const tx = await provider.getTransaction(txHash);
        if (!tx || !tx.to) return;

        // --- Filter transactions to your contract ---
        if (tx.to.toLowerCase() === F1_TICKET_CONTRACT_ADDRESS.toLowerCase()) {
          console.log(`[Mempool] Tx detected to F1 contract: ${txHash}`);

          // --- Example detection rule: High Gas ---
          const highGasThreshold = ethers.utils.parseUnits("100", "gwei");
          const isSuspicious =
            tx.gasPrice && tx.gasPrice.gt(highGasThreshold);

          if (isSuspicious) {
            console.warn(
              `[⚠️ ALERT] High Gas Price: ${ethers.utils.formatUnits(
                tx.gasPrice,
                "gwei"
              )} Gwei | Tx: ${txHash}`
            );

            // Emit alert to frontend
            ioInstance.emit("bot-alert", {
              type: "HighGasPrice",
              txHash,
              from: tx.from,
              gasPrice: ethers.utils.formatUnits(tx.gasPrice, "gwei"),
              message: "Suspicious high gas transaction detected.",
            });
          }
        }
      } catch {
        // Ignore fetch errors
      }
    });

    // --- Handle Provider Errors ---
    provider.on("error", (error) => {
      console.error("❌ Mempool Scanner Provider Error:", error.message);
      if (ioInstance)
        ioInstance.emit("protectionUpdate", {
          service: "mempool",
          status: "error",
          message: error.message,
        });

      // Attempt reconnection
      safeReconnect();
    });

    // --- Handle WebSocket Closure ---
    provider._websocket.on("close", (code, reason) => {
      console.warn(`⚠️ WebSocket Closed: Code=${code}, Reason=${reason}`);
      if (ioInstance)
        ioInstance.emit("protectionUpdate", {
          service: "mempool",
          status: "disconnected",
        });

      safeReconnect();
    });

    console.log("✅ Mempool Scanner ('Watchtower') started successfully.");
    if (ioInstance)
      ioInstance.emit("protectionUpdate", {
        service: "mempool",
        status: "connected",
      });
  } catch (err) {
    console.error("❌ Failed to start Mempool Scanner:", err.message);
    if (ioInstance)
      ioInstance.emit("protectionUpdate", {
        service: "mempool",
        status: "error",
        message: "Initialization failed",
      });
  }
};

// --- Reconnect Logic ---
function safeReconnect() {
  try {
    if (provider && provider._websocket) provider._websocket.terminate();
  } catch {}
  provider = null;
  console.log("🔁 Attempting to reconnect in 5s...");
  setTimeout(() => startScanner(ioInstance), 5000);
}

// --- Health Check Endpoint Helper ---
const healthCheck = async () => {
  const ok = isScannerConfigured();
  const connected = !!provider && !!provider._websocket && provider._websocket.readyState === 1;
  const detail = ok
    ? connected
      ? "Scanner connected and monitoring mempool."
      : "Scanner configured but disconnected."
    : "Invalid scanner configuration.";

  return { ok: ok && connected, detail };
};

module.exports = { startScanner, healthCheck, isScannerConfigured };
