import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle, Clock, ShieldAlert, XCircle, Stethoscope, Lock, UserCheck,
  RefreshCw, FileText, Check, Eye, X, Shield, Activity, Users, BarChart3, Inbox,
  ChevronRight, Calendar, MessageCircle, Hash, Database, Cpu, Sparkles, BookOpen,
  TrendingUp, Layers, FileCheck, ArrowUpRight, ArrowDownRight, Minus, Send, Edit3, Save, Search, Filter,
  CheckCircle2, ArrowRight, BadgeCheck
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  ProgressBar, CircularProgress, Table, TableRow, TableCell, Tabs, Modal, Input, TextArea, EmptyState, Alert
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import {
  fetchDoctorConsultations,
  respondToDoctorAssignment,
  fetchAuthorizedPatientRecord,
  completeConsultation,
  sendConsultationMessage,
  fetchConsultationMessages,
  saveDoctorConsultationNote,
  fetchConsultationNote
} from '../api/client';
import PopulationHealthSection from '../components/doctor/PopulationHealthSection';
import HighRiskPatients from '../components/doctor/HighRiskPatients';
import WorkloadPanel from '../components/doctor/WorkloadPanel';
import ReviewAnalytics from '../components/doctor/ReviewAnalytics';
import OutcomeTracking from '../components/doctor/OutcomeTracking';
import ClinicalAlerts from '../components/doctor/ClinicalAlerts';
import InsightsPanel from '../components/doctor/InsightsPanel';

export default function DoctorDashboardPage({ user, onNavigate, initialTab = 'overview' }) {
  const navigate = useNavigate();
  const doctor = user?.doctor_profile || {};
  const status = doctor.verification_status || 'VERIFIED';
  const doctorName = user?.name || user?.full_name || doctor.full_name || 'Physician';
  const doctorSpecialization = doctor.specialization || doctor.specialty || 'General Practice & Internal Medicine';

  const [allConsultations, setAllConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters & Search
  const [activeQueueTab, setActiveQueueTab] = useState('ALL'); // 'ALL', 'PENDING', 'UPCOMING', 'COMPLETED', 'CANCELLED'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Request Details Modal State
  const [selectedConsultationForDetails, setSelectedConsultationForDetails] = useState(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  useEffect(() => {
    loadAllConsultations();
  }, [user]);

  const loadAllConsultations = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchDoctorConsultations('');
      setAllConsultations(data.consultations || []);
    } catch (err) {
      console.warn("Error fetching doctor consultations:", err);
      setErrorMsg(err.message || 'Failed to fetch assigned consultations.');
      setAllConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRespondAssignment = async (consultationId, action) => {
    let reason = '';
    if (action === 'REJECT' || action === 'DECLINE') {
      reason = window.prompt("Reason for declining this consultation request (optional):") || '';
    }
    setSubmittingAction(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await respondToDoctorAssignment(consultationId, action, reason);
      setSuccessMsg(`Consultation request ${action === 'ACCEPT' ? 'confirmed' : 'declined'} successfully.`);
      setSelectedConsultationForDetails(null);
      await loadAllConsultations();
    } catch (err) {
      setErrorMsg(err.message || `Failed to ${action.toLowerCase()} consultation request.`);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenConsultationWorkspace = (consultation) => {
    if (onNavigate) {
      onNavigate('/consultations', { consultationContext: { consultationId: consultation?.consultation_id || consultation?.id || consultation } });
    } else {
      navigate('/consultations');
    }
  };

  const handleRespond = (consultationId, action) => handleRespondAssignment(consultationId, action);

  const handleViewRecord = (consultationId) => {
    const targetId = typeof consultationId === 'object' ? (consultationId?.consultation_id || consultationId?.id) : consultationId;
    if (onNavigate) {
      onNavigate('/consultations', { consultationContext: { consultationId: targetId } });
    } else {
      navigate('/consultations');
    }
  };

  // Real Count Calculations
  const pendingCount = allConsultations.filter(c => ['REQUESTED', 'ASSIGNED', 'PENDING'].includes(c.status)).length;
  const activeCount = allConsultations.filter(c => ['ACCEPTED', 'CONFIRMED', 'UPCOMING', 'IN_CONSULTATION', 'ACTIVE'].includes(c.status)).length;
  const completedCount = allConsultations.filter(c => c.status === 'COMPLETED').length;
  const totalCount = allConsultations.length;

  // Filtered Queue List
  const filteredConsultations = allConsultations.filter((c) => {
    // Tab Filter
    if (activeQueueTab === 'PENDING' && !['REQUESTED', 'ASSIGNED', 'PENDING'].includes(c.status)) return false;
    if (activeQueueTab === 'UPCOMING' && !['ACCEPTED', 'CONFIRMED', 'UPCOMING', 'IN_CONSULTATION', 'ACTIVE'].includes(c.status)) return false;
    if (activeQueueTab === 'COMPLETED' && c.status !== 'COMPLETED') return false;
    if (activeQueueTab === 'CANCELLED' && !['CANCELLED', 'REJECTED', 'NO_SHOW', 'EXPIRED'].includes(c.status)) return false;

    // Search Query Filter
    const pName = (c.patient_name || c.full_name || '').toLowerCase();
    const pId = (c.patient_id || c.user_id || '').toLowerCase();
    const cId = (c.consultation_id || c.id || '').toLowerCase();
    const reasonText = (c.reason || c.category || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = !q || pName.includes(q) || pId.includes(q) || cId.includes(q) || reasonText.includes(q);

    // Category Filter
    const matchesCategory = categoryFilter === 'all' || (c.category && c.category.toLowerCase().includes(categoryFilter.toLowerCase()));

    return matchesSearch && matchesCategory;
  });

  // High-Risk Cases
  const highRiskCases = allConsultations.filter(c => {
    const outcomes = c.prediction_snapshot?.disease_outcomes || {};
    return Object.values(outcomes).some(o => o.risk_level === 'HIGH');
  });

  const displayList = filteredConsultations;

  if (status !== 'VERIFIED') {
    return (
      <PageContainer className="space-y-8">
        <PageHeader
          title="Physician Verification Pending"
          description="Your medical license & credentials are currently being reviewed by the TeleMed Admin Board."
          badge="Verification Required"
        />
        <Card isGlass={true} className="p-8 text-center space-y-4 max-w-xl mx-auto">
          <ShieldAlert className="w-12 h-12 text-[var(--warning)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--text-main)]">Access Restricted</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Once your doctor verification status is marked as VERIFIED, you will gain full access to patient AI intake reports, TreeSHAP driver reviews, and teleconsultation workspaces.
          </p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="space-y-12 pb-24">
      {/* Page Header */}
      <PageHeader
        title={`Dr. ${user?.full_name || 'Physician'} Workspace`}
        description="Clinical Case Review, Multimodal AI Inference Validation, and Teleconsultation Portal"
        badge={`License Verified • ${doctor.specialty || 'Internal Medicine'}`}
        actions={
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadAllConsultations}>
            Refresh Queue
          </Button>
        }
      />

      {/* 1. ENTERPRISE DOCTOR METRIC CARDS WITH COMPARISON BADGES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--primary)]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[var(--text-muted)] uppercase font-semibold">Active Cases</span>
            <Badge variant="primary" size="sm">Real-time Queue</Badge>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[var(--text-main)]">{allConsultations.length} Cases</div>
          <p className="text-[10px] text-[var(--text-muted)]">Assigned in portal</p>
        </Card>

        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--danger)]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[var(--text-muted)] uppercase font-semibold">Pending Review</span>
            <Badge variant={pendingCount > 0 ? "danger" : "success"} size="sm">{pendingCount} Pending</Badge>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[var(--danger)]">{pendingCount} Cases</div>
          <p className="text-[10px] text-[var(--text-muted)]">Require physician action</p>
        </Card>

        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--success)]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[var(--text-muted)] uppercase font-semibold">Completed Consults</span>
            <Badge variant="success" size="sm">{completedCount} Completed</Badge>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[var(--success)]">{completedCount} Reports</div>
          <p className="text-[10px] text-[var(--text-muted)]">Signed & finalized</p>
        </Card>

        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--accent)]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[var(--text-muted)] uppercase font-semibold">Active In-Review</span>
            <Badge variant="accent" size="sm">{activeCount} Active</Badge>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[var(--accent)]">{activeCount} Cases</div>
          <p className="text-[10px] text-[var(--text-muted)]">In-progress evaluations</p>
        </Card>

        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--warning)]">
          <div className="flex justify-between items-center text-xs">
            <span className="font-mono text-[var(--text-muted)] uppercase font-semibold">Verification</span>
            <Badge variant="success" size="sm">VERIFIED</Badge>
          </div>
          <div className="text-2xl font-extrabold font-mono text-[var(--text-main)]">Active</div>
          <p className="text-[10px] text-[var(--text-muted)]">Verified doctor access</p>
        </Card>
      </div>

      {/* THREE-COLUMN WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (4 cols) — Workload & Review Analytics */}
        <div className="lg:col-span-4 space-y-6">
          <WorkloadPanel consultations={allConsultations} />
          <ReviewAnalytics consultations={allConsultations} />
        </div>

        {/* Center Column (5 cols) — High Risk Monitor & Population Health */}
        <div className="lg:col-span-5 space-y-6">
          <HighRiskPatients
            consultations={allConsultations}
            onReview={(c) => handleViewRecord(c.consultation_id, 'REC_DEFAULT')}
            onMessage={(c) => handleViewRecord(c.consultation_id, 'REC_DEFAULT')}
          />
          <PopulationHealthSection consultations={allConsultations} />
        </div>

        {/* Right Column (3 cols) — Insights & Outcomes */}
        <div className="lg:col-span-3 space-y-6">
          <InsightsPanel />
          <OutcomeTracking />
        </div>

      </div>

      {/* 2. PATIENT REVIEW QUEUE */}
      <ContentSection title="Patient Review Queue" subtitle="Assigned patient cases requiring physician sign-off or AI report review">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="w-full md:w-96">
              <Input
                placeholder="Search patient by name or ID..."
                leftIcon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">Active Cases ({displayList.length})</Badge>
            </div>
          </div>

          <Table headers={['Consultation ID', 'Patient Name', 'Specialty', 'Case Status', 'Scheduled Date', 'Action']}>
            {displayList.length > 0 ? (
              displayList.map((c) => (
                <TableRow key={c.consultation_id}>
                  <TableCell className="font-mono text-xs font-bold text-[var(--primary)]">{c.consultation_id}</TableCell>
                  <TableCell className="font-semibold text-xs">{c.patient_name || 'Patient Case'}</TableCell>
                  <TableCell className="text-xs">{c.specialty || 'General Practice'}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'COMPLETED' ? 'success' : c.status === 'ACTIVE' ? 'primary' : 'warning'} size="sm">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[var(--text-muted)]">{c.appointment_date || 'Today'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {['REQUESTED', 'ASSIGNED', 'PENDING'].includes(c.status) && (
                        <>
                          <Button variant="primary" size="sm" className="!px-2 !py-1 text-xs" onClick={() => handleRespond(c.consultation_id || c.id, 'ACCEPT')}>
                            Accept
                          </Button>
                          <Button variant="outline" size="sm" className="!px-2 !py-1 text-xs text-rose-500" onClick={() => handleRespond(c.consultation_id || c.id, 'REJECT')}>
                            Decline
                          </Button>
                        </>
                      )}
                      {['ACCEPTED', 'CONFIRMED', 'UPCOMING', 'IN_CONSULTATION', 'ACTIVE'].includes(c.status) && (
                        <Button variant="primary" size="sm" className="!px-2.5 !py-1 text-xs" leftIcon={<MessageCircle className="w-3.5 h-3.5" />} onClick={() => handleOpenConsultationWorkspace(c)}>
                          Open Workspace
                        </Button>
                      )}
                      {['COMPLETED'].includes(c.status) && (
                        <Button variant="outline" size="sm" className="!px-2.5 !py-1 text-xs" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => setSelectedConsultationForDetails(c)}>
                          View Summary
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                  No active patient cases found in queue.
                </TableCell>
              </TableRow>
            )}
          </Table>
        </div>
      </ContentSection>

      {/* 3. CLINICAL CONSULTATION DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedConsultationForDetails)}
        onClose={() => setSelectedConsultationForDetails(null)}
        title={`Consultation Details | ID: ${selectedConsultationForDetails?.consultation_id || ''}`}
        size="lg"
      >
        {selectedConsultationForDetails && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--bg-primary)]">
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">PATIENT NAME</span>
                <strong className="text-sm text-[var(--text-main)] font-semibold">{selectedConsultationForDetails.patient_name || 'Patient'}</strong>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">PATIENT ID</span>
                <strong className="font-mono text-[var(--text-main)]">{selectedConsultationForDetails.patient_id || 'P-100'}</strong>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">SPECIALTY</span>
                <span className="font-medium">{selectedConsultationForDetails.specialization || selectedConsultationForDetails.category || 'General Practice'}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">STATUS</span>
                <Badge variant={selectedConsultationForDetails.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                  {selectedConsultationForDetails.status}
                </Badge>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[var(--text-main)]">Chief Complaint / Reason for Visit</label>
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)]">
                {selectedConsultationForDetails.reason_for_visit || selectedConsultationForDetails.notes || 'No reason provided.'}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setSelectedConsultationForDetails(null)}>
                Close
              </Button>
              <div className="flex items-center gap-2">
                {['REQUESTED', 'ASSIGNED', 'PENDING'].includes(selectedConsultationForDetails.status) && (
                  <>
                    <Button variant="primary" size="sm" onClick={() => handleRespondAssignment(selectedConsultationForDetails.consultation_id, 'ACCEPT')}>
                      Accept Request
                    </Button>
                    <Button variant="outline" size="sm" className="text-rose-500" onClick={() => handleRespondAssignment(selectedConsultationForDetails.consultation_id, 'REJECT')}>
                      Decline Request
                    </Button>
                  </>
                )}
                {['CONFIRMED', 'ACCEPTED', 'ACTIVE', 'IN_CONSULTATION', 'COMPLETED'].includes(selectedConsultationForDetails.status) && (
                  <Button variant="primary" size="sm" onClick={() => handleOpenConsultationWorkspace(selectedConsultationForDetails)}>
                    Open Consultation Workspace →
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
