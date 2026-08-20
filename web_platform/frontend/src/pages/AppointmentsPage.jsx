import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout';
import { Card, Badge, Button, Input, Modal, EmptyState } from '../components/ui';
import AppointmentBookingModal from '../components/AppointmentBookingModal';
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, User, Stethoscope,
  Video, Phone, UserCheck, Search, Filter, Download, Eye, FileText, Sparkles,
  ChevronRight, ChevronLeft, RefreshCw, Star, MapPin, Building2, MessageSquare,
  Shield, Lock, ArrowRight, HelpCircle, Monitor, Mic, BadgeCheck
} from 'lucide-react';
import {
  fetchUserAppointments, fetchDoctorAvailability, bookAppointment,
  updateAppointmentStatus, configureDoctorAvailability, fetchPatientConsultations, fetchVerifiedDoctors,
  joinAppointment
} from '../api/client';

// ── Helpers ──────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAY_SHORT   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}, ${DAY_NAMES[d.getDay()]}`;
}

function formatTime24to12(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

function addMinutes(time24, mins) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function getCountdown(dateStr, time24) {
  if (!dateStr || !time24) return null;
  const target = new Date(`${dateStr}T${time24}:00`);
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return { expired: true, hrs: 0, min: 0, sec: 0, totalMs: diff };
  const hrs = Math.floor(diff / 3600000);
  const min = Math.floor((diff % 3600000) / 60000);
  const sec = Math.floor((diff % 60000) / 1000);
  return { expired: false, hrs, min, sec, totalMs: diff };
}

function getDaysUntil(dateStr) {
  if (!dateStr) return 999;
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / 86400000);
}

// ── Mini Calendar Component ──────────────────────────────────────────
function MiniCalendar({ appointmentDates = [] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const aptDaysSet = new Set(appointmentDates.filter(d => {
    const dt = new Date(d + 'T00:00:00');
    return dt.getFullYear() === year && dt.getMonth() === month;
  }).map(d => new Date(d + 'T00:00:00').getDate()));

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: daysInPrevMonth - firstDay + 1 + i, current: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, current: true });
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) cells.push({ day: i, current: false });

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-[var(--text-main)]">{MONTH_NAMES[month]} {year}</h4>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-[var(--bg-primary)] transition-colors">
            <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-[var(--bg-primary)] transition-colors">
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold text-[var(--text-muted)] mb-1">
        {DAY_SHORT.map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {cells.map((c, i) => {
          const isToday = isCurrentMonth && c.current && c.day === today;
          const hasApt = c.current && aptDaysSet.has(c.day);
          return (
            <div
              key={i}
              className={`py-1.5 rounded-lg transition-colors relative ${
                !c.current ? 'text-[var(--text-dim)]' :
                isToday ? 'bg-[var(--primary)] text-white font-bold' :
                hasApt ? 'text-[var(--primary)] font-bold' :
                'text-[var(--text-main)] hover:bg-[var(--bg-primary)]'
              }`}
            >
              {c.day}
              {hasApt && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--primary)]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Countdown Timer Component ────────────────────────────────────────
function CountdownTimer({ dateStr, time24 }) {
  const [cd, setCd] = useState(() => getCountdown(dateStr, time24));

  useEffect(() => {
    const t = setInterval(() => setCd(getCountdown(dateStr, time24)), 1000);
    return () => clearInterval(t);
  }, [dateStr, time24]);

  if (!cd || cd.expired) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] font-semibold text-[var(--success)]">Starts in</span>
      <div className="flex items-center gap-1.5">
        {[
          { val: String(cd.hrs).padStart(2, '0'), label: 'HRS' },
          { val: String(cd.min).padStart(2, '0'), label: 'MIN' },
          { val: String(cd.sec).padStart(2, '0'), label: 'SEC' },
        ].map((item, i) => (
          <React.Fragment key={item.label}>
            {i > 0 && <span className="text-lg font-bold text-[var(--primary)] animate-timer-pulse">:</span>}
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-[var(--primary)] font-mono leading-none">{item.val}</span>
              <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase">{item.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function AppointmentsPage({ user, onNavigate }) {
  const role = user?.role || 'PATIENT';
  const [activeTab, setActiveTab] = useState('upcoming');
  const [calendarViewMode, setCalendarViewMode] = useState('MONTH');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');

  // Backend Async Data
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Drawers
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);

  // Calendar view state
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apts = await fetchUserAppointments();
      setAppointments(apts || []);

      const docs = await fetchVerifiedDoctors();
      if (docs && docs.length > 0) {
        setDoctorsList(docs.map(d => ({
          id: d.doctor_profile?.doctor_id || d.user_id,
          userId: d.user_id,
          name: d.doctor_profile?.full_name || d.full_name || 'Doctor',
          specialty: d.doctor_profile?.specialization || 'General Medicine',
          experience: d.doctor_profile?.experience_years ? `${d.doctor_profile.experience_years}+ Years Exp.` : null,
          experienceYears: d.doctor_profile?.experience_years || null,
          qualification: d.doctor_profile?.qualification || null,
          hospital: d.doctor_profile?.hospital_affiliation || null,
          avatar: (d.doctor_profile?.full_name || d.full_name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        })));
      }

      if (role === 'PATIENT') {
        const consData = await fetchPatientConsultations();
        setConsultations(consData?.consultations || []);
      }
    } catch (err) {
      console.error("Failed to load appointments data:", err);
      setError(err.message || 'Failed to load appointments data.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (bookingData) => {
    setBookingLoading(true);
    try {
      if (bookingData.slotId) {
        await bookAppointment(bookingData.consultationId || null, bookingData.slotId, bookingData.reason);
      }
      await loadData();
    } catch (err) {
      console.error("Booking error:", err);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleJoinConsultation = async (apt) => {
    try {
      const aptId = apt.appointment_id || apt.id;
      if (aptId) {
        await joinAppointment(aptId);
      }
    } catch (err) {
      console.warn("Join consultation note:", err);
    }
    if (onNavigate) {
      onNavigate('consultations');
    }
  };

  const handleCancelAppointment = async (aptId, reason = 'Cancelled by user') => {
    try {
      await updateAppointmentStatus(aptId, 'CANCELLED', reason);
      await loadData();
    } catch (err) {
      console.error("Failed to cancel appointment:", err);
    }
  };

  const filteredDoctors = doctorsList.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                          doc.specialty.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                          doc.hospital.toLowerCase().includes(searchDoctorQuery.toLowerCase());
    const matchesSpec = specialtyFilter === 'ALL' || doc.specialty === specialtyFilter;
    return matchesSearch && matchesSpec;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate real duration from slot_start/slot_end, fallback to 30
  const calcDuration = (a) => {
    if (a.slot_start && a.slot_end) {
      const s = new Date(a.slot_start);
      const e = new Date(a.slot_end);
      const diff = Math.round((e - s) / 60000);
      if (diff > 0 && diff < 480) return diff;
    }
    return 30;
  };

  const formattedApts = appointments.map(a => ({
    id: a.appointment_id || a.id,
    appointment_id: a.appointment_id || a.id,
    consultationId: a.consultation_id,
    doctorName: a.doctor_name || a.doctorName || 'Doctor',
    doctorAvatar: (a.doctor_name || 'D').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    specialty: a.doctor_specialization || a.specialty || 'Specialist',
    hospital: a.hospital_affiliation || null,
    patientName: a.patient_name || a.patientName || 'Patient',
    date: (a.slot_start || '').split('T')[0] || a.date || todayStr,
    time: (a.slot_start || '').split('T')[1]?.slice(0, 5) || a.time || '10:00',
    duration: calcDuration(a),
    type: 'CHAT',
    reason: a.notes || a.reason || '',
    status: a.status || 'CONFIRMED',
    statusVariant: a.status === 'COMPLETED' ? 'success' : (a.status === 'CANCELLED' ? 'danger' : (a.status === 'IN_CONSULTATION' ? 'primary' : (a.status === 'REQUESTED' || a.status === 'PENDING' ? 'warning' : 'success'))),
    isToday: (a.slot_start || '').startsWith(todayStr),
    createdAt: a.created_at || '',
  }));

  // Apply search filter across appointments
  const searchFilteredApts = searchQuery.trim()
    ? formattedApts.filter(a => {
        const q = searchQuery.toLowerCase();
        return (a.doctorName || '').toLowerCase().includes(q) ||
               (a.specialty || '').toLowerCase().includes(q) ||
               (a.reason || '').toLowerCase().includes(q) ||
               (a.hospital || '').toLowerCase().includes(q);
      })
    : formattedApts;

  // Apply sort
  const sortedApts = [...searchFilteredApts].sort((a, b) => {
    if (sortBy === 'date') return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
    if (sortBy === 'doctor') return (a.doctorName || '').localeCompare(b.doctorName || '');
    if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
    return 0;
  });

  const todayAppointments = sortedApts.filter(a => a.isToday || a.date === todayStr);
  const upcomingAppointments = sortedApts.filter(a => ['UPCOMING','CONFIRMED','REQUESTED','IN_CONSULTATION','PENDING'].includes(a.status));
  const pastAppointments = sortedApts.filter(a => a.status === 'COMPLETED');
  const cancelledAppointments = sortedApts.filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW');
  const allAppointmentDates = formattedApts.map(a => a.date);

  // Download appointment summary as JSON
  const handleDownloadSummary = (apt) => {
    const data = {
      appointmentId: apt.id,
      doctor: apt.doctorName,
      specialty: apt.specialty,
      date: apt.date,
      time: apt.time,
      duration: `${apt.duration} minutes`,
      status: apt.status,
      reason: apt.reason,
      type: 'Virtual Chat Consultation',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointment_${apt.id || 'summary'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Tab definitions
  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'today', label: 'Today', icon: Clock },
    { id: 'past', label: 'Past & Cancelled', icon: Clock },
    { id: 'directory', label: 'Doctor Directory', icon: User },
    { id: 'calendar', label: 'Calendar View', icon: Calendar },
  ];

  // ── Render: Appointment Card (Mockup Style) ──────────────────────
  const renderAppointmentCard = (apt, idx) => {
    const isConfirmed = apt.status === 'CONFIRMED' || apt.status === 'IN_CONSULTATION';
    const isPending = apt.status === 'REQUESTED' || apt.status === 'PENDING';
    const daysUntil = getDaysUntil(apt.date);
    const showCountdown = isConfirmed && daysUntil === 0;
    const endTime = addMinutes(apt.time, apt.duration);

    return (
      <div
        key={apt.id || idx}
        className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 hover:shadow-lg transition-all animate-slide-up"
        style={{ animationDelay: `${idx * 60}ms` }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Doctor or Patient Info Header */}
          <div className="flex items-center gap-3.5 min-w-0 lg:w-[280px] shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-md flex items-center justify-center text-sm font-black text-slate-600 shrink-0">
              {role === 'DOCTOR' ? (apt.patientName || 'P').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : apt.doctorAvatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[var(--text-main)] truncate">
                  {role === 'DOCTOR' ? apt.patientName : apt.doctorName}
                </h3>
                {role !== 'DOCTOR' && <BadgeCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />}
              </div>
              <p className="text-xs font-semibold text-[var(--primary)]">
                {role === 'DOCTOR' ? (apt.reason || 'Virtual Chat Consultation') : apt.specialty}
              </p>
              {apt.hospital && role !== 'DOCTOR' && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3 h-3 text-[var(--text-dim)]" />
                  <span className="text-[11px] text-[var(--text-muted)] truncate">{apt.hospital}</span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-sm font-semibold text-[var(--text-main)]">{formatDateFull(apt.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-main)]">{formatTime24to12(apt.time)} – {formatTime24to12(endTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-muted)]">Virtual Chat Consultation</span>
                </div>
              </div>
            </div>
            <div className="mt-2">
              {isConfirmed && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" /> CONFIRMED
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[11px] font-bold border border-orange-200">
                  <AlertCircle className="w-3 h-3" /> PENDING REQUEST
                </span>
              )}
            </div>
          </div>

          {/* Countdown / Status */}
          <div className="flex flex-col items-center gap-2 shrink-0 lg:w-[140px]">
            {showCountdown ? (
              <CountdownTimer dateStr={apt.date} time24={apt.time} />
            ) : isConfirmed && daysUntil > 0 ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[11px] font-semibold text-[var(--success)]">Starts in</span>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700">{daysUntil} Day{daysUntil > 1 ? 's' : ''}</span>
                </div>
              </div>
            ) : isPending ? (
              <div className="flex flex-col items-center gap-1 text-center">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </div>
                <span className="text-[10px] text-orange-500 font-medium leading-tight">
                  {role === 'DOCTOR' ? 'Awaiting Doctor Review' : 'Waiting for doctor confirmation'}
                </span>
              </div>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0 lg:w-[170px]">
            {role === 'DOCTOR' && isPending && (
              <>
                <button
                  onClick={() => updateAppointmentStatus(apt.id, 'CONFIRMED').then(loadData)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept Request
                </button>
                <button
                  onClick={() => updateAppointmentStatus(apt.id, 'REJECTED', 'Declined by doctor').then(loadData)}
                  className="flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Decline Request
                </button>
              </>
            )}

            {['CONFIRMED', 'UPCOMING', 'IN_CONSULTATION'].includes(apt.status) && (
              <button
                onClick={() => handleJoinConsultation(apt)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-md"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Open Consultation
              </button>
            )}
            <button
              onClick={() => setSelectedAppointmentDetails(apt)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-[var(--border-medium)] text-[var(--text-main)] text-xs font-semibold hover:bg-[var(--bg-primary)] transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[var(--primary)]" /> View Details
            </button>
            {role !== 'DOCTOR' && ['REQUESTED', 'PENDING', 'CONFIRMED', 'UPCOMING'].includes(apt.status) && (
              <button
                onClick={() => handleCancelAppointment(apt.id)}
                className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Cancel Appointment
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  // ── Loading Skeleton ────────────────────────────────────────────
  if (loading) {
    return (
      <PageContainer className="py-6 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-72 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-slate-100 rounded-lg animate-pulse mt-2" />
          </div>
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                  <div className="h-3 w-32 bg-slate-100 rounded" />
                  <div className="h-3 w-56 bg-slate-100 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-6 space-y-0">

      {/* ── Error Alert ────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
          <button onClick={loadData} className="ml-auto text-xs font-bold text-red-600 hover:underline">Retry</button>
        </div>
      )}

      {/* ── Page Title Header ──────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-main)]">Appointments & Teleconsultations</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Book, manage, and track your doctor appointments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search doctors, specialties, clinics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 w-72 transition-all"
            />
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-primary)] transition-colors"
            title="Refresh appointments"
          >
            <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
          {role === 'PATIENT' && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowBookModal(true)}
              className="!rounded-xl !font-bold !shadow-md"
            >
              Book Appointment
            </Button>
          )}
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-[var(--border-subtle)] mb-6 overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Main Content Grid (Left Content + Right Sidebar) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT: Main Content Area (8 cols) ───────────────────── */}
        <div className="lg:col-span-8 space-y-4">

          {/* TAB: UPCOMING */}
          {activeTab === 'upcoming' && (
            <div className="space-y-4 animate-fade-in">
              {/* Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[var(--text-muted)]" />
                  <h2 className="text-base font-bold text-[var(--text-main)]">
                    Upcoming Appointments ({upcomingAppointments.length})
                  </h2>
                </div>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-main)] focus:outline-none"
                >
                  <option value="date">Sort by: Date</option>
                  <option value="doctor">Sort by: Doctor</option>
                  <option value="status">Sort by: Status</option>
                </select>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto shadow-sm">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[var(--text-main)]">No Upcoming Appointments</h3>
                    <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">Find a verified doctor and book your first virtual consultation.</p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button variant="primary" size="sm" onClick={() => setShowBookModal(true)} leftIcon={<Plus className="w-4 h-4" />}>
                      Book Appointment
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('directory')} leftIcon={<User className="w-4 h-4" />}>
                      Browse Doctors
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt, i) => renderAppointmentCard(apt, i))}
                </div>
              )}
            </div>
          )}

          {/* TAB: TODAY */}
          {activeTab === 'today' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-[var(--text-muted)]" />
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  Today's Schedule ({todayAppointments.length})
                </h2>
              </div>
              {todayAppointments.length === 0 ? (
                <EmptyState
                  title="No Appointments Scheduled for Today"
                  description="Your schedule is clear for today."
                  icon={<Calendar className="w-8 h-8 text-[var(--text-muted)]" />}
                />
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map((apt, i) => renderAppointmentCard(apt, i))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PAST & CANCELLED */}
          {activeTab === 'past' && (
            <div className="space-y-4 animate-fade-in">
              {/* Completed */}
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h2 className="text-base font-bold text-[var(--text-main)]">
                  Completed Consultations ({pastAppointments.length})
                </h2>
              </div>
              {pastAppointments.length === 0 ? (
                <EmptyState title="No Completed Appointments" description="Your completed consultations will appear here." />
              ) : (
                pastAppointments.map((apt, i) => (
                  <div key={apt.id || i} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 border border-slate-200">{apt.doctorAvatar}</div>
                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-main)]">{apt.doctorName}</h4>
                          <p className="text-xs text-[var(--text-muted)]">{apt.specialty} • Completed on {formatDateFull(apt.date)}</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">COMPLETED</Badge>
                    </div>
                    {apt.reason && (
                      <div className="mt-3 p-3 rounded-xl bg-[var(--bg-primary)] text-xs space-y-1">
                        <p className="text-[var(--text-muted)]">{apt.reason}</p>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-3">
                      <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />} onClick={() => handleDownloadSummary(apt)}>
                        Download Summary
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {/* Cancelled / No-Show */}
              {cancelledAppointments.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2 mt-6">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <h2 className="text-base font-bold text-[var(--text-main)]">
                      Cancelled ({cancelledAppointments.length})
                    </h2>
                  </div>
                  {cancelledAppointments.map((apt, i) => (
                    <div key={apt.id || i} className="bg-[var(--bg-surface)] rounded-2xl border border-red-100 p-5 opacity-70 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-sm font-bold text-red-400 border border-red-200">{apt.doctorAvatar}</div>
                          <div>
                            <h4 className="text-sm font-bold text-[var(--text-main)]">{apt.doctorName}</h4>
                            <p className="text-xs text-[var(--text-muted)]">{apt.specialty} • {formatDateFull(apt.date)}</p>
                          </div>
                        </div>
                        <Badge variant="danger" size="sm">{apt.status}</Badge>
                      </div>
                      {apt.reason && (
                        <div className="mt-3 p-3 rounded-xl bg-red-50 text-xs">
                          <p className="text-red-600">{apt.reason}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* TAB: DOCTOR DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search doctors by name, specialty, or hospital..."
                    value={searchDoctorQuery}
                    onChange={(e) => setSearchDoctorQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all"
                  />
                </div>
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-main)]"
                >
                  <option value="ALL">All Specialties</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Gastroenterology">Gastroenterology</option>
                  <option value="General Medicine">General Medicine</option>
                </select>
              </div>
              <div className="space-y-4">
                {filteredDoctors.map((doc, i) => (
                  <div key={doc.id} className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 hover:shadow-lg hover:border-[var(--primary)]/30 transition-all animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-white shadow-md flex items-center justify-center text-sm font-black text-blue-600 shrink-0">{doc.avatar}</div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-[var(--text-main)]">{doc.name}</h3>
                            <BadgeCheck className="w-4 h-4 text-[var(--primary)]" />
                          </div>
                          <p className="text-xs font-semibold text-[var(--primary)]">{doc.specialty}</p>
                          {doc.hospital && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Building2 className="w-3 h-3 text-[var(--text-dim)]" />
                              <span className="text-[11px] text-[var(--text-muted)]">{doc.hospital}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            {doc.experience && <span className="text-[11px] text-[var(--text-muted)]">{doc.experience}</span>}
                            {doc.qualification && <span className="text-[11px] text-[var(--text-muted)]">{doc.qualification}</span>}
                          </div>
                        </div>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => setShowBookModal(true)}>
                        Book Appointment
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CALENDAR */}
          {activeTab === 'calendar' && (() => {
            const calFirstDay = new Date(calYear, calMonth, 1).getDay();
            const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
            const calDaysInPrevMonth = new Date(calYear, calMonth, 0).getDate();
            const calToday = new Date();
            const isCalCurrentMonth = calYear === calToday.getFullYear() && calMonth === calToday.getMonth();

            const calAptDaysSet = new Set(allAppointmentDates.filter(d => {
              const dt = new Date(d + 'T00:00:00');
              return dt.getFullYear() === calYear && dt.getMonth() === calMonth;
            }).map(d => new Date(d + 'T00:00:00').getDate()));

            const calCells = [];
            for (let i = 0; i < calFirstDay; i++) calCells.push({ day: calDaysInPrevMonth - calFirstDay + 1 + i, current: false });
            for (let i = 1; i <= calDaysInMonth; i++) calCells.push({ day: i, current: true });
            const calRemaining = 42 - calCells.length;
            for (let i = 1; i <= calRemaining; i++) calCells.push({ day: i, current: false });

            const calPrevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
            const calNextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

            return (
              <Card isGlass={true} className="p-6 space-y-6 animate-fade-in shadow-lg">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={calPrevMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors">
                      <ChevronLeft className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                    <h3 className="text-base font-bold text-[var(--text-main)]">{MONTH_NAMES[calMonth]} {calYear}</h3>
                    <button onClick={calNextMonth} className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] transition-colors">
                      <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono text-[var(--text-muted)] font-bold mb-2">
                  {DAY_SHORT.map(d => <span key={d}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-2 text-xs">
                  {calCells.map((c, i) => {
                    const isToday = isCalCurrentMonth && c.current && c.day === calToday.getDate();
                    const hasApt = c.current && calAptDaysSet.has(c.day);
                    return (
                      <div
                        key={i}
                        className={`min-h-[70px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                          !c.current ? 'bg-slate-50 border-[var(--border-subtle)] text-[var(--text-dim)]' :
                          isToday ? 'bg-[var(--primary)] border-[var(--primary)] text-white font-bold shadow-md' :
                          hasApt ? 'bg-[var(--primary-light)] border-[var(--primary)] font-bold text-[var(--primary)] shadow-sm' :
                          'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                        }`}
                      >
                        <span className="font-mono">{c.day}</span>
                        {hasApt && !isToday && (
                          <Badge variant="primary" size="sm" className="truncate text-[9px] font-mono">
                            Consultation
                          </Badge>
                        )}
                        {hasApt && isToday && (
                          <span className="text-[9px] font-bold text-white bg-white/20 px-1 rounded">Appt</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })()}

          {/* ── Security Banner ─────────────────────────────────────── */}
          {(activeTab === 'upcoming' || activeTab === 'today') && (
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-700">Secure & Encrypted Consultations</h4>
                  <p className="text-xs text-[var(--text-muted)]">All consultations are end-to-end encrypted and your privacy is protected.</p>
                </div>
              </div>
              <a href="https://en.wikipedia.org/wiki/End-to-end_encryption" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1 whitespace-nowrap">
                Learn more about security <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar (4 cols) ────────────────────────────── */}
        <div className="lg:col-span-4 space-y-4">

          {/* Consultation Types */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-sm">
            <h4 className="text-sm font-bold text-[var(--text-main)] mb-3">Consultation Types</h4>
            <div className="space-y-3">
              {/* Virtual Chat - Active */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text-main)]">Virtual Chat</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Available</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time secure messaging with your doctor</p>
                </div>
              </div>
              {/* Audio - Coming Soon */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] opacity-60">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-main)]">Audio Consultation</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Coming Soon</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Talk to your doctor over a secure audio call</p>
                </div>
              </div>
              {/* Video - Coming Soon */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] opacity-60">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-main)]">Video Consultation</span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Coming Soon</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Face-to-face video consultation with your doctor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Calendar */}
          <MiniCalendar appointmentDates={allAppointmentDates} />

          {/* Need Help? */}
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-[var(--text-muted)]" />
              <h4 className="text-sm font-bold text-[var(--text-main)]">Need Help?</h4>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
              If you face any issues with your appointment, our support team is here to help you.
            </p>
            <a href="mailto:support@telemed.ai" className="w-full py-2 rounded-xl border border-[var(--primary)] text-[var(--primary)] text-sm font-semibold hover:bg-[var(--primary-light)] transition-colors text-center block">
              Contact Support
            </a>
          </div>
        </div>
      </div>

      {/* ── Footer: Why Choose TeleMed AI ──────────────────────────── */}
      <div className="bg-slate-800 text-white rounded-2xl p-6 mt-6">
        <h3 className="text-sm font-bold mb-4">Why Choose TeleMed AI?</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BadgeCheck, title: 'Verified Doctors', desc: 'All doctors are verified and licensed professionals' },
            { icon: Lock, title: 'Secure & Private', desc: 'End-to-end encrypted consultations' },
            { icon: Calendar, title: 'Easy Scheduling', desc: 'Book appointments at your convenience' },
            { icon: FileText, title: 'Complete Records', desc: 'Access your history, reports and prescriptions' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-white/80" />
              </div>
              <div>
                <h4 className="text-xs font-bold">{item.title}</h4>
                <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      <AppointmentBookingModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        doctors={doctorsList}
        consultations={consultations}
        onBook={handleBookAppointment}
        isLoading={bookingLoading}
      />

      {selectedAppointmentDetails && (
        <Modal
          isOpen={!!selectedAppointmentDetails}
          onClose={() => setSelectedAppointmentDetails(null)}
          title={`Appointment Details`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-sm">
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow flex items-center justify-center text-sm font-bold text-slate-600">{selectedAppointmentDetails.doctorAvatar}</div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-main)]">{selectedAppointmentDetails.doctorName}</h3>
                    <p className="text-xs text-[var(--primary)] font-semibold">{selectedAppointmentDetails.specialty}</p>
                  </div>
                </div>
                <Badge variant={selectedAppointmentDetails.statusVariant} size="sm">{selectedAppointmentDetails.status}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2 rounded-lg bg-[var(--bg-surface)]">
                  <span className="text-[var(--text-muted)] block text-[10px] mb-0.5">Date</span>
                  <strong>{formatDateFull(selectedAppointmentDetails.date)}</strong>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-surface)]">
                  <span className="text-[var(--text-muted)] block text-[10px] mb-0.5">Time</span>
                  <strong>{formatTime24to12(selectedAppointmentDetails.time)}</strong>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-surface)]">
                  <span className="text-[var(--text-muted)] block text-[10px] mb-0.5">Type</span>
                  <strong>Virtual Chat</strong>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <h4 className="font-bold text-[var(--text-main)] text-xs uppercase">Appointment Progress</h4>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                {[
                  { stage: 1, label: 'Appointment Booked' },
                  { stage: 2, label: 'Doctor Confirmed' },
                  { stage: 3, label: 'Reminder Sent' },
                  { stage: 4, label: 'Consultation Started' },
                  { stage: 5, label: 'Completed & Prescription Generated' },
                ].map((st) => {
                  const isDone = (selectedAppointmentDetails.status === 'CONFIRMED' && st.stage <= 2) ||
                                 (selectedAppointmentDetails.status === 'IN_CONSULTATION' && st.stage <= 4) ||
                                 (selectedAppointmentDetails.status === 'COMPLETED' && st.stage <= 5);
                  return (
                    <div key={st.stage} className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isDone ? 'bg-[var(--success)] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)]'
                      }`}>
                        {isDone ? '✓' : st.stage}
                      </div>
                      <span className={`text-xs ${isDone ? 'font-semibold text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => setSelectedAppointmentDetails(null)}>Close</Button>
              {['CONFIRMED', 'IN_CONSULTATION'].includes(selectedAppointmentDetails.status) && (
                <Button variant="primary" size="md" leftIcon={<MessageSquare className="w-4 h-4" />} onClick={() => { setSelectedAppointmentDetails(null); handleJoinConsultation(selectedAppointmentDetails); }}>
                  Open Consultation
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

    </PageContainer>
  );
}
