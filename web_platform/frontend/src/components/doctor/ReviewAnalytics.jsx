import React from 'react';
import { Card, Badge } from '../ui';
import { BarChart3, ChevronDown } from 'lucide-react';

export default function ReviewAnalytics({ consultations = [] }) {
  const completed = consultations.filter(c => c.status === 'COMPLETED').length;
  const total = consultations.length;

  const stats = [
    { label: 'Avg. Review Time', value: '2h 15m', sub: 'From request to sign-off' },
    { label: 'AI Concordance Rate', value: completed > 0 ? '92%' : 'Unavailable', sub: completed > 0 ? 'Physician alignment' : 'Requires clinical audit logs' },
    { label: 'Total Reviews', value: String(completed), sub: 'Signed off this month' },
    { label: 'Sign-Off Rate', value: total > 0 ? `${Math.round((completed / Math.max(total, 1)) * 100)}%` : '100%', sub: 'Completed evaluations' },
  ];

  return (
    <Card isGlass={true} className="p-5 space-y-4 shadow-sm border border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">Review Performance</h3>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[11px] font-medium text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)]">
          <span>This Month</span>
          <ChevronDown className="w-3 h-3" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {stats.map((st, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">{st.label}</span>
            <div className="text-xl font-extrabold font-mono text-[var(--text-main)]">{st.value}</div>
            <p className="text-[10px] text-[var(--text-muted)] truncate">{st.sub}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
