import React from 'react';
import { Card } from '../ui';
import { HelpCircle, ChevronRight } from 'lucide-react';

export default function SuggestedQuestions({ onSelectQuestion }) {
  const groups = [
    {
      category: 'Understanding Report',
      questions: [
        'What does my 18.4% risk score mean for my health?',
        'How is my overall Health Score of 88/100 calculated?',
      ],
    },
    {
      category: 'Biomarkers & SHAP',
      questions: [
        'Why is my fasting glucose (105 mg/dL) marked borderline?',
        'How does TreeSHAP rank HbA1c as my top risk driver?',
      ],
    },
    {
      category: 'Longitudinal Trends',
      questions: [
        'How much did my risk change compared to May 2026?',
        'What lifestyle habits drove my HbA1c down from 6.1% to 5.8%?',
      ],
    },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-t-4 border-t-[var(--primary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Categorized Suggested Questions</h3>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">One-Click Prompts</span>
      </div>

      <div className="space-y-4 text-xs">
        {groups.map((grp, idx) => (
          <div key={idx} className="space-y-2">
            <h4 className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase">{grp.category}</h4>
            <div className="space-y-1.5">
              {grp.questions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onSelectQuestion ? onSelectQuestion(q) : null}
                  className="w-full p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-left font-medium text-[var(--text-main)] transition-all flex items-center justify-between group text-[11px]"
                >
                  <span>{q}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--primary)] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
