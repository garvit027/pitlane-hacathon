import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import "./LiveScores.css";

/* Page-level animation variants */
const pageVariants = {
  initial: { opacity: 0, scale: 0.985, y: 12 },
  in: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  out: { opacity: 0, scale: 1.02, y: -8, transition: { duration: 0.35, ease: "easeIn" } },
};

/* Card variants for staggered entrances and movement */
const cardVariants = {
  initial: (i) => ({ opacity: 0, y: 24, scale: 0.98 }),
  animate: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.04,
      duration: 0.45,
      ease: "circOut"
    }
  }),
  exit: { opacity: 0, y: 10, scale: 0.99, transition: { duration: 0.25 } },
  hover: {
    y: -6,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.995,
    y: -2,
    transition: { duration: 0.15 }
  }
};

/* Hover info variants */
const hoverInfoVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.95,
    transition: { duration: 0.2 }
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      delay: 0.1
    }
  }
};

/* Modal animation variants */
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    rotateX: 10,
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -10,
    rotateX: -5,
    transition: {
      duration: 0.35,
      ease: "easeIn"
    }
  }
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.25 } }
};

/* Mock data with additional info for hover */
const DEFAULT_LIVE = [
  {
    id: "VER", position: 1, driverCode: "VER", teamColor: "#0600ef", gap: "+0.0", laps: 50, teamName: "Red Bull Racing",
    fullName: "Max Verstappen", country: "Netherlands", points: 258, wins: 8, podiums: 10,
    hoverInfo: "3x World Champion • 2021, 2022, 2023 • Youngest F1 race winner"
  },
  {
    id: "LEC", position: 2, driverCode: "LEC", teamColor: "#dc0000", gap: "+2.5", laps: 50, teamName: "Ferrari",
    fullName: "Charles Leclerc", country: "Monaco", points: 189, wins: 5, podiums: 8,
    hoverInfo: "Ferrari Academy • 2016 GP3 Champion • Known for qualifying pace"
  },
  {
    id: "HAM", position: 3, driverCode: "HAM", teamColor: "#00d2be", gap: "+8.1", laps: 50, teamName: "Mercedes",
    fullName: "Lewis Hamilton", country: "United Kingdom", points: 175, wins: 103, podiums: 197,
    hoverInfo: "7x World Champion • Most wins in F1 history • Knighted in 2021"
  },
  {
    id: "NOR", position: 4, driverCode: "NOR", teamColor: "#ff8700", gap: "+10.2", laps: 49, teamName: "McLaren",
    fullName: "Lando Norris", country: "United Kingdom", points: 156, wins: 1, podiums: 15,
    hoverInfo: "McLaren prodigy • 2021 Italian GP winner • Known for streaming"
  },
  {
    id: "RUS", position: 5, driverCode: "RUS", teamColor: "#00d2be", gap: "+12.4", laps: 49, teamName: "Mercedes",
    fullName: "George Russell", country: "United Kingdom", points: 142, wins: 1, podiums: 11,
    hoverInfo: "Mercedes junior • 2022 Brazilian GP winner • Tallest driver on grid"
  },
  {
    id: "SAI", position: 6, driverCode: "SAI", teamColor: "#dc0000", gap: "+15.0", laps: 49, teamName: "Ferrari",
    fullName: "Carlos Sainz", country: "Spain", points: 138, wins: 3, podiums: 21,
    hoverInfo: "The Smooth Operator • 2022 British GP winner • Son of rally legend"
  },
  {
    id: "ALO", position: 7, driverCode: "ALO", teamColor: "#0090cc", gap: "+18.3", laps: 49, teamName: "Aston Martin", // Corrected team color
    fullName: "Fernando Alonso", country: "Spain", points: 125, wins: 32, podiums: 106,
    hoverInfo: "2x World Champion • 2005 & 2006 • Oldest driver on grid"
  },
  {
    id: "PIA", position: 8, driverCode: "PIA", teamColor: "#ff8700", gap: "+20.1", laps: 49, teamName: "McLaren",
    fullName: "Oscar Piastri", country: "Australia", points: 98, wins: 0, podiums: 2,
    hoverInfo: "2021 F2 Champion • Rookie of the Year 2023 • McLaren rising star"
  },
];

const DEFAULT_PAST = {
  raceName: "Monaco Grand Prix 2024",
  results: [
    {
      id: "LEC", position: 1, driverCode: "LEC", teamColor: "#dc0000", time: "1:45:30.123", teamName: "Ferrari",
      fullName: "Charles Leclerc", country: "Monaco", points: 25, wins: 1, podiums: 1,
      hoverInfo: "Home race victory • First Monaco win • Emotional victory"
    },
    {
      id: "VER", position: 2, driverCode: "VER", teamColor: "#0600ef", time: "+5.500", teamName: "Red Bull Racing",
      fullName: "Max Verstappen", country: "Netherlands", points: 18, wins: 0, podiums: 1,
      hoverInfo: "Strategic masterclass • Extended championship lead"
    },
    {
      id: "SAI", position: 3, driverCode: "SAI", teamColor: "#dc0000", time: "+8.900", teamName: "Ferrari",
      fullName: "Carlos Sainz", country: "Spain", points: 15, wins: 0, podiums: 1,
      hoverInfo: "Double Ferrari podium • Strong defensive drive"
    },
    {
      id: "NOR", position: 4, driverCode: "NOR", teamColor: "#ff8700", time: "+15.200", teamName: "McLaren",
      fullName: "Lando Norris", country: "United Kingdom", points: 12, wins: 0, podiums: 0,
      hoverInfo: "Best of the rest • Strong qualifying performance"
    },
    {
      id: "HAM", position: 5, driverCode: "HAM", teamColor: "#00d2be", time: "+18.700", teamName: "Mercedes",
      fullName: "Lewis Hamilton", country: "United Kingdom", points: 10, wins: 0, podiums: 0,
      hoverInfo: "Solid points finish • Mercedes strategy pays off"
    },
  ],
};

/* Small helper: deep copy to avoid shared mutation */
const clone = (v) => JSON.parse(JSON.stringify(v));

export default function LiveScores() {
  // Mode: live or past
  const [isLive, setIsLive] = useState(true);

  // raceData shape: { live: [...]} or { past: {...} }
  const [raceData, setRaceData] = useState({ live: clone(DEFAULT_LIVE) });

  // which driver code is highlighted (recent change) — used for brief glow
  const [highlight, setHighlight] = useState(null);

  // selected driver for detailed overlay
  const [selectedDriver, setSelectedDriver] = useState(null);

  // last update timestamp
  const [lastUpdated, setLastUpdated] = useState(null);

  // loading state for smooth transitions
  const [isLoading, setIsLoading] = useState(false);

  // hover state for driver cards
  const [hoveredDriver, setHoveredDriver] = useState(null);

  // ref to control interval
  const intervalRef = useRef(null);

  // simulate live updates: small gap changes + occasional position swap
  useEffect(() => {
    // cleanup existing interval on mode change
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isLive) {
      setIsLoading(true);
      setTimeout(() => {
        setRaceData({ past: clone(DEFAULT_PAST) });
        setLastUpdated(new Date());
        setIsLoading(false);
      }, 400); // Simulate fetch delay
      return; // Exit effect if not live
    }

    // set initial live state if missing or switched back to live
    if (!raceData || !raceData.live) {
      setRaceData({ live: clone(DEFAULT_LIVE) });
    }

    // run updates for live data
    intervalRef.current = setInterval(() => {
      setRaceData((prev) => {
        // Ensure prev.live exists, otherwise start from default
        const base = prev?.live ? clone(prev.live) : clone(DEFAULT_LIVE);

        // slight gap jitter
        const jittered = base.map((d) => {
          // random fluctuation
          const baseGap = parseFloat(String(d.gap).replace("+", "")) || 0;
          const delta = (Math.random() * 0.4 - 0.2); // -0.2 .. +0.2
          // Ensure gap is never negative and keep Leader text
          const newGap = d.position === 1 ? 0.0 : Math.max(0, +(baseGap + delta).toFixed(1));
          return {
            ...d,
            gap: d.position === 1 ? "Leader" : `+${newGap.toFixed(1)}`,
            updating: Math.random() > 0.7 // random updating state for visual flair
          };
        });

        // occasionally swap positions (simulate overtakes) — 20% chance
        if (Math.random() < 0.2 && jittered.length >= 2) {
          // pick random index > 0 to try swap with previous
          const idx = 1 + Math.floor(Math.random() * (jittered.length - 1));
          // swap positions idx and idx-1
          const a = jittered[idx - 1];
          const b = jittered[idx];
          // Create new objects with swapped positions
          const aa = { ...a, position: b.position };
          const bb = { ...b, position: a.position };
          // Update the array
          jittered[idx - 1] = bb;
          jittered[idx] = aa;
          // re-sort by position number just in case logic gets complex
          jittered.sort((x, y) => x.position - y.position);
          setHighlight(bb.driverCode); // highlight who rose (the one that moved up)
        } else {
          // highlight a random driver for micro animation (less frequent)
          if (Math.random() < 0.1) {
            setHighlight(jittered[Math.floor(Math.random() * jittered.length)].driverCode);
          }
        }

        setLastUpdated(new Date());
        return { live: jittered };
      });

      // clear highlight after short time
      setTimeout(() => setHighlight(null), 650);
    }, 2400); // Update frequency

    // Cleanup function
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isLive, raceData]); // Rerun effect if isLive changes or raceData is reset

  /* click handlers */
  const onDriverClick = (driver) => {
    setSelectedDriver(driver);
  };

  const closeDriverPanel = () => setSelectedDriver(null);

  /* Utility for formatted time */
  const formatTime = (d) => d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

  /* Generate random stats for driver panel */
  const generateDriverStats = (driver) => ({
    bestLap: (Math.random() * 35 + 60).toFixed(3), // Example: 60.000 to 95.000
    avgPace: (Math.random() * 2 + 1).toFixed(2), // Example: 1.00 to 3.00
    pitStops: Math.floor(Math.random() * 3), // 0, 1, or 2
    tyre: ["Soft", "Medium", "Hard"][Math.floor(Math.random() * 3)],
    topSpeed: Math.floor(Math.random() * 50 + 320), // 320 to 370
    drsActivations: Math.floor(Math.random() * 15 + 5), // 5 to 20
    progress: Math.floor(Math.random() * 30 + 70) // 70 to 100
  });

  return (
    <motion.div
      className="ls-outer" // Outer container for background effects
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      {/* subtle track grid + lighting sits above the video but below the panel */}
      <div className="ls-track-overlay" aria-hidden="true" />

      <div className="livescores-panel">
        <header className="livescores-header">
          <div className="header-left">
            <Link to="/" className="stadium-back-button">← Back to PitLane</Link>
            <div className="app-title">F1 Telemetry · Live</div>
          </div>

          <div className="header-right">
            <div className={`live-badge ${isLive ? "on" : "off"}`}>
              <span className="dot" />
              <span className="label">{isLive ? "LIVE" : "RECAP"}</span>
            </div>
            <div className="last-updated">
              {lastUpdated ? `Updated ${formatTime(lastUpdated)}` : "Loading..."}
            </div>
            <button
              className="mode-toggle"
              onClick={() => setIsLive((v) => !v)}
              aria-label="Toggle Live or Past Results"
            >
              {isLive ? "Show Recap" : "Go Live"}
            </button>
          </div>
        </header>

        <main className="ls-main">
          {/* AnimatePresence handles the switch between loading/live/past */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                className="loading-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="loading-spinner"></div>
                <p>Loading {isLive ? "Live Data" : "Race Recap"}...</p>
              </motion.div>
            ) : isLive && raceData?.live ? (
              // --- LIVE LEADERBOARD ---
              <motion.section
                key="liveBoard"
                className="leaderboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
              >
                <div className="leaderboard-head">
                  <h2>Current Standings</h2>
                  <div className="mini-stats">
                    <div>Lap {raceData.live[0]?.laps ?? "—"}/78</div> {/* Example total laps */}
                    <div>{raceData.live.length} Drivers</div>
                  </div>
                </div>

                <div className="driver-grid" role="list">
                  {raceData.live
                    .slice() // Create a copy before sorting
                    .sort((a, b) => a.position - b.position) // Ensure sorted by position
                    .map((driver, idx) => {
                      const stats = generateDriverStats(driver); // Generate stats for modal
                      return (
                        <motion.article
                          key={driver.id} // Use driver ID as key
                          role="listitem"
                          className={`driver-card ${highlight === driver.driverCode ? "changed" : ""} ${driver.position <= 3 ? "podium" : ""}`}
                          layout // Enable smooth layout transitions
                          initial="initial"
                          animate="animate"
                          whileHover="hover"
                          whileTap="tap"
                          exit="exit"
                          variants={cardVariants}
                          custom={idx} // Pass index for stagger delay
                          onClick={() => onDriverClick({ ...driver, ...stats })}
                          onHoverStart={() => setHoveredDriver(driver.id)}
                          onHoverEnd={() => setHoveredDriver(null)}
                          aria-label={`Driver ${driver.driverCode}, Position ${driver.position}`}
                        >
                          <div className="driver-left">
                            <div className={`pos ${driver.position <= 3 ? `podium-${driver.position}` : ""}`}>
                              {driver.position}
                            </div>
                            <div
                              className="strip"
                              style={{
                                background: driver.teamColor,
                                boxShadow: `0 0 15px ${driver.teamColor}40` // Subtle glow
                              }}
                            />
                          </div>

                          <div className="driver-center">
                            <div
                              className="driver-code"
                              style={{ color: driver.teamColor }}
                            >
                              {driver.driverCode}
                            </div>
                            <div className="driver-meta">{driver.teamName}</div>
                          </div>

                          <div className="driver-right">
                            <div className={`gap ${driver.updating ? "updating" : ""}`}>
                              {driver.gap}
                            </div>
                            <div className="laps">{driver.laps} Laps</div>
                          </div>

                          {/* Hover Info Panel */}
                          <AnimatePresence>
                            {hoveredDriver === driver.id && (
                              <motion.div
                                className="hover-info-panel"
                                layoutId={`hover-${driver.id}`} // Shared layout ID for animation
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                variants={hoverInfoVariants}
                                aria-live="polite"
                              >
                                <div className="hover-info-content">
                                  <div className="hover-driver-name">{driver.fullName}</div>
                                  <div className="hover-driver-country">{driver.country}</div>
                                  <div className="hover-driver-stats">
                                    <span>Wins: {driver.wins}</span>
                                    <span>Podiums: {driver.podiums}</span>
                                    <span>Points: {driver.points}</span>
                                  </div>
                                  <div className="hover-driver-fact">
                                    {driver.hoverInfo}
                                  </div>
                                </div>
                                <div className="hover-info-arrow" />
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* subtle animated arrow when position changes */}
                          <div className={`movement ${highlight === driver.driverCode ? "pulse" : ""}`} />
                        </motion.article>
                      );
                    })}
                </div>
              </motion.section>
            ) : (
              // --- PAST RESULTS ---
              raceData?.past && (
                <motion.section
                  key="pastBoard"
                  className="results past"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="leaderboard-head">
                    <h2>{raceData.past.raceName}</h2>
                    <div className="mini-stats">
                      <div>Final Results</div>
                      <div>{raceData.past.results.length} Drivers</div>
                    </div>
                  </div>

                  <div className="driver-grid past" role="list">
                    {raceData.past.results.map((driver, idx) => {
                      const stats = generateDriverStats(driver); // Generate stats for modal
                      return (
                        <motion.article
                          key={driver.id} // Use driver ID
                          role="listitem"
                          className={`driver-card past ${driver.position <= 3 ? "podium" : ""}`}
                          layout
                          initial="initial"
                          animate="animate"
                          whileHover="hover"
                          whileTap="tap"
                          exit="exit"
                          variants={cardVariants}
                          custom={idx}
                          onClick={() => onDriverClick({ ...driver, ...stats })}
                          onHoverStart={() => setHoveredDriver(driver.id)}
                          onHoverEnd={() => setHoveredDriver(null)}
                          aria-label={`Driver ${driver.driverCode}, Finished P${driver.position}`}
                        >
                          <div className="driver-left">
                            <div className={`pos ${driver.position <= 3 ? `podium-${driver.position}` : ""}`}>
                              {driver.position}
                            </div>
                            <div
                              className="strip"
                              style={{
                                background: driver.teamColor,
                                boxShadow: `0 0 15px ${driver.teamColor}40`
                              }}
                            />
                          </div>

                          <div className="driver-center">
                            <div
                              className="driver-code"
                              style={{ color: driver.teamColor }}
                            >
                              {driver.driverCode}
                            </div>
                            <div className="driver-meta">{driver.teamName}</div>
                          </div>

                          <div className="driver-right">
                            <div className="gap">{driver.time}</div>
                            <div className="laps">Final</div>
                          </div>

                          {/* Hover Info Panel for Past Results */}
                          <AnimatePresence>
                            {hoveredDriver === driver.id && (
                              <motion.div
                                className="hover-info-panel"
                                layoutId={`hover-${driver.id}`}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                variants={hoverInfoVariants}
                                aria-live="polite"
                              >
                                <div className="hover-info-content">
                                  <div className="hover-driver-name">{driver.fullName}</div>
                                  <div className="hover-driver-country">{driver.country}</div>
                                  <div className="hover-race-info">
                                    <span>Position: {driver.position}</span>
                                    <span>Points: +{driver.points}</span>
                                  </div>
                                  <div className="hover-driver-fact">
                                    {driver.hoverInfo}
                                  </div>
                                </div>
                                <div className="hover-info-arrow" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.article>
                      );
                    })}
                  </div>
                </motion.section>
              )
            )}
          </AnimatePresence>
        </main>

        <footer className="ls-footer">
          <div className="footer-left">F1 Circuit Telemetry • Immersive Dashboard</div>
          <div className="footer-right">Hover for driver info • Click for detailed analysis</div>
        </footer>
      </div>

      {/* Driver detail overlay - CENTERED MODAL */}
      <AnimatePresence mode="wait">
        {selectedDriver && (
          <>
            {/* Backdrop */}
            <motion.div
              className="backdrop"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={backdropVariants}
              onClick={closeDriverPanel} // Close modal on backdrop click
              aria-hidden="true"
            />
            {/* Modal Container for centering and perspective */}
            <motion.div
              className="modal-container"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              aria-labelledby="driver-name"
              role="dialog"
            >
              {/* Actual Modal Content Panel */}
              <aside
                className="driver-panel centered-modal"
              >
                <button
                  className="close-x"
                  onClick={closeDriverPanel}
                  aria-label="Close driver details"
                >
                  ✕
                </button>

                {/* Modal Header */}
                <div className="dp-top">
                  <div
                    className="dp-strip"
                    style={{
                      background: selectedDriver.teamColor,
                      boxShadow: `0 0 25px ${selectedDriver.teamColor}80`
                    }}
                  />
                  <div className="dp-meta">
                    <div className="dp-code" id="driver-name">{selectedDriver.driverCode}</div>
                    <div className="dp-sub">
                      {selectedDriver.teamName} • P{selectedDriver.position}
                      {selectedDriver.position <= 3 && " 🏆"}
                    </div>
                  </div>
                  {/* Could add driver image/helmet here */}
                  {/* <img src={`/images/drivers/${selectedDriver.driverCode}.png`} alt={selectedDriver.fullName} className="dp-driver-image"/> */}
                </div>

                {/* Modal Body with Stats */}
                <div className="dp-body">
                   <h4 className="dp-body-title">Race Statistics (Simulated)</h4>
                   {/* Using motion.div for stagger animation */}
                   <motion.div
                     className="stats-container"
                     initial="hidden"
                     animate="visible"
                     variants={{ visible: { transition: { staggerChildren: 0.06 }}}}
                    >
                      {/* Stat Row Component or direct elements */}
                      {[
                        { label: "Best Lap", value: `${selectedDriver.bestLap}s`, progress: Math.random() * 30 + 70 },
                        { label: "Avg Pace", value: `+${selectedDriver.avgPace}s`, progress: Math.random() * 30 + 65 },
                        { label: "Pit Stops", value: selectedDriver.pitStops, progress: (selectedDriver.pitStops + 1) * 25 },
                        { label: "Tyre Compound", value: selectedDriver.tyre, progress: 80 },
                        { label: "Top Speed", value: `${selectedDriver.topSpeed} km/h`, progress: (selectedDriver.topSpeed - 300) * 1.5 },
                        { label: "DRS Activations", value: selectedDriver.drsActivations, progress: selectedDriver.drsActivations * 4 }
                      ].map((stat, index) => (
                         <motion.div
                           key={stat.label}
                           className="stat-row"
                           style={{ '--progress': `${stat.progress}%` }} // CSS variable for progress bar
                           variants={{ hidden: { opacity: 0, x: -15 }, visible: { opacity: 1, x: 0 } }}
                         >
                           <span>{stat.label}</span>
                           <strong>{stat.value}</strong>
                           <div className="stat-progress-bar">
                              <div className="stat-progress-fill" style={{ background: selectedDriver.teamColor }}></div>
                           </div>
                         </motion.div>
                       ))}
                   </motion.div>
                </div>

                {/* Modal Actions */}
                <motion.div
                  className="dp-actions"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <button className="btn ghost" onClick={closeDriverPanel}>Close Details</button>
                  <button className="btn primary">Full Analysis</button>
                </motion.div>
              </aside>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

