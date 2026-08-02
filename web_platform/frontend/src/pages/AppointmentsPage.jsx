import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, User, Stethoscope, RefreshCw } from 'lucide-react';
import { fetchUserAppointments, fetchDoctorAvailability, bookAppointment, updateAppointmentStatus, configureDoctorAvailability, fetchPatientConsultations } from '../api/client';

export default function AppointmentsPage({ user, onNavigate }) {
  const role = user?.role || 'PATIENT';
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Booking Modal State (Patient)
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedConsId, setSelectedConsId] = useState('');
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Configure Availability State (Doctor)
  const [newSlotStart, setNewSlotStart] = useState('');
  const [newSlotEnd, setNewSlotEnd] = useState('');
  const [configLoading, setConfigLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apts = await fetchUserAppointments();
      setAppointments(apts || []);

      if (role === 'PATIENT') {
        const consData = await fetchPatientConsultations();
        const activeCons = (consData.consultations || []).filter(c => ['ASSIGNED', 'ACCEPTED', 'ACTIVE'].includes(c.status));
        setConsultations(activeCons);
      } else if (role === 'DOCTOR' && user?.doctor_profile?.doctor_id) {
        const slots = await fetchDoctorAvailability(user.doctor_profile.doctor_id);
        setAvailabilitySlots(slots || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load appointment schedule.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConsultation = async (consId) => {
    setSelectedConsId(consId);
    setSelectedSlotId('');
    const c = consultations.find(item => item.consultation_id === consId);
    if (c && c.assigned_doctor_id) {
      try {
        const slots = await fetchDoctorAvailability(c.assigned_doctor_id);
        setDoctorSlots(slots.filter(s => s.is_booked === 0));
      } catch (err) {
        setError('Failed to fetch doctor availability slots.');
      }
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedConsId || !selectedSlotId) return;
    setBookingLoading(true);
    setError(null);
    try {
      await bookAppointment(selectedConsId, selectedSlotId, bookingNotes);
      setActionSuccess('Appointment successfully scheduled and confirmed!');
      setShowBookModal(false);
      setSelectedConsId('');
      setSelectedSlotId('');
      setBookingNotes('');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newSlotStart || !newSlotEnd) return;
    setConfigLoading(true);
    setError(null);
    try {
      const slots = await configureDoctorAvailability([
        { slot_start: new Date(newSlotStart).toISOString(), slot_end: new Date(newSlotEnd).toISOString() }
      ]);
      setAvailabilitySlots(slots);
      setActionSuccess('New availability slot added successfully.');
      setNewSlotStart('');
      setNewSlotEnd('');
    } catch (err) {
      setError(err.message || 'Failed to configure availability slot.');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleCancelAppointment = async (aptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await updateAppointmentStatus(aptId, 'CANCELLED', 'Cancelled by user');
      setActionSuccess('Appointment successfully cancelled.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="status-badge active"><CheckCircle2 size={12} /> CONFIRMED</span>;
      case 'COMPLETED':
        return <span className="status-badge completed"><CheckCircle2 size={12} /> COMPLETED</span>;
      case 'CANCELLED':
        return <span className="status-badge error"><XCircle size={12} /> CANCELLED</span>;
      case 'RESCHEDULED':
        return <span className="status-badge pending"><Clock size={12} /> RESCHEDULED</span>;
      default:
        return <span className="status-badge pending">{status}</span>;
    }
  };

  return (
    <div className="page-container">
      {/* Header Banner */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={24} style={{ color: 'var(--accent-cyan)' }} />
            <span>Consultation Appointments & Scheduling</span>
          </h1>
          <p className="page-subtitle">
            {role === 'PATIENT' && 'Schedule and manage verified doctor appointments for active tele-consultations.'}
            {role === 'DOCTOR' && 'Configure consultation availability slots and manage upcoming patient visits.'}
            {role === 'ADMIN' && 'System-wide operational appointment scheduling and volume metrics.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={loadData} title="Refresh Appointments">
            <RefreshCw size={14} /> Refresh
          </button>
          {role === 'PATIENT' && (
            <button className="btn btn-primary" onClick={() => setShowBookModal(true)} disabled={consultations.length === 0}>
              <Plus size={14} /> Book Appointment
            </button>
          )}
        </div>
      </div>

      {/* Notice Alerts */}
      {actionSuccess && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} /> {error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Summary Metrics Cards */}
      <div className="grid-cards-4" style={{ marginBottom: '24px' }}>
        <div className="glass-card metric-card">
          <div className="metric-label">Total Appointments</div>
          <div className="metric-value">{appointments.length}</div>
          <div className="metric-sub">Scheduled across session history</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-label">Upcoming Confirmed</div>
          <div className="metric-value" style={{ color: 'var(--accent-cyan)' }}>
            {appointments.filter(a => a.status === 'CONFIRMED').length}
          </div>
          <div className="metric-sub">Active scheduled visits</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-label">Completed Visits</div>
          <div className="metric-value" style={{ color: '#10b981' }}>
            {appointments.filter(a => a.status === 'COMPLETED').length}
          </div>
          <div className="metric-sub">Past consultations</div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-label">Cancelled / Rescheduled</div>
          <div className="metric-value" style={{ color: '#f59e0b' }}>
            {appointments.filter(a => ['CANCELLED', 'RESCHEDULED'].includes(a.status)).length}
          </div>
          <div className="metric-sub">Released availability slots</div>
        </div>
      </div>

      {/* DOCTOR AVAILABILITY CONFIGURATION PANEL */}
      {role === 'DOCTOR' && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--accent-cyan)' }} /> Configure Doctor Availability Slots
          </h3>
          <form onSubmit={handleAddSlot} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Slot Start (Local Time)</label>
              <input type="datetime-local" className="form-input" value={newSlotStart} onChange={e => setNewSlotStart(e.target.value)} required />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Slot End (Local Time)</label>
              <input type="datetime-local" className="form-input" value={newSlotEnd} onChange={e => setNewSlotEnd(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={configLoading}>
              <Plus size={14} /> Add Slot
            </button>
          </form>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong>Active Open Slots ({availabilitySlots.filter(s => s.is_booked === 0).length}):</strong>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {availabilitySlots.filter(s => s.is_booked === 0).length === 0 ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>No open slots configured. Add slots above for patients to book.</span>
              ) : (
                availabilitySlots.filter(s => s.is_booked === 0).map(s => (
                  <span key={s.slot_id} style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', color: 'var(--accent-cyan)', fontSize: '0.78rem' }}>
                    {new Date(s.slot_start).toLocaleString()} - {new Date(s.slot_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* APPOINTMENTS TABLE */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: '16px' }}>Scheduled Appointments</h3>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading scheduled appointments...</div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Calendar size={36} style={{ color: 'var(--text-dim)', marginBottom: '12px', opacity: 0.5 }} />
            <div>No appointments scheduled.</div>
            {role === 'PATIENT' && (
              <p style={{ fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-dim)' }}>
                Request or activate a doctor consultation to schedule an appointment visit.
              </p>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>{role === 'PATIENT' ? 'Assigned Doctor' : 'Patient'}</th>
                  <th>Consultation ID</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(apt => (
                  <tr key={apt.appointment_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{new Date(apt.slot_start).toLocaleDateString()}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(apt.slot_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.slot_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      {role === 'PATIENT' ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{apt.doctor_name || 'Assigned Doctor'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{apt.doctor_specialization}</div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600 }}>{apt.patient_name || 'Patient'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{apt.patient_email}</div>
                        </div>
                      )}
                    </td>
                    <td><code style={{ fontSize: '0.78rem' }}>{apt.consultation_id}</code></td>
                    <td>{renderStatusBadge(apt.status)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{apt.notes || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline" onClick={() => onNavigate?.('consultations')} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
                          View Workspace
                        </button>
                        {apt.status === 'CONFIRMED' && (
                          <button className="btn btn-outline" onClick={() => handleCancelAppointment(apt.appointment_id)} style={{ fontSize: '0.75rem', padding: '4px 8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                            Cancel
                          </button>
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

      {/* BOOK APPOINTMENT MODAL (PATIENT) */}
      {showBookModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '24px', position: 'relative' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '16px' }}>Book Doctor Consultation Appointment</h3>
            <form onSubmit={handleBookAppointment}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Select Active Consultation</label>
                <select className="form-input" value={selectedConsId} onChange={e => handleSelectConsultation(e.target.value)} required>
                  <option value="">-- Choose Consultation --</option>
                  {consultations.map(c => (
                    <option key={c.consultation_id} value={c.consultation_id}>
                      {c.consultation_id} ({c.specialization}) - {c.status}
                    </option>
                  ))}
                </select>
              </div>

              {selectedConsId && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Select Doctor Availability Slot</label>
                  {doctorSlots.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: '#f59e0b', padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px' }}>
                      No available slots found for this doctor. Please contact your doctor or try again later.
                    </div>
                  ) : (
                    <select className="form-input" value={selectedSlotId} onChange={e => setSelectedSlotId(e.target.value)} required>
                      <option value="">-- Choose Time Slot --</option>
                      {doctorSlots.map(s => (
                        <option key={s.slot_id} value={s.slot_id}>
                          {new Date(s.slot_start).toLocaleDateString()} {new Date(s.slot_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.slot_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Reason / Notes for Doctor (Optional)</label>
                <textarea className="form-input" rows={3} value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Describe symptoms or topics for appointment..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowBookModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={bookingLoading || !selectedSlotId}>
                  {bookingLoading ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
