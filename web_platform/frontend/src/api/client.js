/**
 * client.js — Frontend REST API Client Library.
 * Handles Authentication, RBAC, Admin Management, and v3.3 Multimodal Analysis.
 */

const API_BASE = (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174'))
  ? 'http://localhost:8000/api/v1'
  : '/api/v1';

export function getCsrfToken() {
  try {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(new RegExp('(?:^|; )csrf_token=([^;]+)'));
    return match ? decodeURIComponent(match[1]) : '';
  } catch (e) {
    return '';
  }
}

export function getAuthToken() {
  try {
    return localStorage.getItem('telemed_auth_token') || sessionStorage.getItem('telemed_auth_token') || '';
  } catch (e) {
    return '';
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      sessionStorage.setItem('telemed_auth_token', token);
    } else {
      localStorage.removeItem('telemed_auth_token');
      sessionStorage.removeItem('telemed_auth_token');
    }
  } catch (e) {}
}

function getAuthHeaders(customHeaders = {}) {
  const headers = { ...customHeaders };
  const csrf = getCsrfToken();
  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Level 11: Centralized API Response Handler
// ---------------------------------------------------------------------------

/**
 * Handle API responses consistently:
 * - 401: Session expired → clear token, redirect to login
 * - 403: Forbidden → throw descriptive error
 * - 429: Rate limited → throw with retry info
 * - 500: Internal error → throw safe message
 */
async function handleApiResponse(res, fallbackMsg = 'Request failed') {
  if (res.ok) return res;

  let detail = fallbackMsg;
  try {
    const data = await res.json();
    const rawDetail = data.detail || data.message || fallbackMsg;
    if (Array.isArray(rawDetail)) {
      detail = rawDetail.map(item => typeof item === 'object' ? `${item.msg || JSON.stringify(item)}${item.loc ? ` (${item.loc.join('.')})` : ''}` : String(item)).join('; ');
    } else if (typeof rawDetail === 'object') {
      detail = rawDetail.msg || rawDetail.message || JSON.stringify(rawDetail);
    } else {
      detail = String(rawDetail);
    }
  } catch { /* response wasn't JSON */ }

  if (res.status === 401) {
    // Session expired or invalid — clear and redirect
    setAuthToken(null);
    if (typeof window !== 'undefined' && !window._telemedSessionExpired) {
      window._telemedSessionExpired = true;
      window.dispatchEvent(new CustomEvent('telemed:session-expired', { detail }));
    }
    throw new Error('Session expired. Please log in again.');
  }
  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After') || '60';
    throw new Error(`Too many requests. Please try again in ${retryAfter} seconds.`);
  }
  if (res.status === 403) {
    throw new Error(detail || 'You do not have permission to perform this action.');
  }
  if (res.status === 409) {
    throw new Error(detail || 'This operation conflicts with an existing resource.');
  }
  throw new Error(detail);
}

/**
 * Duplicate submission guard — prevents multiple parallel calls for the same action.
 */
const _pendingRequests = new Set();
export function withSubmitGuard(key, fn) {
  if (_pendingRequests.has(key)) {
    return Promise.reject(new Error('Request already in progress. Please wait.'));
  }
  _pendingRequests.add(key);
  return fn().finally(() => _pendingRequests.delete(key));
}

// ------------------------------------------------------------------
// Authentication API Endpoints (/api/v1/auth/*)
// ------------------------------------------------------------------

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(data.message || 'Invalid email or password.');
    } else if (res.status === 403) {
      throw new Error(data.message || 'Account not verified. Please contact support.');
    } else if (res.status === 404) {
      throw new Error('User not found. Please check your email address.');
    } else if (res.status === 422) {
      const detail = data.detail;
      if (Array.isArray(detail)) {
        throw new Error(detail.map(d => d.msg || JSON.stringify(d)).join('; '));
      }
      throw new Error(data.message || 'Invalid request. Please check your input.');
    } else if (res.status === 429) {
      throw new Error('Too many login attempts. Please try again later.');
    } else {
      throw new Error(data.message || 'Unexpected server error. Please try again later.');
    }
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function registerPatient(payload) {
  const res = await fetch(`${API_BASE}/auth/register/patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 400) {
      throw new Error(data.message || 'An account with this email already exists.');
    } else if (res.status === 422) {
      const detail = data.detail;
      if (Array.isArray(detail)) {
        throw new Error(detail.map(d => d.msg || JSON.stringify(d)).join('; '));
      }
      throw new Error(data.message || 'Invalid registration data. Please check your input.');
    } else {
      throw new Error(data.message || 'Registration failed. Please try again later.');
    }
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function registerDoctor(payload) {
  const res = await fetch(`${API_BASE}/auth/register/doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 400) {
      throw new Error(data.message || 'An account with this email already exists.');
    } else if (res.status === 422) {
      const detail = data.detail;
      if (Array.isArray(detail)) {
        throw new Error(detail.map(d => d.msg || JSON.stringify(d)).join('; '));
      }
      throw new Error(data.message || 'Invalid registration data. Please check your input.');
    } else {
      throw new Error(data.message || 'Registration failed. Please try again later.');
    }
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

export async function logoutUser() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (e) {}
  setAuthToken(null);
}

export async function getCurrentUser() {
  try {
    const token = getAuthToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      setAuthToken(null);
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (e) {
    // Network error or proxy unreachable — treat as unauthenticated
    return null;
  }
}

export async function updateUserProfile(payload) {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Failed to update profile');
  }
  return data;
}

// ------------------------------------------------------------------
// Admin Management API Endpoints (/api/v1/admin/*)
// ------------------------------------------------------------------

export async function fetchAdminStats() {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch admin stats');
  }
  return data.stats;
}

export async function fetchAdminUsers(roleFilter = '', searchQuery = '') {
  const params = new URLSearchParams();
  if (roleFilter && roleFilter !== 'ALL') params.append('role', roleFilter);
  if (searchQuery) params.append('search', searchQuery);

  const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch user directory');
  }
  return data.users || [];
}

export async function fetchAdminDoctors(verificationStatus = null) {
  let url = `${API_BASE}/admin/doctors`;
  if (verificationStatus) url += `?verification_status=${encodeURIComponent(verificationStatus)}`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch doctors');
  }
  return data.doctors;
}

export async function updateDoctorStatus(doctorId, status, notes = '') {
  const res = await fetch(`${API_BASE}/admin/doctors/${doctorId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status, notes }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to update doctor verification status');
  }
  return data.doctor;
}

// ------------------------------------------------------------------
// Clinical Intake & ML REST API Endpoints (/api/v1/* & /api/v3/*)
// ------------------------------------------------------------------

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function uploadReports(files, sessionId = null) {
  const formData = new FormData();
  for (const f of files) {
    formData.append('files', f);
  }
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  const res = await fetch(`${API_BASE}/intake/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to upload reports');
  }
  return data;
}

export async function confirmFeatures(arg1, arg2) {
  let sessionId = null;
  let confirmedFeatures = null;

  if (typeof arg1 === 'string') {
    sessionId = arg1;
    confirmedFeatures = arg2;
  } else if (typeof arg1 === 'object') {
    confirmedFeatures = arg1;
    sessionId = typeof arg2 === 'string' ? arg2 : (arg2?.session_id || null);
  }

  const res = await fetch(`${API_BASE}/intake/confirm`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      session_id: sessionId,
      confirmed_features: confirmedFeatures,
    }),
  });

  const data = await handleApiResponse(res, 'Failed to confirm features');
  return data.json ? await data.json() : data;
}

export async function analyzePredictions(sessionId) {
  const res = await fetch(`${API_BASE}/predict/analyze`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ session_id: sessionId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to run predictions');
  }
  return data;
}

export async function fetchXAIExplanations(sessionId, topK = 5) {
  const res = await fetch(`${API_BASE}/xai/explain`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ session_id: sessionId, top_k_drivers: topK }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch XAI explanations');
  }
  return data.xai_payload || data;
}

export async function generateRAGReport(sessionId) {
  const res = await fetch(`${API_BASE}/rag/report`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ session_id: sessionId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to generate RAG report');
  }
  return data;
}

export async function askRAGQuestion(sessionId, question) {
  const res = await fetch(`${API_BASE}/rag/qanda`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ session_id: sessionId, question }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to answer question');
  }
  return data;
}

export async function fetchSuggestedQuestions(sessionId, predictResponse = null) {
  try {
    let res;
    if (predictResponse) {
      res = await fetch('/api/v3/suggested-questions', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ patient_id: sessionId || 'P_TEST_001', predict_response: predictResponse }),
      });
    } else {
      res = await fetch(`${API_BASE}/rag/suggested-questions?session_id=${encodeURIComponent(sessionId || '')}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
    }
    if (res.ok) {
      const data = await res.json();
      if (data.suggested_questions && data.suggested_questions.length > 0) {
        return data;
      }
    }
  } catch (e) {
    // Fail silently with safe fallback
  }
  return {
    suggested_questions: [
      "What dietary changes will reduce my overall metabolic risk?",
      "What physical activity goals should I target for my current profile?",
      "How do my vitals and lab markers compare to clinical target ranges?",
      "What follow-up blood tests should I discuss with my doctor?"
    ]
  };
}

const V3_API_BASE = API_BASE.replace(/\/api\/v1$/, '/api/v3');

export async function predictV3(payload) {
  const res = await fetch(`${V3_API_BASE}/predict`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to execute v3 prediction pipeline');
  }
  return data;
}

export async function fetchXAIV3(payload, disease = 'Type2_Diabetes') {
  const res = await fetch(`${V3_API_BASE}/xai`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ...payload, disease }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch v3 XAI attributions');
  }
  return data;
}

export async function generateReportV3(predictResponse) {
  const res = await fetch(`${V3_API_BASE}/report`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ predict_response: predictResponse }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to generate v3 clinical report');
  }
  return data;
}

export async function askRAGQuestionV3(predictResponse, question) {
  const res = await fetch(`${V3_API_BASE}/qanda`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      patient_id: predictResponse?.patient_id || 'TEST_C001',
      predict_response: predictResponse,
      question: question,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to answer RAG question');
  }
  return data;
}

// ------------------------------------------------------------------
// Health Records & History API Endpoints (/api/v1/records/*)
// ------------------------------------------------------------------

export async function fetchPatientRecords() {
  const res = await fetch(`${API_BASE}/records`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch patient health records');
  }
  return data;
}

export async function fetchRecordDetail(recordId) {
  const res = await fetch(`${API_BASE}/records/${recordId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch health record detail');
  }
  return data.record || data;
}

export async function exportRecord(recordId) {
  const res = await fetch(`${API_BASE}/records/${recordId}/export`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || data.detail || 'Failed to export health record');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TeleMed_HealthRecord_${recordId}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteRecord(recordId) {
  const res = await fetch(`${API_BASE}/records/${recordId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to delete health record');
  }
  return data;
}

// ------------------------------------------------------------------
// Level 4: Doctor Credential Verification & Admin Approval APIs
// ------------------------------------------------------------------

export async function uploadDoctorCredential(file, documentType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);

  const res = await fetch(`${API_BASE}/doctor/credentials/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to upload credential document');
  }
  return data;
}

export async function fetchDoctorCredentials() {
  const res = await fetch(`${API_BASE}/doctor/credentials`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch doctor credentials');
  }
  return data;
}

export async function deleteDoctorCredential(documentId) {
  const res = await fetch(`${API_BASE}/doctor/credentials/${documentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to delete credential document');
  }
  return data;
}

export async function fetchDoctorVerificationStatus() {
  const res = await fetch(`${API_BASE}/doctor/verification-status`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch doctor verification status');
  }
  return data;
}

export async function submitDoctorApplicationForReview() {
  const res = await fetch(`${API_BASE}/doctor/submit-for-review`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to submit application for review');
  }
  return data;
}

export async function fetchAdminDoctorApplications(statusFilter = '', specializationFilter = '', searchQuery = '') {
  const params = new URLSearchParams();
  if (statusFilter) params.append('verification_status', statusFilter);
  if (specializationFilter) params.append('specialization', specializationFilter);
  if (searchQuery) params.append('search', searchQuery);

  const res = await fetch(`${API_BASE}/admin/doctor-applications?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch doctor applications');
  }
  return data;
}

export async function fetchAdminDoctorApplicationDetail(doctorId) {
  const res = await fetch(`${API_BASE}/admin/doctor-applications/${doctorId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch doctor application detail');
  }
  return data.application || data;
}

export async function transitionDoctorStatus(doctorId, targetStatus, reason = '') {
  const res = await fetch(`${API_BASE}/admin/doctor-applications/${doctorId}/transition`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status: targetStatus, reason, notes: reason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to update doctor verification status');
  }
  return data;
}

// ------------------------------------------------------------------
// Level 5: Consultation Requests & Controlled Access APIs
// ------------------------------------------------------------------

export async function createConsultationRequest(payload) {
  const res = await fetch(`${API_BASE}/consultations`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to create consultation request');
  }
  return data;
}

export async function fetchPatientConsultations() {
  const res = await fetch(`${API_BASE}/consultations`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch patient consultations');
  }
  return data;
}

export async function fetchPatientConsultationDetail(consultationId) {
  const res = await fetch(`${API_BASE}/consultations/${consultationId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch consultation detail');
  }
  return data.consultation || data;
}

export async function cancelPatientConsultation(consultationId, reason = '') {
  const res = await fetch(`${API_BASE}/consultations/${consultationId}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ notes: reason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to cancel consultation');
  }
  return data;
}

export async function revokeSharedRecordConsent(consultationId, recordId) {
  const res = await fetch(`${API_BASE}/consultations/${consultationId}/records/${recordId}/revoke`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to revoke record consent');
  }
  return data;
}

export async function fetchAdminConsultations(statusFilter = '', searchQuery = '') {
  const params = new URLSearchParams();
  if (statusFilter) {
    params.append('status', statusFilter);
    params.append('verification_status', statusFilter);
  }
  if (searchQuery) params.append('search', searchQuery);

  const res = await fetch(`${API_BASE}/admin/consultations?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch admin consultation queue');
  }
  return data;
}

export async function assignDoctorToConsultation(consultationId, doctorId, notes = '') {
  const res = await fetch(`${API_BASE}/admin/consultations/${consultationId}/assign`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ doctor_id: doctorId, notes }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to assign doctor to consultation');
  }
  return data;
}

export async function adminCancelConsultation(consultationId, notes = '') {
  const res = await fetch(`${API_BASE}/admin/consultations/${consultationId}/cancel`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ notes }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to cancel consultation');
  }
  return data;
}

export async function fetchDoctorConsultations(statusFilter = '') {
  const params = new URLSearchParams();
  if (statusFilter) params.append('status', statusFilter);

  const res = await fetch(`${API_BASE}/doctor/consultations?${params.toString()}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch doctor consultations');
  }
  return data;
}

export async function respondToDoctorAssignment(consultationId, action, reason = '') {
  const res = await fetch(`${API_BASE}/doctor/consultations/${consultationId}/respond`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ action, reason }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to respond to assignment');
  }
  return data;
}

export async function fetchAuthorizedPatientRecord(consultationId, recordId) {
  const res = await fetch(`${API_BASE}/doctor/consultations/${consultationId}/records/${recordId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch authorized patient record');
  }
  return data.record || data;
}

export async function completeConsultation(consultationId, notes = '') {
  const res = await fetch(`${API_BASE}/doctor/consultations/${consultationId}/complete`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ notes }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to complete consultation');
  }
  return data;
}

// ------------------------------------------------------------------
// Level 7C: Secure Consultation Messaging & Doctor Clinical Notes API
// ------------------------------------------------------------------

export async function sendConsultationMessage(consultationId, content) {
  const res = await fetch(`${API_BASE}/consultations/${consultationId}/messages`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ content }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to send message');
  }
  return data.data || data;
}

export async function fetchConsultationMessages(consultationId) {
  const res = await fetch(`${API_BASE}/consultations/${consultationId}/messages`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch messages');
  }
  return data.messages || [];
}

export async function saveDoctorConsultationNote(consultationId, payload) {
  const res = await fetch(`${API_BASE}/doctor/consultations/${consultationId}/notes`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to save doctor consultation note');
  }
  return data.note || data;
}

export async function fetchConsultationNote(consultationId) {
  const res = await fetch(`${API_BASE}/consultations/${consultationId}/notes`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch consultation note');
  }
  return data.note || null;
}

// ------------------------------------------------------------------
// Level 8: Appointment Scheduling & In-App Notifications API
// ------------------------------------------------------------------

export async function fetchNotifications(unreadOnly = false) {
  const url = `${API_BASE}/notifications${unreadOnly ? '?unread_only=true' : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch notifications');
  }
  return data;
}

export async function markNotificationRead(notificationId) {
  const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to mark notification read');
  }
  return data;
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${API_BASE}/notifications/read-all`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to mark all notifications read');
  }
  return data;
}

export async function configureDoctorAvailability(slots) {
  const res = await fetch(`${API_BASE}/doctor/availability`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ slots }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to configure doctor availability');
  }
  return data;
}

export async function fetchVerifiedDoctors(specialization = '') {
  const url = `${API_BASE}/doctors${specialization ? `?specialization=${encodeURIComponent(specialization)}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch doctors');
  }
  return data.doctors || [];
}

export async function fetchDoctorAvailability(doctorId) {
  const res = await fetch(`${API_BASE}/doctors/${doctorId}/availability`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch doctor availability slots');
  }
  return data.slots || [];
}

export async function bookAppointment(consultationId, slotId, notes = '') {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ consultation_id: consultationId, slot_id: slotId, notes }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to book appointment');
  }
  return data;
}

export async function fetchUserAppointments(statusFilter = '') {
  const url = `${API_BASE}/appointments${statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch appointments');
  }
  return data.appointments || [];
}

export async function updateAppointmentStatus(appointmentId, status, reason = '', newSlotId = null) {
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/status`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ status, reason, new_slot_id: newSlotId }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to update appointment status');
  }
  return data;
}

// ------------------------------------------------------------------
// Level 10: System Operations & Health Monitoring API
// ------------------------------------------------------------------

export async function fetchAdminSystemHealth() {
  const res = await fetch(`${API_BASE}/admin/system/health`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch system health diagnostics');
  }
  return data;
}

export async function updateAdminSystemSettings(settings) {
  const res = await fetch(`${API_BASE}/admin/system/settings`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ settings }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to update system settings');
  }
  return data;
}

// ------------------------------------------------------------------
// Level 12: Audit & Data Governance API
// ------------------------------------------------------------------

export async function fetchPatientAccessHistory() {
  const res = await fetch(`${API_BASE}/patient/access-history`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch access history');
  }
  return data;
}

export async function exportUserAccountData() {
  const res = await fetch(`${API_BASE}/patient/governance/data-export`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to export account data');
  }
  return data;
}

export async function requestAccountDeletion(reason = '') {
  const res = await fetch(`${API_BASE}/patient/governance/delete-request`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to submit deletion request');
  }
  return data;
}

export async function fetchAdminAuditLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/admin/audit?${query}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to fetch audit logs');
  }
  return data;
}

export async function verifyAdminAuditIntegrity() {
  const res = await fetch(`${API_BASE}/admin/audit/integrity`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.detail || 'Failed to verify ledger integrity');
  }
  return data;
}
