import React, { useState } from 'react';
import './index.css';
import Signup from './Signup';
import Login from './Login';
import Dashboard from './Dashboard';

function App() {
  const [view, setView] = useState('signup');
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setView('dashboard');
  };

  if (view === 'dashboard') {
    return <Dashboard user={user} />;
  }

  return (
    <>
      <div className="page-border" style={{ borderColor: '#6C48F5' }}></div>
      <div className="page-border" style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: '#4361EE' }}></div>
      
      <div className="app-header">
        <h1 className="brand-title">SPLITR</h1>
        <p className="brand-subtitle">Split Expenses with Friends</p>
      </div>

      {view === 'signup' ? (
        <Signup onNavigate={setView} onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Login onNavigate={setView} onLoginSuccess={handleLoginSuccess} />
      )}

      <div className="sub-footer">
        <div className="node-status">
          <div className="status-dot"></div>
          Node Status: Active
        </div>
        <div className="footer-links">
          <span>Support</span>
          <span>Legal</span>
        </div>
      </div>

      <footer className="main-footer">
        <div className="copyright">
          © 2024 SPLITR INTELLIGENCE LEDGER. ALL RIGHTS RESERVED.
        </div>
        <div className="main-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Cookie Settings</a>
          <a href="#">Global Compliance</a>
        </div>
      </footer>
    </>
  );
}

export default App;

