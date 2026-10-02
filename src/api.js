/**
 * FraudLens API Client Layer
 *
 * Handles communication with the backend API.
 */

const API_BASE_URL = '';


// ============================================================
// Authorization
// ============================================================

/**
 * Reusable helper to get the authorization header.
 */
function getAuthHeaders() {

  const token =
    localStorage.getItem("token");

  return token
    ? {
      'Authorization':
        `Bearer ${token}`
    }
    : {};
}


// ============================================================
// Response handling
// ============================================================

/**
 * Handles HTTP response errors.
 *
 * Specifically handles 401 authentication errors.
 */
async function handleResponse(response) {

  if (!response.ok) {

    if (response.status === 401) {

      const error = new Error(
        "Authentication session expired or invalid. Please log in again."
      );

      error.status = 401;

      throw error;
    }


    let errorMsg =
      `Server returned error: ${response.status} ${response.statusText}`;


    try {

      const data =
        await response.json();

      if (data.error) {

        errorMsg =
          data.error;

      }

    } catch (e) {

      // Ignore JSON parsing errors.

    }


    throw new Error(
      errorMsg
    );
  }


  return await response.json();
}


// ============================================================
// LOGIN
// ============================================================

/**
 * POST /api/auth/login
 */
export async function login(
  email,
  password
) {

  const response =
    await fetch(
      `/api/auth/login`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          email,
          password
        }),

      }
    );


  return handleResponse(
    response
  );
}


// ============================================================
// SIGNUP
// ============================================================

/**
 * POST /api/auth/signup
 */
export async function signup(
  email,
  password
) {

  const response =
    await fetch(
      `/api/auth/signup`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          email,
          password
        }),

      }
    );


  return handleResponse(
    response
  );
}


// ============================================================
// ANALYZE MESSAGE
// ============================================================

/**
 * POST /api/analyze
 */
export async function analyzeMessage(
  text
) {

  if (
    !text ||
    !text.trim()
  ) {

    throw new Error(
      "Please enter a message to analyze."
    );

  }


  const response =
    await fetch(
      `/api/analyze`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          ...getAuthHeaders()
        },

        body: JSON.stringify({
          text:
            text.trim()
        }),

      }
    );


  return handleResponse(
    response
  );
}


// ============================================================
// HISTORY
// ============================================================

/**
 * GET /api/history?limit=20
 */
export async function getHistory(
  limit = 20
) {

  const response =
    await fetch(
      `/api/history?limit=${limit}`,
      {
        headers: {
          ...getAuthHeaders()
        }
      }
    );


  return handleResponse(
    response
  );
}


// ============================================================
// STATS
// ============================================================

/**
 * GET /api/stats
 */
export async function getStats() {

  const response =
    await fetch(
      `/api/stats`,
      {
        headers: {
          ...getAuthHeaders()
        }
      }
    );


  return handleResponse(
    response
  );
}


// ============================================================
// DOWNLOAD SCAM REPORT
// ============================================================

/**
 * POST /api/report
 *
 * Requests and triggers download
 * of the downloadable scam analysis
 * PDF report.
 */
export async function downloadReport(
  text
) {

  if (
    !text ||
    !text.trim()
  ) {

    throw new Error(
      "No message content provided to generate a report."
    );

  }


  const response =
    await fetch(
      `/api/report`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          ...getAuthHeaders()
        },

        body: JSON.stringify({
          text:
            text.trim()
        }),

      }
    );


  if (!response.ok) {

    if (response.status === 401) {

      const error = new Error(
        "Authentication session expired or invalid. Please log in again."
      );

      error.status = 401;

      throw error;
    }


    let errorMsg =
      `Server returned error: ${response.status} ${response.statusText}`;


    try {

      const data =
        await response.json();

      if (data.error) {

        errorMsg =
          data.error;

      }

    } catch (e) {

      // Ignore JSON parsing errors.

    }


    throw new Error(
      errorMsg
    );
  }


  // --------------------------------------------------------
  // Convert response to PDF blob
  // --------------------------------------------------------

  const blob =
    await response.blob();


  const url =
    window.URL.createObjectURL(
      blob
    );


  const a =
    document.createElement(
      'a'
    );


  a.href = url;

  a.download =
    'fraudlens-scam-analysis-report.pdf';


  document.body.appendChild(a);

  a.click();

  a.remove();


  window.URL.revokeObjectURL(
    url
  );
}


// ============================================================
// FEEDBACK
// ============================================================

/**
 * POST /api/feedback
 *
 * Records whether the current ML prediction
 * was correct or wrong.
 *
 * Parameters:
 *
 * text
 *     Original message.
 *
 * feedback
 *     "correct" or "wrong".
 *
 * predictedLabel
 *     Actual ML classification:
 *
 *     0 = Not Scam
 *     1 = Scam
 *
 * riskScore
 *     Model risk score from 0-100.
 *
 * correctLabel
 *     Ground-truth label:
 *
 *     0 = Actually Not a Scam
 *     1 = Actually a Scam
 *
 * For a "correct" response,
 * correctLabel should equal predictedLabel.
 *
 * For a "wrong" response,
 * correctLabel is selected by the user.
 */
export async function submitFeedback({

  text,

  feedback,

  predictedLabel,

  riskScore,

  correctLabel

}) {

  // --------------------------------------------------------
  // Validate message
  // --------------------------------------------------------

  if (
    !text ||
    !text.trim()
  ) {

    throw new Error(
      "No message content available for feedback."
    );

  }


  // --------------------------------------------------------
  // Validate feedback
  // --------------------------------------------------------

  if (
    feedback !== 'correct' &&
    feedback !== 'wrong'
  ) {

    throw new Error(
      "Feedback must be 'correct' or 'wrong'."
    );

  }


  // --------------------------------------------------------
  // Validate prediction
  // --------------------------------------------------------

  if (
    predictedLabel !== 0 &&
    predictedLabel !== 1
  ) {

    throw new Error(
      "The backend did not provide a valid ML prediction. Please re-run the analysis."
    );

  }


  // --------------------------------------------------------
  // Validate correct label
  // --------------------------------------------------------

  if (
    correctLabel !== 0 &&
    correctLabel !== 1
  ) {

    throw new Error(
      "A valid correct classification is required."
    );

  }


  // --------------------------------------------------------
  // Send feedback
  // --------------------------------------------------------

  const response =
    await fetch(
      `/api/feedback`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          ...getAuthHeaders()
        },

        body: JSON.stringify({

          text:
            text.trim(),

          feedback,

          predicted_label:
            predictedLabel,

          risk_score:
            riskScore,

          correct_label:
            correctLabel

        }),

      }
    );


  return handleResponse(
    response
  );
}