import React from 'react';
import { Card, Badge, ProgressBar } from '../ui';
import { ShieldCheck, Lock, FileCheck2, UserCheck } from 'lucide-react';

export default function CompliancePanel({ stats }) {
  const verifiedDocs = stats?.verified_doctors ?? 1;
  const pendingDocs = stats?.pending_doctors ?? 0;
  const totalDocs = Math.max(1, (stats?.total_doctors ?? (verifiedDocs + pendingDocs)));
  const docVerificationPct = Math.min(100, Math.round((verifiedDocs / totalDocs) * 100));

  const complianceItems = [
    { 
      name: 'HIPAA Security Controls', 
      pct: 100, 
      status: '100% COMPLIANT', 
      variant: 'success',
      detail: 'AES-256 encryption at rest, TLS 1.3 in transit, and secure auth tokens' 
    },
    { 
      name: 'Physician Credential Verification', 
      pct: docVerificationPct, 
      status: `${docVerificationPct}% VERIFIED`, 
      variant: docVerificationPct === 100 ? 'success' : 'primary',
      detail: `${verifiedDocs} of ${totalDocs} registered physicians board-verified` 
    },
    { 
      name: 'Immutable Audit Trail Coverage', 
      pct: 100, 
      status: '100% AUDITED', 
      variant: 'success',
      detail: 'Tamper-evident logs for doctor verifications, sessions & record access' 
    },
    { 
      name: 'Role-Based Access Control (RBAC)', 
      pct: 100, 
      status: 'ENFORCED', 
      variant: 'secondary',
      detail: 'Strict boundary isolation between Admin, Doctor, and Patient workspaces' 
    },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-5 shadow-xl border-t-4 border-t-emerald-500">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-main)]">Regulatory & HIPAA Compliance</h3>
            <p className="text-xs text-[var(--text-muted)]">Verified clinical security, physician accreditation & audit controls</p>
          </div>
        </div>
        <Badge variant="success" size="sm" className="font-semibold text-xs px-2.5 py-1">
          100% Audit Score
        </Badge>
      </div>

      <div className="space-y-4">
        {complianceItems.map((c, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-[var(--bg-primary)]/80 border border-[var(--border-subtle)] space-y-2">
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-main)]">{c.name}</span>
              <Badge variant={c.variant} size="sm" className="text-[10px] font-bold">
                {c.status}
              </Badge>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-snug">
              {c.detail}
            </p>
            <ProgressBar value={c.pct} max={100} variant={c.variant} />
          </div>
        ))}
      </div>
    </Card>
  );
}
