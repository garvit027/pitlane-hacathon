// src/components/ProtectionDashboard.jsx
import React from 'react';

function ProtectionDashboard({ alerts, isActive, flashbotsStatus }) {
  return (
    <div className="protection-dashboard">
      <div className="dashboard-header">
        <h4>🛡️ Live Protection Dashboard</h4>
        <div className="status-indicator">
          <div className={`status-dot ${isActive ? 'active' : 'inactive'}`}></div>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </div>
      </div>
      
      <div className="protection-metrics">
        <div className="metric">
          <div className="metric-value">{alerts.length}</div>
          <div className="metric-label">Bot Alerts</div>
        </div>
        <div className="metric">
          <div className="metric-value">
            {flashbotsStatus?.ok ? '✅' : '❌'}
          </div>
          <div className="metric-label">Flashbots</div>
        </div>
        <div className="metric">
          <div className="metric-value">
            {isActive ? '✅' : '❌'}
          </div>
          <div className="metric-label">Mempool Scan</div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="recent-alerts">
          <h5>Recent Bot Activity</h5>
          <div className="alerts-list">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="alert-item">
                <div className="alert-icon">🚨</div>
                <div className="alert-details">
                  <div className="alert-message">High gas activity detected</div>
                  <div className="alert-meta">
                    {alert.gasPrice} Gwei • {alert.from.slice(0, 8)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProtectionDashboard;