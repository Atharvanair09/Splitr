import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Settings.css';
import Sidebar from './components/Sidebar';

function Settings({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [friends, setFriends] = React.useState([]);
  const [incomingRequests, setIncomingRequests] = React.useState([]);
  const [searching, setSearching] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [totalSpent, setTotalSpent] = React.useState(0);

  // Fetch friends and requests on mount
  React.useEffect(() => {
    if (user?._id) {
      // 1. Fetch friends
      fetch(`http://localhost:5000/api/users/friends/${user._id}`)
        .then(res => res.json())
        .then(data => setFriends(data))
        .catch(err => console.error("Error fetching friends:", err));

      // 2. Fetch incoming requests
      fetch(`http://localhost:5000/api/users/requests/${user._id}`)
        .then(res => res.json())
        .then(data => setIncomingRequests(data))
        .catch(err => console.error("Error fetching requests:", err));

      // 3. Fetch total spent (for profile header)
      fetch(`http://localhost:5000/expense/user/${user.name}`)
        .then(res => res.json())
        .then(data => {
          const total = data.reduce((sum, e) => sum + (e.amount || 0), 0);
          setTotalSpent(total);
        })
        .catch(err => console.error("Error fetching total spending:", err));
    }
  }, [user?._id, user?.name]);

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
        // Just clear search, we don't add to friends yet!
        setSearchQuery("");
        alert("Follow request sent!");
      }
    } catch (err) {
      console.error("Follow error:", err);
    }
  };

  const handleAccept = async (targetId) => {
    try {
      const res = await fetch("http://localhost:5000/api/users/accept-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, targetId })
      });
      if (res.ok) {
        // Refresh everything
        const [fRes, rRes] = await Promise.all([
          fetch(`http://localhost:5000/api/users/friends/${user._id}`),
          fetch(`http://localhost:5000/api/users/requests/${user._id}`)
        ]);
        setFriends(await fRes.json());
        setIncomingRequests(await rRes.json());
      }
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  const handleDecline = async (targetId) => {
    try {
      const res = await fetch("http://localhost:5000/api/users/decline-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, targetId })
      });
      if (res.ok) {
        setIncomingRequests(incomingRequests.filter(r => r._id !== targetId));
      }
    } catch (err) {
      console.error("Decline error:", err);
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

  const handleDeactivate = async () => {
    if (window.confirm("WARNING: This will permanently delete your Splitr account and all association records. This action cannot be undone. Are you sure you want to proceed?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${user._id}`, {
          method: "DELETE"
        });
        const data = await res.json();
        if (res.ok) {
          alert("Account successfully deactivated.");
          onLogout();
        } else {
          alert(data.error || "Failed to deactivate account.");
        }
      } catch (err) {
        console.error("Deactivate error:", err);
        alert("An error occurred during account deactivation.");
      }
    }
  };

  return (
    <div className="settings-dashboard-container">
      <Sidebar activePage="settings">
        {/* <button className="sidebar-btn-expense">GENERATE REPORT</button> */}
        <button className="sidebar-btn-signout" onClick={onLogout}>
          <span className="nav-icon" style={{marginRight: '5px'}}>▷</span> SIGN OUT
        </button>
      </Sidebar>

      <main className="settings-main-content">
        <header className="settings-top-header">
          <div className="settings-search-bar">
            <span>🔍</span>
            <input type="text" placeholder="Search archive..." />
          </div>
          
          <div className="settings-header-actions">            
            <div className="settings-user-profile" onClick={() => navigate('/account')}>
              <span className="settings-user-name">{user?.name || "User"}</span>
              <img 
                src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander"} 
                alt="Profile" 
              />
            </div>
          </div>
        </header>

        <div className="settings-scrollable-area">
          <div className="settings-container">
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
                  <h2>{user?.name || "Indigo User"}</h2>
                  <p>Verified Indigo Member • Member since 2024</p>
                </div>
              </div>
              <div className="shc-right">
                <div className="shc-stat">
                  <span className="stat-label">TOTAL SPENT</span>
                  <span className="stat-value">₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
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
                    <p>{user?.email || "Connect email in settings"}</p>
                  </div>
                  <div className="pi-card-edit">✎</div>
                </div>
                <div className="pi-card pi-card-full">
                  <div className="pi-card-icon">📞</div>
                  <div className="pi-card-content">
                    <label>PHONE NUMBER</label>
                    <p>+91 91234 56789</p>
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
                            <button className="btn-follow" onClick={() => handleFollow(resUser._id)}>Follow Request</button>
                          ) : (
                            <button className="btn-unfollow" disabled>Friend</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Incoming Follow Requests */}
                {incomingRequests.length > 0 && (
                  <div className="requests-section" style={{marginTop: '20px', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                    <h4 style={{fontSize: '0.85rem', marginBottom: '15px', color: '#1e293b', fontWeight: '800'}}>Incoming Requests</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      {incomingRequests.map(req => (
                        <div key={req._id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <img src={req.picture} alt={req.name} style={{width: '30px', height: '30px', borderRadius: '50%'}} />
                            <span style={{fontSize: '0.85rem', fontWeight: '600'}}>{req.name}</span>
                          </div>
                          <div style={{display: 'flex', gap: '8px'}}>
                            <button 
                              onClick={() => handleAccept(req._id)}
                              style={{padding: '5px 12px', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', fontSize: '0.75rem', cursor: 'pointer'}}
                            >Accept</button>
                            <button 
                              onClick={() => handleDecline(req._id)}
                              style={{padding: '5px 12px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', fontSize: '0.75rem', cursor: 'pointer'}}
                            >Ignore</button>
                          </div>
                        </div>
                      ))}
                    </div>
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
            
            <div className="settings-footer">
              <div className="sf-left">
                Indigo Archive v4.2.0 • Data processed by Ledger Pro Intelligence<br/>
                Last login: Today at 08:42 AM from New York, US
              </div>
              <div className="sf-right">
                <button className="btn-deactivate" onClick={handleDeactivate}>DEACTIVATE ACCOUNT</button>
                <button className="btn-signout-mobile" onClick={onLogout}>SIGN OUT</button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link to="/dashboard" className="mobile-nav-item">
          <span className="mobile-nav-icon">⊞</span>
          <span>Home</span>
        </Link>
        <Link to="/groups" className="mobile-nav-item">
          <span className="mobile-nav-icon">👥</span>
          <span>Groups</span>
        </Link>
        <Link to="/activity" className="mobile-nav-item">
          <span className="mobile-nav-icon">🕒</span>
          <span>Activity</span>
        </Link>
        <Link to="/inbox" className="mobile-nav-item">
          <span className="mobile-nav-icon">📥</span>
          <span>Inbox</span>
        </Link>
        <Link to="/settings" className="mobile-nav-item active">
          <span className="mobile-nav-icon">⚙️</span>
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default Settings;
