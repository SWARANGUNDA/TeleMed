import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, AlertCircle, RefreshCw, ArrowRight,
  ShieldCheck, Brain, FileText, Activity, Watch, Dna, Layers, Sparkles, Cpu, Lock, AlertTriangle
} from 'lucide-react';
import { Button, Card, CardHeader, CardBody, CardFooter, Badge, ProgressBar, CircularProgress } from './ui';

export function AnalysisPipeline({
  stage = 'intake', // 'intake' | 'predicting' | 'completed' | 'failed' | 'warning'
  errorMsg = null,
  warningMsg = null,
  pathway = 'C+W+G',
  dqScore = 85.2,
  featureCounts = { clinical: 18, wearable: 15, gut: 49 },
  currentDocument = 'clinical_v4_sample.csv',
  onNavigateDashboard,
  onNavigateXAI,
  onNavigateReport,
  onRetry,
  onBackToVerification
}) {
  const navigate = useNavigate();
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  // 16 Detailed Vertical Timeline Pipeline Stages
  const pipelineStages = [
    { key: 'upload', title: 'Upload Complete', desc: 'PDF, CSV, and image reports uploaded & verified', icon: CheckCircle2, latency: 12 },
    { key: 'validation', title: 'Document Validation', desc: 'Magic byte signature & file size security check', icon: ShieldCheck, latency: 14 },
    { key: 'ocr', title: 'OCR Processing', desc: 'Tesseract hybrid OCR extraction engine', icon: FileText, latency: 45 },
    { key: 'template', title: 'Template Detection', desc: 'Apollo, Max, Thyrocare & Ayumetrix detection', icon: Layers, latency: 18 },
    { key: 'mapping', title: 'Canonical Feature Mapping', desc: 'Context-aware alias disambiguation & schema mapping', icon: Activity, latency: 24 },
    { key: 'feat_valid', title: 'Feature Validation', desc: 'Physiological boundary validation & duplicate checks', icon: CheckCircle2, latency: 16 },
    { key: 'quality', title: 'Quality Assessment', desc: 'Multi-factor report & feature confidence scoring', icon: ShieldCheck, latency: 22 },
    { key: 'clin_expert', title: 'Clinical Expert v4', desc: 'Gradient Boosted Decision Trees (18 biomarkers)', icon: Activity, latency: 28 },
    { key: 'wear_expert', title: 'Wearable Expert v4', desc: '15D continuous sensor streams & circadian metrics', icon: Watch, latency: 32 },
    { key: 'gut_expert', title: 'Gut Expert v4', desc: '40 Taxa species + 9 derived ecological indices profiler', icon: Dna, latency: 30 },
    { key: 'fusion', title: 'Fusion Engine', desc: '7-Pathway scientific router & logistic stacker', icon: Layers, latency: 15 },
    { key: 'reliability', title: 'Prediction Reliability', desc: 'Modality reliability ratings & missing feature impact', icon: Cpu, latency: 20 },
    { key: 'shap', title: 'TreeSHAP Explainability', desc: 'Attribution matrix & directional driver rankings', icon: Brain, latency: 40 },
    { key: 'rag', title: 'Medical RAG', desc: 'ChromaDB vector store guideline evidence retrieval', icon: Sparkles, latency: 35 },
    { key: 'report_gen', title: 'Clinical Report Generation', desc: 'Patient-facing diagnostic synthesis & summary', icon: FileText, latency: 25 },
    { key: 'complete', title: 'Assessment Complete', desc: 'Multimodal predictions ready for clinical review', icon: CheckCircle2, latency: 10 },
  ];

  useEffect(() => {
    if (stage === 'predicting') {
      const interval = setInterval(() => {
        setActiveStageIdx((prev) => {
          if (prev < pipelineStages.length - 2) return prev + 1;
          return prev;
        });
      }, 150);
      return () => clearInterval(interval);
    } else if (stage === 'completed') {
      setActiveStageIdx(pipelineStages.length - 1);
    }
  }, [stage, pipelineStages.length]);

  const progressPct = Math.round(((activeStageIdx + 1) / pipelineStages.length) * 100);
  const currentStageInfo = pipelineStages[activeStageIdx] || pipelineStages[0];

  return (
    <div className="w-full space-y-6">
      {/* 1. TOP SUMMARY BANNER */}
      <Card isGlass={true} className="p-6 bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-primary)] border border-[var(--border-medium)]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">Pipeline v4.0 Stable</Badge>
              <Badge variant="accent" size="sm">Pathway: {pathway}</Badge>
              {stage === 'completed' && <Badge variant="success" size="sm">100% Completed</Badge>}
            </div>
            <h2 className="text-xl font-extrabold text-[var(--text-main)]">
              {stage === 'completed' ? 'Enterprise AI Inference Complete' : `Active Stage: ${currentStageInfo.title}`}
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Synthesizing 7-Pathway Multimodal Ensemble Across Clinical, Wearable, and Gut Taxa.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <CircularProgress value={progressPct} size={64} strokeWidth={6} variant={stage === 'completed' ? 'success' : 'primary'} />
              <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] mt-1 block">Progress</span>
            </div>
            <div className="hidden sm:flex flex-col text-right space-y-1">
              <span className="text-xs font-mono text-[var(--text-muted)]">Est. Remaining: <strong className="text-[var(--text-main)]">{stage === 'completed' ? '0 ms' : '35 ms'}</strong></span>
              <span className="text-xs font-mono text-[var(--text-muted)]">Total Latency: <strong className="text-[var(--primary)]">33.4 ms</strong></span>
            </div>
          </div>
        </div>
      </Card>

      {/* NON-BLOCKING WARNING PANEL */}
      {warningMsg && (
        <Card isGlass={true} className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-xs font-medium">{warningMsg}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            Continue Anyway →
          </Button>
        </Card>
      )}

      {/* ERROR RECOVERY CARD */}
      {stage === 'failed' || errorMsg ? (
        <Card isGlass={true} className="p-6 border-rose-500/30 bg-rose-500/10 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto animate-bounce" />
          <div>
            <h4 className="text-base font-bold text-[var(--text-main)]">Inference Execution Interrupted</h4>
            <p className="text-xs text-[var(--text-muted)] mt-1">{errorMsg || 'Server timeout or validation mismatch encountered during stage execution.'}</p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" size="md" onClick={onBackToVerification}>
              Back to Feature Verification
            </Button>
            <Button variant="primary" size="md" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={onRetry}>
              Retry Inference
            </Button>
          </div>
        </Card>
      ) : null}

      {/* 2. MAIN LAYOUT: 16-STAGE TIMELINE (LEFT) & INFO PANEL (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 16-Stage Vertical Timeline */}
        <div className="lg:col-span-2 space-y-3">
          <Card isGlass={true} className="p-6">
            <h4 className="text-sm font-extrabold text-[var(--text-main)] mb-4 pb-2 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <span>Pipeline Stage Execution Sequence</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">16 Stages</span>
            </h4>

            <div className="space-y-3">
              {pipelineStages.map((stg, idx) => {
                const Icon = stg.icon;
                const isDone = idx < activeStageIdx || stage === 'completed';
                const isCurrent = idx === activeStageIdx && stage !== 'completed';
                const isPending = idx > activeStageIdx && stage !== 'completed';

                return (
                  <div
                    key={stg.key}
                    className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-[var(--bg-primary)] border-[var(--border-subtle)] opacity-90'
                        : isCurrent
                        ? 'bg-[var(--primary-light)] border-[var(--primary)] shadow-sm'
                        : 'bg-[var(--bg-surface)] border-[var(--border-subtle)]/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isDone ? 'bg-[var(--success-light)] text-[var(--success)]' : isCurrent ? 'bg-[var(--primary)] text-white animate-pulse' : 'bg-[var(--border-medium)]/30 text-[var(--text-muted)]'
                      }`}>
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-[var(--text-main)]">{stg.title}</h5>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{stg.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] font-mono text-[var(--text-dim)]">{stg.latency} ms</span>
                      <Badge variant={isDone ? 'success' : isCurrent ? 'primary' : 'info'} size="sm">
                        {isDone ? 'Completed' : isCurrent ? 'Running...' : 'Waiting'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Information Panel */}
        <div className="space-y-6">
          <Card isGlass={true} className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-[var(--text-main)] pb-2 border-b border-[var(--border-subtle)]">
              Active Models & Feature Counts
            </h4>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-main)]">Clinical Expert v3</span>
                <Badge variant="primary" size="sm">{featureCounts.clinical || 22} Features</Badge>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-main)]">Wearable Expert v3</span>
                <Badge variant="secondary" size="sm">{featureCounts.wearable || 15} Metrics</Badge>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-main)]">Gut Expert v3</span>
                <Badge variant="accent" size="sm">{featureCounts.gut || 20} Taxa</Badge>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-main)]">Document Processing</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] truncate max-w-[140px]">{currentDocument}</span>
              </div>
            </div>
          </Card>

          {/* ASSESSMENT COMPLETE CARD */}
          {stage === 'completed' && (
            <Card isGlass={true} className="p-6 border-[var(--success)]/40 bg-[var(--success-light)]/20 text-center space-y-4 animate-scale-in">
              <div className="w-12 h-12 rounded-full bg-[var(--success)] text-white flex items-center justify-center mx-auto shadow-lg animate-pulse">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-extrabold text-[var(--text-main)]">Analysis Complete & Validated</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">Multi-disease predictions, TreeSHAP attributions, and RAG medical evidence are ready.</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                <Badge variant="success" size="sm">Disease Risk Ready</Badge>
                <Badge variant="accent" size="sm">SHAP Ready</Badge>
                <Badge variant="primary" size="sm">RAG Report Ready</Badge>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button variant="primary" size="md" className="w-full" leftIcon={<Activity className="w-4 h-4" />} onClick={onNavigateDashboard || (() => navigate('/dashboard'))}>
                  View Medical Dashboard →
                </Button>
                <Button variant="accent" size="md" className="w-full" leftIcon={<Brain className="w-4 h-4" />} onClick={onNavigateXAI || (() => navigate('/xai'))}>
                  View TreeSHAP Explainability
                </Button>
                <Button variant="outline" size="md" className="w-full" leftIcon={<FileText className="w-4 h-4" />} onClick={onNavigateReport || (() => navigate('/report'))}>
                  View Comprehensive Report
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
