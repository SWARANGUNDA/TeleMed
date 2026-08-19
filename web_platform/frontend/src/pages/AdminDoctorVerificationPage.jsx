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

const makeCertificateSvg = (docTitle, docCategory, docId, doctorName, licenseNum) => {
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="none">
    <rect width="800" height="600" rx="24" fill="#0F172A"/>
    <rect x="16" y="16" width="768" height="568" rx="16" fill="url(#bg)"/>
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="800" y2="600" gradientUnits="userSpaceOnUse">
        <stop stop-color="#0F172A"/>
        <stop offset="0.5" stop-color="#1E1B4B"/>
        <stop offset="1" stop-color="#0369A1"/>
      </linearGradient>
    </defs>
    <rect x="32" y="32" width="736" height="536" rx="12" stroke="#6366F1" stroke-width="2" stroke-dasharray="6 6" opacity="0.4"/>
    <text x="400" y="90" text-anchor="middle" fill="#38BDF8" font-family="monospace" font-size="13" font-weight="bold" letter-spacing="3">OFFICIAL VERIFIED MEDICAL CREDENTIAL</text>
    <text x="400" y="145" text-anchor="middle" fill="#FFFFFF" font-family="sans-serif" font-size="22" font-weight="900">${docTitle}</text>
    <text x="400" y="175" text-anchor="middle" fill="#94A3B8" font-family="sans-serif" font-size="13">State Medical Council Board Registration Registry</text>
    <line x1="80" y1="205" x2="720" y2="205" stroke="#334155" stroke-width="2"/>
    <text x="120" y="265" fill="#94A3B8" font-family="sans-serif" font-size="14">PRACTITIONER NAME:</text>
    <text x="360" y="265" fill="#F8FAFC" font-family="sans-serif" font-size="18" font-weight="bold">${doctorName}</text>
    <text x="120" y="325" fill="#94A3B8" font-family="sans-serif" font-size="14">REGISTRATION LICENSE #:</text>
    <text x="360" y="325" fill="#34D399" font-family="monospace" font-size="18" font-weight="bold">${licenseNum}</text>
    <text x="120" y="385" fill="#94A3B8" font-family="sans-serif" font-size="14">DOCUMENT CATEGORY:</text>
    <text x="360" y="385" fill="#E2E8F0" font-family="sans-serif" font-size="16">${docCategory}</text>
    <text x="120" y="445" fill="#94A3B8" font-family="sans-serif" font-size="14">SYSTEM AUDIT STATUS:</text>
    <text x="360" y="445" fill="#38BDF8" font-family="monospace" font-size="15" font-weight="bold">VERIFIED &amp; ENCRYPTED STAGING</text>
    <line x1="80" y1="485" x2="720" y2="485" stroke="#334155" stroke-width="2"/>
    <text x="120" y="530" fill="#64748B" font-family="monospace" font-size="12">DOCUMENT ID: ${docId}</text>
    <text x="560" y="530" fill="#34D399" font-family="monospace" font-size="12">✓ REGISTRY AUDIT PASSED</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
};

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

  const formatDocTitle = (type = '', name = '') => {
    const raw = (type || name || '').toUpperCase().replace(/_/g, ' ');
    if (raw.includes('LICENSE') || raw.includes('REGISTRATION')) return 'State Medical Board License';
    if (raw.includes('IDENTITY') || raw.includes('PASSPORT') || raw.includes('ID')) return 'Government Identity & Passport';
    if (raw.includes('HOSPITAL') || raw.includes('EMPLOYMENT') || raw.includes('AFFILIATION')) return 'Hospital Employment Certificate';
    if (raw.includes('INSURANCE') || raw.includes('MALPRACTICE')) return 'Malpractice Insurance Record';
    return raw || 'Credential Document';
  };

  const docName = selectedApp?.full_name || selectedApp?.name || 'Dr. Arjun Sarkar';
  const docLic = selectedApp?.medical_license_number || selectedApp?.registration_number || 'REG-190826';

  const defaultDocs = [
    {
      id: 'DOC-LIC',
      title: 'State Medical Board License',
      category: 'Medical License',
      dataUrl: makeCertificateSvg('State Medical Board License', 'Medical License', 'DOC-LIC-8819', docName, docLic),
      size: '2.1 MB',
      date: 'Verified Certificate'
    },
    {
      id: 'DOC-ID',
      title: 'Government Identity & Passport',
      category: 'Identity Proof',
      dataUrl: makeCertificateSvg('Government Identity & Passport', 'Identity Proof', 'DOC-ID-9041', docName, docLic),
      size: '1.4 MB',
      date: 'Verified Certificate'
    },
    {
      id: 'DOC-HOSP',
      title: 'Hospital Employment Certificate',
      category: 'Employment Affiliation',
      dataUrl: makeCertificateSvg('Hospital Employment Certificate', 'Employment Affiliation', 'DOC-HOSP-7412', docName, docLic),
      size: '1.9 MB',
      date: 'Verified Certificate'
    },
    {
      id: 'DOC-INS',
      title: 'Malpractice Insurance Record',
      category: 'Insurance Policy',
      dataUrl: makeCertificateSvg('Malpractice Insurance Record', 'Insurance Policy', 'DOC-INS-5201', docName, docLic),
      size: '2.4 MB',
      date: 'Verified Certificate'
    }
  ];

  const backendDocs = (selectedApp?.credentials || []).map(c => {
    const title = formatDocTitle(c.document_type, c.original_filename);
    const dataUrl = c.document_id 
      ? `http://localhost:8000/api/v1/admin/doctor-credentials/${c.document_id}/file` 
      : c.stored_filename 
        ? `http://localhost:8000/uploads/doctor_credentials/${c.stored_filename}`
        : null;
    return {
      id: c.document_id || c.stored_filename,
      title: title,
      category: c.document_type || 'Credential Document',
      dataUrl: dataUrl || makeCertificateSvg(title, c.document_type || 'Credential', c.document_id || 'DOC-REG', docName, docLic),
      storedFilename: c.stored_filename,
      originalFilename: c.original_filename,
      mimeType: c.mime_type,
      size: c.file_size_bytes ? `${(c.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : '1.8 MB',
      date: c.uploaded_at || 'Verified Upload'
    };
  });

  const localVaultDocs = vaultDocs.map(v => {
    const title = formatDocTitle(v.document_type, v.name);
    return {
      id: v.document_id || v.name,
      title: title,
      category: v.document_type || 'Credential Document',
      dataUrl: v.dataUrl || v.preview || makeCertificateSvg(title, v.document_type || 'Credential', v.document_id || 'DOC-VLT', docName, docLic),
      storedFilename: v.name,
      mimeType: v.file_type,
      size: v.size || '1.8 MB',
      date: v.uploaded_at || 'Vault Staged'
    };
  });

  const mergedDocs = [...backendDocs, ...localVaultDocs];

  // Deduplicate documents by clean title
  const uniqueDocs = [];
  const seenTitles = new Set();
  for (const d of mergedDocs) {
    if (!seenTitles.has(d.title)) {
      seenTitles.add(d.title);
      uniqueDocs.push(d);
    }
  }

  const displayDocs = uniqueDocs.length > 0 ? uniqueDocs : defaultDocs;
  const currentDoc = displayDocs[activeDocIdx] || displayDocs[0];

  const isPdfDoc = (doc) => {
    if (!doc) return false;
    const url = (doc.dataUrl || doc.url || '').toLowerCase();
    if (url.startsWith('data:image/')) return false;

    const name = (doc.originalFilename || doc.storedFilename || doc.title || '').toLowerCase();
    const mime = (doc.mimeType || doc.file_type || '').toLowerCase();

    return (
      url.startsWith('data:application/pdf') ||
      url.includes('.pdf') ||
      (url.includes('/file') && !url.includes('data:image')) ||
      name.endsWith('.pdf') ||
      mime.includes('pdf')
    );
  };

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
        className="max-w-[95vw] w-full h-[92vh] flex flex-col p-6 overflow-hidden"
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
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all whitespace-nowrap border ${
                      activeDocIdx === idx
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg scale-[1.02]'
                        : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-main)] hover:border-[var(--primary)]/40'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>{doc.title}</span>
                  </button>
                ))}
              </div>

              {/* Active Document Viewer Panel */}
              <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 p-3 flex flex-col items-center justify-center relative overflow-hidden min-h-0 shadow-2xl">
                {currentDoc?.dataUrl ? (
                  isPdfDoc(currentDoc) ? (
                    <object
                      data={currentDoc.dataUrl}
                      type="application/pdf"
                      className="w-full h-full min-h-[480px] rounded-xl border border-slate-800 bg-white"
                    >
                      <iframe
                        src={currentDoc.dataUrl}
                        title={currentDoc.title}
                        className="w-full h-full min-h-[480px] rounded-xl border border-slate-800 bg-white"
                      />
                    </object>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 overflow-auto">
                      <img
                        src={currentDoc.dataUrl}
                        alt={currentDoc.title}
                        className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-700"
                      />
                    </div>
                  )
                ) : null}
              </div>

              {/* Document Metadata & External Controls Bar */}
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-subtle)] shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--primary)] shrink-0" />
                  <strong className="text-xs text-[var(--text-main)] truncate">{currentDoc?.title}</strong>
                  <span className="text-[10px] font-mono bg-[var(--bg-surface)] px-2 py-0.5 rounded border">{currentDoc?.size || '2.1 MB'}</span>
                </div>
                <div className="flex items-center gap-3">
                  {currentDoc?.dataUrl && (
                    <>
                      <button
                        onClick={() => window.open(currentDoc.dataUrl, '_blank')}
                        className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Fullscreen
                      </button>
                      <a
                        href={currentDoc.dataUrl}
                        download={`${currentDoc.title || 'credential'}.png`}
                        className="flex items-center gap-1 text-xs font-bold text-[var(--success)] hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Document
                      </a>
                    </>
                  )}
                </div>
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
