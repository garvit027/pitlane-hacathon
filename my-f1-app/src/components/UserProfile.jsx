import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as userService from '../services/userService';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // <-- THIS IS THE FIX
import './UserProfile.css'; // Assuming you have or will create this CSS file

// Page transition variants (optional)
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeInOut" } },
  out: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeInOut" } }
};


function UserProfile() {
  const { user, isAuthenticated, loading: authLoading } = useAuth(); // Get full auth state
  const navigate = useNavigate(); // Hook for navigation
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null); // Added error state

  useEffect(() => {
    // Wait for auth loading to finish
    if (authLoading) {
      setLoading(true); // Keep loading if auth state is changing
      return;
    }
    
    // If auth is done and no user, stop loading and show auth error
    if (!isAuthenticated || !user?.walletAddress) {
       console.log("UserProfile: User not authenticated.");
       setLoading(false);
       setError("Please connect your wallet to view your profile.");
       return;
    }

    // User is authenticated, load data
    loadUserData();
    
  }, [user, isAuthenticated, authLoading]); // Reload data if the user or auth state changes

  const loadUserData = async () => {
    if (!user?.walletAddress) return; // Should be covered by useEffect, but good safety check

    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Call the named exports using userService.functionName
      const [profileData, statsData, ticketsData] = await Promise.all([
        userService.getUserProfile(), // Fetches based on authenticated user (via JWT in header)
        userService.getUserStats(),   // Fetches based on authenticated user
        userService.getUserTickets() // Fetches based on authenticated user
      ]);

      setProfile(profileData);
      setStats(statsData);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
      setFormData(profileData || {}); // Initialize form with fetched data
    } catch (err) {
      console.error('Error loading user data:', err);
      setError("Failed to load user data. Please try again later."); // Set error message for UI
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault(); // Prevent default form submission
    // Add basic validation if needed
    if (!formData.username?.trim()) {
        alert("Username cannot be empty.");
        return;
    }
    try {
      // Call the named export using userService.functionName
      const updatedProfile = await userService.updateUserProfile(formData);
      setProfile(updatedProfile); // Update local profile state
      setFormData(updatedProfile); // Update form data as well
      setEditing(false); // Exit editing mode
      alert("Profile updated successfully!"); // User feedback
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(`Failed to update profile: ${err.message || 'Server error'}`);
    }
  };

  // Define F1 Teams
   const teams = [
    { id: 'ferrari', name: 'Ferrari', color: '#FF2800' },
    { id: 'mclaren', name: 'McLaren', color: '#FF8000' },
    { id: 'mercedes', name: 'Mercedes', color: '#00D2BE' },
    { id: 'redbull', name: 'Red Bull', color: '#0600EF' },
    { id: 'alpine', name: 'Alpine', color: '#0090FF' },
    { id: 'aston-martin', name: 'Aston Martin', color: '#006F62' },
    { id: 'williams', name: 'Williams', color: '#005AFF' },
    { id: 'vcarb', name: 'RB F1 Team', color: '#2B4562' }, // Updated team name
    { id: 'kick-sauber', name: 'Kick Sauber', color: '#00E90A' }, // Updated team name
    { id: 'haas', name: 'Haas', color: '#FFFFFF' }
  ];

  if (loading) {
    return (
       // Added motion.div for consistency
      <motion.div className="user-profile-loading full-page-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </motion.div>
    );
  }

  // Handle case where user is not logged in (auth finished loading)
  if (!isAuthenticated && !loading) {
      return (
          <motion.div className="user-profile-error full-page-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <h2>Authentication Required</h2>
              <p>{error || "Please connect your wallet to view your profile."}</p>
              <button className="connect-wallet-button" onClick={() => navigate('/login')}>
                  Connect Wallet
              </button>
          </motion.div>
      );
  }

  // Handle case where user is logged in, but data failed to load
  if (error && isAuthenticated) {
     return (
        <motion.div className="user-profile-error full-page-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
           <h2>Error Loading Profile</h2>
           <p>{error}</p>
           <button className="retry-btn" onClick={loadUserData}>
             🔄 Try Again
           </button>
           <button className="back-button" onClick={() => navigate('/')} style={{marginLeft: '10px'}}>
             Back Home
           </button>
        </motion.div>
     );
  }
  
  // Render profile only if profile data is loaded
  if (!profile && !loading) {
      return (
           <motion.div className="user-profile-error full-page-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
               <h2>Profile Not Found</h2>
               <p>We couldn't find a profile for this wallet. Try setting your details.</p>
                {/* Show a simplified edit form? For now, just show error and retry */}
               <button className="retry-btn" onClick={loadUserData}>
                 🔄 Try Again
               </button>
           </motion.div>
      )
  }


  // Main Profile View
  return (
    <motion.div
       className="user-profile" // Assuming UserProfile.css provides base styles
       variants={pageVariants}
       initial="initial"
       animate="in"
       exit="out"
    >
      <div className="profile-header">
         <Link to="/" className="back-button header-back-button">← Back</Link>
        <h1>👤 Your Profile</h1>
        <p>Manage your F1 fan account and preferences</p>
      </div>

      <div className="profile-content">
        {/* Stats Section */}
        <motion.div className="profile-stats" initial={{opacity: 0, y:10}} animate={{opacity:1, y: 0}} transition={{delay: 0.1}}>
          <h3>📊 Your F1 Stats</h3>
          <div className="stats-grid">
            {/* Stat Card 1: Tickets */}
            <div className="stat-card">
              <div className="stat-icon">🎫</div>
              <div className="stat-info">
                <div className="stat-number">{stats?.tickets?.total ?? 0}</div>
                <div className="stat-label">Tickets Owned</div>
              </div>
            </div>
            {/* Stat Card 2: Clubs */}
            <div className="stat-card">
              <div className="stat-icon">🏎️</div>
              <div className="stat-info">
                <div className="stat-number">{stats?.clubs?.total ?? 0}</div>
                <div className="stat-label">Club Memberships</div>
              </div>
            </div>
            {/* Stat Card 3: Spending */}
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-number">{stats?.spending?.total?.toFixed(3) ?? '0.000'}</div>
                <div className="stat-label">ETH Spent</div>
              </div>
            </div>
            {/* Stat Card 4: Member Since */}
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <div className="stat-number">
                  {profile?.stats?.memberSince
                    ? new Date(profile.stats.memberSince).toLocaleDateString()
                    : 'N/A'
                  }
                </div>
                <div className="stat-label">Member Since</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details Section (Toggles Edit/View) */}
        <motion.div className="profile-details" initial={{opacity: 0, y:10}} animate={{opacity:1, y: 0}} transition={{delay: 0.2}}>
          <div className="details-header">
            <h3>Profile Information</h3>
            <motion.button
              onClick={() => {
                 setEditing(!editing);
                 if (editing) setFormData(profile || {}); // Reset form on cancel
              }}
              className={`edit-btn ${editing ? 'cancel' : 'edit'}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {editing ? 'Cancel Edit' : 'Edit Profile'}
            </motion.button>
          </div>

          {/* Edit Form */}
          {/* This is the line that was causing the error (238) */}
          <AnimatePresence>
          {editing && (
            <motion.form
               className="edit-form"
               onSubmit={handleSaveProfile}
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input id="username" type="text" value={formData.username || ''} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="Choose a username"/>
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="your@email.com"/>
              </div>
              <div className="form-group">
                <label htmlFor="favoriteTeam">Favorite Team</label>
                <select id="favoriteTeam" value={formData.profile?.favoriteTeam || ''} onChange={(e) => setFormData({...formData, profile: {...(formData.profile || {}), favoriteTeam: e.target.value}})}>
                  <option value="">Select your team</option>
                  {teams.map(team => (<option key={team.id} value={team.id}>{team.name}</option>))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea id="bio" value={formData.profile?.bio || ''} onChange={(e) => setFormData({...formData, profile: {...(formData.profile || {}), bio: e.target.value}})} placeholder="Tell us about your F1 passion..." rows="3"/>
              </div>
              <div className="form-actions">
                <motion.button type="submit" className="save-btn" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  Save Changes
                </motion.button>
              </div>
            </motion.form>
          )}
          </AnimatePresence>

          {/* Display Info */}
          {!editing && (
            <motion.div
              className="profile-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="info-item">
                <span className="info-label">Wallet Address</span>
                <span className="info-value wallet-address">{user?.walletAddress ?? 'Not Connected'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Username</span>
                <span className="info-value">{profile?.username || <span className="placeholder">Not set</span>}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email</span>
                <span className="info-value">{profile?.email || <span className="placeholder">Not set</span>}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Favorite Team</span>
                <span className="info-value">
                  {profile?.profile?.favoriteTeam ? (
                    (() => {
                      const team = teams.find(t => t.id === profile.profile.favoriteTeam);
                      return team ? (<span className="team-badge" style={{ backgroundColor: team.color }}><span style={{ color: team.color === '#FFFFFF' ? '#000' : '#FFF'}}>{team.name}</span></span>) : (<span className="placeholder">Unknown</span>);
                    })()
                  ) : <span className="placeholder">Not set</span>}
                </span>
              </div>
              <div className="info-item bio-item">
                <span className="info-label">Bio</span>
                <span className="info-value bio-display">{profile?.profile?.bio || <span className="placeholder">No bio yet</span>}</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Recent Tickets Section */}
        <motion.div className="recent-tickets" initial={{opacity: 0, y:10}} animate={{opacity:1, y: 0}} transition={{delay: 0.3}}>
          <h3>🎫 Recent Tickets</h3>
          {tickets.length === 0 ? (
            <div className="no-tickets">
              <p>You haven't purchased any tickets yet.</p>
              <button className="browse-tickets-btn" onClick={() => navigate('/tickets')}>
                Browse Upcoming Races
              </button>
            </div>
          ) : (
            <div className="tickets-list">
              {tickets.slice(0, 5).map(ticket => (
                ticket?._id && ticket?.event && ticket?.seat ? (
                  <motion.div key={ticket._id} className="ticket-item" initial={{opacity:0}} animate={{opacity:1}} transition={{duration: 0.3}}>
                    <div className="ticket-event">
                      <strong>{ticket.event.name ?? 'Unknown Event'}</strong>
                      <span>{ticket.event.circuit ?? 'N/A'}</span>
                    </div>
                    <div className="ticket-seat">
                      {ticket.seat.section ?? 'N/A'} - R{ticket.seat.row ?? 'N/A'}, S{ticket.seat.number ?? 'N/A'}
                    </div>
                    <div className="ticket-date">
                      {ticket.event.date ? new Date(ticket.event.date).toLocaleDateString() : 'N/A'}
                    </div>
                  </motion.div>
                ) : null
              ))}
              {tickets.length > 5 && <Link to="/my-tickets" className="view-all-tickets">View All Tickets ({tickets.length})</Link>}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default UserProfile;

