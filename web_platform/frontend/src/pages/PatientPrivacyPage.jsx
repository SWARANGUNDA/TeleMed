import React, { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Eye, Lock, FileText, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { fetchPatientAccessHistory, exportUserAccountData, requestAccountDeletion } from '../api/client';

export default function PatientPrivacyPage({ user }) {
  const [accessLogs, setAccessLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAccessHistory();
  }, []);

  const loadAccessHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPatientAccessHistory();
      setAccessLogs(res.access_history || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch data access history.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await exportUserAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telemed_account_data_${user?.user_id || 'export'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to export account data.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    setDeleting(true);
    setError(null);
    try {
      const res = await requestAccountDeletion(deleteReason);
      setDeleteStatus(res);
      setShowDeleteModal(false);
    } catch (err) {
      setError(err.message || 'Failed to submit deletion request.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={24} style={{ color: 'var(--accent-cyan)' }} />
            <span>Data Privacy, Access Logs & Governance</span>
          </h1>
          <p className="page-subtitle">
            Complete transparency into who accessed your clinical data, export your personal records, or manage your account.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={handleExportData} disabled={exporting}>
            <Download size={14} /> {exporting ? 'Exporting...' : 'Export My Data (JSON)'}
          </button>
          <button className="btn btn-outline" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }} onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={14} /> Delete Account
          </button>
        </div>
      </div>

      {deleteStatus && (
        <div style={{ padding: '14px 18px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', fontSize: '0.85rem', marginBottom: '20px' }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>✓ Deletion Request Submitted (ID: {deleteStatus.request_id})</div>
          <div>{deleteStatus.message}</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>{deleteStatus.policy_note}</div>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* ACCESS HISTORY TABLE */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={18} style={{ color: 'var(--accent-cyan)' }} /> Who Accessed My Data? (Audit Trail)
        </h3>

        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'rgba(30, 41, 59, 0.5)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Timestamp (UTC)</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Accessor</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Action / Purpose</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Resource ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading access history...</td></tr>
            ) : accessLogs.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No data access events recorded for your account.</td></tr>
            ) : (
              accessLogs.map(log => (
                <tr key={log.event_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{log.actor_email || log.actor_user_id}</td>
                  <td style={{ padding: '10px 16px' }}><span className="status-badge pending">{log.role}</span></td>
                  <td style={{ padding: '10px 16px', color: 'var(--accent-cyan)', fontWeight: 600 }}>{log.action}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-dim)' }}>{log.resource_type} ({log.resource_id.slice(0, 10)})</td>
                  <td style={{ padding: '10px 16px' }}><span className="status-badge active">{log.outcome}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PLATFORM RETENTION & GOVERNANCE POLICY */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={18} style={{ color: 'var(--accent-cyan)' }} /> Platform Data Retention & Governance Policy
        </h3>
        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '12px' }}>
          In accordance with TeleMed AI platform data governance guidelines:
        </p>
        <ul style={{ fontSize: '0.82rem', color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: 1.6 }}>
          <li><strong>Consent Revocation:</strong> Revoking doctor access immediately removes clinical visibility for that practitioner.</li>
          <li><strong>Data Minimization:</strong> Raw passwords, salts, and session keys are never written to audit trails.</li>
          <li><strong>Audit Integrity:</strong> Audit records use cryptographic hash chaining (SHA-256) to ensure logs cannot be modified or deleted.</li>
          <li><strong>Legal Retention Note:</strong> Account deletion requests queue for administrative processing; historical audit events and analyzed snapshots remain retained per platform policy.</li>
        </ul>
      </div>

      {/* ACCOUNT DELETION MODAL */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={20} /> Confirm Account Deletion Request
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Submitting an account deletion request will mark your profile for administrative deletion processing. Historical clinical record snapshots and audit trails will be preserved per platform retention policy.
            </p>
            <form onSubmit={handleDeleteSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Reason for Deletion (Optional)</label>
                <textarea className="form-input" style={{ width: '100%', height: '80px', resize: 'none' }} value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="Tell us why you wish to delete your account..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} disabled={deleting}>
                  {deleting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
