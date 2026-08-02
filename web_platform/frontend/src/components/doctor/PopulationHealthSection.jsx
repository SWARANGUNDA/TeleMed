import React from 'react';
import { Card, Badge, ProgressBar } from '../ui';
import { Activity, Users, Layers, Dna, FileText, Watch } from 'lucide-react';

export default function PopulationHealthSection() {
  const diseaseDist = [
    { name: 'Type 2 Diabetes', count: 28, pct: 58, variant: 'danger' },
    { name: 'Metabolic Dysbiosis', count: 14, pct: 29, variant: 'warning' },
    { name: 'Prediabetes Impairment', count: 12, pct: 25, variant: 'warning' },
    { name: 'Cardiopulmonary Telemetry Risk', count: 6, pct: 12, variant: 'primary' },
  ];

  const riskDist = [
    { level: 'High Risk (>50%)', count: 8, pct: 16.6, variant: 'danger' },
    { level: 'Moderate Risk (25-50%)', count: 18, pct: 37.5, variant: 'warning' },
    { level: 'Low Risk (<25%)', count: 22, pct: 45.8, variant: 'success' },
  ];

  const modalityUsage = [
    { name: 'Clinical Biochemistry (C)', count: 48, icon: FileText, pct: 100, color: 'text-[var(--primary)]' },
    { name: 'Wearable Telemetry (W)', count: 36, icon: Watch, pct: 75, color: 'text-[var(--secondary)]' },
    { name: 'Gut Microbiome Taxa (G)', count: 24, icon: Dna, pct: 50, color: 'text-[var(--accent)]' },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-6 shadow-xl border-t-4 border-t-[var(--primary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <Badge variant="primary" size="sm">POPULATION HEALTH ANALYTICS</Badge>
          <h3 className="text-lg font-extrabold text-[var(--text-main)] mt-1">Cohort Disease & Risk Distribution</h3>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">Active Cohort: 48 Patients</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Disease Prevalence */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">Disease Prevalence</h4>
          <div className="space-y-3">
            {diseaseDist.map((d, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-[var(--text-main)]">{d.name}</span>
                  <span className="font-mono text-[var(--text-muted)]">{d.count} patients ({d.pct}%)</span>
                </div>
                <ProgressBar value={d.pct} max={100} variant={d.variant} />
              </div>
            ))}
          </div>
        </div>

        {/* Risk Level Tiers */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">Risk Stratification Tiers</h4>
          <div className="space-y-3">
            {riskDist.map((r, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-[var(--text-main)]">{r.level}</span>
                  <span className="font-mono text-[var(--text-muted)]">{r.count} patients ({r.pct.toFixed(1)}%)</span>
                </div>
                <ProgressBar value={r.pct} max={100} variant={r.variant} />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modality Usage */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
        <h4 className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">Active Modality Integration</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {modalityUsage.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div key={idx} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${m.color}`} />
                  <span className="font-semibold text-[var(--text-main)] truncate">{m.name}</span>
                </div>
                <div className="text-base font-extrabold font-mono text-[var(--text-main)]">{m.count} / 48</div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">{m.pct}% coverage</span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
