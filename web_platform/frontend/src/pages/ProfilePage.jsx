import React, { useState } from 'react';
import { PageHeader, PageContainer, ContentSection } from '../components/layout';
import { Card, Badge, Button, ProgressBar, Input, Modal, Tabs, Table, EmptyState } from '../components/ui';
import {
  User, ShieldCheck, Activity, Heart, FileText, Watch, Dna, Clock,
  Search, Filter, Download, Eye, Edit3, Calendar, Phone, Mail, MapPin,
  Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, ChevronRight
} from 'lucide-react';

export default function ProfilePage({ user, session, predictionData, onNavigate }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [vaultCategory, setVaultCategory] = useState('ALL');
  const [vaultSearchQuery, setVaultSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  // Editable Patient Info State
  const [patientInfo, setPatientInfo] = useState({
    fullName: user?.name || 'Alexander Wright',
    patientId: user?.id ? `PAT-${user.id}` : 'PAT-2026-8819',
    email: user?.email || 'alexander.wright@healthmail.com',
    phone: '+1 (555) 234-5678',
    dob: '1984-06-15',
    gender: 'Male',
    height: '178 cm',
    weight: '76 kg',
    bmi: '24.0 (Normal)',
    bloodGroup: 'O Positive (O+)',
    emergencyContact: 'Sarah Wright (Spouse) - +1 (555) 987-6543',
    completionRate: 85,
  });

  // Health Snapshot Vitals Data
  const healthSnapshot = [
    { label: 'Blood Pressure', value: '122/80 mmHg', status: 'Optimal', variant: 'success', icon: Heart },
    { label: 'Fasting Glucose', value: '105 mg/dL', status: 'Slightly Elevated', variant: 'warning', icon: Activity },
    { label: 'HbA1c', value: '5.8 %', status: 'Pre-diabetic Zone', variant: 'warning', icon: Activity },
    { label: 'Total Cholesterol', value: '192 mg/dL', status: 'Desirable', variant: 'success', icon: Heart },
    { label: 'BMI', value: '24.0 kg/m²', status: 'Healthy Weight', variant: 'success', icon: User },
    { label: 'Resting Heart Rate', value: '68 bpm', status: 'Optimal', variant: 'success', icon: Watch },
    { label: 'Sleep Efficiency', value: '86.4 %', status: 'Good', variant: 'success', icon: Watch },
    { label: 'Daily Step Count', value: '8,420 steps', status: 'Active Target', variant: 'primary', icon: Watch },
  ];

  // Health Timeline Events
  const timelineEvents = [
    {
      id: 'evt-1',
      date: '2026-08-01 14:30',
      title: 'Multimodal AI Disease Analysis Executed',
      category: 'AI Analysis',
      desc: 'Hierarchical ensemble evaluated Clinical, Wearable, and Gut Microbiome signals. Overall risk probability score: 34.2%.',
      icon: Sparkles,
      color: 'text-[var(--primary)]',
    },
    {
      id: 'evt-2',
      date: '2026-07-28 11:15',
      title: 'Physician Consultation Finalized',
      category: 'Doctor Review',
      desc: 'Dr. Marcus Vance reviewed TreeSHAP biomarker drivers and signed off on glycemic lifestyle recommendations.',
      icon: ShieldCheck,
      color: 'text-[var(--secondary)]',
    },
    {
      id: 'evt-3',
      date: '2026-07-25 09:00',
      title: 'Laboratory Diagnostic PDF Uploaded',
      category: 'Document Upload',
      desc: 'Quest Diagnostics Comprehensive Metabolic Panel (CMP) parsed via hybrid Tesseract OCR engine (22 variables extracted).',
      icon: FileText,
      color: 'text-[var(--accent)]',
    },
    {
      id: 'evt-4',
      date: '2026-07-20 18:45',
      title: 'Wearable Telemetry Sync Completed',
      category: 'Wearable Sync',
      desc: '15-dimensional continuous sensor telemetry metrics synced (RHR, HRV RMSSD, Circadian Sleep Fragmentation).',
      icon: Watch,
      color: 'text-amber-500',
    },
  ];

  // Assessment History Records
  const assessmentHistory = [
    {
      id: 'ASM-2026-8819',
      date: '2026-08-01',
      diseases: 'Type 2 Diabetes, Metabolic Dysbiosis',
      risk: 'MODERATE RISK (34.2%)',
      riskVariant: 'warning',
      confidence: '94.2%',
      pathway: 'C + W + G',
    },
    {
      id: 'ASM-2026-7412',
      date: '2026-06-14',
      diseases: 'Type 2 Diabetes',
      risk: 'LOW RISK (18.5%)',
      riskVariant: 'success',
      confidence: '92.8%',
      pathway: 'Clinical + Wearable',
    },
    {
      id: 'ASM-2026-5201',
      date: '2026-04-02',
      diseases: 'Type 2 Diabetes, Cardiopulmonary',
      risk: 'HIGH RISK (68.0%)',
      riskVariant: 'danger',
      confidence: '96.1%',
      pathway: 'Clinical Only',
    },
  ];

  const filteredHistory = assessmentHistory.filter((item) =>
    item.id.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
    item.diseases.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  // Health Vault Documents
  const vaultDocuments = [
    {
      id: 'DOC-101',
      name: 'Quest_Diagnostics_Lab_Report_2026.pdf',
      type: 'Clinical Reports',
      date: '2026-07-25',
      size: '2.4 MB',
      status: 'OCR Verified',
    },
    {
      id: 'DOC-102',
      name: 'Fitbit_Wearable_Telemetry_30Days.csv',
      type: 'Wearable Data',
      date: '2026-07-20',
      size: '1.8 MB',
      status: 'Synced',
    },
    {
      id: 'DOC-103',
      name: 'Gut_Microbiome_16S_Sequencing.json',
      type: 'Gut Reports',
      date: '2026-07-15',
      size: '4.1 MB',
      status: 'Parsed',
    },
    {
      id: 'DOC-104',
      name: 'TeleMed_AI_Comprehensive_Report_ASM8819.pdf',
      type: 'AI Reports',
      date: '2026-08-01',
      size: '3.6 MB',
      status: 'Generated',
    },
    {
      id: 'DOC-105',
      name: 'Dr_Vance_Consultation_Prescription.pdf',
      type: 'Doctor Reports',
      date: '2026-07-28',
      size: '1.2 MB',
      status: 'Signed',
    },
  ];

  const filteredVault = vaultDocuments.filter((doc) => {
    const matchesCat = vaultCategory === 'ALL' || doc.type === vaultCategory;
    const matchesSearch = doc.name.toLowerCase().includes(vaultSearchQuery.toLowerCase()) ||
                          doc.type.toLowerCase().includes(vaultSearchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    setIsEditModalOpen(false);
  };

  return (
    <PageContainer className="space-y-8 py-6">
      
      {/* Top Header */}
      <PageHeader
        title="Patient Workspace & Health Profile"
        description="Manage your clinical profile, health summaries, assessment history, and secure health vault"
        badge="Patient Portal"
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Edit3 className="w-4 h-4" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>
        }
      />

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column — Patient Demographics & Profile Summary */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Demographics Card */}
          <Card isGlass={true} className="p-6 space-y-6 shadow-xl border-t-4 border-t-[var(--primary)]">
            <div className="text-center space-y-3">
              <div className="relative w-24 h-24 mx-auto">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--secondary)] text-white font-extrabold text-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                  {patientInfo.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[var(--success)] text-white border-2 border-[var(--bg-surface)]" title="Verified Active Account">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-[var(--text-main)] tracking-tight">{patientInfo.fullName}</h2>
                <span className="text-xs font-mono text-[var(--primary)] font-bold block">{patientInfo.patientId}</span>
              </div>
            </div>

            {/* Profile Completion Bar */}
            <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[var(--text-muted)]">Profile Completion</span>
                <span className="text-[var(--primary)]">{patientInfo.completionRate}%</span>
              </div>
              <ProgressBar value={patientInfo.completionRate} max={100} variant="primary" />
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">DOB / Age</span>
                <strong className="text-[var(--text-main)]">{patientInfo.dob} (42 yrs)</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Gender</span>
                <strong className="text-[var(--text-main)]">{patientInfo.gender}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Height & Weight</span>
                <strong className="text-[var(--text-main)]">{patientInfo.height}, {patientInfo.weight}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Blood Group</span>
                <strong className="text-[var(--text-main)]">{patientInfo.bloodGroup}</strong>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)] text-xs">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Mail className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span className="truncate">{patientInfo.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Phone className="w-4 h-4 text-[var(--secondary)] shrink-0" />
                <span>{patientInfo.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">{patientInfo.emergencyContact}</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions Card */}
          <Card isGlass={true} className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-between"
                onClick={() => onNavigate ? onNavigate('intake') : null}
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
              >
                Start New AI Intake
              </Button>
              <Button
                variant="outline"
                size="md"
                className="w-full justify-between"
                onClick={() => onNavigate ? onNavigate('consultations') : null}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Schedule Doctor Consultation
              </Button>
            </div>
          </Card>

        </div>

        {/* Right Column — Tabbed Content Areas */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Navigation Tabs */}
          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'summary', label: 'Health Summary' },
              { id: 'snapshot', label: 'Vitals Snapshot' },
              { id: 'timeline', label: 'Health Timeline' },
              { id: 'history', label: 'Assessment History' },
              { id: 'vault', label: 'Health Vault' },
            ]}
          />

          {/* TAB 1: HEALTH SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                <Card isGlass={true} className="p-5 space-y-2 border-l-4 border-l-[var(--success)]">
                  <span className="text-xs font-mono text-[var(--text-muted)] uppercase">Overall Health Score</span>
                  <div className="text-3xl font-extrabold font-mono text-[var(--success)]">88 / 100</div>
                  <p className="text-[11px] text-[var(--text-muted)]">Optimal metabolic trajectory</p>
                </Card>

                <Card isGlass={true} className="p-5 space-y-2 border-l-4 border-l-[var(--warning)]">
                  <span className="text-xs font-mono text-[var(--text-muted)] uppercase">Active Disease Risk</span>
                  <div className="text-xl font-bold text-[var(--warning)]">MODERATE RISK</div>
                  <p className="text-[11px] text-[var(--text-muted)]">Type 2 Diabetes (34.2%)</p>
                </Card>

                <Card isGlass={true} className="p-5 space-y-2 border-l-4 border-l-[var(--primary)]">
                  <span className="text-xs font-mono text-[var(--text-muted)] uppercase">Latest AI Confidence</span>
                  <div className="text-3xl font-extrabold font-mono text-[var(--primary)]">94.2%</div>
                  <p className="text-[11px] text-[var(--text-muted)]">Pathway: C + W + G</p>
                </Card>

              </div>

              {/* Comprehensive Health Summary Description Card */}
              <Card isGlass={true} className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                    <h3 className="text-base font-bold text-[var(--text-main)]">Clinical Assessment Overview</h3>
                  </div>
                  <Badge variant="primary" size="sm">Last Sync: Aug 1, 2026</Badge>
                </div>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Your recent multimodal analysis indicates stable cardiac telemetry and normal renal parameters. Primary risk contributions stem from slightly elevated glycated hemoglobin (HbA1c: 5.8%) and reduced heart rate variability (HRV RMSSD: 28ms). Physician review recommended lifestyle modifications and short-chain fatty acid gut optimization.
                </p>
              </Card>
            </div>
          )}

          {/* TAB 2: VITALS SNAPSHOT */}
          {activeTab === 'snapshot' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              {healthSnapshot.map((vit, idx) => {
                const Icon = vit.icon;
                return (
                  <Card key={idx} isGlass={true} className="p-5 space-y-2 hover:border-[var(--primary)] transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-[var(--primary)]" />
                        <span className="text-xs font-semibold text-[var(--text-muted)]">{vit.label}</span>
                      </div>
                      <Badge variant={vit.variant} size="sm">{vit.status}</Badge>
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-[var(--text-main)]">{vit.value}</div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* TAB 3: HEALTH TIMELINE */}
          {activeTab === 'timeline' && (
            <Card isGlass={true} className="p-6 space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-[var(--text-main)]">Chronological Health Timeline</h3>
              <div className="space-y-6 relative border-l-2 border-[var(--border-subtle)] ml-3 pl-6">
                {timelineEvents.map((evt) => {
                  const Icon = evt.icon;
                  return (
                    <div key={evt.id} className="relative group">
                      <div className="absolute -left-[31px] top-0 p-1.5 rounded-full bg-[var(--bg-surface)] border-2 border-[var(--primary)] text-[var(--primary)] shadow-sm">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[var(--text-main)]">{evt.title}</h4>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">{evt.date}</span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{evt.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* TAB 4: ASSESSMENT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Search assessment history by ID or disease..."
                  leftIcon={<Search className="w-4 h-4" />}
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="flex-1"
                />
              </div>

              {filteredHistory.length === 0 ? (
                <EmptyState
                  title="No Assessments Found"
                  description="No historical disease assessments match your search criteria."
                  icon={<FileText className="w-8 h-8 text-[var(--text-muted)]" />}
                />
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((item) => (
                    <Card key={item.id} isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--primary)] hover:shadow-lg transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                        <div>
                          <strong className="text-sm font-mono text-[var(--primary)]">{item.id}</strong>
                          <span className="text-xs text-[var(--text-muted)] ml-3">Date: {item.date}</span>
                        </div>
                        <Badge variant={item.riskVariant} size="sm">{item.risk}</Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Diseases Evaluated</span>
                          <span className="font-semibold text-[var(--text-main)]">{item.diseases}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Model Confidence</span>
                          <span className="font-mono font-bold text-[var(--text-main)]">{item.confidence}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-muted)] block text-[10px] uppercase font-mono">Modality Pathway</span>
                          <span className="font-mono text-[var(--secondary)]">{item.pathway}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => onNavigate ? onNavigate('results') : null}>
                          View XAI Drivers
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => onNavigate ? onNavigate('report') : null}>
                          View Clinical Report
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HEALTH VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Search health documents..."
                  leftIcon={<Search className="w-4 h-4" />}
                  value={vaultSearchQuery}
                  onChange={(e) => setVaultSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={vaultCategory}
                  onChange={(e) => setVaultCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-medium"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Clinical Reports">Clinical Reports</option>
                  <option value="Wearable Data">Wearable Data</option>
                  <option value="Gut Reports">Gut Reports</option>
                  <option value="AI Reports">AI Reports</option>
                  <option value="Doctor Reports">Doctor Reports</option>
                </select>
              </div>

              {filteredVault.length === 0 ? (
                <EmptyState
                  title="No Documents in Health Vault"
                  description="No uploaded laboratory reports or generated PDFs match your filter criteria."
                  icon={<FileText className="w-8 h-8 text-[var(--text-muted)]" />}
                />
              ) : (
                <Card isGlass={true} className="p-4 shadow-lg">
                  <div className="space-y-3">
                    {filteredVault.map((doc) => (
                      <div key={doc.id} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--primary)] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <strong className="text-xs font-bold text-[var(--text-main)] block truncate max-w-[240px] sm:max-w-[320px]">{doc.name}</strong>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                              <span>{doc.type}</span>
                              <span>•</span>
                              <span>{doc.date}</span>
                              <span>•</span>
                              <span>{doc.size}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="success" size="sm">{doc.status}</Badge>
                          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                            Preview
                          </Button>
                          <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Patient Demographics & Profile"
      >
        <form onSubmit={handleProfileSave} className="space-y-4">
          <Input
            label="Full Name"
            value={patientInfo.fullName}
            onChange={(e) => setPatientInfo({ ...patientInfo, fullName: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date of Birth"
              type="date"
              value={patientInfo.dob}
              onChange={(e) => setPatientInfo({ ...patientInfo, dob: e.target.value })}
              required
            />
            <Input
              label="Gender"
              value={patientInfo.gender}
              onChange={(e) => setPatientInfo({ ...patientInfo, gender: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Height"
              value={patientInfo.height}
              onChange={(e) => setPatientInfo({ ...patientInfo, height: e.target.value })}
            />
            <Input
              label="Weight"
              value={patientInfo.weight}
              onChange={(e) => setPatientInfo({ ...patientInfo, weight: e.target.value })}
            />
          </div>
          <Input
            label="Emergency Contact"
            value={patientInfo.emergencyContact}
            onChange={(e) => setPatientInfo({ ...patientInfo, emergencyContact: e.target.value })}
          />

          <div className="pt-4 flex justify-end gap-3 border-t border-[var(--border-subtle)]">
            <Button variant="outline" size="md" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

    </PageContainer>
  );
}
