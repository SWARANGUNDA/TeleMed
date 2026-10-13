/**
 * xaiExplainer.js — Plain-Language Clinical Explainer & Driver Mapping for XAI.
 * 
 * Translates complex machine learning SHAP attributions into clear, human-understandable
 * health insights with reference ranges, biological mechanisms, and actionable next steps.
 */

import { classifyBiomarker, classifyWearable, classifyGut } from './clinicalRanges';

export const DISEASE_LABELS = {
  Type2_Diabetes: { title: 'Type 2 Diabetes', icon: '🩺', description: 'Assesses insulin resistance, pancreatic beta-cell workload, and chronic glycemic regulation.' },
  Prediabetes: { title: 'Prediabetes Risk', icon: '⚠️', description: 'Detects early impaired fasting glucose and postprandial glycemic excursions before clinical onset.' },
  High_Adiposity_Risk: { title: 'Adiposity & Obesity', icon: '⚖️', description: 'Evaluates visceral adiposity, metabolic body mass distribution, and lipid storage strain.' },
  Metabolic_Syndrome: { title: 'Metabolic Syndrome', icon: '🧬', description: 'Multi-system clustering of atherogenic dyslipidemia, elevated blood pressure, and insulin resistance.' },
  NAFLD: { title: 'NAFLD Liver Health', icon: '🫀', description: 'Screening for hepatic steatosis, transaminase elevations, and metabolic liver inflammation.' }
};

export function formatDiseaseName(diseaseKey) {
  if (!diseaseKey) return 'Target Condition';
  if (DISEASE_LABELS[diseaseKey]) return DISEASE_LABELS[diseaseKey].title;
  return diseaseKey.replace(/Type2/g, 'Type 2').replace(/_/g, ' ');
}

// Canonical feature metadata dictionary with plain language descriptions & practical tips
const FEATURE_REGISTRY = {
  // --- WEARABLE FEATURES ---
  cgm_glucose_cv: {
    displayName: 'Continuous Glucose Variability (CV)',
    category: 'Glycemic Stability',
    unit: '%',
    refRange: '< 36%',
    targetDesc: 'Target under 36% indicates smooth, steady blood sugar',
    explainPositive: (val) => `Your glucose variability is ${val}%, which is above the 36% stability threshold. Frequent sugar swings trigger metabolic stress and inflammation.`,
    explainNegative: (val) => `Your glucose variability is ${val}%, remaining safely below the 36% threshold. Stable daily glucose swings protect your blood vessels and lower diabetes risk.`,
    tip: 'Pair carbohydrates with healthy fats and fiber to flatten post-meal glucose spikes.'
  },
  glucose_cv: {
    displayName: 'Continuous Glucose Variability (CV)',
    category: 'Glycemic Stability',
    unit: '%',
    refRange: '< 36%',
    targetDesc: 'Target under 36% indicates smooth, steady blood sugar',
    explainPositive: (val) => `Your glucose variability is ${val}%, which is above the 36% stability threshold. Frequent sugar swings trigger metabolic stress and inflammation.`,
    explainNegative: (val) => `Your glucose variability is ${val}%, remaining safely below the 36% threshold. Stable daily glucose swings protect your blood vessels and lower diabetes risk.`,
    tip: 'Pair carbohydrates with healthy fats and fiber to flatten post-meal glucose spikes.'
  },
  average_glucose: {
    displayName: 'Average CGM Glucose',
    category: 'Glycemic Control',
    unit: 'mg/dL',
    refRange: '70–99 mg/dL',
    targetDesc: 'Target 70–99 mg/dL fasting / steady-state',
    explainPositive: (val) => `Your average continuous glucose of ${val} mg/dL is higher than optimal, signaling elevated circulating glucose throughout your day.`,
    explainNegative: (val) => `Your average glucose reading of ${val} mg/dL is in a healthy range, demonstrating consistent whole-body glycemic management.`,
    tip: 'Engage in a 10-minute gentle walk immediately after meals to facilitate muscular glucose uptake.'
  },
  glucose_mean: {
    displayName: 'Average Sensor Glucose',
    category: 'Glycemic Control',
    unit: 'mg/dL',
    refRange: '70–99 mg/dL',
    targetDesc: 'Target 70–99 mg/dL fasting / steady-state',
    explainPositive: (val) => `Your average continuous glucose of ${val} mg/dL is elevated, reflecting sustained glycemic load.`,
    explainNegative: (val) => `Your average glucose reading of ${val} mg/dL is within healthy bounds, maintaining low systemic stress.`,
    tip: 'Focus on low-glycemic complex carbohydrates and avoid sugary liquid calories.'
  },
  activity_energy_expenditure: {
    displayName: 'Active Energy Expenditure',
    category: 'Physical Activity',
    unit: 'kcal/day',
    refRange: '≥ 450 kcal/day',
    targetDesc: 'Target ≥ 450 kcal/day from intentional movement',
    explainPositive: (val) => `Your recorded active expenditure (${val} kcal) is below the metabolic protective target, meaning lower muscular calorie clearing.`,
    explainNegative: (val) => `Your active energy expenditure of ${val} kcal is supporting your metabolism by utilizing glycogen stores and sensitizing insulin receptors.`,
    tip: 'Add short bouts of brisk walking or bodyweight resistance exercises throughout the day.'
  },
  calories_burned: {
    displayName: 'Active Caloric Expenditure',
    category: 'Physical Activity',
    unit: 'kcal/day',
    refRange: '≥ 450 kcal/day',
    targetDesc: 'Target ≥ 450 kcal/day from intentional movement',
    explainPositive: (val) => `Your daily active calorie burn (${val} kcal) indicates room for more aerobic and resistance exercise.`,
    explainNegative: (val) => `Your daily activity level (${val} kcal) helps burn excess fuel and promotes metabolic balance.`,
    tip: 'Aim for at least 150 minutes of moderate-intensity cardio every week.'
  },
  heart_rate_variability_rmssd: {
    displayName: 'Heart Rate Variability (HRV RMSSD)',
    category: 'Autonomic Nervous System',
    unit: 'ms',
    refRange: '≥ 25 ms',
    targetDesc: 'Target ≥ 25 ms indicates balanced nervous system recovery',
    explainPositive: (val) => `Your measured HRV of ${val} ms is on the lower side, reflecting sympathetic nervous system dominance (stress or delayed physical recovery).`,
    explainNegative: (val) => `Your HRV of ${val} ms demonstrates robust parasympathetic tone and healthy nervous system resilience.`,
    tip: 'Incorporate 5 minutes of slow diaphragmatic box breathing (4s in, 4s hold, 4s out, 4s hold) before sleep.'
  },
  hrv_rmssd: {
    displayName: 'Heart Rate Variability (HRV)',
    category: 'Autonomic Nervous System',
    unit: 'ms',
    refRange: '≥ 25 ms',
    targetDesc: 'Target ≥ 25 ms indicates balanced nervous system recovery',
    explainPositive: (val) => `Your measured HRV of ${val} ms indicates autonomic nervous system strain or fatigue.`,
    explainNegative: (val) => `Your HRV of ${val} ms shows strong cardiovascular autonomic flexibility.`,
    tip: 'Prioritize consistent sleep timing and avoid blue light or alcohol late in the evening.'
  },
  resting_heart_rate: {
    displayName: 'Resting Heart Rate (RHR)',
    category: 'Cardiovascular Fitness',
    unit: 'bpm',
    refRange: '60–100 bpm',
    targetDesc: 'Optimal range 55–72 bpm at rest',
    explainPositive: (val) => `Your resting heart rate of ${val} bpm is elevated, suggesting cardiovascular strain or lower aerobic conditioning.`,
    explainNegative: (val) => `Your resting heart rate of ${val} bpm reflects strong stroke volume and resting efficiency.`,
    tip: 'Gradually increase Zone 2 aerobic cardio (conversational jogging, cycling, or incline walking).'
  },
  sleep_duration: {
    displayName: 'Nightly Sleep Duration',
    category: 'Circadian Health',
    unit: 'hours',
    refRange: '7.0–9.0 hrs',
    targetDesc: 'Optimal 7.0–8.5 hours for metabolic reset',
    explainPositive: (val) => `Your recorded sleep duration of ${val} hours is outside the optimal restorative window, which impairs insulin sensitivity and cortisol regulation.`,
    explainNegative: (val) => `Your sleep duration of ${val} hours provides adequate recovery for overnight metabolic and hormone recalibration.`,
    tip: 'Keep a consistent bedtime schedule, even on weekends, to anchor your internal circadian clock.'
  },
  sleep_efficiency_score: {
    displayName: 'Sleep Efficiency Score',
    category: 'Circadian Health',
    unit: '%',
    refRange: '≥ 85%',
    targetDesc: 'Target ≥ 85% time asleep while in bed',
    explainPositive: (val) => `Your sleep efficiency of ${val}% indicates nighttime restlessness or frequent wakeups, reducing deep REM rest.`,
    explainNegative: (val) => `Your sleep efficiency of ${val}% shows high sleep consolidation and restful sleep cycles.`,
    tip: 'Keep the bedroom dark, quiet, and cool (around 65°F / 18°C) to prevent micro-arousals.'
  },
  average_daily_steps: {
    displayName: 'Average Daily Steps',
    category: 'Physical Activity',
    unit: 'steps/day',
    refRange: '≥ 8,000 steps',
    targetDesc: 'Target ≥ 8,000 steps/day for metabolic health',
    explainPositive: (val) => `Your daily step count of ${val} steps is below the recommended 8,000 daily threshold, reducing non-exercise activity thermogenesis.`,
    explainNegative: (val) => `Your active daily step count of ${val} steps actively burns blood glucose and promotes vascular nitric oxide release.`,
    tip: 'Take a 5-minute movement break every 60 minutes during desk work.'
  },
  sedentary_time_minutes: {
    displayName: 'Daily Sedentary Time',
    category: 'Physical Activity',
    unit: 'mins/day',
    refRange: '< 480 mins/day',
    targetDesc: 'Target under 8 hours (480 mins) of sitting per day',
    explainPositive: (val) => `Recorded sedentary time of ${val} minutes is prolonged, which slows down muscular lipoprotein lipase activity.`,
    explainNegative: (val) => `Your sedentary time of ${val} minutes is well-managed with frequent daily mobility.`,
    tip: 'Use a sit-stand desk converter or take walking phone calls to break up long sitting stretches.'
  },
  time_in_range: {
    displayName: 'CGM Time in Range (70–140 mg/dL)',
    category: 'Glycemic Control',
    unit: '%',
    refRange: '≥ 70%',
    targetDesc: 'Target ≥ 70% time spent in optimal glucose zone',
    explainPositive: (val) => `Your Time-In-Range of ${val}% is below the 70% clinical target, meaning blood sugar spent significant periods out of optimal range.`,
    explainNegative: (val) => `Your Time-In-Range of ${val}% meets clinical targets, keeping your vascular lining protected from sugar spikes.`,
    tip: 'Eat carbohydrates last in your meal after fiber and protein to slow down gastric emptying.'
  },

  // --- CLINICAL LAB FEATURES ---
  fasting_blood_glucose: {
    displayName: 'Fasting Blood Glucose',
    category: 'Metabolic Chemistry',
    unit: 'mg/dL',
    refRange: '70–99 mg/dL',
    targetDesc: 'Normal: 70–99 · Prediabetes: 100–125 · Diabetes: ≥ 126',
    explainPositive: (val) => `Your fasting blood glucose of ${val} mg/dL is elevated above the 99 mg/dL normal reference point, indicating basal insulin resistance.`,
    explainNegative: (val) => `Your fasting blood glucose of ${val} mg/dL is within healthy parameters, demonstrating that your liver produces appropriate glucose overnight.`,
    tip: 'Avoid high-glycemic carbohydrates late in the evening and leave a 12-hour overnight fasting window.'
  },
  hba1c: {
    displayName: 'Hemoglobin A1c (3-Month Average)',
    category: 'Metabolic Chemistry',
    unit: '%',
    refRange: '< 5.7%',
    targetDesc: 'Normal: < 5.7% · Prediabetes: 5.7–6.4% · Diabetes: ≥ 6.5%',
    explainPositive: (val) => `Your HbA1c of ${val}% reflects elevated red blood cell glycation over the last 90 days, increasing long-term metabolic risk.`,
    explainNegative: (val) => `Your HbA1c of ${val}% confirms healthy long-term blood sugar control with low glycosylation.`,
    tip: 'Sustain whole-food dietary patterns high in soluble fiber and lean proteins.'
  },
  bmi: {
    displayName: 'Body Mass Index (BMI)',
    category: 'Anthropometrics',
    unit: 'kg/m²',
    refRange: '18.5–24.9 kg/m²',
    targetDesc: 'Normal: 18.5–24.9 · Overweight: 25–29.9 · Obesity: ≥ 30',
    explainPositive: (val) => `Your BMI of ${val} kg/m² is in the elevated category, which is statistically associated with greater adipose tissue inflammation.`,
    explainNegative: (val) => `Your BMI of ${val} kg/m² falls in a healthy range, minimizing mechanical and metabolic burden on organs.`,
    tip: 'Focus on body composition through resistance training and preserving lean muscle mass.'
  },
  systolic_bp: {
    displayName: 'Systolic Blood Pressure',
    category: 'Cardiovascular Health',
    unit: 'mmHg',
    refRange: '< 120 mmHg',
    targetDesc: 'Optimal: < 120 mmHg systolic',
    explainPositive: (val) => `Your systolic pressure of ${val} mmHg is elevated, exerting higher peak shear stress on arterial walls.`,
    explainNegative: (val) => `Your systolic pressure of ${val} mmHg maintains calm, healthy arterial wall dynamics.`,
    tip: 'Increase dietary potassium from leafy greens and avocados, and limit processed high-sodium foods.'
  },
  diastolic_bp: {
    displayName: 'Diastolic Blood Pressure',
    category: 'Cardiovascular Health',
    unit: 'mmHg',
    refRange: '< 80 mmHg',
    targetDesc: 'Optimal: < 80 mmHg diastolic',
    explainPositive: (val) => `Your diastolic pressure of ${val} mmHg indicates elevated resistance in your peripheral blood vessels between heartbeats.`,
    explainNegative: (val) => `Your diastolic pressure of ${val} mmHg demonstrates relaxed, elastic peripheral vascular tone.`,
    tip: 'Stay properly hydrated and incorporate regular low-impact aerobic walking.'
  },
  triglycerides: {
    displayName: 'Serum Triglycerides',
    category: 'Lipid Profile',
    unit: 'mg/dL',
    refRange: '< 150 mg/dL',
    targetDesc: 'Optimal: < 150 mg/dL',
    explainPositive: (val) => `Your triglyceride level of ${val} mg/dL is elevated, reflecting circulating fat particles and potential hepatic lipogenesis.`,
    explainNegative: (val) => `Your triglyceride level of ${val} mg/dL is well within healthy bounds, reflecting efficient clearance of circulating fats.`,
    tip: 'Cut down on refined sugars, fructose, and ultra-processed seed oils; eat wild-caught omega-3 fatty fish.'
  },
  hdl: {
    displayName: 'HDL Good Cholesterol',
    category: 'Lipid Profile',
    unit: 'mg/dL',
    refRange: '≥ 40 mg/dL',
    targetDesc: 'Optimal: ≥ 40 mg/dL (men) / ≥ 50 mg/dL (women)',
    explainPositive: (val) => `Your HDL of ${val} mg/dL is low, which reduces reverse cholesterol transport from peripheral tissues.`,
    explainNegative: (val) => `Your HDL of ${val} mg/dL provides active protection by shuttling excess cholesterol back to the liver for clearance.`,
    tip: 'Consume monounsaturated fats from extra virgin olive oil and participate in regular aerobic cardio.'
  },
  ldl: {
    displayName: 'LDL Cholesterol',
    category: 'Lipid Profile',
    unit: 'mg/dL',
    refRange: '< 100 mg/dL',
    targetDesc: 'Optimal: < 100 mg/dL',
    explainPositive: (val) => `Your LDL cholesterol of ${val} mg/dL contributes to circulating atherogenic particles.`,
    explainNegative: (val) => `Your LDL cholesterol of ${val} mg/dL helps keep your vascular endothelial lining clean and pliable.`,
    tip: 'Increase soluble fiber (oats, psyllium husk, legumes) to bind and excrete bile cholesterol.'
  },
  alt: {
    displayName: 'ALT (Alanine Aminotransferase)',
    category: 'Hepatic Function',
    unit: 'U/L',
    refRange: '7–56 U/L',
    targetDesc: 'Optimal: 7–35 U/L (clinical normal up to 56)',
    explainPositive: (val) => `Your liver ALT enzyme of ${val} U/L is elevated, suggesting liver cellular stress or fat accumulation (steatosis).`,
    explainNegative: (val) => `Your liver ALT enzyme of ${val} U/L is healthy, showing quiet hepatic cellular integrity.`,
    tip: 'Limit alcohol consumption and eliminate high-fructose corn syrup from your diet.'
  },
  ast: {
    displayName: 'AST (Aspartate Aminotransferase)',
    category: 'Hepatic Function',
    unit: 'U/L',
    refRange: '10–40 U/L',
    targetDesc: 'Optimal: 10–35 U/L',
    explainPositive: (val) => `Your AST level of ${val} U/L indicates mild hepatocellular or muscular enzyme leakage.`,
    explainNegative: (val) => `Your AST level of ${val} U/L is in a healthy, safe range.`,
    tip: 'Stay hydrated and consume antioxidant-rich cruciferous vegetables (broccoli, Brussels sprouts).'
  },
  hs_crp: {
    displayName: 'High-Sensitivity CRP (Inflammation)',
    category: 'Systemic Inflammation',
    unit: 'mg/L',
    refRange: '< 1.0 mg/L',
    targetDesc: 'Low risk: < 1.0 · Moderate: 1.0–3.0 · High: > 3.0',
    explainPositive: (val) => `Your hs-CRP of ${val} mg/L reveals low-grade systemic inflammation, which accelerates insulin resistance.`,
    explainNegative: (val) => `Your hs-CRP of ${val} mg/L demonstrates low basal inflammation, protecting your cardiovascular system.`,
    tip: 'Adopt an anti-inflammatory Mediterranean dietary pattern rich in polyphenol berries and herbs.'
  },

  // --- GUT MICROBIOME FEATURES ---
  scfa_producer_index: {
    displayName: 'SCFA Producer Index (Short-Chain Fatty Acids)',
    category: 'Gut Microbiome Health',
    unit: '',
    refRange: '≥ 3.0',
    targetDesc: 'Target ≥ 3.0 indicates robust butyrate/propionate production',
    explainPositive: (val) => `Your SCFA producer index of ${val} is reduced. Low short-chain fatty acids weaken your gut barrier and reduce GLP-1 hormone release.`,
    explainNegative: (val) => `Your SCFA producer index of ${val} is elevated and protective! These bacteria produce butyrate which fortifies your gut lining and improves insulin sensitivity.`,
    tip: 'Feed your gut bacteria prebiotic resistant starches (cooked and cooled potatoes/rice, green bananas, legumes).'
  },
  shannon_diversity: {
    displayName: 'Shannon Microbial Diversity Index',
    category: 'Gut Microbiome Health',
    unit: '',
    refRange: '≥ 3.0',
    targetDesc: 'Target ≥ 3.0 reflects a rich, balanced gut microbiome ecosystem',
    explainPositive: (val) => `Your microbiome diversity index of ${val} is lower than ideal, which correlates with metabolic dysbiosis and immune imbalance.`,
    explainNegative: (val) => `Your microbiome diversity score of ${val} shows a diverse and resilient bacterial ecosystem protecting metabolic homeostasis.`,
    tip: 'Aim to eat at least 30 distinct diverse plant foods (vegetables, grains, nuts, seeds, herbs) every week.'
  },
  shannon_diversity_index: {
    displayName: 'Shannon Microbial Diversity Index',
    category: 'Gut Microbiome Health',
    unit: '',
    refRange: '≥ 3.0',
    targetDesc: 'Target ≥ 3.0 reflects a rich, balanced gut microbiome ecosystem',
    explainPositive: (val) => `Your microbiome diversity index of ${val} indicates an ecosystem imbalance that may increase systemic inflammation.`,
    explainNegative: (val) => `Your microbiome diversity score of ${val} shows a richly diverse bacterial ecosystem supporting whole-body metabolism.`,
    tip: 'Diversify your weekly grocery basket with varied colorful fruits, vegetables, and fermented foods.'
  },
  akkermansia: {
    displayName: 'Akkermansia muciniphila (Mucosal Guardian)',
    category: 'Gut Barrier Integrity',
    unit: '%',
    refRange: '≥ 1.0%',
    targetDesc: 'Optimal ≥ 1.0% relative abundance',
    explainPositive: (val) => `Your Akkermansia level of ${val}% is depleted, which can lead to a thinner mucosal layer and increased gut permeability.`,
    explainNegative: (val) => `Your Akkermansia level of ${val}% is optimal! This keystone microbe maintains a thick gut mucosal wall, preventing endotoxins from leaking into the bloodstream.`,
    tip: 'Nourish Akkermansia with polyphenol-rich foods like pomegranate, cranberries, green tea, and pure dark chocolate.'
  },
  faecalibacterium: {
    displayName: 'Faecalibacterium prausnitzii (Anti-Inflammatory)',
    category: 'Gut Barrier Integrity',
    unit: '%',
    refRange: '≥ 5.0%',
    targetDesc: 'Optimal ≥ 5.0% relative abundance',
    explainPositive: (val) => `Your Faecalibacterium abundance of ${val}% is low, diminishing anti-inflammatory butyrate production in the colon.`,
    explainNegative: (val) => `Your Faecalibacterium level of ${val}% provides strong anti-inflammatory protection for metabolic tissues.`,
    tip: 'Consume prebiotic inulin fibers from onions, garlic, leeks, and asparagus.'
  },
  bifidobacterium: {
    displayName: 'Bifidobacterium spp.',
    category: 'Beneficial Probiotics',
    unit: '%',
    refRange: '≥ 2.0%',
    targetDesc: 'Optimal ≥ 2.0% relative abundance',
    explainPositive: (val) => `Your Bifidobacterium abundance (${val}%) is sub-optimal, reducing carbohydrate fermentation efficiency.`,
    explainNegative: (val) => `Healthy Bifidobacterium abundance of ${val}% supports gut acidity, keeping opportunistic pathogens away.`,
    tip: 'Include traditionally fermented foods such as plain live kefir, kimchi, and raw sauerkraut.'
  },
  roseburia: {
    displayName: 'Roseburia spp. (Butyrate Producer)',
    category: 'Gut Microbiome Health',
    unit: '%',
    refRange: '≥ 2.0%',
    targetDesc: 'Optimal ≥ 2.0% relative abundance',
    explainPositive: (val) => `Your Roseburia level of ${val}% is diminished, reducing short-chain fatty acid output.`,
    explainNegative: (val) => `Your Roseburia level of ${val}% actively synthesizes butyrate to fuel your colon cells and modulate glucose.`,
    tip: 'Eat oat bran, barley, and whole grain sourdough.'
  },
  proteobacteria: {
    displayName: 'Proteobacteria Phylum (Inflammatory Marker)',
    category: 'Gut Dysbiosis Marker',
    unit: '%',
    refRange: '≤ 10.0%',
    targetDesc: 'Target ≤ 10% (elevated indicates dysbiosis)',
    explainPositive: (val) => `Your Proteobacteria abundance of ${val}% is elevated, indicating possible gut dysbiosis and potential LPS endotoxin circulation.`,
    explainNegative: (val) => `Your Proteobacteria level of ${val}% is well-controlled, showing low bacterial inflammation.`,
    tip: 'Reduce artificial sweeteners, processed emulsifiers, and saturated trans-fats.'
  }
};

/**
 * Returns formatted clinical interpretation and metadata for an XAI driver
 */
export function getFeatureMetadata(rawName, modality, rawValue, shapValue, targetDisease = 'Type2_Diabetes') {
  if (!rawName) return null;

  const key = String(rawName).toLowerCase().trim().replace(/[\s-]+/g, '_');
  const mod = String(modality || 'clinical').toLowerCase();
  const shap = Number(shapValue) || 0;
  const isRiskIncreasing = shap >= 0;
  const absShap = Math.abs(shap);

  // Look up known feature in registry
  let entry = FEATURE_REGISTRY[key];
  if (!entry) {
    // Try fuzzy match
    const foundKey = Object.keys(FEATURE_REGISTRY).find(k => key.includes(k) || k.includes(key));
    if (foundKey) entry = FEATURE_REGISTRY[foundKey];
  }

  // Display Name
  const displayName = entry?.displayName || String(rawName).replace(/_/g, ' ');

  // Parse Observed Value
  let parsedVal = rawValue;
  if (typeof rawValue === 'number') {
    parsedVal = rawValue % 1 !== 0 ? rawValue.toFixed(1) : String(rawValue);
  } else if (!rawValue || rawValue === 'N/A' || rawValue === 'undefined') {
    parsedVal = 'Recorded';
  }

  // Unit and Range
  const unit = entry?.unit || '';
  const refRange = entry?.refRange || 'Standard reference';
  const targetDesc = entry?.targetDesc || `Target reference: ${refRange}`;
  const category = entry?.category || (mod === 'wearable' ? 'Wearable Telemetry' : mod === 'gut' ? 'Gut Microbiome' : 'Clinical Biomarker');

  // Relative Impact Tier
  let impactTier = 'Subtle Factor';
  let impactColor = 'text-gray-500';
  let impactBadge = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  if (absShap >= 0.30) {
    impactTier = 'High Impact';
    impactColor = isRiskIncreasing ? 'text-red-600' : 'text-emerald-600';
    impactBadge = isRiskIncreasing ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
  } else if (absShap >= 0.12) {
    impactTier = 'Moderate Impact';
    impactColor = isRiskIncreasing ? 'text-amber-600' : 'text-teal-600';
    impactBadge = isRiskIncreasing ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
  }

  // Generate plain English explanation
  let plainExplanation = '';
  if (entry) {
    plainExplanation = isRiskIncreasing ? entry.explainPositive(parsedVal) : entry.explainNegative(parsedVal);
  } else {
    const diseaseName = formatDiseaseName(targetDisease);
    if (isRiskIncreasing) {
      plainExplanation = `Your measured ${displayName} (${parsedVal}${unit ? ` ${unit}` : ''}) is contributing upward pressure to your ${diseaseName} risk score based on multi-modal clinical associations.`;
    } else {
      plainExplanation = `Your measured ${displayName} (${parsedVal}${unit ? ` ${unit}` : ''}) serves as a protective factor, helping keep your ${diseaseName} estimate lower.`;
    }
  }

  // Action tip
  const actionTip = entry?.tip || (isRiskIncreasing ? 'Review this biomarker with your physician and focus on consistent lifestyle habits.' : 'Maintain your positive habits to preserve this biological protection.');

  return {
    rawName,
    displayName,
    category,
    modality: mod,
    observedValue: parsedVal,
    unit,
    refRange,
    targetDesc,
    shapValue: shap,
    absShap,
    isRiskIncreasing,
    direction: isRiskIncreasing ? 'Increases Risk' : 'Lowers Risk',
    directionLabel: isRiskIncreasing ? 'Risk Escalator' : 'Protective Shield',
    impactTier,
    impactColor,
    impactBadge,
    plainExplanation,
    actionTip
  };
}
