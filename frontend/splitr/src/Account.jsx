import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Account.css';

function Account({ user }) {
  const navigate = useNavigate();

  return (
    <div className="account-page-container">
      <div className="account-card">
        <button className="back-btn" onClick={() => navigate(-1)}>
          &larr; Back
        </button>
        <div className="account-header">
          <h2>Account Profile</h2>
        </div>
        <div className="account-content">
          <img 
            src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
            alt="Profile" 
            className="account-avatar"
          />
          <div className="account-details">
            <div className="info-group">
              <label>Name</label>
              <p>{user?.name || "Guest User"}</p>
            </div>
            <div className="info-group">
              <label>Email</label>
              <p>{user?.email || "No email provided"}</p>
            </div>
            {user?.googleId && (
              <div className="info-group">
                <label>Verification</label>
                <p>Google Authenticated Account ✓</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Account;
