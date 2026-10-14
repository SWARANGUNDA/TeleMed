import React from 'react';

export function CircularProgress({
  value = 0,
  size = 64,
  strokeWidth = 6,
  variant = 'primary',
  label,
  showLabel = true,
  children,
  className = ''
}) {
  const pct = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const colorMap = {
    primary: 'var(--primary, #6366f1)',
    secondary: 'var(--secondary, #8b5cf6)',
    success: 'var(--success, #10b981)',
    warning: 'var(--warning, #f59e0b)',
    danger: 'var(--danger, #ef4444)',
    rose: '#f43f5e',
    emerald: '#10b981',
    amber: '#f59e0b',
    indigo: '#6366f1',
    violet: '#8b5cf6',
    cyan: '#06b6d4',
  };

  const strokeColor = colorMap[variant] || variant || colorMap.primary;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border-medium, rgba(150, 150, 150, 0.2))"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-25"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          {children}
        </div>
      ) : showLabel && label !== false && label !== '' ? (
        <span className="absolute font-mono text-xs font-bold text-[var(--text-main)] pointer-events-none">
          {label !== undefined && label !== null ? label : `${Math.round(pct)}%`}
        </span>
      ) : null}
    </div>
  );
}
