import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import './MyGarage.css';

// Page transition animation
const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 50,
    scale: 0.98
  },
  in: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.6
    }
  },
  out: { 
    opacity: 0, 
    y: -50,
    scale: 0.98,
    transition: { 
      duration: 0.4,
      ease: "easeInOut"
    }
  }
};

// Card animation variants
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      type: "spring",
      stiffness: 100
    }
  }),
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.98,
    y: -2
  }
};

// Modal animation
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      duration: 0.5
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -30,
    transition: {
      duration: 0.3
    }
  }
};

export default function MyGarage() {
  const [activeTab, setActiveTab] = useState('cars');
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  // Mock data for garage items
  const garageData = {
    cars: [
      {
        id: 1,
        name: 'RB19 Replica',
        team: 'Red Bull Racing',
        teamColor: '#0600ef',
        year: 2023,
        specs: { power: '1050 HP', topSpeed: '350 km/h', weight: '798 kg' },
        image: '🏎️',
        rarity: 'Legendary',
        acquired: '2023-12-01'
      },
      {
        id: 2,
        name: 'SF-23 Stradale',
        team: 'Ferrari',
        teamColor: '#dc0000',
        year: 2023,
        specs: { power: '1020 HP', topSpeed: '345 km/h', weight: '805 kg' },
        image: '🐎',
        rarity: 'Epic',
        acquired: '2023-11-15'
      },
      {
        id: 3,
        name: 'W14 E Performance',
        team: 'Mercedes-AMG',
        teamColor: '#00d2be',
        year: 2023,
        specs: { power: '1000 HP', topSpeed: '340 km/h', weight: '810 kg' },
        image: '⚡',
        rarity: 'Rare',
        acquired: '2023-10-20'
      },
      {
        id: 4,
        name: 'MCL60 MSO',
        team: 'McLaren',
        teamColor: '#ff8700',
        year: 2023,
        specs: { power: '980 HP', topSpeed: '335 km/h', weight: '815 kg' },
        image: '🍊',
        rarity: 'Rare',
        acquired: '2023-09-05'
      }
    ],
    achievements: [
      {
        id: 1,
        title: 'Podium Finisher',
        description: 'Achieved Top 3 in 10 different races',
        icon: '🏆',
        rarity: 'Legendary',
        progress: 100,
        date: '2023-12-15'
      },
      {
        id: 2,
        title: 'Qualifying Master',
        description: 'Secured Pole Position 5 times',
        icon: '🚦',
        rarity: 'Epic',
        progress: 100,
        date: '2023-11-30'
      },
      {
        id: 3,
        title: 'Overtake King',
        description: 'Completed 50+ overtakes in a season',
        icon: '💨',
        rarity: 'Rare',
        progress: 100,
        date: '2023-11-10'
      },
      {
        id: 4,
        title: 'Consistency Champion',
        description: 'Finish 20 consecutive races',
        icon: '🎯',
        rarity: 'Rare',
        progress: 65,
        date: 'In Progress'
      },
      {
        id: 5,
        title: 'Speed Demon',
        description: 'Reach 350+ km/h in 5 different circuits',
        icon: '🚀',
        rarity: 'Epic',
        progress: 80,
        date: 'In Progress'
      }
    ],
    collectibles: [
      {
        id: 1,
        name: 'Monaco GP Helmet',
        type: 'Helmet',
        rarity: 'Legendary',
        driver: 'Charles Leclerc',
        image: '🪖',
        equipped: true
      },
      {
        id: 2,
        name: 'Silverstone Trophy',
        type: 'Trophy',
        rarity: 'Epic',
        driver: 'Lewis Hamilton',
        image: '🏆',
        equipped: false
      },
      {
        id: 3,
        name: 'Suzuka Race Suit',
        type: 'Gear',
        rarity: 'Rare',
        driver: 'Max Verstappen',
        image: '👕',
        equipped: true
      }
    ]
  };

  const userStats = {
    level: 42,
    exp: 12560,
    nextLevel: 15000,
    racesCompleted: 156,
    wins: 23,
    podiums: 67,
    fastestLaps: 12,
    totalDistance: 8452
  };

  return (
    <motion.div
      className="my-garage-container"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      {/* Background Track Overlay */}
      <div className="garage-track-overlay" aria-hidden="true" />

      <div className="garage-panel">
        {/* Header */}
        <header className="garage-header">
          <div className="header-left">
            <Link to="/" className="back-button">
              ← Back to PitLane
            </Link>
            <div className="garage-title">
              <h1>My Garage</h1>
              <p>Your F1 Collection & Achievements</p>
            </div>
          </div>

          <div className="header-right">
            <div className="user-level">
              <div className="level-badge">
                <span className="level-number">Lvl {userStats.level}</span>
                <div className="exp-bar">
                  <motion.div 
                    className="exp-progress"
                    initial={{ width: 0 }}
                    animate={{ width: `${(userStats.exp / userStats.nextLevel) * 100}%` }}
                    transition={{ delay: 0.5, duration: 1 }}
                  />
                </div>
                <span className="exp-text">{userStats.exp}/{userStats.nextLevel} EXP</span>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Overview */}
        <motion.section 
          className="stats-overview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stats-grid">
            <motion.div 
              className="stat-card"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="stat-icon">🏁</div>
              <div className="stat-value">{userStats.racesCompleted}</div>
              <div className="stat-label">Races</div>
            </motion.div>

            <motion.div 
              className="stat-card"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="stat-icon">🥇</div>
              <div className="stat-value">{userStats.wins}</div>
              <div className="stat-label">Wins</div>
            </motion.div>

            <motion.div 
              className="stat-card"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="stat-icon">🏆</div>
              <div className="stat-value">{userStats.podiums}</div>
              <div className="stat-label">Podiums</div>
            </motion.div>

            <motion.div 
              className="stat-card"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="stat-icon">⚡</div>
              <div className="stat-value">{userStats.fastestLaps}</div>
              <div className="stat-label">Fastest Laps</div>
            </motion.div>
          </div>
        </motion.section>

        {/* Navigation Tabs */}
        <nav className="garage-tabs">
          <motion.button
            className={`tab-button ${activeTab === 'cars' ? 'active' : ''}`}
            onClick={() => setActiveTab('cars')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏎️ My Cars
          </motion.button>
          <motion.button
            className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🏆 Achievements
          </motion.button>
          <motion.button
            className={`tab-button ${activeTab === 'collectibles' ? 'active' : ''}`}
            onClick={() => setActiveTab('collectibles')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🎮 Collectibles
          </motion.button>
        </nav>

        {/* Content Area */}
        <main className="garage-content">
          <AnimatePresence mode="wait">
            {activeTab === 'cars' && (
              <motion.div
                key="cars"
                className="content-section"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="cars-grid">
                  {garageData.cars.map((car, index) => (
                    <motion.div
                      key={car.id}
                      className="car-card"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      custom={index}
                      onClick={() => setSelectedCar(car)}
                    >
                      <div 
                        className="car-header"
                        style={{ borderLeftColor: car.teamColor }}
                      >
                        <div className="car-image">{car.image}</div>
                        <div className="car-info">
                          <h3>{car.name}</h3>
                          <span className="car-team">{car.team}</span>
                          <span className={`rarity-badge ${car.rarity.toLowerCase()}`}>
                            {car.rarity}
                          </span>
                        </div>
                      </div>
                      <div className="car-specs">
                        <div className="spec">
                          <span>Power</span>
                          <strong>{car.specs.power}</strong>
                        </div>
                        <div className="spec">
                          <span>Top Speed</span>
                          <strong>{car.specs.topSpeed}</strong>
                        </div>
                        <div className="spec">
                          <span>Weight</span>
                          <strong>{car.specs.weight}</strong>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'achievements' && (
              <motion.div
                key="achievements"
                className="content-section"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="achievements-grid">
                  {garageData.achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.id}
                      className="achievement-card"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      custom={index}
                      onClick={() => setSelectedAchievement(achievement)}
                    >
                      <div className="achievement-icon">{achievement.icon}</div>
                      <div className="achievement-content">
                        <h4>{achievement.title}</h4>
                        <p>{achievement.description}</p>
                        <div className="achievement-meta">
                          <span className={`rarity-badge ${achievement.rarity.toLowerCase()}`}>
                            {achievement.rarity}
                          </span>
                          <span className="achievement-date">{achievement.date}</span>
                        </div>
                        {achievement.progress < 100 && (
                          <div className="progress-bar">
                            <motion.div 
                              className="progress-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${achievement.progress}%` }}
                              transition={{ delay: index * 0.1 + 0.5 }}
                            />
                            <span className="progress-text">{achievement.progress}%</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'collectibles' && (
              <motion.div
                key="collectibles"
                className="content-section"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                <div className="collectibles-grid">
                  {garageData.collectibles.map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="collectible-card"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      custom={index}
                    >
                      <div className="collectible-image">{item.image}</div>
                      <div className="collectible-info">
                        <h4>{item.name}</h4>
                        <span className="collectible-type">{item.type}</span>
                        <span className="collectible-driver">{item.driver}</span>
                        <span className={`rarity-badge ${item.rarity.toLowerCase()}`}>
                          {item.rarity}
                        </span>
                      </div>
                      <div className="collectible-actions">
                        <button className={`equip-button ${item.equipped ? 'equipped' : ''}`}>
                          {item.equipped ? 'Equipped' : 'Equip'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Car Detail Modal */}
      <AnimatePresence>
        {selectedCar && (
          <>
            <motion.div 
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCar(null)}
            />
            <motion.div
              className="car-detail-modal"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <button className="close-button" onClick={() => setSelectedCar(null)}>✕</button>
              <div className="modal-header">
                <div className="modal-car-image">{selectedCar.image}</div>
                <div className="modal-car-info">
                  <h2>{selectedCar.name}</h2>
                  <p style={{ color: selectedCar.teamColor }}>{selectedCar.team}</p>
                  <span className={`rarity-badge ${selectedCar.rarity.toLowerCase()}`}>
                    {selectedCar.rarity}
                  </span>
                </div>
              </div>
              <div className="modal-specs">
                <h3>Technical Specifications</h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span>Power Unit</span>
                    <strong>{selectedCar.specs.power}</strong>
                  </div>
                  <div className="spec-item">
                    <span>Top Speed</span>
                    <strong>{selectedCar.specs.topSpeed}</strong>
                  </div>
                  <div className="spec-item">
                    <span>Weight</span>
                    <strong>{selectedCar.specs.weight}</strong>
                  </div>
                  <div className="spec-item">
                    <span>Year</span>
                    <strong>{selectedCar.year}</strong>
                  </div>
                  <div className="spec-item">
                    <span>Acquired</span>
                    <strong>{selectedCar.acquired}</strong>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn primary">Customize</button>
                <button className="btn secondary">Race This Car</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}