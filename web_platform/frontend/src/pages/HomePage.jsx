import React from 'react';
import { ArrowRight, Activity, Watch, Dna, Cpu, Layers, BarChart2, Brain, FileCheck } from 'lucide-react';

export default function HomePage({ onStartIntake }) {
  const modalities = [
    {
      title: 'Clinical Data',
      icon: Activity,
      color: 'var(--accent-cyan)',
      bg: 'rgba(56, 189, 248, 0.12)',
      desc: 'Laboratory diagnostics, anthropometric measurements, resting blood pressure, fasting glucose, HbA1c, and lipid panels.'
    },
    {
      title: 'Wearable Telemetry',
      icon: Watch,
      color: 'var(--accent-amber)',
      bg: 'rgba(245, 158, 11, 0.12)',
      desc: 'Continuous telemetry sync including daily step counts, active minutes, resting heart rate, sleep duration, and continuous glucose variability.'
    },
    {
      title: 'Gut Microbiome',
      icon: Dna,
      color: 'var(--accent-purple)',
      bg: 'rgba(168, 85, 247, 0.12)',
      desc: 'Taxonomic microbial relative abundance profiles (Akkermansia, Faecalibacterium) and Shannon diversity indices for dysbiosis evaluation.'
    }
  ];

  const pipelineNodes = [
    { label: 'Multimodal Intake', icon: Layers, desc: 'IMDIE Parsing & Validation' },
    { label: 'Expert Models', icon: Cpu, desc: 'CatBoost & LightGBM Experts' },
    { label: 'Dynamic Fusion', icon: BarChart2, desc: '7 Modality-Adaptive Pathways' },
    { label: 'Explainable AI', icon: Brain, desc: 'Feature-Level SHAP Drivers' },
    { label: 'Grounded Report', icon: FileCheck, desc: 'Evidence RAG & Q&A Assistant' }
  ];

  const targetConditions = [
    { name: 'Type 2 Diabetes', code: 'T2D' },
    { name: 'Prediabetes', code: 'PRE' },
    { name: 'High Adiposity Risk', code: 'HAR' },
    { name: 'Metabolic Syndrome', code: 'MET' },
    { name: 'NAFLD', code: 'LIV' }
  ];

  return (
    <div className="app-container" style={{ padding: '30px 24px' }}>
      {/* Hero Section */}
      <div className="glass-card" style={{
        textAlign: 'center',
        padding: '60px 40px',
        marginBottom: '40px',
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'rgba(56, 189, 248, 0.15)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          color: 'var(--accent-cyan)',
          fontSize: '0.825rem',
          fontWeight: 600,
          marginBottom: '20px'
        }}>
          <Activity size={16} /> Clinical AI Decision-Support Platform
        </div>

        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 800,
          lineHeight: 1.2,
          letterSpacing: '-0.03em',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #ffffff 30%, var(--accent-cyan) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Generative AI Assisted Telemedicine Platform
        </h1>

        <p style={{
          maxWidth: '780px',
          margin: '0 auto 32px auto',
          fontSize: '1.1rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6
        }}>
          Multimodal AI decision-support integrating clinical data, wearable telemetry, and gut microbiome profiles for metabolic risk assessment.
        </p>

        <button className="btn btn-primary" onClick={onStartIntake} style={{ padding: '14px 32px', fontSize: '1rem' }}>
          Start Multimodal Analysis <ArrowRight size={18} />
        </button>
      </div>

      {/* 3 Modality Cards */}
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px', color: 'var(--text-main)' }}>
          Supported Patient Data Modalities
        </h2>
        <div className="grid-3">
          {modalities.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <div key={i} className="glass-card">
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: mod.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  color: mod.color
                }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px', color: 'var(--text-main)' }}>
                  {mod.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {mod.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Architecture Pipeline Flow Diagram */}
      <div className="glass-card" style={{ marginBottom: '48px', padding: '32px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '24px', textAlign: 'center', color: 'var(--text-main)' }}>
          End-to-End Multimodal AI Architecture Pipeline
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {pipelineNodes.map((node, i) => {
            const NodeIcon = node.icon;
            return (
              <React.Fragment key={i}>
                <div style={{
                  flex: 1,
                  minWidth: '160px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  padding: '18px 14px',
                  textAlign: 'center',
                  transition: 'border-color 0.2s ease'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 10px auto'
                  }}>
                    <NodeIcon size={20} />
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    {node.desc}
                  </div>
                </div>
                {i < pipelineNodes.length - 1 && (
                  <div style={{ color: 'var(--text-dim)', fontSize: '1.2rem', fontWeight: 700 }}>
                    →
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 5 Target Metabolic Conditions */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
          Evaluated Target Metabolic Conditions
        </h2>
        <div className="grid-5">
          {targetConditions.map((cond, i) => (
            <div key={i} className="glass-card" style={{ padding: '16px', textTransform: 'none' }}>
              <span className="badge badge-purple" style={{ marginBottom: '8px' }}>{cond.code}</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {cond.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
