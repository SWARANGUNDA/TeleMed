import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  Shield,
  Menu,
  Activity,
  UserCheck,
  ChevronRight
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import NotificationDrawer from '../NotificationDrawer';
import { notificationStore } from '../../utils/notificationStore';

export function Topbar({ user, onLogout, onToggleTheme, theme = 'dark', onOpenMobileMenu, className = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [, setTick] = useState(0);
  const userId = user?.user_id || 'default_user';
  const [unreadBadgeCount, setUnreadBadgeCount] = useState(() => notificationStore.getUnreadCount(userId));

  useEffect(() => {
    const handleProfileUpdate = () => setTick(t => t + 1);
    const handleNotifUpdate = () => {
      setUnreadBadgeCount(notificationStore.getUnreadCount(userId));
    };

    window.addEventListener('telemed_profile_updated', handleProfileUpdate);
    window.addEventListener('telemed_notifications_updated', handleNotifUpdate);
    return () => {
      window.removeEventListener('telemed_profile_updated', handleProfileUpdate);
      window.removeEventListener('telemed_notifications_updated', handleNotifUpdate);
    };
  }, [userId]);

  // Click outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return ['Overview'];
    if (path === '/intake') return ['Intake', 'New Multimodal Analysis'];
    if (path === '/xai') return ['Analytics', 'XAI Driver Analysis'];
    if (path === '/results') return ['Research & Benchmarks', 'Model Results & Evaluation'];
    if (path === '/report') return ['Reports', 'Comprehensive Diagnostic Report'];
    if (path === '/records') return ['Records', 'Health History'];
    if (path === '/consultations') return ['Clinical', 'Doctor Consultations'];
    if (path === '/appointments') return ['Schedule', 'Appointments'];
    if (path === '/care') return ['Care', 'Personalized Recommendations'];
    if (path === '/compare') return ['Analytics', 'Compare & Analytics'];
    if (path === '/messages') return ['Communication', 'Doctor Chat'];
    if (path === '/notifications') return ['Alerts', 'Notification Center'];
    if (path === '/account' || path === '/profile') return ['Profile & Identity', 'Profile Workspace'];
    if (path.startsWith('/doctor/profile') || path === '/doctor/account') return ['Doctor Portal', 'Professional Profile Workspace'];
    if (path.startsWith('/doctor')) return ['Doctor Portal', path.replace('/doctor/', '').toUpperCase() || 'Dashboard'];
    if (path.startsWith('/admin/account')) return ['Admin System', 'Account & System Governance'];
    if (path.startsWith('/admin')) return ['Admin Overview', path.replace('/admin/', '').toUpperCase() || 'Dashboard'];
    return ['Portal', 'Dashboard'];
  };

  const breadcrumbs = getBreadcrumbs();

  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [drawerNotifications, setDrawerNotifications] = useState([]);

  const handleToggleNotifications = () => {
    const list = notificationStore.getNotifications(userId);
    setDrawerNotifications(list);
    setIsNotificationDrawerOpen(prev => !prev);
  };

  const handleNavigateProfile = () => {
    setShowProfileMenu(false);
    if (user?.role === 'DOCTOR') navigate('/doctor/profile');
    else if (user?.role === 'ADMIN') navigate('/admin/account');
    else navigate('/profile');
  };

  return (
    <>
      <header className={`sticky top-0 z-[var(--z-header)] h-[72px] shrink-0 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-b border-[var(--border-subtle)] px-4 md:px-8 flex items-center justify-between transition-all duration-200 ${className}`}>
        {/* Left: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200/80 shrink-0">
              <img src="/assets/healthprism_icon.png" alt="Health Prism" className="w-full h-full object-contain" />
            </div>
            <nav className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-[var(--text-dim)]">/</span>}
                  <span className={idx === breadcrumbs.length - 1 ? 'text-[var(--text-main)] font-semibold' : ''}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>

        {/* Right: Actions & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell (Exclusively accesses all notifications via Drawer) */}
          <button
            onClick={handleToggleNotifications}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] relative transition-all group"
            title="Open Notification Center"
          >
            <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
            {unreadBadgeCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-[9.5px] font-black text-white shadow-md border-2 border-[var(--bg-surface)] animate-pulse">
                {unreadBadgeCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors"
              title="Profile & Identity Workspace"
            >
              <Avatar user={user} name={user?.full_name || user?.name || 'User Profile'} size="sm" />
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[var(--text-main)] leading-tight">
                  {user?.full_name || user?.name || (user?.role === 'DOCTOR' ? 'Dr. Medical Officer' : user?.role === 'ADMIN' ? 'System Admin' : 'Patient Account')}
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">{user?.role || 'PATIENT'}</span>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 p-3 border border-[var(--border-medium)] shadow-2xl rounded-2xl bg-[var(--bg-primary)] z-[9999] space-y-2 ring-1 ring-black/5 animate-fade-in">
                {/* Clickable Profile Header Card */}
                <div
                  onClick={handleNavigateProfile}
                  className="px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--primary-light)]/40 hover:border-[var(--primary)]/30 transition-all cursor-pointer group"
                  title="Open Full Profile Workspace"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-[var(--text-main)] tracking-tight group-hover:text-[var(--primary)] transition-colors">
                      {user?.full_name || user?.name || (user?.role === 'DOCTOR' ? 'Dr. Medical Officer' : user?.role === 'ADMIN' ? 'System Administrator' : 'Patient Account')}
                    </p>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-[11px] font-mono text-[var(--text-muted)] truncate">{user?.email || ''}</p>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 uppercase">
                      {user?.role || 'PATIENT'}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-mono font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Session
                    </span>
                  </div>
                </div>

                {/* Single Unified Profile Action */}
                <div className="space-y-1">
                  <button
                    onClick={handleNavigateProfile}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] hover:bg-[var(--primary)] hover:text-white rounded-xl transition-all shadow-xs group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 shrink-0" />
                      <div className="flex flex-col text-left">
                        <span>Profile Workspace</span>
                        <span className="text-[10px] font-normal opacity-80 group-hover:opacity-100">Whole Profile, Identity & Password Reset</span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                <div className="pt-1.5 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={() => { setShowProfileMenu(false); if (onLogout) onLogout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={drawerNotifications}
        onMarkAsRead={(id) => {
          notificationStore.markAsRead(id, userId);
          setDrawerNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        }}
        onMarkAllRead={() => {
          notificationStore.markAllAsRead(userId);
          setDrawerNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }}
        onDelete={(id) => {
          notificationStore.deleteNotification(id, userId);
          setDrawerNotifications(prev => prev.filter(n => n.id !== id));
        }}
      />
    </>
  );
}
