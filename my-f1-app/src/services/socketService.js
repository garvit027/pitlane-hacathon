// src/services/socketService.js
import { io } from 'socket.io-client';

// Get the Socket.IO server URL from environment variables
// This should point to your pitlane-realtime server (e.g., http://localhost:5000)
const SOCKET_URL = import.meta.env.VITE_SOCKET_BASE_URL || 'http://localhost:5000';

class SocketService {
  socket = null;
  isConnected = false;
  // Use a Map to store listeners for proper add/remove
  // This allows multiple components to listen to the same event
  listeners = new Map();

  connect() {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected.');
      return;
    }

    console.log(`Attempting to connect to Socket.IO server at ${SOCKET_URL}...`);
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'], // Prefer WebSocket
      reconnectionAttempts: 5,
      withCredentials: true // Required for CORS from a different port
    });

    // --- Standard Connection Events ---
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Socket connected:', this.socket.id);
      this.notifyListeners('statusUpdate', 'connected'); // Notify components
      this.emit('joinChat'); // Auto-join chat on connect
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Socket disconnected:', reason);
      this.notifyListeners('statusUpdate', 'disconnected'); // Notify components
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.notifyListeners('statusUpdate', 'error'); // Notify components
    });

    // --- Central listeners that dispatch to component listeners ---
    // These listen for events from your pitlane-realtime/server.js
    this.socket.on('botAlert', (data) => this.notifyListeners('botAlert', data));
    this.socket.on('receiveMessage', (data) => this.notifyListeners('receiveMessage', data));
    this.socket.on('previousMessages', (data) => this.notifyListeners('previousMessages', data));
    this.socket.on('liveScore', (data) => this.notifyListeners('liveScore', data));
    this.socket.on('onlineUsers', (data) => this.notifyListeners('onlineUsers', data));
    this.socket.on('messageError', (data) => this.notifyListeners('messageError', data));
    this.socket.on('protectionUpdate', (data) => this.notifyListeners('protectionUpdate', data));
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // --- THIS IS THE FIX for ".on is not a function" ---
  // Register a listener for a specific event
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback); // Add callback to a Set
    console.log(`[Socket] Registered listener for: ${eventName}`);
  }

  // --- THIS IS THE FIX for ".off is not a function" ---
  // Remove a listener for a specific event
  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).delete(callback); // Delete callback from Set
      console.log(`[Socket] Removed listener for: ${eventName}`);
    }
  }

  // Helper to notify all registered component listeners
  notifyListeners(eventName, data) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`Error in socket listener for ${eventName}:`, e);
        }
      });
    }
  }

  /**
   * Emit an event to the server.
   * @param {string} eventName The name of the event (e.g., 'sendMessage', 'joinChat').
   * @param {object} data The data payload to send.
   */
  emit(eventName, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn(`Socket not connected. Cannot emit event: ${eventName}`);
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Export a singleton instance so the whole app uses the same connection
const socketServiceInstance = new SocketService();
export default socketServiceInstance;

