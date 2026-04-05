import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import './Activity.css'; // Reusing some activity styles for consistency

function Inbox({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [addingToLedger, setAddingToLedger] = useState(null); // ID of transaction being added
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/transactions");
      const data = await res.json();
      if (res.ok) {
        setTransactions(data);
      } else {
        setError(data.error || "Failed to fetch transactions");
      }
    } catch (err) {
      console.error(err);
      setError("Connect Gmail to scan transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    if (!user?.name) return;
    try {
      const res = await fetch(`http://localhost:5000/group/user/${user.name}`);
      const data = await res.json();
      setGroups(data);
      if (data.length > 0) setSelectedGroupId(data[0]._id);
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchGroups();
  }, [user]);

  const handleAddTransaction = async (tx) => {
    if (!selectedGroupId) return alert("Select a group first");
    
    try {
      setAddingToLedger(tx.id);
      const res = await fetch("http://localhost:5000/expense/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroupId,
          amount: parseFloat(tx.amount),
          paidBy: user.name,
          splitBetween: [user.name], // Default to self, user can edit in activity later or we can refine
          notes: `${tx.type.toUpperCase()}: ${tx.subject}`,
          gmailMessageId: tx.id,
        }),
      });

      if (res.ok) {
        alert("Transaction added to ledger!");
        setTransactions(prev => prev.filter(t => t.id !== tx.id));
      } else {
        alert("Failed to add transaction");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding transaction");
    } finally {
      setAddingToLedger(null);
    }
  };

  const handleConnectGmail = () => {
    window.location.href = "http://localhost:5000/api/auth/gmail/google";
  };

  return (
    <div className="activity-dashboard-container" style={{background: '#F8FAFC'}}>
      <Sidebar activePage="inbox" />

      <main className="activity-main-content">
        <header className="activity-top-header">
          <div className="activity-header-left">
            <div className="ae-subtitle">SMART INBOX</div>
            <h1 className="ae-title" style={{marginTop: 0, fontSize: '1.5rem'}}>Gmail Transactions</h1>
          </div>
          <div className="activity-header-actions">
             <button 
               className="btn-connect" 
               onClick={handleConnectGmail}
             >
               Refresh Connection
             </button>
             <div className="user-profile">
               <img src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Profile" />
             </div>
          </div>
        </header>

        <div className="activity-scrollable-area" style={{padding: '20px'}}>
<<<<<<< Updated upstream
          {loading ? (
            <div className="inbox-loading-state">
              <div className="loading-spinner"></div>
              <p>Scanning your emails for transactions...</p>
            </div>
          ) : error ? (
            <div className="inbox-empty-state">
=======
          {!user?.isPremium && (
            <div style={{textAlign: 'center', marginTop: '100px', background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0'}}>
              <span style={{fontSize: '3rem'}}>💎</span>
              <h3 style={{color: '#1e293b'}}>Premium Feature</h3>
              <p style={{color: '#64748b', marginBottom: '20px'}}>Upgrade to Splitr Premium to connect Gmail and automatically scan your email for transactions!</p>
            </div>
          )}

          {user?.isPremium && loading ? (
            <div style={{textAlign: 'center', marginTop: '100px'}}>
              <div className="loading-spinner"></div>
              <p>Scanning your emails for transactions...</p>
            </div>
          ) : user?.isPremium && error ? (
            <div style={{textAlign: 'center', marginTop: '100px', background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0'}}>
>>>>>>> Stashed changes
              <span style={{fontSize: '3rem'}}>📧</span>
              <h3>No Gmail Connection</h3>
              <p>Connect your Google account to automatically detect transactions from your emails.</p>
              <button 
                className="btn-primary-inbox"
                onClick={handleConnectGmail}
              >
                Connect Gmail
              </button>
            </div>
<<<<<<< Updated upstream
          ) : transactions.length === 0 ? (
            <div className="inbox-empty-state">
=======
          ) : user?.isPremium && transactions.length === 0 ? (
            <div style={{textAlign: 'center', marginTop: '100px'}}>
>>>>>>> Stashed changes
              <span style={{fontSize: '3rem'}}>✨</span>
              <h3>All caught up!</h3>
              <p>No new transaction emails detected in the last 24 hours.</p>
            </div>
<<<<<<< Updated upstream
          ) : (
            <div className="transaction-list">
=======
          ) : user?.isPremium ? (
            <div className="transaction-list" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
>>>>>>> Stashed changes
              {transactions.map(tx => (
                <div key={tx.id} className="transaction-card">
                  <div className="tx-card-left">
                    <div className={`tx-icon ${tx.type === 'credit' ? 'credit' : 'debit'}`}>
                      {tx.type === 'credit' ? '↓' : '↑'}
                    </div>
                    <div className="tx-info">
                      <h4 className="tx-subject">{tx.subject}</h4>
                      <p className="tx-snippet">{tx.snippet.substring(0, 80)}...</p>
                      <span className="tx-date">{new Date(tx.date).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="tx-card-right">
                    <div className="tx-amount-col">
                      <div className={`tx-amount ${tx.type === 'credit' ? 'credit' : 'debit'}`}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                      </div>
                      <span className={`tx-type-label ${tx.type === 'credit' ? 'credit' : 'debit'}`}>
                        {tx.type}
                      </span>
                    </div>

                    <div className="tx-actions-row">
                       <select 
                         className="tx-group-select"
                         value={selectedGroupId} 
                         onChange={(e) => setSelectedGroupId(e.target.value)}
                       >
                         {groups.map(g => (
                           <option key={g._id} value={g._id}>{g.name}</option>
                         ))}
                       </select>
                       <button 
                         className="tx-add-btn"
                         onClick={() => handleAddTransaction(tx)}
                         disabled={addingToLedger === tx.id}
                       >
                         {addingToLedger === tx.id ? "..." : "Add to Group"}
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
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
        <Link to="/inbox" className="mobile-nav-item active">
          <span className="mobile-nav-icon">📥</span>
          <span>Inbox</span>
        </Link>
        <Link to="/settings" className="mobile-nav-item">
          <span className="mobile-nav-icon">⚙️</span>
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}

export default Inbox;
