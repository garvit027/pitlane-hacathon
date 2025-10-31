// src/components/AuthGuard.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

function AuthGuard({ children, fallback = null, requireAuth = true }) {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    return fallback || (
      <div className="auth-required">
        <div className="auth-prompt">
          <div className="auth-icon">🔐</div>
          <h3>Authentication Required</h3>
          <p>Please connect your wallet to access this feature</p>
          <div className="auth-features">
            <div className="feature">✓ Anti-bot protection</div>
            <div className="feature">✓ Secure transactions</div>
            <div className="feature">✓ Exclusive content</div>
          </div>
        </div>
      </div>
    );
  }

  // If authentication is NOT required but user IS logged in (reverse guard)
  if (!requireAuth && user) {
    return fallback || (
      <div className="already-authenticated">
        <div className="auth-notice">
          <div className="notice-icon">✅</div>
          <h3>Already Connected</h3>
          <p>You are already authenticated with your wallet</p>
        </div>
      </div>
    );
  }

  // User meets the authentication requirements
  return children;
}

export default AuthGuard;