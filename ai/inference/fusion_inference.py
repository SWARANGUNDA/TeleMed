import logging
import joblib
import pandas as pd
from typing import Any, Dict, Optional, Union

from ai.config import fusion_config as config
from .expert_inference import ExpertInferenceEngine
from .adaptive_router import assemble_fusion_input, detect_available_modalities

logger = logging.getLogger("fusion_engine.inference")

MAP = {
    "C": "Clinical_Only",
    "W": "Wearable_Only",
    "G": "Gut_Only",
    "C+W": "Clinical_Wearable",
    "C+G": "Clinical_Gut",
    "W+G": "Wearable_Gut",
    "C+W+G": "Full_Multimodal_Fusion"
}

class FusionInferenceEngine:
    def __init__(self, fusion_version: str = config.FUSION_VERSION):
        self.fusion_version = fusion_version
        self.expert_engines: Dict[str, ExpertInferenceEngine] = {}
        self.artifacts: Dict[str, Any] = {}
        self.is_loaded: bool = False

    def load(self) -> "FusionInferenceEngine":
        for mod_key in config.MODALITY_KEYS:
            mod_info = config.MODALITY_EXPERT_MAP[mod_key]
            engine = ExpertInferenceEngine(
                expert_name=mod_info["expert_name"],
                version=mod_info["version"],
            )
            engine.load()
            self.expert_engines[mod_key] = engine

        v4_path = config.BASE_DIR / "fusion_engine" / "v4_artifacts" / "v4_multimodal_fusion_payload.joblib"
        if not v4_path.exists():
            raise FileNotFoundError(f"V4 Fusion Payload missing: {v4_path}")
            
        self.artifacts = joblib.load(v4_path)
        self.is_loaded = True
        return self

    def predict(
        self,
        patient_features: Dict[str, Optional[Dict[str, Any]]],
    ) -> Dict[str, Dict[str, Union[float, int]]]:
        if not self.is_loaded:
            self.load()

        expert_outputs: Dict[str, Optional[Dict]] = {}
        for mod_key in config.MODALITY_KEYS:
            features = patient_features.get(mod_key)
            if features is not None and len(features) > 0:
                expert_outputs[mod_key] = self.expert_engines[mod_key].predict(features)
            else:
                expert_outputs[mod_key] = None

        pathway_key, active_mods = detect_available_modalities(expert_outputs)
        comb_name = MAP[pathway_key]
        X_fusion = assemble_fusion_input(expert_outputs, active_mods)

        results = {}
        models = self.artifacts["meta_models"][comb_name]
        scalers = self.artifacts["scalers"][comb_name]
        thresholds = self.artifacts["thresholds"][comb_name]
        
        mods = [m.capitalize() for m in active_mods]

        for disease in config.TARGET_DISEASES:
            model = models.get(disease) or models.get("High_Adiposity_Risk" if disease == "Obesity" else disease)
            scaler = scalers.get(disease) or scalers.get("High_Adiposity_Risk" if disease == "Obesity" else disease)
            t = float(thresholds.get(disease, thresholds.get("High_Adiposity_Risk" if disease == "Obesity" else disease, 0.5)))
            
            # Extract probability for this disease from each active modality
            d_probs = {}
            for m in active_mods:
                m_cap = m.capitalize()
                out_m = expert_outputs.get(m, {})
                d_entry = out_m.get(disease) or out_m.get("High_Adiposity_Risk" if disease == "Obesity" else "Obesity", {})
                d_probs[m_cap] = [float(d_entry.get("probability", 0.0))]
            
            X_disease_df = pd.DataFrame(d_probs, columns=mods)
            
            if scaler is not None:
                X_in = scaler.transform(X_disease_df)
                X_in_df = pd.DataFrame(X_in, columns=mods)
            else:
                X_in_df = X_disease_df
                
            prob = float(model.predict_proba(X_in_df)[0, 1])
            pred = int(prob >= t)
            
            results[disease] = {
                "probability": round(prob, 4),
                "prediction": pred,
                "threshold": round(t, 4),
                "pathway": pathway_key,
            }

        if "High_Adiposity_Risk" in results and "Obesity" not in results:
            results["Obesity"] = results["High_Adiposity_Risk"]
        elif "Obesity" in results and "High_Adiposity_Risk" not in results:
            results["High_Adiposity_Risk"] = results["Obesity"]

        # CLINICAL OVERRIDE: Anthropometric Ground Truth Anchor for Adiposity & Obesity
        clin_data = patient_features.get("clinical") or {}
        try:
            raw_bmi = float(clin_data.get("BMI") or 0.0)
            if raw_bmi == 0.0 and float(clin_data.get("Weight") or 0.0) > 0 and float(clin_data.get("Height") or 0.0) > 0:
                h_m = float(clin_data["Height"]) / 100.0 if float(clin_data["Height"]) > 3.0 else float(clin_data["Height"])
                raw_bmi = float(clin_data["Weight"]) / (h_m * h_m)
        except (ValueError, TypeError):
            raw_bmi = 0.0

        if raw_bmi >= 30.0 and "High_Adiposity_Risk" in results:
            cur_p = results["High_Adiposity_Risk"]["probability"]
            if cur_p < 0.65 or results["High_Adiposity_Risk"]["prediction"] == 0:
                target_p = max(cur_p, 0.88 if raw_bmi >= 35.0 else 0.72)
                results["High_Adiposity_Risk"]["probability"] = round(target_p, 4)
                results["High_Adiposity_Risk"]["prediction"] = 1
                results["High_Adiposity_Risk"]["clinical_override"] = f"Anchored to Clinical Obesity Criteria (BMI {raw_bmi:.1f} >= 30.0 kg/m²)"

        return results
