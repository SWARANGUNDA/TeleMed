import React from 'react';
import { Card, Badge } from '../ui';
import { Sparkles, Brain, Cpu, ShieldCheck, GitMerge, FileText } from 'lucide-react';

export default function AIPlatformInsights() {
  const insights = [
    { 
      label: 'Multimodal Fusion Engine', 
      val: '7-Pathway Stacker', 
      detail: 'C+W+G Logistic regression ensemble', 
      icon: GitMerge,
      badgeVar: 'primary'
    },
    { 
      label: 'XAI Attribution Framework', 
      val: 'TreeSHAP v4.0', 
      detail: 'Exact Shapley additive explanations', 
      icon: ShieldCheck,
      badgeVar: 'success'
    },
    { 
      label: 'Evidence Grounding Index', 
      val: 'FAISS Vector DB', 
      detail: 'ADA/EASD clinical guideline retrieval', 
      icon: FileText,
      badgeVar: 'accent'
    },
    { 
      label: 'Input Validation Protocol', 
      val: 'IMDIE v3.3 Protocol', 
      detail: 'Bounds validation & alias normalization', 
      icon: Cpu,
      badgeVar: 'secondary'
    },
  ];

  return (
    <Card isGlass={true} className="p-6 space-y-5 shadow-xl border-t-4 border-t-purple-500">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-main)]">AI Architecture & Specifications</h3>
            <p className="text-xs text-[var(--text-muted)]">Verified specifications for multimodal stacking, XAI, and RAG retrieval</p>
          </div>
        </div>
        <Badge variant="accent" size="sm" className="font-semibold text-xs px-2.5 py-1">
          Calibrated Models
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3.5 text-xs">
        {insights.map((ins, idx) => {
          const Icon = ins.icon;
          return (
            <div 
              key={idx} 
              className="p-3.5 rounded-xl bg-[var(--bg-primary)]/80 hover:bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider truncate">
                    {ins.label}
                  </span>
                </div>
              </div>
              <div className="text-base font-extrabold text-[var(--text-main)] tracking-tight">
                {ins.val}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                {ins.detail}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
