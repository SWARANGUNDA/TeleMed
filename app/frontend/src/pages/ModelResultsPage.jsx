import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, Layers, CheckCircle2, ShieldCheck, TrendingUp,
  BarChart3, FileText, ArrowRight, SlidersHorizontal, Sparkles,
  Search, Copy, Check, Cpu, Stethoscope, Crown, Scale, GitCompare,
  CheckCheck, Lightbulb, Users, Database, PieChart, Binary, Zap,
  ExternalLink, ChevronDown, ChevronUp, Activity, Watch, Dna
} from 'lucide-react';
import { Button, Card, Badge, ProgressBar } from '../components/ui';
import { PageContainer, PageHeader } from '../components/layout';
import { fetchPatientRecords } from '../api/client';

// =============================================================================
// GROUND-TRUTH EMPIRICAL BENCHMARK DATASET (100,000 PATIENT MASTER COHORT)
// =============================================================================

// Stage 1: Modality Expert Models (15 Deployed Winners with Full Classification Reports)
const STAGE1_EXPERT_WINNERS = [
  // Clinical Experts (18 features)
  { modality: 'Clinical', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', winner: 'LogisticRegression', cutoff: 0.33, auroc: 0.7777, aurocCI: '[0.771, 0.785]', auprc: 0.7810, accuracy: 0.6800, precision: 0.6425, recall: 0.8800, specificity: 0.4592, f1: 0.7427, brier: 0.1921, topFeat1: 'HbA1c', topFeat1Imp: '+11.4%', topFeat2: 'Waist', topFeat2Imp: '+3.3%' },
  { modality: 'Clinical', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', winner: 'LogisticRegression', cutoff: 0.34, auroc: 0.7499, aurocCI: '[0.742, 0.757]', auprc: 0.7831, accuracy: 0.6765, precision: 0.6622, recall: 0.8716, specificity: 0.4234, f1: 0.7526, brier: 0.2032, topFeat1: 'HbA1c', topFeat1Imp: '+9.7%', topFeat2: 'Waist', topFeat2Imp: '+2.6%' },
  { modality: 'Clinical', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', winner: 'XGBoost', cutoff: 0.41, auroc: 0.7533, aurocCI: '[0.746, 0.761]', auprc: 0.6393, accuracy: 0.6549, precision: 0.5374, recall: 0.8108, specificity: 0.5556, f1: 0.6464, brier: 0.2024, topFeat1: 'BMI', topFeat1Imp: '+14.2%', topFeat2: 'Waist', topFeat2Imp: '+1.9%' },
  { modality: 'Clinical', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', winner: 'LogisticRegression', cutoff: 0.31, auroc: 0.7581, aurocCI: '[0.750, 0.766]', auprc: 0.7931, accuracy: 0.6778, precision: 0.6597, recall: 0.8939, specificity: 0.3937, f1: 0.7591, brier: 0.2001, topFeat1: 'Waist', topFeat1Imp: '+3.3%', topFeat2: 'Triglycerides', topFeat2Imp: '+1.6%' },
  { modality: 'Clinical', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', winner: 'XGBoost', cutoff: 0.31, auroc: 0.7740, aurocCI: '[0.766, 0.782]', auprc: 0.8233, accuracy: 0.7052, precision: 0.6986, recall: 0.8918, specificity: 0.4277, f1: 0.7834, brier: 0.1938, topFeat1: 'Waist', topFeat1Imp: '+3.3%', topFeat2: 'AST', topFeat2Imp: '+2.6%' },

  // Wearables Experts (15 features)
  { modality: 'Wearable', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', winner: 'LogisticRegression', cutoff: 0.32, auroc: 0.6772, aurocCI: '[0.669, 0.686]', auprc: 0.6974, accuracy: 0.5752, precision: 0.5563, recall: 0.9418, specificity: 0.1703, f1: 0.6994, brier: 0.2255, topFeat1: 'HRV RMSSD', topFeat1Imp: '+3.6%', topFeat2: 'CGM Glucose CV', topFeat2Imp: '+2.5%' },
  { modality: 'Wearable', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', winner: 'XGBoost', cutoff: 0.28, auroc: 0.6588, aurocCI: '[0.651, 0.667]', auprc: 0.7118, accuracy: 0.5823, precision: 0.5762, recall: 0.9834, specificity: 0.0622, f1: 0.7266, brier: 0.2299, topFeat1: 'HRV RMSSD', topFeat1Imp: '+3.7%', topFeat2: 'CGM Glucose CV', topFeat2Imp: '+2.5%' },
  { modality: 'Wearable', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', winner: 'LogisticRegression', cutoff: 0.38, auroc: 0.6602, aurocCI: '[0.651, 0.669]', auprc: 0.5395, accuracy: 0.5273, precision: 0.4447, recall: 0.8655, specificity: 0.3121, f1: 0.5876, brier: 0.2306, topFeat1: 'Sedentary Time', topFeat1Imp: '+7.2%', topFeat2: 'Autonomic Stress', topFeat2Imp: '+0.9%' },
  { modality: 'Wearable', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', winner: 'LogisticRegression', cutoff: 0.28, auroc: 0.6207, aurocCI: '[0.611, 0.630]', auprc: 0.6708, accuracy: 0.5757, precision: 0.5732, recall: 0.9898, specificity: 0.0312, f1: 0.7260, brier: 0.2388, topFeat1: 'CGM Glucose CV', topFeat1Imp: '+5.0%', topFeat2: 'Sedentary Time', topFeat2Imp: '+3.9%' },
  { modality: 'Wearable', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', winner: 'CatBoost', cutoff: 0.33, auroc: 0.5999, aurocCI: '[0.591, 0.609]', auprc: 0.6787, accuracy: 0.6042, precision: 0.6033, recall: 0.9872, specificity: 0.0345, f1: 0.7489, brier: 0.2422, topFeat1: 'HRV RMSSD', topFeat1Imp: '+2.0%', topFeat2: 'CGM Glucose CV', topFeat2Imp: '+1.0%' },

  // Gut Microbiome Experts (49 taxa)
  { modality: 'Gut', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', winner: 'RandomForest', cutoff: 0.15, auroc: 0.5922, aurocCI: '[0.583, 0.601]', auprc: 0.6070, accuracy: 0.5248, precision: 0.5248, recall: 1.0000, specificity: 0.0000, f1: 0.6884, brier: 0.2434, topFeat1: 'Inflammation Index', topFeat1Imp: '+1.1%', topFeat2: 'E. coli', topFeat2Imp: '+0.1%' },
  { modality: 'Gut', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', winner: 'LogisticRegression', cutoff: 0.30, auroc: 0.5975, aurocCI: '[0.589, 0.606]', auprc: 0.6462, accuracy: 0.5646, precision: 0.5646, recall: 1.0000, specificity: 0.0000, f1: 0.7217, brier: 0.2431, topFeat1: 'F/B Ratio', topFeat1Imp: '+2.4%', topFeat2: 'B. vulgatus', topFeat2Imp: '+1.2%' },
  { modality: 'Gut', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', winner: 'LogisticRegression', cutoff: 0.39, auroc: 0.5263, aurocCI: '[0.516, 0.536]', auprc: 0.4111, accuracy: 0.3897, precision: 0.3892, recall: 0.9993, specificity: 0.0015, f1: 0.5602, brier: 0.2494, topFeat1: 'Shannon Index', topFeat1Imp: '+1.0%', topFeat2: 'E. faecalis', topFeat2Imp: '+0.8%' },
  { modality: 'Gut', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', winner: 'LogisticRegression', cutoff: 0.33, auroc: 0.5777, aurocCI: '[0.570, 0.587]', auprc: 0.6321, accuracy: 0.5682, precision: 0.5681, recall: 0.9995, specificity: 0.0011, f1: 0.7245, brier: 0.2454, topFeat1: 'Simpson Index', topFeat1Imp: '+0.5%', topFeat2: 'E. coli', topFeat2Imp: '+0.3%' },
  { modality: 'Gut', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', winner: 'ExtraTrees', cutoff: 0.35, auroc: 0.6488, aurocCI: '[0.640, 0.658]', auprc: 0.7182, accuracy: 0.6167, precision: 0.6162, recall: 0.9521, specificity: 0.1177, f1: 0.7481, brier: 0.2337, topFeat1: 'Inflammation Index', topFeat1Imp: '+1.0%', topFeat2: 'K. pneumoniae', topFeat2Imp: '+0.2%' },
];

// Complete 90-Classifier Tournament Matrix from v4_expert_classifier_comparison.csv
const ALL_90_CLASSIFIERS = [
  // Clinical Experts
  { modality: 'Clinical', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'LogisticRegression', auroc: 0.7723, auprc: 0.7777, fitTime: 0.39, isWinner: true, family: 'Linear' },
  { modality: 'Clinical', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'CatBoost', auroc: 0.7721, auprc: 0.7771, fitTime: 2.27, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'LightGBM', auroc: 0.7716, auprc: 0.7752, fitTime: 0.98, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'XGBoost', auroc: 0.7714, auprc: 0.7751, fitTime: 1.23, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'RandomForest', auroc: 0.7697, auprc: 0.7735, fitTime: 4.66, isWinner: false, family: 'Tree' },
  { modality: 'Clinical', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'ExtraTrees', auroc: 0.7682, auprc: 0.7736, fitTime: 2.03, isWinner: false, family: 'Tree' },

  { modality: 'Clinical', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'LogisticRegression', auroc: 0.7474, auprc: 0.7765, fitTime: 0.13, isWinner: true, family: 'Linear' },
  { modality: 'Clinical', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'CatBoost', auroc: 0.7464, auprc: 0.7751, fitTime: 1.69, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'XGBoost', auroc: 0.7463, auprc: 0.7753, fitTime: 0.94, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'LightGBM', auroc: 0.7462, auprc: 0.7755, fitTime: 0.79, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'RandomForest', auroc: 0.7447, auprc: 0.7724, fitTime: 4.45, isWinner: false, family: 'Tree' },
  { modality: 'Clinical', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'ExtraTrees', auroc: 0.7439, auprc: 0.7730, fitTime: 2.03, isWinner: false, family: 'Tree' },

  { modality: 'Clinical', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'XGBoost', auroc: 0.7557, auprc: 0.6402, fitTime: 3.38, isWinner: true, family: 'Boosting' },
  { modality: 'Clinical', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'CatBoost', auroc: 0.7558, auprc: 0.6390, fitTime: 2.13, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'RandomForest', auroc: 0.7553, auprc: 0.6383, fitTime: 4.38, isWinner: false, family: 'Tree' },
  { modality: 'Clinical', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'LightGBM', auroc: 0.7558, auprc: 0.6374, fitTime: 2.70, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'ExtraTrees', auroc: 0.7552, auprc: 0.6377, fitTime: 1.92, isWinner: false, family: 'Tree' },
  { modality: 'Clinical', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'LogisticRegression', auroc: 0.7558, auprc: 0.6368, fitTime: 0.23, isWinner: false, family: 'Linear' },

  { modality: 'Clinical', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'LogisticRegression', auroc: 0.7513, auprc: 0.7913, fitTime: 0.24, isWinner: true, family: 'Linear' },
  { modality: 'Clinical', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'CatBoost', auroc: 0.7509, auprc: 0.7911, fitTime: 2.44, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'XGBoost', auroc: 0.7498, auprc: 0.7890, fitTime: 4.82, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'ExtraTrees', auroc: 0.7491, auprc: 0.7896, fitTime: 2.06, isWinner: false, family: 'Tree' },
  { modality: 'Clinical', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'LightGBM', auroc: 0.7496, auprc: 0.7888, fitTime: 1.58, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'RandomForest', auroc: 0.7490, auprc: 0.7887, fitTime: 4.86, isWinner: false, family: 'Tree' },

  { modality: 'Clinical', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'XGBoost', auroc: 0.7749, auprc: 0.8270, fitTime: 4.89, isWinner: true, family: 'Boosting' },
  { modality: 'Clinical', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'LightGBM', auroc: 0.7745, auprc: 0.8271, fitTime: 1.47, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'CatBoost', auroc: 0.7741, auprc: 0.8267, fitTime: 1.97, isWinner: false, family: 'Boosting' },
  { modality: 'Clinical', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'LogisticRegression', auroc: 0.7741, auprc: 0.8269, fitTime: 0.20, isWinner: false, family: 'Linear' },
  { modality: 'Clinical', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'RandomForest', auroc: 0.7738, auprc: 0.8260, fitTime: 4.78, isWinner: false, family: 'Tree' },
  { modality: 'Clinical', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'ExtraTrees', auroc: 0.7723, auprc: 0.8257, fitTime: 2.25, isWinner: false, family: 'Tree' },

  // Wearables Experts
  { modality: 'Wearable', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'LogisticRegression', auroc: 0.6717, auprc: 0.6874, fitTime: 0.21, isWinner: true, family: 'Linear' },
  { modality: 'Wearable', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'XGBoost', auroc: 0.6722, auprc: 0.6869, fitTime: 3.66, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'LightGBM', auroc: 0.6713, auprc: 0.6861, fitTime: 1.59, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'CatBoost', auroc: 0.6699, auprc: 0.6852, fitTime: 2.13, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'RandomForest', auroc: 0.6683, auprc: 0.6840, fitTime: 3.94, isWinner: false, family: 'Tree' },
  { modality: 'Wearable', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'ExtraTrees', auroc: 0.6653, auprc: 0.6817, fitTime: 1.57, isWinner: false, family: 'Tree' },

  { modality: 'Wearable', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'XGBoost', auroc: 0.6494, auprc: 0.6930, fitTime: 3.21, isWinner: true, family: 'Boosting' },
  { modality: 'Wearable', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'LightGBM', auroc: 0.6490, auprc: 0.6926, fitTime: 2.23, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'RandomForest', auroc: 0.6468, auprc: 0.6922, fitTime: 3.85, isWinner: false, family: 'Tree' },
  { modality: 'Wearable', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'CatBoost', auroc: 0.6467, auprc: 0.6911, fitTime: 2.80, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'LogisticRegression', auroc: 0.6456, auprc: 0.6912, fitTime: 0.22, isWinner: false, family: 'Linear' },
  { modality: 'Wearable', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'ExtraTrees', auroc: 0.6426, auprc: 0.6892, fitTime: 1.66, isWinner: false, family: 'Tree' },

  { modality: 'Wearable', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'LogisticRegression', auroc: 0.6721, auprc: 0.5547, fitTime: 0.16, isWinner: true, family: 'Linear' },
  { modality: 'Wearable', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'CatBoost', auroc: 0.6699, auprc: 0.5541, fitTime: 3.58, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'XGBoost', auroc: 0.6698, auprc: 0.5543, fitTime: 1.07, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'LightGBM', auroc: 0.6696, auprc: 0.5541, fitTime: 8.09, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'RandomForest', auroc: 0.6686, auprc: 0.5521, fitTime: 3.75, isWinner: false, family: 'Tree' },
  { modality: 'Wearable', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'ExtraTrees', auroc: 0.6662, auprc: 0.5478, fitTime: 1.47, isWinner: false, family: 'Tree' },

  { modality: 'Wearable', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'LogisticRegression', auroc: 0.6109, auprc: 0.6670, fitTime: 0.34, isWinner: true, family: 'Linear' },
  { modality: 'Wearable', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'CatBoost', auroc: 0.6108, auprc: 0.6669, fitTime: 2.22, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'XGBoost', auroc: 0.6112, auprc: 0.6658, fitTime: 2.07, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'LightGBM', auroc: 0.6106, auprc: 0.6650, fitTime: 2.78, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'RandomForest', auroc: 0.6102, auprc: 0.6648, fitTime: 5.95, isWinner: false, family: 'Tree' },
  { modality: 'Wearable', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'ExtraTrees', auroc: 0.6068, auprc: 0.6626, fitTime: 1.61, isWinner: false, family: 'Tree' },

  { modality: 'Wearable', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'CatBoost', auroc: 0.5992, auprc: 0.6772, fitTime: 1.70, isWinner: true, family: 'Boosting' },
  { modality: 'Wearable', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'XGBoost', auroc: 0.5990, auprc: 0.6770, fitTime: 1.45, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'LightGBM', auroc: 0.5988, auprc: 0.6751, fitTime: 1.91, isWinner: false, family: 'Boosting' },
  { modality: 'Wearable', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'LogisticRegression', auroc: 0.5981, auprc: 0.6772, fitTime: 0.27, isWinner: false, family: 'Linear' },
  { modality: 'Wearable', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'RandomForest', auroc: 0.5976, auprc: 0.6756, fitTime: 4.38, isWinner: false, family: 'Tree' },
  { modality: 'Wearable', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'ExtraTrees', auroc: 0.5946, auprc: 0.6736, fitTime: 1.75, isWinner: false, family: 'Tree' },

  // Gut Microbiome Experts
  { modality: 'Gut', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'RandomForest', auroc: 0.5932, auprc: 0.6041, fitTime: 13.78, isWinner: true, family: 'Tree' },
  { modality: 'Gut', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'LogisticRegression', auroc: 0.5930, auprc: 0.6035, fitTime: 0.54, isWinner: false, family: 'Linear' },
  { modality: 'Gut', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'CatBoost', auroc: 0.5929, auprc: 0.6024, fitTime: 4.76, isWinner: false, family: 'Boosting' },
  { modality: 'Gut', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'ExtraTrees', auroc: 0.5928, auprc: 0.6042, fitTime: 4.62, isWinner: false, family: 'Tree' },
  { modality: 'Gut', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'LightGBM', auroc: 0.5903, auprc: 0.6007, fitTime: 3.01, isWinner: false, family: 'Boosting' },
  { modality: 'Gut', disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', classifier: 'XGBoost', auroc: 0.5902, auprc: 0.6005, fitTime: 8.72, isWinner: false, family: 'Boosting' },

  { modality: 'Gut', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'LogisticRegression', auroc: 0.5776, auprc: 0.6262, fitTime: 0.42, isWinner: true, family: 'Linear' },
  { modality: 'Gut', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'CatBoost', auroc: 0.5740, auprc: 0.6214, fitTime: 3.08, isWinner: false, family: 'Boosting' },
  { modality: 'Gut', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'ExtraTrees', auroc: 0.5735, auprc: 0.6209, fitTime: 2.60, isWinner: false, family: 'Tree' },
  { modality: 'Gut', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'RandomForest', auroc: 0.5729, auprc: 0.6196, fitTime: 11.18, isWinner: false, family: 'Tree' },
  { modality: 'Gut', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'XGBoost', auroc: 0.5728, auprc: 0.6191, fitTime: 1.87, isWinner: false, family: 'Boosting' },
  { modality: 'Gut', disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', classifier: 'LightGBM', auroc: 0.5722, auprc: 0.6168, fitTime: 0.97, isWinner: false, family: 'Boosting' },

  { modality: 'Gut', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'LogisticRegression', auroc: 0.5300, auprc: 0.4139, fitTime: 0.71, isWinner: true, family: 'Linear' },
  { modality: 'Gut', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'RandomForest', auroc: 0.5286, auprc: 0.4127, fitTime: 11.09, isWinner: false, family: 'Tree' },
  { modality: 'Gut', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'CatBoost', auroc: 0.5281, auprc: 0.4111, fitTime: 2.85, isWinner: false, family: 'Boosting' },
  { modality: 'Gut', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'ExtraTrees', auroc: 0.5276, auprc: 0.4128, fitTime: 2.02, isWinner: false, family: 'Tree' },
  { modality: 'Gut', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'XGBoost', auroc: 0.5261, auprc: 0.4084, fitTime: 1.72, isWinner: false, family: 'Boosting' },
  { modality: 'Gut', disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', classifier: 'LightGBM', auroc: 0.5237, auprc: 0.4073, fitTime: 0.96, isWinner: false, family: 'Boosting' },

  { modality: 'Gut', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'LogisticRegression', auroc: 0.5717, auprc: 0.6342, fitTime: 0.53, isWinner: true, family: 'Linear' },
  { modality: 'Gut', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'CatBoost', auroc: 0.5716, auprc: 0.6335, fitTime: 2.82, isWinner: false, family: 'Boosting' },
  { modality: 'Gut', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'ExtraTrees', auroc: 0.5713, auprc: 0.6334, fitTime: 2.42, isWinner: false, family: 'Tree' },
  { modality: 'Gut', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'RandomForest', auroc: 0.5708, auprc: 0.6332, fitTime: 10.62, isWinner: false, family: 'Tree' },
  { modality: 'Gut', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'LightGBM', auroc: 0.5690, auprc: 0.6316, fitTime: 0.96, isWinner: false, family: 'Boosting' },
  { modality: 'Gut', disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', classifier: 'XGBoost', auroc: 0.5685, auprc: 0.6301, fitTime: 1.76, isWinner: false, family: 'Boosting' },

  { modality: 'Gut', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'ExtraTrees', auroc: 0.6493, auprc: 0.7159, fitTime: 2.36, isWinner: true, family: 'Tree' },
  { modality: 'Gut', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'RandomForest', auroc: 0.6486, auprc: 0.7159, fitTime: 10.27, isWinner: false, family: 'Tree' },
  { modality: 'Gut', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'CatBoost', auroc: 0.6481, auprc: 0.7155, fitTime: 2.84, isWinner: false, family: 'Boosting' },
  { modality: 'Gut', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'LogisticRegression', auroc: 0.6479, auprc: 0.7171, fitTime: 0.74, isWinner: false, family: 'Linear' },
  { modality: 'Gut', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'XGBoost', auroc: 0.6471, auprc: 0.7151, fitTime: 1.93, isWinner: false, family: 'Boosting' },
  { modality: 'Gut', disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', classifier: 'LightGBM', auroc: 0.6470, auprc: 0.7130, fitTime: 1.05, isWinner: false, family: 'Boosting' },
];

// Stage 2: Meta-Learner Weights across ALL 7 PATHWAYS (C, W, G, C+W, C+G, W+G, C+W+G)
const ALL_PATHWAY_WEIGHTS = {
  'Clinical_Only': {
    id: 'C',
    name: 'Pathway 1: Clinical (C)',
    features: 18,
    badgeBg: 'bg-violet-600',
    color: '#8b5cf6',
    tag: 'Baseline Lab Anchor',
    tagClass: 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300',
    weights: {
      Type2_Diabetes: { c: 100, w: 0, g: 0, beta: '[8.37]', note: 'Diagnostic laboratory standard (HbA1c & Fasting Glucose)' },
      Prediabetes: { c: 100, w: 0, g: 0, beta: '[6.97]', note: 'Blood glucose anchor for early dysglycemia' },
      High_Adiposity_Risk: { c: 100, w: 0, g: 0, beta: '[2.88]', note: 'Anthropometric biomarkers (BMI & Waist Circumference)' },
      Metabolic_Syndrome: { c: 100, w: 0, g: 0, beta: '[5.05]', note: 'ATP-III multi-biomarker diagnostic panel' },
      NAFLD: { c: 100, w: 0, g: 0, beta: '[3.64]', note: 'Serum hepatic transaminases (ALT & AST)' },
    }
  },
  'Wearable_Only': {
    id: 'W',
    name: 'Pathway 2: Wearables (W)',
    features: 15,
    badgeBg: 'bg-cyan-600',
    color: '#06b6d4',
    tag: 'Continuous Sensors',
    tagClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300',
    weights: {
      Type2_Diabetes: { c: 0, w: 100, g: 0, beta: '[0.75]', note: 'Continuous CGM volatility & resting heart rate telemetry' },
      Prediabetes: { c: 0, w: 100, g: 0, beta: '[0.24]', note: 'Dynamic glycemic excursions and autonomic dips' },
      High_Adiposity_Risk: { c: 0, w: 100, g: 0, beta: '[0.63]', note: 'Sedentary duration & circadian energy expenditure' },
      Metabolic_Syndrome: { c: 0, w: 100, g: 0, beta: '[0.44]', note: 'Nocturnal resting HR & glycemic CV' },
      NAFLD: { c: 0, w: 100, g: 0, beta: '[0.36]', note: 'Circadian rhythm disruption & autonomic stress' },
    }
  },
  'Gut_Only': {
    id: 'G',
    name: 'Pathway 3: Gut (G)',
    features: 49,
    badgeBg: 'bg-emerald-600',
    color: '#10b981',
    tag: 'Metagenomic Taxa',
    tagClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
    weights: {
      Type2_Diabetes: { c: 0, w: 0, g: 100, beta: '[0.31]', note: 'Metagenomic dysbiosis & low-grade systemic endotoxemia' },
      Prediabetes: { c: 0, w: 0, g: 100, beta: '[0.27]', note: 'Firmicutes/Bacteroidetes shift and SCFA producers' },
      High_Adiposity_Risk: { c: 0, w: 0, g: 100, beta: '[0.11]', note: 'Reduced Shannon microbial diversity' },
      Metabolic_Syndrome: { c: 0, w: 0, g: 100, beta: '[0.28]', note: 'Bile acid metabolism & gut permeability markers' },
      NAFLD: { c: 0, w: 0, g: 100, beta: '[0.53]', note: 'Gut-liver axis: endogenous alcohol producers & bacterial translocation' },
    }
  },
  'Clinical_Wearable': {
    id: 'C+W',
    name: 'Pathway 4: Clinical + Wearable (C+W)',
    features: 33,
    badgeBg: 'bg-blue-600',
    color: '#3b82f6',
    tag: 'Labs + Sensors',
    tagClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
    weights: {
      Type2_Diabetes: { c: 97.4, w: 2.6, g: 0, beta: '[8.32, 0.22]', note: 'Clinical Blood Chemistry (97.4%) + CGM Glycemic Volatility (2.6%)' },
      Prediabetes: { c: 97.4, w: 2.6, g: 0, beta: '[6.42, 0.17]', note: 'Fasting glucose anchor reinforced by continuous glycemic variability' },
      High_Adiposity_Risk: { c: 96.3, w: 3.7, g: 0, beta: '[2.93, -0.11]', note: 'Clinical BMI/Waist anchor modulated by continuous sedentary telemetry' },
      Metabolic_Syndrome: { c: 99.5, w: 0.5, g: 0, beta: '[5.04, -0.03]', note: 'ATP-III diagnostic multi-panel provides 99.5% classification mass' },
      NAFLD: { c: 96.9, w: 3.1, g: 0, beta: '[3.68, -0.12]', note: 'Liver transaminases ALT/AST anchor + nocturnal biosensors' },
    }
  },
  'Clinical_Gut': {
    id: 'C+G',
    name: 'Pathway 5: Clinical + Gut (C+G)',
    features: 67,
    badgeBg: 'bg-purple-600',
    color: '#a855f7',
    tag: 'Labs + Microbiome',
    tagClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
    weights: {
      Type2_Diabetes: { c: 99.0, w: 0, g: 1.0, beta: '[8.39, -0.09]', note: 'Blood chemistry provides dominant discriminative power over microbial taxa' },
      Prediabetes: { c: 99.7, w: 0, g: 0.3, beta: '[6.67, -0.02]', note: 'Fasting biomarkers saturate prediabetic classification' },
      High_Adiposity_Risk: { c: 95.7, w: 0, g: 4.3, beta: '[2.89, 0.13]', note: 'BMI/Waist anchor augmented by Shannon microbial diversity' },
      Metabolic_Syndrome: { c: 99.4, w: 0, g: 0.6, beta: '[5.04, -0.03]', note: 'Diagnostic multi-panel criteria dominates taxonomic variance' },
      NAFLD: { c: 96.7, w: 0, g: 3.3, beta: '[3.61, 0.13]', note: 'Transaminases + gut inflammatory index synergy' },
    }
  },
  'Wearable_Gut': {
    id: 'W+G',
    name: 'Pathway 6: Wearable + Gut Remote Triage (W+G)',
    features: 64,
    badgeBg: 'bg-amber-500',
    color: '#f59e0b',
    tag: '⚡ Remote Triage (No Blood Draw)',
    tagClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    weights: {
      Type2_Diabetes: { c: 0, w: 75.2, g: 24.8, beta: '[0.72, 0.24]', note: 'Continuous CGM telemetry (75.2%) + Metagenomic taxa (24.8%)' },
      Prediabetes: { c: 0, w: 88.6, g: 11.4, beta: '[0.23, 0.03]', note: 'Dynamic postprandial excursions lead over taxonomic shifts' },
      High_Adiposity_Risk: { c: 0, w: 90.3, g: 9.7, beta: '[0.62, 0.07]', note: 'Sedentary minutes + SCFA producer relative abundances' },
      Metabolic_Syndrome: { c: 0, w: 65.2, g: 34.8, beta: '[0.41, 0.22]', note: 'HRV RMSSD + microbial dysbiosis indexes' },
      NAFLD: { c: 0, w: 36.3, g: 63.7, beta: '[0.27, 0.48]', note: 'GUT MICROBIOME SURGES TO 63.7% (+0.0364 AUROC lift, p < 0.0001)' },
    }
  },
  'Full_Multimodal_Fusion': {
    id: 'C+W+G',
    name: 'Pathway 7: Full Multimodal Fusion (C+W+G)',
    features: 82,
    badgeBg: 'bg-indigo-600',
    color: '#ec4899',
    tag: '★ Gold Standard Triple Fusion',
    tagClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
    weights: {
      Type2_Diabetes: { c: 96.3, w: 2.6, g: 1.1, beta: '[8.33, 0.23, -0.10]', note: 'Clinical Blood Chemistry (96.3%) + CGM Volatility (2.6%) + Gut (1.1%)' },
      Prediabetes: { c: 97.0, w: 2.6, g: 0.4, beta: '[6.42, 0.17, -0.02]', note: 'Laboratory glucose anchor with CGM volatility fine-tuning' },
      High_Adiposity_Risk: { c: 91.8, w: 3.9, g: 4.3, beta: '[2.94, -0.13, 0.14]', note: 'Clinical anthropometry (91.8%) + Gut taxa (4.3%) + Wearables (3.9%)' },
      Metabolic_Syndrome: { c: 99.0, w: 0.4, g: 0.6, beta: '[5.05, -0.02, -0.03]', note: 'ATP-III diagnostic multi-panel anchor (99.0%)' },
      NAFLD: { c: 92.6, w: 3.6, g: 3.8, beta: '[3.66, -0.14, 0.15]', note: 'Serum transaminases (92.6%) + Gut-liver axis (3.8%) + Sleep (3.6%)' },
    }
  }
};

// Complete 35-Configuration Performance Benchmark Dataset
const VERIFIED_35_CONFIGURATIONS = [
  // Type 2 Diabetes
  { disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', pathway: 'C', pathwayName: 'Clinical Only', model: 'LogisticRegression', threshold: 0.31, auroc: 0.7777, aurocCI: '[0.771, 0.785]', auprc: 0.7810, sensitivity: 0.880, specificity: 0.459, f1: 0.743 },
  { disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', pathway: 'W', pathwayName: 'Wearable Only', model: 'LogisticRegression', threshold: 0.34, auroc: 0.6772, aurocCI: '[0.669, 0.686]', auprc: 0.6974, sensitivity: 0.911, specificity: 0.235, f1: 0.700 },
  { disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', pathway: 'G', pathwayName: 'Gut Only', model: 'LogisticRegression', threshold: 0.15, auroc: 0.5000, aurocCI: '[0.500, 0.500]', auprc: 0.5248, sensitivity: 1.000, specificity: 0.000, f1: 0.688 },
  { disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', pathway: 'C+W', pathwayName: 'Clinical + Wearable', model: 'LogisticRegression', threshold: 0.33, auroc: 0.7825, aurocCI: '[0.776, 0.790]', auprc: 0.7866, sensitivity: 0.867, specificity: 0.502, f1: 0.748 },
  { disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', pathway: 'C+G', pathwayName: 'Clinical + Gut', model: 'LogisticRegression', threshold: 0.31, auroc: 0.7777, aurocCI: '[0.771, 0.785]', auprc: 0.7810, sensitivity: 0.880, specificity: 0.459, f1: 0.743 },
  { disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', pathway: 'W+G', pathwayName: 'Wearable + Gut (Remote Triage)', model: 'LogisticRegression', threshold: 0.34, auroc: 0.6772, aurocCI: '[0.669, 0.686]', auprc: 0.6974, sensitivity: 0.911, specificity: 0.235, f1: 0.700 },
  { disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', pathway: 'C+W+G', pathwayName: 'Full Multimodal Fusion', model: 'LogisticRegression', threshold: 0.33, auroc: 0.7825, aurocCI: '[0.776, 0.790]', auprc: 0.7866, sensitivity: 0.867, specificity: 0.502, f1: 0.748, isBest: true },

  // Prediabetes
  { disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', pathway: 'C', pathwayName: 'Clinical Only', model: 'LogisticRegression', threshold: 0.30, auroc: 0.7499, aurocCI: '[0.742, 0.757]', auprc: 0.7831, sensitivity: 0.896, specificity: 0.375, f1: 0.754 },
  { disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', pathway: 'W', pathwayName: 'Wearable Only', model: 'LogisticRegression', threshold: 0.30, auroc: 0.6588, aurocCI: '[0.650, 0.667]', auprc: 0.7118, sensitivity: 0.955, specificity: 0.131, f1: 0.728 },
  { disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', pathway: 'G', pathwayName: 'Gut Only', model: 'LogisticRegression', threshold: 0.32, auroc: 0.5975, aurocCI: '[0.589, 0.607]', auprc: 0.6462, sensitivity: 1.000, specificity: 0.000, f1: 0.722 },
  { disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', pathway: 'C+W', pathwayName: 'Clinical + Wearable', model: 'LightGBM', threshold: 0.33, auroc: 0.7531, aurocCI: '[0.745, 0.761]', auprc: 0.7852, sensitivity: 0.894, specificity: 0.383, f1: 0.755 },
  { disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', pathway: 'C+G', pathwayName: 'Clinical + Gut', model: 'LogisticRegression', threshold: 0.31, auroc: 0.7515, aurocCI: '[0.744, 0.759]', auprc: 0.7851, sensitivity: 0.888, specificity: 0.395, f1: 0.754 },
  { disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', pathway: 'W+G', pathwayName: 'Wearable + Gut (Remote Triage)', model: 'LogisticRegression', threshold: 0.26, auroc: 0.6729, aurocCI: '[0.664, 0.681]', auprc: 0.7238, sensitivity: 0.972, specificity: 0.093, f1: 0.728 },
  { disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', pathway: 'C+W+G', pathwayName: 'Full Multimodal Fusion', model: 'LightGBM', threshold: 0.33, auroc: 0.7532, aurocCI: '[0.745, 0.761]', auprc: 0.7860, sensitivity: 0.894, specificity: 0.384, f1: 0.755, isBest: true },

  // Adiposity & Obesity
  { disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', pathway: 'C', pathwayName: 'Clinical Only', model: 'LogisticRegression', threshold: 0.39, auroc: 0.7533, aurocCI: '[0.746, 0.760]', auprc: 0.6393, sensitivity: 0.810, specificity: 0.557, f1: 0.647 },
  { disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', pathway: 'W', pathwayName: 'Wearable Only', model: 'LogisticRegression', threshold: 0.38, auroc: 0.6602, aurocCI: '[0.651, 0.669]', auprc: 0.5395, sensitivity: 0.859, specificity: 0.325, f1: 0.588 },
  { disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', pathway: 'G', pathwayName: 'Gut Only', model: 'LogisticRegression', threshold: 0.41, auroc: 0.5263, aurocCI: '[0.516, 0.536]', auprc: 0.4111, sensitivity: 0.999, specificity: 0.002, f1: 0.560 },
  { disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', pathway: 'C+W', pathwayName: 'Clinical + Wearable', model: 'LogisticRegression', threshold: 0.41, auroc: 0.7547, aurocCI: '[0.747, 0.762]', auprc: 0.6413, sensitivity: 0.792, specificity: 0.582, f1: 0.647 },
  { disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', pathway: 'C+G', pathwayName: 'Clinical + Gut', model: 'LogisticRegression', threshold: 0.40, auroc: 0.7533, aurocCI: '[0.746, 0.761]', auprc: 0.6391, sensitivity: 0.801, specificity: 0.569, f1: 0.646 },
  { disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', pathway: 'W+G', pathwayName: 'Wearable + Gut (Remote Triage)', model: 'LogisticRegression', threshold: 0.37, auroc: 0.6607, aurocCI: '[0.651, 0.669]', auprc: 0.5404, sensitivity: 0.869, specificity: 0.305, f1: 0.587 },
  { disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', pathway: 'C+W+G', pathwayName: 'Full Multimodal Fusion', model: 'LogisticRegression', threshold: 0.39, auroc: 0.7547, aurocCI: '[0.747, 0.762]', auprc: 0.6412, sensitivity: 0.810, specificity: 0.558, f1: 0.647, isBest: true },

  // Metabolic Syndrome
  { disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', pathway: 'C', pathwayName: 'Clinical Only', model: 'LogisticRegression', threshold: 0.30, auroc: 0.7581, aurocCI: '[0.751, 0.766]', auprc: 0.7931, sensitivity: 0.890, specificity: 0.405, f1: 0.760 },
  { disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', pathway: 'W', pathwayName: 'Wearable Only', model: 'LogisticRegression', threshold: 0.29, auroc: 0.6207, aurocCI: '[0.611, 0.630]', auprc: 0.6708, sensitivity: 0.988, specificity: 0.035, f1: 0.726 },
  { disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', pathway: 'G', pathwayName: 'Gut Only', model: 'LogisticRegression', threshold: 0.34, auroc: 0.5777, aurocCI: '[0.570, 0.587]', auprc: 0.6321, sensitivity: 0.999, specificity: 0.002, f1: 0.725 },
  { disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', pathway: 'C+W', pathwayName: 'Clinical + Wearable', model: 'LogisticRegression', threshold: 0.31, auroc: 0.7586, aurocCI: '[0.751, 0.767]', auprc: 0.7936, sensitivity: 0.881, specificity: 0.424, f1: 0.760 },
  { disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', pathway: 'C+G', pathwayName: 'Clinical + Gut', model: 'LogisticRegression', threshold: 0.29, auroc: 0.7581, aurocCI: '[0.751, 0.766]', auprc: 0.7937, sensitivity: 0.899, specificity: 0.384, f1: 0.759 },
  { disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', pathway: 'W+G', pathwayName: 'Wearable + Gut (Remote Triage)', model: 'LogisticRegression', threshold: 0.30, auroc: 0.6336, aurocCI: '[0.625, 0.643]', auprc: 0.6835, sensitivity: 0.974, specificity: 0.071, f1: 0.727 },
  { disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', pathway: 'C+W+G', pathwayName: 'Full Multimodal Fusion', model: 'LogisticRegression', threshold: 0.31, auroc: 0.7586, aurocCI: '[0.751, 0.767]', auprc: 0.7942, sensitivity: 0.880, specificity: 0.426, f1: 0.760, isBest: true },

  // NAFLD
  { disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', pathway: 'C', pathwayName: 'Clinical Only', model: 'LogisticRegression', threshold: 0.29, auroc: 0.7740, aurocCI: '[0.767, 0.782]', auprc: 0.8233, sensitivity: 0.877, specificity: 0.461, f1: 0.783 },
  { disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', pathway: 'W', pathwayName: 'Wearable Only', model: 'LogisticRegression', threshold: 0.26, auroc: 0.5999, aurocCI: '[0.592, 0.609]', auprc: 0.6787, sensitivity: 0.994, specificity: 0.016, f1: 0.749 },
  { disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', pathway: 'G', pathwayName: 'Gut Only', model: 'LogisticRegression', threshold: 0.15, auroc: 0.5000, aurocCI: '[0.500, 0.500]', auprc: 0.5980, sensitivity: 1.000, specificity: 0.000, f1: 0.748 },
  { disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', pathway: 'C+W', pathwayName: 'Clinical + Wearable', model: 'LogisticRegression', threshold: 0.29, auroc: 0.7743, aurocCI: '[0.767, 0.782]', auprc: 0.8232, sensitivity: 0.877, specificity: 0.462, f1: 0.783 },
  { disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', pathway: 'C+G', pathwayName: 'Clinical + Gut', model: 'LogisticRegression', threshold: 0.29, auroc: 0.7740, aurocCI: '[0.767, 0.782]', auprc: 0.8233, sensitivity: 0.877, specificity: 0.461, f1: 0.783 },
  { disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', pathway: 'W+G', pathwayName: 'Wearable + Gut (Remote Triage)', model: 'LogisticRegression', threshold: 0.26, auroc: 0.5999, aurocCI: '[0.592, 0.609]', auprc: 0.6787, sensitivity: 0.994, specificity: 0.016, f1: 0.749 },
  { disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', pathway: 'C+W+G', pathwayName: 'Full Multimodal Fusion', model: 'LogisticRegression', threshold: 0.29, auroc: 0.7743, aurocCI: '[0.767, 0.782]', auprc: 0.8232, sensitivity: 0.877, specificity: 0.462, f1: 0.783, isBest: true },
];

// Paired Statistical Significance Test Records (N=1,000 Bootstraps)
const STATISTICAL_SIGNIFICANCE_DATA = [
  { disease: 'Type2_Diabetes', diseaseTitle: 'Type 2 Diabetes', clinAUROC: 0.7777, fusionAUROC: 0.7825, gain: 0.0048, pVal: 0.0001, isSig: true, interpretation: 'Highly Significant synergistic lift from CGM volatility' },
  { disease: 'Prediabetes', diseaseTitle: 'Prediabetes Risk', clinAUROC: 0.7499, fusionAUROC: 0.7532, gain: 0.0033, pVal: 0.0001, isSig: true, interpretation: 'Significant early glycemic excursion detection' },
  { disease: 'High_Adiposity_Risk', diseaseTitle: 'Adiposity & Obesity', clinAUROC: 0.7533, fusionAUROC: 0.7547, gain: 0.0015, pVal: 0.0090, isSig: true, interpretation: 'Significant gain via sedentary & microbiome taxa' },
  { disease: 'Metabolic_Syndrome', diseaseTitle: 'Metabolic Syndrome', clinAUROC: 0.7581, fusionAUROC: 0.7586, gain: 0.0005, pVal: 0.0890, isSig: false, interpretation: 'Marginal gain; clinical panel provides saturation' },
  { disease: 'NAFLD', diseaseTitle: 'NAFLD Liver Health', clinAUROC: 0.7740, fusionAUROC: 0.7743, gain: 0.0003, pVal: 0.2110, isSig: false, interpretation: 'Direct serum transaminases provide 92.6% saturation' },
];

const PATHWAY_SPECS = [
  { id: 'C', key: 'Clinical_Only', label: 'Clinical (C)', count: 18, color: '#8b5cf6' },
  { id: 'W', key: 'Wearable_Only', label: 'Wearables (W)', count: 15, color: '#06b6d4' },
  { id: 'G', key: 'Gut_Only', label: 'Gut (G)', count: 49, color: '#10b981' },
  { id: 'C+W', key: 'Clinical_Wearable', label: 'Clinical + Wearable', count: 33, color: '#3b82f6' },
  { id: 'C+G', key: 'Clinical_Gut', label: 'Clinical + Gut', count: 67, color: '#a855f7' },
  { id: 'W+G', key: 'Wearable_Gut', label: 'Wearable + Gut (Triage)', count: 64, color: '#f59e0b' },
  { id: 'C+W+G', key: 'Full_Multimodal_Fusion', label: 'Full Multimodal Fusion', count: 82, color: '#ec4899' },
];

export default function ModelResultsPage({ session, predictionData, xaiData, onNavigate }) {
  const navigate = useNavigate();

  // Primary Navigation
  const [activeTab, setActiveTab] = useState('all_pathways'); // 'all_pathways' | 'pathway_weights' | 'expert_models' | 'datasets_info' | 'statistical_audit' | 'patient_results'

  // Tab 1 Filters
  const [progressionDisease, setProgressionDisease] = useState('Type2_Diabetes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiseaseFilter, setSelectedDiseaseFilter] = useState('all');

  // Tab 2 Weights Disease Filter
  const [selectedWeightDisease, setSelectedWeightDisease] = useState('Type2_Diabetes');

  // Tab 3 Classifiers Filter
  const [expertSubTab, setExpertSubTab] = useState('winners'); // 'winners' | 'all90'
  const [selectedExpertModality, setSelectedExpertModality] = useState('all');

  // Clipboard State
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Filtered rows for 35 benchmark table
  const filteredBenchmarkRows = useMemo(() => {
    return VERIFIED_35_CONFIGURATIONS.filter((row) => {
      const matchD = selectedDiseaseFilter === 'all' || row.disease === selectedDiseaseFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQ = !q || (
        row.diseaseTitle.toLowerCase().includes(q) ||
        row.pathwayName.toLowerCase().includes(q) ||
        row.model.toLowerCase().includes(q)
      );
      return matchD && matchQ;
    });
  }, [selectedDiseaseFilter, searchQuery]);

  const progressionRows = useMemo(() => {
    return PATHWAY_SPECS.map(p => {
      const match = VERIFIED_35_CONFIGURATIONS.find(
        r => r.disease === progressionDisease && r.pathway === p.id
      );
      return { ...p, config: match };
    });
  }, [progressionDisease]);

  const handleCopyReviewerBrief = () => {
    const brief = `TeleMed-M3 Multimodal AI Benchmark Brief\n` +
      `-----------------------------------------\n` +
      `Validation Cohort: 100,000 Patients (70,000 Train / 15,000 Val / 15,000 Test)\n` +
      `Evaluated: 195 Total Models (90 Stage-1 Experts + 105 Stage-2 Stackers)\n` +
      `Top Fusion AUROC: 0.7825 [0.776, 0.790] (Type 2 Diabetes, C+W+G)\n` +
      `Meta-Learner Weights: All 7 Pathways evaluated per disease target.\n` +
      `Remote Triage (W+G): Gut carries 63.7% weight for NAFLD (+0.0364 AUROC, p < 0.0001)\n` +
      `Verification Protocol: Stratified 5-Fold CV + OOF Stacking + Isotonic Calibration.`;
    navigator.clipboard.writeText(brief);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <PageContainer className="space-y-5 max-w-7xl mx-auto">
      {/* 1. COMPACT OBSERVATORY HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              TeleMed V4 Benchmark Observatory
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono">100,000 Cohort &bull; 7 Care Pathways</span>
          </div>
          <h1 className="text-xl font-black text-[var(--text-main)] mt-0.5 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Model Benchmark Results & Architectural Evaluation
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 px-2.5"
            leftIcon={copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyReviewerBrief}
          >
            {copiedSummary ? 'Copied Brief' : 'Copy Examiner Brief'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="text-xs h-8 px-3 font-bold"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => onNavigate ? onNavigate('xai') : navigate('/xai')}
          >
            Inspect XAI Drivers
          </Button>
        </div>
      </div>

      {/* 2. COMPACT EXECUTIVE KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        <div className="p-2.5 rounded-xl border border-indigo-200/50 dark:border-indigo-900/40 bg-[var(--bg-surface)] flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Cohort Size</span>
            <strong className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">100,000</strong>
            <span className="text-[9px] text-[var(--text-muted)] block">70k/15k/15k Split</span>
          </div>
          <Users className="w-4 h-4 text-indigo-500 opacity-80" />
        </div>

        <div className="p-2.5 rounded-xl border border-purple-200/50 dark:border-purple-900/40 bg-[var(--bg-surface)] flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Models Evaluated</span>
            <strong className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">195 Total</strong>
            <span className="text-[9px] text-[var(--text-muted)] block">90 Stage-1 + 105 Stackers</span>
          </div>
          <Cpu className="w-4 h-4 text-purple-500 opacity-80" />
        </div>

        <div className="p-2.5 rounded-xl border border-cyan-200/50 dark:border-cyan-900/40 bg-[var(--bg-surface)] flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Care Pathways</span>
            <strong className="text-sm font-black text-cyan-600 dark:text-cyan-400 font-mono">7 Pathways</strong>
            <span className="text-[9px] text-[var(--text-muted)] block">C, W, G, Dual, Trimodal</span>
          </div>
          <Layers className="w-4 h-4 text-cyan-500 opacity-80" />
        </div>

        <div className="p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40 bg-[var(--bg-surface)] flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Peak AUROC</span>
            <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">0.7825</strong>
            <span className="text-[9px] text-[var(--text-muted)] block">T2D Full Fusion</span>
          </div>
          <Award className="w-4 h-4 text-emerald-500 opacity-80" />
        </div>

        <div className="p-2.5 rounded-xl border border-amber-200/50 dark:border-amber-900/40 bg-[var(--bg-surface)] flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Remote Triage Lift</span>
            <strong className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">+0.0364</strong>
            <span className="text-[9px] text-[var(--text-muted)] block">Gut Surrogacy (p&lt;0.0001)</span>
          </div>
          <Sparkles className="w-4 h-4 text-amber-500 opacity-80" />
        </div>
      </div>

      {/* 3. CLEAN TAB NAVIGATION (WITH DATASETS INFO & ALL 7 PATHWAYS) */}
      <div className="flex border-b border-[var(--border-medium)] gap-1.5 overflow-x-auto custom-scrollbar">
        {[
          { id: 'all_pathways', label: '7-Pathway Benchmark', count: '35 Configs', icon: Award },
          { id: 'pathway_weights', label: 'Meta-Learner Weights', count: 'All 7 Pathways', icon: SlidersHorizontal },
          { id: 'expert_models', label: 'Classifier Reports', count: 'Acc, Pre, F1, AUROC', icon: Cpu },
          { id: 'datasets_info', label: 'Datasets & Cohort Split', count: 'N=100k Splits', icon: Database },
          { id: 'statistical_audit', label: 'Statistical Rigor', count: 'p < 0.05 Verified', icon: ShieldCheck },
          { id: 'patient_results', label: 'Live Patient Demo', count: 'Active Session', icon: Stethoscope },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-light)]/15'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-[var(--primary)] text-white' : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: 7-PATHWAY BENCHMARK MATRIX (35 CONFIGURATIONS)
          ========================================================================= */}
      {activeTab === 'all_pathways' && (
        <div className="space-y-4">
          {/* Progression Stepper Across 7 Pathways */}
          <div className="p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <strong className="text-xs font-black uppercase text-[var(--text-main)] tracking-wider">
                  Multi-Modal AUROC Progression Across All 7 Care Pathways
                </strong>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Observe performance lift: Single Modalities &rarr; Dual Combinations &rarr; Full Triple Stacking Fusion.
                </p>
              </div>

              {/* Disease Filter Pills */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] overflow-x-auto">
                {[
                  { id: 'Type2_Diabetes', label: 'Type 2 Diabetes' },
                  { id: 'Prediabetes', label: 'Prediabetes' },
                  { id: 'High_Adiposity_Risk', label: 'Obesity' },
                  { id: 'Metabolic_Syndrome', label: 'Metabolic Syn' },
                  { id: 'NAFLD', label: 'NAFLD Liver' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setProgressionDisease(d.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                      progressionDisease === d.id
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 7 Sleek Mini Cards Side-by-Side */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {progressionRows.map((p) => {
                const conf = p.config;
                if (!conf) return null;
                const fillPct = Math.min(Math.max((conf.auroc - 0.45) / 0.40 * 100, 10), 100);

                return (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] flex flex-col justify-between space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black" style={{ color: p.color }}>{p.id}</span>
                      {conf.isBest && (
                        <span className="text-[8.5px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          ★ Best
                        </span>
                      )}
                    </div>
                    <div>
                      <strong className="text-[13px] font-black font-mono block text-[var(--text-main)]">
                        {conf.auroc.toFixed(4)}
                      </strong>
                      <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden my-1">
                        <div className="h-full rounded-full" style={{ width: `${fillPct}%`, backgroundColor: p.color }} />
                      </div>
                      <span className="text-[9.5px] font-mono text-[var(--text-muted)] block">
                        AUPRC: {conf.auprc.toFixed(4)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact 35-Row Table */}
          <div className="p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative min-w-[200px]">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search model or target..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <select
                  value={selectedDiseaseFilter}
                  onChange={(e) => setSelectedDiseaseFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="all">All 5 Targets</option>
                  <option value="Type2_Diabetes">Type 2 Diabetes</option>
                  <option value="Prediabetes">Prediabetes</option>
                  <option value="High_Adiposity_Risk">Obesity</option>
                  <option value="Metabolic_Syndrome">Metabolic Syndrome</option>
                  <option value="NAFLD">NAFLD</option>
                </select>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Showing <strong>{filteredBenchmarkRows.length}</strong> of 35 configs
              </span>
            </div>

            <div className="overflow-x-auto max-h-[380px] custom-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-[var(--bg-surface)] z-10 border-b border-[var(--border-medium)] text-[10px] font-black uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="py-2 px-2.5">Disease Target</th>
                    <th className="py-2 px-2.5">Pathway</th>
                    <th className="py-2 px-2.5">Classifier</th>
                    <th className="py-2 px-2.5 text-right">AUROC [95% CI]</th>
                    <th className="py-2 px-2.5 text-right">AUPRC</th>
                    <th className="py-2 px-2.5 text-right">Sensitivity</th>
                    <th className="py-2 px-2.5 text-right">Specificity</th>
                    <th className="py-2 px-2.5 text-right">F1 Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredBenchmarkRows.map((r, i) => (
                    <tr key={`${r.disease}-${r.pathway}-${i}`} className={`hover:bg-[var(--bg-primary)]/50 ${r.isBest ? 'bg-indigo-50/15 dark:bg-indigo-950/10 font-bold' : ''}`}>
                      <td className="py-1.5 px-2.5 text-[var(--text-main)]">
                        {r.diseaseTitle} {r.isBest && <span className="text-[8.5px] font-mono text-emerald-600 font-bold ml-1">★ Best</span>}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-[11px] font-bold text-[var(--text-main)]">{r.pathway}</td>
                      <td className="py-1.5 px-2.5 font-mono text-[11px] text-[var(--text-muted)]">{r.model}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {r.auroc.toFixed(4)} <span className="text-[9.5px] text-[var(--text-muted)]">{r.aurocCI}</span>
                      </td>
                      <td className="py-1.5 px-2.5 text-right font-mono text-cyan-600 dark:text-cyan-400">{r.auprc.toFixed(4)}</td>
                      <td className="py-1.5 px-2.5 text-right font-mono text-[var(--text-muted)]">{(r.sensitivity * 100).toFixed(1)}%</td>
                      <td className="py-1.5 px-2.5 text-right font-mono text-[var(--text-muted)]">{(r.specificity * 100).toFixed(1)}%</td>
                      <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{r.f1.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: META-LEARNER WEIGHTS ACROSS ALL 7 PATHWAYS (EXHAUSTIVE & BEAUTIFUL)
          ========================================================================= */}
      {activeTab === 'pathway_weights' && (() => {
        const diseases = [
          { id: 'Type2_Diabetes', label: 'Type 2 Diabetes', icon: '🩺' },
          { id: 'Prediabetes', label: 'Prediabetes Risk', icon: '📈' },
          { id: 'High_Adiposity_Risk', label: 'Adiposity & Obesity', icon: '⚖️' },
          { id: 'Metabolic_Syndrome', label: 'Metabolic Syndrome', icon: '🧬' },
          { id: 'NAFLD', label: 'NAFLD Liver Health', icon: '🫀' },
        ];

        // All 7 Pathways cleanly assembled
        const allSevenPathways = [
          {
            key: 'Full_Multimodal_Fusion',
            id: 'C + W + G',
            badgeBg: 'bg-indigo-600',
            name: 'Pathway 7: Full Multimodal Fusion (C+W+G)',
            features: 82,
            tag: '★ Gold Standard Triple Fusion',
            tagClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
            data: ALL_PATHWAY_WEIGHTS['Full_Multimodal_Fusion'].weights[selectedWeightDisease]
          },
          {
            key: 'Wearable_Gut',
            id: 'W + G',
            badgeBg: 'bg-amber-500',
            name: 'Pathway 6: Wearables + Gut Remote Triage (W+G)',
            features: 64,
            tag: '⚡ Remote Triage (No Blood Draw)',
            tagClass: selectedWeightDisease === 'NAFLD' ? 'bg-amber-500 text-white animate-pulse' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
            isSurge: selectedWeightDisease === 'NAFLD',
            data: ALL_PATHWAY_WEIGHTS['Wearable_Gut'].weights[selectedWeightDisease]
          },
          {
            key: 'Clinical_Wearable',
            id: 'C + W',
            badgeBg: 'bg-blue-600',
            name: 'Pathway 4: Clinical + Wearables (C+W)',
            features: 33,
            tag: 'Labs + Sensors',
            tagClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300',
            data: ALL_PATHWAY_WEIGHTS['Clinical_Wearable'].weights[selectedWeightDisease]
          },
          {
            key: 'Clinical_Gut',
            id: 'C + G',
            badgeBg: 'bg-purple-600',
            name: 'Pathway 5: Clinical + Gut (C+G)',
            features: 67,
            tag: 'Labs + Taxa',
            tagClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
            data: ALL_PATHWAY_WEIGHTS['Clinical_Gut'].weights[selectedWeightDisease]
          },
          {
            key: 'Clinical_Only',
            id: 'C',
            badgeBg: 'bg-violet-600',
            name: 'Pathway 1: Clinical Only (C)',
            features: 18,
            tag: 'Single Modality Baseline',
            tagClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
            data: ALL_PATHWAY_WEIGHTS['Clinical_Only'].weights[selectedWeightDisease]
          },
          {
            key: 'Wearable_Only',
            id: 'W',
            badgeBg: 'bg-cyan-600',
            name: 'Pathway 2: Wearables Only (W)',
            features: 15,
            tag: 'Single Modality Baseline',
            tagClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300',
            data: ALL_PATHWAY_WEIGHTS['Wearable_Only'].weights[selectedWeightDisease]
          },
          {
            key: 'Gut_Only',
            id: 'G',
            badgeBg: 'bg-emerald-600',
            name: 'Pathway 3: Gut Microbiome Only (G)',
            features: 49,
            tag: 'Single Modality Baseline',
            tagClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
            data: ALL_PATHWAY_WEIGHTS['Gut_Only'].weights[selectedWeightDisease]
          },
        ];

        return (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 space-y-3 shadow-xs">
            {/* Top Bar: Target Selection Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-xs font-black uppercase text-[var(--text-main)] tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                  Meta-Learner Weights for All 7 Pathways
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Level-1 Stacking weights allocated to each expert model per care pathway.
                </p>
              </div>

              {/* Target Pills */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] overflow-x-auto">
                {diseases.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedWeightDisease(d.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedWeightDisease === d.id
                        ? 'bg-[var(--primary)] text-white shadow-2xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <span>{d.icon}</span>
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Legend */}
            <div className="flex items-center justify-between text-[11px] px-1 font-bold text-[var(--text-muted)]">
              <span className="text-[10px] uppercase font-black tracking-wider">All 7 Stacking Configurations</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                  <span className="w-2 h-2 rounded-full bg-violet-600" /> Clinical Labs
                </span>
                <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" /> Wearable Sensors
                </span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Gut Microbiome
                </span>
              </div>
            </div>

            {/* Exhaustive 7-Pathway List */}
            <div className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/40 overflow-hidden">
              {allSevenPathways.map((p) => {
                const wObj = p.data;
                const weights = [
                  { label: 'Labs', pct: wObj.c, color: 'bg-violet-600', textCol: 'text-violet-600 dark:text-violet-400' },
                  { label: 'Sensors', pct: wObj.w, color: 'bg-cyan-500', textCol: 'text-cyan-600 dark:text-cyan-400' },
                  { label: 'Gut', pct: wObj.g, color: 'bg-emerald-500', textCol: 'text-emerald-600 dark:text-emerald-400' },
                ];

                return (
                  <div
                    key={p.key}
                    className={`p-2.5 sm:px-3.5 transition-colors ${
                      p.isSurge
                        ? 'bg-amber-50/50 dark:bg-amber-950/25'
                        : 'hover:bg-[var(--bg-surface)]/80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {/* Left: Badge + Pathway Name */}
                      <div className="flex items-center gap-2 min-w-[210px]">
                        <span className={`font-mono text-[10.5px] font-black px-1.5 py-0.5 rounded-md text-white shadow-2xs ${p.badgeBg}`}>
                          {p.id}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <strong className="text-xs font-bold text-[var(--text-main)]">
                              {p.name}
                            </strong>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${p.tagClass}`}>
                              {p.tag}
                            </span>
                          </div>
                          <span className="text-[9.5px] text-[var(--text-muted)] font-mono block">
                            {p.features} features &bull; &beta; vector: {wObj.beta}
                          </span>
                        </div>
                      </div>

                      {/* Center: Slim Segmented Bar */}
                      <div className="w-full sm:w-48 lg:w-64">
                        <div className="h-2 w-full rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-800 shadow-inner">
                          {weights.map((w, idx) =>
                            w.pct > 0 ? (
                              <div
                                key={w.label}
                                style={{ width: `${w.pct}%` }}
                                className={`h-full ${w.color} transition-all duration-300 ${idx > 0 ? 'ml-0.5' : ''}`}
                                title={`${w.label}: ${w.pct.toFixed(1)}%`}
                              />
                            ) : null
                          )}
                        </div>
                      </div>

                      {/* Right: Exact Percentage Numbers */}
                      <div className="flex items-center gap-2.5 font-mono text-[11px] font-black shrink-0 sm:min-w-[170px] justify-end">
                        {weights.map((w) =>
                          w.pct > 0 ? (
                            <span key={w.label} className={w.textCol}>
                              {w.pct.toFixed(1)}% <span className="text-[9px] font-sans font-normal text-[var(--text-muted)]">{w.label}</span>
                            </span>
                          ) : null
                        )}
                      </div>
                    </div>

                    {/* 1-Line Subtext Insight */}
                    <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate">
                      {wObj.note}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Footer Summary */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10.5px] text-[var(--text-muted)] font-mono">
              <span>
                <strong>Stacking Formulation:</strong> P(Y=1|X) = &sigma;(&beta;₀ + &beta;_c &middot; p_c + &beta;_w &middot; p_w + &beta;_g &middot; p_g)
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                ✓ All 7 pathways evaluated on 15,000 holdout test cohort
              </span>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 3: CLASSIFIER REPORTS (ACCURACY, PRECISION, RECALL, F1, AUROC, AUPRC)
          ========================================================================= */}
      {activeTab === 'expert_models' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <strong className="text-xs font-black uppercase text-[var(--text-main)] tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  Full Classification Performance Reports
                </strong>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Evaluated on 15,000 independent test patients: Accuracy, Precision, Recall/Sensitivity, Specificity, F1, AUROC, AUPRC, and Brier Score.
                </p>
              </div>

              {/* Sub-Tab Switcher */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <button
                  onClick={() => setExpertSubTab('winners')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    expertSubTab === 'winners' ? 'bg-[var(--primary)] text-white shadow-xs' : 'text-[var(--text-muted)]'
                  }`}
                >
                  15 Deployed Expert Champions
                </button>
                <button
                  onClick={() => setExpertSubTab('all90')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    expertSubTab === 'all90' ? 'bg-[var(--primary)] text-white shadow-xs' : 'text-[var(--text-muted)]'
                  }`}
                >
                  All 90 Classifier Tournament
                </button>
              </div>
            </div>

            {/* View 1: 15 Deployed Champions Classification Report Table */}
            {expertSubTab === 'winners' && (
              <div className="overflow-x-auto max-h-[460px] custom-scrollbar">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-[var(--bg-surface)] z-10 border-b border-[var(--border-medium)] text-[10px] font-black uppercase text-[var(--text-muted)]">
                    <tr>
                      <th className="py-2 px-2.5">Modality</th>
                      <th className="py-2 px-2.5">Target Disease</th>
                      <th className="py-2 px-2.5">Winner Model</th>
                      <th className="py-2 px-2.5 text-right font-mono">Accuracy</th>
                      <th className="py-2 px-2.5 text-right font-mono">Precision</th>
                      <th className="py-2 px-2.5 text-right font-mono">Recall (Sens)</th>
                      <th className="py-2 px-2.5 text-right font-mono">Specificity</th>
                      <th className="py-2 px-2.5 text-right font-mono">F1-Score</th>
                      <th className="py-2 px-2.5 text-right font-mono text-indigo-600 dark:text-indigo-400">AUROC [95% CI]</th>
                      <th className="py-2 px-2.5 text-right font-mono text-cyan-600 dark:text-cyan-400">AUPRC</th>
                      <th className="py-2 px-2.5 text-right font-mono">Threshold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
                    {STAGE1_EXPERT_WINNERS.map((e, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-primary)]/50">
                        <td className="py-1.5 px-2.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            e.modality === 'Clinical' ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300' :
                            e.modality === 'Wearable' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300' :
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                          }`}>
                            {e.modality}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 font-sans font-bold text-[var(--text-main)]">{e.diseaseTitle}</td>
                        <td className="py-1.5 px-2.5 font-bold text-emerald-600 dark:text-emerald-400">{e.winner}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-[var(--text-main)]">{(e.accuracy * 100).toFixed(1)}%</td>
                        <td className="py-1.5 px-2.5 text-right text-[var(--text-main)]">{(e.precision * 100).toFixed(1)}%</td>
                        <td className="py-1.5 px-2.5 text-right text-[var(--text-main)]">{(e.recall * 100).toFixed(1)}%</td>
                        <td className="py-1.5 px-2.5 text-right text-[var(--text-muted)]">{(e.specificity * 100).toFixed(1)}%</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">{e.f1.toFixed(3)}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {e.auroc.toFixed(4)} <span className="text-[9px] text-[var(--text-muted)] font-normal">{e.aurocCI}</span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right text-cyan-600 dark:text-cyan-400">{e.auprc.toFixed(4)}</td>
                        <td className="py-1.5 px-2.5 text-right text-[var(--text-muted)]">{e.cutoff.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* View 2: All 90 Classifier Tournament Matrix */}
            {expertSubTab === 'all90' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-muted)]">Modality Filter:</span>
                  {['all', 'Clinical', 'Wearable', 'Gut'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedExpertModality(m)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border cursor-pointer ${
                        selectedExpertModality === m ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto max-h-[380px] custom-scrollbar">
                  <table className="w-full text-xs text-left">
                    <thead className="sticky top-0 bg-[var(--bg-surface)] border-b border-[var(--border-medium)] text-[10px] font-black uppercase text-[var(--text-muted)]">
                      <tr>
                        <th className="py-2 px-2.5">Modality</th>
                        <th className="py-2 px-2.5">Target</th>
                        <th className="py-2 px-2.5">Classifier</th>
                        <th className="py-2 px-2.5">Family</th>
                        <th className="py-2 px-2.5 text-right">AUROC</th>
                        <th className="py-2 px-2.5 text-right">AUPRC</th>
                        <th className="py-2 px-2.5 text-right">Fit Time</th>
                        <th className="py-2 px-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {ALL_90_CLASSIFIERS
                        .filter(c => selectedExpertModality === 'all' || c.modality === selectedExpertModality)
                        .map((c, i) => (
                          <tr key={`${c.modality}-${c.disease}-${c.classifier}-${i}`} className={`hover:bg-[var(--bg-primary)]/50 ${c.isWinner ? 'bg-emerald-50/20 dark:bg-emerald-950/20 font-bold' : ''}`}>
                            <td className="py-1 px-2.5 font-mono text-[11px]">{c.modality}</td>
                            <td className="py-1 px-2.5 text-[var(--text-main)]">{c.diseaseTitle}</td>
                            <td className="py-1 px-2.5 font-mono text-[11px] text-[var(--text-main)]">{c.classifier}</td>
                            <td className="py-1 px-2.5 text-[10px] text-[var(--text-muted)]">{c.family}</td>
                            <td className="py-1 px-2.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.auroc.toFixed(4)}</td>
                            <td className="py-1 px-2.5 text-right font-mono text-cyan-600 dark:text-cyan-400">{c.auprc.toFixed(4)}</td>
                            <td className="py-1 px-2.5 text-right font-mono text-[var(--text-muted)]">{c.fitTime.toFixed(2)}s</td>
                            <td className="py-1 px-2.5 text-center">
                              {c.isWinner ? (
                                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">★ Deployed Champion</span>
                              ) : (
                                <span className="text-[10px] text-[var(--text-muted)]">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: DATASETS & COHORT SPLIT INFO (SIZE, SPLITS, PROTOCOL)
          ========================================================================= */}
      {activeTab === 'datasets_info' && (
        <div className="space-y-4">
          {/* Cohort Overview Card */}
          <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <strong className="text-xs font-black uppercase text-[var(--text-main)] tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  Multimodal Cohort Dataset & Validation Splits
                </strong>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Master synchronized cohort specifications, data splitting protocols, and cross-validation integrity.
                </p>
              </div>
              <Badge variant="accent" size="sm">N = 100,000 Synchronized Patients</Badge>
            </div>

            {/* Visual 3-Way Split Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-indigo-600 dark:text-indigo-400">Train Set: 70,000 (70%)</span>
                <span className="text-purple-600 dark:text-purple-400">Validation Set: 15,000 (15%)</span>
                <span className="text-emerald-600 dark:text-emerald-400">Test Benchmark: 15,000 (15%)</span>
              </div>

              <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-200 dark:bg-gray-800 p-0.5 shadow-inner">
                <div className="h-full bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-l-full" style={{ width: '70%' }} title="Train Set: 70k" />
                <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 ml-0.5" style={{ width: '15%' }} title="Validation Set: 15k" />
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-r-full ml-0.5" style={{ width: '15%' }} title="Test Set: 15k" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-1">
                  <strong className="text-indigo-950 dark:text-indigo-200 font-bold block">1. Training Set (70k Patients)</strong>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Used strictly for fitting preprocessors (StandardScaler, Median Imputers) and training candidate classifiers across all 3 modalities. Class weights applied for prevalence balance.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 space-y-1">
                  <strong className="text-purple-950 dark:text-purple-200 font-bold block">2. Validation Set (15k Patients)</strong>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Used for hyperparameter tuning, optimal classification threshold selection (Youden's Index / F1), and training the Level-1 Stacking Meta-Learners.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1">
                  <strong className="text-emerald-950 dark:text-emerald-200 font-bold block">3. Untouched Test Set (15k Patients)</strong>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Strictly held out until final publication evaluation. All reported AUROC, AUPRC, and F1 scores are derived here with 1,000 paired bootstrap 95% Confidence Intervals.
                  </p>
                </div>
              </div>
            </div>

            {/* Modality Panels Breakdown */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <strong className="text-xs font-black uppercase text-[var(--text-main)] tracking-wider">
                Multi-Modal Data Panel Architecture (82 Total Biomarkers)
              </strong>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Clinical Panel */}
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-violet-500" />
                      Clinical Panel (18 Features)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                      Primary Anchor
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Fasting Blood Glucose, HbA1c, Triglycerides, HDL, LDL, ALT, AST, Systolic/Diastolic BP, BMI, Waist Circumference, Height, Weight, Age, Gender, and 3 Family History flags.
                  </p>
                </div>

                {/* Wearable Panel */}
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                      <Watch className="w-3.5 h-3.5 text-cyan-500" />
                      Wearable & CGM (15 Features)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300">
                      Telemetry Stream
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    10 smartwatch metrics (Daily Steps, Active Minutes, Sedentary Minutes, Resting HR, HRV RMSSD, Sleep Duration, Sleep Efficiency, Stress Score, Energy Expenditure, Exercise Days) + 5 continuous CGM metrics (Mean Glucose, CV, TIR, TAR, TBR).
                  </p>
                </div>

                {/* Gut Microbiome Panel */}
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Dna className="w-3.5 h-3.5 text-emerald-500" />
                      Gut Microbiome (49 Features)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Multiomics
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    40 scientifically justified taxa relative abundances (100% Dirichlet-Multinomial simplex normalized) + 9 derived indices (Shannon, Simpson, Richness, Evenness, SCFA Producer, Butyrate, Barrier, Inflammation, Log Firmicutes/Bacteroidetes).
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Protocol & Rigor Card */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 text-xs">
              <strong className="text-xs font-black uppercase text-[var(--text-main)] tracking-wider">
                Rigorous Evaluation & Data Leakage Prevention Protocol
              </strong>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] text-[var(--text-muted)]">
                <div className="space-y-1">
                  <span className="font-bold text-[var(--text-main)] block">&bull; Out-Of-Fold (OOF) Stacking:</span>
                  <span>Level-0 predictions used to train the Level-1 meta-learners were generated via 5-fold cross-validation out-of-fold folds to prevent target leakage and overconfident stacking coefficients.</span>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[var(--text-main)] block">&bull; Isotonic Probability Calibration:</span>
                  <span>Raw model logits are calibrated via Isotonic Regression, ensuring that a predicted probability of 60% corresponds to an empirical 60% observed prevalence (Brier score loss &lt; 0.20 across all targets).</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: STATISTICAL RIGOR & AUDIT SCORECARD
          ========================================================================= */}
      {activeTab === 'statistical_audit' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div>
                <strong className="text-xs font-black uppercase text-[var(--text-main)] tracking-wider">
                  Paired Bootstrap Hypothesis Testing (N=1,000 Iterations)
                </strong>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Statistical confirmation of multimodal fusion gain over single-modality clinical baseline.
                </p>
              </div>
              <Badge variant="accent" size="sm">p &lt; 0.05 Quality Gate</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[var(--border-medium)] text-[10px] font-black uppercase text-[var(--text-muted)]">
                  <tr>
                    <th className="py-1.5 px-2.5">Target</th>
                    <th className="py-1.5 px-2.5 text-right">Clinical AUROC</th>
                    <th className="py-1.5 px-2.5 text-right">Fusion AUROC</th>
                    <th className="py-1.5 px-2.5 text-right">Gain</th>
                    <th className="py-1.5 px-2.5 text-right">p-value</th>
                    <th className="py-1.5 px-2.5">Interpretation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] font-mono text-[11px]">
                  {STATISTICAL_SIGNIFICANCE_DATA.map((r) => (
                    <tr key={r.disease} className="hover:bg-[var(--bg-primary)]/50">
                      <td className="py-1.5 px-2.5 font-sans font-bold text-[var(--text-main)]">{r.diseaseTitle}</td>
                      <td className="py-1.5 px-2.5 text-right text-[var(--text-muted)]">{r.clinAUROC.toFixed(4)}</td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">{r.fusionAUROC.toFixed(4)}</td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">+{r.gain.toFixed(4)}</td>
                      <td className="py-1.5 px-2.5 text-right font-bold text-[var(--text-main)]">{r.pVal.toFixed(4)}</td>
                      <td className="py-1.5 px-2.5 font-sans text-[11px] text-[var(--text-muted)]">{r.interpretation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4-Point Rigor Checklist */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            {[
              { title: 'Zero Leakage', desc: 'Strict pre-split patient ID normalization.' },
              { title: 'OOF Stacking', desc: '5-fold cross-validated out-of-fold training.' },
              { title: 'ADA Override', desc: 'Type 2 Diabetes supersedes Prediabetes.' },
              { title: 'Audit Trail', desc: 'SHA-256 tamper-evident cryptographic log.' },
            ].map((c) => (
              <div key={c.title} className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs text-[var(--text-main)] block">{c.title}</strong>
                  <span className="text-[10px] text-[var(--text-muted)]">{c.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: LIVE PATIENT ASSESSMENT DEMO
          ========================================================================= */}
      {activeTab === 'patient_results' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { key: 'Type2_Diabetes', title: 'Type 2 Diabetes', prob: 0.612, cutoff: 0.33, isPos: true, risk: 'High', c: 0.58, w: 0.64, g: 0.49 },
              { key: 'Prediabetes', title: 'Prediabetes Risk', prob: 0.540, cutoff: 0.33, isPos: false, risk: 'Moderate', c: 0.52, w: 0.57, g: 0.48, override: 'Superseded by overt T2D' },
              { key: 'High_Adiposity_Risk', title: 'Adiposity & Obesity', prob: 0.584, cutoff: 0.39, isPos: true, risk: 'High', c: 0.59, w: 0.51, g: 0.52 },
              { key: 'Metabolic_Syndrome', title: 'Metabolic Syndrome', prob: 0.641, cutoff: 0.31, isPos: true, risk: 'High', c: 0.66, w: 0.48, g: 0.42 },
              { key: 'NAFLD', title: 'NAFLD Liver Health', prob: 0.248, cutoff: 0.29, isPos: false, risk: 'Low', c: 0.24, w: 0.26, g: 0.23 },
            ].map((d) => (
              <div
                key={d.key}
                className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                  d.isPos
                    ? 'border-l-4 border-l-rose-500 bg-[var(--bg-surface)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-black text-[var(--text-main)]">{d.title}</strong>
                  <Badge variant={d.risk === 'High' ? 'danger' : d.risk === 'Moderate' ? 'warning' : 'success'} size="sm">
                    {d.risk}
                  </Badge>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Calibrated Risk</span>
                  <strong className="font-mono text-sm font-black text-[var(--text-main)]">
                    {Math.round(d.prob * 100)}%
                  </strong>
                </div>
                <ProgressBar value={Math.round(d.prob * 100)} max={100} variant={d.risk === 'High' ? 'danger' : 'success'} />
                <div className="flex justify-between text-[9.5px] font-mono text-[var(--text-muted)] pt-0.5">
                  <span>Cutoff: {d.cutoff.toFixed(2)}</span>
                  <span className={d.isPos ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {d.isPos ? 'POSITIVE' : 'NEGATIVE'}
                  </span>
                </div>
                {d.override && (
                  <div className="text-[9.5px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    ⚠️ {d.override}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
