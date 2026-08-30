import React from 'react';

/**
 * StatCard displays key cybersecurity threat intelligence metrics.
 */
export default function StatCard({ label, value, icon, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && (
          <div style={{ fontSize: '0.75rem', color: 'var(--teal-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
