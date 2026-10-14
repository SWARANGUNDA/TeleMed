import React, { useState, useEffect } from 'react';
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
  Award,
  ChevronLeft,
  ChevronRight,
  Activity,
  UserCheck,
  Calendar,
  Sparkles,
  MessageSquare,
  FileCheck2
} from 'lucide-react';

export function Sidebar({ isCollapsed, onToggleCollapse, userRole = 'PATIENT', user, className = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setTick(t => t + 1);
    window.addEventListener('telemed_profile_updated', handleUpdate);
    return () => window.removeEventListener('telemed_profile_updated', handleUpdate);
  }, []);

  const patientMenu = [
    {
      group: "Clinical Insights",
      items: [
        { id: "pat-overview", label: "Overview", icon: LayoutDashboard, path: "/dashboard" },
        { id: "pat-intake", label: "New Analysis", icon: FilePlus, path: "/intake" },
        { id: "pat-xai", label: "XAI Driver Analysis", icon: BarChart3, path: "/xai" },
        { id: "pat-results", label: "Model Benchmark Results", icon: Award, path: "/results" },
        { id: "pat-report", label: "Comprehensive Report", icon: FileText, path: "/report" },
      ]
    },
    {
      group: "Records & Care",
      items: [
        { id: "pat-compare", label: "Compare & Analytics", icon: BarChart3, path: "/compare" },
        { id: "pat-messages", label: "Doctor Chat", icon: MessageSquare, path: "/messages" },
        { id: "pat-records", label: "Health Records", icon: History, path: "/records" },
        { id: "pat-consultations", label: "Consultations", icon: Stethoscope, path: "/consultations" },
        { id: "pat-appointments", label: "Appointments", icon: Calendar, path: "/appointments" },
        { id: "pat-care", label: "Care Recommendations", icon: HeartPulse, path: "/care" },
      ]
    }
  ];

  const doctorMenu = [
    {
      group: "Doctor Portal",
      items: [
        { id: "doc-dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/doctor/dashboard" },
        { id: "doc-consultations", label: "Consultations", icon: Stethoscope, path: "/doctor/consultations" },
        { id: "doc-appointments", label: "Appointments", icon: Calendar, path: "/doctor/appointments" },
        { id: "doc-verification", label: "Credentials Upload", icon: UserCheck, path: "/doctor/verification" },
      ]
    }
  ];

  const adminMenu = [
    {
      group: "System Administration",
      items: [
        { id: "admin-overview", label: "System Overview", icon: LayoutDashboard, path: "/admin" },
        { id: "admin-doctors", label: "Doctor Verification", icon: ShieldCheck, path: "/admin/doctors" },
        { id: "admin-users", label: "User Management", icon: Users, path: "/admin/users" },
        { id: "admin-consultations", label: "Consultations Mgmt", icon: Stethoscope, path: "/admin/consultations" },
        { id: "admin-audit", label: "Audit & Compliance", icon: FileCheck2, path: "/admin/audit" },
        { id: "admin-system", label: "System Metrics", icon: Cpu, path: "/admin/system" },
      ]
    }
  ];

  const menuConfig = userRole === 'ADMIN' ? adminMenu : (userRole === 'DOCTOR' ? doctorMenu : patientMenu);

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-[var(--z-sticky)] bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] transition-all duration-300 ease-in-out flex flex-col h-screen overflow-hidden hidden lg:flex ${
        isCollapsed ? 'w-[80px]' : 'w-[280px]'
      } ${className}`}
    >
      {/* Brand Header */}
      <div className="h-[74px] px-3.5 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
        <div className="flex items-center flex-1 min-w-0 cursor-pointer overflow-hidden" onClick={() => navigate('/')}>
          {isCollapsed ? (
            <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-slate-200/80 hover:scale-105 transition-transform mx-auto" title="Health Prism">
              <img
                src="/assets/healthprism_icon.png"
                alt="Health Prism"
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center flex-1 min-w-0 pr-1">
              <img
                src="/assets/healthprism_logo.png"
                alt="Health Prism"
                className="h-10 md:h-11 w-auto max-w-[200px] object-contain hover:scale-[1.02] transition-transform drop-shadow-xs"
              />
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors shrink-0"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Items (Never clipped, smooth internal scroll when needed) */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-4 custom-scrollbar">
        {menuConfig.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3.5 py-1 text-[11.5px] font-mono font-bold tracking-wider text-[var(--text-dim)] uppercase">
                {group.group}
              </div>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.id || `${item.path}-${item.label}`}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3.5 rounded-xl text-[15px] font-semibold transition-all duration-150 group relative cursor-pointer ${
                    isCollapsed ? 'justify-center px-2.5 py-2.5' : 'px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'bg-[var(--primary-light)] text-[var(--primary)] font-bold shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[var(--primary)] rounded-l-full" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
