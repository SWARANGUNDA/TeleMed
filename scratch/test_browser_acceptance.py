import sys
import json
import urllib.request
import urllib.parse

def test_api():
    base_url = "http://localhost:8000"
    
    # 1. Health check
    req = urllib.request.Request(f"{base_url}/api/v1/health")
    with urllib.request.urlopen(req) as resp:
        health_data = json.loads(resp.read().decode('utf-8'))
        print("1. Health Endpoint Status:", health_data.get("status"))

    # 2. Login or Register test patient
    email = "patient_acceptance@telemed.ai"
    password = "Password123!"
    
    token = None
    # Try login first
    login_data = json.dumps({"email": email, "password": password}).encode('utf-8')
    req = urllib.request.Request(f"{base_url}/api/v1/auth/login", data=login_data, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            token = data.get("access_token") or data.get("token")
            print("2. Patient Login Status: SUCCESS")
    except Exception as e:
        print("Login note:", e)

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }

    # 3. Test V3/V4 Prediction API (Clinical + Wearable Pathway)
    sample_payload = json.dumps({
        "patient_id": "P_ACCEPTANCE_TEST_001",
        "clinical_data": {
            "Glucose": 126.0,
            "HbA1c": 6.8,
            "Systolic_BP": 138.0,
            "Diastolic_BP": 88.0,
            "BMI": 28.4,
            "Age": 45,
            "Gender": "Male",
            "Triglycerides": 180.0,
            "HDL": 42.0,
            "LDL": 130.0,
            "Fasting_Insulin": 14.5,
            "ALT": 32.0,
            "AST": 28.0,
            "hs_CRP": 2.1,
            "Waist_Circumference": 92.0
        },
        "wearable_data": {
            "Resting_Heart_Rate": 72.0,
            "Total_Steps": 6500.0,
            "Total_Sleep_Duration_Hours": 6.5,
            "HRV_SDNN": 45.0,
            "Average_Glucose_CGM": 118.0
        }
    }).encode('utf-8')

    req = urllib.request.Request(f"{base_url}/api/v3/predict", data=sample_payload, headers=headers)
    pred_res = None
    with urllib.request.urlopen(req) as resp:
        pred_res = json.loads(resp.read().decode('utf-8'))
        print("\n3. V3/V4 Prediction Result:")
        print("   Effective Pathway:", pred_res.get("effective_pathway"))
        print("   Active Modalities:", pred_res.get("active_modalities"))
        print("   Overall Data Quality Score:", pred_res.get("data_quality_score"))
        outcomes = pred_res.get("disease_outcomes", {})
        for d_name, d_val in outcomes.items():
            prob = d_val.get("calibrated_probability", d_val.get("probability"))
            print(f"   Target [{d_name}]: Risk = {prob*100:.1f}%, Level = {d_val.get('risk_level')}")

    # 4. Test XAI TreeSHAP API across 5 disease targets
    diseases = ["Type2_Diabetes", "Prediabetes", "High_Adiposity_Risk", "Metabolic_Syndrome", "NAFLD"]
    print("\n4. XAI TreeSHAP Target Switching Verification:")
    for dis in diseases:
        xai_req_payload = json.dumps({
            "patient_id": "P_ACCEPTANCE_TEST_001",
            "disease": dis,
            "predict_response": pred_res
        }).encode('utf-8')
        req = urllib.request.Request(f"{base_url}/api/v3/xai", data=xai_req_payload, headers=headers)
        with urllib.request.urlopen(req) as resp:
            xai_res = json.loads(resp.read().decode('utf-8'))
            attrs = xai_res.get("attributions", {})
            clin_feats = len(attrs.get("clinical", {}).get("all_features", []))
            wear_feats = len(attrs.get("wearable", {}).get("all_features", []))
            gut_feats = len(attrs.get("gut", {}).get("all_features", []))
            tot = clin_feats + wear_feats + gut_feats
            print(f"   Target [{dis}]: Total Active Features={tot} (Clinical={clin_feats}, Wearable={wear_feats}, Gut={gut_feats})")

    # 5. Test RAG Report API
    report_req_payload = json.dumps({
        "patient_id": "P_ACCEPTANCE_TEST_001",
        "predict_response": pred_res
    }).encode('utf-8')
    req = urllib.request.Request(f"{base_url}/api/v3/report", data=report_req_payload, headers=headers)
    with urllib.request.urlopen(req) as resp:
        report_res = json.loads(resp.read().decode('utf-8'))
        evidence_count = len(report_res.get("retrieved_evidence", []))
        print(f"\n5. Medical RAG Report Verification:")
        print("   Evidence Guidelines Count:", evidence_count)
        print("   Executive Summary Present:", bool(report_res.get("executive_summary") or report_res.get("summary")))

if __name__ == "__main__":
    test_api()
