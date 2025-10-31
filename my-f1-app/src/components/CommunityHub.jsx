import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import ClubCard from './ClubCard'; // Import the detailed ClubCard component
import { useAuth } from '../context/AuthContext'; // Import useAuth hook from context
import socketService from '../services/socketService'; // Import socket service
import * as fanClubService from '../services/fanClubService'; // Import fan club service
import * as userService from '../services/userService'; // Import user service (for username)

// Import CSS files needed for this component and its children
import './FanHub.css'; // Main CSS for the hub layout
import './ClubCard.css'; // CSS for the ClubCard component

// --- Animation Variants ---
const pageVariants = {
  initial: { opacity: 0, y: 50, scale: 0.98 },
  in: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 20, duration: 0.6 } },
  out: { opacity: 0, y: -50, scale: 0.98, transition: { duration: 0.4, ease: "easeInOut" } }
};

const cardContainerVariants = { // Renamed from cardVariants to avoid confusion
  hidden: { opacity: 0 },
  visible: (i) => ({ opacity: 1, transition: { delay: i * 0.08 } }),
};

const messageVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 25 } }
};

const contentVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut'}},
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 }}
};
// --- End Animation Variants ---


export default function CommunityHub() {
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // Get auth state
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('global'); // Default to global chat
  const [message, setMessage] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const messagesEndRef = useRef(null);

  // --- State for Live Data ---
  const [chatMessages, setChatMessages] = useState([]); // Filled by socketService
  const [reactions, setReactions] = useState([]); // Filled by socketService/API
  const [fanClubs, setFanClubs] = useState([]); // Filled by fanClubService
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [loadingReactions, setLoadingReactions] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0); // Filled by socketService
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [username, setUsername] = useState(() => localStorage.getItem('f1_username') || ''); // Initialize from localStorage

  // --- *** FIX: Moved scrollToBottom definition UP *** ---
  const scrollToBottom = () => {
    // Added optional chaining in case ref isn't set yet
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // --- *** END FIX *** ---

  // --- Effects for Data Fetching and Socket Listeners ---

  // Effect to manage Socket connection and basic listeners
  useEffect(() => {
    // ... (socket connection logic remains the same) ...
    if (!isAuthenticated || authLoading) {
        if (socketService.getConnectionStatus()) socketService.disconnect();
        setConnectionStatus('disconnected');
        return;
    }
    if (!socketService.getConnectionStatus()) {
        console.log("CommunityHub: Connecting socket...");
        socketService.connect(); // Connect to Socket.IO server (Port 5000)
    }
    setConnectionStatus(socketService.getConnectionStatus() ? 'connected' : 'connecting');

    const handleStatusUpdate = (status) => setConnectionStatus(status);
    const handleOnlineUpdate = (count) => setOnlineUsers(count || 0);

    socketService.on('statusUpdate', handleStatusUpdate);
    socketService.on('onlineUsers', handleOnlineUpdate);
    socketService.emit('requestOnlineUsers');

    return () => {
      console.log("CommunityHub: Cleaning up basic socket listeners.");
      socketService.off('statusUpdate', handleStatusUpdate);
      socketService.off('onlineUsers', handleOnlineUpdate);
    };
  }, [isAuthenticated, authLoading]);


  // Effect for Chat specific logic (loads messages when tab is active)
  useEffect(() => {
    if (!isAuthenticated || connectionStatus !== 'connected' || activeTab !== 'global') {
        return;
    }

    console.log("CommunityHub: Setting up chat listeners...");

    const handleNewMessage = (newMessageData) => {
        setChatMessages(prev => [...prev.slice(-99), newMessageData]);
    };
    const handlePreviousMessages = (previousMessages) => {
        setChatMessages(Array.isArray(previousMessages) ? previousMessages : []);
        scrollToBottom(); // <<< This call is now valid
    };
    const handleMessageError = (error) => {
         console.error("Chat Error:", error);
         alert(`Chat error: ${error.error || 'Unknown issue'}`);
    };

    socketService.on('receiveMessage', handleNewMessage);
    socketService.on('previousMessages', handlePreviousMessages);
    socketService.on('messageError', handleMessageError);
    socketService.emit('joinChat');

    if (!username && user?.walletAddress) {
        userService.getUserProfile().then(profile => {
            if(profile?.username) {
                setUsername(profile.username);
                localStorage.setItem('f1_username', profile.username);
            }
        }).catch(err => console.error("Failed to fetch username for chat:", err));
    }

    return () => {
        console.log("CommunityHub: Cleaning up chat message listeners.");
        socketService.off('receiveMessage', handleNewMessage);
        socketService.off('previousMessages', handlePreviousMessages);
        socketService.off('messageError', handleMessageError);
    };
  }, [activeTab, isAuthenticated, connectionStatus, user, username]); // Added username dependency


  // Effect to auto-scroll chat
  useEffect(() => {
      if(activeTab === 'global') {
          scrollToBottom(); // <<< This call is now valid
      }
  }, [chatMessages, activeTab]);


  // Effect for Fan Clubs specific logic
  useEffect(() => {
     // Fetch only when the clubs tab is active, user is authenticated, and clubs aren't already loaded
     if (activeTab !== 'clubs' || !isAuthenticated || fanClubs.length > 0) return;

    const fetchAndCheckClubs = async () => {
      // ... (fan clubs fetching logic remains the same) ...
      setLoadingClubs(true);
      try {
        const fetchedClubs = await fanClubService.getClubs();
        const clubsWithAccess = await Promise.all(fetchedClubs.map(async (club) => {
          let hasAccess = false;
          if (user?.walletAddress && club.contractAddress && club.contractAddress !== '0x000...UnknownAddress') {
              const membership = await fanClubService.checkClubMembership(club.id);
              hasAccess = membership.isMember;
          }
          return { ...club, isOwned: hasAccess };
        }));
        setFanClubs(clubsWithAccess);
      } catch (error) {
        console.error("Error fetching/processing fan clubs:", error);
      } finally {
        setLoadingClubs(false);
      }
    };
    fetchAndCheckClubs();
  }, [activeTab, isAuthenticated, user, fanClubs.length]); // Rerun if tab changes or user logs in


   // Effect for Reactions specific logic
   useEffect(() => {
     if (activeTab !== 'reactions') return;
     // ... (reactions fetching/listening logic remains the same) ...
     const fetchReactions = async () => {
         setLoadingReactions(true);
         await new Promise(res => setTimeout(res, 300)); // Simulate fetch
         setReactions([
             { id: 1, emoji: '🏁', count: 23, label: 'Checkered Flag' },
             { id: 2, emoji: '🚀', count: 45, label: 'Rocket Start' },
             { id: 3, emoji: '🔥', count: 67, label: 'On Fire' },
             { id: 4, emoji: '🐎', count: 34, label: 'Ferrari Power' },
             { id: 5, emoji: '🏆', count: 89, label: 'Champion' },
             { id: 6, emoji: '💨', count: 56, label: 'Gone' },
             { id: 7, emoji: '⚡', count: 42, label: 'Lightning Fast' },
             { id: 8, emoji: '🎯', count: 38, label: 'Perfect Lap' }
         ]);
         setLoadingReactions(false);
     };
     const handleReactionUpdate = (updateData) => {
         setReactions(prev => prev.map(r => r.emoji === updateData.emoji ? { ...r, count: updateData.count } : r));
     };
     fetchReactions();
     socketService.on('globalReactionUpdate', handleReactionUpdate);
     return () => {
         socketService.off('globalReactionUpdate', handleReactionUpdate);
     };
   }, [activeTab]);


  // --- Event Handlers ---
  const sendMessage = () => {
    // ... (send message logic remains the same) ...
    if (message.trim() && username && isAuthenticated && connectionStatus === 'connected') {
      const messageData = {
        username: username, text: message.trim(), userAddress: user.walletAddress, timestamp: new Date().toISOString()
      };
      socketService.emit('sendMessage', messageData);
      setMessage('');
      setShowGifPicker(false);
    } else {
        alert("Cannot send message. Ensure you are connected and have set a username in your Profile.");
    }
  };

  const addReaction = (emoji, messageId = null) => {
    // ... (add reaction logic remains the same) ...
    if (messageId) {
       console.log(`Reacting ${emoji} to message ${messageId}`);
       socketService.emit('messageReaction', { messageId, emoji, userId: user.walletAddress });
       setChatMessages(prev =>
         prev.map(msg =>
           msg.id === messageId ? { ...msg, reactions: [...(msg.reactions || []), emoji] } : msg
         )
       );
    } else {
       console.log(`Adding global reaction: ${emoji}`);
       socketService.emit('globalReaction', { emoji: emoji, userId: user.walletAddress });
       setReactions(prev =>
         prev.map(react =>
           react.emoji === emoji ? { ...react, count: (react.count || 0) + 1 } : react
         )
       );
    }
  };

  const handleJoinClub = async (clubToJoin) => {
    // ... (join club logic remains the same) ...
    console.log("Attempting to join club:", clubToJoin.name);
    try {
        const result = await fanClubService.joinClub(clubToJoin.id);
        if (result.success) {
            alert(`Successfully joined ${clubToJoin.name}!`);
            setFanClubs([]); // Clear to trigger refetch
            setLoadingClubs(true);
        } else {
             throw new Error(result.message || "Failed to join club.");
        }
    } catch (error) {
        console.error('Join club failed:', error);
        alert(`Failed to join club: ${error.message}`);
    }
  };

  const handleSelectClub = (selectedClubData) => {
    // ... (select club logic remains the same) ...
    if (!selectedClubData?.isOwned) {
         alert(`You must own the ${selectedClubData.name} NFT to enter. Try joining first!`);
         return;
    }
    console.log("Entering club:", selectedClubData.name);
    navigate(`/clubs/${selectedClubData.id}`);
  };

  // --- Helper Arrays ---
  const f1Gifs = ['🏎️','🚦','🏁','🛞','⚡','💨','🔥','🎯','🚀','👑','🐎','🐂','⭐','🍊','💚','🔵','📈','📉','🔄','⏱️','🙌','👏','👍'];
  const quickReactions = ['👍', '❤️', '🚀', '🔥', '🏆', '🎯'];

  // --- Render ---
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
            {/* ... (Header JSX remains the same) ... */}
            <div className="header-left">
                <Link to="/" className="back-button">← Back</Link>
                <div className="fanhub-title"><h1>🏎️ F1 Community Hub</h1><p>Connect Globally</p></div>
            </div>
            <div className="header-right">
                <div className="live-stats">
                    <div className="online-count"><span className="count">{onlineUsers.toLocaleString()}</span><span className="label">Online</span></div>
                </div>
            </div>
        </header>

        <main className="fanhub-main">
          {/* Tabs */}
          <nav className="fanhub-tabs">
             {['global', 'clubs', 'reactions'].map(tabId => (
                 <motion.button key={tabId} className={`tab-button ${activeTab === tabId ? 'active' : ''}`} onClick={() => setActiveTab(tabId)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    {tabId === 'global' && '🌍 Global Chat'}
                    {tabId === 'clubs' && '🏁 Fan Clubs'}
                    {tabId === 'reactions' && '🎯 Track Reactions'}
                 </motion.button>
             ))}
          </nav>

          {/* Content Area */}
          <div className="fanhub-content">
            <AnimatePresence mode="wait">

              {/* Global Chat Tab */}
              {activeTab === 'global' && (
                <motion.div key="global" className="content-section chat-section" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                   {/* ... (Chat JSX remains the same) ... */}
                   {!isAuthenticated ? (<div className="auth-required-chat-inline">Please connect wallet to chat.</div>)
                   : !username ? (<div className="auth-required-chat-inline">Please set username in Profile to chat.</div>)
                   : (<div className="chat-container">
                       <div className="chat-messages">
                            {chatMessages.length === 0 && <p className="no-messages-indicator">Loading messages or none yet...</p>}
                            {chatMessages.map((msg, index) => (
                                <motion.div key={msg._id || msg.id || index} className={`message ${msg.userAddress === user.walletAddress || msg.username === username ? 'my-message' : ''}`} variants={messageVariants} initial="hidden" animate="visible">
                                    <div className="message-avatar" style={{ backgroundColor: msg.userAddress === user.walletAddress || msg.username === username ? '#646cff' : '#444' }}>{msg.username?.charAt(0).toUpperCase() || '?'}</div>
                                    <div className="message-content">
                                        <div className="message-header"><span className="user-name">{msg.username || 'Anon'}</span><span className="timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}</span></div>
                                        <div className="message-text">{msg.text || msg.message}</div>
                                        {(msg.reactions && msg.reactions.length > 0) && (<div className="message-reactions">{msg.reactions.map((r, i)=><span key={i} className="reaction-bubble">{r}</span>)}</div>)}
                                    </div>
                                    {!(msg.userAddress === user.walletAddress || msg.username === username) && (
                                        <div className="message-actions">{quickReactions.map((r, i)=><motion.button key={i} className="quick-react" onClick={()=>addReaction(r, msg._id || msg.id)} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>{r}</motion.button>)}</div>
                                    )}
                                </motion.div>
                            ))}
                           <div ref={messagesEndRef} />
                       </div>
                       <div className="chat-input-section">
                            <div className="input-container">
                                <button className="gif-toggle" onClick={() => setShowGifPicker(!showGifPicker)}>{showGifPicker ? '⌨️' : '🎭'}</button>
                                <AnimatePresence>{showGifPicker && <motion.div className="gif-picker" initial={{opacity:0, height:0, marginBottom:0}} animate={{opacity:1, height:'auto', marginBottom:'10px'}} exit={{opacity:0, height:0, marginBottom:0}}><div className="gif-grid">{f1Gifs.map((g, i)=><motion.button key={i} className="gif-option" onClick={()=>setMessage(p=>p+g)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>{g}</motion.button>)}</div></motion.div>}</AnimatePresence>
                                <input type="text" value={message} onChange={(e)=>setMessage(e.target.value)} placeholder={connectionStatus !== 'connected' ? "Connecting..." : "Send a message..."} onKeyPress={(e)=> e.key === 'Enter' && sendMessage()} className="chat-input" disabled={connectionStatus !== 'connected'}/>
                                <motion.button onClick={sendMessage} className="send-button" disabled={!message.trim() || connectionStatus !== 'connected'} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Send ➤</motion.button>
                            </div>
                       </div>
                     </div>
                   )}
                </motion.div>
              )}

              {/* Fan Clubs Tab */}
              {activeTab === 'clubs' && (
                <motion.div key="clubs" className="content-section clubs-section" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                   {/* ... (Clubs JSX remains the same) ... */}
                   {!isAuthenticated ? (<div className="auth-required-chat-inline">Please connect wallet to view/join clubs.</div>)
                   : loadingClubs ? (<div className="loading-state"><div className="loading-spinner"></div><p>Loading Clubs...</p></div>)
                   : fanClubs.length === 0 ? (<p className="no-messages-indicator">No Fan Clubs available.</p>)
                   : (<>
                       <div className="clubs-header"><h2>Join Communities</h2><p>Access exclusive content via NFT ownership</p></div>
                       <div className="clubs-grid">
                           {fanClubs.map((club, index) => (
                               <motion.div key={club.id} variants={cardContainerVariants} initial="hidden" animate="visible" custom={index}>
                                   <ClubCard club={club} onJoin={handleJoinClub} onSelect={handleSelectClub} isOwned={club.isOwned} />
                               </motion.div>
                           ))}
                       </div>
                      </>)
                   }
                </motion.div>
              )}

              {/* Reactions Tab */}
              {activeTab === 'reactions' && (
                <motion.div key="reactions" className="content-section reactions-section" variants={contentVariants} initial="initial" animate="animate" exit="exit">
                    {/* ... (Reactions JSX remains the same) ... */}
                    {!isAuthenticated ? (<div className="auth-required-chat-inline">Please connect wallet to participate.</div>)
                   : loadingReactions ? (<div className="loading-state"><div className="loading-spinner"></div><p>Loading Reactions...</p></div>)
                   : (<>
                       <div className="reactions-header"><h2>Track-Wide Reactions</h2><p>Show support in real-time</p></div>
                       <div className="reactions-grid">
                            {reactions.map((reaction, index) => (
                            <motion.button
                                key={reaction.id}
                                className="reaction-card"
                                variants={cardContainerVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{y:-5}}
                                whileTap={{ scale: 0.95 }}
                                custom={index}
                                onClick={() => addReaction(reaction.emoji)}
                            >
                                <div className="reaction-emoji">{reaction.emoji}</div>
                                <div className="reaction-info">
                                <span className="count">{(reaction.count||0).toLocaleString()}</span>
                                <span className="label">{reaction.label}</span>
                                </div>
                                <div className="reaction-progress" style={{ width: `${Math.min(100, (reaction.count / 100) * 100)}%` }}></div>
                            </motion.button>
                            ))}
                       </div>
                       <div className="quick-reactions-section"><h3>Quick React Now</h3><div className="quick-reactions-grid">{f1Gifs.slice(0,16).map((g, i)=><motion.button key={i} className="quick-reaction-btn" whileHover={{ scale:1.15, rotate: Math.random()*10-5 }} whileTap={{ scale: 0.9 }} onClick={()=>addReaction(g)}>{g}</motion.button>)}</div></div>
                      </>)
                   }
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="fanhub-footer">
            {/* ... (Footer JSX remains the same) ... */}
            <div className="footer-content">
                <div className="active-now"><span>🔥 Trending: Qualifying Analysis</span></div>
                <div className="footer-stats">
                    <span>🏁 156k msgs today</span>
                    <span>🌍 {onlineUsers} fans online</span>
                </div>
            </div>
        </footer>
      </div>
    </motion.div>
  );
}

