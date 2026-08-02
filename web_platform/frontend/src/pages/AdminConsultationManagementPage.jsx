import React, { useState, useEffect } from 'react';
import {
  Stethoscope, Clock, Filter, Search, UserCheck, RefreshCw, X, Check,
  AlertTriangle, ShieldAlert, FileText, User
} from 'lucide-react';
import {
  fetchAdminConsultations,
  fetchAdminDoctorApplications,
  assignDoctorToConsultation,
  adminCancelConsultation
} from '../api/client';

export default function AdminConsultationManagementPage() {
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Assign Doctor Modal State
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [allConsultations, setAllConsultations] = useState([]);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [consData, allConsData, docData] = await Promise.all([
        fetchAdminConsultations(filterStatus || '', searchQuery || ''),
        fetchAdminConsultations('', ''),
        fetchAdminDoctorApplications('VERIFIED') // Fetch ONLY VERIFIED doctors
      ]);
      setConsultations(consData.consultations || []);
      setAllConsultations(allConsData.consultations || []);
      setDoctors(docData.applications || docData.doctors || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load consultation queue.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (st) => {
    if (!st) return allConsultations.length;
    return allConsultations.filter(c => c.status === st).length;
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAssignModal = (cons) => {
    setSelectedConsultation(cons);
    setSelectedDoctorId(cons.assigned_doctor_id || '');
    setAssignmentNotes('');
  };

  const handleExecuteAssignment = async (e) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      alert('Please select an eligible VERIFIED doctor to assign.');
      return;
    }

    setSubmitting(true);
    try {
      await assignDoctorToConsultation(selectedConsultation.consultation_id, selectedDoctorId, assignmentNotes);
      setSelectedConsultation(null);
      await loadData();
      alert('Doctor assigned successfully to consultation request.');
    } catch (err) {
      alert(`Assignment Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelConsultation = async (consId) => {
    if (!window.confirm('Are you sure you want to cancel this consultation request?')) return;
    try {
      await adminCancelConsultation(consId, 'Cancelled by Admin');
      await loadData();
      alert('Consultation request cancelled.');
    } catch (err) {
      alert(err.message || 'Failed to cancel consultation.');
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
      case 'ACTIVE':
        return <span className="badge badge-emerald">ACTIVE CONSULTATION</span>;
      case 'ASSIGNED':
        return <span className="badge badge-cyan">DOCTOR ASSIGNED</span>;
      case 'COMPLETED':
        return <span className="badge badge-outline">COMPLETED</span>;
      case 'DECLINED':
        return <span className="badge badge-amber">DECLINED / RE-ROUTE</span>;
      case 'CANCELLED':
        return <span className="badge badge-rose">CANCELLED</span>;
      default:
        return <span className="badge badge-amber">PENDING ASSIGNMENT</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Title & Refresh */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-cyan">LEVEL 5 ADMIN QUEUE</span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Consultation Management & Doctor Routing
              </h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Route patient consultation requests to eligible VERIFIED doctors while adhering to minimum necessary privilege.
            </p>
          </div>

          <button
            className="btn btn-outline"
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
            {['', 'REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                className={`btn ${filterStatus === st ? 'btn-cyan' : 'btn-outline'}`}
                onClick={() => setFilterStatus(st)}
                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              >
                {st ? `${st} (${getStatusCount(st)})` : `ALL (${getStatusCount('')})`}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Search patient name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                minWidth: '220px'
              }}
            />
            <button type="submit" className="btn btn-outline" style={{ padding: '8px 12px' }}>
              <Search size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Consultations Table */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <RefreshCw size={36} className="spin" style={{ color: 'var(--accent-cyan)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading consultation queue...</p>
        </div>
      ) : errorMsg ? (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-rose)', padding: '20px' }}>
          <strong style={{ color: 'var(--accent-rose)' }}>{errorMsg}</strong>
        </div>
      ) : consultations.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <Clock size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>No consultations found matching filter '{filterStatus || 'ALL'}'.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-header)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '14px 20px' }}>Patient Summary</th>
                <th style={{ padding: '14px 20px' }}>Requested Specialization</th>
                <th style={{ padding: '14px 20px' }}>Category & Urgency</th>
                <th style={{ padding: '14px 20px' }}>Assigned Doctor</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Admin Controls</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((c) => (
                <tr key={c.consultation_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <strong style={{ color: 'var(--text-main)', display: 'block' }}>{c.patient_name || 'Anonymous Patient'}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.patient_email}</span>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {c.requested_specialization}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div>{c.category}</div>
                    <span className="badge badge-outline" style={{ fontSize: '0.68rem', marginTop: '2px' }}>{c.urgency}</span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {c.doctor_name ? (
                      <div>
                        <strong style={{ color: 'var(--text-main)' }}>Dr. {c.doctor_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.doctor_specialization}</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontStyle: 'italic' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>{renderStatusBadge(c.status)}</td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {['REQUESTED', 'ASSIGNED', 'DECLINED'].includes(c.status) && (
                        <button
                          className="btn btn-cyan"
                          onClick={() => handleOpenAssignModal(c)}
                          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                        >
                          <UserCheck size={14} style={{ marginRight: '4px' }} />
                          {c.assigned_doctor_id ? 'Reassign Doctor' : 'Assign Doctor'}
                        </button>
                      )}
                      {['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ACTIVE'].includes(c.status) && (
                        <button
                          className="btn btn-outline"
                          onClick={() => handleCancelConsultation(c.consultation_id)}
                          style={{ fontSize: '0.78rem', padding: '6px 10px', color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGN DOCTOR MODAL */}
      {selectedConsultation && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '640px', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Assign Doctor to Consultation
                </h2>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Requested Specialization: <strong style={{ color: 'var(--accent-cyan)' }}>{selectedConsultation.requested_specialization}</strong> ({selectedConsultation.urgency})
                </div>
              </div>
              <button className="btn btn-outline" onClick={() => setSelectedConsultation(null)} style={{ padding: '6px 12px' }}>
                <X size={16} /> Close
              </button>
            </div>

            <form onSubmit={handleExecuteAssignment}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Select Eligible VERIFIED Doctor ({doctors.length} Available)
                </label>
                {doctors.length === 0 ? (
                  <div style={{ padding: '14px', background: 'var(--bg-primary)', borderRadius: '6px', color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
                    No VERIFIED doctors available in system. Please verify a doctor application in the Doctor Verification workspace first.
                  </div>
                ) : (
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">-- Choose a Verified Doctor --</option>
                    {doctors.map((doc) => (
                      <option key={doc.doctor_id} value={doc.doctor_id}>
                        Dr. {doc.full_name} — {doc.specialization} ({doc.hospital_affiliation || 'TeleMed'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Assignment Notes / Administrator Routing Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional routing notes for doctor..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-emerald"
                  disabled={submitting || doctors.length === 0 || !selectedDoctorId}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {submitting ? <RefreshCw size={16} className="spin" /> : <Check size={16} />} Execute Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
