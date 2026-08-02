import React, { useState, useEffect } from 'react';
import { User, Settings, ShieldCheck, Server, RefreshCw, CheckCircle2, AlertCircle, Lock, Save, ArrowRight, Stethoscope, Edit3 } from 'lucide-react';
import { checkHealth, updateUserProfile } from '../api/client';

export default function AccountPage({ activeSubNav, user, onProfileUpdated }) {
  const isSettings = activeSubNav === 'settings';
  const role = user?.role || 'PATIENT';
  const profile = user?.patient_profile || {};
  const doctorProfile = user?.doctor_profile || {};

  // Form state for editable patient profile fields
  const [fullName, setFullName] = useState(user?.full_name || profile.full_name || '');
  const [age, setAge] = useState(profile.age !== null && profile.age !== undefined ? String(profile.age) : '');
  const [gender, setGender] = useState(profile.gender || 'Female');
  const [heightCm, setHeightCm] = useState(profile.height_cm !== null && profile.height_cm !== undefined ? String(profile.height_cm) : '');
  const [weightKg, setWeightKg] = useState(profile.weight_kg !== null && profile.weight_kg !== undefined ? String(profile.weight_kg) : '');
  const [contactNumber, setContactNumber] = useState(profile.contact_number || '');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Doctor editable fields
  const [docFullName, setDocFullName] = useState(doctorProfile.full_name || user?.full_name || '');
  const [docSpecialization, setDocSpecialization] = useState(doctorProfile.specialization || '');
  const [docQualification, setDocQualification] = useState(doctorProfile.qualification || '');
  const [docExperience, setDocExperience] = useState(doctorProfile.experience_years !== null && doctorProfile.experience_years !== undefined ? String(doctorProfile.experience_years) : '');
  const [docContact, setDocContact] = useState(doctorProfile.contact_number || '');
  const [docCouncil, setDocCouncil] = useState(doctorProfile.registration_council || '');
  const [docHospital, setDocHospital] = useState(doctorProfile.hospital_affiliation || '');
  const [docEditing, setDocEditing] = useState(false);

  const [healthStatus, setHealthStatus] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  useEffect(() => {
    if (user?.patient_profile) {
      setFullName(user.full_name || user.patient_profile.full_name || '');
      if (user.patient_profile.age !== null && user.patient_profile.age !== undefined) setAge(String(user.patient_profile.age));
      if (user.patient_profile.gender) setGender(user.patient_profile.gender);
      if (user.patient_profile.height_cm !== null && user.patient_profile.height_cm !== undefined) setHeightCm(String(user.patient_profile.height_cm));
      if (user.patient_profile.weight_kg !== null && user.patient_profile.weight_kg !== undefined) setWeightKg(String(user.patient_profile.weight_kg));
      if (user.patient_profile.contact_number) setContactNumber(user.patient_profile.contact_number);
    }
    if (user?.doctor_profile) {
      setDocFullName(user.doctor_profile.full_name || user.full_name || '');
      setDocSpecialization(user.doctor_profile.specialization || '');
      setDocQualification(user.doctor_profile.qualification || '');
      setDocExperience(user.doctor_profile.experience_years !== null && user.doctor_profile.experience_years !== undefined ? String(user.doctor_profile.experience_years) : '');
      setDocContact(user.doctor_profile.contact_number || '');
      setDocCouncil(user.doctor_profile.registration_council || '');
      setDocHospital(user.doctor_profile.hospital_affiliation || '');
    }
  }, [user]);

  useEffect(() => {
    if (isSettings) {
      fetchSystemStatus();
    }
  }, [isSettings]);

  const fetchSystemStatus = async () => {
    setLoadingHealth(true);
    try {
      const data = await checkHealth();
      setHealthStatus(data);
    } catch (e) {
      setHealthStatus({ status: 'OFFLINE', error: e.message });
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      let payload;
      if (role === 'DOCTOR') {
        payload = {
          full_name: docFullName.trim(),
          specialization: docSpecialization.trim(),
          qualification: docQualification.trim(),
          experience_years: docExperience ? parseInt(docExperience) : 0,
          contact_number: docContact.trim(),
          registration_council: docCouncil.trim(),
          hospital_affiliation: docHospital.trim()
        };
      } else {
        payload = {
          full_name: fullName.trim(),
          age: age ? parseInt(age) : null,
          gender: gender,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          contact_number: contactNumber.trim()
        };
      }

      const res = await updateUserProfile(payload);
      setSaveSuccess(true);
      setDocEditing(false);
      if (onProfileUpdated && res.user) {
        onProfileUpdated(res.user);
      }
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-cyan">ACCOUNT & PROFILE</span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {role === 'PATIENT' ? 'Patient Health Profile' : role === 'DOCTOR' ? 'Doctor Professional Profile' : 'Account Management'}
              </h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {role === 'PATIENT'
                ? 'Manage demographic and physical contact details. Protected system fields remain read-only.'
                : role === 'DOCTOR'
                  ? 'Edit professional details. Registration number and verification status are admin-controlled.'
                  : 'Account configuration and diagnostics.'}
            </p>
          </div>
        </div>
      </div>

      {role === 'PATIENT' && (
        <div className="grid-2" style={{ gap: '24px' }}>
          {/* Editable Patient Demographics Form */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} style={{ color: 'var(--accent-cyan)' }} /> Editable Demographic Profile
            </h3>

            {saveSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '12px 16px',
                borderRadius: '10px',
                color: 'var(--accent-emerald)',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={18} />
                <span>Patient profile updated successfully!</span>
              </div>
            )}

            {saveError && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                padding: '12px 16px',
                borderRadius: '10px',
                color: 'var(--accent-rose)',
                fontSize: '0.85rem',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Biological Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Contact Number
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ marginTop: '8px', padding: '10px', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                {saving ? 'Saving Profile...' : <><Save size={16} /> Save Profile Changes</>}
              </button>
            </form>
          </div>

          {/* Protected System & Authentication Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={20} style={{ color: 'var(--accent-amber)' }} /> Protected System Security Fields
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              System IDs, role definitions, and authentication credentials are fixed for security compliance and cannot be altered.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account Email:</span>
                <strong style={{ color: 'var(--text-main)' }}>{user?.email || 'N/A'}</strong>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>User ID:</span>
                <code style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>{user?.user_id || 'N/A'}</code>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Access Role:</span>
                <span className="badge badge-cyan">{user?.role || 'PATIENT'}</span>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account Registration:</span>
                <span style={{ color: 'var(--text-main)' }}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {role === 'DOCTOR' && (
        <div className="grid-2" style={{ gap: '24px' }}>
          {/* Editable Doctor Professional Profile */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Stethoscope size={20} style={{ color: 'var(--accent-cyan)' }} /> Professional Profile
              </h3>
              {!docEditing && (
                <button className="btn btn-outline" onClick={() => setDocEditing(true)} style={{ fontSize: '0.78rem', padding: '5px 12px' }}>
                  <Edit3 size={14} style={{ marginRight: '4px' }} /> Edit
                </button>
              )}
            </div>

            {saveSuccess && (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 16px', borderRadius: '10px', color: 'var(--accent-emerald)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> Doctor profile updated successfully!
              </div>
            )}
            {saveError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px 16px', borderRadius: '10px', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} /> {saveError}
              </div>
            )}

            <form onSubmit={handleProfileSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.875rem' }}>
                {/* Full Name — editable */}
                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Full Name</label>
                  {docEditing ? (
                    <input type="text" className="input" value={docFullName} onChange={e => setDocFullName(e.target.value)} style={{ width: '100%' }} required />
                  ) : (
                    <strong style={{ color: 'var(--text-main)' }}>{docFullName || 'Not set'}</strong>
                  )}
                </div>

                {/* Specialization — editable */}
                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Specialization</label>
                  {docEditing ? (
                    <input type="text" className="input" value={docSpecialization} onChange={e => setDocSpecialization(e.target.value)} style={{ width: '100%' }} />
                  ) : (
                    <span className="badge badge-cyan">{docSpecialization || 'General Medicine'}</span>
                  )}
                </div>

                {/* Qualification — editable */}
                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Medical Qualification</label>
                  {docEditing ? (
                    <input type="text" className="input" value={docQualification} onChange={e => setDocQualification(e.target.value)} style={{ width: '100%' }} />
                  ) : (
                    <strong style={{ color: 'var(--text-main)' }}>{docQualification || 'MBBS'}</strong>
                  )}
                </div>

                {/* Registration Number — READ ONLY always */}
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Lock size={12} /> Medical Registration # (Admin-Controlled)
                  </label>
                  <code style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>{doctorProfile.registration_number || 'REG_PENDING'}</code>
                </div>

                {/* Registration Council — editable */}
                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Registration Council</label>
                  {docEditing ? (
                    <input type="text" className="input" value={docCouncil} onChange={e => setDocCouncil(e.target.value)} style={{ width: '100%' }} />
                  ) : (
                    <span style={{ color: 'var(--text-main)' }}>{docCouncil || 'Not specified'}</span>
                  )}
                </div>

                {/* Experience — editable */}
                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Years of Experience</label>
                  {docEditing ? (
                    <input type="number" className="input" min="0" max="80" value={docExperience} onChange={e => setDocExperience(e.target.value)} style={{ width: '100%' }} />
                  ) : (
                    <span style={{ color: 'var(--text-main)' }}>{docExperience || 0} years</span>
                  )}
                </div>

                {/* Contact Number — editable */}
                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Contact Number</label>
                  {docEditing ? (
                    <input type="text" className="input" value={docContact} onChange={e => setDocContact(e.target.value)} style={{ width: '100%' }} />
                  ) : (
                    <span style={{ color: 'var(--text-main)' }}>{docContact || 'Not set'}</span>
                  )}
                </div>

                {/* Hospital — editable */}
                <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Hospital / Workplace</label>
                  {docEditing ? (
                    <input type="text" className="input" value={docHospital} onChange={e => setDocHospital(e.target.value)} style={{ width: '100%' }} />
                  ) : (
                    <span style={{ color: 'var(--text-main)' }}>{docHospital || 'Clinical Practice'}</span>
                  )}
                </div>

                {docEditing && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-cyan" disabled={saving} style={{ flex: 1 }}>
                      <Save size={16} style={{ marginRight: '6px' }} />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => { setDocEditing(false); setSaveError(null); }} style={{ padding: '8px 16px' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Account & Verification Status Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--accent-emerald)' }} /> Credential Verification & Account Status
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.875rem' }}>
              <div style={{ padding: '14px', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '10px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Verification Status:</span>
                <span className={`badge ${
                  doctorProfile.verification_status === 'VERIFIED' ? 'badge-emerald' :
                  doctorProfile.verification_status === 'UNDER_REVIEW' ? 'badge-cyan' :
                  doctorProfile.verification_status === 'RESUBMISSION_REQUIRED' ? 'badge-amber' : 'badge-rose'
                }`}>
                  {doctorProfile.verification_status || 'PENDING'}
                </span>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account Email:</span>
                <strong style={{ color: 'var(--text-main)' }}>{user?.email || 'N/A'}</strong>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Doctor Record ID:</span>
                <code style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>{doctorProfile.doctor_id || 'N/A'}</code>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>User ID:</span>
                <code style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}>{user?.user_id || 'N/A'}</code>
              </div>

              <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account Created:</span>
                <span style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
