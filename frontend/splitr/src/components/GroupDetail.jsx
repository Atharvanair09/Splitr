import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import UpiPaymentModal from "./UpiPaymentModal";
import "./GroupDetail.css";

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

  // Calculate balances: who owes whom
  const calculateBalances = () => {
    // balances[A][B] = amount A owes B (positive = A owes B)
    const balances = {};

    if (!group) return { netBalances: [], memberTotals: {} };

    // Initialize all members
    group.members.forEach((m) => {
      balances[m] = {};
      group.members.forEach((n) => {
        if (m !== n) balances[m][n] = 0;
      });
    });

    // Process each expense
    expenses.forEach((expense) => {
      const { paidBy, splitBetween, amount } = expense;
      if (!splitBetween || splitBetween.length === 0) return;

      const share = amount / splitBetween.length;

      splitBetween.forEach((person) => {
        if (person !== paidBy) {
          // person owes paidBy
          if (balances[person] && balances[person][paidBy] !== undefined) {
            balances[person][paidBy] += share;
          }
          if (balances[paidBy] && balances[paidBy][person] !== undefined) {
            balances[paidBy][person] -= share;
          }
        }
      });
    });

    // Simplify: net balances between each pair
    const netBalances = [];
    const processed = new Set();

    group.members.forEach((a) => {
      group.members.forEach((b) => {
        if (a === b) return;
        const key = [a, b].sort().join("-");
        if (processed.has(key)) return;
        processed.add(key);

        const aOwesB = balances[a]?.[b] || 0;
        const bOwesA = balances[b]?.[a] || 0;
        const net = aOwesB; // already net since we did += and -=

        if (Math.abs(net) > 0.01) {
          if (net > 0) {
            netBalances.push({ from: a, to: b, amount: net });
          } else {
            netBalances.push({ from: b, to: a, amount: Math.abs(net) });
          }
        }
      });
    });

    // Member totals
    const memberTotals = {};
    group.members.forEach((m) => {
      const paid = expenses
        .filter((e) => e.paidBy === m)
        .reduce((sum, e) => sum + e.amount, 0);
      const owes = netBalances
        .filter((b) => b.from === m)
        .reduce((sum, b) => sum + b.amount, 0);
      const owed = netBalances
        .filter((b) => b.to === m)
        .reduce((sum, b) => sum + b.amount, 0);

      memberTotals[m] = { paid, owes, owed };
    });

    return { netBalances, memberTotals };
  };

  const { netBalances, memberTotals } = calculateBalances();

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
                    <div className="gd-expense-split">
                      Split between: {expense.splitBetween.join(", ")}
                      <span className="gd-expense-per-person">
                        (₹{(expense.amount / expense.splitBetween.length).toFixed(2)} each)
                      </span>
                    </div>
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
