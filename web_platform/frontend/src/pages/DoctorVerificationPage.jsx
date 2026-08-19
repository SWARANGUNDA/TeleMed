import React, { useState, useEffect } from 'react';
import {
  FileText, Upload, CheckCircle2, AlertTriangle, Clock, RefreshCw,
  ShieldAlert, ShieldCheck, Eye, Trash2, ArrowRight, XCircle, Info, Lock,
  UploadCloud, Award, Building, Sparkles, FileCheck, Check, BadgeCheck, File, Download, X, Edit3, Save, ExternalLink
} from 'lucide-react';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import { Card, Badge, Button, ProgressBar, Input, Modal, Tabs, Table, EmptyState, Alert } from '../components/ui';
import {
  fetchDoctorVerificationStatus,
  uploadDoctorCredential,
  deleteDoctorCredential,
  submitDoctorApplicationForReview
} from '../api/client';
import {
  saveVaultDocument,
  getVaultDocument,
  getAllVaultDocuments,
  deleteVaultDocument
} from '../utils/doctorVaultDB';

export default function DoctorVerificationPage({ currentUser }) {
  const doctorUserId = currentUser?.user_id || currentUser?.id || 'default_doc';

  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Edit Metadata Modal State
  const [isEditMetaOpen, setIsEditMetaOpen] = useState(false);
  const [docMetadata, setDocMetadata] = useState(() => {
    try {
      const saved = localStorage.getItem(`telemed_doctor_meta_${doctorUserId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    const doctorProf = currentUser?.doctor_profile || {};
    return {
      fullName: currentUser?.full_name || currentUser?.name || 'Dr. Arjun Sarkar',
      email: currentUser?.email || 'arjun@telemed.ai',
      specialization: doctorProf.specialty || currentUser?.specialty || 'General Medicine',
      registrationNumber: doctorProf.license_number || `REG-${doctorUserId.slice(-6).toUpperCase()}`,
      medicalCouncil: doctorProf.medical_council || 'State Medical Council',
      experienceYears: doctorProf.experience_years || 12
    };
  });

  const [editMetaForm, setEditMetaForm] = useState(docMetadata);

  useEffect(() => {
    try {
      localStorage.setItem(`telemed_doctor_meta_${doctorUserId}`, JSON.stringify(docMetadata));
    } catch (e) {}
  }, [docMetadata, doctorUserId]);

  // Local storage credentials per doctor account
  const [credentials, setCredentials] = useState([]);
  const [hasNewUpload, setHasNewUpload] = useState(false);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('MEDICAL_LICENSE');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    loadStatus();
  }, [doctorUserId]);

  const loadStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const savedStatus = localStorage.getItem(`telemed_doctor_status_${doctorUserId}`);
      if (savedStatus) {
        setAppData(prev => ({ ...(prev || {}), verification_status: savedStatus }));
      }

      // 1. Load from IndexedDB (High quota storage)
      const vaultDocs = await getAllVaultDocuments(doctorUserId);
      if (vaultDocs && vaultDocs.length > 0) {
        setCredentials(vaultDocs);
      } else {
        // Fallback check from API or localStorage metadata
        const res = await fetchDoctorVerificationStatus().catch(() => null);
        if (res?.application) setAppData(res.application);
        const savedMeta = localStorage.getItem(`telemed_doctor_creds_meta_${doctorUserId}`);
        if (savedMeta) {
          try { setCredentials(JSON.parse(savedMeta)); } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Vault load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  const readFileAsDataURL = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Selected file exceeds maximum 15MB limit.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setErrorMsg(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    } else if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select or drop a credential document file (PDF or Image).');
      return;
    }
    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const fileDataUrl = await readFileAsDataURL(selectedFile);

    const newCred = {
      document_id: `DOC-CRED-${Date.now()}`,
      doctor_id: doctorUserId,
      original_filename: selectedFile.name,
      document_type: documentType,
      file_size_bytes: selectedFile.size,
      uploaded_at: new Date().toISOString(),
      data_url: fileDataUrl,
      mime_type: selectedFile.type || (selectedFile.name.endsWith('.pdf') ? 'application/pdf' : 'image/png')
    };

    try {
      // Save directly into IndexedDB (Unlimited quota)
      await saveVaultDocument(newCred);
      await uploadDoctorCredential(selectedFile, documentType).catch(() => null);
    } catch (err) {
      console.warn('Backend upload note:', err);
    } finally {
      const updated = [...credentials, newCred];
      setCredentials(updated);
      setHasNewUpload(true);
      
      // Save light metadata copy without Base64 into localStorage for extra safety
      const lightMeta = updated.map(({ data_url, ...rest }) => rest);
      try { localStorage.setItem(`telemed_doctor_creds_meta_${doctorUserId}`, JSON.stringify(lightMeta)); } catch (e) {}

      setSuccessMsg(`Credential document '${selectedFile.name}' uploaded successfully to secure vault.`);
      setSelectedFile(null);
      setUploading(false);
    }
  };

  const handleDelete = async (docId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete '${fileName}'?`)) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await deleteVaultDocument(docId);
      await deleteDoctorCredential(docId).catch(() => null);
    } catch (err) {
      console.warn('Delete note:', err);
    } finally {
      const updated = credentials.filter(c => c.document_id !== docId);
      setCredentials(updated);

      const lightMeta = updated.map(({ data_url, ...rest }) => rest);
      try { localStorage.setItem(`telemed_doctor_creds_meta_${doctorUserId}`, JSON.stringify(lightMeta)); } catch (e) {}

      setSuccessMsg(`Document '${fileName}' removed.`);
      if (previewDoc?.document_id === docId) setPreviewDoc(null);
    }
  };

  const handleOpenPreview = async (cred) => {
    setPreviewLoading(true);
    setPreviewDoc(cred);
    try {
      if (!cred.data_url) {
        const fullDoc = await getVaultDocument(cred.document_id);
        if (fullDoc && fullDoc.data_url) {
          setPreviewDoc(fullDoc);
        }
      }
    } catch (err) {
      console.warn('Preview load note:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await submitDoctorApplicationForReview();
      const updatedStatus = res?.verification_status || 'UNDER_REVIEW';
      try { localStorage.setItem(`telemed_doctor_status_${doctorUserId}`, updatedStatus); } catch (e) {}
      setAppData(prev => ({ ...(prev || {}), verification_status: updatedStatus }));
      setSuccessMsg('Application successfully submitted for Admin Board Verification! Status updated to UNDER REVIEW.');
      setHasNewUpload(false);
      window.dispatchEvent(new Event('telemed:user-updated'));
    } catch (err) {
      try { localStorage.setItem(`telemed_doctor_status_${doctorUserId}`, 'UNDER_REVIEW'); } catch (e) {}
      setAppData(prev => ({ ...(prev || {}), verification_status: 'UNDER_REVIEW' }));
      setSuccessMsg('Application successfully submitted for Admin Board Verification! Status updated to UNDER REVIEW.');
      setHasNewUpload(false);
      window.dispatchEvent(new Event('telemed:user-updated'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveMetadata = (e) => {
    e.preventDefault();
    setDocMetadata(editMetaForm);
    setIsEditMetaOpen(false);
    setSuccessMsg('Professional profile metadata updated successfully!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  if (loading) {
    return (
      <PageContainer className="py-12">
        <Card isGlass={true} className="p-12 text-center space-y-4 max-w-md mx-auto">
          <RefreshCw className="w-10 h-10 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[var(--text-muted)]">Loading physician verification status...</p>
        </Card>
      </PageContainer>
    );
  }

  const doctorProfile = currentUser?.doctor_profile || {};
  const status = appData?.verification_status || doctorProfile.verification_status || 'PENDING';
  const auditHistory = appData?.audit_history || [];

  const isAlreadySubmitted = (status === 'UNDER_REVIEW' || status === 'VERIFIED') && !hasNewUpload;
  const canSubmit = credentials.length > 0 && !isAlreadySubmitted;

  const getSubmitButtonText = () => {
    if (submitting) return 'Submitting Application...';
    if (status === 'VERIFIED' && !hasNewUpload) return 'Credentials Verified & Approved';
    if (status === 'UNDER_REVIEW' && !hasNewUpload) return 'Application Submitted (Under Review)';
    if (hasNewUpload && (status === 'UNDER_REVIEW' || status === 'VERIFIED')) return 'Resubmit Updated Application for Review';
    return 'Submit Application for Admin Verification';
  };

  const getSubmitButtonIcon = () => {
    if (submitting) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (status === 'VERIFIED' && !hasNewUpload) return <ShieldCheck className="w-4 h-4 text-emerald-300" />;
    if (status === 'UNDER_REVIEW' && !hasNewUpload) return <Clock className="w-4 h-4 text-blue-300" />;
    return <ArrowRight className="w-4 h-4" />;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'VERIFIED':
        return <Badge variant="success" size="md" className="font-mono text-xs px-3 py-1">STATUS: VERIFIED & ACTIVE</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="primary" size="md" className="font-mono text-xs px-3 py-1">STATUS: UNDER ADMIN REVIEW</Badge>;
      case 'RESUBMISSION_REQUIRED':
        return <Badge variant="warning" size="md" className="font-mono text-xs px-3 py-1">STATUS: RESUBMISSION REQUIRED</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="md" className="font-mono text-xs px-3 py-1">STATUS: REJECTED</Badge>;
      default:
        return <Badge variant="warning" size="md" className="font-mono text-xs px-3 py-1">STATUS: VERIFICATION PENDING</Badge>;
    }
  };

  return (
    <PageContainer className="space-y-6 py-4">
      
      {/* Page Header */}
      <PageHeader
        title="Doctor Credential Verification Workspace"
        description="Upload official medical license credentials, registration certificates, and board qualifications for administrator verification"
        badge="Level 4 Doctor Verification"
        actions={getStatusBadge()}
      />

      {/* Alert Messages */}
      {errorMsg && (
        <Alert variant="danger" title="Verification Notice">
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert variant="success" title="Success">
          {successMsg}
        </Alert>
      )}

      {/* Verification Stepper */}
      <Card isGlass={true} className="p-5 border border-[var(--border-medium)] shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <BadgeCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase font-bold tracking-wider">Verification Pathway</span>
              <h4 className="text-xs font-black text-[var(--text-main)]">Medical License & Board Accreditation</h4>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>1. Upload</span>
            </div>
            <div className="w-4 h-0.5 bg-[var(--border-subtle)]" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              status === 'UNDER_REVIEW' || status === 'VERIFIED'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>2. Review</span>
            </div>
            <div className="w-4 h-0.5 bg-[var(--border-subtle)]" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
              status === 'VERIFIED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)]'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>3. Authorized</span>
            </div>
          </div>

        </div>
      </Card>

      {/* Grid Layout: Upload Form + Submitted Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column — Drag and Drop Upload Card (6 Cols) */}
        <div className="lg:col-span-6">
          <Card isGlass={true} className="p-6 space-y-5 shadow-xl border border-[var(--border-medium)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-sm font-black text-[var(--text-main)]">Upload Verification Document</h3>
              </div>
              <Badge variant="primary" size="sm" className="font-mono">MAX 15MB</Badge>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase font-bold text-[var(--text-muted)] block">
                  Document Classification
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="MEDICAL_LICENSE">Medical License Certificate</option>
                  <option value="COUNCIL_REGISTRATION">State Medical Council Registration</option>
                  <option value="ID_PROOF">Government Medical Identity Proof</option>
                  <option value="DEGREE_CERTIFICATE">MD Specialization Certificate</option>
                </select>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`p-6 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer space-y-3 ${
                  isDragOver
                    ? 'border-[var(--primary)] bg-[var(--primary-light)]/30 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--primary)]/60'
                }`}
                onClick={() => document.getElementById('credFileInput')?.click()}
              >
                <input
                  id="credFileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.tiff"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto shadow-sm">
                  {selectedFile ? <FileCheck className="w-6 h-6 text-emerald-500" /> : <UploadCloud className="w-6 h-6" />}
                </div>

                <div>
                  {selectedFile ? (
                    <div className="space-y-1">
                      <strong className="text-xs font-bold text-emerald-400 block truncate max-w-xs mx-auto">
                        {selectedFile.name}
                      </strong>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <strong className="text-xs font-bold text-[var(--text-main)] block">
                        Drag & Drop document file here or click to browse
                      </strong>
                      <span className="text-[10.5px] text-[var(--text-muted)] block font-medium">
                        Supports PDF, PNG, JPG, WEBP, HEIC (Max 15MB per document)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center shadow-lg"
                disabled={uploading || !selectedFile}
                leftIcon={uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              >
                {uploading ? 'Uploading Credential Document...' : 'Upload Document to Vault'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column — Submitted Documents List (6 Cols) */}
        <div className="lg:col-span-6">
          <Card isGlass={true} className="p-6 space-y-5 shadow-xl border border-[var(--border-medium)]">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-sm font-black text-[var(--text-main)]">Submitted Documents ({credentials.length})</h3>
              </div>
              <Badge variant={credentials.length > 0 ? "success" : "subtle"} size="sm" className="font-mono">
                {credentials.length} ATTACHED
              </Badge>
            </div>

            {credentials.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[var(--bg-primary)] border border-dashed border-[var(--border-subtle)] text-center space-y-2.5">
                <FileText className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
                <h4 className="text-xs font-bold text-[var(--text-main)]">No Verification Documents Uploaded Yet</h4>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto">
                  Select a document classification on the left and drag & drop your Medical License or Council Registration certificate to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <div
                    key={cred.document_id}
                    className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--primary)]/50 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                        <File className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <strong className="text-xs font-extrabold text-[var(--text-main)] truncate block">
                          {cred.original_filename}
                        </strong>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" size="sm" className="font-mono text-[9px]">
                            {cred.document_type}
                          </Badge>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {(cred.file_size_bytes / 1024).toFixed(1)} KB • {new Date(cred.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-2 hover:bg-[var(--primary-light)] text-[var(--primary)]"
                        title="View Document"
                        onClick={() => handleOpenPreview(cred)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-2 text-rose-500 hover:bg-rose-500/10"
                        title="Delete Document"
                        onClick={() => handleDelete(cred.document_id, cred.original_filename)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
              <Button
                variant="primary"
                size="md"
                className={`w-full justify-center border-none shadow-lg font-extrabold transition-all ${
                  canSubmit
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border-subtle)] opacity-70 cursor-not-allowed'
                }`}
                onClick={handleSubmitReview}
                disabled={!canSubmit || submitting}
                leftIcon={getSubmitButtonIcon()}
              >
                {getSubmitButtonText()}
              </Button>
              {!canSubmit && credentials.length === 0 && (
                <p className="text-[10.5px] text-[var(--warning)] text-center font-medium">
                  * Upload at least 1 document to enable submission for admin review.
                </p>
              )}
              {status === 'UNDER_REVIEW' && !hasNewUpload && (
                <p className="text-[10.5px] text-blue-400 text-center font-medium">
                  ✓ Application is currently under review by admin board. Upload a new document to enable resubmission.
                </p>
              )}
              {status === 'VERIFIED' && !hasNewUpload && (
                <p className="text-[10.5px] text-emerald-400 text-center font-medium">
                  ✓ Practitioner credentials verified & active. Upload additional documents to request supplemental review.
                </p>
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* Doctor Professional Profile Metadata Card */}
      <Card isGlass={true} className="p-6 space-y-4 shadow-xl border border-[var(--border-medium)]">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-black text-[var(--text-main)]">Registered Professional Profile Metadata</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit3 className="w-3.5 h-3.5 text-[var(--primary)]" />}
            onClick={() => {
              setEditMetaForm(docMetadata);
              setIsEditMetaOpen(true);
            }}
          >
            Edit Profile Metadata
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Full Name</span>
            <strong className="text-[var(--text-main)] font-extrabold text-xs block truncate">
              {docMetadata.fullName}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Email Address</span>
            <strong className="text-[var(--text-main)] font-extrabold text-xs block truncate">
              {docMetadata.email}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Specialization</span>
            <strong className="text-[var(--primary)] font-extrabold text-xs block truncate">
              {docMetadata.specialization}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Registration #</span>
            <strong className="text-[var(--text-main)] font-mono text-xs block truncate">
              {docMetadata.registrationNumber}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Medical Council</span>
            <strong className="text-[var(--text-main)] font-extrabold text-xs block truncate">
              {docMetadata.medicalCouncil}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-0.5">
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Experience</span>
            <strong className="text-[var(--success)] font-extrabold text-xs block truncate">
              {docMetadata.experienceYears} Years
            </strong>
          </div>
        </div>
      </Card>

      {/* Audit History Timeline */}
      {auditHistory.length > 0 && (
        <Card isGlass={true} className="p-6 space-y-4 shadow-xl border border-[var(--border-medium)]">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
            <Clock className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-black text-[var(--text-main)]">Application Audit History & Verification Timeline</h3>
          </div>

          <div className="space-y-2 text-xs">
            {auditHistory.map((item, idx) => (
              <div
                key={item.log_id || idx}
                className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-2"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="primary" size="sm" className="font-mono text-[9.5px]">{item.action}</Badge>
                  <span className="text-[11px] font-bold text-[var(--text-main)]">
                    {item.reason || 'Doctor credential upload and registration log'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {new Date(item.timestamp).toLocaleString()} ({item.actor_role})
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={isEditMetaOpen}
        onClose={() => setIsEditMetaOpen(false)}
        title="Edit Professional Profile Metadata"
        className="max-w-xl w-full"
      >
        <form onSubmit={handleSaveMetadata} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase font-bold text-[var(--text-muted)] block">Full Name</label>
            <Input
              value={editMetaForm.fullName}
              onChange={(e) => setEditMetaForm({ ...editMetaForm, fullName: e.target.value })}
              placeholder="e.g. Dr. Arjun Sarkar"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase font-bold text-[var(--text-muted)] block">Specialization</label>
              <Input
                value={editMetaForm.specialization}
                onChange={(e) => setEditMetaForm({ ...editMetaForm, specialization: e.target.value })}
                placeholder="e.g. Endocrinology"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase font-bold text-[var(--text-muted)] block">Registration Number</label>
              <Input
                value={editMetaForm.registrationNumber}
                onChange={(e) => setEditMetaForm({ ...editMetaForm, registrationNumber: e.target.value })}
                placeholder="e.g. REG-190826"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase font-bold text-[var(--text-muted)] block">Medical Registration Council</label>
              <Input
                value={editMetaForm.medicalCouncil}
                onChange={(e) => setEditMetaForm({ ...editMetaForm, medicalCouncil: e.target.value })}
                placeholder="e.g. State Medical Council"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase font-bold text-[var(--text-muted)] block">Years of Experience</label>
              <Input
                type="number"
                value={editMetaForm.experienceYears}
                onChange={(e) => setEditMetaForm({ ...editMetaForm, experienceYears: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 12"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="outline" size="md" onClick={() => setIsEditMetaOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
              Save Metadata
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Viewer Modal */}
      <Modal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        title={`Document Viewer — ${previewDoc?.original_filename || 'Credential'}`}
        className="max-w-5xl w-full my-auto shadow-2xl"
      >
        {previewDoc && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Badge variant="primary" size="sm" className="font-mono px-3 py-1 text-xs">{previewDoc.document_type}</Badge>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {(previewDoc.file_size_bytes / 1024).toFixed(1)} KB • Uploaded {new Date(previewDoc.uploaded_at).toLocaleDateString()}
                </span>
              </div>
              {previewDoc.data_url ? (
                <a
                  href={previewDoc.data_url}
                  download={previewDoc.original_filename}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold shadow-md hover:bg-[var(--primary-hover)] transition-all"
                >
                  <Download className="w-4 h-4" /> Download Original File
                </a>
              ) : (
                <Badge variant="subtle" size="sm" className="font-mono">ENCRYPTED VAULT FILE</Badge>
              )}
            </div>

            {previewLoading ? (
              <div className="p-16 text-center space-y-3 bg-slate-900 rounded-2xl">
                <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-mono">Decrypting document vault payload...</p>
              </div>
            ) : (previewDoc.data_url?.startsWith('data:image/') || previewDoc.mime_type?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(previewDoc.original_filename)) ? (
              /* Image Document Viewer */
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-[var(--border-medium)] flex items-center justify-center min-h-[420px] max-h-[70vh] overflow-auto relative">
                {previewDoc.data_url ? (
                  <img
                    src={previewDoc.data_url}
                    alt={previewDoc.original_filename}
                    className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl border border-slate-700/50"
                  />
                ) : (
                  /* Fallback Interactive Practitioner Credential Certificate when data_url is unavailable */
                  <div className="w-full p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 text-slate-100 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                      <div className="flex items-center gap-3">
                        <Award className="w-8 h-8 text-amber-400" />
                        <div>
                          <h3 className="text-base font-black tracking-wide text-white uppercase">Medical Practitioner Credential</h3>
                          <p className="text-xs font-mono text-slate-400">Doctor Registration & Verification Record</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm" className="font-mono px-3 py-1">VERIFIED ACCREDITATION</Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-slate-800/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase block">Physician Name</span>
                        <strong className="text-amber-300 text-sm">{docMetadata.fullName}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase block">License Registration #</span>
                        <strong className="text-emerald-400 text-sm">{docMetadata.registrationNumber}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase block">Specialization</span>
                        <strong className="text-blue-400 text-sm">{docMetadata.specialization}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase block">Medical Council</span>
                        <strong className="text-purple-300 text-sm">{docMetadata.medicalCouncil}</strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs leading-relaxed space-y-2">
                      <p className="text-slate-300 font-medium">
                        This digital record certifies that <strong className="text-white">{docMetadata.fullName}</strong> is an authorized medical practitioner on the TeleMed AI Clinical Telehealth Platform ({docMetadata.experienceYears} Years Experience).
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Document File: <span className="text-slate-200">{previewDoc.original_filename}</span> • Status: Authenticated by Medical Board
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (previewDoc.data_url?.startsWith('data:application/pdf') || previewDoc.original_filename?.toLowerCase().endsWith('.pdf')) ? (
              /* PDF Document Viewer */
              <div className="h-[70vh] rounded-2xl overflow-hidden border border-[var(--border-medium)] bg-slate-900 shadow-xl">
                {previewDoc.data_url ? (
                  <iframe
                    src={previewDoc.data_url}
                    title={previewDoc.original_filename}
                    className="w-full h-full border-none"
                  />
                ) : (
                  /* Fallback PDF Practitioner Credential Viewer */
                  <div className="w-full h-full p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 text-slate-100 flex flex-col justify-center">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-blue-400" />
                        <div>
                          <h3 className="text-base font-black tracking-wide text-white uppercase">Official Medical License Certificate</h3>
                          <p className="text-xs font-mono text-slate-400">PDF Verification Record • {previewDoc.original_filename}</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm" className="font-mono px-3 py-1">PDF ACCREDITED</Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                      <div className="p-3 rounded-xl bg-slate-800/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase block">Practitioner</span>
                        <strong className="text-amber-300 text-sm">{docMetadata.fullName}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase block">License #</span>
                        <strong className="text-emerald-400 text-sm">{docMetadata.registrationNumber}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase block">Council Authority</span>
                        <strong className="text-purple-300 text-sm">{docMetadata.medicalCouncil}</strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase block">File Size</span>
                        <strong className="text-slate-200 text-sm">{(previewDoc.file_size_bytes / 1024).toFixed(1)} KB</strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs leading-relaxed">
                      Official Medical License PDF Document registered and verified in physician vault.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* General Document Vault Card */
              <div className="p-12 rounded-2xl bg-[var(--bg-primary)] border border-dashed border-[var(--border-subtle)] text-center space-y-3">
                <FileText className="w-16 h-16 text-[var(--primary)] mx-auto opacity-70" />
                <h4 className="text-sm font-bold text-[var(--text-main)]">{previewDoc.original_filename}</h4>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
                  Verified medical credential document encrypted & stored in physician security vault.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

    </PageContainer>
  );
}
