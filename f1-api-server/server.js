// pitlane-realtime/server.js
require("dotenv").config(); // Load .env variables first

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { connectDB, healthCheck: dbHealthCheck } = require("./config/db"); // Use db.js
const Message = require("./models/Message"); // Import Message model
const { startScoreBroadcasting } = require("./services/scoreService"); // Import score service

// --- Connect to Database ---
connectDB();

// --- App & Server Setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev, restrict in production (e.g., process.env.FRONTEND_URL)
    methods: ["GET", "POST"],
  },
  // Optional: Add transport preferences
  // transports: ['websocket', 'polling']
});

// --- Middleware ---
app.use(cors());
// No need for express.json() if this server only handles sockets and simple health check

// --- Basic Health Check Route ---
app.get('/health', (req, res) => {
    const dbStatus = dbHealthCheck ? dbHealthCheck() : { ok: true, detail: 'DB Check N/A' };
    // Add checks for scoreService health if applicable
    const overall = dbStatus.ok;
    res.status(overall ? 200 : 503).json({ // Use 503 Service Unavailable if DB fails
        ok: overall,
        server: 'pitlane-realtime',
        status: 'Running',
        checks: { database: dbStatus },
        timestamp: new Date()
    });
});

// --- SOCKET.IO EVENTS ---
io.on("connection", (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);
  // Emit current online count to the newly connected client and everyone else
  io.emit('onlineUsers', io.engine.clientsCount);

  // --- Chat Events ---
  // Send message history when a user requests it (e.g., after joining/connecting)
  socket.on("joinChat", async () => {
    console.log(`Socket ${socket.id} requested chat history.`);
    try {
      // Fetch last N messages (e.g., 50-100)
      const messages = await Message.find()
                                   .sort({ timestamp: -1 }) // Get latest first
                                   .limit(50) // Limit the number of messages sent
                                   .lean(); // Use lean for performance
      // Send messages in chronological order (oldest first)
      socket.emit("previousMessages", messages.reverse());
      console.log(`Sent ${messages.length} previous messages to ${socket.id}`);
    } catch (error) {
        console.error(`Error fetching chat history for ${socket.id}:`, error);
        socket.emit('messageError', { error: 'Could not load chat history.' });
    }
  });

  // Handle incoming chat messages
  socket.on("sendMessage", async (data) => {
     console.log(`Message from ${socket.id}:`, data);
     // Basic validation
     if (data && data.text && data.username &&
         typeof data.text === 'string' && data.text.trim().length > 0 && data.text.length <= 500 &&
         typeof data.username === 'string' && data.username.trim().length >= 2 && data.username.length <= 30)
     {
         // TODO: Add rate limiting per socket ID if needed

         const messageData = {
             username: data.username.trim(), // Sanitize/Trim
             text: data.text.trim(),       // Sanitize/Trim
             timestamp: new Date(),
             // userAddress: socket.userAddress // Add if you implement socket authentication
             // room: 'global' // Add if supporting multiple rooms
         };
         try {
             // Save message to the database
             const msg = new Message(messageData);
             await msg.save();
             // Broadcast message to ALL connected clients including sender
             io.emit("receiveMessage", msg.toObject()); // Send saved message object back
             console.log(`Broadcasted message from ${data.username}`);
         } catch(error) {
              console.error("Error saving/broadcasting message:", error);
              // Send error only back to the sender
              socket.emit('messageError', { error: 'Could not send message due to server error.' });
         }
     } else {
         console.warn("Invalid message data received:", data);
         // Send error only back to the sender
         socket.emit('messageError', { error: 'Invalid message format or content.' });
     }
  });
  // --- End Chat Logic ---

  // --- Live Score Events ---
  // This server listens for 'updateScore' (e.g., from an admin tool or another service)
  // and broadcasts 'liveScore' to all connected clients.
  socket.on("updateScore", (scoreData) => {
    console.log("Received score update to broadcast:", scoreData);
    // TODO: Add validation for scoreData structure? Ensure it's safe.
    io.emit("liveScore", scoreData); // Broadcast to all connected clients
    console.log("Broadcasted liveScore update.");
  });
  // --- End Live Score ---

  // --- Bot Alert Forwarding (Optional) ---
  // If the API server detects a bot and needs to alert clients via this server
  socket.on("forwardBotAlert", (alertData) => {
      console.warn("Received bot alert to forward:", alertData);
      io.emit("botAlert", alertData); // Broadcast alert to all connected clients
  });
  // --- End Bot Alert ---


  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${socket.id}, Reason: ${reason}`);
    // Emit updated online count after a short delay to handle quick reconnects
    setTimeout(() => {
        io.emit('onlineUsers', io.engine.clientsCount);
    }, 500);
  });

  // Handle generic socket errors for this specific connection
  socket.on("error", (error) => {
      console.error(`Socket Error (${socket.id}):`, error);
  });
});

// --- Start Score Broadcasting (Example using interval) ---
// This assumes scoreService fetches/calculates scores periodically.
// If scores are pushed via the "updateScore" event, you might not need this interval.
// startScoreBroadcasting(io); // Uncomment and implement scoreService if needed

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Socket Server (pitlane-realtime) running on port ${PORT}`);
    console.log(`🔗 Socket Health Check: http://localhost:${PORT}/health`);
});

