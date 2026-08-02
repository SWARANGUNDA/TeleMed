import React, { useState, useEffect } from 'react';
import {
  Stethoscope, CheckCircle, Clock, XCircle, ShieldAlert, Filter, Check,
  RefreshCw, Eye, AlertTriangle, FileText, X, Search, RotateCcw, ShieldCheck, Download
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

export default function AdminDoctorVerificationPage() {
  const [applications, setApplications] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Application Modal Detail State
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Transition Form State inside modal
  const [targetStatus, setTargetStatus] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleOpenDetail = async (doctorId) => {
    setDetailLoading(true);
    setTargetStatus('');
    setTransitionReason('');
    try {
      const detail = await fetchAdminDoctorApplicationDetail(doctorId);
      setSelectedApp(detail);
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
                <TableCell className="font-semibold text-xs">{app.full_name || app.name}</TableCell>
                <TableCell className="font-mono text-xs text-[var(--text-muted)]">{app.medical_license_number || 'MED-881920'}</TableCell>
                <TableCell className="text-xs">{app.hospital_affiliation || 'Apollo Hospitals'}</TableCell>
                <TableCell className="text-xs">{app.specialization || 'Internal Medicine'}</TableCell>
                <TableCell>
                  <Badge variant={app.verification_status === 'VERIFIED' ? 'success' : app.verification_status === 'REJECTED' ? 'danger' : 'warning'} size="sm">
                    {app.verification_status || 'PENDING'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="!px-2.5 !py-1 text-xs" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => handleOpenDetail(app.doctor_id || app.id)}>
                    Review Credentials
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

      {/* Credential Verification Modal */}
      <Modal
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title={`Doctor Credential Review | ${selectedApp?.full_name || 'Physician'}`}
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Checklist Card */}
            <Card isGlass={true} className="p-4 bg-[var(--bg-primary)] space-y-3">
              <h5 className="text-xs font-mono uppercase font-bold text-[var(--text-muted)]">Compliance Verification Checklist</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-[var(--success)] font-semibold"><ShieldCheck className="w-4 h-4" /> State Medical Board License</div>
                <div className="flex items-center gap-2 text-[var(--success)] font-semibold"><ShieldCheck className="w-4 h-4" /> Identity & Passport Document</div>
                <div className="flex items-center gap-2 text-[var(--success)] font-semibold"><ShieldCheck className="w-4 h-4" /> Hospital Employment Verification</div>
                <div className="flex items-center gap-2 text-[var(--success)] font-semibold"><ShieldCheck className="w-4 h-4" /> Malpractice Insurance Record</div>
              </div>
            </Card>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-main)]">Decision Notes / Revision Comments (Required for Reject / Revision)</label>
              <TextArea
                rows={3}
                placeholder="Enter audit comments or missing document requests..."
                value={transitionReason}
                onChange={(e) => setTransitionReason(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>Cancel</Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-amber-500" isLoading={submitting} onClick={() => handleExecuteTransition('RESUBMISSION_REQUIRED')}>
                  Request Revision
                </Button>
                <Button variant="outline" size="sm" className="text-rose-500" isLoading={submitting} onClick={() => handleExecuteTransition('REJECTED')}>
                  Reject Application
                </Button>
                <Button variant="success" size="sm" isLoading={submitting} leftIcon={<Check className="w-4 h-4" />} onClick={() => handleExecuteTransition('VERIFIED')}>
                  Approve Credentials →
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
