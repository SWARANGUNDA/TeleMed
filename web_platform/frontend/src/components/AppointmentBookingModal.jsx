import React, { useState, useEffect } from 'react';
import { Modal, Input, TextArea, Button, Badge, Alert } from './ui';
import { Stethoscope, Calendar, Clock, Video, Phone, MessageSquare, UserCheck, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
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
  }, [doctors, isOpen]);

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
    e.preventDefault();
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
    if (!startStr) return 'Slot';
    const dateObj = new Date(startStr);
    if (isNaN(dateObj)) return startStr;
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' @ ' +
      dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Teleconsultation & Doctor Appointment"
      className="max-w-2xl border border-[var(--border-medium)] bg-[var(--bg-surface)] text-[var(--text-main)] shadow-2xl"
    >
      <form onSubmit={handleFormSubmit} className="space-y-6 p-1">
        {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

        {/* 1. Specialty & Doctor Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">1. Select Specialty & Physician</label>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              {specialties.map(sp => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1 scrollbar-thin">
            {filteredDoctors.length === 0 ? (
              <div className="col-span-2 text-center p-6 border border-dashed border-[var(--border-subtle)] rounded-2xl text-xs text-[var(--text-muted)] bg-[var(--bg-primary)]">
                No physicians found for selected specialty.
              </div>
            ) : (
              filteredDoctors.map((doc) => {
                const docKey = doc.id || doc.userId;
                const isSelected = selectedDoctorId === docKey;
                return (
                  <div
                    key={docKey}
                    onClick={() => setSelectedDoctorId(docKey)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]'
                        : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--primary)] text-[var(--text-main)]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] font-extrabold flex items-center justify-center text-xs shrink-0 border border-[var(--primary)]/20">
                      {doc.avatar || (doc.name || 'D').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="overflow-hidden space-y-0.5">
                      <h4 className="text-xs font-extrabold truncate text-[var(--text-main)]">{doc.name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{doc.specialty}{doc.hospital ? ` • ${doc.hospital}` : ''}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Available Slots */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">2. Available Time Slots</label>
            {loadingSlots && <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Loading slots...</span>}
          </div>

          <div className="p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl">
            {loadingSlots ? (
              <div className="py-4 text-center text-xs text-[var(--text-muted)]">Fetching doctor's schedule...</div>
            ) : slots.length === 0 ? (
              <div className="py-4 text-center text-xs text-[var(--text-muted)]">
                No open availability slots found for this doctor. Select another doctor or check back later.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 scrollbar-thin">
                {slots.map((slot) => {
                  const sId = slot.slot_id || slot.id;
                  const isSel = selectedSlotId === sId;
                  return (
                    <button
                      key={sId}
                      type="button"
                      onClick={() => setSelectedSlotId(sId)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                        isSel
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-main)] hover:border-[var(--primary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{formatSlotTime(slot)}</span>
                        {slot.status && <Badge variant={slot.status === 'AVAILABLE' ? 'success' : 'warning'} size="sm">{slot.status}</Badge>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Consultation Mode */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">3. Consultation Mode</label>
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
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                    !mode.active ? 'opacity-50 cursor-not-allowed bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-dim)]' :
                    isSel
                      ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)] font-extrabold shadow-sm ring-1 ring-[var(--primary)]'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  <Icon className="w-5 h-5 text-[var(--primary)]" />
                  <span className="text-xs font-semibold">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Reason for Consultation */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">4. Consultation Reason & Notes</label>
          <TextArea
            rows={3}
            placeholder="Describe your health concerns, symptoms, or reason for doctor review..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="bg-[var(--bg-primary)] text-[var(--text-main)] border-[var(--border-subtle)]"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-3">
          <Button variant="outline" size="md" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" isLoading={isLoading} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
            Confirm & Book Appointment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

