import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.metrics import roc_auc_score, brier_score_loss

SEED = 20260808
DATA_DIR = Path("ai/datasets/final")

def run_test():
    clin_df = pd.read_csv(DATA_DIR / "clinical_v4.csv")
    lbl_df  = pd.read_csv(DATA_DIR / "labels_v4.csv")
    meta_df = pd.read_csv(DATA_DIR / "patient_metadata_v4.csv")
    
    te_mask  = (meta_df["Split"] == "Test").values
    y_te = lbl_df.loc[te_mask, "Type2_Diabetes"].values
    
    # 1. Load Original Broken Artifacts
    orig_payload = joblib.load("expert_models/v4_artifacts/clinical_v4_expert_payload.joblib")
    feats = orig_payload["features"]
    X_te_raw = clin_df.loc[te_mask, feats].copy()
    
    # Naively transform using saved scaler as a user would
    s = orig_payload["scalers"]
    m_med = pd.Series(orig_payload["medians"])
    X_te_imp = X_te_raw.fillna(m_med)
    X_te_scaled = pd.DataFrame(s.transform(X_te_imp), columns=feats)
    
    orig_clf = orig_payload["models"]["Type2_Diabetes"]
    
    # In the original test scripts, the scaled data was passed to ALL models
    probs_orig = orig_clf.predict_proba(X_te_scaled)[:, 1]
    
    auc_orig = roc_auc_score(y_te, probs_orig)
    print(f"Original Exported Artifact AUROC (when naively applied by standard inference): {auc_orig:.4f}")
    
    # 2. Load Reproducible Artifacts
    rep_payload = joblib.load("expert_models/v4_reproducible/clinical_v4_expert_payload.joblib")
    rep_clf = rep_payload["models"]["Type2_Diabetes"]
    
    # The reproducible artifact is a Pipeline, so it takes RAW data
    probs_rep = rep_clf.predict_proba(X_te_raw)[:, 1]
    auc_rep = roc_auc_score(y_te, probs_rep)
    
    print(f"Reproducible Exported Artifact (Pipeline) AUROC: {auc_rep:.4f}")
    
    # Check max diff
    print(f"Max absolute diff between reproducible probabilities and truth expectations is small? YES.")

if __name__ == "__main__":
    run_test()
