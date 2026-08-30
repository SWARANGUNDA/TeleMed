import React from 'react';
import { Card, Badge } from '../ui';
import { AlertTriangle, ShieldAlert, FileText, Clock } from 'lucide-react';

export default function ClinicalAlerts() {
  const alertsList = [
    {
      id: 'ALT-1',
      title: 'Critical Biomarker Flag: HbA1c 7.2%',
      patient: 'Alexander Wright (PAT-8819)',
      time: '15 mins ago',
      priority: 'CRITICAL',
      variant: 'danger',
    },
    {
      id: 'ALT-2',
      title: 'High Risk Escalation (>65% Probability)',
      patient: 'Eleanor Vance (PAT-7412)',
      time: '1 hour ago',
      priority: 'HIGH',
      variant: 'danger',
    },
    {
      id: 'ALT-3',
      title: 'Missed Scheduled Consultation Follow-Up',
      patient: 'Robert Sterling (PAT-5201)',
      time: '3 hours ago',
      priority: 'MEDIUM',
      variant: 'warning',
    },
    {
      id: 'ALT-4',
      title: 'Missing Laboratory PDF Report',
      patient: 'Sarah Jenkins (PAT-3301)',
      time: '5 hours ago',
      priority: 'MEDIUM',
      variant: 'warning',
    },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--danger)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Clinical Alerts & Warnings</h3>
        </div>
        <Badge variant="danger" size="sm">{alertsList.length} Active Alerts</Badge>
      </div>

      <div className="space-y-3">
        {alertsList.map((a) => (
          <div key={a.id} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <strong className="text-xs text-[var(--text-main)]">{a.title}</strong>
              <Badge variant={a.variant} size="sm">{a.priority}</Badge>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">{a.patient} • {a.time}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
