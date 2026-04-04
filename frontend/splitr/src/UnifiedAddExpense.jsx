import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import './Activity.css';
import './components/AddExpense.css';

function UnifiedAddExpense({ user }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // --- MANUAL FORM STATE ---
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

  // --- CHAT STATE ---
  const [messages, setMessages] = useState([
    { role: 'bot', type: 'text', text: "Hey! Tell me about an expense to split — just type naturally. I'll auto-fill the form for you!" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMsg = inputValue;
    setMessages(prev => [...prev, { role: 'user', type: 'text', text: userMsg }]);
    setInputValue('');
    setIsChatLoading(true);

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("Missing OpenRouter API Key. Add VITE_OPENROUTER_API_KEY to your frontend .env file.");
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: `You are an AI expense parser. Extract the following from natural language expense inputs and return ONLY valid JSON:
{
  "category": "e.g. FOOD & DRINK",
  "amount": "numbers only",
  "currency": "symbol like ₹ or $",
  "title": "short relevant title",
  "confidence": number 0-100,
  "paidBy": "person who paid",
  "splitType": "e.g. Split equally",
  "between": ["person1", "person2", "person3"],
  "eachPays": number for each person
}`
          }, {
            role: "user",
            content: userMsg
          }]
        })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message || "Failed API call");
      
      const aiContent = data.choices[0].message.content;
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("AI did not return expected JSON format");
      
      const parsed = JSON.parse(jsonMatch[0]);

      setMessages(prev => [...prev, { role: 'bot', type: 'card', data: parsed }]);
      
      // Auto-populate the form overrides
      if(parsed.amount) setAmount(parsed.amount.toString());
      if(parsed.paidBy) setPaidBy(parsed.paidBy);
      if(parsed.between && Array.isArray(parsed.between)) setSplitBetween(parsed.between.join(", "));
      if(parsed.title) setNotes(parsed.title);

    } catch (error) {
       console.error("OpenRouter Error:", error);
       setMessages(prev => [...prev, { role: 'bot', type: 'error', text: error.message || "Failed to process expense." }]);
    } finally {
       setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const handleSubmit = async () => {
    if (!amount || !paidBy || !splitBetween) {
      return alert("Please ensure Amount, Paid By, and Split Between fields are correctly filled.");
    }
    
    // Using group ID from route param or fallback to a hardcoded logic
    const groupId = id || '1'; // In production, users would select a group if coming from /activity

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/expense/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
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

      if(id) {
         navigate(`/dashboard/${id}`);
      } else {
         navigate(`/dashboard`);
      }
    } catch (err) {
      console.error(err);
      alert("Error adding expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activity-dashboard-container">
      {/* Sidebar Component */}
      <Sidebar activePage={id ? "groups" : "activity"}>
         <button className="sidebar-btn-expense" onClick={handleSubmit} disabled={loading || !amount}>
           {loading ? "SAVING..." : "SAVE EXPENSE"}
         </button>
      </Sidebar>

      {/* Main Content */}
      <main className="activity-main-content">
        <header className="activity-top-header">
          <div className="activity-header-left">
             <div>
               <div className="ae-subtitle">INTELLIGENT ENTRY</div>
               <h1 className="ae-title" style={{marginTop: 0, fontSize: '1.5rem'}}>Add Expense</h1>
             </div>
          </div>
          <div className="activity-header-actions">
            {id && (
              <button className="expense-back-btn" onClick={() => navigate(-1)} style={{margin: 0, display: 'flex', gap: '8px', alignItems: 'center'}}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back to Group
              </button>
            )}
            <div className="user-profile">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profile" />
            </div>
          </div>
        </header>

        <div className="activity-scrollable-area">
          <div className="activity-container" style={{maxWidth: '1200px', display: 'flex', gap: '30px', alignItems: 'flex-start', marginTop: '30px'}}>
            
            {/* Chat Flow Section (Left Column) */}
            <div className="chat-flow-container" style={{flex: 1, margin: 0, height: '70vh', background: '#F4F6FF', borderRadius: '16px', border: '1px solid #e2e8f0'}}>
              
              <div className="chat-messages-area" style={{paddingRight: '15px', padding: '20px'}}>
                {messages.map((msg, index) => {
                  if (msg.role === 'bot' && msg.type === 'text') {
                    return (
                      <div key={index} className="chat-row bot-row">
                        <div className="bot-avatar">S</div>
                        <div className="chat-bubble bot-bubble">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }
                  
                  if (msg.role === 'bot' && msg.type === 'error') {
                     return (
                      <div key={index} className="chat-row bot-row">
                        <div className="bot-avatar" style={{background: '#991b1b'}}>!</div>
                        <div className="chat-bubble error-bubble">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  if (msg.role === 'user') {
                    return (
                      <div key={index} className="chat-row user-row">
                        <div className="chat-bubble user-bubble">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  if (msg.role === 'bot' && msg.type === 'card') {
                    const d = msg.data;
                    return (
                      <div key={index} className="chat-row bot-row">
                        <div style={{width: '32px', flexShrink: 0}} /> 
                        <div className="expense-parsed-card" style={{boxShadow: '0 4px 16px rgba(0,0,0,0.06)'}}>
                          
                          <div className="epc-header">
                            <div className="epc-top-row">
                              <span className="epc-category">{d.category || "GENERAL"}</span>
                              <span className="epc-confidence">{d.confidence || 95}% confidence match</span>
                            </div>
                            <h2 className="epc-amount">{d.currency || "$"}{Number(d.amount).toLocaleString()}</h2>
                            <p className="epc-title">{d.title}</p>
                          </div>
                          
                          <div className="epc-body">
                            <div className="epc-row">
                              <label>Paid by</label>
                              <div className="epc-value flex-align">
                                <span className="epc-avatar avatar-blue">{getInitial(d.paidBy)}</span> {d.paidBy}
                              </div>
                            </div>
                            
                            <div className="epc-row">
                              <label>Split</label>
                              <div className="epc-value">{d.splitType}</div>
                            </div>
                            
                            <div className="epc-row">
                              <label>Between</label>
                              <div className="epc-value flex-align">
                                <span style={{fontWeight: '700', fontSize: '0.85rem'}}>{d.between?.join(", ")}</span>
                              </div>
                            </div>
                            
                            <div className="epc-row">
                              <label>Each pays</label>
                              <div className="epc-value epc-pay-amt">{d.currency || "$"}{Number(d.eachPays).toLocaleString()}</div>
                            </div>
                          </div>
                          
                        </div>
                      </div>
                    );
                  }
                  
                  return null;
                })}
                
                {isChatLoading && (
                  <div className="chat-row bot-row">
                    <div className="bot-avatar">S</div>
                    <div className="chat-bubble bot-bubble loading-dots">
                      <span>.</span><span>.</span><span>.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Field Bottom */}
              <div className="chat-input-bar" style={{borderBottomRightRadius: '16px', borderBottomLeftRadius: '16px', border: 'none', borderTop: '1px solid #e2e8f0', boxShadow: 'none', background: 'transparent'}}>
                <input 
                  type="text" 
                  placeholder="Type your expense..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isChatLoading}
                />
                <button className="chat-send-btn" onClick={handleSend} disabled={isChatLoading}>→</button>
              </div>

            </div>

            {/* Manual Form Section (Right Column) */}
            <div className="expense-form-card" style={{flex: 1, margin: 0, height: 'max-content', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'}}>
              <div className="expense-form-header">
                <div className="expense-icon-badge" style={{background: '#f8fafc', color: '#0f1c40'}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <h2 className="expense-title">Expense Details</h2>
                  <p className="expense-subtitle">AI fills this automatically, or edit manually</p>
                </div>
              </div>

              <div className="expense-divider"></div>

              {/* Amount */}
              <div className="expense-amount-section">
                <label className="expense-label">Amount</label>
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
                  <label className="expense-label">Paid By</label>
                  <input
                    type="text"
                    className="expense-input"
                    placeholder="Who paid?"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                  />
                </div>

                <div className="expense-field">
                  <label className="expense-label">Split Between</label>
                  <input
                    type="text"
                    className="expense-input"
                    placeholder="Names separated by comma"
                    value={splitBetween}
                    onChange={(e) => setSplitBetween(e.target.value)}
                  />
                </div>
              </div>

              {/* Member chips preview */}
              {memberList.length > 0 && (
                <div className="split-preview" style={{marginTop: '20px'}}>
                  <div className="split-preview-header">
                    <span className="split-preview-label" style={{fontSize: '0.75rem', fontWeight:'700'}}>SPLIT BREAKDOWN</span>
                    {perPerson && (
                      <span className="split-per-person" style={{fontWeight: '800'}}>₹{perPerson} / person</span>
                    )}
                  </div>
                  <div className="split-chips">
                    {memberList.map((name, i) => (
                      <div key={i} className="split-chip">
                        <span className="split-chip-avatar">{name.charAt(0).toUpperCase()}</span>
                        <span className="split-chip-name">{name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="expense-field" style={{marginTop: '20px'}}>
                <label className="expense-label">Notes</label>
                <textarea
                  className="expense-textarea"
                  placeholder="e.g. Dinner with the team..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Submit */}
              <button
                className="expense-submit-btn"
                style={{marginTop: '30px', width: '100%', padding: '16px', background: '#0b132b', borderRadius: '12px'}}
                onClick={handleSubmit}
                disabled={loading || !amount || !paidBy || !splitBetween}
              >
                {loading ? "Saving..." : "Save Expense to Ledger"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default UnifiedAddExpense;
