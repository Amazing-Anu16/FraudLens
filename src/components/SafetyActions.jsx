import React from 'react';

/**
 * SafetyActions: Two-column layout displaying context-specific DO NOT vs DO safety recommendations.
 * @param {{ do_not: string[], do: string[] }} safetyActions
 * @param {string} scamType
 * @param {string} riskLevel
 */
export default function SafetyActions({ safetyActions, scamType, riskLevel }) {
  const doNotList = safetyActions?.do_not || [];
  const doList = safetyActions?.do || [];

  return (
    <div className="safety-actions-section card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      {/* Header with Title and Category Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--teal-subtle)',
            border: '1px solid rgba(0, 217, 192, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--teal-primary)'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: '1.3rem', margin: 0, color: 'var(--text-primary)' }}>
              Context-Specific Safety Recommendations
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Tailored response protocol generated from analyzed message patterns & context
            </p>
          </div>
        </div>

        {scamType && scamType !== 'Unclassified' && (
          <div className="scam-context-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0, 217, 192, 0.1)',
            border: '1px solid rgba(0, 217, 192, 0.3)',
            fontSize: '0.8rem',
            color: 'var(--teal-primary)',
            fontWeight: 600
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Context: {scamType}
          </div>
        )}
      </div>

      {/* Two-Column Grid: Prohibited (DO NOT) vs Recommended (DO) */}
      <div className="safety-grid" style={{ marginBottom: 0 }}>
        {/* DO NOT Column (Red Tinted) */}
        <div className="action-column do-not">
          <div className="action-column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h4 className="action-column-title" style={{ margin: 0, padding: 0, border: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              PROHIBITED ACTIONS (DO NOT)
            </h4>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: 'var(--risk-crit)'
            }}>
              {doNotList.length}
            </span>
          </div>

          {doNotList.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
              No critical emergency prohibitions flagged for this message.
            </div>
          ) : (
            <ul className="action-list">
              {doNotList.map((action, index) => (
                <li key={index} className="action-item">
                  <div className="action-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </div>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* DO Column (Teal/Green Tinted) */}
        <div className="action-column do">
          <div className="action-column-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(0, 217, 192, 0.2)' }}>
            <h4 className="action-column-title" style={{ margin: 0, padding: 0, border: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              RECOMMENDED ACTIONS (DO)
            </h4>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '10px',
              background: 'rgba(0, 217, 192, 0.2)',
              color: 'var(--teal-primary)'
            }}>
              {doList.length}
            </span>
          </div>

          {doList.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic', padding: '0.5rem 0' }}>
              Verify unexpected communications through official, known channels.
            </div>
          ) : (
            <ul className="action-list">
              {doList.map((action, index) => (
                <li key={index} className="action-item">
                  <div className="action-item-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
