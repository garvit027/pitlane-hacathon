import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as ticketService from '../services/ticketService';
import { useAuth } from '../context/AuthContext';
import './StadiumView.css';

// Page transition animation props
const pageVariants = {
  initial: { opacity: 0, x: "100vw" },
  in: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100, damping: 20, delay: 0.2 } },
  out: { opacity: 0, x: "-100vw", transition: { duration: 0.5 } }
};

// --- Seat Component ---
const Seat = ({ number, isTaken, onSelect, isSelected }) => {
  const handleClick = () => !isTaken && onSelect(number);
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

// --- Seat Picker Component (DATA-DRIVEN) ---
const SeatPicker = ({ stand, onBack, raceId, onMintClick }) => {
  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    const fetchSeats = async () => {
      setLoadingSeats(true);
      try {
        const seatData = await ticketService.getSeatAvailability(raceId, stand.id);
        setSeats(seatData);
      } catch (error) {
        console.error(`Error fetching seats for ${stand.id}:`, error);
      } finally {
        setLoadingSeats(false);
      }
    };
    fetchSeats();
  }, [raceId, stand.id]);

  const handleSelectSeat = (seatNumber) => {
    setSelectedSeats(prev => {
      const isSelected = prev.includes(seatNumber);
      return isSelected ? prev.filter(s => s !== seatNumber) : [...prev, seatNumber];
    });
  };

  const calculateTotalPrice = () => {
    const pricePerTicket = stand.price || 0;
    return (selectedSeats.length * pricePerTicket).toFixed(pricePerTicket > 0.01 ? 3 : 5);
  };

  return (
    <motion.div 
      className="seat-picker-container"
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
  const [stands, setStands] = useState([]);
  const [loadingStands, setLoadingStands] = useState(true);
  const [selectedStand, setSelectedStand] = useState(null);
  const [error, setError] = useState(null);
  const [raceId] = useState('monaco-2025'); // Example raceId
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStands = async () => {
      setLoadingStands(true);
      setError(null);
      try {
        const standData = await ticketService.getGrandstands(raceId);
        setStands(standData);
      } catch (error) {
        console.error("Error fetching grandstands:", error);
        setError("Could not load track map. Please try again.");
      } finally {
        setLoadingStands(false);
      }
    };
    fetchStands();
  }, [raceId]);

  const handleStandClick = (standId) => {
    const standData = stands.find(s => s.id === standId);
    if (!standData || standData.nonClickable) return;
    setSelectedStand(standData);
  };

  const handleBackToStadium = () => setSelectedStand(null);

  const handleMint = (selectedSeats, totalPrice) => {
    if (!isAuthenticated) {
        alert("Please log in to purchase tickets.");
        navigate('/login');
        return;
    }
    const seatObjects = selectedSeats.map(number => ({ section: selectedStand.id, number }));
    navigate('/purchase-ticket', { 
      state: { 
        selectedSeats: seatObjects, 
        raceId: raceId,
        stand: selectedStand,
        totalPrice: totalPrice
      } 
    });
  };

  if (loadingStands) {
    return (
      <div className="loading-state full-page-center">
        <div className="loading-spinner"></div>
        <p>Loading Track Map...</p>
      </div>
    );
  }

  if (error) {
     return (
        <div className="error-state full-page-center">
          <h3>Error</h3>
          <p>{error}</p>
          <Link to="/" className="stadium-back-button">Back Home</Link>
        </div>
     );
  }

  const zoomClass = selectedStand ? `zoom-stand-${selectedStand.id}` : 'zoom-overview';
  const getStand = (id) => stands.find(s => s.id.toLowerCase() === id.toLowerCase()) || { nonClickable: true, color: '#444444', name: id };

  return (
    <motion.div
      className="stadium-view-container"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      <div className="stadium-ui-header">
        <Link to="/" className="stadium-back-button">← Back to Paddock</Link>
        <h2>{selectedStand ? `SELECT SEATS: ${selectedStand.name}` : `SELECT YOUR GRANDSTAND`}</h2>
      </div>

      <div className={`stadium-map-wrapper ${zoomClass}`}>
        
        {/* --- THIS IS THE FIX: Full, un-truncated SVG code --- */}
        <svg
          className="stadium-svg"
          viewBox="0 0 4000 4000"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Venue Map</title>
          <g>
            {/* Clickable Stands */}
            <g className={`svg-stand ${getStand('A').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('A')}>
              <path d="M1418,1275.5l-47.2,-91.5l738,-379.9l1080.1,-17.4l1.6,103l-1055.9,17z" fill={getStand('A').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('A').nonClickable ? 0.3 : 0.8}/>
              <text x="2413.5" y="874.3" fontSize="72" textAnchor="middle" fill="#000">A</text>
            </g>
            <g className={`svg-stand ${getStand('M').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('M')}>
              <path d="M281.1292,1815.1497l295.2194,-170.45l45.05,78.0266l-295.2194,170.45z" fill={getStand('M').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('M').nonClickable ? 0.3 : 0.8}/>
              <text x="451.2" y="1790.5" fontSize="72" textAnchor="middle" fill="#000">M</text>
            </g>
            <g className={`svg-stand ${getStand('G_OrangeTree').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('G_OrangeTree')}>
              <path d="M1639.6831,1343.7676l172.9402,-99.85l45.05,78.0266l-172.9402,99.85z" fill={getStand('G_OrangeTree').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('G_OrangeTree').nonClickable ? 0.3 : 0.8}/>
              <text x="1730" y="1300" fontSize="48" textAnchor="middle" fill="#000">ORANGE TREE</text>
            </g>
            <g className={`svg-stand ${getStand('D').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('D')}>
              <path d="M232.63756,2519.42202l-154.98642,-463.05489l103.93368,-34.78704l154.98642,463.05489z" fill={getStand('D').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('D').nonClickable ? 0.3 : 0.8}/>
              <text x="207.1" y="2292.1" fontSize="72" textAnchor="middle" fill="#000">D</text>
            </g>
            <g className={`svg-stand ${getStand('H').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('H')}>
              <path d="M419.99997,3019.26739l-126.35694,-377.51823l103.93368,-34.78704l126.35694,377.51823z" fill={getStand('H').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('H').nonClickable ? 0.3 : 0.8}/>
              <text x="408.7" y="2834.7" fontSize="72" textAnchor="middle" fill="#000">H</text>
            </g>
            <g className={`svg-stand ${getStand('R').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('R')}>
              <path d="M1332.537,3280.0714h-524.3v-109.6h524.3z" fill={getStand('R').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('R').nonClickable ? 0.3 : 0.8}/>
              <text x="1070.3" y="3246.8" fontSize="72" textAnchor="middle" fill="#000">R</text>
            </g>
            <g className={`svg-stand ${getStand('G_Main').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('G_Main')}>
              <path d="M2810.1893,3286.3457h-1419.7v-109.6h1419.7z" fill={getStand('G_Main').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('G_Main').nonClickable ? 0.3 : 0.8}/>
              <text x="2100.3" y="3253.1" fontSize="72" textAnchor="middle" fill="#000">G</text>
            </g>
            <g className={`svg-stand ${getStand('GRANDPRIXCLUB').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('GRANDPRIXCLUB')}>
              <path d="M1647.2286,2054.6818l295.2194,170.45l-45.05,78.0266l-295.2194,-170.45z" fill={getStand('GRANDPRIXCLUB').color} stroke="#37383a" strokeWidth="3px" fillOpacity={getStand('GRANDPRIXCLUB').nonClickable ? 0.3 : 0.8}/>
               <text x="1770" y="2200" fontSize="48" textAnchor="middle" fill="#FFF">GRAND PRIX</text>
               <text x="1770" y="2250" fontSize="48" textAnchor="middle" fill="#FFF">CLUB</text>
            </g>
            <g className={`svg-stand ${getStand('HEINEKEN').nonClickable ? 'non-clickable' : ''}`} onClick={() => handleStandClick('HEINEKEN')}>
              <path d="M3173.3,1669.4v-241h241v241z" fill={getStand('HEINEKEN').color} stroke="#505154" strokeWidth="3px" fillOpacity={getStand('HEINEKEN').nonClickable ? 0.3 : 0.8}/>
              <text x="3293.8" y="1530" fontSize="48" textAnchor="middle" fill="#000">HEINEKEN</text>
               <text x="3293.8" y="1630" fontSize="48" textAnchor="middle" fill="#000">VILLAGE</text>
            </g>
            
            {/* Non-Clickable Stands */}
            <g className="svg-stand non-clickable" onClick={() => handleStandClick('B')}>
              <path d="M963.5549,1418.8822l344.7546,-199.05l54.8,94.9136l-344.7546,199.05z" fill={getStand('B').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={0.3}/>
              <text x="1163.3" y="1388.4" fontSize="72" textAnchor="middle" fill="#B1BAC2">B</text>
            </g>
            <g className="svg-stand non-clickable" onClick={() => handleStandClick('PREMIUM PADDOCK')}>
              <path d="M581.6821,2007.4141l344.7546,-199.05l54.8,94.9136l-344.7546,199.05z" fill={getStand('PREMIUM PADDOCK').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={0.3} />
               <text x="750" y="1980" fontSize="48" textAnchor="middle" fill="#B1BAC2">PREMIUM PADDOCK</text>
            </g>
            <g className="svg-stand non-clickable" onClick={() => handleStandClick('N')}>
              <path d="M712.97775,3223.5811l-165.60126,-65.82708l40.48624,-101.85128l165.60126,65.82708z" fill={getStand('N').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={0.3}/>
              <text x="650.4" y="3161.3" fontSize="72" textAnchor="middle" fill="#B1BAC2">N</text>
            </g>
            <g className="svg-stand non-clickable" onClick={() => handleStandClick('S')}>
              <path d="M3091.8719,3280.0064h-158.1v-109.6h158.1z" fill={getStand('S').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={0.3}/>
              <text x="3012.8" y="3246.8" fontSize="72" textAnchor="middle" fill="#B1BAC2">S</text>
            </g>
            <g className="svg-stand non-clickable" onClick={() => handleStandClick('V')}>
              <path d="M3254.7,3056.2v-206.6h128.3v206.6z" fill={getStand('V').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={0.3}/>
              <text x="3318.8" y="2974.5" fontSize="72" textAnchor="middle" fill="#B1BAC2">V</text>
            </g>
            <g className="svg-stand non-clickable" onClick={() => handleStandClick('PITSTOP')}>
              <path d="M643.6612,1605.0849l267.6806,-154.55l45.05,78.0266l-267.6806,154.55z" fill={getStand('PITSTOP').color} stroke="#5f6062" strokeWidth="2px" fillOpacity={0.3}/>
              <text x="780" y="1520" fontSize="48" textAnchor="middle" fill="#B1BAC2">PIT STOP</text>
            </g>
          </g>

          {/* --- Track Outline & Background (FULL PATHS) --- */}
          <g>
            <path d="M3964.9,1712.3c-106.2,-267.8 -230.6,-472 -369.9,-606.9c-117.5,-113.8 -216.8,-151.3 -270.2,-171.4c-9,-3.4 -20.1,-7.6 -23.8,-9.6c-15.6,-11 -35.9,-15.3 -82.4,-17.5c-29.4,-1.4 -70,-1.8 -120.8,-1.2c-86,1 -203.7,4.9 -349.7,11.6c-257,11.7 -529.7,28.7 -607.1,33.6c-22.8,1.5 -45.4,8 -65.4,19l-1125,616.5l53.5,92.7l1122.9,-615.4c6.4,-3.5 13.5,-5.6 20.7,-6c73.1,-4.7 331.2,-20.8 580.2,-32.4c140.5,-6.6 255.8,-10.7 342.7,-12.2c126.3,-2.2 164.9,1.6 175.8,3.4c11,6.4 23.9,11.3 40.5,17.6c93.9,35.4 342.4,129.2 574,706.7c-1.5,24.2 -5.1,82.4 -10.4,144c-10.8,126.2 -19.8,167 -23.2,178.7c-23,23.6 -57.9,58.7 -139.3,56.5c-18.3,-0.5 -86.2,-11.6 -319.7,-103.8c-106.8,-42.2 -205.7,-84.5 -239.6,-99.2c-12.7,-16.8 -38.8,-53.2 -62.2,-97c-37.5,-70.4 -50.9,-128.1 -37.6,-162.6c16.6,-43.2 61.1,-119 104.1,-192.2c36.5,-62.1 74.2,-126.4 101.2,-180.7c39.3,-79.1 49.3,-123.3 35.5,-157.6c-10.3,-25.6 -28.7,-45.3 -53.4,-56.7c-18.2,-8.4 -39.5,-12.3 -63.5,-11.5c-27.6,0.9 -59.7,8.2 -95.7,21.5c-63.4,23.5 -119.7,58.6 -166.4,89.8c-6,4 -12.2,8 -18.8,12.2c-37.3,24.1 -79.6,51.4 -107.8,96.1c-16,25.4 -27.7,52.3 -39.1,78.3c-7.6,17.5 -14.8,34 -22.8,48.9c-3.1,5.8 -6.3,11.9 -9.6,18.3c-28.1,53.6 -75.2,143.2 -125.1,156.4c-22.2,5.9 -55.5,12.6 -87.3,10.9c-27.7,-1.4 -47.6,-8.8 -59.3,-21.9c-14.7,-16.4 -41.5,-73.2 25.5,-246.7l1.4,-3.7l0.9,-3.8c0.4,-2 4.3,-19.8 4.9,-41.7c1,-36.1 -7.1,-65.2 -24.2,-86.5c-17.6,-22 -43.8,-34.1 -73.7,-34.1c-43.7,0 -180.9,33.1 -299,77.4c-72.6,27.2 -132.4,56.1 -177.7,86c-64.2,42.3 -99.6,86.2 -108.2,134.4c-13,73.1 -24.5,144.5 -21.9,214c3,82.1 25.6,150.5 69.2,209.2c56.6,76.2 159,121.3 241.3,157.5c14.5,6.4 28.1,12.4 40.8,18.2c112.4,51.9 228.5,105.5 352.1,143.3c34.9,10.7 70.3,18.6 104.5,26.2c28.6,6.4 55.6,12.4 82.1,19.9c121.6,34.3 288.2,81.2 364.3,183.8c6.3,8.5 11,16.2 14.4,23.7c76.8,167.4 76.8,167.4 68.9,446.5c-0.6,19.3 -1.1,39.9 -1.7,61.9l-0.1,3.8l0.3,2.3c0,2.5 -0.7,15 -11.2,28.7c-12.9,16.8 -42.7,38.7 -111.8,48.3c-140.3,19.4 -1393.3,8.1 -2036.1,-0.5c-48.6,-0.7 -105.9,-22.1 -157.1,-58.9c-50,-35.9 -92,-86.6 -125,-150.4c-42.4,-82.1 -64.2,-160.3 -64.8,-232.4c-0.5,-52.4 10.1,-106.2 21.2,-163.3c6.5,-33.4 13.3,-67.8 17.7,-102.3c1.9,-9.6 2.8,-24.8 -3.5,-42.9c-8.6,-24.7 -27.7,-46.4 -56.7,-64.7c-10.5,-6.6 -23.8,-13.2 -40.8,-21.5c-52,-25.5 -148.8,-73 -134.6,-124.5c9.3,-33.6 46,-73.3 103.6,-111.6c49,-32.7 95.5,-52.7 95.9,-52.9l-1,-2.2l0.6,1.1l409.8,-224.6l-53.5,-92.7l-407.7,223.4l0.4,0.7c-17.9,8.3 -58.8,28.2 -102.3,57.1c-82.2,54.5 -132.3,112.8 -148.9,173.3c-11.8,42.9 -10.6,107.4 62.3,170.7c40.6,35.3 91.3,60.1 128.4,78.3c12.9,6.3 25.1,12.3 30.7,15.8c5.3,3.3 8.6,6 10.6,8c-4,29.6 -9.8,59.5 -16,91c-11.7,59.7 -23.8,121.5 -23.2,184.8c0.8,89 26.6,183.4 76.7,280.6c40.8,79 93.8,142.4 157.6,188.2c40.3,29 122.2,77.8 218.1,79c19.1,0.3 472.9,6.3 955.5,9.4c180.8,1.2 339.8,1.7 476.9,1.7c355.7,0 563.6,-3.9 619.8,-11.6c48.1,-6.6 89.2,-19.4 122.1,-38c29.2,-16.5 52.2,-37.7 68.3,-62.8c24.5,-38.2 25.7,-73.8 24.9,-87.9c0.6,-21 1.1,-40.7 1.7,-59.2c4.2,-145.9 6.3,-219.2 -3.7,-283.8c-10.4,-67.6 -32.8,-118.6 -74.9,-210.3c-6.6,-14.3 -15,-28.3 -25.7,-42.8c-43.8,-59.1 -109.3,-107.7 -200.2,-148.3c-76,-34 -156.4,-56.6 -221.1,-74.8c-29.4,-8.3 -59.1,-14.9 -87.9,-21.3c-33.7,-7.5 -65.5,-14.6 -96.5,-24.1c-116.6,-35.7 -229.5,-87.8 -338.6,-138.2c-13.5,-6.2 -27.6,-12.5 -42.6,-19c-70.7,-31.1 -158.7,-69.9 -198.5,-123.3c-66.2,-89.1 -53.3,-197.4 -27.8,-340.6c1.1,-6.1 8.8,-28.9 61.6,-63.7c38.1,-25.1 92.1,-51 156.3,-75.1c52.4,-19.7 112.2,-38.3 168.3,-52.4c43.5,-10.9 70.5,-15.7 84,-17.4c0.6,7.8 0,18.7 -1.5,27.8c-32.1,83.9 -48.1,153.1 -49,211.3c-0.9,59.1 14.3,106.5 45.2,141c39.8,44.4 96,57.7 149,57.7c39.4,0 77,-7.4 104.7,-14.7c44.2,-11.7 84.3,-42.3 122.6,-93.6c28.8,-38.5 51.5,-81.8 69.8,-116.6c3.3,-6.2 6.4,-12.1 9.3,-17.6c10,-18.7 18.4,-38 26.5,-56.6c10.2,-23.4 19.8,-45.5 31.5,-64c15.6,-24.8 44.6,-43.5 75.3,-63.3c6.6,-4.3 13.4,-8.7 20.2,-13.2c41.5,-27.8 91.1,-58.8 144.1,-78.5c43.9,-16.3 65,-15.7 73,-14.3c-2.5,10.9 -10.6,35.1 -36.1,84.6c-24.9,48.2 -58.3,105.2 -90.6,160.3c-47.3,80.5 -91.9,156.6 -111.7,208c-25.3,65.8 -10.8,150.3 43,251.4c36.8,69.1 79.4,121.8 81.2,124l8.2,10.1l11.9,5.2c1.2,0.5 122.2,53.4 255.4,106c78.6,31 146.2,56 200.9,74.1c97.4,32.2 135.3,36.7 155.3,37.3c3.6,0.1 7,0.1 10.5,0.1c121.5,0 180.2,-60 208.7,-89.2c1.7,-1.7 3.3,-3.4 4.8,-4.9c15.8,-15.8 24,-40.3 32.5,-97.2c4.8,-32.2 9.6,-74.9 14.3,-126.8c7.8,-87.5 12.6,-173.1 12.7,-174l0.7,-11.7z" fill="#cccccc" stroke="none" strokeWidth="1" />
            <path d="M556.2,1863.5l1545.1,-846.7c13.3,-7.3 28,-11.5 43.1,-12.5c158.3,-10.1 1083,-67.6 1125.9,-36.1c47,34.4 363.1,53.2 644.9,763.8c0,0 -18.8,338.1 -43.8,363.1c-25,25 -72,81.4 -184.7,78.3c-112.7,-3.1 -591.7,-212.9 -591.7,-212.9c0,0 -162.8,-200.3 -115.8,-322.4c47,-122.1 266.1,-428.9 241,-491.5c-22.2,-55.5 -104,-31.4 -144.2,-16.5c-55.2,20.5 -106.5,51.6 -155.3,84.2c-39.6,26.5 -84.9,51 -111,92.4c-23.9,37.9 -38.6,84.1 -59.9,123.9c-35,65.4 -88.8,180.2 -168.2,201.2c-106.4,28.2 -328.7,43.8 -184.7,-328.7c0,0 21.9,-97 -40.7,-97c-62.6,0 -507.1,112.7 -532.2,253.6c-25.1,140.9 -43.8,272.3 37.6,381.9c57.1,76.9 178,120.5 261.5,159c112.8,52 226.4,104.3 345.3,140.8c60.7,18.6 124.2,28.5 185.5,45.7c132.2,37.2 306.8,87.4 392.7,203.5c7.7,10.4 14.6,21.4 20.1,33.3c87.7,191 81.4,187.8 72,532.2c0,0 12.5,109.6 -169,134.6c-181.5,25 -2041.8,0 -2044.2,0c-66.6,-0.9 -134.4,-30.8 -187.6,-69c-60.5,-43.5 -107.3,-103.4 -141.3,-169.3c-40.9,-79.4 -70,-166.5 -70.8,-256.5c-0.8,-91.7 28.3,-184.4 39.7,-275.3c0,0 8.6,-25 -36,-53.2c-44.6,-28.2 -230.1,-90.4 -198.4,-205.4c31.7,-115 230.1,-199.6 230.1,-199.6" fill="none" stroke="#231f20" strokeWidth="17"/>
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

