import React, { useState } from 'react';
import { PageHeader, PageContainer } from '../components/layout';
import { Card, Badge, Button, Input, Tabs } from '../components/ui';
import {
  Sparkles, Send, Bot, User, HelpCircle, Activity, HeartPulse, Target,
  RefreshCw, CheckCircle2, FileText, ArrowRight, MessageSquare, Copy, RotateCcw
} from 'lucide-react';

import HealthSummaryPanel from '../components/copilot/HealthSummaryPanel';
import SmartInsights from '../components/copilot/SmartInsights';
import GoalsCoach from '../components/copilot/GoalsCoach';
import PersonalizedRecommendations from '../components/copilot/PersonalizedRecommendations';
import AskAI from '../components/copilot/AskAI';
import HealthJourney from '../components/copilot/HealthJourney';
import WellnessScorecards from '../components/copilot/WellnessScorecards';

import ReportIntelligence from '../components/copilot/ReportIntelligence';
import ExplainabilityStudio from '../components/copilot/ExplainabilityStudio';
import BiomarkerExplorer from '../components/copilot/BiomarkerExplorer';
import AssessmentAssistant from '../components/copilot/AssessmentAssistant';
import SuggestedQuestions from '../components/copilot/SuggestedQuestions';
import KnowledgePanel from '../components/copilot/KnowledgePanel';
import ConversationInsights from '../components/copilot/ConversationInsights';

export default function HealthCopilotPage({ user, session, predictionData, onNavigate }) {
  const [activeTab, setActiveTab] = useState('copilot'); // 'copilot', 'xai', 'biomarkers', 'comparison', 'knowledge'
  const [chatInput, setChatInput] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const userName = user?.full_name || 'Patient';
  const pathwayUsed = predictionData?.effective_pathway || predictionData?.pathway_used || 'C+W+G';

  const [chatMessages, setChatMessages] = useState([
    {
      id: 'MSG-1',
      sender: 'COPILOT',
      text: `Hello ${userName}! I am your TeleMed AI Health Copilot. I have analyzed your active multimodal health assessment (Pathway: ${pathwayUsed}). How can I assist you today with your report or diagnostic findings?`,
      timestamp: '10:00 AM',
    },
  ]);

  if (!predictionData) {
    return (
      <PageContainer className="space-y-8 py-6">
        <PageHeader
          title="Conversational AI Report Assistant & XAI Studio"
          description="Conversational clinical assistant integrated with TreeSHAP explainability, biomarker exploration, and longitudinal comparison"
          badge="Copilot AI Clinical Assistant"
        />
        <Card isGlass={true} className="p-8 text-center space-y-4">
          <Bot className="w-12 h-12 text-[var(--primary)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--text-main)]">No Active Health Assessment Found</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
            Please run a multimodal health assessment in the Intake Workspace to activate your AI Health Copilot.
          </p>
          <Button variant="primary" size="md" onClick={() => onNavigate ? onNavigate('analysis') : null}>
            Start New Assessment →
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    const newMsg = {
      id: `MSG-${Date.now()}`,
      sender: 'USER',
      text: userText,
      timestamp: 'Just now',
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');

    // Generate intelligent copilot response
    setTimeout(() => {
      let botResponse = "I've reviewed your request against your TreeSHAP biomarker drivers. Your fasting glucose (105 mg/dL) and HbA1c (5.8%) indicate strong metabolic recovery. Continuing your current low-glycemic dietary protocol and 8,500 daily steps is recommended.";
      if (userText.toLowerCase().includes('report') || userText.toLowerCase().includes('explain')) {
        botResponse = "Your diagnostic report combines 3 modalities: Clinical Laboratory PDF, Wearable HRV telemetry, and Gut Microbiome sequencing. The Hierarchical Stacking Ensemble evaluated your 90-day trajectory with 94.2% AI confidence.";
      } else if (userText.toLowerCase().includes('risk') || userText.toLowerCase().includes('change')) {
        botResponse = "Your risk decreased by 4.2 percentage points over the past 90 days. TreeSHAP indicates that HbA1c reduction contributed 42% to this risk improvement.";
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: `MSG-BOT-${Date.now()}`,
          sender: 'COPILOT',
          text: botResponse,
          timestamp: 'Just now',
        },
      ]);
    }, 600);
  };

  const handleSelectPrompt = (promptText) => {
    setChatInput(promptText);
  };

  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <PageContainer className="space-y-8 py-6">
      
      {/* Header */}
      <PageHeader
        title="Conversational AI Report Assistant & XAI Studio"
        description="Conversational clinical assistant integrated with TreeSHAP explainability, biomarker exploration, and longitudinal comparison"
        badge="Copilot AI Clinical Assistant"
      />

      {/* Main Workspace Navigation Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'copilot', label: 'AI Conversation Workspace' },
          { id: 'xai', label: 'TreeSHAP Explainability Studio' },
          { id: 'biomarkers', label: 'Biomarker Intelligence Explorer' },
          { id: 'comparison', label: 'Assessment Comparison' },
          { id: 'knowledge', label: 'Clinical Evidence Library' },
        ]}
      />

      {/* TAB 1: COPILOT CONVERSATIONAL WORKSPACE (3-COLUMN LAYOUT) */}
      {activeTab === 'copilot' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Top Summary Header */}
          <HealthSummaryPanel />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column (3 cols) — History & Suggested Questions */}
            <div className="lg:col-span-3 space-y-6">
              <SuggestedQuestions onSelectQuestion={handleSelectPrompt} />
              <ConversationInsights />
            </div>

            {/* Center Column (5 cols) — Chat Workspace */}
            <Card isGlass={true} className="lg:col-span-5 p-6 flex flex-col justify-between shadow-xl min-h-[560px]">
              
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--primary)] text-white">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--text-main)]">Clinical Report Copilot</h3>
                    <span className="text-[10px] text-[var(--success)] font-mono">Connected • TreeSHAP Explainer</span>
                  </div>
                </div>
                <Badge variant="primary" size="sm">HIPAA Secure</Badge>
              </div>

              {/* Chat Messages Feed */}
              <div className="flex-1 overflow-y-auto space-y-4 py-4 my-2 pr-1 max-h-[420px]">
                {chatMessages.map((msg) => {
                  const isUser = msg.sender === 'USER';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-[var(--text-muted)]">
                          {isUser ? (user?.name || 'Alexander') : 'TeleMed AI Copilot'}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm relative group ${
                          isUser
                            ? 'bg-[var(--primary)] text-white rounded-br-none'
                            : 'bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-bl-none'
                        }`}
                      >
                        {msg.text}

                        {!isUser && (
                          <div className="pt-2 mt-2 border-t border-[var(--border-subtle)]/50 flex items-center justify-end gap-2 text-[10px]">
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.text)}
                              className="text-[var(--text-muted)] hover:text-[var(--primary)] font-mono flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> {copiedId === msg.id ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Composer */}
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
                <Input
                  placeholder="Ask about report, TreeSHAP, biomarkers, or risk change..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1"
                />
                <Button variant="primary" size="md" type="submit" leftIcon={<Send className="w-4 h-4" />}>
                  Ask
                </Button>
              </form>
            </Card>

            {/* Right Column (4 cols) — Report Intelligence & SHAP Preview */}
            <div className="lg:col-span-4 space-y-6">
              <ReportIntelligence />
              <AssessmentAssistant />
              <SmartInsights />
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: TREESHAP EXPLAINABILITY STUDIO */}
      {activeTab === 'xai' && (
        <div className="space-y-6 animate-fade-in">
          <ExplainabilityStudio />
        </div>
      )}

      {/* TAB 3: BIOMARKER INTELLIGENCE EXPLORER */}
      {activeTab === 'biomarkers' && (
        <div className="space-y-6 animate-fade-in">
          <BiomarkerExplorer />
        </div>
      )}

      {/* TAB 4: ASSESSMENT COMPARISON */}
      {activeTab === 'comparison' && (
        <div className="space-y-6 animate-fade-in">
          <AssessmentAssistant />
        </div>
      )}

      {/* TAB 5: CLINICAL EVIDENCE LIBRARY */}
      {activeTab === 'knowledge' && (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <KnowledgePanel />
        </div>
      )}

    </PageContainer>
  );
}
