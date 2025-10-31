import React, { useState, useEffect } from 'react'; // Added useEffect
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { motion, AnimatePresence } from 'framer-motion'; // Added AnimatePresence
import * as ticketService from '../services/ticketService'; // Import our service
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './StadiumView.css';

// Page transition animation props
const pageVariants = {
  initial: {
    opacity: 0,
    x: "100vw"
  },
  in: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      delay: 0.2
    }
  },
  out: {
    opacity: 0,
    x: "-100vw",
    transition: {
      duration: 0.5
    }
  }
};

// --- Seat Component ---
const Seat = ({ number, isTaken, onSelect, isSelected }) => { // Added onSelect, isSelected
  const handleClick = () => {
    if (!isTaken) {
      onSelect(number); // Call parent handler
    }
  };

  return (
    <div
      className={`seat ${isTaken ? 'taken' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      title={isTaken ? "Seat Taken" : `Seat ${number}`}
    >
      {number}
    </div>
  );
};

// --- Seat Picker Component (NOW DATA-DRIVEN) ---
const SeatPicker = ({ stand, onBack, raceId, onMintClick }) => {
  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]); // Track selected seat numbers

  // Fetch seats when this component mounts
  useEffect(() => {
    const fetchSeats = async () => {
      setLoadingSeats(true);
      try {
        // --- LIVE API CALL ---
        const seatData = await ticketService.getSeatAvailability(raceId, stand.id);
        setSeats(seatData);
      } catch (error) {
        console.error(`Error fetching seats for ${stand.id}:`, error);
        // TODO: Show an error message in the seat picker
      } finally {
        setLoadingSeats(false);
      }
    };
    fetchSeats();
  }, [raceId, stand.id]); // Refetch if standId changes

  const handleSelectSeat = (seatNumber) => {
    setSelectedSeats(prev => {
      const isSelected = prev.includes(seatNumber);
      if (isSelected) {
        return prev.filter(s => s !== seatNumber); // Deselect
      } else {
        // TODO: Add logic to limit max seats selected
        return [...prev, seatNumber]; // Select
      }
    });
  };

  const calculateTotalPrice = () => {
    // Use the price from the stand object, default to 0
    const pricePerTicket = stand.price || 0;
    // Format to 3 decimal places, or more if price is very small
    return (selectedSeats.length * pricePerTicket).toFixed(pricePerTicket > 0.01 ? 3 : 5);
  };

  return (
    <motion.div 
      className="seat-picker-container"
      // Animate the panel in
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0, transition: { delay: 1, duration: 0.5, ease: "easeOut" } }}
      exit={{ opacity: 0, x: -100, transition: { duration: 0.3 } }}
    >
      <button className="stadium-back-button" onClick={onBack}>← Back to Stadium</button>
      <h2>{stand.name}</h2>
      <p>Price per seat: {stand.price || 'N/A'} ETH</p>
      <div className="screen-indicator">TRACK</div>
      
      {loadingSeats ? (
        <div className="loading-state-small">
          <div className="loading-spinner-small"></div>
          <p>Loading Seats...</p>
        </div>
      ) : (
        <div className="seat-grid">
          {seats.map(seat => (
            <Seat
              key={seat.id}
              number={seat.number}
              isTaken={seat.isTaken}
              isSelected={selectedSeats.includes(seat.number)}
              onSelect={handleSelectSeat}
            />
          ))}
        </div>
      )}

      <div className="seat-legend">
        <div className="legend-item"><div className="seat available"></div>Available</div>
        <div className="legend-item"><div className="seat selected"></div>Selected</div>
        <div className="legend-item"><div className="seat taken"></div>Taken</div>
      </div>

      {/* Pass selected seats and price to the mint click handler */}
      <button 
        className="action-button connect-button" 
        style={{width: '100%', marginTop: '20px'}}
        onClick={() => onMintClick(selectedSeats, calculateTotalPrice())}
        disabled={selectedSeats.length === 0 || loadingSeats}
      >
        {selectedSeats.length > 0 
          ? `MINT ${selectedSeats.length} SEAT(S) (${calculateTotalPrice()} ETH)`
          : "Select Seats to Mint"
        }
      </button>
    </motion.div>
  );
};

// --- Main Page Component ---
export default function StadiumView() {
  // State
  const [stands, setStands] = useState([]); // Holds stand data from API
  const [loadingStands, setLoadingStands] = useState(true);
  const [selectedStand, setSelectedStand] = useState(null); // Holds the *object* of the selected stand
  const [error, setError] = useState(null);
  const [raceId, setRaceId] = useState('monaco-2025'); // Example raceId, can be dynamic

  // Hooks
  const { user, isAuthenticated } = useAuth(); // Get auth state
  const navigate = useNavigate(); // Hook for navigation

  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchStands = async () => {
      setLoadingStands(true);
      setError(null);
      try {
        // --- LIVE API CALL ---
        const standData = await ticketService.getGrandstands(raceId);
        setStands(standData);
        console.log("Fetched stands data:", standData);
      } catch (error) {
        console.error("Error fetching grandstands:", error);
        setError("Could not load track map. Please try again.");
      } finally {
        setLoadingStands(false);
      }
    };
    fetchStands();
  }, [raceId]); // Refetch if raceId changes

  // --- Event Handlers ---
  const handleStandClick = (standId) => {
    // Find the full stand object from our fetched API data
    const standData = stands.find(s => s.id === standId);
    
    if (!standData || standData.nonClickable) {
       console.log(`Stand ${standId} is not clickable or data not found.`);
       return;
    }
    
    console.log("Stand clicked:", standData);
    setSelectedStand(standData); // Set the full stand object
  };

  const handleBackToStadium = () => {
    setSelectedStand(null);
  };

  // --- INTEGRATION: Connect to Secure Purchase Flow ---
  const handleMint = (selectedSeats, totalPrice) => {
    if (!isAuthenticated) {
        alert("Please log in to purchase tickets.");
        navigate('/login');
        return;
    }
    
    const seatObjects = selectedSeats.map(seatNumber => ({
        section: selectedStand.id,
        // row: 'TBD', // Add if your seat data includes rows
        number: seatNumber
    }));

    console.log(`Navigating to secure purchase with:`, {
        selectedSeats: seatObjects,
        totalPrice,
        raceId,
        stand: selectedStand // Pass the whole stand object
    });

    // Navigate to the secure purchase page, passing all necessary data
    navigate('/purchase-ticket', { 
      state: { 
        selectedSeats: seatObjects, 
        raceId: raceId,
        stand: selectedStand, // Pass the stand data (name, price)
        totalPrice: totalPrice
      } 
    });
  };
  // --- END INTEGRATION ---


  // --- Render ---

  // Loading state
  if (loadingStands) {
    return (
      <div className="loading-state full-page-center">
        <div className="loading-spinner"></div>
        <p>Loading Track Map...</p>
      </div>
    );
  }

  // Error state
  if (error) {
     return (
        <div className="error-state full-page-center">
          <h3>Error</h3>
          <p>{error}</p>
          <Link to="/" className="stadium-back-button">Back Home</Link>
        </div>
     );
  }

  // Main component render
  const zoomClass = selectedStand ? `zoom-stand-${selectedStand.id}` : 'zoom-overview';

  // Helper to find stand data from the *fetched* state
  // This is crucial for dynamically setting color/clickable status
  const getStand = (id) => stands.find(s => s.id.toLowerCase() === id.toLowerCase()) || { nonClickable: true, color: '#444444', name: id };


  return (
    <motion.div
      className="stadium-view-container"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      {/* 2D UI OVERLAY for this page */}
      <div className="stadium-ui-header">
        <Link to="/" className="stadium-back-button">← Back to Paddock</Link>
        <h2>{selectedStand ? `SELECT SEATS: ${selectedStand.name}` : `SELECT YOUR GRANDSTAND`}</h2>
      </div>

      {/* This wrapper handles the zoom and holds the map */}
      <div className={`stadium-map-wrapper ${zoomClass}`}>
        
        {/* Your full SVG map code. onClick handlers and styles are now DYNAMIC. */}
        <svg
          className="stadium-svg"
          viewBox="0 0 4000 4000" // Use the viewBox from your SVG file
          role="img"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Venue Map</title>
          
          {/* Track Outline/Infield Paths (Static) */}
          <g>
            {/* The grey track background */}
            <path d="M3964.9,1712.3c...[TRUNCATED_SVG_PATH]...l0.7,-11.7z" fill="#cccccc" stroke="none" strokeWidth="1"></path>
            {/* The black track outline */}
            <path d="M556.2,1863.5l1545.1,-846.7c...[TRUNCATED_SVG_PATH]...230.1,-199.6" fill="none" stroke="#231f20" strokeWidth="17"></path>
            {/* The green infield (Added className) */}
            <path className="svg-infield" d="M3964.9,1712.3c...[TRUNCATED_SVG_PATH]...l0.7,-11.7z" fill="#CDF2A6" fillOpacity="0.3" />
          </g>

          {/* Clickable Grandstands (Now DYNAMIC) */}
          <g>
            <g className={`svg-stand ${getStand('A').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('A')}>
              <path d="M1418,1275.5l-47.2,-91.5l738,-379.9l1080.1,-17.4l1.6,103l-1055.9,17z" fill={getStand('A').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('A').nonClickable ? 0.3 : 0.8} />
              <text x="2413.5" y="874.3" fontSize="72" textAnchor="middle" fill="#000">A</text>
            </g>
            
            <g className={`svg-stand ${getStand('B').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('B')}>
              <path d="M963.5549,1418.8822l344.7546,-199.05l54.8,94.9136l-344.7546,199.05z" fill={getStand('B').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={getStand('B').nonClickable ? 0.3 : 0.8} />
              <text x="1163.3" y="1388.4" fontSize="72" textAnchor="middle" fill="#B1BAC2">B</text>
            </g>
            
            <g className={`svg-stand ${getStand('M').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('M')}>
              <path d="M281.1292,1815.1497l295.2194,-170.45l45.05,78.0266l-295.2194,170.45z" fill={getStand('M').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('M').nonClickable ? 0.3 : 0.8} />
              <text x="451.2" y="1790.5" fontSize="72" textAnchor="middle" fill="#000">M</text>
            </g>
            
            <g className={`svg-stand ${getStand('G_OrangeTree').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('G_OrangeTree')}>
              <path d="M1639.6831,1343.7676l172.9402,-99.85l45.05,78.0266l-172.9402,99.85z" fill={getStand('G_OrangeTree').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('G_OrangeTree').nonClickable ? 0.3 : 0.8}/>
              <text x="1730" y="1300" fontSize="48" textAnchor="middle" fill="#000">ORANGE TREE</text>
            </g>
            
            <g className={`svg-stand ${getStand('PREMIUM PADDOCK').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('PREMIUM PADDOCK')}>
              <path d="M581.6821,2007.4141l344.7546,-199.05l54.8,94.9136l-344.7546,199.05z" fill={getStand('PREMIUM PADDOCK').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={getStand('PREMIUM PADDOCK').nonClickable ? 0.3 : 0.8} />
               <text x="750" y="1980" fontSize="48" textAnchor="middle" fill="#B1BAC2">PREMIUM PADDOCK</text>
            </g>
            
            <g className={`svg-stand ${getStand('D').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('D')}>
              <path d="M232.63756,2519.42202l-154.98642,-463.05489l103.93368,-34.78704l154.98642,463.05489z" fill={getStand('D').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('D').nonClickable ? 0.3 : 0.8} />
              <text x="207.1" y="2292.1" fontSize="72" textAnchor="middle" fill="#000">D</text>
            </g>
            
             <g className={`svg-stand ${getStand('H').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('H')}>
              <path d="M419.99997,3019.26739l-126.35694,-377.51823l103.93368,-34.78704l126.35694,377.51823z" fill={getStand('H').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('H').nonClickable ? 0.3 : 0.8} />
              <text x="408.7" y="2834.7" fontSize="72" textAnchor="middle" fill="#000">H</text>
            </g>
            
            <g className={`svg-stand ${getStand('N').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('N')}>
              <path d="M712.97775,3223.5811l-165.60126,-65.82708l40.48624,-101.85128l165.60126,65.82708z" fill={getStand('N').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={getStand('N').nonClickable ? 0.3 : 0.8} />
              <text x="650.4" y="3161.3" fontSize="72" textAnchor="middle" fill="#B1BAC2">N</text>
            </g>
            
            <g className={`svg-stand ${getStand('R').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('R')}>
              <path d="M1332.537,3280.0714h-524.3v-109.6h524.3z" fill={getStand('R').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('R').nonClickable ? 0.3 : 0.8} />
              <text x="1070.3" y="3246.8" fontSize="72" textAnchor="middle" fill="#000">R</text>
            </g>
            
            <g className={`svg-stand ${getStand('G_Main').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('G_Main')}>
              <path d="M2810.1893,3286.3457h-1419.7v-109.6h1419.7z" fill={getStand('G_Main').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('G_Main').nonClickable ? 0.3 : 0.8} />
              <text x="2100.3" y="3253.1" fontSize="72" textAnchor="middle" fill="#000">G</text>
            </g>
            
            <g className={`svg-stand ${getStand('S').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('S')}>
              <path d="M3091.8719,3280.0064h-158.1v-109.6h158.1z" fill={getStand('S').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={getStand('S').nonClickable ? 0.3 : 0.8} />
              <text x="3012.8" y="3246.8" fontSize="72" textAnchor="middle" fill="#B1BAC2">S</text>
            </g>
            
            <g className={`svg-stand ${getStand('V').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('V')}>
              <path d="M3254.7,3056.2v-206.6h128.3v206.6z" fill={getStand('V').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={getStand('V').nonClickable ? 0.3 : 0.8} />
              <text x="3318.8" y="2974.5" fontSize="72" textAnchor="middle" fill="#B1BAC2">V</text>
            </g>
            
            <g className={`svg-stand ${getStand('GRANDPRIXCLUB').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('GRANDPRIXCLUB')}>
              <path d="M1647.2286,2054.6818l295.2194,170.45l-45.05,78.0266l-295.2194,-170.45z" fill={getStand('GRANDPRIXCLUB').color} stroke="#37383a" strokeWidth="3px" fillOpacity={getStand('GRANDPRIXCLUB').nonClickable ? 0.3 : 0.8} />
               <text x="1770" y="2220" fontSize="48" textAnchor="middle" fill="#FFF">GRAND PRIX CLUB</text>
            </g>
            
            <g className={`svg-stand ${getStand('HEINEKEN').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('HEINEKEN')}>
              <path d="M3173.3,1669.4v-241h241v241z" fill={getStand('HEINEKEN').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('HEINEKEN').nonClickable ? 0.3 : 0.8} />
              <text x="3293.8" y="1580" fontSize="48" textAnchor="middle" fill="#000">HEINEKEN</text>
               <text x="3293.8" y="1630" fontSize="48" textAnchor="middle" fill="#000">VILLAGE</text>
            </g>
            
            <g className={`svg-stand ${getStand('PITSTOP').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('PITSTOP')}>
              <path d="M643.6612,1605.0849l267.6806,-154.55l45.05,78.0266l-267.6806,154.55z" fill={getStand('PITSTOP').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={getStand('PITSTOP').nonClickable ? 0.3 : 0.8} />
              <text x="780" y="1520" fontSize="48" textAnchor="middle" fill="#B1BAC2">PIT STOP</text>
            </g>
          </g>
        </svg>

      </div>

      {/* Seat Picker Panel (Shows when a stand is selected) */}
      <AnimatePresence>
        {selectedStand && (
          <SeatPicker
            key={selectedStand.id}
            stand={selectedStand} // Pass the full stand object
            raceId={raceId}
            onBack={handleBackToStadium}
            onMintClick={handleMint}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

