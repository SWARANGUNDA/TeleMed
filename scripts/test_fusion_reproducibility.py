import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.metrics import roc_auc_score

SEED = 20260808
DATA_DIR = Path("ai/datasets/final")

def run_test():
    clin_df = pd.read_csv(DATA_DIR / "clinical_v4.csv")
    wear_df = pd.read_csv(DATA_DIR / "wearable_v4.csv")
    gut_df  = pd.read_csv(DATA_DIR / "gut_v4.csv")
    lbl_df  = pd.read_csv(DATA_DIR / "labels_v4.csv")
    meta_df = pd.read_csv(DATA_DIR / "patient_metadata_v4.csv")
    
    te_mask  = (meta_df["Split"] == "Test").values
    y_te = lbl_df.loc[te_mask, "Type2_Diabetes"].values
    
    # 1. Load Reproducible Base Artifacts
    clin_payload = joblib.load("expert_models/v4_reproducible/clinical_v4_expert_payload.joblib")
    wear_payload = joblib.load("expert_models/v4_reproducible/wearable_v4_expert_payload.joblib")
    gut_payload  = joblib.load("expert_models/v4_reproducible/gut_v4_expert_payload.joblib")

    X_clin_te_raw = clin_df.loc[te_mask, clin_payload["features"]].copy()
    X_wear_te_raw = wear_df.loc[te_mask, wear_payload["features"]].copy()
    X_gut_te_raw  = gut_df.loc[te_mask, gut_payload["features"]].copy()

    # Base Expert Predictions
    p_clin = clin_payload["models"]["Type2_Diabetes"].predict_proba(X_clin_te_raw)[:, 1]
    p_wear = wear_payload["models"]["Type2_Diabetes"].predict_proba(X_wear_te_raw)[:, 1]
    p_gut  = gut_payload["models"]["Type2_Diabetes"].predict_proba(X_gut_te_raw)[:, 1]
    
    # 2. Load Reproducible Fusion Artifact
    fusion_payload = joblib.load("fusion_engine/v4_reproducible/v4_multimodal_fusion_payload.joblib")
    fusion_pipeline = fusion_payload["meta_models"]["Full_Multimodal_Fusion"]["Type2_Diabetes"]

    X_meta_te = pd.DataFrame({"Clinical": p_clin, "Wearable": p_wear, "Gut": p_gut})
    
    probs_fusion = fusion_pipeline.predict_proba(X_meta_te)[:, 1]
    auc_fusion = roc_auc_score(y_te, probs_fusion)
    
    print(f"Reproducible Exported Fusion Pipeline AUROC: {auc_fusion:.4f}")
    
    # Verify we match the known 0.9999
    print(f"Match expected paper value? {'YES' if abs(auc_fusion - 0.9999) < 0.001 else 'NO'}")

if __name__ == "__main__":
    run_test()
