# FraudLens

> *"See the red flags before you take the risk."*

FraudLens is an AI-powered scam and phishing detection web application. Users paste suspicious messages (SMS, WhatsApp, email, or UPI payment text) and receive an explainable risk diagnostic report featuring calibrated threat scores, detected red flags, plain-English explanations, and two-column safety action playbooks (DO NOT vs DO).

---
### 🌐 Live Website
[FraudLens](https://safeverify-frontend.vercel.app/)

---

## 🛠️ Tech Stack

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=flat&logo=vite&logoColor=FFD62E)
![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=flat&logo=googlegemini&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

### Frontend
| Technology | Purpose |
|---|---|
| **React** | Component-based UI (`App.jsx`, `Navbar.jsx`, `ErrorBanner.jsx`, `ExampleChips.jsx`) |
| **Vite** | Dev server & build tool |
| **CSS** | Styling (no framework — custom stylesheet) |
| **npm** | Package management |

### Backend
| Technology | Purpose |
|---|---|
| **Python** | Core backend language |
| **Flask** | REST API framework (`/api/analyze`, `/api/history`, `/api/stats`) |
| **Flask-CORS** | Cross-origin request handling between frontend and API |
| **Gunicorn** | Production WSGI server |
| **python-dotenv** | Environment variable management (`.env`) |

### AI / Machine Learning
| Technology | Purpose |
|---|---|
| **Google Gemini API** (`google-genai`, model `gemini-3.5-flash`) | Primary scam/phishing risk analysis which returns structured risk score, category, red flags, and safety guidance |
| **Custom rule-based engine** (regex heuristics, in `engine.py`) | Offline fallback analyzer that activates automatically if the Gemini API is unavailable or fails, so the app degrades gracefully instead of breaking |

### Database
| Technology | Purpose |
|---|---|
| **MongoDB** (via `pymongo`) | Stores every scan (`fraudlens.scans` collection), powers scan history and aggregate stats (total scans, high-risk count, top scam category) |

### Deployment
| Technology | Purpose |
|---|---|
| **Vercel** | Frontend hosting (`vercel.json`) |

### Tooling
| Technology | Purpose |
|---|---|
| **Git & GitHub** | Version control |

---

### Architecture Overview

```
┌─────────────┐      REST API       ┌──────────────┐      ┌──────────────┐
│   React     │ ──────────────────► │    Flask     │ ───► │  Google      │
│  (Vite)     │ ◄────────────────── │   Backend    │      │  Gemini API  │
└─────────────┘     JSON responses  └──────┬───────┘      └──────────────┘
                                            │
                                            │  (fallback if Gemini fails)
                                            ▼
                                     ┌──────────────┐      ┌──────────────┐
                                     │  Rule-based  │      │   MongoDB    │
                                     │   Engine     │      │  (scans DB)  │
                                     └──────────────┘      └──────────────┘
```

**How it works:** the frontend sends message text to `/api/analyze`. The Flask backend calls the Gemini API first for AI-driven risk scoring; if that call fails or the API key is missing, it automatically falls back to a regex-based rule engine so the feature never fully breaks. Every result is logged to MongoDB, which also powers the `/api/history` and `/api/stats` endpoints for dashboard views.

---

## 🛠️ Project Structure

```text
src/
  ├── components/
  │   ├── Navbar.jsx          # Header with glowing shield logo, status pill & nav links
  │   ├── ExampleChips.jsx    # Quick-test prefill samples for live demoing
  │   ├── ScoreGauge.jsx      # Animated circular SVG risk meter (0-100) with JetBrains Mono counter
  │   ├── RiskBadge.jsx       # Threat level pill badge (LOW, MODERATE, HIGH, CRITICAL)
  │   ├── RedFlagList.jsx     # Detected warning signs with alert icons
  │   ├── SafetyActions.jsx   # Two-column layout (DO NOT vs RECOMMENDED ACTIONS DO)
  │   ├── StatCard.jsx        # Metric display cards for Dashboard
  │   └── ErrorBanner.jsx     # Inline alert toast for error handling
  ├── pages/
  │   ├── Analyze.jsx         # Priority 1: Message input, chips, clear action, loading spinner
  │   ├── Results.jsx         # Priority 2: Explainable threat assessment report
  │   ├── Landing.jsx         # Priority 3: Hero section + 3 feature highlight cards
  │   └── Dashboard.jsx       # Priority 4: Threat stats and recent scan logs
  ├── api.js                  # API client layer with mock fallbacks & VITE_API_URL integration
  ├── App.jsx                 # Main application shell and state routing
  ├── main.jsx                # Application root
  └── index.css               # Full cybersecurity dark-mode design system
```

---
## 🔌 API Contract & Backend Integration

The frontend communicates with the backend via [`src/api.js`](src/api.js).

### Endpoint Summary

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Submits message text for AI-powered scam risk analysis |
| `GET` | `/api/history?limit=20` | Retrieves recent scan history, newest first |
| `GET` | `/api/stats` | Retrieves aggregate scan statistics |

All requests/responses use `Content-Type: application/json`.

---

### `POST /api/analyze`

**Request body:**
```json
{ "text": "<pasted message>" }
```

**Success response — `200 OK`:**
```json
{
  "risk_score": 95,
  "risk_level": "CRITICAL",
  "scam_type": "Banking Phishing",
  "red_flags": [
    "Urgent threat of account suspension within 24 hours",
    "Shortened suspicious URL (bit.ly)",
    "Unsolicited request for sensitive PAN and banking credentials"
  ],
  "explanation": "This message uses urgent psychological pressure and fake account suspension threats...",
  "safety_actions": {
    "do_not": ["Do not click on the link or download any attachments"],
    "do": ["Log into your official banking mobile app directly"]
  },
  "source": "llm"
}
```

> `source` will be `"llm"` when Gemini successfully analyzed the message, or `"rules_fallback"` if Gemini was unavailable and the backend's offline rule-based engine handled it instead — the response shape stays identical either way, so the frontend doesn't need to handle these cases differently.

**Error responses:**

| Status | Condition | Body |
|---|---|---|
| `400` | `text` field missing from request body | `{ "error": "Missing 'text' in request body" }` |
| `400` | `text` field is empty/whitespace-only | `{ "error": "Text cannot be empty" }` |
| `500` | Unexpected server-side failure | `{ "error": "Internal server error" }` |

---

### `GET /api/history?limit=20`

Optional query parameter `limit` (integer, default `20`) caps the number of results returned.

**Success response — `200 OK`:**
```json
[
  {
    "_id": "665f1a2b3c4d5e6f7a8b9c0d",
    "text": "URGENT: Your bank account is suspended...",
    "risk_score": 95,
    "risk_level": "CRITICAL",
    "scam_type": "Banking Phishing",
    "created_at": "2026-08-30T12:34:56.000Z"
  }
]
```

Returns an empty array (`[]`) if the database is unavailable, rather than an error — the UI can render an empty state safely.

---

### `GET /api/stats`

**Success response — `200 OK`:**
```json
{
  "total_scans": 142,
  "high_risk": 37,
  "top_category": "Banking Phishing"
}
```

`top_category` is `null` if there isn't enough data yet, or if no scan has been classified beyond "Not a Scam"/"Unclassified".

---

### Connecting to the Live Flask Backend

Create a `.env` file in the project root:

```env
VITE_API_URL= https://fraudlens-backend-uynu.onrender.com
```

When `VITE_API_URL` is set, `src/api.js` directs all requests above to that live backend. *(If your app also supports an offline/mock mode when this variable is unset, document that behavior here explicitly, including what data the mock returns — this keeps the contract accurate for anyone integrating without a live backend.)*

## 💻 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run dev server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```
