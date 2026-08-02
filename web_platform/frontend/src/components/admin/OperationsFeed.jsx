import React from 'react';
import { Card, Badge } from '../ui';
import { Activity, ShieldAlert, CheckCircle2, UserCheck, FileText, Lock } from 'lucide-react';

export default function OperationsFeed() {
  const activityList = [
    { id: 'ACT-101', action: 'Physician Identity Verified', detail: 'Dr. Marcus Vance (DOC-101) credential audit passed', time: '5 mins ago', severity: 'INFO', variant: 'success' },
    { id: 'ACT-102', action: 'Multimodal AI Execution', detail: 'Stacked ensemble inference completed for PAT-8819 (4.2ms)', time: '12 mins ago', severity: 'INFO', variant: 'primary' },
    { id: 'ACT-103', action: 'Automated Database Backup', detail: 'Snapshot telemed_db_v4_backup.sql stored to encrypted S3', time: '1 hour ago', severity: 'SUCCESS', variant: 'secondary' },
    { id: 'ACT-104', action: 'HIPAA Audit Event Logged', detail: 'Patient record PAT-7412 accessed by authorized physician', time: '2 hours ago', severity: 'SECURITY', variant: 'warning' },
    { id: 'ACT-105', action: 'New Patient Registration', detail: 'Alexander Wright created patient account via Web App', time: '3 hours ago', severity: 'INFO', variant: 'primary' },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--primary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Operational Activity Feed</h3>
        </div>
        <Badge variant="primary" size="sm">Real-time Log</Badge>
      </div>

      <div className="space-y-3 text-xs">
        {activityList.map((act) => (
          <div key={act.id} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
            <div className="flex items-center justify-between">
              <strong className="text-xs text-[var(--text-main)]">{act.action}</strong>
              <Badge variant={act.variant} size="sm">{act.severity}</Badge>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{act.detail}</p>
            <span className="text-[10px] font-mono text-[var(--text-muted)] block pt-1">{act.time}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
