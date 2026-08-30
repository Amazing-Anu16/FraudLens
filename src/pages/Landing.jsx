import React from 'react';

/**
 * Landing Page (Priority 3)
 * High-impact hero screen introducing FraudLens with 3 core value props and direct CTA to Analyze.
 */
export default function Landing({ onGetStarted }) {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Next-Gen AI Scam Intelligence
        </div>

        <h1 className="hero-title">
          See the red flags <span>before you take the risk.</span>
        </h1>

        <p className="hero-subtitle">
          FraudLens breaks down phishing messages, fake KYC alerts, lottery claims, and fraudulent UPI requests into clear risk scores and immediate safety actions.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            id="hero-cta-btn"
            className="btn btn-primary"
            onClick={onGetStarted}
            style={{ padding: '1rem 2.25rem', fontSize: '1.1rem' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Analyze Suspicious Message
          </button>
        </div>
      </section>

      {/* 3 Feature Highlight Cards */}
      <section className="features-grid">
        <div className="card feature-card">
          <div className="feature-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <h3 className="feature-title">Explainable Risk Scoring</h3>
          <p className="feature-desc">
            Get an instant 0–100 threat score based on urgency triggers, domain forensics, credential lures, and known fraud patterns.
          </p>
        </div>

        <div className="card feature-card">
          <div className="feature-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h3 className="feature-title">Instant Scam Classification</h3>
          <p className="feature-desc">
            Identifies exact scam typologies including Banking Phishing, UPI Collect traps, Part-Time Job schemes, and Fake Utility KYC.
          </p>
        </div>

        <div className="card feature-card">
          <div className="feature-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <h3 className="feature-title">Clear Next-Step Playbooks</h3>
          <p className="feature-desc">
            Actionable two-column guidance outlining exactly what critical mistakes to avoid (DO NOT) and safe protective protocols (DO).
          </p>
        </div>
      </section>
    </div>
  );
}
