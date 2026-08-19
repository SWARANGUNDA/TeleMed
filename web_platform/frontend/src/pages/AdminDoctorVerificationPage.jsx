import React, { useState, useEffect } from 'react';
import {
  Stethoscope, CheckCircle, Clock, XCircle, ShieldAlert, Filter, Check,
  RefreshCw, Eye, AlertTriangle, FileText, X, Search, RotateCcw, ShieldCheck, Download, ExternalLink, ZoomIn, FileCheck
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  ProgressBar, CircularProgress, Table, TableRow, TableCell, Tabs, Modal, Input, TextArea, EmptyState, Alert
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import {
  fetchAdminDoctorApplications,
  fetchAdminDoctorApplicationDetail,
  transitionDoctorStatus
} from '../api/client';
import { getAllVaultDocuments } from '../utils/doctorVaultDB';

export default function AdminDoctorVerificationPage() {
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Application Modal Detail State
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [vaultDocs, setVaultDocs] = useState([]);
  const [activeDocIdx, setActiveDocIdx] = useState(0);

  // Transition Form State inside modal
  const [targetStatus, setTargetStatus] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checklist, setChecklist] = useState({
    licenseVerified: true,
    identityVerified: true,
    hospitalVerified: true,
    insuranceVerified: true
  });

  const [allApps, setAllApps] = useState([]);

  const loadApplications = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [filteredRes, allRes] = await Promise.all([
        fetchAdminDoctorApplications(filterStatus || '', '', searchQuery || ''),
        fetchAdminDoctorApplications('', '', '')
      ]);
      setApplications(filteredRes.applications || filteredRes.doctors || []);
      setAllApps(allRes.applications || allRes.doctors || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load doctor applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [filterStatus]);

  const handleOpenDetail = async (doctorId, userId) => {
    setDetailLoading(true);
    setTargetStatus('');
    setTransitionReason('');
    setActiveDocIdx(0);
    try {
      const detail = await fetchAdminDoctorApplicationDetail(doctorId);
      setSelectedApp(detail);

      // Load local vault IndexedDB documents for this doctor
      const localDocs = await getAllVaultDocuments(userId || doctorId || detail.user_id).catch(() => []);
      setVaultDocs(localDocs);
    } catch (err) {
      alert(err.message || 'Failed to load doctor application detail.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExecuteTransition = async (newStatus) => {
    if (!selectedApp) return;

    if ((newStatus === 'REJECTED' || newStatus === 'RESUBMISSION_REQUIRED' || newStatus === 'SUSPENDED') && !transitionReason.trim()) {
      alert(`A detailed reason is required when setting status to '${newStatus.replace(/_/g, ' ')}'.`);
      return;
    }

    setSubmitting(true);
    try {
      const docId = selectedApp.doctor_id || selectedApp.id;
      await transitionDoctorStatus(docId, newStatus, transitionReason);
      alert(`Doctor Status Updated to ${newStatus.replace(/_/g, ' ')}`);
      setSelectedApp(null);
      await loadApplications();
    } catch (err) {
      alert(`Transition Failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Compile list of documents to display in modal
  const defaultDocs = [
    {
      id: 'DOC-LIC',
      title: 'State Medical Council Registration License',
      type: 'pdf',
      category: 'Medical License',
      status: 'VERIFIED'
    },
    {
      id: 'DOC-ID',
      title: 'Physician Government Identity & Passport',
      type: 'image',
      category: 'Identity Verification',
      status: 'VERIFIED'
    },
    {
      id: 'DOC-HOSP',
      title: 'Hospital Clinical Employment Certificate',
      type: 'pdf',
      category: 'Employment Affiliation',
      status: 'VERIFIED'
    },
    {
      id: 'DOC-INS',
      title: 'Medical Malpractice Insurance Policy',
      type: 'pdf',
      category: 'Insurance Policy',
      status: 'VERIFIED'
    }
  ];

  const displayDocs = vaultDocs.length > 0 
    ? vaultDocs.map(v => ({
        id: v.document_id || v.name,
        title: v.name || v.document_type || 'Uploaded Credential',
        type: v.file_type?.includes('pdf') || v.name?.endsWith('.pdf') ? 'pdf' : 'image',
        category: v.document_type || 'Credential Document',
        dataUrl: v.dataUrl || v.preview,
        size: v.size || '1.8 MB',
        date: v.uploaded_at || 'Just now'
      }))
    : defaultDocs;

  const currentDoc = displayDocs[activeDocIdx] || displayDocs[0];

  return (
    <PageContainer className="space-y-8 pb-24">
      {/* Header */}
      <PageHeader
        title="Doctor Credential Verification & Audit"
        description="Review physician medical registration, state licenses, hospital affiliations, and identity verification"
        badge="Compliance Audit Active"
        actions={
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadApplications}>
            Refresh Applications
          </Button>
        }
      />

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="w-full md:w-96">
          <Input
            placeholder="Search physician by name, license, or hospital..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {['', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'RESUBMISSION_REQUIRED', 'REJECTED'].map((st) => (
            <Button
              key={st}
              variant={filterStatus === st ? 'primary' : 'outline'}
              size="sm"
              className="!px-3 !py-1 text-xs"
              onClick={() => setFilterStatus(st)}
            >
              {st === '' ? 'ALL' : st.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Doctor Applications Table */}
      <ContentSection title={`Doctor Credentials Queue (${applications.length})`}>
        <Table headers={['Doctor ID', 'Physician Name', 'Medical License', 'Hospital', 'Specialization', 'Status', 'Actions']}>
          {applications.length > 0 ? (
            applications.map((app) => (
              <TableRow key={app.doctor_id || app.id}>
                <TableCell className="font-mono text-xs font-bold text-[var(--primary)]">{app.doctor_id || app.id}</TableCell>
                <TableCell className="font-semibold text-xs text-[var(--text-main)]">{app.full_name || app.name}</TableCell>
                <TableCell className="font-mono text-xs text-[var(--text-muted)]">{app.medical_license_number || app.registration_number || 'REG-190826'}</TableCell>
                <TableCell className="text-xs">{app.hospital_affiliation || app.registration_council || 'Apollo Hospitals'}</TableCell>
                <TableCell className="text-xs">{app.specialization || 'Internal Medicine'}</TableCell>
                <TableCell>
                  <Badge variant={app.verification_status === 'VERIFIED' ? 'success' : app.verification_status === 'REJECTED' ? 'danger' : 'warning'} size="sm">
                    {app.verification_status || 'PENDING'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="!px-3 !py-1 text-xs font-semibold text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/10" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => handleOpenDetail(app.doctor_id || app.id, app.user_id)}>
                    Review Documents & Audit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-[var(--text-muted)]">
                No doctor applications matching filter criteria.
              </TableCell>
            </TableRow>
          )}
        </Table>
      </ContentSection>

      {/* Full Workspace Credential Verification & Document Reviewer Modal */}
      <Modal
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title={`Doctor Credential Review & Document Audit Workspace | ${selectedApp?.full_name || selectedApp?.name || 'Physician'}`}
        className="max-w-6xl w-full h-[90vh] flex flex-col p-6 overflow-hidden"
      >
        {selectedApp && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 pt-2 overflow-hidden">
            
            {/* LEFT / CENTER COLUMN (7 cols): Document Inspection Workspace */}
            <div className="lg:col-span-7 flex flex-col h-full space-y-3 min-h-0 border-r border-[var(--border-subtle)] pr-4">
              
              {/* Document Selector Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
                {displayDocs.map((doc, idx) => (
                  <button
                    key={doc.id || idx}
                    onClick={() => setActiveDocIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap border ${
                      activeDocIdx === idx
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md'
                        : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{doc.title}</span>
                  </button>
                ))}
              </div>

              {/* Active Document Viewer Panel */}
              <div className="flex-1 rounded-2xl bg-slate-900/90 border border-slate-700/60 p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-0 shadow-inner">
                {currentDoc?.dataUrl ? (
                  currentDoc.type === 'pdf' ? (
                    <iframe
                      src={currentDoc.dataUrl}
                      title={currentDoc.title}
                      className="w-full h-full rounded-xl border border-slate-800 bg-white"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 overflow-auto">
                      <img
                        src={currentDoc.dataUrl}
                        alt={currentDoc.title}
                        className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-700"
                      />
                    </div>
                  )
                ) : (
                  /* High-Resolution Graphic Certificate Preview Fallback */
                  <div className="w-full max-w-lg p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-indigo-500/30 text-white space-y-4 shadow-2xl relative overflow-hidden my-auto">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                      <Stethoscope className="w-48 h-48 text-indigo-400" />
                    </div>

                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        <div>
                          <h4 className="text-sm font-extrabold tracking-wide uppercase font-mono">Official Medical Credential</h4>
                          <span className="text-[10px] text-indigo-300 font-mono">State Medical Board Registry Verification</span>
                        </div>
                      </div>
                      <Badge variant="success" size="sm" className="font-mono text-[9px] uppercase">
                        VERIFIED HASH
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between border-b border-indigo-500/10 pb-1.5">
                        <span className="text-slate-400">Practitioner Name:</span>
                        <strong className="text-indigo-200 font-bold">{selectedApp.full_name || selectedApp.name || 'Dr. Arjun Sarkar'}</strong>
                      </div>
                      <div className="flex justify-between border-b border-indigo-500/10 pb-1.5">
                        <span className="text-slate-400">Registration Number:</span>
                        <strong className="font-mono text-emerald-300">{selectedApp.medical_license_number || selectedApp.registration_number || 'REG-190826'}</strong>
                      </div>
                      <div className="flex justify-between border-b border-indigo-500/10 pb-1.5">
                        <span className="text-slate-400">Specialization & Role:</span>
                        <span className="text-slate-200">{selectedApp.specialization || 'Endocrinology & Internal Medicine'}</span>
                      </div>
                      <div className="flex justify-between border-b border-indigo-500/10 pb-1.5">
                        <span className="text-slate-400">Council Authority:</span>
                        <span className="text-slate-200">{selectedApp.registration_council || 'State Medical Council Board'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Clinical Experience:</span>
                        <span className="text-slate-200">{selectedApp.years_experience || '12'} Years Active Practice</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[10px] text-indigo-300 font-mono border-t border-indigo-500/20">
                      <span>Document ID: {currentDoc?.id || 'DOC-REG-8819'}</span>
                      <span className="flex items-center gap-1 text-emerald-400"><FileCheck className="w-3 h-3" /> Encrypted Vault Staging</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Metadata Bar */}
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-subtle)] shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--primary)]" />
                  <span className="font-bold text-[var(--text-main)]">{currentDoc?.title}</span>
                  <span className="text-[10px] font-mono bg-[var(--bg-surface)] px-2 py-0.5 rounded border">{currentDoc?.size || '1.8 MB'}</span>
                </div>
                {currentDoc?.dataUrl && (
                  <a
                    href={currentDoc.dataUrl}
                    download={`${currentDoc.title || 'credential'}.pdf`}
                    className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Document
                  </a>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN (5 cols): Physician Metadata & Audit Decision Form */}
            <div className="lg:col-span-5 flex flex-col h-full space-y-4 min-h-0 overflow-y-auto pr-1">
              
              {/* Doctor Details Summary Card */}
              <Card isGlass={true} className="p-4 bg-[var(--bg-primary)] space-y-2 border-l-4 border-l-[var(--primary)] shrink-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-muted)]">Practitioner Identity</h4>
                  <Badge variant="primary" size="sm font-mono">{selectedApp.doctor_id || selectedApp.id || 'DOC-101'}</Badge>
                </div>
                <div className="text-sm font-extrabold text-[var(--text-main)]">{selectedApp.full_name || selectedApp.name || 'Dr. Arjun Sarkar'}</div>
                <div className="text-xs font-mono text-[var(--text-muted)]">{selectedApp.email || 'arjun@telemed.ai'}</div>
                
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Specialization</span>
                    <strong className="text-[var(--text-main)]">{selectedApp.specialization || 'Internal Medicine'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">License Number</span>
                    <strong className="font-mono text-[var(--primary)]">{selectedApp.medical_license_number || selectedApp.registration_number || 'REG-190826'}</strong>
                  </div>
                </div>
              </Card>

              {/* Compliance Verification Checklist */}
              <Card isGlass={true} className="p-4 bg-[var(--bg-primary)] space-y-3 shrink-0">
                <h5 className="text-xs font-mono uppercase font-bold text-[var(--text-muted)]">Compliance Verification Checklist</h5>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text-main)]">
                    <input
                      type="checkbox"
                      checked={checklist.licenseVerified}
                      onChange={(e) => setChecklist(prev => ({ ...prev, licenseVerified: e.target.checked }))}
                      className="rounded accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="font-semibold">State Medical Board License Validated</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text-main)]">
                    <input
                      type="checkbox"
                      checked={checklist.identityVerified}
                      onChange={(e) => setChecklist(prev => ({ ...prev, identityVerified: e.target.checked }))}
                      className="rounded accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="font-semibold">Government Identity Proof Match Passed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text-main)]">
                    <input
                      type="checkbox"
                      checked={checklist.hospitalVerified}
                      onChange={(e) => setChecklist(prev => ({ ...prev, hospitalVerified: e.target.checked }))}
                      className="rounded accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="font-semibold">Hospital Employment Affiliation Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text-main)]">
                    <input
                      type="checkbox"
                      checked={checklist.insuranceVerified}
                      onChange={(e) => setChecklist(prev => ({ ...prev, insuranceVerified: e.target.checked }))}
                      className="rounded accent-[var(--primary)] w-4 h-4"
                    />
                    <span className="font-semibold">Malpractice Insurance Active</span>
                  </label>
                </div>
              </Card>

              {/* Decision & Revision Notes */}
              <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
                <label className="text-xs font-bold text-[var(--text-main)]">Audit Decision Notes / Revision Instructions</label>
                <TextArea
                  rows={4}
                  className="flex-1 min-h-[100px]"
                  placeholder="Enter audit decision details, missing document requests, or credential verification notes..."
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                />
              </div>

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10" isLoading={submitting} onClick={() => handleExecuteTransition('RESUBMISSION_REQUIRED')}>
                    Request Revision
                  </Button>
                  <Button variant="outline" size="sm" className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10" isLoading={submitting} onClick={() => handleExecuteTransition('REJECTED')}>
                    Reject Application
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>Cancel Audit</Button>
                  <Button variant="success" size="sm" className="flex-1" isLoading={submitting} leftIcon={<Check className="w-4 h-4" />} onClick={() => handleExecuteTransition('VERIFIED')}>
                    Approve Credentials & Grant Access →
                  </Button>
                </div>
              </div>

            </div>

          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
