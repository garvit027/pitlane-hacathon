// pitlane-realtime/config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Ensure env variables are loaded

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  // More robust check for placeholder or missing URI
  if (!uri || uri.includes('<username>') || uri.includes('YOUR_CONNECTION_STRING')) {
    console.warn('⚠️ Socket Server: MONGO_URI is not configured correctly in .env. Chat history might not persist.');
    return; // Don't attempt connection if URI seems invalid
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB Atlas Connected (Socket Server)");
  } catch (err) {
    console.error("❌ Socket Server MongoDB Connection Error:", err.message);
    // Decide if the server should stop if DB connection fails
    // process.exit(1);
  }
};

// Optional: Health check
const healthCheck = () => {
    const uri = process.env.MONGO_URI;
    if (!uri || uri.includes('<username>') || uri.includes('YOUR_CONNECTION_STRING')) return { ok: false, detail: 'MONGO_URI not configured' };
    const state = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return { ok: state === 1, detail: `connectionState=${state} (${states[state]})` };
};


module.exports = { connectDB, healthCheck };
