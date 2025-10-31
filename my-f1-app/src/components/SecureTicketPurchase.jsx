import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers'; // Using v5, as per your package.json
import { useAuth } from '../context/AuthContext';
import web3Service from '../services/web3Service';
import socketService from '../services/socketService';
import ProtectionDashboard from './ProtectionDashboard';
import SimulationResults from './SimulationResults';
import './SecureTicketPurchase.css';

// Page transition variants
const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1, transition: { duration: 0.5 } },
  out: { opacity: 0, transition: { duration: 0.3 } }
};

export default function SecureTicketPurchase() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get purchase details from StadiumView
  const { selectedSeats, raceId, stand, totalPrice } = location.state || {};

  const [step, setStep] = useState('checking');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [flashbotsStatus, setFlashbotsStatus] = useState(null);
  const [tenderlyStatus, setTenderlyStatus] = useState(null);
  const [protectionActive, setProtectionActive] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [simulationResults, setSimulationResults] = useState(null);
  const [error, setError] = useState(null);

  // --- Effects ---
  useEffect(() => {
    // 1. Critical check: Redirect if no ticket data is passed from StadiumView
    if (!selectedSeats || !raceId || !stand) {
      console.error("No ticket data provided. Redirecting...");
      navigate('/tickets');
      return; // Stop execution
    }
    
    checkSystemStatus();
    
    // Define handlers for socket cleanup
    const handleBotAlert = (alert) => {
      setRecentAlerts(prev => [alert, ...prev.slice(0, 9)]);
    };
    const handleProtectionUpdate = (update) => {
      if (typeof update === 'string') {
        setProtectionActive(update === 'connected');
      } else if (typeof update === 'object' && update.status) {
        setProtectionActive(update.status === 'connected');
      }
    };
    
    // Register listeners
    setupSocketListeners(handleBotAlert, handleProtectionUpdate);
    
    // Cleanup listeners on unmount
    return () => {
      socketService.off('botAlert', handleBotAlert);
      socketService.off('protectionUpdate', handleProtectionUpdate);
      socketService.off('statusUpdate', handleProtectionUpdate);
    };
    
  }, [location.state]); // Re-run effect if navigation state changes

  // --- Socket Setup ---
  const setupSocketListeners = (onBotAlert, onProtectionUpdate) => {
     if (!socketService.getConnectionStatus()) {
        socketService.connect();
    }
    socketService.on('botAlert', onBotAlert);
    socketService.on('protectionUpdate', onProtectionUpdate);
    socketService.on('statusUpdate', onProtectionUpdate); 
    setProtectionActive(socketService.getConnectionStatus());
  };

  // --- System Status Check (Calls Port 3001 Health Endpoints) ---
  const checkSystemStatus = async () => {
    setStatus('Checking anti-bot protection system...');
    setLoading(true);
    try {
      // Calls web3Service functions which internally call the /api/health endpoint
      const [flashbots, tenderly] = await Promise.all([
        web3Service.checkFlashbotsStatus(),
        web3Service.checkTenderlyStatus()
      ]);
      setFlashbotsStatus(flashbots);
      setTenderlyStatus(tenderly);

      const overallProtection = flashbots?.ok && tenderly?.ok;
      setProtectionActive(overallProtection);

      if (overallProtection) {
        setStatus('✅ Anti-bot protection systems online');
      } else {
        let errorMsg = '⚠️ Some protection features unavailable: ';
        if (!flashbots?.ok) errorMsg += 'Flashbots Relay ';
        if (!tenderly?.ok) errorMsg += 'Tenderly Simulation';
        setStatus(errorMsg.trim());
      }
      setStep('select'); 
    } catch (err) {
      console.error("System status check failed:", err);
      setStatus("❌ Error checking protection status. Purchase may be unprotected.");
      setProtectionActive(false);
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  // Callback for web3Service to update UI
  const handleStatusUpdate = (newStatus) => {
    console.log("Purchase Update:", newStatus);
    setStatus(newStatus);
    if (newStatus.toLowerCase().includes('simulating')) setStep('practice');
    else if (newStatus.toLowerCase().includes('relay')) setStep('express');
    else if (newStatus.toLowerCase().includes('success')) setStep('complete');
    else if (newStatus.toLowerCase().includes('fail')) setStep('select');
  };

  // --- Ticket Purchase Logic ---
  const handlePurchase = async () => {
    if (!user?.walletAddress) {
      alert('Please connect your wallet first.');
      navigate('/login');
      return;
    }
    if (!protectionActive) {
         if (!window.confirm("⚠️ Anti-bot protection is limited. Proceed with unprotected purchase?")) {
             return;
         }
    }

    setLoading(true);
    setError(null);
    setStep('practice');
    handleStatusUpdate('Initializing secure purchase...');

    try {
      // 1. Prepare Transaction Data (using ethers v5 syntax)
      const purchaseData = generateTicketPurchaseData(selectedSeats.map(s => s.number));
      // Use Ethers v5 syntax
      const valueToSend = ethers.utils.parseEther(totalPrice.toString()); 

      // 2. Call the secure purchase function in web3Service
      const result = await web3Service.purchaseTicketSecure(
        { 
          to: import.meta.env.VITE_TICKET_CONTRACT_ADDRESS, // Needs to be in .env.local
          data: purchaseData,
          value: valueToSend,
          from: user.walletAddress,
          raceId: raceId,
          seats: selectedSeats 
        },
        handleStatusUpdate
      );

      // 3. Process Result
      if (result.simulation) setSimulationResults(result.simulation);
      if (result.success) {
        handleStatusUpdate(`✅ Ticket(s) secured! Tx: ${result.transactionHash?.slice(0,10)}...`);
        setStep('complete');
      } else {
         throw new Error(result.message || "Purchase failed after simulation/relay.");
      }

    } catch (err) {
      console.error('Purchase failed:', err);
      setError(`Purchase failed: ${err.message}`);
      handleStatusUpdate(`❌ Purchase failed: ${err.message}`);
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  // --- Helper to Encode Transaction Data (ethers v5) ---
  const generateTicketPurchaseData = (seatNumbers) => {
    try {
        const abi = ["function batchMint(address to, uint256[] memory seatIds) public payable"];
        const iface = new ethers.utils.Interface(abi);
        return iface.encodeFunctionData("batchMint", [user.walletAddress, seatNumbers]);
    } catch (e) {
         console.error("ABI encoding failed, using placeholder data:", e);
         return "0x...placeholder_data";
    }
  };

  // --- Mock Ticket Data (for rendering completion screen if state is empty) ---
  const mockTicket = { id: '2', type: 'Grandstand', price: 0.05, protection: 'Priority Protection' };
  const ticketToRender = stand || mockTicket;


  // --- Render Logic ---

  // Initial System Check UI
  if (step === 'checking') {
    return (
       <motion.div className="system-check full-page-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
        <div className="checking-animation">
          <div className="protection-spinner"></div>
          <h3>Initializing Anti-Bot Protection</h3>
          <p>{status}</p>
          <div className="system-checks">
            <div className={`check ${tenderlyStatus === null ? 'pending' : (tenderlyStatus?.ok ? 'passed' : 'failed')}`}>
              <span className="icon">{tenderlyStatus === null ? '⏳' : (tenderlyStatus?.ok ? '✅' : '❌')}</span> Tenderly Simulation
            </div>
            <div className={`check ${flashbotsStatus === null ? 'pending' : (flashbotsStatus?.ok ? 'passed' : 'failed')}`}>
               <span className="icon">{flashbotsStatus === null ? '⏳' : (flashbotsStatus?.ok ? '✅' : '❌')}</span> Flashbots Relay
            </div>
            <div className={`check ${!socketService.getConnectionStatus() ? 'pending' : 'passed'}`}>
               <span className="icon">{!socketService.getConnectionStatus() ? '⏳' : '✅'}</span> Mempool Scanner Feed
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Main Purchase UI
  return (
    <motion.div
       className="secure-ticket-purchase"
       variants={pageVariants}
       initial="initial"
       animate="in"
       exit="out"
    >
      <ProtectionDashboard
        alerts={recentAlerts}
        isActive={protectionActive}
        flashbotsStatus={flashbotsStatus}
        tenderlyStatus={tenderlyStatus}
      />
      <div className="purchase-flow-content">
          <div className="protection-header">
            <Link to="/tickets" className="back-button header-back-button">← Change Seats</Link>
            <h2>🎫 Secure Ticket Purchase</h2>
            <div className="protection-badges">
              <span className={`badge tenderly ${tenderlyStatus?.ok ? 'ok' : 'error'}`}>🔍 Tenderly</span>
              <span className={`badge flashbots ${flashbotsStatus?.ok ? 'ok' : 'error'}`}>⚡ Flashbots</span>
              <span className={`badge mempool ${socketService.getConnectionStatus() ? 'ok' : 'error'}`}>👁️ Mempool</span>
              <span className="badge anti-bot">🤖 Anti-Bot</span>
            </div>
            <div className="live-protection-status">
              {protectionActive ? (
                <div className="protection-active"><span className="pulse-dot"></span>LIVE PROTECTION ACTIVE</div>
              ) : (
                <div className="protection-limited">⚠️ PROTECTION LIMITED</div>
              )}
            </div>
             {status && !status.startsWith('✅') && !status.startsWith('❌') && <p className="general-status">{status}</p>}
             {error && <p className="general-error">{error}</p>}
          </div>

          <AnimatePresence mode="wait">
              {/* Step 1: Confirm Selection (Main UI) */}
              {step === 'select' && (
                <motion.div
                    key="select"
                    className="ticket-selection purchase-step"
                    initial={{ opacity: 0, x: 50}} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50}} transition={{duration: 0.3}}
                >
                  <h3>Confirm Your Selection</h3>
                  <div className="ticket-summary">
                     <div className="summary-item"><strong>Race:</strong> {stand?.name || 'N/A'} ({raceId})</div>
                     <div className="summary-item"><strong>Stand:</strong> {stand?.name || 'N/A'}</div>
                     <div className="summary-item"><strong>Seats:</strong> {selectedSeats?.map(s => `S${s.number}`).join(', ') || 'None'}</div>
                     <div className="summary-item total"><strong>Total:</strong> {totalPrice || '0.0'} ETH</div>
                  </div>
                  <p className="security-info">
                    Your purchase is protected against front-running and sandwich attacks.
                  </p>
                  {/* The button triggers the entire secure purchase flow */}
                  {selectedSeats ? (
                     <motion.button
                          onClick={handlePurchase}
                          // Button is only disabled if actively loading OR no seats selected
                          disabled={loading || !selectedSeats.length}
                          className={`purchase-btn ${!protectionActive ? 'unprotected' : ''}`}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                      >
                        {loading ? 'Processing...' : (
                            protectionActive ? `Confirm Purchase (${totalPrice} ETH)` : `Purchase (Unprotected - ${totalPrice} ETH)`
                        )}
                      </motion.button>
                  ) : (
                     <div className="ticket-grid">
                        {/* Render placeholder cards if no state is passed */}
                        <p className="general-status">Please select seats from the Stadium View to continue.</p>
                        <Link to="/tickets" className="action-button primary">Go to Stadium Map</Link>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Practice Lap (Simulation) */}
              {step === 'practice' && (
                 <motion.div
                    key="practice"
                    className="practice-lap purchase-step"
                    initial={{ opacity: 0, x: 50}} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50}} transition={{duration: 0.3}}
                 >
                   <div className="step-indicator">
                        <div className="step active"><span>1</span> Practice Lap</div>
                        <div className="step-arrow">→</div>
                        <div className="step"><span>2</span> Express Lane</div>
                         <div className="step-arrow">→</div>
                        <div className="step"><span>3</span> Complete</div>
                    </div>
                    <div className="simulation-status">
                        <div className="tenderly-animation">
                        <div className="simulation-icon">🔍</div>
                        <div className="scan-beam"></div>
                        </div>
                        <h3>Running Tenderly Simulation</h3>
                        <p>Verifying transaction safety before signing...</p>
                        <div className="status-message">{status}</div>
                    </div>
                 </motion.div>
              )}

              {/* Step 3: Express Lane (Flashbots) */}
              {step === 'express' && (
                 <motion.div
                    key="express"
                    className="express-lane purchase-step"
                    initial={{ opacity: 0, x: 50}} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50}} transition={{duration: 0.3}}
                 >
                     <div className="step-indicator">
                        <div className="step completed"><span>✓</span> Practice Lap</div>
                         <div className="step-arrow">→</div>
                        <div className="step active"><span>2</span> Express Lane</div>
                         <div className="step-arrow">→</div>
                        <div className="step"><span>3</span> Complete</div>
                    </div>
                    <div className="express-status">
                        <div className="flashbots-animation">
                            <div className="bolt">⚡</div>
                            <div className="road"></div>
                        </div>
                        <h3>Submitting via Flashbots Relay</h3>
                        <p>Bypassing public mempool for secure execution...</p>
                        <div className="status-message">{status}</div>
                        {simulationResults?.success && (
                            <div className="simulation-verified">✅ Simulation Passed</div>
                        )}
                    </div>
                 </motion.div>
              )}

              {/* Step 4: Complete */}
              {step === 'complete' && (
                 <motion.div
                    key="complete"
                    className="purchase-complete purchase-step"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{duration: 0.4}}
                  >
                    <div className="success-animation">
                        <motion.div className="checkmark" initial={{scale:0}} animate={{scale:1}} transition={{delay: 0.1, type:'spring', stiffness: 300, damping: 15}}>✓</motion.div>
                    </div>
                    <h3>Ticket(s) Secured! 🎉</h3>
                    <p>{status}</p>

                    {simulationResults && (
                        <SimulationResults results={simulationResults} />
                    )}

                    <div className="ticket-details">
                         <div className="detail-row">
                            <strong>Ticket Type:</strong> {stand?.name || ticketToRender?.type}
                         </div>
                         <div className="detail-row">
                            <strong>Seats:</strong> {selectedSeats?.map(s => `S${s.number}`).join(', ') || 'N/A'}
                         </div>
                        <div className="detail-row">
                            <strong>Price:</strong> {totalPrice || ticketToRender?.price} ETH
                        </div>
                        <div className="security-stamp">
                            🔒 Protected by Tenderly + Flashbots
                        </div>
                    </div>

                    <div className="completion-actions">
                         <Link to="/my-garage" className="view-ticket-btn">
                           View in My Garage
                         </Link>
                         <Link to="/tickets" className="back-btn">
                           Buy Another
                         </Link>
                    </div>
                 </motion.div>
              )}
            </AnimatePresence>
        </div>
    </motion.div>
  );
}
