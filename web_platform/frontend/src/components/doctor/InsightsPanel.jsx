import React from 'react';
import { Card, Badge } from '../ui';
import { Sparkles, Brain, Stethoscope, Activity } from 'lucide-react';

export default function InsightsPanel() {
  const insights = [
    {
      title: 'Most Common Disease Pattern',
      desc: 'Type 2 Diabetes accounts for 58% of active cohort predictions. TreeSHAP indicates HbA1c & Fasting Glucose drive 42% of total risk variance.',
      category: 'Epidemiology',
      variant: 'primary',
    },
    {
      title: 'Frequently Abnormal Biomarkers',
      desc: 'HbA1c (72% out of reference range) and HRV RMSSD (54% low autonomic tone) represent top abnormal biomarker drivers in the clinic.',
      category: 'Biomarkers',
      variant: 'warning',
    },
    {
      title: 'Consultation Recommendation',
      desc: '6 patients pending sign-offs exhibit high glycemic dysregulation. Prioritize review for PAT-8819 and PAT-7412 today.',
      category: 'Action Item',
      variant: 'danger',
    },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-t-4 border-t-[var(--accent)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--accent)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">AI Clinical Insights & Recommendations</h3>
        </div>
        <Badge variant="accent" size="sm">Real-time Insights</Badge>
      </div>

      <div className="space-y-3 text-xs">
        {insights.map((ins, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
            <div className="flex items-center justify-between">
              <strong className="text-xs text-[var(--text-main)]">{ins.title}</strong>
              <Badge variant={ins.variant} size="sm">{ins.category}</Badge>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{ins.desc}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
