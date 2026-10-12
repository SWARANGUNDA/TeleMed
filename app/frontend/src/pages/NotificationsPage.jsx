import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageContainer } from '../components/layout';
import { Card, Badge, Button, Tabs, EmptyState, Modal } from '../components/ui';
import {
  Bell, CheckCircle2, Trash2, Calendar, Sparkles, FileText, MessageSquare,
  ShieldAlert, Settings, Clock, Filter, Check, ShieldCheck, Mail, Send, Pill, UserCheck, ExternalLink,
  ArrowRight, Zap
} from 'lucide-react';
import { fetchPatientRecords, fetchPatientConsultations } from '../api/client';
import { notificationStore } from '../utils/notificationStore';

export default function NotificationsPage({ user, predictionData }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedNotif, setSelectedNotif] = useState(null);
  const targetUserId = user?.user_id || 'default_user';
  const [notificationsList, setNotificationsList] = useState(() => notificationStore.getNotifications(targetUserId));
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const syncNotifications = () => {
      setNotificationsList(notificationStore.getNotifications(targetUserId));
    };
    window.addEventListener('telemed_notifications_updated', syncNotifications);
    return () => window.removeEventListener('telemed_notifications_updated', syncNotifications);
  }, [targetUserId]);

  // Preferences Toggles State
  const [preferences, setPreferences] = useState({
    reminders: true,
    aiReports: true,
    doctorMessages: true,
    systemAnnouncements: true,
    emailAlerts: true,
    pushNotifications: false,
  });

  const handleMarkAsRead = (id) => {
    const updated = notificationStore.markAsRead(id, targetUserId);
    setNotificationsList(updated);
  };

  const handleOpenNotification = (notif) => {
    setSelectedNotif(notif);
    handleMarkAsRead(notif.id);
  };

  const handleMarkAllRead = () => {
    const updated = notificationStore.markAllAsRead(targetUserId);
    setNotificationsList(updated);
    setStatusMessage('All notifications marked as read.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    const updated = notificationStore.deleteNotification(id, targetUserId);
    setNotificationsList(updated);
    if (selectedNotif?.id === id) {
      setSelectedNotif(null);
    }
  };

  const filteredNotifications = notificationsList.filter(n => {
    const matchesTab = activeTab === 'all' || (activeTab === 'unread' && !n.isRead);
    const matchesCat = categoryFilter === 'ALL' || n.category === categoryFilter;
    return matchesTab && matchesCat;
  });

  const unreadCount = notificationsList.filter(n => !n.isRead).length;

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Appointments': return Calendar;
      case 'AI Analysis': return Sparkles;
      case 'Reports': return FileText;
      case 'Messages': return MessageSquare;
      case 'Prescriptions': return Pill;
      default: return ShieldAlert;
    }
  };

  return (
    <PageContainer className="space-y-4 py-4">
      
      {/* Header */}
      <PageHeader
        title="Notification Center & Alert Settings"
        description="Real-time clinical alerts, AI assessment updates, physician messages, and communication preferences"
        badge="Communication Hub"
        actions={
          <Button variant="outline" size="sm" leftIcon={<CheckCircle2 className="w-4 h-4" />} onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        }
      />

      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'all', label: `All Alerts (${notificationsList.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'preferences', label: 'Alert Preferences' },
        ]}
      />

      {/* TABS 1 & 2: CLICKABLE COMPACT NOTIFICATIONS LIST */}
      {(activeTab === 'all' || activeTab === 'unread') && (
        <div className="space-y-4 animate-fade-in">
          
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'ALL', label: 'All Categories', icon: Filter },
              { id: 'AI Analysis', label: 'AI Analysis', icon: Sparkles },
              { id: 'Prescriptions', label: 'Prescriptions', icon: Pill },
              { id: 'Messages', label: 'Messages', icon: MessageSquare },
              { id: 'Appointments', label: 'Appointments', icon: Calendar },
              { id: 'Reports', label: 'Reports', icon: FileText },
            ].map(cat => {
              const active = categoryFilter === cat.id;
              const CatIcon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]'
                  }`}
                >
                  <CatIcon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {filteredNotifications.length === 0 ? (
            <Card isGlass={true} className="p-12 text-center space-y-3 border border-[var(--border-subtle)] rounded-3xl">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center text-[var(--primary)] mx-auto">
                <Bell className="w-7 h-7 opacity-75" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[var(--text-main)]">No Notifications Found</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                  {categoryFilter !== 'ALL'
                    ? `No notifications currently match category "${categoryFilter}".`
                    : 'You have no notifications pending in this view.'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((n) => {
                const Icon = getCategoryIcon(n.category);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleOpenNotification(n)}
                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 space-y-3 group overflow-hidden ${
                      !n.isRead
                        ? 'bg-[var(--bg-surface)] border-[var(--primary)]/30 shadow-md shadow-blue-500/5 hover:border-[var(--primary)] hover:shadow-lg'
                        : 'bg-[var(--bg-surface)]/70 border-[var(--border-subtle)] hover:border-[var(--border-medium)] opacity-90 hover:opacity-100'
                    }`}
                  >
                    {/* Unread Left Glowing Accent Bar */}
                    {!n.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 via-indigo-500 to-cyan-400" />
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {n.category}
                            </span>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" title="Unread" />
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors mt-1">
                            {n.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold tracking-wider uppercase border shrink-0 ${
                          n.priority === 'HIGH' || n.priority === 'URGENT'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                        }`}>
                          {n.priority || 'NORMAL'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--text-muted)] leading-relaxed pl-12 font-medium">
                      {n.description}
                    </p>

                    {/* Footer Row: Timestamp & Interactive CTA Button */}
                    <div className="flex items-center justify-between pt-2 pl-12 border-t border-[var(--border-subtle)] text-[11px]">
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-[10px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{n.timestamp || 'Just now'}</span>
                      </div>

                      <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                        {(n.actionRoute || n.category === 'Welcome') && (
                          <button
                            onClick={() => {
                              handleMarkAsRead(n.id);
                              navigate(n.actionRoute || '/intake');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer group/btn"
                          >
                            <Zap className="w-3 h-3 text-cyan-200" />
                            <span>{n.actionLabel || 'Start Intake'}</span>
                            <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                          </button>
                        )}

                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-1.5 rounded-lg hover:bg-[var(--primary-light)] cursor-pointer"
                            title="Mark as read"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDelete(n.id, e)}
                          className="text-[var(--text-muted)] hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALERT PREFERENCES */}
      {activeTab === 'preferences' && (
        <Card isGlass={true} className="p-6 md:p-8 space-y-6 animate-fade-in shadow-xl max-w-3xl border border-[var(--border-subtle)] rounded-3xl">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-main)]">Alert Notification Settings</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Configure real-time teleconsultation and AI report channels</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              ACTIVE
            </span>
          </div>

          <div className="space-y-3">
            {[
              { id: 'reminders', label: 'Appointment Reminders', desc: 'Receive alerts 24 hours & 30 mins before teleconsultations' },
              { id: 'aiReports', label: 'AI Report Completion', desc: 'Alert when multimodal predictions & TreeSHAP drivers finish' },
              { id: 'doctorMessages', label: 'Physician Direct Messages', desc: 'Notify when your doctor sends a new message or prescription' },
              { id: 'systemAnnouncements', label: 'System & Maintenance Updates', desc: 'Platform feature updates & compliance logs' },
              { id: 'emailAlerts', label: 'Email Notifications', desc: 'Send summary alerts to registered email address' },
              { id: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push alerts when platform is running' },
            ].map((pref) => (
              <div key={pref.id} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] hover:border-[var(--primary)]/40 transition-all">
                <div className="pr-4">
                  <strong className="text-xs font-bold text-[var(--text-main)] block">{pref.label}</strong>
                  <span className="text-[11px] text-[var(--text-muted)] mt-0.5 block">{pref.desc}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={preferences[pref.id]}
                  onClick={() => setPreferences({ ...preferences, [pref.id]: !preferences[pref.id] })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    preferences[pref.id] ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      preferences[pref.id] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* NOTIFICATION DETAIL DIALOG MODAL */}
      {selectedNotif && (
        <Modal
          isOpen={!!selectedNotif}
          onClose={() => setSelectedNotif(null)}
          title={selectedNotif.title}
          className="max-w-lg border border-[var(--border-subtle)] shadow-2xl rounded-3xl"
        >
          <div className="space-y-4 p-1 text-xs">
            
            {/* Category & Priority Badge Header */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {selectedNotif.category}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase border ${
                  selectedNotif.priority === 'HIGH' || selectedNotif.priority === 'URGENT'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                }`}>
                  {selectedNotif.priority || 'NORMAL'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {selectedNotif.timestamp}
              </span>
            </div>

            {/* Detailed Content */}
            <div className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 text-xs leading-relaxed">
              <p className="text-[var(--text-main)] font-medium">{selectedNotif.description}</p>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(selectedNotif.id)}
                className="text-rose-500 border-rose-500/30 hover:bg-rose-500/10 rounded-xl"
              >
                Delete Alert
              </Button>

              <div className="flex items-center gap-2">
                {selectedNotif.actionRoute && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="rounded-xl shadow-md shadow-blue-500/20"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    onClick={() => {
                      let route = selectedNotif.actionRoute;
                      if (user?.role === 'DOCTOR' && route === '/intake') route = '/doctor/dashboard';
                      if (user?.role === 'ADMIN' && route === '/intake') route = '/admin/dashboard';
                      setSelectedNotif(null);
                      navigate(route);
                    }}
                  >
                    {user?.role === 'DOCTOR' && selectedNotif.actionRoute === '/intake'
                      ? 'Open Doctor Dashboard'
                      : user?.role === 'ADMIN' && selectedNotif.actionRoute === '/intake'
                      ? 'Open Admin Overview'
                      : selectedNotif.actionLabel || 'Open Workspace'}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setSelectedNotif(null)}
                >
                  Close
                </Button>
              </div>
            </div>

          </div>
        </Modal>
      )}

    </PageContainer>
  );
}
