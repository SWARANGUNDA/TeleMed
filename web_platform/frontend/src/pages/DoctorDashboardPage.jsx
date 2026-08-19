import React, { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, Clock, ShieldAlert, XCircle, Stethoscope, Lock, UserCheck,
  RefreshCw, FileText, Check, Eye, X, Shield, Activity, Users, BarChart3, Inbox,
  ChevronRight, Calendar, MessageCircle, Hash, Database, Cpu, Sparkles, BookOpen,
  TrendingUp, Layers, FileCheck, ArrowUpRight, ArrowDownRight, Minus, Send, Edit3, Save, Search, Filter
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  ProgressBar, CircularProgress, Table, TableRow, TableCell, Tabs, Modal, Input, TextArea, EmptyState, Alert
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import {
  fetchDoctorConsultations,
  respondToDoctorAssignment,
  fetchAuthorizedPatientRecord,
  completeConsultation,
  sendConsultationMessage,
  fetchConsultationMessages,
  saveDoctorConsultationNote,
  fetchConsultationNote
} from '../api/client';
import { classifyBiomarker } from '../utils/clinicalRanges';
import PopulationHealthSection from '../components/doctor/PopulationHealthSection';
import HighRiskPatients from '../components/doctor/HighRiskPatients';
import WorkloadPanel from '../components/doctor/WorkloadPanel';
import ReviewAnalytics from '../components/doctor/ReviewAnalytics';
import OutcomeTracking from '../components/doctor/OutcomeTracking';
import ClinicalAlerts from '../components/doctor/ClinicalAlerts';
import InsightsPanel from '../components/doctor/InsightsPanel';

const DEFAULT_DOCTOR_CASES = [
  {
    consultation_id: 'CONS-2026-901',
    patient_id: 'usr_aravind_bhatiya',
    patient_name: 'Aravind Bhatiya',
    patient_age: 30,
    patient_gender: 'Male',
    status: 'ACTIVE',
    urgency: 'ROUTINE',
    category: 'Glycemic Evaluation & Lifestyle Protocol',
    reason: 'Initial consultation to review multimodal AI screening and TreeSHAP driver analysis.',
    created_at: new Date().toISOString(),
    record_id: 'REC-ARAVIND-01',
    prediction_snapshot: {
      effective_pathway: 'C+W+G (Multimodal Unified)',
      data_quality_score: 0.94,
      disease_outcomes: {
        Type2_Diabetes: { risk_level: 'HIGH', calibrated_probability: 0.85, category: 'Metabolic / Glycemic' },
        Prediabetes: { risk_level: 'HIGH', calibrated_probability: 0.92, category: 'Metabolic / Glycemic' },
        Obesity: { risk_level: 'LOW', calibrated_probability: 0.18, category: 'Body Composition' },
        Metabolic_Syndrome: { risk_level: 'HIGH', calibrated_probability: 0.88, category: 'Metabolic Risk' }
      },
      confirmed_features: {
        clinical: { Fasting_Glucose: 118, HbA1c: 6.2, Systolic_BP: 124, Diastolic_BP: 82, BMI: 26.4 },
        wearable: { Total_Steps: 8500, Resting_Heart_Rate: 72 },
        gut: { Akkermansia: 3.2, Faecalibacterium: 8.5 }
      }
    }
  },
  {
    consultation_id: 'CONS-2026-902',
    patient_id: 'usr_swaran_01',
    patient_name: 'Swaran',
    patient_age: 47,
    patient_gender: 'Male',
    status: 'ASSIGNED',
    urgency: 'URGENT',
    category: 'Endocrinology & Glycemic Follow-up',
    reason: 'Follow-up consultation after 90-day post-meal walking protocol and Metformin dosage check.',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    record_id: 'REC-SWARAN-02',
    prediction_snapshot: {
      effective_pathway: 'C+W+G',
      data_quality_score: 0.92,
      disease_outcomes: {
        Type2_Diabetes: { risk_level: 'MODERATE', calibrated_probability: 0.55, category: 'Metabolic / Glycemic' },
        Metabolic_Syndrome: { risk_level: 'MODERATE', calibrated_probability: 0.48, category: 'Metabolic Risk' }
      },
      confirmed_features: {
        clinical: { Fasting_Glucose: 108, HbA1c: 5.9, Systolic_BP: 122, Diastolic_BP: 80, BMI: 24.2 },
        wearable: { Total_Steps: 9200, Resting_Heart_Rate: 68 }
      }
    }
  }
];

export default function DoctorDashboardPage({ user, onNavigate, initialTab = 'overview' }) {
  const doctor = user?.doctor_profile || {};
  const status = doctor.verification_status || 'VERIFIED';

  const [allConsultations, setAllConsultations] = useState([]);
  const [activeTab, setActiveTab] = useState(initialTab); // 'overview', 'ASSIGNED', 'ACTIVE', 'COMPLETED'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  // Clinical Workspace Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState('summary');
  const [recordLoading, setRecordLoading] = useState(false);

  // Doctor Clinical Notes state
  const [noteAssessment, setNoteAssessment] = useState('');
  const [noteGuidance, setNoteGuidance] = useState('');
  const [noteSummary, setNoteSummary] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);
  const [noteError, setNoteError] = useState(null);

  // Secure Messaging state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);

  useEffect(() => {
    if (status === 'VERIFIED') {
      loadAllConsultations();
    }
  }, [status]);

  const loadAllConsultations = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchDoctorConsultations('');
      const list = data.consultations || [];
      setAllConsultations(list.length > 0 ? list : DEFAULT_DOCTOR_CASES);
    } catch (err) {
      setAllConsultations(DEFAULT_DOCTOR_CASES);
    } finally {
      setLoading(false);
    }
  };

  const getByStatus = (st) => allConsultations.filter(c => c.status === st);
  const pendingCount = getByStatus('ASSIGNED').length + getByStatus('ACCEPTED').length;
  const activeCount = getByStatus('ACTIVE').length;
  const completedCount = getByStatus('COMPLETED').length;

  const displayList = allConsultations.filter((c) => {
    const matchesSearch = (c.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.consultation_id || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleRespond = async (consultationId, action) => {
    const reason = window.prompt(`Notes for ${action.toLowerCase()}ing this case (optional):`);
    try {
      await respondToDoctorAssignment(consultationId, action, reason || '');
      await loadAllConsultations();
    } catch (err) {
      alert(`Action Failed: ${err.message}`);
    }
  };

  const handleViewRecord = async (consultationId, recordId) => {
    setRecordLoading(true);
    setSelectedConsultationId(consultationId);
    setWorkspaceTab('summary');
    setNoteSuccess(false);
    setNoteError(null);
    try {
      const [rec, msgs, note] = await Promise.all([
        fetchAuthorizedPatientRecord(consultationId, recordId).catch(() => null),
        fetchConsultationMessages(consultationId).catch(() => []),
        fetchConsultationNote(consultationId).catch(() => null)
      ]);

      const targetCase = allConsultations.find(c => c.consultation_id === consultationId);
      const activeRec = rec || targetCase?.prediction_snapshot || {
        patient_name: targetCase?.patient_name || 'Patient',
        effective_pathway: 'C+W+G',
        data_quality_score: 0.94,
        disease_outcomes: {
          Type2_Diabetes: { risk_level: 'HIGH', calibrated_probability: 0.85, category: 'Metabolic / Glycemic' }
        },
        confirmed_features: {
          clinical: { Fasting_Glucose: 118, HbA1c: 6.2, Systolic_BP: 124, Diastolic_BP: 82, BMI: 26.4 }
        }
      };

      setSelectedRecord(activeRec);
      setMessages(msgs || []);
      if (note?.note) {
        setNoteAssessment(note.note.clinical_assessment || '');
        setNoteGuidance(note.note.actionable_guidance || '');
        setNoteSummary(note.note.summary || '');
      } else {
        setNoteAssessment('');
        setNoteGuidance('');
        setNoteSummary('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRecordLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedConsultationId) return;
    setNoteSaving(true);
    setNoteSuccess(false);
    setNoteError(null);
    try {
      await saveDoctorConsultationNote(selectedConsultationId, {
        summary: noteSummary,
        clinical_assessment: noteAssessment,
        actionable_guidance: noteGuidance
      });
      setNoteSuccess(true);
    } catch (err) {
      setNoteError(err.message || 'Failed to save clinical note');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedConsultationId) return;
    setMessageSending(true);
    try {
      const sent = await sendConsultationMessage(selectedConsultationId, newMessage);
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
    } catch (err) {
      alert(`Failed to send message: ${err.message}`);
    } finally {
      setMessageSending(false);
    }
  };

  const handleCompleteCase = async () => {
    if (!selectedConsultationId) return;
    const confirmText = window.prompt("Type 'COMPLETE' to finalize this clinical consultation & issue medical report:");
    if (confirmText !== 'COMPLETE') return;

    try {
      await completeConsultation(selectedConsultationId, noteAssessment || 'Consultation completed by physician.');
      alert('Consultation Completed & Signed Off Successfully');
      setSelectedRecord(null);
      await loadAllConsultations();
    } catch (err) {
      alert(`Completion Failed: ${err.message}`);
    }
  };

  // VERIFICATION CHECK
  if (status !== 'VERIFIED') {
    return (
      <PageContainer className="space-y-8">
        <PageHeader
          title="Physician Verification Pending"
          description="Your medical license & credentials are currently being reviewed by the TeleMed Admin Board."
          badge="Verification Required"
        />
        <Card isGlass={true} className="p-8 text-center space-y-4 max-w-xl mx-auto">
          <ShieldAlert className="w-12 h-12 text-[var(--warning)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--text-main)]">Access Restricted</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Once your doctor verification status is marked as VERIFIED, you will gain full access to patient AI intake reports, TreeSHAP driver reviews, and teleconsultation workspaces.
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-12 pb-24">
      {/* Page Header */}
      <PageHeader
        title={`Dr. ${user?.full_name || 'Physician'} Workspace`}
        description="Clinical Case Review, Multimodal AI Inference Validation, and Teleconsultation Portal"
        badge={`License Verified • ${doctor.specialty || 'Internal Medicine'}`}
        actions={
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadAllConsultations}>
            Refresh Queue
          </Button>
        }
      />

      {/* 1. ENTERPRISE DOCTOR METRIC CARDS WITH COMPARISON BADGES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--primary)]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[var(--text-muted)] uppercase font-semibold">Active Cases</span>
            <Badge variant="primary" size="sm">Real-time Queue</Badge>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[var(--text-main)]">{allConsultations.length} Cases</div>
          <p className="text-[10px] text-[var(--text-muted)]">Assigned in portal</p>
        </Card>

        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--danger)]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[var(--text-muted)] uppercase font-semibold">Pending Review</span>
            <Badge variant={pendingCount > 0 ? "danger" : "success"} size="sm">{pendingCount} Pending</Badge>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[var(--danger)]">{pendingCount} Cases</div>
          <p className="text-[10px] text-[var(--text-muted)]">Require physician action</p>
        </Card>

        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--success)]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[var(--text-muted)] uppercase font-semibold">Completed Consults</span>
            <Badge variant="success" size="sm">{completedCount} Completed</Badge>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[var(--success)]">{completedCount} Reports</div>
          <p className="text-[10px] text-[var(--text-muted)]">Signed & finalized</p>
        </Card>

        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--accent)]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[var(--text-muted)] uppercase font-semibold">Active In-Review</span>
            <Badge variant="accent" size="sm">{activeCount} Active</Badge>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[var(--accent)]">{activeCount} Cases</div>
          <p className="text-[10px] text-[var(--text-muted)]">In-progress evaluations</p>
        </Card>

        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--warning)]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[var(--text-muted)] uppercase font-semibold">Verification</span>
            <Badge variant="success" size="sm">VERIFIED</Badge>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[var(--text-main)]">Active</div>
          <p className="text-[10px] text-[var(--text-muted)]">Verified doctor access</p>
        </Card>
      </div>

      {/* THREE-COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (4 cols) — Workload & Review Analytics */}
        <div className="lg:col-span-4 space-y-6">
          <WorkloadPanel consultations={allConsultations} />
          <ReviewAnalytics consultations={allConsultations} />
        </div>

        {/* Center Column (5 cols) — High Risk Monitor & Population Health */}
        <div className="lg:col-span-5 space-y-6">
          <HighRiskPatients
            consultations={allConsultations}
            onReview={(c) => handleViewRecord(c.consultation_id, 'REC_DEFAULT')}
            onMessage={(c) => handleViewRecord(c.consultation_id, 'REC_DEFAULT')}
          />
          <PopulationHealthSection consultations={allConsultations} />
        </div>

        {/* Right Column (3 cols) — Insights & Outcomes */}
        <div className="lg:col-span-3 space-y-6">
          <InsightsPanel />
          <OutcomeTracking />
        </div>

      </div>

      {/* 2. PATIENT REVIEW QUEUE */}
      <ContentSection title="Patient Review Queue" subtitle="Assigned patient cases requiring physician sign-off or AI report review">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="w-full md:w-96">
              <Input
                placeholder="Search patient by name or ID..."
                leftIcon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">Active Cases ({displayList.length})</Badge>
            </div>
          </div>

          <Table headers={['Consultation ID', 'Patient Name', 'Specialty', 'Case Status', 'Scheduled Date', 'Action']}>
            {displayList.length > 0 ? (
              displayList.map((c) => (
                <TableRow key={c.consultation_id}>
                  <TableCell className="font-mono text-xs font-bold text-[var(--primary)]">{c.consultation_id}</TableCell>
                  <TableCell className="font-semibold text-xs">{c.patient_name || 'Patient Case'}</TableCell>
                  <TableCell className="text-xs">{c.specialty || 'General Practice'}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'COMPLETED' ? 'success' : c.status === 'ACTIVE' ? 'primary' : 'warning'} size="sm">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[var(--text-muted)]">{c.appointment_date || 'Today'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {['ASSIGNED'].includes(c.status) && (
                        <>
                          <Button variant="primary" size="sm" className="!px-2 !py-1 text-xs" onClick={() => handleRespond(c.consultation_id, 'ACCEPT')}>
                            Accept
                          </Button>
                          <Button variant="outline" size="sm" className="!px-2 !py-1 text-xs text-rose-500" onClick={() => handleRespond(c.consultation_id, 'REJECT')}>
                            Decline
                          </Button>
                        </>
                      )}
                      {['ACCEPTED', 'ACTIVE', 'COMPLETED'].includes(c.status) && (
                        <Button variant="outline" size="sm" className="!px-2.5 !py-1 text-xs" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => handleViewRecord(c.consultation_id, c.record_id)}>
                          Open Review
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                  No active patient cases found in queue.
                </TableCell>
              </TableRow>
            )}
          </Table>
        </div>
      </ContentSection>

      {/* 3. CLINICAL REVIEW WORKSPACE MODAL */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={`Clinical Review Workspace | Patient ID: ${selectedRecord?.record_id || 'P_USER_001'}`}
        size="xl"
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* Workspace Subnav Tabs */}
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto no-scrollbar">
              {['summary', 'measurements', 'notes', 'messages'].map((tb) => (
                <Button
                  key={tb}
                  variant={workspaceTab === tb ? 'primary' : 'ghost'}
                  size="sm"
                  className="!px-3 !py-1 text-xs capitalize"
                  onClick={() => setWorkspaceTab(tb)}
                >
                  {tb}
                </Button>
              ))}
            </div>

            {/* Tab 1: Summary */}
            {workspaceTab === 'summary' && (
              <div className="space-y-4">
                <Card isGlass={true} className="p-4 bg-[var(--bg-primary)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-main)]">Patient Assessment Record</span>
                    <Badge variant="primary" size="sm">Pathway: {selectedRecord?.effective_pathway || 'C+W+G'}</Badge>
                  </div>
                  {(() => {
                    const recPreds = selectedRecord?.prediction_snapshot?.predictions || selectedRecord?.predictions || {};
                    const sorted = Object.keys(recPreds).map(k => {
                      const item = recPreds[k] || {};
                      const p = item.calibrated_probability !== undefined ? item.calibrated_probability : (item.probability || 0);
                      return { key: k, title: k.replace(/_/g, ' '), probPct: Math.round(p * 100), risk: item.risk_level || 'Low' };
                    }).sort((a, b) => b.probPct - a.probPct);

                    const topItem = sorted[0] || { title: 'None', probPct: 0 };
                    const dqVal = Math.round(selectedRecord?.data_quality_score ? (selectedRecord.data_quality_score * 100) : (selectedRecord?.overall_quality_score || 85));

                    return (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div><span className="text-[10px] font-mono text-[var(--text-muted)] block">RECORD ID</span><strong className="font-mono">{selectedRecord?.record_id}</strong></div>
                          <div><span className="text-[10px] font-mono text-[var(--text-muted)] block">DATA QUALITY</span><strong className="text-[var(--success)]">{dqVal}%</strong></div>
                          <div><span className="text-[10px] font-mono text-[var(--text-muted)] block">HIGHEST RISK</span><strong className="text-[var(--danger)]">{topItem.title} ({topItem.probPct}%)</strong></div>
                          <div><span className="text-[10px] font-mono text-[var(--text-muted)] block">CALIBRATION</span><strong className="text-[var(--primary)]">Isotonic</strong></div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-muted)]">Disease Risk Predictions</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            {sorted.map(s => {
                              const variant = s.probPct >= 60 ? 'danger' : s.probPct >= 30 ? 'warning' : 'success';
                              return (
                                <Card key={s.key} isGlass={true} className={`p-2.5 space-y-1 ${s.probPct >= 60 ? 'border-t-2 border-t-[var(--danger)]' : s.probPct >= 30 ? 'border-t-2 border-t-[var(--warning)]' : 'border-t-2 border-t-[var(--success)]'}`}>
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-bold truncate" title={s.title}>{s.title}</span>
                                    <Badge variant={variant} size="sm">{s.probPct}%</Badge>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </Card>
              </div>
            )}

            {/* Tab 2: Measurements */}
            {workspaceTab === 'measurements' && (
              <Table headers={['Biomarker Name', 'Measured Value', 'Standard Unit', 'Status']}>
                <TableRow>
                  <TableCell className="font-semibold text-xs">Fasting_Blood_Glucose</TableCell>
                  <TableCell className="font-mono font-bold text-[var(--danger)]">118</TableCell>
                  <TableCell className="font-mono text-xs">mg/dL</TableCell>
                  <TableCell><Badge variant="danger" size="sm">ELEVATED</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-xs">HbA1c</TableCell>
                  <TableCell className="font-mono font-bold text-[var(--danger)]">6.1</TableCell>
                  <TableCell className="font-mono text-xs">%</TableCell>
                  <TableCell><Badge variant="danger" size="sm">ELEVATED</Badge></TableCell>
                </TableRow>
              </Table>
            )}

            {/* Tab 3: Notes & Diagnosis */}
            {workspaceTab === 'notes' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-main)]">Clinical Diagnosis & Assessment</label>
                  <TextArea
                    rows={3}
                    placeholder="Enter physician assessment notes..."
                    value={noteAssessment}
                    onChange={(e) => setNoteAssessment(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-main)]">Treatment Plan & Actionable Guidance</label>
                  <TextArea
                    rows={3}
                    placeholder="Enter patient lifestyle & therapeutic instructions..."
                    value={noteGuidance}
                    onChange={(e) => setNoteGuidance(e.target.value)}
                  />
                </div>

                {noteSuccess && <Alert variant="success">Clinical notes saved successfully.</Alert>}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="primary" size="sm" isLoading={noteSaving} leftIcon={<Save className="w-4 h-4" />} onClick={handleSaveNote}>
                    Save Draft Note
                  </Button>
                </div>
              </div>
            )}

            {/* Tab 4: Secure Messages */}
            {workspaceTab === 'messages' && (
              <div className="space-y-4">
                <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)]">
                  {messages.length > 0 ? (
                    messages.map((m, idx) => (
                      <div key={idx} className={`p-2.5 rounded-lg text-xs ${m.sender_role === 'DOCTOR' ? 'bg-[var(--primary-light)] text-[var(--primary)] ml-6' : 'bg-[var(--bg-surface)] text-[var(--text-main)] mr-6'}`}>
                        <p>{m.message_text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] text-center py-4">No patient messages in thread.</p>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Type message to patient..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button variant="primary" size="md" isLoading={messageSending} type="submit" leftIcon={<Send className="w-4 h-4" />}>
                    Send
                  </Button>
                </form>
              </div>
            )}

            {/* DECISION PANEL ACTIONS */}
            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-rose-500" onClick={() => handleRespond(selectedConsultationId, 'REJECT')}>
                  Request More Data
                </Button>
                <Button variant="primary" size="sm" leftIcon={<CheckCircle className="w-4 h-4" />} onClick={handleCompleteCase}>
                  Sign & Finalize Case →
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
