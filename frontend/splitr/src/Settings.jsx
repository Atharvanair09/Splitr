import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Settings.css';
import Sidebar from './components/Sidebar';

function Settings({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [friends, setFriends] = React.useState([]);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Fetch friends on mount
  React.useEffect(() => {
    if (user?._id) {
      fetch(`http://localhost:5000/api/users/friends/${user._id}`)
        .then(res => res.json())
        .then(data => setFriends(data))
        .catch(err => console.error("Error fetching friends:", err));
    }
  }, [user?._id]);

  // Search users whenever searchQuery changes
  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 1) {
        setSearching(true);
        fetch(`http://localhost:5000/api/users/search?query=${searchQuery}&currentUserId=${user?._id}`)
          .then(async (res) => {
            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || "Search failed");
            }
            return res.json();
          })
          .then(data => {
            setSearchResults(data);
            setSearching(false);
            setError(null);
          })
          .catch(err => {
            console.error("Search error:", err);
            setError(`Error: ${err.message}`);
            setSearching(false);
          });
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user?._id]);

  const handleFollow = async (targetId) => {
    try {
      const res = await fetch("http://localhost:5000/api/users/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, targetId })
      });
      if (res.ok) {
        // Refresh friends list
        const friendsRes = await fetch(`http://localhost:5000/api/users/friends/${user._id}`);
        const friendsData = await friendsRes.json();
        setFriends(friendsData);
        setSearchQuery(""); // Clear search after follow
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const handleUnfollow = async (targetId) => {
    try {
      const res = await fetch("http://localhost:5000/api/users/unfollow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, targetId })
      });
      if (res.ok) {
        setFriends(friends.filter(f => f._id !== targetId));
      }
    } catch (err) {
      console.error("Unfollow error:", err);
    }
  };

  return (
    <div className="settings-dashboard-container">
      {/* Sidebar Component */}
      <Sidebar activePage="settings">
        <button className="sidebar-btn-expense">GENERATE REPORT</button>
        <button className="sidebar-btn-signout" onClick={onLogout}>
          <span className="nav-icon" style={{marginRight: '5px'}}>▷</span> SIGN OUT
        </button>
      </Sidebar>

      {/* Main Content */}
      <main className="settings-main-content">
        <header className="settings-top-header">
          <div className="settings-search-bar">
            <span>🔍</span>
            <input type="text" placeholder="Search archive..." />
          </div>
          
          <div className="settings-header-actions">
            <span className="header-icon">🔔</span>
            <span className="header-icon">✂️</span>
            
            <div className="settings-user-profile" onClick={() => navigate('/account')}>
              <span className="settings-user-name">{user?.name || "Alexander Vance"}</span>
              <img 
                src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander"} 
                alt="Profile" 
              />
            </div>
          </div>
        </header>

        {/* Scrollable Settings Content */}
        <div className="settings-scrollable-area">
          <div className="settings-container">
            {/* Header Profile Card */}
            <div className="settings-header-card">
              <div className="shc-left">
                <div className="shc-avatar-wrapper">
                  <img 
                    src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander"} 
                    alt="Profile" 
                    className="shc-avatar"
                  />
                  <span className="shc-badge">ELITE MEMBER</span>
                </div>
                <div className="shc-user-info">
                  <h2>{user?.name || "Alexander Vance"}</h2>
                  <p>Head of Strategic Operations • Member since 2021</p>
                </div>
              </div>
              <div className="shc-right">
                <div className="shc-stat">
                  <span className="stat-label">TOTAL MANAGED</span>
                  <span className="stat-value">$128,490</span>
                </div>
                <div className="shc-divider"></div>
                <div className="shc-stat">
                  <span className="stat-label">TRUST SCORE</span>
                  <span className="stat-value text-cyan">98%</span>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="settings-section">
              <div className="section-header">
                <div>
                  <h3>Personal Information</h3>
                  <p>Manage your verified identity details.</p>
                </div>
                <button className="edit-all-btn">EDIT ALL</button>
              </div>
              <div className="pi-grid">
                <div className="pi-card">
                  <div className="pi-card-icon">👤</div>
                  <div className="pi-card-content">
                    <label>LEGAL NAME</label>
                    <p>{user?.name || "Alexander J. Vance"}</p>
                  </div>
                  <div className="pi-card-edit">✎</div>
                </div>
                <div className="pi-card">
                  <div className="pi-card-icon">✉️</div>
                  <div className="pi-card-content">
                    <label>EMAIL ADDRESS</label>
                    <p>{user?.email || "a.vance@ledgerpro.ai"}</p>
                  </div>
                  <div className="pi-card-edit">✎</div>
                </div>
                <div className="pi-card pi-card-full">
                  <div className="pi-card-icon">📞</div>
                  <div className="pi-card-content">
                    <label>PHONE NUMBER</label>
                    <p>+1 (555) 012-8849</p>
                  </div>
                  <div className="pi-card-edit">✎</div>
                </div>
              </div>
            </div>

            {/* Find Friends & Connections */}
            <div className="settings-section">
              <div className="section-header">
                <div>
                  <h3>Community & Connections</h3>
                  <p>Search for other Ledger Pro users to build your network.</p>
                </div>
              </div>
              
              <div className="user-search-container">
                {/* Search Bar */}
                <div className="search-input-wrapper">
                  <span className="search-icon-inside">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search by name or email (e.g. Atharva)..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="search-results-list">
                    {searchResults.map(resUser => {
                      const isFriend = friends.some(f => f._id === resUser._id);
                      return (
                        <div key={resUser._id} className="user-result-item">
                          <div className="user-info-basic">
                            <img 
                              src={resUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${resUser.name}`} 
                              alt={resUser.name} 
                              className="user-avatar-small"
                            />
                            <div className="user-text-info">
                              <span className="user-res-name">{resUser.name}</span>
                              <span className="user-res-email">{resUser.email}</span>
                            </div>
                          </div>
                          {!isFriend ? (
                            <button className="btn-follow" onClick={() => handleFollow(resUser._id)}>Follow</button>
                          ) : (
                            <button className="btn-unfollow" onClick={() => handleUnfollow(resUser._id)}>Following</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {searching && <div style={{fontSize: '0.8rem', color: '#64748b', paddingLeft: '10px'}}>Searching database...</div>}
                {error && <div style={{fontSize: '0.8rem', color: '#ef4444', paddingLeft: '10px'}}>{error}</div>}
                {!searching && !error && searchQuery.length > 1 && searchResults.length === 0 && (
                   <div style={{fontSize: '0.8rem', color: '#64748b', paddingLeft: '10px'}}>No users found matching "{searchQuery}".</div>
                )}

                {/* Following List */}
                {friends.length > 0 && (
                  <div className="friends-list-section" style={{marginTop: '10px'}}>
                    <h4 style={{fontSize: '0.85rem', marginBottom: '15px', color: '#1e293b'}}>Your Connections ({friends.length})</h4>
                    <div className="friends-list-horizontal">
                      {friends.map(friend => (
                        <div key={friend._id} className="friend-chip">
                          <img 
                            src={friend.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} 
                            alt={friend.name} 
                          />
                          <span>{friend.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment & Ledger */}
            <div className="settings-section">
              <div className="section-header">
                <div>
                  <h3>Payment & Ledger</h3>
                  <p>Connected institutions and funding sources.</p>
                </div>
                <button className="add-btn">+</button>
              </div>
              <div className="pl-list">
                <div className="pl-list-item">
                  <div className="pl-icon-wrapper">🏛️</div>
                  <div className="pl-item-info">
                    <h4>Chase Premier Savings</h4>
                    <p>Primary Account • Ending in 4209</p>
                  </div>
                  <div className="pl-item-action">
                    <span className="status-text active">ACTIVE</span>
                    <span className="chevron">›</span>
                  </div>
                </div>
                <div className="pl-list-item">
                  <div className="pl-icon-wrapper">💳</div>
                  <div className="pl-item-info">
                    <h4>Indigo Business Credit</h4>
                    <p>Reserve Card • Ending in 8812</p>
                  </div>
                  <div className="pl-item-action">
                    <span className="status-text active">ACTIVE</span>
                    <span className="chevron">›</span>
                  </div>
                </div>
              </div>
              <div className="pl-footer">
                02 ACTIVE ACCOUNTS LINKED
              </div>
            </div>

            {/* Bottom Footer Options */}
            <div className="settings-footer">
              <div className="sf-left">
                Indigo Archive v4.2.0 • Data processed by Ledger Pro Intelligence<br/>
                Last login: Today at 08:42 AM from New York, US
              </div>
              <div className="sf-right">
                <button className="btn-deactivate">DEACTIVATE ACCOUNT</button>
                <button className="btn-delete">DELETE DATA</button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;
