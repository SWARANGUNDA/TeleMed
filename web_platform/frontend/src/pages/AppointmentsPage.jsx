import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, User, Stethoscope,
  Video, Phone, Search, RefreshCw, ChevronRight, ChevronLeft, MessageSquare,
  Shield, HelpCircle, MoreVertical, Filter, Eye, UserCheck, CalendarDays,
  X, Check, Sparkles, PhoneCall, VideoOff, MessageCircle, FileText, ArrowUpRight
} from 'lucide-react';
import {
  fetchUserAppointments, fetchMyDoctorAvailability, addDoctorAvailabilitySlot,
  deleteDoctorAvailabilitySlot, updateAppointmentStatus, joinAppointment,
  fetchVerifiedDoctors, bookAppointment, fetchPatientConsultations
} from '../api/client';
import AppointmentBookingModal from '../components/AppointmentBookingModal';

// ── Date & Time Helpers ──────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_SHORT   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatRelativeTime(dateStr, timeStr) {
  if (!dateStr) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

  let timeFormatted = timeStr || '';
  if (timeStr && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    timeFormatted = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  if (diffDays === 0) return `Today ${timeFormatted}`.trim();
  if (diffDays === 1) return `Tomorrow ${timeFormatted}`.trim();
  if (diffDays === -1) return `Yesterday ${timeFormatted}`.trim();

  const monthShort = MONTH_NAMES[target.getMonth()].slice(0, 3);
  return `${monthShort} ${target.getDate()}, ${target.getFullYear()} ${timeFormatted}`.trim();
}

function formatTimeOnly(time24) {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

export default function AppointmentsPage({ user, onNavigate }) {
  const role = user?.role || 'PATIENT';
  const isPatient = role === 'PATIENT';
  const isDoctor = role === 'DOCTOR';

  const userName = user?.full_name || user?.name || (isDoctor ? 'Dr. Arjun Sarkaar' : 'Patient');

  // Navigation & View States
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'today', 'past', 'availability', 'calendar'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);
  const [availabilityTimeRange, setAvailabilityTimeRange] = useState('This Week');

  // Backend Real Data
  const [appointments, setAppointments] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [verifiedDoctors, setVerifiedDoctors] = useState([]);
  const [consultationsList, setConsultationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals & Drawers
  const [showAddAvailabilityModal, setShowAddAvailabilityModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Add Availability Form State
  const [newSlotDate, setNewSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSlotStartTime, setNewSlotStartTime] = useState('10:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState('10:30');
  const [addSlotError, setAddSlotError] = useState(null);
  const [addSlotLoading, setAddSlotLoading] = useState(false);

  // Calendar View State
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  // WebSocket reference for live synchronization
  const socketRef = useRef(null);

  // Load Real Application State from Authenticated Backend
  const loadWorkspaceData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [aptsData, docsData, consData] = await Promise.all([
        fetchUserAppointments().catch(() => []),
        fetchVerifiedDoctors().catch(() => []),
        isPatient ? fetchPatientConsultations().catch(() => ({ consultations: [] })) : Promise.resolve({ consultations: [] })
      ]);

      setAppointments(aptsData || []);
      setVerifiedDoctors((docsData || []).map(d => ({
        id: d.doctor_profile?.doctor_id || d.user_id,
        userId: d.user_id,
        name: d.doctor_profile?.full_name || d.full_name || 'Doctor',
        specialty: d.doctor_profile?.specialization || 'General Medicine',
        experience: d.doctor_profile?.experience_years ? `${d.doctor_profile.experience_years}+ Years Exp.` : null,
        avatar: (d.doctor_profile?.full_name || d.full_name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      })));
      setConsultationsList(consData?.consultations || []);

      if (isDoctor) {
        const slotsData = await fetchMyDoctorAvailability(false).catch(() => []);
        setAvailabilitySlots(slotsData || []);
      }
    } catch (err) {
      console.warn("Error loading appointments:", err);
      setError(err.message || "Failed to sync real-time appointments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDoctor, isPatient]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Real-Time WebSocket Listener for Appointment & Consultation Push Events
  useEffect(() => {
    if (!user?.user_id) return;

    let ws = null;
    let pingInterval = null;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      ws = new WebSocket(`${protocol}//${host}/ws/notifications/${user.user_id}`);
      socketRef.current = ws;

      ws.onopen = () => {
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send('ping');
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const evt = data.event || data.type;
          if (evt && (evt.startsWith('APPOINTMENT_') || evt.startsWith('CONSULTATION_') || evt === 'DOCTOR_AVAILABILITY_UPDATED')) {
            loadWorkspaceData(true);
          }
        } catch (e) {}
      };
    } catch (e) {
      console.warn("WebSocket notification error:", e);
    }

    return () => {
      if (ws) ws.close();
      if (pingInterval) clearInterval(pingInterval);
      socketRef.current = null;
    };
  }, [user, loadWorkspaceData]);

  // Handle dropdown toggle outside clicks
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Appointment Normalization ────────────────────────────────────────────
  const normalizedAppointments = useMemo(() => {
    return appointments.map((a) => {
      const aptId = a.appointment_id || a.id;
      const consId = a.consultation_id || a.consultationId || 'Pending';
      const pName = a.patient_name || a.patientName || 'Patient';
      const dName = a.doctor_name || a.doctorName || 'Physician';
      const pId = a.patient_profile_id || a.patient_id || a.patientId || 'P-10001';
      const spec = a.doctor_specialization || a.specialty || a.specialization || 'General Medicine';
      const category = a.consultation_category || a.category || 'Virtual Chat';

      const startIso = a.slot_start || a.slotStart || new Date().toISOString();
      const endIso = a.slot_end || a.slotEnd || new Date(Date.now() + 1800000).toISOString();

      const datePart = startIso.split('T')[0];
      const timePart = startIso.includes('T') ? startIso.split('T')[1].slice(0, 5) : '10:00';
      const relativeFormatted = formatRelativeTime(datePart, timePart);

      const status = (a.status || 'UPCOMING').toUpperCase();

      return {
        ...a,
        id: aptId,
        appointment_id: aptId,
        consultation_id: consId,
        patient_name: pName,
        doctor_name: dName,
        patient_id: pId,
        specialty: spec,
        consultation_category: category,
        slot_start: startIso,
        slot_end: endIso,
        date_str: datePart,
        time_str: timePart,
        relative_display: relativeFormatted,
        status: status,
        notes: a.notes || 'Physician consultation.'
      };
    });
  }, [appointments]);

  // ── Today & Filter Calculations ──────────────────────────────────────────
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute KPI metrics dynamically from authenticated records
  const kpiCounts = useMemo(() => {
    const upcoming = normalizedAppointments.filter(a => ['UPCOMING', 'CONFIRMED', 'REQUESTED', 'BOOKED'].includes(a.status));
    const todayApts = normalizedAppointments.filter(a => a.date_str === todayStr);
    const completed = normalizedAppointments.filter(a => a.status === 'COMPLETED');
    const cancelled = normalizedAppointments.filter(a => ['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(a.status));
    const patientIds = new Set(normalizedAppointments.map(a => a.patient_id || a.patient_user_id));

    return {
      upcomingCount: upcoming.length,
      todayCount: todayApts.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      totalPatientsCount: isDoctor ? (patientIds.size || normalizedAppointments.length) : normalizedAppointments.length
    };
  }, [normalizedAppointments, todayStr, isDoctor]);

  // Today Summary Breakdown
  const todaySummary = useMemo(() => {
    const todayApts = normalizedAppointments.filter(a => a.date_str === todayStr);
    const scheduled = todayApts.length;
    const completedToday = todayApts.filter(a => a.status === 'COMPLETED').length;
    const inProgressNow = todayApts.filter(a => a.status === 'IN_CONSULTATION').length;
    const pendingReview = todayApts.filter(a => ['CONFIRMED', 'UPCOMING', 'REQUESTED', 'BOOKED'].includes(a.status)).length;

    return { scheduled, completedToday, inProgressNow, pendingReview };
  }, [normalizedAppointments, todayStr]);

  // Availability Stats
  const availabilityStats = useMemo(() => {
    const available = availabilitySlots.filter(s => !s.is_booked).length;
    const booked = availabilitySlots.filter(s => s.is_booked).length;
    return { available, booked, total: available + booked };
  }, [availabilitySlots]);

  // Filtered Appointments based on Active Tab, Search Query, and Selected Calendar Date
  const filteredAppointments = useMemo(() => {
    let list = [...normalizedAppointments];

    // Filter by Tab
    if (activeTab === 'upcoming') {
      list = list.filter(a => ['UPCOMING', 'CONFIRMED', 'REQUESTED', 'BOOKED', 'IN_CONSULTATION'].includes(a.status));
    } else if (activeTab === 'today') {
      list = list.filter(a => a.date_str === todayStr);
    } else if (activeTab === 'past') {
      list = list.filter(a => ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(a.status));
    }

    // Filter by Calendar Date selection
    if (selectedCalendarDate) {
      const dateMatches = list.filter(a => a.date_str === selectedCalendarDate);
      if (dateMatches.length > 0) list = dateMatches;
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(a =>
        a.patient_name.toLowerCase().includes(q) ||
        a.doctor_name.toLowerCase().includes(q) ||
        a.patient_id.toLowerCase().includes(q) ||
        a.consultation_id.toLowerCase().includes(q) ||
        a.appointment_id.toLowerCase().includes(q) ||
        a.specialty.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'patient') return a.patient_name.localeCompare(b.patient_name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'type') return a.consultation_category.localeCompare(b.consultation_category);
      return new Date(a.slot_start) - new Date(b.slot_start);
    });

    return list;
  }, [normalizedAppointments, activeTab, todayStr, selectedCalendarDate, searchQuery, sortBy]);

  // ── Patient Booking Action Launcher ─────────────────────────────────────
  const handleBookAppointment = async (bookingData) => {
    setBookingLoading(true);
    setError(null);
    try {
      await bookAppointment(bookingData.consultationId, bookingData.slotId, bookingData.reason);
      setShowBookModal(false);
      await loadWorkspaceData(true);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || 'Failed to book appointment.');
    } fontally: {
      setBookingLoading(false);
    }
  };

  // ── Appointment Action Launchers ────────────────────────────────────────
  const handleStartOrJoinConsultation = async (apt) => {
    try {
      const aptId = apt.appointment_id || apt.id;
      if (aptId) {
        await joinAppointment(aptId).catch(err => console.warn("Status update API note:", err));
      }

      setAppointments(prev => prev.map(item =>
        (item.appointment_id === aptId || item.id === aptId)
          ? { ...item, status: 'IN_CONSULTATION' }
          : item
      ));

      sessionStorage.setItem('telemed_consultation_context', JSON.stringify({
        consultationId: apt.consultation_id,
        patientName: apt.patient_name,
        patientId: apt.patient_id,
        doctorName: apt.doctor_name,
        category: apt.consultation_category,
        appointmentId: apt.appointment_id
      }));

      if (onNavigate) {
        onNavigate('consultations');
      } else {
        window.location.href = '/consultations';
      }
    } catch (err) {
      console.error("Failed to transition consultation context:", err);
    }
  };

  const handleUpdateStatus = async (aptId, newStatus, reason = '') => {
    try {
      await updateAppointmentStatus(aptId, newStatus, reason);
      setAppointments(prev => prev.map(a =>
        (a.appointment_id === aptId || a.id === aptId)
          ? { ...a, status: newStatus }
          : a
      ));
      setActiveDropdownId(null);
    } catch (err) {
      console.error("Status update error:", err);
      setError(err.message || "Failed to update status.");
    }
  };

  // Add Availability Slot Handler
  const handleAddSlot = async (e) => {
    e.preventDefault();
    setAddSlotError(null);
    setAddSlotLoading(true);

    try {
      const startIso = `${newSlotDate}T${newSlotStartTime}:00`;
      const endIso = `${newSlotDate}T${newSlotEndTime}:00`;

      if (new Date(endIso) <= new Date(startIso)) {
        throw new Error("Slot end time must be later than start time.");
      }

      await addDoctorAvailabilitySlot(startIso, endIso);
      setShowAddAvailabilityModal(false);
      await loadWorkspaceData(true);
    } catch (err) {
      setAddSlotError(err.message || "Failed to add availability slot. Check for overlapping times.");
    } finally {
      setAddSlotLoading(false);
    }
  };

  // Delete Availability Slot Handler
  const handleDeleteSlot = async (slotId) => {
    try {
      await deleteDoctorAvailabilitySlot(slotId);
      setAvailabilitySlots(prev => prev.filter(s => s.slot_id !== slotId));
    } catch (err) {
      console.error("Failed to delete slot:", err);
    }
  };

  // ── Render Helpers ──────────────────────────────────────────────────────
  const renderConsultationTypeBadge = (category) => {
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('chat') || catLower.includes('virtual')) {
      return (
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/40">
          <MessageSquare size={14} className="text-blue-500" />
          <span>Virtual Chat</span>
        </div>
      );
    }
    if (catLower.includes('video')) {
      return (
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
          <Video size={14} className="text-amber-500" />
          <span>Video Call</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-lg border border-sky-200/60 dark:border-sky-800/40">
        <Phone size={14} className="text-sky-500" />
        <span>Audio Call</span>
      </div>
    );
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'UPCOMING':
      case 'REQUESTED':
      case 'BOOKED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {status === 'REQUESTED' ? 'PENDING' : 'UPCOMING'}
          </span>
        );
      case 'CONFIRMED':
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            CONFIRMED
          </span>
        );
      case 'IN_CONSULTATION':
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            IN PROGRESS
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800">
            COMPLETED
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            {status === 'NO_SHOW' ? 'NO SHOW' : status === 'REJECTED' ? 'REJECTED' : 'CANCELLED'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  const renderActionButton = (apt) => {
    const catLower = (apt.consultation_category || '').toLowerCase();
    const isCompletedOrCancelled = ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(apt.status);

    if (isCompletedOrCancelled) {
      return (
        <button
          onClick={() => setSelectedAppointmentDetails(apt)}
          className="px-3.5 py-1.5 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Eye size={14} />
          View Details
        </button>
      );
    }

    if (isDoctor && apt.status === 'REQUESTED') {
      return (
        <button
          onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
          className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Check size={14} />
          Accept Request
        </button>
      );
    }

    if (catLower.includes('chat') || catLower.includes('virtual')) {
      return (
        <button
          onClick={() => handleStartOrJoinConsultation(apt)}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <MessageSquare size={14} />
          Start Chat
        </button>
      );
    }

    if (catLower.includes('video')) {
      return (
        <button
          onClick={() => handleStartOrJoinConsultation(apt)}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Video size={14} />
          Join Call
        </button>
      );
    }

    return (
      <button
        onClick={() => handleStartOrJoinConsultation(apt)}
        className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
      >
        <Phone size={14} />
        Start Call
      </button>
    );
  };

  // Mini Monthly Calendar Generator for Right Column
  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: daysInPrevMonth - firstDay + 1 + i, current: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasApt = normalizedAppointments.some(a => a.date_str === dateStr);
      cells.push({ day: i, current: true, dateStr, hasApt });
    }
    const remaining = 35 - cells.length > 0 ? 35 - cells.length : 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, current: false });
    }
    return cells;
  }, [calYear, calMonth, normalizedAppointments]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] transition-colors duration-200">

      {/* ── Main Content Container ──────────────────────────────────────── */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">

        {/* Page Title & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[var(--text-main)] tracking-tight">
              {isDoctor ? 'Appointments & Schedule' : 'Appointments & Teleconsultations'}
            </h1>
            <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
              {isDoctor ? 'Manage your patient appointments and availability' : 'Schedule and join teleconsultation sessions with verified doctors'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            {isDoctor ? (
              <button
                onClick={() => setShowAddAvailabilityModal(true)}
                className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                + Add Availability
              </button>
            ) : (
              <button
                onClick={() => setShowBookModal(true)}
                className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                + Book Appointment
              </button>
            )}

            <button
              onClick={() => loadWorkspaceData(true)}
              disabled={refreshing}
              className="p-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-surface)] hover:bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl transition-all shadow-xs cursor-pointer"
              title="Refresh Schedule"
            >
              <RefreshCw size={16} className={refreshing ? 'spin text-blue-600' : ''} />
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ────────────────────────────────────────────── */}
        <div className="border-b border-[var(--border-subtle)] flex items-center gap-1 sm:gap-6 overflow-x-auto no-scrollbar">
          {[
            { id: 'upcoming', label: 'Upcoming', icon: Calendar },
            { id: 'today', label: 'Today', icon: Clock },
            { id: 'past', label: 'Past & Cancelled', icon: CheckCircle2 },
            ...(isDoctor ? [{ id: 'availability', label: 'Availability', icon: CalendarDays }] : []),
            { id: 'calendar', label: 'Calendar View', icon: Calendar },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 sm:px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-subtle)]'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 5 Dynamic KPI Summary Cards ────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-2xl font-black text-[var(--text-main)] leading-none block">{String(kpiCounts.upcomingCount).padStart(2, '0')}</span>
              <span className="text-xs font-semibold text-[var(--text-main)] block mt-1">Upcoming</span>
              <span className="text-[10px] text-[var(--text-muted)] block font-medium">Next 7 days</span>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-2xl font-black text-[var(--text-main)] leading-none block">{String(kpiCounts.todayCount).padStart(2, '0')}</span>
              <span className="text-xs font-semibold text-[var(--text-main)] block mt-1">Today</span>
              <span className="text-[10px] text-[var(--text-muted)] block font-medium">Scheduled</span>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-2xl font-black text-[var(--text-main)] leading-none block">{kpiCounts.completedCount}</span>
              <span className="text-xs font-semibold text-[var(--text-main)] block mt-1">Completed</span>
              <span className="text-[10px] text-[var(--text-muted)] block font-medium">This month</span>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-xs flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <XCircle size={20} />
            </div>
            <div>
              <span className="text-2xl font-black text-[var(--text-main)] leading-none block">{String(kpiCounts.cancelledCount).padStart(2, '0')}</span>
              <span className="text-xs font-semibold text-[var(--text-main)] block mt-1">Cancelled</span>
              <span className="text-[10px] text-[var(--text-muted)] block font-medium">This month</span>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-xs flex items-start gap-3.5 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div>
              <span className="text-2xl font-black text-[var(--text-main)] leading-none block">{kpiCounts.totalPatientsCount}</span>
              <span className="text-xs font-semibold text-[var(--text-main)] block mt-1">{isDoctor ? 'Total Patients' : 'Total Consultations'}</span>
              <span className="text-[10px] text-[var(--text-muted)] block font-medium">Recorded</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => loadWorkspaceData(true)} className="underline font-bold hover:text-rose-900 cursor-pointer">Retry</button>
          </div>
        )}

        {/* ── Main Layout: Left Appointments Table (2/3) & Right Sidebar (1/3) ── */}
        {['upcoming', 'today', 'past'].includes(activeTab) && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Appointments Table Section (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">

              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] shadow-xs overflow-hidden">

                {/* Table Header Controls */}
                <div className="p-4 sm:px-6 sm:py-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-600" />
                    <h2 className="text-sm font-bold text-[var(--text-main)] capitalize">
                      {activeTab === 'upcoming' ? 'Upcoming Appointments' : activeTab === 'today' ? "Today's Appointments" : 'Past & Cancelled Appointments'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] font-semibold focus:outline-none focus:border-blue-600"
                    >
                      <option value="date">Date</option>
                      <option value="patient">{isDoctor ? 'Patient Name' : 'Doctor Name'}</option>
                      <option value="status">Status</option>
                      <option value="type">Consultation Type</option>
                    </select>
                  </div>
                </div>

                {/* Table Body / Content */}
                {loading ? (
                  <div className="p-12 text-center text-xs text-[var(--text-muted)] space-y-3">
                    <RefreshCw size={24} className="spin mx-auto text-blue-600" />
                    <p>Loading appointments workspace...</p>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  /* Genuine Empty State */
                  <div className="p-12 text-center space-y-4 max-w-md mx-auto">
                    <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                      <Calendar size={28} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-main)]">
                        {isDoctor ? 'No Upcoming Patient Appointments' : 'No Scheduled Appointments'}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {isDoctor
                          ? 'Your scheduled patient consultations will appear here.'
                          : 'You have no scheduled appointments. Book a session with a verified specialist.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      {isDoctor ? (
                        <>
                          <button
                            onClick={() => setActiveTab('availability')}
                            className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all cursor-pointer"
                          >
                            Manage Availability
                          </button>
                          <button
                            onClick={() => setActiveTab('calendar')}
                            className="px-4 py-2 text-xs font-semibold text-[var(--text-main)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl transition-all cursor-pointer"
                          >
                            View Calendar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowBookModal(true)}
                          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer"
                        >
                          Book Your First Appointment
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Appointments Table */
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] text-[var(--text-muted)] font-bold text-[10px] uppercase tracking-wider">
                          <th className="py-3 px-4 sm:px-6">TIME</th>
                          <th className="py-3 px-4">{isDoctor ? 'PATIENT' : 'PHYSICIAN'}</th>
                          <th className="py-3 px-4">DETAILS</th>
                          <th className="py-3 px-4">TYPE</th>
                          <th className="py-3 px-4">STATUS</th>
                          <th className="py-3 px-4 sm:px-6 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {filteredAppointments.map((apt) => (
                          <tr key={apt.id} className="hover:bg-[var(--bg-primary)]/50 transition-colors">

                            {/* TIME Column */}
                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap font-medium">
                              <span className="block text-xs font-bold text-[var(--text-main)]">{apt.relative_display}</span>
                              <span className="text-[10px] text-[var(--text-muted)] font-semibold">{formatTimeOnly(apt.time_str)}</span>
                            </td>

                            {/* PATIENT / PHYSICIAN Column */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                                  {(isDoctor ? apt.patient_name : apt.doctor_name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="block text-xs font-bold text-[var(--text-main)]">
                                    {isDoctor ? apt.patient_name : apt.doctor_name}
                                  </span>
                                  <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                                    {isDoctor ? `PID: ${apt.patient_id}` : apt.specialty}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* DETAILS Column */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="block text-xs font-semibold text-[var(--text-main)]">Consultation ID</span>
                              <span className="text-[10px] font-mono text-[var(--text-muted)] block">{apt.consultation_id}</span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium block">{apt.specialty}</span>
                            </td>

                            {/* TYPE Column */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              {renderConsultationTypeBadge(apt.consultation_category)}
                            </td>

                            {/* STATUS Column */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              {renderStatusBadge(apt.status)}
                            </td>

                            {/* ACTION Column */}
                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2 relative dropdown-container">
                                {renderActionButton(apt)}

                                {/* Options Dropdown Button */}
                                <button
                                  onClick={() => setActiveDropdownId(activeDropdownId === apt.id ? null : apt.id)}
                                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg hover:bg-[var(--bg-primary)] transition-colors cursor-pointer"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {/* Dropdown Menu Popup */}
                                {activeDropdownId === apt.id && (
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-lg z-50 py-1 text-left">
                                    <button
                                      onClick={() => { setSelectedAppointmentDetails(apt); setActiveDropdownId(null); }}
                                      className="w-full px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-primary)] flex items-center gap-2 cursor-pointer"
                                    >
                                      <Eye size={14} />
                                      View Details
                                    </button>
                                    {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(apt.status) && (
                                      <button
                                        onClick={() => handleStartOrJoinConsultation(apt)}
                                        className="w-full px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-primary)] flex items-center gap-2 cursor-pointer"
                                      >
                                        <Stethoscope size={14} />
                                        Open Consultation
                                      </button>
                                    )}
                                    {isDoctor && ['REQUESTED', 'BOOKED'].includes(apt.status) && (
                                      <button
                                        onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                                        className="w-full px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Check size={14} />
                                        Confirm Appointment
                                      </button>
                                    )}
                                    {isDoctor && ['CONFIRMED', 'IN_CONSULTATION'].includes(apt.status) && (
                                      <button
                                        onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                                        className="w-full px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <CheckCircle2 size={14} />
                                        Complete Consultation
                                      </button>
                                    )}
                                    {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(apt.status) && (
                                      <button
                                        onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                                        className="w-full px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                      >
                                        <XCircle size={14} />
                                        Cancel Appointment
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer View All Link */}
                <div className="p-4 border-t border-[var(--border-subtle)] text-center">
                  <button
                    onClick={() => setActiveTab('past')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View past & cancelled appointments</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>

              </div>

              {/* ── Today's Schedule Summary Section ──────────────────────── */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-main)]">Today's Schedule Summary</h3>
                      <p className="text-[10px] text-[var(--text-muted)] font-medium">Real-time consultation throughput overview</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('today')}
                    className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  >
                    View Today's Agenda
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-[var(--border-subtle)]">
                  <div>
                    <span className="text-xl font-black text-[var(--text-main)] block">{String(todaySummary.scheduled).padStart(2, '0')}</span>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Scheduled Today</span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block">{String(todaySummary.completedToday).padStart(2, '0')}</span>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Completed Today</span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400 block">{String(todaySummary.inProgressNow).padStart(2, '0')}</span>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">In Progress Now</span>
                  </div>
                  <div>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 block">{String(todaySummary.pendingReview).padStart(2, '0')}</span>
                    <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Upcoming Sessions</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ── Right Column Sidebar (4 Cols) ─────────────────────────── */}
            <div className="lg:col-span-4 space-y-6">

              {/* Card 1: Availability Overview (Doctor Only) */}
              {isDoctor && (
                <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-main)]">Availability Overview</h3>
                    <select
                      value={availabilityTimeRange}
                      onChange={(e) => setAvailabilityTimeRange(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] font-semibold focus:outline-none"
                    >
                      <option value="This Week">This Week</option>
                      <option value="This Month">This Month</option>
                      <option value="Today">Today</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Available Slots</span>
                      <span className="text-xl font-black text-[var(--text-main)] block mt-0.5">{availabilityStats.available}</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">Total</span>
                    </div>
                    <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border-subtle)]">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)] block">Booked Slots</span>
                      <span className="text-xl font-black text-blue-600 dark:text-blue-400 block mt-0.5">{availabilityStats.booked}</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">Total</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 2: Interactive Calendar View */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" />
                    <h3 className="text-sm font-bold text-[var(--text-main)]">Calendar</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[var(--text-main)] mr-1">{MONTH_NAMES[calMonth]} {calYear}</span>
                    <button
                      onClick={() => {
                        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                        else setCalMonth(m => m - 1);
                      }}
                      className="p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)] cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                        else setCalMonth(m => m + 1);
                      }}
                      className="p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)] cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[var(--text-muted)]">
                  {DAY_SHORT.map(d => <span key={d}>{d}</span>)}
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {calendarCells.map((c, i) => {
                    const isSelected = selectedCalendarDate === c.dateStr;
                    return (
                      <button
                        key={i}
                        disabled={!c.current}
                        onClick={() => c.dateStr && setSelectedCalendarDate(c.dateStr)}
                        className={`py-2 rounded-xl transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                          !c.current ? 'text-[var(--text-muted)] opacity-30 cursor-default' :
                          isSelected ? 'bg-blue-600 text-white font-bold shadow-xs' :
                          'text-[var(--text-main)] hover:bg-[var(--bg-primary)] font-medium'
                        }`}
                      >
                        <span>{c.day}</span>
                        {c.hasApt && (
                          <span className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setActiveTab('calendar')}
                  className="w-full py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all text-center block cursor-pointer"
                >
                  View Full Calendar
                </button>
              </div>

              {/* Card 3: Need Help? */}
              <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <HelpCircle size={18} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Need Help?</h3>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-medium">Facing issues with appointments or consultations?</p>
                <button
                  onClick={() => setShowSupportModal(true)}
                  className="w-full py-2.5 text-xs font-semibold text-blue-600 bg-[var(--bg-primary)] hover:bg-[var(--border-subtle)] border border-blue-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <PhoneCall size={14} />
                  Contact Support
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ── Tab: Availability Management View (Doctor Only) ──────────────── */}
        {activeTab === 'availability' && isDoctor && (
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-main)]">Doctor Consultation Availability Slots</h2>
                <p className="text-xs text-[var(--text-muted)]">Configure time windows where patients can book teleconsultations with you.</p>
              </div>
              <button
                onClick={() => setShowAddAvailabilityModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus size={16} />
                Add New Slot
              </button>
            </div>

            {availabilitySlots.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <CalendarDays size={32} className="mx-auto text-[var(--text-muted)]" />
                <p className="text-xs text-[var(--text-muted)] font-medium">No custom availability slots created yet.</p>
                <button
                  onClick={() => setShowAddAvailabilityModal(true)}
                  className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 rounded-xl cursor-pointer"
                >
                  Create Your First Availability Slot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availabilitySlots.map(slot => (
                  <div key={slot.slot_id} className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-[var(--text-main)]">{formatDateFull(slot.slot_start.split('T')[0])}</span>
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block mt-0.5">
                        {formatTimeOnly(slot.slot_start.split('T')[1]?.slice(0, 5))} - {formatTimeOnly(slot.slot_end.split('T')[1]?.slice(0, 5))}
                      </span>
                      <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${slot.is_booked ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {slot.is_booked ? 'BOOKED' : 'AVAILABLE'}
                      </span>
                    </div>
                    {!slot.is_booked && (
                      <button
                        onClick={() => handleDeleteSlot(slot.slot_id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Slot"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Full Calendar Grid View ─────────────────────────────────── */}
        {activeTab === 'calendar' && (
          <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <h2 className="text-base font-bold text-[var(--text-main)]">Schedule Calendar ({MONTH_NAMES[calMonth]} {calYear})</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                    else setCalMonth(m => m - 1);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] cursor-pointer"
                >
                  Previous Month
                </button>
                <button
                  onClick={() => {
                    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                    else setCalMonth(m => m + 1);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] cursor-pointer"
                >
                  Next Month
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[var(--text-muted)]">
              {DAY_SHORT.map(d => <span key={d} className="py-2 bg-[var(--bg-primary)] rounded-lg">{d}</span>)}
            </div>

            <div className="grid grid-cols-7 gap-2 text-xs">
              {calendarCells.map((c, i) => (
                <div
                  key={i}
                  className={`min-h-[90px] p-2 rounded-xl border border-[var(--border-subtle)] flex flex-col justify-between ${
                    !c.current ? 'bg-[var(--bg-primary)]/40 opacity-40' : 'bg-[var(--bg-primary)]'
                  }`}
                >
                  <span className="font-bold text-[var(--text-main)]">{c.day}</span>
                  {c.dateStr && (
                    <div className="space-y-1">
                      {normalizedAppointments
                        .filter(a => a.date_str === c.dateStr)
                        .slice(0, 2)
                        .map(apt => (
                          <div
                            key={apt.id}
                            onClick={() => setSelectedAppointmentDetails(apt)}
                            className="p-1 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 truncate cursor-pointer hover:opacity-80"
                          >
                            {formatTimeOnly(apt.time_str)} - {isDoctor ? apt.patient_name : apt.doctor_name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ── Patient Book Appointment Modal ─────────────────────────────── */}
      {showBookModal && (
        <AppointmentBookingModal
          isOpen={showBookModal}
          onClose={() => setShowBookModal(false)}
          doctors={verifiedDoctors}
          consultations={consultationsList}
          onBook={handleBookAppointment}
          isLoading={bookingLoading}
        />
      )}

      {/* ── Add Availability Modal (Doctor Only) ───────────────────────── */}
      {showAddAvailabilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-main)]">Add Consultation Slot</h3>
              <button onClick={() => setShowAddAvailabilityModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {addSlotError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{addSlotError}</span>
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-muted)] font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-muted)] font-semibold mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSlotStartTime}
                    onChange={(e) => setNewSlotStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] font-semibold mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSlotEndTime}
                    onChange={(e) => setNewSlotEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddAvailabilityModal(false)}
                  className="px-4 py-2 font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSlotLoading}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  {addSlotLoading && <RefreshCw size={14} className="spin" />}
                  <span>Save Availability Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Appointment Details Drawer Modal ─────────────────────────────── */}
      {selectedAppointmentDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-main)]">Consultation Details</h3>
              <button onClick={() => setSelectedAppointmentDetails(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <span className="block font-bold text-[var(--text-main)] text-sm">
                    {isDoctor ? selectedAppointmentDetails.patient_name : selectedAppointmentDetails.doctor_name}
                  </span>
                  <span className="text-[var(--text-muted)] font-semibold">
                    {isDoctor ? `Patient ID: ${selectedAppointmentDetails.patient_id}` : selectedAppointmentDetails.specialty}
                  </span>
                </div>
                {renderStatusBadge(selectedAppointmentDetails.status)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] font-semibold block">Scheduled Time</span>
                  <span className="font-bold text-[var(--text-main)] block mt-0.5">{selectedAppointmentDetails.relative_display}</span>
                </div>
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] font-semibold block">Consultation ID</span>
                  <span className="font-bold text-[var(--text-main)] block mt-0.5 font-mono">{selectedAppointmentDetails.consultation_id}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[var(--text-muted)] font-semibold block">Notes / Reason</span>
                <p className="text-[var(--text-main)]">{selectedAppointmentDetails.notes}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <button
                onClick={() => setSelectedAppointmentDetails(null)}
                className="px-4 py-2 font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer text-xs"
              >
                Close
              </button>
              {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(selectedAppointmentDetails.status) && (
                <button
                  onClick={() => {
                    const apt = selectedAppointmentDetails;
                    setSelectedAppointmentDetails(null);
                    handleStartOrJoinConsultation(apt);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Stethoscope size={14} />
                  Open Consultation Session
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Contact Support Modal ─────────────────────────────────────────── */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-main)]">Technical Support</h3>
              <button onClick={() => setShowSupportModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[var(--text-muted)] font-medium">Need immediate assistance with scheduling or teleconsultation sessions?</p>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-1">
                <span className="font-bold block">Support Hotline (24/7)</span>
                <span className="text-sm font-black block">+1 (800) 555-TELEMED</span>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                <span className="font-bold block text-[var(--text-main)]">Email Support</span>
                <span className="text-[var(--text-muted)]">support@telemedai.health</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowSupportModal(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
