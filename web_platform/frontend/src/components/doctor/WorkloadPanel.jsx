import React from 'react';
import { Card, Badge, ProgressBar } from '../ui';
import { Clock, Calendar, CheckCircle2, FileText, Stethoscope } from 'lucide-react';

export default function WorkloadPanel() {
  const workloadMetrics = [
    { label: "Today's Consultations", completed: 4, total: 6, pct: 67, variant: 'primary' },
    { label: "Pending Report Sign-Offs", completed: 3, total: 5, pct: 60, variant: 'warning' },
    { label: "High-Risk Follow-Ups", completed: 2, total: 3, pct: 66, variant: 'danger' },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Clinical Workload & Progress</h3>
        </div>
        <Badge variant="primary" size="sm">67% Complete</Badge>
      </div>

      <div className="space-y-4">
        {workloadMetrics.map((wm, idx) => (
          <div key={idx} className="space-y-1.5 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-[var(--text-main)]">{wm.label}</span>
              <span className="font-mono text-[var(--primary)]">{wm.completed} / {wm.total} ({wm.pct}%)</span>
            </div>
            <ProgressBar value={wm.pct} max={100} variant={wm.variant} />
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2 text-center text-xs">
        <div className="p-2 rounded bg-[var(--bg-primary)]">
          <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Avg Turnaround</span>
          <strong className="text-[var(--text-main)] font-mono">11.4 mins</strong>
        </div>
        <div className="p-2 rounded bg-[var(--bg-primary)]">
          <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Completed Today</span>
          <strong className="text-[var(--success)] font-mono">14 Reports</strong>
        </div>
      </div>
    </Card>
  );
}
