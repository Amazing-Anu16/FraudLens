import React from 'react';

/**
 * Navbar component with glowing cybersecurity shield logo, page links, and live backend indicator.
 */
export default function Navbar({ activePage, onNavigate }) {
  const isLiveBackend = Boolean(import.meta.env.VITE_API_URL);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="brand-logo" onClick={() => onNavigate('landing')}>
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="brand-text">
            Fraud<span>Lens</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            id="nav-home"
            className={`nav-link ${activePage === 'landing' ? 'active' : ''}`}
            onClick={() => onNavigate('landing')}
          >
            Home
          </button>
          <button
            id="nav-analyze"
            className={`nav-link ${activePage === 'analyze' || activePage === 'results' ? 'active' : ''}`}
            onClick={() => onNavigate('analyze')}
          >
            Analyze
          </button>
          <button
            id="nav-dashboard"
            className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
            onClick={() => onNavigate('dashboard')}
          >
            Threat Intel
          </button>

          <div className="backend-pill" title={isLiveBackend ? `Connected to ${import.meta.env.VITE_API_URL}` : 'Running on Mock Engine'}>
            <span className="backend-dot" style={{ background: isLiveBackend ? '#22C55E' : '#00D9C0' }} />
            <span>{isLiveBackend ? 'LIVE API' : 'MOCK ENGINE'}</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
