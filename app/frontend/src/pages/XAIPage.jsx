import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  Brain, RefreshCw, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown,
  Search, Filter, Download, Printer, Copy, Check, ChevronDown, ChevronUp,
  Activity, Watch, Dna, FileText, Info, Sparkles, Layers, ArrowRight, Eye, X,
  HelpCircle, CheckCircle2, Flame, Shield, Stethoscope, SlidersHorizontal,
  LayoutGrid, BarChart3, Table as TableIcon, Lightbulb, MessageSquareQuote
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
  const [copied, setCopied] = useState(false);
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

  // Max absolute SHAP score for relative bar scaling
  const maxAbsShap = useMemo(() => {
    if (allDrivers.length === 0) return 1;
    return Math.max(...allDrivers.map(d => d.absShap), 0.25);
  }, [allDrivers]);

  // Live filter drivers
  const filteredDrivers = useMemo(() => {
    let list = allDrivers;

    // Modality filter
    if (modalityFilter !== 'all') {
      list = list.filter((d) => d.modality === modalityFilter);
    }

    // Direction filter
    if (directionFilter === 'risk') {
      list = list.filter((d) => d.isRiskIncreasing);
    } else if (directionFilter === 'protective') {
      list = list.filter((d) => !d.isRiskIncreasing);
    }

    // Search query
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

  const displayedDrivers = showAllDrivers ? filteredDrivers : filteredDrivers.slice(0, 6);

  // Active Disease Outcome Meta
  const diseaseOutcome = predictionData?.disease_outcomes?.[selectedDisease] || predictionData?.predictions?.[selectedDisease] || {};
  const probVal = diseaseOutcome.probability !== undefined ? diseaseOutcome.probability : (diseaseOutcome.calibrated_probability !== undefined ? diseaseOutcome.calibrated_probability : 0);
  const probPct = Math.round(probVal * 100);
  const rawRiskLvl = diseaseOutcome.risk_level || (probPct >= 60 ? 'High' : probPct >= 30 ? 'Moderate' : 'Low');
  const cleanRiskLvl = rawRiskLvl.replace(/Risk Level/gi, '').trim();

  // Disease Meta Details
  const diseaseInfo = DISEASE_LABELS[selectedDisease] || {
    title: formatDiseaseName(selectedDisease),
    icon: '🩺',
    description: 'Multi-modal predictive risk model synthesizing clinical, wearable, and metagenomic signals.'
  };

  // Toggle card explanation
  const toggleCard = (idx) => {
    setExpandedCards(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Copy Summary Handler
  const handleCopySummary = () => {
    const topRisk = allDrivers.filter(d => d.isRiskIncreasing)[0];
    const topProt = allDrivers.filter(d => !d.isRiskIncreasing)[0];
    const text = `TeleMed AI Health Driver Analysis Report\nCondition: ${diseaseInfo.title}\nRisk Probability: ${probPct}% (${cleanRiskLvl} Risk)\nTop Risk Escalator: ${topRisk ? `${topRisk.displayName} (${topRisk.observedValue})` : 'None'}\nTop Protective Shield: ${topProt ? `${topProt.displayName} (${topProt.observedValue})` : 'None'}\nTotal Biomarkers Evaluated: ${allDrivers.length}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!predictionData) {
    return (
      <PageContainer className="space-y-8">
        <PageHeader
          title="AI Health Driver Analysis"
          description="Understand the exact clinical lab markers, continuous wearable metrics, and gut microbiome factors shaping your prediction."
          badge="Multi-Modal AI Breakdown"
        />
        <Card isGlass={true} className="p-10 text-center space-y-5 border border-[var(--border-medium)]">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-[var(--primary)]">
            <Brain className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-extrabold text-[var(--text-main)]">No Health Assessment Available</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Complete a multimodal health assessment in the Intake Workspace to generate personalized explainability drivers for your lab, wearable, and gut metrics.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              className="px-6 py-2.5 font-bold shadow-lg shadow-indigo-500/20"
              onClick={onStartAnalysis || onNavigateReport}
            >
              Start Multimodal Assessment →
            </Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="AI Health Driver Analysis"
        description="Understand the exact biological and lifestyle signals that influenced your risk prediction — see what factors pushed your score up and what protected you."
        badge="Evidence-Grounded AI"
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant={showGuide ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<HelpCircle className="w-4 h-4" />}
              onClick={() => setShowGuide(prev => !prev)}
            >
              {showGuide ? 'Hide Guide' : 'How To Read This'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              onClick={handleCopySummary}
            >
              {copied ? 'Copied Summary!' : 'Copy Summary'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Print Report
            </Button>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={onNavigateReport}
            >
              Full Clinical Report
            </Button>
          </div>
        }
      />

      {/* Target Condition Selector Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Select Health Assessment Target:
          </span>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {displayDiseases.length} models calibrated
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
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
                className={`flex flex-col text-left p-3 rounded-2xl border transition-all text-xs relative ${
                  isSelected
                    ? 'bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-primary)] border-[var(--primary)] shadow-md ring-2 ring-[var(--primary)]/20'
                    : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--border-medium)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-base">{d.icon || '🩺'}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                    isHigh
                      ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                      : isMod
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-red-500 animate-pulse' : isMod ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    {pPct}%
                  </span>
                </div>
                <strong className={`font-bold truncate mt-0.5 ${isSelected ? 'text-[var(--text-main)] font-extrabold' : 'text-[var(--text-muted)]'}`}>
                  {d.title}
                </strong>
              </button>
            );
          })}
        </div>
      </div>

      {/* EDUCATIONAL GUIDE CALLOUT (COLLAPSIBLE) */}
      {showGuide && (
        <Card isGlass={true} className="p-6 bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-blue-50/80 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800 animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">How to Understand Your Health Drivers</h4>
                <p className="text-xs text-indigo-900/80 dark:text-indigo-300/80">Every health measurement below influenced your final risk probability</p>
              </div>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-xs text-indigo-700 dark:text-indigo-300 hover:underline font-bold"
            >
              Got it, close guide
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-white/70 dark:bg-gray-900/60 border border-red-200 dark:border-red-900/40 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
                <Flame className="w-4 h-4 text-red-500" />
                <span>Risk Escalators (Red / Warm)</span>
              </div>
              <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
                Biomarkers or habits that <strong>pushed your risk score higher</strong>. These are prime targets where personalized lifestyle improvements or clinical care can reduce risk.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/70 dark:bg-gray-900/60 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Protective Shields (Green / Cool)</span>
              </div>
              <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
                Healthy measurements or favorable bacteria that <strong>actively lowered your score</strong>. These are personal biological superpowers you should maintain!
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/70 dark:bg-gray-900/60 border border-blue-200 dark:border-blue-900/40 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span>Impact Strength</span>
              </div>
              <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
                The longer the impact bar, the more weight the AI model assigned to that factor when evaluating your multi-modal profile.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 1: PREDICTION HERO CARD */}
      <Card isGlass={true} className="p-6 bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-primary)] to-[var(--bg-surface)] border border-[var(--border-medium)] shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Col 1: Disease Info */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={cleanRiskLvl === 'High' ? 'danger' : cleanRiskLvl === 'Moderate' ? 'warning' : 'success'}
                size="sm"
                className="font-bold flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {cleanRiskLvl} Risk Profile
              </Badge>
              <Badge variant="accent" size="sm" className="font-mono text-[10px]">
                Pathway: {predictionData?.effective_pathway || 'Clinical + Wearables + Gut'}
              </Badge>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
                <span>{diseaseInfo.icon}</span>
                {diseaseInfo.title} Assessment
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                {diseaseInfo.description}
              </p>
            </div>
          </div>

          {/* Col 2: Risk Probability Wheel */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center py-4 lg:py-0 border-y lg:border-y-0 lg:border-x border-[var(--border-subtle)] px-4">
            <div className="relative flex items-center justify-center">
              <CircularProgress
                value={probPct}
                size={88}
                strokeWidth={8}
                variant={cleanRiskLvl === 'High' ? 'danger' : cleanRiskLvl === 'Moderate' ? 'warning' : 'success'}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-[var(--text-main)] leading-none">{probPct}%</span>
                <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] mt-0.5">Risk</span>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className={`text-xs font-bold ${cleanRiskLvl === 'High' ? 'text-red-500' : cleanRiskLvl === 'Moderate' ? 'text-amber-500' : 'text-emerald-500'}`}>
                {cleanRiskLvl} Probability Band
              </span>
              <p className="text-[10px] text-[var(--text-muted)] font-mono">Calibrated Multi-Modal Model</p>
            </div>
          </div>

          {/* Col 3: Quick Metric Tiles */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Data Quality</span>
              <strong className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {Math.round((predictionData?.data_quality_score || 0.92) * 100)}%
              </strong>
              <span className="text-[10px] text-[var(--text-muted)]">High fidelity signals</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Active Drivers</span>
              <strong className="text-base font-extrabold text-[var(--primary)] block mt-0.5">
                {allDrivers.length}
              </strong>
              <span className="text-[10px] text-[var(--text-muted)]">Biomarkers analyzed</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Risk Escalators</span>
              <strong className="text-base font-extrabold text-red-600 dark:text-red-400 block mt-0.5">
                {riskDriversCount}
              </strong>
              <span className="text-[10px] text-[var(--text-muted)]">Pushed score up</span>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Protective Shields</span>
              <strong className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                {protectiveDriversCount}
              </strong>
              <span className="text-[10px] text-[var(--text-muted)]">Lowered score</span>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION 2: ASSESSMENT PROVENANCE (MODALITY CONTRIBUTION) */}
      <ModalityContributionChart attributions={attributions} selectedDisease={selectedDisease} />

      {/* SECTION 3: INTERACTIVE HEALTH DRIVERS EXPLORER */}
      <ContentSection
        title="Interactive Health Drivers Breakdown"
        subtitle="Explore the exact biological and behavioral factors influencing your assessment, ordered by overall impact."
      >
        <Card isGlass={true} className="p-6 space-y-6 border border-[var(--border-medium)]">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
            {/* Direction Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] self-start lg:self-auto overflow-x-auto">
              <button
                onClick={() => setDirectionFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  directionFilter === 'all'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                All Factors ({allDrivers.length})
              </button>
              <button
                onClick={() => setDirectionFilter('risk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  directionFilter === 'risk'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Risk Escalators ({riskDriversCount})
              </button>
              <button
                onClick={() => setDirectionFilter('protective')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  directionFilter === 'protective'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Protective Shields ({protectiveDriversCount})
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <span className="text-xs font-semibold text-[var(--text-muted)] hidden sm:inline">View Mode:</span>
              <div className="flex items-center gap-1 p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)]">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'cards'
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                  title="Card View (Recommended)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Card Insights</span>
                </button>
                <button
                  onClick={() => setViewMode('barchart')}
                  className={`p-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'barchart'
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                  title="Impact Meter Chart"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Impact Meter</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'table'
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                  title="Clinical Table"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Data Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sub-Filters: Modality Pills & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Modality Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { key: 'all', label: 'All Modalities' },
                { key: 'gut', label: '🧬 Gut Microbiome' },
                { key: 'wearable', label: '⌚ Wearables' },
                { key: 'clinical', label: '🩺 Clinical Labs' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setModalityFilter(m.key)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    modalityFilter === m.key
                      ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)] font-extrabold'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Live Search */}
            <div className="w-full md:w-72 relative">
              <Input
                placeholder="Search biomarker or habit..."
                leftIcon={<Search className="w-4 h-4 text-[var(--primary)]" />}
                rightIcon={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 hover:bg-[var(--bg-surface-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Item count header */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono px-1">
            <span>
              Showing <strong className="text-[var(--text-main)]">{displayedDrivers.length}</strong> of <strong className="text-[var(--text-main)]">{filteredDrivers.length}</strong> drivers
            </span>
            {filteredDrivers.length > 6 && (
              <button
                onClick={() => setShowAllDrivers(prev => !prev)}
                className="text-[var(--primary)] hover:underline font-bold flex items-center gap-1"
              >
                {showAllDrivers ? (
                  <>Show Top 6 <ChevronUp className="w-3.5 h-3.5" /></>
                ) : (
                  <>Show All ({filteredDrivers.length - 6} More) <ChevronDown className="w-3.5 h-3.5" /></>
                )}
              </button>
            )}
          </div>

          {/* VIEW 1: RICH CARD INSIGHTS (DEFAULT & RECOMMENDED) */}
          {viewMode === 'cards' && (
            <div className="space-y-4">
              {displayedDrivers.map((d, idx) => {
                const isExpanded = expandedCards[idx] ?? (idx < 2); // Top 2 auto-expanded
                const impactWidth = Math.min(100, Math.round((d.absShap / maxAbsShap) * 100));

                return (
                  <div
                    key={d.rawName + idx}
                    className={`p-4 rounded-2xl border transition-all ${
                      d.isRiskIncreasing
                        ? 'bg-gradient-to-r from-red-50/20 via-[var(--bg-primary)] to-[var(--bg-primary)] border-red-200/60 dark:border-red-950/50'
                        : 'bg-gradient-to-r from-emerald-50/20 via-[var(--bg-primary)] to-[var(--bg-primary)] border-emerald-200/60 dark:border-emerald-950/50'
                    } hover:shadow-sm`}
                  >
                    {/* Card Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] font-mono font-bold flex items-center justify-center text-[var(--text-muted)]">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-sm font-extrabold text-[var(--text-main)]">
                              <HighlightMatch text={d.displayName} query={searchQuery} />
                            </strong>
                            <Badge
                              variant={d.modality === 'clinical' ? 'primary' : d.modality === 'wearable' ? 'secondary' : 'accent'}
                              size="sm"
                              className="text-[10px]"
                            >
                              {d.modality === 'clinical' ? '🩺 Lab Test' : d.modality === 'wearable' ? '⌚ Wearable' : '🧬 Microbiome'}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {d.category}
                          </span>
                        </div>
                      </div>

                      {/* Observed Value & Impact Badge */}
                      <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <div className="text-right">
                          <div className="text-xs font-mono font-extrabold text-[var(--text-main)]">
                            {d.observedValue} {d.unit}
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                            Ref: {d.refRange}
                          </span>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                          d.isRiskIncreasing
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}>
                          {d.isRiskIncreasing ? <Flame className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                          {d.directionLabel}
                        </span>
                      </div>
                    </div>

                    {/* Proportional Impact Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-mono">
                        <span className="flex items-center gap-1">
                          <strong className={d.impactColor}>{d.impactTier}</strong> on prediction
                        </span>
                        <span>SHAP Influence Score: {d.shapValue > 0 ? `+${d.shapValue.toFixed(3)}` : d.shapValue.toFixed(3)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            d.isRiskIncreasing
                              ? 'bg-gradient-to-r from-amber-500 to-red-500'
                              : 'bg-gradient-to-r from-teal-400 to-emerald-500'
                          }`}
                          style={{ width: `${impactWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Expandable Clinical Meaning & Tip */}
                    <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
                      <button
                        onClick={() => toggleCard(idx)}
                        className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>Hide Plain-English Explanation <ChevronUp className="w-3.5 h-3.5" /></>
                        ) : (
                          <>💡 What does this measurement mean for me? <ChevronDown className="w-3.5 h-3.5" /></>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-2.5 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 animate-fade-in text-xs leading-relaxed">
                          <p className="text-[var(--text-main)]">
                            {d.plainExplanation}
                          </p>
                          <div className="flex items-start gap-2 pt-1 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                            <strong className="text-[var(--primary)] shrink-0">🎯 Actionable Takeaway:</strong>
                            <span>{d.actionTip}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: VISUAL IMPACT METER CHART */}
          {viewMode === 'barchart' && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs font-bold text-[var(--text-muted)] px-2">
                <span className="text-emerald-600 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> ← Protective Shields (Decreases Risk)
                </span>
                <span className="text-red-600 flex items-center gap-1">
                  Risk Escalators (Increases Risk) → <Flame className="w-3.5 h-3.5" />
                </span>
              </div>

              {displayedDrivers.map((d, idx) => {
                const barWidth = Math.min(50, Math.round((d.absShap / maxAbsShap) * 50));

                return (
                  <div
                    key={d.rawName + idx}
                    className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[var(--text-muted)] text-[11px]">#{idx + 1}</span>
                        <strong className="text-[var(--text-main)]">{d.displayName}</strong>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">({d.observedValue} {d.unit})</span>
                      </div>
                      <div className="font-mono text-xs font-extrabold">
                        <span className={d.isRiskIncreasing ? 'text-red-500' : 'text-emerald-500'}>
                          {d.shapValue > 0 ? `+${d.shapValue.toFixed(3)}` : d.shapValue.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    {/* Centered Bidirectional Bar */}
                    <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400 dark:bg-gray-600 z-10" />
                      {d.isRiskIncreasing ? (
                        <div
                          className="absolute top-0 bottom-0 rounded-r-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                          style={{ left: '50%', width: `${barWidth}%` }}
                        />
                      ) : (
                        <div
                          className="absolute top-0 bottom-0 rounded-l-full bg-gradient-to-l from-teal-400 to-emerald-500 transition-all duration-500"
                          style={{ right: '50%', width: `${barWidth}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 3: CLINICAL TABLE */}
          {viewMode === 'table' && (
            <Table headers={['Rank & Biomarker', 'Modality', 'Observed Value', 'Reference Range', 'Direction', 'SHAP Score']}>
              {displayedDrivers.map((d, idx) => (
                <TableRow key={d.rawName + idx}>
                  <TableCell className="font-semibold text-xs">
                    <span className="text-[var(--text-muted)] font-mono mr-1.5">#{idx + 1}</span>
                    <HighlightMatch text={d.displayName} query={searchQuery} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.modality === 'clinical' ? 'primary' : d.modality === 'wearable' ? 'secondary' : 'accent'} size="sm">
                      {d.modality}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-[var(--text-main)] text-xs">
                    {d.observedValue} {d.unit}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[var(--text-muted)]">
                    {d.refRange}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.isRiskIncreasing ? 'danger' : 'success'} size="sm">
                      {d.directionLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-extrabold">
                    <span className={d.isRiskIncreasing ? 'text-red-500' : 'text-emerald-500'}>
                      {d.shapValue > 0 ? `+${d.shapValue.toFixed(3)}` : d.shapValue.toFixed(3)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}

          {/* Bottom Show More Button */}
          {filteredDrivers.length > 6 && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllDrivers(prev => !prev)}
                className="font-bold"
              >
                {showAllDrivers ? 'Show Top 6 Drivers Only' : `View All ${filteredDrivers.length} Analyzed Factors`}
              </Button>
            </div>
          )}
        </Card>
      </ContentSection>

      {/* SECTION 4: CLINICAL INTERPRETATION & ACTIONABLE SUMMARY */}
      <ContentSection
        title="Clinical Narrative & Executive Summary"
        subtitle="A synthesized medical interpretation of your primary risk drivers and biological strengths."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Primary Risk Escalators */}
          <Card isGlass={true} className="p-6 space-y-4 border border-red-200/60 dark:border-red-950/40">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                <Flame className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[var(--text-main)]">Primary Risk Drivers</h4>
                <p className="text-[11px] text-[var(--text-muted)]">Priority areas where changes will yield the greatest impact</p>
              </div>
            </div>

            <div className="space-y-3">
              {allDrivers.filter(d => d.isRiskIncreasing).slice(0, 3).map((d, idx) => (
                <div key={idx} className="p-3.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-[var(--text-main)]">{d.displayName}</strong>
                    <span className="text-[11px] font-mono font-extrabold text-red-500">
                      +{d.shapValue.toFixed(3)} SHAP
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {d.plainExplanation}
                  </p>
                  <div className="text-[11px] text-red-700 dark:text-red-300 pt-1 font-medium">
                    🎯 Focus: {d.actionTip}
                  </div>
                </div>
              ))}
              {allDrivers.filter(d => d.isRiskIncreasing).length === 0 && (
                <div className="p-4 rounded-xl bg-[var(--bg-primary)] text-center text-xs text-[var(--text-muted)]">
                  No significant risk escalators identified for this target condition.
                </div>
              )}
            </div>
          </Card>

          {/* Right: Personal Biological Shields */}
          <Card isGlass={true} className="p-6 space-y-4 border border-emerald-200/60 dark:border-emerald-950/40">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[var(--text-main)]">Protective Strengths</h4>
                <p className="text-[11px] text-[var(--text-muted)]">Biological shields and healthy habits actively protecting you</p>
              </div>
            </div>

            <div className="space-y-3">
              {allDrivers.filter(d => !d.isRiskIncreasing).slice(0, 3).map((d, idx) => (
                <div key={idx} className="p-3.5 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-[var(--text-main)]">{d.displayName}</strong>
                    <span className="text-[11px] font-mono font-extrabold text-emerald-500">
                      {d.shapValue.toFixed(3)} SHAP
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {d.plainExplanation}
                  </p>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 pt-1 font-medium">
                    ✨ Keep it up: {d.actionTip}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Doctor Consultation & Model Transparency Note */}
        <Card isGlass={true} className="p-5 bg-gradient-to-r from-[var(--bg-primary)] to-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-1.5 text-xs">
              <strong className="text-xs font-bold text-[var(--text-main)]">
                Discussing These Drivers With Your Physician
              </strong>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Antigravity's multi-modal AI uses Shapley additive explanations (SHAP) to show how individual biomarkers statistically contributed to your prediction compared to thousands of patient clinical records. 
                These statistical insights are intended to empower your conversation with your doctor, not serve as a standalone diagnostic judgment.
              </p>
              <div className="pt-1 flex items-center gap-2 text-[11px] text-[var(--primary)] font-bold">
                <MessageSquareQuote className="w-3.5 h-3.5" />
                <span>Tip: Bring your top 3 risk drivers to your next routine checkup to discuss personalized lab follow-ups.</span>
              </div>
            </div>
          </div>
        </Card>
      </ContentSection>
    </PageContainer>
  );
}
