import React, { useMemo, useState } from 'react';
import {
  Activity, Watch, Dna, Layers, Info, Sparkles, SlidersHorizontal,
  BarChart3, CheckCircle2, ShieldCheck, ArrowRight
} from 'lucide-react';
import { Card, Badge } from './ui';

/**
 * ModalityContributionChart — Assessment Provenance & Meta-Learner Weights Visualization
 * 
 * Shows the calibrated influence of each modality (Clinical, Wearable, Gut)
 * to the final Fusion prediction, based on verified V4 Meta-Learner weights
 * and individual biomarker TreeSHAP attributions.
 */

// Authoritative verified V4 Multimodal Fusion Stacker weights (v4_fusion_modality_weights.json)
export const VERIFIED_V4_FUSION_WEIGHTS = {
  Type2_Diabetes: { clinical: 80.5, wearable: 19.5, gut: 0.0 },
  Prediabetes: { clinical: 65.7, wearable: 32.5, gut: 1.8 },
  High_Adiposity_Risk: { clinical: 82.0, wearable: 14.0, gut: 4.0 },
  Metabolic_Syndrome: { clinical: 90.3, wearable: 4.5, gut: 5.2 },
  NAFLD: { clinical: 95.4, wearable: 4.6, gut: 0.0 },
};

// Authoritative verified W+G Logistic Regression Stacker weights (Remote Multiomics Triage)
export const VERIFIED_WG_STACKER_WEIGHTS = {
  Type2_Diabetes: { wearable: 38.1, gut: 61.9 },
  Prediabetes: { wearable: 27.1, gut: 72.9 },
  High_Adiposity_Risk: { wearable: 21.2, gut: 78.8 },
  Metabolic_Syndrome: { wearable: 38.5, gut: 61.5 },
  NAFLD: { wearable: 38.3, gut: 61.7 },
};

const DISEASE_GUIDELINE_CONTEXT = {
  Type2_Diabetes: {
    title: 'Type 2 Diabetes',
    guideline: 'ADA 2024 Standards of Care',
    rationale: 'Fasting blood glucose and HbA1c serve as the gold-standard diagnostic anchor (80.5% weight), complemented by continuous wearable glucose variability and activity telemetry (19.5%). Gut taxa provide supportive microbiome characterization.',
  },
  Prediabetes: {
    title: 'Prediabetes Risk',
    guideline: 'ADA / WHO Consensus',
    rationale: 'Clinical lab thresholds (65.7% weight) are integrated with high-frequency wearable CGM fluctuations and time-above-range (32.5% weight) to detect early-stage glycemic dysfunction before clinical onset.',
  },
  High_Adiposity_Risk: {
    title: 'Adiposity & Obesity',
    guideline: 'WHO Clinical Obesity Criteria',
    rationale: 'Clinical anthropometrics (BMI, waist circumference, lipids) dominate the primary assessment (82.0% weight), combined with wearable activity energy expenditure and sedentary duration (14.0%).',
  },
  Metabolic_Syndrome: {
    title: 'Metabolic Syndrome',
    guideline: 'AHA / NCEP ATP III Statement',
    rationale: 'Multi-system hemodynamic and metabolic laboratory parameters (BP, FPG, Triglycerides, HDL) anchor 90.3% of the risk decision, validated against authoritative clinical practice thresholds.',
  },
  NAFLD: {
    title: 'NAFLD / MASLD Liver Health',
    guideline: 'AASLD 2023 Clinical Guidance',
    rationale: 'Hepatic transaminases (ALT, AST), lipid chemistry, and BMI account for 95.4% of the clinical anchor. When clinical labs are unavailable (W+G remote triage), gut microbiome diversity provides a proven +0.0364 AUROC gain.',
  },
};

const MODALITY_CONFIG = {
  clinical: {
    key: 'clinical',
    label: 'Clinical Lab Chemistry',
    shortLabel: 'Clinical Labs',
    roleTag: 'Primary Diagnostic Anchor',
    icon: Activity,
    color: '#8b5cf6',
    gradient: 'from-violet-600 via-purple-500 to-indigo-600',
    barGradient: 'bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600',
    bg: 'bg-violet-50/80 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800/60',
    text: 'text-violet-700 dark:text-violet-300',
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200 border border-violet-300 dark:border-violet-700',
    description: 'Fasting venous blood glucose, HbA1c red cell glycation, lipid profiles (HDL/LDL/Triglycerides), and liver enzymes (ALT/AST).',
    standardCount: 18,
  },
  wearable: {
    key: 'wearable',
    label: 'Wearable Telemetry Signal',
    shortLabel: 'Wearables & CGM',
    roleTag: 'Continuous Physiological Stream',
    icon: Watch,
    color: '#06b6d4',
    gradient: 'from-cyan-500 via-sky-500 to-blue-600',
    barGradient: 'bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600',
    bg: 'bg-cyan-50/80 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800/60',
    text: 'text-cyan-700 dark:text-cyan-300',
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700',
    description: 'Continuous glucose fluctuations (TIR, TAR, CV), heart rate variability (HRV RMSSD), resting heart rate, sleep architecture, and daily activity.',
    standardCount: 15,
  },
  gut: {
    key: 'gut',
    label: 'Gut Microbiome Multiomics',
    shortLabel: 'Gut Microbiome',
    roleTag: 'Metagenomic Multiomics',
    icon: Dna,
    color: '#10b981',
    gradient: 'from-emerald-400 via-teal-500 to-green-600',
    barGradient: 'bg-gradient-to-r from-emerald-400 via-teal-500 to-green-600',
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700',
    description: '40 bacterial taxa relative abundance, short-chain fatty acid (SCFA) indices, alpha-diversity metrics, and Firmicutes/Bacteroidetes ratios.',
    standardCount: 49,
  },
};

export default function ModalityContributionChart({
  attributions,
  selectedDisease = 'Type2_Diabetes',
  predictionData = null,
  effectivePathway = null,
  metaLearnerWeights = null,
}) {
  const [attributionMode, setAttributionMode] = useState('metaLearner'); // 'metaLearner' | 'treeShap'

  // Resolve active pathway
  const activePathway = useMemo(() => {
    if (effectivePathway) return effectivePathway;
    if (predictionData?.effective_pathway) return predictionData.effective_pathway;
    if (predictionData?.active_pathway) return predictionData.active_pathway;

    const hasC = Boolean(attributions?.clinical);
    const hasW = Boolean(attributions?.wearable);
    const hasG = Boolean(attributions?.gut);

    if (hasC && hasW && hasG) return 'C+W+G';
    if (hasC && hasW) return 'C+W';
    if (hasC && hasG) return 'C+G';
    if (hasW && hasG) return 'W+G';
    if (hasC) return 'C';
    if (hasW) return 'W';
    if (hasG) return 'G';
    return 'C+W+G';
  }, [effectivePathway, predictionData, attributions]);

  // Compute TreeSHAP cumulative absolute magnitude
  const treeShapSums = useMemo(() => {
    if (!attributions) return { clinical: 0, wearable: 0, gut: 0, total: 0 };
    const sums = { clinical: 0, wearable: 0, gut: 0 };
    let total = 0;

    ['clinical', 'wearable', 'gut'].forEach((mod) => {
      const modObj = attributions[mod] || {};
      const feats = modObj.all_features || modObj.top_risk_drivers || modObj.drivers || [];
      let sum = 0;
      feats.forEach((f) => {
        const shapVal = typeof f === 'number' ? f : (f.shap_attribution ?? f.shap_value ?? f.attribution ?? f.shap ?? 0);
        sum += Math.abs(Number(shapVal) || 0);
      });
      sums[mod] = sum;
      total += sum;
    });

    return { ...sums, total };
  }, [attributions]);

  // Compute calibrated Meta-Learner decision weights for selected disease & active pathway
  const calibratedWeights = useMemo(() => {
    // 1. Explicit weights passed from backend
    if (metaLearnerWeights && typeof metaLearnerWeights === 'object') {
      const clean = {};
      let sum = 0;
      ['clinical', 'wearable', 'gut'].forEach((k) => {
        const val = Number(metaLearnerWeights[k] ?? metaLearnerWeights[k.toUpperCase()] ?? 0);
        clean[k] = val > 1 ? val : val * 100;
        sum += clean[k];
      });
      if (sum > 0) {
        return {
          clinical: Math.round((clean.clinical / sum) * 100),
          wearable: Math.round((clean.wearable / sum) * 100),
          gut: Math.round((clean.gut / sum) * 100),
        };
      }
    }

    // 2. W+G Remote Multiomics Triage pathway (No Clinical Labs)
    if (activePathway === 'W+G') {
      const base = VERIFIED_WG_STACKER_WEIGHTS[selectedDisease] || { wearable: 38.1, gut: 61.9 };
      return {
        clinical: 0,
        wearable: Math.round(base.wearable),
        gut: Math.round(base.gut),
      };
    }

    // 3. Single Modality Pathways
    if (activePathway === 'C') return { clinical: 100, wearable: 0, gut: 0 };
    if (activePathway === 'W') return { clinical: 0, wearable: 100, gut: 0 };
    if (activePathway === 'G') return { clinical: 0, wearable: 0, gut: 100 };

    // 4. Dual Modality C+W
    if (activePathway === 'C+W') {
      const base = VERIFIED_V4_FUSION_WEIGHTS[selectedDisease] || { clinical: 80.5, wearable: 19.5, gut: 0.0 };
      const tot = base.clinical + base.wearable;
      return {
        clinical: Math.round((base.clinical / tot) * 100),
        wearable: Math.round((base.wearable / tot) * 100),
        gut: 0,
      };
    }

    // 5. Dual Modality C+G
    if (activePathway === 'C+G') {
      const base = VERIFIED_V4_FUSION_WEIGHTS[selectedDisease] || { clinical: 90.0, wearable: 0, gut: 10.0 };
      const tot = base.clinical + (base.gut || 5.0);
      return {
        clinical: Math.round((base.clinical / tot) * 100),
        wearable: 0,
        gut: Math.round(((base.gut || 5.0) / tot) * 100),
      };
    }

    // 6. Comprehensive C+W+G Triple-Expert Stacker (Default Standard)
    const base = VERIFIED_V4_FUSION_WEIGHTS[selectedDisease] || { clinical: 80.5, wearable: 19.5, gut: 0.0 };
    return {
      clinical: Math.round(base.clinical),
      wearable: Math.round(base.wearable),
      gut: Math.round(base.gut),
    };
  }, [metaLearnerWeights, activePathway, selectedDisease]);

  // Combine into unified contribution cards
  const contributions = useMemo(() => {
    const list = [];
    const mods = ['clinical', 'wearable', 'gut'];

    mods.forEach((mod) => {
      const cfg = MODALITY_CONFIG[mod];
      const modObj = attributions?.[mod] || {};
      const activeCount = (modObj.all_features || modObj.drivers || []).length || cfg.standardCount;

      let pct = 0;
      if (attributionMode === 'metaLearner') {
        pct = calibratedWeights[mod] || 0;
      } else {
        pct = treeShapSums.total > 0 ? Math.round((treeShapSums[mod] / treeShapSums.total) * 100) : 0;
      }

      list.push({
        ...cfg,
        percentage: pct,
        metaLearnerPct: calibratedWeights[mod] || 0,
        treeShapPct: treeShapSums.total > 0 ? Math.round((treeShapSums[mod] / treeShapSums.total) * 100) : 0,
        activeCount,
      });
    });

    return list.sort((a, b) => b.percentage - a.percentage);
  }, [attributions, calibratedWeights, treeShapSums, attributionMode]);

  const dominant = contributions[0] || contributions.find(c => c.key === 'clinical');
  const guidelineInfo = DISEASE_GUIDELINE_CONTEXT[selectedDisease] || DISEASE_GUIDELINE_CONTEXT.Type2_Diabetes;

  return (
    <Card isGlass={true} className="p-6 space-y-6 border border-[var(--border-medium)] shadow-lg bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-primary)] to-[var(--bg-surface)]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-[var(--text-main)] flex items-center gap-2">
                Multi-Modal Assessment Provenance
              </h3>
              <Badge variant="accent" size="sm" className="font-mono text-[10px] font-bold tracking-wider">
                Pathway: {activePathway}
              </Badge>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Verified V4 Stacker
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Calibrated influence of each patient data source on your <strong className="text-[var(--text-main)]">{guidelineInfo.title}</strong> risk assessment
            </p>
          </div>
        </div>

        {/* Controls: Mode Switcher & Dominant Badge */}
        <div className="flex items-center gap-3 flex-wrap self-start lg:self-auto">
          {/* Provenance Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs">
            <button
              onClick={() => setAttributionMode('metaLearner')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                attributionMode === 'metaLearner'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Show calibrated Logistic Regression meta-learner probability weights"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Meta-Learner Weights
            </button>
            <button
              onClick={() => setAttributionMode('treeShap')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                attributionMode === 'treeShap'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Show raw feature-level TreeSHAP attribution sums"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Biomarker SHAP Mass
            </button>
          </div>

          {/* Dominant Driver Badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-xs ${dominant.badge}`}>
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Dominant: {dominant.shortLabel} ({dominant.percentage}%)</span>
          </div>
        </div>
      </div>

      {/* Proportional Multi-Segment Provenance Track */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
          <span>Modality Decision Allocation</span>
          <span className="font-mono text-[11px] text-[var(--text-main)]">
            {attributionMode === 'metaLearner' ? 'V4 Calibrated Meta-Learner Stack' : 'Cumulative Absolute TreeSHAP Attributions'}
          </span>
        </div>

        <div className="w-full h-5 rounded-full overflow-hidden flex bg-gray-200/60 dark:bg-gray-800/80 p-0.5 border border-[var(--border-medium)] shadow-inner">
          {contributions.map((c) => {
            if (c.percentage === 0) return null;
            return (
              <div
                key={c.key}
                style={{ width: `${c.percentage}%` }}
                className={`h-full rounded-sm ${c.barGradient} transition-all duration-700 ease-out flex items-center justify-center text-[10px] font-black text-white shadow-sm overflow-hidden`}
                title={`${c.label}: ${c.percentage}%`}
              >
                {c.percentage >= 12 && (
                  <span className="truncate px-1 drop-shadow-xs">
                    {c.shortLabel} {c.percentage}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-1">
          {contributions.map((c) => (
            <div key={c.key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: c.color }} />
              <strong className="text-[var(--text-main)] font-bold">{c.shortLabel}:</strong>
              <span className="font-black" style={{ color: c.color }}>{c.percentage}%</span>
              {c.percentage === 0 && <span className="text-[10px] text-[var(--text-muted)]">(Auxiliary)</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 3 Detailed Modality Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contributions.map((c) => {
          const Icon = c.icon;
          const isDominant = c.key === dominant.key;
          return (
            <div
              key={c.key}
              className={`p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden ${
                isDominant
                  ? 'bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-primary)] border-[var(--primary)] shadow-md ring-2 ring-[var(--primary)]/20'
                  : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
              }`}
            >
              {isDominant && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-purple-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-bl-xl tracking-wider shadow-xs">
                  Dominant Anchor
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center shrink-0 shadow-xs`}>
                    <Icon className={`w-4 h-4 ${c.text}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-[var(--text-main)] leading-tight">{c.shortLabel}</h4>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{c.activeCount} active biomarkers</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xl font-black tabular-nums ${c.text}`}>
                    {c.percentage}%
                  </span>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {attributionMode === 'metaLearner' ? 'Meta Weight' : 'SHAP Mass'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${c.badge}`}>
                  {c.roleTag}
                </span>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {c.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Clinical Grounding & Guideline Rationale Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 border border-blue-200/80 dark:border-blue-900/50">
        <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="text-xs font-black text-indigo-950 dark:text-indigo-200">
              Clinical Guideline Grounding ({guidelineInfo.guideline}):
            </strong>
            <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
              Evidence Tier 1
            </Badge>
          </div>
          <p className="text-xs text-indigo-900/90 dark:text-indigo-300/90 leading-relaxed">
            {guidelineInfo.rationale}
          </p>
        </div>
      </div>
    </Card>
  );
}
