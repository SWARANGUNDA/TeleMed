import React from 'react';
import { Calendar, Bot, ShieldAlert, UserCheck, MessageSquare, Sparkles } from 'lucide-react';

export default function CarePage({ activeSubNav }) {
  const isAppointments = activeSubNav === 'appointments';

  return (
    <div className="page-container">
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-cyan">CARE & GUIDANCE</span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {isAppointments ? 'Telemedicine Consultations & Care Scheduling' : 'Interactive AI Health Guidelines Assistant'}
              </h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {isAppointments
                ? 'Schedule specialist consultation sessions with endocrinology and metabolic specialists.'
                : 'Query evidence-grounded cardiometabolic management guidelines and clinical protocols.'}
            </p>
          </div>
        </div>
      </div>

      {isAppointments ? (
        <div className="grid-2">
          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--accent-cyan)' }} /> Scheduled Consultations
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              No upcoming telemedicine consultation appointments scheduled.
            </p>
            <button className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <Calendar size={14} /> Schedule Specialist Consultation
            </button>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} style={{ color: 'var(--accent-emerald)' }} /> Metabolic Specialist Network
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Connect your research profile with endocrinologists, preventive cardiologists, and gastroenterology experts.
            </p>
          </div>
        </div>
      ) : (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-cyan)' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Grounded Clinical AI Guidelines Assistant
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Powered by Medical RAG retriever over ADA, EASL, and ACC/AHA clinical guidelines.
              </p>
            </div>
          </div>

          <div style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.875rem' }}>
              <Bot size={18} /> TeleMed AI Decision-Support Guidance
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '8px' }}>
              Select a disease assessment from AI Results to activate patient-specific guideline context, or type your query in the Report & Q&A section.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
