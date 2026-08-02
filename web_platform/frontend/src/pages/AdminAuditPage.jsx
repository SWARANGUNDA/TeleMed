import React, { useState } from 'react';
import { ShieldCheck, Download, Search, Filter, Clock, FileText } from 'lucide-react';
import { Button, Card, Badge, Table, TableRow, TableCell, Input } from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';

export default function AdminAuditPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const auditLogs = [
    { id: 'LOG-8819', action: 'Doctor Verification Approved', admin: 'admin@telemed.ai', target: 'Dr. Sarah Jenkins', timestamp: '2026-08-01 10:14 AM', severity: 'MEDIUM' },
    { id: 'LOG-8818', action: 'System Startup Diagnostics Passed', admin: 'SYSTEM', target: 'FastAPI Gateway', timestamp: '2026-08-01 08:00 AM', severity: 'LOW' },
    { id: 'LOG-8817', action: 'Doctor Credential Rejected', admin: 'admin@telemed.ai', target: 'Dr. John Doe', timestamp: '2026-07-31 04:22 PM', severity: 'HIGH' },
    { id: 'LOG-8816', action: 'User Account Suspended', admin: 'admin@telemed.ai', target: 'user_9941@patient.com', timestamp: '2026-07-30 02:15 PM', severity: 'HIGH' },
  ];

  const filteredLogs = auditLogs.filter((l) => {
    const matchesSearch = l.action.toLowerCase().includes(searchQuery.toLowerCase()) || l.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || l.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <PageContainer className="space-y-8 pb-24">
      <PageHeader
        title="Administrative Audit Trail & Security Logs"
        description="Immutable compliance audit log of user status changes, credential verifications, and system events"
        badge="HIPAA & GDPR Compliant Log"
        actions={
          <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
            Export Audit Logs (CSV / PDF)
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="w-full md:w-96">
          <Input
            placeholder="Search log by action or target..."
            leftIcon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((sev) => (
            <Button
              key={sev}
              variant={severityFilter === sev ? 'primary' : 'outline'}
              size="sm"
              className="!px-3 !py-1 text-xs"
              onClick={() => setSeverityFilter(sev)}
            >
              {sev}
            </Button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <ContentSection title={`System Audit Trail (${filteredLogs.length})`}>
        <Table headers={['Request / Log ID', 'Admin Action', 'Initiated By', 'Target Entity', 'Timestamp', 'Severity']}>
          {filteredLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-xs font-bold text-[var(--primary)]">{log.id}</TableCell>
              <TableCell className="font-semibold text-xs">{log.action}</TableCell>
              <TableCell className="font-mono text-xs text-[var(--text-muted)]">{log.admin}</TableCell>
              <TableCell className="text-xs">{log.target}</TableCell>
              <TableCell className="font-mono text-xs text-[var(--text-muted)]">{log.timestamp}</TableCell>
              <TableCell>
                <Badge variant={log.severity === 'HIGH' ? 'danger' : log.severity === 'MEDIUM' ? 'warning' : 'success'} size="sm">
                  {log.severity}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      </ContentSection>
    </PageContainer>
  );
}
