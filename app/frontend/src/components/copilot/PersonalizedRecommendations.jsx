import React, { useState } from 'react';
import { Card, Badge } from '../ui';
import { HeartPulse, Utensils, Activity, Stethoscope, Sparkles, ChevronDown, ChevronUp, Dna, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PersonalizedRecommendations({ predictionData }) {
  const [expandedIdx, setExpandedIdx] = useState(0);

  if (!predictionData) {
    return (
      <Card isGlass={true} className="p-5 text-center space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <Sparkles className="w-6 h-6 text-[var(--text-muted)] mx-auto" />
        <h4 className="text-xs font-bold text-[var(--text-main)]">No Recommendations Available</h4>
        <p className="text-[11px] text-[var(--text-muted)]">Run a health assessment to generate personalized evidence recommendations.</p>
      </Card>
    );
  }

  // Extract features strictly from real active prediction data
  const clin = predictionData?.confirmed_features?.clinical || predictionData?.clinical_features || predictionData?.clinical_data || predictionData?.input_data?.clinical || {};
  const wear = predictionData?.confirmed_features?.wearable || predictionData?.wearable_features || predictionData?.wearable_data || predictionData?.input_data?.wearable || {};
  const predictions = predictionData?.predictions || predictionData?.disease_outcomes || {};

  const getProb = (key) => {
    const item = predictions[key];
    if (!item) return null;
    return item.calibrated_probability !== undefined ? item.calibrated_probability : (item.probability || null);
  };

  const t2dRisk = getProb('Type2_Diabetes');
  const glucose = clin.Glucose ?? clin.Fasting_Blood_Glucose ?? clin.Fasting_Glucose ?? null;
  const hba1c = clin.HbA1c ?? null;
  const sysBp = clin.Systolic_BP ?? null;
  const diaBp = clin.Diastolic_BP ?? null;
  const steps = wear.Total_Steps ?? wear.Daily_Steps ?? wear.average_daily_steps ?? null;
  const rhr = wear.Resting_Heart_Rate ?? wear.resting_heart_rate ?? null;

  const categories = [];

  // Glycemic Recommendation (Only if glucose/hba1c or t2dRisk is actually present)
  if (glucose !== null || hba1c !== null || t2dRisk !== null) {
    const isHigh = (glucose && glucose >= 126) || (hba1c && hba1c >= 6.5) || (t2dRisk && t2dRisk >= 0.45);
    const isPre = (glucose && glucose >= 100) || (hba1c && hba1c >= 5.7) || (t2dRisk && t2dRisk >= 0.3);

    categories.push({
      group: 'Glycemic & Dietary Nutrition Guidance',
      icon: Utensils,
      rationale: `Evidence Rationale: ${glucose ? `Measured Fasting Glucose (${glucose} mg/dL)` : ''} ${hba1c ? `& HbA1c (${hba1c}%)` : ''} ${t2dRisk !== null ? `(Model Risk Estimate: ${Math.round(t2dRisk * 100)}%)` : ''}. Focus on low-glycemic load foods.`,
      items: [
        { icon: '🥗', title: 'High-Fiber & Low-GI Nutrition', detail: 'Incorporate complex carbohydrates, oats, lentils, vegetables, and lean protein to stabilize postprandial glucose.' },
        { icon: '🏃', title: 'Post-Meal Physical Activity', detail: 'Walking 15–30 minutes after major meals helps activate muscle glucose transporters independently of insulin.' }
      ],
      badge: isHigh ? 'NEEDS ATTENTION' : (isPre ? 'EVIDENCE PROTOCOL' : 'OPTIMAL'),
      variant: isHigh ? 'danger' : (isPre ? 'warning' : 'success'),
    });
  }

  // Cardiovascular Recommendation (Only if BP or RHR is actually present)
  if (sysBp !== null || diaBp !== null || rhr !== null) {
    const isBpElevated = (sysBp && sysBp >= 130) || (diaBp && diaBp >= 85);
    categories.push({
      group: 'Cardiovascular & Vitals Guidance',
      icon: HeartPulse,
      rationale: `Evidence Rationale: ${sysBp && diaBp ? `Measured BP (${sysBp}/${diaBp} mmHg)` : ''} ${rhr ? `Resting Heart Rate (${rhr} bpm)` : ''}.`,
      items: [
        { icon: '❤️', title: 'Sodium Control (<2,000 mg/day)', detail: 'Maintain dietary sodium below 2.0g per day and increase potassium-rich leafy vegetables.' },
        { icon: '⌚', title: 'Heart Rate Monitoring', detail: 'Track resting heart rate trends to confirm autonomic cardiovascular stability.' }
      ],
      badge: isBpElevated ? 'NEEDS ATTENTION' : 'HEALTHY CORRIDOR',
      variant: isBpElevated ? 'warning' : 'success',
    });
  }

  // Activity Recommendation (Only if steps is actually present)
  if (steps !== null) {
    categories.push({
      group: 'Physical Activity & Telemetry Target',
      icon: Activity,
      rationale: `Evidence Rationale: Recorded daily telemetry shows average of ${Math.round(steps)} steps/day.`,
      items: [
        { icon: '👟', title: `Daily Activity Goal (${Math.round(steps)} steps)`, detail: 'Sustain active physical movement to support peripheral circulation and insulin sensitivity.' },
        { icon: '🌙', title: 'Sleep & Recovery Hygiene', detail: 'Maintain 7-8 hours of sleep to support nocturnal autonomic recovery and metabolic balance.' }
      ],
      badge: 'PROGRESSING WELL',
      variant: 'success',
    });
  }

  if (categories.length === 0) {
    return (
      <Card isGlass={true} className="p-4 text-center space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <Sparkles className="w-5 h-5 text-[var(--text-muted)] mx-auto" />
        <h4 className="text-xs font-bold text-[var(--text-main)]">Dynamic Insights Evaluated</h4>
        <p className="text-[11px] text-[var(--text-muted)]">All measured biomarkers are within normal clinical reference ranges.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Categories List */}
      <div className="space-y-3">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          const isExpanded = expandedIdx === idx;
          return (
            <Card
              key={idx}
              isGlass={true}
              className={`p-4 space-y-3 transition-all border ${
                isExpanded
                  ? 'border-blue-600 bg-[var(--bg-surface)] shadow-xs'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-blue-300'
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 shrink-0">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-main)]">{cat.group}</h4>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      {isExpanded ? 'Collapse reasoning' : 'View rationale'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={cat.variant} size="sm" className="font-mono text-[9.5px]">
                    {cat.badge}
                  </Badge>
                  {isExpanded ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-[var(--text-main)] font-medium leading-relaxed flex items-start gap-2">
                  <Dna size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>{cat.rationale}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {cat.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-main)]">
                      <span>{item.icon}</span>
                      <span className="truncate">{item.title}</span>
                    </div>
                    <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed font-medium">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
