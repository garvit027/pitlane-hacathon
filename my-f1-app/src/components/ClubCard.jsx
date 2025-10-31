// src/components/ClubCard.jsx
import React, { useState } from 'react';

function ClubCard({ club, onJoin, onSelect, isOwned = false }) {
  const [joining, setJoining] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleJoin = async () => {
    if (!onJoin) return;
    
    setJoining(true);
    try {
      await onJoin(club);
    } catch (error) {
      console.error('Failed to join club:', error);
    } finally {
      setJoining(false);
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(club);
    }
  };

  const getTeamColor = (clubId) => {
    const teamColors = {
      ferrari: '#FF2800',
      mclaren: '#FF8000', 
      mercedes: '#00D2BE',
      redbull: '#0600EF',
      alpine: '#0090FF',
      'aston-martin': '#006F62',
      williams: '#005AFF',
      alphatauri: '#2B4562',
      'alfa-romeo': '#900000',
      haas: '#FFFFFF'
    };
    return teamColors[clubId] || '#646cff';
  };

  const getTeamIcon = (clubId) => {
    const teamIcons = {
      ferrari: '🐎',
      mclaren: '🍊',
      mercedes: '⭐',
      redbull: '🐂',
      alpine: '🔵',
      'aston-martin': '💚',
      williams: '🔵',
      alphatauri: '🐮',
      'alfa-romeo': '❤️',
      haas: '⚪'
    };
    return teamIcons[clubId] || '🏎️';
  };

  const getDefaultBenefits = () => [
    'Exclusive team content',
    'Early ticket access',
    'Member-only events',
    'Voting rights'
  ];

  return (
    <div 
      className={`club-card ${isOwned ? 'owned' : ''} ${showDetails ? 'expanded' : ''}`}
      style={{ 
        borderLeft: `4px solid ${getTeamColor(club.id || club.clubId)}`,
        background: isOwned ? `rgba(${hexToRgb(getTeamColor(club.id || club.clubId))}, 0.1)` : 'rgba(255, 255, 255, 0.05)'
      }}
    >
      <div className="club-header">
        <div className="club-icon" style={{ color: getTeamColor(club.id || club.clubId) }}>
          {club.icon || getTeamIcon(club.id || club.clubId)}
        </div>
        <div className="club-info">
          <h4>{club.name}</h4>
          <p className="club-description">
            {club.description || `Official ${club.name} fan community`}
          </p>
        </div>
        <div className="club-status">
          {isOwned ? (
            <span className="member-badge">
              <span className="badge-icon">⭐</span>
              Member
            </span>
          ) : (
            <span className="non-member-badge">
              Join to Access
            </span>
          )}
        </div>
      </div>

      <div className="club-details">
        <div className="detail-item">
          <span className="label">Membership:</span>
          <span className="value">{club.nftType || 'NFT Pass'}</span>
        </div>
        <div className="detail-item">
          <span className="label">Benefits:</span>
          <span className="value">{(club.benefits || getDefaultBenefits()).length} exclusive benefits</span>
        </div>
        {(club.joinFee || club.joinFee === 0) && (
          <div className="detail-item">
            <span className="label">Fee:</span>
            <span className="value fee">{club.joinFee} ETH</span>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="club-benefits">
          <h5>Member Benefits</h5>
          {(club.benefits || getDefaultBenefits()).map((benefit, index) => (
            <div key={index} className="benefit">
              <span className="benefit-icon">✓</span>
              {benefit}
            </div>
          ))}
        </div>
      )}

      <div className="club-actions">
        {isOwned ? (
          <button onClick={handleSelect} className="enter-club-btn">
            <span className="btn-icon">🚪</span>
            Enter Club
            <span className="btn-arrow">›</span>
          </button>
        ) : (
          <button 
            onClick={handleJoin}
            disabled={joining}
            className={`join-club-btn ${joining ? 'joining' : ''}`}
          >
            {joining ? (
              <>
                <div className="spinner-small"></div>
                Joining Club...
              </>
            ) : (
              <>
                <span className="btn-icon">🎫</span>
                Join Club - {club.joinFee || '0.01'} ETH
              </>
            )}
          </button>
        )}
        
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className={`details-btn ${showDetails ? 'active' : ''}`}
        >
          {showDetails ? 'Less Info' : 'More Info'}
        </button>
      </div>

      {club.contractAddress && (
        <div className="contract-info">
          <small>
            Contract: {club.contractAddress.slice(0, 8)}...{club.contractAddress.slice(-6)}
          </small>
        </div>
      )}
    </div>
  );
}

// Helper function to convert hex to rgba
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : '100, 108, 255';
}

export default ClubCard;