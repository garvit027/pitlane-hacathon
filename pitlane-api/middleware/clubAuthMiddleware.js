// pitlane-api/middleware/clubAuthMiddleware.js
const { ethers } = require('ethers'); // Using v5
const clubsConfig = require('../clubConfig'); // Load club contract addresses
require('dotenv').config();

// Ensure provider URL is available
const providerUrl = process.env.ALCHEMY_HTTPS_URL;
let provider; // Initialize provider globally or within the function

if (providerUrl) {
  provider = new ethers.providers.JsonRpcProvider(providerUrl);
  console.log("✅ ClubAuthMiddleware: Provider initialized.");
} else {
  console.error("❌ ClubAuthMiddleware: ALCHEMY_HTTPS_URL not found in .env. NFT checks will fail!");
  // provider will remain undefined, causing checks to fail safely
}

// Minimal ERC721 ABI needed for balanceOf
const erc721_abi = [
    "function balanceOf(address owner) view returns (uint256)"
];

/**
 * Express middleware to check Fan Club NFT ownership.
 * MUST be used AFTER authMiddleware.
 * Assumes clubId is in req.params.clubId and user address is in req.user.address.
 */
const checkClubMembership = async (req, res, next) => {
    // 1. Check if provider is available
    if (!provider) {
         console.error("ClubAuthMiddleware: Provider not initialized. Cannot check NFT ownership.");
         return res.status(503).json({ error: 'Membership verification service unavailable.' });
    }

    // 2. Get required info from request (added by previous middleware/routing)
    const clubId = req.params.clubId?.toLowerCase(); // Get clubId from URL parameter
    const userAddress = req.user?.address; // Get user address from authMiddleware

    if (!clubId) {
        return res.status(400).json({ error: 'Club ID parameter is missing from the request URL.' });
    }
    if (!userAddress) {
        // This should technically be caught by authMiddleware first
        return res.status(401).json({ error: 'User authentication missing.' });
    }

    // 3. Find the club's NFT contract address from config
    const club = clubsConfig[clubId];
    if (!club || !club.contractAddress || club.contractAddress === '0x...' || !ethers.utils.isAddress(club.contractAddress)) {
        console.warn(`ClubAuthMiddleware: Configuration missing or invalid contract address for clubId: ${clubId}`);
        return res.status(404).json({ error: 'Club configuration not found or invalid.' });
    }
    const { contractAddress, name: clubName } = club; // Get address and name

    try {
        // 4. Create an ethers Contract instance
        const nftContract = new ethers.Contract(contractAddress, erc721_abi, provider);

        // 5. Call the "balanceOf" function
        console.log(`ClubAuthMiddleware: Checking NFT balance for ${userAddress} at ${contractAddress} (${clubName})...`);
        // Use BigNumber for ethers v5
        const balanceBN = await nftContract.balanceOf(userAddress);
        const balance = parseInt(balanceBN.toString()); // Convert BigNumber/BigInt to number for simple check
        console.log(`ClubAuthMiddleware: Balance for ${userAddress} is ${balance}`);

        // 6. Check the balance
        if (balance > 0) {
            console.log(`ClubAuthMiddleware: Access GRANTED for ${userAddress} to ${clubName}.`);
            // User owns at least one NFT for this club. Allow access.
            next();
        } else {
            // User does NOT own the required NFT. Deny access.
            console.log(`ClubAuthMiddleware: Access DENIED for ${userAddress} to ${clubName}.`);
            return res.status(403).json({ error: `Access Denied: You do not hold the required NFT pass for ${clubName}.` });
        }
    } catch (error) {
        console.error(`ClubAuthMiddleware: Error verifying NFT ownership for ${clubId}:`, error);
        // Handle potential errors like invalid contract address format, network issues etc.
         if (error.code === 'CALL_EXCEPTION') {
             return res.status(500).json({ error: `Contract interaction error for ${clubName}. Please ensure the contract address is correct and the network is reachable.` });
         }
        res.status(500).json({ error: 'Internal server error during membership verification.' });
    }
};

module.exports = { checkClubMembership };
