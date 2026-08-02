import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlayCircle, ArrowRight, CheckCircle2, X, Info } from 'lucide-react';

const DEMO_STEPS = [
  { id: 'intake', label: '1. Intake & OCR', path: '/intake', description: 'IMDIE Multi-Format Data Intake Engine & Quality Validation' },
  { id: 'dashboard', label: '2. Command Center', path: '/dashboard', description: 'Screening Results, Metabolic Profile & Decision Support' },
  { id: 'xai', label: '3. XAI Attribution', path: '/xai', description: 'TreeSHAP Attribution & Directional Factor Analysis' },
  { id: 'report', label: '4. AI Report & RAG', path: '/report', description: 'Clinical Synthesis & Evidence-Grounded Q&A Assistant' },
  { id: 'consult', label: '5. Patient Consult', path: '/consultations', description: 'Patient Telehealth Requests & Shared Health Records' },
  { id: 'doctor', label: '6. Doctor Review', path: '/doctor/dashboard', description: 'Physician Clinical Assessment & Note Authoring' },
  { id: 'admin', label: '7. Admin Workspace', path: '/admin/dashboard', description: 'Doctor Verification, User Audits & System Operations' }
];

export default function GuidedDemoBar({ isDemoActive, onToggleDemo }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isDemoActive) return null;

  const currentPath = location.pathname;
  let activeIndex = 0;
  if (currentPath.includes('/intake')) activeIndex = 0;
  else if (currentPath.includes('/dashboard')) activeIndex = 1;
  else if (currentPath.includes('/xai')) activeIndex = 2;
  else if (currentPath.includes('/report')) activeIndex = 3;
  else if (currentPath.includes('/consultations')) activeIndex = 4;
  else if (currentPath.includes('/doctor')) activeIndex = 5;
  else if (currentPath.includes('/admin')) activeIndex = 6;

  const currentStep = DEMO_STEPS[activeIndex] || DEMO_STEPS[0];
  const nextStep = DEMO_STEPS[Math.min(activeIndex + 1, DEMO_STEPS.length - 1)];

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(139, 92, 246, 0.15) 100%)',
      borderBottom: '1px solid rgba(6, 182, 212, 0.3)',
      position: 'sticky',
      top: '72px',
      zIndex: 90,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      width: '100%'
    }}>
      <div className="top-nav-inner" style={{
        maxWidth: '1600px',
        width: 'calc(100% - 48px)',
        margin: '0 auto',
        padding: '8px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)', fontWeight: 800, fontSize: '0.85rem' }}>
            <PlayCircle size={18} /> EVALUATOR DEMO
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={14} style={{ color: 'var(--accent-cyan)' }} />
            {currentStep.description}
          </span>
        </div>

        {/* Step Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {DEMO_STEPS.map((step, idx) => {
            const isCurrent = idx === activeIndex;
            const isPassed = idx < activeIndex;
            return (
              <button
                key={step.id}
                onClick={() => navigate(step.path)}
                style={{
                  background: isCurrent ? 'var(--accent-cyan)' : isPassed ? 'rgba(6, 182, 212, 0.2)' : 'rgba(30, 41, 59, 0.6)',
                  color: isCurrent ? '#0f172a' : isPassed ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  border: isCurrent ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '3px 10px',
                  fontSize: '0.72rem',
                  fontWeight: isCurrent ? 800 : 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease'
                }}
              >
                {isPassed ? <CheckCircle2 size={12} /> : null}
                {step.label}
              </button>
            );
          })}
        </div>

        {/* Next Step Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeIndex < DEMO_STEPS.length - 1 && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(nextStep.path)}
              style={{ fontSize: '0.75rem', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Next: {nextStep.label.split('.')[1]} <ArrowRight size={14} />
            </button>
          )}
          <button
            onClick={onToggleDemo}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            title="Exit Guided Demo"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
