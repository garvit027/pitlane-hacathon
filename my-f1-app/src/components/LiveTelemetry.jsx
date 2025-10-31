// src/components/LiveTelemetry.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socketService';

function LiveTelemetry() {
  const { user } = useAuth();
  const [telemetryData, setTelemetryData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('VER');
  const [activeTab, setActiveTab] = useState('overview');
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef();

  // Mock telemetry data structure that matches real F1 telemetry
  const mockTelemetry = {
    session: {
      name: "Monaco Grand Prix",
      circuit: "Circuit de Monaco",
      currentLap: 42,
      totalLaps: 78,
      sessionTime: "1:12:34",
      sessionType: "Race"
    },
    drivers: {
      'VER': {
        name: "Max Verstappen",
        team: "Red Bull",
        position: 1,
        telemetry: {
          speed: 312,
          rpm: 12500,
          gear: 7,
          throttle: 98,
          brake: 0,
          drs: true,
          ers: "deploying",
          fuel: 45.2,
          tire: {
            compound: "soft",
            age: 12,
            temp: 105,
            pressure: 22.4,
            wear: 15
          },
          lap: {
            current: "1:12.456",
            best: "1:11.234",
            delta: "-0.345",
            sectors: ["22.123", "25.456", "24.877"]
          },
          position: {
            x: 125.45,
            y: -87.23,
            z: 0.12
          },
          gForce: {
            lateral: 3.2,
            longitudinal: 2.1,
            vertical: 1.8
          }
        }
      },
      'LEC': {
        name: "Charles Leclerc",
        team: "Ferrari",
        position: 2,
        telemetry: {
          speed: 308,
          rpm: 12400,
          gear: 7,
          throttle: 95,
          brake: 0,
          drs: false,
          ers: "harvesting",
          fuel: 46.8,
          tire: {
            compound: "medium",
            age: 18,
            temp: 98,
            pressure: 22.1,
            wear: 22
          },
          lap: {
            current: "1:12.789",
            best: "1:11.567",
            delta: "+0.333",
            sectors: ["22.345", "25.678", "24.766"]
          },
          position: {
            x: 124.89,
            y: -86.95,
            z: 0.15
          },
          gForce: {
            lateral: 3.1,
            longitudinal: 2.0,
            vertical: 1.7
          }
        }
      },
      'HAM': {
        name: "Lewis Hamilton",
        team: "Mercedes",
        position: 3,
        telemetry: {
          speed: 305,
          rpm: 12300,
          gear: 6,
          throttle: 92,
          brake: 5,
          drs: false,
          ers: "neutral",
          fuel: 47.5,
          tire: {
            compound: "hard",
            age: 25,
            temp: 95,
            pressure: 21.8,
            wear: 18
          },
          lap: {
            current: "1:13.123",
            best: "1:12.345",
            delta: "+0.667",
            sectors: ["22.567", "26.123", "24.433"]
          },
          position: {
            x: 123.12,
            y: -85.67,
            z: 0.18
          },
          gForce: {
            lateral: 2.9,
            longitudinal: 1.9,
            vertical: 1.6
          }
        }
      }
    },
    track: {
      sectors: [
        { name: "Sector 1", distance: 1.2, time: "22.1" },
        { name: "Sector 2", distance: 1.5, time: "25.4" },
        { name: "Sector 3", distance: 1.3, time: "24.8" }
      ],
      corners: [
        { number: 1, name: "Sainte Devote", speed: 85, difficulty: "high" },
        { number: 3, name: "Mirabeau", speed: 65, difficulty: "medium" },
        { number: 6, name: "Fairmont Hairpin", speed: 45, difficulty: "high" },
        { number: 10, name: "Tunnel", speed: 285, difficulty: "low" },
        { number: 12, name: "Chicane", speed: 125, difficulty: "high" }
      ]
    }
  };

  useEffect(() => {
    // Listen for real telemetry data from backend
    socketService.on('telemetryUpdate', handleTelemetryUpdate);
    socketService.on('protectionUpdate', handleConnectionUpdate);

    // Start with mock data
    setTelemetryData(mockTelemetry);

    return () => {
      socketService.on('telemetryUpdate', () => {});
      socketService.on('protectionUpdate', () => {});
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying && telemetryData) {
      animateTelemetry();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, telemetryData]);

  const handleTelemetryUpdate = (data) => {
    setTelemetryData(data);
  };

  const handleConnectionUpdate = (data) => {
    setIsConnected(data.status === 'connected');
  };

  const animateTelemetry = () => {
    if (!telemetryData || !selectedDriver) return;

    setTelemetryData(prev => {
      if (!prev || !prev.drivers[selectedDriver]) return prev;

      const driverData = prev.drivers[selectedDriver];
      const randomChange = (base, maxChange) => 
        Math.max(0, base + (Math.random() - 0.5) * maxChange);

      return {
        ...prev,
        drivers: {
          ...prev.drivers,
          [selectedDriver]: {
            ...driverData,
            telemetry: {
              ...driverData.telemetry,
              speed: randomChange(driverData.telemetry.speed, 10),
              rpm: randomChange(driverData.telemetry.rpm, 200),
              throttle: randomChange(driverData.telemetry.throttle, 5),
              brake: randomChange(driverData.telemetry.brake, 3),
              fuel: Math.max(0, driverData.telemetry.fuel - 0.01),
              tire: {
                ...driverData.telemetry.tire,
                temp: randomChange(driverData.telemetry.tire.temp, 2),
                wear: Math.min(100, driverData.telemetry.tire.wear + 0.1)
              },
              gForce: {
                lateral: randomChange(driverData.telemetry.gForce.lateral, 0.2),
                longitudinal: randomChange(driverData.telemetry.gForce.longitudinal, 0.1),
                vertical: randomChange(driverData.telemetry.gForce.vertical, 0.1)
              }
            }
          }
        }
      };
    });

    animationRef.current = requestAnimationFrame(animateTelemetry);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const getSpeedColor = (speed) => {
    if (speed > 300) return '#ef4444';
    if (speed > 250) return '#f59e0b';
    return '#10b981';
  };

  const getRPMColor = (rpm) => {
    if (rpm > 12000) return '#ef4444';
    if (rpm > 10000) return '#f59e0b';
    return '#10b981';
  };

  const getTireColor = (compound) => {
    const colors = {
      soft: '#ef4444',
      medium: '#f59e0b',
      hard: '#64748b',
      intermediate: '#06b6d4',
      wet: '#3b82f6'
    };
    return colors[compound] || '#6b7280';
  };

  const getERSColor = (mode) => {
    const colors = {
      deploying: '#10b981',
      harvesting: '#f59e0b',
      neutral: '#6b7280'
    };
    return colors[mode] || '#6b7280';
  };

  if (!telemetryData) {
    return (
      <div className="telemetry-loading">
        <div className="loading-spinner"></div>
        <p>Loading telemetry data...</p>
      </div>
    );
  }

  const selectedDriverData = telemetryData.drivers[selectedDriver];
  if (!selectedDriverData) return null;

  const telemetry = selectedDriverData.telemetry;

  return (
    <div className="live-telemetry">
      {/* Header */}
      <div className="telemetry-header">
        <div className="header-left">
          <h2>📊 Live Telemetry</h2>
          <div className="session-info">
            <span className="session-name">{telemetryData.session.name}</span>
            <span className="lap-counter">Lap {telemetryData.session.currentLap}/{telemetryData.session.totalLaps}</span>
            <div className={`connection-status ${isConnected ? 'connected' : 'offline'}`}>
              <div className="status-dot"></div>
              {isConnected ? 'LIVE DATA' : 'SIMULATION'}
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="driver-selector">
            <label>Driver:</label>
            <select 
              value={selectedDriver} 
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="driver-select"
            >
              {Object.entries(telemetryData.drivers).map(([code, data]) => (
                <option key={code} value={code}>
                  {data.name} ({code}) - P{data.position}
                </option>
              ))}
            </select>
          </div>
          <button 
            onClick={togglePlayback}
            className={`playback-btn ${isPlaying ? 'playing' : 'paused'}`}
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="telemetry-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📈 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'tires' ? 'active' : ''}`}
          onClick={() => setActiveTab('tires')}
        >
          🛞 Tires
        </button>
        <button 
          className={`tab ${activeTab === 'engine' ? 'active' : ''}`}
          onClick={() => setActiveTab('engine')}
        >
          ⚙️ Engine
        </button>
        <button 
          className={`tab ${activeTab === 'track' ? 'active' : ''}`}
          onClick={() => setActiveTab('track')}
        >
          🏁 Track
        </button>
      </div>

      {/* Main Telemetry Display */}
      <div className="telemetry-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            {/* Speed and RPM */}
            <div className="telemetry-card large">
              <h3>Speed & RPM</h3>
              <div className="gauge-container">
                <div className="speed-gauge">
                  <div 
                    className="speed-value"
                    style={{ color: getSpeedColor(telemetry.speed) }}
                  >
                    {telemetry.speed}
                  </div>
                  <div className="speed-label">KM/H</div>
                  <div className="gauge-bar">
                    <div 
                      className="gauge-fill speed-fill"
                      style={{ 
                        width: `${(telemetry.speed / 350) * 100}%`,
                        background: getSpeedColor(telemetry.speed)
                      }}
                    ></div>
                  </div>
                </div>
                <div className="rpm-gauge">
                  <div 
                    className="rpm-value"
                    style={{ color: getRPMColor(telemetry.rpm) }}
                  >
                    {Math.round(telemetry.rpm / 100) / 10}k
                  </div>
                  <div className="rpm-label">RPM</div>
                  <div className="gauge-bar">
                    <div 
                      className="gauge-fill rpm-fill"
                      style={{ 
                        width: `${(telemetry.rpm / 15000) * 100}%`,
                        background: getRPMColor(telemetry.rpm)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Throttle and Brake */}
            <div className="telemetry-card">
              <h3>Throttle & Brake</h3>
              <div className="pedal-container">
                <div className="pedal-gauge">
                  <div className="pedal-label">Throttle</div>
                  <div className="pedal-bar">
                    <div 
                      className="pedal-fill throttle-fill"
                      style={{ height: `${telemetry.throttle}%` }}
                    ></div>
                  </div>
                  <div className="pedal-value">{telemetry.throttle}%</div>
                </div>
                <div className="pedal-gauge">
                  <div className="pedal-label">Brake</div>
                  <div className="pedal-bar">
                    <div 
                      className="pedal-fill brake-fill"
                      style={{ height: `${telemetry.brake}%` }}
                    ></div>
                  </div>
                  <div className="pedal-value">{telemetry.brake}%</div>
                </div>
              </div>
            </div>

            {/* Gear and DRS */}
            <div className="telemetry-card">
              <h3>Gear & Systems</h3>
              <div className="systems-grid">
                <div className="system-item">
                  <div className="system-label">Gear</div>
                  <div className="gear-display">{telemetry.gear}</div>
                </div>
                <div className="system-item">
                  <div className="system-label">DRS</div>
                  <div className={`drs-status ${telemetry.drs ? 'active' : 'inactive'}`}>
                    {telemetry.drs ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
                <div className="system-item">
                  <div className="system-label">ERS</div>
                  <div 
                    className="ers-status"
                    style={{ color: getERSColor(telemetry.ers) }}
                  >
                    {telemetry.ers.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* G-Forces */}
            <div className="telemetry-card">
              <h3>G-Forces</h3>
              <div className="gforce-container">
                <div className="gforce-axis">
                  <div className="axis-label">Lateral</div>
                  <div className="gforce-value">{telemetry.gForce.lateral.toFixed(1)}G</div>
                  <div className="gforce-bar">
                    <div 
                      className="gforce-fill lateral-fill"
                      style={{ 
                        width: `${Math.abs(telemetry.gForce.lateral) / 4 * 100}%`,
                        marginLeft: telemetry.gForce.lateral > 0 ? '50%' : `${50 - (Math.abs(telemetry.gForce.lateral) / 4 * 50)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="gforce-axis">
                  <div className="axis-label">Longitudinal</div>
                  <div className="gforce-value">{telemetry.gForce.longitudinal.toFixed(1)}G</div>
                  <div className="gforce-bar">
                    <div 
                      className="gforce-fill longitudinal-fill"
                      style={{ 
                        width: `${Math.abs(telemetry.gForce.longitudinal) / 3 * 100}%`,
                        marginLeft: telemetry.gForce.longitudinal > 0 ? '50%' : `${50 - (Math.abs(telemetry.gForce.longitudinal) / 3 * 50)}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tires' && (
          <div className="tires-grid">
            <div className="telemetry-card large">
              <h3>Tire Status</h3>
              <div className="tire-container">
                <div className="tire-set">
                  <div className="tire front-left">
                    <div 
                      className="tire-wear"
                      style={{ 
                        backgroundColor: getTireColor(telemetry.tire.compound),
                        opacity: 1 - (telemetry.tire.wear / 100)
                      }}
                    ></div>
                    <div className="tire-info">
                      <div>FL</div>
                      <div>{telemetry.tire.temp}°C</div>
                    </div>
                  </div>
                  <div className="tire front-right">
                    <div 
                      className="tire-wear"
                      style={{ 
                        backgroundColor: getTireColor(telemetry.tire.compound),
                        opacity: 1 - (telemetry.tire.wear / 100)
                      }}
                    ></div>
                    <div className="tire-info">
                      <div>FR</div>
                      <div>{telemetry.tire.temp}°C</div>
                    </div>
                  </div>
                </div>
                <div className="tire-set">
                  <div className="tire rear-left">
                    <div 
                      className="tire-wear"
                      style={{ 
                        backgroundColor: getTireColor(telemetry.tire.compound),
                        opacity: 1 - (telemetry.tire.wear / 100)
                      }}
                    ></div>
                    <div className="tire-info">
                      <div>RL</div>
                      <div>{telemetry.tire.temp}°C</div>
                    </div>
                  </div>
                  <div className="tire rear-right">
                    <div 
                      className="tire-wear"
                      style={{ 
                        backgroundColor: getTireColor(telemetry.tire.compound),
                        opacity: 1 - (telemetry.tire.wear / 100)
                      }}
                    ></div>
                    <div className="tire-info">
                      <div>RR</div>
                      <div>{telemetry.tire.temp}°C</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="tire-stats">
                <div className="tire-stat">
                  <span>Compound:</span>
                  <span 
                    className="compound-badge"
                    style={{ backgroundColor: getTireColor(telemetry.tire.compound) }}
                  >
                    {telemetry.tire.compound.toUpperCase()}
                  </span>
                </div>
                <div className="tire-stat">
                  <span>Age:</span>
                  <span>{telemetry.tire.age} laps</span>
                </div>
                <div className="tire-stat">
                  <span>Wear:</span>
                  <span>{telemetry.tire.wear.toFixed(1)}%</span>
                </div>
                <div className="tire-stat">
                  <span>Pressure:</span>
                  <span>{telemetry.tire.pressure} PSI</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'engine' && (
          <div className="engine-grid">
            <div className="telemetry-card">
              <h3>Fuel System</h3>
              <div className="fuel-gauge">
                <div className="fuel-value">{telemetry.fuel.toFixed(1)} kg</div>
                <div className="fuel-bar">
                  <div 
                    className="fuel-fill"
                    style={{ width: `${(telemetry.fuel / 110) * 100}%` }}
                  ></div>
                </div>
                <div className="fuel-labels">
                  <span>0</span>
                  <span>55</span>
                  <span>110</span>
                </div>
              </div>
            </div>

            <div className="telemetry-card">
              <h3>Engine Status</h3>
              <div className="engine-stats">
                <div className="engine-stat">
                  <span>Oil Temp:</span>
                  <span>112°C</span>
                </div>
                <div className="engine-stat">
                  <span>Water Temp:</span>
                  <span>87°C</span>
                </div>
                <div className="engine-stat">
                  <span>Oil Pressure:</span>
                  <span>4.2 bar</span>
                </div>
                <div className="engine-stat">
                  <span>Fuel Flow:</span>
                  <span>98 kg/h</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'track' && (
          <div className="track-grid">
            <div className="telemetry-card large">
              <h3>Lap Analysis</h3>
              <div className="sector-times">
                {telemetry.lap.sectors.map((sector, index) => (
                  <div key={index} className="sector">
                    <div className="sector-header">
                      <span>Sector {index + 1}</span>
                      <span>{sector}</span>
                    </div>
                    <div className="sector-bar">
                      <div 
                        className="sector-fill"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                ))}
                <div className="lap-total">
                  <span>Total Lap</span>
                  <span>{telemetry.lap.current}</span>
                </div>
                <div className="lap-delta">
                  <span>Delta</span>
                  <span className={telemetry.lap.delta.startsWith('+') ? 'positive' : 'negative'}>
                    {telemetry.lap.delta}
                  </span>
                </div>
              </div>
            </div>

            <div className="telemetry-card">
              <h3>Track Position</h3>
              <div className="position-data">
                <div className="coord">
                  <span>X:</span>
                  <span>{telemetry.position.x.toFixed(2)}</span>
                </div>
                <div className="coord">
                  <span>Y:</span>
                  <span>{telemetry.position.y.toFixed(2)}</span>
                </div>
                <div className="coord">
                  <span>Z:</span>
                  <span>{telemetry.position.z.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with connection status */}
      <div className="telemetry-footer">
        <div className="data-source">
          {isConnected ? (
            <>
              <span className="live-indicator"></span>
              LIVE DATA STREAM
            </>
          ) : (
            <>
              <span className="sim-indicator"></span>
              SIMULATION MODE
            </>
          )}
        </div>
        <div className="refresh-rate">
          Update: {isPlaying ? 'Real-time' : 'Paused'}
        </div>
      </div>
    </div>
  );
}

export default LiveTelemetry;