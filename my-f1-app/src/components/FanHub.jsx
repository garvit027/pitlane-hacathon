import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import ClubCard from './ClubCard'; // Import the ClubCard component
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import socketService from '../services/socketService'; // Import socket service
import * as fanClubService from '../services/fanClubService'; // Import fan club service
import * as userService from '../services/userService'; // Import user service (for username)

import './FanHub.css'; // Main CSS for the hub
import './ClubCard.css'; // CSS for the ClubCard

// --- Animation Variants (Keep as defined previously) ---
const pageVariants = { /* ... */ };
const cardVariants = { /* ... */ }; // For club/reaction cards if ClubCard doesn't handle its own entry
const messageVariants = { /* ... */ };
// --- End Variants ---


export default function CommunityHub() {
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // Get auth state
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('global');
  const [message, setMessage] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const messagesEndRef = useRef(null);

  // --- State for Live Data ---
  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]); // Store global reactions { id, emoji, count, label }
  const [fanClubs, setFanClubs] = useState([]); // Store fetched club data { ..., isOwned: boolean }
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingReactions, setLoadingReactions] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [username, setUsername] = useState(localStorage.getItem('f1_username') || ''); // Get username

  // --- Refs ---
  const initialLoadRef = useRef(true); // Flag for initial data load

  // --- Effects for Socket Connection and Data Fetching ---

  // Effect to manage Socket connection and basic listeners
  useEffect(() => {
    if (!isAuthenticated || authLoading) {
        // Don't connect if user isn't authenticated or auth is still loading
        if (socketService.getConnectionStatus()) socketService.disconnect(); // Disconnect if previously connected
        setConnectionStatus('disconnected');
        return;
    }

    // Connect socket if authenticated and not already connected
    if (!socketService.getConnectionStatus()) {
        console.log("CommunityHub: Connecting socket...");
        socketService.connect();
    }
    setConnectionStatus(socketService.getConnectionStatus() ? 'connected' : 'connecting');

    // Listener for connection status changes
    const handleStatusUpdate = (status) => setConnectionStatus(status);
    const handleOnlineUpdate = (count) => setOnlineUsers(count || 0);

    socketService.on('statusUpdate', handleStatusUpdate);
    socketService.on('onlineUsers', handleOnlineUpdate);
    socketService.emit('requestOnlineUsers'); // Request initial count

    // Cleanup on unmount or auth change
    return () => {
      console.log("CommunityHub: Cleaning up basic socket listeners.");
      socketService.off('statusUpdate', handleStatusUpdate);
      socketService.off('onlineUsers', handleOnlineUpdate);
      // Decide whether to disconnect based on app logic (maybe disconnect on logout?)
      // socketService.disconnect();
    };
  }, [isAuthenticated, authLoading]); // Rerun when auth status changes


  // Effect for Chat specific logic (messages)
  useEffect(() => {
    if (!isAuthenticated || !connectionStatus === 'connected' || activeTab !== 'global') {
        // Only run if authenticated, connected, and chat tab is active
        return;
    }

    console.log("CommunityHub: Setting up chat listeners...");

    const handleNewMessage = (newMessageData) => {
        setChatMessages(prev => [...prev.slice(-99), newMessageData]); // Add new, keep max 100
        scrollToBottom();
    };
    const handlePreviousMessages = (previousMessages) => {
        setChatMessages(Array.isArray(previousMessages) ? previousMessages : []);
        scrollToBottom();
    };
    const handleMessageError = (error) => {
         console.error("Chat Error:", error);
         alert(`Chat error: ${error.error || 'Unknown issue'}`);
    };

    socketService.on('receiveMessage', handleNewMessage);
    socketService.on('previousMessages', handlePreviousMessages);
    socketService.on('messageError', handleMessageError); // Listen for send errors

    // Request history when tab becomes active and socket is connected
    socketService.emit('joinChat');

    // Fetch username if not already set
    if (!username && user?.walletAddress) {
        userService.getUserProfile().then(profile => {
            if(profile?.username) {
                setUsername(profile.username);
                localStorage.setItem('f1_username', profile.username);
            }
        }).catch(err => console.error("Failed to fetch username for chat:", err));
    }


    // Cleanup chat listeners
    return () => {
        console.log("CommunityHub: Cleaning up chat message listeners.");
        socketService.off('receiveMessage', handleNewMessage);
        socketService.off('previousMessages', handlePreviousMessages);
        socketService.off('messageError', handleMessageError);
    };
     // Rerun if tab changes, connection status changes, or user auth changes
  }, [activeTab, isAuthenticated, connectionStatus, user, username]);


  // Effect for Fan Clubs specific logic
  useEffect(() => {
     // Fetch only when the clubs tab is active and not already loaded/loading
     if (activeTab !== 'clubs' || !isAuthenticated || fanClubs.length > 0) return;

    const fetchAndCheckClubs = async () => {
      setLoadingClubs(true);
      console.log("CommunityHub: Fetching fan clubs...");
      try {
        const fetchedClubs = await fanClubService.getClubs(); // Gets base club data

        // Check ownership status for each club
        const clubsWithAccess = await Promise.all(fetchedClubs.map(async (club) => {
          let hasAccess = false;
          if (user?.walletAddress && club.contractAddress) {
              const membership = await fanClubService.checkClubMembership(club.id);
              hasAccess = membership.isMember;
          }
          return { ...club, isOwned: hasAccess }; // Add isOwned property
        }));

        setFanClubs(clubsWithAccess);
      } catch (error) {
        console.error("Error fetching/processing fan clubs:", error);
        // Handle error display in UI if needed
      } finally {
        setLoadingClubs(false);
      }
    };

    fetchAndCheckClubs();

  }, [activeTab, isAuthenticated, user]); // Rerun if tab changes or user logs in


   // Effect for Reactions specific logic (Placeholder)
   useEffect(() => {
     if (activeTab !== 'reactions') return;

     const fetchReactions = async () => {
         setLoadingReactions(true);
         console.log("CommunityHub: Fetching global reactions...");
         // TODO: Implement API/Socket call to get initial reaction counts
         // Example: const initialCounts = await someService.getReactionCounts();
         // Set initial state based on fetched counts
          await new Promise(res => setTimeout(res, 300)); // Simulate fetch
          setReactions([ // Using mock for now
             { id: 1, emoji: '🏁', count: 23, label: 'Checkered Flag' },
             { id: 2, emoji: '🚀', count: 45, label: 'Rocket Start' },
             { id: 3, emoji: '🔥', count: 67, label: 'On Fire' },
             { id: 4, emoji: '🐎', count: 34, label: 'Ferrari Power' },
             { id: 5, emoji: '🏆', count: 89, label: 'Champion' },
             { id: 6, emoji: '💨', count: 56, label: 'Gone' },
          ]);
         setLoadingReactions(false);
     };

     const handleReactionUpdate = (updateData) => {
         // { emoji: '🚀', count: 46 }
         console.log("Reaction update received:", updateData);
         setReactions(prev => prev.map(r => r.emoji === updateData.emoji ? { ...r, count: updateData.count } : r));
     };

     fetchReactions();
     socketService.on('reactionUpdate', handleReactionUpdate); // Listen for updates

     return () => {
         console.log("CommunityHub: Cleaning up reaction listeners.");
         socketService.off('reactionUpdate', handleReactionUpdate);
     };

   }, [activeTab]); // Rerun when reactions tab is active


  // --- Event Handlers ---

  const sendMessage = () => {
    if (message.trim() && username && isAuthenticated && connectionStatus === 'connected') {
      const messageData = {
        username: username,
        text: message.trim(),
        // userAddress: user.walletAddress // Backend likely gets this via authenticated socket
        timestamp: new Date().toISOString()
      };
      socketService.emit('sendMessage', messageData);
      setMessage('');
      setShowGifPicker(false);
    } else {
        alert("Cannot send message. Ensure you are connected and have set a username.");
    }
  };

  const addReaction = (emoji, messageId = null) => {
    if (messageId) {
       // TODO: Emit socket event for message reaction e.g., 'reactToMessage'
       console.log(`Reacting ${emoji} to message ${messageId}`);
       // Optimistic UI update (remove if backend confirms via 'messageReaction' event)
       setChatMessages(prev =>
         prev.map(msg =>
           msg.id === messageId
             ? { ...msg, reactions: [...(msg.reactions || []), emoji] }
             : msg
         )
       );
       socketService.emit('messageReaction', { messageId, emoji }); // Example emit
    } else {
       // Global reaction
       console.log(`Adding global reaction: ${emoji}`);
       // Optimistic UI update (remove if backend confirms via 'reactionUpdate' event)
       setReactions(prev =>
         prev.map(react =>
           react.emoji === emoji
             ? { ...react, count: (react.count || 0) + 1 }
             : react
         )
       );
       socketService.emit('globalReaction', { emoji: emoji }); // Example emit
    }
  };

   const handleJoinClub = async (clubToJoin) => {
    console.log("Attempting to join club:", clubToJoin.name);
    try {
        // Use the fanClubService to handle the join process
        const result = await fanClubService.joinClub(clubToJoin.id); // Pass club ID
        if (result.success) {
            alert(`Successfully joined ${clubToJoin.name}! Transaction: ${result.transactionHash || 'N/A'}`);
            // Refetch clubs to update ownership status
            // Reset fanClubs state to trigger refetch in useEffect
            setFanClubs([]);
            setLoadingClubs(true); // Show loading while refetching
        } else {
             throw new Error(result.message || "Failed to join club.");
        }
    } catch (error) {
        console.error('Join club failed:', error);
        alert(`Failed to join club: ${error.message}`);
    }
  };

  const handleSelectClub = (selectedClubData) => {
    console.log("Entering club:", selectedClubData.name);
    // Navigate to the specific club dashboard
    navigate(`/clubs/${selectedClubData.id}`); // Use the club ID for the route
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const f1Gifs = ['🏎️','🚦','🏁','🛞','⚡','💨','🔥','🎯','🚀','👑','🐎','🐂','⭐','🍊','💚','🔵','📈','📉','🔄','⏱️','🙌','👏','👍']; // Shortened list
  const quickReactions = ['👍', '❤️', '🚀', '🔥', '🏆', '🎯'];

  // --- Render Logic ---
  return (
    <motion.div
      className="fanhub-container"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      <div className="fanhub-track-overlay" aria-hidden="true" />

      <div className="fanhub-panel">
        <header className="fanhub-header">
           <div className="header-left">
             <Link to="/" className="back-button">← Back</Link> {/* Simplified text */}
             <div className="fanhub-title"><h1>🏎️ F1 Community Hub</h1><p>Connect Globally</p></div>
           </div>
           <div className="header-right">
             <div className="live-stats">
               <div className="online-count">
                 <span className="count">{onlineUsers.toLocaleString()}</span>
                 <span className="label">Online</span>
               </div>
               {/* Avatars placeholder */}
               {/* <div className="user-avatars">...</div> */}
             </div>
           </div>
        </header>

        <main className="fanhub-main">
          {/* Tabs */}
          <nav className="fanhub-tabs">
            {/* Tab Buttons */}
             {['global', 'clubs', 'reactions'].map(tabId => (
                 <motion.button
                   key={tabId}
                   className={`tab-button ${activeTab === tabId ? 'active' : ''}`}
                   onClick={() => setActiveTab(tabId)}
                   whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                 >
                    {tabId === 'global' && '🌍 Global Chat'}
                    {tabId === 'clubs' && '🏁 Fan Clubs'}
                    {tabId === 'reactions' && '🎯 Track Reactions'}
                 </motion.button>
             ))}
          </nav>

          {/* Content */}
          <div className="fanhub-content">
            <AnimatePresence mode="wait">
              {/* Global Chat */}
              {activeTab === 'global' && (
                <motion.div key="global" className="content-section chat-section" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                   {/* Check Auth */}
                   {!isAuthenticated ? (
                       <div className="auth-required-chat-inline">Please connect wallet to chat.</div>
                   ) : !username ? (
                        <div className="auth-required-chat-inline">Please set username in Profile to chat.</div>
                   ) : (
                       <div className="chat-container">
                         {/* Messages */}
                         <div className="chat-messages">
                            {chatMessages.length === 0 && <p className="no-messages-indicator">No messages yet. Start the conversation!</p>}
                            {chatMessages.map((msg, index) => (
                                <motion.div key={msg._id || msg.id || index} className={`message ${msg.user === user.walletAddress || msg.username === username ? 'my-message' : ''}`} variants={messageVariants} initial="hidden" animate="visible" transition={{ delay: index * 0.03 }}>
                                    <div className="message-avatar" style={{ backgroundColor: msg.user === user.walletAddress || msg.username === username ? '#646cff' : '#444' }}>{msg.username?.charAt(0).toUpperCase() || '?'}</div>
                                    <div className="message-content">
                                        <div className="message-header"><span className="user-name">{msg.username || 'Anon'}</span><span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span></div>
                                        <div className="message-text">{msg.text || msg.message}</div>
                                        {(msg.reactions && msg.reactions.length > 0) && (<div className="message-reactions">{msg.reactions.map((r, i)=><span key={i} className="reaction-bubble">{r}</span>)}</div>)}
                                    </div>
                                    {/* Quick Reacts (only if not my message) */}
                                    {!(msg.user === user.walletAddress || msg.username === username) && (
                                        <div className="message-actions">{quickReactions.map((r, i)=><motion.button key={i} className="quick-react" onClick={()=>addReaction(r, msg._id || msg.id)} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>{r}</motion.button>)}</div>
                                    )}
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                         </div>
                         {/* Input */}
                         <div className="chat-input-section">
                            <div className="input-container">
                                <button className="gif-toggle" onClick={() => setShowGifPicker(!showGifPicker)}>{showGifPicker ? '⌨️' : '🎭'}</button>
                                <AnimatePresence>{showGifPicker && <motion.div className="gif-picker" initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}}><div className="gif-grid">{f1Gifs.map((g, i)=><motion.button key={i} className="gif-option" onClick={()=>setMessage(p=>p+g)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>{g}</motion.button>)}</div></motion.div>}</AnimatePresence>
                                <input type="text" value={message} onChange={(e)=>setMessage(e.target.value)} placeholder={connectionStatus !== 'connected' ? "Connecting..." : "Send a message..."} onKeyPress={(e)=> e.key === 'Enter' && sendMessage()} className="chat-input" disabled={connectionStatus !== 'connected'}/>
                                <motion.button onClick={sendMessage} className="send-button" disabled={!message.trim() || connectionStatus !== 'connected'} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Send ➤</motion.button>
                            </div>
                         </div>
                       </div>
                    )}
                </motion.div>
              )}

              {/* Fan Clubs */}
              {activeTab === 'clubs' && (
                <motion.div key="clubs" className="content-section clubs-section" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                   {!isAuthenticated ? (
                       <div className="auth-required-chat-inline">Please connect wallet to view/join clubs.</div>
                   ) : loadingClubs ? (
                       <div className="loading-state"><div className="loading-spinner"></div><p>Loading Clubs...</p></div>
                   ) : fanClubs.length === 0 ? (
                        <p className="no-messages-indicator">No Fan Clubs available currently.</p>
                   ) : (
                       <>
                         <div className="clubs-header"><h2>Join Your Favorite Team Communities</h2><p>Access exclusive content via NFT ownership</p></div>
                         <div className="clubs-grid">
                           {fanClubs.map((club, index) => (
                             <motion.div key={club.id} variants={cardContainerVariants} initial="hidden" animate="visible" custom={index}>
                               <ClubCard club={club} onJoin={handleJoinClub} onSelect={handleSelectClub} isOwned={club.isOwned} />
                             </motion.div>
                           ))}
                         </div>
                       </>
                   )}
                </motion.div>
              )}

              {/* Reactions */}
              {activeTab === 'reactions' && (
                <motion.div key="reactions" className="content-section reactions-section" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                    {!isAuthenticated ? (
                       <div className="auth-required-chat-inline">Please connect wallet to participate.</div>
                   ) : loadingReactions ? (
                       <div className="loading-state"><div className="loading-spinner"></div><p>Loading Reactions...</p></div>
                   ) : (
                       <>
                         <div className="reactions-header"><h2>Track-Wide Reactions</h2><p>Show your support in real-time</p></div>
                         <div className="reactions-grid">{reactions.map((r, i)=><motion.button key={r.id} className="reaction-card" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}} whileHover={{y:-5}} whileTap={{ scale: 0.95 }} onClick={()=>addReaction(r.emoji)}><div className="reaction-emoji">{r.emoji}</div><div className="reaction-info"><span className="count">{(r.count||0).toLocaleString()}</span><span className="label">{r.label}</span></div><div className="reaction-progress" style={{ width:`${Math.min(100, (r.count/100)*100)}%` }}></div></motion.button>)}</div>
                         <div className="quick-reactions-section"><h3>Quick React Now</h3><div className="quick-reactions-grid">{f1Gifs.slice(0,16).map((g, i)=><motion.button key={i} className="quick-reaction-btn" whileHover={{ scale:1.15, rotate: Math.random()*10-5 }} whileTap={{ scale: 0.9 }} onClick={()=>addReaction(g)}>{g}</motion.button>)}</div></div>
                       </>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="fanhub-footer">
            <div className="footer-content">
                <div className="active-now"><span>🔥 Trending Now</span></div>
                <div className="footer-stats">
                    {/* Placeholder stats */}
                    <span>🏁 {Math.floor(Math.random()*100+100)}k messages</span>
                    <span>🌍 {Math.floor(Math.random()*30+70)} countries</span>
                </div>
            </div>
        </footer>
      </div>
    </motion.div>
  );
}

