import React from 'react';
import './Dashboard.css';

function Dashboard({ user }) {
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2 className="sidebar-title">SPLITR</h2>
          <span className="sidebar-subtitle">Intelligent Ledger</span>
        </div>

        <nav className="nav-menu">
          <a href="#" className="nav-item active">
            <span className="nav-icon">⊞</span>
            Dashboard
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">👥</span>
            Groups
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">🕒</span>
            Activity
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">✨</span>
            AI Insights
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">⚙️</span>
            Settings
          </a>
        </nav>

        <div className="sidebar-footer">
          <button className="btn-expense">Add Expense</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="search-bar">
            <span>🔍</span>
            <input type="text" placeholder="Search archive..." />
          </div>
          
          <div className="header-nav">
            <span>Settle Up</span>
            <span>Remind</span>
          </div>

          <div className="header-actions">
            <button className="btn-new-group">New Group</button>
            <span style={{ fontSize: '1.2rem', color: '#64748B' }}>🔔</span>
            <span style={{ fontSize: '1.2rem', color: '#64748B' }}>🗃️</span>
            <div className="user-profile">
              <img src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Profile" />
            </div>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="left-column">
            
            <div className="balance-card">
              <div className="balance-label">Net Archive Balance</div>
              <div className="balance-amount">$2,480.50</div>
              <div className="balance-details">
                <div>
                  <div className="balance-label">You Are Owed</div>
                  <div className="detail-amount">$3,120.00</div>
                </div>
                <div>
                  <div className="balance-label">You Owe</div>
                  <div className="detail-amount" style={{ color: '#94A3B8' }}>$639.50</div>
                </div>
              </div>
            </div>

            <div className="section-header">
              <h3 className="section-title">Recent Groups</h3>
              <span className="view-all">View All</span>
            </div>

            <div className="groups-grid">
              
              <div className="group-card">
                <div className="group-header">
                  <div className="group-icon">☂️</div>
                  <span className="status-badge status-active">Active</span>
                </div>
                <h4 className="group-name">Iceland Expedition</h4>
                <div className="group-meta">4 Members • Last activity 2h ago</div>
                <div className="group-footer">
                  <div className="member-avatars">
                    <div className="avatar"></div>
                    <div className="avatar"></div>
                    <div className="avatar more">+2</div>
                  </div>
                  <div className="group-balance balance-positive">+$142.00</div>
                </div>
              </div>

              <div className="group-card">
                <div className="group-header">
                  <div className="group-icon">🏠</div>
                  <span className="status-badge status-settled">Settled</span>
                </div>
                <h4 className="group-name">The Loft Collective</h4>
                <div className="group-meta">2 Members • No pending dues</div>
                <div className="group-footer">
                  <div className="member-avatars">
                    <div className="avatar"></div>
                    <div className="avatar"></div>
                  </div>
                  <div className="group-balance balance-neutral">$0.00</div>
                </div>
              </div>

              <div className="group-card">
                <div className="group-header">
                  <div className="group-icon">🍴</div>
                  <span className="status-badge status-owed">Owed</span>
                </div>
                <h4 className="group-name">Friday Dinners</h4>
                <div className="group-meta">8 Members • 12 items pending</div>
                <div className="group-footer">
                  <div className="member-avatars">
                    <div className="avatar"></div>
                    <div className="avatar more">+6</div>
                  </div>
                  <div className="group-balance balance-negative">-$84.20</div>
                </div>
              </div>

              <div className="create-group-card">
                <div className="create-icon">+</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create Archive</div>
              </div>

            </div>

          </div>

          {/* Right Column */}
          <div className="right-column">
            
            <div className="ai-insight-top">
              <div className="ai-header">
                <span>✨</span> AI Insight
              </div>
              <h3 className="ai-title">3 transactions are ready for AI optimization.</h3>
              <button className="btn-ai">View Intelligence</button>
            </div>

            <div className="feed-card">
              <h3 className="feed-title">Intelligence Feed</h3>
              
              <div className="timeline">
                
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-time">Today, 2:45 PM</div>
                  <div className="timeline-content">
                    <strong>Sarah Chen</strong> added "Grocery Run" to <strong>The Loft Collective</strong>.
                  </div>
                  <div className="timeline-amount">+$12.50</div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-dot" style={{ background: '#CBD5E1' }}></div>
                  <div className="timeline-time">Today, 11:12 AM</div>
                  <div className="timeline-content">
                    <strong>Marcus V.</strong> settled their balance in <strong>Iceland Expedition</strong>.
                  </div>
                  <div className="badge-archived">✓ Archived</div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-time">Yesterday</div>
                  <div className="timeline-content">
                    New expense "Airport Taxi" split between 4 people.
                  </div>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                    <div style={{ width:'20px',height:'20px',borderRadius:'50%',background:'#E2E8F0' }}></div>
                    <div style={{ width:'20px',height:'20px',borderRadius:'50%',background:'#E2E8F0' }}></div>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-dot" style={{ background: '#4361EE' }}></div>
                  <div className="timeline-time" style={{ color: '#4361EE' }}>Insight Engine</div>
                  <div className="ai-recommendation">
                    <p>"You usually settle Friday Dinners on Mondays. Remind the group?"</p>
                    <a href="#" className="btn-link">Execute Reminder</a>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </main>
      
      <div className="fab">
        <span style={{ fontSize: '1.2rem', fontWeight: 300 }}>+</span>
      </div>
    </div>
  );
}

export default Dashboard;
