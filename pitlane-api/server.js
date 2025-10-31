// pitlane-api/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
// const http = require('http'); // REMOVED - Not needed for API-only server

// --- Import DB Config ---
const dbConfig = require('./config/db');

// --- Import Middlewares ---
const { authMiddleware } = require('./middleware/authMiddleware');

// --- Connect to Database ---
dbConfig.connectDB();

// --- Import Route Handlers ---
const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const web3Routes = require('./routes/web3Routes');

// --- Optional Services (Keep if using Tenderly, Flashbots, etc.) ---
// I'm assuming you have named these services with these incorrect spellings locally
const mempoolService = require('./services/memepoolScanner'); 
const tenderlyService = require('./services/tenderlySimulator');
const flashbotsService = require('./services/flashbotRelay');

// --- Initialize Express ---
const app = express();
const port = process.env.PORT || 3001;

// --- Core Middleware ---
app.use(cors());
app.use(express.json());

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/users', userProfileRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/web3', web3Routes);

// --- Health Check Endpoint ---
app.get('/api/health', async (req, res) => {
  const checks = {};

  try {
    checks.database = dbConfig.healthCheck
      ? await dbConfig.healthCheck()
      : { ok: true, detail: 'No DB check function' };
  } catch (e) {
    checks.database = { ok: false, detail: e.message };
  }

  try {
    checks.mempool = mempoolService.healthCheck
      ? await mempoolService.healthCheck()
      : { ok: true, detail: 'No mempool check function' };
  } catch (e) {
    checks.mempool = { ok: false, detail: e.message };
  }

  try {
    checks.tenderly = tenderlyService.healthCheck
      ? await tenderlyService.healthCheck()
      : { ok: true, detail: 'No tenderly check function' };
  } catch (e) {
    checks.tenderly = { ok: false, detail: e.message };
  }

  try {
    checks.flashbots = flashbotsService.healthCheck
      ? await flashbotsService.healthCheck()
      : { ok: true, detail: 'No flashbots check function' };
  } catch (e) {
    checks.flashbots = { ok: false, detail: e.message };
  }

  const overall = Object.values(checks).every((c) => c.ok);

  res.status(overall ? 200 : 503).json({
    ok: overall,
    service: 'pitlane-api',
    status: overall ? 'Healthy' : 'Degraded',
    checks,
    timestamp: new Date(),
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    details: err.message,
  });
});

// --- Start Optional Mempool Scanner ---
if (process.env.ENABLE_MEMPOOL_SCANNER === 'true') {
  console.log('⚙️ Starting Mempool Scanner Service...');
  mempoolService.startScanner();
} else {
  console.log('ℹ️ Mempool Scanner disabled.');
}

// --- Start Server ---
app.listen(port, () => {
  console.log(`✅ pitlane-api backend running on port ${port}`);
  console.log(`🌐 Health Check: http://localhost:${port}/api/health`);
  console.log(`🚀 Web3 simulation endpoint: http://localhost:${port}/api/web3/simulate-tx`);
  console.log(`🚀 Web3 express lane endpoint: http://localhost:${port}/api/web3/express-lane`);

  if (flashbotsService.isFlashbotsConfigured?.()) {
    console.log('✅ Flashbots Relay configured.');
  } else {
    console.warn('⚠️ Flashbots Relay not configured.');
  }

  if (tenderlyService.isTenderlyConfigured?.()) {
    console.log('✅ Tenderly Simulator configured.');
  } else {
    console.warn('⚠️ Tenderly Simulator not configured.');
  }
});
