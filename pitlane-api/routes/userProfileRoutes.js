// pitlane-api/routes/userProfileRoutes.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware'); // Protect all routes here
const User = require('../models/User');
const Ticket = require('../models/Ticket'); // Assuming Ticket model exists
const ClubMembership = require('../models/ClubMembership'); // Assuming ClubMembership model exists

// --- GET /api/users/profile ---
// Fetch the current authenticated user's profile details.
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userAddress = req.user.address; // Get address from verified JWT payload
    // Find user, excluding the nonce field for security
    const userProfile = await User.findOne({ walletAddress: userAddress }).select('-nonce');

    if (!userProfile) {
      // Should not happen if token is valid, but handle defensively
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Return relevant profile data
    res.json({
      _id: userProfile._id,
      walletAddress: userProfile.walletAddress,
      username: userProfile.username,
      email: userProfile.email,
      profile: userProfile.profile, // favoriteTeam, bio
      stats: userProfile.stats, // memberSince
      createdAt: userProfile.createdAt,
      // Do NOT return the nonce
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
});

// --- PUT /api/users/profile ---
// Update the current authenticated user's profile details.
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userAddress = req.user.address;
    const { username, email, profile } = req.body; // Extract updatable fields

    // Basic validation (add more as needed)
    if (username && (username.length < 2 || username.length > 30)) {
        return res.status(400).json({ error: 'Username must be between 2 and 30 characters.' });
    }
     // Optional: Check if username is already taken if it needs to be unique
     // if (username) { ... check User collection ... }

    // Find the user
    const userToUpdate = await User.findOne({ walletAddress: userAddress });
    if (!userToUpdate) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Update fields if provided
    if (username !== undefined) userToUpdate.username = username.trim();
    if (email !== undefined) userToUpdate.email = email.trim().toLowerCase();
    if (profile) {
        // Ensure nested objects exist before updating
        if (!userToUpdate.profile) userToUpdate.profile = {};
        if (profile.favoriteTeam !== undefined) userToUpdate.profile.favoriteTeam = profile.favoriteTeam;
        if (profile.bio !== undefined) userToUpdate.profile.bio = profile.bio.slice(0, 500); // Limit bio length
    }

    // Save the updated user document
    const updatedUser = await userToUpdate.save();

    console.log(`Profile updated for ${userAddress}`);
    // Return updated profile (excluding nonce)
    res.json({
      _id: updatedUser._id,
      walletAddress: updatedUser.walletAddress,
      username: updatedUser.username,
      email: updatedUser.email,
      profile: updatedUser.profile,
      stats: updatedUser.stats,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });

  } catch (error) {
    console.error("Error updating user profile:", error);
     // Handle potential duplicate key error if username is unique
     if (error.code === 11000 && error.keyPattern?.username) {
        return res.status(400).json({ error: 'Username already taken.' });
     }
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

// --- GET /api/users/stats ---
// Fetch aggregated stats for the current user.
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const userAddress = req.user.address;

        // Fetch counts in parallel
        const [ticketCount, clubCount] = await Promise.all([
            Ticket.countDocuments({ ownerAddress: userAddress }),
            ClubMembership.countDocuments({ ownerAddress: userAddress })
        ]);

        // TODO: Calculate total ETH spent (this requires storing transaction values somewhere)
        const totalSpentEth = 0.000; // Placeholder

        res.json({
            tickets: { total: ticketCount },
            clubs: { total: clubCount },
            spending: { total: totalSpentEth }
            // Add other stats if needed
        });

    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ error: 'Failed to retrieve user statistics.' });
    }
});

// --- GET /api/users/tickets ---
// Fetch a list of tickets owned by the current user.
router.get('/tickets', authMiddleware, async (req, res) => {
    try {
        const userAddress = req.user.address;

        // Find tickets owned by the user, sort by event date descending (most recent first)
        const userTickets = await Ticket.find({ ownerAddress: userAddress })
                                     .sort({ 'eventDetails.date': -1 }) // Sort by date if available
                                     .limit(50); // Limit results for performance

        // You might want to populate event details if they are stored separately
        // Or just return the denormalized data stored in the Ticket model

        res.json(userTickets);

    } catch (error) {
        console.error("Error fetching user tickets:", error);
        res.status(500).json({ error: 'Failed to retrieve user tickets.' });
    }
});

// --- POST /api/users/username ---
// Set or update the user's chat username.
router.post('/username', authMiddleware, async (req, res) => {
    try {
        const userAddress = req.user.address;
        const { username } = req.body;

        // Validation
        if (!username || typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 30) {
            return res.status(400).json({ error: 'Username must be a string between 2 and 30 characters.' });
        }
         // Optional: Add stricter character validation if needed
         if (!/^[a-zA-Z0-9 _\-]+$/.test(username.trim())) { // Allow letters, numbers, space, underscore, hyphen
            return res.status(400).json({ error: 'Username contains invalid characters.' });
         }

        // Optional: Check if username is already taken
        const existingUser = await User.findOne({ username: username.trim(), walletAddress: { $ne: userAddress } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username is already taken.' });
        }

        // Find and update the user
        const updatedUser = await User.findOneAndUpdate(
            { walletAddress: userAddress },
            { $set: { username: username.trim() } },
            { new: true, // Return the updated document
              select: '-nonce' // Exclude nonce
            }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found.' });
        }

        console.log(`Username updated for ${userAddress} to ${updatedUser.username}`);
        res.json({ success: true, message: 'Username updated successfully.', user: updatedUser });

    } catch (error) {
        console.error("Error setting username:", error);
         if (error.code === 11000) { // Handle potential race condition on unique index
             return res.status(400).json({ error: 'Username might already be taken (conflict).' });
         }
        res.status(500).json({ error: 'Failed to set username.' });
    }
});


// Add health check if desired
// router.health = async () => ({ ok: true });

module.exports = router;
