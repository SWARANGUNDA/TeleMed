import React from 'react';
import { Card, Badge, ProgressBar } from '../ui';
import { Clock } from 'lucide-react';

export default function WorkloadPanel({ consultations = [] }) {
  const total = consultations.length;
  const pending = consultations.filter(c => c.status === 'ASSIGNED').length;
  const active = consultations.filter(c => c.status === 'ACCEPTED' || c.status === 'ACTIVE').length;
  const completed = consultations.filter(c => c.status === 'COMPLETED').length;

  const pctCompleted = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pctActive = total > 0 ? Math.round((active / total) * 100) : 0;
  const pctPending = total > 0 ? Math.round((pending / total) * 100) : 0;

  const workloadMetrics = [
    { label: "Active In-Review Cases", count: active, total, pct: pctActive, variant: 'primary' },
    { label: "Pending Assignment Acceptance", count: pending, total, pct: pctPending, variant: 'warning' },
    { label: "Completed Sign-Offs", count: completed, total, pct: pctCompleted, variant: 'success' },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Clinical Workload & Progress</h3>
        </div>
        <Badge variant={pctCompleted === 100 ? 'success' : 'primary'} size="sm">
          {pctCompleted}% Complete ({completed}/{total})
        </Badge>
      </div>

      <div className="space-y-4">
        {workloadMetrics.map((wm, idx) => (
          <div key={idx} className="space-y-1.5 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-[var(--text-main)]">{wm.label}</span>
              <span className="font-mono text-[var(--primary)]">{wm.count} / {wm.total} ({wm.pct}%)</span>
            </div>
            <ProgressBar value={wm.pct} max={100} variant={wm.variant} />
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2 text-center text-xs">
        <div className="p-2 rounded bg-[var(--bg-primary)]">
          <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Assigned Cases</span>
          <strong className="text-[var(--text-main)] font-mono">{total} Total</strong>
        </div>
        <div className="p-2 rounded bg-[var(--bg-primary)]">
          <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Completed Reviews</span>
          <strong className="text-[var(--success)] font-mono">{completed} Cases</strong>
        </div>
      </div>
    </Card>
  );
}
