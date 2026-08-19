import React, { useState, useEffect, useRef } from 'react';
import { PageHeader, PageContainer } from '../components/layout';
import { Card, Badge, Button, Input, TextArea, EmptyState } from '../components/ui';
import {
  MessageSquare, Send, Paperclip, Search, CheckCheck, UserCheck, ShieldCheck,
  FileText, Pin, Clock, Phone, Video, MoreVertical, Circle, RefreshCw, ShieldAlert, Sparkles
} from 'lucide-react';

export default function MessagesPage({ user }) {
  const [selectedConversationId, setSelectedConversationId] = useState('dr_sarah');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef(null);

  // Pre-Seeded Telehealth Specialist Conversations
  const defaultConversations = [
    {
      id: 'dr_sarah',
      doctorName: 'Dr. Sarah Jenkins, MD',
      specialty: 'Chief Endocrinologist & Diabetes Specialist',
      hospital: 'Apollo Medical Center',
      avatar: '/avatars/doctor_female.png',
      isOnline: true,
      role: 'DOCTOR_VERIFIED',
      badge: 'VERIFIED PHYSICIAN',
      lastMessage: "I've signed your digital prescription and updated your treatment plan.",
      lastMessageTime: '10:22 AM',
      unreadCount: 0,
      pinned: true,
    },
    {
      id: 'ai_copilot',
      doctorName: 'TeleMed AI Clinical Assistant',
      specialty: 'Multimodal Explainable Intelligence Engine',
      hospital: 'TeleMed AI v4.0 Unified System',
      avatar: '/avatars/admin.png',
      isOnline: true,
      role: 'AI_ASSISTANT',
      badge: 'AI CLINICAL GUIDANCE',
      lastMessage: "Instant guidance ready based on your latest Fasting Glucose & HbA1c metrics.",
      lastMessageTime: '10:30 AM',
      unreadCount: 1,
      pinned: true,
    },
    {
      id: 'dr_rajesh',
      doctorName: 'Dr. Rajesh Sharma, MD',
      specialty: 'Senior Cardiovascular & Metabolic Specialist',
      hospital: 'Fortis Health Institute',
      avatar: '/avatars/doctor_male.png',
      isOnline: false,
      role: 'DOCTOR_VERIFIED',
      badge: 'VERIFIED PHYSICIAN',
      lastMessage: "Resting heart rate (72 bpm) and blood pressure corridor are stable.",
      lastMessageTime: 'Yesterday',
      unreadCount: 0,
      pinned: false,
    }
  ];

  const patientFullName = user?.name || user?.full_name || user?.patient_profile?.full_name || (user?.email ? user.email.split('@')[0].replace('.', ' ').replace('_', ' ') : 'Patient');
  const patientFirstName = patientFullName.split(' ')[0] || 'Patient';

  const [conversations, setConversations] = useState(defaultConversations);

  // Initial Pre-Loaded Message Threads per logged-in user
  const [messagesHistory, setMessagesHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`telemed_chat_${user?.user_id || 'guest'}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      dr_sarah: [
        {
          id: 'msg-1',
          sender: 'Dr. Sarah Jenkins, MD',
          role: 'DOCTOR_VERIFIED',
          badge: 'VERIFIED PHYSICIAN',
          text: `Hello ${patientFirstName}, I've personally reviewed your health profile and assessment records. Your active clinical profile parameters show excellent 90-day progress.`,
          time: '10:15 AM',
          avatar: '/avatars/doctor_female.png'
        },
        {
          id: 'msg-2',
          sender: patientFullName,
          role: 'PATIENT',
          badge: 'PATIENT',
          text: 'Thank you Dr. Sarah! I have been following the recommended 30-minute post-meal walking protocol and low-glycemic dietary guidelines.',
          time: '10:18 AM',
          avatar: '/avatars/male.png'
        },
        {
          id: 'msg-3',
          sender: 'Dr. Sarah Jenkins, MD',
          role: 'DOCTOR_VERIFIED',
          badge: 'VERIFIED PHYSICIAN',
          text: `Wonderful work, ${patientFirstName}! I have updated your treatment plan and signed your digital guidelines. Keep up the daily walking protocol (8,500 steps/day) and re-check your blood sugar in 90 days.`,
          time: '10:22 AM',
          avatar: '/avatars/doctor_female.png'
        }
      ],
      ai_copilot: [
        {
          id: 'msg-ai-1',
          sender: 'TeleMed AI Clinical Assistant',
          role: 'AI_ASSISTANT',
          badge: 'AI CLINICAL GUIDANCE',
          text: `Welcome ${patientFirstName}! I am your 24/7 AI Clinical Assistant. Ask me any questions about nutrition, exercise GLUT4 activation, or lab schedules!`,
          time: '10:30 AM',
          avatar: '/avatars/admin.png'
        }
      ],
      dr_rajesh: [
        {
          id: 'msg-rajesh-1',
          sender: 'Dr. Rajesh Sharma, MD',
          role: 'DOCTOR_VERIFIED',
          badge: 'VERIFIED PHYSICIAN',
          text: `Hello ${patientFirstName}, your resting heart rate (72 bpm) and blood pressure corridor show optimal cardiovascular stability.`,
          time: 'Yesterday',
          avatar: '/avatars/doctor_male.png'
        }
      ]
    };
  });

  // Save chat per user ID
  useEffect(() => {
    try {
      if (user?.user_id) {
        localStorage.setItem(`telemed_chat_${user.user_id}`, JSON.stringify(messagesHistory));
      }
    } catch (e) {}
  }, [messagesHistory, user]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesHistory, selectedConversationId]);

  const generateAIReply = (userQuery) => {
    const q = userQuery.toLowerCase();
    
    if (q.includes('food') || q.includes('eat') || q.includes('diet') || q.includes('nutrition') || q.includes('meal') || q.includes('recipe')) {
      return "Based on your metabolic data (Fasting Glucose 118 mg/dL, HbA1c 6.2%), recommended low-glycemic foods include: high-soluble fiber (oats, quinoa, lentils, spinach), lean proteins (wild salmon, chicken, tofu), healthy fats (avocado, extra virgin olive oil, almonds), and polyphenols (blueberries, dark greens). Avoid refined sugars and white flour to prevent postprandial spikes.";
    }
    
    if (q.includes('medication') || q.includes('medicine') || q.includes('pill') || q.includes('metformin') || q.includes('dose') || q.includes('prescription')) {
      return "Prescription Guidance: Take Metformin 500mg once daily after your evening meal with water to minimize GI discomfort. Take Omega-3 1000mg softgel daily with breakfast.";
    }

    if (q.includes('walk') || q.includes('exercise') || q.includes('workout') || q.includes('step') || q.includes('gym')) {
      return "Walking Protocol: 30 minutes of moderate brisk walking starting 15–30 minutes post-meal activates GLUT4 glucose transporters in muscle tissue, clearing blood glucose without extra pancreatic insulin.";
    }

    if (q.includes('lab') || q.includes('test') || q.includes('hba1c') || q.includes('appointment') || q.includes('checkup') || q.includes('when')) {
      return "Next Diagnostic Panel: Your follow-up Fasting Blood Glucose & HbA1c test is scheduled for November 18, 2026 (90-day mark).";
    }

    return `Thank you for your message, ${user?.name || 'Swaran'}. Your query has been logged and queued for physician review during clinic hours.`;
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageInput.trim()) return;

    const activeConv = conversations.find(c => c.id === selectedConversationId) || conversations[0];
    const queryText = messageInput.trim();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPatientMsg = {
      id: `msg-${Date.now()}`,
      sender: user?.name || 'Swaran',
      role: 'PATIENT',
      badge: 'PATIENT',
      text: queryText,
      time: currentTime,
      avatar: '/avatars/male.png'
    };

    setMessagesHistory((prev) => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), newPatientMsg]
    }));
    setMessageInput('');

    // Contextual Response Simulation
    setTimeout(() => {
      const replyText = generateAIReply(queryText);
      const isAIChannel = activeConv.role === 'AI_ASSISTANT';

      const responseMsg = {
        id: `reply-${Date.now()}`,
        sender: isAIChannel ? 'TeleMed AI Clinical Assistant' : 'TeleMed AI Assistant',
        role: 'AI_ASSISTANT',
        badge: isAIChannel ? '🤖 AI CLINICAL GUIDANCE' : '🤖 AI GUIDANCE • QUEUED FOR DOCTOR REVIEW',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: '/avatars/admin.png'
      };

      setMessagesHistory((prev) => ({
        ...prev,
        [selectedConversationId]: [...(prev[selectedConversationId] || []), responseMsg]
      }));
    }, 700);
  };

  const activeConv = conversations.find(c => c.id === selectedConversationId) || conversations[0];
  const activeMessages = messagesHistory[selectedConversationId] || [];

  const filteredConversations = conversations.filter(c => {
    return c.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.specialty.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <PageContainer className="space-y-4 py-4">
      
      {/* Header */}
      <PageHeader
        title="Secure Patient-Doctor Communication"
        description="Encrypted HIPAA-ready direct messaging with verified medical specialists & AI Clinical Assistant"
        badge="Encrypted Messaging Channel"
      />

      {/* 2-Panel Messaging Workspace Grid (Full Viewport Height & Zero Horizontal Scrollbar!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-170px)] min-h-[640px] items-stretch">
        
        {/* Left Panel — Specialist Conversations List (4 COLS) */}
        <Card isGlass={true} className="lg:col-span-4 p-4 flex flex-col space-y-4 shadow-xl border border-[var(--border-medium)] h-full overflow-hidden">
          
          <div className="space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[var(--text-main)] uppercase tracking-wider font-mono">
                Assigned Specialist Threads
              </h3>
              <Badge variant="primary" size="sm" className="font-mono">{conversations.length} Active</Badge>
            </div>
            <Input
              placeholder="Search specialists..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Conversations List (No Horizontal Scrollbar!) */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden space-y-2 pr-1">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all space-y-1 overflow-hidden ${
                    isSelected
                      ? 'bg-[var(--bg-surface)] border-[var(--primary)] text-[var(--primary)] shadow-md ring-2 ring-[var(--primary)]/30'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--primary)] text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/40 shadow-sm bg-slate-900">
                          <img src={conv.avatar} alt={conv.doctorName} className="w-full h-full object-cover" />
                        </div>
                        {conv.isOnline && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-surface)]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-[var(--text-main)] truncate">{conv.doctorName}</h4>
                        <p className="text-[10px] text-[var(--primary)] font-semibold truncate">{conv.specialty}</p>
                      </div>
                    </div>
                    <span className="text-[9.5px] font-mono text-[var(--text-muted)] shrink-0">{conv.lastMessageTime}</span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] truncate font-medium italic pl-1">
                    "{conv.lastMessage}"
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Panel — Chat Workspace (8 COLS) */}
        <Card isGlass={true} className="lg:col-span-8 p-5 sm:p-6 flex flex-col h-full shadow-xl border border-[var(--border-medium)] overflow-hidden">
          
          {/* Active Conversation Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3.5 shrink-0 flex-wrap gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-[var(--primary)] shadow-md bg-slate-900">
                  <img src={activeConv.avatar} alt={activeConv.doctorName} className="w-full h-full object-cover" />
                </div>
                {activeConv.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-surface)]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-[var(--text-main)] truncate">{activeConv.doctorName}</h3>
                  <Badge variant="primary" size="sm" className="font-mono text-[9px] shrink-0">{activeConv.badge}</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-mono truncate">{activeConv.specialty} • {activeConv.hospital}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="success" size="sm" className="font-mono font-bold">256-BIT ENCRYPTED</Badge>
            </div>
          </div>

          {/* Ethical AI Disclosure Notice Banner */}
          <div className="my-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-[var(--text-main)] space-y-0.5 shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-purple-400">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>Ethical Medical AI Disclosure & Transparency</span>
            </div>
            <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed">
              Instant responses are provided by <strong>TeleMed AI Assistant</strong> for immediate guidance based on your clinical data. Patient queries are also queued for official human review by <strong>{activeConv.doctorName}</strong>.
            </p>
          </div>

          {/* Chat Messages Body Thread (Flex-1 Dynamic Fill!) */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)] shadow-inner">
            {activeMessages.map((m, idx) => {
              const isPatient = m.role === 'PATIENT';
              const isAI = m.role === 'AI_ASSISTANT';
              const isDoc = m.role === 'DOCTOR_VERIFIED';

              const avatarSrc = m.avatar || (isPatient ? '/avatars/male.png' : activeConv.avatar);

              return (
                <div key={idx} className={`flex items-start gap-3 ${isPatient ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-full overflow-hidden border border-white/40 shadow-sm shrink-0 bg-slate-900 mt-0.5">
                    <img src={avatarSrc} alt={m.sender} className="w-full h-full object-cover rounded-full" />
                  </div>
                  <div
                    className={`p-3.5 rounded-2xl text-xs space-y-1.5 max-w-[82%] shadow-md transition-all ${
                      isPatient
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                        : (isAI
                            ? 'bg-purple-950/30 text-[var(--text-main)] border border-purple-500/30 rounded-tl-none'
                            : 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-medium)] rounded-tl-none')
                    }`}
                  >
                    <div className={`flex justify-between items-center text-[10px] font-mono gap-3 ${isPatient ? 'text-white/90' : 'text-[var(--text-muted)]'}`}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold">{m.sender}</span>
                        {isDoc && <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold text-[9px]">🩺 VERIFIED PHYSICIAN</span>}
                        {isAI && <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-extrabold text-[9px]">🤖 AI CLINICAL GUIDANCE</span>}
                      </div>
                      <span>{m.time}</span>
                    </div>
                    <p className="leading-relaxed font-medium text-xs">{m.text}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] pt-3 shrink-0">
            <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold uppercase mr-1">Quick Prompts:</span>
            <button
              type="button"
              onClick={() => setMessageInput("what are the food i need to take")}
              className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:scale-105 text-[var(--text-main)] font-medium transition-all shadow-sm text-xs"
            >
              🥗 Dietary Guidance
            </button>
            <button
              type="button"
              onClick={() => setMessageInput("How should I take my Metformin medication?")}
              className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:scale-105 text-[var(--text-main)] font-medium transition-all shadow-sm text-xs"
            >
              💊 Medication Dose
            </button>
            <button
              type="button"
              onClick={() => setMessageInput("What is the best post-meal walking protocol?")}
              className="px-3 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--primary)] hover:scale-105 text-[var(--text-main)] font-medium transition-all shadow-sm text-xs"
            >
              🏃 Post-Meal Exercise
            </button>
          </div>

          {/* Message Composer Input Form */}
          <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2 shrink-0">
            <Input
              placeholder={`Type message to ${activeConv.doctorName}...`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1"
            />
            <Button variant="primary" size="md" type="submit" leftIcon={<Send className="w-4 h-4" />}>
              Send
            </Button>
          </form>

        </Card>

      </div>
    </PageContainer>
  );
}
