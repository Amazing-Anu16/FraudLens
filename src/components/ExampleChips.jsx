import React from 'react';

const EXAMPLES = [
  {
    id: 'banking',
    label: 'Banking Phishing',
    tag: 'Phishing',
    text: 'Dear customer, your SBI account has been suspended due to pending PAN KYC. Click bit.ly/sbi-kyc-update to verify immediately or account will be blocked within 24 hours.'
  },
  {
    id: 'upi',
    label: 'UPI Payment Scam',
    tag: 'UPI',
    text: 'You have won a cash prize of Rs. 50,000 from Flipkart Lucky Draw! To claim your reward, send your UPI ID and approve the Rs. 5 verification request on PhonePe.'
  },
  {
    id: 'job',
    label: 'Job Offer Scam',
    tag: 'Job/Work',
    text: 'Work from home part-time opportunity! Earn Rs 3,000 to Rs 8,000 daily by liking YouTube videos and Google reviews. No experience required. Join our Telegram: t.me/jobshub77'
  },
  {
    id: 'kyc',
    label: 'Electricity / KYC Scam',
    tag: 'Utility',
    text: 'Electricity Power Alert: Your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Contact electricity officer at 9876543210 immediately.'
  }
];

/**
 * ExampleChips allows judges and users to quickly load sample scam texts with one click.
 */
export default function ExampleChips({ onSelectExample }) {
  return (
    <div className="chips-container">
      <div className="chips-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <span>Quick Test Samples (Click to load):</span>
      </div>
      <div className="chips-grid">
        {EXAMPLES.map((example) => (
          <button
            key={example.id}
            type="button"
            className="example-chip"
            onClick={() => onSelectExample(example.text)}
            title={`Load ${example.label} example`}
          >
            <span className="chip-tag">{example.tag}</span>
            <span>{example.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
