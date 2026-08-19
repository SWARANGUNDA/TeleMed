import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, Clock, AlertTriangle, CheckCircle2, ShieldAlert,
  PlusCircle, FileText, User, RefreshCw, X, ShieldOff, Eye, Send,
  MessageCircle, Edit3, Lock, Shield, Video, Calendar, Sparkles, Brain,
  Activity, Watch, Dna, FileCheck, ArrowRight, Save, Check, Paperclip, ChevronRight,
  Pill, Download, Printer, UserCheck, Star, MessageSquare, ExternalLink, Maximize2
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  ProgressBar, CircularProgress, Table, TableRow, TableCell, Tabs, Modal, Input, TextArea, EmptyState, Alert
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import {
  createConsultationRequest,
  fetchPatientConsultations,
  fetchPatientRecords,
  sendConsultationMessage
} from '../api/client';

export default function ConsultationWorkspacePage({ user, consultationContext }) {
  const navigate = useNavigate();
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
  const [selectedDoctor, setSelectedDoctor] = useState('dr_sarah');
  const [patientNewMessage, setPatientNewMessage] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const patientFullName = user?.name || user?.full_name || user?.patient_profile?.full_name || (user?.email ? user.email.split('@')[0].replace('.', ' ').replace('_', ' ') : 'Patient');
  const patientFirstName = patientFullName.split(' ')[0] || 'Patient';
  const patientId = user?.user_id || 'usr_patient';

  // Doctors Catalog
  const doctorsCatalog = [
    {
      id: 'dr_sarah',
      name: 'Dr. Sarah Jenkins, MD',
      title: 'Chief Endocrinologist & Diabetes Specialist',
      rating: 4.9,
      experience: '14+ Years Experience',
      hospital: 'Apollo Medical Center',
      avatar: '/avatars/doctor_female.png',
      badge: 'Assigned Specialist'
    },
    {
      id: 'dr_rajesh',
      name: 'Dr. Rajesh Sharma, MD',
      title: 'Senior Cardiovascular & Metabolic Specialist',
      rating: 4.8,
      experience: '16+ Years Experience',
      hospital: 'Fortis Health Institute',
      avatar: '/avatars/doctor_male.png',
      badge: 'Available'
    }
  ];

  // Active Messages Thread State per user ID
  const [messagesThread, setMessagesThread] = useState(() => {
    try {
      const saved = localStorage.getItem(`telemed_consult_chat_${patientId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return [
      {
        sender: 'Dr. Sarah Jenkins, MD',
        role: 'DOCTOR',
        time: '10:15 AM',
        text: `Hello ${patientFirstName}, welcome to TeleMed AI Telehealth Workspace. I am your assigned endocrinology specialist. Once you submit your health intake assessment, I will personally review your clinical biomarkers.`
      },
      {
        sender: patientFullName,
        role: 'PATIENT',
        time: '10:18 AM',
        text: 'Thank you Dr. Sarah! I am ready to review my care guidelines and tele-consultation workspace.'
      }
    ];
  });

  useEffect(() => {
    try {
      if (patientId) {
        localStorage.setItem(`telemed_consult_chat_${patientId}`, JSON.stringify(messagesThread));
      }
    } catch (e) {}
  }, [messagesThread, patientId]);

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
        (r.user_email && r.user_email.toLowerCase() === user?.email?.toLowerCase()) ||
        (r.email && r.email.toLowerCase() === user?.email?.toLowerCase())
      );

      setConsultations(consData.consultations || []);
      setHealthRecords(userRecs);
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
      setSuccessMsg('Consultation request submitted successfully! Assigned to Dr. Sarah Jenkins.');
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

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesThread]);

  const activeDocObj = doctorsCatalog.find(d => d.id === selectedDoctor) || doctorsCatalog[0];
  const hasAssessment = healthRecords.length > 0;
  const latestRecord = hasAssessment ? healthRecords[0] : null;
  const latestSnap = latestRecord?.prediction_snapshot || latestRecord;

  const generateAIReply = (userQuery) => {
    const q = userQuery.toLowerCase();
    
    if (q.includes('food') || q.includes('eat') || q.includes('diet') || q.includes('nutrition') || q.includes('meal')) {
      return "Recommended low-glycemic dietary protocols include: high-soluble fiber (oats, quinoa, lentils, spinach), lean proteins (wild salmon, chicken, tofu), healthy fats (avocado, extra virgin olive oil), and polyphenols (dark greens, berries).";
    }
    if (q.includes('medication') || q.includes('medicine') || q.includes('pill') || q.includes('prescription')) {
      return "Prescription Guidance: Always follow your prescribing physician's directions. Take medications after meals with water to minimize GI discomfort.";
    }
    if (q.includes('walk') || q.includes('exercise') || q.includes('workout') || q.includes('step')) {
      return "Walking Protocol: 30 minutes of moderate brisk walking starting 15–30 minutes post-meal activates GLUT4 glucose transporters in muscle tissue.";
    }

    return `Thank you for your message, ${patientFirstName}. Your query has been logged and queued for ${activeDocObj.name}'s review.`;
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!patientNewMessage.trim()) return;
    
    const queryText = patientNewMessage;
    const patientMsg = {
      sender: patientFullName,
      role: 'PATIENT',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: queryText
    };

    setMessagesThread(prev => [...prev, patientMsg]);
    setPatientNewMessage('');
    setMessageSending(true);

    setTimeout(() => {
      const aiReplyText = generateAIReply(queryText);
      const docMsg = {
        sender: activeDocObj.name,
        role: 'DOCTOR',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: aiReplyText
      };
      setMessagesThread(prev => [...prev, docMsg]);
      setMessageSending(false);
    }, 1000);
  };

  return (
    <PageContainer className="space-y-6 py-6">
      
      {/* Page Header */}
      <PageHeader
        title="Telehealth Specialist Workspace & Consultations"
        description="Collaborative clinical workspace connecting patients with verified medical specialists and AI explainability insights"
        badge="Encrypted Channel"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              leftIcon={<MessageCircle className="w-4 h-4 text-[var(--primary)]" />}
              onClick={() => setIsChatModalOpen(true)}
            >
              Open Direct Chat Modal
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setShowNewForm(!showNewForm)}
            >
              {showNewForm ? 'Cancel Request' : 'New Consultation Request'}
            </Button>
          </div>
        }
      />

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* SPECIALIST DOCTOR SELECTOR HUB */}
      <Card isGlass={true} className="p-4 bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-primary)] border border-[var(--border-medium)] shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold text-[var(--text-main)] font-mono uppercase tracking-wider">
              Assigned Telehealth Specialist Team
            </h3>
          </div>
          <Badge variant="primary" size="sm" className="font-mono font-bold">2 Medical Specialists Active</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
          {doctorsCatalog.map((doc) => {
            const isSelected = selectedDoctor === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoctor(doc.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? 'bg-[var(--bg-surface)] border-[var(--primary)] shadow-md ring-2 ring-[var(--primary)]/30'
                    : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--primary)]'
                }`}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/40 shadow-sm shrink-0 bg-slate-900">
                  <img src={doc.avatar} alt={doc.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-[var(--text-main)] truncate">{doc.name}</h4>
                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1 font-mono">
                      <Star className="w-3 h-3 fill-amber-500" /> {doc.rating}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--primary)] font-semibold truncate">{doc.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">{doc.hospital} • {doc.experience}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 3-PANEL CLINICAL WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL 1: LEFT CHRONOLOGICAL PATIENT TIMELINE (3 COLS) */}
        <div className="lg:col-span-3 space-y-4">
          
          <Card isGlass={true} className="p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-muted)]">
                Patient History Timeline
              </h4>
              <Badge variant={hasAssessment ? 'primary' : 'subtle'} size="sm">{healthRecords.length} Snapshots</Badge>
            </div>

            <div className="space-y-2.5">
              {hasAssessment ? (
                healthRecords.map((r, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5 cursor-pointer hover:border-[var(--primary)] transition-all">
                    <div className="flex items-center justify-between">
                      <Badge variant="primary" size="sm">{r.effective_pathway || 'C+W+G'}</Badge>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Today'}</span>
                    </div>
                    <h5 className="text-xs font-bold text-[var(--text-main)]">Multimodal AI Assessment</h5>
                    <p className="text-[11px] text-[var(--text-muted)] font-mono">Data Quality: {Math.round((r.data_quality_score || 0.90) * 100)}%</p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-dashed border-[var(--border-subtle)] text-center space-y-2">
                  <Clock className="w-6 h-6 text-[var(--text-muted)] mx-auto" />
                  <p className="text-xs text-[var(--text-muted)] font-medium">No Historical Assessments Found</p>
                  <Button variant="primary" size="sm" className="w-full text-xs font-bold" onClick={() => navigate('/intake')}>
                    Start Intake Assessment →
                  </Button>
                </div>
              )}
            </div>

            {hasAssessment && (
              <Button variant="outline" size="sm" className="w-full text-xs font-bold" onClick={() => setIsDocViewerOpen(true)}>
                Open Clinical Lab OCR Viewer →
              </Button>
            )}
          </Card>

          {/* WebRTC Video Consultation Room */}
          <Card isGlass={true} className="p-4 border-l-4 border-l-[var(--secondary)] space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[var(--secondary)]" />
                <h5 className="text-xs font-bold text-[var(--text-main)]">Encrypted Video Call</h5>
              </div>
              <Badge variant="secondary" size="sm">ROOM READY</Badge>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              256-bit WebRTC end-to-end encrypted video session room is active for consultation with {activeDocObj.name}.
            </p>
            <Button variant="secondary" size="sm" className="w-full font-bold shadow-md" leftIcon={<Video className="w-4 h-4" />}>
              Launch Video Call Session
            </Button>
          </Card>

        </div>

        {/* PANEL 2: CENTER LIVE CLINICAL DIAGNOSIS WORKSPACE & E-PRESCRIPTION (6 COLS) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Patient Health Overview Banner */}
          <Card isGlass={true} className="p-5 bg-gradient-to-r from-[var(--bg-surface)] to-[var(--bg-primary)] space-y-4 border border-[var(--border-medium)] shadow-xl">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--primary)] shadow-md shrink-0 bg-slate-900">
                  <img src="/avatars/male.png" alt="Patient Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[var(--text-main)]">{patientFullName}</h3>
                  <p className="text-xs font-mono text-[var(--text-muted)]">Patient ID: {patientId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={hasAssessment ? 'primary' : 'subtle'} size="sm" className="font-mono font-bold">
                  Pathway: {latestSnap?.effective_pathway || 'Pending'}
                </Badge>
                <Badge variant={hasAssessment ? 'success' : 'subtle'} size="sm" className="font-mono font-bold">
                  DQ: {hasAssessment ? `${Math.round((latestSnap?.data_quality_score || 0.9) * 100)}%` : 'N/A'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Primary Risk</span>
                <strong className="text-[var(--danger)] font-mono text-xs">
                  {latestSnap?.disease_outcomes?.Type2_Diabetes?.risk_level || (hasAssessment ? 'EVALUATED' : 'Pending Intake')}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Secondary Risk</span>
                <strong className="text-[var(--warning)] font-mono text-xs">
                  {latestSnap?.disease_outcomes?.Metabolic_Syndrome?.risk_level || (hasAssessment ? 'EVALUATED' : 'Pending Intake')}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Model Calibration</span>
                <strong className="text-[var(--success)] font-mono text-xs">Isotonic (V4 Ensemble)</strong>
              </div>
            </div>
          </Card>

          {/* Physician Clinical Diagnosis Notes & Protocols */}
          <Card isGlass={true} className="p-6 space-y-5 shadow-xl border-t-4 border-t-[var(--primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-[var(--primary)]" />
                <h4 className="text-sm font-black text-[var(--text-main)]">
                  Physician Clinical Notes & Diagnostic Overview
                </h4>
              </div>
              <Badge variant="success" size="sm" className="font-mono font-bold">VERIFIED BY {activeDocObj.name.toUpperCase()}</Badge>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5">
                <span className="text-[10px] font-mono text-[var(--primary)] uppercase font-bold block tracking-wider">
                  Clinical Diagnosis / Primary Summary
                </span>
                <p className="font-semibold text-[var(--text-main)] leading-relaxed">
                  {hasAssessment 
                    ? `Clinical profile evaluated. Patient demonstrates metabolic response with monitored biomarkers. Cardiovascular metrics and resting heart rate are in optimal stable corridor.`
                    : `No active health assessment found for ${patientFullName}. Complete your intake assessment to enable specialist review, risk vectors, and personalized treatment plans.`
                  }
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
                <span className="text-[10px] font-mono text-[var(--success)] uppercase font-bold block tracking-wider">
                  Recommended Treatment Plan & Protocols
                </span>
                <ul className="space-y-1.5 font-medium text-[var(--text-main)] list-disc list-inside">
                  <li><strong>Nutritional Protocol:</strong> Low-glycemic dietary regimen with increased soluble fiber.</li>
                  <li><strong>Physical Activity:</strong> 30-minute post-meal brisk walking (target 8,500 daily steps).</li>
                  <li><strong>Diagnostic Follow-up:</strong> Routine metabolic screening recommended.</li>
                </ul>
              </div>

            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1 font-bold shadow-md"
                leftIcon={<Pill className="w-4 h-4" />}
                onClick={() => setIsPrescriptionModalOpen(true)}
              >
                View Digital E-Prescription (Rx-994208)
              </Button>
              <Button
                variant="outline"
                size="md"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              >
                Print Clinical Notes
              </Button>
            </div>
          </Card>

          {/* Integrated Interactive Chat Section */}
          <Card isGlass={true} className="p-5 space-y-4 shadow-xl border border-[var(--border-medium)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Avatar src={activeDocObj.avatar} alt={activeDocObj.name} size="sm" />
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-main)]">{activeDocObj.name}</h4>
                  <p className="text-[10px] text-[var(--primary)] font-mono">Encrypted Telehealth Channel</p>
                </div>
              </div>
              <Badge variant="success" size="sm">ONLINE</Badge>
            </div>

            <div className="h-64 overflow-y-auto space-y-3 p-3 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs">
              {messagesThread.map((msg, i) => {
                const isPatient = msg.role === 'PATIENT';
                return (
                  <div key={i} className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold text-[10px] text-[var(--text-main)]">{msg.sender}</span>
                      <span className="text-[9px] text-[var(--text-muted)] font-mono">{msg.time}</span>
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                      isPatient
                        ? 'bg-[var(--primary)] text-white rounded-tr-none shadow-md font-medium'
                        : 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-subtle)] rounded-tl-none font-medium'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={patientNewMessage}
                onChange={(e) => setPatientNewMessage(e.target.value)}
                placeholder={`Type message to ${activeDocObj.name}...`}
                className="flex-1 text-xs"
              />
              <Button type="submit" variant="primary" size="md" disabled={messageSending} leftIcon={<Send className="w-4 h-4" />}>
                Send
              </Button>
            </form>
          </Card>

        </div>

        {/* PANEL 3: RIGHT AI CLINICAL ASSISTANT SIDEBAR & SHAP DRIVERS (3 COLS) */}
        <div className="lg:col-span-3 space-y-4">
          
          <Card isGlass={true} className="p-4 space-y-4 shadow-lg border-l-4 border-l-[var(--primary)]">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
              <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-main)]">
                AI Clinical Assistant
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--danger)] uppercase font-bold block">Top SHAP Risk Drivers</span>
                {hasAssessment ? (
                  <ol className="space-y-1 text-[11px] font-semibold text-[var(--text-main)] list-decimal list-inside">
                    <li>Fasting Glucose 118 mg/dL (+0.18 SHAP)</li>
                    <li>HbA1c 6.2% (+0.14 SHAP)</li>
                  </ol>
                ) : (
                  <p className="text-[11px] text-[var(--text-muted)] font-medium">Biomarker Drivers Pending Intake Assessment</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-mono text-[var(--success)] uppercase font-bold block">Protective Biomarker Factors</span>
                {hasAssessment ? (
                  <ol className="space-y-1 text-[11px] font-semibold text-[var(--text-main)] list-decimal list-inside">
                    <li>8,500 Daily Steps (-0.12 SHAP)</li>
                    <li>3.2% Akkermansia (-0.10 SHAP)</li>
                  </ol>
                ) : (
                  <p className="text-[11px] text-[var(--text-muted)] font-medium">Protective Factors Pending Intake Assessment</p>
                )}
              </div>
            </div>
          </Card>

        </div>

      </div>
    </PageContainer>
  );
}
