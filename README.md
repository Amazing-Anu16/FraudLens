# FraudLens — Frontend

> *"See the red flags before you take the risk."*

FraudLens is an AI-powered scam and phishing detection web application. Users paste suspicious messages (SMS, WhatsApp, email, or UPI payment text) and receive an explainable risk diagnostic report featuring calibrated threat scores, detected red flags, plain-English explanations, and two-column safety action playbooks (DO NOT vs DO).

---

## 🚀 Tech Stack

- **Framework**: React 18 (Vite)
- **Styling**: Vanilla / Plain CSS (Custom Dark Cybersecurity Design System)
- **Typography**: Space Grotesk, Inter, JetBrains Mono
- **Deployment**: Vercel-ready

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

The frontend communicates with the backend via [`src/api.js`](file:///c:/Users/anupr/safeverify/src/api.js).

### Endpoints Covered:
1. **`POST /api/analyze`**
   - Request: `{ "text": "<pasted message>" }`
   - Response:
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

2. **`GET /api/history?limit=20`**
   - Response: Array of historical scan objects (`_id`, `text`, `risk_score`, `risk_level`, `scam_type`, `created_at`).

3. **`GET /api/stats`**
   - Response: `{ "total_scans": int, "high_risk": int, "top_category": string|null }`

### Connecting to the Live Flask Backend:
Create a `.env` file in the root directory:
```env
VITE_API_URL=https://your-flask-backend.onrender.com
```
When `VITE_API_URL` is set, `src/api.js` will automatically direct requests to the live backend endpoints. If unset or offline, it seamlessly falls back to the built-in intelligent mock engine.

---

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
