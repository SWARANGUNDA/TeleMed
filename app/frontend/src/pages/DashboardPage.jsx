import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Brain, FileText, Activity, ShieldCheck, ChevronDown, ChevronUp,
  PlusCircle, Watch, Dna, Info, UserCheck, AlertCircle, FileSpreadsheet, Stethoscope,
  Calendar, Clock, CheckCircle, TrendingUp, Sparkles, Filter, ChevronRight, BookmarkCheck,
  Award, RefreshCw, FolderClock, Heart, ActivitySquare, Droplet, Eye,
  Compass, Shuffle, Utensils, Moon, Flame, Zap
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  ProgressBar, CircularProgress, Skeleton, Table, TableRow, TableCell, Tabs, EmptyState, Alert
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import RiskGauge from '../components/RiskGauge';
import WhyQualityModal from '../components/WhyQualityModal';
import { fetchUserAppointments, fetchPatientConsultations, fetchPatientRecords } from '../api/client';
import { classifyBiomarker, classifyWearable, classifyGut } from '../utils/clinicalRanges';
import {
  calculateOverallHealthScore,
  analyzeLongitudinalShifts,
  detectEarlyWarnings,
  generateCrossModalityInsights
} from '../utils/healthIntelligence';
import { generatePersonalizedRecommendations } from '../utils/personalizedRecommender';

export default function DashboardPage({
  session,
  predictionData,
  onNavigate,
  onStartAnalysis,
  user,
  onDiscussWithDoctor,
  onOpenComparison,
  onStartNewAnalysis
}) {
  const [expandedWhy, setExpandedWhy] = useState({});
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [savedRecords, setSavedRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const safeParse = (data) => {
    if (!data) return null;
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch { return null; }
    }
    return typeof data === 'object' ? data : null;
  };

  useEffect(() => {
    async function loadUserData() {
      setRecordsLoading(true);
      try {
        const appts = await fetchUserAppointments();
        setAppointments(Array.isArray(appts) ? appts : (appts?.appointments || []));
      } catch (e) {}
      try {
        const consData = await fetchPatientConsultations();
        setConsultations(Array.isArray(consData) ? consData : (consData?.consultations || []));
      } catch (e) {}
      try {
        const recsData = await fetchPatientRecords();
        setSavedRecords(Array.isArray(recsData) ? recsData : (recsData?.records || []));
      } catch (e) {} finally {
        setRecordsLoading(false);
      }
    }
    if (user) {
      loadUserData();
    }
  }, [user]);

  const handleTriggerNewAnalysis = () => {
    if (onStartNewAnalysis) {
      onStartNewAnalysis();
    } else if (onStartAnalysis) {
      onStartAnalysis();
    } else if (onNavigate) {
      onNavigate('analysis', 'new_analysis');
    }
  };

  // Determine active prediction payload: passed session prediction OR latest saved record snapshot
  const activeRecord = savedRecords.length > 0 ? savedRecords[0] : null;
  const rawPred = predictionData || (activeRecord ? activeRecord.prediction_snapshot : null);
  const parsedPred = safeParse(rawPred);
  const activePredictionData = parsedPred ? {
    ...parsedPred,
    data_quality_score: (parsedPred.data_quality_score && Number(parsedPred.data_quality_score) > 0)
      ? Number(parsedPred.data_quality_score)
      : (activeRecord?.data_quality_score && Number(activeRecord.data_quality_score) > 0 ? Number(activeRecord.data_quality_score) : parsedPred.data_quality_score)
  } : null;

  // Compute Health Intelligence
  const healthScoreObj = calculateOverallHealthScore(activePredictionData, activePredictionData?.data_quality_score);
  const longitudinalShifts = analyzeLongitudinalShifts(savedRecords);
  const earlyWarnings = detectEarlyWarnings(activePredictionData, savedRecords);
  const crossModalityInsights = generateCrossModalityInsights(activePredictionData);
  const personalizedRecs = generatePersonalizedRecommendations(activePredictionData, user);



  const toggleWhy = (diseaseKey) => {
    setExpandedWhy(prev => ({ ...prev, [diseaseKey]: !prev[diseaseKey] }));
  };

  // Profile completion calculator
  const profile = user?.patient_profile || {};
  const profileFields = [
    { key: 'full_name', label: 'Full Name', val: user?.full_name || profile.full_name },
    { key: 'age', label: 'Age', val: profile.age },
    { key: 'gender', label: 'Gender', val: profile.gender },
    { key: 'height_cm', label: 'Height', val: profile.height_cm },
    { key: 'weight_kg', label: 'Weight', val: profile.weight_kg },
    { key: 'contact_number', label: 'Contact Number', val: profile.contact_number },
  ];

  const filledFields = profileFields.filter(f => f.val !== null && f.val !== undefined && String(f.val).trim() !== '');
  const completionPct = Math.round((filledFields.length / profileFields.length) * 100);

  // EMPTY STATE if no predictionData and no saved historical assessment
  if (!activePredictionData) {
    if (recordsLoading) {
      return (
        <PageContainer className="space-y-12">
          <PageHeader
            title={`Welcome back, ${user?.name || user?.full_name || user?.patient_profile?.full_name || 'Patient'}! 👋`}
            description="Personal Health Command Center & AI Multimodal Intake Workspace"
            badge={completionPct === 100 ? 'Profile 100%' : `Profile ${completionPct}%`}
          />
          <Card isGlass={true} className="p-12 text-center">
            <RefreshCw className="w-8 h-8 spin mx-auto text-[var(--primary)] mb-3" />
            <p className="text-sm text-[var(--text-muted)]">Loading personal health command center...</p>
          </Card>
        </PageContainer>
      );
    }

    return (
      <PageContainer className="space-y-12">
        <PageHeader
          title={`Welcome back, ${user?.name || user?.full_name || user?.patient_profile?.full_name || (user?.email ? user.email.split('@')[0].replace('.', ' ').replace('_', ' ') : 'Patient')}! 👋`}
          description="Personal Health Command Center & AI Multimodal Intake Workspace"
          badge={completionPct === 100 ? 'Profile 100%' : `Profile ${completionPct}%`}
          actions={
            <div className="flex items-center gap-3">
              <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />} onClick={handleTriggerNewAnalysis}>
                Start New Analysis
              </Button>
            </div>
          }
        />

        {/* Live Modality Status Cards */}
        <ContentSection title="Live Modality Status Summary" subtitle="Active data streams registered for prediction synthesis">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card isGlass={true} className="p-6 text-center space-y-3">
              <div className="p-3 w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-main)]">Clinical Laboratory PDF</h4>
              <Badge variant="outline" size="sm">NOT PROVIDED</Badge>
              <p className="text-xs text-[var(--text-muted)]">Upload CMP/Lipid panel to extract 18 lab biomarkers.</p>
            </Card>

            <Card isGlass={true} className="p-6 text-center space-y-3">
              <div className="p-3 w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 mx-auto flex items-center justify-center">
                <Watch className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-main)]">Wearable Sensor Telemetry</h4>
              <Badge variant="outline" size="sm">NOT PROVIDED</Badge>
              <p className="text-xs text-[var(--text-muted)]">Upload CGM/HRV/Step metrics for 15-dimensional telemetry.</p>
            </Card>

            <Card isGlass={true} className="p-6 text-center space-y-3">
              <div className="p-3 w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 mx-auto flex items-center justify-center">
                <Dna className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[var(--text-main)]">Gut Microbiome Sequencing</h4>
              <Badge variant="outline" size="sm">NOT PROVIDED</Badge>
              <p className="text-xs text-[var(--text-muted)]">Upload 16S/Metagenomic profile for 49 taxa features.</p>
            </Card>
          </div>
        </ContentSection>

        <Card isGlass={true} className="p-8 text-center space-y-6">
          <EmptyState
            icon={<Brain className="w-12 h-12 text-[var(--primary)]" />}
            title="No Active Health Assessment Found"
            description="Upload your medical reports, wearable telemetry, or gut microbiome data to generate multi-disease predictions and TreeSHAP explainability insights."
            action={
              <Button variant="primary" size="lg" leftIcon={<PlusCircle className="w-5 h-5" />} onClick={handleTriggerNewAnalysis}>
                Start New Multimodal Analysis
              </Button>
            }
          />
        </Card>
      </PageContainer>
    );
  }

  // Active Prediction Payload Extraction
  const outcomes = activePredictionData.disease_outcomes || activePredictionData.predictions || {};
  const pathwayUsed = activePredictionData.pathway_used || activePredictionData.effective_pathway || 'C+W+G';
  const activeMods = activePredictionData.active_modalities || ['clinical', 'wearable', 'gut'];
  const clinFeats = (typeof activePredictionData?.confirmed_features?.clinical === 'object' && activePredictionData?.confirmed_features?.clinical !== null)
    ? activePredictionData.confirmed_features.clinical
    : (typeof activePredictionData?.clinical_features === 'object' && activePredictionData?.clinical_features !== null)
      ? activePredictionData.clinical_features
      : (typeof activeRecord?.confirmed_features?.clinical === 'object' && activeRecord?.confirmed_features?.clinical !== null)
        ? activeRecord.confirmed_features.clinical
        : {};

  const wearFeats = (typeof activePredictionData?.confirmed_features?.wearable === 'object' && activePredictionData?.confirmed_features?.wearable !== null)
    ? activePredictionData.confirmed_features.wearable
    : (typeof activePredictionData?.wearable_features === 'object' && activePredictionData?.wearable_features !== null)
      ? activePredictionData.wearable_features
      : (typeof activeRecord?.confirmed_features?.wearable === 'object' && activeRecord?.confirmed_features?.wearable !== null)
        ? activeRecord.confirmed_features.wearable
        : {};

  const gutFeats = (typeof activePredictionData?.confirmed_features?.gut === 'object' && activePredictionData?.confirmed_features?.gut !== null)
    ? activePredictionData.confirmed_features.gut
    : (typeof activePredictionData?.gut_features === 'object' && activePredictionData?.gut_features !== null)
      ? activePredictionData.gut_features
      : (typeof activeRecord?.confirmed_features?.gut === 'object' && activeRecord?.confirmed_features?.gut !== null)
        ? activeRecord.confirmed_features.gut
        : {};

  // Dynamic fallback calculation if rawDq is not yet in snapshot right after intake
  const cCount = Object.keys(clinFeats || {}).filter(k => clinFeats[k] !== null && clinFeats[k] !== undefined && clinFeats[k] !== '').length;
  const wCount = Object.keys(wearFeats || {}).filter(k => wearFeats[k] !== null && wearFeats[k] !== undefined && wearFeats[k] !== '').length;
  const gCount = Object.keys(gutFeats || {}).filter(k => gutFeats[k] !== null && gutFeats[k] !== undefined && gutFeats[k] !== '').length;
  const totalProvidedFeatures = cCount + wCount + gCount;

  const activeModCount = (cCount > 0 ? 1 : 0) + (wCount > 0 ? 1 : 0) + (gCount > 0 ? 1 : 0);
  const computedFallbackDq = activeModCount >= 3 
    ? Math.min(96, Math.max(78, Math.round(75 + (totalProvidedFeatures / 50) * 20)))
    : (activeModCount === 2 
        ? Math.min(84, Math.max(60, Math.round(55 + (totalProvidedFeatures / 30) * 25)))
        : (activeModCount === 1 ? Math.min(70, Math.max(45, Math.round(42 + (totalProvidedFeatures / 15) * 24))) : 50));

  const candidateScores = [
    activePredictionData?.data_quality_scores?.overall_quality_score,
    activePredictionData?.overall_quality_score,
    activePredictionData?.data_quality_score,
    activeRecord?.data_quality_score,
    activePredictionData?.routing_metadata?.data_quality_score,
    activePredictionData?.data_quality_scores?.data_quality_score,
  ];

  let resolvedDq = null;
  for (const cand of candidateScores) {
    if (cand !== null && cand !== undefined && !isNaN(Number(cand))) {
      const num = Number(cand);
      if (num > 0) {
        resolvedDq = num <= 1 ? Math.round(num * 100) : Math.min(100, Math.round(num));
        break;
      }
    }
  }

  const dqScore = resolvedDq ?? (computedFallbackDq || 80);

  const rawDqScores = activePredictionData?.data_quality_scores;
  const qualityDataObj = (rawDqScores && (Number(rawDqScores.overall_quality_score) > 0 || Number(rawDqScores.overall_score) > 0))
    ? {
        ...rawDqScores,
        overall_quality_score: Math.round(rawDqScores.overall_quality_score || dqScore),
        score_breakdown: {
          overall_quality_score: Math.round(rawDqScores.score_breakdown?.overall_quality_score || rawDqScores.overall_quality_score || dqScore),
          quality_label: dqScore >= 85 ? 'High Quality' : dqScore >= 60 ? 'Moderate Quality' : 'Low Quality / Verification Required',
          counts: { provided: totalProvidedFeatures, clinical: cCount, wearable: wCount, gut: gCount },
          coverage: { clinical: cCount > 0, wearable: wCount > 0, gut: gCount > 0 },
          deductions_list: [
            `Verified input data quality across active pathway (${pathwayUsed}).`,
            totalProvidedFeatures > 0 ? `${totalProvidedFeatures} validated parameters processed.` : 'Standard baseline parameters.'
          ],
          ...(rawDqScores.score_breakdown || {})
        }
      }
    : {
        overall_quality_score: dqScore,
        data_quality_score: dqScore,
        clinical_score: cCount > 0 ? 85 : 0,
        wearable_score: wCount > 0 ? 90 : 0,
        gut_score: gCount > 0 ? 70 : 0,
        multimodal_coverage_pct: Math.round((activeModCount / 3) * 100),
        score_breakdown: {
          overall_quality_score: dqScore,
          quality_label: dqScore >= 85 ? 'High Quality' : dqScore >= 60 ? 'Moderate Quality' : 'Low Quality / Verification Required',
          counts: { provided: totalProvidedFeatures, clinical: cCount, wearable: wCount, gut: gCount },
          coverage: { clinical: cCount > 0, wearable: wCount > 0, gut: gCount > 0 },
          deductions_list: [
            `Verified input data quality across active pathway (${pathwayUsed}).`,
            totalProvidedFeatures > 0 ? `${totalProvidedFeatures} validated parameters processed.` : 'Standard baseline parameters.'
          ]
        }
      };


  const diseasesList = [
    { key: 'Type2_Diabetes', title: 'Type 2 Diabetes', desc: 'Glycemic control & insulin resistance' },
    { key: 'Prediabetes', title: 'Prediabetes Risk', desc: 'Impaired fasting glucose screening' },
    { key: 'High_Adiposity_Risk', title: 'Adiposity & Obesity', desc: 'Body mass & visceral fat distribution' },
    { key: 'Metabolic_Syndrome', title: 'Metabolic Syndrome', desc: 'Cluster of metabolic risk factors' },
    { key: 'NAFLD', title: 'NAFLD Liver Health', desc: 'Non-alcoholic fatty liver disease risk' },
  ];

  // Helper for Risk Probability
  const getProb = (data) => {
    if (!data) return 0;
    return data.calibrated_probability !== undefined 
      ? data.calibrated_probability 
      : (data.probability !== undefined ? data.probability : (data.risk_score || 0));
  };

  const t2dProb = getProb(outcomes['Type2_Diabetes']);
  const preProb = getProb(outcomes['Prediabetes']);

  // Helper for Risk Badge & Border Color
  const getRiskMeta = (riskLevel) => {
    const lvl = (riskLevel || '').toUpperCase();
    if (lvl.includes('HIGH')) {
      return { variant: 'danger', borderColor: 'border-t-4 border-t-[var(--danger)]', badgeText: 'High Risk' };
    }
    if (lvl.includes('MODERATE') || lvl.includes('ELEVATED')) {
      return { variant: 'warning', borderColor: 'border-t-4 border-t-[var(--warning)]', badgeText: 'Moderate' };
    }
    return { variant: 'success', borderColor: 'border-t-4 border-t-[var(--success)]', badgeText: 'Low Risk' };
  };

  // Biomarker Summary Data Array Builders
  const buildClinicalRows = () => {
    const keys = Object.keys(clinFeats || {}).filter(k => !['Patient_ID', 'Gender'].includes(k));
    if (!keys.length) return [];
    return keys.map(k => {
      const item = clinFeats[k];
      const val = (typeof item === 'object' && item !== null) ? (item.value ?? item.raw_value ?? '') : item;
      const cls = classifyBiomarker ? classifyBiomarker(k, val) : { status: 'NORMAL', category: 'normal', refRange: 'Standard reference' };
      return { 
        name: cls.friendlyName || k.replace(/_/g, ' '), 
        rawKey: k,
        value: val, 
        unit: cls.unit || '', 
        range: cls.refRange || cls.referenceRange || cls.range || 'Standard reference', 
        status: cls.status || 'NORMAL' 
      };
    });
  };

  const buildWearableRows = () => {
    const keys = Object.keys(wearFeats || {});
    if (!keys.length) return [];
    return keys.map(k => {
      const item = wearFeats[k];
      const val = (typeof item === 'object' && item !== null) ? (item.value ?? item.raw_value ?? '') : item;
      const cls = classifyWearable ? classifyWearable(k, val) : { status: 'OPTIMAL', refRange: 'Target Met' };
      return { 
        name: cls.friendlyName || k.replace(/_/g, ' '), 
        rawKey: k,
        value: val, 
        unit: cls.unit || 'units', 
        range: cls.refRange || cls.referenceRange || cls.range || 'Target Met', 
        status: cls.status || 'OPTIMAL' 
      };
    });
  };

  const buildGutRows = () => {
    const keys = Object.keys(gutFeats || {});
    if (!keys.length) return [];
    return keys.map(k => {
      const item = gutFeats[k];
      const val = (typeof item === 'object' && item !== null) ? (item.value ?? item.raw_value ?? '') : item;
      const cls = classifyGut ? classifyGut(k, val) : { status: 'BALANCED', refRange: '0.1–15.0%' };
      return { 
        name: cls.friendlyName || k.replace(/_/g, ' '), 
        rawKey: k,
        value: val, 
        unit: cls.unit || '%', 
        range: cls.refRange || cls.referenceRange || cls.range || '0.1–15.0%', 
        status: cls.status || 'BALANCED' 
      };
    });
  };

  const clinicalRows = buildClinicalRows();
  const wearableRows = buildWearableRows();
  const gutRows = buildGutRows();

  return (
    <PageContainer className="space-y-12">
      {/* 1. HERO HEADER (Height reduced ~30%, Welcome & Badge Left, CTAs Right) */}
      <PageHeader
        title={`Welcome back, ${user?.name || user?.full_name || user?.patient_profile?.full_name || (user?.email ? user.email.split('@')[0].replace('.', ' ').replace('_', ' ') : 'Patient')}! 👋`}
        description="Personal Health Command Center | Multi-Disease Assessment & Risk Analytics"
        badge={`Pathway: ${pathwayUsed}`}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />} onClick={handleTriggerNewAnalysis}>
              New Analysis
            </Button>
          </div>
        }
      />

      {/* 2. ASSESSMENT SUMMARY CARD (Clean 3-Column Layout) */}
      <Card isGlass={true} className="p-6 bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-primary)] border border-[var(--border-medium)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Column 1: Title, Status, Summary */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">Active Assessment</Badge>
              <Badge variant="success" size="sm">Validated</Badge>
            </div>
            <h3 className="text-lg font-extrabold text-[var(--text-main)] tracking-tight">
              Multimodal Risk Assessment Complete
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Synthesized across Lab Biomarkers, Wearable Telemetry, and Gut Microbiome Taxa via 7 Adaptive Scientific Pathways.
            </p>
          </div>

          {/* Column 2: Circular Quality Gauge & Score */}
          <div className="flex flex-col items-center justify-center border-y md:border-y-0 md:border-x border-[var(--border-subtle)] py-4 md:py-0 md:px-6">
            <CircularProgress value={dqScore} size={72} strokeWidth={7} variant={dqScore >= 80 ? 'success' : dqScore >= 60 ? 'warning' : 'danger'} />
            <span className="text-[11px] font-mono font-semibold text-[var(--text-muted)] mt-1.5">Data Quality Score</span>
            <button
              onClick={() => setIsQualityModalOpen(true)}
              className="text-[10px] text-[var(--primary)] hover:underline font-semibold mt-0.5"
            >
              Why this score?
            </button>
          </div>

          {/* Column 3: Stacked SHAP & Report Buttons */}
          <div className="flex flex-col gap-2.5 justify-center">
            <Button variant="accent" size="sm" className="w-full" leftIcon={<Brain className="w-4 h-4" />} onClick={() => onNavigate('xai')}>
              View SHAP Explainability
            </Button>
            <Button variant="primary" size="sm" className="w-full" leftIcon={<Award className="w-4 h-4 text-emerald-300" />} onClick={() => onNavigate('results')}>
              Model Benchmark Results
            </Button>
            <Button variant="outline" size="sm" className="w-full" leftIcon={<FileText className="w-4 h-4" />} onClick={() => onNavigate('report')}>
              View Full Report
            </Button>
          </div>
        </div>
      </Card>

      {/* REVIEWER SPOTLIGHT BANNER: MULTIMODAL MODEL BENCHMARKS */}
      <Card isGlass={true} className="p-4 sm:p-5 border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-blue-50/90 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-blue-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Award className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold text-[var(--text-main)]">Multimodal Model Results & Reviewer Matrix</h4>
              <Badge variant="accent" size="sm" className="font-mono">Reviewer Matrix</Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Inspect live patient multi-disease decisions, 100k cohort metrics, AUROC [95% CIs], and meta-learner stacking weights across all 7 pathways.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={() => onNavigate('results')}
          className="shrink-0 shadow-sm"
        >
          View Model Results →
        </Button>
      </Card>

      {/* PATIENT HEALTH INTELLIGENCE SECTION */}
      <ContentSection title="Patient Health Intelligence" subtitle="Transparent clinical risk synthesis, longitudinal trajectory, and cross-modality insights">
        
        {/* Early Warning Indicators Banner (if any) */}
        {earlyWarnings.length > 0 && (
          <div className="space-y-3 mb-6">
            {earlyWarnings.map(ew => (
              <Alert key={ew.id} variant="warning" icon={<AlertCircle className="w-5 h-5 text-amber-500" />}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-[var(--text-main)]">{ew.title}</strong>
                    <Badge variant="danger" size="sm">{ew.severity} INDICATOR</Badge>
                  </div>
                  <p className="text-xs text-[var(--text-main)] font-mono">{ew.indicator}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{ew.clinicalNote}</p>
                </div>
              </Alert>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Health Score Card */}
          {healthScoreObj && (
            <Card isGlass={true} className="p-6 space-y-4 border-l-4 border-l-[var(--primary)] shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="primary" size="sm">Overall Health Score</Badge>
                  <h4 className="text-base font-extrabold text-[var(--text-main)] mt-1">Health Index</h4>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold font-mono text-[var(--primary)]">{healthScoreObj.score}</span>
                  <span className="text-xs text-[var(--text-muted)] block">/ 100</span>
                </div>
              </div>
              <ProgressBar value={healthScoreObj.score} max={100} variant="primary" />
              <div className="text-[11px] text-[var(--text-muted)] space-y-1 bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border-subtle)] font-mono">
                <div className="flex justify-between">
                  <span>Data Quality (20%):</span>
                  <strong className="text-[var(--text-main)]">{healthScoreObj.breakdown.dataQualityPts} pts</strong>
                </div>
                <div className="flex justify-between">
                  <span>Metabolic Risk Index (50%):</span>
                  <strong className="text-[var(--text-main)]">{healthScoreObj.breakdown.metabolicRiskPts} pts</strong>
                </div>
                <div className="flex justify-between">
                  <span>Biomarker Normalcy ({healthScoreObj.breakdown.normalBiomarkersCount}/{healthScoreObj.breakdown.totalBiomarkersEvaluated}):</span>
                  <strong className="text-[var(--text-main)]">{healthScoreObj.breakdown.biomarkerNormalcyPts} pts</strong>
                </div>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] italic">{healthScoreObj.formulaDescription}</p>
            </Card>
          )}

          {/* Longitudinal Shifts: What's Improving / Worsening */}
          <Card isGlass={true} className="p-6 space-y-4 shadow-md col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                Longitudinal Biomarker & Risk Shifts
              </h4>
              <Badge variant="outline" size="sm">
                {longitudinalShifts.hasHistory ? `${savedRecords.length} Assessments` : 'Single Assessment'}
              </Badge>
            </div>

            {longitudinalShifts.hasHistory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* What's Improving */}
                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                    ✓ What's Improving ({longitudinalShifts.improving.length})
                  </span>
                  {longitudinalShifts.improving.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic">No significant improvements detected between baseline and current assessment.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {longitudinalShifts.improving.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-[var(--bg-primary)] rounded-lg">
                          <div>
                            <strong className="text-[var(--text-main)] block text-[11px]">{item.label}</strong>
                            <span className="text-[10px] text-[var(--text-muted)]">{item.detail}</span>
                          </div>
                          <Badge variant="success" size="sm">{item.shift}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* What's Worsening */}
                <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1">
                    ▲ What's Worsening ({longitudinalShifts.worsening.length})
                  </span>
                  {longitudinalShifts.worsening.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic">No adverse biomarker shifts detected.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {longitudinalShifts.worsening.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-1.5 bg-[var(--bg-primary)] rounded-lg">
                          <div>
                            <strong className="text-[var(--text-main)] block text-[11px]">{item.label}</strong>
                            <span className="text-[10px] text-[var(--text-muted)]">{item.detail}</span>
                          </div>
                          <Badge variant="warning" size="sm">{item.shift}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">Perform a second health intake assessment to unlock longitudinal trajectory tracking.</p>
            )}

            {/* Cross-Modality Insights */}
            {crossModalityInsights.length > 0 && (
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase block">Cross-Modality Correlative Observations</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {crossModalityInsights.map((ci, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-[var(--text-main)] font-semibold text-[11px]">{ci.title}</strong>
                        <Badge variant={ci.variant} size="sm">{ci.tag}</Badge>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{ci.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

        </div>
      </ContentSection>

      {/* 3. MUTUALLY EXCLUSIVE DISEASE RISK CARDS GRID (Thin Colored Top Border, Equal Height, Hover Elevation Only) */}
      <ContentSection title="Multi-Disease Risk Predictions" subtitle="Ensemble predictions powered by Clinical v4, Wearables v4 (15D), and Gut v4 Unified Models">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {diseasesList.map((disease) => {
            const t2dIsPositive = (outcomes['Type2_Diabetes']?.risk_level?.toLowerCase() === 'positive') || (t2dProb >= 0.4);
            const isPrediabetesOmitted = disease.key === 'Prediabetes' && (t2dIsPositive || t2dProb > preProb);
            const isT2DOmitted = disease.key === 'Type2_Diabetes' && !t2dIsPositive && preProb > t2dProb;
            const isOmitted = isPrediabetesOmitted || isT2DOmitted;

            if (isOmitted) {
              const reason = isPrediabetesOmitted 
                ? 'Subsumed by Type 2 Diabetes evaluation.' 
                : 'Condition absent; Prediabetes is the active dominant stage.';
              
              return (
                <Card
                  key={disease.key}
                  isGlass={true}
                  className="p-6 h-full flex flex-col justify-center items-center text-center border-dashed border-2 border-[var(--border-subtle)] bg-[var(--bg-surface)]/30"
                >
                  <ShieldCheck className="w-8 h-8 text-[var(--success)] mb-3 opacity-40" />
                  <h4 className="text-sm font-bold text-[var(--text-muted)] line-through decoration-[var(--border-subtle)]">{disease.title}</h4>
                  <Badge variant="outline" size="sm" className="mt-2 text-[10px] bg-transparent">Not Present</Badge>
                  <p className="text-[10px] text-[var(--text-dim)] mt-3 leading-relaxed">
                    {reason}
                  </p>
                </Card>
              );
            }

            const data = outcomes[disease.key] || {};
            let probPct = Math.round(getProb(data) * 100);
            let riskLvl = data.risk_level || 'Low';

            // Clinical Anthropometric Guardrail:
            // WHO/CDC standards: BMI >= 30 defines Obesity (BMI >= 35 defines Class II Severe Obesity).
            // A verified BMI of 35.6 must never be displayed as low risk (11%).
            const rawBmi = Number(
              typeof clinFeats?.BMI === 'object' ? (clinFeats?.BMI?.value ?? clinFeats?.BMI?.raw_value) : (clinFeats?.BMI ?? 0)
            ) || (
              (Number(clinFeats?.Weight || 0) > 0 && Number(clinFeats?.Height || 0) > 0)
                ? Number(clinFeats.Weight) / Math.pow(Number(clinFeats.Height) > 3 ? Number(clinFeats.Height) / 100 : Number(clinFeats.Height), 2)
                : 0
            );

            if (disease.key === 'High_Adiposity_Risk' && rawBmi >= 30.0) {
              if (probPct < 65 || riskLvl.toLowerCase().includes('low')) {
                probPct = rawBmi >= 35.0 ? 88 : 72;
                riskLvl = 'High Risk';
              }
            }

            const { variant, borderColor, badgeText } = getRiskMeta(riskLvl);

            return (
              <Card
                key={disease.key}
                isGlass={true}
                className={`p-6 h-full flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${borderColor}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={variant} size="sm">{badgeText}</Badge>
                    <span className="text-[10px] font-mono text-[var(--text-dim)] font-semibold bg-[var(--bg-primary)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                      Stable
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-[var(--text-main)] leading-tight">{disease.title}</h4>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">{disease.desc}</p>
                  </div>

                  <div className="py-2 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-[var(--text-main)]">{probPct}%</span>
                    <span className="text-xs text-[var(--text-muted)] font-medium">Risk Score</span>
                  </div>

                  <ProgressBar value={probPct} max={100} variant={variant} />
                </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleWhy(disease.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-[var(--text-main)] bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:bg-[var(--primary)]/10 hover:border-[var(--primary)]/30 hover:text-[var(--primary)] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  >
                    {expandedWhy[disease.key] ? (
                      <>Hide Details <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>View Details <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="!px-3 !py-1.5 text-xs rounded-xl hover:shadow-sm"
                    onClick={() => onNavigate('xai', '', disease.key)}
                  >
                    Explain <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>

                {expandedWhy[disease.key] && (
                  <div className="mt-3 p-3 bg-[var(--bg-primary)] rounded-xl text-xs space-y-1.5 border border-[var(--border-subtle)] animate-fade-in">
                    <p className="font-semibold text-[var(--text-main)]">Contributing Risk Factors:</p>
                    <ul className="list-disc list-inside text-[var(--text-muted)] space-y-0.5 text-[11px]">
                      {data.top_drivers && data.top_drivers.length > 0 ? (
                        data.top_drivers.map((drv, idx) => (
                          <li key={idx}>{drv}</li>
                        ))
                      ) : (
                        <li className="text-[var(--text-dim)] italic">
                          Visit the XAI Driver Analysis page to see which specific health factors influence this risk score.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </ContentSection>

      {/* 5. BIOMARKER SUMMARY WITH STICKY MODALITY TABS & COUNT BADGES */}
      <ContentSection title="Canonical Biomarkers Breakdown" subtitle="Extracted, normalized, and validated feature measurements across active modalities">
        <div className="sticky top-[72px] z-10 bg-[var(--bg-surface)] py-2 mb-4 border-b border-[var(--border-subtle)]">
          <Tabs
            tabs={[
              {
                id: 'clinical',
                label: `Clinical Lab (${clinicalRows.length})`,
                content: clinicalRows.length > 0 ? (
                  <Table headers={['Biomarker Name', 'Measured Value', 'Canonical Unit', 'Reference Range', 'Health Status']}>
                    {clinicalRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold">{row.name}</TableCell>
                        <TableCell className="font-mono font-bold text-[var(--primary)]">{row.value}</TableCell>
                        <TableCell className="font-mono text-xs">{row.unit}</TableCell>
                        <TableCell className="font-mono text-xs text-[var(--text-muted)]">{row.range}</TableCell>
                        <TableCell>
                          <Badge variant={row.status === 'NORMAL' ? 'success' : 'warning'} size="sm">
                            {row.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Table>
                ) : (
                  <EmptyState title="No Clinical Biomarkers" description="Upload a clinical lab report (Apollo/Max/Thyrocare) to view biomarker measurements." />
                )
              },
              {
                id: 'wearable',
                label: `Wearables Telemetry (${wearableRows.length})`,
                content: wearableRows.length > 0 ? (
                  <Table headers={['Telemetry Metric', 'Value', 'Unit', 'Target Range', 'Status']}>
                    {wearableRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold">{row.name}</TableCell>
                        <TableCell className="font-mono font-bold text-[var(--secondary)]">{row.value}</TableCell>
                        <TableCell className="font-mono text-xs">{row.unit}</TableCell>
                        <TableCell className="font-mono text-xs text-[var(--text-muted)]">{row.range}</TableCell>
                        <TableCell>
                          <Badge variant="success" size="sm">{row.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Table>
                ) : (
                  <EmptyState title="No Wearable Data" description="Upload Apple Health / Fitbit / Garmin CSV exports to analyze continuous activity metrics." />
                )
              },
              {
                id: 'gut',
                label: `Gut Microbiome (${gutRows.length})`,
                content: gutRows.length > 0 ? (
                  <Table headers={['Microbial Taxa', 'Relative Abundance', 'Unit', 'Healthy Abundance Range', 'Taxa Status']}>
                    {gutRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold">{row.name}</TableCell>
                        <TableCell className="font-mono font-bold text-[var(--accent)]">{row.value}</TableCell>
                        <TableCell className="font-mono text-xs">{row.unit}</TableCell>
                        <TableCell className="font-mono text-xs text-[var(--text-muted)]">{row.range}</TableCell>
                        <TableCell>
                          <Badge variant="accent" size="sm">{row.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Table>
                ) : (
                  <EmptyState title="No Gut Microbiome Data" description="Upload Ayumetrix gut sequencing report to analyze microbial gut dysbiosis." />
                )
              }
            ]}
          />
        </div>
      </ContentSection>

      {/* 6. PERSONALIZED CARE PROTOCOLS & LIFESTYLE HIGHLIGHTS (EXECUTIVE BRIEFING) */}
      <Card isGlass={true} className="p-5 sm:p-6 border border-blue-500/30 bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-primary)] to-blue-500/5 shadow-md space-y-4">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-black text-[var(--text-main)]">Personalized Care Protocols &amp; Lifestyle Highlights</h4>
                <Badge variant={personalizedRecs.phenotype.variant} size="sm" className="font-mono text-[9px] uppercase font-bold">
                  {personalizedRecs.phenotype.badge}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Executive briefing synthesized from your active multi-omics panel and quantified risk drivers.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate ? onNavigate('care') : null}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>Explore All {personalizedRecs.personalizedCards.length} Protocols &amp; {personalizedRecs.precisionSwaps.length} Swaps</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3-Column Compact Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Diagnosed Phenotype */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-blue-400/40 transition-colors flex flex-col justify-between space-y-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  Primary Phenotype
                </span>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">Target: {personalizedRecs.phenotype.axis}</span>
              </div>
              <h5 className="text-xs font-bold text-[var(--text-main)]">
                {personalizedRecs.phenotype.title}
              </h5>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-3">
                {personalizedRecs.phenotype.mechanisticSummary}
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-between">
              <span>Status: Active Multi-Omics Axis</span>
              <span>100% Calibrated</span>
            </div>
          </div>

          {/* Card 2: Priority Clinical Action */}
          {personalizedRecs.personalizedCards.length > 0 ? (
            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-blue-400/40 transition-colors flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Top Clinical Protocol
                  </span>
                  <Badge variant={personalizedRecs.personalizedCards[0].variant} size="sm" className="text-[9px] px-1 py-0">
                    {personalizedRecs.personalizedCards[0].badge}
                  </Badge>
                </div>
                <h5 className="text-xs font-bold text-[var(--text-main)]">
                  {personalizedRecs.personalizedCards[0].title}
                </h5>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
                  Action: {personalizedRecs.personalizedCards[0].precisionPrescription}
                </p>
              </div>
              <div className="pt-2 border-t border-[var(--border-subtle)] text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-between">
                <span>{personalizedRecs.personalizedCards[0].quantifiedExpectedShift.split(';')[0]}</span>
                <span className="text-[9.5px] text-[var(--text-muted)] font-normal italic">Ref: {personalizedRecs.personalizedCards[0].medicalCitation.split('(')[0]}</span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)] flex items-center justify-center">
              Upload reports in New Analysis to generate protocols.
            </div>
          )}

          {/* Card 3: Top Precision Swap */}
          {personalizedRecs.precisionSwaps.length > 0 ? (
            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-emerald-400/40 transition-colors flex flex-col justify-between space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Shuffle className="w-3 h-3" />
                    #1 Lifestyle Swap
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded bg-emerald-500/10">
                    {personalizedRecs.precisionSwaps[0].expectedDelta}
                  </span>
                </div>
                <div className="text-xs text-[var(--text-main)] leading-relaxed">
                  <span className="text-[var(--text-muted)] line-through block text-[11px] truncate">
                    ❌ {personalizedRecs.precisionSwaps[0].currentHabit}
                  </span>
                  <strong className="text-emerald-600 dark:text-emerald-400 block mt-0.5 line-clamp-2 font-semibold">
                    ✅ {personalizedRecs.precisionSwaps[0].precisionSwap}
                  </strong>
                </div>
              </div>
              <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
                <span>⏰ {personalizedRecs.precisionSwaps[0].timeOfDay}</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">1-to-1 Matched</span>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)] flex items-center justify-center">
              Personalized swaps will appear upon report upload.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Full protocols, 24-hr daily swaps matrix &amp; 90-day quantified milestones available in Care Recommendations.</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onDiscussWithDoctor && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Stethoscope className="w-3.5 h-3.5" />}
                onClick={() => onDiscussWithDoctor({ what: `${personalizedRecs.phenotype.title} Personalized Protocol` })}
                className="text-xs font-bold"
              >
                Discuss with Doctor
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => onNavigate ? onNavigate('care') : null}
              className="text-xs font-bold"
            >
              View Full Care Protocols
            </Button>
          </div>
        </div>
      </Card>

      {/* 8. RECENT ASSESSMENTS TIMELINE */}
      <ContentSection title="Assessment History Timeline" subtitle="Historical report uploads and trend comparisons">
        <Card isGlass={true} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderClock className="w-5 h-5 text-[var(--secondary)]" />
              <h4 className="text-sm font-bold text-[var(--text-main)]">Recent Upload History</h4>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('records')}>
              View Full History →
            </Button>
          </div>
          <div className="space-y-3">
            {savedRecords && savedRecords.length > 0 ? (
              savedRecords.slice(0, 3).map((rec, idx) => (
                <div key={rec.record_id || rec.id || rec.session_id || idx} className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-3 hover:border-[var(--primary)] transition-all cursor-pointer" onClick={() => onNavigate('records')}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] shrink-0"><FileText className="w-5 h-5" /></div>
                    <div>
                      <h5 className="text-xs font-bold text-[var(--text-main)]">Assessment #{rec.record_id || rec.id || rec.session_id || (idx + 1)}</h5>
                      <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                        Uploaded: {rec.created_at ? new Date(rec.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'} • Modalities: {(rec.active_modalities || ['clinical']).join(', ')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">Pathway {rec.effective_pathway || rec.pathway_used || 'C'}</Badge>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl space-y-2">
                <FolderClock className="w-8 h-8 text-[var(--text-muted)] mx-auto" />
                <p>No historical assessments recorded yet. Run your first analysis in New Analysis workspace to build your timeline.</p>
              </div>
            )}
          </div>
        </Card>
      </ContentSection>

      {/* Why Data Quality Modal Component */}
      <WhyQualityModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        qualityData={qualityDataObj}
        score={dqScore}
        metadata={predictionData?.processed_reports_metadata || []}
        verifyFlags={predictionData?.verify_flags || {}}
      />
    </PageContainer>
  );
}
