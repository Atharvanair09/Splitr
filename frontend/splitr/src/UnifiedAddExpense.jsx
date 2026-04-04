import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import './Activity.css';
import './components/AddExpense.css';

function UnifiedAddExpense({ user, onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();

  // --- MANUAL FORM STATE ---
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitBetween, setSplitBetween] = useState("");
  const [splitDetails, setSplitDetails] = useState([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(id || "");
  const [groupMembers, setGroupMembers] = useState([]);

  // 1. Fetch available groups on mount
  React.useEffect(() => {
    if (user?.name) {
      fetch(`http://localhost:5000/group/user/${user.name}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
             setUserGroups(data);
             // If we're coming from a specific group, pre-select it
             if (id) {
                setSelectedGroupId(id);
             } else if (data.length > 0) {
                // If not, default to the first group
                setSelectedGroupId(data[0]._id);
             }
          }
        })
        .catch(err => console.error("Error fetching user groups:", err));
    }
  }, [user?.name, id]);

  // 2. Fetch members of the selected group
  React.useEffect(() => {
    if (selectedGroupId && selectedGroupId !== "1") {
      fetch(`http://localhost:5000/group/${selectedGroupId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.members) setGroupMembers(data.members);
        })
        .catch(err => console.error("Error fetching group members:", err));
    }
  }, [selectedGroupId]);

  const memberList = splitBetween
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m !== "");
  
  const perPerson = memberList.length > 0 && amount
    ? (parseFloat(amount) / memberList.length).toFixed(2)
    : null;

  // 3. Filter groups based on the "Split Between" member list
  const filteredGroups = React.useMemo(() => {
    if (memberList.length === 0) return userGroups;
    return userGroups.filter(group => {
      // Check if every member in the AI list is found in this group's members
      return memberList.every(person => 
        group.members.some(m => m.toLowerCase() === person.toLowerCase() || m.toLowerCase().includes(person.toLowerCase()))
      );
    });
  }, [userGroups, memberList]);

  // --- CHAT STATE ---
  const [messages, setMessages] = useState([
    { role: 'bot', type: 'text', text: "Hey! Tell me about an expense to split — just type naturally. I'll auto-fill the form for you!" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- VOICE INPUT STATE ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = inputValue;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      setInputValue(finalTranscript + (interimTranscript ? ' ' + interimTranscript : ''));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [inputValue]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleVoiceInput = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

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
            content: `You are an AI expense parser for the app "Splitr".
Your goal is to extract expense details from natural language and return a structured JSON.

--- CONTEXT ---
Currently logged in user is: "${user?.name || 'Unknown User'}".
${id ? `The user is adding an expense to the group: "${id}". 
The group members are: ${groupMembers.join(", ")}. 
Try to map any mentioned names in the input to these specific members.` : "No group context provided yet."}

--- RULES ---
1. Extract "amount", "title", "paidBy", and "between".
2. IMPORTANT: If the user uses first-person pronouns (e.g., "I paid", "me", "my share"), map them TO THE CURRENT USER'S NAME: "${user?.name}".
3. If the user describes an uneven split (e.g. "I paid 1000, Rahul owes 200, Amit owes 800"), calculate individual amounts.
3. If they say "split equally", divide the amount among the "between" list.
4. "paidBy" must be ONE name. "between" must be an ARRAY of names.
5. Return ONLY valid JSON:
{
  "category": "e.g. DINING, TRAVEL, GROCERIES",
  "amount": number,
  "currency": "₹",
  "title": "short relevant title",
  "confidence": number 0-100,
  "paidBy": "string (name)",
  "splitType": "Uneven" or "Equal",
  "between": ["name1", "name2"],
  "splitDetails": [
    {"name": "name1", "amount": 200},
    {"name": "name2", "amount": 800}
  ]
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
      if(parsed.splitDetails && Array.isArray(parsed.splitDetails)) setSplitDetails(parsed.splitDetails);
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
    if (!amount || !paidBy || !splitBetween || !selectedGroupId) {
      return alert("Please ensure Group, Amount, Paid By, and Split Between fields are correctly filled.");
    }
    
    const groupId = selectedGroupId;

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
          splitDetails: splitDetails.length > 0 ? splitDetails : memberList.map(name => ({ name, amount: parseFloat(perPerson) })),
          notes,
        }),
      });

      if (!res.ok) throw new Error();

      if(groupId) {
         navigate(`/dashboard/${groupId}`);
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
              <img 
                src={user?.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                alt="Profile" 
              />
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
                              <label>Breakdown</label>
                              <div className="epc-value">
                                {d.splitDetails?.map((item, idx) => (
                                  <div key={idx} style={{fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', width: '100%'}}>
                                    <span>{item.name}:</span>
                                    <span style={{fontWeight: '700'}}>{d.currency || "₹"}{item.amount}</span>
                                  </div>
                                ))}
                              </div>
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
              <div className="chat-input-bar" style={{borderBottomRightRadius: '16px', borderBottomLeftRadius: '16px', border: 'none', borderTop: '1px solid #e2e8f0', boxShadow: 'none', background: 'transparent', display: 'flex', alignItems: 'center'}}>
                <button 
                  className={`chat-voice-btn ${isListening ? 'listening' : ''}`}
                  title={isListening ? "Stop Voice Input" : "Voice Input (Hackathon Mode)"}
                  onClick={toggleVoiceInput}
                  disabled={isChatLoading}
                >
                  {isListening ? '🔴' : '🎤'}
                </button>
                <input 
                  type="text" 
                  placeholder={id ? `Splitting in "${id}"...` : "Type your expense..."} 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isChatLoading}
                  style={{paddingLeft: '10px'}}
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

              {/* Group Selection */}
              <div className="expense-field" style={{marginBottom: '20px'}}>
                <label className="expense-label">Target Group</label>
                <select 
                  className="expense-input" 
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  style={{width: '100%', appearance: 'auto', padding: '10px'}}
                >
                  <option value="" disabled>Select a group...</option>
                  {filteredGroups.map(g => (
                    <option key={g._id} value={g._id}>{g.name}</option>
                  ))}
                </select>
                {memberList.length > 0 && filteredGroups.length === 0 && (
                  <span style={{fontSize: '0.65rem', color: '#ef4444', fontWeight: 600, marginTop: '4px'}}>
                    ⚠ No groups found with all these members!
                  </span>
                )}
                {id && (
                  <span style={{fontSize: '0.65rem', color: '#10B981', fontWeight: 600, marginTop: '4px'}}>
                    ✓ Auto-selected from Group Page
                  </span>
                )}
              </div>

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
                    {memberList.map((name, i) => {
                      const individualDetail = splitDetails.find(d => d.name.toLowerCase() === name.toLowerCase());
                      return (
                        <div key={i} className="split-chip" style={{flexDirection: 'column', height: 'auto', padding: '10px'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', width: '100%'}}>
                            <span className="split-chip-avatar">{name.charAt(0).toUpperCase()}</span>
                            <span className="split-chip-name">{name}</span>
                          </div>
                          {individualDetail && (
                            <div style={{fontSize: '0.7rem', fontWeight: '800', color: '#4361EE', marginTop: '5px'}}>
                              OWES: ₹{individualDetail.amount}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
                {loading ? "Saving..." : "Save Expense"}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default UnifiedAddExpense;
