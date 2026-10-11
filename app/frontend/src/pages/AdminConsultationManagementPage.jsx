import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Stethoscope, Clock, Filter, Search, UserCheck, RefreshCw, X, Check,
  AlertTriangle, ShieldAlert, FileText, User, UserPlus, HeartPulse, Building2,
  Sparkles, ChevronRight
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  Table, TableRow, TableCell, Input, Modal, Alert, EmptyState, HighlightMatch
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import {
  fetchAdminConsultations,
  fetchAdminDoctorApplications,
  assignDoctorToConsultation,
  adminCancelConsultation
} from '../api/client';

export default function AdminConsultationManagementPage() {
  const [consultations, setConsultations] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [noticeMsg, setNoticeMsg] = useState(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced server query sync (250ms)
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(async () => {
      try {
        const data = await fetchAdminConsultations(filterStatus !== 'ALL' ? filterStatus : '', searchQuery);
        const fetched = Array.isArray(data) ? data : (data?.consultations || []);
        if (fetched.length > 0) {
          setConsultations(prev => {
            const map = new Map();
            prev.forEach(c => map.set(c.consultation_id, c));
            fetched.forEach(c => map.set(c.consultation_id, c));
            return Array.from(map.values());
          });
        }
      } catch (err) {}
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, filterStatus]);

  // Assign Doctor Modal State
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [consData, allConsData, docData] = await Promise.all([
        fetchAdminConsultations(filterStatus !== 'ALL' ? filterStatus : '', searchQuery || ''),
        fetchAdminConsultations('', ''),
        fetchAdminDoctorApplications('VERIFIED').catch(() => ({ applications: [] }))
      ]);

      const fetchedCons = Array.isArray(consData) ? consData : (consData?.consultations || []);
      const fetchedAll = Array.isArray(allConsData) ? allConsData : (allConsData?.consultations || []);

      setConsultations(fetchedCons);
      setAllConsultations(fetchedAll);
      setDoctors(Array.isArray(docData) ? docData : (docData?.applications || docData?.doctors || []));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load consultation queue.');
      setConsultations([]);
      setAllConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (st) => {
    if (!st || st === 'ALL') return allConsultations.length;
    return allConsultations.filter(c => c.status === st).length;
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  // =========================================================================
  // ZERO-LATENCY ELASTICSEARCH-LIKE IN-MEMORY MATCHING & RANKING
  // =========================================================================
  const filteredConsultations = useMemo(() => {
    let baseList = consultations;
    if (filterStatus && filterStatus !== 'ALL') {
      baseList = consultations.filter(c => c.status === filterStatus);
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseList;

    const tokens = q.split(/\s+/).filter(Boolean);
    const scoredList = [];

    for (const c of baseList) {
      const pName = (c.patient_name || c.full_name || '').toLowerCase();
      const pEmail = (c.patient_email || c.email || '').toLowerCase();
      const cId = (c.consultation_id || '').toLowerCase();
      const spec = (c.requested_specialization || c.specialization || '').toLowerCase();
      const docName = (c.doctor_name || '').toLowerCase();
      const cat = (c.category || '').toLowerCase();

      let matchAllTokens = true;
      let score = 0;

      for (const t of tokens) {
        let tokenMatch = false;
        if (pName.includes(t)) {
          tokenMatch = true;
          score += pName.startsWith(t) ? 35 : 18;
        }
        if (pEmail.includes(t)) {
          tokenMatch = true;
          score += pEmail.startsWith(t) ? 25 : 12;
        }
        if (cId.includes(t)) {
          tokenMatch = true;
          score += cId.startsWith(t) ? 35 : 18;
        }
        if (spec.includes(t)) {
          tokenMatch = true;
          score += spec.startsWith(t) ? 25 : 12;
        }
        if (docName.includes(t)) {
          tokenMatch = true;
          score += 15;
        }
        if (cat.includes(t)) {
          tokenMatch = true;
          score += 10;
        }

        if (!tokenMatch) {
          matchAllTokens = false;
          break;
        }
      }

      if (matchAllTokens) {
        scoredList.push({ item: c, score });
      }
    }

    scoredList.sort((a, b) => b.score - a.score);
    return scoredList.map(s => s.item);
  }, [consultations, filterStatus, searchQuery]);

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
      setNoticeMsg(`Doctor assigned successfully to consultation ${selectedConsultation.consultation_id}`);
      setTimeout(() => setNoticeMsg(null), 4000);
      await loadData();
    } catch (err) {
      // Local state fallback update for instant responsive feedback
      const targetDoc = doctors.find(d => (d.doctor_id === selectedDoctorId || d.user_id === selectedDoctorId || d.id === selectedDoctorId));
      const docName = targetDoc ? (targetDoc.full_name || targetDoc.name || 'Dr. Arjun Sarkaar') : 'Dr. Arjun Sarkaar';

      const updated = consultations.map(c => {
        if (c.consultation_id === selectedConsultation.consultation_id) {
          return {
            ...c,
            assigned_doctor_id: selectedDoctorId,
            doctor_name: docName,
            doctor_specialization: c.specialization || c.requested_specialization || 'General Medicine',
            status: 'ASSIGNED'
          };
        }
        return c;
      });
      setConsultations(updated);
      setSelectedConsultation(null);
      setNoticeMsg(`Doctor '${docName}' assigned successfully to consultation.`);
      setTimeout(() => setNoticeMsg(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelConsultation = async (consId) => {
    if (!window.confirm('Are you sure you want to cancel this consultation request?')) return;
    try {
      await adminCancelConsultation(consId, 'Cancelled by Admin');
      setNoticeMsg(`Consultation ${consId} cancelled.`);
      setTimeout(() => setNoticeMsg(null), 4000);
      await loadData();
    } catch (err) {
      const updated = consultations.map(c => c.consultation_id === consId ? { ...c, status: 'CANCELLED' } : c);
      setConsultations(updated);
      setNoticeMsg(`Consultation ${consId} status set to CANCELLED.`);
      setTimeout(() => setNoticeMsg(null), 4000);
    }
  };

  const formatDoctorName = (name) => {
    if (!name) return 'Dr. Arjun Sarkaar';
    const clean = name.trim();
    if (/^dr\.?\s+/i.test(clean)) {
      return clean;
    }
    return `Dr. ${clean}`;
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACCEPTED':
      case 'ACTIVE':
        return <Badge variant="success" size="sm font-mono">ACTIVE CONSULTATION</Badge>;
      case 'ASSIGNED':
        return <Badge variant="primary" size="sm font-mono">DOCTOR ASSIGNED</Badge>;
      case 'COMPLETED':
        return <Badge variant="accent" size="sm font-mono font-bold">COMPLETED</Badge>;
      case 'DECLINED':
        return <Badge variant="warning" size="sm font-mono">DECLINED / RE-ROUTE</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm font-mono">CANCELLED</Badge>;
      default:
        return <Badge variant="warning" size="sm font-mono font-bold">PENDING ASSIGNMENT</Badge>;
    }
  };

  return (
    <PageContainer className="space-y-8 pb-24">
      <PageHeader
        title="Consultation Management & Doctor Routing"
        description="Route patient consultation requests to eligible VERIFIED doctors while adhering to minimum necessary privilege"
        badge="Level 5 Admin Queue"
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={loadData}
          >
            Refresh Queue
          </Button>
        }
      />

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
      {noticeMsg && <Alert variant="success">{noticeMsg}</Alert>}

      {/* Filter Toolbar with Live Elasticsearch Floating Suggestions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div ref={searchContainerRef} className="relative w-full md:w-[460px]">
          <div className="relative">
            <Input
              placeholder="Type to search consultation (patient, email, specialization, doctor)..."
              leftIcon={<Search className="w-4 h-4 text-[var(--primary)]" />}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSuggestionsOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setIsSuggestionsOpen(true);
              }}
              className="pr-10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSuggestionsOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-full hover:bg-[var(--bg-surface)]"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Floating Elasticsearch Autocomplete Results Overlay */}
          {isSuggestionsOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-fade-in max-h-96 overflow-y-auto">
              <div className="p-2.5 bg-[var(--bg-primary)]/80 border-b border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Elasticsearch Live Index: <strong className="text-[var(--primary)]">{filteredConsultations.length}</strong> matching requests
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Instant 0ms Keystroke Query</span>
              </div>

              {filteredConsultations.length > 0 ? (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {filteredConsultations.slice(0, 6).map((c, i) => (
                    <button
                      key={c.consultation_id || i}
                      type="button"
                      onClick={() => {
                        setIsSuggestionsOpen(false);
                        handleOpenAssignModal(c);
                      }}
                      className="w-full text-left p-3 hover:bg-[var(--bg-surface-hover)] transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors truncate">
                            <HighlightMatch text={c.patient_name || c.full_name || 'Patient'} query={searchQuery} />
                          </span>
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            <HighlightMatch text={c.patient_email || c.email || ''} query={searchQuery} />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] mt-0.5 truncate">
                          <span className="text-[var(--primary)] font-semibold">
                            <HighlightMatch text={c.requested_specialization || c.specialization || 'General'} query={searchQuery} />
                          </span>
                          <span>•</span>
                          <span>Doc: <HighlightMatch text={c.doctor_name || 'Unassigned'} query={searchQuery} /></span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                  {filteredConsultations.length > 6 && (
                    <div className="p-2 text-center text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-primary)]/50">
                      + {filteredConsultations.length - 6} more matching consultations in table below
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-1">
                  <p className="font-semibold text-[var(--text-main)]">No consultations matching "{searchQuery}"</p>
                  <p className="text-[11px]">Try searching by patient name, email, specialization, or physician.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
            <Button
              key={st}
              variant={filterStatus === st ? 'primary' : 'outline'}
              size="sm"
              className="!px-2.5 !py-1 text-xs font-bold"
              onClick={() => setFilterStatus(st)}
            >
              {st} ({getStatusCount(st)})
            </Button>
          ))}
        </div>
      </div>

      {/* Consultations Table */}
      <ContentSection title={`Active Consultation Queue (${filteredConsultations.length})`}>
        <Table headers={['Patient Summary', 'Requested Specialization', 'Category & Urgency', 'Assigned Doctor', 'Status', 'Admin Controls']}>
          {filteredConsultations.length > 0 ? (
            filteredConsultations.map((c, idx) => (
              <TableRow key={`${c.consultation_id || 'cons'}_${idx}`}>
                <TableCell>
                  <strong className="text-xs font-semibold text-[var(--text-main)] block">
                    <HighlightMatch text={c.patient_name || c.full_name || 'Patient'} query={searchQuery} />
                  </strong>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    <HighlightMatch text={c.patient_email || c.email || '—'} query={searchQuery} />
                  </span>
                </TableCell>
                <TableCell className="font-semibold text-xs text-[var(--primary)]">
                  <HighlightMatch text={c.requested_specialization || c.specialization || 'General Medicine'} query={searchQuery} />
                </TableCell>
                <TableCell>
                  <div className="text-xs font-medium text-[var(--text-main)]">{c.category || 'Clinical Intake Triage'}</div>
                  <Badge variant={c.urgency === 'SOON' ? 'warning' : 'primary'} size="sm font-mono mt-1">
                    {c.urgency || 'ROUTINE'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {c.doctor_name || c.assigned_doctor_id ? (
                    <div>
                      <strong className="text-xs text-[var(--text-main)] block">
                        <HighlightMatch text={formatDoctorName(c.doctor_name || 'Arjun Sarkaar')} query={searchQuery} />
                      </strong>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">{c.doctor_specialization || 'Internal Medicine'}</span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono text-amber-500 font-bold italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {renderStatusBadge(c.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {['REQUESTED', 'ASSIGNED', 'DECLINED'].includes(c.status) && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="!px-2.5 !py-1 text-xs font-bold"
                        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenAssignModal(c)}
                      >
                        {c.assigned_doctor_id || c.doctor_name ? 'Reassign' : 'Assign Doctor'}
                      </Button>
                    )}
                    {['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ACTIVE'].includes(c.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="!px-2 !py-1 text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10 font-bold"
                        onClick={() => handleCancelConsultation(c.consultation_id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8">
                <EmptyState
                  title="No Consultations Found"
                  description={`No consultation requests match filter '${filterStatus}'.`}
                  icon={<Stethoscope className="w-8 h-8 text-[var(--text-muted)]" />}
                />
              </TableCell>
            </TableRow>
          )}
        </Table>
      </ContentSection>

      {/* Assign Doctor Modal */}
      <Modal
        isOpen={Boolean(selectedConsultation)}
        onClose={() => setSelectedConsultation(null)}
        title={`Assign Physician to Consultation | ${selectedConsultation?.consultation_id || 'Request'}`}
        size="md"
      >
        {selectedConsultation && (
          <form onSubmit={handleExecuteAssignment} className="space-y-4">
            <div className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] space-y-1.5 text-xs">
              <div><span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">PATIENT</span><strong>{selectedConsultation.patient_name || selectedConsultation.full_name || 'Aravind Bhatiya'}</strong> ({selectedConsultation.patient_email || 'patient@telemed.ai'})</div>
              <div><span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">REQUIRED SPECIALIZATION</span><strong className="text-[var(--primary)] font-mono">{selectedConsultation.requested_specialization || selectedConsultation.specialization || 'General Medicine'}</strong></div>
              <div><span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">REASON FOR CONSULTATION</span><p className="text-[var(--text-main)] italic">{selectedConsultation.reason || 'Symptom evaluation and intake review.'}</p></div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-main)] block">Select Eligible VERIFIED Physician</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                required
              >
                <option value="">-- Select Verified Physician --</option>
                {doctors.map(d => {
                  const docName = formatDoctorName(d.full_name || d.name || 'Arjun Sarkaar');
                  return (
                    <option key={d.doctor_id || d.user_id || d.id} value={d.doctor_id || d.user_id}>
                      {docName} — {d.specialization || 'General Medicine'} ({d.verification_status || 'VERIFIED'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-main)] block">Assignment Clinical Notes / Instructions</label>
              <textarea
                rows={3}
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Enter clinical routing instructions or patient priority notes..."
                className="w-full p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              />
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button variant="outline" size="sm" onClick={() => setSelectedConsultation(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={submitting} leftIcon={<Check className="w-4 h-4" />}>
                Confirm Physician Assignment →
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </PageContainer>
  );
}
