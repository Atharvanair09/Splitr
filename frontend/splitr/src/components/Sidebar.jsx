import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ activePage, children }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand-wrapper">
        <h2 className="sidebar-brand-title">SPLITR</h2>
        <span className="sidebar-brand-subtitle">INTELLIGENT LEDGER</span>
      </div>

      <nav className="sidebar-nav-menu">
        <Link to="/dashboard" className={`sidebar-nav-item ${activePage === 'dashboard' ? 'active' : ''}`}>
          <span className="sidebar-nav-icon">⊞</span>
          Dashboard
        </Link>

        <Link to="/groups" className={`sidebar-nav-item ${activePage === 'groups' ? 'active' : ''}`}>
          <span className="sidebar-nav-icon">👥</span>
          Groups
        </Link>

        <Link to="/activity" className={`sidebar-nav-item ${activePage === 'activity' ? 'active' : ''}`}>
          <span className="sidebar-nav-icon">🕒</span>
          Activity
        </Link>

        <Link to="/inbox" className={`sidebar-nav-item ${activePage === 'inbox' ? 'active' : ''}`}>
          <span className="sidebar-nav-icon">📥</span>
          Inbox
        </Link>

        <Link to="/settings" className={`sidebar-nav-item ${activePage === 'settings' ? 'active' : ''}`}>
          <span className="sidebar-nav-icon">⚙️</span>
          Settings
        </Link>
      </nav>

      <div className="sidebar-footer-wrapper">
         {children}
      </div>
    </aside>
  );
}

export default Sidebar;
