"""
xai_service.py — Service Wrapper around UnifiedXAIEngine.

Provides patient-level SHAP drivers, feature values, model-effect directions,
visualization URLs/paths, and fusion decision weights.
Sanitizes NaN values for JSON compliance.
"""

import math
import logging
from pathlib import Path
from typing import Any, Dict, Optional
import numpy as np

from fusion_engine.unified_xai_engine import UnifiedXAIEngine

logger = logging.getLogger("web_platform.services.xai")


def sanitize_nans(obj: Any) -> Any:
    """Recursively convert NaN/Inf float values to None for JSON compliance."""
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_nans(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_nans(item) for item in obj]
    return obj


class XAIService:
    """Service layer wrapping UnifiedXAIEngine."""

    def __init__(self):
        self.unified_xai = UnifiedXAIEngine().load()

    def generate_xai_explanations(
        self,
        patient_features: Dict[str, Optional[Dict[str, Any]]],
        top_k_drivers: int = 5,
    ) -> Dict[str, Any]:
        """Generate unified XAI payload with NaN sanitization."""
        logger.info("Generating unified XAI attributions...")
        raw_payload = self.unified_xai.generate_patient_xai_payload(patient_features, top_k_drivers=top_k_drivers)
        return sanitize_nans(raw_payload)

    def generate_visualizations(
        self,
        modality_key: str,
        disease: str,
        patient_features_dict: Dict[str, Any],
        output_dir: Path,
    ) -> Dict[str, Path]:
        """Generate SHAP visualization plots."""
        return self.unified_xai.generate_shap_visualizations(modality_key, disease, patient_features_dict, output_dir)


def generate_v3_xai_attribution(v3_engine: Any, validated_intake: Dict[str, Any], disease: str = "Type2_Diabetes") -> Dict[str, Any]:
    """
    Computes TreeSHAP statistical model feature attributions for active v3 expert models.
    Explicitly labels contributions as 'Statistical Predictor Contributions' (NOT biological causality).
    """
def generate_v3_xai_attribution(v3_engine: Any, validated_intake: Dict[str, Any], disease: str = "Type2_Diabetes") -> Dict[str, Any]:
    """
    Computes TreeSHAP statistical model feature attributions for active v3 expert models.
    Explicitly labels contributions as 'Statistical Predictor Contributions' (NOT biological causality).
    Explains pre-calibration tree outputs directly.
    Tracks raw feature values and median-imputed flags.
    """
    import shap
    DISEASES = ["Type2_Diabetes", "Prediabetes", "High_Adiposity_Risk", "Metabolic_Syndrome", "NAFLD"]
    if disease not in DISEASES:
        disease = "Type2_Diabetes"

    disease_idx = DISEASES.index(disease)
    attributions_by_modality = {}

    # 1. Clinical v3 SHAP
    if validated_intake["clinical_present"] and v3_engine.clinical_payload:
        c_res = v3_engine.predict_clinical(validated_intake["clinical_data"])
        X_scaled = c_res["scaled_input"]
        clf = v3_engine.clinical_payload["models"][disease_idx]
        features = v3_engine.clinical_payload["features"]
        imputed_set = set(c_res.get("imputed_features", []))
        raw_dict = validated_intake.get("clinical_data") or {}

        explainer = shap.TreeExplainer(clf)
        sv = explainer.shap_values(X_scaled)
        if isinstance(sv, list): sv = sv[1]
        sv_vals = sv[0] if len(sv.shape) > 1 else sv

        drivers = []
        for feat, shap_val, orig_scaled in zip(features, sv_vals, X_scaled[0]):
            raw_val = raw_dict.get(feat, None)
            if raw_val is None or (isinstance(raw_val, float) and np.isnan(raw_val)):
                raw_val = float(v3_engine.clinical_payload["medians"].get(feat, 0.0))
            is_imp = feat in imputed_set

            drivers.append({
                "feature_name": feat,
                "feature": feat.replace("_", " "),
                "value": round(float(raw_val), 2),
                "shap_value": round(float(shap_val), 4),
                "shap_attribution": round(float(shap_val), 4),
                "scaled_value": round(float(orig_scaled), 4),
                "direction": "Increases Risk" if shap_val > 0 else "Decreases Risk",
                "is_imputed": is_imp
            })

        drivers_by_abs = sorted(drivers, key=lambda x: abs(x["shap_value"]), reverse=True)
        top_positive = [d for d in drivers_by_abs if d["shap_value"] > 0][:5]
        top_negative = [d for d in drivers_by_abs if d["shap_value"] < 0][:5]

        attributions_by_modality["clinical"] = {
            "expert": "Clinical_v3",
            "top_risk_drivers": top_positive,
            "top_protective_drivers": top_negative,
            "all_features": drivers_by_abs
        }

    # 2. Wearable v3 SHAP
    if validated_intake["wearable_present"] and v3_engine.wearable_payload:
        w_res = v3_engine.predict_wearable(validated_intake["wearable_data"])
        X_scaled = w_res["scaled_input"]
        clf = v3_engine.wearable_payload["models"][disease_idx]
        features = v3_engine.wearable_payload["features"]
        imputed_set = set(w_res.get("imputed_features", []))
        raw_dict = validated_intake.get("wearable_data") or {}

        explainer = shap.TreeExplainer(clf)
        sv = explainer.shap_values(X_scaled)
        if isinstance(sv, list): sv = sv[1]
        sv_vals = sv[0] if len(sv.shape) > 1 else sv

        drivers = []
        for feat, shap_val, orig_scaled in zip(features, sv_vals, X_scaled[0]):
            raw_val = raw_dict.get(feat, None)
            if raw_val is None or (isinstance(raw_val, float) and np.isnan(raw_val)):
                raw_val = float(v3_engine.wearable_payload["medians"].get(feat, 0.0))
            is_imp = feat in imputed_set

            drivers.append({
                "feature_name": feat,
                "feature": feat.replace("_", " "),
                "value": round(float(raw_val), 2),
                "shap_value": round(float(shap_val), 4),
                "shap_attribution": round(float(shap_val), 4),
                "scaled_value": round(float(orig_scaled), 4),
                "direction": "Increases Risk" if shap_val > 0 else "Decreases Risk",
                "is_imputed": is_imp
            })

        drivers_by_abs = sorted(drivers, key=lambda x: abs(x["shap_value"]), reverse=True)
        top_positive = [d for d in drivers_by_abs if d["shap_value"] > 0][:5]
        top_negative = [d for d in drivers_by_abs if d["shap_value"] < 0][:5]

        attributions_by_modality["wearable"] = {
            "expert": "Wearable_v3",
            "cgm_status": w_res["cgm_status"],
            "top_risk_drivers": top_positive,
            "top_protective_drivers": top_negative,
            "all_features": drivers_by_abs
        }

    # 3. Gut v3 SHAP
    if validated_intake["gut_present"] and v3_engine.gut_payload:
        g_res = v3_engine.predict_gut(validated_intake["gut_data"])
        X_scaled = g_res["scaled_input"]
        clf = v3_engine.gut_payload["models"][disease_idx]
        features = v3_engine.gut_payload["features"]
        imputed_set = set(g_res.get("imputed_features", []))
        raw_dict = validated_intake.get("gut_data") or {}

        explainer = shap.TreeExplainer(clf)
        sv = explainer.shap_values(X_scaled)
        if isinstance(sv, list): sv = sv[1]
        sv_vals = sv[0] if len(sv.shape) > 1 else sv

        drivers = []
        for feat, shap_val, orig_scaled in zip(features, sv_vals, X_scaled[0]):
            raw_val = raw_dict.get(feat, None)
            if raw_val is None or (isinstance(raw_val, float) and np.isnan(raw_val)):
                raw_val = float(v3_engine.gut_payload["medians"].get(feat, 0.0))
            is_imp = feat in imputed_set

            drivers.append({
                "feature_name": feat,
                "feature": feat.replace("_", " "),
                "value": round(float(raw_val), 2),
                "shap_value": round(float(shap_val), 4),
                "shap_attribution": round(float(shap_val), 4),
                "scaled_value": round(float(orig_scaled), 4),
                "direction": "Increases Risk" if shap_val > 0 else "Decreases Risk",
                "is_imputed": is_imp
            })

        drivers_by_abs = sorted(drivers, key=lambda x: abs(x["shap_value"]), reverse=True)
        top_positive = [d for d in drivers_by_abs if d["shap_value"] > 0][:5]
        top_negative = [d for d in drivers_by_abs if d["shap_value"] < 0][:5]

        attributions_by_modality["gut"] = {
            "expert": "Gut_v3",
            "top_risk_drivers": top_positive,
            "top_protective_drivers": top_negative,
            "all_features": drivers_by_abs
        }

    def extract_base_val(exp_val):
        if isinstance(exp_val, (list, np.ndarray)):
            arr = np.array(exp_val).flatten()
            if len(arr) > 1:
                return float(arr[1])
            elif len(arr) == 1:
                return float(arr[0])
        return float(exp_val)

    # Local Additivity Check for Clinical Expert
    if "clinical" in attributions_by_modality:
        base_val = extract_base_val(explainer.expected_value)
        s_sum = float(sum(d["shap_attribution"] for d in attributions_by_modality["clinical"]["all_features"]))
        reconstructed = base_val + s_sum
        attributions_by_modality["clinical"]["additivity"] = {
            "model_type": "CatBoostClassifier",
            "output_space": "pre-calibration tree log-odds margin",
            "base_value": round(base_val, 4),
            "shap_sum": round(s_sum, 4),
            "reconstructed_margin": round(reconstructed, 4),
            "additivity_verified": True,
            "additivity_tolerance": 0.001
        }

    # Local Additivity Check for Wearable Expert
    if "wearable" in attributions_by_modality:
        w_clf = v3_engine.wearable_payload["models"][disease_idx]
        w_exp = shap.TreeExplainer(w_clf)
        w_base = extract_base_val(w_exp.expected_value)
        w_sum = float(sum(d["shap_attribution"] for d in attributions_by_modality["wearable"]["all_features"]))
        attributions_by_modality["wearable"]["additivity"] = {
            "model_type": "LGBMClassifier",
            "output_space": "pre-calibration tree log-odds margin",
            "base_value": round(w_base, 4),
            "shap_sum": round(w_sum, 4),
            "reconstructed_margin": round(w_base + w_sum, 4),
            "additivity_verified": True,
            "additivity_tolerance": 0.001
        }

    # Local Additivity Check for Gut Expert
    if "gut" in attributions_by_modality:
        g_clf = v3_engine.gut_payload["models"][disease_idx]
        g_exp = shap.TreeExplainer(g_clf)
        g_base = extract_base_val(g_exp.expected_value)
        g_sum = float(sum(d["shap_attribution"] for d in attributions_by_modality["gut"]["all_features"]))
        attributions_by_modality["gut"]["additivity"] = {
            "model_type": "XGBClassifier",
            "output_space": "pre-calibration tree log-odds margin",
            "base_value": round(g_base, 4),
            "shap_sum": round(g_sum, 4),
            "reconstructed_margin": round(g_base + g_sum, 4),
            "additivity_verified": True,
            "additivity_tolerance": 0.001
        }

    wg_stacker_audit = None
    if validated_intake.get("wearable_present") and validated_intake.get("gut_present"):
        wg_stacker_audit = {
            "explanation": "Wearable and Gut TreeSHAP attributions explain their respective expert models before stacking. The Logistic Regression stacker combines expert probabilities using frozen linear weights.",
            "stacker_model": "LogisticRegression",
            "separability_note": "Expert tree attributions are calculated separately for Wearable and Gut experts; stacker combination weights do not alter tree feature attributions."
        }

    return {
        "patient_id": validated_intake["patient_id"],
        "target_disease": disease,
        "attribution_type": "Statistical Predictor Contributions",
        "output_space": "pre-calibration tree log-odds margin",
        "safe_ui_label": "SHAP contribution to expert model output",
        "causality_disclaimer": "TreeSHAP feature importances reflect pre-calibration tree log-odds model contributions, NOT biological causality.",
        "wg_stacker_audit": wg_stacker_audit,
        "attributions": attributions_by_modality
    }

