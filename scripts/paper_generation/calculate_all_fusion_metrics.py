import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.metrics import roc_auc_score, average_precision_score, f1_score, brier_score_loss

DATA_DIR = Path("ai/datasets/v4b_declamped")

def evaluate():
    print("Loading datasets...")
    clin_df = pd.read_csv(DATA_DIR / "clinical_v4.csv")
    wear_df = pd.read_csv(DATA_DIR / "wearable_v4.csv")
    gut_df  = pd.read_csv(DATA_DIR / "gut_v4.csv")
    lbl_df  = pd.read_csv(DATA_DIR / "labels_v4.csv")
    meta_df = pd.read_csv(DATA_DIR / "patient_metadata_v4.csv")

    te_mask  = (meta_df["Split"] == "Test").values
    test_idx = np.where(te_mask)[0]
    
    print("Loading models...")
    c_payload = joblib.load("expert_models/v4b_reproducible/clinical_v4_expert_payload.joblib")
    w_payload = joblib.load("expert_models/v4b_reproducible/wearable_v4_expert_payload.joblib")
    g_payload = joblib.load("expert_models/v4b_reproducible/gut_v4_expert_payload.joblib")
    
    fusion_payload = joblib.load("fusion_engine/v4b_reproducible/v4_multimodal_fusion_payload.joblib")
    
    X_c_te = clin_df.loc[test_idx, c_payload["features"]].copy()
    X_w_te = wear_df.loc[test_idx, w_payload["features"]].copy()
    X_g_te = gut_df.loc[test_idx, g_payload["features"]].copy()
    
    targets = ["Type2_Diabetes", "Prediabetes", "High_Adiposity_Risk", "Metabolic_Syndrome", "NAFLD"]
    pathways = ["Clinical_Only", "Wearable_Only", "Gut_Only", "Clinical_Wearable", "Clinical_Gut", "Wearable_Gut", "Full_Multimodal_Fusion"]
    
    auroc_mat = {t: {} for t in targets}
    auprc_mat = {t: {} for t in targets}
    f1_mat = {t: {} for t in targets}
    brier_mat = {t: {} for t in targets}
    
    for d in targets:
        y_te = lbl_df.loc[test_idx, d].values
        
        c_pipe = c_payload["models"][d]
        w_pipe = w_payload["models"][d]
        g_pipe = g_payload["models"][d]
        
        p_c_full = c_pipe.predict_proba(X_c_te)[:, 1]
        p_w_full = w_pipe.predict_proba(X_w_te)[:, 1]
        p_g_full = g_pipe.predict_proba(X_g_te)[:, 1]
        
        meta_models = fusion_payload["meta_models"]
        thresholds = fusion_payload["thresholds"]
        
        for comb in pathways:
            mod_cols = {}
            if "Clinical" in comb or comb == "Full_Multimodal_Fusion": mod_cols["Clinical"] = p_c_full
            if "Wearable" in comb or comb == "Full_Multimodal_Fusion": mod_cols["Wearable"] = p_w_full
            if "Gut" in comb or comb == "Full_Multimodal_Fusion": mod_cols["Gut"] = p_g_full
                
            X_m = pd.DataFrame(mod_cols)
            p_final = meta_models[comb][d].predict_proba(X_m)[:, 1]
            t = thresholds[comb][d]
            
            preds = (p_final >= t).astype(int)
            
            auroc_mat[d][comb] = roc_auc_score(y_te, p_final)
            auprc_mat[d][comb] = average_precision_score(y_te, p_final)
            f1_mat[d][comb] = f1_score(y_te, preds, zero_division=0)
            brier_mat[d][comb] = brier_score_loss(y_te, p_final)

    for metric_name, matrix in zip(["AUROC", "AUPRC", "F1", "Brier"], [auroc_mat, auprc_mat, f1_mat, brier_mat]):
        print(f"\n=== {metric_name} MATRIX ===")
        print("Target | P1(C) | P2(W) | P3(G) | P4(C+W) | P5(C+G) | P6(W+G) | P7(C+W+G)")
        for t in targets:
            row = [t]
            for p in pathways:
                row.append(f"{matrix[t][p]:.4f}")
            print(" | ".join(row))

if __name__ == "__main__":
    evaluate()
