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
  const [selectedDate, setSelectedDate] = useState('2026-08-05');
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
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {errorMsg && <Alert variant="danger">{errorMsg}</Alert>}

        {/* 1. Specialty & Doctor Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">1. Select Specialty & Physician</label>
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-medium"
            >
              {specialties.map(sp => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
            {filteredDoctors.length === 0 ? (
              <div className="col-span-2 text-center p-4 border border-dashed border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-muted)]">
                No physicians found for selected specialty.
              </div>
            ) : (
              filteredDoctors.map((doc) => {
                const isSelected = selectedDoctorId === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)] shadow-sm'
                        : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--primary)] text-[var(--text-main)]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-bold flex items-center justify-center text-xs shrink-0">
                      {doc.avatar || doc.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold truncate">{doc.name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{doc.specialty} • {doc.hospital || 'Apex Hospital'}</p>
                      <Badge variant="success" size="sm" className="mt-1 font-mono text-[9px]">Available Today</Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 2. Date & Available Time Slots */}
        <div className="space-y-3">
          <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">2. Select Date & Time Slot</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block mb-1">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
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
                    className="!py-1 text-[11px] font-mono font-semibold"
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
          <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">3. Consultation Mode</label>
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
                  className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                    isSel
                      ? 'bg-[var(--primary-light)] border-[var(--primary)] text-[var(--primary)] font-bold shadow-sm'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Reason for Consultation */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">4. Reason for Consultation & Symptoms</label>
          <TextArea
            rows={3}
            placeholder="Describe your health concerns, symptoms, or reason for doctor review..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        {/* 5. Supporting Document Upload (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">5. Attach Supporting Report (Optional)</label>
          <div className="p-3 border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-primary)] text-center text-xs text-[var(--text-muted)]">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => setAttachedFile(e.target.files[0])}
            />
            <label htmlFor="file-upload" className="cursor-pointer text-[var(--primary)] font-bold hover:underline flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
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
