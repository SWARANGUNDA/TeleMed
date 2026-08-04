import React, { useState, useEffect } from 'react';
import {
  Stethoscope, Clock, AlertTriangle, CheckCircle2, ShieldAlert,
  PlusCircle, FileText, User, RefreshCw, X, ShieldOff, Eye, Send,
  MessageCircle, Edit3, Lock, Shield, Video, Calendar, Sparkles, Brain,
  Activity, Watch, Dna, FileCheck, ArrowRight, Save, Check, Paperclip, ChevronRight
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  ProgressBar, CircularProgress, Table, TableRow, TableCell, Tabs, Modal, Input, TextArea, EmptyState, Alert
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import {
  createConsultationRequest,
  fetchPatientConsultations,
  fetchPatientConsultationDetail,
  cancelPatientConsultation,
  revokeSharedRecordConsent,
  fetchPatientRecords,
  sendConsultationMessage,
  fetchConsultationMessages,
  fetchConsultationNote
} from '../api/client';

export default function ConsultationWorkspacePage({ user, consultationContext }) {
  const [consultations, setConsultations] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Consultation Form State
  const [showNewForm, setShowNewForm] = useState(false);
  const [specialization, setSpecialization] = useState('Cardiology');
  const [category, setCategory] = useState('General Consultation');
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState('ROUTINE');
  const [message, setMessage] = useState('');
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Active Workspace Consultation State
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailMessages, setDetailMessages] = useState([]);
  const [detailNote, setDetailNote] = useState(null);
  const [patientNewMessage, setPatientNewMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);

  // Workspace Form Inputs
  const [diagnosisText, setDiagnosisText] = useState('Mild Fasting Glycemic Elevation & Suboptimal Physical Activity');
  const [treatmentPlanText, setTreatmentPlanText] = useState('1. 30-min post-meal walking protocol\n2. Prebiotic polyphenol dietary intake\n3. Repeat fasting glucose panel in 90 days');
  const [prescriptionText, setPrescriptionText] = useState('No prescription medication required at this time. Lifestyle interventions recommended.');
  const [followUpDate, setFollowUpDate] = useState('2026-11-01');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (consultationContext) {
      setShowNewForm(true);
      if (consultationContext.reason) setReason(consultationContext.reason);
      if (consultationContext.recordId) setSelectedRecordIds([consultationContext.recordId]);
    }
  }, [consultationContext]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [consData, recData] = await Promise.all([
        fetchPatientConsultations(),
        fetchPatientRecords()
      ]);
      setConsultations(consData.consultations || []);
      setHealthRecords(recData.records || []);
      if (consData.consultations?.length > 0) {
        setSelectedConsultation(consData.consultations[0]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load consultation data.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Please provide a reason for your consultation request.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createConsultationRequest({
        specialization,
        category,
        reason,
        urgency,
        message,
        record_ids: selectedRecordIds
      });
      setSuccessMsg('Consultation request submitted successfully!');
      setShowNewForm(false);
      setReason('');
      setMessage('');
      setSelectedRecordIds([]);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create consultation request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!patientNewMessage.trim() || !selectedConsultation) return;
    setMessageSending(true);
    try {
      const sent = await sendConsultationMessage(selectedConsultation.consultation_id, patientNewMessage);
      setDetailMessages((prev) => [...prev, sent]);
      setPatientNewMessage('');
    } catch (err) {
      alert(`Message Failed: ${err.message}`);
    } finally {
      setMessageSending(false);
    }
  };

  const activeConsultation = selectedConsultation || consultations[0];

  return (
    <PageContainer className="space-y-8 pb-28">
      {/* Header */}
      <PageHeader
        title="Physician Consultation Workspace"
        description="3-Panel Clinical Review Workspace, Patient Chronological Timeline & AI Clinical Assistant"
        badge="TeleMed v4.0 Active"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadData}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />} onClick={() => setShowNewForm(true)}>
              New Consultation Request
            </Button>
          </div>
        }
      />

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* 3-PANEL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* PANEL 1: LEFT CHRONOLOGICAL PATIENT TIMELINE (3 COLS) */}
        <div className="lg:col-span-3 space-y-4">
          <Card isGlass={true} className="p-4 space-y-4">
            <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2">
              Patient History Timeline
            </h4>

            <div className="space-y-3">
              {/* Timeline Item 1 */}
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5 cursor-pointer hover:border-[var(--primary)] transition-all">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm">Active Intake</Badge>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">Today</span>
                </div>
                <h5 className="text-xs font-bold text-[var(--text-main)]">Multimodal AI Assessment</h5>
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">3 Files (Apollo Lab, Fitbit CSV, Ayumetrix PDF)</p>
              </div>

              {/* Timeline Item 2 */}
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5 cursor-pointer hover:border-[var(--primary)] transition-all">
                <div className="flex items-center justify-between">
                  <Badge variant="success" size="sm">Completed</Badge>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">July 15, 2026</span>
                </div>
                <h5 className="text-xs font-bold text-[var(--text-main)]">Follow-up Teleconsultation</h5>
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">Dr. Medical Specialist • Cardiology</p>
              </div>

              {/* Timeline Item 3 */}
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5 cursor-pointer hover:border-[var(--primary)] transition-all">
                <div className="flex items-center justify-between">
                  <Badge variant="info" size="sm">Upload</Badge>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">June 02, 2026</span>
                </div>
                <h5 className="text-xs font-bold text-[var(--text-main)]">Apollo Clinical PDF</h5>
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">HbA1c 6.1%, FBG 118 mg/dL</p>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setIsDocViewerOpen(true)}>
              Open Document Viewer →
            </Button>
          </Card>

          {/* Video Teleconsultation Card */}
          <Card isGlass={true} className="p-4 border-l-4 border-l-[var(--secondary)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[var(--secondary)]" />
                <h5 className="text-xs font-bold text-[var(--text-main)]">Video Consultation</h5>
              </div>
              <Badge variant="secondary" size="sm">Ready</Badge>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">Encrypted WebRTC video consultation room ready.</p>
            <Button variant="secondary" size="sm" className="w-full" leftIcon={<Video className="w-4 h-4" />}>
              Launch Video Session
            </Button>
          </Card>
        </div>

        {/* PANEL 2: CENTER LIVE CONSULTATION WORKSPACE (6 COLS) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Patient Overview Header Card */}
          <Card isGlass={true} className="p-6 bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-primary)] space-y-4">
            {(() => {
              const recPreds = recordData?.prediction_snapshot?.predictions || recordData?.predictions || {};
              const sorted = Object.keys(recPreds).map(k => {
                const item = recPreds[k] || {};
                const p = item.calibrated_probability !== undefined ? item.calibrated_probability : (item.probability || 0);
                return { key: k, title: k.replace(/_/g, ' '), probPct: Math.round(p * 100) };
              }).sort((a, b) => b.probPct - a.probPct);

              const primary = sorted[0] || { title: 'None', probPct: 0 };
              const secondary = sorted[1] || { title: 'None', probPct: 0 };
              const pw = recordData?.effective_pathway || recordData?.pathway_used || 'C+W+G';
              const dq = Math.round(recordData?.data_quality_score ? (recordData.data_quality_score * 100) : (recordData?.overall_quality_score || 85));

              return (
                <>
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={user?.full_name || 'John Doe'} size="lg" />
                      <div>
                        <h3 className="text-base font-extrabold text-[var(--text-main)]">{user?.full_name || 'John Doe'}</h3>
                        <p className="text-xs text-[var(--text-muted)]">Patient ID: {activeConsultation?.consultation_id || 'P_USER_001'} • Male, 45 yrs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">Pathway: {pw}</Badge>
                      <Badge variant="success" size="sm">DQ: {dq}%</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
                    <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] block">Primary Risk</span>
                      <strong className="text-[var(--danger)]">{primary.title} ({primary.probPct}%)</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] block">Secondary Risk</span>
                      <strong className="text-[var(--warning)]">{secondary.title} ({secondary.probPct}%)</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                      <span className="text-[10px] font-mono text-[var(--text-muted)] block">Model Calibration</span>
                      <strong className="text-[var(--primary)]">Isotonic</strong>
                    </div>
                  </div>
                </>
              );
            })()}
          </Card>

          {/* Clinical Findings & Notes Form */}
          <Card isGlass={true} className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-[var(--text-main)] pb-2 border-b border-[var(--border-subtle)]">
              Physician Consultation Notes & Assessment
            </h4>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-main)]">Clinical Diagnosis</label>
                <Input
                  value={diagnosisText}
                  onChange={(e) => setDiagnosisText(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-main)]">Treatment Plan & Lifestyle Protocols</label>
                <TextArea
                  rows={4}
                  value={treatmentPlanText}
                  onChange={(e) => setTreatmentPlanText(e.target.value)}
                  onFocus={(e) => { if (window.innerWidth < 768) e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-main)]">Prescription Guidelines</label>
                <TextArea
                  rows={2}
                  value={prescriptionText}
                  onChange={(e) => setPrescriptionText(e.target.value)}
                  onFocus={(e) => { if (window.innerWidth < 768) e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-main)]">Follow-up Date</label>
                  <Input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-main)]">Case Status</label>
                  <Input value="ACTIVE IN REVIEW" readOnly className="font-mono text-xs text-[var(--primary)] font-bold" />
                </div>
              </div>
            </div>
          </Card>

          {/* Secure Messaging Thread */}
          <Card isGlass={true} className="p-6 space-y-4">
            <h4 className="text-sm font-bold text-[var(--text-main)] pb-2 border-b border-[var(--border-subtle)]">
              Patient Secure Message Thread
            </h4>

            <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)]">
              {detailMessages.length > 0 ? (
                detailMessages.map((m, idx) => (
                  <div key={idx} className={`p-2.5 rounded-lg text-xs ${m.sender_role === 'PATIENT' ? 'bg-[var(--primary-light)] text-[var(--primary)] mr-6' : 'bg-[var(--bg-surface)] text-[var(--text-main)] ml-6'}`}>
                    <p>{m.message_text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">No active messages in thread.</p>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Type doctor reply..."
                value={patientNewMessage}
                onChange={(e) => setPatientNewMessage(e.target.value)}
              />
              <Button variant="primary" size="md" isLoading={messageSending} type="submit" leftIcon={<Send className="w-4 h-4" />}>
                Send
              </Button>
            </form>
          </Card>
        </div>

        {/* PANEL 3: RIGHT AI CLINICAL ASSISTANT (3 COLS) */}
        <div className="lg:col-span-3 space-y-4">
          <Card isGlass={true} className="p-5 space-y-4 border-l-4 border-l-[var(--accent)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[var(--accent)]" />
              <h4 className="text-sm font-bold text-[var(--text-main)]">AI Clinical Assistant</h4>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--accent)] uppercase font-bold">Top SHAP Drivers</span>
                <p className="text-xs text-[var(--text-main)] font-semibold">1. HbA1c 6.1% (+0.18 SHAP)</p>
                <p className="text-xs text-[var(--text-main)] font-semibold">2. Fasting Glucose 118 (+0.14 SHAP)</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--success)] uppercase font-bold">Protective Factors</span>
                <p className="text-xs text-[var(--text-main)] font-semibold">1. 8,400 Daily Steps (-0.12 SHAP)</p>
                <p className="text-xs text-[var(--text-main)] font-semibold">2. 3.2% Akkermansia (-0.10 SHAP)</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--primary)] uppercase font-bold">Suggested Questions</span>
                <ul className="list-disc list-inside text-[11px] text-[var(--text-muted)] space-y-1">
                  <li>"Have you experienced any post-meal fatigue?"</li>
                  <li>"Are you following a low-glycemic dietary regimen?"</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ALWAYS VISIBLE STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-[var(--z-header)] bg-[var(--bg-surface)]/90 backdrop-blur-md border-t border-[var(--border-subtle)] p-4 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 md:px-8">
          <Button variant="outline" size="md" onClick={() => loadData()}>
            Save Draft Notes
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" leftIcon={<FileText className="w-4 h-4" />}>
              Generate Prescription
            </Button>
            <Button variant="primary" size="md" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
              Sign & Finalize Consultation →
            </Button>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <Modal
        isOpen={isDocViewerOpen}
        onClose={() => setIsDocViewerOpen(false)}
        title="Document Viewer | Apollo Clinical Lab PDF"
        size="lg"
      >
        <div className="space-y-4 p-4">
          <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] text-xs space-y-2">
            <p className="font-bold text-[var(--text-main)]">Extracted Report Summary:</p>
            <ul className="list-disc list-inside text-[var(--text-muted)] space-y-1 font-mono">
              <li>Fasting Blood Glucose: 118 mg/dL (ELEVATED)</li>
              <li>HbA1c: 6.1 % (ELEVATED)</li>
              <li>ALT: 24 U/L (NORMAL)</li>
            </ul>
          </div>
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsDocViewerOpen(false)}>Close Viewer</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
