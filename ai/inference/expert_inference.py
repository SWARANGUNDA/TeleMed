import logging
from typing import Any, Dict, Union
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

from ai.config import expert_config as config

logger = logging.getLogger("expert_models.inference")

class ExpertInferenceEngine:
    def __init__(self, expert_name: str, version: str = config.EXPERT_VERSION):
        self.expert_name = expert_name
        self.version = version
        self.artifacts: Dict[str, Any] = {}
        self.is_loaded: bool = False

    def load(self) -> "ExpertInferenceEngine":
        v4_path = config.BASE_DIR / "expert_models" / "v4_artifacts" / f"{self.expert_name}_v4_expert_payload.joblib"
        if not v4_path.exists():
            raise FileNotFoundError(f"V4 Expert Payload missing: {v4_path}")
        self.artifacts = joblib.load(v4_path)
        self.is_loaded = True
        return self

    def predict(
        self,
        features_input: Union[Dict[str, Any], pd.DataFrame]
    ) -> Dict[str, Dict[str, Union[float, int]]]:
        if not self.is_loaded:
            self.load()

        feature_order = self.artifacts.get("feature_order") or self.artifacts.get("features", [])
        models = self.artifacts["models"]
        scalers = self.artifacts.get("scalers", self.artifacts.get("scaler"))
        thresholds = self.artifacts.get("thresholds", {d: 0.5 for d in config.TARGET_DISEASES})
        medians = self.artifacts.get("medians", {})

        if isinstance(features_input, dict):
            df_in = pd.DataFrame([features_input])
        else:
            df_in = features_input.copy()

        for col in feature_order:
            if col not in df_in.columns or df_in[col].isna().all():
                df_in[col] = medians.get(col, 0.0)

        df_ordered = df_in[feature_order].copy()
        
        results: Dict[str, Dict[str, Union[float, int]]] = {}
        
        for disease in config.TARGET_DISEASES:
            model = models[disease]
            scaler = scalers[disease] if isinstance(scalers, dict) else scalers
            t = float(thresholds[disease]) if isinstance(thresholds, dict) else float(thresholds)
            
            clf_name = type(model).__name__
            if clf_name in ("LGBMClassifier", "RandomForestClassifier", "XGBClassifier", "ExtraTreesClassifier", "DecisionTreeClassifier"):
                eval_input = df_ordered
            else:
                eval_input = scaler.transform(df_ordered)
            
            prob = float(model.predict_proba(eval_input)[0, 1])
            pred = int(prob >= t)
            
            results[disease] = {
                "probability": round(prob, 4),
                "prediction": pred,
                "threshold": round(t, 4)
            }
            
        return results
