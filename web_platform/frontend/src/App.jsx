import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Layout } from './components/layout/Layout';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

import AssessmentComparisonModal from './components/AssessmentComparisonModal';
import useTheme from './utils/useTheme';
import { predictV3, fetchXAIV3, analyzePredictions, confirmFeatures, getCurrentUser, logoutUser, loginUser, fetchPatientRecords } from './api/client';

// Lazy-loaded pages (code split per route)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const IntakePage = lazy(() => import('./pages/IntakePage'));

// Lazy-loaded secondary & role-specific pages
const XAIPage = lazy(() => import('./pages/XAIPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const HealthRecordsPage = lazy(() => import('./pages/HealthRecordsPage'));
const CarePage = lazy(() => import('./pages/CarePage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const DoctorDashboardPage = lazy(() => import('./pages/DoctorDashboardPage'));
const DoctorVerificationPage = lazy(() => import('./pages/DoctorVerificationPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminDoctorVerificationPage = lazy(() => import('./pages/AdminDoctorVerificationPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminSystemPage = lazy(() => import('./pages/AdminSystemPage'));
const AdminAuditPage = lazy(() => import('./pages/AdminAuditPage'));
const PatientPrivacyPage = lazy(() => import('./pages/PatientPrivacyPage'));
const ConsultationWorkspacePage = lazy(() => import('./pages/ConsultationWorkspacePage'));
const AdminConsultationManagementPage = lazy(() => import('./pages/AdminConsultationManagementPage'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CompareAssessmentsPage = lazy(() => import('./pages/CompareAssessmentsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const HealthCopilotPage = lazy(() => import('./pages/HealthCopilotPage'));

// Public Landing Pages
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const ResearchPage = lazy(() => import('./pages/ResearchPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));

function PageSkeleton() {
  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass-card" style={{ padding: '36px 48px', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin" style={{ color: 'var(--accent-cyan)', marginBottom: '12px' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Loading page module...</p>
      </div>
    </div>
  );
}

export function getNavFromPath(path, role) {
  switch (path) {
    case '/intake':
      return { activeNav: 'analysis', activeSubNav: 'new_analysis' };
    case '/xai':
      return { activeNav: 'results', activeSubNav: 'xai' };
    case '/report':
      return { activeNav: 'results', activeSubNav: 'report' };
    case '/records':
      return { activeNav: 'records', activeSubNav: 'reports_history' };
    case '/consultations':
      return { activeNav: 'consultations', activeSubNav: '' };
    case '/appointments':
      return { activeNav: 'appointments', activeSubNav: '' };
    case '/care':
      return { activeNav: 'care', activeSubNav: '' };
    case '/privacy':
      return { activeNav: 'patient_privacy', activeSubNav: '' };
    case '/account':
      return { activeNav: 'account', activeSubNav: 'settings' };
    case '/doctor/verification':
      return { activeNav: 'verification', activeSubNav: '' };
    case '/doctor/dashboard':
      return { activeNav: 'dashboard', activeSubNav: '' };
    case '/doctor/consultations':
      return { activeNav: 'assigned_patients', activeSubNav: '' };
    case '/admin/dashboard':
      return { activeNav: 'admin_dashboard', activeSubNav: '' };
    case '/admin/doctors':
      return { activeNav: 'admin_verification', activeSubNav: '' };
    case '/admin/consultations':
      return { activeNav: 'admin_assignments', activeSubNav: '' };
    case '/admin/users':
      return { activeNav: 'admin_users', activeSubNav: '' };
    case '/admin/system':
      return { activeNav: 'admin_system', activeSubNav: '' };
    case '/admin/audit':
      return { activeNav: 'admin_audit', activeSubNav: '' };
    case '/dashboard':
    case '/':
    default:
      if (role === 'ADMIN') return { activeNav: 'admin_dashboard', activeSubNav: '' };
      if (role === 'DOCTOR') return { activeNav: 'dashboard', activeSubNav: '' };
      return { activeNav: 'dashboard', activeSubNav: '' };
  }
}

export function getPathFromNav(primaryNav, subNav, role) {
  if (primaryNav === 'analysis' || primaryNav === 'intake') return '/intake';
  if (primaryNav === 'results') {
    if (subNav === 'xai') return '/xai';
    if (subNav === 'report') return '/report';
    return '/dashboard';
  }
  if (primaryNav === 'xai') return '/xai';
  if (primaryNav === 'report') return '/report';
  if (primaryNav === 'copilot') return '/copilot';
  if (primaryNav === 'profile') return '/profile';
  if (primaryNav === 'compare') return '/compare';
  if (primaryNav === 'notifications') return '/notifications';
  if (primaryNav === 'messages') return '/messages';
  if (primaryNav === 'records') return '/records';
  if (primaryNav === 'consultations') return '/consultations';
  if (primaryNav === 'appointments') return '/appointments';
  if (primaryNav === 'care') return '/care';
  if (primaryNav === 'patient_privacy' || primaryNav === 'privacy') return '/privacy';
  if (primaryNav === 'account') return '/account';
  if (primaryNav === 'verification') return '/doctor/verification';
  if (primaryNav === 'assigned_patients') return '/doctor/consultations';
  if (primaryNav === 'admin_dashboard') return '/admin/dashboard';
  if (primaryNav === 'admin_verification') return '/admin/doctors';
  if (primaryNav === 'admin_assignments') return '/admin/consultations';
  if (primaryNav === 'admin_users') return '/admin/users';
  if (primaryNav === 'admin_system') return '/admin/system';
  if (primaryNav === 'admin_audit') return '/admin/audit';
  if (primaryNav === 'dashboard') {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'DOCTOR') return '/doctor/dashboard';
    return '/dashboard';
  }
  return '/dashboard';
}


export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const { themeMode, setThemeMode } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [isDemoActive, setIsDemoActive] = useState(true);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const [session, setSession] = useState(() => {
    try {
      const saved = sessionStorage.getItem('telemed_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [predictionData, setPredictionData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('telemed_pred');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [xaiData, setXaiData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('telemed_xai');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [selectedDiseaseForXAI, setSelectedDiseaseForXAI] = useState('Type2_Diabetes');
  const [guardNotice, setGuardNotice] = useState(null);
  const [consultationContext, setConsultationContext] = useState(null);

  // Assessment session guard: when non-null, a new assessment is actively being prepared.
  // This prevents loadLatestRecord from auto-hydrating stale historical data over a deliberately cleared state.
  const [assessmentId, setAssessmentId] = useState(null);

  const currentState = session?.status || 'CREATED';
  const isPredictionComplete = ['ANALYZED', 'XAI_READY', 'REPORT_READY'].includes(currentState) || Boolean(predictionData);

  const { activeNav, activeSubNav } = getNavFromPath(location.pathname, currentUser?.role);

  const refreshCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (e) {}
  };

  // Check active user session on startup
  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  // Listen for user profile/verification update & session-expired events
  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
      navigate('/');
      window._telemedSessionExpired = false;
    };
    const handleUserUpdated = () => {
      refreshCurrentUser();
    };

    window.addEventListener('telemed:session-expired', handleSessionExpired);
    window.addEventListener('telemed:user-updated', handleUserUpdated);
    return () => {
      window.removeEventListener('telemed:session-expired', handleSessionExpired);
      window.removeEventListener('telemed:user-updated', handleUserUpdated);
    };
  }, [navigate]);

  // Load latest health record from PostgreSQL/SQLite on patient login or page refresh.
  // CRITICAL: Filter records strictly for currentUser to prevent cross-user data leakage.
  useEffect(() => {
    async function loadLatestRecord() {
      if (currentUser && currentUser.role === 'PATIENT' && !assessmentId) {
        try {
          const res = await fetchPatientRecords();
          const records = res?.records || [];
          if (records.length > 0) {
            // Filter strictly by current user's ID or email
            const userRecords = records.filter(r => 
              (r.user_id && r.user_id === currentUser.user_id) ||
              (r.patient_id && r.patient_id === currentUser.user_id) ||
              (r.user_email && r.user_email.toLowerCase() === currentUser.email?.toLowerCase()) ||
              (r.email && r.email.toLowerCase() === currentUser.email?.toLowerCase())
            );

            if (userRecords.length > 0) {
              const latest = userRecords[0];
              const snap = latest.prediction_snapshot || latest;
              if (snap) {
                setPredictionData(snap);
                setSession(prev => prev || {
                  session_id: latest.record_id || latest.session_id || `P_${currentUser.user_id?.slice(-6) || 'REC'}`,
                  confirmed_features: snap.confirmed_features || snap.clinical_features || {},
                  effective_pathway: snap.effective_pathway || snap.pathway_used || 'C+W+G',
                  active_modalities: snap.active_modalities || ['clinical', 'wearable', 'gut'],
                  status: 'REPORT_READY'
                });
                if (!xaiData) {
                  const clin = snap.confirmed_features?.clinical || snap.clinical_features || snap.clinical_data || {};
                  const wear = snap.confirmed_features?.wearable || snap.wearable_features || snap.wearable_data || {};
                  const gut = snap.confirmed_features?.gut || snap.gut_features || snap.gut_data || {};
                  if (Object.keys(clin).length > 0 || Object.keys(wear).length > 0 || Object.keys(gut).length > 0) {
                    fetchXAIV3({
                      patient_id: latest.record_id || 'P_USER_001',
                      clinical_data: clin,
                      wearable_data: wear,
                      gut_data: gut
                    }, 'Type2_Diabetes')
                      .then(xai => setXaiData(xai))
                      .catch(() => {});
                  }
                }
              }
            } else {
              // New user with zero health records
              setPredictionData(null);
              setSession(null);
              setXaiData(null);
            }
          } else {
            setPredictionData(null);
            setSession(null);
            setXaiData(null);
          }
        } catch (e) {
          setPredictionData(null);
        }
      }
    }
    loadLatestRecord();
  }, [currentUser, assessmentId]);


  // Sync state to sessionStorage
  useEffect(() => {
    try {
      if (session) sessionStorage.setItem('telemed_session', JSON.stringify(session));
      else sessionStorage.removeItem('telemed_session');
    } catch (e) {}
  }, [session]);

  useEffect(() => {
    try {
      if (predictionData) sessionStorage.setItem('telemed_pred', JSON.stringify(predictionData));
      else sessionStorage.removeItem('telemed_pred');
    } catch (e) {}
  }, [predictionData]);

  useEffect(() => {
    try {
      if (xaiData) sessionStorage.setItem('telemed_xai', JSON.stringify(xaiData));
      else sessionStorage.removeItem('telemed_xai');
    } catch (e) {}
  }, [xaiData]);

  const handleLoginSuccess = (user) => {
    // Clear stale session/prediction data from previous user
    sessionStorage.removeItem('telemed_session');
    sessionStorage.removeItem('telemed_pred');
    sessionStorage.removeItem('telemed_xai');
    setSession(null);
    setPredictionData(null);
    setXaiData(null);
    setCurrentUser(user);
    const targetPath = getPathFromNav('dashboard', '', user.role);
    navigate(targetPath);
  };

  const handleLogin = async (email, password, role) => {
    const data = await loginUser(email, password, role);
    const user = data.user || data;
    if (data.refresh_token) {
      try { sessionStorage.setItem('telemed_refresh_token', data.refresh_token); } catch (e) {}
    }
    handleLoginSuccess(user);
    return user;
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setSession(null);
    setPredictionData(null);
    setXaiData(null);
    sessionStorage.clear();
    localStorage.removeItem('telemed_token');
    localStorage.removeItem('telemed_user');
    navigate('/');
  };

  const handleNavigate = (primaryNav, subNav = '', diseaseKey = null) => {
    if (primaryNav === 'results' && !isPredictionComplete) {
      setGuardNotice('Complete patient data intake and run prediction first before viewing AI Results.');
      navigate('/intake');
      return;
    }
    setGuardNotice(null);
    if (primaryNav === 'xai' && diseaseKey) {
      setSelectedDiseaseForXAI(diseaseKey);
      navigate(`/xai?disease=${diseaseKey}`, { state: { disease: diseaseKey } });
      return;
    }
    const targetPath = getPathFromNav(primaryNav, subNav, currentUser?.role);
    navigate(targetPath);
  };

  const handleDiscussWithDoctor = (initialTopic = '') => {
    setConsultationContext({ initialTopic });
    handleNavigate('consultations');
  };

  const handleStartAnalysis = () => {
    handleNavigate('analysis', 'new_analysis');
  };

  // P0 FIX: Hard assessment reset. Creates a fresh assessment context.
  // Clears ALL assessment-scoped state while preserving auth, profile, and historical records.
  const handleStartNewAssessment = () => {
    const newId = `assess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setAssessmentId(newId);
    setSession(null);
    setPredictionData(null);
    setXaiData(null);
    setGuardNotice(null);
    setSelectedDiseaseForXAI('Type2_Diabetes');
    try {
      sessionStorage.removeItem('telemed_session');
      sessionStorage.removeItem('telemed_pred');
      sessionStorage.removeItem('telemed_xai');
    } catch (e) {}
    navigate('/intake');
  };

  const handleAnalysisComplete = async (payloadData) => {
    try {
      const confirmed = payloadData?.confirmed_features || session?.confirmed_features || {};
      const sid = payloadData?.session_id || session?.session_id;

      if (sid && sid.startsWith('sess_')) {
        try {
          await confirmFeatures(sid, confirmed);
          await analyzePredictions(sid);
        } catch (e) {
          console.warn('V1 prediction analysis non-blocking warning:', e);
        }
      }

      const v3Payload = {
        patient_id: payloadData?.patient_id || sid || 'P_USER_001',
        clinical_data: payloadData?.clinical_data || payloadData?.clinical || confirmed.clinical || null,
        wearable_data: payloadData?.wearable_data || payloadData?.wearable || confirmed.wearable || null,
        gut_data: payloadData?.gut_data || payloadData?.gut || confirmed.gut || null,
      };

      const pred = await predictV3(v3Payload);
      setPredictionData(pred);
      // P0 FIX: Create a CLEAN session object — do NOT spread prev session to prevent stale data leaking.
      setSession({
        session_id: v3Payload.patient_id,
        assessment_id: assessmentId,
        confirmed_features: confirmed,
        active_modalities: pred.active_modalities || pred.routing_metadata?.modalities_supplied || [],
        effective_pathway: pred.pathway_used || pred.routing_metadata?.effective_pathway || 'C',
        v3_payload: v3Payload,
        status: 'ANALYZED'
      });
      // Clear assessmentId guard — the new assessment is now the active result.
      setAssessmentId(null);

      try {
        const xai = await fetchXAIV3(v3Payload, 'Type2_Diabetes');
        setXaiData(xai);
        setSession((prev) => ({ ...prev, status: 'XAI_READY' }));
      } catch (xaiErr) {
        console.warn('XAI attribution fetch non-blocking note:', xaiErr);
        setSession((prev) => ({ ...prev, status: 'ANALYZED' }));
      }

      setGuardNotice(null);
      navigate('/dashboard');
    } catch (err) {
      setGuardNotice(`Analysis Notification: ${err.message || 'Pipeline execution warning'}`);
    }

  };

  const handleInvalidateDownstream = () => {
    setPredictionData(null);
    setXaiData(null);
    try {
      sessionStorage.removeItem('telemed_pred');
      sessionStorage.removeItem('telemed_xai');
    } catch (e) {}
  };

  const handleResetSession = () => {
    handleStartNewAssessment();
  };

  if (authChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontFamily: 'Inter, sans-serif'
      }}>
        Initializing TeleMed AI RBAC Engine...
      </div>
    );
  }

  const isPublicRoute = ['/', '/about', '/features', '/research', '/contact', '/login', '/register'].includes(location.pathname);

  const defaultRoleDashboard =
    currentUser?.role === 'ADMIN'
      ? '/admin/dashboard'
      : currentUser?.role === 'DOCTOR'
      ? '/doctor/dashboard'
      : '/dashboard';

  const routeContent = (
    <ErrorBoundary key={location.pathname} onReset={() => navigate(defaultRoleDashboard)}>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* PUBLIC LANDING ROUTES */}
          <Route path="/" element={<HomePage user={currentUser} onOpenAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')} />} />
          <Route path="/about" element={<AboutPage user={currentUser} onOpenAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')} />} />
          <Route path="/features" element={<FeaturesPage user={currentUser} onOpenAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')} />} />
          <Route path="/research" element={<ResearchPage user={currentUser} onOpenAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')} />} />
          <Route path="/contact" element={<ContactPage user={currentUser} onOpenAuth={(mode) => navigate(mode === 'register' ? '/register' : '/login')} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} user={currentUser} />} />
          <Route path="/register" element={<RegisterPage onLoginSuccess={handleLoginSuccess} user={currentUser} />} />

            {/* PATIENT ROUTES */}
            <Route path="/dashboard" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT']}>
                <DashboardPage
                  session={session}
                  predictionData={predictionData}
                  user={currentUser}
                  onNavigate={handleNavigate}
                  onStartNewAnalysis={handleStartNewAssessment}
                  onDiscussWithDoctor={handleDiscussWithDoctor}
                  onOpenComparison={() => setIsComparisonOpen(true)}
                />
              </ProtectedRoute>
            } />

            <Route path="/intake" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT']}>
                <IntakePage
                  session={session}
                  setSession={setSession}
                  onAnalysisComplete={handleAnalysisComplete}
                  onInvalidateDownstream={handleInvalidateDownstream}
                  onResetSession={handleStartNewAssessment}
                  activeSubNav={activeSubNav}
                  assessmentId={assessmentId}
                />
              </ProtectedRoute>
            } />

            <Route path="/xai" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT']}>
                <XAIPage
                  session={session}
                  predictionData={predictionData}
                  xaiData={xaiData}
                  setXaiData={setXaiData}
                  onStartAnalysis={handleStartNewAssessment}
                  onNavigateReport={() => navigate('/report')}
                />
              </ProtectedRoute>
            } />

            <Route path="/report" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT']}>
                <ReportPage
                  user={currentUser}
                  session={session}
                  predictionData={predictionData}
                  onDiscussWithDoctor={(rec) => {
                    setConsultationContext({
                      reason: `Discussion regarding health report findings: ${rec.what || ''}`,
                      recordId: null
                    });
                    navigate('/consultations');
                  }}
                />
              </ProtectedRoute>
            } />

            <Route path="/records" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT']}>
                <HealthRecordsPage
                  currentUser={currentUser}
                  session={session}
                  predictionData={predictionData}
                  onStartAnalysis={handleStartNewAssessment}
                  onShareWithDoctor={(recId) => {
                    setConsultationContext({
                      reason: 'Sharing persistent health record for doctor review',
                      recordId: recId
                    });
                    navigate('/consultations');
                  }}
                />
              </ProtectedRoute>
            } />

            <Route path="/consultations" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT', 'DOCTOR']}>
                <ConsultationWorkspacePage
                  user={currentUser}
                  predictionData={predictionData}
                  initialContext={consultationContext}
                  onNavigate={handleNavigate}
                />
              </ProtectedRoute>
            } />

            <Route path="/appointments" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT', 'DOCTOR']}>
                <AppointmentsPage user={currentUser} onNavigate={handleNavigate} />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT']}>
                <ProfilePage
                  user={currentUser}
                  session={session}
                  predictionData={predictionData}
                  onNavigate={handleNavigate}
                  refreshCurrentUser={refreshCurrentUser}
                />
              </ProtectedRoute>
            } />

            <Route path="/compare" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT']}>
                <CompareAssessmentsPage
                  user={currentUser}
                  session={session}
                  predictionData={predictionData}
                  onNavigate={handleNavigate}
                />
              </ProtectedRoute>
            } />

            <Route path="/notifications" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT', 'DOCTOR', 'ADMIN']}>
                <NotificationsPage user={currentUser} predictionData={predictionData} />
              </ProtectedRoute>
            } />

            <Route path="/messages" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT', 'DOCTOR']}>
                <MessagesPage user={currentUser} />
              </ProtectedRoute>
            } />

            <Route path="/copilot" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT']}>
                <HealthCopilotPage user={currentUser} session={session} predictionData={predictionData} xaiData={xaiData} onNavigate={handleNavigate} />
              </ProtectedRoute>
            } />

            <Route path="/care" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT']}>
                <CarePage
                  user={currentUser}
                  predictionData={predictionData}
                  onNavigate={handleNavigate}
                />
              </ProtectedRoute>
            } />

            <Route path="/privacy" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT', 'DOCTOR', 'ADMIN']}>
                <PatientPrivacyPage user={currentUser} />
              </ProtectedRoute>
            } />

            <Route path="/account" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT', 'DOCTOR', 'ADMIN']}>
                <AccountPage user={currentUser} onNavigate={handleNavigate} />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['PATIENT', 'DOCTOR', 'ADMIN']}>
                <AccountPage user={currentUser} onNavigate={handleNavigate} />
              </ProtectedRoute>
            } />

            {/* DOCTOR ROUTES */}
            <Route path="/doctor/dashboard" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['DOCTOR']}>
                <DoctorDashboardPage user={currentUser} onNavigate={handleNavigate} />
              </ProtectedRoute>
            } />

            <Route path="/doctor/consultations" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['DOCTOR']}>
                <DoctorDashboardPage user={currentUser} onNavigate={handleNavigate} initialTab="ACTIVE" />
              </ProtectedRoute>
            } />

            <Route path="/doctor/verification" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['DOCTOR']}>
                <DoctorVerificationPage currentUser={currentUser} />
              </ProtectedRoute>
            } />

            <Route path="/doctor/profile" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['DOCTOR']}>
                <AccountPage user={currentUser} onNavigate={handleNavigate} />
              </ProtectedRoute>
            } />

            <Route path="/doctor/account" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['DOCTOR']}>
                <AccountPage user={currentUser} onNavigate={handleNavigate} />
              </ProtectedRoute>
            } />

            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['ADMIN']}>
                <AdminDashboardPage onNavigate={handleNavigate} />
              </ProtectedRoute>
            } />

            <Route path="/admin/doctors" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['ADMIN']}>
                <AdminDoctorVerificationPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['ADMIN']}>
                <AdminUsersPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/consultations" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['ADMIN']}>
                <AdminConsultationManagementPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/system" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['ADMIN']}>
                <AdminSystemPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/audit" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['ADMIN']}>
                <AdminAuditPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/account" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['ADMIN']}>
                <AccountPage user={currentUser} onNavigate={handleNavigate} />
              </ProtectedRoute>
            } />

            <Route path="/admin/profile" element={
              <ProtectedRoute currentUser={currentUser} authChecking={authChecking} allowedRoles={['ADMIN']}>
                <AccountPage user={currentUser} onNavigate={handleNavigate} />
              </ProtectedRoute>
            } />

            {/* FALLBACK 404 ROUTE */}
            <Route path="*" element={<Navigate to={currentUser ? defaultRoleDashboard : "/"} replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    );

  if (isPublicRoute) {
    return routeContent;
  }

  return (
    <Layout
      user={currentUser}
      onLogout={handleLogout}
      onToggleTheme={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
      theme={themeMode}
    >


      {/* Assessment Comparison Modal */}
      <AssessmentComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        currentSession={session}
        historicalSession={null}
      />

      {guardNotice && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.12)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '12px 24px',
          color: 'var(--accent-amber)',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          borderRadius: '12px',
          marginBottom: '16px'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span><strong>Navigation Guard:</strong> {guardNotice}</span>
        </div>
      )}

      {routeContent}
    </Layout>
  );
}
