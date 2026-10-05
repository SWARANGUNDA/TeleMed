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
        
        mods = [f"{m.capitalize()}_{d}" for m in active_mods for d in config.TARGET_DISEASES]
        X_df = pd.DataFrame(X_fusion, columns=mods)

        for disease in config.TARGET_DISEASES:
            model = models[disease]
            scaler = scalers[disease]
            t = float(thresholds[disease])
            
            clf_type = model.__class__.__name__
            if clf_type == "LogisticRegression":
                # Ensure we pass dataframe to scaler to prevent warning and ensure correct scaling
                X_in = scaler.transform(X_df)
                # But LogisticRegression expects numpy array if it was trained on scaled numpy array or dataframe.
                X_in_df = pd.DataFrame(X_in, columns=mods)
            else:
                X_in_df = X_df
                
            prob = float(model.predict_proba(X_in_df)[0, 1])
            pred = int(prob >= t)
            
            results[disease] = {
                "probability": round(prob, 4),
                "prediction": pred,
                "threshold": round(t, 4),
                "pathway": pathway_key,
            }

        return results
