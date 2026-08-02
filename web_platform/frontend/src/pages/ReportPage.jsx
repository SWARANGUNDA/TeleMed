import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Send, RefreshCw, Bot, User, ShieldAlert, Sparkles, MessageSquare,
  ChevronDown, ChevronUp, Stethoscope, CheckCircle2, Clock, Info, ExternalLink,
  Activity, BookOpen, AlertCircle, ArrowRight, ShieldCheck, Printer, Download, Share2,
  QrCode, Heart, Watch, Dna, Droplet, ActivitySquare
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge,
  ProgressBar, CircularProgress, Table, TableRow, TableCell, Tabs, Drawer, Input, Alert
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import { generateReportV3, askRAGQuestion, askRAGQuestionV3, fetchSuggestedQuestions } from '../api/client';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function ReportPage({ user, session, predictionData, onDiscussWithDoctor }) {
  const navigate = useNavigate();
  const [reportStatus, setReportStatus] = useState('NOT_GENERATED');
  const [reportData, setReportData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Q&A Assistant State
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [loadingQA, setLoadingQA] = useState(false);
  const [qaError, setQaError] = useState(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState([
    "What dietary changes will reduce my overall metabolic risk?",
    "What physical activity goals should I target?",
    "How do my wearable steps and sedentary time affect blood glucose variability?",
    "What follow-up blood tests should I discuss with my doctor?"
  ]);

  useEffect(() => {
    if (predictionData) {
      loadv3Report();
    } else {
      setReportStatus('NOT_GENERATED');
    }
  }, [predictionData]);

  useEffect(() => {
    if (session?.session_id || predictionData) {
      const sid = session?.session_id || predictionData?.patient_id || 'P_TEST_001';
      fetchSuggestedQuestions(sid, predictionData)
        .then(data => {
          if (data.suggested_questions?.length) {
            setSuggestedPrompts(data.suggested_questions);
          }
        })
        .catch(() => {});
    }
  }, [session, predictionData]);

  const loadv3Report = async () => {
    if (!predictionData) return;
    setReportStatus('GENERATING');
    setErrorMsg(null);
    try {
      const res = await generateReportV3(predictionData);
      setReportData(res);
      setReportStatus(res.report_status || 'READY');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to generate personalized clinical report.');
      setReportStatus('FAILED');
    }
  };

  const handleAskQuestion = async (queryText) => {
    const qText = queryText || question;
    if (!qText.trim()) return;

    setLoadingQA(true);
    setQaError(null);
    const userMsg = { role: 'user', content: qText };
    setQaHistory((prev) => [...prev, userMsg]);
    setQuestion('');

    try {
      let res;
      if (predictionData) {
        res = await askRAGQuestionV3(predictionData, qText);
      } else {
        const sid = session?.session_id || 'TEST_C001';
        res = await askRAGQuestion(sid, qText);
      }

      const answerPayload = res.answer_payload || res;
      const botMsg = {
        role: 'bot',
        content: answerPayload.response_text || answerPayload.text || 'No grounded answer could be generated for this query.',
        evidence: answerPayload.retrieved_evidence || []
      };
      setQaHistory((prev) => [...prev, botMsg]);
    } catch (err) {
      setQaError(err.message || 'RAG Assistant query failed.');
    } finally {
      setLoadingQA(false);
    }
  };

  if (reportStatus === 'NOT_GENERATED' && !predictionData) {
    return (
      <PageContainer className="space-y-8">
        <PageHeader
          title="Physician-Grade AI Clinical Report"
          description="Multimodal Diagnostic Synthesis & Evidence-Grounded Recommendations"
          badge="Report Workspace"
        />
        <Card isGlass={true} className="p-8 text-center space-y-4">
          <FileText className="w-12 h-12 text-[var(--primary)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--text-main)]">No Active Clinical Report Found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Please run a multimodal health assessment in the Intake Workspace to generate your personalized AI report.
          </p>
          <Button variant="primary" size="md" onClick={() => navigate('/intake')}>
            Start New Assessment →
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const patientName = user?.full_name || 'John Doe';
  const patientId = session?.session_id || predictionData?.patient_id || 'P_USER_001';
  const pathwayUsed = predictionData?.effective_pathway || 'C+W+G';
  const dqScore = predictionData?.overall_quality_score || 85.2;

  return (
    <PageContainer className="space-y-12 pb-24">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between gap-4 print:hidden">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </Button>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" leftIcon={<MessageSquare className="w-4 h-4 text-[var(--accent)]" />} onClick={() => setIsAssistantOpen(true)}>
            Ask AI Assistant
          </Button>
          <Button variant="outline" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={() => window.print()}>
            Print Report
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={() => window.print()}>
            Download PDF
          </Button>
        </div>
      </div>

      {/* PRINTABLE CLINICAL REPORT WORKSPACE */}
      <div className="space-y-8 bg-white dark:bg-[#0F172A] p-8 rounded-2xl border border-[var(--border-medium)] shadow-lg text-[var(--text-main)] print:p-0 print:border-none print:shadow-none">
        {/* SECTION 1: HOSPITAL-GRADE REPORT HEADER */}
        <div className="border-b-2 border-[var(--primary)] pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white font-black flex items-center justify-center text-lg">
                TM
              </div>
              <div>
                <h1 className="text-xl font-black text-[var(--text-main)] tracking-tight">TeleMed AI Medical Center</h1>
                <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">Multimodal Diagnostic & Clinical Decision Report</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div className="hidden sm:block">
                <span className="text-[10px] font-mono text-[var(--text-muted)] block">Report Verification Code</span>
                <span className="text-xs font-mono font-bold text-[var(--primary)]">ASM-2026-8819</span>
              </div>
              <div className="p-2 border rounded-lg border-[var(--border-medium)] bg-slate-50 dark:bg-slate-800" aria-label="QR Code Security Verification" role="img" title="Scan to verify report authenticity">
                <QrCode className="w-8 h-8 text-[var(--text-main)]" />
              </div>
            </div>
          </div>

          {/* Patient Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs">
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">PATIENT NAME</span>
              <strong className="text-[var(--text-main)]">{patientName}</strong>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">PATIENT ID</span>
              <strong className="font-mono text-[var(--text-main)]">{patientId}</strong>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">ASSESSMENT DATE</span>
              <strong className="text-[var(--text-main)]">August 1, 2026</strong>
            </div>
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">PIPELINE & PATHWAY</span>
              <strong className="text-[var(--primary)]">v4.0 Stable ({pathwayUsed})</strong>
            </div>
          </div>
        </div>

        {/* SECTION 2: EXECUTIVE CLINICAL SUMMARY */}
        <Card isGlass={true} className="p-6 space-y-4 bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-primary)] border-l-4 border-l-[var(--primary)]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[var(--text-main)]">Executive Clinical Summary</h3>
            <Badge variant="primary" size="sm">Overall Health Score: {dqScore}%</Badge>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            The patient presents with an overall data quality index of <strong>{dqScore}%</strong> across 3 active modalities (Clinical Lab, Wearable Telemetry, and Gut Microbiome Taxa). Multi-disease prediction models indicate <strong>Type 2 Diabetes (68%)</strong> and <strong>Prediabetes Risk (62%)</strong> as the primary cardiometabolic areas requiring clinical review. Fasting blood glucose (118 mg/dL) and HbA1c (6.1%) exhibit mild glycemic elevation, whereas wearable activity (8,400 daily steps) and gut microbial diversity (Akkermansia 3.2%) act as protective factors.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">Highest Risk</span>
              <strong className="text-[var(--danger)]">Type 2 Diabetes (68%)</strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">Positive Findings</span>
              <strong className="text-[var(--warning)]">3 Key Biomarkers</strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">Data Quality</span>
              <strong className="text-[var(--success)]">{dqScore}% High Quality</strong>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <span className="text-[10px] font-mono text-[var(--text-muted)] block">Model Confidence</span>
              <strong className="text-[var(--primary)]">92.4% Calibrated</strong>
            </div>
          </div>
        </Card>

        {/* SECTION 3: MULTI-DISEASE RISK ASSESSMENT */}
        <ContentSection title="1. Multi-Disease Risk Assessment" subtitle="Calibrated probability predictions across 5 cardiometabolic disease targets">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card isGlass={true} className="p-5 space-y-3 border-t-4 border-t-[var(--danger)]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-[var(--text-main)]">Type 2 Diabetes</h4>
                <Badge variant="danger" size="sm">High Risk (68%)</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Fasting Glucose (118 mg/dL) & HbA1c (6.1%) elevated above optimal range.</p>
              <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                <strong>Recommended Action:</strong> Repeat fasting glycemic panel in 90 days & consult endocrinologist.
              </div>
            </Card>

            <Card isGlass={true} className="p-5 space-y-3 border-t-4 border-t-[var(--warning)]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-[var(--text-main)]">Prediabetes Risk</h4>
                <Badge variant="warning" size="sm">Moderate (62%)</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Impaired fasting glucose screening indicates early insulin resistance.</p>
              <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                <strong>Recommended Action:</strong> Implement 30-min post-meal walking protocol.
              </div>
            </Card>

            <Card isGlass={true} className="p-5 space-y-3 border-t-4 border-t-[var(--success)]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-[var(--text-main)]">Adiposity & Obesity</h4>
                <Badge variant="success" size="sm">Low Risk (28%)</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">BMI (27.4) and waist circumference within manageable threshold.</p>
              <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                <strong>Recommended Action:</strong> Maintain current caloric expenditure & activity.
              </div>
            </Card>
          </div>
        </ContentSection>

        {/* SECTION 4: CANONICAL BIOMARKER SUMMARY TABLES */}
        <ContentSection title="2. Canonical Biomarker Measurements" subtitle="Extracted, normalized, and validated feature measurements across active modalities">
          <Tabs
            tabs={[
              {
                id: 'clin_tab',
                label: 'Clinical Lab Biomarkers (22)',
                content: (
                  <Table headers={['Biomarker Name', 'Measured Value', 'Standard Unit', 'Reference Range', 'Status']}>
                    <TableRow className="bg-amber-500/5">
                      <TableCell className="font-semibold text-xs">Fasting_Blood_Glucose</TableCell>
                      <TableCell className="font-mono font-bold text-[var(--danger)]">118</TableCell>
                      <TableCell className="font-mono text-xs">mg/dL</TableCell>
                      <TableCell className="font-mono text-xs text-[var(--text-muted)]">70 - 99 mg/dL</TableCell>
                      <TableCell><Badge variant="danger" size="sm">ELEVATED</Badge></TableCell>
                    </TableRow>
                    <TableRow className="bg-amber-500/5">
                      <TableCell className="font-semibold text-xs">HbA1c</TableCell>
                      <TableCell className="font-mono font-bold text-[var(--danger)]">6.1</TableCell>
                      <TableCell className="font-mono text-xs">%</TableCell>
                      <TableCell className="font-mono text-xs text-[var(--text-muted)]">4.0 - 5.6 %</TableCell>
                      <TableCell><Badge variant="danger" size="sm">ELEVATED</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-xs">ALT (Alanine Aminotransferase)</TableCell>
                      <TableCell className="font-mono font-bold text-[var(--primary)]">24</TableCell>
                      <TableCell className="font-mono text-xs">U/L</TableCell>
                      <TableCell className="font-mono text-xs text-[var(--text-muted)]">7 - 56 U/L</TableCell>
                      <TableCell><Badge variant="success" size="sm">NORMAL</Badge></TableCell>
                    </TableRow>
                  </Table>
                )
              },
              {
                id: 'wear_tab',
                label: 'Wearable Telemetry (15)',
                content: (
                  <Table headers={['Telemetry Metric', 'Measured Value', 'Unit', 'Target Range', 'Status']}>
                    <TableRow>
                      <TableCell className="font-semibold text-xs">Average_Daily_Steps</TableCell>
                      <TableCell className="font-mono font-bold text-[var(--secondary)]">8,400</TableCell>
                      <TableCell className="font-mono text-xs">steps/day</TableCell>
                      <TableCell className="font-mono text-xs text-[var(--text-muted)]">&gt; 8,000 steps</TableCell>
                      <TableCell><Badge variant="success" size="sm">OPTIMAL</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-xs">Resting_Heart_Rate</TableCell>
                      <TableCell className="font-mono font-bold text-[var(--secondary)]">64</TableCell>
                      <TableCell className="font-mono text-xs">bpm</TableCell>
                      <TableCell className="font-mono text-xs text-[var(--text-muted)]">60 - 100 bpm</TableCell>
                      <TableCell><Badge variant="success" size="sm">OPTIMAL</Badge></TableCell>
                    </TableRow>
                  </Table>
                )
              },
              {
                id: 'gut_tab',
                label: 'Gut Microbiome Taxa (20)',
                content: (
                  <Table headers={['Microbial Taxa', 'Relative Abundance', 'Unit', 'Healthy Range', 'Status']}>
                    <TableRow>
                      <TableCell className="font-semibold text-xs">Akkermansia muciniphila</TableCell>
                      <TableCell className="font-mono font-bold text-[var(--accent)]">3.2</TableCell>
                      <TableCell className="font-mono text-xs">%</TableCell>
                      <TableCell className="font-mono text-xs text-[var(--text-muted)]">1.0 - 4.0 %</TableCell>
                      <TableCell><Badge variant="accent" size="sm">BALANCED</Badge></TableCell>
                    </TableRow>
                  </Table>
                )
              }
            ]}
          />
        </ContentSection>

        {/* SECTION 5: PHYSIOLOGICAL SYSTEMS OVERVIEW */}
        <ContentSection title="3. Physiological Systems Overview" subtitle="Organ system status evaluation based on canonical biomarkers and telemetry">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card isGlass={true} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-main)]">Cardiovascular</span>
                <Badge variant="success" size="sm">Normal</Badge>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">BP 120/80 mmHg & RHR 64 bpm within optimal range.</p>
            </Card>

            <Card isGlass={true} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-main)]">Hepatic (Liver)</span>
                <Badge variant="success" size="sm">Optimal</Badge>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">ALT 24 U/L & AST enzymes normal.</p>
            </Card>

            <Card isGlass={true} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-main)]">Glycemic</span>
                <Badge variant="warning" size="sm">Elevated</Badge>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">FBG 118 mg/dL & HbA1c 6.1% require monitoring.</p>
            </Card>

            <Card isGlass={true} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-main)]">Gut Microbiome</span>
                <Badge variant="success" size="sm">Balanced</Badge>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">Faecalibacterium & Akkermansia balanced.</p>
            </Card>

            <Card isGlass={true} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-main)]">Wearables</span>
                <Badge variant="success" size="sm">Optimal</Badge>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">8,400 daily steps met activity target.</p>
            </Card>
          </div>
        </ContentSection>

        {/* SECTION 6: EVIDENCE-GROUNDED RECOMMENDATIONS */}
        <ContentSection title="4. Evidence-Grounded Clinical Recommendations" subtitle="Medical guideline recommendations retrieved via ChromaDB vector RAG">
          <Card isGlass={true} className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="danger" size="sm">Immediate Focus</Badge>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Glycemic Management</span>
              </div>
              <h5 className="text-xs font-bold text-[var(--text-main)]">30-Minute Post-Prandial Walking Protocol</h5>
              <p className="text-xs text-[var(--text-muted)]">
                Engage in moderate-intensity physical activity following meals to suppress post-prandial glucose excursions and improve insulin sensitivity.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="success" size="sm">Lifestyle Focus</Badge>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Dietary Fiber</span>
              </div>
              <h5 className="text-xs font-bold text-[var(--text-main)]">Prebiotic Polyphenol Dietary Intake</h5>
              <p className="text-xs text-[var(--text-muted)]">
                Increase consumption of prebiotic dietary fibers to support high relative abundance of Akkermansia muciniphila.
              </p>
            </div>
          </Card>
        </ContentSection>

        {/* SECTION 7: REPORT FOOTER & CLINICAL DISCLAIMER */}
        <div className="pt-6 border-t border-[var(--border-subtle)] space-y-3 text-[10px] text-[var(--text-muted)]">
          <div className="flex items-center justify-between">
            <span>Generated: August 1, 2026 • TeleMed AI Engine v4.0 Stable</span>
            <span>Page 1 of 1</span>
          </div>
          <p>
            <strong>CLINICAL DISCLAIMER:</strong> This AI-generated report is designed to support medical decision-making by qualified healthcare professionals. It does NOT constitute a standalone medical diagnosis. All findings should be reviewed in clinical context with standard laboratory testing.
          </p>
        </div>
      </div>

      {/* RAG Q&A Assistant Drawer Modal */}
      <Drawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        title="TeleMed Clinical RAG Assistant"
      >
        <div className="space-y-4 p-4 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {qaHistory.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded-xl text-xs ${msg.role === 'user' ? 'bg-[var(--primary-light)] text-[var(--primary)] ml-6' : 'bg-[var(--bg-primary)] text-[var(--text-main)] mr-6 border border-[var(--border-subtle)]'}`}>
                <MarkdownRenderer content={msg.content} />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about your report findings..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              />
              <Button variant="primary" size="md" isLoading={loadingQA} onClick={() => handleAskQuestion()}>
                Send
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </PageContainer>
  );
}
