import React, { useState } from 'react';
import { Card, Badge } from '../ui';
import { BookOpen, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export default function KnowledgePanel() {
  const [openIndex, setOpenIndex] = useState(0);

  const references = [
    {
      title: 'ADA 2026 Clinical Guidelines — Glycemic Targets',
      summary: 'The American Diabetes Association recommends maintaining HbA1c < 5.7% for non-diabetic adults and < 7.0% for individuals undergoing glycemic management.',
      category: 'Clinical Guideline',
    },
    {
      title: 'Multimodal Stacking & TreeSHAP Explainability',
      summary: 'Hierarchical ensemble stacking combines meta-learners to compute exact SHAP feature attributions across clinical, wearable, and microbiome vectors.',
      category: 'AI Methodology',
    },
    {
      title: 'SCFA Taxa & Microbiome Metabolic Role',
      summary: 'Bifidobacterium and Faecalibacterium prausnitzii produce short-chain fatty acids (acetate, propionate, butyrate) which enhance peripheral insulin sensitivity.',
      category: 'Microbiome Research',
    },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-t-4 border-t-[var(--secondary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[var(--secondary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Clinical Knowledge & Evidence Base</h3>
        </div>
        <Badge variant="secondary" size="sm">Peer-Reviewed</Badge>
      </div>

      <div className="space-y-2 text-xs">
        {references.map((ref, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">{ref.category}</Badge>
                  <strong className="text-xs text-[var(--text-main)] font-semibold">{ref.title}</strong>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
              </button>

              {isOpen && (
                <div className="p-3 pt-0 text-[11px] text-[var(--text-muted)] leading-relaxed border-t border-[var(--border-subtle)]">
                  {ref.summary}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
