import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-container">
      {/* Soft background blobs */}
      <div className="landing-blob-1"></div>
      <div className="landing-blob-2"></div>

      {/* Navigation */}
      <nav className="landing-navbar">
        <Link to="/" className="landing-brand">
          <div className="landing-brand-title">SPLITR</div>
        </Link>
        <div className="landing-nav-links">
          <Link to="/login" className="login-btn">Log in</Link>
          <Link to="/signup" className="signup-btn-small">Sign up</Link>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="landing-hero">
        <h1 className="hero-title">
          Split bills without the awkward math.
        </h1>
        
        <p className="hero-subtitle">
          Just snap a picture of the receipt. We’ll figure out exactly who ordered what so everyone pays their fair share. No spreadsheets, no arguments.
        </p>

        <Link to="/signup" className="btn-cta">
          Start Splitting — It's Free
        </Link>

        {/* Realistic Interface Preview */}
        <div className="preview-container">
          
          <div className="preview-col">
            <div className="preview-header">1. Upload Receipt</div>
            <div className="receipt-item">
              <span className="name">1x Margherita Pizza</span>
              <span className="price">₹450</span>
            </div>
            <div className="receipt-item">
              <span className="name">2x Iced Americano</span>
              <span className="price">₹320</span>
            </div>
            <div className="receipt-item">
              <span className="name">1x Garlic Bread</span>
              <span className="price">₹180</span>
            </div>
            <div className="receipt-item" style={{border: 'none', marginTop: '8px'}}>
              <span className="name" style={{fontWeight: '700'}}>Total</span>
              <span className="price" style={{fontWeight: '700', color: '#1E293B'}}>₹950</span>
            </div>
          </div>

          <div className="preview-col" style={{borderLeft: '1px solid #E2E8F0', paddingLeft: '2rem'}}>
            <div className="preview-header">2. Everyone pays their share</div>
            
            <div className="breakdown-card">
              <div className="avatar">S</div>
              <div className="breakdown-info">
                <div className="person-name">Sahil</div>
                <div className="person-owes">Owes ₹610</div>
              </div>
            </div>

            <div className="breakdown-card">
              <div className="avatar" style={{background: '#DEF7EC', color: '#046C4E'}}>A</div>
              <div className="breakdown-info">
                <div className="person-name">Atharva</div>
                <div className="person-pays">Paid ₹950</div>
              </div>
            </div>
            
          </div>
        </div>


      </main>

      {/* Clean minimal footer */}
      <footer className="landing-footer">
        © 2026 Splitr. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
