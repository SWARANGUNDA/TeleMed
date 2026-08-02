import React from 'react';
import { Card, Badge } from '../ui';
import { Activity, TrendingDown, CheckCircle2 } from 'lucide-react';

export default function AssessmentAssistant() {
  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--success)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--success)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Assessment Longitudinal Comparison</h3>
        </div>
        <Badge variant="success" size="sm">-4.2% Risk Reduction</Badge>
      </div>

      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2 text-center font-mono">
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] block uppercase">May 2026 Assessment</span>
            <div className="text-lg font-extrabold text-[var(--warning)]">22.6% Risk</div>
            <span className="text-[10px] text-[var(--text-muted)]">HbA1c: 6.1%</span>
          </div>

          <div className="p-3 rounded-xl bg-[var(--primary-light)]/30 border border-[var(--primary)]">
            <span className="text-[10px] text-[var(--primary)] block uppercase font-bold">Aug 2026 Assessment</span>
            <div className="text-lg font-extrabold text-[var(--success)]">18.4% Risk</div>
            <span className="text-[10px] text-[var(--success)] font-bold">HbA1c: 5.8%</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
          <strong className="text-xs text-[var(--text-main)] font-bold">AI Longitudinal Narrative Summary</strong>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            "Comparing your May 2026 baseline with August 2026, metabolic risk decreased by 4.2 percentage points. The primary improvement driver is a 0.3% reduction in HbA1c, supported by a 45-minute increase in average weekly deep sleep."
          </p>
        </div>
      </div>
    </Card>
  );
}
