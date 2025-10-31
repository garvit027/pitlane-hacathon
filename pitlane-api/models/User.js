// pitlane-api/models/User.js
const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
    favoriteTeam: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 500 }
}, { _id: false }); // No separate ID for the subdocument

const UserStatsSchema = new mongoose.Schema({
    memberSince: { type: Date, default: Date.now },
    // Add other stats as needed (e.g., totalSpent, ticketsPurchased)
}, { _id: false });

const UserSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: [true, 'Wallet address is required.'],
        unique: true, // Ensure each wallet address is unique
        lowercase: true,
        trim: true,
        match: [/^0x[a-fA-F0-9]{40}$/, 'Please provide a valid wallet address.'] // Basic validation
    },
    username: { // Username for chat/display
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 30,
        // Optional: Add unique index if usernames must be unique across the platform
        // unique: true,
        // sparse: true // Allows multiple null/undefined usernames if not unique
    },
    email: { // Optional: For notifications?
        type: String,
        trim: true,
        lowercase: true,
        // Optional: Add validation
        // match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    nonce: { // Used for sign-in-with-ethereum
        type: String,
        required: [true, 'Nonce is required for authentication.'],
        default: () => `Nonce:${Math.floor(Math.random() * 1000000)}:${Date.now()}` // Generate default nonce
    },
    profile: UserProfileSchema, // Embed profile subdocument
    stats: UserStatsSchema,     // Embed stats subdocument

}, {
    timestamps: true // Automatically add createdAt and updatedAt fields
});

// Create index on walletAddress for faster lookups
UserSchema.index({ walletAddress: 1 });
UserSchema.index({ username: 1 }); // Index username if searching/checking uniqueness

// Method to generate a new nonce for re-authentication
UserSchema.methods.generateNonce = function () {
  const newNonce = `Nonce:${Math.floor(Math.random() * 1000000)}:${Date.now()}`;
  this.nonce = newNonce;
  // Note: Remember to save the user document after calling this: await user.save();
  return newNonce;
};


module.exports = mongoose.model('User', UserSchema);
