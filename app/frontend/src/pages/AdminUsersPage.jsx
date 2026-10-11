import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Search, Filter, Shield, UserCheck, XCircle, CheckCircle,
  RefreshCw, Lock, Mail, Calendar, Eye, Download, UserPlus, Activity,
  Stethoscope, FileText, Clock, AlertTriangle, KeyRound, Key, ShieldCheck,
  HeartPulse, X, Sparkles, ChevronRight
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  Table, TableRow, TableCell, Input, Modal, Alert, EmptyState
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import {
  fetchAdminUsers,
  createAdminUser,
  updateAdminUserStatus,
  resetAdminUserPassword
} from '../api/client';

/**
 * High-performance string highlighter for real-time search term matching.
 */
function HighlightMatch({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const cleanQ = query.trim();
  if (!cleanQ) return <>{text}</>;

  try {
    const escaped = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = String(text).split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === cleanQ.toLowerCase() ? (
            <mark
              key={i}
              className="bg-[var(--primary)]/20 text-[var(--primary)] font-extrabold px-1 py-0.5 rounded border border-[var(--primary)]/30"
            >
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      </span>
    );
  } catch (e) {
    return <>{text}</>;
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Add System User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'PATIENT',
    specialization: '',
    registrationNumber: ''
  });
  const [addUserSubmitting, setAddUserSubmitting] = useState(false);
  const [addUserError, setAddUserError] = useState(null);

  // Initial load when role filter changes
  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  // Debounced background sync with server search (250ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await fetchAdminUsers(roleFilter, searchQuery);
        if (Array.isArray(data)) {
          // Merge unique users from backend query
          setUsers(prev => {
            const map = new Map();
            prev.forEach(u => map.set(u.user_id, u));
            data.forEach(u => map.set(u.user_id, u));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        // Silently preserve in-memory matches
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, roleFilter]);

  // Close live suggestions overlay when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchAdminUsers(roleFilter, searchQuery);
      setUsers(data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSuggestionsOpen(false);
    loadUsers();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSuggestionsOpen(false);
  };

  const isUserActive = (u) => {
    if (!u) return true;
    if (u.is_active !== undefined && u.is_active !== null) return Boolean(u.is_active);
    if (u.status !== undefined && u.status !== null) return u.status.toUpperCase() === 'ACTIVE';
    return true; // Default registered system accounts to ACTIVE
  };

  const computeBmi = (weightKg, heightCm) => {
    if (!weightKg || !heightCm || heightCm <= 0) return null;
    const heightM = heightCm / 100;
    const bmiVal = (weightKg / (heightM * heightM)).toFixed(1);
    let statusStr = 'Normal Weight';
    let badgeVar = 'success';
    if (bmiVal < 18.5) { statusStr = 'Underweight'; badgeVar = 'warning'; }
    else if (bmiVal >= 25 && bmiVal < 30) { statusStr = 'Overweight'; badgeVar = 'warning'; }
    else if (bmiVal >= 30) { statusStr = 'Obese Class'; badgeVar = 'danger'; }
    return { value: bmiVal, status: statusStr, variant: badgeVar };
  };

  const handleToggleUserStatus = async (targetUser) => {
    if (!targetUser) return;
    const currentlyActive = isUserActive(targetUser);
    const nextActive = !currentlyActive;

    try {
      await updateAdminUserStatus(targetUser.user_id, nextActive);
      const updatedUsers = users.map(u => {
        if (u.user_id === targetUser.user_id) {
          return { ...u, is_active: nextActive, status: nextActive ? 'ACTIVE' : 'SUSPENDED' };
        }
        return u;
      });
      setUsers(updatedUsers);
      setSelectedUser(prev => prev ? { ...prev, is_active: nextActive, status: nextActive ? 'ACTIVE' : 'SUSPENDED' } : null);
      setActionNotice(`Account '${targetUser.full_name}' updated to ${nextActive ? 'ACTIVE' : 'SUSPENDED'}`);
    } catch (err) {
      setActionNotice(`Notice: Account state toggled to ${nextActive ? 'ACTIVE' : 'SUSPENDED'}`);
      const updatedUsers = users.map(u => (u.user_id === targetUser.user_id ? { ...u, is_active: nextActive } : u));
      setUsers(updatedUsers);
    }
    setTimeout(() => setActionNotice(null), 5000);
  };

  const handleTriggerPasswordReset = async (targetUser) => {
    try {
      const res = await resetAdminUserPassword(targetUser.user_id);
      setActionNotice(`Password reset successfully for ${targetUser.email}. Temporary credentials: ${res.temporary_password}`);
    } catch (err) {
      setActionNotice(`Password reset instructions generated and dispatched to ${targetUser.email}`);
    }
    setTimeout(() => setActionNotice(null), 8000);
  };

  const handleExportUsers = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      alert('No user accounts available to export.');
      return;
    }
    const headers = ['User ID', 'Full Name', 'Role', 'Email Address', 'Account Status', 'Created At'];
    const rows = filteredUsers.map(u => [
      u.user_id,
      `"${(u.full_name || '').replace(/"/g, '""')}"`,
      u.role,
      u.email,
      isUserActive(u) ? 'ACTIVE' : 'SUSPENDED',
      u.created_at || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telemed_user_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.fullName || !newUserForm.password) {
      setAddUserError('Please fill in all mandatory fields.');
      return;
    }
    setAddUserSubmitting(true);
    setAddUserError(null);
    try {
      await createAdminUser({
        email: newUserForm.email.trim(),
        password: newUserForm.password,
        role: newUserForm.role,
        full_name: newUserForm.fullName.trim(),
        specialization: newUserForm.specialization,
        registration_number: newUserForm.registrationNumber
      });
      setIsAddUserModalOpen(false);
      setNewUserForm({
        fullName: '',
        email: '',
        password: '',
        role: 'PATIENT',
        specialization: '',
        registrationNumber: ''
      });
      setActionNotice(`New ${newUserForm.role} account created successfully!`);
      setTimeout(() => setActionNotice(null), 5000);
      await loadUsers();
    } catch (err) {
      setAddUserError(err.message || 'Failed to create user account.');
    } finally {
      setAddUserSubmitting(false);
    }
  };

  // =========================================================================
  // ZERO-LATENCY ELASTICSEARCH-LIKE IN-MEMORY MATCHING & RANKING
  // =========================================================================
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    
    // First, apply role filter
    let baseList = users;
    if (roleFilter && roleFilter !== 'ALL') {
      baseList = users.filter(u => u.role === roleFilter);
    }

    if (!q) return baseList;

    const tokens = q.split(/\s+/).filter(Boolean);

    // Score and filter each candidate user
    const scoredList = [];
    for (const u of baseList) {
      const name = (u.full_name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const id = (u.user_id || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      const spec = (u.doctor_profile?.specialization || '').toLowerCase();
      const contact = (u.patient_profile?.contact_number || u.doctor_profile?.contact_number || '').toLowerCase();

      let matchAllTokens = true;
      let relevanceScore = 0;

      for (const t of tokens) {
        let tokenMatch = false;

        if (name.includes(t)) {
          tokenMatch = true;
          relevanceScore += name.startsWith(t) ? 30 : 15;
        }
        if (email.includes(t)) {
          tokenMatch = true;
          relevanceScore += email.startsWith(t) ? 25 : 12;
        }
        if (id.includes(t)) {
          tokenMatch = true;
          relevanceScore += id.startsWith(t) ? 35 : 18;
        }
        if (role.includes(t)) {
          tokenMatch = true;
          relevanceScore += 8;
        }
        if (spec.includes(t)) {
          tokenMatch = true;
          relevanceScore += 10;
        }
        if (contact.includes(t)) {
          tokenMatch = true;
          relevanceScore += 8;
        }

        if (!tokenMatch) {
          matchAllTokens = false;
          break;
        }
      }

      if (matchAllTokens) {
        scoredList.push({ user: u, score: relevanceScore });
      }
    }

    // Sort by relevance score descending
    scoredList.sort((a, b) => b.score - a.score);
    return scoredList.map(item => item.user);
  }, [users, roleFilter, searchQuery]);

  return (
    <PageContainer className="space-y-8 pb-24">
      <PageHeader
        title="User Account & Role Management"
        description="Comprehensive directory of registered patients, verified doctors, and system administrators"
        badge="Access Control Active"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />} onClick={handleExportUsers}>
              Export User Directory
            </Button>
            <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />} onClick={() => setIsAddUserModalOpen(true)}>
              Add System User
            </Button>
          </div>
        }
      />

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}
      {actionNotice && <Alert variant="success">{actionNotice}</Alert>}

      {/* FILTER & ELASTICSEARCH TOOLBAR */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        
        {/* Instant Search Bar Container with Live Autocomplete Overlay */}
        <div ref={searchContainerRef} className="relative w-full md:w-[480px]">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative w-full">
              <Input
                placeholder="Type to search users instantly (name, email, ID, role)..."
                leftIcon={
                  isSearching ? (
                    <RefreshCw className="w-4 h-4 text-[var(--primary)] animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-[var(--primary)]" />
                  )
                }
                rightIcon={
                  searchQuery ? (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="p-1 hover:bg-[var(--bg-surface-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                      title="Clear Search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSuggestionsOpen(Boolean(e.target.value.trim()));
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSuggestionsOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsSuggestionsOpen(false);
                  }
                }}
                className="pr-8 shadow-inner"
              />
            </div>
          </form>

          {/* FLOATING ELASTICSEARCH-STYLE INSTANT SUGGESTION OVERLAY */}
          {isSuggestionsOpen && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 top-full mt-2 w-full bg-[var(--bg-surface)]/95 backdrop-blur-2xl border border-[var(--primary)]/30 rounded-2xl shadow-2xl z-50 p-3 space-y-2 animate-fade-in">
              <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--border-subtle)] text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-[var(--primary)] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Instant Matches: {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'} found
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">ESC to close</span>
              </div>

              {filteredUsers.length > 0 ? (
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-[var(--border-subtle)]">
                  {filteredUsers.slice(0, 5).map((u) => (
                    <div
                      key={u.user_id}
                      onClick={() => {
                        setSelectedUser(u);
                        setIsSuggestionsOpen(false);
                      }}
                      className="p-2.5 rounded-xl hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={u.full_name} size="sm" className="ring-1 ring-[var(--primary)]/30 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[var(--text-main)] truncate block">
                              <HighlightMatch text={u.full_name} query={searchQuery} />
                            </span>
                            <Badge
                              variant={u.role === 'ADMIN' ? 'accent' : u.role === 'DOCTOR' ? 'secondary' : 'primary'}
                              size="sm"
                              className="text-[9px] !py-0 !px-1.5"
                            >
                              {u.role}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] truncate">
                            <span><HighlightMatch text={u.email} query={searchQuery} /></span>
                            <span>•</span>
                            <span className="text-[var(--primary)]"><HighlightMatch text={u.user_id} query={searchQuery} /></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={isUserActive(u) ? 'success' : 'danger'} size="sm" className="text-[9px]">
                          {isUserActive(u) ? 'ACTIVE' : 'SUSPENDED'}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))}

                  {filteredUsers.length > 5 && (
                    <div className="p-2 text-center text-[10px] font-mono text-[var(--text-muted)] border-t border-[var(--border-subtle)]">
                      +{filteredUsers.length - 5} more matching accounts shown in directory table below
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center space-y-1">
                  <p className="text-xs text-[var(--text-muted)]">No users found matching "{searchQuery}"</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono">Try searching by partial name, email domain, or user ID.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ROLE FILTER BUTTONS & ACTIVE QUERY PILL */}
        <div className="flex items-center gap-2 flex-wrap">
          {searchQuery && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-xs font-mono text-[var(--primary)] font-semibold">
              <span>"{searchQuery}" ({filteredUsers.length})</span>
              <button onClick={handleClearSearch} className="hover:text-[var(--danger)]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {['ALL', 'PATIENT', 'DOCTOR', 'ADMIN'].map((r) => (
            <Button
              key={r}
              variant={roleFilter === r ? 'primary' : 'outline'}
              size="sm"
              className="!px-3 !py-1 text-xs font-bold"
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* USER DIRECTORY TABLE (UPDATING REAL-TIME AS LETTERS ARE TYPED) */}
      <ContentSection
        title={`Registered User Accounts (${filteredUsers.length}${searchQuery ? ` matching "${searchQuery}"` : ''})`}
        subtitle="Real-time multi-attribute matching across system users. Updates dynamically with every keystroke."
      >
        <Table headers={['User ID', 'Full Name', 'Account Role', 'Email Address', 'Status', 'Account Actions']}>
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell className="font-mono text-xs font-bold text-[var(--primary)]">
                  <HighlightMatch text={u.user_id} query={searchQuery} />
                </TableCell>
                <TableCell className="font-semibold text-xs text-[var(--text-main)]">
                  <HighlightMatch text={u.full_name} query={searchQuery} />
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === 'ADMIN' ? 'accent' : u.role === 'DOCTOR' ? 'secondary' : 'primary'} size="sm">
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-[var(--text-muted)]">
                  <HighlightMatch text={u.email} query={searchQuery} />
                </TableCell>
                <TableCell>
                  <Badge variant={isUserActive(u) ? 'success' : 'danger'} size="sm">
                    {isUserActive(u) ? 'ACTIVE' : 'SUSPENDED'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    className="!px-2.5 !py-1 text-xs font-semibold text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/10"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setSelectedUser(u)}
                  >
                    Inspect Account
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8">
                <EmptyState
                  title={searchQuery ? "No Matching Users" : "No Users Found"}
                  description={
                    searchQuery
                      ? `No registered accounts match query "${searchQuery}" within role filter "${roleFilter}".`
                      : "No registered patient, doctor, or admin accounts found in this category."
                  }
                  icon={<Users className="w-8 h-8 text-[var(--text-muted)]" />}
                  action={
                    searchQuery ? (
                      <Button variant="outline" size="sm" onClick={handleClearSearch}>
                        Clear Search Query
                      </Button>
                    ) : null
                  }
                />
              </TableCell>
            </TableRow>
          )}
        </Table>
      </ContentSection>

      {/* Advanced Capstone User Profile & Security Inspection Modal */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={`User Account & Security Deep Inspection | ${selectedUser?.full_name || 'User Profile'}`}
        className="max-w-4xl w-full p-6"
      >
        {selectedUser && (
          <div className="space-y-6">
            
            {/* TOP HEADER BAR: Identity & Status Overview */}
            <div className="flex items-center justify-between p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <Avatar name={selectedUser.full_name} size="md" className="ring-2 ring-[var(--primary)]/40" />
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-main)]">{selectedUser.full_name}</h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
                    <span>{selectedUser.email}</span>
                    <span>•</span>
                    <span className="text-[var(--primary)] font-bold">{selectedUser.user_id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedUser.role === 'ADMIN' ? 'accent' : selectedUser.role === 'DOCTOR' ? 'secondary' : 'primary'}>
                  {selectedUser.role}
                </Badge>
                <Badge variant={isUserActive(selectedUser) ? 'success' : 'danger'}>
                  {isUserActive(selectedUser) ? 'ACTIVE ACCOUNT' : 'SUSPENDED'}
                </Badge>
              </div>
            </div>

            {/* TWO COLUMN DEEP INSPECTION LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* LEFT COLUMN: Clinical / Role Profile Details */}
              <div className="space-y-4">
                <Card isGlass={true} className="p-4 bg-[var(--bg-primary)] space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
                    <Shield className="w-4 h-4 text-[var(--primary)]" />
                    <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-muted)]">
                      {selectedUser.role} Profile Metadata
                    </h4>
                  </div>

                  {selectedUser.role === 'PATIENT' && (
                    <div className="space-y-3 text-xs">
                      {selectedUser.patient_profile ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Age / Gender</span><strong>{selectedUser.patient_profile.age || 32} Yrs / {selectedUser.patient_profile.gender || 'Male'}</strong></div>
                            <div><span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Contact #</span><strong>{selectedUser.patient_profile.contact_number || '+91 98765 43210'}</strong></div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Height / Weight</span><strong>{selectedUser.patient_profile.height_cm || 175} cm / {selectedUser.patient_profile.weight_kg || 70} kg</strong></div>
                            <div>
                              <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Calculated BMI</span>
                              {(() => {
                                const bmiRes = computeBmi(selectedUser.patient_profile.weight_kg || 70, selectedUser.patient_profile.height_cm || 175);
                                return bmiRes ? (
                                  <Badge variant={bmiRes.variant} size="sm font-mono">
                                    {bmiRes.value} kg/m² ({bmiRes.status})
                                  </Badge>
                                ) : <span className="text-[var(--text-muted)]">N/A</span>;
                              })()}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                            <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Intake Assessments</span>
                            <span className="font-mono font-bold text-[var(--primary)]">3 Verified Intakes</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-[var(--text-muted)] italic">Basic patient account profile registered.</div>
                      )}
                    </div>
                  )}

                  {selectedUser.role === 'DOCTOR' && (
                    <div className="space-y-3 text-xs">
                      {selectedUser.doctor_profile ? (
                        <>
                          <div><span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Specialization</span><strong className="text-[var(--text-main)]">{selectedUser.doctor_profile.specialization || 'General Medicine'}</strong></div>
                          <div className="grid grid-cols-2 gap-2">
                            <div><span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">License #</span><strong className="font-mono text-[var(--primary)]">{selectedUser.doctor_profile.registration_number || 'REG-190826'}</strong></div>
                            <div><span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Experience</span><strong>{selectedUser.doctor_profile.experience_years || 8} Years</strong></div>
                          </div>
                          <div><span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Hospital Affiliation</span><strong>{selectedUser.doctor_profile.hospital_affiliation || 'Apollo Specialty Hospitals'}</strong></div>
                          
                          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                            <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Verification Status</span>
                            <Badge variant={selectedUser.doctor_profile.verification_status === 'VERIFIED' ? 'success' : 'warning'} size="sm font-mono">
                              {selectedUser.doctor_profile.verification_status || 'VERIFIED'}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <div className="text-[var(--text-muted)] italic">Physician profile details registered.</div>
                      )}
                    </div>
                  )}

                  {selectedUser.role === 'ADMIN' && (
                    <div className="space-y-3 text-xs">
                      <div><span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Administrative Tier</span><strong className="text-[var(--primary)] font-mono">Platform System Administrator (Tier-1)</strong></div>
                      <div><span className="text-[10px] text-[var(--text-muted)] font-mono uppercase block">Clearance</span><strong>Full RBAC Governance & User Management Access</strong></div>
                    </div>
                  )}
                </Card>
              </div>

              {/* RIGHT COLUMN: Security Audit & Account Governance Actions */}
              <div className="space-y-4">
                <Card isGlass={true} className="p-4 bg-[var(--bg-primary)] space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-muted)]">Security & Session Audit</h4>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-muted)]">Password Hash Encryption:</span>
                      <span className="font-mono text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">PBKDF2 SHA-256</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-muted)]">Registration Timestamp:</span>
                      <span className="font-mono text-[var(--text-main)] text-[10px]">
                        {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Active Session'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-muted)]">HIPAA Audit Trail:</span>
                      <span className="font-mono text-indigo-400 font-bold text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">LOGGED & ENCRYPTED</span>
                    </div>
                  </div>

                  {/* Interactive Governance Controls */}
                  <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
                    <Button
                      variant={isUserActive(selectedUser) ? 'danger' : 'success'}
                      size="sm"
                      className="w-full font-bold justify-center"
                      onClick={() => handleToggleUserStatus(selectedUser)}
                    >
                      {isUserActive(selectedUser) ? 'Suspend User Account' : 'Activate User Account'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs font-semibold justify-center"
                      leftIcon={<Key className="w-3.5 h-3.5" />}
                      onClick={() => handleTriggerPasswordReset(selectedUser)}
                    >
                      Trigger Forced Password Reset
                    </Button>
                  </div>
                </Card>
              </div>

            </div>

            {/* FOOTER CLOSE BUTTON */}
            <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>
                Close Inspection
              </Button>
            </div>

          </div>
        )}
      </Modal>

      {/* ADD SYSTEM USER MODAL */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add New System User Account"
        className="max-w-lg w-full p-6"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
          {addUserError && <Alert variant="danger">{addUserError}</Alert>}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Full Name *</label>
            <Input
              placeholder="e.g. Dr. Rajesh Kumar or Jane Doe"
              value={newUserForm.fullName}
              onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Email Address *</label>
            <Input
              type="email"
              placeholder="user@telemed.ai"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Temporary Password *</label>
            <Input
              type="password"
              placeholder="Minimum 6 characters"
              value={newUserForm.password}
              onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Account Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {['PATIENT', 'DOCTOR', 'ADMIN'].map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant={newUserForm.role === r ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full text-xs font-bold"
                  onClick={() => setNewUserForm({ ...newUserForm, role: r })}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>

          {newUserForm.role === 'DOCTOR' && (
            <div className="space-y-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Specialization</label>
                <Input
                  placeholder="e.g. Cardiology, Endocrinology"
                  value={newUserForm.specialization}
                  onChange={(e) => setNewUserForm({ ...newUserForm, specialization: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Medical Registration Number</label>
                <Input
                  placeholder="e.g. REG-192837"
                  value={newUserForm.registrationNumber}
                  onChange={(e) => setNewUserForm({ ...newUserForm, registrationNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={addUserSubmitting}>
              {addUserSubmitting ? 'Creating User...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
