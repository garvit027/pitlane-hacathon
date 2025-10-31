// pitlane-api/services/flashbotsRelay.js
const { FlashbotsBundleProvider } = require('@flashbots/ethers-provider-bundle'); // Using v0.5.0 for ethers v5
const { ethers } = require('ethers'); // Using v5
require('dotenv').config();

// --- Configuration ---
const ALCHEMY_HTTPS_URL = process.env.ALCHEMY_HTTPS_URL; // Your Sepolia HTTPS RPC URL
const FLASHBOTS_SIGNER_PRIVATE_KEY = process.env.FLASHBOTS_SIGNER_PRIVATE_KEY; // Secure private key for Flashbots AUTH

let provider;
let flashbotsSigner;

// Validate essential config
const isFlashbotsConfigured = () => {
    const urlValid = !!ALCHEMY_HTTPS_URL && !ALCHEMY_HTTPS_URL.includes('YOUR_ALCHEMY_API_KEY');
    const keyValid = !!FLASHBOTS_SIGNER_PRIVATE_KEY && !FLASHBOTS_SIGNER_PRIVATE_KEY.includes('YOUR_WALLET_PRIVATE_KEY');
    return urlValid && keyValid;
};

// Initialize provider and signer if configured
if (isFlashbotsConfigured()) {
    try {
        provider = new ethers.providers.JsonRpcProvider(ALCHEMY_HTTPS_URL);
        flashbotsSigner = new ethers.Wallet(FLASHBOTS_SIGNER_PRIVATE_KEY, provider);
        console.log("✅ Flashbots Relay Service: Provider and Signer initialized.");
    } catch (error) {
        console.error("❌ Flashbots Relay Service: Failed to initialize provider or signer:", error.message);
        provider = null; // Ensure provider is null on error
        flashbotsSigner = null;
    }
} else {
    console.warn("⚠️ Flashbots Relay Service: Not configured. ALCHEMY_HTTPS_URL or FLASHBOTS_SIGNER_PRIVATE_KEY missing/invalid in .env.");
}


/**
 * Sends a bundle containing a single signed transaction via the Flashbots private relay for Sepolia.
 * @param {string} signedTx The user's raw, signed transaction hex string (e.g., "0x...")
 * @returns {Promise<object>} Object indicating success or failure and details.
 * @throws {Error} If Flashbots is not configured or relay submission fails.
 */
const sendToFlashbots = async (signedTx) => {
    // Safety check before proceeding
    if (!isFlashbotsConfigured() || !provider || !flashbotsSigner) {
        throw new Error('Flashbots relay service is not configured or initialized correctly.');
    }

    console.log("Creating Flashbots provider for Sepolia...");

    try {
        // 1. Create Flashbots Provider for Sepolia (using ethers v5 compatible method if needed)
        // FlashbotsBundleProvider v0.5.0 create method might differ slightly, check docs if errors occur
         const flashbotsProvider = await FlashbotsBundleProvider.create(
            provider,           // Your standard provider
            flashbotsSigner,    // Auth signer wallet
            'https://relay-sepolia.flashbots.net', // Sepolia relay URL
            'sepolia'                             // Sepolia network name
        );
        console.log("Flashbots provider created.");

        // 2. Prepare the bundle
        const transactionBundle = [{ signedTransaction: signedTx }];
        const currentBlockNumber = await provider.getBlockNumber();
        const targetBlockNumber = currentBlockNumber + 1; // Target the next block
        console.log(`Sending Flashbots bundle targeting block ${targetBlockNumber}...`);


        // 3. Send the bundle
        // Using sendRawBundle for single signed tx
        const flashbotsResponse = await flashbotsProvider.sendRawBundle(
            transactionBundle,
            targetBlockNumber
        );

        // Handle potential errors returned immediately (e.g., simulation failure)
        // Note: ethers-provider-bundle v0.5 might have different error structure
        if (flashbotsResponse.error) {
            console.error("Flashbots Raw Bundle Error:", flashbotsResponse.error.message);
            throw new Error(`Flashbots Relay Error: ${flashbotsResponse.error.message}`);
        }
        // V0.5 might return txs array with error per tx
        if (flashbotsResponse.results && flashbotsResponse.results[0]?.error) {
             console.error("Flashbots Bundle Tx Error:", flashbotsResponse.results[0].error.message);
             throw new Error(`Flashbots Tx Error: ${flashbotsResponse.results[0].error.message}`);
        }


        // 4. Wait for bundle inclusion (optional but recommended)
        console.log("Flashbots bundle submitted. Waiting for inclusion (wait())...");
        // The wait() method might resolve differently in v0.5, check Flashbots docs
        // It should resolve with a status code (e.g., BundleInclusion.Included = 0)
        // or reject if not included within a few blocks.
        const waitStatus = await flashbotsResponse.wait(); // Adjust based on v0.5 documentation

        // Check waitStatus (assuming 0 means success like in later versions)
        if (waitStatus === 0 /* or appropriate success code for v0.5 */) {
            console.log("✅ Transaction successfully included via Flashbots!");
            // Extract transaction hash if possible from the response
             const txHash = flashbotsResponse.results ? flashbotsResponse.results[0]?.hash : null;
            return {
                success: true,
                message: "Transaction included via Express Lane!",
                transactionHash: txHash
            };
        } else {
             // Bundle not included or timed out
             console.warn(`Flashbots bundle NOT included. Wait status: ${waitStatus}`);
             // Try to get more details if available
             const simulationResult = await flashbotsResponse.simulate(); // Simulate to get potential revert reason
             console.warn("Flashbots Simulation Result:", simulationResult);
             const errorReason = simulationResult.results?.[0]?.error || simulationResult.error?.message || `Unknown (Status ${waitStatus})`;
            throw new Error(`Flashbots bundle not included: ${errorReason}`);
        }

    } catch (error) {
        // Catch errors from provider creation, sending, or waiting
        console.error("Error during Flashbots submission:", error);
        throw new Error(`Flashbots submission failed: ${error.message || error}`);
    }
};

// Health check function
const healthCheck = async () => {
    const ok = isFlashbotsConfigured();
    // Could add a simple provider check like getBlockNumber if desired
    // try { if(ok) await provider.getBlockNumber(); } catch { ok = false; }
    return { ok, detail: ok ? 'Flashbots configured' : 'Flashbots keys/URL missing or invalid' };
};

module.exports = {
    sendToFlashbots,
    isFlashbotsConfigured, // Expose for checks before calling send
    healthCheck
};
