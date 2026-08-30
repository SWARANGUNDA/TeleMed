import sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from expert_models.v3_inference_engine import V3InferenceEngine

def inspect_models():
    engine = V3InferenceEngine()
    print("--- Clinical Payload ---")
    print(f"Features ({len(engine.clinical_payload['features'])}): {engine.clinical_payload['features']}")
    for d, model in engine.clinical_payload['models'].items():
        print(f"  {d}: {type(model).__name__}")

    print("\n--- Wearable Payload ---")
    print(f"Features ({len(engine.wearable_payload['features'])}): {engine.wearable_payload['features']}")
    for d, model in engine.wearable_payload['models'].items():
        print(f"  {d}: {type(model).__name__}")

    print("\n--- Gut Payload ---")
    print(f"Features ({len(engine.gut_payload['features'])}): {engine.gut_payload['features']}")
    for d, model in engine.gut_payload['models'].items():
        print(f"  {d}: {type(model).__name__}")

if __name__ == "__main__":
    inspect_models()
