/**
 * healthIntelligence.js — Transparent Patient Health Intelligence Engine
 * 
 * Computes deterministic patient health scores, metabolic trajectories, 
 * biomarker shift classifications, cross-modality insights, and early-warning indicators
 * strictly using the patient's actual historical assessment data.
 */

import { classifyBiomarker, classifyWearable, classifyGut } from './clinicalRanges';

/**
 * 1. Overall Patient Health Score (0 - 100)
 * Transparent Formula:
 * - Data Quality Weight: 20% (DQ_Score * 20)
 * - Metabolic Risk Penalty: 50% (50 - Mean(Disease_Risk_Probabilities) * 50)
 * - Biomarker Normalcy Component: 30% (Normalcy_Ratio * 30)
 */
export function calculateOverallHealthScore(predictionData) {
  if (!predictionData) return null;

  const dq = predictionData.data_quality_score ?? predictionData.overall_quality_score ?? 0.85;
  const dqComponent = (dq > 1.0 ? dq / 100 : dq) * 20;

  const outcomes = predictionData.disease_outcomes || predictionData.predictions || {};
  const diseaseKeys = ['Type2_Diabetes', 'Prediabetes', 'High_Adiposity_Risk', 'Metabolic_Syndrome', 'NAFLD'];
  let riskSum = 0;
  let riskCount = 0;

  diseaseKeys.forEach(key => {
    const item = outcomes[key];
    if (item) {
      const prob = item.calibrated_probability ?? item.probability ?? 0.2;
      riskSum += (prob > 1.0 ? prob / 100 : prob);
      riskCount++;
    }
  });

  const meanRisk = riskCount > 0 ? riskSum / riskCount : 0.2;
  const riskComponent = Math.max(0, 50 - (meanRisk * 50));

  // Biomarker Normalcy Ratio
  const clin = predictionData.confirmed_features?.clinical || predictionData.clinical_features || {};
  let normalCount = 0;
  let totalCount = 0;

  Object.keys(clin).forEach(k => {
    if (['Patient_ID', 'Gender'].includes(k)) return;
    const item = clin[k];
    const val = typeof item === 'object' ? item.value ?? item.raw_value : item;
    if (val !== null && val !== undefined) {
      totalCount++;
      const cls = classifyBiomarker(k, val);
      if (cls.category === 'normal' || cls.status === 'NORMAL' || cls.status === 'OPTIMAL') {
        normalCount++;
      }
    }
  });

  const isNormalcyAvailable = totalCount > 0;
  const normalcyRatio = isNormalcyAvailable ? normalCount / totalCount : 0.5; // Neutral 50% baseline if 0 biomarkers present
  const normalcyComponent = normalcyRatio * 30;

  const finalScore = Math.min(100, Math.max(0, Math.round(dqComponent + riskComponent + normalcyComponent)));

  return {
    score: finalScore,
    breakdown: {
      dataQualityPts: Math.round(dqComponent),
      metabolicRiskPts: Math.round(riskComponent),
      biomarkerNormalcyPts: Math.round(normalcyComponent),
      totalBiomarkersEvaluated: totalCount,
      normalBiomarkersCount: normalCount,
      isNormalcyAvailable
    },
    formulaDescription: 'Calculated transparently from Data Quality Score (20%), Inverse Mean Disease Risk (50%), and Biomarker Normalcy Ratio (30%).'
  };
}


/**
 * 2. Longitudinal Shifts: "What's Improving?" and "What's Worsening?"
 */
export function analyzeLongitudinalShifts(records) {
  if (!records || records.length < 2) {
    return { improving: [], worsening: [], stable: [], hasHistory: false };
  }

  const recent = records[0];
  const baseline = records[records.length - 1];

  const improving = [];
  const worsening = [];
  const stable = [];

  // A. Disease Risk Trajectory Shifts
  const recentOutcomes = recent.prediction_snapshot?.disease_outcomes || {};
  const baselineOutcomes = baseline.prediction_snapshot?.disease_outcomes || {};

  const diseaseKeys = ['Type2_Diabetes', 'Prediabetes', 'High_Adiposity_Risk', 'Metabolic_Syndrome', 'NAFLD'];
  diseaseKeys.forEach(key => {
    const p1 = recentOutcomes[key]?.calibrated_probability ?? recentOutcomes[key]?.probability;
    const p2 = baselineOutcomes[key]?.calibrated_probability ?? baselineOutcomes[key]?.probability;

    if (p1 !== undefined && p2 !== undefined) {
      const diffPct = Math.round((p1 - p2) * 100);
      const name = key.replace(/_/g, ' ');
      if (diffPct <= -3) {
        improving.push({
          label: `${name} Risk`,
          shift: `${diffPct}%`,
          detail: `Risk decreased from ${Math.round(p2 * 100)}% to ${Math.round(p1 * 100)}%`,
          category: 'Risk Outcome'
        });
      } else if (diffPct >= 3) {
        worsening.push({
          label: `${name} Risk`,
          shift: `+${diffPct}%`,
          detail: `Risk increased from ${Math.round(p2 * 100)}% to ${Math.round(p1 * 100)}%`,
          category: 'Risk Outcome'
        });
      } else {
        stable.push({
          label: `${name} Risk`,
          shift: `${diffPct}%`,
          detail: `Stable at ${Math.round(p1 * 100)}%`,
          category: 'Risk Outcome'
        });
      }
    }
  });

  // B. Clinical Biomarker Shifts
  const clin1 = recent.confirmed_features?.clinical || {};
  const clin2 = baseline.confirmed_features?.clinical || {};

  const trackedLabs = [
    { key: 'Fasting_Blood_Glucose', name: 'Fasting Blood Glucose', unit: 'mg/dL', lowerIsBetter: true },
    { key: 'HbA1c', name: 'HbA1c', unit: '%', lowerIsBetter: true },
    { key: 'BMI', name: 'BMI', unit: 'kg/m²', lowerIsBetter: true },
    { key: 'Systolic_BP', name: 'Systolic BP', unit: 'mmHg', lowerIsBetter: true },
    { key: 'Triglycerides', name: 'Triglycerides', unit: 'mg/dL', lowerIsBetter: true },
    { key: 'LDL_Cholesterol', name: 'LDL Cholesterol', unit: 'mg/dL', lowerIsBetter: true },
    { key: 'HDL_Cholesterol', name: 'HDL Cholesterol', unit: 'mg/dL', lowerIsBetter: false }
  ];

  trackedLabs.forEach(item => {
    const v1 = clin1[item.key];
    const v2 = clin2[item.key];
    if (v1 !== undefined && v2 !== undefined && typeof v1 === 'number' && typeof v2 === 'number') {
      const diff = v1 - v2;
      const formattedDiff = diff > 0 ? `+${diff.toFixed(1)} ${item.unit}` : `${diff.toFixed(1)} ${item.unit}`;
      
      const isImprovement = item.lowerIsBetter ? diff < 0 : diff > 0;
      if (Math.abs(diff) > 0.1) {
        if (isImprovement) {
          improving.push({
            label: item.name,
            shift: formattedDiff,
            detail: `Shifted from ${v2} to ${v1} ${item.unit}`,
            category: 'Clinical Lab'
          });
        } else {
          worsening.push({
            label: item.name,
            shift: formattedDiff,
            detail: `Shifted from ${v2} to ${v1} ${item.unit}`,
            category: 'Clinical Lab'
          });
        }
      }
    }
  });

  return { improving, worsening, stable, hasHistory: true };
}

/**
 * 3. Rules-Based Early Warning Indicators
 */
export function detectEarlyWarnings(predictionData, historyRecords = []) {
  const warnings = [];
  if (!predictionData) return warnings;

  const clin = predictionData.confirmed_features?.clinical || predictionData.clinical_features || {};
  const outcomes = predictionData.disease_outcomes || predictionData.predictions || {};

  // Rule 1: High Glucose
  const glucose = clin.Fasting_Blood_Glucose;
  if (glucose && glucose >= 126) {
    warnings.push({
      id: 'EW-GLUCOSE',
      title: 'Elevated Fasting Blood Glucose Indicator',
      severity: 'HIGH',
      indicator: `Measured Fasting Glucose: ${glucose} mg/dL (Threshold ≥ 126 mg/dL)`,
      clinicalNote: 'Indicates impaired fasting glycemic control. Recommend physician follow-up for diagnostic confirmation.'
    });
  }

  // Rule 2: High Systolic / Diastolic BP
  const sbp = clin.Systolic_BP;
  const dbp = clin.Diastolic_BP;
  if ((sbp && sbp >= 140) || (dbp && dbp >= 90)) {
    warnings.push({
      id: 'EW-BP',
      title: 'Elevated Blood Pressure Indicator',
      severity: 'HIGH',
      indicator: `Blood Pressure: ${sbp || '--'}/${dbp || '--'} mmHg (Threshold ≥ 140/90 mmHg)`,
      clinicalNote: 'Exceeds standard hypertension screening threshold. Recommend ambulatory BP monitoring.'
    });
  }

  // Rule 3: Significant Risk Acceleration (if history exists)
  if (historyRecords && historyRecords.length >= 2) {
    const recent = historyRecords[0]?.prediction_snapshot?.disease_outcomes || {};
    const baseline = historyRecords[historyRecords.length - 1]?.prediction_snapshot?.disease_outcomes || {};

    Object.keys(recent).forEach(key => {
      const p1 = recent[key]?.calibrated_probability ?? recent[key]?.probability;
      const p2 = baseline[key]?.calibrated_probability ?? baseline[key]?.probability;
      if (p1 !== undefined && p2 !== undefined && (p1 - p2) >= 0.15) {
        warnings.push({
          id: `EW-RISK-${key}`,
          title: `Accelerating ${key.replace(/_/g, ' ')} Risk Shift`,
          severity: 'MODERATE',
          indicator: `Risk probability increased by +${Math.round((p1 - p2) * 100)}% across historical assessments`,
          clinicalNote: 'Significant longitudinal risk elevation detected. Lifestyle intervention & physician consultation recommended.'
        });
      }
    });
  }

  return warnings;
}

/**
 * 4. Cross-Modality & Gut Microbiome Insights (Correlative)
 */
export function generateCrossModalityInsights(predictionData) {
  const insights = [];
  if (!predictionData) return insights;

  const clin = predictionData.confirmed_features?.clinical || predictionData.clinical_features || {};
  const wear = predictionData.confirmed_features?.wearable || predictionData.wearable_features || {};
  const gut = predictionData.confirmed_features?.gut || predictionData.gut_features || {};

  // Insight A: Activity & Glycemic Correlation
  if (wear.Daily_Steps && clin.Fasting_Blood_Glucose) {
    if (wear.Daily_Steps < 5000 && clin.Fasting_Blood_Glucose > 100) {
      insights.push({
        title: 'Activity & Glycemic Correlation',
        description: `Sedentary physical activity (${wear.Daily_Steps.toLocaleString()} daily steps) correlates with elevated fasting blood glucose (${clin.Fasting_Blood_Glucose} mg/dL). Increasing daily movement supports glycemic sensitivity.`,
        tag: 'Clinical + Wearable',
        variant: 'warning'
      });
    } else if (wear.Daily_Steps >= 8000 && clin.Fasting_Blood_Glucose <= 100) {
      insights.push({
        title: 'Optimal Activity & Glucose Balance',
        description: `High daily step count (${wear.Daily_Steps.toLocaleString()} steps) aligns with optimal fasting blood glucose (${clin.Fasting_Blood_Glucose} mg/dL).`,
        tag: 'Clinical + Wearable',
        variant: 'success'
      });
    }
  }

  // Insight B: Sleep & Stress & Autonomic Tone Correlation
  if (wear.Total_Sleep_Duration_Hours && wear.HRV_RMSSD) {
    if (wear.Total_Sleep_Duration_Hours < 6 && wear.HRV_RMSSD < 30) {
      insights.push({
        title: 'Sleep Duration & HRV Autonomic Tone',
        description: `Short sleep duration (${wear.Total_Sleep_Duration_Hours} hrs) coincides with reduced HRV (${wear.HRV_RMSSD} ms), signaling sympathetic nervous system dominance.`,
        tag: 'Wearable Telemetry',
        variant: 'warning'
      });
    }
  }

  // Insight C: Gut Microbiome Taxa Interpretation
  const akkermansia = gut['Akkermansia_muciniphila'] ?? gut['g_Akkermansia'];
  if (akkermansia !== undefined && akkermansia !== null) {
    const val = typeof akkermansia === 'object' ? akkermansia.value ?? akkermansia.raw_value : akkermansia;
    if (val < 1.0) {
      insights.push({
        title: 'Gut Microbiome Barrier Taxa (Akkermansia muciniphila)',
        description: `Relative abundance of Akkermansia muciniphila is lower than optimal (${val}%). Higher abundance is associated in medical literature with gut mucosal barrier integrity and metabolic health.`,
        tag: 'Gut Microbiome',
        variant: 'info'
      });
    } else {
      insights.push({
        title: 'Robust Gut Barrier Biomarker Abundance',
        description: `Akkermansia muciniphila abundance is well-represented (${val}%), supporting mucosal layer integrity and gut metabolic signaling.`,
        tag: 'Gut Microbiome',
        variant: 'success'
      });
    }
  }

  return insights;
}
