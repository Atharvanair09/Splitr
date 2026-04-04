import React, { useState, useEffect } from 'react';
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
               style={{background: '#fff', color: '#10b981', border: '1px solid #10b981', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginRight: '10px'}}
             >
               Refresh Connection
             </button>
             <div className="user-profile">
               <img src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Profile" />
             </div>
          </div>
        </header>

        <div className="activity-scrollable-area" style={{padding: '20px'}}>
          {loading ? (
            <div style={{textAlign: 'center', marginTop: '100px'}}>
              <div className="loading-spinner"></div>
              <p>Scanning your emails for transactions...</p>
            </div>
          ) : error ? (
            <div style={{textAlign: 'center', marginTop: '100px', background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0'}}>
              <span style={{fontSize: '3rem'}}>📧</span>
              <h3>No Gmail Connection</h3>
              <p style={{color: '#64748b', marginBottom: '20px'}}>Connect your Google account to automatically detect transactions from your emails.</p>
              <button 
                onClick={handleConnectGmail}
                style={{background: '#4361EE', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer'}}
              >
                Connect Gmail
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{textAlign: 'center', marginTop: '100px'}}>
              <span style={{fontSize: '3rem'}}>✨</span>
              <h3>All caught up!</h3>
              <p style={{color: '#64748b'}}>No new transaction emails detected in the last 24 hours.</p>
            </div>
          ) : (
            <div className="transaction-list" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
              {transactions.map(tx => (
                <div key={tx.id} className="transaction-card" style={{background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 6px rgba(0,0,0,0.02)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px', flex: 1}}>
                    <div style={{
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: tx.type === 'credit' ? '#ecfdf5' : '#fef2f2', 
                      color: tx.type === 'credit' ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      {tx.type === 'credit' ? '↓' : '↑'}
                    </div>
                    <div>
                      <h4 style={{margin: 0, fontSize: '1rem', color: '#1e293b'}}>{tx.subject}</h4>
                      <p style={{margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b'}}>{tx.snippet.substring(0, 80)}...</p>
                      <span style={{fontSize: '0.7rem', color: '#94a3b8'}}>{new Date(tx.date).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                    <div style={{textAlign: 'right', minWidth: '100px'}}>
                      <div style={{fontSize: '1.2rem', fontWeight: '800', color: tx.type === 'credit' ? '#10b981' : '#1e293b'}}>
                        {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                      </div>
                      <span style={{fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '700', color: tx.type === 'credit' ? '#10b981' : '#ef4444'}}>
                        {tx.type}
                      </span>
                    </div>

                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                       <select 
                         value={selectedGroupId} 
                         onChange={(e) => setSelectedGroupId(e.target.value)}
                         style={{padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem'}}
                       >
                         {groups.map(g => (
                           <option key={g._id} value={g._id}>{g.name}</option>
                         ))}
                       </select>
                       <button 
                         onClick={() => handleAddTransaction(tx)}
                         disabled={addingToLedger === tx.id}
                         style={{background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer'}}
                       >
                         {addingToLedger === tx.id ? "..." : "Add to Group"}
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Inbox;
