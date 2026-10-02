import os
import re
import joblib


# ---------------------------------------------------------
# Load ML model
# ---------------------------------------------------------

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_DIR = os.path.join(BASE_DIR, "ml", "models")

TFIDF_PATH = os.path.join(
    MODEL_DIR,
    "tfidf_vectorizer_v2.pkl"
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "calibrated_svm_v2.pkl"
)


tfidf_vectorizer_v2 = joblib.load(TFIDF_PATH)
calibrated_svm_v2 = joblib.load(MODEL_PATH)


# ---------------------------------------------------------
# Risk level
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# Scam type
# ---------------------------------------------------------

def detect_scam_type(prediction, message):
    """
    Provides a more specific scam category when scam-related
    language is present in the message. The ML prediction still
    determines whether the message is classified as a scam.
    """

    if prediction == 0:
        return "Not a Scam"

    message_lower = message.lower()

    patterns = [
        (
            r"\b(prize|won|winner|lottery|reward|cashback|gift|voucher|free)\b",
            "Reward / Prize Scam"
        ),
        (
            r"\b(otp|one[- ]time password|pin|cvv|password|verification code|login|account details)\b",
            "Credential / Account Scam"
        ),
        (
            r"\b(upi|payment|pay|transfer|send money|refund|cash|bank)\b",
            "Payment / Banking Scam"
        ),
        (
            r"\b(job|vacancy|hiring|salary|work from home|employment|recruiter)\b",
            "Job / Employment Scam"
        ),
        (
            r"\b(delivery|parcel|package|courier|shipment|customs)\b",
            "Delivery / Parcel Scam"
        ),
        (
            r"\b(invest|investment|trading|crypto|bitcoin|profit|returns)\b",
            "Investment Scam"
        ),
        (
            r"\b(refund|tax|income tax|itr|penalty|fine)\b",
            "Refund / Tax Scam"
        ),
        (
            r"\b(virus|malware|technical support|tech support|computer|remote access)\b",
            "Tech Support Scam"
        ),
        (
            r"\b(expire|suspend|suspended|blocked|deactivate|deactivated|verify your account)\b",
            "Account Suspension Scam"
        ),
    ]

    for pattern, category in patterns:
        if re.search(pattern, message_lower):
            return category

    return "Scam"


# ---------------------------------------------------------
# Context-specific safety recommendations
# ---------------------------------------------------------

def get_safety_recommendations(message, prediction, score):
    """
    Generates safety recommendations based on the actual scam
    context detected in the message. Strong recommendations are
    activated when the risk score is above 40.
    """

    message_lower = message.lower()

    if prediction == 0 or score is None or score <= 40:
        return {
            "do_not": [],
            "do": [
                "Verify unexpected requests through an official source before taking action"
            ]
        }

    do_not = []
    do_actions = []

    # Reward / prize / cashback
    if re.search(r"\b(prize|won|winner|lottery|reward|cashback|gift|voucher|free)\b", message_lower):
        do_not.extend([
            "Do not click the reward or prize link",
            "Do not pay a fee to claim a reward",
            "Do not share OTP, UPI PIN, card details, or bank information to receive a prize"
        ])
        do_actions.extend([
            "Verify the offer directly through the company's official website or app",
            "If you did not enter a contest, treat the reward claim as suspicious"
        ])

    # Banking / credentials
    if re.search(r"\b(otp|one[- ]time password|pin|cvv|password|verification code|login|account details)\b", message_lower):
        do_not.extend([
            "Do not share OTP, PIN, CVV, password, or verification codes",
            "Do not enter banking credentials through a message link"
        ])
        do_actions.extend([
            "Open your bank's official app or website manually",
            "Contact the bank using the phone number on its official website or card"
        ])

    # Payment / UPI
    if re.search(r"\b(upi|payment|pay|transfer|send money|refund|cash|bank)\b", message_lower):
        do_not.extend([
            "Do not send money or approve an unexpected payment request",
            "Do not scan an unknown QR code or enter your UPI PIN to receive money"
        ])
        do_actions.extend([
            "Verify the payment request with the person or organization using a trusted channel",
            "Review the recipient name and transaction details before approving any payment"
        ])

    # Job scam
    if re.search(r"\b(job|vacancy|hiring|salary|work from home|employment|recruiter)\b", message_lower):
        do_not.extend([
            "Do not pay registration, training, security, or interview fees",
            "Do not share identity or bank documents with an unverified recruiter"
        ])
        do_actions.extend([
            "Verify the vacancy on the employer's official careers page",
            "Confirm recruiter contact details through the company's official website"
        ])

    # Delivery / parcel scam
    if re.search(r"\b(delivery|parcel|package|courier|shipment|customs)\b", message_lower):
        do_not.extend([
            "Do not click an unexpected parcel-tracking or customs payment link",
            "Do not pay additional delivery fees through an unverified link"
        ])
        do_actions.extend([
            "Track the shipment using the courier's official website or app",
            "Contact the courier through its official customer-support channel"
        ])

    # Investment scam
    if re.search(r"\b(invest|investment|trading|crypto|bitcoin|profit|returns)\b", message_lower):
        do_not.extend([
            "Do not transfer money based on guaranteed-profit claims",
            "Do not share trading, wallet, or banking credentials with an unknown person"
        ])
        do_actions.extend([
            "Verify the investment platform and company independently",
            "Check regulatory registration before investing"
        ])

    # Refund / tax scam
    if re.search(r"\b(refund|tax|income tax|itr|penalty|fine)\b", message_lower):
        do_not.extend([
            "Do not click links claiming to release a refund or avoid a penalty",
            "Do not provide card, bank, or tax-account credentials through the message"
        ])
        do_actions.extend([
            "Check your refund or tax status through the official government portal",
            "Contact the relevant authority through its official contact details"
        ])

    # Tech support scam
    if re.search(r"\b(virus|malware|technical support|tech support|computer|remote access)\b", message_lower):
        do_not.extend([
            "Do not install remote-access software at an unknown person's request",
            "Do not give an unknown caller control of your computer"
        ])
        do_actions.extend([
            "Use your device manufacturer's official support page",
            "Run security checks using trusted security software"
        ])

    # Account suspension / verification
    if re.search(r"\b(expire|suspend|suspended|blocked|deactivate|deactivated|verify your account)\b", message_lower):
        do_not.extend([
            "Do not click a link claiming your account will be blocked or suspended",
            "Do not enter your login credentials on a page opened from the message"
        ])
        do_actions.extend([
            "Open the service's official app or website manually to check your account",
            "Contact official customer support if your account actually has an issue"
        ])

    # Any suspicious URL gets an explicit link warning.
    if re.search(r"(http://|https://|www\.|bit\.ly|t\.co)", message_lower):
        do_not.append("Do not click or open the suspicious URL in the message")
        do_actions.append("Navigate to the official website manually instead of using the message link")

    # Urgency is an additional signal, regardless of scam category.
    if re.search(r"\b(urgent|immediately|now|hurry|expire|suspend|blocked)\b", message_lower):
        do_not.append("Do not act under pressure or urgency created by the message")
        do_actions.append("Pause and independently verify the request before taking any action")

    # Fallback for a high-risk scam that does not match a known category.
    if not do_not:
        do_not = [
            "Do not click links, send money, or share sensitive information based on this message"
        ]

    if not do_actions:
        do_actions = [
            "Verify the sender and request through an official, independently found channel"
        ]

    # Remove duplicate recommendations while preserving order.
    return {
        "do_not": list(dict.fromkeys(do_not)),
        "do": list(dict.fromkeys(do_actions))
    }


# ---------------------------------------------------------
# Generate explanation
# ---------------------------------------------------------

def generate_explanation(message, prediction, score):

    if prediction == 0:

        return (
            f"The message was classified as likely legitimate "
            f"with an estimated scam risk of {score:.2f}/100."
        )

    flags = []

    message_lower = message.lower()

    if re.search(
        r"\b(urgent|immediately|now|hurry|expire|suspend|blocked)\b",
        message_lower
    ):
        flags.append("urgency or pressure language")

    if re.search(
        r"\b(otp|pin|password|cvv|verification code)\b",
        message_lower
    ):
        flags.append("sensitive credential references")

    if re.search(
        r"\b(pay|payment|upi|transfer|money|cashback)\b",
        message_lower
    ):
        flags.append("payment-related language")

    if re.search(
        r"\b(prize|won|winner|lottery|reward|free)\b",
        message_lower
    ):
        flags.append("reward or prize language")

    if re.search(
        r"(http://|https://|www\.|bit\.ly|t\.co)",
        message_lower
    ):
        flags.append("URL/link detected")

    if flags:

        return (
            "The message was classified as a potential scam based on "
            + ", ".join(flags)
            + f". Estimated scam risk is {score:.2f}/100."
        )

    return (
        f"The message was classified as a potential scam with "
        f"an estimated scam risk of {score:.2f}/100."
    )


# ---------------------------------------------------------
# Red flags
# ---------------------------------------------------------

def get_red_flags(message):

    message_lower = message.lower()

    flags = []

    if re.search(
        r"\b(urgent|immediately|now|hurry|expire|suspend|blocked)\b",
        message_lower
    ):
        flags.append("Urgency or pressure language detected")

    if re.search(
        r"\b(otp|pin|password|cvv|verification code)\b",
        message_lower
    ):
        flags.append("Sensitive credential reference detected")

    if re.search(
        r"\b(pay|payment|upi|transfer|money|cashback)\b",
        message_lower
    ):
        flags.append("Payment-related language detected")

    if re.search(
        r"\b(prize|won|winner|lottery|reward|free)\b",
        message_lower
    ):
        flags.append("Reward or prize language detected")

    if re.search(
        r"(http://|https://|www\.|bit\.ly|t\.co)",
        message_lower
    ):
        flags.append("URL or link detected")

    return flags


# ---------------------------------------------------------
# Main ML analysis
# ---------------------------------------------------------

def analyze(message):
    """
    Analyze SMS using the trained TF-IDF + calibrated SVM model.
    """

    try:

        # Convert message into TF-IDF features
        message_tfidf = tfidf_vectorizer_v2.transform([message])

        # Prediction
        prediction = calibrated_svm_v2.predict(message_tfidf)[0]

        # Probability of scam
        scam_probability = calibrated_svm_v2.predict_proba(
            message_tfidf
        )[0][1]

        # Convert probability to 0-100 risk score
        risk_score = round(
            scam_probability * 100,
            2
        )

        # ML prediction
        prediction = int(prediction)

        # Determine risk level
        risk_level = get_risk_level(risk_score)

        # Detect scam type
        scam_type = detect_scam_type(prediction, message)

        # Generate red flags
        red_flags = get_red_flags(message)

        # Generate explanation
        explanation = generate_explanation(
            message,
            prediction,
            risk_score
        )

        # Context-specific safety recommendations
        safety_actions = get_safety_recommendations(
            message,
            prediction,
            risk_score
        )

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "scam_type": scam_type,
            "red_flags": red_flags,
            "explanation": explanation,
            "safety_actions": safety_actions,
            "source": "ml_model_v2"
        }

    except Exception as e:

        print("========== ML MODEL ERROR ==========")
        print(e)
        print("====================================")

        return {
            "risk_score": None,
            "risk_level": "ERROR",
            "scam_type": "Unclassified",
            "red_flags": [],
            "explanation": "The ML model could not analyze this message.",
            "safety_actions": {
                "do_not": [],
                "do": []
            },
            "source": "ml_error"
        }
