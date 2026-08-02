import React from 'react';
import { Card, Badge } from '../ui';
import { TrendingUp, CheckCircle2, Activity, AlertCircle } from 'lucide-react';

export default function OutcomeTracking() {
  const cohortOutcomes = [
    { category: 'Improved Trajectory', count: 26, pct: '54.2%', variant: 'success' },
    { category: 'Stable Trajectory', count: 16, pct: '33.3%', variant: 'primary' },
    { category: 'Worsened Trajectory', count: 4, pct: '8.3%', variant: 'danger' },
    { category: 'Follow-Up Pending', count: 2, pct: '4.2%', variant: 'warning' },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[var(--success)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Patient Outcome Tracking</h3>
        </div>
        <Badge variant="success" size="sm">87.5% Positive Trajectory</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {cohortOutcomes.map((co, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-[var(--text-main)]">{co.category}</span>
              <Badge variant={co.variant} size="sm">{co.pct}</Badge>
            </div>
            <div className="text-xl font-extrabold font-mono text-[var(--text-main)]">{co.count} Patients</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
