import React, { useState } from 'react';
import { Modal, Input, TextArea, Button, Badge, Alert } from './ui';
import { Stethoscope, Calendar, Clock, Video, Phone, UserCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState('2026-08-25');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM');
  const [consultationType, setConsultationType] = useState('VIDEO');
  const [reason, setReason] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const specialties = ['ALL', 'Endocrinology', 'Cardiology', 'Gastroenterology', 'General Medicine'];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '02:00 PM', '02:30 PM', '03:30 PM', '04:00 PM'
  ];

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

    try {
      if (onBook) {
        await onBook({
          doctorId: selectedDoctorId || 'DOC-101',
          date: selectedDate,
          timeSlot: selectedTimeSlot,
          type: consultationType,
          reason,
          attachedFile: attachedFile ? attachedFile.name : null,
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to schedule appointment. Please try again.');
    }
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
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)] shadow-md ring-1 ring-[var(--primary)]'
                        : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--primary)] text-[var(--text-main)]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] font-extrabold flex items-center justify-center text-xs shrink-0 border border-[var(--primary)]/20">
                      {doc.avatar || doc.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="overflow-hidden space-y-0.5">
                      <h4 className="text-xs font-extrabold truncate text-[var(--text-main)]">{doc.name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{doc.specialty} • {doc.hospital || 'Apex Hospital'}</p>
                      <Badge variant="success" size="sm" className="font-mono text-[9px] px-1.5 py-0.5">Available Today</Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Date & Available Time Slots */}
        <div className="space-y-3">
          <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">2. Select Date & Time Slot</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block mb-1">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className="bg-[var(--bg-primary)] text-[var(--text-main)] border-[var(--border-subtle)]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block mb-1">Available Slots</label>
              <div className="grid grid-cols-3 gap-1.5">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    type="button"
                    variant={selectedTimeSlot === slot ? 'primary' : 'outline'}
                    size="sm"
                    className="!py-1.5 text-[11px] font-mono font-semibold"
                    onClick={() => setSelectedTimeSlot(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Consultation Mode */}
        <div className="space-y-2">
          <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">3. Consultation Mode</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'VIDEO', label: 'Video Call', icon: Video },
              { id: 'AUDIO', label: 'Audio Call', icon: Phone },
              { id: 'IN_PERSON', label: 'In-Person Visit', icon: UserCheck },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSel = consultationType === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setConsultationType(mode.id)}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center gap-1.5 transition-all ${
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
          <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">4. Reason for Consultation & Symptoms</label>
          <TextArea
            rows={3}
            placeholder="Describe your health concerns, symptoms, or reason for doctor review..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="bg-[var(--bg-primary)] text-[var(--text-main)] border-[var(--border-subtle)]"
          />
        </div>

        {/* 5. Supporting Document Upload (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">5. Attach Supporting Report (Optional)</label>
          <div className="p-3 border border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-primary)] text-center text-xs text-[var(--text-muted)]">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => setAttachedFile(e.target.files[0])}
            />
            <label htmlFor="file-upload" className="cursor-pointer text-[var(--primary)] font-bold hover:underline flex items-center justify-center gap-2">
              <FileText className="w-4 h-4 text-[var(--primary)]" />
              <span>{attachedFile ? attachedFile.name : 'Click to attach lab PDF or wearable CSV'}</span>
            </label>
          </div>
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
