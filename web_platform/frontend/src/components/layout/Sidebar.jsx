import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  BarChart3,
  FileText,
  History,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  Users,
  Cpu,
  FileCheck2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Activity,
  UserCheck,
  Calendar
} from 'lucide-react';

export function Sidebar({ isCollapsed, onToggleCollapse, userRole = 'PATIENT', className = '' }) {
  const location = useLocation();
  const navigate = useNavigate();

  const patientMenu = [
    {
      group: "Clinical Insights",
      items: [
        { label: "Overview", icon: LayoutDashboard, path: "/" },
        { label: "New Analysis", icon: FilePlus, path: "/intake" },
        { label: "XAI Driver Analysis", icon: BarChart3, path: "/xai" },
        { label: "Comprehensive Report", icon: FileText, path: "/report" },
      ]
    },
    {
      group: "Records & Care",
      items: [
        { label: "Health Records", icon: History, path: "/records" },
        { label: "Consultations", icon: Stethoscope, path: "/consultations" },
        { label: "Appointments", icon: Calendar, path: "/appointments" },
        { label: "Care Recommendations", icon: HeartPulse, path: "/care" },
      ]
    }
  ];

  const doctorMenu = [
    {
      group: "Doctor Portal",
      items: [
        { label: "Doctor Dashboard", icon: LayoutDashboard, path: "/doctor/dashboard" },
        { label: "Verified Consultations", icon: Stethoscope, path: "/consultations" },
        { label: "Appointments", icon: Calendar, path: "/appointments" },
        { label: "Credentials Upload", icon: UserCheck, path: "/doctor/verification" },
      ]
    }
  ];

  const adminMenu = [
    {
      group: "System Administration",
      items: [
        { label: "System Overview", icon: LayoutDashboard, path: "/admin" },
        { label: "Doctor Verification", icon: ShieldCheck, path: "/admin/doctors" },
        { label: "User Management", icon: Users, path: "/admin/users" },
        { label: "Consultations Mgmt", icon: Stethoscope, path: "/admin/consultations" },
        { label: "Audit & Compliance", icon: FileCheck2, path: "/admin/audit" },
        { label: "System Metrics", icon: Cpu, path: "/admin/system" },
      ]
    }
  ];

  const menuConfig = userRole === 'ADMIN' ? adminMenu : (userRole === 'DOCTOR' ? doctorMenu : patientMenu);

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-[var(--z-sticky)] bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] transition-all duration-300 ease-in-out flex flex-col justify-between hidden lg:flex ${
        isCollapsed ? 'w-[80px]' : 'w-[280px]'
      } ${className}`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-[72px] px-5 flex items-center justify-between border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold shadow-sm shrink-0">
              <Activity className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight text-[var(--text-main)] leading-none">TeleMed AI</span>
                <span className="text-[10px] font-mono text-[var(--primary)] uppercase font-semibold mt-1">v4.0 Unified</span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
          {menuConfig.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-mono font-semibold tracking-wider text-[var(--text-dim)] uppercase">
                  {group.group}
                </div>
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-[var(--primary-light)] text-[var(--primary)] font-semibold shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--primary)] rounded-l-full" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer User Role Badge */}
      <div className="p-3 border-t border-[var(--border-subtle)]">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-xs shrink-0">
            {userRole[0]}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-[var(--text-main)] truncate">{userRole} Portal</span>
              <span className="text-[10px] font-mono text-[var(--success)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                Active Session
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
