import React, { useState } from 'react';
import { PageHeader, PageContainer, ContentSection } from '../components/layout';
import { Card, Badge, Button, ProgressBar, Tabs, Table } from '../components/ui';
import {
  TrendingUp, TrendingDown, ArrowRight, Printer, Download, FileText,
  Calendar, CheckCircle2, AlertCircle, Activity, Heart, Watch, Dna,
  Sparkles, Sliders, RefreshCw, BarChart3, ChevronRight, ShieldCheck
} from 'lucide-react';

export default function CompareAssessmentsPage({ user, session, predictionData, onNavigate }) {
  const [activeTab, setActiveTab] = useState('comparison');
  const [timeRange, setTimeRange] = useState('6M');
  const [selectedAssessmentA, setSelectedAssessmentA] = useState('ASM-2026-8819');
  const [selectedAssessmentB, setSelectedAssessmentB] = useState('ASM-2026-5201');

  // Available Assessments for Selection
  const assessmentOptions = [
    {
      id: 'ASM-2026-8819',
      date: '2026-08-01',
      label: 'Aug 01, 2026 (Latest - C+W+G)',
      score: 88,
      risk: 'MODERATE (34.2%)',
      riskLevel: 'MODERATE',
      pathway: 'Clinical + Wearable + Gut',
      quality: '96.0%',
      confidence: '94.2%',
    },
    {
      id: 'ASM-2026-7412',
      date: '2026-06-14',
      label: 'Jun 14, 2026 (Mid-year - C+W)',
      score: 79,
      risk: 'LOW (18.5%)',
      riskLevel: 'LOW',
      pathway: 'Clinical + Wearable',
      quality: '92.5%',
      confidence: '92.8%',
    },
    {
      id: 'ASM-2026-5201',
      date: '2026-04-02',
      label: 'Apr 02, 2026 (Baseline - Clinical Only)',
      score: 62,
      risk: 'HIGH (68.0%)',
      riskLevel: 'HIGH',
      pathway: 'Clinical Only',
      quality: '88.0%',
      confidence: '96.1%',
    },
  ];

  const assA = assessmentOptions.find(a => a.id === selectedAssessmentA) || assessmentOptions[0];
  const assB = assessmentOptions.find(a => a.id === selectedAssessmentB) || assessmentOptions[2];

  // Biomarkers Comparison Data (Current vs Previous)
  const biomarkerComparison = [
    {
      name: 'HbA1c (Glycated Hemoglobin)',
      current: '5.8 %',
      previous: '6.4 %',
      diff: '-0.6 %',
      trend: 'improving',
      status: 'Pre-diabetic Zone',
      variant: 'success',
    },
    {
      name: 'Fasting Plasma Glucose',
      current: '105 mg/dL',
      previous: '128 mg/dL',
      diff: '-23 mg/dL',
      trend: 'improving',
      status: 'Slightly Elevated',
      variant: 'success',
    },
    {
      name: 'Resting Heart Rate (RHR)',
      current: '68 bpm',
      previous: '76 bpm',
      diff: '-8 bpm',
      trend: 'improving',
      status: 'Optimal Range',
      variant: 'success',
    },
    {
      name: 'Heart Rate Variability (HRV RMSSD)',
      current: '34 ms',
      previous: '22 ms',
      diff: '+12 ms',
      trend: 'improving',
      status: 'Normal Autonomic Tone',
      variant: 'success',
    },
    {
      name: 'F. prausnitzii Abundance',
      current: '2.8 %',
      previous: '1.2 %',
      diff: '+1.6 %',
      trend: 'improving',
      status: 'SCFA Producer Recovery',
      variant: 'success',
    },
    {
      name: 'Sleep Efficiency',
      current: '86.4 %',
      previous: '78.0 %',
      diff: '+8.4 %',
      trend: 'improving',
      status: 'Good Circadian Rest',
      variant: 'success',
    },
    {
      name: 'Body Mass Index (BMI)',
      current: '24.0 kg/m²',
      previous: '25.6 kg/m²',
      diff: '-1.6 kg/m²',
      trend: 'improving',
      status: 'Healthy Weight',
      variant: 'success',
    },
    {
      name: 'Total Cholesterol',
      current: '192 mg/dL',
      previous: '185 mg/dL',
      diff: '+7 mg/dL',
      trend: 'deteriorating',
      status: 'Slight Increase',
      variant: 'danger',
    },
  ];

  // Disease Progression Trends
  const diseaseProgression = [
    {
      disease: 'Type 2 Diabetes Risk',
      currentProb: 34.2,
      previousProb: 68.0,
      trend: 'Dramatically Improved (-33.8%)',
      status: 'MODERATE RISK',
      variant: 'warning',
    },
    {
      disease: 'Prediabetes Impairment',
      currentProb: 24.5,
      previousProb: 48.2,
      trend: 'Improved (-23.7%)',
      status: 'LOW RISK',
      variant: 'success',
    },
    {
      disease: 'Metabolic Dysbiosis Risk',
      currentProb: 28.0,
      previousProb: 55.4,
      trend: 'Improved (-27.4%)',
      status: 'LOW RISK',
      variant: 'success',
    },
    {
      disease: 'Cardiopulmonary Telemetry',
      currentProb: 14.8,
      previousProb: 32.1,
      trend: 'Improved (-17.3%)',
      status: 'LOW RISK',
      variant: 'success',
    },
  ];

  // AI Narrative Insights
  const aiInsights = [
    {
      title: 'Glycemic Control Milestone',
      desc: 'HbA1c decreased from 6.4% to 5.8% over the past 4 months, reducing 90-day diabetic risk progression by 33.8%.',
      type: 'Improvement',
      variant: 'success',
      icon: TrendingUp,
    },
    {
      title: 'Autonomic HRV Recovery',
      desc: 'Wearable HRV RMSSD increased by 12ms (from 22ms to 34ms), reflecting enhanced parasympathetic stress recovery.',
      type: 'Improvement',
      variant: 'success',
      icon: Watch,
    },
    {
      title: 'Microbiome Dysbiosis Shift',
      desc: 'Gut taxa sequencing showed a 1.6% increase in Faecalibacterium prausnitzii, promoting SCFA anti-inflammatory pathways.',
      type: 'Improvement',
      variant: 'success',
      icon: Dna,
    },
    {
      title: 'Lipid Profile Monitoring',
      desc: 'Total cholesterol rose slightly from 185 mg/dL to 192 mg/dL. Continue monitoring dietary saturated fat intake.',
      type: 'Attention Needed',
      variant: 'warning',
      icon: AlertCircle,
    },
  ];

  // Health Goals Progress
  const healthGoals = [
    { name: 'Weight Goal (Target: 74 kg)', current: 76, target: 74, unit: 'kg', progress: 85, variant: 'primary' },
    { name: 'Daily Activity Target (10,000 steps)', current: 8420, target: 10000, unit: 'steps', progress: 84, variant: 'success' },
    { name: 'Sleep Target (8.0 hrs)', current: 7.5, target: 8.0, unit: 'hrs', progress: 93, variant: 'success' },
    { name: 'Fasting Glucose Target (<100 mg/dL)', current: 105, target: 100, unit: 'mg/dL', progress: 78, variant: 'warning' },
    { name: 'HbA1c Target (<5.6 %)', current: 5.8, target: 5.6, unit: '%', progress: 88, variant: 'warning' },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageContainer className="space-y-8 py-6">
      
      {/* Page Header */}
      <PageHeader
        title="Health Analytics & Assessment Comparison"
        description="Side-by-side longitudinal assessment comparison, biomarker trends, disease progression, and goal tracking"
        badge="Analytics Workspace"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              Print Report
            </Button>
            <Button variant="primary" size="md" leftIcon={<Download className="w-4 h-4" />}>
              Export Comparison PDF
            </Button>
          </div>
        }
      />

      {/* Main Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'comparison', label: 'Side-by-Side Comparison' },
          { id: 'biomarkers', label: 'Biomarker Trends' },
          { id: 'progression', label: 'Disease Progression' },
          { id: 'insights', label: 'AI Narrative Insights' },
          { id: 'goals', label: 'Health Goals' },
        ]}
      />

      {/* TAB 1: SIDE-BY-SIDE ASSESSMENT COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Assessment Selectors */}
          <Card isGlass={true} className="p-6 space-y-4 shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-[var(--primary)] uppercase">Assessment A (Current / Recent)</label>
                <select
                  value={selectedAssessmentA}
                  onChange={(e) => setSelectedAssessmentA(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-main)]"
                >
                  {assessmentOptions.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-[var(--secondary)] uppercase">Assessment B (Previous / Baseline)</label>
                <select
                  value={selectedAssessmentB}
                  onChange={(e) => setSelectedAssessmentB(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-main)]"
                >
                  {assessmentOptions.map(a => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>

            </div>
          </Card>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Assessment A Card */}
            <Card isGlass={true} className="p-6 space-y-4 border-t-4 border-t-[var(--primary)] shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <Badge variant="primary" size="sm">ASSESSMENT A</Badge>
                  <h3 className="text-lg font-extrabold text-[var(--text-main)] mt-1">{assA.id}</h3>
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">{assA.date}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-primary)] flex justify-between items-center">
                  <span>Overall Health Score</span>
                  <span className="text-xl font-extrabold font-mono text-[var(--success)]">{assA.score} / 100</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-primary)] flex justify-between items-center">
                  <span>Highest Disease Risk</span>
                  <Badge variant={assA.riskLevel === 'HIGH' ? 'danger' : 'warning'} size="sm">{assA.risk}</Badge>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-primary)] flex justify-between items-center">
                  <span>Modality Pathway</span>
                  <span className="font-mono text-[var(--secondary)]">{assA.pathway}</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-primary)] flex justify-between items-center">
                  <span>AI Model Confidence</span>
                  <span className="font-mono font-bold text-[var(--primary)]">{assA.confidence}</span>
                </div>
              </div>
            </Card>

            {/* Assessment B Card */}
            <Card isGlass={true} className="p-6 space-y-4 border-t-4 border-t-[var(--secondary)] shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <Badge variant="secondary" size="sm">ASSESSMENT B</Badge>
                  <h3 className="text-lg font-extrabold text-[var(--text-main)] mt-1">{assB.id}</h3>
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)]">{assB.date}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-primary)] flex justify-between items-center">
                  <span>Overall Health Score</span>
                  <span className="text-xl font-extrabold font-mono text-[var(--warning)]">{assB.score} / 100</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-primary)] flex justify-between items-center">
                  <span>Highest Disease Risk</span>
                  <Badge variant={assB.riskLevel === 'HIGH' ? 'danger' : 'warning'} size="sm">{assB.risk}</Badge>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-primary)] flex justify-between items-center">
                  <span>Modality Pathway</span>
                  <span className="font-mono text-[var(--secondary)]">{assB.pathway}</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-primary)] flex justify-between items-center">
                  <span>AI Model Confidence</span>
                  <span className="font-mono font-bold text-[var(--primary)]">{assB.confidence}</span>
                </div>
              </div>
            </Card>

          </div>

          {/* Biomarkers Comparison Table */}
          <Card isGlass={true} className="p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-main)]">Detailed Biomarker Differences</h3>
              <Badge variant="success" size="sm">7 Improved, 1 Shifted</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase font-mono text-[10px]">
                    <th className="py-3 px-3">Biomarker / Variable</th>
                    <th className="py-3 px-3">Current (Ass. A)</th>
                    <th className="py-3 px-3">Previous (Ass. B)</th>
                    <th className="py-3 px-3">Difference</th>
                    <th className="py-3 px-3">Trend Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {biomarkerComparison.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[var(--text-main)]">{row.name}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[var(--text-main)]">{row.current}</td>
                      <td className="py-3 px-3 font-mono text-[var(--text-muted)]">{row.previous}</td>
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={row.trend === 'improving' ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                          {row.diff}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={row.variant} size="sm">{row.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      )}

      {/* TAB 2: BIOMARKER TRENDS */}
      {activeTab === 'biomarkers' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Time Range Filter Bar */}
          <div className="flex items-center justify-between bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
            <span className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">Time Horizon</span>
            <div className="flex gap-2">
              {['1M', '3M', '6M', '1Y'].map((t) => (
                <Button
                  key={t}
                  variant={timeRange === t ? 'primary' : 'ghost'}
                  size="sm"
                  className="!py-1 text-xs"
                  onClick={() => setTimeRange(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Card isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--primary)]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--text-main)]">HbA1c Trend (% Glycated Hemoglobin)</span>
                <Badge variant="success" size="sm">Down 0.6%</Badge>
              </div>
              <div className="p-3 bg-[var(--bg-primary)] rounded-lg space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span>Apr 2026: 6.4%</span><span className="text-[var(--danger)]">High</span></div>
                <div className="flex justify-between"><span>Jun 2026: 6.1%</span><span className="text-[var(--warning)]">Elevated</span></div>
                <div className="flex justify-between"><span>Aug 2026: 5.8%</span><span className="text-[var(--success)]">Improving</span></div>
              </div>
            </Card>

            <Card isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--secondary)]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--text-main)]">Fasting Glucose Trend (mg/dL)</span>
                <Badge variant="success" size="sm">Down 23 mg/dL</Badge>
              </div>
              <div className="p-3 bg-[var(--bg-primary)] rounded-lg space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span>Apr 2026: 128 mg/dL</span><span className="text-[var(--danger)]">High</span></div>
                <div className="flex justify-between"><span>Jun 2026: 114 mg/dL</span><span className="text-[var(--warning)]">Elevated</span></div>
                <div className="flex justify-between"><span>Aug 2026: 105 mg/dL</span><span className="text-[var(--success)]">Improving</span></div>
              </div>
            </Card>

            <Card isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--accent)]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--text-main)]">Resting Heart Rate (bpm)</span>
                <Badge variant="success" size="sm">Down 8 bpm</Badge>
              </div>
              <div className="p-3 bg-[var(--bg-primary)] rounded-lg space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span>Apr 2026: 76 bpm</span><span className="text-[var(--warning)]">Elevated</span></div>
                <div className="flex justify-between"><span>Jun 2026: 72 bpm</span><span className="text-[var(--success)]">Normal</span></div>
                <div className="flex justify-between"><span>Aug 2026: 68 bpm</span><span className="text-[var(--success)]">Optimal</span></div>
              </div>
            </Card>

            <Card isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--success)]">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--text-main)]">Sleep Efficiency (%)</span>
                <Badge variant="success" size="sm">Up 8.4%</Badge>
              </div>
              <div className="p-3 bg-[var(--bg-primary)] rounded-lg space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span>Apr 2026: 78.0 %</span><span className="text-[var(--warning)]">Fair</span></div>
                <div className="flex justify-between"><span>Jun 2026: 82.5 %</span><span className="text-[var(--success)]">Good</span></div>
                <div className="flex justify-between"><span>Aug 2026: 86.4 %</span><span className="text-[var(--success)]">Optimal</span></div>
              </div>
            </Card>

          </div>
        </div>
      )}

      {/* TAB 3: DISEASE PROGRESSION */}
      {activeTab === 'progression' && (
        <div className="space-y-6 animate-fade-in">
          <Card isGlass={true} className="p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[var(--text-main)]">Longitudinal Disease Risk Progression</h3>
            <div className="space-y-4">
              {diseaseProgression.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-[var(--text-main)]">{item.disease}</strong>
                    <Badge variant={item.variant} size="sm">{item.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Previous Risk</span>
                      <span className="font-mono text-[var(--danger)]">{item.previousProb}%</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Current Risk</span>
                      <span className="font-mono font-bold text-[var(--success)]">{item.currentProb}%</span>
                    </div>
                  </div>
                  <ProgressBar value={item.currentProb} max={100} variant={item.variant} />
                  <p className="text-[11px] font-mono text-[var(--success)] font-semibold">{item.trend}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: AI INSIGHT NARRATIVE */}
      {activeTab === 'insights' && (
        <div className="space-y-4 animate-fade-in">
          {aiInsights.map((ins, idx) => {
            const Icon = ins.icon;
            return (
              <Card key={idx} isGlass={true} className="p-5 space-y-2 border-l-4 border-l-[var(--primary)] hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-[var(--primary)]" />
                    <h4 className="text-sm font-bold text-[var(--text-main)]">{ins.title}</h4>
                  </div>
                  <Badge variant={ins.variant} size="sm">{ins.type}</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{ins.desc}</p>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 5: HEALTH GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {healthGoals.map((g, idx) => (
              <Card key={idx} isGlass={true} className="p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-[var(--text-main)]">{g.name}</h4>
                  <Badge variant={g.variant} size="sm">{g.progress}% Complete</Badge>
                </div>
                <ProgressBar value={g.progress} max={100} variant={g.variant} />
                <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)]">
                  <span>Current: {g.current} {g.unit}</span>
                  <span>Target: {g.target} {g.unit}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

    </PageContainer>
  );
}
