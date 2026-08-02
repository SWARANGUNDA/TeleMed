import React from 'react';
import { Card, Badge, ProgressBar } from '../ui';
import { CheckCircle2, Sliders, Activity, ShieldCheck } from 'lucide-react';

export default function ReviewAnalytics() {
  const stats = [
    { label: 'Weekly Reviews', value: '38', detail: '+12% vs last week' },
    { label: 'AI Agreement Rate', value: '96.4%', detail: 'High model concurrence' },
    { label: 'Manual Overrides', value: '3.6%', detail: 'Adjusted clinical thresholds' },
    { label: 'Follow-Up Completion', value: '94.0%', detail: 'On-schedule patient care' },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-t-4 border-t-[var(--secondary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[var(--secondary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Review Performance & AI Concordance</h3>
        </div>
        <Badge variant="secondary" size="sm">96.4% Agreement</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {stats.map((st, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">{st.label}</span>
            <div className="text-xl font-extrabold font-mono text-[var(--text-main)]">{st.value}</div>
            <p className="text-[10px] text-[var(--text-muted)]">{st.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
