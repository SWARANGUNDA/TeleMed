import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCircle2, Trash2, Calendar, Sparkles, FileText,
  MessageSquare, ShieldAlert, ArrowRight, X, Search, CheckCheck,
  Clock, Stethoscope, ChevronRight, Filter, ExternalLink, Zap
} from 'lucide-react';

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onMarkAllRead,
  onDelete,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Close on Escape key and lock background scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const showToast = (msg) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Category metadata helper (icons, gradients, labels)
  const getCategoryMeta = (cat = '') => {
    const c = cat.toLowerCase();
    if (c.includes('welcome') || c.includes('platform')) {
      return {
        icon: Sparkles,
        gradient: 'from-blue-600 to-indigo-600',
        lightBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        badge: 'Platform',
        defaultRoute: '/intake',
        defaultLabel: 'Start Intake'
      };
    }
    if (c.includes('ai') || c.includes('analysis') || c.includes('driver')) {
      return {
        icon: Sparkles,
        gradient: 'from-violet-600 to-indigo-600',
        lightBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
        badge: 'AI Insights',
        defaultRoute: '/report',
        defaultLabel: 'View Report'
      };
    }
    if (c.includes('appointment')) {
      return {
        icon: Calendar,
        gradient: 'from-amber-500 to-orange-600',
        lightBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        badge: 'Appointment',
        defaultRoute: '/appointments',
        defaultLabel: 'Appointments'
      };
    }
    if (c.includes('message') || c.includes('chat')) {
      return {
        icon: MessageSquare,
        gradient: 'from-emerald-600 to-teal-600',
        lightBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        badge: 'Doctor Chat',
        defaultRoute: '/messages',
        defaultLabel: 'Open Chat'
      };
    }
    if (c.includes('prescription') || c.includes('report') || c.includes('record')) {
      return {
        icon: FileText,
        gradient: 'from-cyan-600 to-blue-600',
        lightBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        badge: 'Health Records',
        defaultRoute: '/records',
        defaultLabel: 'Health Records'
      };
    }
    if (c.includes('consultation')) {
      return {
        icon: Stethoscope,
        gradient: 'from-blue-600 to-teal-600',
        lightBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        badge: 'Consultation',
        defaultRoute: '/consultations',
        defaultLabel: 'Join Session'
      };
    }
    return {
      icon: ShieldAlert,
      gradient: 'from-slate-700 to-slate-900',
      lightBg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
      badge: 'Alert',
      defaultRoute: '/dashboard',
      defaultLabel: 'View'
    };
  };

  // Filtered Notifications List
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = (n.title || '').toLowerCase();
        const d = (n.description || '').toLowerCase();
        const c = (n.category || '').toLowerCase();
        if (!t.includes(q) && !d.includes(q) && !c.includes(q)) return false;
      }

      if (activeFilter === 'UNREAD') return !n.isRead;
      if (activeFilter === 'HIGH') return n.priority === 'HIGH' || n.priority === 'URGENT';
      if (activeFilter === 'CLINICAL') {
        const c = (n.category || '').toLowerCase();
        return c.includes('ai') || c.includes('clinical') || c.includes('analysis') || c.includes('welcome') || c.includes('report');
      }
      if (activeFilter === 'APPOINTMENTS') {
        return (n.category || '').toLowerCase().includes('appointment');
      }
      if (activeFilter === 'MESSAGES') {
        return (n.category || '').toLowerCase().includes('message') || (n.category || '').toLowerCase().includes('chat');
      }

      return true;
    });
  }, [notifications, searchQuery, activeFilter]);

  // Handlers
  const handleActionClick = (n) => {
    if (!n.isRead && onMarkAsRead) {
      onMarkAsRead(n.id);
    }
    if (onClose) onClose();
    const meta = getCategoryMeta(n.category);
    const targetRoute = n.actionRoute || meta.defaultRoute || '/dashboard';
    navigate(targetRoute);
  };

  const handleMarkAll = () => {
    if (onMarkAllRead) {
      onMarkAllRead();
      showToast('All marked as read');
    }
  };

  const handleSingleRead = (id, e) => {
    if (e) e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(id);
      showToast('Marked as read');
    }
  };

  const handleDeleteItem = (id, e) => {
    if (e) e.stopPropagation();
    if (onDelete) {
      onDelete(id);
      showToast('Notification removed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-drawer)] flex justify-end">
      {/* Soft Dimmed Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in Modern Glass Panel */}
      <div className="relative w-full sm:w-[460px] md:w-[480px] h-full bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col z-10 overflow-hidden transform transition-all duration-300 ease-out animate-slide-left">

        {/* Top Radiant Accent Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shrink-0" />

        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-[var(--text-main)] tracking-tight">Notification Center</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                    unreadCount > 0
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}>
                    {unreadCount > 0 ? `${unreadCount} New` : 'All Caught Up'}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">Recent updates and clinical activity</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark All</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer group"
                title="Close (Esc)"
              >
                <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
            {[
              { id: 'ALL', label: `All (${notifications.length})` },
              { id: 'UNREAD', label: `Unread (${unreadCount})`, highlight: unreadCount > 0 },
              { id: 'HIGH', label: 'Priority' },
              { id: 'CLINICAL', label: 'Clinical & AI' },
              { id: 'APPOINTMENTS', label: 'Appointments' },
            ].map(tab => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.highlight && !active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Temporary Feedback Toast */}
        {feedbackToast && (
          <div className="mx-4 mt-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* ── NOTIFICATIONS LIST ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-0">
          {filteredNotifications.length === 0 ? (
            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center text-[var(--primary)] shadow-inner">
                <Bell className="w-7 h-7 opacity-75 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-[var(--text-main)]">
                  {searchQuery ? 'No Matching Notifications' : 'All Caught Up! 🎉'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] max-w-[260px] mx-auto leading-relaxed">
                  {searchQuery
                    ? `No notifications found matching "${searchQuery}".`
                    : 'You have no pending alerts. New clinical and appointment updates will appear here.'}
                </p>
              </div>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const meta = getCategoryMeta(n.category);
              const Icon = meta.icon;
              const actionLabel = n.actionLabel || meta.defaultLabel;

              return (
                <div
                  key={n.id}
                  className={`relative rounded-2xl border transition-all duration-200 overflow-hidden group ${
                    !n.isRead
                      ? 'bg-[var(--bg-surface)] border-[var(--primary)]/30 shadow-md shadow-blue-500/5 hover:border-[var(--primary)]'
                      : 'bg-[var(--bg-surface)]/70 border-[var(--border-subtle)] hover:border-[var(--border-medium)] opacity-90 hover:opacity-100'
                  }`}
                >
                  {/* Subtle Unread Left Indicator */}
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 via-indigo-500 to-cyan-400" />
                  )}

                  <div className="p-4 space-y-3">
                    {/* Header: Icon, Category Pill, Title, Priority */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${meta.gradient} text-white flex items-center justify-center shrink-0 shadow-md`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold uppercase tracking-wider border ${meta.lightBg}`}>
                              {meta.badge}
                            </span>
                            {!n.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Unread" />
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-[var(--text-main)] mt-1 leading-snug group-hover:text-[var(--primary)] transition-colors">
                            {n.title}
                          </h4>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[9.5px] font-mono font-bold tracking-wider uppercase border shrink-0 ${
                        n.priority === 'HIGH' || n.priority === 'URGENT'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                      }`}>
                        {n.priority || 'NORMAL'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed pl-12 font-medium">
                      {n.description}
                    </p>

                    {/* Footer Row: Timestamp & Interactive CTA Button */}
                    <div className="flex items-center justify-between pt-2 pl-12 border-t border-[var(--border-subtle)] text-[11px]">
                      <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-mono text-[10px]">
                        <Clock className="w-3 h-3" />
                        <span>{n.timestamp || 'Just now'}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        {/* Interactive CTA Pill */}
                        <button
                          onClick={() => handleActionClick(n)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer group/btn"
                        >
                          <span>{actionLabel}</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                        </button>

                        {!n.isRead && (
                          <button
                            onClick={(e) => handleSingleRead(n.id, e)}
                            className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors p-1 rounded hover:bg-[var(--primary-light)] cursor-pointer"
                            title="Mark as read"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={(e) => handleDeleteItem(n.id, e)}
                          className="text-[var(--text-muted)] hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-500/10 cursor-pointer"
                          title="Dismiss notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── FOOTER DOCK ───────────────────────────────────────────────────── */}
        <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <button
            onClick={() => {
              onClose();
              navigate('/notifications');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--primary)] bg-[var(--bg-primary)] hover:bg-[var(--primary-light)]/40 text-xs font-bold text-[var(--text-main)] hover:text-[var(--primary)] transition-all cursor-pointer shadow-xs group"
          >
            <span>Open Full Notification Center</span>
            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
