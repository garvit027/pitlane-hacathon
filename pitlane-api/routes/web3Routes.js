const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware'); 
const tenderlyService = require('../services/tenderlySimulator');
const flashbotsService = require('../services/flashbotRelay');
const { mintNFT } = require('../services/web3Service'); // ✅ Import minting function

// ======================================================
// 🔹 1. POST /api/web3/simulate-tx
//    → Simulates a transaction using Tenderly
// ======================================================
router.post('/simulate-tx', authMiddleware, async (req, res) => {
    const { to, data, value, from } = req.body;
    const userAddress = req.user.address;

    if (from?.toLowerCase() !== userAddress) {
        return res.status(403).json({ error: 'Transaction `from` address does not match authenticated user.' });
    }

    if (!to || !data) {
        return res.status(400).json({ error: '`to`, `data`, and `from` are required for simulation' });
    }

    try {
        console.log(`🧪 Simulating tx for ${userAddress}: To=${to}, Data=${data.slice(0,10)}...`);

        const txToSimulate = {
            to,
            data,
            value: value || '0x0',
            from: userAddress
        };

        const simulationResult = await tenderlyService.simulateTransaction(txToSimulate);
        res.json(simulationResult);
    } catch (error) {
        console.error(`❌ Simulation failed for ${userAddress}:`, error);
        res.status(500).json({ success: false, error: 'Simulation failed', details: error.message });
    }
});


// ======================================================
// 🔹 2. POST /api/web3/express-lane
//    → Sends a signed transaction via Flashbots relay
// ======================================================
router.post('/express-lane', authMiddleware, async (req, res) => {
    const { signedTx } = req.body;
    const userAddress = req.user.address;

    if (!signedTx || !signedTx.startsWith('0x')) {
        return res.status(400).json({ error: 'Valid `signedTx` (raw signed transaction hex string) is required.' });
    }

    if (!flashbotsService.isFlashbotsConfigured || !flashbotsService.isFlashbotsConfigured()) {
        console.warn(`⚠️ Flashbots endpoint called by ${userAddress} but service not configured.`);
        return res.status(503).json({ error: 'Express Lane service temporarily unavailable.' });
    }

    try {
        console.log(`🚀 Sending signed tx for ${userAddress} to Flashbots...`);
        const result = await flashbotsService.sendToFlashbots(signedTx);
        res.json({ message: 'Transaction submitted to Express Lane!', success: result.success, details: result.message });
    } catch (error) {
        console.error(`❌ Flashbots submission failed for ${userAddress}:`, error);
        res.status(500).json({ success: false, error: 'Flashbots relay failed', details: error.message });
    }
});


// ======================================================
// 🔹 3. POST /api/web3/mint
//    → Mints NFT using your Infura + MetaMask private key
// ======================================================
router.post('/mint', async (req, res) => {
    try {
        const { toAddress, tokenURI } = req.body;

        if (!toAddress || !tokenURI) {
            return res.status(400).json({ error: '`toAddress` and `tokenURI` are required.' });
        }

        console.log(`🪙 Minting NFT to ${toAddress}...`);
        const txReceipt = await mintNFT(toAddress, tokenURI);

        res.json({
            success: true,
            message: 'NFT minted successfully!',
            txHash: txReceipt.hash
        });
    } catch (error) {
        console.error('❌ NFT minting failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// ======================================================
// 🔹 Export Router
// ======================================================
module.exports = router;
