import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ currentUser, authChecking, allowedRoles, children }) {
  const location = useLocation();

  if (authChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to root, keeping state for post-login return if needed
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    const defaultRedirect =
      currentUser.role === 'ADMIN'
        ? '/admin/dashboard'
        : currentUser.role === 'DOCTOR'
        ? '/doctor/dashboard'
        : '/dashboard';

    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">403 — Access Denied</h1>
        <p className="text-slate-600 max-w-md mb-6 text-sm">
          Your account role (<span className="font-semibold text-slate-800">{currentUser.role}</span>) does not have authorization to view this endpoint or workspace.
        </p>
        <Link
          to={defaultRedirect}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Your Workspace
        </Link>
      </div>
    );
  }

  return children;
}
