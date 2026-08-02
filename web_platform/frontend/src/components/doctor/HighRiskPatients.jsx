import React from 'react';
import { Card, Badge, Button } from '../ui';
import { AlertTriangle, Eye, MessageSquare, Calendar, ShieldAlert } from 'lucide-react';

export default function HighRiskPatients({ onReview, onMessage }) {
  const highRiskList = [
    {
      id: 'PAT-8819',
      name: 'Alexander Wright',
      riskScore: 68.0,
      disease: 'Type 2 Diabetes',
      confidence: '96.1%',
      lastAssessment: '2026-08-01',
      doctor: 'Dr. Marcus Vance',
      status: 'PENDING REVIEW',
      statusVariant: 'danger',
    },
    {
      id: 'PAT-7412',
      name: 'Eleanor Vance',
      riskScore: 54.2,
      disease: 'Metabolic Dysbiosis',
      confidence: '94.5%',
      lastAssessment: '2026-07-30',
      doctor: 'Dr. Marcus Vance',
      status: 'UNDER REVIEW',
      statusVariant: 'warning',
    },
    {
      id: 'PAT-5201',
      name: 'Robert Sterling',
      riskScore: 51.8,
      disease: 'Cardiopulmonary Telemetry',
      confidence: '93.2%',
      lastAssessment: '2026-07-28',
      doctor: 'Dr. Marcus Vance',
      status: 'FOLLOW-UP DUE',
      statusVariant: 'warning',
    },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--danger)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[var(--danger)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">High-Risk Patient Monitor</h3>
        </div>
        <Badge variant="danger" size="sm">3 Require Immediate Action</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[10px] uppercase">
              <th className="py-2.5 px-3">Patient</th>
              <th className="py-2.5 px-3">Risk Score</th>
              <th className="py-2.5 px-3">Primary Disease</th>
              <th className="py-2.5 px-3">AI Confidence</th>
              <th className="py-2.5 px-3">Last Assessment</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {highRiskList.map((p) => (
              <tr key={p.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                <td className="py-3 px-3">
                  <strong className="text-sm font-bold text-[var(--text-main)] block">{p.name}</strong>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{p.id}</span>
                </td>
                <td className="py-3 px-3 font-mono font-extrabold text-[var(--danger)] text-sm">{p.riskScore}%</td>
                <td className="py-3 px-3 font-medium text-[var(--text-main)]">{p.disease}</td>
                <td className="py-3 px-3 font-mono text-[var(--primary)] font-semibold">{p.confidence}</td>
                <td className="py-3 px-3 font-mono text-[var(--text-muted)]">{p.lastAssessment}</td>
                <td className="py-3 px-3">
                  <Badge variant={p.statusVariant} size="sm">{p.status}</Badge>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="primary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => onReview ? onReview(p) : null}>
                      Review
                    </Button>
                    <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-3.5 h-3.5" />} onClick={() => onMessage ? onMessage(p) : null}>
                      Message
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
