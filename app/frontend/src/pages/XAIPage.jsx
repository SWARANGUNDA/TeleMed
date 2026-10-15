import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Brain, RefreshCw, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown,
  Search, Filter, Download, Printer, Copy, Check, ChevronDown, ChevronUp,
  Activity, Watch, Dna, FileText, Info, Sparkles, Layers, ArrowRight, Eye, X,
  HelpCircle, CheckCircle2, Flame, Shield, Stethoscope, SlidersHorizontal,
  LayoutGrid, BarChart3, Table as TableIcon, Lightbulb, MessageSquareQuote, Award,
  GraduationCap, Binary, BookOpen, Scale, Zap, CheckCircle, ExternalLink
} from 'lucide-react';
import HighlightMatch from '../components/ui/HighlightMatch';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge,
  ProgressBar, CircularProgress, Table, TableRow, TableCell, Tabs, Input, EmptyState, Alert
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import { fetchXAIV3 } from '../api/client';
import ModalityContributionChart from '../components/ModalityContributionChart';
import { getFeatureMetadata, formatDiseaseName, DISEASE_LABELS } from '../utils/xaiExplainer';

export default function XAIPage({
  session,
  predictionData,
  xaiData,
  setXaiData,
  initialDisease,
  onNavigateReport,
  onStartAnalysis
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetFromRoute = location.state?.disease || searchParams.get('disease');

  const [selectedDisease, setSelectedDisease] = useState(targetFromRoute || initialDisease || 'Type2_Diabetes');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState('all'); // 'all' | 'clinical' | 'wearable' | 'gut'
  const [directionFilter, setDirectionFilter] = useState('all'); // 'all' | 'risk' | 'protective'
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'barchart' | 'table'
  const [showAllDrivers, setShowAllDrivers] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showVivaDeck, setShowVivaDeck] = useState(false);
  const [vivaTab, setVivaTab] = useState('math'); // 'math' | 'fusion' | 'viva_qa'
  const [copied, setCopied] = useState(false);
  const [copiedViva, setCopiedViva] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});

  const diseases = useMemo(() => [
    { key: 'Type2_Diabetes', title: 'Type 2 Diabetes', icon: '🩺' },
    { key: 'Prediabetes', title: 'Prediabetes Risk', icon: '⚠️' },
    { key: 'High_Adiposity_Risk', title: 'Adiposity & Obesity', icon: '⚖️' },
    { key: 'Metabolic_Syndrome', title: 'Metabolic Syndrome', icon: '🧬' },
    { key: 'NAFLD', title: 'NAFLD Liver Health', icon: '🫀' },
  ], []);

  const displayDiseases = useMemo(() => {
    if (!predictionData) return diseases;
    const outcomes = predictionData.disease_outcomes || predictionData.predictions || {};
    const getProb = (obj, k) => obj[k]?.calibrated_probability ?? obj[k]?.probability ?? (obj[k]?.risk_score || 0);
    const t2dProb = getProb(outcomes, 'Type2_Diabetes');
    const preProb = getProb(outcomes, 'Prediabetes');
    const t2dIsPositive = (outcomes['Type2_Diabetes']?.risk_level?.toLowerCase() === 'positive') || (t2dProb >= 0.4);

    return diseases.filter(d => {
      if (d.key === 'Prediabetes' && (t2dIsPositive || t2dProb > preProb)) return false;
      if (d.key === 'Type2_Diabetes' && !t2dIsPositive && preProb > t2dProb) return false;
      return true;
    });
  }, [predictionData, diseases]);

  useEffect(() => {
    if (predictionData && !displayDiseases.some(d => d.key === selectedDisease)) {
      setSelectedDisease(displayDiseases[0].key);
    }
  }, [predictionData, displayDiseases, selectedDisease]);

  useEffect(() => {
    if (targetFromRoute) {
      setSelectedDisease(targetFromRoute);
    } else if (initialDisease) {
      setSelectedDisease(initialDisease);
    }
  }, [targetFromRoute, initialDisease]);

  useEffect(() => {
    loadXAIV3(selectedDisease);
  }, [selectedDisease, session, predictionData]);

  const loadXAIV3 = async (diseaseKey) => {
    const clinData = session?.confirmed_features?.clinical 
      || predictionData?.confirmed_features?.clinical 
      || predictionData?.clinical_features 
      || predictionData?.clinical_data 
      || predictionData?.input_data?.clinical 
      || predictionData?.expert_outputs?.clinical?.raw_input 
      || (typeof predictionData?.expert_outputs?.clinical === 'object' ? predictionData?.expert_outputs?.clinical : null);

    const wearData = session?.confirmed_features?.wearable 
      || predictionData?.confirmed_features?.wearable 
      || predictionData?.wearable_features 
      || predictionData?.wearable_data 
      || predictionData?.input_data?.wearable 
      || predictionData?.expert_outputs?.wearable?.raw_input 
      || (typeof predictionData?.expert_outputs?.wearable === 'object' ? predictionData?.expert_outputs?.wearable : null);

    const gutData = session?.confirmed_features?.gut 
      || predictionData?.confirmed_features?.gut 
      || predictionData?.gut_features 
      || predictionData?.gut_data 
      || predictionData?.input_data?.gut 
      || predictionData?.expert_outputs?.gut?.raw_input 
      || (typeof predictionData?.expert_outputs?.gut === 'object' ? predictionData?.expert_outputs?.gut : null);

    const cleanClin = (clinData && Object.keys(clinData).length > 0) ? clinData : null;
    const cleanWear = (wearData && Object.keys(wearData).length > 0) ? wearData : null;
    const cleanGut = (gutData && Object.keys(gutData).length > 0) ? gutData : null;

    if (!cleanClin && !cleanWear && !cleanGut) {
      if (setXaiData) setXaiData(null);
      return;
    }

    const payload = session?.v3_payload || {
      patient_id: session?.session_id || predictionData?.patient_id || 'P_USER_001',
      clinical_data: cleanClin,
      wearable_data: cleanWear,
      gut_data: cleanGut,
    };

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchXAIV3(payload, diseaseKey);
      if (setXaiData) {
        setXaiData(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Explainability attributions could not be generated.');
    } finally {
      setLoading(false);
    }
  };

  const attributions = xaiData?.attributions || xaiData?.attributions_by_modality || (xaiData?.clinical || xaiData?.wearable ? xaiData : {});

  // Extract all drivers across active modalities and enrich with plain-language metadata
  const allDrivers = useMemo(() => {
    const list = [];
    ['gut', 'wearable', 'clinical'].forEach((mod) => {
      const modObj = attributions[mod] || {};
      const feats = modObj.all_features || modObj.top_risk_drivers || modObj.drivers || [];
      feats.forEach((f) => {
        const shapVal = typeof f === 'number' ? f : (f.shap_attribution ?? f.shap_value ?? f.attribution ?? f.shap ?? 0);
        const fName = typeof f === 'string' ? f : (f.feature_name || f.feature || f.name || 'Feature');
        const fVal = typeof f === 'object' && f !== null ? (f.value ?? f.observed_value ?? f.raw_value ?? 'N/A') : 'N/A';
        
        const enriched = getFeatureMetadata(fName, mod, fVal, shapVal, selectedDisease);
        if (enriched) {
          list.push(enriched);
        }
      });
    });

    return list.sort((a, b) => b.absShap - a.absShap);
  }, [attributions, selectedDisease]);

  const riskDriversCount = useMemo(() => allDrivers.filter(d => d.isRiskIncreasing).length, [allDrivers]);
  const protectiveDriversCount = useMemo(() => allDrivers.filter(d => !d.isRiskIncreasing).length, [allDrivers]);

  // Net Cumulative SHAP Directional Force
  const netShapForce = useMemo(() => {
    return allDrivers.reduce((acc, d) => acc + d.shapValue, 0);
  }, [allDrivers]);

  // Max absolute SHAP score for relative bar scaling
  const maxAbsShap = useMemo(() => {
    if (allDrivers.length === 0) return 1;
    return Math.max(...allDrivers.map(d => d.absShap), 0.25);
  }, [allDrivers]);

  // Live filter drivers
  const filteredDrivers = useMemo(() => {
    let list = allDrivers;

    if (modalityFilter !== 'all') {
      list = list.filter((d) => d.modality === modalityFilter);
    }

    if (directionFilter === 'risk') {
      list = list.filter((d) => d.isRiskIncreasing);
    } else if (directionFilter === 'protective') {
      list = list.filter((d) => !d.isRiskIncreasing);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    const tokens = q.split(/\s+/).filter(Boolean);

    return list
      .map((d) => {
        const targetStr = `${d.displayName} ${d.rawName} ${d.modality} ${d.category} ${d.observedValue} ${d.refRange} ${d.directionLabel}`.toLowerCase();
        let score = 0;
        let allMatch = true;

        for (const token of tokens) {
          if (targetStr.includes(token)) {
            score += 10;
            if (d.displayName.toLowerCase().includes(token)) score += 20;
            if (d.displayName.toLowerCase().startsWith(token)) score += 15;
          } else {
            allMatch = false;
          }
        }

        if (!allMatch) return null;
        if (targetStr.includes(q)) score += 50;
        return { item: d, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || b.item.absShap - a.item.absShap)
      .map((entry) => entry.item);
  }, [allDrivers, modalityFilter, directionFilter, searchQuery]);

  const displayedDrivers = showAllDrivers ? filteredDrivers : filteredDrivers.slice(0, 8);

  // Active Disease Outcome Meta
  const diseaseOutcome = predictionData?.disease_outcomes?.[selectedDisease] || predictionData?.predictions?.[selectedDisease] || {};
  const probVal = diseaseOutcome.probability !== undefined ? diseaseOutcome.probability : (diseaseOutcome.calibrated_probability !== undefined ? diseaseOutcome.calibrated_probability : 0);
  const probPct = Math.round(probVal * 100);
  const rawRiskLvl = String(diseaseOutcome.risk_level || '').trim();
  const normalizedRisk = useMemo(() => {
    const lower = rawRiskLvl.toLowerCase();
    if (lower.includes('high') || lower.includes('positive') || probPct >= 60) return 'High';
    if (lower.includes('mod') || lower.includes('elevated') || (probPct >= 30 && probPct < 60)) return 'Moderate';
    return 'Low';
  }, [rawRiskLvl, probPct]);

  // Disease Meta Details
  const diseaseInfo = DISEASE_LABELS[selectedDisease] || {
    title: formatDiseaseName(selectedDisease),
    icon: '🩺',
    description: 'Multi-modal predictive risk model synthesizing clinical, wearable, and metagenomic signals.'
  };

  const toggleCard = (idx) => {
    setExpandedCards(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handleCopySummary = () => {
    const topRisk = allDrivers.filter(d => d.isRiskIncreasing)[0];
    const topProt = allDrivers.filter(d => !d.isRiskIncreasing)[0];
    const text = `TeleMed AI Health Driver Analysis Report\nCondition: ${diseaseInfo.title}\nRisk Probability: ${probPct}% (${normalizedRisk} Risk)\nTop Risk Escalator: ${topRisk ? `${topRisk.displayName} (${topRisk.observedValue} ${topRisk.unit}) [SHAP +${topRisk.shapValue.toFixed(3)}]` : 'None'}\nTop Protective Shield: ${topProt ? `${topProt.displayName} (${topProt.observedValue} ${topProt.unit}) [SHAP ${topProt.shapValue.toFixed(3)}]` : 'None'}\nTotal Biomarkers Evaluated: ${allDrivers.length}\nEffective Pathway: ${predictionData?.effective_pathway || 'C+W+G'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyViva = () => {
    const text = `TELEMED V4 XAI ARCHITECTURE — COLLEGE PROJECT DEFENSE CHEAT SHEET
1. Explainability Framework: TreeSHAP (Lundberg et al., Nature MI 2020) + LinearSHAP.
2. Formulation: f(x) = E[f(X)] + sum(phi_i), guaranteeing Local Accuracy & Additive Efficiency.
3. Computational Complexity: O(TLD^2) exact computation (vs heuristic, unstable sampling in LIME).
4. Current Condition Evaluated: ${diseaseInfo.title}
5. Calibrated Risk Score: ${probPct}% (${normalizedRisk} Band) via Isotonic Calibration.
6. Multimodal Stacking: Level-0 Expert Classifiers -> Meta-Learner (Logistic Regression) with pathway fallback.
7. Clinical Rationale: Fasting labs set diagnostic anchor; Wearables capture postprandial glycemic CV; Gut taxa indicate systemic inflammation and mucosal barrier stability.`;
    navigator.clipboard.writeText(text);
    setCopiedViva(true);
    setTimeout(() => setCopiedViva(false), 2000);
  };

  if (!predictionData) {
    return (
      <PageContainer className="space-y-6 max-w-7xl mx-auto">
        <PageHeader
          title="Explainable AI (XAI) Health Drivers"
          description="Decompose multi-modal prediction outputs into exact mathematical feature attributions using TreeSHAP and LinearSHAP."
          badge="V4 Explainability Engine"
        />
        <Card isGlass={true} className="p-8 text-center space-y-4 border border-[var(--border-medium)] bg-[var(--bg-card)]">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
            <Brain className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-black text-[var(--text-main)]">No Active Health Assessment Found</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Upload patient clinical records, continuous wearable telemetry, or gut microbiome profiles in the Intake Workspace to generate live SHAP driver attributions.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              className="px-5 py-2 font-bold shadow-md shadow-indigo-500/20"
              onClick={onStartAnalysis || onNavigateReport}
            >
              Start Intake Assessment →
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-6 max-w-7xl mx-auto">
      {/* PAGE HEADER WITH ACADEMIC VIVA ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800">
              Shapley Additive exPlanations (SHAP)
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">
              Model: V4 Multimodal Stacking
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            XAI Biomarker Driver Analysis
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-2xl">
            Mathematical decomposition of risk predictions: inspect positive risk escalators (+&phi;) and protective biological shields (-&phi;).
          </p>
        </div>

        {/* Compact Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowVivaDeck(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              showVivaDeck
                ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white ring-2 ring-indigo-400/40'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 hover:bg-indigo-100'
            }`}
            title="Toggle Examiner Defense & Project Review Notes"
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>{showVivaDeck ? 'Hide Reviewer Notes' : '🎓 Project Review Deck'}</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 px-2.5"
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopySummary}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 px-2.5"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
          >
            Print
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="text-xs h-8 px-3 font-bold"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={onNavigateReport}
          >
            Clinical Report
          </Button>
        </div>
      </div>

      {/* 🎓 COLLEGE PROJECT REVIEW / EXAMINER VIVA DECK (COLLAPSIBLE COMPONENT) */}
      {showVivaDeck && (
        <Card isGlass={true} className="p-4 rounded-2xl border-2 border-indigo-400/40 dark:border-indigo-600/40 bg-gradient-to-br from-indigo-50/90 via-[var(--bg-surface)] to-purple-50/80 dark:from-indigo-950/40 dark:via-gray-900 dark:to-purple-950/30 shadow-md animate-fade-in space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60 dark:border-indigo-800/60">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                <GraduationCap className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2">
                  Examiner & Viva Review Highlights
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-200/60 dark:bg-indigo-800/60 text-indigo-900 dark:text-indigo-200">
                    Defense Ready
                  </span>
                </h3>
                <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                  Quick scientific references to answer external examiner questions during college project reviews.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyViva}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-1 cursor-pointer shadow-xs"
              >
                {copiedViva ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedViva ? 'Copied Viva Script!' : 'Copy Viva Defense Script'}</span>
              </button>
              <button
                onClick={() => setShowVivaDeck(false)}
                className="p-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-tabs within Viva Deck */}
          <div className="flex items-center gap-1.5 border-b border-indigo-200/40 dark:border-indigo-800/40 pb-1.5">
            {[
              { id: 'math', label: '1. Mathematical Foundation (TreeSHAP)', icon: Binary },
              { id: 'fusion', label: '2. Multimodal Fusion Architecture', icon: Layers },
              { id: 'viva_qa', label: '3. Examiner Q&A Cheat Sheet', icon: BookOpen },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = vivaTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setVivaTab(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Mathematical Foundation */}
          {vivaTab === 'math' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-white/90 dark:bg-gray-900/80 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                <span className="font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-indigo-500" />
                  Additive Efficiency Axiom
                </span>
                <p className="text-[11px] text-gray-700 dark:text-gray-300 font-mono">
                  f(x) = &phi;₀ + &sum;(&phi;ᵢ)
                </p>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  The model prediction equals the expected base rate (&phi;₀) plus the sum of all individual biomarker Shapley attributions (&phi;ᵢ). No attribution mass is leaked.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/90 dark:bg-gray-900/80 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                <span className="font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <Binary className="w-3.5 h-3.5 text-indigo-500" />
                  Why TreeSHAP over LIME?
                </span>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                  Complexity: O(T &middot; L &middot; D²)
                </p>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  LIME samples perturbations heuristically, producing unstable, non-deterministic explanations. TreeSHAP computes exact expectations across all tree paths in polynomial time.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/90 dark:bg-gray-900/80 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                <span className="font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-indigo-500" />
                  Directional Polarity
                </span>
                <p className="text-[11px] text-rose-700 dark:text-rose-300 font-mono">
                  &phi;ᵢ &gt; 0 (Risk) vs &phi;ᵢ &lt; 0 (Shield)
                </p>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Positive attributions (red/warm) drive the probability above average; negative attributions (emerald/cool) provide protective dampening towards safety.
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Multimodal Architecture */}
          {vivaTab === 'fusion' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3 rounded-xl bg-white/90 dark:bg-gray-900/80 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                <span className="font-black text-violet-700 dark:text-violet-300 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-violet-500" />
                  Clinical Modality (Anchor)
                </span>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  18 standard clinical lab features (HbA1c, Fasting Glucose, Lipids, ALT/AST) serve as primary diagnostic anchors (65%–95% meta-learner weight depending on disease).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/90 dark:bg-gray-900/80 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                <span className="font-black text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                  <Watch className="w-3.5 h-3.5 text-cyan-500" />
                  Wearable Telemetry (Dynamic)
                </span>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  15 features capturing continuous glucose variability (CGM CV, TIR, TAR) and autonomic tone (HRV RMSSD, sleep) catch early dysfunction missed by static labs.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/90 dark:bg-gray-900/80 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                <span className="font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <Dna className="w-3.5 h-3.5 text-emerald-500" />
                  Gut Metagenomics (Multiomics)
                </span>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  40 bacterial taxa relative abundance & SCFA indices provide mucosal barrier and chronic inflammatory signals (+0.036 AUROC gain in remote triage).
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Examiner Q&A */}
          {vivaTab === 'viva_qa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-white/90 dark:bg-gray-900/80 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                <strong className="text-indigo-900 dark:text-indigo-200 font-bold block">
                  Q: Why not rely on a single modality like clinical blood tests?
                </strong>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  <strong>A:</strong> Static blood tests suffer from medication masking (treated patients have normal fasting sugar) and miss postprandial glycemic excursions and gut dysbiosis. Multimodal fusion reduces false negatives by +3.8% to +6.2%.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/90 dark:bg-gray-900/80 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                <strong className="text-indigo-900 dark:text-indigo-200 font-bold block">
                  Q: How do you handle missing modalities in clinical deployment?
                </strong>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  <strong>A:</strong> Our platform features a 7-pathway scientific router (C, W, G, C+W, C+G, W+G, C+W+G). When wearables or gut samples are missing, the router dynamically switches pathways with calibrated confidence scaling.
                </p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* TARGET CONDITION SELECTOR (COMPACT PILL STRIP) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            Active Target Model:
          </span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            Isotonically Calibrated (Brier Score &lt; 0.08)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {displayDiseases.map((d) => {
            const isSelected = selectedDisease === d.key;
            const outcome = predictionData?.disease_outcomes?.[d.key] || predictionData?.predictions?.[d.key] || {};
            const pVal = outcome.probability !== undefined ? outcome.probability : (outcome.calibrated_probability || 0);
            const pPct = Math.round(pVal * 100);
            const isHigh = pPct >= 60;
            const isMod = pPct >= 30 && pPct < 60;

            return (
              <button
                key={d.key}
                onClick={() => setSelectedDisease(d.key)}
                className={`flex items-center justify-between p-2.5 px-3 rounded-xl border transition-all text-xs cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-indigo-500/5 border-indigo-500 dark:border-indigo-400 shadow-sm ring-1 ring-indigo-500/40'
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-primary)]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base leading-none">{d.icon}</span>
                  <span className={`font-bold truncate text-xs ${isSelected ? 'text-[var(--text-main)] font-black' : 'text-[var(--text-muted)]'}`}>
                    {d.title}
                  </span>
                </div>

                <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border shrink-0 ${
                  isHigh
                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                    : isMod
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                }`}>
                  {pPct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* COMPACT EXECUTIVE RISK GAUGE & METRIC TILES */}
      <Card isGlass={true} className="p-4 bg-[var(--bg-surface)] border border-[var(--border-medium)] shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Col 1: Selected Disease Overview */}
          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-2xs ${
                normalizedRisk === 'High'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800'
                  : normalizedRisk === 'Moderate'
                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${normalizedRisk === 'High' ? 'bg-rose-500 animate-pulse' : normalizedRisk === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {normalizedRisk} Risk Tier
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                Pathway: {predictionData?.effective_pathway || 'C+W+G'}
              </span>
            </div>

            <h2 className="text-lg font-black text-[var(--text-main)] flex items-center gap-1.5 tracking-tight">
              <span>{diseaseInfo.icon}</span>
              <span>{diseaseInfo.title}</span>
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-2">
              {diseaseInfo.description}
            </p>
          </div>

          {/* Col 2: Compact Linear Risk Meter with Pin */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center px-2 py-2 lg:py-0 border-y lg:border-y-0 lg:border-x border-[var(--border-subtle)]">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                normalizedRisk === 'High' ? 'text-rose-600 dark:text-rose-400' :
                normalizedRisk === 'Moderate' ? 'text-amber-600 dark:text-amber-400' :
                'text-emerald-600 dark:text-emerald-400'
              }`}>
                {probPct}%
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-bold">
                Calibrated Probability
              </span>
            </div>

            {/* 3-Band Risk Spectrum Bar */}
            <div className="w-full max-w-xs space-y-1">
              <div className="relative h-2 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800 border border-[var(--border-subtle)]">
                <div className="h-full bg-emerald-500" style={{ width: '30%' }} title="Low: 0-29%" />
                <div className="h-full bg-amber-500" style={{ width: '30%' }} title="Moderate: 30-59%" />
                <div className="h-full bg-rose-500" style={{ width: '40%' }} title="High: 60-100%" />
              </div>
              <div className="relative w-full h-2">
                <div
                  className="absolute top-0 -translate-x-1/2 transition-all duration-700 ease-out"
                  style={{ left: `${Math.min(97, Math.max(3, probPct))}%` }}
                >
                  <div className={`w-2 h-2 rounded-full border border-white dark:border-gray-900 shadow-sm ${
                    normalizedRisk === 'High' ? 'bg-rose-600 ring-2 ring-rose-400/50' :
                    normalizedRisk === 'Moderate' ? 'bg-amber-500 ring-2 ring-amber-400/50' :
                    'bg-emerald-500 ring-2 ring-emerald-400/50'
                  }`} />
                </div>
              </div>
              <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)] px-0.5">
                <span className="text-emerald-600 dark:text-emerald-400">Low (&lt;30%)</span>
                <span className="text-amber-600 dark:text-amber-400">Mod (30-59%)</span>
                <span className="text-rose-600 dark:text-rose-400">High (&ge;60%)</span>
              </div>
            </div>
          </div>

          {/* Col 3: 4 Compact Micro-KPI Chips */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Biomarkers</span>
              <strong className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {allDrivers.length} Analyzed
              </strong>
            </div>

            <div className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Net SHAP Force</span>
              <strong className={`text-sm font-black font-mono ${netShapForce >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {netShapForce >= 0 ? `+${netShapForce.toFixed(2)}` : netShapForce.toFixed(2)}
              </strong>
            </div>

            <div className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30">
              <span className="text-[9px] uppercase font-bold text-rose-700 dark:text-rose-300 block flex items-center gap-1">
                <Flame className="w-2.5 h-2.5 text-rose-500" />
                Escalators
              </span>
              <strong className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                {riskDriversCount} Factors
              </strong>
            </div>

            <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30">
              <span className="text-[9px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                Shields
              </span>
              <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {protectiveDriversCount} Factors
              </strong>
            </div>
          </div>
        </div>
      </Card>

      {/* ASSESSMENT PROVENANCE (MODALITY ATTRIBUTION WEIGHTS) */}
      <ModalityContributionChart
        attributions={attributions}
        selectedDisease={selectedDisease}
        predictionData={predictionData}
        effectivePathway={predictionData?.effective_pathway}
        metaLearnerWeights={xaiData?.meta_learner_weights}
      />

      {/* INTERACTIVE SHAP DRIVERS EXPLORER */}
      <div className="space-y-3">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xs">
          {/* Direction Filter Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] text-xs overflow-x-auto">
            <button
              onClick={() => setDirectionFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                directionFilter === 'all'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              All ({allDrivers.length})
            </button>
            <button
              onClick={() => setDirectionFilter('risk')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                directionFilter === 'risk'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <Flame className="w-3 h-3" />
              Risk Escalators ({riskDriversCount})
            </button>
            <button
              onClick={() => setDirectionFilter('protective')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                directionFilter === 'protective'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <Shield className="w-3 h-3" />
              Protective Shields ({protectiveDriversCount})
            </button>
          </div>

          {/* Modality Filter + View Switcher + Search */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Modality selector */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { key: 'all', label: 'All Modalities' },
                { key: 'clinical', label: '🩺 Clinical' },
                { key: 'wearable', label: '⌚ Wearable' },
                { key: 'gut', label: '🧬 Gut' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setModalityFilter(m.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                    modalityFilter === m.key
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/50 dark:border-indigo-600 dark:text-indigo-300'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* View Switcher */}
            <div className="flex items-center p-0.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] text-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1 px-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-xs' : 'text-[var(--text-muted)]'
                }`}
                title="Compact Insights View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compact</span>
              </button>
              <button
                onClick={() => setViewMode('barchart')}
                className={`p-1 px-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'barchart' ? 'bg-indigo-600 text-white shadow-xs' : 'text-[var(--text-muted)]'
                }`}
                title="Diverging Force Meter"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Force Meter</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 px-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-xs' : 'text-[var(--text-muted)]'
                }`}
                title="Structured Matrix Table"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Matrix</span>
              </button>
            </div>

            {/* Search */}
            <div className="w-36 sm:w-48 relative">
              <input
                type="text"
                placeholder="Search biomarker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs py-1 px-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-indigo-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Item Counter Strip */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono px-1">
          <span>
            Displaying <strong className="text-[var(--text-main)]">{displayedDrivers.length}</strong> of <strong className="text-[var(--text-main)]">{filteredDrivers.length}</strong> biomarkers
          </span>
          {filteredDrivers.length > 8 && (
            <button
              onClick={() => setShowAllDrivers(prev => !prev)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              {showAllDrivers ? (
                <>Collapse to Top 8 <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>View All {filteredDrivers.length} Drivers <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>

        {/* VIEW 1: COMPACT INSIGHTS (CLEAN, SMALL, PUBLICATION-GRADE) */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {displayedDrivers.map((d, idx) => {
              const isExpanded = expandedCards[idx] ?? false;
              const impactPct = Math.min(100, Math.round((d.absShap / maxAbsShap) * 100));

              return (
                <div
                  key={d.rawName + idx}
                  className={`p-3 rounded-xl border transition-all duration-200 ${
                    d.isRiskIncreasing
                      ? 'bg-gradient-to-r from-rose-50/25 via-[var(--bg-surface)] to-[var(--bg-surface)] border-rose-200/80 dark:border-rose-950/40 hover:border-rose-400'
                      : 'bg-gradient-to-r from-emerald-50/25 via-[var(--bg-surface)] to-[var(--bg-surface)] border-emerald-200/80 dark:border-emerald-950/40 hover:border-emerald-400'
                  } shadow-2xs hover:shadow-xs`}
                >
                  {/* Top Bar: Rank, Modality, Name, Observed Value, SHAP score */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-md bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[10px] font-mono font-bold flex items-center justify-center text-[var(--text-muted)] shrink-0 mt-0.5">
                        #{idx + 1}
                      </span>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <strong className="text-xs font-black text-[var(--text-main)]">
                            <HighlightMatch text={d.displayName} query={searchQuery} />
                          </strong>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            d.modality === 'clinical' ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300' :
                            d.modality === 'wearable' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300' :
                            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                          }`}>
                            {d.modality === 'clinical' ? 'Lab' : d.modality === 'wearable' ? 'Wearable' : 'Gut'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono mt-0.5">
                          <span>Observed: <strong className="text-[var(--text-main)]">{d.observedValue} {d.unit}</strong></span>
                          <span>&bull;</span>
                          <span>Ref: {d.refRange}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: SHAP Contribution Pill */}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black flex items-center gap-1 shrink-0 ${
                      d.isRiskIncreasing
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}>
                      {d.isRiskIncreasing ? <Flame className="w-2.5 h-2.5 text-rose-500" /> : <Shield className="w-2.5 h-2.5 text-emerald-500" />}
                      <span>{d.shapValue > 0 ? `+${d.shapValue.toFixed(3)}` : d.shapValue.toFixed(3)}</span>
                    </span>
                  </div>

                  {/* Slim 6px Impact Meter */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[9px] text-[var(--text-muted)] font-mono">
                      <span>{d.directionLabel} ({d.impactTier})</span>
                      <span>Impact: {impactPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          d.isRiskIncreasing
                            ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                            : 'bg-gradient-to-r from-teal-400 to-emerald-500'
                        }`}
                        style={{ width: `${impactPct}%` }}
                      />
                    </div>
                  </div>

                  {/* 1-Line Actionable Takeaway */}
                  <div className="mt-2 pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[80%]">
                      {d.actionTip}
                    </span>
                    <button
                      onClick={() => toggleCard(idx)}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 cursor-pointer"
                    >
                      {isExpanded ? 'Less' : 'Why?'}
                    </button>
                  </div>

                  {/* Expandable Clinical Detail */}
                  {isExpanded && (
                    <div className="mt-2 p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] space-y-1 animate-fade-in">
                      <p className="text-[var(--text-main)] leading-relaxed">
                        {d.plainExplanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: BIPOLAR FORCE METER (WATERFALL DIVERGING SHAP CHART) */}
        {viewMode === 'barchart' && (
          <Card isGlass={true} className="p-4 space-y-3 border border-[var(--border-medium)]">
            {/* Calibrated Baseline Ruler */}
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-[var(--bg-surface)] to-rose-500/10 border border-[var(--border-subtle)] flex items-center justify-between text-xs font-black">
              <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>&larr; Protective Shields (-&phi;)</span>
              </span>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                0.00 Neutral Baseline
              </span>

              <span className="text-rose-700 dark:text-rose-300 flex items-center gap-1 text-[11px]">
                <span>Risk Escalators (+&phi;) &rarr;</span>
                <Flame className="w-3.5 h-3.5 text-rose-500" />
              </span>
            </div>

            {/* Diverging Rows */}
            <div className="space-y-1.5">
              {displayedDrivers.map((d, idx) => {
                const barWidth = Math.min(50, Math.round((d.absShap / maxAbsShap) * 50));

                return (
                  <div
                    key={d.rawName + idx}
                    className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-indigo-400 transition-all text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">#{idx + 1}</span>
                        <strong className="text-xs font-bold text-[var(--text-main)] truncate">
                          {d.displayName}
                        </strong>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          ({d.observedValue} {d.unit})
                        </span>
                      </div>

                      <span className={`text-[10px] font-mono font-black ${d.isRiskIncreasing ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {d.shapValue > 0 ? `+${d.shapValue.toFixed(3)}` : d.shapValue.toFixed(3)}
                      </span>
                    </div>

                    {/* Centered Diverging Bar */}
                    <div className="relative h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center">
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-600 z-10" />
                      {d.isRiskIncreasing ? (
                        <div
                          className="absolute top-0 bottom-0 rounded-r-full bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 transition-all duration-500"
                          style={{ left: '50%', width: `${barWidth}%` }}
                        />
                      ) : (
                        <div
                          className="absolute top-0 bottom-0 rounded-l-full bg-gradient-to-l from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-500"
                          style={{ right: '50%', width: `${barWidth}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* VIEW 3: STRUCTURED MATRIX TABLE */}
        {viewMode === 'table' && (
          <Table headers={['#', 'Biomarker Name', 'Modality', 'Observed Value', 'Reference Range', 'Direction', 'SHAP Score']}>
            {displayedDrivers.map((d, idx) => (
              <TableRow key={d.rawName + idx}>
                <TableCell className="font-mono text-xs text-[var(--text-muted)]">#{idx + 1}</TableCell>
                <TableCell className="font-bold text-xs text-[var(--text-main)]">
                  <HighlightMatch text={d.displayName} query={searchQuery} />
                </TableCell>
                <TableCell>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    d.modality === 'clinical' ? 'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300' :
                    d.modality === 'wearable' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300' :
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  }`}>
                    {d.modality}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold text-[var(--text-main)]">
                  {d.observedValue} {d.unit}
                </TableCell>
                <TableCell className="font-mono text-xs text-[var(--text-muted)]">{d.refRange}</TableCell>
                <TableCell>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${d.isRiskIncreasing ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                    {d.directionLabel}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs font-black">
                  <span className={d.isRiskIncreasing ? 'text-rose-500' : 'text-emerald-500'}>
                    {d.shapValue > 0 ? `+${d.shapValue.toFixed(3)}` : d.shapValue.toFixed(3)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        )}
      </div>

      {/* TOP 3 RISK ACCELERATORS VS TOP 3 PROTECTIVE SHIELDS (SIDE-BY-SIDE SUMMARY) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {/* Left: Top 3 Risk Accelerators */}
        <Card isGlass={true} className="p-3.5 space-y-2 border border-rose-200/80 dark:border-rose-950/50 bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 pb-1.5 border-b border-[var(--border-subtle)]">
            <Flame className="w-4 h-4 text-rose-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
              Top Priority Risk Drivers
            </h4>
          </div>

          <div className="space-y-1.5">
            {allDrivers.filter(d => d.isRiskIncreasing).slice(0, 3).map((d, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-[var(--text-main)]">{d.displayName}</strong>
                  <span className="text-[10px] font-mono font-black text-rose-500">
                    +{d.shapValue.toFixed(3)} SHAP
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                  {d.plainExplanation}
                </p>
                <div className="text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                  🎯 Focus: {d.actionTip}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Top 3 Protective Shields */}
        <Card isGlass={true} className="p-3.5 space-y-2 border border-emerald-200/80 dark:border-emerald-950/50 bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 pb-1.5 border-b border-[var(--border-subtle)]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-main)]">
              Top Biological Shields
            </h4>
          </div>

          <div className="space-y-1.5">
            {allDrivers.filter(d => !d.isRiskIncreasing).slice(0, 3).map((d, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-[var(--text-main)]">{d.displayName}</strong>
                  <span className="text-[10px] font-mono font-black text-emerald-500">
                    {d.shapValue.toFixed(3)} SHAP
                  </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">
                  {d.plainExplanation}
                </p>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                  ✨ Strength: {d.actionTip}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* COMPACT CLINICAL DISCLAIMER */}
      <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-start gap-2.5 text-[11px] text-[var(--text-muted)]">
        <Stethoscope className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Academic & Clinical Transparency:</strong> Shapley additive explanations (SHAP) compute marginal feature contributions relative to the training cohort expectation &Eopf;[f(X)]. These statistical attributions highlight priority lifestyle and biomarker intervention areas for review with a licensed medical professional.
        </p>
      </div>
    </PageContainer>
  );
}
