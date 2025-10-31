// pitlane-realtime/models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true, minlength: 2, maxlength: 30 }, // Added validation
  text: { type: String, required: true, trim: true, maxlength: 500 }, // Added validation
  userAddress: { type: String, lowercase: true, trim: true }, // Optional: Link message to wallet address
  timestamp: { type: Date, default: Date.now },
  room: { type: String, default: 'global', index: true } // Optional: For multiple chat rooms, added index
});

// Optional: Add index on timestamp for faster sorting
messageSchema.index({ timestamp: 1 });
messageSchema.index({ room: 1, timestamp: 1 });

module.exports = mongoose.model("Message", messageSchema);
