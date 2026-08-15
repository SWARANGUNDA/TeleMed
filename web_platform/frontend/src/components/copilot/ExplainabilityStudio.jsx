import React, { useState } from 'react';
import { Card, Badge, ProgressBar } from '../ui';
import { ShieldCheck, Activity, Filter, Zap, Dna, FileText, Watch } from 'lucide-react';

export default function ExplainabilityStudio({ predictionData, xaiData }) {
  const [modalityFilter, setModalityFilter] = useState('ALL');

  const topFeatures = xaiData?.top_features || predictionData?.top_shap_features || [];

  const shapDrivers = topFeatures.length > 0
    ? topFeatures.map((f, idx) => ({
        name: f.feature_name || f.name || `Feature ${idx + 1}`,
        value: f.feature_value !== undefined ? `${f.feature_value}` : 'Extracted',
        shapValue: f.shap_value ? (f.shap_value > 0 ? `+${f.shap_value.toFixed(4)}` : f.shap_value.toFixed(4)) : '0.0000',
        impact: (f.shap_value || 0) > 0 ? 'RISK DRIVER' : 'PROTECTIVE',
        modality: f.modality || 'Clinical',
        pct: Math.min(Math.abs(Math.round((f.shap_value || 0.05) * 1000)), 100),
        variant: (f.shap_value || 0) > 0 ? 'danger' : 'success'
      }))
    : [];

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
        {filteredDrivers.length > 0 ? (
          filteredDrivers.map((d, idx) => (
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
          ))
        ) : (
          <div className="p-8 text-center space-y-2 border border-dashed border-[var(--border-subtle)] rounded-xl">
            <ShieldCheck className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
            <h4 className="text-sm font-bold text-[var(--text-main)]">No TreeSHAP Drivers Available</h4>
            <p className="text-xs text-[var(--text-muted)]">Upload medical reports to calculate TreeSHAP feature attributions.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
