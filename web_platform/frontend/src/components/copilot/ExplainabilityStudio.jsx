import React, { useState } from 'react';
import { Card, Badge, ProgressBar } from '../ui';
import { ShieldCheck, Activity, Filter, Zap, Dna, FileText, Watch } from 'lucide-react';

export default function ExplainabilityStudio() {
  const [modalityFilter, setModalityFilter] = useState('ALL');

  const shapDrivers = [
    { name: 'HbA1c Glycated Hemoglobin', value: '5.8%', shapValue: '+0.142', impact: 'RISK DRIVER', modality: 'Clinical', pct: 68, variant: 'danger' },
    { name: 'Fasting Blood Glucose', value: '105 mg/dL', shapValue: '+0.098', impact: 'RISK DRIVER', modality: 'Clinical', pct: 45, variant: 'danger' },
    { name: 'Resting Heart Rate (RHR)', value: '64 bpm', shapValue: '-0.065', impact: 'PROTECTIVE', modality: 'Wearable', pct: 30, variant: 'success' },
    { name: 'Heart Rate Variability (HRV)', value: '42 ms', shapValue: '-0.084', impact: 'PROTECTIVE', modality: 'Wearable', pct: 40, variant: 'success' },
    { name: 'Bifidobacterium Abundance', value: '4.2%', shapValue: '-0.052', impact: 'PROTECTIVE', modality: 'Gut', pct: 25, variant: 'success' },
  ];

  const filteredDrivers = shapDrivers.filter(d => modalityFilter === 'ALL' || d.modality === modalityFilter);

  return (
    <Card isGlass={true} className="p-6 space-y-5 shadow-xl border-t-4 border-t-[var(--secondary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[var(--secondary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">TreeSHAP Explainability Studio</h3>
        </div>
        <Badge variant="secondary" size="sm">Waterfall Contribution</Badge>
      </div>

      {/* Modality Filter Pills */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto">
        {['ALL', 'Clinical', 'Wearable', 'Gut'].map((mod) => (
          <button
            key={mod}
            onClick={() => setModalityFilter(mod)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all ${
              modalityFilter === mod
                ? 'bg-[var(--secondary)] text-white shadow-sm'
                : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {mod}
          </button>
        ))}
      </div>

      {/* SHAP Drivers List */}
      <div className="space-y-3">
        {filteredDrivers.map((d, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">{d.modality}</Badge>
                <strong className="text-xs text-[var(--text-main)]">{d.name}</strong>
              </div>
              <span className={`font-mono font-bold ${d.impact === 'RISK DRIVER' ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                {d.shapValue} ({d.impact})
              </span>
            </div>

            <div className="flex justify-between text-[11px] text-[var(--text-muted)] font-mono">
              <span>Observed Value: {d.value}</span>
              <span>Feature Weight: {d.pct}%</span>
            </div>

            <ProgressBar value={d.pct} max={100} variant={d.variant} />
          </div>
        ))}
      </div>
    </Card>
  );
}
