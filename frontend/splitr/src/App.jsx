import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './index.css';
import Signup from './Signup';
import Login from './Login';
import Dashboard from './Dashboard';
import CreateGroup from './components/Group';
import GroupDetail from './components/GroupDetail';
import Account from './Account';
import Settings from './Settings';
import UnifiedAddExpense from './UnifiedAddExpense';

function AuthLayout({ children }) {
  return (
    <div className="auth-page-wrapper">
      <div className="page-border" style={{ borderColor: '#6C48F5' }}></div>
      <div className="page-border" style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: '#4361EE' }}></div>
      
      <div className="app-header">
        <h1 className="brand-title">SPLITR</h1>
        <p className="brand-subtitle">Split Expenses with Friends</p>
      </div>

      {children}

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
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Load user from localStorage on initial load
  React.useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('token', token);
    }
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/" element={
        <AuthLayout>
          <Signup onNavigate={(view) => navigate(`/${view}`)} onLoginSuccess={handleLoginSuccess} />
        </AuthLayout>
      } />
      <Route path="/signup" element={
        <AuthLayout>
          <Signup onNavigate={(view) => navigate(`/${view}`)} onLoginSuccess={handleLoginSuccess} />
        </AuthLayout>
      } />
      <Route path="/login" element={
        <AuthLayout>
          <Login onNavigate={(view) => navigate(`/${view}`)} onLoginSuccess={handleLoginSuccess} />
        </AuthLayout>
      } />
      <Route path="/dashboard" element={<Dashboard user={user} />} />
      <Route path="/groups" element={<Dashboard user={user} />} />
      <Route path="/dashboard/:id" element={<GroupDetail user={user} />} />
      <Route path="/group" element={<CreateGroup user={user} />} />
      <Route path="/account" element={<Account user={user} onLogout={handleLogout} />} />
      <Route path="/settings" element={<Settings user={user} onLogout={handleLogout} />} />
      <Route path="/activity" element={<UnifiedAddExpense user={user} onLogout={handleLogout} />} />
      <Route path="/add-expense/:id" element={<UnifiedAddExpense user={user} onLogout={handleLogout} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
