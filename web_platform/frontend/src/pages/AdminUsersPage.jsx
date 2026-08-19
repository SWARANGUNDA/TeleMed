import React, { useState, useEffect } from 'react';
import {
  Users, Search, Filter, Shield, UserCheck, XCircle, CheckCircle,
  RefreshCw, Lock, Mail, Calendar, Eye, Download, UserPlus
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  Table, TableRow, TableCell, Input, Modal, Alert, EmptyState
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import { fetchAdminUsers } from '../api/client';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

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
    e.preventDefault();
    loadUsers();
  };

  const isUserActive = (u) => {
    if (!u) return true;
    if (u.is_active !== undefined && u.is_active !== null) return Boolean(u.is_active);
    if (u.status !== undefined && u.status !== null) return u.status.toUpperCase() === 'ACTIVE';
    return true; // Default registered system accounts to ACTIVE
  };

  return (
    <PageContainer className="space-y-8 pb-24">
      <PageHeader
        title="User Account & Role Management"
        description="Comprehensive directory of registered patients, verified doctors, and system administrators"
        badge="Access Control Active"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
              Export User Directory
            </Button>
            <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
              Add System User
            </Button>
          </div>
        }
      />

      {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex gap-2">
          <Input
            placeholder="Search by name, email, or user ID..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="outline" size="md" type="submit">Search</Button>
        </form>

        <div className="flex items-center gap-2">
          {['ALL', 'PATIENT', 'DOCTOR', 'ADMIN'].map((r) => (
            <Button
              key={r}
              variant={roleFilter === r ? 'primary' : 'outline'}
              size="sm"
              className="!px-3 !py-1 text-xs"
              onClick={() => setRoleFilter(r)}
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* User Directory Table */}
      <ContentSection title={`Registered User Accounts (${users.length})`}>
        <Table headers={['User ID', 'Full Name', 'Account Role', 'Email Address', 'Status', 'Account Actions']}>
          {users.length > 0 ? (
            users.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell className="font-mono text-xs font-bold text-[var(--primary)]">{u.user_id}</TableCell>
                <TableCell className="font-semibold text-xs text-[var(--text-main)]">{u.full_name}</TableCell>
                <TableCell><Badge variant={u.role === 'ADMIN' ? 'accent' : u.role === 'DOCTOR' ? 'secondary' : 'primary'} size="sm">{u.role}</Badge></TableCell>
                <TableCell className="font-mono text-xs text-[var(--text-muted)]">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={isUserActive(u) ? 'success' : 'danger'} size="sm">
                    {isUserActive(u) ? 'ACTIVE' : 'SUSPENDED'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="!px-2.5 !py-1 text-xs font-semibold text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/10" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={() => setSelectedUser(u)}>
                    Inspect Account
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8">
                <EmptyState title="No Users Found" description="No registered patient, doctor, or admin accounts match your active search filters." icon={<Users className="w-8 h-8 text-[var(--text-muted)]" />} />
              </TableCell>
            </TableRow>
          )}
        </Table>
      </ContentSection>

      {/* User Profile Modal */}
      <Modal
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={`User Account Details | ${selectedUser?.full_name || 'Account'}`}
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-subtle)] space-y-2 text-xs">
              <div><span className="text-[10px] font-mono text-[var(--text-muted)] block uppercase">User ID</span><strong className="font-mono text-[var(--primary)]">{selectedUser.user_id}</strong></div>
              <div><span className="text-[10px] font-mono text-[var(--text-muted)] block uppercase">Full Name</span><strong className="text-[var(--text-main)]">{selectedUser.full_name}</strong></div>
              <div><span className="text-[10px] font-mono text-[var(--text-muted)] block uppercase">Email</span><strong className="font-mono text-[var(--text-main)]">{selectedUser.email}</strong></div>
              <div><span className="text-[10px] font-mono text-[var(--text-muted)] block uppercase">Role</span><Badge variant={selectedUser.role === 'ADMIN' ? 'accent' : selectedUser.role === 'DOCTOR' ? 'secondary' : 'primary'} size="sm">{selectedUser.role}</Badge></div>
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] block uppercase">Account Status</span>
                <Badge variant={isUserActive(selectedUser) ? 'success' : 'danger'} size="sm">
                  {isUserActive(selectedUser) ? 'ACTIVE' : 'SUSPENDED'}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <Button variant="outline" size="sm" onClick={() => setSelectedUser(null)}>Close</Button>
              <Button variant={isUserActive(selectedUser) ? 'danger' : 'success'} size="sm">
                {isUserActive(selectedUser) ? 'Suspend User' : 'Activate Account'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
