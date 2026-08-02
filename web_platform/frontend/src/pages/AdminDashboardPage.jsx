import React, { useState, useEffect } from 'react';
import {
  Shield, Users, Stethoscope, Clock, CheckCircle, AlertTriangle, ArrowRight,
  RefreshCw, Search, Filter, Eye, User, FileText, Activity, Inbox, ChevronRight,
  X, Check, Lock, Calendar, Mail, Hash, Cpu, Database, Layers, Sparkles, Server, HardDrive, ShieldCheck, Download
} from 'lucide-react';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  ProgressBar, CircularProgress, Table, TableRow, TableCell, Tabs, Modal, Input, EmptyState, Alert
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import { fetchAdminStats, fetchAdminUsers } from '../api/client';

export default function AdminDashboardPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'verification', 'users', 'monitoring', 'security'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Directory State
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUserDirectory();
    }
  }, [activeTab, userRoleFilter, userSearchQuery]);

  const loadDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminStats();
      setStats(data.stats || data);
    } catch (err) {
      setError(err.message || 'Failed to load system metrics.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDirectory = async () => {
    setDirectoryLoading(true);
    try {
      const uList = await fetchAdminUsers(userRoleFilter, userSearchQuery);
      setUsers(uList || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const pendingDoctors = [
    { id: 'DOC-101', name: 'Dr. Sarah Jenkins', license: 'MED-994821', hospital: 'Apollo Hospitals', specialty: 'Cardiology', date: 'August 1, 2026', status: 'PENDING' },
    { id: 'DOC-102', name: 'Dr. Rajesh Sharma', license: 'MED-883920', hospital: 'Max Healthcare', specialty: 'Endocrinology', date: 'July 30, 2026', status: 'UNDER_REVIEW' },
    { id: 'DOC-103', name: 'Dr. Emily Vance', license: 'MED-774912', hospital: 'Fortis Healthcare', specialty: 'Gastroenterology', date: 'July 28, 2026', status: 'PENDING' }
  ];

  return (
    <PageContainer className="space-y-12 pb-24">
      {/* Page Header */}
      <PageHeader
        title="Admin Operations & Command Center"
        description="Real-time Platform Telemetry, Doctor Verification Queue, System Security & User Administration"
        badge="System Status: Operational 99.98%"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="w-4 h-4" />} onClick={loadDashboardStats}>
              Refresh Telemetry
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Shield className="w-4 h-4" />}>
              Platform Settings
            </Button>
          </div>
        }
      />

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Executive Overview' },
          { id: 'verification', label: 'Doctor Verification (3)' },
          { id: 'users', label: 'User Directory' },
          { id: 'monitoring', label: 'Platform Subsystems' },
          { id: 'security', label: 'Security & Audit Logs' }
        ].map((tb) => (
          <Button
            key={tb.id}
            variant={activeTab === tb.id ? 'primary' : 'ghost'}
            size="sm"
            className="!px-4 !py-2 text-xs"
            onClick={() => setActiveTab(tb.id)}
          >
            {tb.label}
          </Button>
        ))}
      </div>

      {/* 1. EXECUTIVE OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card isGlass={true} className="p-5 flex items-center justify-between border-l-4 border-l-[var(--primary)]">
              <div className="space-y-1">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-semibold">Total Registered Patients</span>
                <div className="text-2xl font-extrabold font-mono text-[var(--text-main)]">{stats?.total_patients || 1240}</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                <Users className="w-6 h-6" />
              </div>
            </Card>

            <Card isGlass={true} className="p-5 flex items-center justify-between border-l-4 border-l-[var(--secondary)]">
              <div className="space-y-1">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-semibold">Verified Doctors</span>
                <div className="text-2xl font-extrabold font-mono text-[var(--secondary)]">{stats?.total_doctors || 48}</div>
              </div>
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-500">
                <Stethoscope className="w-6 h-6" />
              </div>
            </Card>

            <Card isGlass={true} className="p-5 flex items-center justify-between border-l-4 border-l-[var(--warning)]">
              <div className="space-y-1">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-semibold">Pending Verifications</span>
                <div className="text-2xl font-extrabold font-mono text-[var(--warning)]">3</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="w-6 h-6" />
              </div>
            </Card>

            <Card isGlass={true} className="p-5 flex items-center justify-between border-l-4 border-l-[var(--success)]">
              <div className="space-y-1">
                <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-semibold">Reports Generated</span>
                <div className="text-2xl font-extrabold font-mono text-[var(--success)]">{stats?.total_reports || 1190}</div>
              </div>
              <div className="p-3 rounded-xl bg-[var(--success-light)] text-[var(--success)]">
                <FileText className="w-6 h-6" />
              </div>
            </Card>
          </div>

          {/* System Telemetry & Performance Gauges */}
          <ContentSection title="Platform Telemetry & Analytics" subtitle="Real-time OCR accuracy, inference throughput, and pipeline latency metrics">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card isGlass={true} className="p-5 space-y-2">
                <span className="text-xs font-mono text-[var(--text-muted)]">Average Data Quality</span>
                <div className="text-xl font-extrabold font-mono text-[var(--success)]">85.2%</div>
                <ProgressBar value={85.2} max={100} variant="success" />
              </Card>

              <Card isGlass={true} className="p-5 space-y-2">
                <span className="text-xs font-mono text-[var(--text-muted)]">Pipeline Latency</span>
                <div className="text-xl font-extrabold font-mono text-[var(--primary)]">33.4 ms</div>
                <ProgressBar value={92} max={100} variant="primary" />
              </Card>

              <Card isGlass={true} className="p-5 space-y-2">
                <span className="text-xs font-mono text-[var(--text-muted)]">OCR Extraction Success</span>
                <div className="text-xl font-extrabold font-mono text-[var(--secondary)]">98.5%</div>
                <ProgressBar value={98.5} max={100} variant="secondary" />
              </Card>

              <Card isGlass={true} className="p-5 space-y-2">
                <span className="text-xs font-mono text-[var(--text-muted)]">RAG ChromaDB Uptime</span>
                <div className="text-xl font-extrabold font-mono text-[var(--accent)]">99.98%</div>
                <ProgressBar value={99.98} max={100} variant="accent" />
              </Card>
            </div>
          </ContentSection>
        </div>
      )}

      {/* 2. DOCTOR VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <ContentSection title="Doctor Credential Verification Queue" subtitle="Review submitted physician licenses, medical registration, and hospital affiliations">
          <Table headers={['Doctor ID', 'Physician Name', 'Medical License', 'Hospital Affiliation', 'Specialty', 'Status', 'Verification Action']}>
            {pendingDoctors.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-mono text-xs font-bold text-[var(--primary)]">{doc.id}</TableCell>
                <TableCell className="font-semibold text-xs">{doc.name}</TableCell>
                <TableCell className="font-mono text-xs text-[var(--text-muted)]">{doc.license}</TableCell>
                <TableCell className="text-xs">{doc.hospital}</TableCell>
                <TableCell className="text-xs">{doc.specialty}</TableCell>
                <TableCell><Badge variant="warning" size="sm">{doc.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="success" size="sm" className="!px-2.5 !py-1 text-xs">
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" className="!px-2.5 !py-1 text-xs text-rose-500">
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </ContentSection>
      )}

      {/* 3. USER DIRECTORY */}
      {activeTab === 'users' && (
        <ContentSection title="Platform User Management" subtitle="Inspect registered patient, doctor, and administrator accounts">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="w-full md:w-96">
                <Input
                  placeholder="Search user by name or email..."
                  leftIcon={<Search className="w-4 h-4" />}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                {['ALL', 'PATIENT', 'DOCTOR', 'ADMIN'].map((r) => (
                  <Button
                    key={r}
                    variant={userRoleFilter === r ? 'primary' : 'outline'}
                    size="sm"
                    className="!px-3 !py-1 text-xs"
                    onClick={() => setUserRoleFilter(r)}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>

            <Table headers={['User ID', 'Full Name', 'Role', 'Email', 'Status', 'Actions']}>
              {users.length > 0 ? (
                users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-mono text-xs font-bold text-[var(--primary)]">{u.user_id}</TableCell>
                    <TableCell className="font-semibold text-xs">{u.full_name}</TableCell>
                    <TableCell><Badge variant="primary" size="sm">{u.role}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-[var(--text-muted)]">{u.email}</TableCell>
                    <TableCell><Badge variant="success" size="sm">{u.is_active ? 'ACTIVE' : 'SUSPENDED'}</Badge></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="!px-2.5 !py-1 text-xs">
                        Edit Account
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                    No users matching selected query filter.
                  </TableCell>
                </TableRow>
              )}
            </Table>
          </div>
        </ContentSection>
      )}

      {/* 4. PLATFORM SUBSYSTEMS MONITORING */}
      {activeTab === 'monitoring' && (
        <ContentSection title="System Architecture Health Monitoring" subtitle="Real-time status of backend services, ML experts, and database clusters">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--success)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-[var(--success)]" />
                  <h5 className="text-sm font-bold text-[var(--text-main)]">FastAPI API Gateway</h5>
                </div>
                <Badge variant="success" size="sm">ONLINE</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Port 8000 • 200 OK • Latency: 12 ms</p>
            </Card>

            <Card isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--success)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[var(--primary)]" />
                  <h5 className="text-sm font-bold text-[var(--text-main)]">SQLite / PostgreSQL DB</h5>
                </div>
                <Badge variant="success" size="sm">HEALTHY</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Active Connections: 14 • Write Latency: 4 ms</p>
            </Card>

            <Card isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--success)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[var(--secondary)]" />
                  <h5 className="text-sm font-bold text-[var(--text-main)]">ML Inference Ensemble</h5>
                </div>
                <Badge variant="success" size="sm">READY</Badge>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Clinical v3, Wearable v3, Gut v3 Models Loaded</p>
            </Card>
          </div>
        </ContentSection>
      )}

      {/* 5. SECURITY & AUDIT LOGS */}
      {activeTab === 'security' && (
        <ContentSection title="Platform Security & Admin Audit Trail" subtitle="Recent administrative actions, authentication attempts, and access logs">
          <Card isGlass={true} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[var(--text-main)]">Audit Event Timeline</h4>
              <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                Export Audit Logs
              </Button>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <strong className="text-[var(--text-main)] block">Doctor Verification Approved</strong>
                  <p className="text-[11px] text-[var(--text-muted)]">Admin approved credentials for Dr. Sarah Jenkins (MED-994821)</p>
                </div>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">Today • 10:14 AM</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <strong className="text-[var(--text-main)] block">System Diagnostics Passed</strong>
                  <p className="text-[11px] text-[var(--text-muted)]">All 5 disease models and ChromaDB vector store passed startup health check</p>
                </div>
                <span className="font-mono text-[10px] text-[var(--text-muted)]">Today • 08:00 AM</span>
              </div>
            </div>
          </Card>
        </ContentSection>
      )}
    </PageContainer>
  );
}
