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

def detect_scam_type(prediction):

    if prediction == 0:
        return "Not a Scam"

    return "Scam"


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
        scam_type = detect_scam_type(prediction)

        # Generate red flags
        red_flags = get_red_flags(message)

        # Generate explanation
        explanation = generate_explanation(
            message,
            prediction,
            risk_score
        )

        # Safety recommendations
        if prediction == 1:

            safety_actions = {
                "do_not": [
                    "Do not click suspicious links",
                    "Do not share OTP, PIN, CVV, or passwords",
                    "Do not send money based only on this message"
                ],
                "do": [
                    "Verify the sender independently",
                    "Check the organization's official website or app"
                ]
            }

        else:

            safety_actions = {
                "do_not": [],
                "do": [
                    "Continue to verify unexpected requests before taking action"
                ]
            }

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