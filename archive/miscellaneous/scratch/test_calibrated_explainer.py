import sys
import numpy as np
import shap

sys.path.insert(0, '.')
from expert_models.v3_inference_engine import V3InferenceEngine

eng = V3InferenceEngine()

print("--- Clinical Models ---")
for k, m in eng.clinical_payload.get("models", {}).items():
    print(f"Key [{k}]: type={type(m)}")
    if hasattr(m, "calibrated_classifiers_"):
        for cc in m.calibrated_classifiers_:
            print("  Calibrated sub-estimator:", type(getattr(cc, 'estimator', getattr(cc, 'base_estimator', cc))))

print("\n--- Wearable Models ---")
for k, m in eng.wearable_payload.get("models", {}).items():
    print(f"Key [{k}]: type={type(m)}")
    if hasattr(m, "calibrated_classifiers_"):
        for cc in m.calibrated_classifiers_:
            print("  Calibrated sub-estimator:", type(getattr(cc, 'estimator', getattr(cc, 'base_estimator', cc))))

print("\n--- Gut Models ---")
for k, m in eng.gut_payload.get("models", {}).items():
    print(f"Key [{k}]: type={type(m)}")
