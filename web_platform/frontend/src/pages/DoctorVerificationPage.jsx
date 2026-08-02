import React, { useState, useEffect } from 'react';
import {
  FileText, Upload, CheckCircle2, AlertTriangle, Clock, RefreshCw,
  ShieldAlert, ShieldCheck, Eye, Trash2, ArrowRight, XCircle, Info, Lock
} from 'lucide-react';
import {
  fetchDoctorVerificationStatus,
  uploadDoctorCredential,
  deleteDoctorCredential,
  submitDoctorApplicationForReview
} from '../api/client';

export default function DoctorVerificationPage({ currentUser }) {
  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('MEDICAL_LICENSE');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchDoctorVerificationStatus();
      setAppData(res.application || {});
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch doctor verification status.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Selected file exceeds maximum 10MB limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a credential document file (PDF or Image).');
      return;
    }
    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await uploadDoctorCredential(selectedFile, documentType);
      setSuccessMsg(`Document '${selectedFile.name}' uploaded successfully.`);
      setSelectedFile(null);
      await loadStatus();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload credential document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete '${fileName}'?`)) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await deleteDoctorCredential(docId);
      setSuccessMsg(`Document '${fileName}' removed.`);
      await loadStatus();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete document.');
    }
  };

  const handleSubmitReview = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await submitDoctorApplicationForReview();
      setSuccessMsg('Application successfully submitted for Admin Review.');
      setAppData(res.application || {});
      window.dispatchEvent(new Event('telemed:user-updated'));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px' }}>
          <RefreshCw size={36} className="spin" style={{ color: 'var(--accent-cyan)', marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading credential verification status...</p>
        </div>
      </div>
    );
  }

  const status = appData?.verification_status || 'PENDING';
  const credentials = appData?.credentials || [];
  const auditHistory = appData?.audit_history || [];
  const credentialNotes = appData?.credential_notes || '';

  const canUpload = status === 'PENDING' || status === 'RESUBMISSION_REQUIRED';
  const canSubmit = canUpload && credentials.length > 0;

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-cyan">LEVEL 4 DOCTOR VERIFICATION</span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Doctor Credential Verification Workspace
              </h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Submit medical license, council registration, and professional qualification documents for administrator verification.
            </p>
          </div>

          <span className={`badge ${
            status === 'VERIFIED' ? 'badge-emerald' :
            status === 'UNDER_REVIEW' ? 'badge-cyan' :
            status === 'RESUBMISSION_REQUIRED' ? 'badge-amber' :
            status === 'REJECTED' || status === 'SUSPENDED' ? 'badge-rose' : 'badge-outline'
          }`} style={{ fontSize: '0.9rem', padding: '8px 16px', fontWeight: 700 }}>
            STATUS: {status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-rose)', padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={20} />
            <strong style={{ fontSize: '0.9rem' }}>{errorMsg}</strong>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-emerald)', padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-emerald)' }}>
            <CheckCircle2 size={20} />
            <strong style={{ fontSize: '0.9rem' }}>{successMsg}</strong>
          </div>
        </div>
      )}

      {/* Status Notice Card */}
      <div className="glass-card" style={{ marginBottom: '24px', background: 'var(--bg-primary)' }}>
        {status === 'VERIFIED' && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <ShieldCheck size={36} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
                Verified for TeleMed Portal Access
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                Your professional medical credentials have been verified by TeleMed administrators. You have access to the Doctor Portal Shell. Patient clinical data assignment will activate in Level 5.
              </p>
            </div>
          </div>
        )}

        {status === 'UNDER_REVIEW' && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <Clock size={36} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                Application Under Admin Review
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                Your credential documents have been submitted and are currently queued for administrator verification. Clinical patient data access remains restricted until verification is approved.
              </p>
            </div>
          </div>
        )}

        {status === 'RESUBMISSION_REQUIRED' && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <AlertTriangle size={36} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                Resubmission Requested by Administrator
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600, marginBottom: '6px' }}>
                Reason: "{credentialNotes || 'Uploaded documents were unclear or incomplete.'}"
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Please review the feedback above, upload updated credential documents, and click "Submit Application for Admin Review".
              </p>
            </div>
          </div>
        )}

        {status === 'REJECTED' && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <XCircle size={36} style={{ color: 'var(--accent-rose)', flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--accent-rose)', fontWeight: 700 }}>
                Application Verification Rejected
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600, margin: 0 }}>
                Reason: "{credentialNotes || 'Medical registration credentials could not be verified.'}"
              </p>
            </div>
          </div>
        )}

        {status === 'PENDING' && (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <Info size={36} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 700 }}>
                Verification Application Pending
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                To complete your portal verification, please upload your Medical License or Registration Certificate below and submit for review.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid Layout: Upload Form + Document List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Upload Form Card */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} style={{ color: 'var(--accent-cyan)' }} />
            Upload Verification Document
          </h3>

          {!canUpload ? (
            <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '8px', color: 'var(--text-muted)' }}>
              <Lock size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Document upload is currently disabled while application status is <strong>{status}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
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
                  <option value="MEDICAL_LICENSE">Medical License Certificate</option>
                  <option value="COUNCIL_REGISTRATION">Medical Council Registration</option>
                  <option value="ID_PROOF">Government Identity Proof</option>
                  <option value="DEGREE_CERTIFICATE">Medical Degree / Specialization Certificate</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Select File (PDF, JPG, PNG, WEBP, HEIC, TIFF — Max 10MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.tiff"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'var(--bg-primary)',
                    border: '1px dashed var(--accent-cyan)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-cyan"
                disabled={uploading || !selectedFile}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {uploading ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />} Upload Document
              </button>
            </form>
          )}
        </div>

        {/* Submitted Documents List */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--accent-cyan)' }} />
            Submitted Documents ({credentials.length})
          </h3>

          {credentials.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-primary)', borderRadius: '8px', color: 'var(--text-muted)' }}>
              <FileText size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>No verification documents uploaded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {credentials.map((cred) => (
                <div
                  key={cred.document_id}
                  style={{
                    padding: '12px 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-main)', display: 'block' }}>
                      {cred.original_filename}
                    </strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span className="badge badge-outline" style={{ fontSize: '0.68rem', marginRight: '6px' }}>
                        {cred.document_type}
                      </span>
                      {(cred.file_size_bytes / 1024).toFixed(1)} KB | {new Date(cred.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a
                      href={`/api/v1/doctor/credentials/${cred.document_id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      title="Preview Document"
                    >
                      <Eye size={14} />
                    </a>
                    {canUpload && (
                      <button
                        className="btn btn-outline"
                        onClick={() => handleDelete(cred.document_id, cred.original_filename)}
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-rose)' }}
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          {canUpload && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                className="btn btn-emerald"
                onClick={handleSubmitReview}
                disabled={!canSubmit || submitting}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {submitting ? <RefreshCw size={16} className="spin" /> : <ArrowRight size={16} />}
                Submit Application for Admin Verification
              </button>
              {!canSubmit && (
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-amber)', textAlign: 'center', marginTop: '6px' }}>
                  * Upload at least 1 document to enable submission.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Doctor Professional Metadata Card */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
          Registered Professional Profile Metadata
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Full Name:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{appData?.full_name || currentUser.full_name}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Email Address:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{appData?.email || currentUser.email}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Specialization:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{appData?.specialization || 'N/A'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Medical Registration #:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{appData?.registration_number || 'N/A'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Registration Council:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{appData?.registration_council || 'State Medical Council'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Experience Years:</span>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{appData?.experience_years || 0} years</div>
          </div>
        </div>
      </div>

      {/* Audit Trail Timeline */}
      {auditHistory.length > 0 && (
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '16px' }}>
            Application Audit History & Timeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {auditHistory.map((item) => (
              <div
                key={item.log_id}
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-primary)',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{item.action}</strong>
                  {item.old_status && item.new_status && (
                    <span style={{ marginLeft: '8px', color: 'var(--text-main)' }}>
                      ({item.old_status} → {item.new_status})
                    </span>
                  )}
                  {item.reason && <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>"{item.reason}"</div>}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {new Date(item.timestamp).toLocaleString()} ({item.actor_role})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
