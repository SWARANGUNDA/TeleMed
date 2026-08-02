import React from 'react';
import { Card, Badge, Button } from '../ui';
import { FileText, Sparkles, ExternalLink, ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReportIntelligence() {
  const navigate = useNavigate();

  return (
    <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--primary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Diagnostic Report Intelligence</h3>
        </div>
        <Badge variant="primary" size="sm">ASM-2026-8819</Badge>
      </div>

      <div className="space-y-3 text-xs">
        <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Executive Summary</span>
          <p className="text-[11px] text-[var(--text-main)] leading-relaxed font-medium">
            "Multimodal integration of laboratory PDF biochemistry, 15D wearable telemetry, and gut microbiome sequencing confirms a 18.4% Low Risk trajectory for Type 2 Diabetes."
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <span className="text-[9px] text-[var(--text-muted)] block uppercase">AI Confidence</span>
            <strong className="text-[var(--primary)]">94.2% Concurrence</strong>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <span className="text-[9px] text-[var(--text-muted)] block uppercase">Data Quality</span>
            <strong className="text-[var(--success)]">98.2% Grade A</strong>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-[var(--border-subtle)]">
          <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />} onClick={() => navigate('/report')}>
            View Full PDF Report
          </Button>
          <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => navigate('/xai')}>
            Explore XAI Studio
          </Button>
        </div>
      </div>
    </Card>
  );
}
