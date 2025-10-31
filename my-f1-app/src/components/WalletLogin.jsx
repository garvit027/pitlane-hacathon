import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// Correctly import the useAuth hook from its Context file
import { useAuth } from '../context/AuthContext';
import './WalletLogin.css'; // Import the styles

// Page transition animation props (Simple fade-in)
const pageVariants = {
  initial: { opacity: 0, scale: 1.05 },
  in: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  out: { opacity: 0, scale: 0.95, transition: { duration: 0.3, ease: 'easeIn' } }
};

function WalletLogin() {
  // Get the REAL login function from auth context
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);
    console.log("Attempting to connect wallet and sign in...");

    try {
      // --- THIS IS THE REAL LOGIC ---
      // This calls the REAL login function from useAuth.js
      const result = await login();

      if (result.success) {
        console.log('Wallet connected and authenticated!');
        // Navigate to the user's profile or home page on success
        navigate('/profile'); // Redirect to profile
      } else {
        // Handle login failure (e.g., user rejected, signature invalid)
        throw new Error(result.message || 'Failed to authenticate.');
      }
      // --- End Real Logic ---

    } catch (err) {
      console.error("Wallet connection error:", err);
      // Display user-friendly errors
      if (err.message.includes('User rejected')) {
           setError('You rejected the connection request.');
      } else if (err.code === 4001 || err.code === 'ACTION_REJECTED') { // MetaMask rejection codes
           setError('Connection or signature request rejected.');
      }
      else {
           setError(err.message || 'An unexpected error occurred. Please try again.');
      }
      setIsConnecting(false); // Only set to false on error
    }
  };

  return (
    <motion.div
      className="wallet-login-container"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      {/* Back button to return to Overlay */}
      <Link to="/" className="back-button login-back-button">← Back to Paddock</Link>
      
      <div className="wallet-login-panel">
        <div className="login-header">
          <h2>CONNECT WALLET</h2>
          <p>Connect your Web3 wallet to access the F1 Digital Paddock.</p>
        </div>

        <div className="login-features">
           <p>Access exclusive features:</p>
           <ul>
              <li><span className="feature-icon">🎫</span> Secure Ticket Purchasing</li>
              <li><span className="feature-icon">🏎️</span> NFT-Gated Fan Clubs</li>
              <li><span className="feature-icon">💬</span> Exclusive Community Chat</li>
              <li><span className="feature-icon">🏆</span> Earning Fan Rewards</li>
           </ul>
        </div>

        <motion.button
          className="connect-wallet-button"
          onClick={handleConnectWallet}
          disabled={isConnecting}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          {isConnecting ? (
            <>
              <div className="mini-spinner"></div> Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </motion.button>

        {error && <p className="error-message">{error}</p>}

        <p className="login-footer">
          By connecting, you agree to our Terms of Service.
          Need a wallet? <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">Learn more</a>.
        </p>
      </div>
    </motion.div>
  );
}

// Ensure this file has a default export
export default WalletLogin;

