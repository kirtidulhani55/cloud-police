"""
Cloud Police - AI-Powered Multi-Cloud Governance Copilot
Python Flask Integration Example (app.py)

This file demonstrates how seamlessly this entire dashboard connects to a
standard Python Flask backend.

Folder structure for your Flask project:
----------------------------------------
my_cloud_police_app/
│
├── app.py                     # This file (Flask server)
├── templates/
│   └── index.html             # The index.html from this project
└── static/
    ├── css/
    │   └── styles.css         # The styles.css stylesheet
    └── js/
        ├── mockData.js        # Data model / default fallback
        └── app.js             # Dashboard application controller

To run locally with Flask:
1. pip install flask
2. python app.py
3. Open http://localhost:5000 in your browser
"""

from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Route to serve the Cloud Police Command Center
@app.route("/")
def dashboard():
    return render_template("index.html")

# API Route: Multi-Cloud Overview Metrics
@app.route("/api/v1/overview", methods=["GET"])
def get_overview():
    return jsonify({
        "status": "success",
        "data": {
            "activeIncidentsCount": 4,
            "highRiskChangesCount": 2,
            "monthlyCostAtRisk": 2100,
            "totalMonthlyCostAtRisk": 4320,
            "awaitingHumanApprovalCount": 3,
            "coverage": [
                {
                    "provider": "Azure",
                    "code": "azure",
                    "resourcesMonitored": 188,
                    "regions": ["eastus", "eastus2", "westeurope"],
                    "status": "Active Monitoring",
                    "health": "Incident Detected",
                    "healthClass": "danger"
                },
                {
                    "provider": "AWS",
                    "code": "aws",
                    "resourcesMonitored": 312,
                    "regions": ["us-east-1", "us-west-2", "eu-central-1"],
                    "status": "Active Monitoring",
                    "health": "Cost Anomaly",
                    "healthClass": "warning"
                },
                {
                    "provider": "GCP",
                    "code": "gcp",
                    "resourcesMonitored": 146,
                    "regions": ["us-central1", "europe-west1", "asia-east1"],
                    "status": "Active Monitoring",
                    "health": "Healthy / Low Risk Changes",
                    "healthClass": "healthy"
                }
            ]
        }
    })

# API Route: Human Approval Action
@app.route("/api/v1/approvals/<item_id>", methods=["POST"])
def update_approval(item_id):
    payload = request.get_json() or {}
    decision = payload.get("decision", "APPROVE") # APPROVE or REJECT
    
    # SAFETY LOCK: Cloud Police never applies infrastructure changes automatically
    # This endpoint records operator authorization and prepares an auditable record
    return jsonify({
        "status": "success",
        "message": f"Human decision recorded: {decision} for item {item_id}",
        "item_id": item_id,
        "decision": decision,
        "human_verified": True
    })

if __name__ == "__main__":
    print("🚓 Cloud Police Flask Server running on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
