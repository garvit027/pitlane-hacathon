// src/components/ClubDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import fanClubService from '../services/fanClubService';
import socketService from '../services/socketService';

function ClubDashboard({ club, onBack, onUpdate }) {
  const { user } = useAuth();
  const [clubData, setClubData] = useState(null);
  const [perks, setPerks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('feed');
  const [loadingPerks, setLoadingPerks] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState('checking');

  useEffect(() => {
    loadClubData();
  }, [club]);

  const loadClubData = async () => {
    if (!user) return;
    
    setLoading(true);
    setMembershipStatus('checking');
    
    try {
      // Verify membership
      const membership = await fanClubService.checkClubMembership(club.id);
      
      if (!membership.isMember) {
        setMembershipStatus('not-member');
        return;
      }

      setMembershipStatus('member');
      setClubData({ ...club, isMember: true });
      
      // Load perks
      await loadClubPerks();
      
    } catch (error) {
      console.error('Error loading club data:', error);
      setMembershipStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const loadClubPerks = async () => {
    setLoadingPerks(true);
    try {
      const perksData = await fanClubService.getClubPerks(club.id);
      setPerks(perksData);
    } catch (error) {
      console.error('Error loading perks:', error);
      setPerks(null);
    } finally {
      setLoadingPerks(false);
    }
  };

  const refreshPerks = async () => {
    await loadClubPerks();
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

  if (loading) {
    return (
      <div className="club-dashboard-loading">
        <div className="loading-spinner"></div>
        <h3>Loading {club.name}...</h3>
        <p>Verifying your membership access</p>
      </div>
    );
  }

  if (membershipStatus === 'not-member') {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <div className="denied-icon">🚫</div>
          <h3>Access Denied</h3>
          <p>You need to be a member of {club.name} to access this exclusive content.</p>
          <div className="access-actions">
            <button onClick={onBack} className="back-btn">
              ← Back to Clubs
            </button>
            <button onClick={loadClubData} className="retry-btn">
              🔄 Check Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (membershipStatus === 'error') {
    return (
      <div className="access-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h3>Verification Failed</h3>
          <p>Unable to verify your membership status. Please try again.</p>
          <div className="error-actions">
            <button onClick={loadClubData} className="retry-btn">
              🔄 Try Again
            </button>
            <button onClick={onBack} className="back-btn">
              Back to Clubs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="club-dashboard">
      <div className="dashboard-header">
        <button onClick={onBack} className="back-button">
          ← Back to Clubs
        </button>
        <div className="club-title" style={{ borderLeftColor: getTeamColor(club.id) }}>
          <span className="club-icon" style={{ color: getTeamColor(club.id) }}>
            {club.icon || '🏎️'}
          </span>
          <div>
            <h2>{club.name}</h2>
            <p className="club-subtitle">Official Fan Club Dashboard</p>
          </div>
        </div>
        <div className="member-badge-large">
          ⭐ Verified Member
          <button onClick={refreshPerks} className="refresh-btn" title="Refresh perks">
            🔄
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeSection === 'feed' ? 'active' : ''}`}
          onClick={() => setActiveSection('feed')}
        >
          🏠 Club Feed
        </button>
        <button 
          className={`tab ${activeSection === 'perks' ? 'active' : ''}`}
          onClick={() => setActiveSection('perks')}
        >
          🎁 Exclusive Perks
        </button>
        <button 
          className={`tab ${activeSection === 'content' ? 'active' : ''}`}
          onClick={() => setActiveSection('content')}
        >
          🎬 Member Content
        </button>
        <button 
          className={`tab ${activeSection === 'voting' ? 'active' : ''}`}
          onClick={() => setActiveSection('voting')}
        >
          🗳️ Team Voting
        </button>
        <button 
          className={`tab ${activeSection === 'community' ? 'active' : ''}`}
          onClick={() => setActiveSection('community')}
        >
          👥 Community
        </button>
      </div>

      <div className="dashboard-content">
        {activeSection === 'feed' && <ClubFeed club={club} />}
        {activeSection === 'perks' && (
          <ClubPerks 
            perks={perks} 
            loading={loadingPerks}
            club={club}
            onRefresh={refreshPerks}
          />
        )}
        {activeSection === 'content' && <ExclusiveContent club={club} />}
        {activeSection === 'voting' && <TeamVoting club={club} />}
        {activeSection === 'community' && <CommunitySection club={club} />}
      </div>
    </div>
  );
}

// Sub-components for each dashboard section
function ClubFeed({ club }) {
  const [feedItems, setFeedItems] = useState([
    {
      id: 1,
      type: 'exclusive',
      title: 'Behind the Scenes: Monaco GP Preparations',
      content: 'Exclusive look at our team\'s preparation for the Monaco Grand Prix. See how our engineers are optimizing the car for the street circuit.',
      media: 'video',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      author: 'Team Insider'
    },
    {
      id: 2,
      type: 'announcement',
      title: 'New Livery Reveal Coming Soon',
      content: 'Get ready for our special Monaco livery reveal! Members will get early access and voting rights on design elements.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      author: 'Marketing Team'
    },
    {
      id: 3,
      type: 'technical',
      title: 'Aerodynamics Update Analysis',
      content: 'Detailed breakdown of our latest aerodynamic upgrades and their impact on performance in high-speed corners.',
      media: 'data',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      author: 'Technical Director'
    }
  ]);

  const formatTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const getTypeIcon = (type) => {
    const icons = {
      exclusive: '🔒',
      announcement: '📢',
      technical: '📊',
      event: '🎪'
    };
    return icons[type] || '📝';
  };

  return (
    <div className="club-feed">
      <div className="feed-header">
        <h3>Latest from {club.name}</h3>
        <p>Exclusive updates and behind-the-scenes content</p>
      </div>
      
      <div className="feed-items">
        {feedItems.map(item => (
          <div key={item.id} className="feed-item">
            <div className="feed-header-meta">
              <span className={`feed-type ${item.type}`}>
                <span className="type-icon">{getTypeIcon(item.type)}</span>
                {item.type.toUpperCase()}
              </span>
              <span className="feed-time">{formatTime(item.timestamp)}</span>
            </div>
            
            <h4>{item.title}</h4>
            <p>{item.content}</p>
            
            <div className="feed-meta">
              <span className="feed-author">By {item.author}</span>
              {item.media && (
                <span className="feed-media">
                  {item.media === 'video' ? '🎬 Video Content' : '📈 Data Analysis'}
                </span>
              )}
            </div>
            
            <div className="feed-actions">
              <button className="feed-action-btn">💬 Discuss</button>
              <button className="feed-action-btn">⭐ Save</button>
              <button className="feed-action-btn">🔄 Share</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClubPerks({ perks, loading, club, onRefresh }) {
  if (loading) {
    return (
      <div className="perks-loading">
        <div className="loading-spinner"></div>
        <p>Loading exclusive perks...</p>
      </div>
    );
  }

  if (!perks) {
    return (
      <div className="perks-error">
        <div className="error-icon">⚠️</div>
        <h3>Unable to Load Perks</h3>
        <p>There was an error loading your exclusive benefits.</p>
        <button onClick={onRefresh} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="club-perks">
      <div className="perks-header">
        <h3>🎁 Your Exclusive {club.name} Perks</h3>
        <p className="welcome-message">{perks.message || `Welcome to ${club.name}! Enjoy these exclusive benefits.`}</p>
      </div>

      <div className="perks-grid">
        {(perks.perks || [
          "24-hour early access to ticket sales",
          "Exclusive 10% merchandise discount",
          "Private member-only chat channels",
          "Behind-the-scenes content access",
          "Meet & greet opportunities",
          "Team factory tour invitations"
        ]).map((perk, index) => (
          <div key={index} className="perk-card">
            <div className="perk-icon">⭐</div>
            <div className="perk-content">
              <h4>Member Benefit #{index + 1}</h4>
              <p>{perk}</p>
            </div>
            <div className="perk-actions">
              {perk.toLowerCase().includes('discount') && (
                <button className="copy-code-btn" onClick={() => {
                  const code = perk.match(/code:?\s*(\S+)/i)?.[1] || 'F1CLUB10';
                  navigator.clipboard.writeText(code);
                  alert(`Discount code ${code} copied to clipboard!`);
                }}>
                  Copy Code
                </button>
              )}
              {perk.toLowerCase().includes('discord') && (
                <button className="join-discord-btn" onClick={() => {
                  window.open('https://discord.gg/f1community', '_blank');
                }}>
                  Join Discord
                </button>
              )}
              {perk.toLowerCase().includes('access') && (
                <button className="access-now-btn">
                  Access Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="additional-benefits">
        <h4>Additional Member Benefits</h4>
        <div className="benefits-list">
          <div className="benefit-item">
            <span className="benefit-icon">🛡️</span>
            <span>NFT-gated exclusive access</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🔐</span>
            <span>Secure blockchain verification</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🎫</span>
            <span>Priority ticket purchasing</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🤝</span>
            <span>Direct influence on team decisions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExclusiveContent({ club }) {
  const [contentItems] = useState([
    {
      id: 1,
      type: 'video',
      title: 'Team Radio Archives',
      description: 'Access to uncensored team radio communications from recent races.',
      icon: '🎬',
      duration: '45min',
      locked: false
    },
    {
      id: 2,
      type: 'data',
      title: 'Technical Data Pack',
      description: 'Detailed telemetry and performance data from qualifying sessions.',
      icon: '📊',
      size: '2.3GB',
      locked: false
    },
    {
      id: 3,
      type: 'training',
      title: 'Pit Crew Training',
      description: 'Behind-the-scenes footage of pit crew training and drills.',
      icon: '👨‍🔧',
      duration: '28min',
      locked: false
    },
    {
      id: 4,
      type: 'documentary',
      title: 'Season Documentary',
      description: 'Exclusive behind-the-scenes documentary of the current season.',
      icon: '🎥',
      duration: '1h 15min',
      locked: true
    }
  ]);

  return (
    <div className="exclusive-content">
      <div className="content-header">
        <h3>🎬 Exclusive {club.name} Content</h3>
        <p>As a verified member, you have access to exclusive team content and media.</p>
      </div>
      
      <div className="content-grid">
        {contentItems.map(item => (
          <div key={item.id} className={`content-item ${item.locked ? 'locked' : ''}`}>
            <div className="content-icon">{item.icon}</div>
            <div className="content-info">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              <div className="content-meta">
                {item.duration && <span>⏱️ {item.duration}</span>}
                {item.size && <span>💾 {item.size}</span>}
              </div>
            </div>
            <button className={`access-btn ${item.locked ? 'locked' : ''}`}>
              {item.locked ? '🔒 Coming Soon' : 'Access Now'}
            </button>
            {item.locked && (
              <div className="locked-overlay">
                <span>Available Next Race</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamVoting({ club }) {
  const [activePolls, setActivePolls] = useState([
    {
      id: 1,
      question: "Monaco Special Livery - Accent Color",
      description: "Help choose the accent color for our Monaco special livery",
      options: [
        { id: 1, text: "Championship Gold", votes: 45, color: "#fbbf24" },
        { id: 2, text: "Monaco Neon Blue", votes: 32, color: "#00ffff" },
        { id: 3, text: "Carbon Fiber", votes: 23, color: "#1f2937" }
      ],
      userVote: null,
      totalVotes: 100,
      endsIn: "3 days"
    }
  ]);

  const handleVote = (pollId, optionId) => {
    setActivePolls(prev => prev.map(poll => 
      poll.id === pollId 
        ? { 
            ...poll, 
            userVote: optionId,
            options: poll.options.map(opt => 
              opt.id === optionId 
                ? { ...opt, votes: opt.votes + 1 }
                : opt
            ),
            totalVotes: poll.totalVotes + 1
          }
        : poll
    ));
  };

  return (
    <div className="team-voting">
      <div className="voting-header">
        <h3>🗳️ Team Decisions & Voting</h3>
        <p>As a {club.name} member, you have voting rights on key team decisions.</p>
      </div>
      
      <div className="polls">
        {activePolls.map(poll => (
          <div key={poll.id} className="poll">
            <div className="poll-header">
              <h4>{poll.question}</h4>
              <p>{poll.description}</p>
              <div className="poll-meta">
                <span className="total-votes">{poll.totalVotes} votes</span>
                <span className="poll-ends">Ends in {poll.endsIn}</span>
              </div>
            </div>
            
            <div className="poll-options">
              {poll.options.map(option => {
                const percentage = (option.votes / poll.totalVotes) * 100;
                
                return (
                  <div 
                    key={option.id}
                    className={`poll-option ${poll.userVote === option.id ? 'selected' : ''}`}
                    onClick={() => handleVote(poll.id, option.id)}
                  >
                    <div className="option-color" style={{ backgroundColor: option.color }}></div>
                    <div className="option-content">
                      <div className="option-text">{option.text}</div>
                      <div className="option-stats">
                        <div className="vote-bar">
                          <div 
                            className="vote-fill" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="vote-count">
                          {option.votes} votes ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                    {poll.userVote === option.id && (
                      <div className="vote-check">✓</div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button 
              className={`vote-btn ${poll.userVote ? 'voted' : ''}`} 
              disabled={!poll.userVote}
            >
              {poll.userVote ? '✓ Vote Submitted' : 'Submit Vote'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunitySection({ club }) {
  const [members] = useState([
    { id: 1, name: 'VIP Member', joinDate: '2024', avatar: '👤', active: true },
    { id: 2, name: 'Team Insider', joinDate: '2023', avatar: '👤', active: true },
    { id: 3, name: 'Racing Expert', joinDate: '2024', avatar: '👤', active: false },
    { id: 4, name: 'F1 Fanatic', joinDate: '2023', avatar: '👤', active: true }
  ]);

  return (
    <div className="community-section">
      <div className="community-header">
        <h3>👥 {club.name} Community</h3>
        <p>Connect with fellow {club.name} fans and members.</p>
      </div>
      
      <div className="community-stats">
        <div className="stat">
          <div className="stat-number">1,247</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="stat">
          <div className="stat-number">89</div>
          <div className="stat-label">Online Now</div>
        </div>
        <div className="stat">
          <div className="stat-number">24</div>
          <div className="stat-label">Active Discussions</div>
        </div>
      </div>
      
      <div className="community-actions">
        <button className="community-btn discord-btn">
          💬 Join Discord Community
        </button>
        <button className="community-btn forum-btn">
          📝 Access Member Forum
        </button>
        <button className="community-btn events-btn">
          🎪 View Upcoming Events
        </button>
      </div>
      
      <div className="recent-activity">
        <h4>Recent Community Activity</h4>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-avatar">👤</div>
            <div className="activity-content">
              <strong>VIP Member</strong> shared technical insights about the new front wing
              <div className="activity-time">2 hours ago</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-avatar">👤</div>
            <div className="activity-content">
              <strong>Team Insider</strong> posted Monaco GP preparation updates
              <div className="activity-time">5 hours ago</div>
            </div>
          </div>
        </div>
      </div>

      <div className="members-preview">
        <h4>Club Members</h4>
        <div className="members-grid">
          {members.map(member => (
            <div key={member.id} className="member-card">
              <div className="member-avatar">{member.avatar}</div>
              <div className="member-info">
                <div className="member-name">{member.name}</div>
                <div className="member-since">Since {member.joinDate}</div>
                <div className={`member-status ${member.active ? 'online' : 'offline'}`}>
                  {member.active ? '🟢 Online' : '⚫ Offline'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClubDashboard;