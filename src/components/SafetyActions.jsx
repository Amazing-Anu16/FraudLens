import React from 'react';

/**
 * SafetyActions: Two-column layout contrasting immediate DO NOT vs DO safety steps.
 * @param {{ do_not: string[], do: string[] }} safetyActions
 */
export default function SafetyActions({ safetyActions }) {
  const doNotList = safetyActions?.do_not || [];
  const doList = safetyActions?.do || [];

  return (
    <div className="safety-actions-section">
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <h3 style={{ fontSize: '1.25rem' }}>Immediate Safety Protocol</h3>
      </div>

      <div className="safety-grid">
        {/* DO NOT Column (Left - Red Tinted) */}
        <div className="action-column do-not">
          <h4 className="action-column-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            DO NOT
          </h4>
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
        </div>

        {/* DO Column (Right - Teal/Green Tinted) */}
        <div className="action-column do">
          <h4 className="action-column-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            RECOMMENDED ACTIONS (DO)
          </h4>
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
        </div>
      </div>
    </div>
  );
}
