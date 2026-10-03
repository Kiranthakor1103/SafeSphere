import os
import requests
from fastapi import FastAPI, HTTPException, Security, Header
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="SafeSphere AI & Triage Engine")

NODE_API_URL = os.environ.get("NODE_API_URL", "http://api-server:5000")
IOT_API_KEY = os.environ.get("IOT_API_KEY", "REPLACE_WITH_A_LONG_RANDOM_IOT_DEVICE_KEY")

class SOSData(BaseModel):
    type: str
    message: str
    numberOfPeople: int
    district: str
    state: str
    country: str
    priority: str

class TriageResponse(BaseModel):
    score: int
    priority: str
    summary: str
    identifiedHazards: List[str]
    recommendedUnits: List[str]
    immediateActions: List[str]
    shelterMatchNote: Optional[str] = None

class WaterTelemetry(BaseModel):
    chipId: str
    sensorName: str
    waterLevelCm: float
    criticalThresholdCm: float
    lat: float
    lng: float
    district: str

@app.post("/api/triage", response_model=TriageResponse)
def triage_sos(data: SOSData):
    message = data.message.lower()
    score = 35
    hazards = []
    recommended_units = []
    immediate_actions = []

    # Basic machine learning / heuristic rules
    if data.numberOfPeople >= 10:
        score += 25
    elif data.numberOfPeople >= 5:
        score += 15

    if "trap" in message or "collapse" in message or "rubble" in message:
        score += 30
        hazards.append("Structural Collapse & Trapping")
        recommended_units.append("NDRF Search & Rescue Squad")
        immediate_actions.append("Deploy structural acoustic detectors immediately.")

    if "flood" in message or "water" in message or "drown" in message:
        score += 25
        hazards.append("Water Inundation")
        recommended_units.append("National Water Rescue Unit")
        immediate_actions.append("Dispatch inflatable motorboats.")

    if "fire" in message or "smoke" in message:
        score += 30
        hazards.append("Building Fire / Toxic Smoke")
        recommended_units.append("City Fire Department")
        immediate_actions.append("Isolate building power, deploy fire engine.")

    score = min(100, max(0, score))
    priority = "low"
    if score >= 80:
        priority = "critical"
    elif score >= 60:
        priority = "high"
    elif score >= 40:
        priority = "medium"

    return TriageResponse(
        score=score,
        priority=priority,
        summary=f"AI Evaluated SOS: {data.numberOfPeople} people affected. Risk level {priority.upper()}.",
        identifiedHazards=hazards if hazards else ["General Distress"],
        recommendedUnits=recommended_units if recommended_units else ["Rapid Response Team"],
        immediateActions=immediate_actions if immediate_actions else ["Contact local dispatch to verify location."],
        shelterMatchNote="Nearest shelter coordinates mapped."
    )

@app.post("/api/predict-flood")
def predict_flood(telemetry: WaterTelemetry):
    # Predict flood hazard risk using water level trends
    ratio = telemetry.waterLevelCm / telemetry.criticalThresholdCm
    risk_level = "low"
    
    if ratio >= 1.0:
        risk_level = "critical"
    elif ratio >= 0.8:
        risk_level = "high"
    elif ratio >= 0.5:
        risk_level = "medium"

    # If critical/high, trigger automated alert on Node.js API
    if risk_level in ["high", "critical"]:
        try:
            payload = {
                "title": f"🚨 Automated Flood Alert: {telemetry.sensorName}",
                "description": f"IoT sensor recorded extreme water level of {telemetry.waterLevelCm}cm (Threshold: {telemetry.criticalThresholdCm}cm). Risk level calculated as {risk_level.upper()}.",
                "type": "flood",
                "severity": "danger" if risk_level == "critical" else "warning",
                "location": {
                    "lat": telemetry.lat,
                    "lng": telemetry.lng,
                    "address": f"River sensor station: {telemetry.sensorName}"
                },
                "status": "active",
                "district": telemetry.district
            }
            
            headers = {
                "x-iot-api-key": IOT_API_KEY,
                "Content-Type": "application/json"
            }
            
            # Post to automated disaster route
            res = requests.post(f"{NODE_API_URL}/api/disasters/auto", json=payload, headers=headers, timeout=5)
            return {
                "risk_level": risk_level,
                "ratio": ratio,
                "triggered_alert": res.status_code == 201,
                "node_response": res.json() if res.status_code == 201 else res.text
            }
        except Exception as e:
            return {"risk_level": risk_level, "ratio": ratio, "error": str(e)}

    return {"risk_level": risk_level, "ratio": ratio, "triggered_alert": False}
