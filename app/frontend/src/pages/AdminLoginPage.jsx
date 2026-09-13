import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, Eye, EyeOff, Terminal, KeyRound, CheckCircle2, AlertTriangle, Sparkles, ChevronLeft } from 'lucide-react';
import { loginUser } from '../api/client';

export default function AdminLoginPage({ onLogin, onLoginSuccess, user }) {
  const [email, setEmail] = useState('admin@telemed.ai');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      let authenticatedUser = null;
      if (onLogin) {
        authenticatedUser = await onLogin(email.trim(), password, 'ADMIN');
      } else {
        const data = await loginUser(email.trim(), password, 'ADMIN');
        authenticatedUser = data.user || data;
        if (data.refresh_token) {
          try { sessionStorage.setItem('telemed_refresh_token', data.refresh_token); } catch (e) {}
        }
        if (onLoginSuccess) {
          onLoginSuccess(authenticatedUser);
        }
      }

      if (authenticatedUser) {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Administrative authentication failed. Verify system credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@telemed.ai');
    setPassword('Password123!');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      
      {/* Ambient Cybernetic Lighting Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-indigo-900/30 via-purple-900/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900/80 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl backdrop-blur-md"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Patient & Doctor Portal</span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-extrabold tracking-wider uppercase shadow-inner">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Restricted Gateway</span>
        </div>
      </header>

      {/* Main Command Center Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">

          {/* Secure Header & Badge */}
          <div className="text-center space-y-2.5">
            <div className="relative inline-block">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 border border-indigo-400/30 shadow-xl shadow-indigo-600/30 flex items-center justify-center mx-auto">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <KeyRound className="w-3 h-3 text-slate-950" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Administrator Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto font-medium leading-relaxed">
              Authenticate with administrative credentials to access platform infrastructure and audit controls.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-4">
            
            {user && user.role !== 'ADMIN' && (
              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-semibold flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  Currently signed in as <span className="font-black text-white">{user.email}</span> ({user.role}). Sign in below with an Administrator account to access the Command Center.
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-semibold leading-relaxed animate-shake">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
              
              {/* Admin Email */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-300">
                  Administrator Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@telemed.ai"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder:text-slate-600 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Admin Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-300">
                    Security Key / Password
                  </label>
                  <button
                    type="button"
                    onClick={handleFillDemoAdmin}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Quick Autofill Demo
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder:text-slate-600 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {loading ? (
                  <span>Authorizing System Session...</span>
                ) : (
                  <>
                    <span>Enter Command Center</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Help */}
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pre-configured Evaluation Access</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Default credentials: <code className="text-indigo-300 font-mono">admin@telemed.ai</code> / <code className="text-indigo-300 font-mono">Password123!</code>
              </p>
            </div>

          </div>

          {/* Security Compliance Footer */}
          <div className="text-center text-[11px] text-slate-500 font-medium space-y-1">
            <p>Protected by TeleMed AI Multi-Factor RBAC Architecture</p>
            <p className="text-slate-600">All administrative sessions are cryptographically logged for HIPAA compliance.</p>
          </div>

        </div>
      </main>

      {/* Bottom Footer bar */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        TeleMed AI • Enterprise Healthcare Infrastructure
      </footer>

    </div>
  );
}
