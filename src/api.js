/**
 * FraudLens API Client Layer
 * Handles communication with the backend API with full mock fallback matching the exact API contract.
 */

const API_BASE_URL = ''; // Force relative paths to use Vite proxy

/**
 * Reusable helper to get the authorization header.
 */
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Handles HTTP response errors, specifically 401 for authentication.
 */
async function handleResponse(response) {
  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error("Authentication session expired or invalid. Please log in again.");
      error.status = 401;
      throw error;
    }
    let errorMsg = `Server returned error: ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  return await response.json();
}

/**
 * POST /api/auth/login
 */
export async function login(email, password) {
  const response = await fetch(`/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

/**
 * POST /api/auth/signup
 */
export async function signup(email, password) {
  const response = await fetch(`/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(response);
}

/**
 * POST /api/analyze
 */
export async function analyzeMessage(text) {
  if (!text || !text.trim()) {
    throw new Error("Please enter a message to analyze.");
  }

  const response = await fetch(`/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ text: text.trim() }),
  });

  return handleResponse(response);
}

/**
 * GET /api/history?limit=20
 */
export async function getHistory(limit = 20) {
  const response = await fetch(`/api/history?limit=${limit}`, {
    headers: { ...getAuthHeaders() }
  });
  return handleResponse(response);
}

/**
 * GET /api/stats
 */
export async function getStats() {
  const response = await fetch(`/api/stats`, {
    headers: { ...getAuthHeaders() }
  });
  return handleResponse(response);
}

/**
 * POST /api/report
 * Requests and triggers download of the downloadable scam analysis PDF report.
 */
export async function downloadReport(text) {
  if (!text || !text.trim()) {
    throw new Error("No message content provided to generate a report.");
  }

  const response = await fetch(`/api/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ text: text.trim() }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error("Authentication session expired or invalid. Please log in again.");
      error.status = 401;
      throw error;
    }
    let errorMsg = `Server returned error: ${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fraudlens-scam-analysis-report.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
