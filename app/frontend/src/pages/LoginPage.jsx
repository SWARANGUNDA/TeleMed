import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PublicCanvasLayout from '../components/landing/PublicCanvasLayout';
import { Activity, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Sparkles, LayoutDashboard, TrendingUp, User } from 'lucide-react';

export default function LoginPage({ onLogin, user, onOpenAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [portalRole, setPortalRole] = useState('PATIENT');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const dashPath = user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'DOCTOR' ? '/doctor/dashboard' : '/dashboard';
      navigate(dashPath, { replace: true });
    }
  }, [user, navigate]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (onLogin) {
        // Authenticate with server
        const authenticatedUser = await onLogin(email.trim(), password, portalRole);
        
        // Strict Role Authorization Guard Check
        if (authenticatedUser && authenticatedUser.role && authenticatedUser.role !== portalRole) {
          const actualRole = authenticatedUser.role;
          const requestedRole = portalRole;
          
          throw new Error(
            `Authorization Failed: Your account role (${actualRole}) does not match the requested ${requestedRole} Portal. Please select the ${actualRole} Portal to sign in.`
          );
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setErrorMsg('Password reset instructions have been sent to your administrator. Please check your inbox or contact support.');
  };

  const handleGoogleAuth = () => {
    setErrorMsg('Google Single Sign-On (SSO) is enabled for enterprise accounts. Please sign in using your email & password.');
  };

  const roleButtonLabel = portalRole === 'ADMIN' ? 'Admin' : portalRole === 'DOCTOR' ? 'Doctor' : 'Patient';

  return (
    <PublicCanvasLayout user={user} onOpenAuth={onOpenAuth} hideFooter={true}>
      <main className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full max-w-7xl mx-auto">
          
          {/* LEFT COLUMN: Benefits & Stunning 16:9 3D Hologram Stage */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-5 items-center hidden md:grid">
            
            {/* Copy & Benefits Left Side */}
            <div className="md:col-span-6 space-y-3 text-left">
              
              {/* Pill Badge */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-600 text-xs font-bold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Welcome Back!</span>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 tracking-tight leading-tight">
                Sign in to <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  TeleMed AI
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-xs">
                Access your multimodal patient records & AI risk predictions.
              </p>

              {/* 3 WHITE BENEFIT CARDS matching Prelogin Canvas Styling */}
              <div className="space-y-2.5 pt-0.5">
                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3 hover:translate-x-1 transition-transform">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Personalized Dashboard</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                      View your health insights and analysis in one place.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3 hover:translate-x-1 transition-transform">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">AI-Powered Insights</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                      Real-time predictions and trend monitoring.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-start gap-3 hover:translate-x-1 transition-transform">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Secure Access</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                      Your data is always encrypted and protected.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* FULLY EXPANDED ATTRACTIVE 16:9 3D HOLOGRAM STAGE */}
            <div className="md:col-span-6 flex justify-center items-center h-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
              <div className="relative w-full h-[360px] sm:h-[400px] lg:h-[420px] rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(15,23,42,0.14)] border border-slate-200/90 bg-slate-950 flex items-center justify-center">
                <img
                  src="/assets/3d/login_3d_secure_lock.jpg"
                  alt="TeleMed AI 3D Medical Hologram Stage"
                  className="w-full h-full object-cover object-center scale-105 transition-transform duration-700 hover:scale-110"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Compact White Login Card (Zero Vertical Overflow) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-[390px] sm:max-w-[400px] rounded-[28px] bg-white border border-slate-200/90 p-5 sm:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] space-y-3">
              
              {/* Card Header Icon & Titles */}
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Sign In to TeleMed AI
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Choose your portal to continue
                </p>
              </div>

              {errorMsg && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold leading-normal">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-2.5 text-left">
                
                {/* ROLE SEGMENTED CONTROL: SELECT PORTAL ROLE */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                    SELECT PORTAL ROLE
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setPortalRole('PATIENT')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        portalRole === 'PATIENT'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Patient</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPortalRole('DOCTOR')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        portalRole === 'DOCTOR'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Doctor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPortalRole('ADMIN')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        portalRole === 'ADMIN'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-0.5">
                  <label className="text-xs font-extrabold text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600 transition-all h-10 sm:h-11"
                    />
                  </div>
                </div>

                {/* Password Field + Forgot Password */}
                <div className="space-y-0.5">
                  <label className="text-xs font-extrabold text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-8 pr-8 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600 transition-all h-10 sm:h-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 h-11"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Sign In to {roleButtonLabel} Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>

              {/* Social Auth Divider */}
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center gap-3 text-[10px] text-slate-400 uppercase font-bold">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span>OR</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Bottom Link */}
              <div className="pt-0.5 text-center text-xs font-medium text-slate-600">
                <span>Don't have an account? </span>
                <Link to="/register" className="font-extrabold text-blue-600 hover:text-blue-700 underline">
                  Create an account
                </Link>
              </div>

            </div>
          </div>

        </div>
      </main>
    </PublicCanvasLayout>
  );
}
