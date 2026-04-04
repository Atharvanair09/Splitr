import React, { useMemo, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './InsightsModal.css';

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

const InsightsModal = ({ isOpen, onClose, groups, initialGroupId, expenses, currentUser }) => {
  const [activeGroupId, setActiveGroupId] = useState(initialGroupId);

  useEffect(() => {
    setActiveGroupId(initialGroupId);
  }, [initialGroupId, isOpen]);

  const activeGroup = useMemo(() => groups?.find(g => g._id === activeGroupId), [groups, activeGroupId]);

  const { totalShare, totalPaid, pending, paidMembers, partialMembers, pendingMembers } = useMemo(() => {
    if (!activeGroup || !expenses) return { totalShare: 0, totalPaid: 0, pending: 0, paidMembers: [], partialMembers: [], pendingMembers: [] };

    let tShare = 0;
    let tPaid = 0;
    
    const mData = {};
    activeGroup.members.forEach(m => {
      mData[m.toLowerCase()] = { name: m, paid: 0, share: 0 };
    });

    const currentUserNameLower = currentUser.toLowerCase();

    expenses.forEach(exp => {
      const expGroupId = exp.groupId?._id || exp.groupId;
      if (expGroupId === activeGroup._id) {
        const amount = exp.amount || 0;
        
        // 1. Calculate how much this user paid in this expense
        if (exp.paidBy && exp.paidBy.toLowerCase() === currentUserNameLower) {
          tPaid += amount;
        }

        // 2. Calculate this user's share in this expense
        let userShare = 0;
        if (exp.splitDetails && exp.splitDetails.length > 0) {
           const mySplit = exp.splitDetails.find(d => d.name.toLowerCase() === currentUserNameLower);
           if (mySplit) userShare = mySplit.amount;
        } else if (exp.splitBetween && exp.splitBetween.some(m => m.toLowerCase() === currentUserNameLower)) {
           userShare = amount / exp.splitBetween.length;
        }
        tShare += userShare;

        // 3. Track per-member data for the list below
        const paidByLower = exp.paidBy?.toLowerCase();
        if (paidByLower && mData[paidByLower]) {
          mData[paidByLower].paid += amount;
        }

        if (exp.splitDetails && exp.splitDetails.length > 0) {
          exp.splitDetails.forEach(sd => {
            const nameLower = sd.name.toLowerCase();
            if (mData[nameLower]) mData[nameLower].share += sd.amount;
          });
        } else if (exp.splitBetween) {
          const splitAmt = amount / exp.splitBetween.length;
          exp.splitBetween.forEach(m => {
            if (mData[m.toLowerCase()]) mData[m.toLowerCase()].share += splitAmt;
          });
        }
      }
    });

    let p = Math.max(0, tShare - tPaid);
    
    // Status and progress definition
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

    return { totalShare: tShare, totalPaid: tPaid, pending: p, paidMembers: paidArray, partialMembers: partialArray, pendingMembers: pendingArray };
  }, [activeGroup, expenses, currentUser]);

  if (!isOpen) return null;

  const chartPaid = Math.min(totalPaid, Math.max(totalShare, 1)); 
  const chartPending = pending;

  let data = [];
  if (totalShare === 0 && totalPaid === 0) {
    data = [{ name: 'No Data', value: 1 }];
  } else {
    data = [
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

  return (
    <div className="insight-modal-overlay" onClick={onClose}>
      <div className="insight-modal-content" onClick={e => e.stopPropagation()}>
        <div className="insight-modal-header">
          <h2>Your financial insights</h2>
          <button className="insight-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {groups && groups.length > 0 && (
          <div className="insight-dropdown-wrapper">
            <select 
              className="insight-dropdown"
              value={activeGroupId || ''} 
              onChange={(e) => setActiveGroupId(e.target.value)}
            >
              {groups.map(g => (
                <option key={g._id} value={g._id}>{g.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="insight-chart-container">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="insight-center-text">
            <div className="insight-center-amount">₹{totalShare.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="insight-center-label">your share</div>
          </div>
        </div>

        <div className="insight-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#10B981' }}></span>
            Paid {totalPaid > 0 ? `— ₹${totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${paidPercentage}%)` : ''}
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#EF4444' }}></span>
            Remaining {pending > 0 ? `— ₹${pending.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${remainingPercentage}%)` : ''}
          </div>
        </div>

        <div className="insight-summary-cards">
          <div className="summary-card">
            <div className="summary-label">Already paid</div>
            <div className="summary-value" style={{ color: '#10B981' }}>₹{totalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Still owe</div>
            <div className="summary-value" style={{ color: '#EF4444' }}>₹{pending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>

        {activeGroup && (paidMembers.length > 0 || partialMembers.length > 0 || pendingMembers.length > 0) && (
          <div className="insight-members-list">
            
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
            
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsModal;
