import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import {
  Stethoscope, Calendar, Clock, Video, Phone, MessageSquare,
  UserCheck, FileText, CheckCircle2, AlertCircle, RefreshCw, X, ChevronDown, Check
} from 'lucide-react';
import { fetchDoctorAvailability } from '../api/client';

export default function AppointmentBookingModal({
  isOpen,
  onClose,
  doctors = [],
  consultations = [],
  onBook,
  isLoading = false,
}) {
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [selectedConsultationId, setSelectedConsultationId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [consultationType, setConsultationType] = useState('CHAT');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

  const specialties = ['ALL', 'Endocrinology', 'Cardiology', 'Gastroenterology', 'General Medicine'];

  // Select first doctor by default when modal opens or doctors update
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id || doctors[0].userId);
    }
  }, [doctors, isOpen, selectedDoctorId]);

  // Fetch slots whenever selectedDoctorId changes
  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorSlots(selectedDoctorId);
    } else {
      setSlots([]);
    }
  }, [selectedDoctorId]);

  const loadDoctorSlots = async (docId) => {
    setLoadingSlots(true);
    setSelectedSlotId('');
    try {
      const fetchedSlots = await fetchDoctorAvailability(docId);
      setSlots(fetchedSlots || []);
      if (fetchedSlots && fetchedSlots.length > 0) {
        setSelectedSlotId(fetchedSlots[0].slot_id || fetchedSlots[0].id);
      }
    } catch (err) {
      console.warn("Could not fetch availability slots:", err);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const filteredDoctors = doctors.filter(doc => {
    return specialtyFilter === 'ALL' || doc.specialty === specialtyFilter;
  });

  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!selectedDoctorId && doctors.length > 0) {
      setErrorMsg('Please select a physician for your teleconsultation.');
      return;
    }

    if (!selectedSlotId && slots.length > 0) {
      setErrorMsg('Please select an available time slot.');
      return;
    }

    try {
      if (onBook) {
        await onBook({
          doctorId: selectedDoctorId,
          slotId: selectedSlotId || null,
          consultationId: selectedConsultationId || (consultations[0]?.consultation_id || null),
          type: consultationType,
          reason,
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to schedule appointment. Please try again.');
    }
  };

  const formatSlotTime = (slot) => {
    const startStr = slot.slot_start || slot.start_time || slot.time || '';
    if (!startStr) return 'Available Slot';
    const dateObj = new Date(startStr);
    if (isNaN(dateObj)) return startStr;
    const datePart = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timePart = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${datePart} • ${timePart}`;
  };

  const modalFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button
        type="button"
        onClick={onClose}
        className="px-5 py-2.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-primary)] hover:bg-[var(--border-subtle)]/40 border border-[var(--border-subtle)] rounded-xl transition-all cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleFormSubmit}
        disabled={isLoading}
        className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
      >
        {isLoading ? <RefreshCw size={14} className="spin" /> : <CheckCircle2 size={15} />}
        <span>Confirm & Book Appointment</span>
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Teleconsultation & Doctor Appointment"
      className="max-w-2xl bg-[var(--bg-surface)] text-[var(--text-main)] shadow-2xl border border-[var(--border-subtle)] rounded-3xl"
      footer={modalFooter}
    >
      <form onSubmit={handleFormSubmit} className="space-y-6">

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── STEP 1: Select Specialty & Physician ─────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center">1</span>
              <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Select Specialty & Physician</label>
            </div>
            <div className="relative">
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                {specialties.map(sp => (
                  <option key={sp} value={sp}>{sp === 'ALL' ? 'All Specialties' : sp}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
            {filteredDoctors.length === 0 ? (
              <div className="col-span-2 text-center p-6 border border-dashed border-[var(--border-subtle)] rounded-2xl text-xs text-[var(--text-muted)] bg-[var(--bg-primary)]">
                No verified physicians found for the selected specialty filter.
              </div>
            ) : (
              filteredDoctors.map((doc) => {
                const docKey = doc.id || doc.userId;
                const isSelected = selectedDoctorId === docKey;
                return (
                  <div
                    key={docKey}
                    onClick={() => setSelectedDoctorId(docKey)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 relative ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-600 text-[var(--text-main)] shadow-xs ring-2 ring-blue-500/20'
                        : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-blue-300 text-[var(--text-main)]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    }`}>
                      {doc.avatar || (doc.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden space-y-0.5 flex-1 pr-4">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold truncate text-[var(--text-main)]">{doc.name}</h4>
                        <UserCheck size={12} className="text-blue-600 shrink-0" title="Verified Physician" />
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] truncate font-medium">
                        {doc.specialty} {doc.experience ? `• ${doc.experience}` : ''}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── STEP 2: Available Time Slots ─────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center">2</span>
              <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Available Time Slots</label>
            </div>
            {loadingSlots && (
              <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 font-medium">
                <RefreshCw size={12} className="spin text-blue-600" /> Fetching slots...
              </span>
            )}
          </div>

          <div className="p-3.5 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl">
            {loadingSlots ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                <RefreshCw size={16} className="spin text-blue-600" />
                <span>Loading physician's schedule...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--text-muted)] space-y-1">
                <Calendar size={20} className="mx-auto text-[var(--text-muted)] mb-1" />
                <p className="font-semibold text-[var(--text-main)]">No Open Availability Slots Found</p>
                <p className="text-[11px]">Select another doctor or check back later for new openings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto pr-1">
                {slots.map((slot) => {
                  const sId = slot.slot_id || slot.id;
                  const isSel = selectedSlotId === sId;
                  return (
                    <button
                      key={sId}
                      type="button"
                      onClick={() => setSelectedSlotId(sId)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isSel
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-main)] hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock size={14} className={isSel ? 'text-white' : 'text-blue-600'} />
                        <span>{formatSlotTime(slot)}</span>
                      </div>
                      {isSel && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── STEP 3: Consultation Mode ───────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center">3</span>
            <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Consultation Mode</label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'CHAT', label: 'Virtual Chat', icon: MessageSquare, active: true },
              { id: 'AUDIO', label: 'Audio Call (Soon)', icon: Phone, active: false },
              { id: 'VIDEO', label: 'Video Call (Soon)', icon: Video, active: false },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSel = consultationType === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  disabled={!mode.active}
                  onClick={() => mode.active && setConsultationType(mode.id)}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    !mode.active
                      ? 'opacity-40 cursor-not-allowed bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-dim)]'
                      : isSel
                      ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-600 text-blue-600 dark:text-blue-400 font-bold shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-blue-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSel ? 'text-blue-600' : 'text-[var(--text-muted)]'}`} />
                  <span className="text-xs font-semibold">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STEP 4: Consultation Reason & Notes ─────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-[11px] flex items-center justify-center">4</span>
            <label className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider">Consultation Reason & Symptoms</label>
          </div>
          <textarea
            rows={3}
            placeholder="Describe your health concerns, symptoms, or reason for doctor review..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="w-full p-3 text-xs rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>

      </form>
    </Modal>
  );
}
