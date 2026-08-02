import React, { useState } from 'react';
import { PageHeader, PageContainer } from '../components/layout';
import { Card, Badge, Button, Tabs, EmptyState } from '../components/ui';
import {
  Bell, CheckCircle2, Trash2, Calendar, Sparkles, FileText, MessageSquare,
  ShieldAlert, Settings, Clock, Filter, Check, ShieldCheck, Mail, Send
} from 'lucide-react';

export default function NotificationsPage({ user }) {
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Initial Notifications Data
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 'NOT-101',
      category: 'Appointments',
      title: 'Teleconsultation Tomorrow',
      description: 'Your scheduled video consultation with Dr. Marcus Vance, MD is tomorrow at 10:00 AM.',
      timestamp: '10 minutes ago',
      priority: 'HIGH',
      isRead: false,
    },
    {
      id: 'NOT-102',
      category: 'AI Analysis',
      title: 'Multimodal AI Analysis Complete',
      description: 'Hierarchical Stacking Ensemble evaluated your laboratory PDF and wearable metrics. Risk probability: 34.2%.',
      timestamp: '1 hour ago',
      priority: 'HIGH',
      isRead: false,
    },
    {
      id: 'NOT-103',
      category: 'Reports',
      title: 'Printable Clinical Report Ready',
      description: 'Your hospital-grade diagnostic report (ASM-2026-8819) with QR code verification is available.',
      timestamp: '3 hours ago',
      priority: 'MEDIUM',
      isRead: true,
    },
    {
      id: 'NOT-104',
      category: 'Messages',
      title: 'New Message from Dr. Marcus Vance',
      description: '"Please ensure you continue monitoring morning fasting glucose levels before our call."',
      timestamp: 'Yesterday',
      priority: 'MEDIUM',
      isRead: true,
    },
    {
      id: 'NOT-105',
      category: 'System',
      title: 'Platform Maintenance Notice',
      description: 'Scheduled database indexing completed cleanly in 4ms with 99.98% system uptime.',
      timestamp: '2 days ago',
      priority: 'LOW',
      isRead: true,
    },
  ]);

  // Preferences Toggles
  const [preferences, setPreferences] = useState({
    reminders: true,
    aiReports: true,
    doctorMessages: true,
    systemAnnouncements: true,
    emailAlerts: true,
    pushNotifications: false,
  });

  const handleMarkAsRead = (id) => {
    setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotificationsList(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = (id) => {
    setNotificationsList(prev => prev.filter(n => n.id !== id));
  };

  const filteredNotifications = notificationsList.filter(n => {
    const matchesTab = activeTab === 'all' || (activeTab === 'unread' && !n.isRead);
    const matchesCat = categoryFilter === 'ALL' || n.category === categoryFilter;
    return matchesTab && matchesCat;
  });

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Appointments': return Calendar;
      case 'AI Analysis': return Sparkles;
      case 'Reports': return FileText;
      case 'Messages': return MessageSquare;
      default: return ShieldAlert;
    }
  };

  return (
    <PageContainer className="space-y-8 py-6">
      
      {/* Header */}
      <PageHeader
        title="Notification Center & Alert Settings"
        description="View real-time teleconsultation alerts, AI analysis updates, doctor messages, and notification preferences"
        badge="Communication Hub"
        actions={
          <Button variant="outline" size="md" leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'all', label: `All Notifications (${notificationsList.length})` },
          { id: 'unread', label: `Unread (${notificationsList.filter(n => !n.isRead).length})` },
          { id: 'preferences', label: 'Alert Preferences' },
        ]}
      />

      {/* TABS 1 & 2: NOTIFICATIONS LIST */}
      {(activeTab === 'all' || activeTab === 'unread') && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Category Filter Bar */}
          <div className="flex items-center justify-between bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-subtle)]">
            <span className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">Filter Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-semibold"
            >
              <option value="ALL">All Categories</option>
              <option value="Appointments">Appointments</option>
              <option value="AI Analysis">AI Analysis</option>
              <option value="Reports">Reports</option>
              <option value="Messages">Messages</option>
              <option value="System">System</option>
            </select>
          </div>

          {filteredNotifications.length === 0 ? (
            <EmptyState
              title="No Notifications Found"
              description="No alerts match your selected tab or category filter."
              icon={<Bell className="w-8 h-8 text-[var(--text-muted)]" />}
            />
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((n) => {
                const Icon = getCategoryIcon(n.category);
                return (
                  <Card
                    key={n.id}
                    isGlass={true}
                    className={`p-5 space-y-3 transition-all ${
                      !n.isRead
                        ? 'border-l-4 border-l-[var(--primary)] bg-[var(--primary-light)]/20 shadow-md'
                        : 'border-l-4 border-l-[var(--border-subtle)] opacity-85'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <Badge variant="secondary" size="sm">{n.category}</Badge>
                          <h3 className="text-sm font-bold text-[var(--text-main)] mt-0.5">{n.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={n.priority === 'HIGH' ? 'danger' : 'warning'} size="sm">
                          {n.priority} PRIORITY
                        </Badge>
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">{n.timestamp}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-main)] leading-relaxed">{n.description}</p>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">ID: {n.id}</span>
                      <div className="flex items-center gap-2">
                        {!n.isRead && (
                          <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(n.id)}>
                            Mark Read
                          </Button>
                        )}
                        <Button variant="outline" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => handleDelete(n.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NOTIFICATION PREFERENCES */}
      {activeTab === 'preferences' && (
        <Card isGlass={true} className="p-6 space-y-6 animate-fade-in shadow-xl max-w-3xl">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-main)]">Alert Notification Settings</h3>
              <p className="text-xs text-[var(--text-muted)]">Configure how and when TeleMed AI notifies you</p>
            </div>
            <Badge variant="primary" size="sm">Saved</Badge>
          </div>

          <div className="space-y-4 text-xs">
            {[
              { id: 'reminders', label: 'Appointment Reminders', desc: 'Receive alerts 24 hours & 30 mins before teleconsultations' },
              { id: 'aiReports', label: 'AI Report Completion', desc: 'Alert when multimodal predictions & TreeSHAP drivers finish' },
              { id: 'doctorMessages', label: 'Physician Direct Messages', desc: 'Notify when your doctor sends a new message or prescription' },
              { id: 'systemAnnouncements', label: 'System & Maintenance Updates', desc: 'Platform feature updates & compliance logs' },
              { id: 'emailAlerts', label: 'Email Notifications', desc: 'Send summary alerts to registered email address' },
              { id: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push alerts when platform is running' },
            ].map((pref) => (
              <div key={pref.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <div>
                  <strong className="text-xs text-[var(--text-main)] block">{pref.label}</strong>
                  <span className="text-[11px] text-[var(--text-muted)]">{pref.desc}</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences[pref.id]}
                  onChange={(e) => setPreferences({ ...preferences, [pref.id]: e.target.checked })}
                  className="w-4 h-4 rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

    </PageContainer>
  );
}
