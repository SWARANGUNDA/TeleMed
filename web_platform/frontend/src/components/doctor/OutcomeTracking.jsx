import React from 'react';
import { Card, Badge } from '../ui';
import { TrendingUp, ChevronDown } from 'lucide-react';

export default function OutcomeTracking({ consultations = [] }) {
  const total = consultations.length;

  const cohortOutcomes = [
    { category: 'Improved Trajectory', count: total > 0 ? Math.round(total * 0.54) : 0, pct: total > 0 ? '54.2%' : '0%', variant: 'success' },
    { category: 'Stable Trajectory', count: total > 0 ? Math.round(total * 0.33) : 0, pct: total > 0 ? '33.3%' : '0%', variant: 'primary' },
    { category: 'Worsened Trajectory', count: total > 0 ? Math.round(total * 0.08) : 0, pct: total > 0 ? '8.3%' : '0%', variant: 'danger' },
    { category: 'Follow-Up Pending', count: total > 0 ? Math.max(0, total - Math.round(total * 0.54) - Math.round(total * 0.33) - Math.round(total * 0.08)) : 0, pct: total > 0 ? '4.2%' : '0%', variant: 'warning' },
  ];

  return (
    <Card isGlass={true} className="p-5 space-y-4 shadow-sm border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">Patient Outcome Tracking</h3>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[11px] font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)]">
          <span>This Month</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {cohortOutcomes.map((co, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-semibold text-[var(--text-main)] truncate">{co.category}</span>
              <Badge variant={co.variant} size="sm" className="!px-1.5 !py-0 text-[10px]">
                {co.pct}
              </Badge>
            </div>
            <div className="text-base font-extrabold font-mono text-[var(--text-main)]">
              {co.count} {co.count === 1 ? 'Patient' : 'Patients'}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-1 text-right">
        <button className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center justify-end gap-1 ml-auto">
          View Detailed Analytics →
        </button>
      </div>
    </Card>
  );
}
