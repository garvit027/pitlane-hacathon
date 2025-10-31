import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './Overlay.css';

// --- SVG Wheel Component (from your code) ---
const WheelSVG = ({ showLoginText }) => (
  <svg className="wheel-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="tireGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="60%" stopColor="#282828" />
        <stop offset="90%" stopColor="#1a1a1a" />
        <stop offset="100%" stopColor="#0a0a0a" />
      </radialGradient>
      <linearGradient id="rimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e0e0e0" />
        <stop offset="50%" stopColor="#999" />
        <stop offset="100%" stopColor="#777" />
      </linearGradient>
      <radialGradient id="centerHubGradient">
        <stop offset="10%" stopColor="#555" />
        <stop offset="100%" stopColor="#333" />
      </radialGradient>
    </defs>
    <circle className="wheel-tire" cx="50" cy="50" r="48" />
    <circle className="wheel-rim" cx="50" cy="50" r="28" />
    {[...Array(20)].map((_, i) => (
      <line 
        className="wheel-spoke" 
        key={i} 
        x1="50" y1="50" 
        x2={50 + 28 * Math.cos(i * 2 * Math.PI / 5)} 
        y2={50 + 28 * Math.sin(i * 2 * Math.PI / 5)} 
      />
    ))}
    <circle className="wheel-center" cx="50" cy="50" r="8" />
    {/* LOGIN Text integrated like Rolls Royce alloys (stationary) */}
    {showLoginText && (
      <text 
        className="wheel-login-text" 
        x="50" 
        y="50" 
        textAnchor="middle" 
        dominantBaseline="middle"
      >
        LOGIN
      </text>
    )}
  </svg>
);
// --- End SVG Wheel ---


// --- Central Login Hub Component (from your code) ---
const LoginHub = ({ onLoginClick, isAnimatingOut }) => {
  const hubVariants = {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 } },
    exit: { opacity: 0, scale: 0.7, transition: { duration: 0.4, ease: 'easeIn' } }
  };

  return (
    <div className="login_wheel_overlay"> 
    <motion.div
      className="login-hub-container"
      variants={hubVariants}
      initial="initial"
      animate={isAnimatingOut ? "exit" : "animate"}
      exit="exit"
      onClick={onLoginClick} // Click on entire wheel
      style={{ cursor: 'pointer' }}
    >
      <div className="login-wheel-container">
        {/* Use the new SVG wheel with login text */}
        <WheelSVG showLoginText={true} />
        
        {/* --- Full Boundary Fire Emitter --- */}
        <div className="fire-emitter-boundary">
          {[...Array(80)].map((_, i) => (
            <div
              key={i}
              className="fire-particle-boundary"
              style={{ '--i': i }} 
            />
          ))}
        </div>
        {/* --- END FULL BOUNDARY FIRE --- */}
      </div>
    </motion.div>
    </div>
  );
};
// --- End Login Hub ---

// --- NEW: License Card Animation ---
const licenseBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const licenseCardVariants = {
  hidden: { 
    y: "100vh", // Start off-screen at the bottom
    rotate: 10,  // Tilted like being pulled from a wallet
    opacity: 0 
  },
  visible: { 
    y: "-50%", // Land in the center (top: 50% + y: -50%)
    rotate: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 120, 
      damping: 20, 
      duration: 0.5 
    }
  },
  exit: { 
    y: "100vh", // Slide back down
    rotate: -10, 
    opacity: 0,
    transition: { 
      duration: 0.4, 
      ease: "easeIn" 
    }
  }
};
// --- END License Card Animation ---


// --- Main Overlay Component ---
export default function Overlay() {
  const { user, isAuthenticated } = useAuth();
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [showLicense, setShowLicense] = useState(false); // NEW state for license
  const navigate = useNavigate();

  const handleLoginClick = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      navigate('/login');
      setTimeout(() => setIsAnimatingOut(false), 500);
    }, 1000); // This duration must match the CSS/Framer transition
  };

  // --- Animation Variants for Quadrants ---
  const quadrantTransition = { duration: 1, ease: [0.76, 0, 0.24, 1] };
  const quadrantsVariants = {
    visible: { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.2 } },
    hidden: { opacity: 0, scale: 0.95 },
    exitTopLeft: { x: "-100vw", y: "-50vh", rotate: -30, opacity: 0, scale: 0.8, transition: quadrantTransition },
    exitTopRight: { x: "100vw", y: "-50vh", rotate: 30, opacity: 0, scale: 0.8, transition: quadrantTransition },
    exitBottomLeft: { x: "-100vw", y: "50vh", rotate: 30, opacity: 0, scale: 0.8, transition: quadrantTransition },
    exitBottomRight: { x: "100vw", y: "50vh", rotate: -30, opacity: 0, scale: 0.8, transition: quadrantTransition },
  };

  const getAnimationState = (quadrant) => {
    if (isAnimatingOut) {
      if (quadrant === 'TL') return 'exitTopLeft';
      if (quadrant === 'TR') return 'exitTopRight';
      if (quadrant === 'BL') return 'exitBottomLeft';
      if (quadrant === 'BR') return 'exitBottomRight';
    }
    return isAuthenticated ? 'visible' : 'visible';
  };
  
  const getInitialState = () => {
      return isAuthenticated ? 'hidden' : 'visible';
  };

  // Format wallet address
  const formatAddress = (address) => {
    if (!address) return "---";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="overlay-container">
      
      {/* --- Central Hub --- */}
      <AnimatePresence>
        {!isAuthenticated && (
          <LoginHub 
            onLoginClick={handleLoginClick} 
            isAnimatingOut={isAnimatingOut} 
          />
        )}
      </AnimatePresence>

      {/* --- NEW: Center Login Button --- */}
      {/* <AnimatePresence>
        {!isAuthenticated && (
          <motion.button
            className="center-login-button"
            onClick={handleLoginClick}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 20,
              delay: 0.5 
            }}
            whileHover={{ 
              scale: 1.1,
              boxShadow: "0 0 40px rgba(100, 108, 255, 1), 0 0 80px rgba(100, 108, 255, 0.6)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            ENTER PITLANE
          </motion.button>
        )}
      </AnimatePresence> */}
      
      {/* --- NEW: License Button (Top Center) --- */}
      
      {/* --- NEW: License Card Overlay (Covers ~60% of screen) --- */}
      <AnimatePresence>
        {showLicense && (
          <>
            {/* 1. The Backdrop */}
            <motion.div
              className="license-backdrop"
              onClick={() => setShowLicense(false)} // Click backdrop to close
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={licenseBackdropVariants}
            />
            
            {/* 2. The License Card */}
            <motion.div
              className="license-card"
              variants={licenseCardVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag // Make it draggable
              dragConstraints={{ top: -100, bottom: 100, left: -100, right: 100 }}
              dragElastic={0.2}
            >
              {/* Header */}
              <div className="license-header">
                <h3>PROJECT PITLANE</h3>
                <span>OFFICIAL PADDOCK LICENSE</span>
              </div>
              
              {/* Content */}
              <div className="license-body">
                <div className="license-photo-placeholder">
                  {/* Use first letter of username as placeholder */}
                  <span>{user?.username ? user.username[0].toUpperCase() : 'F1'}</span>
                </div>
                <div className="license-details">
                  <div className="detail-item">
                    <span className="label">USERNAME</span>
                    <span className="value">{user?.username || 'Paddock Guest'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">WALLET ADDRESS</span>
                    <span className="value wallet">{formatAddress(user?.walletAddress)}</span>
                  </div>
                </div>
                {/* Hologram / QR Code placeholders for style */}
                <div className="license-hologram"></div>
                <div className="license-qr-code"></div>
              </div>
              
              {/* Footer */}
              <div className="license-footer">
                <div className="footer-bar red"></div>
                <div className="footer-bar blue"></div>
                <div className="footer-bar yellow"></div>
              </div>
              
              {/* Close Button (Hidden, click backdrop instead) */}
              <button className="close-license-btn" onClick={() => setShowLicense(false)}>✕</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* --- END License Card Overlay --- */}


      {/* --- The Four Quadrants --- */}
      
      <motion.div
        className="overlay-section top-left"
        variants={quadrantsVariants}
        initial={getInitialState()}
        animate={getAnimationState('TL')}
      >
        <h1 className="app-title">Project Pitlane</h1>
        <p className="app-subtitle">Your immersive F1 experience</p>
      </motion.div>

      <motion.div
        className="overlay-section top-right"
        variants={quadrantsVariants}
        initial={getInitialState()}
        animate={getAnimationState('TR')}
      >
        <div className="current-race-info">
          <span>Formula Hacks</span>
          <span className="live-status">LIVE</span>
        </div>
        <button className="icon-button">{/* Icon */}</button>
      </motion.div>

      <motion.div
        className="overlay-section bottom-left"
        variants={quadrantsVariants}
        initial={getInitialState()}
        animate={getAnimationState('BL')}
      >
        <div className="fan-hub-widget">
          <h3>QuadForce</h3>
          <p>Tifosi Rank: Grand Prix Veteran</p>
          {isAuthenticated ? (
             <Link to="/profile" className="action-button">My Profile</Link>
          ) : (
             <Link to="/clubs" ></Link>
          )}
        </div>
      </motion.div>

      <motion.div
        className="overlay-section bottom-right"
        variants={quadrantsVariants}
        initial={getInitialState()}
        animate={getAnimationState('BR')}
      >
        {/* Using NavLink to link to the transition page */}
        <NavLink to="/tickets" className="action-button primary">
          BUY TICKETS
        </NavLink>
        <Link to="/live-scores" className="action-button">
          LIVE SCORES
        </Link>
        {isAuthenticated ? (
           <Link to="/my-garage" className="action-button">My Garage</Link>
        ) : (
           <Link to="/community" ></Link>
        )}
      </motion.div>
      
    </div>
  );
}