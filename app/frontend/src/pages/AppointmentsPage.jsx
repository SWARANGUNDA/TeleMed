import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, User, Stethoscope,
  Video, Phone, Search, RefreshCw, ChevronRight, ChevronLeft, MessageSquare,
  Shield, HelpCircle, MoreVertical, Filter, Eye, UserCheck, CalendarDays,
  X, Check, Sparkles, PhoneCall, VideoOff, MessageCircle, FileText, ArrowUpRight,
  Trash2, Layers, CheckCircle, ShieldCheck, Zap, Sliders, Sun, Moon, Sunset, Play
} from 'lucide-react';
import {
  fetchUserAppointments, fetchMyDoctorAvailability, addDoctorAvailabilitySlot,
  deleteDoctorAvailabilitySlot, updateAppointmentStatus, joinAppointment,
  fetchVerifiedDoctors, bookAppointment, fetchPatientConsultations,
  fetchDoctorConsultations, fetchOpenConsultations, configureDoctorAvailability,
  getAuthToken, getWsBaseUrl
} from '../api/client';
import AppointmentBookingModal from '../components/AppointmentBookingModal';
import { HighlightMatch } from '../components/ui';

// ── Date & Time Formatting Helpers ─────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_SHORT   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

function formatRelativeTime(dateStr, timeStr) {
  if (!dateStr) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
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
  const role = user?.role?.toUpperCase() || 'PATIENT';
  const isPatient = role === 'PATIENT';
  const isDoctor = role === 'DOCTOR';

  const userName = user?.full_name || user?.name || (isDoctor ? 'Dr. Arjun Sarkaar' : 'Patient');

  // Navigation & View States
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'today', 'past', 'availability', 'calendar'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const [sortBy, setSortBy] = useState('date');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [slotFilter, setSlotFilter] = useState('all'); // 'all', 'upcoming', 'today', 'available', 'booked', 'past'
  const [slotDateFilter, setSlotDateFilter] = useState('all');

  // Real Data States
  const [appointments, setAppointments] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [verifiedDoctors, setVerifiedDoctors] = useState([]);
  const [consultationsList, setConsultationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Modals & Drawers
  const [showAddAvailabilityModal, setShowAddAvailabilityModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // ── Flexible Add Availability State ─────────────────────────────────────
  const [availabilityMode, setAvailabilityMode] = useState('bulk'); // 'bulk' or 'single'
  const [newSlotDate, setNewSlotDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Single Mode State
  const [singleStartTime, setSingleStartTime] = useState('10:00');
  const [singleEndTime, setSingleEndTime] = useState('10:30');

  // Bulk Generator State
  const [shiftStartTime, setShiftStartTime] = useState('09:00');
  const [shiftEndTime, setShiftEndTime] = useState('13:00');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(30);
  const [breakBufferMinutes, setBreakBufferMinutes] = useState(0);
  const [excludedSlots, setExcludedSlots] = useState(new Set()); // slots deselected by doctor in preview

  const [addSlotError, setAddSlotError] = useState(null);
  const [addSlotLoading, setAddSlotLoading] = useState(false);

  // Calendar State
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const socketRef = useRef(null);

  // Trigger Toast Notification
  const notify = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Load Real Data from Backend APIs
  const loadWorkspaceData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [aptsData, docsData, consData] = await Promise.all([
        fetchUserAppointments().catch(() => []),
        fetchVerifiedDoctors().catch(() => []),
        isDoctor
          ? Promise.all([
              fetchDoctorConsultations('').catch(() => ({ consultations: [] })),
              fetchOpenConsultations().catch(() => ({ consultations: [] }))
            ]).then(([assigned, open]) => {
              const a = assigned?.consultations || (Array.isArray(assigned) ? assigned : []);
              const o = open?.consultations || (Array.isArray(open) ? open : []);
              const allMap = new Map();
              a.forEach(c => allMap.set(c.consultation_id || c.id, c));
              o.forEach(c => {
                const k = c.consultation_id || c.id;
                if (!allMap.has(k)) allMap.set(k, c);
              });
              return { consultations: Array.from(allMap.values()) };
            }).catch(() => ({ consultations: [] }))
          : fetchPatientConsultations().catch(() => ({ consultations: [] }))
      ]);

      const baseApts = Array.isArray(aptsData) ? aptsData : (aptsData?.appointments || []);
      const consList = consData?.consultations || (Array.isArray(consData) ? consData : []);
      const aptConsultationIds = new Set(baseApts.map(a => a.consultation_id).filter(Boolean));

      // Synthesize any consultations that don't yet have dedicated appointment rows
      const synthesizedFromCons = consList
        .filter(c => !aptConsultationIds.has(c.consultation_id || c.id))
        .map(c => {
          const cStatus = (c.status || 'UPCOMING').toUpperCase();
          let aptStatus = 'UPCOMING';
          if (['ASSIGNED', 'ACCEPTED', 'CONFIRMED'].includes(cStatus)) aptStatus = 'CONFIRMED';
          else if (['ACTIVE', 'IN_PROGRESS', 'IN_CONSULTATION'].includes(cStatus)) aptStatus = 'IN_CONSULTATION';
          else if (['COMPLETED', 'CLOSED'].includes(cStatus)) aptStatus = 'COMPLETED';
          else if (['CANCELLED', 'REJECTED'].includes(cStatus)) aptStatus = 'CANCELLED';

          return {
            id: `apt_syn_${c.consultation_id || c.id}`,
            appointment_id: `apt_syn_${c.consultation_id || c.id}`,
            consultation_id: c.consultation_id || c.id,
            patient_id: c.patient_id || user?.user_id || 'PAT-10001',
            patient_name: c.patient_name || (isPatient ? userName : 'Patient'),
            doctor_id: c.assigned_doctor_id || c.doctor_id,
            doctor_name: c.assigned_doctor_name || c.doctor_name || (isDoctor ? userName : (c.assigned_doctor_id ? 'Assigned Specialist' : 'Pending Specialist')),
            doctor_specialization: c.specialization || 'General Medicine',
            consultation_category: c.category || 'General Consultation',
            urgency: c.urgency || 'ROUTINE',
            status: aptStatus,
            slot_start: c.created_at || new Date().toISOString(),
            slot_end: new Date(new Date(c.created_at || Date.now()).getTime() + 30 * 60000).toISOString(),
            notes: c.reason || c.message || 'Clinical Consultation',
            created_at: c.created_at,
            updated_at: c.updated_at
          };
        });

      setAppointments([...baseApts, ...synthesizedFromCons]);
      setVerifiedDoctors((docsData || []).map(d => ({
        id: d.doctor_profile?.doctor_id || d.user_id,
        userId: d.user_id,
        name: d.doctor_profile?.full_name || d.full_name || 'Doctor',
        specialty: d.doctor_profile?.specialization || 'General Medicine',
        experience: d.doctor_profile?.experience_years ? `${d.doctor_profile.experience_years}+ Years Exp.` : null,
        avatar: (d.doctor_profile?.full_name || d.full_name || 'D').split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
      })));
      setConsultationsList(consList);

      if (isDoctor) {
        const slotsData = await fetchMyDoctorAvailability(false).catch(() => []);
        setAvailabilitySlots(slotsData || []);
      }
    } catch (err) {
      setError(err.message || "Failed to sync real-time appointments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isDoctor, isPatient, userName, user]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Real-Time WebSocket Listener
  useEffect(() => {
    if (!user?.user_id) return;
    let ws = null;
    let pingInterval = null;

    try {
      const wsBase = getWsBaseUrl();
      if (!wsBase) return;
      const token = getAuthToken() || user.user_id;
      ws = new WebSocket(`${wsBase}/ws/notifications/${user.user_id}?token=${encodeURIComponent(token)}`);
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
      ws.onerror = () => {};
    } catch (e) {}

    return () => {
      if (ws) {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
        } else if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
      if (pingInterval) clearInterval(pingInterval);
      socketRef.current = null;
    };
  }, [user, loadWorkspaceData]);

  // Outside click listener for dropdown menus and search overlay
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setActiveDropdownId(null);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Shift Auto-Generator Calculation ──────────────────────────────────
  const generatedShiftSlots = useMemo(() => {
    if (availabilityMode !== 'bulk' || !shiftStartTime || !shiftEndTime || !newSlotDate) return [];

    const slots = [];
    const [startH, startM] = shiftStartTime.split(':').map(Number);
    const [endH, endM] = shiftEndTime.split(':').map(Number);

    let curr = new Date(`${newSlotDate}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`);
    const limit = new Date(`${newSlotDate}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`);

    const durMs = slotDurationMinutes * 60 * 1000;
    const bufMs = breakBufferMinutes * 60 * 1000;

    let index = 0;
    while (curr.getTime() + durMs <= limit.getTime()) {
      const slotEnd = new Date(curr.getTime() + durMs);
      
      const startStr = curr.toTimeString().slice(0, 5);
      const endStr = slotEnd.toTimeString().slice(0, 5);
      const slotKey = `${startStr}-${endStr}`;

      const startIso = `${newSlotDate}T${startStr}:00Z`;
      const endIso = `${newSlotDate}T${endStr}:00Z`;

      slots.push({
        id: `gen_${index++}_${slotKey}`,
        key: slotKey,
        startStr,
        endStr,
        startIso,
        endIso,
        display: `${formatTimeOnly(startStr)} - ${formatTimeOnly(endStr)}`,
        excluded: excludedSlots.has(slotKey)
      });

      curr = new Date(slotEnd.getTime() + bufMs);
    }

    return slots;
  }, [availabilityMode, shiftStartTime, shiftEndTime, newSlotDate, slotDurationMinutes, breakBufferMinutes, excludedSlots]);

  // Active slots ready to submit in Bulk Mode
  const activeBulkSlots = useMemo(() => {
    return generatedShiftSlots.filter(s => !s.excluded);
  }, [generatedShiftSlots]);

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

  // Today & Filter Calculations
  const { todayStr, utcTodayStr } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return {
      todayStr: `${y}-${m}-${d}`,
      utcTodayStr: now.toISOString().split('T')[0]
    };
  }, []);

  const kpiCounts = useMemo(() => {
    const upcoming = normalizedAppointments.filter(a => ['UPCOMING', 'CONFIRMED', 'REQUESTED', 'BOOKED', 'ASSIGNED', 'ACCEPTED', 'ACTIVE', 'IN_PROGRESS'].includes(a.status));
    const todayApts = normalizedAppointments.filter(a => a.date_str === todayStr || a.date_str === utcTodayStr);
    const completed = normalizedAppointments.filter(a => ['COMPLETED', 'CLOSED'].includes(a.status));
    const cancelled = normalizedAppointments.filter(a => ['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(a.status));
    const patientIds = new Set(normalizedAppointments.map(a => a.patient_id || a.patient_user_id));

    return {
      upcomingCount: upcoming.length,
      todayCount: todayApts.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      totalPatientsCount: isDoctor ? (patientIds.size || normalizedAppointments.length) : normalizedAppointments.length
    };
  }, [normalizedAppointments, todayStr, utcTodayStr, isDoctor]);

  const todaySummary = useMemo(() => {
    const todayApts = normalizedAppointments.filter(a => a.date_str === todayStr || a.date_str === utcTodayStr);
    const scheduled = todayApts.length;
    const completedToday = todayApts.filter(a => ['COMPLETED', 'CLOSED'].includes(a.status)).length;
    const inProgressNow = todayApts.filter(a => ['IN_CONSULTATION', 'IN_PROGRESS', 'ACTIVE'].includes(a.status)).length;
    const pendingReview = normalizedAppointments.filter(a => ['CONFIRMED', 'UPCOMING', 'REQUESTED', 'BOOKED', 'ASSIGNED', 'ACCEPTED'].includes(a.status)).length;

    return { scheduled, completedToday, inProgressNow, pendingReview };
  }, [normalizedAppointments, todayStr, utcTodayStr]);

  const filteredAppointments = useMemo(() => {
    let list = [...normalizedAppointments];

    if (activeTab === 'upcoming') {
      list = list.filter(a => ['UPCOMING', 'CONFIRMED', 'REQUESTED', 'BOOKED', 'IN_CONSULTATION', 'ASSIGNED', 'ACCEPTED', 'ACTIVE', 'IN_PROGRESS'].includes(a.status));
    } else if (activeTab === 'today') {
      list = list.filter(a => a.date_str === todayStr || a.date_str === utcTodayStr);
    } else if (activeTab === 'past') {
      list = list.filter(a => ['COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(a.status));
    }

    if (selectedCalendarDate) {
      list = list.filter(a => a.date_str === selectedCalendarDate);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      list = list
        .map((a) => {
          const haystack = `${a.patient_name} ${a.doctor_name} ${a.patient_id} ${a.consultation_id} ${a.appointment_id} ${a.specialty} ${a.status} ${a.notes}`.toLowerCase();
          const allMatch = tokens.every((tok) => haystack.includes(tok));
          if (!allMatch) return null;
          let score = 0;
          tokens.forEach((tok) => {
            if (a.patient_name.toLowerCase().startsWith(tok) || a.doctor_name.toLowerCase().startsWith(tok)) score += 30;
            else if (a.patient_name.toLowerCase().includes(tok) || a.doctor_name.toLowerCase().includes(tok)) score += 15;
            if (a.consultation_id.toLowerCase().includes(tok) || a.patient_id.toLowerCase().includes(tok)) score += 20;
            if (a.specialty.toLowerCase().includes(tok)) score += 10;
          });
          return { item: a, score };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (sortBy === 'patient') return a.item.patient_name.localeCompare(b.item.patient_name);
          if (sortBy === 'status') return a.item.status.localeCompare(b.item.status);
          if (sortBy === 'type') return a.item.consultation_category.localeCompare(b.item.consultation_category);
          return new Date(a.item.slot_start) - new Date(b.item.slot_start);
        })
        .map((x) => x.item);
    } else {
      list.sort((a, b) => {
        if (sortBy === 'patient') return a.patient_name.localeCompare(b.patient_name);
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        if (sortBy === 'type') return a.consultation_category.localeCompare(b.consultation_category);
        return new Date(a.slot_start) - new Date(b.slot_start);
      });
    }

    return list;
  }, [normalizedAppointments, activeTab, todayStr, selectedCalendarDate, searchQuery, sortBy]);

  const tomorrowStr = useMemo(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    const y = tm.getFullYear();
    const m = String(tm.getMonth() + 1).padStart(2, '0');
    const d = String(tm.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const processedAvailabilitySlots = useMemo(() => {
    const now = new Date();
    const nowIso = now.toISOString();

    return availabilitySlots.map(slot => {
      const startIso = slot.slot_start || '';
      const endIso = slot.slot_end || slot.slot_start || '';
      const startDate = startIso ? startIso.split('T')[0] : '';
      const startTime = startIso && startIso.includes('T') ? startIso.split('T')[1].slice(0, 5) : '';
      const endTime = endIso && endIso.includes('T') ? endIso.split('T')[1].slice(0, 5) : '';

      const isPast = endIso ? endIso < nowIso : false;
      const isToday = startDate === todayStr || startDate === utcTodayStr;
      const isTomorrow = startDate === tomorrowStr;

      const matchedApt = appointments.find(a => 
        (a.slot_id && slot.slot_id && a.slot_id === slot.slot_id) ||
        (a.slot_start && a.slot_start === slot.slot_start)
      );

      return {
        ...slot,
        startDate,
        startTime,
        endTime,
        isPast,
        isToday,
        isTomorrow,
        matchedApt,
        displayStatus: slot.is_booked 
          ? (isPast ? 'COMPLETED' : 'BOOKED')
          : (isPast ? 'EXPIRED' : 'AVAILABLE')
      };
    }).sort((a, b) => (a.slot_start || '').localeCompare(b.slot_start || ''));
  }, [availabilitySlots, todayStr, utcTodayStr, tomorrowStr, appointments]);

  const uniqueSlotDates = useMemo(() => {
    const dates = new Set();
    processedAvailabilitySlots.forEach(s => {
      if (s.startDate) dates.add(s.startDate);
    });
    return Array.from(dates).sort();
  }, [processedAvailabilitySlots]);

  const slotMetrics = useMemo(() => {
    const total = processedAvailabilitySlots.length;
    const upcomingAvailable = processedAvailabilitySlots.filter(s => !s.isPast && !s.is_booked);
    const upcomingBooked = processedAvailabilitySlots.filter(s => !s.isPast && s.is_booked);
    const todaySlots = processedAvailabilitySlots.filter(s => s.isToday);
    const pastSlots = processedAvailabilitySlots.filter(s => s.isPast && !s.is_booked);
    const completedSlots = processedAvailabilitySlots.filter(s => s.isPast && s.is_booked);
    const totalHours = (upcomingAvailable.length * 0.5).toFixed(1);

    return {
      total,
      upcomingAvailable: upcomingAvailable.length,
      upcomingBooked: upcomingBooked.length,
      todayCount: todaySlots.length,
      pastCount: pastSlots.length,
      completedCount: completedSlots.length,
      totalHours
    };
  }, [processedAvailabilitySlots]);

  const filteredAvailabilitySlots = useMemo(() => {
    let list = [...processedAvailabilitySlots];

    if (slotFilter === 'upcoming') {
      list = list.filter(s => !s.isPast || s.isToday);
    } else if (slotFilter === 'today') {
      list = list.filter(s => s.isToday);
    } else if (slotFilter === 'available') {
      list = list.filter(s => !s.is_booked && (!s.isPast || s.isToday));
    } else if (slotFilter === 'booked') {
      list = list.filter(s => s.is_booked);
    } else if (slotFilter === 'past') {
      list = list.filter(s => s.isPast);
    }

    if (slotDateFilter && slotDateFilter !== 'all') {
      list = list.filter(s => s.startDate === slotDateFilter);
    }

    return list;
  }, [processedAvailabilitySlots, slotFilter, slotDateFilter]);

  const groupedSlotsByDate = useMemo(() => {
    const groups = {};
    for (const slot of filteredAvailabilitySlots) {
      const d = slot.startDate || 'Unspecified Date';
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(slot);
    }

    return Object.keys(groups).sort().map(dateKey => {
      const slots = groups[dateKey];
      const isToday = dateKey === todayStr || dateKey === utcTodayStr;
      const isTomorrow = dateKey === tomorrowStr;
      const isPast = dateKey < todayStr && dateKey < utcTodayStr;
      const openCount = slots.filter(s => !s.is_booked && !s.isPast).length;
      const bookedCount = slots.filter(s => s.is_booked).length;
      const expiredCount = slots.filter(s => !s.is_booked && s.isPast).length;

      return {
        dateKey,
        isToday,
        isTomorrow,
        isPast,
        slots,
        openCount,
        bookedCount,
        expiredCount
      };
    });
  }, [filteredAvailabilitySlots, todayStr, utcTodayStr, tomorrowStr]);

  const selectedDayAppointments = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return normalizedAppointments.filter(a => a.date_str === selectedCalendarDate);
  }, [normalizedAppointments, selectedCalendarDate]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay = new Date(calYear, calMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const prevMonthLastDay = new Date(calYear, calMonth, 0).getDate();

    const cells = [];

    // Fill preceding days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const prevDate = new Date(calYear, calMonth - 1, pDay);
      const mm = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dd = String(pDay).padStart(2, '0');
      const dateStr = `${prevDate.getFullYear()}-${mm}-${dd}`;
      const dayApts = normalizedAppointments.filter(a => a.date_str === dateStr);
      cells.push({
        day: pDay,
        dateStr,
        current: false,
        isToday: dateStr === todayStr,
        apts: dayApts,
        hasApt: dayApts.length > 0,
        aptCount: dayApts.length
      });
    }

    // Fill days of current month
    for (let d = 1; d <= totalDays; d++) {
      const mm = String(calMonth + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${calYear}-${mm}-${dd}`;
      const dayApts = normalizedAppointments.filter(a => a.date_str === dateStr);
      cells.push({
        day: d,
        dateStr,
        current: true,
        isToday: dateStr === todayStr,
        apts: dayApts,
        hasApt: dayApts.length > 0,
        aptCount: dayApts.length
      });
    }

    // Fill trailing days from next month
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(calYear, calMonth + 1, n);
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(n).padStart(2, '0');
      const dateStr = `${nextDate.getFullYear()}-${mm}-${dd}`;
      const dayApts = normalizedAppointments.filter(a => a.date_str === dateStr);
      cells.push({
        day: n,
        dateStr,
        current: false,
        isToday: dateStr === todayStr,
        apts: dayApts,
        hasApt: dayApts.length > 0,
        aptCount: dayApts.length
      });
    }

    return cells;
  }, [calYear, calMonth, normalizedAppointments, todayStr]);

  // ── Handlers & Actions ──────────────────────────────────────────────────
  const handleBookAppointment = async (bookingData) => {
    setBookingLoading(true);
    setError(null);
    try {
      await bookAppointment(
        bookingData.consultationId,
        bookingData.slotId,
        bookingData.reason,
        bookingData.doctorId,
        bookingData.slotStart,
        bookingData.slotEnd
      );
      setShowBookModal(false);
      notify("Appointment booked successfully!");
      await loadWorkspaceData(true);
    } catch (err) {
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleStartOrJoinConsultation = async (apt) => {
    try {
      const aptId = apt.appointment_id || apt.id;
      if (aptId) {
        await joinAppointment(aptId).catch(() => {});
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
      setError(err.message || 'Failed to initialize consultation session.');
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
      notify(`Appointment status updated to ${newStatus}`);
    } catch (err) {
      setError(err.message || "Failed to update status.");
    }
  };

  // Add Availability Slot (Single or Bulk Mode)
  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    setAddSlotError(null);
    setAddSlotLoading(true);

    try {
      if (availabilityMode === 'single') {
        const startIso = `${newSlotDate}T${singleStartTime}:00Z`;
        const endIso = `${newSlotDate}T${singleEndTime}:00Z`;

        if (new Date(endIso) <= new Date(startIso)) {
          throw new Error("Slot end time must be later than start time.");
        }

        const res = await addDoctorAvailabilitySlot(startIso, endIso);
        const newSlot = res.slot || res;
        if (newSlot && newSlot.slot_id) {
          setAvailabilitySlots(prev => [newSlot, ...prev.filter(s => s.slot_id !== newSlot.slot_id)]);
        }
        notify("Availability slot created successfully!");
      } else {
        // Bulk Shift Auto-Generator
        if (activeBulkSlots.length === 0) {
          throw new Error("No active slots selected for generation.");
        }

        const slotsToCreate = activeBulkSlots.map(s => ({
          slot_start: s.startIso,
          slot_end: s.endIso
        }));

        let createdCount = 0;
        const newAdded = [];
        for (const slotItem of slotsToCreate) {
          try {
            const res = await addDoctorAvailabilitySlot(slotItem.slot_start, slotItem.slot_end);
            const savedSlot = res.slot || res;
            if (savedSlot && savedSlot.slot_id) {
              newAdded.push(savedSlot);
              createdCount++;
            }
          } catch (e) {
            // Overlaps are skipped gracefully
          }
        }

        if (newAdded.length > 0) {
          setAvailabilitySlots(prev => [...newAdded, ...prev]);
        }
        notify(`Successfully generated ${createdCount} availability slots for your shift!`);
      }

      setShowAddAvailabilityModal(false);
      await loadWorkspaceData(true);
    } catch (err) {
      setAddSlotError(err.message || "Failed to add availability slots. Please verify times.");
    } finally {
      setAddSlotLoading(false);
    }
  };

  // Delete Availability Slot Handler
  const handleDeleteSlot = async (slotId) => {
    try {
      await deleteDoctorAvailabilitySlot(slotId);
      setAvailabilitySlots(prev => prev.filter(s => s.slot_id !== slotId));
      notify("Availability slot deleted.");
    } catch (err) {
      setError(err.message || "Failed to delete slot.");
    }
  };

  // Clear Expired Availability Slots Handler
  const handleClearExpiredSlots = async () => {
    const nowIso = new Date().toISOString();
    const expiredUnbooked = availabilitySlots.filter(s => {
      const end = s.slot_end || s.slot_start;
      return end < nowIso && !s.is_booked;
    });

    if (expiredUnbooked.length === 0) {
      notify("No expired unbooked slots to clear.");
      return;
    }

    if (!window.confirm(`Are you sure you want to clear ${expiredUnbooked.length} past expired slots?`)) {
      return;
    }

    try {
      setLoading(true);
      let deleted = 0;
      for (const slot of expiredUnbooked) {
        try {
          await deleteDoctorAvailabilitySlot(slot.slot_id);
          deleted++;
        } catch (e) {}
      }
      setAvailabilitySlots(prev => prev.filter(s => !expiredUnbooked.some(e => e.slot_id === s.slot_id)));
      notify(`Cleared ${deleted} expired slots successfully.`);
      await loadWorkspaceData(true);
    } catch (e) {
      setError("Failed to clear some expired slots.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Generate Shift for Target Date
  const handleQuickGenerateShift = async (targetDateStr = todayStr) => {
    try {
      setLoading(true);
      const timeWindows = [
        ['09:00', '09:30'], ['09:40', '10:10'], ['10:20', '10:50'], ['11:00', '11:30'], ['11:40', '12:10'],
        ['14:00', '14:30'], ['14:40', '15:10'], ['15:20', '15:50'], ['16:00', '16:30']
      ];
      let addedCount = 0;
      const newSlots = [];
      for (const [startT, endT] of timeWindows) {
        const startIso = `${targetDateStr}T${startT}:00Z`;
        const endIso = `${targetDateStr}T${endT}:00Z`;
        try {
          const res = await addDoctorAvailabilitySlot(startIso, endIso);
          const s = res.slot || res;
          if (s && s.slot_id) {
            newSlots.push(s);
            addedCount++;
          }
        } catch (e) {}
      }
      if (newSlots.length > 0) {
        setAvailabilitySlots(prev => [...newSlots, ...prev]);
        notify(`Generated ${addedCount} consultation slots for ${formatDateFull(targetDateStr)}!`);
      } else {
        notify(`Slots already exist or overlap for ${formatDateFull(targetDateStr)}.`);
      }
      await loadWorkspaceData(true);
    } catch (err) {
      setError(err.message || "Failed to generate quick schedule.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Excluded Slot in Bulk Preview Grid
  const toggleExcludedSlot = (slotKey) => {
    setExcludedSlots(prev => {
      const next = new Set(prev);
      if (next.has(slotKey)) next.delete(slotKey);
      else next.add(slotKey);
      return next;
    });
  };

  // Quick Preset Shift Selector
  const applyPresetShift = (start, end) => {
    setShiftStartTime(start);
    setShiftEndTime(end);
    setExcludedSlots(new Set());
  };

  // ── Render Helpers ──────────────────────────────────────────────────────
  const renderConsultationTypeBadge = (category) => {
    const catLower = (category || '').toLowerCase();
    if (catLower.includes('chat') || catLower.includes('virtual')) {
      return (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2.5 py-1 rounded-lg">
          <MessageSquare size={13} className="text-blue-600" />
          <span>Virtual Chat</span>
        </div>
      );
    }
    if (catLower.includes('video')) {
      return (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
          <Video size={13} className="text-amber-600" />
          <span>Video Call</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-lg">
        <Phone size={13} className="text-sky-600" />
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
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-700 border border-blue-200">
            {status === 'REQUESTED' ? 'PENDING' : 'UPCOMING'}
          </span>
        );
      case 'CONFIRMED':
      case 'ACCEPTED':
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-200">
            {status === 'ASSIGNED' ? 'ASSIGNED' : 'CONFIRMED'}
          </span>
        );
      case 'IN_CONSULTATION':
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            IN PROGRESS
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-green-100 text-green-800 border border-green-200">
            COMPLETED
          </span>
        );
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_SHOW':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
            {status === 'NO_SHOW' ? 'NO SHOW' : status === 'REJECTED' ? 'REJECTED' : 'CANCELLED'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const renderActionButton = (apt) => {
    const isCompletedOrCancelled = ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW'].includes(apt.status);

    if (isCompletedOrCancelled) {
      return (
        <button
          onClick={() => setSelectedAppointmentDetails(apt)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
        >
          View Details
        </button>
      );
    }

    if (apt.status === 'IN_CONSULTATION') {
      return (
        <button
          onClick={() => handleStartOrJoinConsultation(apt)}
          className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
        >
          <Stethoscope size={14} />
          <span>Resume Session</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => handleStartOrJoinConsultation(apt)}
        className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
      >
        <Stethoscope size={14} />
        <span>Open Session</span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-slide-up">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── TOP HEADER BANNER ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl shadow-xl border border-slate-700/50">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white">Appointments & Clinical Schedule</h1>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" />
                {isDoctor ? 'Doctor Workspace' : 'Patient Telehealth'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {isDoctor
                ? 'Manage consultation availability slots, view patient bookings, and launch live telehealth sessions.'
                : 'Schedule appointments with accredited specialists, view upcoming teleconsultation visits, and review past visits.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => loadWorkspaceData(true)}
            className="p-2.5 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 rounded-xl transition-all cursor-pointer"
            title="Refresh Schedule"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {isDoctor ? (
            <button
              onClick={() => setShowAddAvailabilityModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Availability</span>
            </button>
          ) : (
            <button
              onClick={() => setShowBookModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer text-xs">Dismiss</button>
        </div>
      )}

      {/* ── 5 KPI SUMMARY CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Upcoming</span>
            <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[var(--text-main)] mt-2">{String(kpiCounts.upcomingCount).padStart(2, '0')}</p>
          <p className="text-[10px] text-[var(--text-dim)] mt-0.5">Next 7 days</p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Today</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-400 mt-2">{String(kpiCounts.todayCount).padStart(2, '0')}</p>
          <p className="text-[10px] text-[var(--text-dim)] mt-0.5">Scheduled today</p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-2">{String(kpiCounts.completedCount).padStart(2, '0')}</p>
          <p className="text-[10px] text-[var(--text-dim)] mt-0.5">Total completed</p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Cancelled</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-400 mt-2">{String(kpiCounts.cancelledCount).padStart(2, '0')}</p>
          <p className="text-[10px] text-[var(--text-dim)] mt-0.5">Cancelled / No show</p>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{isDoctor ? 'Total Patients' : 'Consulted Doctors'}</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-purple-400 mt-2">{String(kpiCounts.totalPatientsCount).padStart(2, '0')}</p>
          <p className="text-[10px] text-[var(--text-dim)] mt-0.5">{isDoctor ? 'Recorded patients' : 'Assigned specialists'}</p>
        </div>
      </div>

      {/* ── TABS NAVIGATION ────────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-2 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'upcoming', label: 'Upcoming', icon: Calendar, count: kpiCounts.upcomingCount },
            { id: 'today', label: 'Today', icon: Clock, count: kpiCounts.todayCount },
            { id: 'past', label: 'Past & Cancelled', icon: CheckCircle2, count: kpiCounts.completedCount + kpiCounts.cancelledCount },
            ...(isDoctor ? [{ 
              id: 'availability', 
              label: 'Availability Slots', 
              icon: Layers, 
              count: slotMetrics ? slotMetrics.upcomingAvailable : availabilitySlots.length 
            }] : []),
            { id: 'calendar', label: 'Calendar View', icon: CalendarDays }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedCalendarDate(null); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-primary)]'
                }`}
              >
                {Icon && <Icon size={14} className={activeTab === tab.id ? 'text-white' : 'text-slate-400'} />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--border-subtle)] text-[var(--text-muted)]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedCalendarDate && (
          <button
            onClick={() => setSelectedCalendarDate(null)}
            className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0 pr-2"
          >
            <X size={14} /> Clear Date Filter ({selectedCalendarDate})
          </button>
        )}
      </div>

      {/* ── TAB CONTENT VIEWS ──────────────────────────────────────────────── */}
      
      {/* 1. APPOINTMENTS TIMELINE VIEWS (Upcoming, Today, Past) */}
      {['upcoming', 'today', 'past'].includes(activeTab) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Main Table List (8 cols) */}
          <div className="lg:col-span-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-lg overflow-hidden flex flex-col">
            
            {/* Search & Sort Controls Bar */}
            <div className="p-4 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--bg-primary)]">
              <div ref={searchContainerRef} className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--primary)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSuggestionsOpen(e.target.value.trim().length > 0);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim()) setIsSuggestionsOpen(true);
                  }}
                  placeholder="Live search patient, ID, or doctor..."
                  className="w-full pl-9 pr-14 py-2 text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-dim)] transition-all shadow-xs"
                />
                {searchQuery.trim() && (
                  <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-bold pointer-events-none">
                    {filteredAppointments.length}
                  </span>
                )}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSuggestionsOpen(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--danger)]"
                    title="Clear Search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Floating Autocomplete Dropdown */}
                {isSuggestionsOpen && searchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--bg-surface)] border border-[var(--primary)]/40 rounded-2xl shadow-2xl backdrop-blur-xl max-h-64 overflow-y-auto custom-scrollbar p-2 animate-fadeIn">
                    <div className="px-3 py-1.5 border-b border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)]">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[var(--primary)]" />
                        Elasticsearch Matches
                      </span>
                      <span>{filteredAppointments.length} appointments</span>
                    </div>

                    {filteredAppointments.length > 0 ? (
                      filteredAppointments.slice(0, 5).map((apt, idx) => (
                        <div
                          key={`sugg_${apt.id || idx}`}
                          onClick={() => {
                            setSearchQuery(isDoctor ? apt.patient_name : apt.doctor_name);
                            setIsSuggestionsOpen(false);
                          }}
                          className="p-2.5 hover:bg-[var(--primary)]/10 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--text-main)] truncate">
                              <HighlightMatch text={isDoctor ? apt.patient_name : apt.doctor_name} query={searchQuery} />
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">
                              <HighlightMatch text={apt.consultation_id} query={searchQuery} /> • {apt.relative_display}
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                            {apt.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-[var(--text-muted)]">
                        No appointments match "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-xs text-[var(--text-muted)] font-semibold w-full sm:w-auto justify-end">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-main)] font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="date">Date & Time</option>
                  <option value="patient">Patient Name</option>
                  <option value="status">Status</option>
                  <option value="type">Type</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            {loading ? (
              <div className="py-20 text-center text-xs text-slate-400 space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <p>Syncing clinical appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="py-16 text-center space-y-3 max-w-sm mx-auto my-auto px-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {isDoctor ? 'No Patient Appointments' : 'No Scheduled Appointments'}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isDoctor ? 'Scheduled consultations will appear here once booked by patients.' : 'You have no appointments in this view. Click below to book a consultation.'}
                </p>
                {!isDoctor && (
                  <button
                    onClick={() => setShowBookModal(true)}
                    className="mt-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer"
                  >
                    Book Appointment Now
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4">TIME</th>
                      <th className="py-3 px-4">{isDoctor ? 'PATIENT' : 'PHYSICIAN'}</th>
                      <th className="py-3 px-4">DETAILS</th>
                      <th className="py-3 px-4">TYPE</th>
                      <th className="py-3 px-4">STATUS</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((apt, idx) => (
                      <tr key={`${apt.id || 'apt'}_${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* Time */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-medium">
                          <span className="block text-xs font-bold text-slate-900">{apt.relative_display}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">{formatTimeOnly(apt.time_str)}</span>
                        </td>

                        {/* Patient/Doctor */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                              {(isDoctor ? apt.patient_name : apt.doctor_name).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-slate-900">
                                <HighlightMatch text={isDoctor ? apt.patient_name : apt.doctor_name} query={searchQuery} />
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                {isDoctor ? (
                                  <>PID: <HighlightMatch text={apt.patient_id} query={searchQuery} /></>
                                ) : (
                                  <HighlightMatch text={apt.specialty} query={searchQuery} />
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Details */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="block text-xs font-semibold text-slate-800">Consultation ID</span>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            <HighlightMatch text={apt.consultation_id} query={searchQuery} />
                          </span>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderConsultationTypeBadge(apt.consultation_category)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderStatusBadge(apt.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end space-x-2 relative dropdown-container">
                            {renderActionButton(apt)}

                            <button
                              onClick={() => setActiveDropdownId(activeDropdownId === apt.id ? null : apt.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeDropdownId === apt.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-left">
                                <button
                                  onClick={() => { setSelectedAppointmentDetails(apt); setActiveDropdownId(null); }}
                                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                                >
                                  <Eye size={14} />
                                  <span>View Details</span>
                                </button>
                                {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(apt.status) && (
                                  <button
                                    onClick={() => handleStartOrJoinConsultation(apt)}
                                    className="w-full px-3.5 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 flex items-center space-x-2 cursor-pointer"
                                  >
                                    <Stethoscope size={14} />
                                    <span>Open Consultation</span>
                                  </button>
                                )}
                                {isDoctor && ['REQUESTED', 'BOOKED'].includes(apt.status) && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                                    className="w-full px-3.5 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 flex items-center space-x-2 cursor-pointer"
                                  >
                                    <Check size={14} />
                                    <span>Confirm Session</span>
                                  </button>
                                )}
                                {isDoctor && ['CONFIRMED', 'IN_CONSULTATION'].includes(apt.status) && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                                    className="w-full px-3.5 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 flex items-center space-x-2 cursor-pointer"
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>Mark Complete</span>
                                  </button>
                                )}
                                {!['COMPLETED', 'CANCELLED', 'REJECTED'].includes(apt.status) && (
                                  <button
                                    onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                                    className="w-full px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer"
                                  >
                                    <XCircle size={14} />
                                    <span>Cancel Session</span>
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
          </div>

          {/* Right Sidebar Widgets (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Widget 1: Today's Overview */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Today's Throughput</h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold block">Scheduled Today</span>
                  <span className="text-xl font-extrabold text-[var(--text-main)]">{todaySummary.scheduled}</span>
                </div>
                <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold block">Completed</span>
                  <span className="text-xl font-extrabold text-emerald-400">{todaySummary.completedToday}</span>
                </div>
                <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold block">In Progress</span>
                  <span className="text-xl font-extrabold text-amber-400">{todaySummary.inProgressNow}</span>
                </div>
                <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl">
                  <span className="text-[10px] text-[var(--text-muted)] font-semibold block">Upcoming</span>
                  <span className="text-xl font-extrabold text-[var(--primary)]">{todaySummary.pendingReview}</span>
                </div>
              </div>
            </div>

            {/* Widget 2: Highly Interactive Month Calendar Picker */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3.5 shadow-lg transition-all">
              {/* Header with Month Title & Quick Jump Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-[var(--text-main)] tracking-tight">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      const now = new Date();
                      setCalMonth(now.getMonth());
                      setCalYear(now.getFullYear());
                      setSelectedCalendarDate(todayStr);
                    }}
                    className="px-2 py-1 text-[10px] font-bold rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors cursor-pointer"
                    title="Jump to Today"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                      else setCalMonth(m => m - 1);
                    }}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] rounded-lg cursor-pointer transition-colors"
                    title="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                      else setCalMonth(m => m + 1);
                    }}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] rounded-lg cursor-pointer transition-colors"
                    title="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
                {DAY_SHORT.map(d => <span key={d}>{d}</span>)}
              </div>

              {/* Interactive Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {calendarCells.map((c, i) => {
                  const isSelected = selectedCalendarDate === c.dateStr;
                  const isToday = c.dateStr === todayStr;

                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!c.dateStr) return;
                        if (isSelected) {
                          setSelectedCalendarDate(null);
                        } else {
                          if (!c.current) {
                            const cellDate = new Date(c.dateStr + 'T00:00:00');
                            setCalMonth(cellDate.getMonth());
                            setCalYear(cellDate.getFullYear());
                          }
                          setSelectedCalendarDate(c.dateStr);
                        }
                      }}
                      title={
                        c.dateStr
                          ? `${c.dateStr}${c.aptCount ? ` (${c.aptCount} booking${c.aptCount > 1 ? 's' : ''})` : ''}`
                          : undefined
                      }
                      className={`py-1.5 px-0.5 rounded-xl transition-all relative flex flex-col items-center justify-center cursor-pointer group ${
                        !c.current
                          ? 'text-[var(--text-dim)] opacity-40 hover:opacity-90'
                          : isSelected
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-500/30 scale-105 z-10'
                          : isToday
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-[var(--primary)] font-extrabold ring-1 ring-[var(--primary)]/50 hover:bg-blue-100 dark:hover:bg-blue-900/60'
                          : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] font-semibold'
                      }`}
                    >
                      <span className="leading-tight text-[11px]">{c.day}</span>
                      <div className="h-2 flex items-center justify-center gap-0.5 mt-0.5">
                        {c.aptCount === 1 && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              isSelected ? 'bg-white' : isToday ? 'bg-[var(--primary)]' : 'bg-blue-500'
                            }`}
                          />
                        )}
                        {c.aptCount > 1 && (
                          <span
                            className={`px-1 text-[8px] font-black rounded-full leading-none flex items-center justify-center ${
                              isSelected
                                ? 'bg-white text-blue-600'
                                : 'bg-indigo-600 text-white'
                            }`}
                          >
                            {c.aptCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Interactive Day Agenda / Schedule Peek Drawer */}
              {selectedCalendarDate ? (
                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-extrabold text-[var(--text-main)] truncate">
                        {formatDateFull(selectedCalendarDate)}
                      </span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                        selectedDayAppointments.length > 0
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-dim)]'
                      }`}>
                        {selectedDayAppointments.length} {selectedDayAppointments.length === 1 ? 'Slot' : 'Slots'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedCalendarDate(null)}
                      className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center gap-0.5 cursor-pointer shrink-0 ml-1"
                      title="Clear date filter"
                    >
                      <X size={12} /> Clear
                    </button>
                  </div>

                  {selectedDayAppointments.length > 0 ? (
                    <div className="space-y-1.5 max-h-[190px] overflow-y-auto custom-scrollbar pr-0.5">
                      {selectedDayAppointments.map(apt => (
                        <div
                          key={apt.id}
                          onClick={() => setSelectedAppointmentDetails(apt)}
                          className="p-2.5 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] hover:border-[var(--primary)] transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                          title="Click to view full appointment details"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-[var(--primary)] shrink-0" />
                              <span className="text-[11px] font-extrabold text-[var(--text-main)] font-mono">
                                {formatTimeOnly(apt.time_str)}
                              </span>
                              <span className={`text-[9px] font-extrabold px-1 rounded uppercase ${
                                apt.status === 'CONFIRMED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                              }`}>
                                {apt.status}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-[var(--text-muted)] truncate mt-0.5">
                              {isDoctor ? (apt.patient_name || 'Patient') : (apt.doctor_name || 'Attending Doctor')}
                            </p>
                          </div>
                          <div className="p-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] group-hover:scale-110 transition-transform shrink-0">
                            {apt.appointment_type === 'video' ? <Video size={13} /> : <Phone size={13} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-[var(--bg-primary)] rounded-xl border border-dashed border-[var(--border-subtle)] text-center space-y-2">
                      <p className="text-[11px] text-[var(--text-muted)] font-medium">No appointments scheduled for this date</p>
                      <button
                        onClick={() => {
                          if (isDoctor) setShowAddAvailabilityModal(true);
                          else setShowBookModal(true);
                        }}
                        className="px-3 py-1 bg-[var(--primary)] hover:opacity-90 text-white text-[11px] font-bold rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus size={12} /> {isDoctor ? 'Add Availability Slot' : 'Book Appointment'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-[var(--text-dim)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-[10px]">Active bookings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const now = new Date();
                        setCalMonth(now.getMonth());
                        setCalYear(now.getFullYear());
                        setSelectedCalendarDate(todayStr);
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => {
                        const tm = new Date();
                        tm.setDate(tm.getDate() + 1);
                        setCalMonth(tm.getMonth());
                        setCalYear(tm.getFullYear());
                        setSelectedCalendarDate(tomorrowStr);
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                    >
                      Tomorrow
                    </button>
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] transition-colors cursor-pointer flex items-center gap-0.5"
                    >
                      <CalendarDays size={10} /> Full
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Widget 3: Support Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-2.5 shadow-lg shadow-slate-100/60">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800">Support & Assistance</h3>
              </div>
              <p className="text-xs text-slate-500">Need help managing your schedule or connecting with patients?</p>
              <button
                onClick={() => setShowSupportModal(true)}
                className="w-full py-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <PhoneCall size={14} />
                <span>Contact Telehealth Support</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* 2. DOCTOR AVAILABILITY MANAGEMENT TAB */}
      {activeTab === 'availability' && isDoctor && (
        <div className="space-y-6 animate-fadeIn">
          {/* A. Hero Overview & Clinician Action Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/60 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 tracking-wide uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-cyan-300" />
                    Doctor Telehealth Dispatch
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Schedule Management • Real-Time Patient Booking
                  </span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
                  Consultation Availability & Telehealth Windows
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Configure real-time booking slots for patient video consultations. Slots scheduled for today and future dates are automatically published to verified patient search.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center flex-wrap gap-2.5">
                <button
                  onClick={() => setShowAddAvailabilityModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all cursor-pointer hover:scale-[1.02] border border-blue-400/30"
                >
                  <Plus size={16} />
                  <span>Add Custom Slot</span>
                </button>

                <button
                  onClick={() => handleQuickGenerateShift(todayStr)}
                  disabled={loading}
                  className="px-3.5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer hover:scale-[1.02]"
                  title="Generate standard morning & afternoon slots for today"
                >
                  <Zap size={14} className="text-emerald-400" />
                  <span>+ Quick Shift (Today)</span>
                </button>

                <button
                  onClick={() => handleQuickGenerateShift(tomorrowStr)}
                  disabled={loading}
                  className="px-3.5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer hover:scale-[1.02]"
                  title="Generate standard morning & afternoon slots for tomorrow"
                >
                  <CalendarDays size={14} className="text-indigo-400" />
                  <span>+ Quick Shift (Tomorrow)</span>
                </button>

                {slotMetrics.pastCount > 0 && (
                  <button
                    onClick={handleClearExpiredSlots}
                    disabled={loading}
                    className="px-3 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer"
                    title="Clear past unbooked slots"
                  >
                    <Trash2 size={14} className="text-rose-400" />
                    <span>Clear Expired ({slotMetrics.pastCount})</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4 Stat KPI Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Open Windows</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-emerald-400">{slotMetrics.upcomingAvailable}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({slotMetrics.totalHours} hrs bookable)</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Confirmed Bookings</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-blue-400">{slotMetrics.upcomingBooked}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Patients reserved</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Today's Schedule</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-amber-400">{slotMetrics.todayCount}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Slots on {formatDateFull(todayStr)}</span>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Past / Expired</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-xl font-extrabold ${slotMetrics.pastCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {slotMetrics.pastCount}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Previous unbooked</span>
                </div>
              </div>
            </div>
          </div>

          {/* B. Filter and Search Controls */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: 'All Windows', count: slotMetrics.total },
                { id: 'upcoming', label: 'Active & Upcoming', count: slotMetrics.upcomingAvailable + slotMetrics.upcomingBooked },
                { id: 'today', label: 'Today', count: slotMetrics.todayCount },
                { id: 'available', label: 'Available (Open)', count: slotMetrics.upcomingAvailable },
                { id: 'booked', label: 'Booked by Patients', count: slotMetrics.upcomingBooked },
                { id: 'past', label: 'Past / Expired', count: slotMetrics.pastCount + slotMetrics.completedCount }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSlotFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    slotFilter === f.id
                      ? 'bg-[var(--primary)] text-white shadow-xs'
                      : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    slotFilter === f.id ? 'bg-white/20 text-white' : 'bg-[var(--border-subtle)] text-[var(--text-muted)]'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Date filter dropdown if multiple dates exist */}
            {uniqueSlotDates.length > 1 && (
              <div className="flex items-center space-x-2 shrink-0">
                <span className="text-xs font-semibold text-[var(--text-muted)]">Date:</span>
                <select
                  value={slotDateFilter}
                  onChange={(e) => setSlotDateFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
                >
                  <option value="all">All Dates ({filteredAvailabilitySlots.length})</option>
                  {uniqueSlotDates.map(d => (
                    <option key={d} value={d}>
                      {d === todayStr ? `Today • ${formatDateFull(d)}` : d === tomorrowStr ? `Tomorrow • ${formatDateFull(d)}` : formatDateFull(d)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* C. Grouped Slots by Date */}
          {groupedSlotsByDate.length === 0 ? (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                <CalendarDays className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-[var(--text-main)]">
                  {slotFilter === 'upcoming' ? 'No Upcoming Availability Windows' : 'No Availability Slots Found'}
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {slotFilter === 'upcoming'
                    ? 'All previous slots are in the past. Generate a fresh schedule for today or tomorrow so patients can book teleconsultations.'
                    : 'Adjust your filter or generate new clinical consultation slots.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handleQuickGenerateShift(todayStr)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap size={14} />
                  <span>Generate Today's Shift</span>
                </button>
                <button
                  onClick={() => setShowAddAvailabilityModal(true)}
                  className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Custom Slot</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedSlotsByDate.map((group) => (
                <div key={group.dateKey} className="space-y-3.5">
                  {/* Date Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-xl flex items-center justify-center ${
                        group.isToday
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                          : group.isTomorrow
                          ? 'bg-blue-500/15 text-blue-600 border border-blue-500/20'
                          : group.isPast
                          ? 'bg-slate-500/15 text-slate-500 border border-slate-500/20'
                          : 'bg-purple-500/15 text-purple-600 border border-purple-500/20'
                      }`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-extrabold text-[var(--text-main)]">
                            {formatDateFull(group.dateKey)}
                          </h3>
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            group.isToday
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                              : group.isTomorrow
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : group.isPast
                              ? 'bg-slate-200 text-slate-700 border border-slate-300'
                              : 'bg-purple-100 text-purple-800 border border-purple-300'
                          }`}>
                            {group.isToday ? 'TODAY • LIVE' : group.isTomorrow ? 'TOMORROW' : group.isPast ? 'PAST DATE' : 'UPCOMING'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5">
                          {group.slots.length} time windows • {group.openCount} available • {group.bookedCount} booked {group.expiredCount > 0 ? `• ${group.expiredCount} expired` : ''}
                        </p>
                      </div>
                    </div>

                    {group.isPast && group.expiredCount > 0 && (
                      <button
                        onClick={handleClearExpiredSlots}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                      >
                        <Trash2 size={13} />
                        <span>Purge Past Unbooked Slots</span>
                      </button>
                    )}
                  </div>

                  {/* Grid of Slots for this Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {group.slots.map((slot, idx) => {
                      const startTime = slot.startTime || '';
                      const endTime = slot.endTime || '';
                      const isPast = slot.isPast;
                      const isBooked = slot.is_booked;
                      const apt = slot.matchedApt;
                      const hourNum = parseInt(startTime.split(':')[0] || '12', 10);
                      const isMorning = hourNum < 12;
                      const isEvening = hourNum >= 17;

                      return (
                        <div
                          key={`${slot.slot_id || 'slot'}_${idx}`}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                            isBooked
                              ? 'bg-blue-50/40 border-blue-200/90 shadow-sm hover:shadow-md hover:border-blue-400'
                              : isPast
                              ? 'bg-slate-100/60 border-slate-200/90 opacity-75'
                              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-emerald-300 hover:shadow-md'
                          }`}
                        >
                          {/* Card Top: Time & Delete */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1.5">
                                {isMorning ? (
                                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                                ) : isEvening ? (
                                  <Sunset className="w-3.5 h-3.5 text-indigo-500" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                                )}
                                <span className="text-xs font-black text-[var(--text-main)] tracking-tight">
                                  {formatTimeOnly(startTime)} – {formatTimeOnly(endTime)}
                                </span>
                                <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--bg-primary)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
                                  30m
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 pt-0.5">
                                {isBooked ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                                    <User size={10} />
                                    {isPast ? 'COMPLETED VISIT' : 'BOOKED BY PATIENT'}
                                  </span>
                                ) : isPast ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                                    <Clock size={10} />
                                    EXPIRED (PAST)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    AVAILABLE FOR BOOKING
                                  </span>
                                )}
                              </div>
                            </div>

                            {!isBooked && (
                              <button
                                onClick={() => handleDeleteSlot(slot.slot_id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Delete Availability Slot"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Card Body: Patient info if booked, or booking mode */}
                          {isBooked ? (
                            <div className="p-2.5 bg-white/80 border border-blue-200/80 rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-extrabold text-slate-900 truncate">
                                  Patient: {apt?.patient_name || 'Confirmed Telehealth Patient'}
                                </span>
                                {apt?.status && (
                                  <span className="text-[9px] font-bold text-blue-700 uppercase bg-blue-50 px-1.5 py-0.5 rounded">
                                    {apt.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 truncate">
                                {apt?.notes || 'Clinical Teleconsultation Session'}
                              </p>
                              {apt && (
                                <button
                                  onClick={() => handleStartOrJoinConsultation(apt)}
                                  className="w-full mt-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs"
                                >
                                  <Stethoscope size={12} />
                                  <span>{isPast ? 'Review Consultation' : 'Launch Video Session'}</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between border-t border-[var(--border-subtle)] pt-2">
                              <span>Teleconsultation • Video Call</span>
                              <span className="font-semibold text-emerald-600">Patient Self-Booking</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. FULL MONTH CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold shadow-xs">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--text-main)] tracking-tight">
                  Schedule Calendar & Overview
                </h2>
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  {MONTH_NAMES[calMonth]} {calYear} • Click any day to inspect and filter appointments
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const now = new Date();
                  setCalMonth(now.getMonth());
                  setCalYear(now.getFullYear());
                  setSelectedCalendarDate(todayStr);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => {
                  if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                  else setCalMonth(m => m - 1);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] cursor-pointer transition-colors"
              >
                Prev Month
              </button>
              <button
                onClick={() => {
                  if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                  else setCalMonth(m => m + 1);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] cursor-pointer transition-colors"
              >
                Next Month
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold uppercase tracking-wider text-[var(--text-dim)]">
            {DAY_SHORT.map(d => (
              <span key={d} className="py-2 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 text-xs">
            {calendarCells.map((c, i) => {
              const isToday = c.dateStr === todayStr;
              const isSelected = selectedCalendarDate === c.dateStr;

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (c.dateStr) {
                      setSelectedCalendarDate(isSelected ? null : c.dateStr);
                      setActiveTab('upcoming');
                    }
                  }}
                  className={`min-h-[115px] p-2.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group ${
                    !c.current
                      ? 'bg-[var(--bg-primary)]/40 border-[var(--border-subtle)] opacity-40 hover:opacity-75'
                      : isSelected
                      ? 'bg-[var(--primary-light)] border-[var(--primary)] shadow-md ring-2 ring-[var(--primary)]/30'
                      : isToday
                      ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 shadow-xs'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] hover:border-[var(--primary)] hover:shadow-md'
                  }`}
                  title={c.dateStr ? `Click to filter appointments for ${c.dateStr}` : undefined}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-xs'
                        : isSelected
                        ? 'text-[var(--primary)] font-black text-sm'
                        : 'text-[var(--text-main)]'
                    }`}>
                      {c.day}
                    </span>

                    {c.aptCount > 0 && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        {c.aptCount}
                      </span>
                    )}
                  </div>

                  {c.dateStr && (
                    <div className="space-y-1 my-1">
                      {normalizedAppointments
                        .filter(a => a.date_str === c.dateStr)
                        .slice(0, 2)
                        .map(apt => (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointmentDetails(apt);
                            }}
                            className="p-1 rounded-lg text-[10px] font-bold bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[var(--text-main)] truncate cursor-pointer shadow-xs flex items-center gap-1"
                            title={`${formatTimeOnly(apt.time_str)} - ${isDoctor ? apt.patient_name : apt.doctor_name}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />
                            <span className="truncate font-mono">{formatTimeOnly(apt.time_str)}</span>
                            <span className="truncate text-[var(--text-muted)]">- {isDoctor ? apt.patient_name : apt.doctor_name}</span>
                          </div>
                        ))}
                      {c.aptCount > 2 && (
                        <div className="text-[9px] font-bold text-[var(--primary)] text-center">
                          +{c.aptCount - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] font-bold text-[var(--text-dim)] group-hover:text-[var(--primary)] transition-colors flex items-center justify-between">
                    <span>{c.dateStr ? 'View Day' : ''}</span>
                    {c.dateStr && <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Book Appointment Modal */}
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

      {/* ── HIGHLY FLEXIBLE ULTRA-PREMIUM ADD AVAILABILITY MODAL ───────────── */}
      {showAddAvailabilityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-scale-in">
            
            {/* Dark Gradient Header Banner */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Configure Availability Slots</h3>
                  <p className="text-xs text-slate-300 mt-0.5">Generate single or bulk teleconsultation time windows.</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddAvailabilityModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-2xl text-xs font-bold text-slate-600 w-full max-w-md">
                <button
                  type="button"
                  onClick={() => setAvailabilityMode('bulk')}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    availabilityMode === 'bulk'
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Shift Auto-Generator (Bulk)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAvailabilityMode('single')}
                  className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    availabilityMode === 'single'
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Single Custom Slot</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveAvailability} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar text-xs">
              
              {addSlotError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-600" />
                  <span>{addSlotError}</span>
                </div>
              )}

              {/* Date Selection */}
              <div>
                <label className="block text-slate-700 font-extrabold mb-1 flex items-center justify-between">
                  <span>Target Date</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Required</span>
                </label>
                <input
                  type="date"
                  value={newSlotDate}
                  onChange={(e) => setNewSlotDate(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              {/* MODE 1: BULK AUTO-GENERATOR */}
              {availabilityMode === 'bulk' && (
                <div className="space-y-4">
                  
                  {/* Preset Shift Quick Chips */}
                  <div>
                    <label className="block text-slate-700 font-extrabold mb-1.5">Preset Shift Templates</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => applyPresetShift('09:00', '12:30')}
                        className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-bold text-center flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                      >
                        <Sun className="w-4 h-4 text-amber-600" />
                        <span className="text-[11px]">Morning Shift</span>
                        <span className="text-[9px] text-amber-700 font-medium">09:00 - 12:30</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPresetShift('14:00', '17:30')}
                        className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 font-bold text-center flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                      >
                        <Sunset className="w-4 h-4 text-blue-600" />
                        <span className="text-[11px]">Afternoon</span>
                        <span className="text-[9px] text-blue-700 font-medium">14:00 - 17:30</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPresetShift('18:00', '21:00')}
                        className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 font-bold text-center flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                      >
                        <Moon className="w-4 h-4 text-indigo-600" />
                        <span className="text-[11px]">Evening</span>
                        <span className="text-[9px] text-indigo-700 font-medium">18:00 - 21:00</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyPresetShift('09:00', '17:00')}
                        className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 font-bold text-center flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer"
                      >
                        <Zap className="w-4 h-4 text-purple-600" />
                        <span className="text-[11px]">Full Day</span>
                        <span className="text-[9px] text-purple-700 font-medium">09:00 - 17:00</span>
                      </button>
                    </div>
                  </div>

                  {/* Shift Start & End Controls */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Shift Start Time</label>
                      <input
                        type="time"
                        value={shiftStartTime}
                        onChange={(e) => setShiftStartTime(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Shift End Time</label>
                      <input
                        type="time"
                        value={shiftEndTime}
                        onChange={(e) => setShiftEndTime(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Slot Duration & Rest Buffer Options */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Consultation Duration</label>
                      <select
                        value={slotDurationMinutes}
                        onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                      >
                        <option value={15}>15 Minutes</option>
                        <option value={30}>30 Minutes (Standard)</option>
                        <option value={45}>45 Minutes</option>
                        <option value={60}>60 Minutes (1 Hour)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Rest Buffer / Break</label>
                      <select
                        value={breakBufferMinutes}
                        onChange={(e) => setBreakBufferMinutes(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                      >
                        <option value={0}>0 Mins (Back-to-back)</option>
                        <option value={5}>5 Mins Buffer</option>
                        <option value={10}>10 Mins Buffer</option>
                        <option value={15}>15 Mins Buffer</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Interactive Slot Preview */}
                  <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Generated Shift Preview ({activeBulkSlots.length} Slots)
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">Click a chip to deselect specific times</span>
                    </div>

                    {generatedShiftSlots.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-2">Invalid shift timeframe specified.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-1">
                        {generatedShiftSlots.map(s => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => toggleExcludedSlot(s.key)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                              s.excluded
                                ? 'bg-slate-200 text-slate-400 border-slate-300 line-through'
                                : 'bg-white text-emerald-800 border-emerald-300 shadow-2xs hover:bg-emerald-50'
                            }`}
                          >
                            <span>{s.display}</span>
                            {!s.excluded ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <X className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* MODE 2: SINGLE TIME SLOT */}
              {availabilityMode === 'single' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Start Time</label>
                      <input
                        type="time"
                        value={singleStartTime}
                        onChange={(e) => setSingleStartTime(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">End Time</label>
                      <input
                        type="time"
                        value={singleEndTime}
                        onChange={(e) => setSingleEndTime(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAvailabilityModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSlotLoading || (availabilityMode === 'bulk' && activeBulkSlots.length === 0)}
                  className={`px-6 py-2.5 font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer flex items-center space-x-2 ${
                    addSlotLoading || (availabilityMode === 'bulk' && activeBulkSlots.length === 0)
                      ? 'bg-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20 hover:scale-[1.02]'
                  }`}
                >
                  {addSlotLoading ? (
                    <RefreshCw size={15} className="animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>
                        {availabilityMode === 'bulk'
                          ? `Save ${activeBulkSlots.length} Availability Slots`
                          : 'Save Availability Slot'}
                      </span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointmentDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Consultation Session Details</h3>
              <button onClick={() => setSelectedAppointmentDetails(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="block font-bold text-slate-900 text-sm">
                    {isDoctor ? selectedAppointmentDetails.patient_name : selectedAppointmentDetails.doctor_name}
                  </span>
                  <span className="text-slate-500 font-semibold">
                    {isDoctor ? `Patient ID: ${selectedAppointmentDetails.patient_id}` : selectedAppointmentDetails.specialty}
                  </span>
                </div>
                {renderStatusBadge(selectedAppointmentDetails.status)}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-semibold block">Scheduled Slot</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{selectedAppointmentDetails.relative_display}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-semibold block">Consultation ID</span>
                  <span className="font-bold text-slate-900 block mt-0.5 font-mono">{selectedAppointmentDetails.consultation_id}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold block">Clinical Notes / Patient Reason</span>
                <p className="text-slate-800 font-medium">{selectedAppointmentDetails.notes}</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAppointmentDetails(null)}
                className="px-4 py-2 font-bold text-slate-500 hover:text-slate-800 cursor-pointer text-xs"
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
                  className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md cursor-pointer flex items-center space-x-2"
                >
                  <Stethoscope size={14} />
                  <span>Launch Session</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Technical Telehealth Support</h3>
              <button onClick={() => setShowSupportModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>Need immediate assistance with scheduling or teleconsultation sessions?</p>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                <span className="font-bold block">Support Hotline (24/7)</span>
                <span className="text-sm font-extrabold block">+91 (1800) 123-4567</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold block text-slate-800">Email Support</span>
                <span className="text-slate-600">support@telemedai.health</span>
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
