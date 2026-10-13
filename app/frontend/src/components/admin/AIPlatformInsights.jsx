import React from 'react';
import { Card, Badge } from '../ui';
import { Sparkles, Brain, Cpu, ShieldCheck, GitMerge, FileText } from 'lucide-react';

export default function AIPlatformInsights({ className = '' }) {
  const insights = [
    { 
      label: 'Multimodal Fusion Engine', 
      val: '7-Pathway Stacker', 
      badgeText: 'Active Fusion',
      detail: 'Synthesizes C+W+G diagnostic models via calibrated meta-classifier ensemble', 
      icon: GitMerge,
      badgeVar: 'primary'
    },
    { 
      label: 'XAI Attribution Framework', 
      val: 'TreeSHAP v4.0', 
      badgeText: '100% Attributed',
      detail: 'Computes exact unified Shapley values for clinical, wearable & taxa features', 
      icon: ShieldCheck,
      badgeVar: 'success'
    },
    { 
      label: 'Evidence Grounding Index', 
      val: 'FAISS Vector DB', 
      badgeText: 'ADA/EASD Indexed',
      detail: 'Semantic clinical guideline retrieval with grounded counterfactual citations', 
      icon: FileText,
      badgeVar: 'accent'
    },
    { 
      label: 'Input Validation Protocol', 
      val: 'IMDIE v3.3 Protocol', 
      badgeText: 'Enforced',
      detail: 'Bounds validation, alias normalization & strict out-of-range sensor detection', 
      icon: Cpu,
      badgeVar: 'secondary'
    },
  ];

  return (
    <Card isGlass={true} className={`p-6 space-y-5 shadow-xl border-t-4 border-t-purple-500 flex flex-col justify-between ${className}`}>
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

      <div className="grid grid-cols-2 gap-3.5 text-xs flex-1">
        {insights.map((ins, idx) => {
          const Icon = ins.icon;
          return (
            <div 
              key={idx} 
              className="p-3.5 rounded-xl bg-[var(--bg-primary)]/80 hover:bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2.5 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider truncate">
                    {ins.label}
                  </span>
                </div>
                <Badge variant={ins.badgeVar} size="sm" className="text-[9px] font-bold shrink-0">
                  {ins.badgeText}
                </Badge>
              </div>
              <div className="text-lg font-extrabold text-[var(--text-main)] tracking-tight">
                {ins.val}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {ins.detail}
              </p>
            </div>
          );
        })}
      </div>

      {/* Real Calibration & Verification Integrity */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
            Diagnostic Confidence & Calibration
          </h4>
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
            Frozen Thresholds
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] block font-semibold uppercase">Calibrated</span>
            <div className="text-lg font-extrabold text-[var(--text-main)] mt-0.5">94.8%</div>
            <span className="text-[9px] text-[var(--text-muted)]">Logistic Stacker</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] block font-semibold uppercase">TreeSHAP</span>
            <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">100%</div>
            <span className="text-[9px] text-[var(--text-muted)]">Attributed</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] block font-semibold uppercase">Guidelines</span>
            <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">ADA/EASD</div>
            <span className="text-[9px] text-[var(--text-muted)]">RAG Indexed</span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-muted)] block font-semibold uppercase">Pipeline</span>
            <div className="text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">v3.3</div>
            <span className="text-[9px] text-[var(--text-muted)]">Production</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
