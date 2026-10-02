import React, { useState } from 'react';
import { signup } from '../api';

export default function Signup({ onSignupSuccess, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      await signup(email, password);
      setSuccess(true);
      // Wait briefly, then switch to login view so user can log in
      setTimeout(() => {
        onSignupSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to sign up.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--teal-primary)', marginBottom: '1rem' }}>Account Created!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Your account has been successfully created.</p>
        <button onClick={onSignupSuccess} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Sign up to start detecting threats securely.</p>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--red-primary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white' }}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: 'var(--teal-primary)', cursor: 'pointer', padding: 0, font: 'inherit', textDecoration: 'underline' }}>
          Log in
        </button>
      </div>
    </div>
  );
}
