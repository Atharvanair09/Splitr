import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Group.css";

function CreateGroup({ user }) {
  const [groupName, setGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (user?._id) {
      fetch(`http://localhost:5000/api/users/friends/${user._id}`)
        .then(res => res.json())
        .then(data => setFriends(data))
        .catch(err => console.error("Error fetching friends:", err));
    }
  }, [user?._id]);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      return alert("Enter group name");
    }

    // Members list: Current user + selected friends
    const finalMembers = [user.name, ...selectedFriends.map(f => f.name)];

    if (finalMembers.length < 2) {
      return alert("Add at least one friend to the group");
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/group/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: groupName,
          members: finalMembers,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create group");
      }

      const data = await res.json();
      localStorage.setItem("groupId", data._id);
      navigate(`/dashboard/${data._id}`);
    } catch (err) {
      console.error(err);
      alert("Error creating group");
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friend) => {
    if (selectedFriends.some(f => f._id === friend._id)) {
      setSelectedFriends(selectedFriends.filter(f => f._id !== friend._id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  return (
    <div className="create-group-container">
      <div className="create-group-card">

        {/* Back button */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="group-form-header">
          <div className="group-icon-badge">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h2 className="title">Create New Group</h2>
          <p className="subtitle">Only followed friends can be added to the group</p>
        </div>

        {/* Divider */}
        <div className="form-divider"></div>

        {/* Form */}
        <div className="form-group">
          <label>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Group Name
          </label>
          <input
            type="text"
            placeholder="e.g. Goa Trip 🏖️"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
        </div>

        {/* Friends Selection */}
        <div className="friends-selection">
          <label className="friends-label">
            {friends.length > 0 ? "Select Friends to Add" : "No friends found. Follow users in Settings first."}
          </label>
          {friends.length > 0 ? (
            <div className="friends-list-mini">
              {friends.map(friend => {
                const isSelected = selectedFriends.some(f => f._id === friend._id);
                return (
                  <div 
                    key={friend._id} 
                    className={`friend-selectable ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleFriend(friend)}
                  >
                    <img 
                      src={friend.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} 
                      alt={friend.name} 
                    />
                    <span>{friend.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <button 
              className="back-btn" 
              onClick={() => navigate('/settings')}
              style={{marginTop: '5px', padding: '10px', background: '#eff6ff', color: '#1d4ed8'}}
            >
              Go to Settings to find friends
            </button>
          )}
        </div>

        {/* Members Label */}
        <div className="form-group" style={{marginBottom: '10px'}}>
             <label>
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                 <circle cx="12" cy="7" r="4" />
               </svg>
               Group Members
             </label>
        </div>

        {/* Member preview chips */}
        <div className="member-preview">
          {/* Always include current user */}
          <span className="member-chip" style={{borderColor: '#4361EE', background: '#EEF2FF'}}>
            <span className="chip-avatar">YOU</span>
            {user?.name} (Admin)
          </span>
          
          {selectedFriends.map((friend) => (
            <span key={friend._id} className="member-chip">
              <span className="chip-avatar">{friend.name.charAt(0).toUpperCase()}</span>
              {friend.name}
            </span>
          ))}
        </div>

        <button
          className="create-btn"
          onClick={handleCreate}
          disabled={loading || friends.length === 0}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Creating...
            </>
          ) : (
            <>
              Create Group
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>

      </div>
    </div>
  );
}

export default CreateGroup;