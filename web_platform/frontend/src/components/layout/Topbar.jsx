import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import NotificationDrawer from '../NotificationDrawer';

export function Topbar({ user, onLogout, onToggleTheme, theme = 'dark', onOpenMobileMenu, className = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return ['Overview'];
    if (path === '/intake') return ['Intake', 'New Multimodal Analysis'];
    if (path === '/xai') return ['Analytics', 'XAI Driver Analysis'];
    if (path === '/report') return ['Reports', 'Comprehensive Diagnostic Report'];
    if (path === '/records') return ['Records', 'Health History'];
    if (path === '/consultations') return ['Clinical', 'Doctor Consultations'];
    if (path === '/appointments') return ['Schedule', 'Appointments'];
    if (path === '/care') return ['Care', 'Personalized Recommendations'];
    if (path.startsWith('/admin')) return ['Admin', path.replace('/admin/', '').toUpperCase() || 'Dashboard'];
    if (path.startsWith('/doctor')) return ['Doctor Portal', path.replace('/doctor/', '').toUpperCase() || 'Dashboard'];
    return ['Portal', 'Dashboard'];
  };

  const breadcrumbs = getBreadcrumbs();

  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [drawerNotifications, setDrawerNotifications] = useState([
    { id: '1', category: 'Appointments', title: 'Teleconsultation Tomorrow', description: 'Video call with Dr. Vance tomorrow at 10:00 AM', timestamp: '10m ago', priority: 'HIGH', isRead: false },
    { id: '2', category: 'AI Analysis', title: 'AI Analysis Complete', description: 'Multimodal predictions calculated (34.2% Risk)', timestamp: '1h ago', priority: 'HIGH', isRead: false },
  ]);

  const unreadBadgeCount = drawerNotifications.filter(n => !n.isRead).length;

  return (
    <>
      <header className={`sticky top-0 z-[var(--z-header)] h-[72px] bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-b border-[var(--border-subtle)] px-4 md:px-8 flex items-center justify-between transition-all duration-200 ${className}`}>
        {/* Left: Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold">
              <Activity className="w-5 h-5 text-white" />
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

        {/* Center: Global Search Bar Placeholder */}
        <div className="hidden md:flex items-center w-72 lg:w-96 relative">
          <Search className="w-4 h-4 absolute left-3 text-[var(--text-muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search patient record, lab test, or biomarker..."
            className="w-full bg-[var(--bg-surface)] text-[var(--text-main)] text-xs rounded-xl pl-9 pr-4 py-2 border border-[var(--border-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all placeholder:text-[var(--text-dim)]"
          />
        </div>

        {/* Right: Actions & User Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            onClick={() => setIsNotificationDrawerOpen(true)}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] relative transition-colors"
            title="Open Notification Center"
          >
            <Bell className="w-5 h-5" />
            {unreadBadgeCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--primary)] rounded-full animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--primary)] rounded-full" />
              </>
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
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <Avatar name={user?.name || user?.full_name || 'User Profile'} size="sm" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[var(--text-main)] leading-tight">{user?.name || user?.full_name || 'Guest User'}</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">{user?.role || 'PATIENT'}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 glass-card p-2 border border-[var(--border-medium)] shadow-2xl rounded-xl bg-[var(--bg-surface)] z-[var(--z-dropdown)] space-y-1">
              <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                <p className="text-xs font-bold text-[var(--text-main)]">{user?.name || 'Guest Patient'}</p>
                <p className="text-[10px] font-mono text-[var(--text-muted)]">{user?.email || 'patient@telemed.ai'}</p>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/account'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                Account Settings
              </button>
              <button
                onClick={() => { setShowProfileMenu(false); navigate('/privacy'); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors"
              >
                <Shield className="w-4 h-4 text-[var(--text-muted)]" />
                Privacy & Data Security
              </button>
              <div className="pt-1 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => { setShowProfileMenu(false); if (onLogout) onLogout(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-light)] rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
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
        onMarkAsRead={(id) => setDrawerNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))}
        onMarkAllRead={() => setDrawerNotifications(prev => prev.map(n => ({ ...n, isRead: true })))}
        onDelete={(id) => setDrawerNotifications(prev => prev.filter(n => n.id !== id))}
      />
    </>
  );
}
