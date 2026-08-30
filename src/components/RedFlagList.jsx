import React from 'react';

/**
 * RedFlagList renders a categorized list of detected warning signs with high-visibility alert icons.
 * @param {string[]} flags - Array of red flag strings
 */
export default function RedFlagList({ flags = [] }) {
  if (!flags || flags.length === 0) {
    return (
      <div className="card flags-card">
        <h3 className="card-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--risk-low)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          Detected Red Flags
        </h3>
        <p style={{ color: 'var(--text-muted)' }}>No high-risk red flags detected in this message.</p>
      </div>
    );
  }

  return (
    <div className="card flags-card">
      <h3 className="card-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--risk-high)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Detected Red Flags ({flags.length})
      </h3>
      <ul className="red-flags-list">
        {flags.map((flag, index) => (
          <li key={index} className="flag-item">
            <div className="flag-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <span>{flag}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
