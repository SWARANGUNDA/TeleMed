import React from 'react';
import { Card, Badge } from '../ui';
import { Users } from 'lucide-react';

export default function UserAnalytics({ stats, totalPatients = 20, totalDoctors = 2 }) {
  const patientCount = stats?.total_patients || totalPatients;
  const doctorCount = stats?.total_doctors || totalDoctors;

  const metrics = [
    { label: 'Patient Growth (30D)', val: '+18.4%', detail: `${patientCount} active patient accounts` },
    { label: 'Doctor Growth (30D)', val: '+8.2%', detail: `${doctorCount} verified physicians` },
    { label: 'DAU / MAU Ratio', val: '64.2%', detail: 'High active engagement' },
    { label: 'Geographic Regions', val: '12 States', detail: 'Primary: CA, NY, TX' },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">User Growth & Engagement</h3>
        </div>
        <Badge variant="primary" size="sm">+18.4% MoM</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        {metrics.map((m, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">{m.label}</span>
            <div className="text-xl font-extrabold font-mono text-[var(--text-main)]">{m.val}</div>
            <p className="text-[10px] text-[var(--text-muted)]">{m.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
