import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Import Core Layout & Background
import VideoBackground from './components/VideoBackground';
import Overlay from './components/Overlay';

import Mint from '/Users/garvitjuneja27/Downloads/gdg-2/my-f1-app/src/pages/Mint.jsx'; 
// import CarTransition from './components/CarTransition'; // REMOVED

// Import Feature Components
import StadiumView from './components/StadiumView';
import LiveScores from './components/LiveScores';
import SecureTicketPurchase from './components/SecureTicketPurchase';
import FanClubs from './components/FanHub'; // Using FanHub for /clubs route
import ClubDashboard from './components/ClubDashboard';
import UserProfile from './components/UserProfile';
import CommunityHub from './components/CommunityHub';
import ProtectionDashboard from './components/ProtectionDashboard';
import SimulationResults from './components/SimulationResults';
import WalletLogin from './components/WalletLogin';
import LiveTelemetry from './components/LiveTelemetry';
import LicensePage from './components/LicensePage'; // Import License Page

import { AuthProvider } from './context/AuthContext';

import './App.css';

// --- Placeholder Component for My Garage ---
const MyGarage = () => (
  <motion.div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 50, backdropFilter: 'blur(10px)' }}
    initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} >
     <div style={{color: 'white', textAlign: 'center', padding: '30px', background: 'rgba(30,35,45,0.9)', borderRadius: '10px', border: '1px solid rgba(100, 108, 255, 0.3)'}}>
      <h2><span role="img" aria-label="garage">🛠️</span> My Garage</h2>
      <p style={{color: '#aaa', marginBottom: '20px'}}>(Your purchased NFT Tickets will appear here)</p>
      <Link to="/" style={{color: '#646cff', fontWeight: 'bold', textDecoration: 'none'}}>← Back to Paddock</Link>
     </div>
  </motion.div>
);
// --- End Placeholder ---

// Wrapper for animated route switching
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Core Routes */}
        <Route path="/" element={<Overlay />} />
        <Route path="/live-scores" element={<LiveScores />} />

        {/* Ticket Purchase Flow (No transition component) */}
        <Route path="/tickets" element={<StadiumView />} />
        <Route path="/purchase-ticket" element={<SecureTicketPurchase />} />

        {/* Fan Clubs & Community */}
        <Route path="/clubs" element={<FanClubs />} /> {/* Points to FanHub component */}
        <Route path="/clubs/:clubId" element={<ClubDashboard />} />
        <Route path="/community" element={<CommunityHub />} /> {/* Points to CommunityHub component */}

        {/* User Profile */}
        <Route path="/profile" element={<UserProfile />} />

        {/* Web3 & Security Related Routes */}
        <Route path="/login" element={<WalletLogin />} />
        <Route path="/protection-status" element={<ProtectionDashboard />} />
        <Route path="/simulation-results" element={<SimulationResults />} />

         {/* Advanced Features */}
         <Route path="/live-telemetry" element={<LiveTelemetry />} />
         <Route path="/my-garage" element={<MyGarage />} />
         <Route path="/license" element={<LicensePage />} /> {/* Added License Page Route */}


        <Route path="/mint" element={<Mint />} />
        {/* 404 Fallback */}
        <Route path="*" element={
             <motion.div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 50, backdropFilter: 'blur(10px)' }}
               initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} >
                <div style={{color: 'white', textAlign: 'center'}}>
                    <h2>404 - Page Not Found</h2>
                    <Link to="/" style={{color: '#646cff'}}>Go Home</Link>
                </div>
             </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div id="app-layout">
          <VideoBackground />
          <AnimatedRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;


