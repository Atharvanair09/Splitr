import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import UpiPaymentModal from "./UpiPaymentModal";
import "./GroupDetail.css";

const MemberRow = ({ m, currentUser }) => {
  let badgeClass = '';
  let barColor = '';
  if (m.status === 'Paid') {
    badgeClass = 'bg-green-light text-green';
    barColor = '#10B981';
  } else if (m.status === 'Partial') {
    badgeClass = 'bg-orange-light text-orange';
    barColor = '#F59E0B';
  } else {
    badgeClass = 'bg-red-light text-red';
    barColor = '#E2E8F0'; 
  }

  return (
    <div className="insight-member-row">
      <div className="insight-member-left">
        <div className="member-avatar">{m.name.charAt(0).toUpperCase()}</div>
        <div className="member-name" title={m.name}>
          {m.name} {m.name === currentUser ? <span className="member-you">(you)</span> : ''}
        </div>
      </div>
      
      <div className="member-progress-container">
         <div className="member-progress-bar" style={{ width: `${m.progress}%`, backgroundColor: barColor }}></div>
      </div>

      <div className="insight-member-right">
        <div className="member-amount">₹{m.paid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <span className={`member-badge ${badgeClass}`}>{m.status}</span>
      </div>
    </div>
  );
};

function GroupDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(null); // track which pair is settling
  const [upiTarget, setUpiTarget] = useState(null); // {from, to, amount} for UPI modal

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [groupRes, expensesRes] = await Promise.all([
          fetch(`http://localhost:5000/group/${id}`),
          fetch(`http://localhost:5000/expense/group/${id}`),
        ]);

        const groupData = await groupRes.json();
        const expensesData = await expensesRes.json();

        setGroup(groupData);
        setExpenses(expensesData);
      } catch (err) {
        console.error("Failed to fetch group details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Calculate balances using Minimum Cash Flow (Greedy Algorithm)
  const calculateBalances = () => {
    if (!group) return { netBalances: [], memberTotals: {} };

    // 1. First, calculate the net balance for each member (Total Paid - Total Owed)
    const netTotal = {};
    group.members.forEach((m) => {
      netTotal[m] = 0;
    });

    expenses.forEach((expense) => {
      const { paidBy, amount, splitBetween, splitDetails } = expense;
      if (!splitBetween || splitBetween.length === 0) return;

      // The person who paid gets credit for the full amount
      if (netTotal[paidBy] !== undefined) {
        netTotal[paidBy] += amount;
      }

      // Each member on the receiving end (owed part) gets a debit
      if (splitDetails && splitDetails.length > 0) {
        splitDetails.forEach((detail) => {
          if (netTotal[detail.name] !== undefined) {
            netTotal[detail.name] -= detail.amount;
          }
        });
      } else {
        const share = amount / splitBetween.length;
        splitBetween.forEach((person) => {
          if (netTotal[person] !== undefined) {
            netTotal[person] -= share;
          }
        });
      }
    });

    // 2. Separate members into creditors and debtors
    let debtors = []; // negative balance
    let creditors = []; // positive balance

    group.members.forEach((m) => {
      const bal = netTotal[m];
      if (bal < -0.01) {
        debtors.push({ name: m, amount: Math.abs(bal) });
      } else if (bal > 0.01) {
        creditors.push({ name: m, amount: bal });
      }
    });

    // 3. Minimum Cash Flow (Greedy Algorithm)
    const netBalances = [];
    
    // Sort so we always pick the maximum to settle first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      let debtor = debtors[dIdx];
      let creditor = creditors[cIdx];
      
      let settleAmount = Math.min(debtor.amount, creditor.amount);
      
      if (settleAmount > 0.01) {
        netBalances.push({ from: debtor.name, to: creditor.name, amount: settleAmount });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    // Member totals for UI display (summary cards)
    const memberTotals = {};
    group.members.forEach((m) => {
      const paid = expenses
        .filter((e) => e.paidBy === m)
        .reduce((sum, e) => sum + e.amount, 0);
      
      // Net can be derived from our netTotal calculation
      const net = netTotal[m] || 0;
      
      memberTotals[m] = { 
        paid, 
        owes: net < 0 ? Math.abs(net) : 0, 
        owed: net > 0 ? net : 0 
      };
    });

    return { netBalances, memberTotals };
  };

  const { netBalances, memberTotals } = calculateBalances();

  // Financial Insights specific calculations for current user AND group members
  const currentUser = user?.name || "Arjun Rao";
  const { totalShare, totalPaid, pendingValue, paidMembers, partialMembers, pendingMembers } = useMemo(() => {
    if (!group || !expenses) return { totalShare: 0, totalPaid: 0, pendingValue: 0, paidMembers: [], partialMembers: [], pendingMembers: [] };
    
    let tShare = 0;
    let tPaid = 0;

    const mData = {};
    group.members.forEach(m => {
      mData[m] = { name: m, paid: 0, share: 0 };
    });

    expenses.forEach(exp => {
      const amount = exp.amount || 0;
      const splitLen = exp.splitBetween?.length || 1;
      const splitAmount = amount / splitLen;

      if (exp.paidBy && mData[exp.paidBy]) {
        mData[exp.paidBy].paid += amount;
      }

      if (exp.splitBetween) {
        exp.splitBetween.forEach(m => {
          if (mData[m]) mData[m].share += splitAmount;
        });
        if (exp.splitBetween.includes(currentUser)) {
          tShare += splitAmount;
        }
      }

      if (exp.paidBy === currentUser) {
        tPaid += amount;
      }
    });

    let p = Math.max(0, tShare - tPaid);

    Object.values(mData).forEach(m => {
      if (m.paid >= m.share && m.share > 0) m.status = 'Paid';
      else if (m.paid > 0 && m.paid < m.share) m.status = 'Partial';
      else if (m.paid > 0 && m.share === 0) m.status = 'Paid'; 
      else m.status = 'Due';
      
      m.progress = m.share > 0 
        ? Math.min(100, Math.round((m.paid / m.share) * 100)) 
        : (m.paid > 0 ? 100 : 0);
    });

    const paidArray = Object.values(mData).filter(m => m.status === 'Paid').sort((a,b) => b.paid - a.paid);
    const partialArray = Object.values(mData).filter(m => m.status === 'Partial').sort((a,b) => b.paid - a.paid);
    const pendingArray = Object.values(mData).filter(m => m.status === 'Due').sort((a,b) => b.paid - a.paid);

    return { totalShare: tShare, totalPaid: tPaid, pendingValue: p, paidMembers: paidArray, partialMembers: partialArray, pendingMembers: pendingArray };
  }, [group, expenses, currentUser]);

  const chartPaid = Math.min(totalPaid, Math.max(totalShare, 1)); 
  const chartPending = pendingValue;

  let chartData = [];
  if (totalShare === 0 && totalPaid === 0) {
    chartData = [{ name: 'No Data', value: 1 }];
  } else {
    chartData = [
      { name: 'Paid', value: chartPaid },
      { name: 'Remaining', value: chartPending }
    ];
  }

  const COLORS = ['#10B981', '#EF4444'];
  if (totalShare === 0 && totalPaid === 0) COLORS[0] = '#E2E8F0';

  let paidPercentage = 0;
  if (totalShare > 0) {
    if (totalPaid >= totalShare) paidPercentage = 100;
    else paidPercentage = Math.round((totalPaid / totalShare) * 100);
  } else if (totalPaid > 0) {
    paidPercentage = 100;
  }
  const remainingPercentage = (totalShare > 0 && totalPaid < totalShare) ? 100 - paidPercentage : 0;


  // Total group spend
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Handle settle
 const handleSettle = async (from, to, amount) => {
  const settleKey = `${from}-${to}`;
  setSettling(settleKey);

  try {
    // 1. Create order from backend
    const orderRes = await fetch("http://localhost:5000/api/payment/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    });

    const orderData = await orderRes.json();

    // 2. Razorpay options
    const options = {
      key: "rzp_test_SZMjHxptIizsMu", 
      amount: orderData.amount,
      currency: "INR",
      name: "Splitr",
      description: `${from} pays ${to}`,
      order_id: orderData.id,

      handler: async function (response) {
        // 3. Verify payment
        const verifyRes = await fetch("http://localhost:5000/api/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(response),
        });

        const verifyData = await verifyRes.json();

        if (verifyData.success) {
          // 4. Mark settlement (same as your old logic)
          await fetch("http://localhost:5000/expense/add", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              groupId: id,
              amount: amount,
              paidBy: from,
              splitBetween: [to],
              notes: `Settlement: ${from} paid ${to}`,
            }),
          });

          // 5. Refresh expenses
          const expensesRes = await fetch(
            `http://localhost:5000/expense/group/${id}`
          );
          const expensesData = await expensesRes.json();
          setExpenses(expensesData);
        } else {
          alert("Payment verification failed");
        }
      },

      prefill: {
        name: from,
      },

      theme: {
        color: "#6366F1",
      },
    };

    // 6. Open Razorpay popup
    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error(err);
    alert("Payment failed");
  } finally {
    setSettling(null);
  }
};

  // Time ago helper
  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="gd-page">
        <div className="gd-loading">
          <div className="gd-spinner"></div>
          <p>Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="gd-page">
        <div className="gd-loading">
          <p>Group not found</p>
          <button className="gd-btn-back" onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gd-page">
      {/* Top Bar */}
      <div className="gd-top-bar">
        <button className="gd-btn-back" onClick={() => navigate("/dashboard")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>

        <button
          className="gd-btn-add-expense"
          onClick={() => navigate(`/add-expense/${id}`)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Expense
        </button>
      </div>

      {/* Group Header Card */}
      <div className="gd-header-card">
        <div className="gd-header-info">
          <h1 className="gd-group-name">{group.name}</h1>
          <p className="gd-group-meta">
            {group.members.length} Members • Created {timeAgo(group.createdAt)}
          </p>
        </div>
        <div className="gd-header-stats">
          <div className="gd-stat">
            <span className="gd-stat-label">Total Spent</span>
            <span className="gd-stat-value">₹{totalSpent.toLocaleString("en-IN")}</span>
          </div>
          <div className="gd-stat">
            <span className="gd-stat-label">Expenses</span>
            <span className="gd-stat-value">{expenses.length}</span>
          </div>
        </div>
      </div>

      <div className="gd-content-grid">
        {/* Left Column */}
        <div className="gd-left">

          {/* Members Section */}
          <div className="gd-card">
            <h3 className="gd-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Members
            </h3>

            <div className="gd-members-list">
              {group.members.map((member, i) => {
                const totals = memberTotals[member] || { paid: 0, owes: 0, owed: 0 };
                return (
                  <div key={i} className="gd-member-row">
                    <div className="gd-member-left">
                      <div className="gd-member-avatar">
                        {member.charAt(0).toUpperCase()}
                      </div>
                      <div className="gd-member-info">
                        <span className="gd-member-name">{member}</span>
                        <span className="gd-member-paid">
                          Paid ₹{totals.paid.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <div className="gd-member-right">
                      {totals.owed > 0 && (
                        <span className="gd-badge gd-badge-green">
                          Gets ₹{totals.owed.toFixed(0)}
                        </span>
                      )}
                      {totals.owes > 0 && (
                        <span className="gd-badge gd-badge-red">
                          Owes ₹{totals.owes.toFixed(0)}
                        </span>
                      )}
                      {totals.owes === 0 && totals.owed === 0 && (
                        <span className="gd-badge gd-badge-neutral">Settled</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Balances / Who Owes Whom */}
          <div className="gd-card">
            <h3 className="gd-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Who Owes Whom
            </h3>

            {netBalances.length === 0 ? (
              <div className="gd-empty">
                <span style={{ fontSize: "2rem" }}>✅</span>
                <p>All settled up! No pending balances.</p>
              </div>
            ) : (
              <div className="gd-balance-list">
                {netBalances.map((bal, i) => {
                  const settleKey = `${bal.from}-${bal.to}`;
                  const isSettling = settling === settleKey;

                  return (
                    <div key={i} className="gd-balance-row">
                      <div className="gd-balance-left">
                        <div className="gd-balance-avatars">
                          <div className="gd-balance-avatar gd-avatar-from">
                            {bal.from.charAt(0).toUpperCase()}
                          </div>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="gd-arrow-icon">
                            <path d="M5 12h14" />
                            <path d="M12 5l7 7-7 7" />
                          </svg>
                          <div className="gd-balance-avatar gd-avatar-to">
                            {bal.to.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="gd-balance-info">
                          <span className="gd-balance-names">
                            <strong>{bal.from}</strong> owes <strong>{bal.to}</strong>
                          </span>
                          <span className="gd-balance-amount">
                            ₹{bal.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="gd-settle-actions">
                        <button
                          className={`gd-btn-settle ${isSettling ? "settling" : ""}`}
                          onClick={() => handleSettle(bal.from, bal.to, bal.amount)}
                          disabled={isSettling}
                        >
                          {isSettling ? (
                            <>
                              <span className="gd-btn-spinner"></span>
                              Settling...
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Settle
                            </>
                          )}
                        </button>
                        <button
                          className="gd-btn-upi"
                          onClick={() => setUpiTarget({ from: bal.from, to: bal.to, amount: bal.amount })}
                          disabled={isSettling}
                        >
                          ⚡ Pay via UPI
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial Insights Card directly below Who Owes Whom */}
          <div className="gd-card">
            <h3 className="gd-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}>
                <path d="M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" />
                <path d="M12 3v9h9" />
              </svg>
              Your financial insights
            </h3>

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  ₹{totalShare.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>your share</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 500, color: '#475569' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#10B981' }}></span>
                Paid {totalPaid > 0 ? `— ₹${totalPaid.toLocaleString()} (${paidPercentage}%)` : ''}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 500, color: '#475569' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#EF4444' }}></span>
                Remaining {pendingValue > 0 ? `— ₹${pendingValue.toLocaleString()} (${remainingPercentage}%)` : ''}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1, background: '#F8FAFC', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: '0.25rem' }}>Already paid</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>₹{totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
              <div style={{ flex: 1, background: '#F8FAFC', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, marginBottom: '0.25rem' }}>Still owe</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#EF4444' }}>₹{pendingValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '2rem 0 1rem 0' }} />

            <div className="gd-members-list" style={{ display: 'flex', flexDirection: 'column' }}>
              
              {paidMembers.length > 0 && (
                <>
                  <h4 className="members-section-title">PAID</h4>
                  {paidMembers.map((m, i) => <MemberRow key={`paid-${i}`} m={m} currentUser={currentUser} />)}
                </>
              )}
              
              {partialMembers.length > 0 && (
                <>
                  <h4 className="members-section-title">PARTIAL</h4>
                  {partialMembers.map((m, i) => <MemberRow key={`partial-${i}`} m={m} currentUser={currentUser} />)}
                </>
              )}
              
              {pendingMembers.length > 0 && (
                <>
                  <h4 className="members-section-title">PENDING</h4>
                  {pendingMembers.map((m, i) => <MemberRow key={`pending-${i}`} m={m} currentUser={currentUser} />)}
                </>
              )}
              
              {paidMembers.length === 0 && partialMembers.length === 0 && pendingMembers.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: '1rem' }}>No members found.</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                  </svg>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column - Expense History */}
        <div className="gd-right">
          <div className="gd-card">
            <h3 className="gd-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Expense History
            </h3>

            {expenses.length === 0 ? (
              <div className="gd-empty">
                <span style={{ fontSize: "2rem" }}>📭</span>
                <p>No expenses yet for this group.</p>
                <button
                  className="gd-btn-add-expense"
                  onClick={() => navigate(`/add-expense/${id}`)}
                  style={{ marginTop: "8px" }}
                >
                  Add First Expense
                </button>
              </div>
            ) : (
              <div className="gd-expense-list">
                {expenses.map((expense) => (
                  <div key={expense._id} className="gd-expense-item">
                    <div className="gd-expense-top">
                      <div className="gd-expense-payer">
                        <div className="gd-expense-payer-avatar">
                          {expense.paidBy.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="gd-expense-payer-name">{expense.paidBy}</span>
                          <span className="gd-expense-time">{formatDate(expense.createdAt)}</span>
                        </div>
                      </div>
                      <div className="gd-expense-amount">
                        ₹{expense.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                    {expense.notes && (
                      <div className="gd-expense-notes">"{expense.notes}"</div>
                    )}
                    {expense.splitDetails && expense.splitDetails.length > 0 ? (
                      <div className="gd-expense-split" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                        <span style={{marginBottom: '4px'}}>Individual Breakdown:</span>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                          {expense.splitDetails.map((d, i) => (
                             <span key={i} style={{fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px'}}>
                               {d.name}: ₹{d.amount}
                             </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="gd-expense-split">
                        Split between: {expense.splitBetween.join(", ")}
                        <span className="gd-expense-per-person">
                          (₹{(expense.amount / expense.splitBetween.length).toFixed(2)} each)
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UPI Payment Modal */}
      {upiTarget && (
        <UpiPaymentModal
          from={upiTarget.from}
          to={upiTarget.to}
          amount={upiTarget.amount}
          groupId={id}
          onClose={() => setUpiTarget(null)}
          onSettled={async () => {
            setUpiTarget(null);
            // Refresh expenses
            const expensesRes = await fetch(`http://localhost:5000/expense/group/${id}`);
            const expensesData = await expensesRes.json();
            setExpenses(expensesData);
          }}
        />
      )}
    </div>
  );
}

export default GroupDetail;
