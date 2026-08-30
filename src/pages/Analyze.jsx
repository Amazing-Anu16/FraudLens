import React, { useState } from 'react';
import ExampleChips from '../components/ExampleChips';
import ErrorBanner from '../components/ErrorBanner';
import { analyzeMessage } from '../api';

/**
 * Analyze Page (Priority 1)
 * The main input screen for pasting messages, testing realistic samples, and triggering analysis.
 */
export default function Analyze({ onAnalysisComplete }) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectExample = (sampleText) => {
    setInputText(sampleText);
    setErrorMessage('');
  };

  const handleClear = () => {
    setInputText('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) {
      setErrorMessage('Please enter or paste a message before analyzing.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await analyzeMessage(inputText);
      if (onAnalysisComplete) {
        onAnalysisComplete(result, inputText);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to analyze the message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="analyze-page">
      <div className="page-header text-center" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title">Scan Suspicious Message</h1>
        <p className="page-subtitle">
          Paste any SMS, WhatsApp text, UPI request, or suspicious email to reveal hidden fraud indicators.
        </p>
      </div>

      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage('')} />

        <ExampleChips onSelectExample={handleSelectExample} />

        <form onSubmit={handleSubmit}>
          <div className="textarea-wrapper">
            <textarea
              id="message-input"
              className="scam-textarea"
              placeholder="Paste suspicious SMS, WhatsApp message, email, or UPI payment link here..."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              rows={6}
              disabled={isLoading}
              autoFocus
            />
            <div className="textarea-footer">
              <span>{inputText.length} characters</span>
              {inputText.length > 0 && !isLoading && (
                <button type="button" className="clear-btn" onClick={handleClear}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Clear text
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              id="analyze-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !inputText.trim()}
              style={{ width: '100%', maxWidth: '240px' }}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Analyzing Threat...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <span>Analyze Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
