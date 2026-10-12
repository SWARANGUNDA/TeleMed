import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, User, ArrowRight, Loader2, Mail, Trash2, Sparkles, Stethoscope } from 'lucide-react';
import { loginWithGoogle } from '../../api/client';

export default function GoogleAuthModal({ isOpen, onClose, onSuccess, initialRole = 'PATIENT' }) {
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSandbox, setShowSandbox] = useState(false);

  // Sync role when initialRole changes
  useEffect(() => {
    if (initialRole) {
      setSelectedRole(initialRole);
    }
  }, [initialRole]);

  // Load only accounts saved on THIS specific device/browser
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem('telemed_device_google_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedAccounts(parsed);
        }
      }
    } catch (e) {
      setSavedAccounts([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveAccountToDevice = (account) => {
    if (typeof localStorage === 'undefined') return;
    try {
      const existing = savedAccounts.filter(a => a.email.toLowerCase() !== account.email.toLowerCase());
      const updated = [account, ...existing].slice(0, 4); // Keep max 4 recent accounts on device
      localStorage.setItem('telemed_device_google_accounts', JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (e) {}
  };

  const removeAccountFromDevice = (e, emailToRemove) => {
    e.stopPropagation();
    try {
      const updated = savedAccounts.filter(a => a.email.toLowerCase() !== emailToRemove.toLowerCase());
      localStorage.setItem('telemed_device_google_accounts', JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (e) {}
  };

  const handleAuthenticate = async (accountData) => {
    setLoading(true);
    setError(null);
    try {
      const targetRole = accountData.role || selectedRole;
      const cleanEmail = accountData.email.trim().toLowerCase();
      const cleanName = accountData.name?.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      const payload = {
        email: cleanEmail,
        name: cleanName,
        role: targetRole,
      };

      const res = await loginWithGoogle(payload);
      const authenticatedUser = res.user || res;

      // Save to device history for convenience on THIS computer
      const initials = cleanName
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U';

      saveAccountToDevice({
        name: cleanName,
        email: cleanEmail,
        role: targetRole,
        initials,
        avatarColor: targetRole === 'DOCTOR' ? 'bg-emerald-600' : 'bg-blue-600',
      });

      if (onSuccess) {
        onSuccess(authenticatedUser);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Google authentication failed. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }
    handleAuthenticate({
      email: googleEmail,
      name: googleName,
      role: selectedRole,
    });
  };

  // Standard sandbox personas for instant testing across devices
  const sandboxAccounts = [
    {
      name: 'Demo Physician (Dr. Vishal)',
      email: 'doctor@telemed.ai',
      role: 'DOCTOR',
      initials: 'DR',
      avatarColor: 'bg-emerald-600',
      description: 'Endocrinology & General Medicine Specialist',
    },
    {
      name: 'Demo Patient (Alex Morgan)',
      email: 'patient@telemed.ai',
      role: 'PATIENT',
      initials: 'PT',
      avatarColor: 'bg-blue-600',
      description: 'Standard Telehealth Patient Sandbox Profile',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Google Icon */}
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Sign in with Google
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Choose or enter your account to access TeleMed AI
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {/* Role Pre-selection Banner */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
            Select Portal Access Mode
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setSelectedRole('PATIENT')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'PATIENT'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Patient Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('DOCTOR')}
              className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                selectedRole === 'DOCTOR'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Doctor Portal</span>
            </button>
          </div>
        </div>

        {/* Previously Saved Accounts on THIS Device */}
        {savedAccounts.length > 0 && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Previous Logins on this Device
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {savedAccounts.map((account) => (
                <div
                  key={account.email}
                  onClick={() => handleAuthenticate(account)}
                  className="w-full p-2.5 rounded-2xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full ${account.avatarColor || 'bg-blue-600'} text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0`}>
                      {account.initials || 'U'}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {account.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          {account.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate">
                        {account.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="Remove from this device"
                      onClick={(e) => removeAccountFromDevice(e, account.email)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Input Form for User's Own Google Account */}
        <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Enter Your Google Account Details
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="your.email@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:bg-white focus:border-blue-600 transition-all text-slate-900"
              />
            </div>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Your Full Name (optional)"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:bg-white focus:border-blue-600 transition-all text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !googleEmail}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Continue as {selectedRole === 'DOCTOR' ? 'Doctor' : 'Patient'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Sandbox Profiles Toggle for Testing */}
        <div className="pt-1 border-t border-slate-100">
          {!showSandbox ? (
            <button
              type="button"
              onClick={() => setShowSandbox(true)}
              className="w-full py-1.5 text-center text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Need quick sandbox demo accounts?</span>
            </button>
          ) : (
            <div className="space-y-1.5 pt-1 animate-fade-in text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Shared Testing Sandbox Profiles
                </span>
                <button
                  type="button"
                  onClick={() => setShowSandbox(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Hide
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sandboxAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handleAuthenticate(account)}
                    className="p-2 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${account.avatarColor} text-white font-extrabold text-[10px] flex items-center justify-center shrink-0`}>
                        {account.initials}
                      </div>
                      <div className="truncate">
                        <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                          {account.name.split(' ')[0]} {account.role}
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">
                          {account.email}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security Footer Notice */}
        <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Encrypted with SHA-256 JWT sessions under HIPAA compliance.</span>
        </div>
      </div>
    </div>
  );
}
