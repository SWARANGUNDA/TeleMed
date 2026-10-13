import React, { useMemo } from 'react';
import { Activity, Watch, Dna, Layers, Info, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, Badge } from './ui';

/**
 * ModalityContributionChart — Assessment Provenance Visualization
 * 
 * Shows the proportional influence of each modality (Clinical, Wearable, Gut)
 * to the final Fusion prediction, explained in clear, patient-friendly terms.
 */

const MODALITY_CONFIG = {
  gut: {
    label: 'Gut Microbiome Signal',
    shortLabel: 'Gut Microbiome',
    icon: Dna,
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    description: 'Metagenomic taxa, SCFA short-chain fatty acids, and microbial ecosystem balance.'
  },
  wearable: {
    label: 'Wearable Telemetry Signal',
    shortLabel: 'Wearables',
    icon: Watch,
    color: '#3b82f6',
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    description: 'Continuous glucose fluctuations, heart rate variability (HRV), sleep cycles, and daily activity.'
  },
  clinical: {
    label: 'Clinical Lab Chemistry',
    shortLabel: 'Clinical Labs',
    icon: Activity,
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-violet-500',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    description: 'Fasting venous blood glucose, HbA1c red cell glycation, lipid profiles, and liver enzymes.'
  },
};

export default function ModalityContributionChart({ attributions, selectedDisease }) {
  // Compute modality contribution percentages from absolute SHAP sums
  const contributions = useMemo(() => {
    if (!attributions) return [];

    const modSums = {};
    let totalAbsShap = 0;

    ['gut', 'wearable', 'clinical'].forEach(mod => {
      const modObj = attributions[mod] || {};
      const feats = modObj.all_features || modObj.top_risk_drivers || modObj.drivers || [];
      let absSum = 0;

      feats.forEach(f => {
        const shapVal = typeof f === 'number' ? f : (f.shap_attribution ?? f.shap_value ?? f.attribution ?? f.shap ?? 0);
        absSum += Math.abs(Number(shapVal) || 0);
      });

      modSums[mod] = absSum;
      totalAbsShap += absSum;
    });

    if (totalAbsShap === 0) return [];

    return Object.entries(modSums)
      .filter(([, sum]) => sum > 0)
      .map(([mod, sum]) => ({
        modality: mod,
        percentage: Math.round((sum / totalAbsShap) * 100),
        rawSum: sum,
        activeCount: (attributions[mod]?.all_features || attributions[mod]?.drivers || []).length || 0,
        ...(MODALITY_CONFIG[mod] || {}),
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [attributions]);

  if (contributions.length === 0) return null;

  const dominant = contributions[0];
  const diseaseName = selectedDisease ? selectedDisease.replace(/Type2/g, 'Type 2').replace(/_/g, ' ') : 'Health';

  return (
    <Card isGlass={true} className="p-6 space-y-6 border border-[var(--border-medium)] shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
              Multi-Modal Assessment Provenance
              <span className="text-[11px] font-medium font-mono text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full border border-[var(--primary)]/20">
                Fusion Meta-Learner
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Breakdown of how much each data source influenced your {diseaseName} assessment
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Dominant Driver:</span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${dominant.badge}`}>
            <Sparkles className="w-3.5 h-3.5" />
            {dominant.label} ({dominant.percentage}%)
          </span>
        </div>
      </div>

      {/* Proportional Multi-Segment Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800 p-0.5 border border-[var(--border-subtle)]">
          {contributions.map((c) => (
            <div
              key={c.modality}
              style={{ width: `${c.percentage}%` }}
              className={`h-full rounded-sm bg-gradient-to-r ${c.gradient} transition-all duration-700 ease-out`}
              title={`${c.label}: ${c.percentage}%`}
            />
          ))}
        </div>
        <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] font-mono px-1">
          {contributions.map((c) => (
            <span key={c.modality} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
              <strong className="text-[var(--text-main)]">{c.shortLabel}</strong>: {c.percentage}%
            </span>
          ))}
        </div>
      </div>

      {/* 3 Detailed Modality Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contributions.map((c) => {
          const Icon = c.icon;
          const isDominant = c.modality === dominant.modality;
          return (
            <div
              key={c.modality}
              className={`p-4 rounded-2xl border transition-all ${
                isDominant
                  ? 'bg-gradient-to-b from-[var(--bg-surface)] to-[var(--bg-primary)] border-[var(--primary)] shadow-sm'
                  : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--border-medium)]'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${c.text}`} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-main)] leading-tight">{c.shortLabel}</h4>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{c.activeCount} active biomarkers</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-black tabular-nums ${c.text}`}>
                    {c.percentage}%
                  </span>
                  <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Weight</div>
                </div>
              </div>

              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {c.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Plain Language Interpretation Callout */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/50">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <strong className="text-xs font-bold text-blue-900 dark:text-blue-200">
            What this means for you:
          </strong>
          <p className="text-xs text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
            The AI assigned <strong className="text-blue-950 dark:text-blue-100">{dominant.percentage}%</strong> of its decision weight to your <strong className="text-blue-950 dark:text-blue-100">{dominant.label}</strong>. 
            This means {dominant.modality === 'gut' 
              ? 'your gut bacteria profile (especially short-chain fatty acid producers) was the most decisive factor in determining your risk probability.' 
              : dominant.modality === 'wearable' 
              ? 'your daily continuous wearable patterns (glucose variability, sleep, and activity) were the primary drivers of this prediction.'
              : 'your clinical lab blood tests were the primary decisive factors.'}
          </p>
        </div>
      </div>
    </Card>
  );
}
