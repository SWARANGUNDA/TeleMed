import React, { useState } from 'react';
import { PageHeader, PageContainer } from '../components/layout';
import { Card, Badge, Button, Input, TextArea, EmptyState } from '../components/ui';
import {
  MessageSquare, Send, Paperclip, Search, CheckCheck, UserCheck, ShieldCheck,
  FileText, Pin, Clock, Phone, Video, MoreVertical, Circle
} from 'lucide-react';

export default function MessagesPage({ user }) {
  const [selectedConversationId, setSelectedConversationId] = useState('CONV-101');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // Active Patient ↔ Doctor Conversations
  const [conversations, setConversations] = useState([
    {
      id: 'CONV-101',
      doctorName: 'Dr. Marcus Vance, MD',
      specialty: 'Endocrinology',
      hospital: 'Apex Medical Center',
      avatar: 'MV',
      isOnline: true,
      lastMessage: 'Please ensure you continue monitoring morning fasting glucose levels before our call.',
      lastMessageTime: '10:45 AM',
      unreadCount: 1,
      pinned: true,
    },
    {
      id: 'CONV-102',
      doctorName: 'Dr. Sarah Jenkins, MD',
      specialty: 'Cardiology',
      hospital: 'Silicon Valley Heart Institute',
      avatar: 'SJ',
      isOnline: false,
      lastMessage: 'Your HRV telemetry trend looks very promising after the sleep adjustments.',
      lastMessageTime: 'Yesterday',
      unreadCount: 0,
      pinned: false,
    },
    {
      id: 'CONV-103',
      doctorName: 'Dr. Aris Thorne, PhD',
      specialty: 'Gastroenterology',
      hospital: 'Metabolic & Microbiome Center',
      avatar: 'AT',
      isOnline: true,
      lastMessage: 'Microbiome SCFA sequencing results have been attached to your health vault.',
      lastMessageTime: 'Jul 28',
      unreadCount: 0,
      pinned: false,
    },
  ]);

  // Chat Messages History for Selected Conversation
  const [messagesHistory, setMessagesHistory] = useState({
    'CONV-101': [
      {
        id: 'MSG-1',
        sender: 'DOCTOR',
        senderName: 'Dr. Marcus Vance, MD',
        text: 'Hello Alexander, I reviewed your latest multimodal intake report (ASM-2026-8819). Your TreeSHAP glycemic drivers show great response to dietary adjustments.',
        timestamp: '10:30 AM',
        status: 'READ',
      },
      {
        id: 'MSG-2',
        sender: 'PATIENT',
        senderName: 'Alexander Wright',
        text: 'Thank you Dr. Vance! My morning fasting glucose was down to 105 mg/dL today. Should I maintain the current protocol?',
        timestamp: '10:38 AM',
        status: 'READ',
      },
      {
        id: 'MSG-3',
        sender: 'DOCTOR',
        senderName: 'Dr. Marcus Vance, MD',
        text: 'Yes, please ensure you continue monitoring morning fasting glucose levels before our call tomorrow.',
        timestamp: '10:45 AM',
        status: 'READ',
      },
    ],
    'CONV-102': [
      {
        id: 'MSG-10',
        sender: 'DOCTOR',
        senderName: 'Dr. Sarah Jenkins, MD',
        text: 'Your HRV telemetry trend looks very promising after the sleep adjustments.',
        timestamp: 'Yesterday',
        status: 'READ',
      },
    ],
  });

  const activeConv = conversations.find(c => c.id === selectedConversationId) || conversations[0];
  const activeMessages = messagesHistory[selectedConversationId] || [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const newMsg = {
      id: `MSG-${Date.now()}`,
      sender: 'PATIENT',
      senderName: user?.name || 'Alexander Wright',
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
