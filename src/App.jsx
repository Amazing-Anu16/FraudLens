import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Analyze from './pages/Analyze';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { analyzeMessage } from './api';

export default function App() {
  const [activePage, setActivePage] = useState('landing');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzedText, setAnalyzedText] = useState('');
  
  // Authentication State
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Read auth state on load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (e) {
        // Handle malformed JSON
        handleLogout();
      }
    }
  }, []);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAnalysisResult(null);
    setAnalyzedText('');
    setActivePage('landing');
  };

  const requireAuth = (page) => {
    if (!isAuthenticated) {
      setActivePage('login');
    } else {
      setActivePage(page);
    }
  };

  const handleNavigation = (page) => {
    if (['analyze', 'dashboard', 'results'].includes(page)) {
      requireAuth(page);
    } else {
      setActivePage(page);
    }
  };

  const handleAuthError = (err) => {
    if (err && err.status === 401) {
      handleLogout();
    }
  };

  const handleAnalysisComplete = (data, text) => {
    setAnalysisResult(data);
    setAnalyzedText(text);
    setActivePage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScanAgain = () => {
    setAnalysisResult(null);
    setAnalyzedText('');
    requireAuth('analyze');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistoricalScan = async (item) => {
    try {
      const data = await analyzeMessage(item.text);
      setAnalysisResult(data);
      setAnalyzedText(item.text);
      setActivePage('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      handleAuthError(err);
      if (isAuthenticated) setActivePage('analyze');
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        activePage={activePage} 
        onNavigate={handleNavigation} 
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {activePage === 'landing' && (
          <Landing onGetStarted={() => handleNavigation('analyze')} />
        )}

        {activePage === 'login' && (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setActivePage('signup')}
          />
        )}

        {activePage === 'signup' && (
          <Signup 
            onSignupSuccess={() => setActivePage('login')}
            onSwitchToLogin={() => setActivePage('login')}
          />
        )}

        {activePage === 'analyze' && isAuthenticated && (
          <Analyze 
            onAnalysisComplete={handleAnalysisComplete} 
            onAuthError={handleAuthError} 
          />
        )}

        {activePage === 'results' && isAuthenticated && (
          <Results
            analysisData={analysisResult}
            originalText={analyzedText}
            onScanAgain={handleScanAgain}
          />
        )}

        {activePage === 'dashboard' && isAuthenticated && (
          <Dashboard
            onSelectScan={handleSelectHistoricalScan}
            onNewScan={() => handleNavigation('analyze')}
            onAuthError={handleAuthError}
          />
        )}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <strong>FraudLens</strong> — Explainable Scam & Phishing Detection
          </div>
          <div>
            "See the red flags before you take the risk."
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            v0.1.0 MVP
          </div>
        </div>
      </footer>
    </div>
  );
}
