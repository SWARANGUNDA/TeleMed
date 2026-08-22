import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, Clock, AlertTriangle, CheckCircle2, ShieldAlert,
  PlusCircle, FileText, User, RefreshCw, X, ShieldOff, Eye, Send,
  MessageCircle, Edit3, Lock, Shield, Video, Calendar, Sparkles, Brain,
  Activity, Watch, Dna, FileCheck, ArrowRight, Save, Check, Paperclip, ChevronRight,
  Pill, Download, Printer, UserCheck, Star, MessageSquare, ExternalLink, Maximize2,
  ArrowLeft, BadgeCheck, ChevronDown, Minimize2, BarChart3, Heart, Footprints, CheckCheck,
  Search, AlertCircle, Phone, PhoneCall, ShieldCheck, Zap, UserPlus, CheckCircle
} from 'lucide-react';
import { PageContainer } from '../components/layout';
import {
  createConsultationRequest,
  fetchPatientConsultations,
  fetchDoctorConsultations,
  fetchPatientRecords,
  sendConsultationMessage,
  fetchConsultationMessages,
  saveDoctorConsultationNote,
  fetchConsultationNote,
  completeConsultation,
  respondToDoctorAssignment
} from '../api/client';

// ── Risk Score Gauge Component ─────────────────────────────────────
function RiskScoreGauge({ score = 32, maxScore = 100 }) {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const riskLevel = score <= 40 ? 'Low Risk' : score <= 70 ? 'Moderate Risk' : 'High Risk';
  const riskColor = score <= 40 ? '#22C55E' : score <= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-extrabold text-slate-700">AI Metabolic Risk Assessment</span>
        <span className="text-base font-black text-slate-900">{score} <span className="text-xs font-medium text-slate-400">/ {maxScore}</span></span>
      </div>
      <div className="relative w-full mt-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${percentage}%`, backgroundColor: riskColor }}
            />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap" style={{ backgroundColor: `${riskColor}20`, color: riskColor }}>
            {riskLevel}
          </span>
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
    <div className="flex items-center space-x-2 bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-800">
      <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
      <span>{hrs}:{mins}:{secs}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN CONSULTATIONS WORKSPACE COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function ConsultationWorkspacePage({ user, consultationContext }) {
  const navigate = useNavigate();
  const role = user?.role?.toUpperCase() || 'PATIENT';
  const isPatient = role === 'PATIENT';
  const isDoctor = role === 'DOCTOR' || role === 'ADMIN';

  // Data States
  const [consultations, setConsultations] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Search & Filter State
  const [queueFilter, setQueueFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'PENDING', 'COMPLETED'
  const [searchQuery, setSearchQuery] = useState('');
  const [workspaceTab, setWorkspaceTab] = useState('chat'); // 'chat', 'soap', 'records'

  // Active Selected Consultation State
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [patientNewMessage, setPatientNewMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // SOAP Clinical Notes State (Doctor Portal)
  const [savingNotes, setSavingNotes] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState({
    chiefComplaints: '',
    examination: '',
    historyOfPresentIllness: '',
    assessmentDiagnosis: '',
    prescription: '',
    treatmentPlan: ''
  });

  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  // Trigger Toast Notification
  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load Real Application State from Backend APIs
  const loadWorkspaceData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const [consRes, recRes] = await Promise.all([
        isDoctor ? fetchDoctorConsultations('').catch(() => ({ consultations: [] })) : fetchPatientConsultations().catch(() => ({ consultations: [] })),
        fetchPatientRecords().catch(() => ({ records: [] }))
      ]);

      const consList = consRes?.consultations || (Array.isArray(consRes) ? consRes : []);
      const recList = recRes?.records || (Array.isArray(recRes) ? recRes : []);

      setConsultations(consList);
      setHealthRecords(recList);

      // Select active consultation from props/session or first item
      let targetId = consultationContext?.consultationId || consultationContext?.consultation_id;
      if (!targetId) {
        try {
          const saved = sessionStorage.getItem('telemed_consultation_context');
          if (saved) {
            const parsed = JSON.parse(saved);
            targetId = parsed.consultationId || parsed.consultation_id;
          }
        } catch (e) {}
      }

      if (targetId) {
        const found = consList.find(c => (c.consultation_id === targetId || c.id === targetId));
        if (found) {
          setSelectedConsultation(found);
        } else if (consList.length > 0) {
          setSelectedConsultation(consList[0]);
        }
      } else if (consList.length > 0 && !selectedConsultation) {
        setSelectedConsultation(consList[0]);
      }
    } catch (err) {
      console.warn("Consultations load notice:", err);
      setErrorMsg(err.message || 'Failed to sync clinical workspace.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDoctor, consultationContext]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Load SOAP Clinical Notes when selected consultation changes
  useEffect(() => {
    const cId = selectedConsultation?.consultation_id || selectedConsultation?.id;
    if (!cId) return;

    fetchConsultationNote(cId)
      .then(note => {
        if (note) {
          setClinicalNotes({
            chiefComplaints: note.symptoms || note.chiefComplaints || selectedConsultation?.reason || '',
            examination: note.observations || note.examination || '',
            historyOfPresentIllness: note.history || selectedConsultation?.message || '',
            assessmentDiagnosis: note.assessment || note.assessmentDiagnosis || '',
            prescription: note.prescription || '',
            treatmentPlan: note.follow_up_guidance || note.patient_summary || note.treatmentPlan || ''
          });
        }
      })
      .catch(() => {
        setClinicalNotes({
          chiefComplaints: selectedConsultation?.reason || '',
          examination: '',
          historyOfPresentIllness: selectedConsultation?.message || '',
          assessmentDiagnosis: '',
          prescription: '',
          treatmentPlan: ''
        });
      });
  }, [selectedConsultation]);

  // Messages Thread State & Sync
  const [messagesThread, setMessagesThread] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadMessages = useCallback(async (cId, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const msgs = await fetchConsultationMessages(cId);
      if (msgs && Array.isArray(msgs)) {
        setMessagesThread(msgs.map(m => ({
          id: m.message_id || m.id,
          sender: m.sender_name || (m.sender_role === 'PATIENT' ? (selectedConsultation?.patient_name || 'Patient') : (selectedConsultation?.doctor_name || 'Doctor')),
          role: m.sender_role || (m.sender_user_id === user?.user_id ? role : 'OTHER'),
          time: m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          text: m.content || m.message || '',
        })));
      }
    } catch (err) {
      console.warn("Messages sync notice:", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [selectedConsultation, user, role]);

  // Auto-select first consultation when list loads
  useEffect(() => {
    if (!selectedConsultation && consultations && consultations.length > 0) {
      setSelectedConsultation(consultations[0]);
    }
  }, [consultations, selectedConsultation]);

  // Real-Time WebSocket & Polling Chat Sync
  useEffect(() => {
    const activeCons = selectedConsultation || (consultations && consultations.length > 0 ? consultations[0] : null);
    const cId = activeCons?.consultation_id || activeCons?.id;
    if (!cId) return;

    loadMessages(cId);
    setConnectionStatus('connecting');

    let ws = null;
    let pingInterval = null;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname) && ['5173', '5174', '5175', '5176'].includes(window.location.port);
      const host = isDev ? `${window.location.hostname}:8000` : window.location.host;
      const wsUrl = `${protocol}//${host}/ws/chat/${cId}`;
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const evt = data.event || data.type;
          if (evt === 'typing_start' && data.sender_id !== user?.user_id) {
            setIsOtherTyping(true);
          } else if (evt === 'typing_stop' && data.sender_id !== user?.user_id) {
            setIsOtherTyping(false);
          } else if (evt === 'chat_message' || evt === 'NEW_MESSAGE') {
            setIsOtherTyping(false);
            loadMessages(cId, true);
          }
        } catch (e) {}
      };

      ws.onerror = () => setConnectionStatus('disconnected');
      ws.onclose = () => setConnectionStatus('disconnected');
    } catch (e) {
      setConnectionStatus('disconnected');
    }

    const pollInterval = setInterval(() => loadMessages(cId, true), 3000);

    return () => {
      if (ws) {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
        } else if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
      if (pingInterval) clearInterval(pingInterval);
      clearInterval(pollInterval);
      socketRef.current = null;
    };
  }, [selectedConsultation, consultations, loadMessages, user]);

  // Auto-scroll chat feed
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesThread, isOtherTyping]);

  // Handle Messaging Actions
  const handleInputChange = (e) => {
    setPatientNewMessage(e.target.value);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = patientNewMessage.trim();
    const activeCons = selectedConsultation || (consultations && consultations.length > 0 ? consultations[0] : null);
    if (!text || messageSending || !activeCons) return;

    const cId = activeCons.consultation_id || activeCons.id;
    setPatientNewMessage('');
    setMessageSending(true);

    try {
      await sendConsultationMessage(cId, text);
      await loadMessages(cId, true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send message.');
    } finally {
      setMessageSending(false);
    }
  };

  // Handle Save SOAP Notes
  const handleSaveClinicalNotes = async () => {
    if (!selectedConsultation) return;
    const cId = selectedConsultation.consultation_id || selectedConsultation.id;
    setSavingNotes(true);
    setErrorMsg(null);

    try {
      await saveDoctorConsultationNote(cId, {
        symptoms: clinicalNotes.chiefComplaints,
        observations: clinicalNotes.examination,
        history: clinicalNotes.historyOfPresentIllness,
        assessment: clinicalNotes.assessmentDiagnosis,
        prescription: clinicalNotes.prescription,
        patient_summary: clinicalNotes.treatmentPlan,
        follow_up_guidance: clinicalNotes.treatmentPlan
      });
      notify("SOAP Clinical Notes saved to medical record!");
    } catch (err) {
      setErrorMsg(err.message || "Failed to save clinical notes.");
    } finally {
      setSavingNotes(false);
    }
  };

  // Handle Complete Consultation
  const handleCompleteConsultation = async () => {
    if (!selectedConsultation) return;
    const cId = selectedConsultation.consultation_id || selectedConsultation.id;
    setCompleting(true);

    try {
      await completeConsultation(cId, clinicalNotes.assessmentDiagnosis || "Consultation completed.");
      notify("Consultation signed off & completed.");
      await loadWorkspaceData(true);
    } catch (err) {
      setErrorMsg(err.message || "Failed to complete consultation.");
    } finally {
      setCompleting(false);
    }
  };

  // Handle Accept Doctor Assignment
  const handleAcceptAssignment = async () => {
    if (!selectedConsultation) return;
    const cId = selectedConsultation.consultation_id || selectedConsultation.id;
    try {
      await respondToDoctorAssignment(cId, 'ACCEPT');
      notify("Consultation case accepted.");
      await loadWorkspaceData(true);
    } catch (err) {
      setErrorMsg(err.message || "Failed to accept assignment.");
    }
  };

  // Filtered Consultations Queue
  const filteredConsultations = useMemo(() => {
    let list = [...consultations];

    if (queueFilter === 'ACTIVE') {
      list = list.filter(c => ['ACTIVE', 'ASSIGNED', 'ACCEPTED', 'IN_CONSULTATION', 'IN_PROGRESS'].includes((c.status || '').toUpperCase()));
    } else if (queueFilter === 'PENDING') {
      list = list.filter(c => ['ASSIGNED', 'PENDING', 'REQUESTED'].includes((c.status || '').toUpperCase()));
    } else if (queueFilter === 'COMPLETED') {
      list = list.filter(c => ['COMPLETED', 'CLOSED', 'CANCELLED'].includes((c.status || '').toUpperCase()));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c =>
        (c.patient_name || '').toLowerCase().includes(q) ||
        (c.doctor_name || '').toLowerCase().includes(q) ||
        (c.consultation_id || '').toLowerCase().includes(q) ||
        (c.category || c.specialization || '').toLowerCase().includes(q) ||
        (c.reason || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [consultations, queueFilter, searchQuery]);

  const activeConsultation = selectedConsultation || consultations[0];
  const patientDisplayName = activeConsultation?.patient_name || user?.full_name || user?.name || 'Patient';
  const patientDisplayId = activeConsultation?.patient_id || activeConsultation?.user_id || 'PID-10001';
  const doctorDisplayName = activeConsultation?.doctor_name || activeConsultation?.assigned_doctor_name || 'Assigned Physician';

  return (
    <PageContainer className="max-w-[1480px] mx-auto px-4 py-4 space-y-4">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-slide-up">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── TOP HEADER BANNER ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-xl border border-slate-700/50">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white flex-shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">
                {isDoctor ? 'Doctor Clinical Workspace' : 'My Doctor Consultations'}
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isDoctor ? 'Doctor Portal Active' : 'Patient Telehealth Portal'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isDoctor
                ? 'Review assigned patient intake reports, maintain SOAP clinical notes, and manage teleconsultations.'
                : 'View your booked specialist consultations, communicate live with your attending doctor, and view finalized prescriptions & clinical notes.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {isPatient && (
            <button
              onClick={() => navigate('/appointments')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book New Consultation</span>
            </button>
          )}
          <button
            onClick={() => loadWorkspaceData(true)}
            className="p-2.5 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 rounded-xl transition-all cursor-pointer"
            title="Refresh Workspace"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer text-xs">Dismiss</button>
        </div>
      )}

      {/* ── 2-COLUMN CLINICAL WORKSPACE GRID ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start h-[calc(100vh-170px)] min-h-[640px] max-h-[880px]">

        {/* ── LEFT COLUMN: Case Queue / Consultations List (3.5 cols) ───────── */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-4 space-y-3.5 shadow-lg shadow-slate-100/60 flex flex-col h-full overflow-hidden">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isDoctor ? 'Patient Case Queue' : 'My Consultations'}
              </h3>
            </div>
            <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
              {consultations.length} {isDoctor ? 'Cases' : 'Consultations'}
            </span>
          </div>

          {/* Queue Filter Pills */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 border border-slate-200/60 rounded-xl text-[11px] font-semibold text-slate-600">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'COMPLETED', label: 'Closed' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setQueueFilter(f.id)}
                className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer truncate ${
                  queueFilter === f.id
                    ? 'bg-white text-blue-600 font-bold shadow-sm border border-slate-200/60'
                    : 'hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isDoctor ? "Search patient, ID, or case reason..." : "Search doctor, specialty, or reason..."}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50/80 border border-slate-200/90 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Case List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                <p>Retrieving consultation records...</p>
              </div>
            ) : filteredConsultations.length === 0 ? (
              <div className="py-10 text-center space-y-2.5 px-3 border border-dashed border-slate-200/80 rounded-2xl bg-slate-50/50 my-auto">
                <Stethoscope className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No consultations found</p>
                <p className="text-[11px] text-slate-500">
                  {isDoctor ? 'Assigned patient teleconsultations will appear here.' : 'Your booked doctor consultations will appear here.'}
                </p>
              </div>
            ) : (
              filteredConsultations.map((c, idx) => {
                const isSelected = activeConsultation && (activeConsultation.consultation_id === c.consultation_id || activeConsultation.id === c.id);
                const displayName = isDoctor
                  ? (c.patient_name || 'Patient')
                  : (c.doctor_name || c.assigned_doctor_name || 'Attending Physician');
                const urgencyUpper = (c.urgency || 'ROUTINE').toUpperCase();
                const statusUpper = (c.status || 'ACTIVE').toUpperCase();

                return (
                  <div
                    key={`${c.consultation_id || c.id || 'cons'}_${idx}`}
                    onClick={() => setSelectedConsultation(c)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border-blue-500/80 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                        {(displayName || 'Doc').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{displayName}</h4>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            urgencyUpper === 'URGENT' || urgencyUpper === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                            urgencyUpper === 'SOON' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {urgencyUpper}
                          </span>
                        </div>

                        <p className="text-[11px] font-semibold text-slate-500 truncate mb-1">
                          {c.category || c.specialization || 'Clinical Evaluation'}
                        </p>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400 font-mono">ID: {c.consultation_id}</span>
                          <span className={`font-bold ${statusUpper === 'COMPLETED' ? 'text-emerald-600' : 'text-blue-600'}`}>
                            {statusUpper}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Active Clinical Workspace (8.5 cols) ───────────── */}
        <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl flex flex-col h-full overflow-hidden shadow-lg shadow-slate-100/60">
          
          {/* Active Workspace Header Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white flex-shrink-0 shadow-2xs">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md flex-shrink-0">
                {(isDoctor ? patientDisplayName : doctorDisplayName).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center space-x-2.5">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {isDoctor ? patientDisplayName : doctorDisplayName}
                  </h3>
                  {isDoctor && (
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {patientDisplayId}
                    </span>
                  )}
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {(activeConsultation?.status || 'ACTIVE').toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-0.5">
                  {activeConsultation?.category || activeConsultation?.specialization || 'Clinical Assessment'} • {isDoctor ? 'Registered Patient' : 'Attending Physician'}
                </p>
              </div>
            </div>

            {/* Header Right Action Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              <ConsultationTimer isActive={activeConsultation?.status !== 'COMPLETED'} />

              {isDoctor && (activeConsultation?.status === 'ASSIGNED' || activeConsultation?.status === 'REQUESTED') && (
                <button
                  onClick={handleAcceptAssignment}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Check size={14} />
                  <span>Accept Case</span>
                </button>
              )}

              {isDoctor && activeConsultation?.status !== 'COMPLETED' && (
                <button
                  onClick={handleCompleteConsultation}
                  disabled={completing}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
                >
                  {completing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  <span>Sign & Complete</span>
                </button>
              )}
            </div>
          </div>

          {/* Clinical Workspace Sub-Nav Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/70 flex items-center space-x-2 flex-shrink-0">
            {[
              { id: 'chat', label: isDoctor ? 'Live Telehealth Chat' : 'Live Doctor Chat', icon: MessageSquare },
              { id: 'soap', label: isDoctor ? 'SOAP Clinical Notes' : 'Physician Diagnosis & Prescriptions', icon: Edit3 },
              { id: 'records', label: isDoctor ? 'Patient Biomarkers & Record Hub' : 'My Shared Health Records', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setWorkspaceTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                    workspaceTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: LIVE TELEHEALTH CHAT */}
          {workspaceTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/40">
              
              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                    <p>Loading messages thread...</p>
                  </div>
                ) : messagesThread.length === 0 ? (
                  <div className="py-16 text-center space-y-2 text-xs text-slate-400">
                    <MessageSquare className="w-7 h-7 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-700">Encrypted Telehealth Session Active</p>
                    <p className="text-slate-500">Send a message below to communicate directly with your patient.</p>
                  </div>
                ) : (
                  messagesThread.map((msg) => {
                    const isMe = msg.role === role || (isDoctor && msg.role === 'DOCTOR') || (isPatient && msg.role === 'PATIENT');

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div className="flex items-center space-x-2 px-1">
                          <span className="text-[10px] font-bold text-slate-500">{isMe ? 'You' : msg.sender}</span>
                          <span className="text-[10px] text-slate-400">{msg.time}</span>
                        </div>

                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-1 shadow-xs ${
                            isMe
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                              : 'bg-white border border-slate-200/90 text-slate-900 rounded-bl-none shadow-slate-100'
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}

                {isOtherTyping && (
                  <div className="flex items-center space-x-2 p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 max-w-[200px] animate-pulse">
                    <span className="font-semibold">{patientDisplayName} is typing...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat Composer */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2 flex-shrink-0">
                <input
                  type="text"
                  value={patientNewMessage}
                  onChange={handleInputChange}
                  placeholder="Type a clinical update or response..."
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 placeholder-slate-400"
                />

                <button
                  type="submit"
                  disabled={!patientNewMessage.trim() || messageSending}
                  className={`h-9 px-4 rounded-xl flex items-center justify-center space-x-1.5 text-xs font-bold text-white transition-all cursor-pointer ${
                    !patientNewMessage.trim() || messageSending
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'
                  }`}
                >
                  {messageSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: SOAP CLINICAL NOTES (DOCTOR PORTAL) */}
          {workspaceTab === 'soap' && (
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {isDoctor ? 'SOAP Clinical Documentation' : 'Physician Diagnosis & Treatment Notes'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isDoctor
                      ? 'Record structured patient findings, examination observations, diagnosis, and treatment plan.'
                      : 'Finalized clinical diagnostic findings, treatment plans, and prescriptions provided by your physician.'}
                  </p>
                </div>

                {isDoctor && (
                  <button
                    onClick={handleSaveClinicalNotes}
                    disabled={savingNotes}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
                  >
                    {savingNotes ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save SOAP Notes</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subjective */}
                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-xs">
                  <label className="block text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Subjective (Chief Complaints & History)</span>
                  </label>
                  <textarea
                    readOnly={!isDoctor}
                    value={clinicalNotes.chiefComplaints}
                    onChange={(e) => isDoctor && setClinicalNotes(prev => ({ ...prev, chiefComplaints: e.target.value }))}
                    placeholder={isDoctor ? "Patient symptoms, onset, duration, and chief complaints..." : "No subjective findings recorded yet."}
                    rows={4}
                    className={`w-full p-3 text-xs border rounded-xl focus:outline-none text-slate-900 ${isDoctor ? 'bg-slate-50 border-slate-200 focus:border-blue-500' : 'bg-slate-100/70 border-slate-200/60 cursor-default'}`}
                  />
                </div>

                {/* Objective */}
                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-xs">
                  <label className="block text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Objective (Examination & Vitals)</span>
                  </label>
                  <textarea
                    readOnly={!isDoctor}
                    value={clinicalNotes.examination}
                    onChange={(e) => isDoctor && setClinicalNotes(prev => ({ ...prev, examination: e.target.value }))}
                    placeholder={isDoctor ? "Physical examination observations, lab findings, and vital parameters..." : "No objective examination data recorded yet."}
                    rows={4}
                    className={`w-full p-3 text-xs border rounded-xl focus:outline-none text-slate-900 ${isDoctor ? 'bg-slate-50 border-slate-200 focus:border-blue-500' : 'bg-slate-100/70 border-slate-200/60 cursor-default'}`}
                  />
                </div>

                {/* Assessment */}
                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-xs">
                  <label className="block text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Assessment & Diagnostic Impression</span>
                  </label>
                  <textarea
                    readOnly={!isDoctor}
                    value={clinicalNotes.assessmentDiagnosis}
                    onChange={(e) => isDoctor && setClinicalNotes(prev => ({ ...prev, assessmentDiagnosis: e.target.value }))}
                    placeholder={isDoctor ? "Clinical diagnosis, differential diagnosis, and clinical reasoning..." : "No assessment recorded yet."}
                    rows={4}
                    className={`w-full p-3 text-xs border rounded-xl focus:outline-none text-slate-900 ${isDoctor ? 'bg-slate-50 border-slate-200 focus:border-blue-500' : 'bg-slate-100/70 border-slate-200/60 cursor-default'}`}
                  />
                </div>

                {/* Plan */}
                <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-xs">
                  <label className="block text-xs font-extrabold text-slate-800 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Plan (Prescription & Follow-up)</span>
                  </label>
                  <textarea
                    readOnly={!isDoctor}
                    value={clinicalNotes.treatmentPlan}
                    onChange={(e) => isDoctor && setClinicalNotes(prev => ({ ...prev, treatmentPlan: e.target.value }))}
                    placeholder={isDoctor ? "Medications prescribed, lifestyle modifications, and follow-up guidance..." : "No treatment plan recorded yet."}
                    rows={4}
                    className={`w-full p-3 text-xs border rounded-xl focus:outline-none text-slate-900 ${isDoctor ? 'bg-slate-50 border-slate-200 focus:border-blue-500' : 'bg-slate-100/70 border-slate-200/60 cursor-default'}`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BIOMARKERS & RECORDS HUB */}
          {workspaceTab === 'records' && (
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4 bg-slate-50/30">
              <RiskScoreGauge score={38} maxScore={100} />

              <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Patient Clinical Records ({healthRecords.length})</h4>
                  <button onClick={() => navigate('/records')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                    <span>Open Records Hub</span>
                    <ExternalLink size={12} />
                  </button>
                </div>

                {healthRecords.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 italic text-center">No specific lab reports attached to this case file.</p>
                ) : (
                  <div className="space-y-2">
                    {healthRecords.map(r => (
                      <div key={r.record_id || r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <div>
                            <span className="font-bold text-slate-900 block">{r.file_name || r.title || 'Lab Report'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{r.record_type || 'Biomarker Assessment'}</span>
                          </div>
                        </div>

                        <button onClick={() => navigate('/records')} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px] hover:bg-slate-100">
                          View File
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </PageContainer>
  );
}
