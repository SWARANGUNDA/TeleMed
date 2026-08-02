import React from 'react';
import { Card, Badge, CircularProgress } from '../ui';
import { Sparkles, ShieldCheck, Activity, CheckCircle2, Calendar } from 'lucide-react';

export default function HealthSummaryPanel() {
  return (
    <Card isGlass={true} className="p-6 space-y-5 shadow-xl border-l-4 border-l-[var(--primary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Personalized Health Summary</h3>
        </div>
        <Badge variant="success" size="sm">Trajectory: +4.2 pts</Badge>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Score Ring */}
        <div className="flex flex-col items-center">
          <CircularProgress value={88} size={96} strokeWidth={8} variant="success">
            <span className="text-2xl font-extrabold font-mono text-[var(--text-main)]">88</span>
            <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Out of 100</span>
          </CircularProgress>
          <span className="text-xs font-bold text-[var(--success)] mt-2">Optimal Health Score</span>
        </div>

        {/* Key Metrics Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Active Risk Level</span>
            <strong className="text-[var(--success)] text-xs block">Low Risk (18.4%)</strong>
            <span className="text-[9px] text-[var(--text-muted)]">Type 2 Diabetes</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Active Modality</span>
            <strong className="text-[var(--primary)] text-xs block">Multimodal C+W+G</strong>
            <span className="text-[9px] text-[var(--text-muted)]">Clinical + Wearable + Gut</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">AI Confidence</span>
            <strong className="text-[var(--accent)] text-xs font-mono block">94.2% Concurrence</strong>
            <span className="text-[9px] text-[var(--text-muted)]">Hierarchical Stacker</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Data Quality</span>
            <strong className="text-[var(--text-main)] text-xs font-mono block">98.2% (Grade A)</strong>
            <span className="text-[9px] text-[var(--text-muted)] font-mono">Aug 1, 2026 Assessment</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
