import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, Clock, AlertTriangle, CheckCircle, CheckCircle2, ShieldAlert,
  PlusCircle, FileText, User, RefreshCw, X, Eye, Send,
  MessageCircle, Edit3, Lock, Shield, Video, VideoOff, Camera, CameraOff, Calendar, Sparkles, Brain,
  Activity, ArrowRight, Save, Check, Paperclip, ChevronRight, ChevronDown,
  Pill, Download, Printer, UserCheck, Star, MessageSquare, ExternalLink,
  ArrowLeft, BadgeCheck, Phone, PhoneCall, PhoneOff, ShieldCheck, Zap, Search, AlertCircle,
  FileCheck, Heart, Sparkle, Mic, MicOff, Copy, Thermometer,
  Volume2, VolumeX, Minimize2, Maximize2, Radio, Wifi, Sliders, Waves, Headphones,
  Monitor, MonitorUp, ClipboardList, Smile, Info
} from 'lucide-react';
import { PageContainer } from '../components/layout';
import {
  createConsultationRequest,
  fetchPatientConsultations,
  fetchDoctorConsultations,
  fetchOpenConsultations,
  claimConsultation,
  fetchPatientRecords,
  sendConsultationMessage,
  fetchConsultationMessages,
  saveDoctorConsultationNote,
  fetchConsultationNote,
  completeConsultation,
  respondToDoctorAssignment,
  getAuthToken,
  getWsBaseUrl
} from '../api/client';
import useAudioCall, { CALL_STATES } from '../utils/useAudioCall';
import { HighlightMatch } from '../components/ui';

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

// ── VOIP Audio Visualizer Waveform Component ──────────────────────
function AudioVisualizerWaveform({ isConnected, isMuted }) {
  const bars = [
    { delay: '0.0s', height: '18px' },
    { delay: '0.2s', height: '32px' },
    { delay: '0.4s', height: '48px' },
    { delay: '0.1s', height: '24px' },
    { delay: '0.35s', height: '42px' },
    { delay: '0.15s', height: '54px' },
    { delay: '0.5s', height: '36px' },
    { delay: '0.25s', height: '58px' },
    { delay: '0.45s', height: '44px' },
    { delay: '0.1s', height: '52px' },
    { delay: '0.3s', height: '34px' },
    { delay: '0.55s', height: '48px' },
    { delay: '0.2s', height: '28px' },
    { delay: '0.4s', height: '40px' },
    { delay: '0.15s', height: '22px' },
    { delay: '0.05s', height: '14px' }
  ];

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center space-x-2 h-14 my-3 px-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20">
        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
        <span className="text-xs font-mono font-bold text-indigo-300 tracking-wide">Syncing Opus Audio Stream (48 kHz)...</span>
      </div>
    );
  }

  if (isMuted) {
    return (
      <div className="flex items-center justify-center space-x-2 h-14 my-3 px-4 rounded-2xl bg-amber-950/40 border border-amber-500/30">
        <MicOff className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-mono font-bold text-amber-300">Microphone Muted • Audio Paused</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-1.5 h-16 my-3 px-4 py-2 rounded-2xl bg-slate-950/50 border border-indigo-500/20 shadow-inner">
      {bars.map((b, i) => (
        <span
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-blue-600 via-indigo-400 to-emerald-400 shadow-xs shadow-indigo-500/50 transition-all"
          style={{
            animation: 'soundWaveBar 1.1s ease-in-out infinite alternate',
            animationDelay: b.delay,
            height: b.height,
            minHeight: '6px'
          }}
        />
      ))}
    </div>
  );
}

// Quick Clinical Templates for Doctor SOAP Documentation
const CLINICAL_TEMPLATES = [
  {
    id: 'general',
    label: 'General Evaluation',
    icon: Stethoscope,
    badge: 'Routine',
    notes: {
      chiefComplaints: 'Patient presents for teleconsultation reporting mild headache, bodily fatigue, and interrupted sleep over the past 3 days. Denies chest pain, dyspnea, or high fever.',
      examination: 'General appearance: Alert, oriented, in no acute distress. Vitals reported/observed: BP 120/80 mmHg, Pulse 72 bpm, SpO2 98%, Temp 98.6°F. Hydration status normal.',
      assessmentDiagnosis: 'Primary: Acute tension headache with physical exhaustion. Differential: Stress-induced somatic fatigue. No neurological focal signs.',
      prescription: 'Rx: Tab. Acetaminophen 500mg PO TID PRN for headache (Max 3g/24h x 3 days)\nRx: Multivitamin & Zinc tab 1 PO Daily after breakfast x 14 days\nAdvise: Adequate oral fluids (2.5L/day), sleep hygiene, 15-min screen rest intervals'
    }
  },
  {
    id: 'cardio',
    label: 'Cardio / BP Check',
    icon: Heart,
    badge: 'Vascular',
    notes: {
      chiefComplaints: 'Follow-up for primary hypertension monitoring. Patient reports occasional occipital tightness; denies angina, palpitation, orthopnea, or ankle edema.',
      examination: 'Average home BP: 134/86 mmHg. In-session BP check: 132/84 mmHg, HR: 70 bpm regular rhythm. Heart sounds S1, S2 clear without murmur. Radial pulses bilaterally equal.',
      assessmentDiagnosis: 'Essential Hypertension, Stage 1 (moderately controlled). Cardiovascular risk profile: Low-to-Moderate. Kidney & lipid biomarkers stable.',
      prescription: 'Rx: Tab. Telmisartan 40mg PO Once Daily (Morning)\nRx: Tab. Amlodipine 5mg PO Daily if systolic BP > 140 mmHg\nAdvise: Low sodium DASH diet (<2g Na+/day), daily morning BP log, review in 3 weeks'
    }
  },
  {
    id: 'respiratory',
    label: 'Viral / Respiratory',
    icon: Activity,
    badge: 'Infection',
    notes: {
      chiefComplaints: 'Dry hacking cough, mild sore throat, and nasal congestion for 48 hours. Mild chills yesterday, no shortness of breath.',
      examination: 'Respiratory rate: 16 breaths/min. SpO2: 99% on room air. Speech fluent in full sentences without inspiratory stridor or wheeze. Oropharynx mildly erythematous.',
      assessmentDiagnosis: 'Acute Upper Respiratory Tract Infection (URTI), presumed viral etiology. Bronchial involvement: Minimal. Red flags: Absent.',
      prescription: 'Rx: Syp. Dextromethorphan HBr 10mg/5ml — 10ml PO TID x 5 days\nRx: Tab. Cetirizine 10mg PO Once at bedtime x 5 days\nRx: Normal Saline nasal spray 2 puffs each nostril QID\nAdvise: Warm saline gargles, steam inhalation, seek in-person review if fever >101°F'
    }
  },
  {
    id: 'metabolic',
    label: 'Metabolic / Glycemic',
    icon: Sparkles,
    badge: 'Metabolic',
    notes: {
      chiefComplaints: 'Routine metabolic and glycemic tracking. Patient reports adherence to dietary modifications, mild afternoon fatigue.',
      examination: 'Fasting Blood Glucose: 104 mg/dL. Recent HbA1c: 6.3%. BMI: 24.1 kg/m². Peripheral sensations and pedal pulses normal bilaterally.',
      assessmentDiagnosis: 'Pre-diabetes / Early Type 2 Diabetes Mellitus with good glycemic control. Metabolic syndrome risk vectors evaluated.',
      prescription: 'Rx: Tab. Metformin 500mg PO Extended Release Once Daily with dinner\nRx: Omega-3 Fatty Acids 1000mg 1 capsule Daily\nAdvise: 30 minutes brisk walking 5 days/week, low glycemic index foods, repeat HbA1c in 90 days'
    }
  }
];

// Quick Interactive Chat Prompts for Doctor & Patient
const DOCTOR_QUICK_PROMPTS = [
  { text: "Hello! I have your clinical intake file open. How are you feeling today?", label: "👋 Welcome" },
  { text: "Could you describe your main symptoms and approximately when they first started?", label: "📋 Symptoms" },
  { text: "Are you currently taking any prescription medications or do you have known allergies?", label: "💊 Medications" },
  { text: "Have you had your blood pressure, heart rate, or temperature checked recently?", label: "🩺 Vitals Check" },
  { text: "I have reviewed your clinical evaluation and will update your treatment prescription now.", label: "✅ Review Done" }
];

const PATIENT_QUICK_PROMPTS = [
  { text: "Hello Doctor, I am attending the consultation live.", label: "👋 Check-in" },
  { text: "I have been experiencing symptoms for the past couple of days and would like your advice.", label: "📋 My Symptoms" },
  { text: "Could you please explain my medication dosage and instructions?", label: "💊 Dosage Query" },
  { text: "I have uploaded my recent health records and vitals for your review.", label: "📊 Vitals / Lab" },
  { text: "Doctor, what is the recommended follow-up schedule for recovery?", label: "📅 Follow-up" }
];

// ═══════════════════════════════════════════════════════════════════════
// MAIN CONSULTATIONS WORKSPACE COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function ConsultationWorkspacePage({ user, consultationContext, initialContext, predictionData, onNavigate }) {
  const navigate = useNavigate();
  const effectiveContext = consultationContext || initialContext;
  const role = user?.role?.toUpperCase() || 'PATIENT';
  const isPatient = role === 'PATIENT';
  const isDoctor = role === 'DOCTOR' || role === 'ADMIN';

  // Patient Navigation State: 'OVERVIEW' (Default dashboard) vs 'CHAT_WORKSPACE' (Attending a live consultation)
  const [patientViewMode, setPatientViewMode] = useState('OVERVIEW');
  const [summaryModalConsultation, setSummaryModalConsultation] = useState(null);

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
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const [workspaceTab, setWorkspaceTab] = useState('chat'); // 'chat', 'soap', 'records'

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Live Audio & Video Call UI Enhancements
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isNoiseFilterActive, setIsNoiseFilterActive] = useState(true);
  const [showInCallNotes, setShowInCallNotes] = useState(false);
  const [inCallNoteText, setInCallNoteText] = useState('');
  const [callReactions, setCallReactions] = useState([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isCallFullscreen, setIsCallFullscreen] = useState(false);
  const callOverlayRef = useRef(null);

  const toggleCallFullscreen = () => {
    if (!document.fullscreenElement) {
      callOverlayRef.current?.requestFullscreen?.().catch(() => {});
      setIsCallFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsCallFullscreen(false);
    }
  };

  // Request New Consultation Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newRequestForm, setNewRequestForm] = useState({
    specialization: 'General Medicine',
    category: 'General Consultation',
    reason: '',
    urgency: 'ROUTINE',
    message: '',
    record_ids: []
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);

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
  const consultationMessagesContainerRef = useRef(null);
  const [showConsultationScrollBottomBtn, setShowConsultationScrollBottomBtn] = useState(false);
  const isConsultationAtBottomRef = useRef(true);
  const messageInputRef = useRef(null);
  const [copiedPatientId, setCopiedPatientId] = useState(false);

  const handleCopyPatientId = (id) => {
    if (!id) return;
    try {
      navigator.clipboard?.writeText(id);
      setCopiedPatientId(true);
      notify("Patient ID copied to clipboard");
      setTimeout(() => setCopiedPatientId(false), 2000);
    } catch (e) {}
  };

  const handleApplyQuickPrompt = (promptText) => {
    setPatientNewMessage(promptText);
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  };

  const handleApplyTemplate = (template) => {
    setClinicalNotes(prev => ({
      ...prev,
      ...template.notes
    }));
    notify(`Loaded "${template.label}" clinical template`);
  };

  // Directly scroll messages container so window is never shifted
  const scrollConsultationToBottom = useCallback((smooth = true) => {
    if (consultationMessagesContainerRef.current) {
      const container = consultationMessagesContainerRef.current;
      if (smooth) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      } else {
        container.scrollTop = container.scrollHeight;
      }
      isConsultationAtBottomRef.current = true;
      setShowConsultationScrollBottomBtn(false);
    }
  }, []);

  const handleConsultationScroll = useCallback(() => {
    if (!consultationMessagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = consultationMessagesContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceToBottom < 100;
    isConsultationAtBottomRef.current = atBottom;
    setShowConsultationScrollBottomBtn(!atBottom);
  }, []);

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
        isDoctor ? Promise.all([
          fetchDoctorConsultations('').catch(() => ({ consultations: [] })),
          fetchOpenConsultations().catch(() => ({ consultations: [] }))
        ]).then(([assigned, open]) => {
          const a = assigned?.consultations || [];
          const o = open?.consultations || [];
          const allMap = new Map();
          a.forEach(c => allMap.set(c.consultation_id, c));
          o.forEach(c => {
             if (!allMap.has(c.consultation_id)) {
               allMap.set(c.consultation_id, c);
             }
          });
          return { consultations: Array.from(allMap.values()) };
        }).catch(() => ({ consultations: [] })) : fetchPatientConsultations().catch(() => ({ consultations: [] })),
        (!isDoctor) ? fetchPatientRecords().catch(() => ({ records: [] })) : Promise.resolve({ records: [] })
      ]);

      const consList = consRes?.consultations || (Array.isArray(consRes) ? consRes : []);
      const recList = recRes?.records || (Array.isArray(recRes) ? recRes : []);

      setConsultations(consList);
      setHealthRecords(recList);

      // Select active consultation from props/session or first item
      let targetId = effectiveContext?.consultationId || effectiveContext?.consultation_id;
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
          if (isPatient) setPatientViewMode('CHAT_WORKSPACE');
        } else if (consList.length > 0) {
          setSelectedConsultation(prev => prev || consList[0]);
        }
      } else if (consList.length > 0) {
        setSelectedConsultation(prev => {
          if (!prev) return consList[0];
          const updated = consList.find(c => (c.consultation_id === (prev.consultation_id || prev.id) || c.id === (prev.consultation_id || prev.id)));
          return updated || prev;
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sync clinical workspace.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDoctor, isPatient, effectiveContext?.consultationId, effectiveContext?.consultation_id]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Load SOAP Clinical Notes when selected consultation changes
  useEffect(() => {
    const cId = selectedConsultation?.consultation_id || selectedConsultation?.id;
    const consStatus = (selectedConsultation?.status || '').toUpperCase();
    if (!cId || consStatus === 'REQUESTED' || consStatus === 'PENDING') {
      setClinicalNotes({
        chiefComplaints: selectedConsultation?.reason || '',
        examination: '',
        historyOfPresentIllness: selectedConsultation?.message || '',
        assessmentDiagnosis: '',
        prescription: '',
        treatmentPlan: ''
      });
      return;
    }

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
      // Handled silently
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, [selectedConsultation, user, role]);

  const loadMessagesRef = useRef(loadMessages);
  useEffect(() => {
    loadMessagesRef.current = loadMessages;
  }, [loadMessages]);

  const activeChatCons = selectedConsultation || (consultations && consultations.length > 0 ? consultations[0] : null);
  const activeChatCId = activeChatCons?.consultation_id || activeChatCons?.id;
  const activeChatConsStatus = (activeChatCons?.status || '').toUpperCase();

  // Real-Time WebSocket & Polling Chat Sync
  useEffect(() => {
    if (!activeChatCId) return;

    // Awaiting doctor assignment: skip message polling and WS connection to avoid 403 loops
    if (activeChatConsStatus === 'REQUESTED' || activeChatConsStatus === 'PENDING') {
      setMessagesThread([]);
      setConnectionStatus('waiting_doctor');
      return;
    }

    if (loadMessagesRef.current) {
      loadMessagesRef.current(activeChatCId);
    }
    setConnectionStatus('connecting');

    let ws = null;
    let pingInterval = null;

    try {
      const wsBase = getWsBaseUrl();
      const token = getAuthToken() || user?.user_id || '';
      const wsUrl = `${wsBase}/ws/chat/${activeChatCId}?token=${encodeURIComponent(token)}`;
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
            const msgId = data.message_id || data.id || `ws_${Date.now()}`;
            const msgContent = data.content || data.message || '';
            const msgTime = data.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now';
            const msgSender = data.sender_name || (data.sender_role === 'PATIENT' ? (selectedConsultation?.patient_name || 'Patient') : (selectedConsultation?.doctor_name || 'Doctor'));
            const msgRole = data.sender_role || (data.sender_id === user?.user_id ? role : 'OTHER');

            const incomingMsg = {
              id: msgId,
              sender: msgSender,
              role: msgRole,
              time: msgTime,
              text: msgContent,
              status: 'sent'
            };

            setMessagesThread(prev => {
              if (prev.some(m => m.id === msgId || (m.text === msgContent && m.role === msgRole))) {
                return prev;
              }
              return [...prev, incomingMsg];
            });

            // Smooth auto-scroll to bottom
            setTimeout(() => scrollConsultationToBottom(true), 40);
          }
        } catch (e) {}
      };

      ws.onerror = () => setConnectionStatus('disconnected');
      ws.onclose = () => setConnectionStatus('disconnected');
    } catch (e) {
      setConnectionStatus('disconnected');
    }

    // Fast adaptive fallback polling (every 3 seconds when WebSocket is disconnected)
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      // If WebSocket is actively connected, new messages arrive via push events — skip polling
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;
      if (loadMessagesRef.current) {
        loadMessagesRef.current(activeChatCId, true);
      }
    }, 3000);

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
  }, [activeChatCId, activeChatConsStatus, user?.user_id]);

  // Flexible Instagram-style Auto-scroll for Consultation Chat
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollConsultationToBottom(false);
    }, 60);
    return () => clearTimeout(timer);
  }, [selectedConsultation, scrollConsultationToBottom]);

  const prevThreadCountRef = useRef(messagesThread.length);
  useEffect(() => {
    const isNew = messagesThread.length > prevThreadCountRef.current;
    prevThreadCountRef.current = messagesThread.length;

    if (!isNew && messagesThread.length === 0) return;

    const lastMsg = messagesThread[messagesThread.length - 1];
    const isSelf = lastMsg && (lastMsg.role === role || lastMsg.sender === (user?.full_name || user?.name));

    if (isConsultationAtBottomRef.current || isSelf) {
      const timer = setTimeout(() => {
        scrollConsultationToBottom(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShowConsultationScrollBottomBtn(true);
    }
  }, [messagesThread, role, user, scrollConsultationToBottom]);

  useEffect(() => {
    if (isOtherTyping && isConsultationAtBottomRef.current) {
      scrollConsultationToBottom(true);
    }
  }, [isOtherTyping, scrollConsultationToBottom]);

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
    const tempId = `temp_${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Optimistic UI Update: Render immediately for the sender (0ms latency!)
    const optimisticMsg = {
      id: tempId,
      sender: user?.full_name || user?.name || (role === 'PATIENT' ? (activeCons?.patient_name || 'Patient') : (activeCons?.doctor_name || 'Doctor')),
      role: role,
      time: nowTime,
      text: text,
      status: 'sending'
    };

    setPatientNewMessage('');
    setMessagesThread(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollConsultationToBottom(true), 30);
    setMessageSending(true);

    // 2. Instant broadcast via WebSocket if open
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({
          event: 'chat_message',
          type: 'chat_message',
          consultation_id: cId,
          content: text,
          sender_name: user?.full_name || user?.name || 'User',
          sender_id: user?.user_id,
          message_id: tempId,
          timestamp: new Date().toISOString()
        }));
      } catch (wsErr) {}
    }

    // 3. Persist to Backend REST API
    try {
      const res = await sendConsultationMessage(cId, text);
      const saved = res?.data || res;
      setMessagesThread(prev => prev.map(m => m.id === tempId ? {
        ...m,
        id: saved?.message_id || tempId,
        status: 'sent'
      } : m));
    } catch (err) {
      setMessagesThread(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
      setErrorMsg(err.message || 'Failed to send message.');
    } finally {
      setMessageSending(false);
    }
  };

  // Create New Consultation Request Handler
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!newRequestForm.reason.trim()) {
      setErrorMsg("Please provide a reason for your consultation request.");
      return;
    }
    setSubmittingRequest(true);
    setErrorMsg(null);
    try {
      const res = await createConsultationRequest(newRequestForm);
      notify("Consultation request created successfully!");
      setIsNewModalOpen(false);
      setNewRequestForm({
        specialization: 'General Medicine',
        category: 'General Consultation',
        reason: '',
        urgency: 'ROUTINE',
        message: '',
        record_ids: []
      });
      await loadWorkspaceData(true);
      if (res.consultation) {
        setSelectedConsultation(res.consultation);
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit consultation request.");
    } finally {
      setSubmittingRequest(false);
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

    if (queueFilter === 'OPEN_QUEUE') {
      list = list.filter(c => ['REQUESTED', 'PENDING'].includes((c.status || '').toUpperCase()) && !c.assigned_doctor_id);
    } else if (queueFilter === 'ACTIVE') {
      list = list.filter(c => ['ACTIVE', 'ASSIGNED', 'ACCEPTED', 'IN_CONSULTATION', 'IN_PROGRESS'].includes((c.status || '').toUpperCase()));
    } else if (queueFilter === 'PENDING') {
      list = list.filter(c => ['ASSIGNED', 'PENDING', 'REQUESTED'].includes((c.status || '').toUpperCase()));
    } else if (queueFilter === 'COMPLETED') {
      list = list.filter(c => ['COMPLETED', 'CLOSED', 'CANCELLED'].includes((c.status || '').toUpperCase()));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      list = list
        .map(c => {
          const haystack = `${c.patient_name || ''} ${c.doctor_name || ''} ${c.assigned_doctor_name || ''} ${c.consultation_id || ''} ${c.category || ''} ${c.specialization || ''} ${c.reason || ''} ${c.status || ''}`.toLowerCase();
          const allMatch = tokens.every(tok => haystack.includes(tok));
          if (!allMatch) return null;
          let score = 0;
          tokens.forEach(tok => {
            const pName = (c.patient_name || '').toLowerCase();
            const dName = (c.doctor_name || c.assigned_doctor_name || '').toLowerCase();
            const cId = (c.consultation_id || '').toLowerCase();
            if (pName.startsWith(tok) || dName.startsWith(tok)) score += 30;
            else if (pName.includes(tok) || dName.includes(tok)) score += 15;
            if (cId.includes(tok)) score += 20;
            if ((c.category || c.specialization || '').toLowerCase().includes(tok)) score += 10;
          });
          return { item: c, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
    }

    return list;
  }, [consultations, queueFilter, searchQuery]);

  const handleClaimConsultation = async (cId) => {
    try {
      setLoading(true);
      await claimConsultation(cId);
      await loadWorkspaceData();
      setQueueFilter('ACTIVE');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to claim consultation.');
    } finally {
      setLoading(false);
    }
  };

  const activeConsultation = selectedConsultation || consultations[0];
  const patientDisplayName = activeConsultation?.patient_name || user?.full_name || user?.name || 'Patient';
  const patientDisplayId = activeConsultation?.patient_id || activeConsultation?.user_id || 'PID-10001';
  const doctorDisplayName = activeConsultation?.doctor_name || activeConsultation?.assigned_doctor_name || 'Assigned Physician';

  // ── Audio Call Hook ────────────────────────────────────────────────────
  const activeConsId = activeConsultation?.consultation_id || activeConsultation?.id || null;
  const audioCall = useAudioCall(activeConsId, user);

  // Check if consultation is eligible for audio call (has an active consultation selected)
  const isCallEligible = Boolean(activeConsultation) && !['COMPLETED', 'CANCELLED', 'ARCHIVED'].includes((activeConsultation.status || '').toUpperCase());

  // Format call duration
  const formatDuration = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Register audio call cleanup on window for logout handler in App.jsx
  useEffect(() => {
    window.__telemedAudioCallCleanup = audioCall.fullCleanup;
    return () => {
      window.__telemedAudioCallCleanup = null;
    };
  }, [audioCall.fullCleanup]);

  // Synchronize remote peer reactions (Zoom-style real-time floating reactions)
  useEffect(() => {
    if (audioCall.remoteReaction) {
      const incoming = audioCall.remoteReaction;
      const id = incoming.id || `${Date.now()}-${Math.random()}`;
      const xPos = Math.floor(Math.random() * 50) + 25;
      const drift = (Math.random() * 60 - 30).toFixed(0) + 'px';
      setCallReactions((prev) => [
        ...prev,
        {
          id,
          emoji: incoming.emoji,
          label: incoming.label,
          senderName: incoming.senderName || (isDoctor ? patientDisplayName : doctorDisplayName),
          isSelf: false,
          x: xPos,
          drift
        }
      ]);
      setTimeout(() => {
        setCallReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    }
  }, [audioCall.remoteReaction, isDoctor, patientDisplayName, doctorDisplayName]);

  const triggerCallReaction = (emoji, label) => {
    const id = `${Date.now()}-${Math.random()}`;
    const xPos = Math.floor(Math.random() * 50) + 25;
    const drift = (Math.random() * 60 - 30).toFixed(0) + 'px';
    // Add locally for instant responsive display
    setCallReactions((prev) => [
      ...prev,
      {
        id,
        emoji,
        label,
        senderName: 'You',
        isSelf: true,
        x: xPos,
        drift
      }
    ]);
    setTimeout(() => {
      setCallReactions((prev) => prev.filter((r) => r.id !== id));
    }, 3000);

    // Relay over WebRTC signaling channel to remote participant
    if (audioCall?.sendReaction) {
      audioCall.sendReaction(emoji, label);
    }
  };

  // ── Render Ultra-Premium Teleconsultation Calling Suite ──
  const renderTeleconsultationSuite = () => {
    if (audioCall.callState === 'IDLE') return null;

    // Floating PiP Mini Widget when minimized
    if (isCallMinimized) {
      return (
        <div className="fixed bottom-6 right-6 z-[9999] bg-gradient-to-br from-slate-900/95 via-indigo-950/95 to-slate-950/95 backdrop-blur-2xl border border-indigo-400/40 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.85)] p-3.5 flex items-center space-x-3.5 text-white animate-scale-in">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center font-black text-sm text-white">
                {(isDoctor ? patientDisplayName : doctorDisplayName).substring(0, 2).toUpperCase()}
              </div>
            </div>
            {audioCall.callState === 'CONNECTED' && (
              <>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full shadow-xs" />
              </>
            )}
          </div>

          <div className="text-left min-w-[130px]">
            <div className="text-xs font-black text-white flex items-center space-x-1.5 truncate max-w-[150px]">
              <span className="truncate">{isDoctor ? patientDisplayName : doctorDisplayName}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {audioCall.latencyMs ? `${audioCall.latencyMs}ms` : '38ms'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono font-bold text-emerald-400 mt-0.5">
              <span>{formatDuration(audioCall.callDuration)}</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-300 text-[10px] uppercase tracking-wider">{audioCall.callType}</span>
              {audioCall.isMuted && <span className="text-amber-400 text-[10px]">Muted</span>}
            </div>
          </div>

          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={audioCall.toggleMute}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                audioCall.isMuted
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/40 ring-1 ring-amber-400'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200'
              }`}
              title={audioCall.isMuted ? 'Unmute' : 'Mute'}
            >
              {audioCall.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsCallMinimized(false)}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition-all cursor-pointer"
              title="Expand Teleconsultation Window"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={audioCall.endCall}
              className="p-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md shadow-rose-600/40 transition-all cursor-pointer"
              title="End Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    // Full Teleconsultation Suite Modal
    return (
      <div
        ref={callOverlayRef}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-2 sm:p-5 animate-fade-in"
        style={{ pointerEvents: 'auto' }}
      >
        <div
          className={`w-full ${
            audioCall.callType === 'video' ? 'max-w-5xl' : 'max-w-xl'
          } bg-gradient-to-b from-slate-900/95 via-indigo-950/90 to-slate-950/98 backdrop-blur-2xl border border-indigo-400/30 rounded-3xl shadow-[0_30px_100px_rgba(20,20,55,0.85)] overflow-hidden relative text-white transition-all flex flex-col max-h-[95vh]`}
        >
          {/* Top Holographic Shimmer Edge */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 via-indigo-400 to-transparent opacity-80 animate-hologram shrink-0" />

          {/* Hidden remote audio tag for audio streaming */}
          <audio ref={audioCall.remoteAudioRef} autoPlay playsInline />

          {/* Luminous Ambient Background Glows */}
          <div className="absolute -top-28 -left-28 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none call-aura-glow" />
          <div className="absolute top-1/2 -right-28 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none call-aura-glow" style={{ animationDelay: '2.5s' }} />
          <div className="absolute -bottom-28 left-1/3 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none call-aura-glow" style={{ animationDelay: '5s' }} />

          {/* Floating User Reactions Overlay (Zoom/FaceTime Grade) */}
          <div className="absolute inset-x-0 bottom-24 top-14 pointer-events-none overflow-hidden z-50">
            {callReactions.map((r) => (
              <div
                key={r.id}
                style={{
                  left: `${r.x}%`,
                  '--drift-x': r.drift || '20px'
                }}
                className="absolute bottom-6 pointer-events-none animate-zoom-reaction flex flex-col items-center gap-1.5 select-none"
              >
                {/* Floating Big Emoji with Pop Animation & Glow */}
                <div className="relative">
                  <div className="text-4xl sm:text-5xl animate-emoji-pop drop-shadow-[0_10px_25px_rgba(0,0,0,0.7)]">
                    {r.emoji}
                  </div>
                  {/* Floating sparkles */}
                  <span className="absolute -top-1 -right-2 text-xs animate-drift-particle opacity-80">✨</span>
                  <span className="absolute -bottom-1 -left-2 text-xs animate-drift-particle opacity-80" style={{ animationDelay: '0.25s' }}>✨</span>
                </div>

                {/* Author & Label Pill Chip */}
                <div className={`px-3 py-1 rounded-full backdrop-blur-xl border shadow-xl flex items-center gap-1.5 text-xs font-bold transition-all ${
                  r.isSelf
                    ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 border-cyan-300/50 text-white shadow-cyan-500/30'
                    : 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 border-violet-300/50 text-white shadow-violet-500/30'
                }`}>
                  <span className="text-[10px] font-bold text-cyan-100 uppercase tracking-wider">
                    {r.senderName}
                  </span>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <span className="text-[11px] text-white font-medium">
                    {r.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── TOP TELEMETRY & NAVIGATION BAR ──────────────────────────────── */}
          <div className="p-3.5 sm:p-4.5 pb-2.5 flex items-center justify-between border-b border-indigo-500/20 relative z-20 shrink-0 bg-slate-900/60 backdrop-blur-md">
            <div className="flex items-center space-x-2 sm:space-x-2.5 flex-wrap gap-y-1">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{audioCall.callType === 'video' ? '256-Bit Encrypted HD Video' : '256-Bit Encrypted VoIP'}</span>
              </div>
              <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-[10px] font-mono font-bold">
                <Wifi className={`w-3 h-3 ${audioCall.networkQuality === 'POOR' ? 'text-rose-400 animate-pulse' : audioCall.networkQuality === 'FAIR' ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span>{audioCall.latencyMs ? `${audioCall.latencyMs}ms` : '38ms'} • {audioCall.networkQuality} • WebRTC</span>
              </div>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-400/25 text-indigo-300 text-[10px] font-mono font-bold">
                {activeConsultation?.specialization || 'Clinical Specialist'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Toggle In-Call Clinical Notes Drawer */}
              <button
                type="button"
                onClick={() => setShowInCallNotes(!showInCallNotes)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  showInCallNotes
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/60'
                }`}
                title="Toggle Clinical Snapshot & Scratchpad"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clinical Notes</span>
              </button>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleCallFullscreen}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
                title={isCallFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isCallFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Minimize to PiP Button */}
              <button
                type="button"
                onClick={() => setIsCallMinimized(true)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-xl transition-all cursor-pointer shadow-xs"
                title="Minimize to Floating PiP Widget"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── MAIN CONSULTATION VIEWPORT (VIDEO OR AUDIO) ───────────────────── */}
          <div className="relative flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
            {/* Left/Main Media Container */}
            <div className="relative flex-1 flex flex-col justify-center items-center overflow-hidden">
              {audioCall.callType === 'video' ? (
                /* ── VIDEO INTERFACE ── */
                <div className="relative aspect-video w-full max-h-[520px] bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/80 flex items-center justify-center overflow-hidden">
                  {/* Remote Primary Video Feed */}
                  <video
                    ref={audioCall.remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      audioCall.isRemoteVideoAvailable && audioCall.callState === 'CONNECTED' ? 'opacity-100' : 'opacity-0 absolute'
                    }`}
                  />

                  {/* Remote Screen Share Badge */}
                  {audioCall.isRemoteScreenSharing && (
                    <div className="absolute top-4 right-4 z-20 flex items-center space-x-1.5 bg-indigo-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-indigo-400/40 text-xs text-white shadow-xl animate-pulse">
                      <Monitor className="w-3.5 h-3.5 text-indigo-200" />
                      <span className="font-bold text-[11px]">{isDoctor ? patientDisplayName : doctorDisplayName} is sharing screen</span>
                    </div>
                  )}

                  {/* In-Call Reconnection Overlay */}
                  {audioCall.callState === 'RECONNECTING' && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 text-center space-y-2">
                      <RefreshCw className="w-12 h-12 animate-spin text-amber-400" />
                      <div className="text-white text-base font-extrabold">Reconnecting Video Stream...</div>
                      <div className="text-amber-200 text-xs font-semibold">
                        Restoring WebRTC peer connection • ICE restart in progress {audioCall.reconnectCountdown !== null ? `(${audioCall.reconnectCountdown}s)` : ''}
                      </div>
                    </div>
                  )}

                  {/* Remote Video Fallback & Calling Central Stage */}
                  {(!audioCall.isRemoteVideoAvailable || audioCall.callState !== 'CONNECTED') && (
                    <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 z-10 w-full max-w-md">
                      {/* Holographic Avatar with Radar Waves */}
                      <div className="relative my-2 flex items-center justify-center">
                        {(audioCall.callState === 'CONNECTED' || audioCall.callState === 'CALLING' || audioCall.callState === 'RINGING') && (
                          <>
                            <div className="absolute w-32 h-32 rounded-full border border-cyan-400/40 call-pulse-ring-1" />
                            <div className="absolute w-44 h-44 rounded-full border border-indigo-500/30 call-pulse-ring-2" />
                            <div className="absolute w-56 h-56 rounded-full border border-violet-500/20 call-pulse-ring-3" />
                          </>
                        )}
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-violet-600 p-1 shadow-[0_0_50px_rgba(99,102,241,0.55)] flex items-center justify-center transform hover:scale-105 transition-all">
                          <div className="w-full h-full rounded-[22px] bg-slate-900/95 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
                            {audioCall.callState === 'RINGING' ? (
                              <Video className="w-12 h-12 text-emerald-400 animate-bounce" />
                            ) : (
                              <>
                                <span className="text-3xl font-black text-white tracking-wider">
                                  {(isDoctor ? patientDisplayName : doctorDisplayName).substring(0, 2).toUpperCase()}
                                </span>
                                <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase mt-1">
                                  {isDoctor ? 'Patient' : 'Specialist'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Verified Specialist / Patient Shield */}
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-slate-900 flex items-center justify-center text-white shadow-lg">
                          {isDoctor ? <Heart className="w-4 h-4 fill-current text-white" /> : <Stethoscope className="w-4 h-4 text-white" />}
                        </div>
                      </div>

                      {/* Participant Title & Specialty */}
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                          <span>{audioCall.callState === 'RINGING' ? (audioCall.incomingCallInfo?.senderName || 'Incoming Video Call') : (isDoctor ? patientDisplayName : doctorDisplayName)}</span>
                          <BadgeCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                        </h3>
                        <p className="text-xs text-indigo-300 font-semibold flex items-center justify-center gap-1.5">
                          <span>{isDoctor ? 'Patient Telehealth Case' : 'Attending Medical Specialist'}</span>
                          <span>•</span>
                          <span className="text-cyan-300 font-mono">{activeConsultation?.specialization || 'Clinical Specialist'}</span>
                        </p>
                      </div>

                      {/* Animated Sound Wave Equalizer Bars */}
                      <div className="flex items-center justify-center gap-1.5 h-8 my-1 px-4 py-1.5 rounded-full bg-slate-950/70 border border-indigo-500/30 shadow-inner">
                        <span className="w-1.5 rounded-full bg-cyan-400 eq-bar-1" />
                        <span className="w-1.5 rounded-full bg-cyan-300 eq-bar-2" />
                        <span className="w-1.5 rounded-full bg-indigo-400 eq-bar-3" />
                        <span className="w-1.5 rounded-full bg-violet-400 eq-bar-4" />
                        <span className="w-1.5 rounded-full bg-purple-400 eq-bar-5" />
                        <span className="w-1.5 rounded-full bg-emerald-400 eq-bar-6" />
                        <span className="w-1.5 rounded-full bg-teal-300 eq-bar-7" />
                        <span className="w-1.5 rounded-full bg-cyan-400 eq-bar-8" />
                      </div>

                      {/* Status Headline */}
                      <div className="text-xs font-semibold">
                        {audioCall.callState === 'CONNECTED' ? (
                          <span className="text-slate-300">Camera stream paused by remote participant (Audio live)</span>
                        ) : audioCall.callState === 'CALLING' ? (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-bold animate-pulse shadow-md">
                            <PhoneCall className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
                            <span>Calling for HD Video Teleconsultation...</span>
                          </div>
                        ) : audioCall.callState === 'RINGING' ? (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold animate-pulse shadow-md">
                            <Video className="w-3.5 h-3.5 animate-bounce text-emerald-400" />
                            <span>Incoming HD Video Teleconsultation Request</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 font-bold">
                            <Activity className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                            <span>Establishing secure WebRTC video link...</span>
                          </div>
                        )}
                      </div>

                      {/* Interactive Pre-Call Controls (Mic & Cam check while calling) */}
                      {audioCall.callState === 'CALLING' && (
                        <div className="flex items-center justify-center gap-2.5 pt-1">
                          <button
                            type="button"
                            onClick={audioCall.toggleMute}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              audioCall.isMuted
                                ? 'bg-amber-500/25 border border-amber-400/60 text-amber-300 shadow-xs ring-1 ring-amber-400/40'
                                : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30'
                            }`}
                            title="Preview Microphone"
                          >
                            {audioCall.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            <span>{audioCall.isMuted ? 'Mic Muted' : 'Mic Live'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={audioCall.toggleVideo}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              !audioCall.isVideoEnabled
                                ? 'bg-amber-500/25 border border-amber-400/60 text-amber-300 shadow-xs ring-1 ring-amber-400/40'
                                : 'bg-purple-500/20 border border-purple-400/40 text-purple-300 hover:bg-purple-500/30'
                            }`}
                            title="Preview Camera"
                          >
                            {audioCall.isVideoEnabled ? <Camera className="w-3.5 h-3.5 text-purple-300" /> : <CameraOff className="w-3.5 h-3.5" />}
                            <span>{audioCall.isVideoEnabled ? 'Camera On' : 'Camera Off'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Local Camera Picture-in-Picture (PiP) Floating Preview */}
                  <div className="absolute bottom-4 right-4 z-20 w-40 sm:w-52 aspect-video rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/20 hover:border-cyan-400/60 shadow-[0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 group">
                    <video
                      ref={audioCall.localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover -scale-x-100 ${audioCall.isVideoEnabled ? 'block' : 'hidden'}`}
                    />
                    {!audioCall.isVideoEnabled && (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 p-2 text-center relative overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-1 shadow-inner">
                          <CameraOff className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-300">Camera Off</span>
                        <span className="text-[9px] text-emerald-400 font-mono font-bold">Audio Active</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-bold text-white flex items-center gap-1.5 border border-white/10 shadow-sm">
                      {audioCall.isScreenSharing && <Monitor className="w-2.5 h-2.5 text-cyan-300" />}
                      <span className="text-cyan-300">You</span>
                      {audioCall.isMuted ? (
                        <span className="text-amber-400 font-semibold">• Muted</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">• Mic On</span>
                      )}
                    </div>
                  </div>

                  {/* Connected Video HUD Badges */}
                  {audioCall.callState === 'CONNECTED' && (
                    <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/15 text-xs text-white shadow-xl">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                      <span className="font-mono font-bold text-emerald-300">{formatDuration(audioCall.callDuration)}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-[11px] font-semibold text-slate-200">{isDoctor ? patientDisplayName : doctorDisplayName}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* ── AUDIO CONSULTATION INTERFACE ── */
                <div className="p-6 sm:p-8 text-center relative z-10 w-full max-w-lg">
                  {/* Holographic Avatar with Sonic Rings */}
                  <div className="relative my-4 flex items-center justify-center">
                    {(audioCall.callState === 'CONNECTED' || audioCall.callState === 'CALLING' || audioCall.callState === 'RINGING') && (
                      <>
                        <div className="absolute w-32 h-32 rounded-full border border-cyan-500/40 call-pulse-ring-1" />
                        <div className="absolute w-44 h-44 rounded-full border border-indigo-400/30 call-pulse-ring-2" />
                        <div className="absolute w-56 h-56 rounded-full border border-purple-400/20 call-pulse-ring-3" />
                      </>
                    )}

                    <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-1 shadow-2xl shadow-indigo-500/50 flex items-center justify-center transition-all transform hover:scale-105">
                      <div className="w-full h-full rounded-[22px] bg-slate-900 flex items-center justify-center overflow-hidden">
                        {audioCall.callState === 'RINGING' ? (
                          <PhoneCall className="w-12 h-12 text-emerald-400 animate-bounce" />
                        ) : audioCall.callState === 'CONNECTED' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white tracking-wider">
                              {(isDoctor ? patientDisplayName : doctorDisplayName).substring(0, 2).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Active</span>
                            </div>
                          </div>
                        ) : audioCall.callState === 'CALLING' ? (
                          <PhoneCall className="w-12 h-12 text-cyan-400 animate-pulse" />
                        ) : audioCall.callState === 'CONNECTING' || audioCall.callState === 'ACCEPTED' ? (
                          <Activity className="w-12 h-12 text-blue-400 animate-spin" />
                        ) : (
                          <PhoneOff className="w-12 h-12 text-rose-400" />
                        )}
                      </div>

                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 border-2 border-slate-900 flex items-center justify-center text-white shadow-md">
                        {isDoctor ? <Heart className="w-4 h-4 fill-current text-white" /> : <Stethoscope className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                  </div>

                  {/* Participant Name & Specialization */}
                  <div className="space-y-1.5 mt-3">
                    <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                      <span>{audioCall.callState === 'RINGING' ? (audioCall.incomingCallInfo?.senderName || 'Incoming Patient Call') : (isDoctor ? patientDisplayName : doctorDisplayName)}</span>
                      <BadgeCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                    </h2>
                    <div className="flex items-center justify-center gap-2 text-xs text-indigo-300 font-semibold">
                      <span>{isDoctor ? 'Patient Telehealth Case' : 'Attending Medical Specialist'}</span>
                      <span>•</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-cyan-200 text-[10px] font-mono font-bold border border-indigo-400/30">
                        {activeConsultation?.specialization || 'Clinical Specialist'}
                      </span>
                    </div>
                  </div>

                  {/* Status & Live Timer Badge */}
                  <div className="mt-3.5">
                    {audioCall.callState === 'CALLING' && (
                      <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold animate-pulse shadow-sm">
                        <PhoneCall className="w-4 h-4 animate-bounce text-cyan-400" />
                        <span>Ringing remote station • Outgoing VoIP call...</span>
                      </div>
                    )}
                    {audioCall.callState === 'RINGING' && (
                      <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold animate-pulse shadow-sm">
                        <PhoneCall className="w-4 h-4 animate-bounce text-emerald-400" />
                        <span>Incoming Audio Consultation Request</span>
                      </div>
                    )}
                    {(audioCall.callState === 'CONNECTING' || audioCall.callState === 'ACCEPTED') && (
                      <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold animate-pulse shadow-sm">
                        <Activity className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Negotiating WebRTC Peer Connection...</span>
                      </div>
                    )}
                    {audioCall.callState === 'CONNECTED' && (
                      <div className="inline-flex items-center space-x-2.5 px-6 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 shadow-inner">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
                        <span className="text-xl font-mono font-black text-emerald-300 tracking-wider">
                          {formatDuration(audioCall.callDuration)}
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-500/20 px-2 py-0.5 rounded-full">
                          Live VoIP
                        </span>
                      </div>
                    )}
                    {audioCall.callState === 'RECONNECTING' && (
                      <div className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-bold animate-pulse shadow-md">
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Signal dropped • Reconnecting {audioCall.reconnectCountdown !== null ? `(${audioCall.reconnectCountdown}s)` : ''}...</span>
                      </div>
                    )}
                    {audioCall.callState === 'DECLINED' && (
                      <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
                        <span>Call Declined</span>
                      </div>
                    )}
                    {audioCall.callState === 'MISSED' && (
                      <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
                        <span>Call Missed</span>
                      </div>
                    )}
                    {audioCall.callState === 'ENDED' && (
                      <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold">
                        <span>Call Concluded</span>
                      </div>
                    )}
                    {audioCall.callState === 'FAILED' && (
                      <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
                        <span>Connection Failed</span>
                      </div>
                    )}
                  </div>

                  {/* Audio Equalizer Waveform */}
                  <AudioVisualizerWaveform
                    isConnected={audioCall.callState === 'CONNECTED'}
                    isMuted={audioCall.isMuted}
                  />

                  {/* Pre-Call Mic Check (Audio Mode) */}
                  {audioCall.callState === 'CALLING' && (
                    <div className="flex items-center justify-center pt-2">
                      <button
                        type="button"
                        onClick={audioCall.toggleMute}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          audioCall.isMuted
                            ? 'bg-amber-500/25 border border-amber-400/60 text-amber-300 shadow-xs'
                            : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300'
                        }`}
                      >
                        {audioCall.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        <span>{audioCall.isMuted ? 'Mic Muted' : 'Mic Ready'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* In-Call Clinical Snapshot & Scratchpad Slide Drawer */}
            {showInCallNotes && (
              <div className="w-full lg:w-80 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-indigo-500/30 p-4 flex flex-col justify-between overflow-y-auto max-h-80 lg:max-h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>Clinical Snapshot</span>
                    </span>
                    <button
                      onClick={() => setShowInCallNotes(false)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Case ID</span>
                      <span className="font-mono font-bold text-white">{activeConsultation?.consultation_id || 'Active'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Reason</span>
                      <span className="font-semibold text-slate-200 truncate max-w-[130px]">{activeConsultation?.reason || 'General Telehealth'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Urgency</span>
                      <span className="px-2 py-0.2 rounded-full font-bold text-[10px] bg-indigo-500/20 text-indigo-300">
                        {activeConsultation?.urgency || 'ROUTINE'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300">In-Call Clinical Scratchpad:</label>
                    <textarea
                      rows={4}
                      value={inCallNoteText}
                      onChange={(e) => setInCallNoteText(e.target.value)}
                      placeholder="Jot down symptoms, vitals, or action items during this call..."
                      className="w-full p-2.5 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (inCallNoteText.trim()) {
                        setPatientNewMessage(`[In-Call Note] ${inCallNoteText}`);
                        notify('Note copied to message composer');
                      }
                    }}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all text-center"
                  >
                    Copy to Chat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (inCallNoteText.trim()) {
                        navigator.clipboard?.writeText(inCallNoteText);
                        notify('Copied scratchpad note');
                      }
                    }}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                    title="Copy to Clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Advisory / Camera Notice Bar (Polite, Non-intrusive) */}
          {audioCall.cameraNotice && (
            <div className="mx-6 mb-2 px-4 py-2 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs text-amber-200 font-medium flex items-center justify-between shrink-0 shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{audioCall.cameraNotice}</span>
              </span>
              <button
                type="button"
                onClick={audioCall.clearCameraNotice}
                className="text-amber-400 hover:text-white ml-2 text-xs font-bold cursor-pointer px-2 py-0.5 rounded-lg hover:bg-amber-500/20 transition-all"
              >
                ✕
              </button>
            </div>
          )}

          {/* Error Message Alert */}
          {audioCall.error && (
            <div className="mx-6 mb-2 px-4 py-2 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-xs text-rose-300 font-medium text-center shrink-0 flex items-center justify-between shadow-sm animate-fade-in">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{audioCall.error}</span>
              </span>
              <button
                type="button"
                onClick={audioCall.clearError}
                className="text-rose-400 hover:text-white ml-2 text-xs font-bold cursor-pointer px-2 py-0.5 rounded-lg hover:bg-rose-500/20 transition-all"
              >
                ✕
              </button>
            </div>
          )}

          {/* ── QUICK REACTIONS BAR (Zoom-style quick floating pills) ──── */}
          {(audioCall.callState === 'CONNECTED' || audioCall.callState === 'CALLING') && (
            <div className="px-4 py-2 bg-slate-950/40 border-t border-white/5 flex items-center justify-center gap-2 overflow-x-auto shrink-0 select-none">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 hidden sm:inline mr-1">
                Quick React:
              </span>
              {[
                { emoji: '👋', label: 'Wave' },
                { emoji: '👍', label: 'All Good' },
                { emoji: '🩺', label: 'Audio Clear' },
                { emoji: '📋', label: 'Taking Notes' },
                { emoji: '❤️', label: 'Thank You' },
                { emoji: '👏', label: 'Bravo' }
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  onClick={() => triggerCallReaction(btn.emoji, btn.label)}
                  className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-indigo-600/40 border border-slate-700/60 hover:border-cyan-400/60 text-white text-xs font-semibold flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm hover:shadow-cyan-500/20"
                >
                  <span className="text-sm">{btn.emoji}</span>
                  <span className="text-[11px] text-slate-200">{btn.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* ── BOTTOM ERGONOMIC FLOATING ACTION DOCK (Zoom/FaceTime Grade) ───── */}
          <div className="p-3 sm:p-5 pt-2 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent flex items-center justify-center relative z-20 shrink-0">
            {/* Zoom Reactions Popover */}
            {showReactionPicker && (
              <div className="absolute bottom-20 z-50 bg-slate-900/95 backdrop-blur-2xl border border-indigo-400/40 rounded-3xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col gap-2 min-w-[290px] animate-fade-in">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 px-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-amber-400" />
                    <span>Meeting Reactions</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowReactionPicker(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { emoji: '👍', label: 'All Good' },
                    { emoji: '👋', label: 'Wave' },
                    { emoji: '🩺', label: 'Audio Clear' },
                    { emoji: '❤️', label: 'Thank You' },
                    { emoji: '📋', label: 'Taking Notes' },
                    { emoji: '👏', label: 'Bravo' },
                    { emoji: '💡', label: 'Question' },
                    { emoji: '🔥', label: 'Great' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        triggerCallReaction(item.emoji, item.label);
                        setShowReactionPicker(false);
                      }}
                      className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-800/60 hover:bg-indigo-600/30 border border-slate-700/50 hover:border-cyan-400/50 text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer group"
                      title={item.label}
                    >
                      <span className="text-2xl group-hover:scale-125 transition-transform">{item.emoji}</span>
                      <span className="text-[9px] font-medium text-slate-300 mt-1 truncate max-w-[55px]">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* RINGING State Actions */}
            {audioCall.callState === 'RINGING' && (
              <div className="flex items-center gap-4">
                <button
                  onClick={audioCall.declineCall}
                  className="px-6 py-3.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white flex items-center gap-2 shadow-xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-rose-400/30 font-bold text-xs uppercase tracking-wider"
                  title="Decline Call"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Decline</span>
                </button>
                <button
                  onClick={() => audioCall.acceptCall(audioCall.incomingCallInfo?.callType || 'video')}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white flex items-center gap-2 shadow-2xl shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse border border-emerald-400/40 font-bold text-xs uppercase tracking-wider"
                  title={audioCall.incomingCallInfo?.callType === 'video' ? 'Accept Video Call' : 'Accept Audio Call'}
                >
                  {audioCall.incomingCallInfo?.callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                  <span>Accept Call</span>
                </button>
              </div>
            )}

            {/* CALLING State Actions */}
            {audioCall.callState === 'CALLING' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={audioCall.cancelCall}
                  className="px-8 py-3.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white flex items-center gap-2 shadow-2xl shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-rose-400/40 font-bold text-xs uppercase tracking-wider"
                  title="Cancel Call"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span>Cancel Calling</span>
                </button>
              </div>
            )}

            {/* CONNECTED & RECONNECTING State Actions (Zoom-Style Pill Dock) */}
            {(audioCall.callState === 'CONNECTED' || audioCall.callState === 'RECONNECTING') && (
              <div className="call-glass-dock rounded-full px-4 sm:px-6 py-2.5 flex items-center gap-2.5 sm:gap-3.5 shadow-2xl">
                {/* Microphone Mute */}
                <button
                  onClick={audioCall.toggleMute}
                  className={`call-control-btn w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    audioCall.isMuted
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-slate-800/80 hover:bg-slate-700/90 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  }`}
                  title={audioCall.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {audioCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Camera Video Toggle (For Video Calls) */}
                {audioCall.callType === 'video' && (
                  <button
                    onClick={audioCall.toggleVideo}
                    className={`call-control-btn w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      !audioCall.isVideoEnabled
                        ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-400 border border-slate-700/60'
                        : 'bg-slate-800/80 hover:bg-slate-700/90 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    }`}
                    title={audioCall.isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {audioCall.isVideoEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                  </button>
                )}

                {/* Screen Share Toggle (For Video Calls) */}
                {audioCall.callType === 'video' && (
                  <button
                    onClick={audioCall.toggleScreenShare}
                    className={`call-control-btn w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      audioCall.isScreenSharing
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/40 ring-2 ring-indigo-400/60'
                        : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 border border-slate-700/60'
                    }`}
                    title={audioCall.isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
                  >
                    <MonitorUp className={`w-5 h-5 ${audioCall.isScreenSharing ? 'text-white' : 'text-indigo-300'}`} />
                  </button>
                )}

                {/* Zoom Reactions Popover Trigger */}
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className={`call-control-btn w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    showReactionPicker
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'bg-slate-800/80 hover:bg-slate-700/90 text-amber-300 border border-slate-700/60'
                  }`}
                  title="Reactions (Emojis)"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Speaker Output Toggle */}
                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`call-control-btn w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    isSpeakerOn
                      ? 'bg-slate-800/80 hover:bg-slate-700/90 text-blue-400 border border-slate-700/60'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                  title="Toggle Speaker Output"
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                </button>

                {/* Toggle In-Call Clinical Notes Drawer */}
                <button
                  onClick={() => setShowInCallNotes(!showInCallNotes)}
                  className={`call-control-btn w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                    showInCallNotes
                      ? 'bg-indigo-600 text-white border border-indigo-400 shadow-md shadow-indigo-600/40'
                      : 'bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 border border-slate-700/60'
                  }`}
                  title="Clinical Notes & Scratchpad"
                >
                  <ClipboardList className="w-5 h-5" />
                </button>

                <div className="h-6 w-px bg-white/15 hidden sm:block mx-1" />

                {/* End Call Button */}
                <button
                  onClick={audioCall.endCall}
                  className="px-5 sm:px-6 h-12 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-700 hover:to-red-700 text-white flex items-center gap-2 shadow-xl shadow-rose-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold text-xs uppercase tracking-wider border border-rose-400/40"
                  title="End Teleconsultation"
                >
                  <PhoneOff className="w-5 h-5" />
                  <span className="hidden sm:inline">End Call</span>
                </button>
              </div>
            )}

            {/* CONNECTING / ACCEPTED State Action */}
            {(audioCall.callState === 'CONNECTING' || audioCall.callState === 'ACCEPTED') && (
              <button
                onClick={audioCall.endCall}
                className="px-8 py-4 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 hover:from-rose-700 hover:to-red-600 text-white flex items-center justify-center space-x-2 shadow-xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-rose-400/40"
                title="Cancel"
              >
                <PhoneOff className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">Cancel</span>
              </button>
            )}

            {/* Terminal States Actions */}
            {['DECLINED', 'MISSED', 'ENDED', 'FAILED'].includes(audioCall.callState) && (
              <div className="flex items-center space-x-3 w-full justify-center">
                <button
                  onClick={() => {
                    audioCall.resetToIdle();
                    setIsCallMinimized(false);
                  }}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Return to Workspace
                </button>
                {isDoctor && ['DECLINED', 'FAILED', 'MISSED'].includes(audioCall.callState) && (
                  <button
                    onClick={() => {
                      const prevType = audioCall.callType;
                      audioCall.resetToIdle();
                      setIsCallMinimized(false);
                      setTimeout(() => audioCall.startCall(prevType), 300);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold transition-all cursor-pointer shadow-xl shadow-indigo-500/40 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Call</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: PATIENT PORTAL DASHBOARD (OVERVIEW MODE)
  // ═══════════════════════════════════════════════════════════════════════
  if (isPatient && patientViewMode === 'OVERVIEW') {
    return (
      <PageContainer className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 pb-24 space-y-8">
        
        {/* Toast Alert */}
        {toastMsg && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-slide-up">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* ── HERO BANNER & STATS ────────────────────────────────────────── */}
        <div className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl shadow-2xl border border-indigo-500/30 backdrop-blur-md">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none call-aura-glow" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none call-aura-glow" style={{ animationDelay: '3s' }} />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <span className="px-3.5 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-extrabold rounded-full flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                  TeleMed Physician Network Active
                </span>
                <span className="text-xs text-indigo-200/80 font-mono px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/25">Level 8 Telehealth Protocol</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>My Doctor Consultations</span>
                <Sparkles className="w-5 h-5 text-cyan-300" />
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Connect directly with board-certified medical specialists, attend live chat teleconsultations, review clinical prescriptions, and manage your health records in real time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Request New Consultation</span>
              </button>

              <button
                onClick={() => navigate('/appointments')}
                className="px-5 py-3 bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Book Appointment</span>
              </button>

              <button
                onClick={() => loadWorkspaceData(true)}
                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-2xl transition-all cursor-pointer"
                title="Refresh Workspace"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ── CONSULTATION MODALITY OPTIONS ─────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--primary)]" />
              <span>Teleconsultation Options</span>
            </h2>
            <span className="text-xs font-semibold text-[var(--text-muted)]">Supported Modalities</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Live Chat Option */}
            <div className="p-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl text-[var(--text-main)] shadow-md relative overflow-hidden group hover:border-[var(--primary)] transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AVAILABLE NOW
                </span>
              </div>
              <h3 className="text-sm font-extrabold mb-1 text-[var(--text-main)]">Live Chat Consultation</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                Instant 2-way secure clinical text chat, real-time file sharing, and physician guidance.
              </p>
              <div className="flex items-center text-[11px] font-bold text-[var(--primary)] group-hover:underline transition-colors">
                <span>Active for Assigned Consultations</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Physician-Initiated Telehealth Information Card (Calls only started by doctor) */}
            <div
              className={`p-5 bg-[var(--bg-surface)] border rounded-2xl text-[var(--text-main)] shadow-md relative overflow-hidden group transition-all ${
                isCallEligible ? 'border-indigo-400/40 hover:border-indigo-500/70' : 'border-[var(--border-subtle)]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isCallEligible ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-400' : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400/50'
                }`}>
                  <PhoneCall className="w-5 h-5" />
                </div>
                {isCallEligible ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    READY FOR DOCTOR CALL
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-500/20 border border-slate-500/30 text-slate-400">
                    STANDBY
                  </span>
                )}
              </div>
              <h3 className="text-sm font-extrabold mb-1 text-[var(--text-main)]">Physician-Initiated Audio Telehealth</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                {isCallEligible
                  ? 'Your attending physician will initiate the secure audio consultation. An incoming call prompt will appear automatically on your screen for you to attend.'
                  : 'Direct encrypted VoIP audio consultation is initiated by your assigned physician during active appointments.'}
              </p>
              <div className="flex items-center text-[11px] font-bold text-indigo-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                <span>Encrypted 2-Way WebRTC Channel Active</span>
              </div>
            </div>

            {/* Physician-Initiated HD Video Teleconsultation Card */}
            <div
              className={`p-5 bg-[var(--bg-surface)] border rounded-2xl text-[var(--text-main)] shadow-md relative overflow-hidden group transition-all ${
                isCallEligible ? 'border-purple-400/40 hover:border-purple-500/70' : 'border-[var(--border-subtle)]'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isCallEligible ? 'bg-purple-500/20 border border-purple-400/40 text-purple-400' : 'bg-purple-500/10 border border-purple-500/20 text-purple-400/50'
                }`}>
                  <Video className="w-5 h-5" />
                </div>
                {isCallEligible ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    READY FOR DOCTOR CALL
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-500/20 border border-slate-500/30 text-slate-400">
                    STANDBY
                  </span>
                )}
              </div>
              <h3 className="text-sm font-extrabold mb-1 text-[var(--text-main)]">Physician-Initiated HD Video Consultation</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                {isCallEligible
                  ? 'When your doctor starts a video consultation room, an incoming video ring notification will appear on your device so you can attend instantly.'
                  : 'High-definition 1-to-1 encrypted video calls are conducted when initiated by your attending specialist.'}
              </p>
              <div className="flex items-center text-[11px] font-bold text-purple-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                <span>Auto-Attending Telemedicine Reception</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CONSULTATIONS CARDS GRID & SEARCH BAR ────────────────────────── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-xs">
            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              {[
                { id: 'ALL', label: `All Consultations (${consultations.length})` },
                ...(isDoctor ? [{ id: 'OPEN_QUEUE', label: 'Open Requests' }] : []),
                { id: 'ACTIVE', label: 'Active & Assigned' },
                { id: 'PENDING', label: 'Pending Assignment' },
                { id: 'COMPLETED', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setQueueFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    queueFilter === tab.id
                      ? 'bg-[var(--primary)] text-white shadow-sm'
                      : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div ref={searchContainerRef} className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-[var(--primary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Live search doctor, ID, or specialty..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSuggestionsOpen(e.target.value.trim().length > 0);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSuggestionsOpen(true);
                }}
                className="w-full pl-9 pr-14 py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-dim)] shadow-xs"
              />
              {searchQuery.trim() && (
                <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-bold pointer-events-none">
                  {filteredConsultations.length}
                </span>
              )}
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsSuggestionsOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--danger)]"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Floating Autocomplete Dropdown */}
              {isSuggestionsOpen && searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--bg-surface)] border border-[var(--primary)]/40 rounded-2xl shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto custom-scrollbar p-2 animate-fadeIn">
                  <div className="px-3 py-1 border-b border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                      Consultation Matches
                    </span>
                    <span>{filteredConsultations.length} cases</span>
                  </div>

                  {filteredConsultations.length > 0 ? (
                    filteredConsultations.slice(0, 5).map((c, idx) => {
                      const dName = c.doctor_name || c.assigned_doctor_name || 'Specialist';
                      return (
                        <div
                          key={`cons_sugg_${c.id || idx}`}
                          onClick={() => {
                            setSearchQuery(dName);
                            setIsSuggestionsOpen(false);
                          }}
                          className="p-2 hover:bg-[var(--primary)]/10 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2 text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--text-main)] truncate">
                              <HighlightMatch text={dName} query={searchQuery} />
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                              <HighlightMatch text={c.consultation_id} query={searchQuery} /> • {c.category || c.specialization}
                            </p>
                          </div>
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                            {c.status || 'ACTIVE'}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-[var(--text-muted)]">
                      No consultations match "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cards List */}
          {loading ? (
            <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200/80">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Syncing patient consultation workspace...</p>
            </div>
          ) : filteredConsultations.length === 0 ? (
            <div className="py-16 text-center space-y-4 px-6 border-2 border-dashed border-slate-200/80 rounded-3xl bg-slate-50/50">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto shadow-sm">
                <Stethoscope className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">No Consultation Records Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                  You currently have no doctor consultations matching this filter. You can request a new consultation with a specialist anytime.
                </p>
              </div>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <PlusCircle size={16} />
                <span>Request New Consultation</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredConsultations.map((c, idx) => {
                const statusUpper = (c.status || 'ACTIVE').toUpperCase();
                const isCompleted = statusUpper === 'COMPLETED';
                const isPending = ['PENDING', 'REQUESTED'].includes(statusUpper);
                const isActive = ['ACTIVE', 'ASSIGNED', 'ACCEPTED', 'IN_CONSULTATION', 'IN_PROGRESS'].includes(statusUpper);
                const docName = c.doctor_name || c.assigned_doctor_name || (isPending ? 'Searching for Specialist' : 'Attending Physician');

                return (
                  <div
                    key={c.consultation_id || c.id || idx}
                    className="p-5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--primary)] rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                            {docName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-[var(--text-main)]">
                              <HighlightMatch text={docName} query={searchQuery} />
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] font-medium">
                              <HighlightMatch text={c.category || c.specialization || 'General Consultation'} query={searchQuery} />
                            </p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 ${
                          isCompleted ? 'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)]' :
                          isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          {statusUpper}
                        </span>
                      </div>

                      <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[var(--text-muted)]">
                          <span className="font-semibold">Consultation ID:</span>
                          <span className="font-mono text-[var(--text-main)] font-bold">
                            <HighlightMatch text={c.consultation_id} query={searchQuery} />
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[var(--text-muted)]">
                          <span className="font-semibold">Primary Reason:</span>
                          <span className="text-[var(--text-main)] font-medium truncate max-w-[180px]">
                            <HighlightMatch text={c.reason || 'General Health Check'} query={searchQuery} />
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[var(--text-muted)]">
                          <span className="font-semibold">Urgency:</span>
                          <span className={`font-bold ${c.urgency === 'URGENT' ? 'text-rose-500' : 'text-[var(--primary)]'}`}>
                            {c.urgency || 'ROUTINE'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Action Button */}
                    <div className="pt-2 border-t border-[var(--border-subtle)]">
                      {isActive ? (
                        <button
                          onClick={() => {
                            setSelectedConsultation(c);
                            setPatientViewMode('CHAT_WORKSPACE');
                          }}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 animate-bounce" />
                          <span>Attend Consultation (Live Chat)</span>
                        </button>
                      ) : isCompleted ? (
                        <button
                          onClick={() => setSummaryModalConsultation(c)}
                          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-emerald-400" />
                          <span>View Summary & Prescription</span>
                        </button>
                      ) : (
                        isDoctor && isPending && !c.assigned_doctor_id ? (
                          <button
                            onClick={() => handleClaimConsultation(c.consultation_id || c.id)}
                            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
                          >
                            <Stethoscope className="w-4 h-4 text-emerald-100" />
                            <span>Attend Request (Claim)</span>
                          </button>
                        ) : (
                          <div className="w-full py-2.5 px-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl text-center flex items-center justify-center space-x-2">
                            <Clock className="w-4 h-4 text-amber-600" />
                            <span>Awaiting Doctor Assignment</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── REQUEST NEW CONSULTATION MODAL ───────────────────────────────── */}
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Stethoscope size={18} />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">Request Doctor Consultation</h3>
                </div>
                <button onClick={() => setIsNewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Medical Specialization</label>
                  <select
                    value={newRequestForm.specialization}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, specialization: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="General Medicine">General Medicine & Internal Care</option>
                    <option value="Cardiology">Cardiology & Cardiovascular</option>
                    <option value="Endocrinology">Endocrinology & Diabetes</option>
                    <option value="Gastroenterology">Gastroenterology & Gut Health</option>
                    <option value="Hepatology">Hepatology & Liver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Consultation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Follow up on HbA1c lab results and dietary plan"
                    value={newRequestForm.reason}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, reason: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Urgency Level</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['ROUTINE', 'SOON'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setNewRequestForm({ ...newRequestForm, urgency: u })}
                        className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                          newRequestForm.urgency === u
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {u === 'ROUTINE' ? 'Routine Consultation' : 'Urgent Assessment'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes for Attending Doctor</label>
                  <textarea
                    rows={3}
                    placeholder="Provide any specific symptoms or health context..."
                    value={newRequestForm.message}
                    onChange={(e) => setNewRequestForm({ ...newRequestForm, message: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
                  >
                    {submittingRequest ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Submit Request</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── SUMMARY MODAL FOR COMPLETED CONSULTATIONS ───────────────────── */}
        {summaryModalConsultation && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-extrabold text-slate-900">Consultation Summary & Prescription</h3>
                </div>
                <button onClick={() => setSummaryModalConsultation(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <div>
                    <span className="text-slate-500 font-bold block">Attending Doctor</span>
                    <span className="text-slate-900 font-extrabold">{summaryModalConsultation.doctor_name || 'Dr. Medical Officer'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 font-bold block">Consultation ID</span>
                    <span className="text-slate-900 font-mono font-bold">{summaryModalConsultation.consultation_id}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-800">Doctor Diagnosis & Clinical Notes:</span>
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-slate-900 leading-relaxed font-medium">
                    {clinicalNotes.assessmentDiagnosis || summaryModalConsultation.notes || 'Routine health evaluation completed cleanly.'}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-extrabold text-slate-800">Prescription & Medical Guidance:</span>
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-slate-900 font-mono text-[11px]">
                    {clinicalNotes.prescription || 'No specific prescription modification recorded.'}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSummaryModalConsultation(null)}
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Audio & Video Teleconsultation Suite in Patient Overview Mode */}
        {renderTeleconsultationSuite()}
      </PageContainer>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: LIVE CHAT WORKSPACE (PATIENT ATTEND MODE & DOCTOR PORTAL)
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-[1600px] w-full mx-auto p-2.5 sm:p-3 flex flex-col h-full max-h-full overflow-hidden space-y-2.5 sm:space-y-3">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-slide-up">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── TOP HEADER BANNER ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-xl border border-indigo-500/30 shrink-0 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center space-x-3.5 relative z-10">
          {isPatient && (
            <button
              onClick={() => setPatientViewMode('OVERVIEW')}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 transition-all cursor-pointer mr-1 flex items-center space-x-1"
              title="Return to Consultations List"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold">Back</span>
            </button>
          )}

          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white shrink-0">
            <Stethoscope className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>{isDoctor ? 'Doctor Clinical Workspace' : 'Attending Consultation Live Chat'}</span>
              </h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                {isDoctor ? 'Doctor Portal Active' : 'Live Chat Workspace Active'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isDoctor
                ? 'Review assigned patient intake reports, maintain SOAP clinical notes, and manage teleconsultations.'
                : `Communicating live with ${doctorDisplayName} for Consultation ID ${activeConsultation?.consultation_id || 'Active'}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Audio & Video Call Launch Buttons — DOCTOR ONLY */}
          {isDoctor && isCallEligible && audioCall.callState === 'IDLE' && (
            <>
              <button
                onClick={() => audioCall.startCall('audio')}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white border border-indigo-400/30 rounded-xl transition-all cursor-pointer flex items-center space-x-2 text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95"
                title="Start Voice Telehealth Call with Patient"
              >
                <PhoneCall className="w-4 h-4" />
                <span className="hidden sm:inline">Audio Call</span>
              </button>
              <button
                onClick={() => audioCall.startCall('video')}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-400/30 rounded-xl transition-all cursor-pointer flex items-center space-x-2 text-xs font-bold shadow-md shadow-purple-500/20 active:scale-95"
                title="Start HD Video Teleconsultation with Patient"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Video Call</span>
              </button>
            </>
          )}

          {/* Patient Telehealth Attendance Status Indicator (When doctor hasn't called yet) */}
          {!isDoctor && isCallEligible && audioCall.callState === 'IDLE' && (
            <div className="px-3.5 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Ready for Doctor Call</span>
              <span className="sm:hidden">Ready</span>
            </div>
          )}
          {/* Active Call Duration Badge */}
          {audioCall.callState === 'CONNECTED' && (
            <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center space-x-2 text-xs font-mono font-bold text-emerald-300 animate-pulse">
              {audioCall.callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              <span>{formatDuration(audioCall.callDuration)}</span>
            </div>
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
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer text-xs">Dismiss</button>
        </div>
      )}

      {/* ── ULTRA-PREMIUM WEBRTC AUDIO & VIDEO TELECONSULTATION OVERLAY ──── */}
      {renderTeleconsultationSuite()}


      {/* ── 2-COLUMN CLINICAL WORKSPACE GRID ───────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">

        {/* ── LEFT COLUMN: Case Queue / Consultations List (4 cols) ───────── */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-3 shadow-lg shadow-slate-100/60 flex flex-col h-full overflow-hidden">
          {/* Queue Header & Filters */}
          <div className="space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                <span>{isDoctor ? 'Assigned Patient Queue' : 'My Consultation Cases'}</span>
                <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-mono">
                  {filteredConsultations.length}
                </span>
              </h3>
              {isPatient && (
                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <PlusCircle size={14} />
                  <span>New Request</span>
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl text-xs font-bold text-slate-600">
              {['ALL', 'ACTIVE', 'PENDING', 'COMPLETED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setQueueFilter(f)}
                  className={`flex-1 py-1 rounded-lg transition-all text-[11px] cursor-pointer ${
                    queueFilter === f ? 'bg-white text-slate-900 shadow-xs font-extrabold' : 'hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={isDoctor ? "Search patient name..." : "Search doctor name or specialty..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
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
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                        {(displayName || 'Doc').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            <HighlightMatch text={displayName} query={searchQuery} />
                          </h4>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                            urgencyUpper === 'URGENT' || urgencyUpper === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                            urgencyUpper === 'SOON' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {urgencyUpper}
                          </span>
                        </div>

                        <p className="text-[11px] font-semibold text-slate-500 truncate mb-1">
                          <HighlightMatch text={c.category || c.specialization || 'Clinical Evaluation'} query={searchQuery} />
                        </p>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-mono font-medium">ID: <HighlightMatch text={c.consultation_id} query={searchQuery} /></span>
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
          
          {!activeConsultation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-sm">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                {isDoctor ? 'No Patient Consultation Selected' : 'No Active Doctor Consultation'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                {isDoctor
                  ? 'Select an assigned patient consultation case from the left panel to review clinical data, chat live, or issue diagnoses & prescriptions.'
                  : 'You do not currently have an active doctor consultation. Create a new consultation request or book an appointment to begin.'}
              </p>
              {!isDoctor && (
                <button
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center space-x-2"
                >
                  <PlusCircle size={16} />
                  <span>Request Doctor Consultation</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Active Workspace Header Bar */}
              <div className="p-3 sm:p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 bg-white shrink-0 shadow-2xs">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                    {(isDoctor ? patientDisplayName : doctorDisplayName).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-sm font-extrabold text-slate-900 truncate">
                        {isDoctor ? patientDisplayName : doctorDisplayName}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopyPatientId(isDoctor ? patientDisplayId : (activeConsultation?.consultation_id || 'Active'))}
                        className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-2 py-0.5 rounded-md whitespace-nowrap tracking-normal shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy ID to clipboard"
                      >
                        <span>{isDoctor ? patientDisplayId : (activeConsultation?.consultation_id || 'Active')}</span>
                        {copiedPatientId ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} className="text-slate-400" />}
                      </button>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {(activeConsultation?.status || 'ACTIVE').toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {activeConsultation?.category || activeConsultation?.specialization || 'Clinical Assessment'} • {isDoctor ? 'Registered Patient' : 'Attending Physician'}
                    </p>
                  </div>
                </div>

                {/* Header Right Action Buttons */}
                <div className="flex items-center space-x-2 shrink-0 flex-wrap justify-end gap-1.5 ml-auto">
                  <ConsultationTimer isActive={activeConsultation?.status !== 'COMPLETED'} />

                  {isDoctor && (activeConsultation?.status === 'ASSIGNED' || activeConsultation?.status === 'REQUESTED') && (
                    <button
                      onClick={handleAcceptAssignment}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 whitespace-nowrap shrink-0"
                    >
                      <Check size={14} />
                      <span>Accept Case</span>
                    </button>
                  )}

                  {isDoctor && activeConsultation?.status !== 'COMPLETED' && (
                    <button
                      onClick={handleCompleteConsultation}
                      disabled={completing}
                      className="px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shadow-blue-500/20 whitespace-nowrap shrink-0"
                    >
                      {completing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      <span>Sign & Complete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-3 sm:px-4 shrink-0 overflow-x-auto custom-scrollbar">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setWorkspaceTab('chat')}
                    className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                      workspaceTab === 'chat'
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare size={14} />
                    <span>Live Consultation Chat</span>
                  </button>

                  {isDoctor && (
                    <button
                      onClick={() => setWorkspaceTab('soap')}
                      className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                        workspaceTab === 'soap'
                          ? 'border-blue-600 text-blue-600 bg-white'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Edit3 size={14} />
                      <span>SOAP Clinical Notes</span>
                    </button>
                  )}

                  <button
                    onClick={() => setWorkspaceTab('records')}
                    className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
                      workspaceTab === 'records'
                        ? 'border-blue-600 text-blue-600 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <FileText size={14} />
                    <span>Biomarkers & Records</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-medium">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span>HIPAA Encrypted Channel</span>
                </div>
              </div>

              {/* TAB 1: LIVE CHAT AREA */}
              {workspaceTab === 'chat' && (
                <div className="flex-1 flex flex-col justify-between overflow-hidden bg-slate-50/40 min-h-0 relative">
                  {/* Messages Feed */}
                  <div
                    ref={consultationMessagesContainerRef}
                    onScroll={handleConsultationScroll}
                    className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar min-h-0 scroll-smooth"
                  >
                    {loadingMessages ? (
                      <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                        <p>Syncing encrypted message log...</p>
                      </div>
                    ) : messagesThread.length === 0 ? (
                      /* Interactive Clinical Starter Launchpad */
                      <div className="py-4 px-3 flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 border border-blue-400/30 flex items-center justify-center text-blue-600 shadow-inner">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {isDoctor ? 'Clinical Consultation Room Ready' : 'Secure Consultation Channel Ready'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
                            {isDoctor
                              ? 'Start the consultation with a greeting, review chief complaints, or pick a starter prompt below:'
                              : 'Communicate directly with your attending physician. Click a topic below or type your message to begin:'}
                          </p>
                        </div>

                        {/* Interactive Starter Action Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full text-left pt-1">
                          {(isDoctor ? DOCTOR_QUICK_PROMPTS.slice(0, 4) : PATIENT_QUICK_PROMPTS.slice(0, 4)).map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleApplyQuickPrompt(item.text)}
                              className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-xs text-slate-800 font-semibold shadow-2xs hover:shadow-xs group cursor-pointer flex flex-col justify-between"
                            >
                              <span className="text-[11px] font-extrabold text-blue-600 mb-0.5 flex items-center justify-between">
                                <span>{item.label}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-blue-600 transition-all" />
                              </span>
                              <span className="text-[10.5px] text-slate-500 line-clamp-2 leading-relaxed">
                                {item.text}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      messagesThread.map((msg, i) => {
                        const isSelf = msg.role === role || msg.sender === (user?.full_name || user?.name);
                        return (
                          <div
                            key={msg.id || i}
                            className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center space-x-1.5 mb-1 px-1">
                              <span className="text-[10px] font-bold text-slate-500">{msg.sender}</span>
                              <span className="text-[9px] text-slate-400">• {msg.time}</span>
                            </div>
                            <div
                              className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed font-medium shadow-xs ${
                                isSelf
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                                  : 'bg-white border border-slate-200/90 text-slate-900 rounded-bl-none shadow-slate-100'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {isOtherTyping && (
                      <div className="flex items-center space-x-2 text-xs text-slate-400 italic">
                        <div className="flex space-x-1">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span>{isDoctor ? 'Patient is typing...' : 'Attending physician is typing...'}</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Floating Scroll-to-Bottom Button */}
                  {showConsultationScrollBottomBtn && (
                    <button
                      type="button"
                      onClick={() => scrollConsultationToBottom(true)}
                      className="absolute bottom-20 right-6 z-30 px-3.5 py-1.5 bg-white/95 hover:bg-white text-slate-800 hover:text-blue-600 border border-slate-200/90 shadow-xl shadow-slate-400/20 rounded-full text-xs font-bold flex items-center space-x-1.5 backdrop-blur-md transition-all hover:scale-105 cursor-pointer animate-fade-in group"
                      title="Jump to latest messages"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
                      <span>Latest Messages</span>
                    </button>
                  )}

                  {/* Quick Interactive Prompt Pills Bar */}
                  {activeConsultation?.status !== 'COMPLETED' && (
                    <div className="px-3 py-2 bg-white/95 border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto custom-scrollbar shrink-0">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
                        <Sparkles size={11} className="text-blue-500" />
                        <span>Quick:</span>
                      </span>
                      {(isDoctor ? DOCTOR_QUICK_PROMPTS : PATIENT_QUICK_PROMPTS).map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyQuickPrompt(prompt.text)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200/60 hover:border-blue-300 transition-all shrink-0 cursor-pointer active:scale-95"
                          title={prompt.text}
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Chat Input Bar */}
                  <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200/80 flex items-center space-x-2 shrink-0">
                    <input
                      ref={messageInputRef}
                      type="text"
                      placeholder={activeConsultation?.status === 'COMPLETED' ? 'Consultation completed (read only).' : (isDoctor ? 'Type message to patient...' : 'Type message to attending doctor...')}
                      disabled={activeConsultation?.status === 'COMPLETED' || messageSending}
                      value={patientNewMessage}
                      onChange={handleInputChange}
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white disabled:opacity-60 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!patientNewMessage.trim() || activeConsultation?.status === 'COMPLETED' || messageSending}
                      className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-blue-500/20 flex items-center space-x-1.5 shrink-0 active:scale-95"
                    >
                      {messageSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                      <span>Send</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 2: SOAP CLINICAL NOTES (DOCTOR PORTAL) */}
              {workspaceTab === 'soap' && (
                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4 bg-slate-50/30 min-h-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Edit3 size={13} className="text-blue-600" />
                        <span>SOAP Clinical Documentation</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Maintain structured physician encounter notes and treatment plan.</p>
                    </div>
                    {isDoctor && (
                      <button
                        onClick={handleSaveClinicalNotes}
                        disabled={savingNotes}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 transition-all"
                      >
                        {savingNotes ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                        <span>Save Clinical Notes</span>
                      </button>
                    )}
                  </div>

                  {/* 1-Click Specialty Clinical Templates */}
                  {isDoctor && (
                    <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                          <Sparkles size={13} className="text-blue-600" />
                          <span>Specialty Clinical Templates (1-Click Auto-Fill)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">SOAP Presets</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CLINICAL_TEMPLATES.map((tmpl) => {
                          const Icon = tmpl.icon;
                          return (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => handleApplyTemplate(tmpl)}
                              className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-blue-50/80 hover:border-blue-400/80 transition-all text-left group cursor-pointer shadow-2xs hover:shadow-xs"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Icon size={14} className="text-blue-600 group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-100/70 text-blue-700">{tmpl.badge}</span>
                              </div>
                              <span className="text-xs font-bold text-slate-900 block truncate">{tmpl.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Structured SOAP Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-lg bg-blue-100 text-blue-700 text-[11px] font-black flex items-center justify-center">S</span>
                        <label className="text-xs font-extrabold text-slate-800">Subjective — Chief Complaints</label>
                      </div>
                      <textarea
                        rows={3}
                        value={clinicalNotes.chiefComplaints}
                        onChange={(e) => setClinicalNotes({ ...clinicalNotes, chiefComplaints: e.target.value })}
                        placeholder="Patient-reported symptoms, pain scale, and duration..."
                        className="w-full p-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-lg bg-purple-100 text-purple-700 text-[11px] font-black flex items-center justify-center">O</span>
                        <label className="text-xs font-extrabold text-slate-800">Objective — Physical & Vitals</label>
                      </div>
                      <textarea
                        rows={3}
                        value={clinicalNotes.examination}
                        onChange={(e) => setClinicalNotes({ ...clinicalNotes, examination: e.target.value })}
                        placeholder="Vital observations, examination findings, and telemetry..."
                        className="w-full p-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-800 text-[11px] font-black flex items-center justify-center">A</span>
                      <label className="text-xs font-extrabold text-slate-800">Assessment & Diagnosis</label>
                    </div>
                    <textarea
                      rows={2}
                      value={clinicalNotes.assessmentDiagnosis}
                      onChange={(e) => setClinicalNotes({ ...clinicalNotes, assessmentDiagnosis: e.target.value })}
                      placeholder="Doctor primary diagnosis, differential diagnoses, and assessment..."
                      className="w-full p-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black flex items-center justify-center">P</span>
                      <label className="text-xs font-extrabold text-slate-800">Plan — Prescription & Follow-up</label>
                    </div>
                    <textarea
                      rows={3}
                      value={clinicalNotes.prescription}
                      onChange={(e) => setClinicalNotes({ ...clinicalNotes, prescription: e.target.value })}
                      placeholder="Rx medication name, dosage, frequency, and patient lifestyle guidance..."
                      className="w-full p-2.5 text-xs bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono transition-all"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: BIOMARKERS & RECORDS HUB */}
              {workspaceTab === 'records' && (
                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4 bg-slate-50/30 min-h-0">
                  <RiskScoreGauge score={38} maxScore={100} />

                  {/* Telemetry Vitals Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500">Heart Rate</span>
                        <Heart size={14} className="text-rose-500 animate-pulse" />
                      </div>
                      <div className="text-lg font-black text-slate-900">72 <span className="text-[10px] font-medium text-slate-400">bpm</span></div>
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Normal Sinus</span>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500">Blood Pressure</span>
                        <Activity size={14} className="text-indigo-500" />
                      </div>
                      <div className="text-lg font-black text-slate-900">120/80 <span className="text-[10px] font-medium text-slate-400">mmHg</span></div>
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Optimal</span>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500">Oxygen (SpO2)</span>
                        <Waves size={14} className="text-sky-500" />
                      </div>
                      <div className="text-lg font-black text-slate-900">98% <span className="text-[10px] font-medium text-slate-400">room air</span></div>
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Healthy</span>
                    </div>

                    <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500">Body Temp</span>
                        <Thermometer size={14} className="text-amber-500" />
                      </div>
                      <div className="text-lg font-black text-slate-900">98.6°F <span className="text-[10px] font-medium text-slate-400">oral</span></div>
                      <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Normothermic</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white border border-slate-200/90 rounded-2xl space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Patient Clinical Records ({healthRecords.length})</h4>
                      <button onClick={() => navigate('/records')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer">
                        <span>Open Records Hub</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>

                    {healthRecords.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 italic text-center">No specific lab reports attached to this case file.</p>
                    ) : (
                      <div className="space-y-2">
                        {healthRecords.map(r => (
                          <div key={r.record_id || r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100/80 transition-colors">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <div>
                                <span className="font-bold text-slate-900 block">{r.file_name || r.title || 'Lab Report'}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{r.record_type || 'Biomarker Assessment'}</span>
                              </div>
                            </div>

                            <button onClick={() => navigate('/records')} className="px-3 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-[11px] hover:bg-slate-100 cursor-pointer">
                              View File
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>

    </div>
  );
}
