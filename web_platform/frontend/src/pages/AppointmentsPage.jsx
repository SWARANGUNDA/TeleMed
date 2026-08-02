import React, { useState, useEffect } from 'react';
import { PageHeader, PageContainer, ContentSection } from '../components/layout';
import { Card, Badge, Button, Tabs, Input, Modal, EmptyState } from '../components/ui';
import AppointmentBookingModal from '../components/AppointmentBookingModal';
import {
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Plus, User, Stethoscope,
  Video, Phone, UserCheck, Search, Filter, Download, Eye, FileText, Sparkles,
  ChevronRight, RefreshCw, Star, MapPin, Building2, MessageSquare
} from 'lucide-react';
import {
  fetchUserAppointments, fetchDoctorAvailability, bookAppointment,
  updateAppointmentStatus, configureDoctorAvailability, fetchPatientConsultations
} from '../api/client';

export default function AppointmentsPage({ user, onNavigate }) {
  const role = user?.role || 'PATIENT';
  const [activeTab, setActiveTab] = useState('upcoming');
  const [calendarViewMode, setCalendarViewMode] = useState('MONTH');
  const [searchDoctorQuery, setSearchDoctorQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');

  // Backend Async Data
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals & Drawers
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);

  // Doctor Directory Dataset
  const doctorDirectory = [
    {
      id: 'DOC-101',
      name: 'Dr. Marcus Vance, MD',
      specialty: 'Endocrinology',
      experience: '14 years exp',
      rating: '4.9 (124 reviews)',
      languages: 'English, Spanish',
      hospital: 'Apex Medical Center',
      avatar: 'MV',
      availableToday: true,
      nextSlot: 'Today, 02:00 PM',
    },
    {
      id: 'DOC-102',
      name: 'Dr. Sarah Jenkins, MD',
      specialty: 'Cardiology',
      experience: '11 years exp',
      rating: '4.8 (98 reviews)',
      languages: 'English, French',
      hospital: 'Silicon Valley Heart Institute',
      avatar: 'SJ',
      availableToday: true,
      nextSlot: 'Today, 04:30 PM',
    },
    {
      id: 'DOC-103',
      name: 'Dr. Aris Thorne, PhD',
      specialty: 'Gastroenterology',
      experience: '16 years exp',
      rating: '5.0 (210 reviews)',
      languages: 'English, German',
      hospital: 'Metabolic & Microbiome Center',
      avatar: 'AT',
      availableToday: false,
      nextSlot: 'Tomorrow, 10:00 AM',
    },
    {
      id: 'DOC-104',
      name: 'Dr. Elena Rostova, MD',
      specialty: 'General Medicine',
      experience: '9 years exp',
      rating: '4.7 (76 reviews)',
      languages: 'English, Russian',
      hospital: 'Central TeleMed Clinic',
      avatar: 'ER',
      availableToday: true,
      nextSlot: 'Today, 03:00 PM',
    },
  ];

  // Default Mock Appointments if backend list empty
  const defaultAppointments = [
    {
      id: 'APT-2026-9901',
      doctorName: 'Dr. Marcus Vance, MD',
      specialty: 'Endocrinology',
      doctorAvatar: 'MV',
      date: '2026-08-03',
      time: '10:00 AM',
      duration: '30 mins',
      status: 'CONFIRMED',
      statusVariant: 'success',
      type: 'VIDEO',
      hospital: 'Apex Medical Center',
      reason: 'Review 90-day glycemic trend and TreeSHAP HbA1c drivers',
      isToday: true,
      timelineStage: 3, // 1: Booked, 2: Confirmed, 3: Reminder Sent, 4: Started, 5: Completed
    },
    {
      id: 'APT-2026-8812',
      doctorName: 'Dr. Sarah Jenkins, MD',
      specialty: 'Cardiology',
      doctorAvatar: 'SJ',
      date: '2026-08-10',
      time: '02:30 PM',
      duration: '45 mins',
      status: 'UPCOMING',
      statusVariant: 'primary',
      type: 'VIDEO',
      hospital: 'Silicon Valley Heart Institute',
      reason: 'Follow-up on HRV telemetry and Resting Heart Rate',
      isToday: false,
      timelineStage: 2,
    },
    {
      id: 'APT-2026-7411',
      doctorName: 'Dr. Aris Thorne, PhD',
      specialty: 'Gastroenterology',
      doctorAvatar: 'AT',
      date: '2026-07-28',
      time: '11:00 AM',
      duration: '30 mins',
      status: 'COMPLETED',
      statusVariant: 'secondary',
      type: 'IN_PERSON',
      hospital: 'Metabolic & Microbiome Center',
      reason: 'Gut microbiome sequencing & SCFA diet optimization',
      isToday: false,
      timelineStage: 5,
    },
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const apts = await fetchUserAppointments();
      if (apts && apts.length > 0) {
        setAppointments(apts);
      } else {
        setAppointments(defaultAppointments);
      }

      if (role === 'PATIENT') {
        const consData = await fetchPatientConsultations();
        setConsultations(consData?.consultations || []);
      }
    } catch (err) {
      setAppointments(defaultAppointments);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (bookingData) => {
    setBookingLoading(true);
    try {
      if (bookingData.slotId) {
        await bookAppointment(bookingData.slotId, bookingData.consultationId, bookingData.reason);
      }
      await loadData();
    } catch (err) {
      // Graceful fallback
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredDoctors = doctorDirectory.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                          doc.specialty.toLowerCase().includes(searchDoctorQuery.toLowerCase()) ||
                          doc.hospital.toLowerCase().includes(searchDoctorQuery.toLowerCase());
    const matchesSpec = specialtyFilter === 'ALL' || doc.specialty === specialtyFilter;
    return matchesSearch && matchesSpec;
  });

  const todayAppointments = appointments.filter(a => a.isToday || a.date === '2026-08-03');
  const upcomingAppointments = appointments.filter(a => a.status === 'UPCOMING' || a.status === 'CONFIRMED');
  const pastAppointments = appointments.filter(a => a.status === 'COMPLETED');
  const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED');

  return (
    <PageContainer className="space-y-8 py-6">
      
      {/* Top Header */}
      <PageHeader
        title="Appointments & Teleconsultation Workspace"
        description="Book video teleconsultations, explore verified physician directory, view appointment timelines & calendar schedules"
        badge="Teleconsultation Hub"
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowBookModal(true)}
          >
            Book Teleconsultation
          </Button>
        }
      />

      {/* Reminder Banner (If Today's Appointment Exists) */}
      {todayAppointments.length > 0 && (
        <Card isGlass={true} className="p-5 border-l-4 border-l-[var(--primary)] bg-[var(--primary-light)]/40 shadow-lg animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[var(--primary)] text-white">
                <Video className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <Badge variant="primary" size="sm">TODAY'S TELECONSULTATION • 30 MINS REMAINING</Badge>
                <h3 className="text-base font-extrabold text-[var(--text-main)] mt-0.5">
                  {todayAppointments[0].doctorName} ({todayAppointments[0].specialty})
                </h3>
                <p className="text-xs text-[var(--text-muted)]">Scheduled for {todayAppointments[0].time} • {todayAppointments[0].hospital}</p>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Video className="w-4 h-4" />}
              onClick={() => setSelectedAppointmentDetails(todayAppointments[0])}
            >
              Join Video Room →
            </Button>
          </div>
        </Card>
      )}

      {/* Navigation Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'upcoming', label: `Upcoming (${upcomingAppointments.length})` },
          { id: 'today', label: `Today's Schedule (${todayAppointments.length})` },
          { id: 'directory', label: 'Doctor Directory' },
          { id: 'calendar', label: 'Calendar View' },
          { id: 'past', label: `Past Consultations (${pastAppointments.length})` },
        ]}
      />

      {/* TAB 1: UPCOMING APPOINTMENTS */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4 animate-fade-in">
          {upcomingAppointments.length === 0 ? (
            <EmptyState
              title="No Upcoming Appointments"
              description="You have no scheduled doctor consultations at this time."
              actionLabel="Book Teleconsultation Now"
              onAction={() => setShowBookModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingAppointments.map((apt) => (
                <Card key={apt.id} isGlass={true} className="p-6 space-y-4 border-l-4 border-l-[var(--primary)] hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-extrabold flex items-center justify-center text-sm shadow-sm">
                        {apt.doctorAvatar}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-[var(--text-main)]">{apt.doctorName}</h3>
                        <span className="text-xs text-[var(--text-muted)]">{apt.specialty} • {apt.hospital}</span>
                      </div>
                    </div>
                    <Badge variant={apt.statusVariant} size="sm">{apt.status}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[var(--primary)]" />
                      <div>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Date</span>
                        <strong className="text-[var(--text-main)]">{apt.date}</strong>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--secondary)]" />
                      <div>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Time</span>
                        <strong className="text-[var(--text-main)]">{apt.time} ({apt.duration})</strong>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">
                    "{apt.reason}"
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">Mode: {apt.type}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedAppointmentDetails(apt)}>
                        Details & Timeline
                      </Button>
                      <Button variant="primary" size="sm" leftIcon={<Video className="w-3.5 h-3.5" />} onClick={() => setSelectedAppointmentDetails(apt)}>
                        Join Room
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TODAY'S SCHEDULE */}
      {activeTab === 'today' && (
        <div className="space-y-4 animate-fade-in">
          {todayAppointments.length === 0 ? (
            <EmptyState
              title="No Appointments Scheduled for Today"
              description="Your schedule is clear for today."
              icon={<Calendar className="w-8 h-8 text-[var(--text-muted)]" />}
            />
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((apt) => (
                <Card key={apt.id} isGlass={true} className="p-6 space-y-4 border-l-4 border-l-[var(--success)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[var(--success)] text-white font-extrabold flex items-center justify-center text-sm">
                        {apt.doctorAvatar}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text-main)]">{apt.doctorName}</h3>
                        <p className="text-xs text-[var(--text-muted)]">{apt.specialty} • {apt.time}</p>
                      </div>
                    </div>
                    <Button variant="primary" size="md" leftIcon={<Video className="w-4 h-4" />} onClick={() => setSelectedAppointmentDetails(apt)}>
                      Enter Waiting Room →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCTOR DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search doctors by name, specialty, or hospital..."
              leftIcon={<Search className="w-4 h-4" />}
              value={searchDoctorQuery}
              onChange={(e) => setSearchDoctorQuery(e.target.value)}
              className="flex-1"
            />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDoctors.map((doc) => (
              <Card key={doc.id} isGlass={true} className="p-6 space-y-4 hover:border-[var(--primary)] transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-extrabold flex items-center justify-center text-sm shadow-sm">
                      {doc.avatar}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-[var(--text-main)]">{doc.name}</h3>
                      <Badge variant="primary" size="sm">{doc.specialty}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{doc.rating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-[var(--bg-primary)]">
                    <span className="text-[var(--text-muted)] block text-[10px]">Experience</span>
                    <strong className="text-[var(--text-main)]">{doc.experience}</strong>
                  </div>
                  <div className="p-2 rounded bg-[var(--bg-primary)]">
                    <span className="text-[var(--text-muted)] block text-[10px]">Next Available</span>
                    <strong className="text-[var(--primary)] font-mono">{doc.nextSlot}</strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[var(--border-subtle)]">
                  <span className="text-[11px] text-[var(--text-muted)]">{doc.hospital}</span>
                  <Button variant="primary" size="sm" onClick={() => setShowBookModal(true)}>
                    Book Appointment
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <Card isGlass={true} className="p-6 space-y-6 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <h3 className="text-base font-bold text-[var(--text-main)]">August 2026 Teleconsultation Calendar</h3>
            <div className="flex gap-2">
              {['MONTH', 'WEEK', 'DAY'].map((mode) => (
                <Button
                  key={mode}
                  variant={calendarViewMode === mode ? 'primary' : 'ghost'}
                  size="sm"
                  className="!py-1 text-xs"
                  onClick={() => setCalendarViewMode(mode)}
                >
                  {mode}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono text-[var(--text-muted)] font-bold mb-2">
            <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-xs">
            {[...Array(31)].map((_, i) => {
              const dayNum = i + 1;
              const hasApt = dayNum === 3 || dayNum === 10 || dayNum === 28;
              return (
                <div
                  key={dayNum}
                  className={`min-h-[70px] p-2 rounded-xl border flex flex-col justify-between transition-all ${
                    hasApt
                      ? 'bg-[var(--primary-light)] border-[var(--primary)] font-bold text-[var(--primary)] shadow-sm'
                      : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  <span className="font-mono">{dayNum}</span>
                  {hasApt && (
                    <Badge variant="primary" size="sm" className="truncate text-[9px] font-mono">
                      1 Consultation
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 5: PAST CONSULTATIONS */}
      {activeTab === 'past' && (
        <div className="space-y-4 animate-fade-in">
          {pastAppointments.map((apt) => (
            <Card key={apt.id} isGlass={true} className="p-5 space-y-3 border-l-4 border-l-[var(--secondary)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--secondary-light)] text-[var(--secondary)] font-bold flex items-center justify-center text-xs">
                    {apt.doctorAvatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-main)]">{apt.doctorName}</h4>
                    <p className="text-xs text-[var(--text-muted)]">{apt.specialty} • Completed on {apt.date}</p>
                  </div>
                </div>
                <Badge variant="secondary" size="sm">COMPLETED</Badge>
              </div>

              <div className="p-3 rounded-lg bg-[var(--bg-primary)] text-xs space-y-1">
                <p className="font-semibold text-[var(--text-main)]">Doctor Consultation Notes:</p>
                <p className="text-[var(--text-muted)]">"Glycemic levels improving under HbA1c 5.8%. Continue prescribed lifestyle protocol."</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                  Download Prescription PDF
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      <AppointmentBookingModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        doctors={doctorDirectory}
        consultations={consultations}
        onBook={handleBookAppointment}
        isLoading={bookingLoading}
      />

      {/* Consultation Details & Timeline Modal */}
      {selectedAppointmentDetails && (
        <Modal
          isOpen={!!selectedAppointmentDetails}
          onClose={() => setSelectedAppointmentDetails(null)}
          title={`Teleconsultation Details & Timeline — ${selectedAppointmentDetails.id}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-xs">
            
            {/* Header info */}
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-[var(--text-main)]">{selectedAppointmentDetails.doctorName}</h3>
                <Badge variant={selectedAppointmentDetails.statusVariant} size="sm">{selectedAppointmentDetails.status}</Badge>
              </div>
              <p className="text-[var(--text-muted)]">{selectedAppointmentDetails.specialty} • {selectedAppointmentDetails.hospital}</p>
              <div className="flex items-center gap-4 pt-2 text-xs font-mono">
                <span>Date: {selectedAppointmentDetails.date}</span>
                <span>Time: {selectedAppointmentDetails.time}</span>
                <span>Mode: {selectedAppointmentDetails.type}</span>
              </div>
            </div>

            {/* Interactive Timeline Tracker */}
            <div className="space-y-2">
              <h4 className="font-bold text-[var(--text-main)] uppercase font-mono">Appointment Progress Timeline</h4>
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-3">
                {[
                  { stage: 1, label: '1. Appointment Booked' },
                  { stage: 2, label: '2. Doctor Confirmed' },
                  { stage: 3, label: '3. Reminder Sent' },
                  { stage: 4, label: '4. Consultation Started' },
                  { stage: 5, label: '5. Consultation Completed & Prescription Generated' },
                ].map((st) => {
                  const isDone = selectedAppointmentDetails.timelineStage >= st.stage;
                  return (
                    <div key={st.stage} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isDone ? 'bg-[var(--success)] text-white' : 'bg-[var(--border-subtle)] text-[var(--text-muted)]'
                      }`}>
                        {isDone ? '✓' : st.stage}
                      </div>
                      <span className={isDone ? 'font-bold text-[var(--text-main)]' : 'text-[var(--text-muted)]'}>{st.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-end gap-2">
              <Button variant="outline" size="md" onClick={() => setSelectedAppointmentDetails(null)}>
                Close
              </Button>
              <Button variant="primary" size="md" leftIcon={<Video className="w-4 h-4" />}>
                Join Video Consultation Room
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </PageContainer>
  );
}
