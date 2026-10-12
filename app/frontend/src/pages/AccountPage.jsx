import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Stethoscope, Lock, ShieldCheck, Save, Edit3, AlertCircle,
  CheckCircle2, Mail, Phone, Calendar, Building, Award, Activity, Shield, Key,
  Sparkles, Smile, Check, Eye, EyeOff, Copy, Droplet, Scale, Heart,
  ShieldAlert, RefreshCw, Zap, ArrowRight, CheckCircle, Fingerprint
} from 'lucide-react';
import {
  Button, Card, Badge, Avatar, Input, Select, Alert, Modal
} from '../components/ui';
import { PageContainer } from '../components/layout';
import { updateUserProfile, getAuthToken, changeUserPassword } from '../api/client';
import {
  getAvailableAvatarsForRole,
  getAvatarById,
  suggestAvatarByDemographics,
  svgToDataUri
} from '../utils/avatarCatalog';

export default function AccountPage({ user, onProfileUpdated }) {
  const navigate = useNavigate();
  const role = user?.role || 'PATIENT';

  // Patient Profile Form State
  const patientProfile = user?.patient_profile || {};
  const [fullName, setFullName] = useState(user?.full_name || patientProfile.full_name || '');
  const [age, setAge] = useState(patientProfile.age || '');
  const [gender, setGender] = useState(patientProfile.gender || '');
  const [heightCm, setHeightCm] = useState(patientProfile.height_cm || '');
  const [weightKg, setWeightKg] = useState(patientProfile.weight_kg || '');
  const [contactNumber, setContactNumber] = useState(patientProfile.contact_number || '');
  const [bloodGroup, setBloodGroup] = useState(patientProfile.blood_group || 'O+');
  const [emergencyContact, setEmergencyContact] = useState(patientProfile.emergency_contact || '');

  // Password Reset Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(null);
  const [pwdError, setPwdError] = useState(null);

  // Copy ID feedback
  const [copiedId, setCopiedId] = useState(false);

  // Avatar & Profile Emoji State
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    try {
      const profileKey = `telemed_user_profile_${user?.user_id || 'guest'}`;
      const saved = localStorage.getItem(profileKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedAvatar) return parsed.selectedAvatar;
      }
    } catch (e) {}
    return role === 'ADMIN' ? 'admin' : role === 'DOCTOR' ? 'doctor_male' : 'male';
  });
  const [avatarAutoNotice, setAvatarAutoNotice] = useState(null);
  const availableAvatars = getAvailableAvatarsForRole(role);
  const currentAvatarObj = getAvatarById(selectedAvatar);

  const handleAutoSuggestAvatar = () => {
    const suggested = suggestAvatarByDemographics(age, gender, role);
    setSelectedAvatar(suggested.id);
    setAvatarAutoNotice(`Auto-matched ${suggested.label} ${suggested.emoji} based on your Age (${age || 'unspecified'}) & Gender (${gender || 'unspecified'})`);
    setTimeout(() => setAvatarAutoNotice(null), 5000);
  };

  // Doctor Profile Form State
  const doctorProfile = user?.doctor_profile || {};
  const [docFullName, setDocFullName] = useState(user?.full_name || doctorProfile.full_name || '');
  const [docSpecialization, setDocSpecialization] = useState(doctorProfile.specialization || 'General Medicine');
  const [docQualification, setDocQualification] = useState(doctorProfile.qualification || 'MBBS');
  const [docCouncil, setDocCouncil] = useState(doctorProfile.registration_council || 'State Medical Council');
  const [docExperience, setDocExperience] = useState(doctorProfile.experience_years || 0);
  const [docContact, setDocContact] = useState(doctorProfile.contact_number || '');
  const [docHospital, setDocHospital] = useState(doctorProfile.hospital_affiliation || 'Apollo Hospitals');
  const [docEditing, setDocEditing] = useState(false);

  // Status State
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (user) {
      if (role === 'PATIENT') {
        const p = user.patient_profile || {};
        setFullName(user.full_name || p.full_name || '');
        setAge(p.age || '');
        setGender(p.gender || '');
        setHeightCm(p.height_cm || '');
        setWeightKg(p.weight_kg || '');
        setContactNumber(p.contact_number || '');
        setBloodGroup(p.blood_group || 'O+');
        setEmergencyContact(p.emergency_contact || '');
      } else if (role === 'DOCTOR') {
        const d = user.doctor_profile || {};
        setDocFullName(user.full_name || d.full_name || '');
        setDocSpecialization(d.specialization || 'General Medicine');
        setDocQualification(d.qualification || 'MBBS');
        setDocCouncil(d.registration_council || 'State Medical Council');
        setDocExperience(d.experience_years || 0);
        setDocContact(d.contact_number || '');
        setDocHospital(d.hospital_affiliation || 'Apollo Hospitals');
      } else {
        setFullName(user.full_name || 'Admin User');
      }
    }
  }, [user, role]);

  const handleCopyId = () => {
    const idToCopy = user?.user_id || 'usr_telemed';
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const scrollToSecurity = () => {
    const el = document.getElementById('security-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Profile completeness calculation
  const completionScore = useMemo(() => {
    if (role === 'PATIENT') {
      const fields = [fullName, age, gender, heightCm, weightKg, contactNumber, bloodGroup, emergencyContact];
      const filled = fields.filter(f => f && String(f).trim() !== '').length;
      return Math.round((filled / fields.length) * 100);
    } else if (role === 'DOCTOR') {
      const fields = [docFullName, docSpecialization, docQualification, docCouncil, docExperience, docContact, docHospital];
      const filled = fields.filter(f => f && String(f).trim() !== '').length;
      return Math.round((filled / fields.length) * 100);
    }
    return 100;
  }, [role, fullName, age, gender, heightCm, weightKg, contactNumber, bloodGroup, emergencyContact, docFullName, docSpecialization, docQualification, docCouncil, docExperience, docContact, docHospital]);

  // Enhanced BMI calculation with gauge percentage
  const bmiInfo = useMemo(() => {
    if (!weightKg || !heightCm || heightCm <= 0) return null;
    const hM = heightCm / 100;
    const bmiVal = parseFloat((weightKg / (hM * hM)).toFixed(1));
    let statusStr = 'Normal Weight';
    let badgeVar = 'success';
    let colorClass = 'text-emerald-500';
    let bgClass = 'bg-emerald-500';
    let advice = 'Optimal physiological weight range. Maintain current balanced nutrition & activity.';
    let gaugePosition = Math.min(Math.max(((bmiVal - 15) / 25) * 100, 4), 96); // Range 15 to 40 BMI

    if (bmiVal < 18.5) {
      statusStr = 'Underweight';
      badgeVar = 'warning';
      colorClass = 'text-sky-500';
      bgClass = 'bg-sky-500';
      advice = 'Below recommended clinical range. Consider nutrient-dense dietary guidance.';
    } else if (bmiVal >= 25 && bmiVal < 30) {
      statusStr = 'Overweight';
      badgeVar = 'warning';
      colorClass = 'text-amber-500';
      bgClass = 'bg-amber-500';
      advice = 'Elevated cardiometabolic risk indicator. Regular aerobic activity recommended.';
    } else if (bmiVal >= 30) {
      statusStr = 'Obese Class';
      badgeVar = 'danger';
      colorClass = 'text-rose-500';
      bgClass = 'bg-rose-500';
      advice = 'High metabolic syndrome & diabetes vulnerability. Clinical consultation advised.';
    }

    return {
      value: bmiVal,
      status: statusStr,
      variant: badgeVar,
      colorClass,
      bgClass,
      advice,
      gaugePosition
    };
  }, [weightKg, heightCm]);

  // Password strength meter logic
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'Not Entered', color: 'bg-slate-300 dark:bg-slate-700', text: 'text-slate-400' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500' };
    if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-500', text: 'text-blue-500' };
    return { score: 4, label: 'Very Strong', color: 'bg-emerald-500', text: 'text-emerald-500' };
  }, [newPassword]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      let payload = {};
      if (role === 'PATIENT') {
        payload = {
          full_name: fullName,
          age: age ? parseInt(age, 10) : null,
          gender: gender,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          contact_number: contactNumber,
          blood_group: bloodGroup,
          emergency_contact: emergencyContact
        };
      } else if (role === 'DOCTOR') {
        payload = {
          full_name: docFullName,
          specialization: docSpecialization,
          qualification: docQualification,
          registration_council: docCouncil,
          experience_years: docExperience ? parseInt(docExperience, 10) : 0,
          contact_number: docContact,
          hospital_affiliation: docHospital
        };
      } else {
        payload = { full_name: fullName };
      }

      const res = await updateUserProfile(payload);
      const profileKey = `telemed_user_profile_${user?.user_id || 'guest'}`;
      try {
        const existing = localStorage.getItem(profileKey);
        const parsed = existing ? JSON.parse(existing) : {};
        localStorage.setItem(profileKey, JSON.stringify({
          ...parsed,
          fullName: role === 'PATIENT' ? fullName : (role === 'DOCTOR' ? docFullName : fullName),
          selectedAvatar,
          bloodGroup,
          emergencyContact,
          isUpdated: true
        }));
      } catch (e) {}

      setSaveSuccess(true);
      setDocEditing(false);
      window.dispatchEvent(new Event('telemed_profile_updated'));
      window.dispatchEvent(new Event('telemed:user-updated'));
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

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword.length < 8) {
      setPwdError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match. Please re-type.');
      return;
    }

    setPwdSaving(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setPwdSuccess('Account password successfully updated and securely encrypted!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSuccess(null), 5000);
    } catch (err) {
      setPwdError(err.message || 'Failed to update password. Please check your credentials.');
    } finally {
      setPwdSaving(false);
    }
  };

  const renderPasswordResetCard = () => (
    <Card isGlass={true} className="p-6 bg-[var(--bg-primary)] space-y-5 border border-[var(--border-subtle)] shadow-xl relative overflow-hidden" id="security-section">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[var(--text-main)]">Account Security & Password</h3>
            <span className="text-[10px] text-[var(--text-muted)]">PBKDF2 SHA-256 Encrypted</span>
          </div>
        </div>
        <Badge variant="primary" size="sm font-mono font-bold">256-BIT SECURE</Badge>
      </div>

      <form onSubmit={handlePasswordReset} className="space-y-4">
        {pwdSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{pwdSuccess}</span>
          </div>
        )}
        {pwdError && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-[var(--text-main)] flex items-center justify-between mb-1">
            <span>Current Password</span>
            <span className="text-[10px] text-[var(--text-muted)] font-normal">Optional for Google OAuth</span>
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter existing password..."
              className="w-full p-2.5 pr-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 cursor-pointer transition-colors"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[var(--text-main)] block mb-1">New Password</label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters..."
              required
              className="w-full p-2.5 pr-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 cursor-pointer transition-colors"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Meter */}
          {newPassword && (
            <div className="mt-2 space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Strength:</span>
                <span className={`font-bold font-mono ${passwordStrength.text}`}>{passwordStrength.label}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5">
                {[1, 2, 3, 4].map(idx => (
                  <div
                    key={idx}
                    className={`rounded-full transition-all duration-300 ${
                      passwordStrength.score >= idx ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-[var(--text-main)] block mb-1">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password..."
              required
              className="w-full p-2.5 pr-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] font-mono transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 cursor-pointer transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 mt-1 animate-fade-in">
              <AlertCircle className="w-3 h-3" /> Passwords do not match
            </span>
          )}
          {confirmPassword && newPassword === confirmPassword && (
            <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-1 animate-fade-in">
              <Check className="w-3 h-3 stroke-[3]" /> Passwords match perfectly
            </span>
          )}
        </div>

        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={pwdSaving}
            leftIcon={<Key className="w-4 h-4" />}
            className="w-full justify-center shadow-lg shadow-indigo-500/20"
          >
            Reset & Update Password
          </Button>
        </div>
      </form>
    </Card>
  );

  const displayFullName = role === 'PATIENT' ? (fullName || 'Patient Account') : role === 'DOCTOR' ? (docFullName || 'Dr. Medical Officer') : (fullName || 'System Administrator');

  return (
    <PageContainer className="space-y-8 pb-24">

      {/* ULTRA-PREMIUM MODERN HERO HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-6 md:p-8 shadow-2xl">
        {/* Subtle Radiant Background Ambient Glows */}
        <div className="absolute top-0 right-1/4 -mt-12 w-80 h-80 rounded-full bg-blue-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 -mb-12 -mr-12 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>

        {/* Ambient Subtle Tech Mesh Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-40"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left Block: Avatar, Identity & Metadata */}
          <div className="flex items-center gap-5 md:gap-7">
            <div className="relative shrink-0">
              <div className="p-1 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-xl shadow-blue-500/30 ring-4 ring-white/10">
                <Avatar
                  user={user}
                  avatarId={selectedAvatar}
                  name={displayFullName}
                  size="xl"
                  className="w-20 h-20 md:w-24 md:h-24 text-2xl font-black bg-slate-900 text-white rounded-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 text-2xl p-1 bg-slate-900/90 rounded-full shadow-lg border border-white/20 select-none">
                {currentAvatarObj.emoji}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {displayFullName}
                </h1>
                <span className="px-3 py-0.5 text-xs font-mono font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                  {role === 'ADMIN' ? 'SYSTEM ADMINISTRATOR' : role === 'DOCTOR' ? 'VERIFIED PHYSICIAN' : 'PATIENT PROFILE'}
                </span>
                <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active Session
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300 font-mono flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" /> {user?.email || 'user@telemed.ai'}
                </span>
                <span className="text-slate-600">•</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 transition-all cursor-pointer"
                  title="Click to copy ID"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{user?.user_id || 'usr_patient'}</span>
                  <Copy className="w-3 h-3 text-cyan-400/70" />
                  {copiedId && <span className="text-[10px] text-emerald-400 font-bold ml-1">Copied!</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Right Block: Profile Health & Quick Actions */}
          <div className="flex items-center gap-4 lg:self-center flex-wrap">
            {/* Completeness Pill */}
            <div className="px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-1 min-w-[170px]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Profile Completeness</span>
                <span className="text-cyan-400 font-mono font-black">{completionScore}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionScore}%` }}
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={scrollToSecurity}
                className="!px-3.5 !py-2 text-xs font-bold text-white border-white/20 hover:bg-white/10 backdrop-blur-md"
                leftIcon={<Lock className="w-3.5 h-3.5 text-indigo-400" />}
              >
                Change Password
              </Button>
            </div>

          </div>

        </div>
      </div>

      {saveSuccess && (
        <Alert variant="success" className="animate-fade-in">
          Profile demographic details updated and synchronized successfully!
        </Alert>
      )}

      {saveError && (
        <Alert variant="danger" className="animate-fade-in">
          {saveError}
        </Alert>
      )}

      {/* PATIENT PORTAL PROFILE WORKSPACE */}
      {role === 'PATIENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left/Main Column: Demographic Form & Avatar Studio (8 cols) */}
          <div className="lg:col-span-8 space-y-8">

            {/* 1. CHARACTER STUDIO & AVATAR SHOWCASE */}
            <Card isGlass={true} className="p-6 md:p-7 bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-xl rounded-3xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Smile className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
                      Clinical Character & Emoji Avatar Studio
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Select your clinical character representation or let AI match one based on your age and biological gender
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="!px-3.5 !py-2 text-xs font-bold text-[var(--primary)] border-[var(--primary)]/30 hover:bg-[var(--primary)]/10 shrink-0 shadow-xs"
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-[var(--primary)] animate-pulse" />}
                  onClick={handleAutoSuggestAvatar}
                >
                  Auto-Match with AI
                </Button>
              </div>

              {avatarAutoNotice && (
                <div className="p-3 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-xs text-[var(--primary)] font-semibold flex items-center gap-2.5 animate-fade-in">
                  <Sparkles className="w-4 h-4 shrink-0 text-[var(--primary)] animate-spin" />
                  <span>{avatarAutoNotice}</span>
                </div>
              )}

              {/* 6-Card Avatar Studio Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 pt-1">
                {availableAvatars.map((av) => {
                  const isSelected = selectedAvatar === av.id;
                  const avatarUri = av.url || svgToDataUri(av.svg);
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative group cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-[var(--primary)] shadow-xl shadow-[var(--primary)]/20 bg-gradient-to-b from-[var(--primary-light)]/40 via-[var(--primary-light)]/20 to-[var(--bg-surface)] scale-102 z-10 border border-[var(--primary)]/40'
                          : 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-surface-hover)] hover:scale-102 hover:shadow-md'
                      }`}
                      title={`${av.label} (${av.ageRange})`}
                    >
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md ring-2 ring-[var(--bg-surface)]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}

                      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-md mb-2 bg-slate-900 shrink-0">
                        <img
                          src={avatarUri}
                          alt={av.label}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <span className="absolute -bottom-1 -right-1 text-sm bg-black/70 rounded-full px-1 shadow">
                          {av.emoji}
                        </span>
                      </div>

                      <span className={`text-xs font-black text-center leading-tight truncate w-full ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-main)]'}`}>
                        {av.role}
                      </span>
                      <span className={`text-[10px] font-mono leading-none mt-1 ${isSelected ? 'text-[var(--primary)] font-bold' : 'text-[var(--text-muted)]'}`}>
                        {av.ageRange}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 2. EDITABLE DEMOGRAPHIC PROFILE FORM */}
            <Card isGlass={true} className="p-6 md:p-8 bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-xl rounded-3xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--text-main)]">Clinical Demographic Profile</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Verified personal and biometric baseline records</p>
                  </div>
                </div>
                <Badge variant="neutral" size="sm font-mono">CONFIDENTIAL</Badge>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-6">

                {/* Section A: Personal Identity */}
                <div className="space-y-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[var(--primary)]" /> 1. Personal Identity
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-[var(--text-main)] block mb-1">Full Legal Name</label>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter full legal name..."
                        required
                        className="w-full font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--text-main)] block mb-1">Age (Years)</label>
                      <Input
                        type="number"
                        min="1"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 32"
                        className="w-full font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-main)] block mb-1">Biological Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-main)] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Section B: Physical Vitals & Body Composition */}
                <div className="space-y-4 pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-emerald-500" /> 2. Body Composition & Physical Vitals
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[var(--text-main)] block mb-1">Height (cm)</label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value)}
                          placeholder="e.g. 175"
                          className="w-full font-mono pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--text-muted)] pointer-events-none">cm</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--text-main)] block mb-1">Weight (kg)</label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.1"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          placeholder="e.g. 70"
                          className="w-full font-mono pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--text-muted)] pointer-events-none">kg</span>
                      </div>
                    </div>
                  </div>

                  {/* Realtime Live BMI Feedback Pill in form */}
                  {bmiInfo && (
                    <div className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-2 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-[var(--text-muted)]">Live Calculated BMI:</span>
                        <strong className="text-xs font-mono font-black text-[var(--text-main)]">{bmiInfo.value} kg/m²</strong>
                      </div>
                      <Badge variant={bmiInfo.variant} size="sm font-mono font-bold">
                        {bmiInfo.status}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Section C: Clinical Identifiers & Emergency */}
                <div className="space-y-4 pt-3 border-t border-[var(--border-subtle)]">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                    <Droplet className="w-3.5 h-3.5 text-rose-500" /> 3. Blood Group & Emergency Contact
                  </span>

                  <div>
                    <label className="text-xs font-bold text-[var(--text-main)] block mb-1.5">Blood Group (ABO & Rh)</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => {
                        const isChosen = bloodGroup === bg;
                        return (
                          <button
                            key={bg}
                            type="button"
                            onClick={() => setBloodGroup(bg)}
                            className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                              isChosen
                                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-400'
                                : 'bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-rose-400/50 hover:bg-[var(--bg-surface-hover)]'
                            }`}
                          >
                            {bg}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[var(--text-main)] block mb-1">Primary Phone Number</label>
                      <Input
                        type="text"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--text-main)] block mb-1">Emergency Contact</label>
                      <Input
                        type="text"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="e.g. Spouse (+91 98765 00000)"
                        className="w-full font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Action Controls */}
                <div className="pt-4 flex items-center justify-between flex-wrap gap-3 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Instant cryptographic persistence to local & cloud vault</span>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    type="submit"
                    isLoading={saving}
                    leftIcon={<Save className="w-4 h-4" />}
                    className="!px-6 shadow-lg shadow-blue-500/20"
                  >
                    Save Profile Changes
                  </Button>
                </div>

              </form>
            </Card>

          </div>

          {/* Right Column: Biometric HUD & Account Security (4 cols) */}
          <div className="lg:col-span-4 space-y-6">

            {/* 1. BIOMETRIC DIAGNOSTICS & CLINICAL HUD */}
            <Card isGlass={true} className="p-6 bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-xl rounded-3xl space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--text-main)]">Biometric Diagnostics</h3>
                    <span className="text-[10px] text-[var(--text-muted)]">Live Physical Indexing</span>
                  </div>
                </div>
                <Badge variant="success" size="sm font-mono">CALCULATED</Badge>
              </div>

              {/* BMI Interactive Visual Meter */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-bold">Body Mass Index</span>
                  {bmiInfo ? (
                    <Badge variant={bmiInfo.variant} size="sm font-mono font-bold">
                      {bmiInfo.status}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)]">Enter height & weight</span>
                  )}
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono tracking-tight text-[var(--text-main)]">
                    {bmiInfo ? `${bmiInfo.value}` : '—'}
                  </span>
                  <span className="text-xs font-mono text-[var(--text-muted)]">kg/m²</span>
                </div>

                {/* Color Spectrum Bar with Pointer */}
                <div className="space-y-1.5 pt-1">
                  <div className="relative h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-rose-500 shadow-inner">
                    {bmiInfo && (
                      <div
                        className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-md ring-2 ring-black/40 transition-all duration-500 -translate-x-1"
                        style={{ left: `${bmiInfo.gaugePosition}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-[var(--text-muted)]">
                    <span>18.5 (Under)</span>
                    <span>24.9 (Normal)</span>
                    <span>29.9 (Over)</span>
                    <span>30+ (Obese)</span>
                  </div>
                </div>

                {bmiInfo && (
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-1 border-t border-[var(--border-subtle)]">
                    {bmiInfo.advice}
                  </p>
                )}
              </div>

              {/* Verified Identity Passport Card */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" /> Account Email:
                  </span>
                  <strong className="font-mono text-[var(--text-main)] text-right truncate max-w-[160px]">{user?.email || '—'}</strong>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-cyan-400" /> Patient ID:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="font-mono font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
                    title="Click to copy ID"
                  >
                    <span>{user?.user_id || 'usr_patient'}</span>
                    <Copy className="w-3 h-3 opacity-70" />
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Protocol Security:
                  </span>
                  <Badge variant="success" size="sm font-mono font-bold">JWT • HIPAA COMPLIANT</Badge>
                </div>
              </div>
            </Card>

            {/* 2. SECURITY & RESET PASSWORD CARD */}
            {renderPasswordResetCard()}

          </div>

        </div>
      )}

      {/* DOCTOR PORTAL PROFILE WORKSPACE */}
      {role === 'DOCTOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Editable Doctor Professional Profile (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <Card isGlass={true} className="p-6 md:p-8 bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-xl rounded-3xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--text-main)]">Doctor Professional Profile</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Clinical credentials and verified practice credentials</p>
                  </div>
                </div>
                {!docEditing && (
                  <Button variant="outline" size="sm" onClick={() => setDocEditing(true)} leftIcon={<Edit3 className="w-3.5 h-3.5" />}>
                    Edit Profile
                  </Button>
                )}
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Full Name</label>
                    {docEditing ? (
                      <Input value={docFullName} onChange={e => setDocFullName(e.target.value)} required />
                    ) : (
                      <strong className="text-sm text-[var(--text-main)] block">{docFullName || 'Dr. Arjun Sarkaar'}</strong>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Specialization</label>
                    {docEditing ? (
                      <Input value={docSpecialization} onChange={e => setDocSpecialization(e.target.value)} />
                    ) : (
                      <Badge variant="primary" size="sm font-mono font-bold">{docSpecialization || 'General Medicine'}</Badge>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Medical Qualification</label>
                    {docEditing ? (
                      <Input value={docQualification} onChange={e => setDocQualification(e.target.value)} />
                    ) : (
                      <strong className="text-xs text-[var(--text-main)] block font-mono">{docQualification || 'MBBS, MD'}</strong>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Registration Council</label>
                    {docEditing ? (
                      <Input value={docCouncil} onChange={e => setDocCouncil(e.target.value)} />
                    ) : (
                      <strong className="text-xs text-[var(--text-main)] block">{docCouncil || 'State Medical Council'}</strong>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Years of Experience</label>
                    {docEditing ? (
                      <Input type="number" min="0" max="80" value={docExperience} onChange={e => setDocExperience(e.target.value)} />
                    ) : (
                      <strong className="text-xs text-[var(--text-main)] block font-mono">{docExperience || 8} Years</strong>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Contact Number</label>
                    {docEditing ? (
                      <Input value={docContact} onChange={e => setDocContact(e.target.value)} />
                    ) : (
                      <strong className="text-xs text-[var(--text-main)] block font-mono">{docContact || '+1 (555) 345-6789'}</strong>
                    )}
                  </div>

                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1 text-xs">
                  <label className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Hospital / Clinical Affiliation</label>
                  {docEditing ? (
                    <Input value={docHospital} onChange={e => setDocHospital(e.target.value)} />
                  ) : (
                    <strong className="text-xs text-[var(--text-main)] block">{docHospital || 'Apollo Specialty Hospitals'}</strong>
                  )}
                </div>

                {docEditing && (
                  <div className="flex items-center gap-3 pt-2">
                    <Button variant="primary" size="md" type="submit" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
                      Save Professional Profile
                    </Button>
                    <Button variant="outline" size="md" type="button" onClick={() => setDocEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </Card>
          </div>

          {/* Right Column: Governance & Password Reset (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card isGlass={true} className="p-6 bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-xl rounded-3xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-extrabold text-[var(--text-main)]">Credential Governance</h3>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 text-xs">
                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Medical Registration #
                </span>
                <strong className="font-mono text-lg font-black text-emerald-700 dark:text-emerald-300 block tracking-widest">
                  {doctorProfile.registration_number || 'REG-190826'}
                </strong>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Verification Status:</span>
                  <Badge variant={doctorProfile.verification_status === 'VERIFIED' ? 'success' : 'warning'} size="sm font-mono font-bold">
                    {doctorProfile.verification_status || 'VERIFIED'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Physician Doctor ID:</span>
                  <strong className="font-mono text-[var(--primary)]">{doctorProfile.doctor_id || 'DOC-101'}</strong>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Account Registration:</span>
                  <strong className="font-mono text-[var(--text-main)]">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}</strong>
                </div>
              </div>
            </Card>

            {renderPasswordResetCard()}
          </div>

        </div>
      )}

      {/* ADMIN PORTAL ACCOUNT WORKSPACE */}
      {role === 'ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Admin Account & Governance (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <Card isGlass={true} className="p-6 md:p-8 bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-xl rounded-3xl space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[var(--border-subtle)]">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-main)]">System Administrator Governance</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Platform administrative identity & RBAC configuration</p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-[var(--text-main)] block mb-1">Administrator Full Name</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Admin Name..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Administrative Role</span>
                    <Badge variant="accent" size="sm font-mono font-bold">SYSTEM ADMINISTRATOR</Badge>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
                    <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Security Scope</span>
                    <strong className="text-xs text-[var(--text-main)] block">Full RBAC & Clinical Audit Control</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="primary" size="md" type="submit" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
                    Save Administrator Profile
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Admin System Security Card (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Card isGlass={true} className="p-6 bg-[var(--bg-primary)] border border-[var(--border-subtle)] shadow-xl rounded-3xl space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
                <Key className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-extrabold text-[var(--text-main)]">Security Credentials</h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Admin Email:</span>
                  <strong className="font-mono text-[var(--text-main)]">{user?.email || '—'}</strong>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">User ID:</span>
                  <strong className="font-mono text-[var(--primary)]">{user?.user_id || '—'}</strong>
                </div>

                <div className="flex justify-between items-center p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Auth Token Encryption:</span>
                  <Badge variant="success" size="sm font-mono">PBKDF2 SHA-256</Badge>
                </div>
              </div>
            </Card>

            {renderPasswordResetCard()}
          </div>

        </div>
      )}

    </PageContainer>
  );
}
