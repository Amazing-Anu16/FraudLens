import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Analyze from './pages/Analyze';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import { analyzeMessage } from './api';

export default function App() {
  const [activePage, setActivePage] = useState('landing');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzedText, setAnalyzedText] = useState('');

  const handleAnalysisComplete = (data, text) => {
    setAnalysisResult(data);
    setAnalyzedText(text);
    setActivePage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScanAgain = () => {
    setAnalysisResult(null);
    setAnalyzedText('');
    setActivePage('analyze');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectHistoricalScan = async (item) => {
    try {
      const data = await analyzeMessage(item.text);
      setAnalysisResult(data);
      setAnalyzedText(item.text);
      setActivePage('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setActivePage('analyze');
    }
  };

  return (
    <div className="app-container">
      <Navbar activePage={activePage} onNavigate={(page) => setActivePage(page)} />

      <main className="main-content">
        {activePage === 'landing' && (
          <Landing onGetStarted={() => setActivePage('analyze')} />
        )}

        {activePage === 'analyze' && (
          <Analyze onAnalysisComplete={handleAnalysisComplete} />
        )}

        {activePage === 'results' && (
          <Results
            analysisData={analysisResult}
            originalText={analyzedText}
            onScanAgain={handleScanAgain}
          />
        )}

        {activePage === 'dashboard' && (
          <Dashboard
            onSelectScan={handleSelectHistoricalScan}
            onNewScan={() => setActivePage('analyze')}
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
