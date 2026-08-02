import React, { useState, useEffect } from 'react';
import {
  FileText, History, Download, Trash2, Calendar, Activity, GitCompare,
  TrendingUp, Eye, ShieldCheck, Database, AlertTriangle, CheckCircle,
  HelpCircle, RefreshCw, X, ChevronRight, Layers, ArrowRight
} from 'lucide-react';
import { fetchPatientRecords, fetchRecordDetail, exportRecord, deleteRecord } from '../api/client';

export default function HealthRecordsPage({ currentUser }) {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'compare' | 'trends'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Selected records for comparison (max 2)
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  // Detail Modal state
  const [selectedDetailRecord, setSelectedDetailRecord] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete Modal state
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchPatientRecords();
      setRecords(data.records || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load health records history.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (recordId) => {
    setDetailLoading(true);
    try {
      const detail = await fetchRecordDetail(recordId);
      setSelectedDetailRecord(detail);
    } catch (err) {
      alert(err.message || 'Failed to load record detail snapshot.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = async (recordId, e) => {
    if (e) e.stopPropagation();
    try {
      await exportRecord(recordId);
    } catch (err) {
      alert(err.message || 'Failed to export health record.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteRecord(recordToDelete.record_id);
      setRecords((prev) => prev.filter((r) => r.record_id !== recordToDelete.record_id));
      setSelectedForCompare((prev) => prev.filter((id) => id !== recordToDelete.record_id));
      setRecordToDelete(null);
      if (selectedDetailRecord && selectedDetailRecord.record_id === recordToDelete.record_id) {
        setSelectedDetailRecord(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete health record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSelectForCompare = (recordId) => {
    if (selectedForCompare.includes(recordId)) {
      setSelectedForCompare((prev) => prev.filter((id) => id !== recordId));
    } else {
      if (selectedForCompare.length >= 2) {
        // Replace oldest selection
        setSelectedForCompare([selectedForCompare[1], recordId]);
      } else {
        setSelectedForCompare((prev) => [...prev, recordId]);
      }
    }
  };

  // Metric extraction helper for Comparison & Trends
  const extractNumericVal = (record, keyPath) => {
    if (!record) return null;
    const [category, key] = keyPath.split('.');

    // Check confirmed_features
    const cf = record.confirmed_features || {};
    if (category in cf && cf[category] && key in cf[category]) {
      const raw = cf[category][key];
      if (raw !== null && raw !== undefined && raw !== '' && !isNaN(raw)) {
        return parseFloat(raw);
      }
    }

    // Check disease outcomes
    if (category === 'disease_outcomes') {
      const outcomes = record.prediction_snapshot?.disease_outcomes || {};
      if (key in outcomes) {
        const prob = outcomes[key]?.final_fusion_probability;
        if (prob !== undefined && prob !== null) {
          return parseFloat((prob * 100).toFixed(1));
        }
      }
    }

    return null;
  };

  // Trend metrics definitions
  const trendMetricsList = [
    { label: 'Fasting Blood Glucose (mg/dL)', path: 'clinical.Fasting_Blood_Glucose', unit: 'mg/dL' },
    { label: 'HbA1c (%)', path: 'clinical.HbA1c', unit: '%' },
    { label: 'BMI (kg/m²)', path: 'clinical.BMI', unit: 'kg/m²' },
    { label: 'Waist Circumference (cm)', path: 'clinical.Waist_Circumference_cm', unit: 'cm' },
    { label: 'Systolic BP (mmHg)', path: 'clinical.Systolic_BP', unit: 'mmHg' },
    { label: 'Diastolic BP (mmHg)', path: 'clinical.Diastolic_BP', unit: 'mmHg' },
    { label: 'Triglycerides (mg/dL)', path: 'clinical.Triglycerides', unit: 'mg/dL' },
    { label: 'LDL Cholesterol (mg/dL)', path: 'clinical.LDL_Cholesterol', unit: 'mg/dL' },
    { label: 'HDL Cholesterol (mg/dL)', path: 'clinical.HDL_Cholesterol', unit: 'mg/dL' },
    { label: 'ALT Liver Enzyme (U/L)', path: 'clinical.ALT', unit: 'U/L' },
    { label: 'AST Liver Enzyme (U/L)', path: 'clinical.AST', unit: 'U/L' },
    { label: 'Type 2 Diabetes Screening Score (%)', path: 'disease_outcomes.Type2_Diabetes', unit: '%' },
    { label: 'Prediabetes Screening Score (%)', path: 'disease_outcomes.Prediabetes', unit: '%' },
    { label: 'Obesity Screening Score (%)', path: 'disease_outcomes.Obesity', unit: '%' },
    { label: 'Metabolic Syndrome Screening Score (%)', path: 'disease_outcomes.Metabolic_Syndrome', unit: '%' },
    { label: 'NAFLD Screening Score (%)', path: 'disease_outcomes.NAFLD', unit: '%' },
  ];

  const sortedChronologicalRecords = [...records].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-cyan">v3.3 LONGITUDINAL ARCHIVE</span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Persistent Health Records & History
              </h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Archived multimodal clinical assessments, side-by-side analysis comparison, and longitudinal measurement trends.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${activeTab === 'history' ? 'btn-cyan' : 'btn-outline'}`}
              onClick={() => setActiveTab('history')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <History size={16} /> Record History ({records.length})
            </button>
            <button
              className={`btn ${activeTab === 'compare' ? 'btn-cyan' : 'btn-outline'}`}
              onClick={() => setActiveTab('compare')}
              disabled={records.length < 2}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <GitCompare size={16} /> Compare ({selectedForCompare.length}/2)
            </button>
            <button
              className={`btn ${activeTab === 'trends' ? 'btn-cyan' : 'btn-outline'}`}
              onClick={() => setActiveTab('trends')}
              disabled={records.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <TrendingUp size={16} /> Trends
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <RefreshCw size={36} className="spin" style={{ color: 'var(--accent-cyan)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading persistent health records...</p>
        </div>
      ) : errorMsg ? (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-rose)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={24} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Error Loading Records</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', marginBottom: '16px' }}>{errorMsg}</p>
          <button className="btn btn-outline" onClick={loadRecords}>Retry</button>
        </div>
      ) : records.length === 0 ? (
        /* Empty State */
        <div className="glass-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
          <Database size={56} style={{ color: 'var(--accent-cyan)', marginBottom: '16px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            No Persistent Health Records Found
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 24px auto' }}>
            You have not completed any health analysis assessments yet. Complete your first multimodal intake assessment to generate persistent clinical records and build your longitudinal health history.
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: HISTORY LIST */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {records.map((record) => {
                const isSelected = selectedForCompare.includes(record.record_id);
                const outcomes = record.prediction_snapshot?.disease_outcomes || {};
                const outcomeKeys = Object.keys(outcomes);

                return (
                  <div
                    key={record.record_id}
                    className="glass-card hover-glow"
                    style={{
                      borderLeft: `4px solid ${
                        record.status === 'REPORT_READY' ? 'var(--accent-emerald)' :
                        record.status === 'XAI_READY' ? 'var(--accent-cyan)' : 'var(--accent-amber)'
                      }`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                            Record #{record.record_id}
                          </span>
                          <span className="badge badge-outline">
                            <Calendar size={12} style={{ marginRight: '4px' }} />
                            {new Date(record.created_at).toLocaleString()}
                          </span>
                          <span className="badge badge-cyan">Pipeline {record.pipeline_version || 'v3.3'}</span>
                          <span className="badge badge-purple">Pathway {record.effective_pathway || record.pathway_used || 'N/A'}</span>
                          <span className={`badge ${
                            record.status === 'REPORT_READY' ? 'badge-emerald' :
                            record.status === 'XAI_READY' ? 'badge-cyan' : 'badge-amber'
                          }`}>
                            {record.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          <span>
                            Data Quality: <strong style={{ color: 'var(--accent-emerald)' }}>{record.data_quality_score != null ? `${record.data_quality_score}%` : 'N/A'}</strong>
                          </span>
                          <span>|</span>
                          <span>
                            Modalities:{' '}
                            {(record.active_modalities || []).map((m) => (
                              <span key={m} className="badge badge-outline" style={{ marginLeft: '4px', textTransform: 'capitalize' }}>
                                {m}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          className={`btn ${isSelected ? 'btn-cyan' : 'btn-outline'}`}
                          onClick={() => toggleSelectForCompare(record.record_id)}
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          {isSelected ? '✓ Selected for Compare' : '+ Select to Compare'}
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => handleOpenDetail(record.record_id)}
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          <Eye size={14} style={{ marginRight: '4px' }} /> View Snapshot
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={(e) => handleExport(record.record_id, e)}
                          title="Export Safe Structured JSON Record"
                          style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                        >
                          <Download size={14} />
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => setRecordToDelete(record)}
                          title="Delete Health Record"
                          style={{ fontSize: '0.8rem', padding: '6px 10px', color: 'var(--accent-rose)', borderColor: 'var(--border-subtle)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Screening outcome pills summary */}
                    {outcomeKeys.length > 0 && (
                      <div style={{
                        marginTop: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        {outcomeKeys.map((disease) => {
                          const outcome = outcomes[disease];
                          const probPct = outcome?.final_fusion_probability != null
                            ? (outcome.final_fusion_probability * 100).toFixed(1)
                            : 'N/A';
                          const isHigh = outcome?.final_prediction === 1;

                          return (
                            <div
                              key={disease}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: isHigh ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                border: `1px solid ${isHigh ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                fontSize: '0.78rem'
                              }}
                            >
                              <span style={{ color: 'var(--text-muted)' }}>{disease.replace(/_/g, ' ')}: </span>
                              <strong style={{ color: isHigh ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                                {probPct}%
                              </strong>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: SIDE-BY-SIDE COMPARISON */}
          {activeTab === 'compare' && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Side-by-Side Analysis Comparison Matrix
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Compare observations between 2 selected historical assessments. Missing fields remain N/A.
              </p>

              {/* Research Non-Diagnostic Disclaimer */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '0.8rem',
                color: 'var(--accent-amber)',
                marginBottom: '20px'
              }}>
                <strong>Non-Diagnostic Research Disclaimer:</strong> Score changes reflect model screening differences across distinct input samples; they do not constitute medical prognosis or diagnostic trend confirmation.
              </div>

              {selectedForCompare.length < 2 ? (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <GitCompare size={40} style={{ marginBottom: '12px', opacity: 0.6 }} />
                  <p>Please select exactly 2 records from the Record History tab to enable side-by-side comparison.</p>
                </div>
              ) : (
                (() => {
                  const recA = records.find((r) => r.record_id === selectedForCompare[0]);
                  const recB = records.find((r) => r.record_id === selectedForCompare[1]);
                  if (!recA || !recB) return null;

                  return (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border-subtle)', textAlign: 'left' }}>
                            <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Parameter / Feature</th>
                            <th style={{ padding: '12px', color: 'var(--accent-cyan)' }}>
                              Run A (#{recA.record_id.slice(-6)})<br />
                              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                                {new Date(recA.created_at).toLocaleDateString()} (v{recA.pipeline_version})
                              </span>
                            </th>
                            <th style={{ padding: '12px', color: 'var(--accent-purple)' }}>
                              Run B (#{recB.record_id.slice(-6)})<br />
                              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                                {new Date(recB.created_at).toLocaleDateString()} (v{recB.pipeline_version})
                              </span>
                            </th>
                            <th style={{ padding: '12px', color: 'var(--text-main)' }}>Difference (Δ)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Modalities & Data Quality */}
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '10px 12px', fontWeight: 700 }}>Data Quality Score</td>
                            <td style={{ padding: '10px 12px' }}>{recA.data_quality_score != null ? `${recA.data_quality_score}%` : 'N/A'}</td>
                            <td style={{ padding: '10px 12px' }}>{recB.data_quality_score != null ? `${recB.data_quality_score}%` : 'N/A'}</td>
                            <td style={{ padding: '10px 12px' }}>
                              {recA.data_quality_score != null && recB.data_quality_score != null
                                ? `${(recB.data_quality_score - recA.data_quality_score).toFixed(1)}%`
                                : 'N/A'}
                            </td>
                          </tr>

                          {/* 5 Disease Screening Outputs */}
                          <tr style={{ background: 'var(--bg-card-header)' }}>
                            <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                              Model-Estimated Screening Scores (%)
                            </td>
                          </tr>

                          {['Type2_Diabetes', 'Prediabetes', 'Obesity', 'Metabolic_Syndrome', 'NAFLD'].map((disease) => {
                            const valA = extractNumericVal(recA, `disease_outcomes.${disease}`);
                            const valB = extractNumericVal(recB, `disease_outcomes.${disease}`);
                            const delta = (valA != null && valB != null) ? (valB - valA).toFixed(1) : null;

                            return (
                              <tr key={disease} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '10px 12px' }}>{disease.replace(/_/g, ' ')}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{valA != null ? `${valA}%` : 'N/A'}</td>
                                <td style={{ padding: '10px 12px', fontWeight: 600 }}>{valB != null ? `${valB}%` : 'N/A'}</td>
                                <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>
                                  {delta != null ? (delta > 0 ? `+${delta}%` : `${delta}%`) : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Key Clinical Lab Values */}
                          <tr style={{ background: 'var(--bg-card-header)' }}>
                            <td colSpan={4} style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                              Clinical Lab Measurements
                            </td>
                          </tr>

                          {[
                            { name: 'Fasting Blood Glucose', path: 'clinical.Fasting_Blood_Glucose', unit: 'mg/dL' },
                            { name: 'HbA1c', path: 'clinical.HbA1c', unit: '%' },
                            { name: 'BMI', path: 'clinical.BMI', unit: 'kg/m²' },
                            { name: 'Systolic BP', path: 'clinical.Systolic_BP', unit: 'mmHg' },
                            { name: 'Diastolic BP', path: 'clinical.Diastolic_BP', unit: 'mmHg' },
                            { name: 'Triglycerides', path: 'clinical.Triglycerides', unit: 'mg/dL' },
                            { name: 'LDL Cholesterol', path: 'clinical.LDL_Cholesterol', unit: 'mg/dL' },
                            { name: 'HDL Cholesterol', path: 'clinical.HDL_Cholesterol', unit: 'mg/dL' },
                            { name: 'ALT', path: 'clinical.ALT', unit: 'U/L' },
                            { name: 'AST', path: 'clinical.AST', unit: 'U/L' },
                          ].map((item) => {
                            const valA = extractNumericVal(recA, item.path);
                            const valB = extractNumericVal(recB, item.path);
                            const delta = (valA != null && valB != null) ? (valB - valA).toFixed(1) : null;

                            return (
                              <tr key={item.name} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '10px 12px' }}>{item.name} ({item.unit})</td>
                                <td style={{ padding: '10px 12px' }}>{valA != null ? `${valA} ${item.unit}` : 'N/A'}</td>
                                <td style={{ padding: '10px 12px' }}>{valB != null ? `${valB} ${item.unit}` : 'N/A'}</td>
                                <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>
                                  {delta != null ? (delta > 0 ? `+${delta} ${item.unit}` : `${delta} ${item.unit}`) : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {/* TAB 3: LONGITUDINAL TRENDS */}
          {activeTab === 'trends' && (
            <div className="glass-card">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Longitudinal Health Observations & Trend Chronology
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Chronological visualization of actual stored measurements across historical analyses. Gaps in data remain unpopulated; no values are interpolated.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {trendMetricsList.map((metric) => {
                  const dataPoints = sortedChronologicalRecords.map((r) => ({
                    date: new Date(r.created_at).toLocaleDateString(),
                    val: extractNumericVal(r, metric.path),
                    version: r.pipeline_version
                  })).filter((dp) => dp.val !== null);

                  if (dataPoints.length === 0) return null;

                  return (
                    <div
                      key={metric.label}
                      style={{
                        padding: '16px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '10px'
                      }}
                    >
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', display: 'block', marginBottom: '12px' }}>
                        {metric.label}
                      </strong>

                      {/* SVG Trend Sparkline / Chart */}
                      <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                        {dataPoints.map((dp, i) => {
                          const maxVal = Math.max(...dataPoints.map((p) => p.val));
                          const minVal = Math.min(...dataPoints.map((p) => p.val));
                          const range = maxVal - minVal || 1;
                          const heightPct = Math.max(20, Math.min(100, ((dp.val - minVal) / range) * 80 + 20));

                          return (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
                                {dp.val}
                              </span>
                              <div
                                style={{
                                  width: '100%',
                                  maxWidth: '24px',
                                  height: `${heightPct}%`,
                                  background: 'linear-gradient(180deg, var(--accent-cyan) 0%, rgba(6, 182, 212, 0.2) 100%)',
                                  borderRadius: '4px 4px 0 0'
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <span>First: {dataPoints[0].date}</span>
                        <span>Latest: {dataPoints[dataPoints.length - 1].date} ({dataPoints[dataPoints.length - 1].val} {metric.unit})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAIL RECORD MODAL */}
      {selectedDetailRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Record Detail Snapshot #{selectedDetailRecord.record_id}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Created: {new Date(selectedDetailRecord.created_at).toLocaleString()} | Pipeline Version: {selectedDetailRecord.pipeline_version} | Status: {selectedDetailRecord.status}
                </div>
              </div>
              <button className="btn btn-outline" onClick={() => setSelectedDetailRecord(null)} style={{ padding: '6px 12px' }}>
                <X size={16} /> Close
              </button>
            </div>

            {/* Verified Input Snapshot with Provenance */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                Verified Input Features & Provenance Snapshot
              </h4>
              <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', fontSize: '0.82rem', maxHeight: '200px', overflowY: 'auto' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                  {JSON.stringify(selectedDetailRecord.confirmed_features, null, 2)}
                </pre>
              </div>
            </div>

            {/* Model Predictions Snapshot */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                Model-Estimated Screening Outputs
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {Object.entries(selectedDetailRecord.prediction_snapshot?.disease_outcomes || {}).map(([disease, info]) => (
                  <div key={disease} style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{disease.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: info.final_prediction === 1 ? 'var(--accent-rose)' : 'var(--accent-emerald)', marginTop: '4px' }}>
                      {(info.final_fusion_probability * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Threshold (T): {info.classification_threshold} | {info.final_prediction === 1 ? 'Positive Signal' : 'Negative Signal'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Immutable XAI & Report Snapshots */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '8px' }}>
                Stored Explainability (XAI) & RAG Report Snapshots
              </h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <strong>XAI Attributions: </strong>
                  {selectedDetailRecord.xai_snapshot ? (
                    <span className="badge badge-emerald">STORED & IMMUTABLE</span>
                  ) : (
                    <span className="badge badge-outline">NOT GENERATED</span>
                  )}
                </div>
                <div style={{ flex: 1, padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <strong>AI Clinical Report: </strong>
                  {selectedDetailRecord.report_snapshot ? (
                    <span className="badge badge-emerald">STORED & IMMUTABLE</span>
                  ) : (
                    <span className="badge badge-outline">NOT GENERATED</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {recordToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '24px', textAlign: 'center' }}>
            <AlertTriangle size={48} style={{ color: 'var(--accent-rose)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Confirm Record Deletion
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
              Are you sure you want to permanently delete Health Record <strong>#{recordToDelete.record_id}</strong>? This action will purge the input snapshot, predictions, and stored XAI/report snapshots. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                className="btn btn-outline"
                onClick={() => setRecordToDelete(null)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                style={{ background: 'var(--accent-rose)', color: '#fff', border: 'none' }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
