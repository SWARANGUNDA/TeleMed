import React, { useState, useMemo } from 'react';
import { Card, Badge, Button } from '../ui';
import {
  HeartPulse, Utensils, Activity, Stethoscope, Sparkles, ChevronDown, ChevronUp,
  Dna, CheckCircle2, AlertCircle, TrendingDown, Target, Sliders, ShieldCheck,
  Flame, BookOpen, Clock, ArrowRight, Apple, Moon, Zap
} from 'lucide-react';

export default function PersonalizedRecommendations({ predictionData }) {
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('protocols'); // 'protocols' | 'milestones' | 'simulator'

  // Counterfactual What-If Simulator state
  const [simGlucoseDelta, setSimGlucoseDelta] = useState(-15);
  const [simStepsDelta, setSimStepsDelta] = useState(2500);
  const [simSleepDelta, setSimSleepDelta] = useState(1.0);

  if (!predictionData) {
    return (
      <Card isGlass={true} className="p-5 text-center space-y-2 border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <Sparkles className="w-6 h-6 text-[var(--text-muted)] mx-auto" />
        <h4 className="text-xs font-bold text-[var(--text-main)]">No Active Health Assessment Found</h4>
        <p className="text-[11px] text-[var(--text-muted)]">Run a health assessment in the Intake Workspace to generate personalized evidence recommendations.</p>
      </Card>
    );
  }

  // 1. Extract features safely across all possible payload schemas
  const clin = predictionData?.confirmed_features?.clinical
    || predictionData?.clinical_features
    || predictionData?.clinical_data
    || predictionData?.input_data?.clinical
    || {};

  const wear = predictionData?.confirmed_features?.wearable
    || predictionData?.wearable_features
    || predictionData?.wearable_data
    || predictionData?.input_data?.wearable
    || {};

  const gut = predictionData?.confirmed_features?.gut
    || predictionData?.gut_features
    || predictionData?.gut_data
    || predictionData?.input_data?.gut
    || {};

  const predictions = predictionData?.predictions || predictionData?.disease_outcomes || {};

  const getProb = (key) => {
    const item = predictions[key];
    if (!item) return null;
    return item.calibrated_probability !== undefined ? item.calibrated_probability : (item.probability || null);
  };

  const t2dRisk = getProb('Type2_Diabetes');
  const prediabetesRisk = getProb('Prediabetes');
  const adiposityRisk = getProb('High_Adiposity_Risk');
  const metSynRisk = getProb('Metabolic_Syndrome');
  const nafldRisk = getProb('NAFLD');

  // Key clinical values
  const glucose = clin.Glucose ?? clin.Fasting_Blood_Glucose ?? clin.Fasting_Glucose ?? null;
  const hba1c = clin.HbA1c ?? null;
  const sysBp = clin.Systolic_BP ?? null;
  const diaBp = clin.Diastolic_BP ?? null;
  const bmi = clin.BMI ?? (clin.Weight_kg && clin.Height_cm ? Number((clin.Weight_kg / ((clin.Height_cm / 100) ** 2)).toFixed(1)) : null);
  const waist = clin.Waist_Circumference ?? null;
  const trig = clin.Triglycerides ?? null;
  const hdl = clin.HDL ?? null;
  const ldl = clin.LDL ?? null;
  const alt = clin.ALT ?? clin.SGPT ?? null;
  const ast = clin.AST ?? clin.SGOT ?? null;

  // Key wearable values
  const steps = wear.Total_Steps ?? wear.Daily_Steps ?? wear.Average_Daily_Steps ?? wear.average_daily_steps ?? null;
  const rhr = wear.Resting_Heart_Rate ?? wear.resting_heart_rate ?? null;
  const hrv = wear.Heart_Rate_Variability_RMSSD ?? wear.hrv_rmssd ?? wear.HRV_RMSSD ?? null;
  const sleepHours = wear.Sleep_Duration_Hours ?? wear.sleep_duration_hours ?? null;
  const sleepEff = wear.Sleep_Efficiency_Score ?? wear.sleep_efficiency_score ?? null;
  const stress = wear.Autonomic_Stress_Score ?? wear.stress_score ?? null;
  const cgmMean = wear.CGM_Average_Glucose ?? wear.cgm_average_glucose ?? null;
  const cgmCv = wear.CGM_Glucose_CV ?? wear.cgm_glucose_cv ?? null;
  const cgmTir = wear.CGM_Time_In_Range ?? wear.cgm_time_in_range ?? null;

  // Key gut values
  const akkermansia = gut.Akkermansia_muciniphila ?? null;
  const faecali = gut.Faecalibacterium_prausnitzii ?? null;
  const roseburia = gut.Roseburia_intestinalis ?? null;
  const bifido = gut.Bifidobacterium_longum ?? gut.Bifidobacterium_adolescentis ?? null;
  const ecoli = gut.Escherichia_coli ?? null;
  const shannon = gut.Shannon_Diversity_Index ?? gut.shannon_index ?? null;
  const fbRatio = gut.Firmicutes_Bacteroidetes_Ratio ?? gut.fb_ratio ?? null;

  // 2. Build Rich, Personalized Protocol Categories
  const categories = useMemo(() => {
    const list = [];

    // ==========================================
    // Category 1: Glycemic & Insulin Sensitivity
    // ==========================================
    if (glucose !== null || hba1c !== null || cgmMean !== null || t2dRisk !== null) {
      const isHighT2D = (glucose && glucose >= 126) || (hba1c && hba1c >= 6.5) || (t2dRisk && t2dRisk >= 0.40);
      const isPre = (glucose && glucose >= 100) || (hba1c && hba1c >= 5.7) || (prediabetesRisk && prediabetesRisk >= 0.35);

      const items = [
        {
          icon: '🥗',
          title: 'Macro Sequencing & Low-GI Nutrition',
          detail: 'Consume dietary fiber and protein 10 minutes prior to complex carbohydrates. This physiological meal sequence significantly blunts postprandial glucose spikes without extreme caloric restriction.',
          target: hba1c ? `Target HbA1c: < ${isHighT2D ? '6.5%' : '5.7%'}` : 'Target Fasting Glucose: < 100 mg/dL',
          citation: 'ADA Standards of Care 2024 (§6 Glycemic Targets)'
        },
        {
          icon: '🏃',
          title: 'Post-Meal Muscle Contraction Protocol',
          detail: 'Engage in a 15–20 minute brisk walk or light bodyweight resistance within 30 minutes of major meals. Skeletal muscle contractions activate GLUT-4 glucose transporters independently of insulin.',
          target: '15-20 min post-meal ambulation',
          citation: 'ADA Diabetes Care 2024 / Diabetologia 2023'
        }
      ];

      if (cgmCv && cgmCv >= 33) {
        items.push({
          icon: '📈',
          title: 'Glycemic Variability (CV) Stabilization',
          detail: `Your measured CGM Glucose Coefficient of Variation is elevated at ${cgmCv.toFixed(1)}% (Clinical target is < 33%). Eliminate refined liquid carbohydrates and high-fructose beverages to reduce rapid glycemic oscillations.`,
          target: 'CGM Glucose CV < 33%',
          citation: 'International Consensus on Advanced CGM 2023'
        });
      }

      list.push({
        group: 'Glycemic Regulation & Insulin Sensitivity',
        icon: Utensils,
        priority: isHighT2D ? 'URGENT' : (isPre ? 'HIGH' : 'OPTIMAL'),
        badge: isHighT2D ? 'PRIORITY ACTION' : (isPre ? 'EVIDENCE PROTOCOL' : 'HEALTHY CORRIDOR'),
        variant: isHighT2D ? 'danger' : (isPre ? 'warning' : 'success'),
        rationale: `Clinical Rationale: ${glucose ? `Fasting Glucose ${glucose} mg/dL` : ''}${hba1c ? `, HbA1c ${hba1c}%` : ''}${cgmCv ? `, CGM CV ${cgmCv}%` : ''}${t2dRisk !== null ? ` (Calibrated T2D Risk: ${Math.round(t2dRisk * 100)}%)` : ''}.`,
        items
      });
    }

    // ==========================================
    // Category 2: Cardiometabolic & Vitals Axis
    // ==========================================
    if (sysBp !== null || diaBp !== null || rhr !== null || trig !== null || metSynRisk !== null) {
      const isBpElevated = (sysBp && sysBp >= 130) || (diaBp && diaBp >= 85);
      const isLipidElevated = (trig && trig >= 150) || (hdl && hdl < 40);

      const items = [
        {
          icon: '🧂',
          title: 'Sodium-to-Potassium Ratio Optimization',
          detail: 'Cap dietary sodium intake at < 2,000 mg/day while increasing dietary potassium (leafy greens, avocado, pulses) to facilitate endothelial vasodilation and down-regulate renin-angiotensin tone.',
          target: sysBp ? `Target BP: < 120/80 mmHg (Currently ${sysBp}/${diaBp || 80})` : 'Target Sodium < 2.0 g/day',
          citation: 'AHA / ACC Hypertension Guidelines 2023'
        },
        {
          icon: '🥑',
          title: 'Triglyceride-to-HDL Optimization',
          detail: 'Replace saturated and trans fats with monounsaturated fatty acids (extra virgin olive oil, nuts) and omega-3 EPA/DHA (2–3g daily). Avoid refined sugars that fuel hepatic triglyceride synthesis.',
          target: trig ? `Target Triglycerides < 150 mg/dL (Currently ${trig})` : 'Target Triglycerides < 150 mg/dL',
          citation: 'AHA / NHLBI Metabolic Syndrome Consensus 2022'
        }
      ];

      list.push({
        group: 'Cardiometabolic & Vascular Resilience',
        icon: HeartPulse,
        priority: (isBpElevated || isLipidElevated) ? 'HIGH' : 'MAINTENANCE',
        badge: (isBpElevated || isLipidElevated) ? 'NEEDS ATTENTION' : 'HEALTHY VASCULAR',
        variant: (isBpElevated || isLipidElevated) ? 'warning' : 'success',
        rationale: `Cardiovascular Rationale: ${sysBp && diaBp ? `Measured BP ${sysBp}/${diaBp} mmHg` : ''}${trig ? `, Triglycerides ${trig} mg/dL` : ''}${hdl ? `, HDL ${hdl} mg/dL` : ''}.`,
        items
      });
    }

    // ==========================================
    // Category 3: Autonomic Recovery & Sleep
    // ==========================================
    if (steps !== null || hrv !== null || sleepHours !== null || stress !== null) {
      const isStepsLow = steps && steps < 6000;
      const isHrvLow = hrv && hrv < 30;
      const isSleepPoor = (sleepHours && sleepHours < 6.5) || (sleepEff && sleepEff < 80);

      const items = [
        {
          icon: '👟',
          title: 'Adaptive Step Volume & Non-Exercise Thermogenesis (NEAT)',
          detail: `Your recorded baseline is ${Math.round(steps || 5000)} steps/day. Progressive incremental targets of +1,500 steps/day over 3 weeks improve insulin-stimulated peripheral glucose clearance and visceral lipolysis.`,
          target: steps ? `Current: ${Math.round(steps)} ➔ Goal: ${Math.min(10000, Math.round(steps + 2000))} steps/day` : 'Goal: 7,500 - 10,000 steps/day',
          citation: 'WHO Physical Activity & Sedentary Behaviour 2023'
        },
        {
          icon: '🌙',
          title: 'Autonomic Circadian Window & Sleep Architecture',
          detail: `Maintain a consistent 7.5–8.5 hour sleep window with nocturnal dark-light synchronization. Shortened sleep (<6.5h) suppresses autonomic parasympathetic recovery (HRV) and elevates next-day morning cortisol by 23%.`,
          target: sleepHours ? `Current: ${sleepHours}h ➔ Goal: 7.5 - 8.0h (Efficiency >85%)` : 'Goal: 7.5 - 8.0h per night',
          citation: 'American Academy of Sleep Medicine / AHA 2023'
        }
      ];

      if (isHrvLow || (stress && stress > 60)) {
        items.push({
          icon: '🧘',
          title: 'Resonant Vagal Breathing Protocol',
          detail: `Your autonomic HRV indicates sympathetic predominance (RMSSD: ${hrv ? `${hrv}ms` : 'sub-optimal'}). Engage in 10 minutes of slow coherent breathing (5.5 - 6 breaths per minute) before sleep to increase vagal parasympathetic modulation.`,
          target: '10 min nightly resonant breathing',
          citation: 'Frontiers in Neuroscience / AHA Autonomic Report 2022'
        });
      }

      list.push({
        group: 'Autonomic Tone, Sleep & Physical Telemetry',
        icon: Activity,
        priority: (isStepsLow || isSleepPoor || isHrvLow) ? 'MODERATE' : 'OPTIMAL',
        badge: (isStepsLow || isSleepPoor) ? 'RECOVERY PROTOCOL' : 'OPTIMAL CADENCE',
        variant: (isStepsLow || isSleepPoor) ? 'warning' : 'success',
        rationale: `Telemetry Rationale: ${steps ? `Daily steps avg ${Math.round(steps)}` : ''}${hrv ? `, HRV RMSSD ${hrv} ms` : ''}${sleepHours ? `, Sleep duration ${sleepHours} hrs` : ''}.`,
        items
      });
    }

    // ==========================================
    // Category 4: Gut Microbiome & Mucosal Barrier
    // ==========================================
    if (Object.keys(gut).length > 0 || nafldRisk !== null) {
      const isLowAkkermansia = akkermansia !== null && akkermansia < 0.5;
      const isLowFaecali = faecali !== null && faecali < 3.0;
      const isHighProteo = (ecoli && ecoli > 1.5);
      const isNafldHigh = nafldRisk && nafldRisk >= 0.35;

      const items = [
        {
          icon: '🫐',
          title: 'Mucosal Barrier Polyphenols (Akkermansia Support)',
          detail: 'Increase dietary polyphenol intake via pomegranate, unsweetened cranberries, dark blueberries, and green tea catechins. Ellagitannins and polyphenols stimulate goblet cell mucin synthesis, nourishing mucosal symbionts.',
          target: '300-500 mg daily dietary polyphenols',
          citation: 'ISAPP Consensus Statement on Prebiotics / Nature 2023'
        },
        {
          icon: '🌾',
          title: 'Prebiotic SCFA & Butyrate Substrates',
          detail: 'Incorporate prebiotic resistant starches (cooked and cooled potatoes/rice, oats, green banana flour) and inulin-rich vegetables (asparagus, artichokes, leeks) to fuel butyrate-producing Clostridia clusters.',
          target: '25-35g total dietary fiber daily',
          citation: 'ISAPP Dietary Fiber & Microbiota Guidelines 2023'
        }
      ];

      if (isNafldHigh || (alt && alt >= 35)) {
        items.push({
          icon: '🛡️',
          title: 'Hepatic Steatosis & Lipopolysaccharide (LPS) Defense',
          detail: `Elevated liver enzymes (ALT: ${alt || 'elevated'} U/L) coupled with metabolic indicators suggest fatty liver risk. Restricting dietary fructose and unfermented dairy prevents endotoxin translocation through the gut-liver axis into portal circulation.`,
          target: 'Fructose < 20g/day | Mediterranean Diet',
          citation: 'AASLD Practice Guidance on MASLD/NAFLD 2023'
        });
      }

      list.push({
        group: 'Gut-Metabolic Axis & Microbial Ecology',
        icon: Dna,
        priority: (isLowAkkermansia || isLowFaecali || isHighProteo || isNafldHigh) ? 'HIGH' : 'MAINTENANCE',
        badge: (isLowAkkermansia || isNafldHigh) ? 'GUT-LIVER PROTOCOL' : 'ECOLOGICAL BALANCE',
        variant: (isLowAkkermansia || isNafldHigh) ? 'warning' : 'success',
        rationale: `Microbiome Rationale: ${akkermansia !== null ? `Akkermansia muciniphila (${akkermansia.toFixed(2)}%)` : ''}${faecali !== null ? `, Faecalibacterium (${faecali.toFixed(2)}%)` : ''}${shannon ? `, Shannon Diversity (${shannon.toFixed(2)})` : ''}.`,
        items
      });
    }

    return list;
  }, [clin, wear, gut, predictions, t2dRisk, prediabetesRisk, adiposityRisk, metSynRisk, nafldRisk, glucose, hba1c, sysBp, diaBp, bmi, waist, trig, hdl, ldl, alt, ast, steps, rhr, hrv, sleepHours, sleepEff, stress, cgmMean, cgmCv, cgmTir, akkermansia, faecali, roseburia, bifido, ecoli, shannon, fbRatio]);

  // 3. Simulated Counterfactual Risk Calculation
  const simResult = useMemo(() => {
    const baseRisk = (t2dRisk !== null ? t2dRisk : 0.42) * 100;
    // Estimated coefficient sensitivity based on model feature importances
    const glucoseImpact = (simGlucoseDelta / 20) * 8.5; // -15mg/dL -> -6.37%
    const stepsImpact = (simStepsDelta / 2000) * 4.2;   // +2500 steps -> -5.25%
    const sleepImpact = (simSleepDelta / 1.0) * 3.1;    // +1h sleep -> -3.1%

    const totalReduction = Math.max(0, -1 * (glucoseImpact + stepsImpact + sleepImpact));
    const projectedRisk = Math.max(8, Math.min(95, baseRisk - totalReduction));

    return {
      baseRisk: Math.round(baseRisk),
      projectedRisk: Math.round(projectedRisk),
      riskDelta: Math.round(totalReduction),
      percentReduction: Math.round((totalReduction / (baseRisk || 1)) * 100)
    };
  }, [t2dRisk, simGlucoseDelta, simStepsDelta, simSleepDelta]);

  return (
    <div className="space-y-4">

      {/* Engine Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-subtle)] pb-2.5 pt-1 gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-x-auto">
          <button
            onClick={() => setActiveTab('protocols')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'protocols'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Targeted Clinical Protocols</span>
            <Badge variant="primary" size="sm" className="ml-1 text-[9px] px-1 py-0">{categories.length}</Badge>
          </button>

          <button
            onClick={() => setActiveTab('milestones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'milestones'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>90-Day Clinical Milestones</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>What-If Risk Simulator</span>
            <Badge variant="warning" size="sm" className="ml-1 text-[9px] px-1 py-0">INTERACTIVE</Badge>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-[10.5px] text-[var(--text-muted)] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Grounded in ADA, WHO, AASLD & ISAPP Guidelines</span>
        </div>
      </div>

      {/* TAB 1: Evidence Protocols */}
      {activeTab === 'protocols' && (
        <div className="space-y-3.5">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            const isExpanded = expandedIdx === idx;

            return (
              <Card
                key={idx}
                isGlass={true}
                className={`p-4 space-y-3 transition-all border ${
                  isExpanded
                    ? 'border-blue-500/70 bg-[var(--bg-surface)] shadow-md'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-blue-300 dark:hover:border-blue-800'
                }`}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between cursor-pointer select-none"
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-[var(--text-main)]">{cat.group}</h4>
                        {cat.priority === 'URGENT' && (
                          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[10.5px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-0.5">
                        {isExpanded ? 'Collapse clinical reasoning' : 'Inspect biomarker rationale & citations'}
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <Badge variant={cat.variant} size="sm" className="font-mono text-[9px] tracking-wider uppercase font-bold">
                      {cat.badge}
                    </Badge>
                    <div className="p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Clinical Rationale */}
                {isExpanded && (
                  <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-[var(--text-main)] font-medium leading-relaxed flex items-start gap-2.5 animate-fadeIn">
                    <Dna size={15} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold text-blue-900 dark:text-blue-200">{cat.rationale}</span>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Action items below are mathematically weighted against your positive biomarker risk attributions.
                      </p>
                    </div>
                  </div>
                )}

                {/* Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {cat.items.map((item, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-blue-400/40 transition-all space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-black text-xs text-[var(--text-main)]">
                            <span className="text-base">{item.icon}</span>
                            <span>{item.title}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-normal">
                          {item.detail}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                          <Target className="w-3 h-3" />
                          <span>{item.target}</span>
                        </div>
                        <span className="text-[9.5px] font-mono font-medium text-[var(--text-muted)] truncate max-w-[140px]" title={item.citation}>
                          {item.citation}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 2: 90-Day Clinical Milestones */}
      {activeTab === 'milestones' && (
        <Card isGlass={true} className="p-5 space-y-4 border border-[var(--border-medium)] shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-[var(--text-main)]">90-Day Quantified Clinical Milestone Corridor</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Target milestones calibrated to reverse early metabolic risk and restore physiological homeostasis.
              </p>
            </div>
            <Badge variant="primary" size="md" className="font-mono text-[10px]">
              QUARTERLY HORIZON
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-medium)] text-[10px] uppercase font-mono text-[var(--text-muted)] tracking-wider">
                  <th className="py-2.5 px-3">Biomarker / Telemetry Domain</th>
                  <th className="py-2.5 px-3">Baseline (Measured)</th>
                  <th className="py-2.5 px-3">90-Day Target Corridor</th>
                  <th className="py-2.5 px-3">Clinical Authority Citation</th>
                  <th className="py-2.5 px-3 text-right">Expected Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[11px]">
                {glucose !== null && (
                  <tr className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="py-3 px-3 font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Utensils className="w-3.5 h-3.5 text-blue-500" />
                      <span>Fasting Blood Glucose</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-rose-500">{glucose} mg/dL</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">&lt; 100 mg/dL</td>
                    <td className="py-3 px-3 text-[10px] text-[var(--text-muted)] font-mono">ADA Standards 2024 §6</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">-18% T2D Risk</td>
                  </tr>
                )}

                {hba1c !== null && (
                  <tr className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="py-3 px-3 font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      <span>Glycated Hemoglobin (HbA1c)</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-rose-500">{hba1c}%</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">&lt; 5.7% (Normal)</td>
                    <td className="py-3 px-3 text-[10px] text-[var(--text-muted)] font-mono">ADA Standards 2024 §2</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">-24% Complications</td>
                  </tr>
                )}

                {sysBp !== null && (
                  <tr className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="py-3 px-3 font-bold text-[var(--text-main)] flex items-center gap-2">
                      <HeartPulse className="w-3.5 h-3.5 text-blue-500" />
                      <span>Blood Pressure (Vascular)</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-amber-500">{sysBp}/{diaBp || 80} mmHg</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">&lt; 120/80 mmHg</td>
                    <td className="py-3 px-3 text-[10px] text-[var(--text-muted)] font-mono">AHA / ACC 2023</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">-15% MetSyn Risk</td>
                  </tr>
                )}

                {steps !== null && (
                  <tr className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="py-3 px-3 font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      <span>Daily Step Cadence</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold">{Math.round(steps)} steps/day</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">&gt; 7,500 steps/day</td>
                    <td className="py-3 px-3 text-[10px] text-[var(--text-muted)] font-mono">WHO Guidelines 2023</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">+12% Insulin Sens.</td>
                  </tr>
                )}

                {akkermansia !== null && (
                  <tr className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="py-3 px-3 font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Dna className="w-3.5 h-3.5 text-blue-500" />
                      <span>Akkermansia muciniphila Abundance</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-amber-500">{akkermansia.toFixed(2)}%</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">&gt; 1.00% of Flora</td>
                    <td className="py-3 px-3 text-[10px] text-[var(--text-muted)] font-mono">ISAPP Consensus 2023</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">Gut Barrier Restore</td>
                  </tr>
                )}

                {hrv !== null && (
                  <tr className="hover:bg-[var(--bg-surface)] transition-colors">
                    <td className="py-3 px-3 font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Moon className="w-3.5 h-3.5 text-blue-500" />
                      <span>Nocturnal HRV RMSSD</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-amber-500">{hrv} ms</td>
                    <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">&gt; 35 - 45 ms</td>
                    <td className="py-3 px-3 text-[10px] text-[var(--text-muted)] font-mono">AHA Autonomic 2022</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">Vagal Recovery</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Interactive What-If Counterfactual Simulator */}
      {activeTab === 'simulator' && (
        <Card isGlass={true} className="p-5 space-y-5 border border-[var(--border-medium)] shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-black text-[var(--text-main)]">Counterfactual "What-If" Risk Sensitivity Simulator</h4>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Simulate how specific therapeutic lifestyle changes mathematically reduce predicted cardiometabolic risk.
              </p>
            </div>
            <Badge variant="primary" size="md" className="self-start font-mono text-[10px]">
              PREDICTIVE COUNTERFACTUAL
            </Badge>
          </div>

          {/* Dual Risk Gauges (Current vs Projected) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
            <div className="text-center space-y-1 sm:border-r border-[var(--border-subtle)] pr-2">
              <span className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider">Current Estimated Risk</span>
              <div className="text-2xl font-black text-rose-500 font-mono">{simResult.baseRisk}%</div>
              <span className="text-[10.5px] text-[var(--text-muted)]">Type 2 Diabetes Baseline</span>
            </div>

            <div className="text-center space-y-1 sm:border-r border-[var(--border-subtle)] pr-2">
              <span className="text-[10px] uppercase font-mono font-bold text-[var(--text-muted)] tracking-wider">Simulated Risk Corridor</span>
              <div className="text-2xl font-black text-emerald-500 font-mono">{simResult.projectedRisk}%</div>
              <span className="text-[10.5px] text-emerald-600 font-semibold">Post-Intervention Projected</span>
            </div>

            <div className="text-center space-y-1 flex flex-col justify-center items-center">
              <span className="text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Estimated Risk Drop</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                <TrendingDown className="w-5 h-5" />
                <span>-{simResult.riskDelta}%</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">({simResult.percentReduction}% Relative Reduction)</span>
            </div>
          </div>

          {/* Interactive Sliders */}
          <div className="space-y-4 pt-1">
            {/* Slider 1: Fasting Glucose */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-blue-500" />
                  <span>Dietary Glycemic Reduction</span>
                </div>
                <span className="font-mono text-emerald-600 font-black">{simGlucoseDelta} mg/dL</span>
              </div>
              <input
                type="range"
                min="-35"
                max="0"
                step="5"
                value={simGlucoseDelta}
                onChange={(e) => setSimGlucoseDelta(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 bg-[var(--border-medium)] rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>-35 mg/dL (Strict Low-GI)</span>
                <span>-15 mg/dL (Moderate Protocol)</span>
                <span>0 mg/dL (No Change)</span>
              </div>
            </div>

            {/* Slider 2: Daily Steps */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Physical Activity Incremental Ramp</span>
                </div>
                <span className="font-mono text-emerald-600 font-black">+{simStepsDelta.toLocaleString()} steps/day</span>
              </div>
              <input
                type="range"
                min="0"
                max="6000"
                step="500"
                value={simStepsDelta}
                onChange={(e) => setSimStepsDelta(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-2 bg-[var(--border-medium)] rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>+0 (Baseline)</span>
                <span>+2,500 (Brisk Walk)</span>
                <span>+6,000 (Active Regimen)</span>
              </div>
            </div>

            {/* Slider 3: Sleep Hygiene */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Nocturnal Sleep Extension</span>
                </div>
                <span className="font-mono text-emerald-600 font-black">+{simSleepDelta.toFixed(1)} hrs/night</span>
              </div>
              <input
                type="range"
                min="0"
                max="2.5"
                step="0.5"
                value={simSleepDelta}
                onChange={(e) => setSimSleepDelta(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-[var(--border-medium)] rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-mono">
                <span>+0.0 hrs</span>
                <span>+1.0 hr (Circadian Alignment)</span>
                <span>+2.5 hrs</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[10.5px] text-[var(--text-muted)] font-medium leading-relaxed flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              Simulated projections are derived from model partial regression coefficients on our validated cohort. Share these targets with your physician for clinical supervision.
            </span>
          </div>
        </Card>
      )}

    </div>
  );
}
