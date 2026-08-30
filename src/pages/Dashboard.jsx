import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { getHistory, getStats } from '../api';

/**
 * Dashboard & History Page (Priority 4)
 * Shows global threat stats and chronological recent scan records with rich empty and loading states.
 */
export default function Dashboard({ onSelectScan, onNewScan }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total_scans: 0, high_risk: 0, top_category: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [historyData, statsData] = await Promise.all([
          getHistory(20),
          getStats()
        ]);
        setHistory(historyData || []);
        setStats(statsData || { total_scans: 0, high_risk: 0, top_category: null });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const highRiskPercentage = stats.total_scans > 0 
    ? Math.round((stats.high_risk / stats.total_scans) * 100)
    : 0;

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="page-title">Threat Intel & History</h1>
        <p className="page-subtitle">
          Real-time threat analytics and historical archive of analyzed phishing & scam messages.
        </p>
      </div>

      {/* 3-4 Stat Cards */}
      <div className="stats-grid">
        <StatCard
          label="Total Analyzed Scans"
          value={isLoading ? '...' : stats.total_scans}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          }
          trend="+18% this week"
        />

        <StatCard
          label="High/Critical Risk Ratio"
          value={isLoading ? '...' : `${highRiskPercentage}%`}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--risk-crit)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          }
          trend={`${stats.high_risk} flagged threats`}
        />

        <StatCard
          label="Top Scam Vector"
          value={isLoading ? '...' : (stats.top_category || 'Banking Phishing')}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--risk-mod)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
          trend="Primary attack method"
        />
      </div>

      {/* History Table or Empty State */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem' }}>Recent Scans</h2>
        {history.length > 0 && (
          <button className="btn btn-secondary" onClick={onNewScan} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            + New Scan
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem', width: '28px', height: '28px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading threat history...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h3 className="empty-title">No Scans Recorded Yet</h3>
          <p className="empty-desc">
            You haven't scanned any messages yet. Start your first scan to generate an explainable threat report.
          </p>
          <button className="btn btn-primary" onClick={onNewScan}>
            Scan a Message Now
          </button>
        </div>
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Message Snippet</th>
                <th>Threat Level</th>
                <th>Scam Type</th>
                <th>Risk Score</th>
                <th>Scanned Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr
                  key={item._id}
                  style={{ cursor: onSelectScan ? 'pointer' : 'default' }}
                  onClick={() => onSelectScan && onSelectScan(item)}
                  title="Click to view details"
                >
                  <td>
                    <div className="text-truncate" style={{ maxWidth: '340px' }}>
                      {item.text}
                    </div>
                  </td>
                  <td>
                    <RiskBadge level={item.risk_level} />
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {item.scam_type || 'Unclassified'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      color: item.risk_score >= 80 ? 'var(--risk-crit)' : item.risk_score >= 50 ? 'var(--risk-mod)' : 'var(--risk-low)'
                    }}>
                      {item.risk_score}/100
                    </span>
                  </td>
                  <td>
                    <span className="history-timestamp">{formatTimestamp(item.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
