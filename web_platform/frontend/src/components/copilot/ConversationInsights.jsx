import React from 'react';
import { Card, Badge } from '../ui';
import { MessageSquare, FileText, CheckCircle2 } from 'lucide-react';

export default function ConversationInsights() {
  const topics = [
    { name: 'Multimodal Report ASM-2026-8819', type: 'Report' },
    { name: 'HbA1c & Fasting Glucose SHAP Drivers', type: 'Biomarker' },
    { name: '90-Day Longitudinal Trend (-4.2%)', type: 'Longitudinal' },
    { name: 'Low Glycemic Dietary Protocol', type: 'Recommendation' },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Conversation Insights Log</h3>
        </div>
        <Badge variant="primary" size="sm">4 Topics Discussed</Badge>
      </div>

      <div className="space-y-2 text-xs">
        {topics.map((t, idx) => (
          <div key={idx} className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--text-main)]">{t.name}</span>
            <Badge variant="secondary" size="sm">{t.type}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
