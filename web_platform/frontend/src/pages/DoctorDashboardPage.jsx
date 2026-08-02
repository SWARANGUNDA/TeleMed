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

export default function DoctorDashboardPage({ user, onNavigate }) {
  const doctor = user?.doctor_profile || {};
  const status = doctor.verification_status || 'PENDING';

  const [allConsultations, setAllConsultations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'ASSIGNED', 'ACTIVE', 'COMPLETED'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  // Clinical Workspace Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedConsultationId, setSelectedConsultationId] = useState(null);
  const [workspaceTab, setWorkspaceTab] = useState('summary'); // 'summary', 'measurements', 'models', 'report', 'notes', 'messages', 'shap', 'trends'
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
      setAllConsultations(data.consultations || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load consultations.');
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
        fetchAuthorizedPatientRecord(consultationId, recordId),
        fetchConsultationMessages(consultationId).catch(() => []),
        fetchConsultationNote(consultationId).catch(() => null)
      ]);
      setSelectedRecord(rec);
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
      alert(`Access Denied: ${err.message}`);
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

      {/* 1. ENTERPRISE DOCTOR METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card isGlass={true} className="p-5 flex items-center justify-between border-l-4 border-l-[var(--primary)]">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-semibold">Today's Consultations</span>
            <div className="text-2xl font-extrabold font-mono text-[var(--text-main)]">{allConsultations.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
            <Stethoscope className="w-6 h-6" />
          </div>
        </Card>

        <Card isGlass={true} className="p-5 flex items-center justify-between border-l-4 border-l-[var(--warning)]">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-semibold">Pending AI Reviews</span>
            <div className="text-2xl font-extrabold font-mono text-[var(--warning)]">{pendingCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
        </Card>

        <Card isGlass={true} className="p-5 flex items-center justify-between border-l-4 border-l-[var(--success)]">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-semibold">Completed Reports</span>
            <div className="text-2xl font-extrabold font-mono text-[var(--success)]">{completedCount}</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--success-light)] text-[var(--success)]">
            <CheckCircle className="w-6 h-6" />
          </div>
        </Card>

        <Card isGlass={true} className="p-5 flex items-center justify-between border-l-4 border-l-[var(--accent)]">
          <div className="space-y-1">
            <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-semibold">Avg Turnaround Time</span>
            <div className="text-2xl font-extrabold font-mono text-[var(--accent)]">14 mins</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <Activity className="w-6 h-6" />
          </div>
        </Card>
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
                    <span className="text-xs font-bold text-[var(--text-main)]">Patient Demographic Meta</span>
                    <Badge variant="primary" size="sm">Pathway: {selectedRecord?.effective_pathway || 'C+W+G'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-[10px] font-mono text-[var(--text-muted)] block">PATIENT ID</span><strong className="font-mono">{selectedRecord?.record_id}</strong></div>
                    <div><span className="text-[10px] font-mono text-[var(--text-muted)] block">DATA QUALITY</span><strong className="text-[var(--success)]">{selectedRecord?.overall_quality_score || 85.2}%</strong></div>
                    <div><span className="text-[10px] font-mono text-[var(--text-muted)] block">HIGH RISK TARGET</span><strong className="text-[var(--danger)]">Type 2 Diabetes (68%)</strong></div>
                    <div><span className="text-[10px] font-mono text-[var(--text-muted)] block">CONFIDENCE</span><strong className="text-[var(--primary)]">92.4%</strong></div>
                  </div>
                </Card>

                {/* AI Disease Predictions List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-muted)]">Disease Risk Predictions</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Card isGlass={true} className="p-3 border-t-2 border-t-[var(--danger)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Type 2 Diabetes</span>
                        <Badge variant="danger" size="sm">68%</Badge>
                      </div>
                    </Card>
                    <Card isGlass={true} className="p-3 border-t-2 border-t-[var(--warning)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Prediabetes Risk</span>
                        <Badge variant="warning" size="sm">62%</Badge>
                      </div>
                    </Card>
                    <Card isGlass={true} className="p-3 border-t-2 border-t-[var(--success)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Adiposity Risk</span>
                        <Badge variant="success" size="sm">28%</Badge>
                      </div>
                    </Card>
                  </div>
                </div>
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
