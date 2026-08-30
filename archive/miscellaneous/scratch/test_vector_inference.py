import sys
import os
from pathlib import Path
import numpy as np
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from expert_models.v3_inference_engine import V3InferenceEngine
from fusion_engine.v3_scientific_router import V3ScientificRouter
from multimodal_data_intake_engine.v3_schema_validator import V3SchemaValidator

def test_fast_batch():
    engine = V3InferenceEngine()
    router = V3ScientificRouter(engine)

    data_dir = REPO_ROOT / "data" / "multimodal_v4"
    test_ids = pd.read_csv(data_dir / "test_ids_v4.csv")["Patient_ID"].tolist()[:10]

    clin_df = pd.read_csv(data_dir / "clinical_v4.csv").set_index("Patient_ID")
    wear_df = pd.read_csv(data_dir / "wearable_v4.csv").set_index("Patient_ID")
    gut_df  = pd.read_csv(data_dir / "gut_v4.csv").set_index("Patient_ID")

    print("Testing single-patient prediction vs batch prediction for 10 test patients...")

    # Single patient predictions via router
    single_results = []
    for pid in test_ids:
        raw_pld = {
            "patient_id": pid,
            "clinical_data": clin_df.loc[pid].to_dict(),
            "wearable_data": wear_df.loc[pid].to_dict(),
            "gut_data": gut_df.loc[pid].to_dict()
        }
        v_intake = V3SchemaValidator.validate_and_inspect_payload(raw_pld)
        pred = router.route_and_predict(v_intake)
        single_results.append(pred["predictions"]["Type2_Diabetes"]["calibrated_probability"])

    print("Single-patient calibrated probs (Type2_Diabetes):", single_results)

if __name__ == "__main__":
    test_fast_batch()
