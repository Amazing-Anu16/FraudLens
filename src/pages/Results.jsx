import React, { useState } from 'react';
import ScoreGauge from '../components/ScoreGauge';
import RiskBadge from '../components/RiskBadge';
import RedFlagList from '../components/RedFlagList';
import SafetyActions from '../components/SafetyActions';

/**
 * Results Page (Priority 2 - Most Important Screen)
 * Displays full explainable scam diagnostic report matching the API contract.
 */
export default function Results({ analysisData, originalText, onScanAgain }) {
  const [copied, setCopied] = useState(false);

  // Fallback safe values if opened directly
  const data = analysisData || {
    risk_score: 95,
    risk_level: "CRITICAL",
    scam_type: "Banking Phishing",
    red_flags: [
      "Urgent threat of account suspension within 24 hours",
      "Shortened suspicious URL (bit.ly)",
      "Unsolicited request for sensitive PAN and banking credentials"
    ],
    explanation: "This message uses urgent psychological pressure and fake account suspension threats to trick you into entering banking credentials on a phishing clone page.",
    safety_actions: {
      do_not: [
        "Do not click on the link or download any attachments",
        "Do not share OTP, PIN, NetBanking password, or PAN details"
      ],
      do: [
        "Log into your official banking mobile app directly to check alerts",
        "Forward this SMS to 1930 (National Cyber Crime Helpline)"
      ]
    },
    source: "llm"
  };

  const handleCopySummary = () => {
    const textToCopy = `FraudLens Threat Report:
Risk Score: ${data.risk_score}/100 (${data.risk_level})
Scam Type: ${data.scam_type}
Why: ${data.explanation}
Source: FraudLens AI`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="results-page">
      {/* Header with Scam Type & Navigation */}
      <div className="results-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span className="scam-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--teal-primary)" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              {data.scam_type || 'Unclassified Threat'}
            </span>
            <RiskBadge level={data.risk_level} />
            <span className="backend-pill">
              <span className="backend-dot" />
              Source: {data.source || 'llm'}
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '1.85rem' }}>Threat Assessment Report</h1>
        </div>

        <button className="btn btn-secondary" onClick={onScanAgain}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          Scan Another Message
        </button>
      </div>

      {/* Top Grid: Circular Score Gauge + "Why This Matters" Explanation Card */}
      <div className="results-grid">
        <div className="card overview-card">
          <ScoreGauge score={data.risk_score} riskLevel={data.risk_level} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Calibrated Scam Probability
            </p>
          </div>
        </div>

        <div className="card explanation-card">
          <div>
            <div className="explanation-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Why This Matters
            </div>
            <p className="explanation-text">
              {data.explanation}
            </p>
          </div>

          {originalText && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Analyzed Message Snippet:
              </span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                "{originalText.length > 180 ? originalText.slice(0, 180) + '...' : originalText}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detected Red Flags Section */}
      <RedFlagList flags={data.red_flags} />

      {/* Two-Column Safety Actions (DO NOT vs DO) */}
      <SafetyActions safetyActions={data.safety_actions} />

      {/* Action Footer */}
      <div className="results-footer-actions">
        <button id="scan-again-btn" className="btn btn-primary" onClick={onScanAgain}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Scan Another Message
        </button>

        <button className="btn btn-secondary" onClick={handleCopySummary}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {copied ? 'Summary Copied!' : 'Copy Threat Summary'}
        </button>
      </div>
    </div>
  );
}
