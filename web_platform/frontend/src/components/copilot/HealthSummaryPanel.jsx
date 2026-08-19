import React from 'react';
import { Card, Badge, CircularProgress } from '../ui';
import { Sparkles, ShieldCheck, Activity, CheckCircle2, Calendar } from 'lucide-react';
import { calculateOverallHealthScore } from '../../utils/healthIntelligence';

export default function HealthSummaryPanel({ predictionData }) {
  const healthObj = calculateOverallHealthScore(predictionData);
  const healthScore = healthObj ? healthObj.score : null;
  const dq = predictionData ? Math.round((predictionData.data_quality_score || 0.85) * 100) : null;
  const pathway = predictionData?.effective_pathway || predictionData?.pathway_used || 'C+W+G';
  const mainRisk = predictionData?.disease_outcomes?.Type2_Diabetes;
  const riskProb = mainRisk ? Math.round((mainRisk.calibrated_probability || mainRisk.probability || 0) * 100) : null;

  return (
    <Card isGlass={true} className="p-6 space-y-5 shadow-xl border-l-4 border-l-[var(--primary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="text-base font-extrabold text-[var(--text-main)]">Personalized Health Summary</h3>
        </div>
        <Badge variant={predictionData ? 'success' : 'outline'} size="sm">
          {predictionData ? `Pathway: ${pathway}` : 'No Active Assessment'}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Score Ring */}
        <div className="flex flex-col items-center">
          {healthScore !== null ? (
            <CircularProgress value={healthScore} size={96} strokeWidth={8} variant="success">
              <span className="text-2xl font-extrabold font-mono text-[var(--text-main)]">{healthScore}</span>
              <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase">Out of 100</span>
            </CircularProgress>
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-[var(--border-subtle)] flex flex-col items-center justify-center text-center p-2">
              <span className="text-xs font-mono font-bold text-[var(--text-muted)]">N/A</span>
            </div>
          )}
          <span className="text-xs font-bold text-[var(--text-muted)] mt-2">
            {predictionData ? 'Overall Health Score' : 'Score Not Available'}
          </span>
        </div>


        {/* Key Metrics Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Active Risk Level</span>
            <strong className="text-[var(--warning)] text-xs block">
              {riskProb !== null ? `${mainRisk?.risk_level || 'EVALUATED'} (${riskProb}%)` : 'NO ACTIVE ASSESSMENT'}
            </strong>
            <span className="text-[9px] text-[var(--text-muted)]">Type 2 Diabetes</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Active Modality</span>
            <strong className="text-[var(--primary)] text-xs block">
              {predictionData ? `Pathway ${pathway}` : 'NOT PROVIDED'}
            </strong>
            <span className="text-[9px] text-[var(--text-muted)]">{
              pathway === 'C' ? 'Clinical Only' :
              pathway === 'W' ? 'Wearable Only' :
              pathway === 'G' ? 'Gut Only' :
              pathway === 'C+W' ? 'Clinical + Wearable' :
              pathway === 'C+G' ? 'Clinical + Gut' :
              pathway === 'W+G' ? 'Wearable + Gut' :
              'Clinical + Wearable + Gut'
            }</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">AI Confidence</span>
            <strong className="text-[var(--accent)] text-xs font-mono block">
              {predictionData ? 'High (V4 Stacked)' : 'NOT AVAILABLE'}
            </strong>
            <span className="text-[9px] text-[var(--text-muted)]">Hierarchical Stacker</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Data Quality</span>
            <strong className="text-[var(--text-main)] text-xs font-mono block">
              {dq !== null ? `${dq}%` : 'NOT AVAILABLE'}
            </strong>
            <span className="text-[9px] text-[var(--text-muted)] font-mono">Assessment Data Quality</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
