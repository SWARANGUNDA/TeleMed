import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.metrics import roc_auc_score, average_precision_score, f1_score, brier_score_loss
from sklearn.utils import resample
import json
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = Path("ai/datasets/v4b_declamped")
TARGETS = ["Type2_Diabetes", "Prediabetes", "High_Adiposity_Risk", "Metabolic_Syndrome", "NAFLD"]
PATHWAYS = ["Clinical_Only", "Wearable_Only", "Gut_Only", "Clinical_Wearable", "Clinical_Gut", "Wearable_Gut", "Full_Multimodal_Fusion"]

def calc_metrics(y_true, y_prob, y_pred):
    return {
        "auroc": float(roc_auc_score(y_true, y_prob)),
        "auprc": float(average_precision_score(y_true, y_prob)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "brier": float(brier_score_loss(y_true, y_prob))
    }

def bootstrap_compare(y_true, p1, p2, n_bootstraps=1000, seed=42):
    rng = np.random.RandomState(seed)
    diffs = []
    for _ in range(n_bootstraps):
        idx = rng.randint(0, len(y_true), len(y_true))
        if len(np.unique(y_true[idx])) < 2: continue
        score1 = roc_auc_score(y_true[idx], p1[idx])
        score2 = roc_auc_score(y_true[idx], p2[idx])
        diffs.append(score2 - score1)
    diffs = np.array(diffs)
    ci_lower = np.percentile(diffs, 2.5)
    ci_upper = np.percentile(diffs, 97.5)
    p_value = np.mean(diffs <= 0) if np.mean(diffs) > 0 else np.mean(diffs >= 0)
    p_value = p_value * 2 # two-tailed
    return float(np.mean(diffs)), float(ci_lower), float(ci_upper), float(p_value)

def run():
    print("Loading data...")
    clin_df = pd.read_csv(DATA_DIR / "clinical_v4.csv")
    wear_df = pd.read_csv(DATA_DIR / "wearable_v4.csv")
    gut_df  = pd.read_csv(DATA_DIR / "gut_v4.csv")
    lbl_df  = pd.read_csv(DATA_DIR / "labels_v4.csv")
    meta_df = pd.read_csv(DATA_DIR / "patient_metadata_v4.csv")

    te_mask  = (meta_df["Split"] == "Test").values
    test_idx = np.where(te_mask)[0]
    
    c_payload = joblib.load("expert_models/v4b_reproducible/clinical_v4_expert_payload.joblib")
    w_payload = joblib.load("expert_models/v4b_reproducible/wearable_v4_expert_payload.joblib")
    g_payload = joblib.load("expert_models/v4b_reproducible/gut_v4_expert_payload.joblib")
    fusion_payload = joblib.load("fusion_engine/v4b_reproducible/v4_multimodal_fusion_payload.joblib")
    
    X_c_te = clin_df.loc[test_idx, c_payload["features"]].copy()
    X_w_te = wear_df.loc[test_idx, w_payload["features"]].copy()
    X_g_te = gut_df.loc[test_idx, g_payload["features"]].copy()

    # 1. EXPERT MODELS
    expert_results = []
    base_probs = {t: {} for t in TARGETS}
    
    for d in TARGETS:
        y_te = lbl_df.loc[test_idx, d].values
        
        for mod, X, pay in [("Clinical", X_c_te, c_payload), ("Wearable", X_w_te, w_payload), ("Gut", X_g_te, g_payload)]:
            pipe = pay["models"][d]
            p = pipe.predict_proba(X)[:, 1]
            base_probs[d][mod] = p
            # Simple threshold 0.5 for expert base f1
            pred = (p >= 0.5).astype(int)
            res = calc_metrics(y_te, p, pred)
            res.update({"Target": d, "Modality": mod, "Model": type(pipe.steps[-1][1]).__name__ if hasattr(pipe, 'steps') else type(pipe).__name__})
            expert_results.append(res)
            
    # 2. FUSION MATRIX
    fusion_results = []
    fusion_probs = {t: {} for t in TARGETS}
    meta_models = fusion_payload["meta_models"]
    thresholds = fusion_payload["thresholds"]
    
    for d in TARGETS:
        y_te = lbl_df.loc[test_idx, d].values
        for comb in PATHWAYS:
            mod_cols = {}
            if "Clinical" in comb or comb == "Full_Multimodal_Fusion": mod_cols["Clinical"] = base_probs[d]["Clinical"]
            if "Wearable" in comb or comb == "Full_Multimodal_Fusion": mod_cols["Wearable"] = base_probs[d]["Wearable"]
            if "Gut" in comb or comb == "Full_Multimodal_Fusion": mod_cols["Gut"] = base_probs[d]["Gut"]
            
            X_m = pd.DataFrame(mod_cols)
            p_final = meta_models[comb][d].predict_proba(X_m)[:, 1]
            fusion_probs[d][comb] = p_final
            pred = (p_final >= thresholds[comb][d]).astype(int)
            
            res = calc_metrics(y_te, p_final, pred)
            res.update({"Target": d, "Pathway": comb})
            fusion_results.append(res)
            
    # 3. STATISTICAL TESTS
    stats_results = []
    for d in TARGETS:
        y_te = lbl_df.loc[test_idx, d].values
        p1 = fusion_probs[d]["Clinical_Only"]
        
        for p_name in ["Clinical_Wearable", "Clinical_Gut", "Full_Multimodal_Fusion"]:
            p2 = fusion_probs[d][p_name]
            diff, ci_l, ci_u, pval = bootstrap_compare(y_te, p1, p2)
            stats_results.append({
                "Target": d, "Comparison": f"P1 vs {p_name}",
                "Diff": diff, "CI_Lower": ci_l, "CI_Upper": ci_u, "P_Value": pval
            })
            
    # Export final results
    pd.DataFrame(expert_results).to_csv("final_results_experts.csv", index=False)
    pd.DataFrame(fusion_results).to_csv("final_results_fusion.csv", index=False)
    pd.DataFrame(stats_results).to_csv("final_results_stats.csv", index=False)
    
    print("Done generating main metrics.")
    
if __name__ == "__main__":
    run()
