// pitlane-api/routes/clubRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkClubMembership } = require('../middleware/clubAuthMiddleware');
const clubsConfig = require('../clubConfig'); // Load static config
// const ClubMembership = require('../models/ClubMembership'); // Maybe needed for detailed info

// --- Public Route: Get a list of all clubs ---
// Returns basic info like ID and name.
router.get('/', (req, res) => {
    try {
        // Transform the config into the format expected by the frontend
        const clubList = Object.keys(clubsConfig).map(id => ({
            id: id, // e.g., 'ferrari'
            name: clubsConfig[id].name, // e.g., 'Ferrari Fan Club'
            // Add other PUBLIC details if needed (e.g., logo URL, description from config)
            icon: clubsConfig[id].icon || '🏎️',
            color: clubsConfig[id].color || '#646cff',
            description: clubsConfig[id].description || `Official ${clubsConfig[id].name} community`,
            requiredNft: clubsConfig[id].contractAddress // Include NFT address for frontend checks?
        }));
        res.json(clubList);
    } catch (error) {
        console.error("Error listing clubs:", error);
        res.status(500).json({ error: "Failed to retrieve club list." });
    }
});

// --- Protected Route: Get Club Perks ---
// Requires user to be logged in (JWT) AND own the specific club NFT.
// URL: GET /api/clubs/:clubId/perks (e.g., /api/clubs/ferrari/perks)
router.get(
    '/:clubId/perks',
    authMiddleware,         // 1. Verifies JWT, attaches req.user
    checkClubMembership,    // 2. Verifies NFT ownership for req.params.clubId using req.user.address
    async (req, res) => {
        // If execution reaches here, both middleware passed.
        const clubId = req.params.clubId.toLowerCase();
        const club = clubsConfig[clubId];

        console.log(`Accessing perks for verified member of ${club.name}`);

        try {
            // TODO: Fetch dynamic perks from a database if they aren't static
            // For now, return static perks based on club ID (or generic)
            const perksList = club.perks || [ // Example static perks
                "24-hour early access to ticket sales.",
                `Exclusive ${club.name} merchandise discount.`,
                "Private chat channel access.",
                "Behind-the-scenes content.",
                "Voting rights on team matters."
            ];

            res.json({
                message: `Welcome, valued ${club.name} member!`,
                perks: perksList
            });
        } catch (error) {
            console.error(`Error fetching perks for ${clubId}:`, error);
            res.status(500).json({ error: "Failed to retrieve club perks." });
        }
    }
);


// --- OPTIONAL: Dedicated Membership Check Endpoint ---
// If checkClubMembership middleware isn't sufficient (e.g., frontend needs simple true/false)
router.get(
    '/:clubId/check-membership',
    authMiddleware, // User must be logged in to check
    async (req, res) => {
        const clubId = req.params.clubId.toLowerCase();
        const userAddress = req.user.address;
        const club = clubsConfig[clubId];

        if (!club) return res.status(404).json({ isMember: false, error: 'Club not found.' });

        try {
             // Re-use logic from middleware, but return JSON instead of calling next() or erroring out
             const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_HTTPS_URL); // Need provider
             const erc721_abi = ["function balanceOf(address) view returns (uint256)"];
             const nftContract = new ethers.Contract(club.contractAddress, erc721_abi, provider);
             const balance = await nftContract.balanceOf(userAddress);

             if (balance > 0n) { // ethers v5 returns BigNumber, v6 returns BigInt
                 res.json({ isMember: true });
             } else {
                 res.json({ isMember: false });
             }
        } catch (error) {
             console.error(`Error checking membership for ${userAddress} in ${clubId}:`, error);
             res.status(500).json({ isMember: false, error: 'Membership check failed.' });
        }
    }
);

// --- TODO: Add Endpoint for Joining a Club ---
// POST /api/clubs/:clubId/join (Protected by authMiddleware)
// This endpoint would:
// 1. Verify user authentication (authMiddleware).
// 2. Check if user is already a member (optional, prevent double mint).
// 3. Verify payment if applicable (e.g., check value sent, or signature for off-chain payment).
// 4. Call the appropriate FanClubNFT.sol contract function (e.g., claimMembership or trigger backend owner mint).
// 5. Potentially use Tenderly/Flashbots for secure minting.
// 6. Save membership record in ClubMembership collection.
// 7. Return success/failure response.
router.post('/:clubId/join', authMiddleware, async (req, res) => {
    const clubId = req.params.clubId.toLowerCase();
    const userAddress = req.user.address;
    // const { paymentSignature, etc } = req.body; // Data from frontend
    console.log(`User ${userAddress} attempting to join club ${clubId}`);
    // --- Add Join Logic Here ---
     res.status(501).json({ message: 'Club join endpoint not implemented yet.' });
});


// Health check for club routes
router.health = async () => {
    const clubs = require('../clubConfig');
    const ok = clubs && Object.keys(clubs).length > 0;
    // Could add a check to ensure contract addresses look valid
    return { ok, detail: ok ? `${Object.keys(clubs).length} clubs configured` : 'clubConfig missing or empty' };
};

// Need ethers for the optional check-membership endpoint
const { ethers } = require('ethers');
require('dotenv').config(); // Ensure env vars like ALCHEMY_HTTPS_URL are loaded

module.exports = router;
