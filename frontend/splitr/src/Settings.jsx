import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Settings.css';
import Sidebar from './components/Sidebar';

function Settings({ user, onLogout }) {
  const navigate = useNavigate();

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

            {/* Security & Privacy */}
            <div className="settings-section">
              <div className="section-header">
                <div>
                  <h3>Security & Privacy</h3>
                  <p>Enhanced protection for your financial data.</p>
                </div>
              </div>
              <div className="sp-list">
                <div className="sp-list-item">
                  <div className="sp-icon-wrapper">
                    <span className="sp-icon">🔒</span>
                  </div>
                  <div className="sp-item-info">
                    <h4>Security Cipher</h4>
                    <p>Military-grade end-to-end encryption</p>
                  </div>
                  <div className="sp-item-action">
                    <span className="status-badge encrypted">● ENCRYPTED</span>
                  </div>
                </div>
                <div className="sp-list-item">
                  <div className="sp-icon-wrapper">
                    <span className="sp-icon">🛡️</span>
                  </div>
                  <div className="sp-item-info">
                    <h4>Biometric Access</h4>
                    <p>FaceID or Touch ID for sensitive transactions</p>
                  </div>
                  <div className="sp-item-action">
                    <div className="toggle-switch active">
                      <div className="toggle-circle"></div>
                    </div>
                  </div>
                </div>
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
