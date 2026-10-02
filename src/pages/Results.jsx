import React, { useState } from 'react';
import ScoreGauge from '../components/ScoreGauge';
import RiskBadge from '../components/RiskBadge';
import RedFlagList from '../components/RedFlagList';
import SafetyActions from '../components/SafetyActions';
import ErrorBanner from '../components/ErrorBanner';
import { downloadReport, submitFeedback } from '../api';

/**
 * Results Page
 *
 * Displays:
 * - Scam risk score
 * - Risk level
 * - Scam type
 * - Red flags
 * - Context-specific safety recommendations
 * - Downloadable scam analysis report
 * - User prediction feedback
 */
export default function Results({
  analysisData,
  originalText,
  onScanAgain,
  onAuthError
}) {

  const [copied, setCopied] = useState(false);

  const [isDownloading, setIsDownloading] =
    useState(false);

  const [downloaded, setDownloaded] =
    useState(false);

  const [downloadError, setDownloadError] =
    useState(null);

  // -------------------------------------------------------
  // Feedback state
  // -------------------------------------------------------

  const [feedbackStatus, setFeedbackStatus] =
    useState(null);

  const [feedbackError, setFeedbackError] =
    useState(null);

  const [showCorrection, setShowCorrection] =
    useState(false);

  const [isSubmittingFeedback, setIsSubmittingFeedback] =
    useState(false);


  // -------------------------------------------------------
  // No analysis data
  // -------------------------------------------------------

  if (!analysisData) {

    return (
      <div
        className="results-page"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '4rem 2rem'
        }}
      >

        <h2
          style={{
            marginBottom: '1rem'
          }}
        >
          No Analysis Data Available
        </h2>

        <p
          style={{
            color: 'var(--text-secondary)',
            marginBottom: '2rem'
          }}
        >
          Please scan a message first to see
          the analysis results.
        </p>

        <button
          className="btn btn-primary"
          onClick={onScanAgain}
        >
          Go Back
        </button>

      </div>
    );
  }


  // -------------------------------------------------------
  // Analysis data
  // -------------------------------------------------------

  const data = analysisData;

  const messageText =
    originalText ||
    data.raw_text ||
    data.text ||
    '';


  // -------------------------------------------------------
  // Copy summary
  // -------------------------------------------------------

  const handleCopySummary = () => {

    const textToCopy =
      `FraudLens Threat Report:
Risk Score: ${data.risk_score}/100 (${data.risk_level})
Scam Type: ${data.scam_type}
Why: ${data.explanation}
Source: FraudLens AI`;

    navigator.clipboard.writeText(
      textToCopy
    );

    setCopied(true);

    setTimeout(
      () => setCopied(false),
      2000
    );
  };


  // -------------------------------------------------------
  // Submit feedback
  // -------------------------------------------------------

  const handleFeedback = async (
    feedback,
    correctLabel = null
  ) => {

    // -----------------------------------------------------
    // If user clicked Wrong, ask for actual classification
    // -----------------------------------------------------

    if (
      feedback === 'wrong' &&
      correctLabel === null
    ) {

      setShowCorrection(true);

      return;
    }


    setIsSubmittingFeedback(true);

    setFeedbackError(null);


    try {

      const response =
        await submitFeedback({

          text: messageText,

          feedback,

          /*
           * IMPORTANT:
           *
           * Use the actual ML prediction returned
           * by backend.
           *
           * 0 = Not Scam
           * 1 = Scam
           */
          predictedLabel:
            data.prediction,

          riskScore:
            data.risk_score,

          /*
           * For:
           *
           * Correct:
           * correctLabel = predictedLabel
           *
           * Wrong:
           * correctLabel = user's selected
           * actual classification
           */
          correctLabel

        });


      setFeedbackStatus(
        feedback
      );

      setShowCorrection(false);


      // ---------------------------------------------------
      // Show that the feedback model was retrained
      // ---------------------------------------------------

      if (
        response?.model_training?.trained
      ) {

        setFeedbackStatus(
          `${feedback}-trained`
        );

      }

    } catch (err) {

      if (
        err.status === 401 &&
        onAuthError
      ) {

        onAuthError(err);

      } else {

        setFeedbackError(
          err.message ||
          'Could not submit feedback.'
        );

      }

    } finally {

      setIsSubmittingFeedback(
        false
      );

    }
  };


  // -------------------------------------------------------
  // Download report
  // -------------------------------------------------------

  const handleDownloadReport = async () => {

    if (!messageText) {

      setDownloadError(
        "No message content available to generate a report."
      );

      return;
    }


    setIsDownloading(true);

    setDownloadError(null);


    try {

      await downloadReport(
        messageText
      );

      setDownloaded(true);

      setTimeout(
        () => setDownloaded(false),
        3000
      );

    } catch (err) {

      if (
        err.status === 401 &&
        onAuthError
      ) {

        onAuthError(err);

      } else {

        setDownloadError(
          err.message ||
          "Failed to download scam analysis report."
        );

      }

    } finally {

      setIsDownloading(false);

    }
  };


  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  return (

    <div className="results-page">

      {/* Download error */}

      {downloadError && (

        <ErrorBanner
          message={downloadError}
          onDismiss={() =>
            setDownloadError(null)
          }
        />

      )}


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="results-header">

        <div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem',
              flexWrap: 'wrap'
            }}
          >

            {/* Scam type */}

            <span className="scam-pill">

              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--teal-primary)"
                strokeWidth="2.5"
              >

                <circle
                  cx="12"
                  cy="12"
                  r="10"
                />

                <line
                  x1="12"
                  y1="16"
                  x2="12"
                />

                <line
                  x1="12"
                  y1="8"
                  x2="12.01"
                  y2="8"
                />

              </svg>

              {data.scam_type ||
                'Unclassified Threat'}

            </span>


            {/* Risk badge */}

            <RiskBadge
              level={data.risk_level}
            />


            {/* Backend source */}

            <span className="backend-pill">

              <span className="backend-dot" />

              Source: {
                data.source || 'llm'
              }

            </span>

          </div>


          <h1
            className="page-title"
            style={{
              fontSize: '1.85rem'
            }}
          >
            Threat Assessment Report
          </h1>

        </div>


        {/* Header actions */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}
        >

          {/* Download report */}

          <button
            id="download-report-header-btn"
            className="btn btn-download"
            onClick={handleDownloadReport}
            disabled={isDownloading}
            title="Download full PDF scam analysis report"
          >

            {isDownloading ? (

              <>

                <span className="spinner-teal" />

                Generating PDF...

              </>

            ) : downloaded ? (

              <>

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >

                  <polyline
                    points="20 6 9 17 4 12"
                  />

                </svg>

                Report Downloaded

              </>

            ) : (

              <>

                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >

                  <path
                    d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                  />

                  <polyline
                    points="7 10 12 15 17 10"
                  />

                  <line
                    x1="12"
                    y1="15"
                    x2="12"
                    y2="3"
                  />

                </svg>

                Download PDF Report

              </>

            )}

          </button>


          {/* Scan another */}

          <button
            className="btn btn-secondary"
            onClick={onScanAgain}
          >

            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >

              <polyline
                points="1 4 1 10 7 10"
              />

              <path
                d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
              />

            </svg>

            Scan Another Message

          </button>

        </div>

      </div>


      {/* =================================================
          SCORE + EXPLANATION
      ================================================= */}

      <div className="results-grid">

        {/* Risk score */}

        <div className="card overview-card">

          <ScoreGauge
            score={data.risk_score}
            riskLevel={data.risk_level}
          />

          <div
            style={{
              textAlign: 'center'
            }}
          >

            <p
              style={{
                color:
                  'var(--text-secondary)',
                fontSize: '0.9rem'
              }}
            >
              Calibrated Scam Probability
            </p>

          </div>

        </div>


        {/* Explanation */}

        <div className="card explanation-card">

          <div>

            <div className="explanation-title">

              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >

                <circle
                  cx="12"
                  cy="12"
                  r="10"
                />

                <line
                  x1="12"
                  y1="16"
                  x2="12"
                />

                <line
                  x1="12"
                  y1="8"
                  x2="12.01"
                  y2="8"
                />

              </svg>

              Why This Matters

            </div>


            <p className="explanation-text">

              {data.explanation}

            </p>

          </div>


          {/* Message snippet */}

          {messageText && (

            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop:
                  '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >

              <span
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600
                }}
              >
                Analyzed Message Snippet:
              </span>


              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.3rem',
                  fontStyle: 'italic'
                }}
              >

                "{messageText.length > 180
                  ? messageText.slice(0, 180) + '...'
                  : messageText}"

              </p>

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          RED FLAGS
      ================================================= */}

      <RedFlagList
        flags={data.red_flags}
      />


      {/* =================================================
          SAFETY RECOMMENDATIONS
      ================================================= */}

      <SafetyActions
        safetyActions={
          data.safety_actions
        }
        scamType={
          data.scam_type
        }
        riskLevel={
          data.risk_level
        }
      />


      {/* =================================================
          PREDICTION FEEDBACK
      ================================================= */}

      <div
        className="card"
        style={{
          marginTop: '1.25rem',
          padding: '1.25rem'
        }}
      >

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >

          <div>

            <h3
              style={{
                margin: 0
              }}
            >
              Was this prediction correct?
            </h3>


            <p
              style={{
                color:
                  'var(--text-secondary)',
                margin:
                  '0.35rem 0 0',
                fontSize:
                  '0.9rem'
              }}
            >
              Your feedback helps improve
              future scam predictions.
            </p>

          </div>


          {/* Correct / Wrong */}

          {!feedbackStatus && (

            <div
              style={{
                display: 'flex',
                gap: '0.6rem',
                flexWrap: 'wrap'
              }}
            >

              {/* Correct */}

              <button
                className="btn btn-primary"

                onClick={() =>
                  handleFeedback(
                    'correct',

                    /*
                     * IMPORTANT:
                     * Use actual ML prediction.
                     *
                     * Do NOT calculate this from
                     * risk_score.
                     */
                    data.prediction
                  )
                }

                disabled={
                  isSubmittingFeedback
                }
              >

                ✓ Correct

              </button>


              {/* Wrong */}

              <button
                className="btn btn-secondary"

                onClick={() =>
                  handleFeedback(
                    'wrong'
                  )
                }

                disabled={
                  isSubmittingFeedback
                }
              >

                ✕ Wrong

              </button>

            </div>

          )}

        </div>


        {/* =================================================
            CORRECTION OPTIONS
        ================================================= */}

        {showCorrection &&
          !feedbackStatus && (

            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                borderRadius: '10px',
                background:
                  'rgba(255,255,255,0.04)'
              }}
            >

              <p
                style={{
                  marginTop: 0,
                  color:
                    'var(--text-secondary)'
                }}
              >
                What was the correct
                classification?
              </p>


              <div
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  flexWrap: 'wrap'
                }}
              >

                {/* Actually scam */}

                <button
                  className="btn btn-primary"

                  onClick={() =>
                    handleFeedback(
                      'wrong',
                      1
                    )
                  }

                  disabled={
                    isSubmittingFeedback
                  }
                >

                  Actually a Scam

                </button>


                {/* Actually not scam */}

                <button
                  className="btn btn-secondary"

                  onClick={() =>
                    handleFeedback(
                      'wrong',
                      0
                    )
                  }

                  disabled={
                    isSubmittingFeedback
                  }
                >

                  Actually Not a Scam

                </button>

              </div>

            </div>

          )}


        {/* =================================================
            FEEDBACK SUCCESS
        ================================================= */}

        {feedbackStatus && (

          <p
            style={{
              color:
                'var(--teal-primary)',
              marginBottom: 0,
              marginTop: '0.9rem'
            }}
          >

            ✓ Feedback recorded.
            Thank you for helping improve
            FraudLens.

          </p>

        )}


        {/* =================================================
            FEEDBACK ERROR
        ================================================= */}

        {feedbackError && (

          <p
            style={{
              color: '#ff8a8a',
              marginBottom: 0,
              marginTop: '0.9rem'
            }}
          >

            {feedbackError}

          </p>

        )}

      </div>


      {/* =================================================
          FOOTER ACTIONS
      ================================================= */}

      <div className="results-footer-actions">

        {/* Download */}

        <button
          id="download-report-btn"
          className="btn btn-download"
          onClick={handleDownloadReport}
          disabled={isDownloading}
        >

          {isDownloading ? (

            <>

              <span className="spinner-teal" />

              Generating Report...

            </>

          ) : downloaded ? (

            <>

              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >

                <polyline
                  points="20 6 9 17 4 12"
                />

              </svg>

              Report Downloaded!

            </>

          ) : (

            <>

              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >

                <path
                  d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                />

                <polyline
                  points="7 10 12 15 17 10"
                />

                <line
                  x1="12"
                  y1="15"
                  x2="12"
                  y2="3"
                />

              </svg>

              Download Scam Analysis Report

            </>

          )}

        </button>


        {/* Scan again */}

        <button
          id="scan-again-btn"
          className="btn btn-primary"
          onClick={onScanAgain}
        >

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >

            <polyline
              points="23 4 23 10 17 10"
            />

            <path
              d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"
            />

          </svg>

          Scan Another Message

        </button>


        {/* Copy */}

        <button
          className="btn btn-secondary"
          onClick={handleCopySummary}
        >

          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >

            <rect
              x="9"
              y="9"
              width="13"
              height="13"
              rx="2"
            />

            <path
              d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            />

          </svg>

          {copied
            ? 'Summary Copied!'
            : 'Copy Threat Summary'}

        </button>

      </div>

    </div>
  );
}