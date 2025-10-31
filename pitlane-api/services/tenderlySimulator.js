// pitlane-api/services/tenderlySimulator.js
const axios = require('axios');
require('dotenv').config();

// --- Configuration ---
const TENDERLY_API_KEY = process.env.TENDERLY_API_KEY;
const TENDERLY_USER = process.env.TENDERLY_USER;
const TENDERLY_PROJECT_SLUG = process.env.TENDERLY_PROJECT_SLUG;
const SEPOLIA_NETWORK_ID = "11155111"; // Chain ID for Sepolia

const isTenderlyConfigured = () => {
    return !!TENDERLY_API_KEY && !TENDERLY_API_KEY.includes('YOUR') &&
           !!TENDERLY_USER && !TENDERLY_USER.includes('YOUR') &&
           !!TENDERLY_PROJECT_SLUG && !TENDERLY_PROJECT_SLUG.includes('YOUR');
};

let TENDERLY_SIMULATE_URL = '';
if (isTenderlyConfigured()) {
    TENDERLY_SIMULATE_URL = `https://api.tenderly.co/api/v1/account/${TENDERLY_USER}/project/${TENDERLY_PROJECT_SLUG}/simulate`;
    console.log("✅ Tenderly Simulator: Configured.");
} else {
     console.warn("⚠️ Tenderly Simulator: Not configured. TENDERLY_API_KEY, TENDERLY_USER, or TENDERLY_PROJECT_SLUG missing/invalid in .env.");
}

/**
 * Simulates a transaction using the Tenderly API.
 * Accepts an unsigned transaction object.
 * @param {object} tx - The transaction object to simulate.
 * @param {string} tx.from - The sender's address.
 * @param {string} tx.to - The contract address.
 * @param {string} tx.data - The encoded transaction data (e.g., "0x...").
 * @param {string} [tx.value] - Optional: Ether value in Wei (hex string, e.g., "0x...").
 * @returns {Promise<object>} Object indicating simulation success/failure and details.
 * @throws {Error} If Tenderly is not configured or API call fails.
 */
const simulateTransaction = async (tx) => {
    if (!isTenderlyConfigured()) {
        throw new Error('Tenderly Simulator service is not configured.');
    }
    if (!tx || !tx.from || !tx.to || !tx.data) {
        throw new Error('Invalid transaction object provided for simulation.');
    }

    console.log(`Simulating transaction via Tenderly for ${tx.from} to ${tx.to}...`);

    try {
        const response = await axios.post(
            TENDERLY_SIMULATE_URL,
            {
                // --- Payload for Tenderly Simulation API ---
                "network_id": SEPOLIA_NETWORK_ID, // Use Sepolia network ID
                "from": tx.from,
                "to": tx.to,
                "input": tx.data, // Use 'input' for transaction data
                "gas": 8000000, // High gas limit for simulation is safe
                "gas_price": "0", // Gas price 0 is standard for simulation
                "value": tx.value || "0x0", // Ether value in Wei (hex)
                "save": true, // Save simulation in Tenderly dashboard (useful for debugging)
                "save_if_fails": true, // Save even if the simulation fails
                // Optional: state_overrides, block_number, etc.
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Key': TENDERLY_API_KEY // API Key header
                }
            }
        );

        // --- Process Tenderly Response ---
        // Check if the simulation object and transaction info exist
        if (!response.data?.simulation?.status || !response.data?.transaction?.gas_used) {
             console.error("Tenderly response missing expected fields:", response.data);
             throw new Error("Received unexpected response format from Tenderly.");
        }

        const sim = response.data.simulation;
        const txInfo = response.data.transaction;

        console.log(`Tenderly simulation status: ${sim.status ? 'Success' : 'Failure'}`);

        if (sim.status === true) {
            // Simulation was SUCCESSFUL
            return {
                success: true,
                message: "Transaction simulation successful!",
                gasUsed: txInfo.gas_used, // Gas used by the successful transaction
                // output: txInfo.output, // Decoded output/return value (if applicable) - Requires ABI
                // logs: sim.logs // Decoded event logs (if applicable) - Requires ABI
            };
        } else {
            // Simulation FAILED
             console.warn("Tenderly simulation failed. Error:", txInfo.error_message || sim.error_info?.error_message || 'Unknown error');
            return {
                success: false,
                message: "Transaction simulation failed!",
                 // Provide error details if available
                error: txInfo.error_message || sim.error_info?.error_message || 'Simulation reverted or failed.',
                // Optionally include revert reason if decoded
            };
        }

    } catch (error) {
        // Handle errors during the API call itself
        console.error("Tenderly API request error:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
         // Provide a clearer error message
         let detail = error.message;
         if (error.response?.data?.error?.message) {
            detail = error.response.data.error.message;
         } else if (error.response?.status) {
             detail = `HTTP Status ${error.response.status}`;
         }
        throw new Error(`Failed to simulate transaction via Tenderly: ${detail}`);
    }
};

// Health check function
const healthCheck = async () => {
    const ok = isTenderlyConfigured();
    // Could add a test API call here, but might consume quota
    // Example: try { if(ok) await axios.get(..., { headers }); } catch { ok = false; }
    return { ok, detail: ok ? 'Tenderly configured' : 'Tenderly keys/URL missing or invalid' };
};

module.exports = { simulateTransaction, healthCheck, isTenderlyConfigured };
