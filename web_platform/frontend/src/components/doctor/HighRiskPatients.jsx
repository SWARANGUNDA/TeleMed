import React from 'react';
import { Card, Badge, Button, EmptyState } from '../ui';
import { ShieldAlert, Eye, MessageSquare } from 'lucide-react';

export default function HighRiskPatients({ consultations = [], onReview, onMessage }) {
  // Filter authorized real consultations from backend database
  const activeCases = (consultations || []).filter(c => ['ASSIGNED', 'ACCEPTED', 'ACTIVE'].includes(c.status));

  if (!activeCases.length) {
    return (
      <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--success)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[var(--success)]" />
            <h3 className="text-base font-extrabold text-[var(--text-main)]">High-Risk Patient Monitor</h3>
          </div>
          <Badge variant="success" size="sm">0 Action Required</Badge>
        </div>
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-[var(--text-muted)]" />}
          title="No High-Risk Patient Cases Pending"
          description="All assigned patient consultations are currently up to date or completed."
        />
      </Card>
    );
  }

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--danger)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[var(--danger)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">High-Risk Patient Monitor</h3>
        </div>
        <Badge variant="danger" size="sm">{activeCases.length} Require Review</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[10px] uppercase">
              <th className="py-2.5 px-3">Patient Name</th>
              <th className="py-2.5 px-3">Consultation ID</th>
              <th className="py-2.5 px-3">Requested Specialty</th>
              <th className="py-2.5 px-3">Urgency</th>
              <th className="py-2.5 px-3">Requested At</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {activeCases.map((c) => (
              <tr key={c.consultation_id} className="hover:bg-[var(--bg-primary)] transition-colors">
                <td className="py-3 px-3">
                  <strong className="text-sm font-bold text-[var(--text-main)] block">{c.patient_name || 'Patient'}</strong>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">{c.patient_id}</span>
                </td>
                <td className="py-3 px-3 font-mono font-semibold text-[var(--text-main)]">{c.consultation_id}</td>
                <td className="py-3 px-3 font-medium text-[var(--text-main)]">{c.specialization || c.category}</td>
                <td className="py-3 px-3">
                  <Badge variant={c.urgency === 'HIGH' || c.urgency === 'SOON' ? 'danger' : 'warning'} size="sm">
                    {c.urgency || 'ROUTINE'}
                  </Badge>
                </td>
                <td className="py-3 px-3 font-mono text-[var(--text-muted)]">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Today'}
                </td>
                <td className="py-3 px-3">
                  <Badge variant={c.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">{c.status}</Badge>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button variant="primary" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => onReview ? onReview(c) : null}>
                      Review Case
                    </Button>
                    <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-3.5 h-3.5" />} onClick={() => onMessage ? onMessage(c) : null}>
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
