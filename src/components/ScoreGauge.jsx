import React, { useEffect, useState } from 'react';

/**
 * ScoreGauge: Circular SVG gauge with animated stroke fill and JetBrains Mono score display.
 * @param {number} score - Threat score (0-100)
 * @param {('LOW'|'MODERATE'|'HIGH'|'CRITICAL')} riskLevel
 */
export default function ScoreGauge({ score = 0, riskLevel = 'LOW' }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // SVG dimensions
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  // Resolve color based on riskLevel
  const getColor = (level) => {
    switch ((level || '').toUpperCase()) {
      case 'CRITICAL':
        return '#EF4444';
      case 'HIGH':
        return '#F97316';
      case 'MODERATE':
        return '#EAB308';
      case 'LOW':
      default:
        return '#22C55E';
    }
  };

  const strokeColor = getColor(riskLevel);

  useEffect(() => {
    // Smooth number animation
    let start = 0;
    const end = Math.min(100, Math.max(0, score));
    const duration = 1200; // ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="gauge-container" role="img" aria-label={`Risk score ${score} out of 100`}>
      <svg className="gauge-svg" viewBox="0 0 200 200">
        {/* Background track circle */}
        <circle
          className="gauge-bg-circle"
          cx="100"
          cy="100"
          r={radius}
        />
        {/* Animated Progress Circle */}
        <circle
          className="gauge-progress-circle"
          cx="100"
          cy="100"
          r={radius}
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 8px ${strokeColor}66)` }}
        />
      </svg>

      <div className="gauge-center-content">
        <div className="gauge-score-number" style={{ color: strokeColor }}>
          {animatedScore}
        </div>
        <div className="gauge-score-label">RISK INDEX</div>
      </div>
    </div>
  );
}
