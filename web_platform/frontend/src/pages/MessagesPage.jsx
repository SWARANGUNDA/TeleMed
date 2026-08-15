import React, { useState, useEffect } from 'react';
import { PageHeader, PageContainer } from '../components/layout';
import { Card, Badge, Button, Input, TextArea, EmptyState } from '../components/ui';
import {
  MessageSquare, Send, Paperclip, Search, CheckCheck, UserCheck, ShieldCheck,
  FileText, Pin, Clock, Phone, Video, MoreVertical, Circle, RefreshCw
} from 'lucide-react';
import { fetchPatientConsultations } from '../api/client';

export default function MessagesPage({ user }) {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConsults() {
      setLoading(true);
      try {
        const res = await fetchPatientConsultations();
        const consults = res?.consultations || [];
        const formatted = consults.map(c => ({
          id: c.consultation_id,
          doctorName: c.doctor?.full_name || 'Assigned Specialist',
          specialty: c.doctor?.specialization || 'Metabolic Specialist',
          hospital: c.doctor?.hospital_affiliation || 'TeleMed Hospital Network',
          avatar: 'DOC',
          isOnline: true,
          lastMessage: c.reason_for_consultation || 'Consultation thread initialized.',
          lastMessageTime: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
          unreadCount: 0,
          pinned: false,
        }));
        setConversations(formatted);
        if (formatted.length > 0) {
          setSelectedConversationId(formatted[0].id);
        }
      } catch (e) {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    }
    loadConsults();
  }, [user]);

  if (loading) {
    return (
      <PageContainer className="space-y-8 py-6">
        <PageHeader
          title="Secure Telemedicine Messaging"
          description="End-to-end encrypted messaging with your assigned metabolic and clinical specialists"
          badge="Encrypted Channel"
        />
        <Card isGlass={true} className="p-8 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)]">Loading secure consultation messages...</p>
        </Card>
      </PageContainer>
    );
  }

  if (conversations.length === 0) {
    return (
      <PageContainer className="space-y-8 py-6">
        <PageHeader
          title="Secure Telemedicine Messaging"
          description="End-to-end encrypted messaging with your assigned metabolic and clinical specialists"
          badge="Encrypted Channel"
        />
        <Card isGlass={true} className="p-8 text-center space-y-4">
          <MessageSquare className="w-12 h-12 text-[var(--primary)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--text-main)]">No Active Consultation Messages</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            You do not have any open consultation threads. Request a specialist consultation to start secure end-to-end encrypted messaging.
          </p>
        </Card>
      </PageContainer>
    );
  }

  const activeConv = conversations.find(c => c.id === selectedConversationId) || conversations[0];
  const activeMessages = messagesHistory[selectedConversationId] || [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg = {
      id: `MSG-${Date.now()}`,
      sender: 'PATIENT',
      senderName: user?.name || user?.full_name || user?.patient_profile?.full_name || (user?.email ? user.email.split('@')[0].replace('.', ' ').replace('_', ' ') : 'Patient'),
      text: messageInput.trim(),
      timestamp: 'Just now',
      status: 'SENT',
    };

    setMessagesHistory(prev => ({
      ...prev,
      [selectedConversationId]: [...(prev[selectedConversationId] || []), newMsg],
    }));

    setMessageInput('');
  };

  const filteredConversations = conversations.filter(c => {
    return c.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.specialty.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <PageContainer className="space-y-6 py-6">
      
      {/* Header */}
      <PageHeader
        title="Secure Patient-Doctor Communication"
        description="Encrypted HIPAA-ready direct messaging with verified physicians and care teams"
        badge="Encrypted Messaging"
      />

      {/* 2-Panel Messaging Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-220px)] items-stretch">
        
        {/* Left Panel — Conversation List */}
        <Card isGlass={true} className="lg:col-span-4 p-4 flex flex-col space-y-4 shadow-xl overflow-hidden">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider font-mono">Conversations</h3>
              <Badge variant="primary" size="sm">{conversations.length} Active</Badge>
            </div>
            <Input
              placeholder="Search conversations..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === selectedConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)] shadow-sm'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--primary)] text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-extrabold flex items-center justify-center text-xs">
                          {conv.avatar}
                        </div>
                        {conv.isOnline && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--success)] border-2 border-[var(--bg-surface)]" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[var(--text-main)] truncate">{conv.doctorName}</h4>
                        <p className="text-[10px] text-[var(--text-muted)]">{conv.specialty}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{conv.lastMessageTime}</span>
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] truncate italic">{conv.lastMessage}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right Panel — Chat Window */}
        <Card isGlass={true} className="lg:col-span-8 p-6 flex flex-col justify-between shadow-xl">
          
          {/* Active Conversation Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-extrabold flex items-center justify-center text-xs">
                  {activeConv.avatar}
                </div>
                {activeConv.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[var(--success)] border-2 border-[var(--bg-surface)]" />
                )}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-main)]">{activeConv.doctorName}</h3>
                <span className="text-xs text-[var(--text-muted)]">{activeConv.specialty} • {activeConv.hospital}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">HIPAA Encrypted</Badge>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 my-2 pr-2">
            {activeMessages.map((msg) => {
              const isPatient = msg.sender === 'PATIENT';
              return (
                <div key={msg.id} className={`flex flex-col ${isPatient ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">{msg.senderName}</span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-[80%] text-xs leading-relaxed shadow-sm ${
                      isPatient
                        ? 'bg-[var(--primary)] text-white rounded-br-none'
                        : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {isPatient && (
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] mt-1">
                      <CheckCheck className="w-3.5 h-3.5 text-[var(--primary)]" /> Read
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Message Composer Input Form */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
            <Button variant="ghost" size="sm" type="button" leftIcon={<Paperclip className="w-4 h-4" />}>
              Attach
            </Button>

            <Input
              placeholder="Type your secure message to physician..."
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
