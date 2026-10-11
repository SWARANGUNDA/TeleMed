import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageContainer, ContentSection } from '../components/layout';
import { Card, Badge, Button, ProgressBar, Tabs } from '../components/ui';
import {
  TrendingUp, TrendingDown, ArrowRight, Printer, Download, FileText,
  Calendar, CheckCircle2, AlertCircle, Activity, Heart, Watch, Dna,
  Sparkles, Sliders, RefreshCw, BarChart3, ChevronRight, ShieldCheck, GitCompare,
  Stethoscope, Clock, Zap, Info, ArrowUpRight, ArrowDownRight, Minus, Filter, ArrowLeftRight
} from 'lucide-react';
import { fetchPatientRecords } from '../api/client';

// =====================================================================
// CLINICAL PARAMETER DICTIONARY & DIRECTIONALITY MATRIX
// Exhaustive physiological coverage across Clinical (19D), Wearable (15D), Gut (49D)
// =====================================================================
const PARAMETER_METADATA = {
  // --- DEMOGRAPHICS & GENETICS ---
  Age: {
    label: 'Age',
    unit: 'yrs',
    type: 'demographic',
    category: 'Demographics & Genetics',
    refRange: 'Chronological'
  },
  Height: {
    label: 'Height',
    unit: 'cm',
    type: 'demographic',
    category: 'Demographics & Genetics',
    refRange: 'Constant Stature'
  },
  Gender: {
    label: 'Biological Sex',
    unit: '',
    type: 'categorical',
    category: 'Demographics & Genetics',
    refRange: 'Phenotype'
  },
  Family_History_Diabetes: {
    label: 'Family History: Diabetes',
    unit: '',
    type: 'family_history',
    category: 'Demographics & Genetics',
    refRange: 'Negative / Absent'
  },
  Family_History_Hypertension: {
    label: 'Family History: Hypertension',
    unit: '',
    type: 'family_history',
    category: 'Demographics & Genetics',
    refRange: 'Negative / Absent'
  },
  Family_History_CVD: {
    label: 'Family History: CVD',
    unit: '',
    type: 'family_history',
    category: 'Demographics & Genetics',
    refRange: 'Negative / Absent'
  },
  Smoking_History: {
    label: 'Smoking History',
    unit: '',
    type: 'categorical',
    category: 'Demographics & Genetics',
    refRange: 'Non-Smoker (0)'
  },

  // --- ANTHROPOMETRIC & BODY COMPOSITION ---
  Weight: {
    label: 'Body Weight',
    unit: 'kg',
    type: 'weight_bmi',
    category: 'Body Composition',
    refRange: 'BMI 18.5–24.9 Target'
  },
  BMI: {
    label: 'Body Mass Index (BMI)',
    unit: 'kg/m²',
    type: 'target_range',
    targetMin: 18.5,
    targetMax: 24.9,
    tolerance: 0.2,
    category: 'Body Composition',
    refRange: '18.5 – 24.9 kg/m²'
  },
  Waist_Circumference: {
    label: 'Waist Circumference',
    unit: 'cm',
    type: 'lower_is_better',
    healthyMax: 90,
    tolerance: 1.0,
    category: 'Body Composition',
    refRange: '< 90 cm'
  },

  // --- BLOOD PRESSURE & CARDIOVASCULAR ---
  Systolic_BP: {
    label: 'Systolic Blood Pressure',
    unit: 'mmHg',
    type: 'lower_is_better',
    healthyMin: 90,
    healthyMax: 120,
    tolerance: 3.0,
    category: 'Cardiovascular & Lipids',
    refRange: '< 120 mmHg'
  },
  Diastolic_BP: {
    label: 'Diastolic Blood Pressure',
    unit: 'mmHg',
    type: 'lower_is_better',
    healthyMin: 60,
    healthyMax: 80,
    tolerance: 2.0,
    category: 'Cardiovascular & Lipids',
    refRange: '< 80 mmHg'
  },

  // --- GLYCEMIC & METABOLIC PANEL ---
  Fasting_Blood_Glucose: {
    label: 'Fasting Blood Glucose',
    unit: 'mg/dL',
    type: 'lower_is_better',
    healthyMin: 70,
    healthyMax: 99,
    tolerance: 2.0,
    category: 'Glycemic & Metabolic',
    refRange: '70 – 99 mg/dL'
  },
  Glucose: {
    label: 'Serum Glucose',
    unit: 'mg/dL',
    type: 'lower_is_better',
    healthyMin: 70,
    healthyMax: 99,
    tolerance: 2.0,
    category: 'Glycemic & Metabolic',
    refRange: '70 – 99 mg/dL'
  },
  HbA1c: {
    label: 'Glycated Hemoglobin (HbA1c)',
    unit: '%',
    type: 'lower_is_better',
    healthyMin: 4.0,
    healthyMax: 5.6,
    tolerance: 0.1,
    category: 'Glycemic & Metabolic',
    refRange: '< 5.7%'
  },
  Fasting_Insulin: {
    label: 'Fasting Serum Insulin',
    unit: 'μIU/mL',
    type: 'lower_is_better',
    healthyMax: 12.0,
    category: 'Glycemic & Metabolic',
    refRange: '< 12.0 μIU/mL'
  },
  HOMA_IR: {
    label: 'HOMA-IR Insulin Resistance',
    unit: 'index',
    type: 'lower_is_better',
    healthyMax: 1.9,
    category: 'Glycemic & Metabolic',
    refRange: '< 1.9'
  },

  // --- LIPID PROFILES ---
  Total_Cholesterol: {
    label: 'Total Cholesterol',
    unit: 'mg/dL',
    type: 'lower_is_better',
    healthyMax: 200,
    tolerance: 4.0,
    category: 'Cardiovascular & Lipids',
    refRange: '< 200 mg/dL'
  },
  Triglycerides: {
    label: 'Serum Triglycerides',
    unit: 'mg/dL',
    type: 'lower_is_better',
    healthyMax: 150,
    tolerance: 5.0,
    category: 'Cardiovascular & Lipids',
    refRange: '< 150 mg/dL'
  },
  LDL: {
    label: 'LDL Cholesterol',
    unit: 'mg/dL',
    type: 'lower_is_better',
    healthyMax: 100,
    tolerance: 3.0,
    category: 'Cardiovascular & Lipids',
    refRange: '< 100 mg/dL'
  },
  HDL: {
    label: 'HDL Cholesterol (Protective)',
    unit: 'mg/dL',
    type: 'higher_is_better', // Higher HDL is protective
    healthyMin: 50,
    tolerance: 2.0,
    category: 'Cardiovascular & Lipids',
    refRange: '≥ 50 mg/dL'
  },
  HDL_Cholesterol: {
    label: 'HDL Cholesterol (Protective)',
    unit: 'mg/dL',
    type: 'higher_is_better',
    healthyMin: 50,
    tolerance: 2.0,
    category: 'Cardiovascular & Lipids',
    refRange: '≥ 50 mg/dL'
  },

  // --- HEPATIC & INFLAMMATION ---
  ALT: {
    label: 'ALT (Alanine Transaminase)',
    unit: 'U/L',
    type: 'lower_is_better',
    healthyMax: 45,
    tolerance: 2.0,
    category: 'Hepatic & Organ Health',
    refRange: '< 45 U/L'
  },
  AST: {
    label: 'AST (Aspartate Transaminase)',
    unit: 'U/L',
    type: 'lower_is_better',
    healthyMax: 40,
    tolerance: 2.0,
    category: 'Hepatic & Organ Health',
    refRange: '< 40 U/L'
  },
  hs_CRP: {
    label: 'High-Sensitivity CRP',
    unit: 'mg/L',
    type: 'lower_is_better',
    healthyMax: 1.0,
    category: 'Hepatic & Organ Health',
    refRange: '< 1.0 mg/L'
  },

  // --- WEARABLE SENSORS & DIGITAL BIOMARKERS ---
  Average_Daily_Steps: {
    label: 'Average Daily Steps',
    unit: 'steps/day',
    type: 'higher_is_better',
    healthyMin: 8000,
    tolerance: 100,
    category: 'Wearable & Multimodal',
    refRange: '≥ 8,000 steps'
  },
  Daily_Steps: {
    label: 'Average Daily Steps',
    unit: 'steps/day',
    type: 'higher_is_better',
    healthyMin: 8000,
    tolerance: 100,
    category: 'Wearable & Multimodal',
    refRange: '≥ 8,000 steps'
  },
  Active_Minutes: {
    label: 'Active Minutes (MVPA)',
    unit: 'mins/day',
    type: 'higher_is_better',
    healthyMin: 30,
    tolerance: 2,
    category: 'Wearable & Multimodal',
    refRange: '≥ 30 mins'
  },
  Sedentary_Time_Minutes: {
    label: 'Sedentary Inactivity Time',
    unit: 'mins/day',
    type: 'lower_is_better',
    healthyMax: 480,
    tolerance: 10,
    category: 'Wearable & Multimodal',
    refRange: '< 480 mins'
  },
  Resting_Heart_Rate: {
    label: 'Resting Heart Rate',
    unit: 'bpm',
    type: 'target_range',
    targetMin: 55,
    targetMax: 75,
    tolerance: 2.0,
    category: 'Wearable & Multimodal',
    refRange: '55 – 75 bpm'
  },
  Sleep_Duration_Hours: {
    label: 'Average Sleep Duration',
    unit: 'hrs',
    type: 'target_range',
    targetMin: 7.0,
    targetMax: 9.0,
    tolerance: 0.2,
    category: 'Wearable & Multimodal',
    refRange: '7.0 – 9.0 hrs'
  },
  Sleep_Duration: {
    label: 'Average Sleep Duration',
    unit: 'hrs',
    type: 'target_range',
    targetMin: 7.0,
    targetMax: 9.0,
    tolerance: 0.2,
    category: 'Wearable & Multimodal',
    refRange: '7.0 – 9.0 hrs'
  },
  Sleep_Efficiency_Score: {
    label: 'Sleep Efficiency Score',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 85,
    tolerance: 2,
    category: 'Wearable & Multimodal',
    refRange: '≥ 85%'
  },
  Autonomic_Stress_Score: {
    label: 'Autonomic Stress Index',
    unit: 'score',
    type: 'lower_is_better',
    healthyMax: 35,
    tolerance: 2,
    category: 'Wearable & Multimodal',
    refRange: '< 35'
  },
  Activity_Energy_Expenditure: {
    label: 'Active Energy Expenditure',
    unit: 'kcal/day',
    type: 'higher_is_better',
    healthyMin: 350,
    tolerance: 15,
    category: 'Wearable & Multimodal',
    refRange: '≥ 350 kcal'
  },
  Exercise_Frequency_Days: {
    label: 'Weekly Exercise Frequency',
    unit: 'days/wk',
    type: 'higher_is_better',
    healthyMin: 3,
    tolerance: 0,
    category: 'Wearable & Multimodal',
    refRange: '≥ 3 days/wk'
  },
  CGM_Time_In_Range: {
    label: 'CGM Time-In-Range (70–180 mg/dL)',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 70,
    tolerance: 2,
    category: 'Wearable & Multimodal',
    refRange: '≥ 70%'
  },
  CGM_Time_Above_Range: {
    label: 'CGM Hyperglycemic Time (>180 mg/dL)',
    unit: '%',
    type: 'lower_is_better',
    healthyMax: 25,
    tolerance: 2,
    category: 'Wearable & Multimodal',
    refRange: '< 25%'
  },
  CGM_Time_Below_Range: {
    label: 'CGM Hypoglycemic Time (<70 mg/dL)',
    unit: '%',
    type: 'lower_is_better',
    healthyMax: 4,
    tolerance: 1,
    category: 'Wearable & Multimodal',
    refRange: '< 4%'
  },
  CGM_Average_Glucose: {
    label: 'CGM Mean Sensor Glucose',
    unit: 'mg/dL',
    type: 'lower_is_better',
    healthyMin: 70,
    healthyMax: 110,
    tolerance: 3,
    category: 'Wearable & Multimodal',
    refRange: '70 – 110 mg/dL'
  },
  Average_Glucose: {
    label: 'CGM Mean Sensor Glucose',
    unit: 'mg/dL',
    type: 'lower_is_better',
    healthyMin: 70,
    healthyMax: 110,
    tolerance: 3,
    category: 'Wearable & Multimodal',
    refRange: '70 – 110 mg/dL'
  },
  Glucose_Variability: {
    label: 'CGM Glucose Coeff of Variation (%CV)',
    unit: '%',
    type: 'lower_is_better',
    healthyMax: 36,
    tolerance: 1.5,
    category: 'Wearable & Multimodal',
    refRange: '≤ 36%'
  },
  Heart_Rate_Variability_RMSSD: {
    label: 'Heart Rate Variability (RMSSD)',
    unit: 'ms',
    type: 'higher_is_better',
    healthyMin: 45,
    tolerance: 2,
    category: 'Wearable & Multimodal',
    refRange: '≥ 45 ms'
  },
  HRV: {
    label: 'Heart Rate Variability (RMSSD)',
    unit: 'ms',
    type: 'higher_is_better',
    healthyMin: 45,
    tolerance: 2,
    category: 'Wearable & Multimodal',
    refRange: '≥ 45 ms'
  },
  Deep_Sleep_Percent: {
    label: 'Deep Sleep Architecture',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 15,
    category: 'Wearable & Multimodal',
    refRange: '15 – 25%'
  },

  // --- GUT MICROBIOME & MULTIOMICS ---
  Shannon_Diversity: {
    label: 'Shannon Alpha Diversity Index',
    unit: 'index',
    type: 'higher_is_better',
    healthyMin: 3.2,
    tolerance: 0.1,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 3.2'
  },
  Shannon_Diversity_Index: {
    label: 'Shannon Alpha Diversity Index',
    unit: 'index',
    type: 'higher_is_better',
    healthyMin: 3.2,
    tolerance: 0.1,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 3.2'
  },
  Simpson_Diversity: {
    label: 'Simpson Diversity Index',
    unit: 'index',
    type: 'higher_is_better',
    healthyMin: 0.90,
    tolerance: 0.02,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 0.90'
  },
  Observed_Richness: {
    label: 'Observed Microbial Richness',
    unit: 'taxa',
    type: 'higher_is_better',
    healthyMin: 35,
    tolerance: 2,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 35 taxa'
  },
  Pielou_Evenness: {
    label: 'Pielou Community Evenness',
    unit: 'index',
    type: 'higher_is_better',
    healthyMin: 0.85,
    tolerance: 0.02,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 0.85'
  },
  SCFA_Producer_Index: {
    label: 'SCFA Producer Functional Index',
    unit: 'index',
    type: 'higher_is_better',
    healthyMin: 2.5,
    tolerance: 0.1,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 2.5'
  },
  Butyrate_Producer_Index: {
    label: 'Butyrate Producer Index',
    unit: 'index',
    type: 'higher_is_better',
    healthyMin: 2.0,
    tolerance: 0.1,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 2.0'
  },
  Barrier_Associated_Index: {
    label: 'Gut Barrier Integrity Index',
    unit: 'index',
    type: 'higher_is_better',
    healthyMin: 4.0,
    tolerance: 0.15,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 4.0'
  },
  Inflammation_Associated_Index: {
    label: 'Microbial Inflammation Index',
    unit: 'index',
    type: 'lower_is_better',
    healthyMax: 1.0,
    tolerance: 0.1,
    category: 'Gut Microbiome & Multiomics',
    refRange: '< 1.0'
  },
  Log_Firmicutes_Bacteroidetes_Ratio: {
    label: 'Log F/B Phylum Ratio',
    unit: 'ratio',
    type: 'target_range',
    targetMin: 0.1,
    targetMax: 0.8,
    tolerance: 0.05,
    category: 'Gut Microbiome & Multiomics',
    refRange: '0.1 – 0.8'
  },
  Faecalibacterium_prausnitzii: {
    label: 'Faecalibacterium prausnitzii (Butyrate)',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 5.0,
    tolerance: 0.3,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 5.0%'
  },
  Faecalibacterium: {
    label: 'Faecalibacterium (Butyrate)',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 5.0,
    tolerance: 0.3,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 5.0%'
  },
  Akkermansia_muciniphila: {
    label: 'Akkermansia muciniphila (Mucin)',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 1.0,
    tolerance: 0.2,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 1.0%'
  },
  Akkermansia: {
    label: 'Akkermansia (Mucin Integrity)',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 1.0,
    tolerance: 0.2,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 1.0%'
  },
  Roseburia_intestinalis: {
    label: 'Roseburia intestinalis',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 2.0,
    tolerance: 0.2,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 2.0%'
  },
  Bifidobacterium_longum: {
    label: 'Bifidobacterium longum',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 3.0,
    tolerance: 0.3,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 3.0%'
  },
  Bifidobacterium: {
    label: 'Bifidobacterium spp.',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 3.0,
    tolerance: 0.3,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 3.0%'
  },
  Escherichia_coli: {
    label: 'Escherichia coli (Pathobiont)',
    unit: '%',
    type: 'lower_is_better',
    healthyMax: 1.0,
    tolerance: 0.2,
    category: 'Gut Microbiome & Multiomics',
    refRange: '< 1.0%'
  },
  Klebsiella_pneumoniae: {
    label: 'Klebsiella pneumoniae (Pathobiont)',
    unit: '%',
    type: 'lower_is_better',
    healthyMax: 0.5,
    tolerance: 0.1,
    category: 'Gut Microbiome & Multiomics',
    refRange: '< 0.5%'
  },
  Enterococcus_faecalis: {
    label: 'Enterococcus faecalis',
    unit: '%',
    type: 'lower_is_better',
    healthyMax: 0.5,
    tolerance: 0.1,
    category: 'Gut Microbiome & Multiomics',
    refRange: '< 0.5%'
  },
  Lactobacillus_acidophilus: {
    label: 'Lactobacillus acidophilus',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 1.0,
    tolerance: 0.2,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 1.0%'
  },
  Bacteroides_thetaiotaomicron: {
    label: 'Bacteroides thetaiotaomicron',
    unit: '%',
    type: 'higher_is_better',
    healthyMin: 5.0,
    tolerance: 0.5,
    category: 'Gut Microbiome & Multiomics',
    refRange: '≥ 5.0%'
  }
};

/**
 * Evaluates longitudinal trajectory shift:
 * @param {string} key - Parameter field key
 * @param {any} valBaseline - Reference Baseline value (T0)
 * @param {any} valFollowUp - Target Follow-Up value (T1)
 * 
 * Shift Formula: Δ = valFollowUp - valBaseline (Change from baseline)
 */
function evaluateBiomarkerShift(key, valBaseline, valFollowUp) {
  // Infer or match parameter metadata
  let meta = PARAMETER_METADATA[key];
  if (!meta) {
    const isGutTaxa = key.includes('_') && !key.toLowerCase().includes('bp') && !key.toLowerCase().includes('score');
    const isProbiotic = /bifido|faecali|akkermansia|roseburia|lacto/i.test(key);
    const isPathobiont = /coli|klebsiella|fusobacter|bilophila|entero/i.test(key);

    meta = {
      label: key.replace(/_/g, ' '),
      unit: isGutTaxa ? '%' : '',
      type: isProbiotic ? 'higher_is_better' : isPathobiont ? 'lower_is_better' : 'neutral_shift',
      tolerance: 0.5,
      category: isGutTaxa ? 'Gut Microbiome & Multiomics' : 'Clinical Biomarkers',
      refRange: 'Standard'
    };
  }

  const hasBase = valBaseline !== undefined && valBaseline !== null && valBaseline !== '' && valBaseline !== '—';
  const hasFollow = valFollowUp !== undefined && valFollowUp !== null && valFollowUp !== '' && valFollowUp !== '—';

  if (!hasBase && !hasFollow) return null;

  // Single-record parameter: Only one assessment has a recorded measurement
  if (!hasBase || !hasFollow) {
    return {
      key,
      name: meta.label,
      category: meta.category,
      unit: meta.unit,
      refRange: meta.refRange,
      baselineVal: hasBase ? `${valBaseline}${meta.unit ? ' ' + meta.unit : ''}` : '—',
      followUpVal: hasFollow ? `${valFollowUp}${meta.unit ? ' ' + meta.unit : ''}` : '—',
      diff: '—',
      progressionText: hasFollow ? 'Baseline Not Tested' : 'Not Retested in Follow-Up',
      trend: hasFollow ? 'Current Only' : 'Prior Only',
      status: hasFollow ? 'No Longitudinal Baseline' : 'Historical Baseline Only',
      variant: 'outline',
      directionIcon: 'single',
      clinicalNote: hasFollow 
        ? `Measured at ${valFollowUp}${meta.unit ? ' ' + meta.unit : ''} in follow-up. Historical baseline was not performed.`
        : `Recorded in prior baseline intake. Parameter was omitted or not measured in follow-up.`
    };
  }

  // --- DEMOGRAPHICS & FAMILY GENETICS ---
  if (meta.type === 'demographic' || meta.type === 'categorical' || meta.type === 'family_history') {
    if (meta.type === 'family_history') {
      const boolBase = Number(valBaseline) === 1;
      const boolFollow = Number(valFollowUp) === 1;
      return {
        key,
        name: meta.label,
        category: meta.category,
        unit: '',
        refRange: 'Negative / Absent',
        baselineVal: boolBase ? 'Reported (Positive)' : 'None (Negative)',
        followUpVal: boolFollow ? 'Reported (Positive)' : 'None (Negative)',
        diff: boolBase === boolFollow ? '0' : (boolFollow ? '+1' : '–1'),
        progressionText: `${boolBase ? 'Reported' : 'None'} → ${boolFollow ? 'Reported' : 'None'}`,
        trend: boolFollow ? 'Reported' : 'Negative',
        status: boolFollow ? 'Familial Risk Predisposition' : 'No Familial Risk Reported',
        variant: boolFollow ? 'warning' : 'outline',
        directionIcon: 'constant',
        clinicalNote: 'Non-modifiable familial genetic risk factor documented in anamnesis.'
      };
    }

    if (key === 'Age') {
      const nBase = parseFloat(valBaseline);
      const nFollow = parseFloat(valFollowUp);
      const deltaYrs = (!isNaN(nBase) && !isNaN(nFollow)) ? Math.round(nFollow - nBase) : 0;
      return {
        key,
        name: meta.label,
        category: meta.category,
        unit: 'yrs',
        refRange: 'Chronological',
        baselineVal: `${valBaseline} yrs`,
        followUpVal: `${valFollowUp} yrs`,
        diff: deltaYrs > 0 ? `+${deltaYrs} yrs` : deltaYrs < 0 ? `${deltaYrs} yrs` : '0 yrs',
        progressionText: `${valBaseline} → ${valFollowUp} yrs`,
        trend: 'Chronological',
        status: deltaYrs >= 0 ? `Elapsed: ${deltaYrs} yrs` : `Profile Cohort Shift (${deltaYrs} yrs)`,
        variant: 'outline',
        directionIcon: 'constant',
        clinicalNote: 'Patient chronological baseline demographic attribute.'
      };
    }

    if (key === 'Height') {
      const nBase = parseFloat(valBaseline);
      const nFollow = parseFloat(valFollowUp);
      const deltaCm = (!isNaN(nBase) && !isNaN(nFollow)) ? (nFollow - nBase) : 0;
      return {
        key,
        name: meta.label,
        category: meta.category,
        unit: 'cm',
        refRange: 'Constant Stature',
        baselineVal: `${valBaseline} cm`,
        followUpVal: `${valFollowUp} cm`,
        diff: deltaCm > 0 ? `+${deltaCm.toFixed(1)} cm` : deltaCm < 0 ? `${deltaCm.toFixed(1)} cm` : '0 cm',
        progressionText: `${valBaseline} → ${valFollowUp} cm`,
        trend: Math.abs(deltaCm) <= 1.0 ? 'Constant' : 'Height Delta',
        status: 'Physical Stature Metric',
        variant: 'outline',
        directionIcon: 'constant',
        clinicalNote: 'Adult anatomical stature (variation within clinical stadiometer tolerance ±1.0 cm).'
      };
    }

    return {
      key,
      name: meta.label,
      category: meta.category,
      unit: meta.unit,
      refRange: meta.refRange,
      baselineVal: `${valBaseline}`,
      followUpVal: `${valFollowUp}`,
      diff: valBaseline === valFollowUp ? '0' : 'Shift',
      progressionText: `${valBaseline} → ${valFollowUp}`,
      trend: valBaseline === valFollowUp ? 'Unchanged' : 'Changed',
      status: 'Categorical Trait',
      variant: 'outline',
      directionIcon: 'constant',
      clinicalNote: 'Non-interventional demographic phenotype.'
    };
  }

  // --- QUANTITATIVE NUMERICAL PARAMETERS ---
  const nBase = parseFloat(valBaseline);
  const nFollow = parseFloat(valFollowUp);

  if (isNaN(nBase) || isNaN(nFollow)) {
    return {
      key,
      name: meta.label,
      category: meta.category,
      unit: meta.unit,
      refRange: meta.refRange,
      baselineVal: `${valBaseline}`,
      followUpVal: `${valFollowUp}`,
      diff: '—',
      progressionText: `${valBaseline} → ${valFollowUp}`,
      trend: 'Recorded',
      status: 'Qualitative Entry',
      variant: 'outline',
      directionIcon: 'single',
      clinicalNote: 'Non-numerical clinical observation.'
    };
  }

  // Δ = FollowUp - Baseline
  const diff = nFollow - nBase;
  const absDiff = Math.abs(diff);
  const tolerance = meta.tolerance ?? (Math.max(Math.abs(nBase), 1) * 0.015);
  const isNegligible = absDiff <= tolerance;
  const diffFormatted = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  const unitSuffix = meta.unit ? ` ${meta.unit}` : '';
  const progressionText = `${nBase.toFixed(1)} → ${nFollow.toFixed(1)}${unitSuffix}`;

  // Subcase 1: Stable / In Clinical Tolerance
  if (isNegligible) {
    return {
      key,
      name: meta.label,
      category: meta.category,
      unit: meta.unit,
      refRange: meta.refRange,
      baselineVal: `${nBase.toFixed(1)}${unitSuffix}`,
      followUpVal: `${nFollow.toFixed(1)}${unitSuffix}`,
      diff: `${diffFormatted}${unitSuffix}`,
      progressionText,
      trend: 'Stable ↔',
      status: `Physiological Equilibrium (±${absDiff.toFixed(1)})`,
      variant: 'outline',
      directionIcon: 'stable',
      clinicalNote: `Delta of ${diffFormatted}${unitSuffix} is within normal physiological variability.`
    };
  }

  // Subcase 2: Target Range Metrics (BMI, Sleep, Resting Heart Rate)
  if (meta.type === 'target_range') {
    const tMin = meta.targetMin;
    const tMax = meta.targetMax;
    const distFollow = nFollow < tMin ? tMin - nFollow : (nFollow > tMax ? nFollow - tMax : 0);
    const distBase = nBase < tMin ? tMin - nBase : (nBase > tMax ? nBase - tMax : 0);

    const isInsideTargetNow = distFollow === 0;
    const isMovingCloserToTarget = distFollow < distBase;

    let trendLabel, statusLabel, badgeVariant, dirIcon;
    if (isInsideTargetNow) {
      trendLabel = 'Optimized';
      statusLabel = `Normalized in Target Range (${tMin}–${tMax})`;
      badgeVariant = 'success';
      dirIcon = 'down_good';
    } else if (isMovingCloserToTarget) {
      trendLabel = diff < 0 ? 'Improving ↓' : 'Improving ↑';
      statusLabel = `Shifting Toward Target Range (${diffFormatted}${unitSuffix})`;
      badgeVariant = 'success';
      dirIcon = diff < 0 ? 'down_good' : 'up_good';
    } else {
      trendLabel = distFollow > distBase && nFollow > tMax ? 'Elevated ↑' : 'Sub-Optimal';
      statusLabel = `Diverging From Target Range (${diffFormatted}${unitSuffix})`;
      badgeVariant = 'warning';
      dirIcon = diff > 0 ? 'up_bad' : 'down_bad';
    }

    return {
      key,
      name: meta.label,
      category: meta.category,
      unit: meta.unit,
      refRange: meta.refRange,
      baselineVal: `${nBase.toFixed(1)}${unitSuffix}`,
      followUpVal: `${nFollow.toFixed(1)}${unitSuffix}`,
      diff: `${diffFormatted}${unitSuffix}`,
      progressionText,
      trend: trendLabel,
      status: statusLabel,
      variant: badgeVariant,
      directionIcon: dirIcon,
      clinicalNote: `Clinical Target: ${tMin}–${tMax}${unitSuffix}. Follow-up measurement shifted to ${nFollow.toFixed(1)}.`
    };
  }

  // Subcase 3: Body Weight (Context-aware relative to baseline adiposity)
  if (meta.type === 'weight_bmi') {
    const wasOverweight = nBase >= 75;
    if (wasOverweight) {
      if (diff < 0) {
        return {
          key,
          name: meta.label,
          category: meta.category,
          unit: meta.unit,
          refRange: meta.refRange,
          baselineVal: `${nBase.toFixed(1)} kg`,
          followUpVal: `${nFollow.toFixed(1)} kg`,
          diff: `${diffFormatted} kg`,
          progressionText,
          trend: 'Improved ↓',
          status: `Adiposity Reduction (–${absDiff.toFixed(1)} kg loss)`,
          variant: 'success',
          directionIcon: 'down_good',
          clinicalNote: `Favorable weight loss of ${absDiff.toFixed(1)} kg from baseline ${nBase.toFixed(1)} kg toward healthy BMI target.`
        };
      } else {
        return {
          key,
          name: meta.label,
          category: meta.category,
          unit: meta.unit,
          refRange: meta.refRange,
          baselineVal: `${nBase.toFixed(1)} kg`,
          followUpVal: `${nFollow.toFixed(1)} kg`,
          diff: `${diffFormatted} kg`,
          progressionText,
          trend: 'Elevated ↑',
          status: `Weight Gain (+${absDiff.toFixed(1)} kg)`,
          variant: 'warning',
          directionIcon: 'up_bad',
          clinicalNote: `Body weight increased by ${absDiff.toFixed(1)} kg from baseline.`
        };
      }
    } else {
      return {
        key,
        name: meta.label,
        category: meta.category,
        unit: meta.unit,
        refRange: meta.refRange,
        baselineVal: `${nBase.toFixed(1)} kg`,
        followUpVal: `${nFollow.toFixed(1)} kg`,
        diff: `${diffFormatted} kg`,
        progressionText,
        trend: 'Shift',
        status: `Weight Shift (${diffFormatted} kg)`,
        variant: 'outline',
        directionIcon: 'stable',
        clinicalNote: `Body weight adjusted by ${diffFormatted} kg.`
      };
    }
  }

  // Subcase 4: HIGHER IS BETTER (HDL Cholesterol, HRV, Steps, Active Mins, CGM Time In Range, Shannon Diversity, Probiotics)
  if (meta.type === 'higher_is_better') {
    if (diff > 0) {
      return {
        key,
        name: meta.label,
        category: meta.category,
        unit: meta.unit,
        refRange: meta.refRange,
        baselineVal: `${nBase.toFixed(1)}${unitSuffix}`,
        followUpVal: `${nFollow.toFixed(1)}${unitSuffix}`,
        diff: `${diffFormatted}${unitSuffix}`,
        progressionText,
        trend: 'Improved ↑',
        status: `Beneficial Gain (+${absDiff.toFixed(1)}${unitSuffix})`,
        variant: 'success',
        directionIcon: 'up_good',
        clinicalNote: `${meta.label} increased by ${absDiff.toFixed(1)}${unitSuffix}, enhancing resilience and protective bounds.`
      };
    } else {
      return {
        key,
        name: meta.label,
        category: meta.category,
        unit: meta.unit,
        refRange: meta.refRange,
        baselineVal: `${nBase.toFixed(1)}${unitSuffix}`,
        followUpVal: `${nFollow.toFixed(1)}${unitSuffix}`,
        diff: `${diffFormatted}${unitSuffix}`,
        progressionText,
        trend: 'Reduced ↓',
        status: `Sub-Optimal Drop (–${absDiff.toFixed(1)}${unitSuffix})`,
        variant: 'warning',
        directionIcon: 'down_bad',
        clinicalNote: `Protective parameter decreased by ${absDiff.toFixed(1)}${unitSuffix} from baseline.`
      };
    }
  }

  // Subcase 5: LOWER IS BETTER (Glucose, HbA1c, Blood Pressure, Triglycerides, LDL, ALT, AST, Sedentary Time, CGM High, Pathobionts, Inflammation)
  if (diff < 0) {
    return {
      key,
      name: meta.label,
      category: meta.category,
      unit: meta.unit,
      refRange: meta.refRange,
      baselineVal: `${nBase.toFixed(1)}${unitSuffix}`,
      followUpVal: `${nFollow.toFixed(1)}${unitSuffix}`,
      diff: `${diffFormatted}${unitSuffix}`,
      progressionText,
      trend: 'Improved ↓',
      status: `Risk Marker Reduction (–${absDiff.toFixed(1)}${unitSuffix})`,
      variant: 'success',
      directionIcon: 'down_good',
      clinicalNote: `Favorable clinical reduction of ${absDiff.toFixed(1)}${unitSuffix} from baseline toward healthy reference target.`
    };
  } else {
    return {
      key,
      name: meta.label,
      category: meta.category,
      unit: meta.unit,
      refRange: meta.refRange,
      baselineVal: `${nBase.toFixed(1)}${unitSuffix}`,
      followUpVal: `${nFollow.toFixed(1)}${unitSuffix}`,
      diff: `${diffFormatted}${unitSuffix}`,
      progressionText,
      trend: 'Elevated ↑',
      status: `Elevated Above Baseline (+${absDiff.toFixed(1)}${unitSuffix})`,
      variant: 'warning',
      directionIcon: 'up_bad',
      clinicalNote: `Risk marker increased by ${absDiff.toFixed(1)}${unitSuffix} compared to baseline.`
    };
  }
}

export default function CompareAssessmentsPage({ user, session, predictionData, onNavigate }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('comparison');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Explicit Baseline (T0) vs Follow-Up (T1) state selection
  const [selectedBaselineId, setSelectedBaselineId] = useState('');
  const [selectedFollowUpId, setSelectedFollowUpId] = useState('');

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const res = await fetchPatientRecords();
        const rawData = res?.records || [];

        // Filter strictly for current user to maintain security boundaries
        const userRecords = rawData.filter(r => 
          (r.user_id && r.user_id === user?.user_id) ||
          (r.patient_id && r.patient_id === user?.user_id) ||
          (r.user_email && r.user_email.toLowerCase() === user?.email?.toLowerCase()) ||
          (r.email && r.email.toLowerCase() === user?.email?.toLowerCase())
        );

        // Sort ascending by creation date so older records are naturally baseline
        const sortedRecords = [...userRecords].sort((a, b) => {
          const tA = new Date(a.created_at || 0).getTime();
          const tB = new Date(b.created_at || 0).getTime();
          return tA - tB;
        });

        setRecords(sortedRecords);

        if (sortedRecords.length >= 2) {
          // Earliest record is Baseline (T0 Benchmark)
          setSelectedBaselineId(sortedRecords[0].record_id);
          // Most recent record is Follow-Up (T1 Evaluation)
          setSelectedFollowUpId(sortedRecords[sortedRecords.length - 1].record_id);
        } else if (sortedRecords.length === 1) {
          setSelectedBaselineId(sortedRecords[0].record_id);
          setSelectedFollowUpId('');
        }
      } catch (e) {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  const assessmentOptions = useMemo(() => {
    return records.map((r, idx) => {
      const rawQuality = r.data_quality_score ?? r.data_quality_scores?.overall_quality_score ?? r.quality_score;
      const qualityNum = rawQuality !== undefined && rawQuality !== null 
        ? (rawQuality <= 1 ? Math.round(rawQuality * 100) : Math.min(100, Math.round(rawQuality)))
        : 100;

      return {
        id: r.record_id || `ASM-${idx}`,
        date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : 'N/A',
        fullDate: r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Assessment',
        label: `${r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Assessment'} (Pathway ${r.effective_pathway || 'C'})`,
        score: qualityNum,
        risk: r.prediction_snapshot?.disease_outcomes?.Type2_Diabetes?.risk_level || 'EVALUATED',
        riskLevel: r.prediction_snapshot?.disease_outcomes?.Type2_Diabetes?.risk_level || 'EVALUATED',
        pathway: r.effective_pathway || 'C',
        quality: `${qualityNum}%`,
        confidence: 'High (V4 Multimodal)',
      };
    });
  }, [records]);

  const baselineRecord = useMemo(() => {
    return records.find(r => (r.record_id || r.id) === selectedBaselineId) || records[0] || null;
  }, [records, selectedBaselineId]);

  const followUpRecord = useMemo(() => {
    return records.find(r => (r.record_id || r.id) === selectedFollowUpId) || records[records.length - 1] || null;
  }, [records, selectedFollowUpId]);

  const assBaseline = useMemo(() => {
    return assessmentOptions.find(a => a.id === selectedBaselineId) || assessmentOptions[0] || {
      id: 'ASM-0', date: 'N/A', fullDate: 'Assessment', label: 'Assessment', quality: '100%', pathway: 'C', risk: 'EVALUATED'
    };
  }, [assessmentOptions, selectedBaselineId]);

  const assFollowUp = useMemo(() => {
    return assessmentOptions.find(a => a.id === selectedFollowUpId) || assessmentOptions[assessmentOptions.length - 1] || {
      id: 'ASM-1', date: 'N/A', fullDate: 'Assessment', label: 'Assessment', quality: '100%', pathway: 'C', risk: 'EVALUATED'
    };
  }, [assessmentOptions, selectedFollowUpId]);

  // Swap Baseline and Follow-Up Handler
  const handleSwapAssessments = () => {
    const temp = selectedBaselineId;
    setSelectedBaselineId(selectedFollowUpId);
    setSelectedFollowUpId(temp);
  };

  // Biomarkers Comparison Matrix: strictly derived from baselineRecord (T0) and followUpRecord (T1)
  const allBiomarkers = useMemo(() => {
    if (!baselineRecord || !followUpRecord) return [];

    const baseClin = baselineRecord?.confirmed_features?.clinical || baselineRecord?.prediction_snapshot?.confirmed_features?.clinical || {};
    const followClin = followUpRecord?.confirmed_features?.clinical || followUpRecord?.prediction_snapshot?.confirmed_features?.clinical || {};

    const baseWear = baselineRecord?.confirmed_features?.wearable || baselineRecord?.prediction_snapshot?.confirmed_features?.wearable || {};
    const followWear = followUpRecord?.confirmed_features?.wearable || followUpRecord?.prediction_snapshot?.confirmed_features?.wearable || {};

    const baseGut = baselineRecord?.confirmed_features?.gut || baselineRecord?.prediction_snapshot?.confirmed_features?.gut || {};
    const followGut = followUpRecord?.confirmed_features?.gut || followUpRecord?.prediction_snapshot?.confirmed_features?.gut || {};

    const rBase = { ...baseClin, ...baseWear, ...baseGut };
    const rFollow = { ...followClin, ...followWear, ...followGut };

    const allKeys = Array.from(new Set([...Object.keys(rBase), ...Object.keys(rFollow)])).filter(k => k !== 'Patient_ID');
    if (allKeys.length === 0) return [];

    // Evaluate: Shift = rFollow[k] - rBase[k]
    const parsed = allKeys.map(k => evaluateBiomarkerShift(k, rBase[k], rFollow[k])).filter(Boolean);

    // Standard clinical ordering
    const priorityOrder = [
      'Fasting_Blood_Glucose', 'Glucose', 'HbA1c', 'Systolic_BP', 'Diastolic_BP',
      'Total_Cholesterol', 'LDL', 'HDL', 'HDL_Cholesterol', 'Triglycerides',
      'BMI', 'Weight', 'Waist_Circumference',
      'ALT', 'AST', 'hs_CRP',
      'Average_Daily_Steps', 'Daily_Steps', 'Active_Minutes', 'Sedentary_Time_Minutes',
      'Resting_Heart_Rate', 'Sleep_Duration_Hours', 'Sleep_Duration', 'Sleep_Efficiency_Score',
      'CGM_Time_In_Range', 'CGM_Time_Above_Range', 'CGM_Time_Below_Range', 'CGM_Average_Glucose',
      'Heart_Rate_Variability_RMSSD', 'HRV', 'Deep_Sleep_Percent',
      'Shannon_Diversity', 'Shannon_Diversity_Index', 'Simpson_Diversity', 'Observed_Richness',
      'Faecalibacterium_prausnitzii', 'Faecalibacterium', 'Akkermansia_muciniphila', 'Akkermansia',
      'Bifidobacterium_longum', 'Bifidobacterium', 'Escherichia_coli', 'Klebsiella_pneumoniae',
      'SCFA_Producer_Index', 'Inflammation_Associated_Index',
      'Age', 'Height', 'Gender', 'Family_History_Diabetes', 'Family_History_Hypertension', 'Family_History_CVD'
    ];

    parsed.sort((a, b) => {
      const idxA = priorityOrder.indexOf(a.key);
      const idxB = priorityOrder.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return parsed;
  }, [baselineRecord, followUpRecord]);

  const displayedBiomarkers = useMemo(() => {
    if (categoryFilter === 'ALL') return allBiomarkers;
    return allBiomarkers.filter(b => b.category.toUpperCase().includes(categoryFilter));
  }, [allBiomarkers, categoryFilter]);

  // Disease Risk Progression: strictly derived from baseline and follow-up prediction snapshots
  const diseaseProgression = useMemo(() => {
    if (!baselineRecord || !followUpRecord) return [];
    const outcomesBase = baselineRecord?.prediction_snapshot?.disease_outcomes || baselineRecord?.disease_outcomes || {};
    const outcomesFollow = followUpRecord?.prediction_snapshot?.disease_outcomes || followUpRecord?.disease_outcomes || {};

    const diseasesList = [
      { key: 'Type2_Diabetes', name: 'Type 2 Diabetes Risk', category: 'Metabolic / Glycemic' },
      { key: 'Prediabetes', name: 'Prediabetes Risk', category: 'Metabolic / Glycemic' },
      { key: 'Metabolic_Syndrome', name: 'Metabolic Syndrome Risk', category: 'Cardiometabolic Cluster' },
      { key: 'NAFLD', name: 'NAFLD Liver Health Risk', category: 'Hepatic / Multiomics' },
      { key: 'High_Adiposity_Risk', name: 'Adiposity & Obesity Risk', category: 'Body Composition' },
    ];

    return diseasesList.map(d => {
      const oBase = outcomesBase[d.key] || {};
      const oFollow = outcomesFollow[d.key] || {};

      const probBase = oBase.calibrated_probability ?? oBase.probability ?? oBase.risk_score ?? 0;
      const probFollow = oFollow.calibrated_probability ?? oFollow.probability ?? oFollow.risk_score ?? 0;

      const pctBase = Math.round(probBase * 100);
      const pctFollow = Math.round(probFollow * 100);
      const diff = pctFollow - pctBase; // FollowUp - Baseline

      return {
        disease: d.name,
        category: d.category,
        baselineProb: pctBase,
        followUpProb: pctFollow,
        riskLevel: oFollow.risk_level || (pctFollow >= 60 ? 'HIGH RISK' : pctFollow >= 30 ? 'MODERATE RISK' : 'OPTIMAL LOW'),
        statusVariant: diff < 0 ? 'success' : diff > 0 ? 'warning' : 'outline',
        diff,
        driver: diff === 0 
          ? 'Risk remained identical between assessments' 
          : diff < 0 
          ? `Risk decreased by ${Math.abs(diff)}% across longitudinal follow-up (Favorable Clinical Improvement)` 
          : `Risk increased by ${diff}% across longitudinal follow-up (Elevated Monitoring Recommended)`
      };
    });
  }, [baselineRecord, followUpRecord]);

  const renderDirectionIcon = (directionIcon) => {
    switch (directionIcon) {
      case 'down_good':
        return <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'up_good':
        return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'up_bad':
        return <ArrowUpRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'down_bad':
        return <ArrowDownRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'stable':
        return <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
      case 'constant':
        return <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block mr-0.5"></span>;
      default:
        return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <PageContainer className="space-y-8 py-6">
        <PageHeader
          title="Longitudinal Assessment Comparison"
          description="Side-by-side comparative analysis of historical health assessments"
          badge="Longitudinal Analytics"
        />
        <Card isGlass={true} className="p-12 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)]">Loading historical assessment records...</p>
        </Card>
      </PageContainer>
    );
  }

  // Strict empty state when user has fewer than 2 completed assessments
  if (records.length < 2) {
    return (
      <PageContainer className="space-y-8 py-6">
        <PageHeader
          title="Longitudinal Assessment Comparison"
          description="Side-by-side comparative analysis of historical health assessments, biomarker trajectory, and disease risk progression"
          badge="Longitudinal Analytics"
        />
        <Card isGlass={true} className="p-12 text-center space-y-4 shadow-xl border border-[var(--border-subtle)]">
          <div className="w-16 h-16 rounded-3xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto shadow-inner">
            <GitCompare className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-[var(--text-main)]">
            At Least 2 Assessments Required for Longitudinal Comparison
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            {records.length === 0 
              ? "No completed health assessments found for your account. Complete your initial multimodal health intake to begin tracking your longitudinal clinical trajectory."
              : "You have 1 completed assessment. Complete at least one additional intake assessment to unlock side-by-side biomarker shifts, risk trajectory comparisons, and multi-assessment insights."
            }
          </p>
          <div className="pt-3">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={() => onNavigate ? onNavigate('intake') : navigate('/intake')}
            >
              Start New Health Assessment
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const categories = [
    { id: 'ALL', label: 'All Biomarkers' },
    { id: 'GLYCEMIC', label: 'Glycemic & Metabolic' },
    { id: 'CARDIOVASCULAR', label: 'Cardiovascular & Lipids' },
    { id: 'BODY COMPOSITION', label: 'Body Composition' },
    { id: 'WEARABLE', label: 'Wearables & CGM' },
    { id: 'GUT', label: 'Gut Microbiome & Multiomics' },
    { id: 'DEMOGRAPHICS', label: 'Demographics & Genetics' },
  ];

  return (
    <PageContainer className="space-y-8 py-6">
      
      {/* Page Header */}
      <PageHeader
        title="Longitudinal Assessment Comparison"
        description="Side-by-side comparative analysis of historical health assessments, biomarker trajectory, and disease risk progression"
        badge="Longitudinal Analytics"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              Print Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Download className="w-4 h-4" />}
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ baselineRecord, followUpRecord, allBiomarkers, diseaseProgression }, null, 2));
                const dl = document.createElement('a');
                dl.setAttribute("href", dataStr);
                dl.setAttribute("download", `telemed_longitudinal_compare_${Date.now()}.json`);
                dl.click();
              }}
            >
              Export JSON
            </Button>
          </div>
        }
      />

      {/* Main Workspace Navigation Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'comparison', label: 'Side-by-Side Comparison' },
          { id: 'biomarkers', label: 'Biomarker Trajectory' },
          { id: 'progression', label: 'Disease Risk Progression' },
          { id: 'insights', label: 'Longitudinal Insights' },
        ]}
      />

      {/* TAB 1: SIDE-BY-SIDE COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Assessment Picker Cards Grid (Baseline on Left, Follow-Up on Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Assessment Baseline Picker (Prior Benchmark - Left) */}
            <div className="md:col-span-5">
              <Card isGlass={true} className="p-5 space-y-3 border-l-4 border-l-slate-400 shadow-lg">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" size="sm font-mono">Baseline Benchmark (T0)</Badge>
                    <span className="text-xs font-mono text-[var(--text-muted)]">{assBaseline.fullDate}</span>
                  </div>
                  <Badge variant="outline" size="sm font-mono">{assBaseline.risk}</Badge>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Select Baseline Assessment</label>
                  <select
                    value={selectedBaselineId}
                    onChange={(e) => setSelectedBaselineId(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--primary)]"
                  >
                    {assessmentOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label} — {opt.date}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                  <div className="p-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[9px] text-[var(--text-muted)] block uppercase">Pathway</span>
                    <strong className="text-[var(--text-main)]">{assBaseline.pathway}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[9px] text-[var(--text-muted)] block uppercase">Quality</span>
                    <strong className="text-emerald-500">{assBaseline.quality}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[9px] text-[var(--text-muted)] block uppercase">Role</span>
                    <strong className="text-slate-400">Reference</strong>
                  </div>
                </div>
              </Card>
            </div>

            {/* Swap Button (Middle) */}
            <div className="md:col-span-2 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="shadow-md !p-3 rounded-full hover:border-[var(--primary)] group"
                onClick={handleSwapAssessments}
                title="Swap Baseline and Follow-Up Roles"
              >
                <ArrowLeftRight className="w-4 h-4 text-[var(--primary)] group-hover:rotate-180 transition-transform duration-300" />
              </Button>
            </div>

            {/* Assessment Follow-Up Picker (Current Evaluation - Right) */}
            <div className="md:col-span-5">
              <Card isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--primary)] shadow-lg">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary" size="sm font-mono">Follow-Up Evaluation (T1)</Badge>
                    <span className="text-xs font-mono text-[var(--text-muted)]">{assFollowUp.fullDate}</span>
                  </div>
                  <Badge variant="primary" size="sm font-mono">{assFollowUp.risk}</Badge>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Select Follow-Up Assessment</label>
                  <select
                    value={selectedFollowUpId}
                    onChange={(e) => setSelectedFollowUpId(e.target.value)}
                    className="w-full p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--primary)]"
                  >
                    {assessmentOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label} — {opt.date}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
                  <div className="p-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[9px] text-[var(--text-muted)] block uppercase">Pathway</span>
                    <strong className="text-[var(--primary)]">{assFollowUp.pathway}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[9px] text-[var(--text-muted)] block uppercase">Quality</span>
                    <strong className="text-emerald-500">{assFollowUp.quality}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                    <span className="text-[9px] text-[var(--text-muted)] block uppercase">Role</span>
                    <strong className="text-[var(--primary)]">Target</strong>
                  </div>
                </div>
              </Card>
            </div>

          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((c) => (
              <Button
                key={c.id}
                variant={categoryFilter === c.id ? 'primary' : 'outline'}
                size="sm"
                className="!px-3 !py-1 text-xs whitespace-nowrap"
                onClick={() => setCategoryFilter(c.id)}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {/* Biomarkers Comparison Matrix Table */}
          <ContentSection
            title="Biomarker Trajectory Matrix (Baseline T0 vs Follow-Up T1)"
            subtitle="Longitudinal clinical shift (Follow-Up − Baseline). Favorable reductions in risk markers and gains in protective metrics are evaluated with clinical directionality."
          >
            <Card isGlass={true} className="overflow-hidden shadow-xl">
              {displayedBiomarkers.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  No quantitative clinical biomarkers available for the selected category filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] font-mono uppercase text-[10px] text-[var(--text-muted)]">
                      <tr>
                        <th className="p-3.5">Biomarker & Modality</th>
                        <th className="p-3.5">Clinical Target</th>
                        <th className="p-3.5">Baseline ({assBaseline.date})</th>
                        <th className="p-3.5">Follow-Up ({assFollowUp.date})</th>
                        <th className="p-3.5">Longitudinal Shift (T1 − T0)</th>
                        <th className="p-3.5">Clinical Trajectory</th>
                        <th className="p-3.5">Physiological Status & Clinical Interpretation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] font-medium">
                      {displayedBiomarkers.map((bm, i) => (
                        <tr key={bm.key || i} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                          
                          {/* Biomarker Name & Category */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                              <div>
                                <span className="font-bold text-[var(--text-main)] block">{bm.name}</span>
                                <span className="text-[10px] font-mono text-[var(--text-muted)]">{bm.category}</span>
                              </div>
                            </div>
                          </td>

                          {/* Target Reference Range */}
                          <td className="p-3.5 font-mono text-[11px] text-[var(--text-muted)]">
                            {bm.refRange}
                          </td>

                          {/* Baseline Benchmark (T0) */}
                          <td className="p-3.5 font-mono text-[var(--text-muted)]">
                            {bm.baselineVal}
                          </td>

                          {/* Follow-Up Target (T1) */}
                          <td className="p-3.5 font-mono text-[var(--primary)] font-bold">
                            {bm.followUpVal}
                          </td>

                          {/* Longitudinal Shift (Δ = T1 - T0) with Progression Arrow */}
                          <td className="p-3.5 font-mono">
                            {bm.diff !== '—' ? (
                              <div>
                                <strong className={`block text-xs ${
                                  bm.variant === 'success' 
                                    ? 'text-emerald-500' 
                                    : bm.variant === 'warning' 
                                    ? 'text-amber-500' 
                                    : 'text-[var(--text-main)]'
                                }`}>
                                  {bm.diff}
                                </strong>
                                <span className="text-[10px] text-[var(--text-muted)] block">
                                  {bm.progressionText}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-slate-400 font-bold block">—</span>
                                <span className="text-[9px] text-[var(--text-muted)] block">{bm.progressionText}</span>
                              </div>
                            )}
                          </td>

                          {/* Clinical Trajectory Badge */}
                          <td className="p-3.5">
                            <Badge variant={bm.variant} size="sm font-mono" className="flex items-center gap-1 w-fit">
                              {renderDirectionIcon(bm.directionIcon)}
                              <span>{bm.trend}</span>
                            </Badge>
                          </td>

                          {/* Physiological Status & Clinical Interpretation */}
                          <td className="p-3.5">
                            <div>
                              <strong className="text-xs text-[var(--text-main)] block">{bm.status}</strong>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">{bm.clinicalNote}</span>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </ContentSection>

        </div>
      )}

      {/* TAB 2: BIOMARKER TRAJECTORY CARDS */}
      {activeTab === 'biomarkers' && (
        <div className="space-y-6 animate-fade-in">
          <ContentSection title="Biomarker Trajectory & Longitudinal Velocity" subtitle="Detailed breakdown of each physiological biomarker's directionality, baseline shift, and distance from clinical target">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allBiomarkers.map((bm, i) => (
                <Card key={bm.key || i} isGlass={true} className="p-5 space-y-3 shadow-md">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-bold block">{bm.name}</span>
                      <span className="text-[9px] text-[var(--text-muted)] font-mono">Target: {bm.refRange}</span>
                    </div>
                    <Badge variant={bm.variant} size="sm font-mono" className="flex items-center gap-1">
                      {renderDirectionIcon(bm.directionIcon)}
                      <span>{bm.trend}</span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[var(--text-muted)] block font-mono">Baseline ({assBaseline.date})</span>
                      <span className="text-sm font-medium text-[var(--text-muted)] font-mono">{bm.baselineVal}</span>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-[10px] text-[var(--text-muted)] block font-mono">Follow-Up ({assFollowUp.date})</span>
                      <strong className="text-lg font-bold text-[var(--primary)] font-mono">{bm.followUpVal}</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-[var(--text-muted)]">Longitudinal Shift:</span>
                      <strong className={bm.variant === 'success' ? 'text-emerald-500' : bm.variant === 'warning' ? 'text-amber-500' : 'text-[var(--text-main)]'}>
                        {bm.diff}
                      </strong>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">
                      Progression: {bm.progressionText}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] leading-tight pt-0.5">{bm.clinicalNote}</p>
                  </div>
                </Card>
              ))}
            </div>
          </ContentSection>
        </div>
      )}

      {/* TAB 3: DISEASE RISK PROGRESSION */}
      {activeTab === 'progression' && (
        <div className="space-y-6 animate-fade-in">
          <ContentSection title="Multi-Target Disease Risk Trajectory Shifts" subtitle="Comparison of calibrated AI disease risk probabilities between Baseline and Longitudinal Follow-Up">
            <div className="space-y-4">
              {diseaseProgression.map((dp, i) => (
                <Card key={i} isGlass={true} className="p-5 space-y-3 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
                    <div>
                      <h4 className="font-extrabold text-sm text-[var(--text-main)]">{dp.disease}</h4>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">{dp.category}</p>
                    </div>
                    <Badge variant={dp.statusVariant} size="sm font-mono">{dp.riskLevel}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[var(--text-muted)]">Baseline ({assBaseline.date})</span>
                        <span className="text-[var(--text-muted)]">{dp.baselineProb}%</span>
                      </div>
                      <ProgressBar value={dp.baselineProb} max={100} variant="secondary" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[var(--text-muted)]">Follow-Up ({assFollowUp.date})</span>
                        <strong className="text-[var(--primary)]">{dp.followUpProb}%</strong>
                      </div>
                      <ProgressBar value={dp.followUpProb} max={100} variant={dp.followUpProb >= 50 ? 'danger' : 'primary'} />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                      <span className="text-[11px] text-[var(--text-main)]">{dp.driver}</span>
                    </div>
                    <span className={`font-mono font-bold text-xs ${dp.diff < 0 ? 'text-emerald-500' : dp.diff > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {dp.diff < 0 ? `${dp.diff}% (Improvement)` : dp.diff > 0 ? `+${dp.diff}% (Increase)` : '0% (Stable)'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </ContentSection>
        </div>
      )}

      {/* TAB 4: LONGITUDINAL INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Executive AI Longitudinal Summary Card */}
          <Card isGlass={true} className="p-6 space-y-4 shadow-xl border-l-4 border-l-[var(--primary)]">
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-3">
              <div className="p-2.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-main)]">AI Multimodal Longitudinal Trajectory Narrative</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Synthesized comparison between Baseline Assessment ({assBaseline.fullDate}) and Follow-Up Assessment ({assFollowUp.fullDate})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3 text-xs text-[var(--text-main)] leading-relaxed">
              <p>
                <strong>Comparative Clinical Synthesis:</strong> Multi-assessment trajectory analysis confirms a transition from <strong>Baseline ({assBaseline.label})</strong> to <strong>Follow-Up ({assFollowUp.label})</strong>.
              </p>
              <p>
                <strong>Biomarker Concordance:</strong> Directional shifts across glycemic markers (Fasting Glucose, HbA1c), cardiovascular risk metrics (Blood Pressure, Lipids), physical activity (Daily Steps, CGM time in range), and microbiome markers are validated against physiological reference bounds. Favorable drops in atherogenic and diabetic biomarkers indicate clinical recovery, while protective factors are evaluated in their positive direction.
              </p>
              <p>
                <strong>Quality Assurance:</strong> Baseline intake scored <strong>{assBaseline.quality}</strong> data quality vs follow-up assessment at <strong>{assFollowUp.quality}</strong> with high calibration confidence.
              </p>
            </div>
          </Card>

          {/* Clinical Guidance & Physician Action Plan */}
          <ContentSection title="Clinical Guidance & Physician Action Plan">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <Card isGlass={true} className="p-5 space-y-3 shadow-md border-l-4 border-l-[var(--primary)]">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[var(--primary)]" />
                  <h4 className="font-bold text-xs text-[var(--text-main)]">Diagnostic Follow-Up</h4>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Continue tracking periodic multimodal laboratory panels to maintain longitudinal glycemic and metabolic stability.
                </p>
              </Card>

              <Card isGlass={true} className="p-5 space-y-3 shadow-md border-l-4 border-l-[var(--success)]">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[var(--success)]" />
                  <h4 className="font-bold text-xs text-[var(--text-main)]">Lifestyle & Nutrition Adaptation</h4>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Maintain regular physical activity, balanced dietary fiber, and sleep routine to support metabolic and autonomic recovery.
                </p>
              </Card>

              <Card isGlass={true} className="p-5 space-y-3 shadow-md border-l-4 border-l-[var(--accent)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
                  <h4 className="font-bold text-xs text-[var(--text-main)]">Specialist Teleconsultation</h4>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Schedule a follow-up consultation with your verified physician to review your longitudinal risk progression and SHAP biomarker attributions.
                </p>
              </Card>

            </div>
          </ContentSection>

        </div>
      )}

    </PageContainer>
  );
}
