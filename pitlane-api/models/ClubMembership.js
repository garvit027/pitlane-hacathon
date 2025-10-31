// pitlane-api/models/ClubMembership.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClubMembershipSchema = new mongoose.Schema({
    clubId: { // Identifier for the club (e.g., 'ferrari', 'mclaren')
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    ownerAddress: { // Wallet address of the member
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    tokenId: { // The specific NFT token ID representing the membership
        type: Number, // Assuming numeric tokenId
        required: true,
        index: true
    },
    contractAddress: { // Address of the FanClubNFT contract for this club
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    tokenURI: { // Metadata URI for this specific membership token
        type: String,
        trim: true
    },
    joinedAt: { // Timestamp when the membership was acquired
        type: Date,
        default: Date.now
    },
    mintTransactionHash: { // Transaction hash of the mint/claim
        type: String,
        sparse: true
    }
    // Add any other relevant membership details, e.g., membership level if applicable
}, {
    timestamps: true // createdAt, updatedAt
});

// Compound index to quickly find a user's membership for a specific club
// Also makes it unique (a user can only have one entry per clubId+tokenId)
ClubMembershipSchema.index({ ownerAddress: 1, clubId: 1, tokenId: 1 }, { unique: true });
ClubMembershipSchema.index({ contractAddress: 1, tokenId: 1 }, { unique: true }); // Ensure tokenId is unique per contract

module.exports = mongoose.model('ClubMembership', ClubMembershipSchema);
