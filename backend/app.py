import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from dotenv import load_dotenv
from datetime import datetime
import engine

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS
# Restrict FRONTEND_ORIGIN to the deployed Vercel URL in production
frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
CORS(app, resources={r"/api/*": {"origins": frontend_origin}})

# MongoDB Setup
mongo_uri = os.environ.get("MONGO_URI")
if mongo_uri:
    client = MongoClient(mongo_uri, server_api=ServerApi('1'))
    # Use 'fraudlens' DB and 'scans' collection
    db = client.get_database("fraudlens")
    scans_collection = db.scans
else:
    print("Warning: MONGO_URI not set. Database operations will be mocked/skipped.")
    scans_collection = None


@app.route("/api/analyze", methods=["POST"])
def analyze_message():
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Missing 'text' in request body"}), 400
        
        text = data["text"]
        if not text.strip():
            return jsonify({"error": "Text cannot be empty"}), 400

        # Run analysis (Gemini + fallback logic handled inside engine.analyze)
        result = engine.analyze(text)
        
        # Save to MongoDB
        if scans_collection is not None:
            doc = {
                "text": text,
                "risk_score": result["risk_score"],
                "risk_level": result["risk_level"],
                "scam_type": result["scam_type"],
                "created_at": datetime.utcnow().isoformat() + "Z"
            }
            scans_collection.insert_one(doc)
            
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error in /api/analyze: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/history", methods=["GET"])
def get_history():
    try:
        limit = request.args.get("limit", 20, type=int)
        
        if scans_collection is None:
            return jsonify([])

        # Fetch recent scans, sort by newest first (descending)
        cursor = scans_collection.find().sort("created_at", -1).limit(limit)
        
        history = []
        for doc in cursor:
            # Convert ObjectId to string to match API contract
            doc["_id"] = str(doc["_id"])
            history.append(doc)
            
        return jsonify(history), 200
        
    except Exception as e:
        print(f"Error in /api/history: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/stats", methods=["GET"])
def get_stats():
    try:
        if scans_collection is None:
            return jsonify({"total_scans": 0, "high_risk": 0, "top_category": None})
            
        total_scans = scans_collection.count_documents({})
        high_risk = scans_collection.count_documents({"risk_level": {"$in": ["HIGH", "CRITICAL"]}})
        
        # Find top scam category (ignoring benign or unclassified scans)
        pipeline = [
            {"$match": {"scam_type": {"$nin": ["Not a Scam", "Unclassified"]}}},
            {"$group": {"_id": "$scam_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        top_category_cursor = list(scans_collection.aggregate(pipeline))
        top_category = top_category_cursor[0]["_id"] if top_category_cursor else None

        return jsonify({
            "total_scans": total_scans,
            "high_risk": high_risk,
            "top_category": top_category
        }), 200

    except Exception as e:
        print(f"Error in /api/stats: {e}")
        return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
