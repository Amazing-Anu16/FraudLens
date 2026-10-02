import os

import jwt

from flask import Flask, request, jsonify
from flask_cors import CORS

from flask import send_file
from io import BytesIO
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from pymongo import MongoClient
from pymongo.server_api import ServerApi

from dotenv import load_dotenv

from datetime import datetime, timezone, timedelta

from werkzeug.security import generate_password_hash, check_password_hash

import engine


# ============================================================
# Load environment variables
# ============================================================

load_dotenv()


# ============================================================
# Flask App
# ============================================================

app = Flask(__name__)

# Allow all origins for development
CORS(app)


# ============================================================
# MongoDB Setup
# ============================================================

mongo_uri = os.environ.get("MONGO_URI")

if mongo_uri:
    client = MongoClient(
        mongo_uri,
        server_api=ServerApi("1")
    )

    # Use fraudlens database
    db = client.get_database("fraudlens")

    # Collections
    users_collection = db.users
    scans_collection = db.scans

else:
    print(
        "Warning: MONGO_URI not set. "
        "Database operations will be mocked/skipped."
    )

    users_collection = None
    scans_collection = None


# ============================================================
# Authentication Configuration
# ============================================================

JWT_SECRET = os.environ.get("JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is not set. "
        "Add JWT_SECRET to your .env file."
    )

JWT_EXPIRATION_HOURS = 24


# ============================================================
# JWT Verification Helper
# ============================================================

def verify_token():
    """
    Helper function to verify the JWT token from the Authorization header.
    Returns a tuple: (payload, None) if successful, or (None, error_response) if failed.
    """
    # 1. Read the Authorization header from the incoming request
    auth_header = request.headers.get("Authorization")

    # 2. Return an appropriate error if the header is missing
    if not auth_header:
        return None, (jsonify({"error": "Authorization header is missing"}), 401)

    # 3. Return an appropriate error if the header does not use the Bearer format
    # The format should be exactly: "Bearer <token>"
    parts = auth_header.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        return None, (jsonify({"error": "Invalid Authorization header format. Expected 'Bearer <token>'"}), 401)

    # 4. Extract the JWT token from the parts array
    token = parts[1]

    try:
        # 5. Decode and verify the token using the secret and HS256 algorithm
        # This automatically checks if the token has expired
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"]
        )
        
        # 8. Return the decoded payload when the token is valid
        # We do NOT return passwords or password hashes (only safe user data)
        return payload, None

    # 6. Handle an expired token specifically
    except jwt.ExpiredSignatureError:
        return None, (jsonify({"error": "Token has expired"}), 401)

    # 7. Handle any other invalid token errors (e.g., tampered token)
    except jwt.InvalidTokenError:
        return None, (jsonify({"error": "Invalid token"}), 401)

# ============================================================
# Root Route
# ============================================================

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "service": "FraudLens API",
        "message": "Backend is up and running!"
    }), 200


# ============================================================
# Health Check
# ============================================================

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "message": "API is healthy"
    }), 200


# ============================================================
# User Signup
# ============================================================

@app.route("/api/auth/signup", methods=["POST"])
def signup():

    try:
        data = request.get_json()

        # Check request body
        if not data:
            return jsonify({
                "error": "Request body is required"
            }), 400

        email = data.get("email")
        password = data.get("password")

        # Check required fields
        if email is None or password is None:
            return jsonify({
                "error": "Email and password are required"
            }), 400

        # Validate data types
        if not isinstance(email, str):
            return jsonify({
                "error": "Email must be a string"
            }), 400

        if not isinstance(password, str):
            return jsonify({
                "error": "Password must be a string"
            }), 400

        # Normalize email
        email = email.strip().lower()

        # Validate email
        if not email:
            return jsonify({
                "error": "Email cannot be empty"
            }), 400

        # Validate password
        if not password:
            return jsonify({
                "error": "Password cannot be empty"
            }), 400

        if len(password) < 8:
            return jsonify({
                "error": "Password must be at least 8 characters"
            }), 400

        # Check database availability
        if users_collection is None:
            return jsonify({
                "error": "Database is not available"
            }), 503

        # Check whether email already exists
        existing_user = users_collection.find_one({
            "email": email
        })

        if existing_user:
            return jsonify({
                "error": "Email already registered"
            }), 409

        # Hash password
        password_hash = generate_password_hash(password)

        # Create user document
        user_document = {
            "email": email,
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        # Save user
        users_collection.insert_one(user_document)

        return jsonify({
            "message": "Account created successfully"
        }), 201

    except Exception as e:

        print(f"Error in /api/auth/signup: {e}")

        return jsonify({
            "error": "Internal server error"
        }), 500


# ============================================================
# User Login
# ============================================================

@app.route("/api/auth/login", methods=["POST"])
def login():

    try:
        data = request.get_json()

        # Check request body
        if not data:
            return jsonify({
                "error": "Request body is required"
            }), 400

        email = data.get("email")
        password = data.get("password")

        # Check required fields
        if email is None or password is None:
            return jsonify({
                "error": "Email and password are required"
            }), 400

        # Validate data types
        if not isinstance(email, str):
            return jsonify({
                "error": "Email must be a string"
            }), 400

        if not isinstance(password, str):
            return jsonify({
                "error": "Password must be a string"
            }), 400

        # Normalize email
        email = email.strip().lower()

        if not email or not password:
            return jsonify({
                "error": "Email and password are required"
            }), 400

        # Check database availability
        if users_collection is None:
            return jsonify({
                "error": "Database is not available"
            }), 503

        # Find user
        user = users_collection.find_one({
            "email": email
        })

        # Same response for unknown email
        # and wrong password
        if not user:
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        # Get stored password hash
        password_hash = user.get("password_hash")

        # Verify password
        if not password_hash or not check_password_hash(
            password_hash,
            password
        ):
            return jsonify({
                "error": "Invalid email or password"
            }), 401

        # ====================================================
        # Create JWT
        # ====================================================

        now = datetime.now(timezone.utc)

        payload = {
            "user_id": str(user["_id"]),
            "email": user["email"],
            "iat": now,
            "exp": now + timedelta(
                hours=JWT_EXPIRATION_HOURS
            )
        }

        token = jwt.encode(
            payload,
            JWT_SECRET,
            algorithm="HS256"
        )

        return jsonify({
            "message": "Login successful",

            "token": token,

            "user": {
                "id": str(user["_id"]),
                "email": user["email"]
            }
        }), 200

    except Exception as e:

        print(f"Error in /api/auth/login: {e}")

        return jsonify({
            "error": "Internal server error"
        }), 500


# ============================================================
# Analyze Message
# ============================================================

@app.route("/api/analyze", methods=["POST", "OPTIONS"])
def analyze_message():

    # Allow CORS preflight requests to pass without authentication
    if request.method == "OPTIONS":
        return jsonify({}), 200

    # Call verify_token() to ensure only logged-in users can analyze messages.
    # We do this at the very beginning so that an invalid or missing token stops
    # the request immediately, securing the ML engine and database.
    payload, error_response = verify_token()

    # If verification fails, we immediately return the 401 error response from verify_token.
    if error_response:
        return error_response

    # If verification succeeds, the 'payload' variable now contains the decoded 
    # safe user data (like user_id and email). The request is allowed to continue.

    try:
        data = request.get_json()

        if not data or "text" not in data:
            return jsonify({
                "error": "Missing 'text' in request body"
            }), 400

        text = data["text"]

        # Validate text type
        if not isinstance(text, str):
            return jsonify({
                "error": "'text' must be a string"
            }), 400

        # Validate empty text
        if not text.strip():
            return jsonify({
                "error": "Text cannot be empty"
            }), 400

        # Prevent excessively large input
        if len(text) > 10000:
            return jsonify({
                "error": "Text is too long. Maximum length is 10000 characters."
            }), 400

        # ====================================================
        # Run analysis using the local ML model
        # ====================================================

        result = engine.analyze(text)

        # ====================================================
        # Save result to MongoDB
        # ====================================================

        if scans_collection is not None:

            doc = {
                # We save the user_id to securely connect this specific scan 
                # to the currently authenticated user who requested it.
                "user_id": payload["user_id"],
                "text": text,
                "risk_score": result["risk_score"],
                "risk_level": result["risk_level"],
                "scam_type": result["scam_type"],
                "created_at": datetime.now(
                    timezone.utc
                ).isoformat()
            }

            scans_collection.insert_one(doc)

        return jsonify(result), 200

    except Exception as e:

        print(f"Error in /api/analyze: {e}")

        return jsonify({
            "error": "Internal server error"
        }), 500


# ============================================================
# History
# ============================================================

@app.route("/api/history", methods=["GET"])
def get_history():

    # 1. Call verify_token() to ensure the user is securely authenticated.
    # We must require a valid token before allowing access to private history.
    payload, error_response = verify_token()

    # If the token is missing or invalid, immediately return the error response.
    if error_response:
        return error_response

    # payload["user_id"] identifies the currently logged-in user securely 
    # from the JWT token, preventing attackers from spoofing their identity.

    try:

        limit = request.args.get(
            "limit",
            20,
            type=int
        )

        # Prevent unreasonable limits
        if limit < 1:
            limit = 20

        if limit > 100:
            limit = 100

        if scans_collection is None:
            return jsonify([]), 200

        # ====================================================
        # Fetch recent scans
        # ====================================================

        cursor = (
            scans_collection
            .find({
                # Filtering by user_id prevents users from seeing another user's scans.
                # It guarantees that MongoDB only returns documents belonging 
                # strictly to this specific authenticated user.
                "user_id": payload["user_id"]
            })
            .sort("created_at", -1)
            .limit(limit)
        )

        history = []

        for doc in cursor:

            # Convert MongoDB ObjectId to string
            doc["_id"] = str(doc["_id"])

            history.append(doc)

        return jsonify(history), 200

    except Exception as e:

        print(f"Error in /api/history: {e}")

        return jsonify({
            "error": "Internal server error"
        }), 500


# ============================================================
# Dashboard Statistics
# ============================================================

@app.route("/api/stats", methods=["GET"])
def get_stats():

    # 1. /api/stats needs authentication to ensure users only see their own metrics.
    # We call verify_token() to securely authenticate the request.
    payload, error_response = verify_token()
    
    if error_response:
        return error_response

    # 2. payload["user_id"] identifies the current user based on their login token.
    # Every single statistics query below must include this user_id so we never 
    # accidentally mix or expose another user's personal scan data.

    try:

        if scans_collection is None:
            return jsonify({
                "total_scans": 0,
                "high_risk": 0,
                "top_category": None
            }), 200

        # ====================================================
        # Total number of scans
        # ====================================================

        total_scans = scans_collection.count_documents({
            "user_id": payload["user_id"]
        })

        # ====================================================
        # HIGH + CRITICAL scans
        # ====================================================

        high_risk = scans_collection.count_documents({
            "user_id": payload["user_id"],
            "risk_level": {
                "$in": [
                    "HIGH",
                    "CRITICAL"
                ]
            }
        })

        # ====================================================
        # Find most common scam category
        # ====================================================

        pipeline = [

            {
                "$match": {
                    "user_id": payload["user_id"],
                    "scam_type": {
                        "$nin": [
                            "Not a Scam",
                            "Unclassified"
                        ]
                    }
                }
            },

            {
                "$group": {
                    "_id": "$scam_type",
                    "count": {
                        "$sum": 1
                    }
                }
            },

            {
                "$sort": {
                    "count": -1
                }
            },

            {
                "$limit": 1
            }
        ]

        top_category_cursor = list(
            scans_collection.aggregate(pipeline)
        )

        if top_category_cursor:
            top_category = top_category_cursor[0]["_id"]
        else:
            top_category = None

        return jsonify({
            "total_scans": total_scans,
            "high_risk": high_risk,
            "top_category": top_category
        }), 200

    except Exception as e:

        print(f"Error in /api/stats: {e}")

        return jsonify({
            "error": "Internal server error"
        }), 500


# ============================================================
# Start Flask Server
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=True
    )
