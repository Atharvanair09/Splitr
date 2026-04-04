import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';

function Signup({ onNavigate, onLoginSuccess }) {
  const signup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Get user info from Google
        const userInfoRes = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const googleUser = await userInfoRes.json();

        // Send to backend
        const response = await fetch(
          'http://localhost:5000/api/auth/google',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              googleId: googleUser.sub,
              email: googleUser.email,
              name: googleUser.name,
              picture: googleUser.picture,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Signup failed');
        }

        // Callback
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.token);
        }

      } catch (err) {
        console.error("Signup flow error:", err);
        alert("Signup failed");
      }
    },

    onError: (error) => {
      console.error('Google Signup Error:', error);
      alert("Google signup failed");
    },
  });

  return (
    <div className="auth-container">
      <svg className="shield-watermark" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>

      <h2 className="auth-title">Initialize Account</h2>
      <p className="auth-subtitle">
        Begin your expense splitting journey.
      </p>

      <form>
        <div style={{ margin: '2rem 0' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={() => signup()}
            style={{
              background: '#ffffff',
              color: '#0B132B',
              border: '1px solid #E2E8F0',
              fontWeight: 800,
              display: 'flex',
              gap: '12px',
            }}
          >
            Sign up with Google
          </button>
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="terms"
            className="custom-checkbox"
            defaultChecked
          />
          <label htmlFor="terms" className="checkbox-label">
            I agree to the terms and conditions
          </label>
        </div>
      </form>

      <div className="login-link-container">
        <span className="login-link">
          Already have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("login");
            }}
          >
            Login
          </a>
        </span>
      </div>
    </div>
  );
}

export default Signup;
