import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socketService';
// Corrected Import: Use '*' to import all named exports as an object
import * as userService from '../services/userService';

function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(1); // Placeholder
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeChat();
    // Cleanup listeners when component unmounts or user changes
    return () => {
       socketService.off('chatMessage', handleChatMessage);
       socketService.off('protectionUpdate', handleConnectionUpdate);
       socketService.off('messageError', handleMessageError);
       // Optional: Disconnect socket if user logs out?
       // if (!user && socketService.getConnectionStatus()) {
       //    socketService.disconnect();
       // }
    };
  }, [user]); // Rerun initialization if user changes

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    if (!user?.walletAddress) {
       console.log("Chat: User not available yet.");
       setIsConnected(false); // Ensure disconnected state if no user
       return;
    }

    // Load user profile to get username
    let userUsername = '';
    try {
      const profile = await userService.getUserProfile(); // Uses named import correctly now
      userUsername = profile?.username || localStorage.getItem('f1_username');
      setUsername(userUsername);
      setTempUsername(userUsername || '');

      // Show username modal if no username set
      if (!userUsername) {
        setShowUsernameModal(true);
      }
    } catch (error) {
      console.error('Error loading user profile for chat:', error);
      // Fallback to local storage even on error
      const localUsername = localStorage.getItem('f1_username');
      userUsername = localUsername || '';
      setUsername(userUsername);
      setTempUsername(userUsername);
      if (!userUsername) {
        setShowUsernameModal(true);
      }
    }

    // Connect to socket if not already connected
    if (!socketService.getConnectionStatus()) {
        console.log("Chat: Connecting socket...");
        await socketService.connect(user.walletAddress); // Pass user identifier if needed
        setIsConnected(socketService.getConnectionStatus());
        // Request message history after connecting
        socketService.emit('requestHistory'); // Assuming backend listens for this
    } else {
        console.log("Chat: Socket already connected.");
        setIsConnected(true);
        // If already connected, ensure listeners are attached and load existing messages
        setMessages(socketService.getChatMessages()); // Get any cached messages
        socketService.emit('requestHistory'); // Still request history in case of missed messages
    }


    // Re-attach listeners (safe to call multiple times if service handles it)
    socketService.on('chatMessage', handleChatMessage);
    socketService.on('protectionUpdate', handleConnectionUpdate); // Assuming this gives connection status
    socketService.on('messageError', handleMessageError);
    // Add listener for online user count if backend provides it
    socketService.on('onlineUsers', (count) => setOnlineUsers(count));


  };

  const handleChatMessage = (data) => {
    console.log("Received message data:", data);
    if (data.type === 'history') {
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } else if (data.type === 'new' && data.message) {
      setMessages(prev => [...prev, data.message]);
    } else if (Array.isArray(data)) { // Handle case where history is just an array
       setMessages(data);
    }
  };

  const handleConnectionUpdate = (data) => {
    // Assuming data looks like { status: 'connected'/'disconnected' }
    setIsConnected(data.status === 'connected');
    console.log("Chat connection status:", data.status);
  };

  const handleMessageError = (error) => {
    console.error("Chat message error:", error);
    alert(`Failed to send message: ${error.error || 'Unknown error'}`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || !username || !isConnected) return;

    const messageData = {
      // user: user.walletAddress, // Backend might get this from socket auth
      username: username,
      text: newMessage.trim(), // Use 'text' if that's what backend expects
      timestamp: new Date().toISOString(), // Add timestamp client-side
    };

    // Use socketService to send the message
    socketService.emit('chatMessage', messageData); // Assuming backend listens for 'chatMessage'

    // Optimistic UI update (optional but makes it feel faster)
    // setMessages(prev => [...prev, { ...messageData, user: user.walletAddress, _id: Date.now() }]); // Add temporary ID

    setNewMessage(''); // Clear input after sending
  };

  const saveUsername = async () => {
    const trimmedUsername = tempUsername.trim();
    if (!trimmedUsername) {
      alert('Please enter a username');
      return;
    }
    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      alert('Username must be between 2 and 20 characters long');
      return;
    }
     // Basic check for special characters (allow spaces, numbers, letters)
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmedUsername)) {
       alert('Username can only contain letters, numbers, and spaces.');
       return;
    }


    try {
      // Use named import correctly
      await userService.setUsername(trimmedUsername); // Assuming this function exists in userService
      localStorage.setItem('f1_username', trimmedUsername); // Save locally too
      setUsername(trimmedUsername);
      setShowUsernameModal(false);

      // No need to call userService.updateUsername - setUsername should handle backend
      // if (userService.updateUsername) {
      //   userService.updateUsername(trimmedUsername);
      // }
       // Re-initialize chat or join room after setting username if needed by backend
       console.log("Username saved, potentially re-joining chat room...");
       socketService.emit('joinChat', { username: trimmedUsername }); // Example event


    } catch (error) {
      console.error('Error saving username:', error);
      alert(`Failed to save username: ${error.message || 'Server error'}`);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  };

  // Basic link formatter
  const formatMessage = (message) => {
     if (!message) return '';
     // Basic URL detection
     const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
     let formatted = message.replace(urlRegex, function(url) {
        // Truncate long URLs for display
        const displayUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">${displayUrl}</a>`;
     });
     // Handle line breaks
     formatted = formatted.replace(/\n/g, '<br />');
     return formatted;
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  // Render Loading state
  // if (loading && user) {
  //    return <div className="chat-container"><p>Loading Chat...</p></div>;
  // }


  // Render Auth Required state
  if (!user?.walletAddress) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-title">
            <h3>💬 F1 Community Chat</h3>
            <div className="connection-status">
              <div className="status-dot disconnected"></div>
              Offline
            </div>
          </div>
        </div>
        <div className="auth-required-chat">
          <div className="auth-prompt">
            <div className="auth-icon">🔐</div>
            <h3>Connect Your Wallet</h3>
            <p>Please connect your wallet to join the F1 community chat</p>
            {/* Add login button? */}
          </div>
        </div>
      </div>
    );
  }

  // Render Main Chat UI
  return (
    <div className="chat-container">
      {/* Username Modal */}
      {showUsernameModal && (
        <div className="modal-overlay">
          <div className="username-modal">
            <h3>Choose Your Chat Username</h3>
            <p>Visible to other F1 fans.</p>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Enter username..."
              maxLength={20}
              className="username-input"
              onKeyPress={(e) => e.key === 'Enter' && saveUsername()}
            />
            <div className="username-requirements">
              <span>2-20 chars (letters, numbers, space)</span>
            </div>
            <div className="modal-actions">
              <button onClick={saveUsername} className="save-username-btn">
                Start Chatting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <h3>💬 F1 Community Chat</h3>
          <div className="connection-status">
            <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        <div className="chat-info">
          <span className="online-count">{onlineUsers} online</span>
          {username && <span className="current-user">You: {username}</span>}
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {messages.length === 0 && !showUsernameModal && ( // Only show if not setting username
          <div className="no-messages">
             <h4>Welcome {username}!</h4>
             <p>Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, index) => (
          // Use msg._id from MongoDB if available, otherwise fallback
          <div
            key={msg._id || msg.timestamp || `msg-${index}`}
            className={`message ${msg.user === user?.walletAddress || msg.isOwn ? 'own-message' : ''}`}
          >
            {/* Simple Avatar */}
            <div className="message-avatar" title={msg.username || 'User'}>
              {msg.username?.charAt(0).toUpperCase() || '👤'}
            </div>
            <div className="message-content">
              <div className="message-header">
                <span className="message-username">
                   {/* Display username, fallback to shortened address */}
                  {msg.username || `User...${msg.user?.slice(-4)}`}
                  {/* Add "(You)" marker based on wallet address */}
                  {msg.user === user?.walletAddress && ' (You)'}
                </span>
                <span className="message-time">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              {/* Use dangerouslySetInnerHTML for formatted text */}
              <div
                className="message-text"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.text || msg.message) }}
              />
            </div>
          </div>
        ))}
        {/* Anchor for auto-scrolling */}
        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>

      {/* Input Form */}
      <form onSubmit={sendMessage} className="message-input-form">
        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={!username ? "Set username to chat..." : (isConnected ? "Type your message..." : "Connecting...")}
            disabled={!user || !username || !isConnected}
            maxLength={500}
            className="message-input"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !user || !username || !isConnected}
            className="send-button"
            title="Send message"
          >
            ➤
          </button>
        </div>
        <div className="input-info">
          {username && <span className="char-count">{newMessage.length}/500</span>}
          {!username && user && ( // Show button only if logged in but no username
            <button
              type="button"
              onClick={() => { setTempUsername(''); setShowUsernameModal(true); }} // Reset temp on open
              className="set-username-btn"
            >
              Set Username to Chat
            </button>
          )}
          {!isConnected && user && <span className="connection-warning">Connecting...</span>}
        </div>
      </form>
    </div>
  );
}

export default Chat;
