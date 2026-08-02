# TeleMed — Multimodal Metabolic Disease Triage Platform

> [!IMPORTANT]
> **ACADEMIC & RESEARCH PROTOTYPE DISCLAIMER:**  
> This software platform, including all trained models, datasets ($N=20,000$), risk probabilities, XAI attributions, and clinical report engines, is an **academic and research prototype** built using synthetic physiological multimodal data. It is **NOT** a clinically validated diagnostic system and must **NOT** be used for primary clinical diagnosis or patient treatment decisions.

---

## 1. System Overview

TeleMed is an end-to-end multimodal machine learning platform for metabolic disease risk assessment (`Type2_Diabetes`, `Prediabetes`, `Obesity`, `Metabolic_Syndrome`, `NAFLD`). The platform integrates three distinct health data domains:
1. **Clinical Labs & Vitals** (18 Predictors)
2. **Wearable & Continuous Glucose Monitoring (CGM)** (15 Predictors)
3. **Gut Microbiome Relative Abundance** (20 Taxa RAW)

### Frozen Scientific Baseline (v3.2.3)
- **Clinical Anchor Principle:** When Clinical lab data is present, `Clinical_v3` acts as the primary diagnostic anchor (capturing >99.9% of achievable ROC-AUC).
- **Remote Triage Pathway ($W+G$):** When Clinical labs are unavailable, a frozen 5-fold OOF `LogisticRegression` meta-stacker combines Wearable and Gut expert models (yielding $+0.0364$ NAFLD AUC gain, $p < 0.0001$).
- **CGM Handling:** Missing CGM features are imputed using stored payload medians; metadata tracks measured vs imputed status.

---

## 2. Quickstart Guide — How to Start the Application

### Prerequisites
- Python 3.10+
- Node.js 18+ and `npm`

### Step 1: Start the FastAPI Backend Server
Run from workspace root:
```bash
python -m uvicorn web_platform.backend.main:app --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger OpenAPI Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

### Step 2: Start the React Frontend Development Server
In a separate terminal window, run:
```bash
npm run dev
```
- Frontend UI URL: `http://localhost:5173` (or as shown in terminal)

---

## 3. Running the Automated E2E Test Suite

To execute all 13 end-to-end integration and scientific reproducibility tests across all pathways and API contracts, run:
```bash
python test_v3_e2e_integration.py -v
```

Expected output:
```
test_01_payload_loading (__main__.TestV3SystemIntegration) ... ok
test_02_clinical_only_pathway (__main__.TestV3SystemIntegration) ... ok
test_03_wearable_only_pathway (__main__.TestV3SystemIntegration) ... ok
test_04_gut_only_pathway (__main__.TestV3SystemIntegration) ... ok
test_05_wearable_plus_gut_remote_triage_pathway (__main__.TestV3SystemIntegration) ... ok
test_06_clinical_anchor_tri_modal_pathway (__main__.TestV3SystemIntegration) ... ok
test_07_cgm_missing_imputation (__main__.TestV3SystemIntegration) ... ok
test_08_api_predict_endpoint (__main__.TestV3SystemIntegration) ... ok
test_09_api_xai_endpoint (__main__.TestV3SystemIntegration) ... ok
test_10_api_report_endpoint (__main__.TestV3SystemIntegration) ... ok
test_11_malformed_request_handling (__main__.TestV3SystemIntegration) ... ok
test_12_deterministic_reproducibility (__main__.TestV3SystemIntegration) ... ok
test_13_exact_wg_stacker_equivalence (__main__.TestV3SystemIntegration) ... ok

----------------------------------------------------------------------
Ran 13 tests in 3.107s — OK
```

---

## 4. API Endpoints Specification (`/api/v3/*`)

### A. POST `/api/v3/predict`
Executes dynamic scientific modality routing and model inference.

**Request JSON Payload:**
```json
{
  "patient_id": "P_1001",
  "clinical_data": {
    "Age": 52, "Gender": "Male", "Height_cm": 175, "Weight_kg": 85,
    "BMI": 27.75, "Waist_Circumference_cm": 94, "Systolic_BP": 130,
    "Diastolic_BP": 84, "Fasting_Blood_Glucose": 115, "HbA1c": 5.9,
    "Triglycerides": 175, "HDL_Cholesterol": 42, "LDL_Cholesterol": 130,
    "ALT": 32, "AST": 28, "Family_History_Diabetes": 1,
    "Family_History_Hypertension": 1, "Family_History_CVD": 0
  },
  "wearable_data": {
    "Average_Daily_Steps": 6500, "Active_Minutes": 35,
    "Sedentary_Time_Minutes": 480, "Resting_Heart_Rate": 72,
    "Heart_Rate_Variability_RMSSD": 38, "Sleep_Duration_Hours": 6.8,
    "Sleep_Efficiency_Score": 82, "Autonomic_Stress_Score": 45,
    "Activity_Energy_Expenditure": 420, "Exercise_Frequency_Days": 3
  },
  "gut_data": null
}
```

**Response JSON Structure:**
```json
{
  "patient_id": "P_1001",
  "pipeline_version": "v3.2.3",
  "routing_metadata": {
    "modalities_supplied": ["clinical", "wearable"],
    "effective_pathway": "C+W",
    "primary_decision_anchor": "Clinical_v3",
    "cgm_status": "IMPUTED_NO_CGM",
    "imputed_features_by_modality": {
      "clinical": [],
      "wearable": ["CGM_Average_Glucose", "CGM_Glucose_CV", "CGM_Time_In_Range", "CGM_Time_Above_Range", "CGM_Time_Below_Range"]
    }
  },
  "predictions": {
    "Type2_Diabetes": {
      "calibrated_probability": 0.2240,
      "predicted_class": 0,
      "threshold_used": 0.29,
      "risk_level": "Low Risk",
      "primary_source_expert": "Clinical_v3"
    }
  }
}
```

### B. POST `/api/v3/xai`
Generates TreeSHAP feature attributions. Output labeled as **"Statistical Predictor Contributions"** with causality disclaimer.

### C. POST `/api/v3/report`
Generates clinical narrative report in Markdown format from read-only ML probabilities.

---

## 5. Modality Routing Behavior & Missing Data Strategy

| Supplied Inputs | Mask | Pathway | Primary Decision Engine | Imputation & CGM Behavior |
| :---: | :---: | :---: | :--- | :--- |
| Clinical only | `C` | `C` | `Clinical_v3` | Standard scaling; missing features filled with medians. |
| Wearable only | `W` | `W` | `Wearable_v3` | 15D LightGBM; if CGM missing, imputed with medians (`IMPUTED_NO_CGM`). |
| Gut only | `G` | `G` | `Gut_v3` | 20 Taxa RAW relative abundance. |
| Clinical + Wearable | `C+W` | `C+W` | `Clinical_v3` | Clinical anchor dominates; Wearable logged for continuous monitoring. |
| Wearable + Gut | `W+G` | `W+G` | `W+G LR Stacker` | Logistic Regression probability stacker for remote triage without labs. |
| All three | `C+W+G` | `C+W+G` | `Clinical_v3` | Clinical anchor dominates; secondary probabilities logged. |

---

## 6. Rollback & Preservation Procedure

All legacy v1 and v2 models, datasets, routes, and services are preserved in parallel for rollback or comparative auditing:
- **v1 Endpoints:** `/api/v1/*` (Clinical v1, Wearable v1, Gut v1)
- **v2 Endpoints:** `/api/v2/*` (Clinical v2, Gut v2, Fusion v2)
- **v3 Endpoints (Default Active):** `/api/v3/*`

To switch frontend default API client back to v1 or v2 if required for rollback, update `API_BASE` in `web_platform/frontend/src/api/client.js` or `App.jsx`.

---

## 7. Artifact Manifest & Verification

For exact file paths, sizes, tuned thresholds, calibrator details, and cryptographic SHA-256 signatures of all frozen v3 datasets and model payloads, refer to:
- [v3_frozen_baseline_manifest.md](file:///c:/Users/swara/OneDrive/Desktop/TeleMed/v3_frozen_baseline_manifest.md)
