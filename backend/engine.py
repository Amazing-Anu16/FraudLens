import os
import re
import joblib
import threading

from sklearn.linear_model import LogisticRegression


# ---------------------------------------------------------
# Load ML model
# ---------------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "ml",
    "models"
)

TFIDF_PATH = os.path.join(
    MODEL_DIR,
    "tfidf_vectorizer_v2.pkl"
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "calibrated_svm_v2.pkl"
)


tfidf_vectorizer_v2 = joblib.load(
    TFIDF_PATH
)

calibrated_svm_v2 = joblib.load(
    MODEL_PATH
)


# ---------------------------------------------------------
# Feedback-trained correction model
# ---------------------------------------------------------

FEEDBACK_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "feedback_classifier.pkl"
)

# Minimum number of confirmed feedback samples required
# before the feedback model is used.
FEEDBACK_MIN_SAMPLES = 10

feedback_classifier = None

feedback_sample_count = 0

feedback_model_lock = threading.Lock()


# Load previously trained feedback model if available
if os.path.exists(FEEDBACK_MODEL_PATH):

    try:

        feedback_classifier = joblib.load(
            FEEDBACK_MODEL_PATH
        )

        feedback_sample_count = getattr(
            feedback_classifier,
            "feedback_sample_count",
            0
        )

        print(
            f"Feedback model loaded "
            f"with {feedback_sample_count} samples."
        )

    except Exception as e:

        print(
            f"Warning: Could not load feedback model: {e}"
        )

        feedback_classifier = None

        feedback_sample_count = 0


# ---------------------------------------------------------
# Train feedback model
# ---------------------------------------------------------

def train_feedback_model(feedback_rows):
    """
    Train a lightweight correction classifier from
    confirmed user labels.

    The original calibrated SVM remains the primary model.

    The feedback model is activated only after:
        1. At least FEEDBACK_MIN_SAMPLES exist
        2. Both scam and non-scam classes are present
    """

    global feedback_classifier
    global feedback_sample_count

    # -----------------------------------------------------
    # Keep only valid feedback
    # -----------------------------------------------------

    valid_rows = [

        row

        for row in feedback_rows

        if isinstance(
            row.get("text"),
            str
        )

        and row.get(
            "text",
            ""
        ).strip()

        and row.get(
            "correct_label"
        ) in (0, 1)

    ]


    # Extract labels

    labels = [

        int(
            row["correct_label"]
        )

        for row in valid_rows

    ]


    # -----------------------------------------------------
    # Minimum samples
    # -----------------------------------------------------

    if len(valid_rows) < FEEDBACK_MIN_SAMPLES:

        return {

            "trained": False,

            "reason": (
                f"Need at least "
                f"{FEEDBACK_MIN_SAMPLES} "
                f"confirmed feedback samples."
            ),

            "samples": len(
                valid_rows
            )

        }


    # -----------------------------------------------------
    # Both classes must be present
    # -----------------------------------------------------

    if len(set(labels)) < 2:

        return {

            "trained": False,

            "reason": (
                "Feedback must contain both "
                "scam and not-scam labels."
            ),

            "samples": len(
                valid_rows
            )

        }


    # -----------------------------------------------------
    # Extract training text
    # -----------------------------------------------------

    texts = [

        row["text"].strip()

        for row in valid_rows

    ]


    # -----------------------------------------------------
    # Train feedback classifier
    # -----------------------------------------------------

    with feedback_model_lock:

        # Use the existing TF-IDF vectorizer
        X = tfidf_vectorizer_v2.transform(
            texts
        )


        classifier = LogisticRegression(

            max_iter=1000,

            class_weight="balanced",

            random_state=42

        )


        classifier.fit(
            X,
            labels
        )


        # Store metadata inside model

        classifier.feedback_sample_count = (
            len(valid_rows)
        )

        classifier.feedback_model_version = (
            "feedback-v1"
        )


        # Save model

        joblib.dump(
            classifier,
            FEEDBACK_MODEL_PATH
        )


        # Update running model

        feedback_classifier = (
            classifier
        )

        feedback_sample_count = (
            len(valid_rows)
        )


    return {

        "trained": True,

        "samples": len(
            valid_rows
        ),

        "model": "feedback-v1"

    }


# ---------------------------------------------------------
# Risk level
# ---------------------------------------------------------

def get_risk_level(score):
    """
    Maps a risk score to a risk level category.
    """

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

def detect_scam_type(
    prediction,
    message
):
    """
    Provides a more specific scam category when
    scam-related language is present.

    The ML prediction determines whether the
    message is classified as a scam.
    """

    if prediction == 0:

        return "Not a Scam"


    message_lower = message.lower()


    patterns = [

        (

            r"\b("
            r"prize|won|winner|lottery|reward|"
            r"cashback|gift|voucher|free"
            r")\b",

            "Reward / Prize Scam"

        ),

        (

            r"\b("
            r"otp|one[- ]time password|pin|cvv|"
            r"password|verification code|login|"
            r"account details"
            r")\b",

            "Credential / Account Scam"

        ),

        (

            r"\b("
            r"upi|payment|pay|transfer|"
            r"send money|refund|cash|bank"
            r")\b",

            "Payment / Banking Scam"

        ),

        (

            r"\b("
            r"job|vacancy|hiring|salary|"
            r"work from home|employment|recruiter"
            r")\b",

            "Job / Employment Scam"

        ),

        (

            r"\b("
            r"delivery|parcel|package|courier|"
            r"shipment|customs"
            r")\b",

            "Delivery / Parcel Scam"

        ),

        (

            r"\b("
            r"invest|investment|trading|crypto|"
            r"bitcoin|profit|returns"
            r")\b",

            "Investment Scam"

        ),

        (

            r"\b("
            r"refund|tax|income tax|itr|"
            r"penalty|fine"
            r")\b",

            "Refund / Tax Scam"

        ),

        (

            r"\b("
            r"virus|malware|technical support|"
            r"tech support|computer|remote access"
            r")\b",

            "Tech Support Scam"

        ),

        (

            r"\b("
            r"expire|suspend|suspended|blocked|"
            r"deactivate|deactivated|"
            r"verify your account"
            r")\b",

            "Account Suspension Scam"

        )

    ]


    for pattern, category in patterns:

        if re.search(
            pattern,
            message_lower
        ):

            return category


    return "Scam"


# ---------------------------------------------------------
# Context-specific safety recommendations
# ---------------------------------------------------------

def get_safety_recommendations(
    message,
    prediction,
    score
):
    """
    Generates safety recommendations based on
    the actual scam context detected in the message.

    Strong recommendations are activated when:
        prediction == 1
        AND
        risk score > 40
    """

    message_lower = message.lower()


    # -----------------------------------------------------
    # Low-risk / non-scam
    # -----------------------------------------------------

    if (
        prediction == 0
        or score is None
        or score <= 40
    ):

        return {

            "do_not": [],

            "do": [

                "Verify unexpected requests through an official source before taking action"

            ]

        }


    do_not = []

    do_actions = []


    # -----------------------------------------------------
    # Reward / Prize / Cashback scam
    # -----------------------------------------------------

    if re.search(

        r"\b("
        r"prize|won|winner|lottery|reward|"
        r"cashback|gift|voucher|free"
        r")\b",

        message_lower

    ):

        do_not.extend([

            "Do not click the reward or prize link",

            "Do not pay a fee to claim a reward",

            "Do not share OTP, UPI PIN, card details, or bank information to receive a prize"

        ])


        do_actions.extend([

            "Verify the offer directly through the company's official website or app",

            "If you did not enter a contest, treat the reward claim as suspicious"

        ])


    # -----------------------------------------------------
    # Banking / Credentials / OTP
    # -----------------------------------------------------

    if re.search(

        r"\b("
        r"otp|one[- ]time password|pin|cvv|"
        r"password|verification code|login|"
        r"account details"
        r")\b",

        message_lower

    ):

        do_not.extend([

            "Do not share OTP, PIN, CVV, password, or verification codes",

            "Do not enter banking credentials through a message link"

        ])


        do_actions.extend([

            "Open your bank's official app or website manually",

            "Contact the bank using the phone number on its official website or card"

        ])


    # -----------------------------------------------------
    # Payment / UPI
    # -----------------------------------------------------

    if re.search(

        r"\b("
        r"upi|payment|pay|transfer|"
        r"send money|refund|cash|bank"
        r")\b",

        message_lower

    ):

        do_not.extend([

            "Do not send money or approve an unexpected payment request",

            "Do not scan an unknown QR code or enter your UPI PIN to receive money"

        ])


        do_actions.extend([

            "Verify the payment request with the person or organization using a trusted channel",

            "Review the recipient name and transaction details before approving any payment"

        ])


    # -----------------------------------------------------
    # Job / Employment scam
    # -----------------------------------------------------

    if re.search(

        r"\b("
        r"job|vacancy|hiring|salary|"
        r"work from home|employment|recruiter"
        r")\b",

        message_lower

    ):

        do_not.extend([

            "Do not pay registration, training, security, or interview fees",

            "Do not share identity or bank documents with an unverified recruiter"

        ])


        do_actions.extend([

            "Verify the vacancy on the employer's official careers page",

            "Confirm recruiter contact details through the company's official website"

        ])


    # -----------------------------------------------------
    # Delivery / Parcel scam
    # -----------------------------------------------------

    if re.search(

        r"\b("
        r"delivery|parcel|package|courier|"
        r"shipment|customs"
        r")\b",

        message_lower

    ):

        do_not.extend([

            "Do not click an unexpected parcel-tracking or customs payment link",

            "Do not pay additional delivery fees through an unverified link"

        ])


        do_actions.extend([

            "Track the shipment using the courier's official website or app",

            "Contact the courier through its official customer-support channel"

        ])


    # -----------------------------------------------------
    # Investment scam
    # -----------------------------------------------------

    if re.search(

        r"\b("
        r"invest|investment|trading|crypto|"
        r"bitcoin|profit|returns"
        r")\b",

        message_lower

    ):

        do_not.extend([

            "Do not transfer money based on guaranteed-profit claims",

            "Do not share trading, wallet, or banking credentials with an unknown person"

        ])


        do_actions.extend([

            "Verify the investment platform and company independently",

            "Check regulatory registration before investing"

        ])


    # -----------------------------------------------------
    # Refund / Tax scam
    # -----------------------------------------------------

    if re.search(

        r"\b("
        r"refund|tax|income tax|itr|"
        r"penalty|fine"
        r")\b",

        message_lower

    ):

        do_not.extend([

            "Do not click links claiming to release a refund or avoid a penalty",

            "Do not provide card, bank, or tax-account credentials through the message"

        ])


        do_actions.extend([

            "Check your refund or tax status through the official government portal",

            "Contact the relevant authority through its official contact details"

        ])


    # -----------------------------------------------------
    # Tech Support scam
    # -----------------------------------------------------

    if re.search(

        r"\b("
        r"virus|malware|technical support|"
        r"tech support|computer|remote access"
        r")\b",

        message_lower

    ):

        do_not.extend([

            "Do not install remote-access software at an unknown person's request",

            "Do not give an unknown caller control of your computer"

        ])


        do_actions.extend([

            "Use your device manufacturer's official support page",

            "Run security checks using trusted security software"

        ])


    # -----------------------------------------------------
    # Account Suspension scam
    # -----------------------------------------------------

    if re.search(

        r"\b("
        r"expire|suspend|suspended|blocked|"
        r"deactivate|deactivated|"
        r"verify your account"
        r")\b",

        message_lower

    ):

        do_not.extend([

            "Do not click a link claiming your account will be blocked or suspended",

            "Do not enter your login credentials on a page opened from the message"

        ])


        do_actions.extend([

            "Open the service's official app or website manually to check your account",

            "Contact official customer support if your account actually has an issue"

        ])


    # -----------------------------------------------------
    # Suspicious URL
    # -----------------------------------------------------

    if re.search(

        r"(http://|https://|www\.|bit\.ly|t\.co)",

        message_lower

    ):

        do_not.append(

            "Do not click or open the suspicious URL in the message"

        )


        do_actions.append(

            "Navigate to the official website manually instead of using the message link"

        )


    # -----------------------------------------------------
    # Urgency / pressure
    # -----------------------------------------------------

    if re.search(

        r"\b("
        r"urgent|immediately|now|hurry|"
        r"expire|suspend|blocked"
        r")\b",

        message_lower

    ):

        do_not.append(

            "Do not act under pressure or urgency created by the message"

        )


        do_actions.append(

            "Pause and independently verify the request before taking any action"

        )


    # -----------------------------------------------------
    # Fallback
    # -----------------------------------------------------

    if not do_not:

        do_not = [

            "Do not click links, send money, or share sensitive information based on this message"

        ]


    if not do_actions:

        do_actions = [

            "Verify the sender and request through an official, independently found channel"

        ]


    # Remove duplicates while preserving order

    return {

        "do_not": list(
            dict.fromkeys(do_not)
        ),

        "do": list(
            dict.fromkeys(do_actions)
        )

    }


# ---------------------------------------------------------
# Generate explanation
# ---------------------------------------------------------

def generate_explanation(
    message,
    prediction,
    score
):

    if prediction == 0:

        return (

            f"The message was classified as likely legitimate "
            f"with an estimated scam risk of "
            f"{score:.2f}/100."

        )


    flags = []

    message_lower = message.lower()


    # Urgency

    if re.search(

        r"\b("
        r"urgent|immediately|now|hurry|"
        r"expire|suspend|blocked"
        r")\b",

        message_lower

    ):

        flags.append(
            "urgency or pressure language"
        )


    # Credentials

    if re.search(

        r"\b("
        r"otp|pin|password|cvv|"
        r"verification code"
        r")\b",

        message_lower

    ):

        flags.append(
            "sensitive credential references"
        )


    # Payment

    if re.search(

        r"\b("
        r"pay|payment|upi|transfer|"
        r"money|cashback"
        r")\b",

        message_lower

    ):

        flags.append(
            "payment-related language"
        )


    # Reward

    if re.search(

        r"\b("
        r"prize|won|winner|lottery|"
        r"reward|free"
        r")\b",

        message_lower

    ):

        flags.append(
            "reward or prize language"
        )


    # URL

    if re.search(

        r"(http://|https://|www\.|bit\.ly|t\.co)",

        message_lower

    ):

        flags.append(
            "URL/link detected"
        )


    if flags:

        return (

            "The message was classified as a potential scam based on "

            + ", ".join(flags)

            + f". Estimated scam risk is "
              f"{score:.2f}/100."

        )


    return (

        f"The message was classified as a potential scam "
        f"with an estimated scam risk of "
        f"{score:.2f}/100."

    )


# ---------------------------------------------------------
# Red flags
# ---------------------------------------------------------

def get_red_flags(message):

    message_lower = message.lower()

    flags = []


    # Urgency

    if re.search(

        r"\b("
        r"urgent|immediately|now|hurry|"
        r"expire|suspend|blocked"
        r")\b",

        message_lower

    ):

        flags.append(
            "Urgency or pressure language detected"
        )


    # Credentials

    if re.search(

        r"\b("
        r"otp|pin|password|cvv|"
        r"verification code"
        r")\b",

        message_lower

    ):

        flags.append(
            "Sensitive credential reference detected"
        )


    # Payment

    if re.search(

        r"\b("
        r"pay|payment|upi|transfer|"
        r"money|cashback"
        r")\b",

        message_lower

    ):

        flags.append(
            "Payment-related language detected"
        )


    # Reward

    if re.search(

        r"\b("
        r"prize|won|winner|lottery|"
        r"reward|free"
        r")\b",

        message_lower

    ):

        flags.append(
            "Reward or prize language detected"
        )


    # URL

    if re.search(

        r"(http://|https://|www\.|bit\.ly|t\.co)",

        message_lower

    ):

        flags.append(
            "URL or link detected"
        )


    return flags


# ---------------------------------------------------------
# Main ML analysis
# ---------------------------------------------------------

def analyze(message):
    """
    Analyze a message using:

        TF-IDF
          ↓
        Calibrated SVM
          ↓
        Optional feedback model
          ↓
        Final prediction
          ↓
        Risk score
          ↓
        Scam type
          ↓
        Red flags
          ↓
        Explanation
          ↓
        Safety recommendations
    """

    try:

        # -------------------------------------------------
        # Convert message into TF-IDF features
        # -------------------------------------------------

        message_tfidf = (
            tfidf_vectorizer_v2.transform(
                [message]
            )
        )


        # -------------------------------------------------
        # Original calibrated SVM prediction
        # -------------------------------------------------

        base_prediction = int(

            calibrated_svm_v2.predict(
                message_tfidf
            )[0]

        )


        base_probability = (

            calibrated_svm_v2.predict_proba(
                message_tfidf
            )[0][1]

        )


        # -------------------------------------------------
        # Final prediction
        # -------------------------------------------------

        prediction = (
            base_prediction
        )

        scam_probability = (
            base_probability
        )


        # -------------------------------------------------
        # Feedback model
        # -------------------------------------------------

        if (

            feedback_classifier is not None

            and

            feedback_sample_count
            >= FEEDBACK_MIN_SAMPLES

        ):

            feedback_probability = (

                feedback_classifier
                .predict_proba(
                    message_tfidf
                )[0][1]

            )


            # ---------------------------------------------
            # Blend models
            #
            # Original model: 70%
            # Feedback model: 30%
            # ---------------------------------------------

            scam_probability = (

                0.70 * base_probability

                +

                0.30 * feedback_probability

            )


            # Final classification

            prediction = int(

                scam_probability >= 0.50

            )


        # -------------------------------------------------
        # Risk score
        # -------------------------------------------------

        risk_score = round(

            scam_probability * 100,

            2

        )


        # -------------------------------------------------
        # Risk level
        # -------------------------------------------------

        risk_level = get_risk_level(
            risk_score
        )


        # -------------------------------------------------
        # Scam type
        # -------------------------------------------------

        scam_type = detect_scam_type(

            prediction,

            message

        )


        # -------------------------------------------------
        # Red flags
        # -------------------------------------------------

        red_flags = get_red_flags(
            message
        )


        # -------------------------------------------------
        # Explanation
        # -------------------------------------------------

        explanation = generate_explanation(

            message,

            prediction,

            risk_score

        )


        # -------------------------------------------------
        # Safety recommendations
        # -------------------------------------------------

        safety_actions = (
            get_safety_recommendations(

                message,

                prediction,

                risk_score

            )
        )


        # -------------------------------------------------
        # Final response
        # -------------------------------------------------

        return {

            "risk_score":
                risk_score,

            "risk_level":
                risk_level,

            # Actual ML classification
            #
            # 0 = Not Scam
            # 1 = Scam

            "prediction":
                prediction,

            # Easy frontend boolean

            "is_scam":
                bool(
                    prediction == 1
                ),

            "scam_type":
                scam_type,

            "red_flags":
                red_flags,

            "explanation":
                explanation,

            "safety_actions":
                safety_actions,

            "source":
                "ml_model_v2"

        }


    except Exception as e:

        print(
            "========== ML MODEL ERROR =========="
        )

        print(e)

        print(
            "===================================="
        )


        return {

            "risk_score":
                None,

            "risk_level":
                "ERROR",

            "prediction":
                None,

            "is_scam":
                None,

            "scam_type":
                "Unclassified",

            "red_flags":
                [],

            "explanation":
                "The ML model could not analyze this message.",

            "safety_actions":
                {

                    "do_not":
                        [],

                    "do":
                        []

                },

            "source":
                "ml_error"

        }
        