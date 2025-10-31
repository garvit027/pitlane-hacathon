// pitlane-api/config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Ensure env variables are loaded

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  // More robust check for placeholder or missing URI
  if (!uri || uri.includes('<username>') || uri.includes('YOUR_CONNECTION_STRING')) {
    console.warn('⚠️ API Server: MONGO_URI is not configured correctly in .env. Database features will be disabled.');
    return; // Don't attempt connection if URI seems invalid
  }

  try {
    // Mongoose 6+ options are handled automatically
    await mongoose.connect(uri);
    console.log("✅ MongoDB Atlas Connected (API Server)");
  } catch (err) {
    console.error("❌ API Server MongoDB Connection Error:", err.message);
    // Exit the process if the database connection is critical for the API server
    process.exit(1);
  }
};

// Health check function to verify DB connection state
const healthCheck = () => {
    const uri = process.env.MONGO_URI;
    if (!uri || uri.includes('<username>') || uri.includes('YOUR_CONNECTION_STRING')) return { ok: false, detail: 'MONGO_URI not configured' };

    const state = mongoose.connection.readyState;
    // Mongoose connection states: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting', 'uninitialized'];
    return { ok: state === 1, detail: `connectionState=${state} (${states[state] || 'unknown'})` };
};

// Export both the connection function and the health check
module.exports = { connectDB, healthCheck };

