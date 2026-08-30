import os
import json
import re
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv(override=True)
def get_risk_level(score):
    """Maps a risk score to a risk level category."""
    if score <= 30:
        return "LOW"
    elif score <= 60:
        return "MODERATE"
    elif score <= 85:
        return "HIGH"
    else:
        return "CRITICAL"


def analyze(message):
    """
    Analyzes a message using Gemini. Falls back to rule-based engine
    if the API fails, times out, or returns invalid JSON.
    """
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("Warning: GEMINI_API_KEY not set. Using fallback rules.")
            return _rules_fallback(message)

        client = genai.Client(api_key=api_key)

        prompt = f"""
        You are a highly advanced scam detection AI. Analyze the following user message to determine if it is a scam, phishing attempt, or malicious.
        Categories to detect: urgency/threat language, OTP/PIN/credential requests, payment/UPI requests, suspicious URLs, reward/lottery language, impersonation of banks/companies/govt.
        A normal benign message (e.g. a real OTP notice that does NOT ask the user to share it) should score LOW, not high.
        
        Output MUST be valid JSON matching this exact structure, with no extra text or markdown formatting:
        {{
          "risk_score": <number 0-100>,
          "risk_level": "<LOW | MODERATE | HIGH | CRITICAL>",
          "scam_type": "<e.g. Banking Phishing, UPI/Payment Scam, Job Scam, Fake KYC, Prize/Lottery Scam, Investment Scam, Delivery Scam, Not a Scam, Unclassified>",
          "red_flags": ["<3-6 short strings specific to the text, NEVER generic>"],
          "explanation": "<1-2 sentence string referencing concrete details from the message>",
          "safety_actions": {{
            "do_not": ["<strings>"],
            "do": ["<strings>"]
          }},
          "source": "llm"
        }}
        
        User Message to Analyze:
        '''{message}'''
        """

        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )

        # Parse the JSON response
        data = json.loads(response.text)

        # Validate and clamp score to 0-100
        score = max(0, min(100, int(data.get("risk_score", 0))))
        data["risk_score"] = score

        # Ensure risk_level exactly matches the score thresholds
        data["risk_level"] = get_risk_level(score)

        # Ensure all required fields are present with sensible defaults if missing
        data["scam_type"] = data.get("scam_type", "Unclassified")
        data["red_flags"] = data.get("red_flags", [])
        data["explanation"] = data.get("explanation", "No explanation provided.")
        data["safety_actions"] = data.get("safety_actions", {"do": [], "do_not": []})
        data["source"] = "llm"

        return data

    except Exception as e:
        import traceback
        print("========== GEMINI ERROR ==========")
        print(e)
        traceback.print_exc()
        print("==================================")
        return _rules_fallback(message)


def _rules_fallback(message):
    """
    Rule-based fallback engine that activates if the Gemini call fails.
    """
    message_lower = message.lower()
    score = 0
    flags = []

    # Simple heuristic rules
    if re.search(r'\b(urgent|immediate|suspend|block|blocked)\b', message_lower):
        score += 30
        flags.append("Urgency or threat language detected")

    if re.search(r'\b(otp|pin|password|cvv)\b', message_lower):
        score += 40
        flags.append("Requests sensitive credentials (OTP/PIN)")

    if re.search(r'\b(pay|upi|transfer|money|cashback|lottery|prize|won|winning)\b', message_lower):
        score += 30
        flags.append("Payment, UPI, or reward related language")

    if re.search(r'(http://|https://|www\.|bit\.ly|t\.co)', message_lower):
        score += 20
        flags.append("Contains a suspicious link/URL")

    if re.search(r'\b(bank|account|kyc|amazon|flipkart|jio)\b', message_lower):
        score += 15
        flags.append("Mentions banks or large companies (potential impersonation)")

    # Clamp score
    score = max(0, min(100, score))

    # Determine scam type based on score
    scam_type = "Unclassified"
    if score >= 60:
        scam_type = "Potential Phishing/Scam"
    elif score <= 30:
        scam_type = "Not a Scam"

    return {
        "risk_score": score,
        "risk_level": get_risk_level(score),
        "scam_type": scam_type,
        "red_flags": flags,
        "explanation": "Analyzed using offline fallback rules due to system overload.",
        "safety_actions": {
            "do_not": ["Click any links or share OTPs"] if score > 30 else [],
            "do": ["Verify the sender independently"]
        },
        "source": "rules_fallback"
    }