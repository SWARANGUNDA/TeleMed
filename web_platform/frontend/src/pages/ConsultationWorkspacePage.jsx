import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, Clock, AlertTriangle, CheckCircle2, ShieldAlert,
  PlusCircle, FileText, User, RefreshCw, X, ShieldOff, Eye, Send,
  MessageCircle, Edit3, Lock, Shield, Video, Calendar, Sparkles, Brain,
  Activity, Watch, Dna, FileCheck, ArrowRight, Save, Check, Paperclip, ChevronRight,
  Pill, Download, Printer, UserCheck, Star, MessageSquare, ExternalLink, Maximize2,
  ArrowLeft, BadgeCheck, ChevronDown, Minimize2, BarChart3, Heart, Footprints
} from 'lucide-react';
import {
  Button, Card, Badge, Modal, Input, TextArea, EmptyState, Alert
} from '../components/ui';
import { PageContainer } from '../components/layout';
import {
  createConsultationRequest,
  fetchPatientConsultations,
  fetchPatientRecords,
  sendConsultationMessage,
  fetchConsultationMessages,
  saveDoctorConsultationNote,
  completeConsultation
} from '../api/client';

// ── Risk Score Gauge Component ─────────────────────────────────────
function RiskScoreGauge({ score = 32, maxScore = 100 }) {
  const percentage = (score / maxScore) * 100;
  const riskLevel = score <= 40 ? 'Low Risk' : score <= 70 ? 'Moderate Risk' : 'High Risk';
  const riskColor = score <= 40 ? '#22C55E' : score <= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-bold text-[var(--text-main)]">Metabolic Risk Score</span>
        <span className="text-lg font-black text-[var(--text-main)]">{score} <span className="text-sm font-normal text-[var(--text-muted)]">/ {maxScore}</span></span>
      </div>
      <div className="relative w-full">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%`, backgroundColor: riskColor }}
            />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" style={{ backgroundColor: `${riskColor}20`, color: riskColor }}>
            {riskLevel}
          </span>
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-[var(--text-dim)]">
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}

// ── Consultation Timer Component ───────────────────────────────────
function ConsultationTimer({ isActive = false, startTimeStr = null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
      return;
    }
    const startMs = startTimeStr ? new Date(startTimeStr).getTime() : Date.now();
    const calculateElapsed = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - (isNaN(startMs) ? Date.now() : startMs)) / 1000));
      setElapsed(diffSecs);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isActive, startTimeStr]);

  const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
        <Clock className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
      <div>
        <span className="text-lg font-black font-mono text-[var(--text-main)]">{hrs}:{mins}:{secs}</span>
        <p className="text-[10px] text-[var(--text-muted)]">Consultation Time</p>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function ConsultationWorkspacePage({ user, consultationContext }) {
  const navigate = useNavigate();
  const role = user?.role || 'PATIENT';
  const isPatient = role === 'PATIENT';
  const isDoctor = role === 'DOCTOR' || role === 'ADMIN';

  const [consultations, setConsultations] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Consultation Form State
  const [showNewForm, setShowNewForm] = useState(false);
  const [specialization, setSpecialization] = useState('Endocrinology & Diabetes');
  const [category, setCategory] = useState('Glycemic Evaluation & Treatment Plan');
  const [reason, setReason] = useState('');
  const [urgency, setUrgency] = useState('ROUTINE');
  const [message, setMessage] = useState('');
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Active Workspace Consultation State
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [patientNewMessage, setPatientNewMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);

  // Clinical Notes State (Doctor Only)
  const [activeNotesTab, setActiveNotesTab] = useState('clinical_notes');
  const [clinicalNotes, setClinicalNotes] = useState({
    chiefComplaints: 'Post meal fatigue, occasional headache.',
    examination: 'BP normal. Heart sounds normal. No edema.',
    historyOfPresentIllness: 'Symptoms ongoing since 2 weeks.',
    assessmentDiagnosis: 'Metabolic glycemic risk under control.',
    prescription: 'Metformin 500mg once daily after breakfast.',
    treatmentPlan: 'Low-glycemic dietary protocol, 30 min daily walking.'
  });

  // Dynamic Identity Resolution from Backend Context (Single Source of Truth)
  const patientFullName = user?.name || user?.full_name || user?.patient_profile?.full_name || 'Patient';
  const patientId = user?.user_id || 'usr_patient';

  const activeDoctorName = selectedConsultation?.assigned_doctor_name || selectedConsultation?.doctor_name || selectedConsultation?.doctor_profile?.full_name || 'Dr. Rajesh Sharma, MD';
  const activeDoctorSpecialty = selectedConsultation?.specialization || selectedConsultation?.doctor_specialization || 'Cardiovascular & Metabolic Specialist';
  const activeDoctorHospital = selectedConsultation?.hospital_affiliation || 'Fortis Health Institute';
  const activeDoctorAvatar = activeDoctorName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const activePatientName = selectedConsultation?.patient_name || patientFullName;
  const activePatientId = selectedConsultation?.patient_id || selectedConsultation?.user_id || patientId;
  const activePatientAvatar = activePatientName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Messages State
  const [messagesThread, setMessagesThread] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (consultationContext) {
      setShowNewForm(true);
      if (consultationContext.reason) setReason(consultationContext.reason);
      if (consultationContext.recordId) setSelectedRecordIds([consultationContext.recordId]);
    }
  }, [consultationContext]);

  // Load chat messages and subscribe to WebSocket/Polling
  useEffect(() => {
    const cId = selectedConsultation?.consultation_id || selectedConsultation?.id;
    if (!cId) return;

    loadMessages(cId);

    // WebSocket Real-Time Chat Sync
    let ws = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/chat/${cId}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'chat_message' || data.event === 'NEW_MESSAGE') {
            loadMessages(cId, true);
          }
        } catch (e) {}
      };
    } catch (e) {
      console.warn("WebSocket initialization warning:", e);
    }

    // 4-second fallback HTTP polling
    const pollInterval = setInterval(() => loadMessages(cId, true), 4000);

    return () => {
      if (ws) ws.close();
      clearInterval(pollInterval);
    };
  }, [selectedConsultation]);

  const loadMessages = async (cId, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const msgs = await fetchConsultationMessages(cId);
      if (msgs && Array.isArray(msgs)) {
        setMessagesThread(msgs.map(m => ({
          id: m.message_id || m.id,
          sender: m.sender_name || (m.sender_role === 'PATIENT' ? activePatientName : activeDoctorName),
          role: m.sender_role || (m.sender_user_id === user?.user_id ? 'PATIENT' : 'DOCTOR'),
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          text: m.content || m.message || '',
        })));
      }
    } catch (err) {
      console.warn("Could not load messages:", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [consData, recData] = await Promise.all([
        fetchPatientConsultations(),
        fetchPatientRecords()
      ]);
      
      const allRecs = recData?.records || [];
      const userRecs = allRecs.filter(r => 
        (r.user_id && r.user_id === user?.user_id) ||
        (r.patient_id && r.patient_id === user?.user_id) ||
        (r.user_email && r.user_email.toLowerCase() === user?.email?.toLowerCase())
      );

      const consList = consData?.consultations || [];
      setConsultations(consList);
      setHealthRecords(userRecs);

      if (consList.length > 0 && !selectedConsultation) {
        setSelectedConsultation(consList[0]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load consultation data.');
    } finally {
      setLoading(false);
    }
  };

  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesThread]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!patientNewMessage.trim()) return;

    const cId = selectedConsultation?.consultation_id || selectedConsultation?.id;
    const isCompleted = selectedConsultation?.status === 'COMPLETED' || selectedConsultation?.status === 'CANCELLED';
    if (isCompleted) {
      setErrorMsg('Messaging is closed for completed or cancelled consultations.');
      return;
    }

    const queryText = patientNewMessage;
    setPatientNewMessage('');
    setMessageSending(true);

    try {
      if (cId) {
        await sendConsultationMessage(cId, queryText);
        await loadMessages(cId, true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send message.');
    } finally {
      setMessageSending(false);
    }
  };

  const handleSaveNotes = async () => {
    const cId = selectedConsultation?.consultation_id || selectedConsultation?.id;
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      if (cId && isDoctor) {
        await saveDoctorConsultationNote(cId, {
          symptoms: clinicalNotes.chiefComplaints,
          observations: clinicalNotes.examination,
          assessment: clinicalNotes.assessmentDiagnosis,
          treatment_plan: clinicalNotes.treatmentPlan,
          prescription: clinicalNotes.prescription
        });
        setSuccessMsg('Doctor clinical notes saved to backend successfully.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save clinical notes.');
    }
  };

  const handleCompleteConsultationAction = async () => {
    const cId = selectedConsultation?.consultation_id || selectedConsultation?.id;
    if (!cId) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await completeConsultation(cId, clinicalNotes.chiefComplaints || 'Consultation Completed', {
        symptoms: clinicalNotes.chiefComplaints,
        observations: clinicalNotes.examination,
        assessment: clinicalNotes.assessmentDiagnosis,
        treatment_plan: clinicalNotes.treatmentPlan,
        prescription: clinicalNotes.prescription
      });
      setSuccessMsg('Consultation completed successfully. Finalized summary and prescription saved.');
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete consultation.');
    } finally {
      setSubmitting(false);
    }
  };

  const isConsultationCompleted = selectedConsultation?.status === 'COMPLETED';
  const isConsultationActive = selectedConsultation?.status === 'IN_CONSULTATION' || selectedConsultation?.status === 'ACTIVE';

  // Context Items & Biomarkers
  const patientContextItems = [
    { icon: User, label: 'Profile & History', count: null },
    { icon: FileText, label: 'Clinical Reports', count: healthRecords.length || 'Not available' },
    { icon: Watch, label: 'Wearable Data', count: 'Not available' },
    { icon: Dna, label: 'Gut Microbiome', count: 'Not available' },
    { icon: MessageSquare, label: 'Previous Consultations', count: consultations.length || 0 },
    { icon: Pill, label: 'Prescriptions', count: isConsultationCompleted ? 1 : 'Not available' },
    { icon: AlertTriangle, label: 'Allergies & History', count: null },
    { icon: Activity, label: 'Latest Vitals', count: null },
  ];

  return (
    <PageContainer className="py-0 space-y-0">

      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/appointments')}
            className="flex items-center gap-1 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Appointments
          </button>
          <div className="hidden sm:block h-5 w-px bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-[var(--text-main)]">Virtual Chat Consultation</h1>
            <Badge variant={isConsultationCompleted ? 'success' : isConsultationActive ? 'warning' : 'info'} size="sm">
              {selectedConsultation?.status || 'ACTIVE'}
            </Badge>
            <div className="hidden sm:flex items-center gap-1.5 text-[var(--text-muted)]">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs">Secure Virtual Chat</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ConsultationTimer isActive={isConsultationActive} startTimeStr={selectedConsultation?.updated_at || selectedConsultation?.created_at} />
          {isPatient ? (
            <button
              onClick={() => navigate('/appointments')}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Leave Consultation
            </button>
          ) : isDoctor ? (
            <button
              disabled={submitting || isConsultationCompleted}
              onClick={handleCompleteConsultationAction}
              className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-md disabled:opacity-50"
            >
              {isConsultationCompleted ? 'Consultation Completed' : 'Complete Consultation'}
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Patient & Doctor Info Bar ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-b border-[var(--border-subtle)]">
        {/* Patient Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-white shadow flex items-center justify-center text-sm font-black text-blue-600">
            {activePatientAvatar}
          </div>
          <div>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block">Patient</span>
            <h3 className="text-sm font-bold text-[var(--text-main)]">{activePatientName}</h3>
            <p className="text-[11px] text-[var(--text-muted)]">ID: {activePatientId.slice(0, 16)}...</p>
          </div>
        </div>

        {/* Appointment Info */}
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase mb-1">Appointment</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-main)]">
                {selectedConsultation?.created_at ? new Date(selectedConsultation.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">Virtual Chat Mode</span>
            </div>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="flex items-center gap-3 justify-end">
          <div className="text-right">
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase block">Assigned Doctor</span>
            <div className="flex items-center justify-end gap-1.5">
              <h3 className="text-sm font-bold text-[var(--text-main)]">{activeDoctorName}</h3>
              <BadgeCheck className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <p className="text-xs font-semibold text-[var(--primary)]">{activeDoctorSpecialty}</p>
            <p className="text-[11px] text-[var(--text-muted)]">{activeDoctorHospital}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow flex items-center justify-center text-sm font-black text-slate-600">
            {activeDoctorAvatar}
          </div>
        </div>
      </div>

      {errorMsg && <Alert variant="danger" className="my-3">{errorMsg}</Alert>}
      {successMsg && <Alert variant="success" className="my-3">{successMsg}</Alert>}

      {/* ── 3-Panel Workspace Layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-5 items-start">

        {/* ── LEFT PANEL: Patient Context (3 cols) ─────────────── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--border-subtle)]">
              <User className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Patient Context</h3>
            </div>

            <div className="space-y-1">
              {patientContextItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--bg-primary)] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-xs font-medium text-[var(--text-main)]">{item.label}</span>
                  </div>
                  {item.count !== null && (
                    <span className="text-[11px] font-mono font-bold text-[var(--text-muted)]">
                      {item.count}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Latest Vitals Card */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-sm">
            <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider mb-3">Latest Vitals</h4>
            <div className="space-y-2 text-xs">
              {[
                { label: 'BP', value: 'Not available' },
                { label: 'Heart Rate', value: 'Not available' },
                { label: 'Glucose', value: 'Not available' },
                { label: 'Weight', value: 'Not available' },
              ].map((v, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-[var(--border-subtle)] last:border-0">
                  <span className="text-[var(--text-muted)]">{v.label}</span>
                  <span className="font-semibold text-[var(--text-dim)]">{v.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER PANEL: Secure Virtual Chat + Clinical Notes (5 cols) ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Secure Virtual Chat</h3>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">Room: {selectedConsultation?.consultation_id || 'Active'}</span>
            </div>

            {/* Messages Thread */}
            <div className="h-80 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin">
              {messagesThread.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                  No messages yet. Send a message to start your virtual consultation.
                </div>
              ) : (
                messagesThread.map((msg, i) => {
                  const isSenderMe = msg.role === role || (isPatient && msg.role === 'PATIENT') || (isDoctor && msg.role === 'DOCTOR');
                  return (
                    <div key={msg.id || i} className={`flex gap-2.5 ${isSenderMe ? 'flex-row-reverse' : ''} animate-slide-up`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1 ${
                        msg.role === 'PATIENT' ? 'bg-blue-500' : 'bg-emerald-600'
                      }`}>
                        {msg.sender.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className={`max-w-[80%] ${isSenderMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">{msg.sender}</span>
                        <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isSenderMe
                            ? 'bg-[var(--primary)] text-white rounded-br-md shadow-sm'
                            : 'bg-[var(--bg-primary)] text-[var(--text-main)] border border-[var(--border-subtle)] rounded-bl-md'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-[var(--text-dim)] mt-1">{msg.time}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--border-subtle)] flex gap-2">
              <input
                type="text"
                value={patientNewMessage}
                disabled={isConsultationCompleted || messageSending}
                onChange={(e) => setPatientNewMessage(e.target.value)}
                placeholder={isConsultationCompleted ? "Consultation completed. Messaging is closed." : "Type your clinical message..."}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-60"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={messageSending}
                disabled={isConsultationCompleted || !patientNewMessage.trim()}
                leftIcon={<Send className="w-4 h-4" />}
              >
                Send
              </Button>
            </form>
          </div>

          {/* Clinical Notes / Patient Completed Summary */}
          {isDoctor ? (
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Clinical Notes & Assessment</h3>
                <span className="text-[10px] text-[var(--primary)] font-bold">DOCTOR WORKSPACE</span>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Chief Complaints</label>
                  <TextArea
                    rows={2}
                    value={clinicalNotes.chiefComplaints}
                    onChange={e => setClinicalNotes(prev => ({ ...prev, chiefComplaints: e.target.value }))}
                    className="bg-[var(--bg-primary)] text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Assessment & Diagnosis</label>
                  <TextArea
                    rows={2}
                    value={clinicalNotes.assessmentDiagnosis}
                    onChange={e => setClinicalNotes(prev => ({ ...prev, assessmentDiagnosis: e.target.value }))}
                    className="bg-[var(--bg-primary)] text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[var(--text-muted)] mb-1">Prescription & Dosage</label>
                  <TextArea
                    rows={2}
                    value={clinicalNotes.prescription}
                    onChange={e => setClinicalNotes(prev => ({ ...prev, prescription: e.target.value }))}
                    className="bg-[var(--bg-primary)] text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <Button variant="outline" size="sm" onClick={handleSaveNotes}>
                  Save Notes
                </Button>
                <Button variant="primary" size="sm" onClick={handleCompleteConsultationAction} isLoading={submitting}>
                  Complete Consultation
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                {isConsultationCompleted ? 'Finalized Consultation Summary & Prescription' : 'Doctor Clinical Summary'}
              </h3>
              {isConsultationCompleted ? (
                <div className="space-y-2 text-xs text-[var(--text-main)] bg-[var(--bg-primary)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
                  <div>
                    <span className="font-bold text-[var(--primary)] block">Doctor Diagnosis:</span>
                    <p>{clinicalNotes.assessmentDiagnosis}</p>
                  </div>
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <span className="font-bold text-emerald-600 block">Prescription:</span>
                    <p className="font-mono">{clinicalNotes.prescription || 'No prescription issued.'}</p>
                  </div>
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <span className="font-bold text-[var(--text-muted)] block">Treatment Plan:</span>
                    <p>{clinicalNotes.treatmentPlan}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-subtle)]">
                  Your assigned physician will compile clinical assessment notes and prescription during/after your consultation.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: AI Clinical Assistant (4 cols) ──────── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden p-4 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">
                {isPatient ? 'AI Health Assistant' : 'AI Clinical Decision Support'}
              </h3>
            </div>

            {/* Role-based Disclaimer */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {isPatient
                  ? 'AI-generated information is for informational support and does not replace medical advice.'
                  : 'AI Decision Support — Doctor Review Required.'}
              </span>
            </div>

            {/* Risk Assessment */}
            <RiskScoreGauge score={32} maxScore={100} />

            {/* Biomarker Summary */}
            <div className="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
              <h4 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Key Biomarker Trends</h4>
              {[
                { label: 'Fasting Glucose', value: '118 mg/dL', status: 'Elevated' },
                { label: 'HbA1c', value: '6.2%', status: 'Pre-diabetic' },
                { label: 'LDL Cholesterol', value: '128 mg/dL', status: 'Borderline' },
              ].map((bm, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-[var(--text-muted)]">{bm.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-main)]">{bm.value}</span>
                    <Badge variant="warning" size="sm">{bm.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

