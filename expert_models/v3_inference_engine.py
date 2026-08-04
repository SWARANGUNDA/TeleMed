"""
v3_inference_engine.py — Core Inference Engine for v3 Expert Models.

Loads and executes frozen v3 model payloads:
- Clinical Expert v3 (18 features)
- Wearable Expert v3 (15D Standard + CGM)
- Gut Expert v3 (20 Taxa RAW)

Strictly uses saved scalers, medians, calibrators (IsotonicRegression), and tuned thresholds.
Does NOT modify or retrain any artifact.
"""

import logging
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s]: %(message)s")
logger = logging.getLogger("v3_inference_engine")

MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
DISEASES = ["Type2_Diabetes", "Prediabetes", "High_Adiposity_Risk", "Metabolic_Syndrome", "NAFLD"]

class V3InferenceEngine:
    def __init__(self, model_dir: Path = MODEL_DIR):
        self.model_dir = Path(model_dir)
        self.clinical_payload = None
        self.wearable_payload = None
        self.gut_payload = None
        self._load_payloads()

    def _load_payloads(self):
        clin_path = self.model_dir / "clinical_v3" / "clinical_v3_payload.joblib"
        wear_path = self.model_dir / "wearable_v3" / "wearable_v3_payload.joblib"
        gut_path  = self.model_dir / "gut_v3" / "gut_v3_payload.joblib"

        if clin_path.exists():
            self.clinical_payload = joblib.load(clin_path)
            logger.info("Loaded Clinical Expert v3 payload successfully.")
        else:
            logger.error(f"Clinical v3 payload not found at {clin_path}")

        if wear_path.exists():
            self.wearable_payload = joblib.load(wear_path)
            logger.info("Loaded Wearable Expert v3 payload (15D) successfully.")
        else:
            logger.error(f"Wearable v3 payload not found at {wear_path}")

        if gut_path.exists():
            self.gut_payload = joblib.load(gut_path)
            logger.info("Loaded Gut Expert v3 payload successfully.")
        else:
            logger.error(f"Gut v3 payload not found at {gut_path}")

    def predict_clinical(self, input_dict: dict) -> dict:
        """
        Executes Clinical v3 expert model.
        Expects a dictionary of 18 clinical features.
        Missing features are imputed using stored training medians.
        """
        if not self.clinical_payload:
            raise RuntimeError("Clinical v3 payload is not loaded.")

        features = self.clinical_payload["features"]
        medians = self.clinical_payload["medians"]
        scaler = self.clinical_payload["scaler"]
        models = self.clinical_payload["models"]
        calibrators = self.clinical_payload["calibrators"]
        thresholds = self.clinical_payload["thresholds"]

        # Build feature array in exact order with imputation
        feature_vals = []
        imputed_features = []
        supplied_features = []

        for f in features:
            val = input_dict.get(f, None)
            if val is None or (isinstance(val, float) and np.isnan(val)):
                med_val = float(medians[f]) if isinstance(medians, (pd.Series, dict)) else float(medians)
                feature_vals.append(med_val)
                imputed_features.append(f)
            else:
                feature_vals.append(float(val))
                supplied_features.append(f)

        X_raw = np.array(feature_vals, dtype=float).reshape(1, -1)
        X_scaled = scaler.transform(X_raw)

        raw_probs = {}
        calibrated_probs = {}
        binary_preds = {}
        risk_levels = {}

        for i, d in enumerate(DISEASES):
            clf = models[i]
            iso = calibrators[i]
            t_opt = thresholds[d]

            raw_p = float(clf.predict_proba(X_scaled)[0, 1])
            cal_p = float(iso.transform([raw_p])[0])
            pred_cls = int(cal_p >= t_opt)

            raw_probs[d] = round(raw_p, 4)
            calibrated_probs[d] = round(cal_p, 4)
            binary_preds[d] = pred_cls
            risk_levels[d] = self._determine_risk_level(cal_p, t_opt)

        return {
            "expert": "Clinical_v3",
            "raw_probabilities": raw_probs,
            "calibrated_probabilities": calibrated_probs,
            "predictions": binary_preds,
            "thresholds": thresholds,
            "risk_levels": risk_levels,
            "supplied_features": supplied_features,
            "imputed_features": imputed_features,
            "scaled_input": X_scaled,
            "raw_input": input_dict
        }

    def predict_wearable(self, input_dict: dict) -> dict:
        """
        Executes Wearable v3 expert model (15D LightGBM).
        Missing features (including CGM) are imputed using stored training medians.
        Explicitly tracks supplied vs imputed features so CGM imputation is never treated as measured.
        """
        if not self.wearable_payload:
            raise RuntimeError("Wearable v3 payload is not loaded.")

        features = self.wearable_payload["features"]
        medians = self.wearable_payload["medians"]
        scaler = self.wearable_payload["scaler"]
        models = self.wearable_payload["models"]
        calibrators = self.wearable_payload["calibrators"]
        thresholds = self.wearable_payload["thresholds"]

        cgm_feature_names = [
            "CGM_Average_Glucose", "CGM_Glucose_CV", "CGM_Time_In_Range",
            "CGM_Time_Above_Range", "CGM_Time_Below_Range"
        ]

        feature_vals = []
        imputed_features = []
        supplied_features = []
        cgm_supplied_count = 0

        for f in features:
            val = input_dict.get(f, None)
            if val is None or (isinstance(val, float) and np.isnan(val)):
                med_val = float(medians[f]) if isinstance(medians, (pd.Series, dict)) else float(medians)
                feature_vals.append(med_val)
                imputed_features.append(f)
            else:
                feature_vals.append(float(val))
                supplied_features.append(f)
                if f in cgm_feature_names:
                    cgm_supplied_count += 1

        X_raw = np.array(feature_vals, dtype=float).reshape(1, -1)
        X_scaled = scaler.transform(X_raw)

        raw_probs = {}
        calibrated_probs = {}
        binary_preds = {}
        risk_levels = {}

        for i, d in enumerate(DISEASES):
            clf = models[i]
            iso = calibrators[i]
            t_opt = thresholds[d]

            raw_p = float(clf.predict_proba(X_scaled)[0, 1])
            cal_p = float(iso.transform([raw_p])[0])
            pred_cls = int(cal_p >= t_opt)

            raw_probs[d] = round(raw_p, 4)
            calibrated_probs[d] = round(cal_p, 4)
            binary_preds[d] = pred_cls
            risk_levels[d] = self._determine_risk_level(cal_p, t_opt)

        cgm_status = "FULL_MEASURED_CGM" if cgm_supplied_count == 5 else ("PARTIAL_MEASURED_CGM" if cgm_supplied_count > 0 else "IMPUTED_NO_CGM")

        return {
            "expert": "Wearable_v3",
            "cgm_status": cgm_status,
            "cgm_supplied_count": cgm_supplied_count,
            "raw_probabilities": raw_probs,
            "calibrated_probabilities": calibrated_probs,
            "predictions": binary_preds,
            "thresholds": thresholds,
            "risk_levels": risk_levels,
            "supplied_features": supplied_features,
            "imputed_features": imputed_features,
            "scaled_input": X_scaled,
            "raw_input": input_dict
        }

    def predict_gut(self, input_dict: dict) -> dict:
        """
        Executes Gut v3 expert model (20 Taxa RAW relative abundance).
        Missing taxa features are imputed using stored training medians.
        """
        if not self.gut_payload:
            raise RuntimeError("Gut v3 payload is not loaded.")

        features = self.gut_payload["features"]
        medians = self.gut_payload["medians"]
        scaler = self.gut_payload["scaler"]
        models = self.gut_payload["models"]
        calibrators = self.gut_payload["calibrators"]
        thresholds = self.gut_payload["thresholds"]

        feature_vals = []
        imputed_features = []
        supplied_features = []

        for f in features:
            val = input_dict.get(f, None)
            if val is None or (isinstance(val, float) and np.isnan(val)):
                med_val = float(medians[f]) if isinstance(medians, (pd.Series, dict)) else float(medians)
                feature_vals.append(med_val)
                imputed_features.append(f)
            else:
                try:
                    num_val = float(val)
                    feature_vals.append(num_val)
                    supplied_features.append(f)
                except (ValueError, TypeError):
                    med_val = float(medians[f]) if isinstance(medians, (pd.Series, dict)) else float(medians)
                    feature_vals.append(med_val)
                    imputed_features.append(f)

        X_raw = np.array(feature_vals, dtype=float).reshape(1, -1)
        X_scaled = scaler.transform(X_raw)

        raw_probs = {}
        calibrated_probs = {}
        binary_preds = {}
        risk_levels = {}

        for i, d in enumerate(DISEASES):
            clf = models[i]
            iso = calibrators[i]
            t_opt = thresholds[d]

            raw_p = float(clf.predict_proba(X_scaled)[0, 1])
            cal_p = float(iso.transform([raw_p])[0])
            pred_cls = int(cal_p >= t_opt)

            raw_probs[d] = round(raw_p, 4)
            calibrated_probs[d] = round(cal_p, 4)
            binary_preds[d] = pred_cls
            risk_levels[d] = self._determine_risk_level(cal_p, t_opt)

        return {
            "expert": "Gut_v3",
            "raw_probabilities": raw_probs,
            "calibrated_probabilities": calibrated_probs,
            "predictions": binary_preds,
            "thresholds": thresholds,
            "risk_levels": risk_levels,
            "supplied_features": supplied_features,
            "imputed_features": imputed_features,
            "scaled_input": X_scaled,
            "raw_input": input_dict
        }

    def _determine_risk_level(self, prob: float, threshold: float) -> str:
        if prob < threshold * 0.7:
            return "Low Risk"
        elif prob < threshold:
            return "Borderline Risk"
        elif prob < threshold * 1.3:
            return "Moderate Risk"
        else:
            return "High Risk"
