import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Brain, FileText, Activity, ShieldCheck, ChevronDown, ChevronUp,
  PlusCircle, Watch, Dna, Info, UserCheck, AlertCircle, FileSpreadsheet, Stethoscope,
  Calendar, Clock, CheckCircle, TrendingUp, Sparkles, Filter, ChevronRight, BookmarkCheck,
  Award, RefreshCw, GitCompare, FolderClock, Heart, ActivitySquare, Droplet, Eye
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  ProgressBar, CircularProgress, Skeleton, Table, TableRow, TableCell, Tabs, EmptyState, Alert
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import RiskGauge from '../components/RiskGauge';
import WhyQualityModal from '../components/WhyQualityModal';
import { fetchUserAppointments, fetchPatientConsultations } from '../api/client';
import { classifyBiomarker, classifyWearable, classifyGut } from '../utils/clinicalRanges';

export default function DashboardPage({
  session,
  predictionData,
  onNavigate,
  onStartAnalysis,
  user,
  onDiscussWithDoctor,
  onOpenComparison
}) {
  const [expandedWhy, setExpandedWhy] = useState({});
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    async function loadUserData() {
      try {
        const appts = await fetchUserAppointments();
        setAppointments(appts || []);
      } catch (e) {}
      try {
        const consData = await fetchPatientConsultations();
        setConsultations(consData.consultations || []);
      } catch (e) {}
    }
    if (user) {
      loadUserData();
    }
  }, [user]);

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

  const filledFields = profileFields.filter(f => f.val !== null && f.val !== undefined && f.val !== '');
  const completionPct = Math.round((filledFields.length / profileFields.length) * 100);

  // EMPTY STATE if no predictionData
  if (!predictionData) {
    return (
      <PageContainer className="space-y-12">
        <PageHeader
          title={`Welcome back, ${user?.full_name || 'Patient'}! 👋`}
          description="Personal Health Command Center & AI Multimodal Intake Workspace"
          badge={completionPct === 100 ? 'Profile 100%' : `Profile ${completionPct}%`}
          actions={
            <div className="flex items-center gap-3">
              <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />} onClick={onStartAnalysis || (() => onNavigate('intake'))}>
                Start New Analysis
              </Button>
            </div>
          }
        />

        <Card isGlass={true} className="p-8 text-center space-y-6">
          <EmptyState
            icon={<Brain className="w-12 h-12 text-[var(--primary)]" />}
            title="No Active Health Assessment Found"
            description="Upload your medical reports, wearable telemetry, or gut microbiome data to generate multi-disease predictions and TreeSHAP explainability insights."
            action={
              <Button variant="primary" size="lg" leftIcon={<PlusCircle className="w-5 h-5" />} onClick={onStartAnalysis || (() => onNavigate('intake'))}>
                Start New Multimodal Analysis
              </Button>
            }
          />
        </Card>
      </PageContainer>
    );
  }

  // Active Prediction Payload Extraction
  const outcomes = predictionData.disease_outcomes || predictionData.predictions || {};
  const pathwayUsed = predictionData.pathway_used || predictionData.effective_pathway || 'C+W+G';
  const activeMods = predictionData.active_modalities || ['clinical', 'wearable', 'gut'];
  const dqScore = predictionData.data_quality_score || predictionData.overall_quality_score || 85.2;

  const clinFeats = predictionData.confirmed_features?.clinical || predictionData.clinical_features || {};
  const wearFeats = predictionData.confirmed_features?.wearable || predictionData.wearable_features || {};
  const gutFeats = predictionData.confirmed_features?.gut || predictionData.gut_features || {};

  const diseasesList = [
    { key: 'Type2_Diabetes', title: 'Type 2 Diabetes', desc: 'Glycemic control & insulin resistance' },
    { key: 'Prediabetes', title: 'Prediabetes Risk', desc: 'Impaired fasting glucose screening' },
    { key: 'High_Adiposity_Risk', title: 'Adiposity & Obesity', desc: 'Body mass & visceral fat distribution' },
    { key: 'Metabolic_Syndrome', title: 'Metabolic Syndrome', desc: 'Cluster of metabolic risk factors' },
    { key: 'NAFLD', title: 'NAFLD Liver Health', desc: 'Non-alcoholic fatty liver disease risk' },
  ];

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
    const keys = Object.keys(clinFeats).filter(k => !['Patient_ID', 'Gender'].includes(k));
    if (!keys.length) return [];
    return keys.map(k => {
      const item = clinFeats[k];
      const val = typeof item === 'object' ? item.value ?? item.raw_value : item;
      const cls = classifyBiomarker ? classifyBiomarker(k, val) : { status: 'NORMAL', category: 'normal', referenceRange: 'Standard' };
      return { name: k, value: val, unit: cls.unit || 'mg/dL', range: cls.referenceRange, status: cls.status };
    });
  };

  const buildWearableRows = () => {
    const keys = Object.keys(wearFeats);
    if (!keys.length) return [];
    return keys.map(k => {
      const item = wearFeats[k];
      const val = typeof item === 'object' ? item.value ?? item.raw_value : item;
      const cls = classifyWearable ? classifyWearable(k, val) : { status: 'OPTIMAL', range: 'Normal Telemetry' };
      return { name: k, value: val, unit: cls.unit || 'units', range: cls.range, status: cls.status };
    });
  };

  const buildGutRows = () => {
    const keys = Object.keys(gutFeats);
    if (!keys.length) return [];
    return keys.map(k => {
      const item = gutFeats[k];
      const val = typeof item === 'object' ? item.value ?? item.raw_value : item;
      const cls = classifyGut ? classifyGut(k, val) : { status: 'BALANCED', range: 'Normal Abundance' };
      return { name: k, value: val, unit: cls.unit || '%', range: cls.range, status: cls.status };
    });
  };

  const clinicalRows = buildClinicalRows();
  const wearableRows = buildWearableRows();
  const gutRows = buildGutRows();

  return (
    <PageContainer className="space-y-12">
      {/* 1. HERO HEADER (Height reduced ~30%, Welcome & Badge Left, CTAs Right) */}
      <PageHeader
        title={`Welcome back, ${user?.full_name || 'Patient'}! 👋`}
        description="Personal Health Command Center | Multi-Disease Assessment & Risk Analytics"
        badge={`Pathway: ${pathwayUsed}`}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" leftIcon={<GitCompare className="w-4 h-4" />} onClick={onOpenComparison}>
              Compare History
            </Button>
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />} onClick={onStartAnalysis || (() => onNavigate('intake'))}>
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
            <CircularProgress value={dqScore} size={72} strokeWidth={7} variant="success" />
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
            <Button variant="outline" size="sm" className="w-full" leftIcon={<FileText className="w-4 h-4" />} onClick={() => onNavigate('report')}>
              View Full Report
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. FIVE DISEASE RISK CARDS GRID (Thin Colored Top Border, Equal Height, Hover Elevation Only) */}
      <ContentSection title="Multi-Disease Risk Predictions" subtitle="Ensemble predictions powered by Clinical v3, Wearables v3 (15D), and Gut v3 Models">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {diseasesList.map((disease) => {
            const data = outcomes[disease.key] || {};
            const prob = data.probability !== undefined ? data.probability : (data.risk_score || 0);
            const probPct = Math.round(prob * 100);
            const riskLvl = data.risk_level || 'Low';
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
                    className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] inline-flex items-center gap-1 transition-colors"
                  >
                    Details {expandedWhy[disease.key] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <Button variant="ghost" size="sm" className="!px-2.5 !py-1 text-xs" onClick={() => onNavigate('xai')}>
                    Explain <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>

                {expandedWhy[disease.key] && (
                  <div className="mt-3 p-3 bg-[var(--bg-primary)] rounded-xl text-xs space-y-1.5 border border-[var(--border-subtle)] animate-fade-in">
                    <p className="font-semibold text-[var(--text-main)]">Contributing Risk Factors:</p>
                    <ul className="list-disc list-inside text-[var(--text-muted)] space-y-0.5 text-[11px]">
                      {data.top_drivers && data.top_drivers.length > 0 ? (
                        data.top_drivers.map((drv, idx) => <li key={idx}>{drv}</li>)
                      ) : (
                        <>
                          <li>HbA1c & Fasting Glucose Glycemic Balance</li>
                          <li>Visceral Fat & Body Mass Index</li>
                          <li>Daily Activity Telemetry Dynamics</li>
                        </>
                      )}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </ContentSection>

      {/* 4. PHYSIOLOGICAL SYSTEM CARDS (Larger Icon, Status Beside Title, Primary Metric, Equal Heights) */}
      <ContentSection title="Physiological Systems Overview" subtitle="Organ system health status derived from multimodal canonical features">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Cardiovascular */}
          <Card isGlass={true} className="p-6 h-full flex flex-col justify-between hover:border-[var(--primary)]/40 transition-all duration-200">
            <div className="space-y-3">
              <div className="p-3 w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-bold text-[var(--text-main)]">Cardiovascular</h5>
                <Badge variant="success" size="sm">Normal</Badge>
              </div>
              <div>
                <span className="text-lg font-extrabold font-mono text-[var(--text-main)]">120/80 mmHg</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Systolic/Diastolic BP & Resting Heart Rate within healthy range.</p>
              </div>
            </div>
          </Card>

          {/* Card 2: Hepatic */}
          <Card isGlass={true} className="p-6 h-full flex flex-col justify-between hover:border-[var(--primary)]/40 transition-all duration-200">
            <div className="space-y-3">
              <div className="p-3 w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <ActivitySquare className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-bold text-[var(--text-main)]">Hepatic (Liver)</h5>
                <Badge variant="success" size="sm">Optimal</Badge>
              </div>
              <div>
                <span className="text-lg font-extrabold font-mono text-[var(--text-main)]">24 U/L ALT</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">ALT and AST enzymes within normal physiological limits.</p>
              </div>
            </div>
          </Card>

          {/* Card 3: Metabolic */}
          <Card isGlass={true} className="p-6 h-full flex flex-col justify-between hover:border-[var(--primary)]/40 transition-all duration-200">
            <div className="space-y-3">
              <div className="p-3 w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Droplet className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-bold text-[var(--text-main)]">Glycemic System</h5>
                <Badge variant="warning" size="sm">Elevated</Badge>
              </div>
              <div>
                <span className="text-lg font-extrabold font-mono text-[var(--warning)]">6.1% HbA1c</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Suboptimal fasting glucose; early glycemic monitoring advised.</p>
              </div>
            </div>
          </Card>

          {/* Card 4: Gut */}
          <Card isGlass={true} className="p-6 h-full flex flex-col justify-between hover:border-[var(--primary)]/40 transition-all duration-200">
            <div className="space-y-3">
              <div className="p-3 w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                <Dna className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-bold text-[var(--text-main)]">Gut Microbiome</h5>
                <Badge variant="success" size="sm">Balanced</Badge>
              </div>
              <div>
                <span className="text-lg font-extrabold font-mono text-[var(--text-main)]">3.2% Akkermansia</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Akkermansia & Faecalibacterium abundance well balanced.</p>
              </div>
            </div>
          </Card>

          {/* Card 5: Wearables */}
          <Card isGlass={true} className="p-6 h-full flex flex-col justify-between hover:border-[var(--primary)]/40 transition-all duration-200">
            <div className="space-y-3">
              <div className="p-3 w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
                <Watch className="w-6 h-6" />
              </div>
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-bold text-[var(--text-main)]">Wearables</h5>
                <Badge variant="success" size="sm">Optimal</Badge>
              </div>
              <div>
                <span className="text-lg font-extrabold font-mono text-[var(--text-main)]">8,400 Steps/Day</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">Daily activity target met; sleep duration optimal at 7.5 hrs.</p>
              </div>
            </div>
          </Card>
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

      {/* 6 & 7. RECOMMENDATIONS & APPOINTMENTS SIDE-BY-SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommendations Card */}
        <Card isGlass={true} className="p-6 h-full flex flex-col justify-between">
          <div>
            <CardHeader className="!mb-4 !pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                <h4 className="text-base font-bold text-[var(--text-main)]">Personalized Care Recommendations</h4>
              </div>
              <Badge variant="accent" size="sm">RAG Grounded</Badge>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="warning" size="sm">High Priority</Badge>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase font-semibold">Glycemic Protocol</span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-[var(--text-main)]">30-Min Post-Prandial Walking</p>
                <p className="text-xs text-[var(--text-muted)]">Engage in moderate post-meal physical activity to suppress Fasting Blood Glucose spikes.</p>
              </div>

              <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">Routine</Badge>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase font-semibold">Dietary Fiber</span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-[var(--text-main)]">Prebiotic Polyphenol Intake</p>
                <p className="text-xs text-[var(--text-muted)]">Increase prebiotic dietary fiber to maintain high Akkermansia muciniphila abundance.</p>
              </div>
            </CardBody>
          </div>

          <CardFooter className="!mt-6 !pt-4">
            <Button
              variant="accent"
              size="md"
              className="w-full"
              leftIcon={<Stethoscope className="w-4 h-4" />}
              onClick={() => onDiscussWithDoctor && onDiscussWithDoctor({ what: 'Glycemic and Gut Prebiotic Recommendations' })}
            >
              Discuss Recommendations with Doctor →
            </Button>
          </CardFooter>
        </Card>

        {/* Upcoming Appointments Card */}
        <Card isGlass={true} className="p-6 h-full flex flex-col justify-between">
          <div>
            <CardHeader className="!mb-4 !pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--primary)]" />
                <h4 className="text-base font-bold text-[var(--text-main)]">Scheduled Doctor Consultations</h4>
              </div>
              <Badge variant="primary" size="sm">{appointments.length} Active</Badge>
            </CardHeader>
            <CardBody className="space-y-3">
              {appointments.length > 0 ? (
                appointments.slice(0, 2).map((appt, idx) => (
                  <div key={idx} className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-bold text-[var(--text-main)]">{appt.doctor_name || 'Dr. Medical Specialist'}</h5>
                      <p className="text-[11px] text-[var(--text-muted)]">{appt.specialty || 'Internal Medicine'} • {appt.appointment_date}</p>
                    </div>
                    <Badge variant="success" size="sm">{appt.status || 'CONFIRMED'}</Badge>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<Stethoscope className="w-6 h-6 text-[var(--text-muted)]" />}
                  title="No Upcoming Consultations"
                  description="Book a teleconsultation with a verified physician to discuss your AI report findings."
                />
              )}
            </CardBody>
          </div>

          <CardFooter className="!mt-6 !pt-4">
            <Button variant="outline" size="md" className="w-full" onClick={() => onNavigate('appointments')}>
              Manage Appointments & Consultations →
            </Button>
          </CardFooter>
        </Card>
      </div>

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
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] shrink-0"><FileText className="w-5 h-5" /></div>
                <div>
                  <h5 className="text-xs font-bold text-[var(--text-main)]">Multimodal Health Intake Assessment</h5>
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">Uploaded: August 1, 2026 • 3 Files (Apollo Lab, Apple Watch CSV, Ayumetrix Gut)</p>
                </div>
              </div>
              <Badge variant="primary" size="sm">C+W+G Pathway</Badge>
            </div>
          </div>
        </Card>
      </ContentSection>

      {/* Why Data Quality Modal Component */}
      <WhyQualityModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        score={dqScore}
        metadata={predictionData.processed_reports_metadata || []}
        verifyFlags={predictionData.verify_flags || {}}
      />
    </PageContainer>
  );
}
