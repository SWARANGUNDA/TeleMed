import React, { useState, useEffect } from 'react';
import { PageHeader, PageContainer, ContentSection } from '../components/layout';
import { Card, Badge, Button, ProgressBar, Tabs, Table, EmptyState } from '../components/ui';
import {
  TrendingUp, TrendingDown, ArrowRight, Printer, Download, FileText,
  Calendar, CheckCircle2, AlertCircle, Activity, Heart, Watch, Dna,
  Sparkles, Sliders, RefreshCw, BarChart3, ChevronRight, ShieldCheck, GitCompare
} from 'lucide-react';
import { fetchPatientRecords } from '../api/client';

export default function CompareAssessmentsPage({ user, session, predictionData, onNavigate }) {
  const [activeTab, setActiveTab] = useState('comparison');
  const [timeRange, setTimeRange] = useState('6M');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessmentA, setSelectedAssessmentA] = useState('');
  const [selectedAssessmentB, setSelectedAssessmentB] = useState('');

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const res = await fetchPatientRecords();
        const data = res?.records || [];
        setRecords(data);
        if (data.length >= 2) {
          setSelectedAssessmentA(data[0].record_id || 'ASM-0');
          setSelectedAssessmentB(data[1].record_id || 'ASM-1');
        }
      } catch (e) {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  if (loading) {
    return (
      <PageContainer className="space-y-8 py-6">
        <PageHeader
          title="Longitudinal Assessment Comparison"
          description="Side-by-side comparative analysis of historical health assessments"
          badge="Longitudinal Analytics"
        />
        <Card isGlass={true} className="p-8 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)]">Loading historical assessment records...</p>
        </Card>
      </PageContainer>
    );
  }

  if (records.length < 2) {
    return (
      <PageContainer className="space-y-8 py-6">
        <PageHeader
          title="Longitudinal Assessment Comparison"
          description="Side-by-side comparative analysis of historical health assessments"
          badge="Longitudinal Analytics"
        />
        <Card isGlass={true} className="p-8 text-center space-y-4">
          <GitCompare className="w-12 h-12 text-[var(--primary)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--text-main)]">Insufficient Assessment History for Comparison</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Longitudinal comparison requires at least 2 saved health assessments. Perform another analysis in the Intake Workspace to track your health progress over time.
          </p>
          <Button variant="primary" size="md" onClick={() => onNavigate ? onNavigate('intake') : null}>
            Start New Assessment →
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const assessmentOptions = records.map((r, idx) => ({
    id: r.record_id || `ASM-${idx}`,
    date: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : 'N/A',
    label: `${r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Assessment'} (${r.effective_pathway || 'C+W+G'})`,
    score: Math.round(r.data_quality_score ? r.data_quality_score * 100 : 85),
    risk: r.prediction_snapshot?.disease_outcomes?.Type2_Diabetes?.risk_level || 'LOW',
    riskLevel: r.prediction_snapshot?.disease_outcomes?.Type2_Diabetes?.risk_level || 'LOW',
    pathway: r.effective_pathway || 'C+W+G',
    quality: `${Math.round(r.data_quality_score ? r.data_quality_score * 100 : 85)}%`,
    confidence: 'High (V4 Stacked)',
  }));

  const assA = assessmentOptions.find(a => a.id === selectedAssessmentA) || assessmentOptions[0];
  const assB = assessmentOptions.find(a => a.id === selectedAssessmentB) || assessmentOptions[1];

  // Biomarkers Comparison Data (Current vs Previous) derived from records
  const biomarkerComparison = records.length >= 2 ? (() => {
    const r1 = records[0]?.predictions?.confirmed_features?.clinical || records[0]?.predictions?.clinical_features || {};
    const r2 = records[1]?.predictions?.confirmed_features?.clinical || records[1]?.predictions?.clinical_features || {};
    return Object.keys(r1).map(k => {
      const v1 = r1[k];
      const v2 = r2[k];
      return {
        name: k.replace(/_/g, ' '),
        current: `${v1}`,
        previous: `${v2 || 'N/A'}`,
        diff: typeof v1 === 'number' && typeof v2 === 'number' ? (v1 - v2 > 0 ? `+${(v1 - v2).toFixed(1)}` : `${(v1 - v2).toFixed(1)}`) : 'Recorded',
        trend: 'measured',
        status: 'Confirmed',
        variant: 'primary',
      };
    });
  })() : [];

  // Disease Progression Trends derived from real records
  const diseaseProgression = records.length >= 2 ? (() => {
    const r1 = records[0]?.predictions?.disease_outcomes || {};
    const r2 = records[1]?.predictions?.disease_outcomes || {};
    return Object.keys(r1).map(k => {
      const p1 = Math.round((r1[k]?.calibrated_probability || r1[k]?.probability || 0) * 100);
      const p2 = Math.round((r2[k]?.calibrated_probability || r2[k]?.probability || 0) * 100);
      const diff = p1 - p2;
      return {
        disease: `${k.replace(/_/g, ' ')} Risk`,
        currentProb: p1,
        previousProb: p2,
        trend: diff < 0 ? `Improved (${diff}%)` : (diff > 0 ? `Increased (+${diff}%)` : 'Stable'),
        status: r1[k]?.risk_level || 'EVALUATED',
        variant: diff <= 0 ? 'success' : 'warning'
      };
    });
  })() : [];

  // AI Narrative Insights derived from real records
  const aiInsights = records.length >= 2 ? [
    {
      title: 'Multimodal Trajectory Sync',
      desc: `Longitudinal analysis across ${records.length} assessments completed between ${new Date(records[records.length - 1].created_at).toLocaleDateString()} and ${new Date(records[0].created_at).toLocaleDateString()}.`,
      type: 'Longitudinal',
      variant: 'primary',
      icon: TrendingUp
    }
  ] : [];

  const handlePrint = () => {
    window.print();
  };

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
            <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
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
          
          {/* Assessment Picker Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Assessment A Picker */}
            <Card isGlass={true} className="p-6 space-y-4 border-l-4 border-l-[var(--primary)] shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm">Assessment A (Recent)</Badge>
                  <span className="text-xs font-mono text-[var(--text-muted)]">{assA.date}</span>
                </div>
                <Badge variant={assA.riskLevel === 'HIGH' ? 'danger' : 'success'} size="sm">
                  {assA.risk}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-[var(--text-muted)] uppercase block">Select Target Assessment</label>
                <select
                  value={selectedAssessmentA}
                  onChange={(e) => setSelectedAssessmentA(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--primary)]"
                >
                  {assessmentOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label} — {opt.date}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2">
                <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[9px] text-[var(--text-muted)] block uppercase">Pathway</span>
                  <strong className="text-[var(--primary)]">{assA.pathway}</strong>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[9px] text-[var(--text-muted)] block uppercase">Quality</span>
                  <strong className="text-[var(--success)]">{assA.quality}</strong>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[9px] text-[var(--text-muted)] block uppercase">Confidence</span>
                  <strong className="text-[var(--accent)]">{assA.confidence}</strong>
                </div>
              </div>
            </Card>

            {/* Assessment B Picker */}
            <Card isGlass={true} className="p-6 space-y-4 border-l-4 border-l-[var(--secondary)] shadow-xl">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" size="sm">Assessment B (Baseline)</Badge>
                  <span className="text-xs font-mono text-[var(--text-muted)]">{assB.date}</span>
                </div>
                <Badge variant={assB.riskLevel === 'HIGH' ? 'danger' : 'success'} size="sm">
                  {assB.risk}
                </Badge>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-[var(--text-muted)] uppercase block">Select Baseline Assessment</label>
                <select
                  value={selectedAssessmentB}
                  onChange={(e) => setSelectedAssessmentB(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--secondary)]"
                >
                  {assessmentOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label} — {opt.date}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-2">
                <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[9px] text-[var(--text-muted)] block uppercase">Pathway</span>
                  <strong className="text-[var(--secondary)]">{assB.pathway}</strong>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[9px] text-[var(--text-muted)] block uppercase">Quality</span>
                  <strong className="text-[var(--success)]">{assB.quality}</strong>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
                  <span className="text-[9px] text-[var(--text-muted)] block uppercase">Confidence</span>
                  <strong className="text-[var(--accent)]">{assB.confidence}</strong>
                </div>
              </div>
            </Card>

          </div>

          {/* Biomarkers Comparison Matrix Table */}
          <ContentSection title="Biomarker Trajectory Matrix (Assessment A vs B)">
            <Card isGlass={true} className="overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] font-mono uppercase text-[10px] text-[var(--text-muted)]">
                    <tr>
                      <th className="p-3.5">Biomarker / Trajectory</th>
                      <th className="p-3.5">Assessment A (Recent)</th>
                      <th className="p-3.5">Assessment B (Baseline)</th>
                      <th className="p-3.5">Absolute Shift</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] font-medium">
                    {biomarkerComparison.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="p-3.5 font-semibold text-[var(--text-main)]">{row.name}</td>
                        <td className="p-3.5 font-mono text-[var(--primary)] font-bold">{row.current}</td>
                        <td className="p-3.5 font-mono text-[var(--text-muted)]">{row.previous}</td>
                        <td className="p-3.5 font-mono font-bold text-[var(--success)]">{row.diff}</td>
                        <td className="p-3.5">
                          <Badge variant={row.variant} size="sm">{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </ContentSection>
        </div>
      )}

      {/* TAB 2: BIOMARKER TRAJECTORY */}
      {activeTab === 'biomarkers' && (
        <div className="space-y-6 animate-fade-in">
          <ContentSection title="Longitudinal Biomarker Trajectory">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--primary)]">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[var(--text-main)]">Recorded Assessment History</span>
                  <Badge variant="primary" size="sm">{records.length} Assessments</Badge>
                </div>
                <div className="p-3 bg-[var(--bg-primary)] rounded-lg space-y-2 text-xs font-mono">
                  {records.map((r, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : `Assessment ${idx + 1}`}</span>
                      <span className="text-[var(--primary)]">{r.effective_pathway || 'C+W+G'}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </ContentSection>
        </div>
      )}

      {/* TAB 3: DISEASE RISK PROGRESSION */}
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
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Baseline Risk</span>
                      <span className="font-mono text-[var(--danger)]">{item.previousProb}%</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Current Risk</span>
                      <span className="font-mono text-[var(--success)]">{item.currentProb}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: INSIGHTS */}
      {activeTab === 'insights' && (
        <div className="space-y-6 animate-fade-in">
          <Card isGlass={true} className="p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-[var(--text-main)]">AI Longitudinal Narrative Synthesis</h3>
            <div className="space-y-3">
              {aiInsights.map((insight, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-[var(--text-main)]">{insight.title}</strong>
                    <Badge variant={insight.variant} size="sm">{insight.type}</Badge>
                  </div>
                  <p className="text-[var(--text-muted)] leading-relaxed">{insight.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

    </PageContainer>
  );
}
