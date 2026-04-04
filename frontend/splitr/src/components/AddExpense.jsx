import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./AddExpense.css";

function AddExpense() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitBetween, setSplitBetween] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const memberList = splitBetween
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m !== "");

  const perPerson = memberList.length > 0 && amount
    ? (parseFloat(amount) / memberList.length).toFixed(2)
    : null;

  const handleSubmit = async () => {
    if (!amount || !paidBy || !splitBetween) {
      return alert("Fill all required fields");
    }

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/expense/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          groupId,
          amount: parseFloat(amount),
          paidBy,
          splitBetween: memberList,
          notes,
        }),
      });

      if (!res.ok) throw new Error();

      navigate(`/dashboard/${groupId}`);
    } catch (err) {
      console.error(err);
      alert("Error adding expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expense-page">
        {/* Header */}
        <div className="expense-top-bar">
          <button className="expense-back-btn" onClick={() => navigate(-1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Form Card */}
        <div className="expense-form-card">
          <div className="expense-form-header">
            <div className="expense-icon-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h2 className="expense-title">Add Expense</h2>
              <p className="expense-subtitle">Record a new transaction for this group</p>
            </div>
          </div>

          <div className="expense-divider"></div>

          {/* Amount - prominent */}
          <div className="expense-amount-section">
            <label className="expense-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Amount
            </label>
            <div className="amount-input-wrapper">
              <span className="currency-symbol">₹</span>
              <input
                type="number"
                className="amount-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Two column fields */}
          <div className="expense-fields-grid">
            <div className="expense-field">
              <label className="expense-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Paid By
              </label>
              <input
                type="text"
                className="expense-input"
                placeholder="Who paid?"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              />
            </div>

            <div className="expense-field">
              <label className="expense-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Split Between
              </label>
              <input
                type="text"
                className="expense-input"
                placeholder="Sahil, Rahul, Amit"
                value={splitBetween}
                onChange={(e) => setSplitBetween(e.target.value)}
              />
              <span className="expense-hint">Separate names with commas</span>
            </div>
          </div>

          {/* Member chips + split preview */}
          {memberList.length > 0 && (
            <div className="split-preview">
              <div className="split-preview-header">
                <span className="split-preview-label">Split Breakdown</span>
                {perPerson && (
                  <span className="split-per-person">₹{perPerson} / person</span>
                )}
              </div>
              <div className="split-chips">
                {memberList.map((name, i) => (
                  <div key={i} className="split-chip">
                    <span className="split-chip-avatar">{name.charAt(0).toUpperCase()}</span>
                    <span className="split-chip-name">{name}</span>
                    {perPerson && <span className="split-chip-amount">₹{perPerson}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="expense-field">
            <label className="expense-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Notes
              <span className="optional-tag">Optional</span>
            </label>
            <textarea
              className="expense-textarea"
              placeholder="e.g. Dinner at restaurant, cab fare..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <button
            className="expense-submit-btn"
            onClick={handleSubmit}
            disabled={loading || !amount || !paidBy || !splitBetween}
          >
            {loading ? (
              <>
                <span className="expense-spinner"></span>
                Saving...
              </>
            ) : (
              <>
                Save Expense
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </>
            )}
          </button>
        </div>
    </div>
  );
}

export default AddExpense;