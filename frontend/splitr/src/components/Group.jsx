import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Group.css";

function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const memberList = members
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m !== "");

  const handleCreate = async () => {
    if (!groupName.trim()) {
      return alert("Enter group name");
    }

    if (memberList.length === 0) {
      return alert("Enter at least one member");
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
          members: memberList,
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
          <p className="subtitle">Start splitting expenses smartly with your crew</p>
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

        <div className="form-group">
          <label>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Members
          </label>
          <input
            type="text"
            placeholder="Sahil, Rahul, Amit"
            value={members}
            onChange={(e) => setMembers(e.target.value)}
          />
          <span className="hint">Separate names with commas</span>
        </div>

        {/* Member preview chips */}
        {memberList.length > 0 && (
          <div className="member-preview">
            {memberList.map((name, i) => (
              <span key={i} className="member-chip">
                <span className="chip-avatar">{name.charAt(0).toUpperCase()}</span>
                {name}
              </span>
            ))}
          </div>
        )}

        <button
          className="create-btn"
          onClick={handleCreate}
          disabled={loading}
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