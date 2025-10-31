// pitlane-api/routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers'); // Using v5
const User = require('../models/User'); // Assuming User model handles nonce storage
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// In-memory nonce store (Replace with DB lookup/update in User model)
// const userNonces = {}; // Deprecated: Use User model instead

// Step 1: Frontend asks for a message to sign
router.post('/request-message', async (req, res) => {
    const { address } = req.body;
    if (!address || !ethers.utils.isAddress(address)) { // Validate address
        return res.status(400).json({ error: 'Valid wallet address is required' });
    }
    const lowerCaseAddress = address.toLowerCase();

    try {
        // Find user or create if not exists
        let user = await User.findOne({ walletAddress: lowerCaseAddress });
        let nonce;

        if (user) {
            // Generate and update nonce for existing user
            nonce = user.generateNonce(); // Use method from User model
            await user.save();
        } else {
            // Create new user with an initial nonce
            const newUser = new User({ walletAddress: lowerCaseAddress });
            nonce = newUser.nonce; // Get the default generated nonce
            await newUser.save();
            user = newUser; // Use the newly created user
        }

        console.log(`Nonce generated for ${lowerCaseAddress}: ${nonce}`);
        res.json({ messageToSign: nonce });

    } catch (error) {
        console.error("Error in /request-message:", error);
        res.status(500).json({ error: 'Failed to generate authentication message.' });
    }
});

// Step 2: Frontend sends the signature, we verify it and send a JWT token
router.post('/verify', async (req, res) => {
    const { address, signature } = req.body;

    if (!address || !signature) {
        return res.status(400).json({ error: 'Address and signature are required.' });
    }
    const lowerCaseAddress = address.toLowerCase();

    try {
        // Retrieve the user and their current nonce from the database
        const user = await User.findOne({ walletAddress: lowerCaseAddress });
        if (!user || !user.nonce) {
            return res.status(400).json({ error: 'No login request found or nonce missing. Please request a new message.' });
        }
        const originalMessage = user.nonce; // The nonce stored in the DB

        // Verify the signature against the stored nonce
        const signerAddress = ethers.utils.verifyMessage(originalMessage, signature);

        // Check if the recovered address matches the provided address
        if (signerAddress.toLowerCase() === lowerCaseAddress) {
            // Signature is valid!

            // Generate a new nonce for the next login attempt to prevent replay attacks
            user.generateNonce();
            await user.save();

            // Create JWT payload
            const payload = {
                address: lowerCaseAddress,
                userId: user._id // Include user ID from DB if useful
            };

            // Sign the JWT token
            const token = jwt.sign(
                payload,
                JWT_SECRET,
                { expiresIn: '1h' } // Token expires in 1 hour
            );

            console.log(`Authentication successful for ${lowerCaseAddress}`);
            // Send the token to the frontend
            res.json({
                message: "Authentication successful!",
                token: token
            });

        } else {
            // Signature is invalid
            console.warn(`Invalid signature for ${lowerCaseAddress}`);
            res.status(401).json({ error: 'Invalid signature.' });
        }
    } catch (error) {
        console.error("Error in /verify:", error);
        res.status(500).json({ error: 'Signature verification failed.' });
    }
});

// Health check for auth routes
router.health = async () => {
    const ok = !!process.env.JWT_SECRET && !process.env.JWT_SECRET.includes('YOUR');
    return { ok, detail: ok ? 'auth configured' : 'JWT_SECRET missing or placeholder' };
};

module.exports = router;
