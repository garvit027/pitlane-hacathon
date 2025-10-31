import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import './LicensePage.css'; // Make sure this CSS file exists

// --- Animation Variants ---
const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

// Backdrop animation
const licenseBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

// License card "pull from wallet" animation
const licenseCardVariants = {
  hidden: { 
    y: "100vh", // Start off-screen at the bottom
    rotate: 10,  // Tilted
    opacity: 0 
  },
  visible: { 
    // --- THIS IS THE FIX ---
    y: "-50%", // Animate to the vertical center (to counteract top: 50%)
    // --- END FIX ---
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
// --- END Animation Variants ---


export default function LicensePage() {
  const { user } = useAuth(); // Get user data

  // Format wallet address
  const formatAddress = (address) => {
    if (!address) return "---";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    // Full-screen container with backdrop
    <motion.div
      className="license-page-container"
      variants={pageVariants} // This line was causing the error
      initial="initial"
      animate="in"
      exit="exit"
    >
      {/* The Backdrop (Clicking it navigates back) */}
      <Link to="/" className="license-backdrop-link" />
      
      {/* The License Card */}
      <motion.div
        className="license-card"
        variants={licenseCardVariants}
        initial="hidden" // Start from hidden (off-screen)
        animate="visible" // Animate to visible (centered)
        exit="exit" // Animate to exit (off-screen)
        drag // Make it draggable
        dragConstraints={{ top: -100, bottom: 100, left: -100, right: 100 }}
        dragElastic={0.2}
      >
        {/* Header */}
        <div className="license-header">
          <h3>PROJECT PITLANE</h3>
          <span>OFFICIAL Pitlane LICENSE</span>
        </div>
        
        {/* Content */}
        <div className="license-body">
          <div className="license-photo-placeholder">
            <span>{user?.username ? user.username[0].toUpperCase() : 'G'}</span>
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
        <Link to="/" className="close-license-btn" aria-label="Close License">✕</Link>
      </motion.div>
    </motion.div>
  );
}

