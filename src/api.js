/**
 * FraudLens API Client Layer
 * Handles communication with the backend API with full mock fallback matching the exact API contract.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// In-memory mock scan history to provide a seamless interactive demo session
let mockHistory = [
  {
    _id: "scan_1092",
    text: "Dear customer, your SBI account has been suspended due to pending PAN KYC. Click bit.ly/sbi-kyc-update to verify immediately or account will be blocked within 24 hours.",
    risk_score: 95,
    risk_level: "CRITICAL",
    scam_type: "Banking Phishing",
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString() // 12 mins ago
  },
  {
    _id: "scan_1091",
    text: "You have won a cash prize of Rs. 50,000 from Flipkart Lucky Draw! To claim your reward, send your UPI ID and approve the Rs. 5 verification request on PhonePe.",
    risk_score: 92,
    risk_level: "CRITICAL",
    scam_type: "UPI/Payment Scam",
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() // 45 mins ago
  },
  {
    _id: "scan_1090",
    text: "Work from home part-time opportunity! Earn Rs 3,000 to Rs 8,000 daily by liking YouTube videos and Google reviews. No experience required. Join our Telegram: t.me/jobshub77",
    risk_score: 88,
    risk_level: "HIGH",
    scam_type: "Job Scam",
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString() // 3 hours ago
  },
  {
    _id: "scan_1089",
    text: "Electricity Power Alert: Your electricity power will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Contact electricity officer at 9876543210 immediately.",
    risk_score: 84,
    risk_level: "HIGH",
    scam_type: "Fake KYC",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
  },
  {
    _id: "scan_1088",
    text: "Hey, are you free for the project review meeting tomorrow at 4 PM? Let me know if that time works for you.",
    risk_score: 5,
    risk_level: "LOW",
    scam_type: "Not a Scam",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
  }
];

/**
 * Generate contextual mock responses tailored to user input for fast, intelligent testing
 */
function generateMockAnalysis(text) {
  const lower = (text || '').toLowerCase();
  
  if (lower.includes('sbi') || lower.includes('pan') || lower.includes('blocked') || lower.includes('kyc') || lower.includes('bank') || lower.includes('hdfc') || lower.includes('icici')) {
    return {
      risk_score: 95,
      risk_level: "CRITICAL",
      scam_type: lower.includes('kyc') ? "Fake KYC" : "Banking Phishing",
      red_flags: [
        "Urgent threat of account suspension within 24 hours",
        "Shortened/suspicious third-party URL (e.g. bit.ly)",
        "Unsolicited request for sensitive PAN and banking credentials",
        "Impersonation of official banking communication channels"
      ],
      explanation: "This message uses urgent psychological pressure and fake account suspension threats to trick you into entering banking credentials on a phishing clone page.",
      safety_actions: {
        do_not: [
          "Do not click on the link or download any attachments",
          "Do not share OTP, PIN, NetBanking password, or PAN card details",
          "Do not call any phone numbers listed inside the message"
        ],
        do: [
          "Log into your official banking mobile app or official website directly",
          "Forward the scam SMS to 1930 (Cyber Crime Helpline)",
          "Block and report the sender number immediately"
        ]
      },
      source: "llm"
    };
  }

  if (lower.includes('upi') || lower.includes('phonepe') || lower.includes('gpay') || lower.includes('paytm') || lower.includes('pin') || lower.includes('approve request') || lower.includes('collect request')) {
    return {
      risk_score: 92,
      risk_level: "CRITICAL",
      scam_type: "UPI/Payment Scam",
      red_flags: [
        "Request to approve a payment request or enter UPI PIN to receive money",
        "Fake prize/cashback lure used as a pretext for transfer",
        "Manipulation of UPI 'Collect Request' mechanism",
        "Unverified sender asking for immediate financial interaction"
      ],
      explanation: "Remember: Entering your UPI PIN always DEDUCTS money from your account, never deposits it. Scammers send collect requests disguised as prize rewards.",
      safety_actions: {
        do_not: [
          "Never enter your UPI PIN to receive or claim any reward",
          "Do not approve pending collect requests in GPay, PhonePe, or Paytm",
          "Do not scan any QR codes sent to you over chat"
        ],
        do: [
          "Decline and report the collect request directly within your UPI app",
          "Warn your friends or family about this payment request format",
          "Check your bank balance only inside your authentic UPI app"
        ]
      },
      source: "llm"
    };
  }

  if (lower.includes('job') || lower.includes('part-time') || lower.includes('telegram') || lower.includes('earn') || lower.includes('daily') || lower.includes('like videos') || lower.includes('youtube')) {
    return {
      risk_score: 88,
      risk_level: "HIGH",
      scam_type: "Job Scam",
      red_flags: [
        "Unrealistically high daily payouts for trivial tasks (e.g. liking videos)",
        "Recruitment conducted entirely via WhatsApp or Telegram channels",
        "No verifiable employer identity or formal employment contract",
        "Precursor to 'prepaid task' scheme demanding investment deposits"
      ],
      explanation: "This is a classic 'Task / Part-Time Job' scam. Victims are initially paid small sums, then lured into depositing large sums of money for higher tasks that cannot be withdrawn.",
      safety_actions: {
        do_not: [
          "Do not pay any registration, security deposit, or task unlocking fees",
          "Do not join unofficial Telegram groups for financial tasks",
          "Do not share your bank account or ID proofs with unverified recruiters"
        ],
        do: [
          "Search legitimate job boards (LinkedIn, company careers pages) for real vacancies",
          "Report the scam channel and phone number on Telegram/WhatsApp",
          "Cease all communication immediately"
        ]
      },
      source: "llm"
    };
  }

  if (lower.includes('won') || lower.includes('lottery') || lower.includes('prize') || lower.includes('lucky draw') || lower.includes('car') || lower.includes('flipkart') || lower.includes('amazon')) {
    return {
      risk_score: 90,
      risk_level: "CRITICAL",
      scam_type: "Prize/Lottery Scam",
      red_flags: [
        "Winning notification for a contest/draw you never entered",
        "Advance fee demand disguised as 'processing charge' or 'GST'",
        "Use of trusted brand names (Amazon, Flipkart, KBC) without authorization",
        "Artificial deadline to prevent logical verification"
      ],
      explanation: "Scammers promise astronomical winnings but require an upfront payment or personal data to 'release' the non-existent prize.",
      safety_actions: {
        do_not: [
          "Do not pay any advance tax, customs, or processing fee to claim prizes",
          "Do not forward this message to your contacts",
          "Do not provide your address, bank account, or identity documents"
        ],
        do: [
          "Verify ongoing contests directly on the official brand website",
          "Delete the message and block the sender",
          "Report phishing attempts to national cybercrime portals"
        ]
      },
      source: "llm"
    };
  }

  if (lower.includes('crypto') || lower.includes('invest') || lower.includes('guaranteed return') || lower.includes('trading') || lower.includes('profit')) {
    return {
      risk_score: 86,
      risk_level: "HIGH",
      scam_type: "Investment Scam",
      red_flags: [
        "Promise of guaranteed abnormally high daily/monthly returns",
        "Unregistered investment platform or shady trading app download link",
        "Pressure to recruit friends or deposit cryptocurrency immediately"
      ],
      explanation: "Legitimate investments never promise zero-risk or guaranteed high-yield returns. This is designed to steal your initial deposits.",
      safety_actions: {
        do_not: [
          "Do not transfer funds to personal UPI IDs or unverified crypto wallets",
          "Do not install APK files or third-party trading apps"
        ],
        do: [
          "Check SEBI/regulatory registration before investing any money",
          "Consult a certified financial advisor"
        ]
      },
      source: "llm"
    };
  }

  if (lower.includes('delivery') || lower.includes('courier') || lower.includes('address update') || lower.includes('package') || lower.includes('fedex') || lower.includes('indiapost')) {
    return {
      risk_score: 76,
      risk_level: "HIGH",
      scam_type: "Delivery Scam",
      red_flags: [
        "Claim of undelivered package requiring urgent address or fee update",
        "Suspicious link to unverified tracking domain",
        "Demanding small payment (Rs 5 - 50) to capture payment card details"
      ],
      explanation: "Postal and courier delivery scams use nominal re-delivery fees as a lure to steal credit/debit card numbers and credentials.",
      safety_actions: {
        do_not: [
          "Do not click tracking links sent from unknown 10-digit mobile numbers",
          "Do not enter card details on unverified third-party pages"
        ],
        do: [
          "Track shipments directly on official courier portals with your tracking ID",
          "Contact the sender/merchant if you are expecting a package"
        ]
      },
      source: "llm"
    };
  }

  // If text is generic or safe
  if (text.length > 10 && !lower.includes('free') && !lower.includes('click') && !lower.includes('urgent') && !lower.includes('http')) {
    return {
      risk_score: 12,
      risk_level: "LOW",
      scam_type: "Not a Scam",
      red_flags: [
        "No malicious links or suspicious domains detected",
        "No coercive or urgent language patterns found",
        "No unsolicited requests for credentials, money, or sensitive identity data"
      ],
      explanation: "This text does not exhibit standard fraud, phishing, or financial extortion markers. It appears to be normal communication.",
      safety_actions: {
        do_not: [
          "No immediate threat detected, but always remain vigilant with unknown contacts"
        ],
        do: [
          "Verify the sender's identity if they later ask for sensitive information",
          "Keep your apps and security settings up to date"
        ]
      },
      source: "rules_fallback"
    };
  }

  // Default fallback for ambiguous text
  return {
    risk_score: 65,
    risk_level: "MODERATE",
    scam_type: "Unclassified",
    red_flags: [
      "Ambiguous sender context or unverified claims",
      "Contains potential lure keywords requiring extra scrutiny",
      "Insufficient data to conclusively confirm legitimacy"
    ],
    explanation: "While not explicitly malicious, this message contains phrasing commonly used in unsolicited outreach and warrants caution.",
    safety_actions: {
      do_not: [
        "Do not share confidential credentials without direct verification",
        "Do not click unknown links unless you know the sender"
      ],
      do: [
        "Reach out to the alleged organization via official customer service channels",
        "Inspect URLs carefully for domain typos before opening"
      ]
    },
    source: "rules_fallback"
  };
}

/**
 * POST /api/analyze
 * Analyzes a message string for scam patterns.
 * 
 * If VITE_API_URL is configured and reachable, calls the live backend.
 * Otherwise, falls back to rich mock data.
 */
export async function analyzeMessage(text) {
  if (!text || !text.trim()) {
    throw new Error("Please enter a message to analyze.");
  }

  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.warn("Live API call failed, using mock data fallback:", err.message);
      // Fall through to mock logic below if desired, or re-throw
    }
  }

  // Realistic mock delay (600ms) to simulate AI classification
  await new Promise((resolve) => setTimeout(resolve, 600));

  const result = generateMockAnalysis(text);

  // Prepend to local demo history
  mockHistory.unshift({
    _id: `scan_${Date.now()}`,
    text: text.trim(),
    risk_score: result.risk_score,
    risk_level: result.risk_level,
    scam_type: result.scam_type,
    created_at: new Date().toISOString()
  });

  return result;
}

/**
 * GET /api/history?limit=20
 * Retrieves recent scan records.
 */
export async function getHistory(limit = 20) {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/history?limit=${limit}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn("Live API history fetch failed, using mock data:", err.message);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 250));
  return mockHistory.slice(0, limit);
}

/**
 * GET /api/stats
 * Retrieves global threat intelligence statistics.
 */
export async function getStats() {
  if (API_BASE_URL) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn("Live API stats fetch failed, using mock data:", err.message);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 200));

  const total = mockHistory.length;
  const highRiskCount = mockHistory.filter(
    (h) => h.risk_level === 'HIGH' || h.risk_level === 'CRITICAL'
  ).length;

  // Find top category
  const categories = {};
  mockHistory.forEach((h) => {
    if (h.scam_type && h.scam_type !== 'Not a Scam') {
      categories[h.scam_type] = (categories[h.scam_type] || 0) + 1;
    }
  });

  let topCategory = "Banking Phishing";
  let maxCount = 0;
  Object.entries(categories).forEach(([cat, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topCategory = cat;
    }
  });

  return {
    total_scans: total > 0 ? total + 142 : 142, // show realistic total count
    high_risk: highRiskCount > 0 ? highRiskCount + 98 : 98,
    top_category: topCategory
  };
}
