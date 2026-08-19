import React from 'react';
import { Card, Badge } from '../ui';
import { ShieldCheck } from 'lucide-react';

export default function ReviewAnalytics({ consultations = [] }) {
  const total = consultations.length;
  const completed = consultations.filter(c => c.status === 'COMPLETED').length;
  const active = consultations.filter(c => c.status === 'ACTIVE' || c.status === 'ACCEPTED').length;

  const stats = [
    { label: 'Total Assigned Cases', value: total ? String(total) : '0', detail: 'Authorized patient cases' },
    { label: 'Completed Reviews', value: completed ? String(completed) : '0', detail: 'Signed off physician notes' },
    { label: 'Active In-Review Cases', value: active ? String(active) : '0', detail: 'Currently under evaluation' },
    { label: 'AI Concordance Rate', value: 'Unavailable', detail: 'Requires clinical audit logs' },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-t-4 border-t-[var(--secondary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[var(--secondary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Review Performance & AI Concordance</h3>
        </div>
        <Badge variant="secondary" size="sm">{completed} Reviews Signed</Badge>
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
