"""
v3_scientific_router.py — Dynamic Modality Scientific Router for Unified Multimodal v3.

Implements the verified evidence-based routing strategy:
1. Clinical-Anchor Routing (when Clinical data is present):
   - Uses Clinical Expert v3 as the primary diagnostic anchor (captures 99.94% of max ROC-AUC).
   - If Wearable or Gut is present, executes them to log telemetry metrics, but keeps Clinical v3 as primary risk score provider.
2. Remote Multiomics Triage ($W+G$ without Clinical):
   - Combines Wearable v3 (15D) and Gut v3 (20 Taxa RAW) using Logistic Regression probability stacking.
   - Provides verified NAFLD ROC-AUC gain (+0.0364, p < 0.0001).
3. Standalone Wearable ($W$):
   - Executes Wearable v3 15D model with median imputation for missing CGM/features.
4. Standalone Gut ($G$):
   - Executes Gut v3 20 Taxa RAW model.
"""

import logging
from pathlib import Path
from typing import Dict, Any, List
import numpy as np
import joblib

from expert_models.v3_inference_engine import V3InferenceEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s]: %(message)s")
logger = logging.getLogger("v3_scientific_router")

DISEASES = ["Type2_Diabetes", "Prediabetes", "High_Adiposity_Risk", "Metabolic_Syndrome", "NAFLD"]
STACKER_PATH = Path(__file__).resolve().parent.parent / "expert_models" / "saved_models" / "fusion_v3" / "wg_logistic_regression_stacker.joblib"

class V3ScientificRouter:
    def __init__(self, inference_engine: V3InferenceEngine):
        self.engine = inference_engine
        self.wg_stacker_payload = None
        self._load_wg_stacker()

    def _load_wg_stacker(self):
        if STACKER_PATH.exists():
            self.wg_stacker_payload = joblib.load(STACKER_PATH)
            logger.info("Loaded exact frozen W+G Logistic Regression stacker artifact successfully.")
        else:
            logger.warning(f"W+G stacker artifact not found at {STACKER_PATH}. Will fallback to expert max.")

    def route_and_predict(self, validated_intake: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes dynamic modality routing based on validated intake structure.
        """
        patient_id = validated_intake["patient_id"]
        modality_mask = validated_intake["modality_mask"]
        supplied_mods = validated_intake["modalities_supplied"]
        missing_mods  = validated_intake["missing_modalities"]

        c_present = validated_intake["clinical_present"]
        w_present = validated_intake["wearable_present"]
        g_present = validated_intake["gut_present"]

        c_res = None
        w_res = None
        g_res = None

        if c_present:
            c_res = self.engine.predict_clinical(validated_intake["clinical_data"])
        if w_present:
            w_res = self.engine.predict_wearable(validated_intake["wearable_data"])
        if g_present:
            g_res = self.engine.predict_gut(validated_intake["gut_data"])

        # Determine effective scientific pathway & primary decision engine
        if c_present:
            effective_pathway = f"C{'+W' if w_present else ''}{'+G' if g_present else ''}"
            primary_anchor = "Clinical_v3"
            decision_results = self._build_clinical_anchor_results(c_res, w_res, g_res)
        elif w_present and g_present:
            effective_pathway = "W+G"
            primary_anchor = "Wearable+Gut_LogisticRegression_Stacker"
            decision_results = self._build_wg_stacked_results(w_res, g_res)
        elif w_present and not g_present:
            effective_pathway = "W"
            primary_anchor = "Wearable_v3_Standalone"
            decision_results = self._build_single_expert_results(w_res)
        elif g_present and not w_present:
            effective_pathway = "G"
            primary_anchor = "Gut_v3_Standalone"
            decision_results = self._build_single_expert_results(g_res)
        else:
            raise ValueError("At least one modality (clinical, wearable, or gut) must contain valid features for prediction.")

        # Determine overall CGM status
        cgm_status = w_res["cgm_status"] if w_res else "NO_WEARABLE_DATA"

        return {
            "patient_id": patient_id,
            "pipeline_version": "v3.3",
            "model_version": "v3.3",
            "routing_metadata": {
                "pipeline_version": "v3.3",
                "model_version": "v3.3",
                "modalities_supplied": supplied_mods,
                "modalities_used": self._get_used_modalities(c_present, w_present, g_present),
                "missing_modalities": missing_mods,
                "modality_mask": modality_mask,
                "effective_pathway": effective_pathway,
                "primary_decision_anchor": primary_anchor,
                "cgm_status": cgm_status,
                "imputed_features_by_modality": {
                    "clinical": c_res["imputed_features"] if c_res else [],
                    "wearable": w_res["imputed_features"] if w_res else [],
                    "gut": g_res["imputed_features"] if g_res else []
                }
            },
            "predictions": decision_results,
            "expert_outputs": {
                "clinical": self._sanitize_expert_output(c_res),
                "wearable": self._sanitize_expert_output(w_res),
                "gut": self._sanitize_expert_output(g_res)
            }
        }

    @staticmethod
    def _sanitize_expert_output(res: dict) -> dict:
        """Remove non-JSON-serializable objects (numpy arrays, pandas Series) from expert output."""
        if res is None:
            return None
        import pandas as pd
        clean = {}
        for k, v in res.items():
            if k == "scaled_input":
                continue  # Strip numpy arrays from API response
            elif isinstance(v, np.ndarray):
                clean[k] = v.tolist()
            elif isinstance(v, pd.Series):
                clean[k] = v.to_dict()
            elif isinstance(v, dict):
                # Recursively clean nested dicts
                inner = {}
                for ik, iv in v.items():
                    if isinstance(iv, (np.ndarray,)):
                        inner[ik] = iv.tolist()
                    elif isinstance(iv, pd.Series):
                        inner[ik] = iv.to_dict()
                    elif isinstance(iv, (np.floating, np.integer)):
                        inner[ik] = float(iv) if isinstance(iv, np.floating) else int(iv)
                    else:
                        inner[ik] = iv
                clean[k] = inner
            elif isinstance(v, (np.floating, np.integer)):
                clean[k] = float(v) if isinstance(v, np.floating) else int(v)
            else:
                clean[k] = v
        return clean

    def _get_used_modalities(self, c: bool, w: bool, g: bool) -> List[str]:
        mods = []
        if c: mods.append("clinical")
        if w: mods.append("wearable")
        if g: mods.append("gut")
        return mods

    def _build_clinical_anchor_results(self, c_res: dict, w_res: dict = None, g_res: dict = None) -> dict:
        """
        Uses Clinical v3 probabilities and decisions as the primary diagnostic anchor.
        """
        results = {}
        for d in DISEASES:
            c_p = c_res["calibrated_probabilities"][d]
            c_pred = c_res["predictions"][d]
            c_t = c_res["thresholds"][d]
            c_risk = c_res["risk_levels"][d]

            results[d] = {
                "calibrated_probability": c_p,
                "predicted_class": c_pred,
                "threshold_used": c_t,
                "risk_level": c_risk,
                "primary_source_expert": "Clinical_v3",
                "secondary_prob_wearable": w_res["calibrated_probabilities"][d] if w_res else None,
                "secondary_prob_gut": g_res["calibrated_probabilities"][d] if g_res else None
            }
        return results

    def _build_wg_stacked_results(self, w_res: dict, g_res: dict) -> dict:
        """
        Applies exact frozen Logistic Regression probability stacking for W+G remote triage.
        """
        results = {}
        models = self.wg_stacker_payload["models"] if self.wg_stacker_payload else None
        calibrators = self.wg_stacker_payload["calibrators"] if self.wg_stacker_payload else None
        thresholds = self.wg_stacker_payload["thresholds"] if self.wg_stacker_payload else w_res["thresholds"]

        for d_idx, d in enumerate(DISEASES):
            pw = w_res["calibrated_probabilities"][d]
            pg = g_res["calibrated_probabilities"][d]

            if models and calibrators:
                clf = models[d_idx]
                iso = calibrators[d_idx]
                t_opt = thresholds[d]

                input_pair = np.array([[pw, pg]], dtype=float)
                raw_stack_p = float(clf.predict_proba(input_pair)[0, 1])
                fused_p = float(iso.transform([raw_stack_p])[0])
                fused_p = round(float(np.clip(fused_p, 0.0, 1.0)), 4)
                pred_cls = int(fused_p >= t_opt)
            else:
                # Direct average fallback
                fused_p = round(float((pw + pg) / 2.0), 4)
                t_opt = w_res["thresholds"][d]
                pred_cls = int(fused_p >= t_opt)

            results[d] = {
                "calibrated_probability": fused_p,
                "predicted_class": pred_cls,
                "threshold_used": t_opt,
                "risk_level": self._determine_risk_level(fused_p, t_opt),
                "primary_source_expert": "Wearable+Gut_LogisticRegression_Stacker",
                "secondary_prob_wearable": pw,
                "secondary_prob_gut": pg
            }
        return results

    def _build_single_expert_results(self, exp_res: dict) -> dict:
        results = {}
        for d in DISEASES:
            results[d] = {
                "calibrated_probability": exp_res["calibrated_probabilities"][d],
                "predicted_class": exp_res["predictions"][d],
                "threshold_used": exp_res["thresholds"][d],
                "risk_level": exp_res["risk_levels"][d],
                "primary_source_expert": exp_res["expert"]
            }
        return results

    def _determine_risk_level(self, prob: float, threshold: float) -> str:
        if prob < threshold * 0.7:
            return "Low Risk"
        elif prob < threshold:
            return "Borderline Risk"
        elif prob < threshold * 1.3:
            return "Moderate Risk"
        else:
            return "High Risk"
