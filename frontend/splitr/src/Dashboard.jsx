import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import Sidebar from './components/Sidebar';
import InsightsModal from "./components/InsightsModal";

function Dashboard({ user }) {
  const navigate = useNavigate(); 
  const { id: groupId } = useParams();

  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedInsightGroupId, setSelectedInsightGroupId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);

  // Delete group handler
  const handleDeleteGroup = async (e, groupId, groupName) => {
    e.stopPropagation(); // prevent navigating into the group
    if (!window.confirm(`Delete "${groupName}"? This will also remove all its expenses.`)) return;

    setDeleting(groupId);
    try {
      const res = await fetch(`http://localhost:5000/group/delete/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        setGroups(prev => prev.filter(g => g._id !== groupId));
        setExpenses(prev => prev.filter(e => e.groupId !== groupId && e.groupId?._id !== groupId));
      } else {
        alert('Failed to delete group');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete group');
    } finally {
      setDeleting(null);
    }
  };

  // Fetch groups and expenses on mount
  useEffect(() => {
    if (!user?.name) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch groups where user is a member
        const groupsRes = await fetch(`http://localhost:5000/group/user/${user.name}`);
        const groupsData = await groupsRes.json();
        setGroups(groupsData);

        // Fetch recent expenses for groups user is in
        const expensesRes = await fetch(`http://localhost:5000/expense/user/${user.name}`);
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.name]);

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const res = await fetch("http://localhost:5000/group/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCode.trim(), userName: user.name })
      });
      const data = await res.json();
      if (res.ok) {
        setJoinCode("");
        setShowJoinInput(false);
        // Refresh groups
        const groupsRes = await fetch(`http://localhost:5000/group/user/${user.name}`);
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
        alert(`Joined ${data.group.name}!`);
      } else {
        alert(data.message || "Failed to join group");
      }
    } catch (err) {
      console.error("Join error:", err);
      alert("Error joining group");
    } finally {
      setJoining(false);
    }
  };

  // Calculate totals from real expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Helper: time ago
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Group icons pool
  const groupIcons = ['🏖️', '✈️', '🍕', '🏠', '🎮', '🎉', '☂️', '🚗', '📚', '💼'];

  const location = useLocation();
  const isGroupsPage = location.pathname === '/groups';

  return (
    <div className="dashboard-container">
      {/* Sidebar Component */}
      <Sidebar activePage={isGroupsPage ? "groups" : "dashboard"}>
        <button 
          className="sidebar-btn-expense"
          onClick={() => navigate(`/activity`)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Expense
        </button>
      </Sidebar>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header">
          <div className="search-bar">
            <span>🔍</span>
            <input type="text" placeholder="Search groups, expenses..." />
          </div>
          
          {/* <div className="header-nav">
            <span>Settle Up</span>
            <span>Remind</span>
          </div> */}

          <div className="header-actions">
            {showJoinInput ? (
              <div style={{display: 'flex', gap: '5px', alignItems: 'center'}}>
                <input 
                  type="text" 
                  placeholder="Enter Code..." 
                  value={joinCode} 
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  style={{padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', width: '100px'}}
                />
                <button onClick={handleJoinGroup} disabled={joining} style={{background: '#10b981', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer'}}>
                  {joining ? "..." : "Join"}
                </button>
                <button onClick={() => setShowJoinInput(false)} style={{background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer'}}>✕</button>
              </div>
            ) : (
              <button 
                className="btn-new-group"
                style={{background: '#EEF2FF', color: '#4361EE', border: '1px solid #DBEAFE', marginRight: '8px'}}
                onClick={() => setShowJoinInput(true)}
              >
                Join Group
              </button>
            )}

            <button 
              className="btn-new-group"
              onClick={() => navigate("/group")}
            >
              New Group
            </button>

            {/* <span style={{ fontSize: '1.2rem', color: '#64748B' }}>🔔</span> */}

            <div 
              className="user-profile" 
              onClick={() => navigate('/account')}
              style={{ cursor: "pointer" }}
            >
              <img 
                src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                alt="Profile" 
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Loading your data...</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Left Column */}
            <div className="left-column">
              
              {/* Balance Card - real data */}
              {!isGroupsPage && (
                <div className="balance-card">
                  <div className="balance-label">Total Expenses</div>
                  <div className="balance-amount">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                  <div className="balance-details">
                    <div>
                      <div className="balance-label">Groups</div>
                      <div className="detail-amount">{groups.length}</div>
                    </div>
                    <div>
                      <div className="balance-label">Transactions</div>
                      <div className="detail-amount">{expenses.length}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Groups Section */}
              <div className="section-header">
                <h3 className="section-title">Your Groups</h3>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button 
                    className="btn-insight-trigger" 
                    onClick={() => {
                      setSelectedInsightGroupId(groups.length > 0 ? groups[0]._id : null);
                      setShowInsightsModal(true);
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" /><path d="M12 3v9h9" /></svg>
                    Insights
                  </button>
                  <span className="view-all" onClick={() => navigate("/group")}>+ New Group</span>
                </div>
              </div>

              <div className="groups-grid">
                {groups.length === 0 ? (
                  <div 
                    className="create-group-card"
                    onClick={() => navigate("/group")}
                    style={{ cursor: "pointer", gridColumn: "1 / -1" }}
                  >
                    <div className="create-icon">+</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                      No groups yet — Create your first group
                    </div>
                  </div>
                ) : (
                  <>
                    {groups.map((group, index) => (
                      <div 
                        key={group._id}
                        className="group-card"
                        onClick={() => navigate(`/dashboard/${group._id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="group-header">
                          <div className="group-icon">{groupIcons[index % groupIcons.length]}</div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className="status-badge status-active">Active</span>
                            <button
                              className="btn-delete-group"
                              title="Delete group"
                              disabled={deleting === group._id}
                              onClick={(e) => handleDeleteGroup(e, group._id, group.name)}
                            >
                              {deleting === group._id ? (
                                <span className="delete-spinner"></span>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <h4 className="group-name">{group.name}</h4>
                        <div className="group-meta">
                          {group.members.length} Members • {timeAgo(group.createdAt)}
                        </div>
                        <div className="group-footer">
                          <div className="member-avatars">
                            {group.members.slice(0, 3).map((member, i) => (
                              <div key={i} className="avatar" title={member}>
                                {member.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {group.members.length > 3 && (
                              <div className="avatar more">+{group.members.length - 3}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Create Group Card */}
                    <div 
                      className="create-group-card"
                      onClick={() => navigate("/group")}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="create-icon">+</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                        Create Group
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="right-column">
              
              {/* Quick Stats */}
              <div className="ai-insight-top">
                <div className="ai-header">
                  <span>📊</span> Quick Overview
                </div>
                <h3 className="ai-title">
                  {groups.length} group{groups.length !== 1 ? 's' : ''}, {expenses.length} expense{expenses.length !== 1 ? 's' : ''} tracked
                </h3>
                <button className="btn-ai" onClick={() => navigate("/group")}>Create New Group</button>
              </div>

              {/* Recent Expenses Feed */}
              <div className="feed-card">
                <h3 className="feed-title">Recent Expenses</h3>

                {expenses.length === 0 ? (
                  <div className="empty-feed">
                    <span style={{ fontSize: '2rem' }}>📭</span>
                    <p>No expenses yet. Add your first one!</p>
                  </div>
                ) : (
                  <div className="timeline">
                    {expenses.slice(0, 10).map((expense) => (
                      <div key={expense._id} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-time">
                          {timeAgo(expense.createdAt)}
                        </div>
                        <div className="timeline-content">
                          <strong>{expense.paidBy}</strong> paid
                          {expense.notes ? ` for "${expense.notes}"` : ''}
                          {expense.groupId?.name && (
                            <span className="expense-group-tag"> in {expense.groupId.name}</span>
                          )}
                        </div>
                        <div className="timeline-amount">₹{expense.amount.toLocaleString('en-IN')}</div>
                        {expense.splitBetween.length > 0 && (
                          <div className="timeline-split">
                            Split between {expense.splitBetween.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>

      <div className="fab" onClick={() => navigate(`/activity`)}>
        <span style={{ fontSize: '1.2rem' }}>+</span>
      </div>

      <InsightsModal 
        isOpen={showInsightsModal} 
        onClose={() => setShowInsightsModal(false)}
        groups={groups}
        initialGroupId={selectedInsightGroupId}
        expenses={expenses}
        currentUser={user?.name || "Arjun Rao"} 
      />
    </div>
  );
}

export default Dashboard;
