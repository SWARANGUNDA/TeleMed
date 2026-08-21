import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageContainer } from '../components/layout';
import { Card, Badge, Button, EmptyState, Modal } from '../components/ui';
import {
  MessageSquare, Send, Search, CheckCheck, UserCheck, ShieldCheck,
  FileText, Clock, RefreshCw, Sparkles, User, Bot, Calendar,
  Activity, ExternalLink, Archive, AlertCircle, Lock, Phone, Video,
  Paperclip, Filter, Plus, UploadCloud, Trash2, CheckCircle2,
  Stethoscope, FileSpreadsheet, MoreVertical, Info, X
} from 'lucide-react';
import {
  fetchUserConversations,
  fetchConsultationMessages,
  sendConsultationMessage,
  markMessagesAsRead,
  askRAGQuestion
} from '../api/client';

export default function MessagesPage({ user }) {
  const navigate = useNavigate();
  const userId = user?.user_id || user?.id || 'guest';
  const userRole = user?.role?.toUpperCase() || 'PATIENT';

  const patientFullName = user?.full_name || user?.name || user?.patient_profile?.full_name || (user?.email ? user.email.split('@')[0].replace('.', ' ').replace('_', ' ') : 'Patient');
  const patientFirstName = patientFullName.split(' ')[0] || 'Patient';

  // AI Assistant Thread definition (Distinct from human physician consultations)
  const aiThread = {
    id: 'ai_assistant',
    consultation_id: null,
    title: 'TeleMed AI Assistant',
    doctorName: 'TeleMed AI Assistant',
    specialty: 'AI Decision Support',
    hospital: 'TeleMed AI Engine v4.0',
    isOnline: true,
    role: 'AI_ASSISTANT',
    badge: 'AI DECISION SUPPORT',
    lastMessage: 'AI decision support guidance is available.',
    lastMessageTime: 'Just now',
    unreadCount: 0,
    status: 'ACTIVE',
    isAi: true
  };

  // State Management
  const [conversations, setConversations] = useState([aiThread]);
  const [selectedConversationId, setSelectedConversationId] = useState('ai_assistant');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messagesHistory, setMessagesHistory] = useState({
    ai_assistant: [
      {
        message_id: 'msg-ai-init',
        sender_user_id: 'ai_system',
        sender_role: 'AI_ASSISTANT',
        sender_name: 'TeleMed AI Assistant',
        badge: 'AI DECISION SUPPORT',
        content: `Hello ${patientFirstName}. I am your TeleMed AI Assistant. I synthesize clinical evidence from your lab parameters, wearables, and health assessments. Note: AI guidance is informational and does not replace professional medical advice from your physician.`,
        created_at: new Date().toISOString(),
        status: 'sent'
      }
    ]
  });

  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [archivedIds, setArchivedIds] = useState(new Set());
  
  // Modals & Menus
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showAiInfoModal, setShowAiInfoModal] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);

  const chatEndRef = useRef(null);

  // Auto-scroll chat feed to bottom
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messagesHistory, selectedConversationId, isAiThinking, scrollToBottom]);

  // Load Real User Conversations from Backend API
  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    setErrorMsg(null);
    try {
      const res = await fetchUserConversations();
      const dbThreads = (res && Array.isArray(res.conversations)) ? res.conversations : [];
      
      const allThreads = [aiThread, ...dbThreads];
      setConversations(allThreads);

      if (dbThreads.length > 0 && selectedConversationId === 'ai_assistant') {
        setSelectedConversationId(dbThreads[0].id);
      }
    } catch (err) {
      console.warn("Conversations load notice:", err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load Messages for Active Selected Conversation
  const loadActiveMessages = useCallback(async (convId) => {
    if (!convId || convId === 'ai_assistant') return;

    setLoadingMessages(true);
    try {
      const res = await fetchConsultationMessages(convId);
      const msgList = Array.isArray(res) ? res : (res?.messages || []);
      const fetchedMsgs = msgList.map(m => ({
        ...m,
        status: 'sent'
      }));

      setMessagesHistory(prev => ({
        ...prev,
        [convId]: fetchedMsgs
      }));

      setConversations(prev => prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c));
    } catch (err) {
      console.warn("Messages fetch note:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConversationId && selectedConversationId !== 'ai_assistant') {
      loadActiveMessages(selectedConversationId);
    }
  }, [selectedConversationId, loadActiveMessages]);

  // WebSocket Listener for Real-Time Messages
  useEffect(() => {
    if (!userId || userId === 'guest') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/notifications/${userId}`;

    let socket = null;
    let isMounted = true;

    try {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'chat_message' || payload.event === 'chat_message') {
            const { consultation_id, sender_id, sender_name, sender_role, content, timestamp, message_id } = payload;
            
            if (consultation_id) {
              const newMsg = {
                message_id: message_id || `msg_${Date.now()}`,
                consultation_id,
                sender_user_id: sender_id,
                sender_role: sender_role || 'DOCTOR',
                sender_name: sender_name || 'Physician',
                content: content,
                created_at: timestamp || new Date().toISOString(),
                status: 'sent'
              };

              setMessagesHistory(prev => {
                const currentList = prev[consultation_id] || [];
                if (currentList.some(m => m.message_id === newMsg.message_id)) return prev;
                return {
                  ...prev,
                  [consultation_id]: [...currentList, newMsg]
                };
              });

              setConversations(prev => prev.map(c => {
                if (c.id === consultation_id) {
                  const isSelected = selectedConversationId === consultation_id;
                  return {
                    ...c,
                    lastMessage: content,
                    lastMessageTime: 'Just now',
                    unreadCount: isSelected ? 0 : (c.unreadCount || 0) + 1
                  };
                }
                return c;
              }));

              if (selectedConversationId === consultation_id) {
                markMessagesAsRead(consultation_id).catch(() => {});
              }
            }
          }
        } catch (e) {}
      };
      socket.onerror = () => {};
    } catch (e) {}

    return () => {
      isMounted = false;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [userId, selectedConversationId]);

  // Handle Sending Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = messageInput.trim();
    if (!text || sending || isAiThinking) return;

    setMessageInput('');
    setErrorMsg(null);

    const isAi = selectedConversationId === 'ai_assistant';
    const nowIso = new Date().toISOString();

    if (isAi) {
      // AI Assistant Conversation Path
      const userMsg = {
        message_id: `user_msg_${Date.now()}`,
        sender_user_id: userId,
        sender_role: 'PATIENT',
        sender_name: patientFullName,
        content: text,
        created_at: nowIso,
        status: 'sent'
      };

      setMessagesHistory(prev => ({
        ...prev,
        ai_assistant: [...(prev.ai_assistant || []), userMsg]
      }));

      setIsAiThinking(true);
      try {
        const ragRes = await askRAGQuestion(text);
        const aiReplyText = ragRes?.answer || ragRes?.response || ragRes?.message || "Thank you for providing details. Based on clinical evidence-based protocol, please verify your symptoms with your attending physician for diagnostic confirmation.";

        const aiReplyMsg = {
          message_id: `ai_msg_${Date.now()}`,
          sender_user_id: 'ai_system',
          sender_role: 'AI_ASSISTANT',
          sender_name: 'TeleMed AI Assistant',
          badge: 'AI DECISION SUPPORT',
          content: aiReplyText,
          created_at: new Date().toISOString(),
          status: 'sent'
        };

        setMessagesHistory(prev => ({
          ...prev,
          ai_assistant: [...(prev.ai_assistant || []), aiReplyMsg]
        }));
      } catch (err) {
        setErrorMsg("AI Assistant engine is temporarily busy. Please try again in a moment.");
      } finally {
        setIsAiThinking(false);
      }
    } else {
      // Doctor Consultation Path
      setSending(true);
      const tempMsgId = `temp_${Date.now()}`;
      const newMsg = {
        message_id: tempMsgId,
        consultation_id: selectedConversationId,
        sender_user_id: userId,
        sender_role: userRole,
        sender_name: patientFullName,
        content: text,
        created_at: nowIso,
        status: 'sending'
      };

      setMessagesHistory(prev => ({
        ...prev,
        [selectedConversationId]: [...(prev[selectedConversationId] || []), newMsg]
      }));

      try {
        const res = await sendConsultationMessage(selectedConversationId, text);
        const savedData = (res && typeof res === 'object' && res.data) ? res.data : res;
        
        setMessagesHistory(prev => ({
          ...prev,
          [selectedConversationId]: (prev[selectedConversationId] || []).map(m => 
            m.message_id === tempMsgId 
              ? { ...m, message_id: savedData?.message_id || tempMsgId, status: 'sent', created_at: savedData?.created_at || nowIso }
              : m
          )
        }));

        setConversations(prev => prev.map(c => 
          c.id === selectedConversationId ? { ...c, lastMessage: text, lastMessageTime: 'Just now' } : c
        ));
      } catch (err) {
        setErrorMsg(err.message || "Failed to send message to physician.");
        setMessagesHistory(prev => ({
          ...prev,
          [selectedConversationId]: (prev[selectedConversationId] || []).map(m => 
            m.message_id === tempMsgId ? { ...m, status: 'failed' } : m
          )
        }));
      } finally {
        setSending(false);
      }
    }
  };

  // Resend Failed Message
  const handleRetryMessage = async (msgToRetry) => {
    if (!msgToRetry || sending) return;
    const text = msgToRetry.content;
    const convId = msgToRetry.consultation_id || selectedConversationId;

    setMessagesHistory(prev => ({
      ...prev,
      [convId]: (prev[convId] || []).filter(m => m.message_id !== msgToRetry.message_id)
    }));

    setMessageInput(text);
  };

  // Keyboard shortcut: Enter to send, Shift+Enter newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Archive Confirmation
  const confirmArchive = () => {
    if (!selectedConversationId) return;
    setArchivedIds(prev => new Set(prev).add(selectedConversationId));
    setShowArchiveConfirm(false);
    setShowMenuDropdown(false);
    
    // Select first remaining conversation
    const remaining = conversations.filter(c => c.id !== selectedConversationId && !archivedIds.has(c.id));
    if (remaining.length > 0) {
      setSelectedConversationId(remaining[0].id);
    }
  };

  // Timestamp formatting
  const formatTime = (ts) => {
    if (!ts) return 'Just now';
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? ts : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Just now';
    }
  };

  const formatDate = (ts) => {
    if (!ts) return 'Today';
    try {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? ts : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Today';
    }
  };

  // Filter Conversations
  const filteredConversations = conversations.filter(c => {
    const isArchived = archivedIds.has(c.id);
    if (activeTab === 'archived') return isArchived;
    if (isArchived) return false;

    if (activeTab === 'doctors' && c.isAi) return false;
    if (activeTab === 'ai' && !c.isAi) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.doctorName?.toLowerCase().includes(q) ||
      c.specialty?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.consultation_id?.toLowerCase().includes(q)
    );
  });

  const doctorThreadsCount = conversations.filter(c => !c.isAi && !archivedIds.has(c.id)).length;
  const activeConv = conversations.find(c => c.id === selectedConversationId) || aiThread;
  const currentMessages = messagesHistory[selectedConversationId] || [];

  return (
    <PageContainer className="max-w-[1440px] mx-auto px-4 py-3 space-y-3">
      
      {/* ── TOP PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinical Communication</h1>
          <p className="text-xs text-slate-500 mt-0.5">Communicate securely with your healthcare team and manage consultation-related messages.</p>
        </div>

        <button
          onClick={() => setShowSecurityModal(true)}
          className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-100/60 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure Clinical Session</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="font-bold underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* ── 3-COLUMN CLINICAL WORKSPACE GRID (HEIGHT CONSTRAINED TO VIEWPORT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start h-[calc(100vh-140px)] min-h-[580px] max-h-[820px] overflow-hidden">

        {/* ── LEFT COLUMN: Care Communications (3 cols) ─────────────────────── */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-3 shadow-2xs flex flex-col h-full overflow-hidden">
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Care Communications</span>
            </h3>
            <button
              onClick={loadConversations}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh Communications"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingConversations ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Compact Filter Tabs */}
          <div className="flex space-x-1 p-1 bg-slate-100/70 border border-slate-200/60 rounded-lg text-[11px] font-medium">
            {[
              { id: 'all', label: 'All' },
              { id: 'doctors', label: 'Doctors' },
              { id: 'ai', label: 'AI Assistant' },
              { id: 'archived', label: 'Archived' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-1 px-1 rounded text-center transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Compact Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search care team..."
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Care Communications List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {loadingConversations ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto text-blue-600" />
                <p>Loading care communications...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-8 text-center space-y-2 px-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-auto">
                <p className="text-xs font-bold text-slate-700">No active doctor conversations</p>
                <p className="text-[11px] text-slate-500">Your conversations will appear here after booking a consultation with a specialist.</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = selectedConversationId === conv.id;
                const isAi = conv.isAi;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500/80 shadow-2xs'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      {/* Compact Icon */}
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isAi ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-blue-100 text-blue-600 border border-blue-200'
                      }`}>
                        {isAi ? <Sparkles className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {conv.doctorName || conv.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">
                            {conv.lastMessageTime}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 truncate mb-1">
                          {conv.specialty}
                        </p>

                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-slate-600 truncate pr-2">
                            {conv.lastMessage}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs justify-center font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => navigate('/appointments')}
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              <span>Contact Care Team</span>
            </Button>
          </div>
        </div>

        {/* ── CENTER COLUMN: Clinical Communication Workspace (6 cols) ──────── */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl flex flex-col h-full overflow-hidden shadow-2xs relative">
          
          {/* Active Header */}
          <div className="p-3 px-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                activeConv.isAi ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-blue-100 text-blue-600 border border-blue-200'
              }`}>
                {activeConv.isAi ? <Sparkles className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {activeConv.doctorName || activeConv.title}
                  </h3>
                  <Badge variant={activeConv.isAi ? 'purple' : 'success'} className="text-[10px] py-0 px-2 flex-shrink-0">
                    {activeConv.isAi ? 'AI Health Assistant' : 'Verified Physician'}
                  </Badge>

                  {activeConv.isAi && (
                    <button
                      onClick={() => setShowAiInfoModal(true)}
                      className="text-slate-400 hover:text-purple-600 transition-colors"
                      title="AI Engine Info"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {activeConv.specialty} {!activeConv.isAi && activeConv.hospital ? `• ${activeConv.hospital}` : ''}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {!activeConv.isAi && activeConv.consultation_id && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs py-1 px-2.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate('/consultations')}
                >
                  <FileText className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  <span>View Consultation</span>
                </Button>
              )}

              {/* Overflow Header Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="More Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenuDropdown && (
                  <div className="absolute right-0 top-8 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                    <button
                      onClick={() => {
                        setShowArchiveConfirm(true);
                        setShowMenuDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive Thread</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Disclosure Banner (Subtle & Concise) */}
          {activeConv.isAi && (
            <div className="px-4 py-1.5 bg-purple-50/70 border-b border-purple-100 flex items-center space-x-2 text-[11px] text-purple-800 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-purple-600" />
              <span>AI-generated guidance is informational and does not replace professional medical advice.</span>
            </div>
          )}

          {/* Clinical Communication Timeline Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30">
            
            {/* System Activity Timeline Marker */}
            <div className="text-center my-1">
              <span className="text-[10px] text-slate-400 font-medium bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                Timeline Activity • {formatDate(currentMessages[0]?.created_at)}
              </span>
            </div>

            {/* Real Consultation Event Marker */}
            {!activeConv.isAi && activeConv.appointment_date && (
              <div className="p-2.5 bg-blue-50/80 border border-blue-100 rounded-xl text-xs flex items-center space-x-2 text-blue-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span><strong>Appointment Confirmed:</strong> Scheduled for {activeConv.appointment_date} {activeConv.appointment_time || ''}</span>
              </div>
            )}

            {loadingMessages ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto text-blue-600" />
                <p>Retrieving timeline entries...</p>
              </div>
            ) : currentMessages.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                <Stethoscope className="w-6 h-6 mx-auto text-slate-300" />
                <p className="font-bold text-slate-700">Communication Timeline Active</p>
                <p>Send a message below to transmit an entry to your care team.</p>
              </div>
            ) : (
              currentMessages.map((msg, index) => {
                const isMe = msg.sender_user_id === userId || msg.sender_role === 'PATIENT';
                const isAi = msg.sender_role === 'AI_ASSISTANT';

                return (
                  <div
                    key={msg.message_id || index}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                      isMe
                        ? 'bg-blue-50/50 border-blue-200/70 text-slate-900'
                        : isAi
                        ? 'bg-purple-50/40 border-purple-200/60 text-purple-950'
                        : 'bg-white border-slate-200/80 text-slate-900 shadow-2xs'
                    }`}
                  >
                    {/* Entry Header */}
                    <div className="flex items-center justify-between border-b border-black/5 pb-1 text-[11px]">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">
                          {isMe ? patientFullName : msg.sender_name || activeConv.doctorName}
                        </span>
                        <Badge variant={isMe ? 'secondary' : isAi ? 'purple' : 'success'} className="text-[9px] py-0 px-1">
                          {isMe ? 'PATIENT' : isAi ? 'AI ASSISTANT' : 'PHYSICIAN'}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>

                    {/* Entry Content */}
                    <p className="whitespace-pre-wrap leading-relaxed pt-0.5">
                      {msg.content}
                    </p>

                    {/* Footer Status for Patient Messages */}
                    {isMe && (
                      <div className="flex justify-end pt-0.5 text-[10px] text-slate-400 items-center gap-1">
                        {msg.status === 'sending' ? (
                          <span>Transmitting...</span>
                        ) : msg.status === 'failed' ? (
                          <button
                            onClick={() => handleRetryMessage(msg)}
                            className="text-rose-600 font-bold underline flex items-center gap-1 cursor-pointer"
                          >
                            <AlertCircle className="w-3 h-3" /> Retry Transmission
                          </button>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCheck className="w-3 h-3" /> Transmitted
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isAiThinking && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 flex items-center space-x-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0 text-purple-600" />
                <span>TeleMed AI Assistant is analyzing clinical evidence...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Fixed Bottom Message Composer */}
          <form onSubmit={handleSendMessage} className="p-2.5 border-t border-slate-100 bg-white flex flex-col space-y-1.5 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => navigate('/intake')}
                className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Upload Document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a secure message to your healthcare team..."
                rows={1}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400 resize-none custom-scrollbar"
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!messageInput.trim() || sending || isAiThinking}
                className="h-8 px-3.5 rounded-lg flex items-center space-x-1.5 flex-shrink-0 text-xs font-semibold"
              >
                {sending || isAiThinking ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </Button>
            </div>

            <div className="text-[10px] text-slate-400 text-center flex items-center justify-center space-x-1">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Transmitted via encrypted telehealth session</span>
            </div>
          </form>
        </div>

        {/* ── RIGHT COLUMN: Context & Care Actions (3 cols) ────────────────── */}
        <div className="lg:col-span-3 space-y-3 h-full overflow-y-auto custom-scrollbar">
          
          {/* Care Context / Consultation Context Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>{activeConv.isAi ? 'Care Context' : 'Consultation Context'}</span>
            </h3>

            <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl space-y-2 text-xs">
              {activeConv.isAi ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Session Type:</span>
                    <span className="font-semibold text-slate-800">AI Assistant Session</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Engine:</span>
                    <span className="font-semibold text-purple-700">TeleMed AI v4.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Specialist:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[130px]">{activeConv.doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Specialty:</span>
                    <span className="font-semibold text-slate-800">{activeConv.specialty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Consultation ID:</span>
                    <span className="font-mono font-bold text-blue-600">{activeConv.consultation_id}</span>
                  </div>
                  {activeConv.appointment_date && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Slot:</span>
                      <span className="font-semibold text-slate-800">{activeConv.appointment_date}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Status:</span>
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {activeConv.status || 'Active'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {!activeConv.isAi && activeConv.consultation_id && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs justify-center border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => navigate('/consultations')}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                <span>View Consultation Details</span>
              </Button>
            )}
          </div>

          {/* Prioritized 3-4 Actions Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Care Actions</span>
            </h3>

            <div className="space-y-1.5">
              <button
                onClick={() => navigate('/records')}
                className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center space-x-2.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>View Health Records</span>
              </button>

              <button
                onClick={() => navigate('/reports')}
                className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center space-x-2.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>View Latest Report</span>
              </button>

              {activeConv.isAi ? (
                <button
                  onClick={() => navigate('/copilot')}
                  className="w-full p-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-medium text-purple-700 flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Open AI Health Copilot</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/appointments')}
                  className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Schedule Follow-up</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── SECURITY DETAILS MODAL ──────────────────────────────────────────── */}
      {showSecurityModal && (
        <Modal
          isOpen={showSecurityModal}
          onClose={() => setShowSecurityModal(false)}
          title="Security & Clinical Protocol"
        >
          <div className="space-y-3 text-xs text-slate-600">
            <p>Your clinical communication session is protected under active patient-doctor authentication controls:</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 font-medium">
              <li>Role-authorized session verification for licensed physicians & patient.</li>
              <li>Encrypted transport layer for all live messages and data streams.</li>
              <li>Read-only authorization guards on medical records.</li>
            </ul>
            <div className="pt-2 text-right">
              <Button size="sm" variant="primary" onClick={() => setShowSecurityModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── AI ENGINE INFO MODAL ───────────────────────────────────────────── */}
      {showAiInfoModal && (
        <Modal
          isOpen={showAiInfoModal}
          onClose={() => setShowAiInfoModal(false)}
          title="TeleMed AI Assistant Engine Details"
        >
          <div className="space-y-3 text-xs text-slate-600">
            <p><strong>Architecture:</strong> Multimodal RAG Engine v4.0</p>
            <p><strong>Evidence Sources:</strong> Integrated Clinical Biomarkers, Continuous Glucose Monitors, Apple/Fitbit Wearables, Ayumetrix Gut Microbiome Sequencing, and Peer-Reviewed Literature.</p>
            <p className="p-2 bg-purple-50 border border-purple-100 text-purple-800 rounded-lg">
              AI outputs provide evidence-based decision support. All clinical actions must be reviewed by your attending physician.
            </p>
            <div className="pt-2 text-right">
              <Button size="sm" variant="primary" onClick={() => setShowAiInfoModal(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ARCHIVE CONFIRMATION MODAL ──────────────────────────────────────── */}
      {showArchiveConfirm && (
        <Modal
          isOpen={showArchiveConfirm}
          onClose={() => setShowArchiveConfirm(false)}
          title="Confirm Archive"
        >
          <div className="space-y-3 text-xs text-slate-600">
            <p>Are you sure you want to archive this communication thread? It can be retrieved anytime under the Archived tab.</p>
            <div className="flex justify-end space-x-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setShowArchiveConfirm(false)}>Cancel</Button>
              <Button size="sm" variant="primary" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={confirmArchive}>Archive</Button>
            </div>
          </div>
        </Modal>
      )}

    </PageContainer>
  );
}
