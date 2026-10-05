import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.metrics import roc_auc_score
import warnings
warnings.filterwarnings('ignore')

DATA_DIR = Path("ai/datasets/v4b_declamped")
TARGETS = ["Type2_Diabetes", "Prediabetes", "High_Adiposity_Risk", "Metabolic_Syndrome", "NAFLD"]

def evaluate_missingness():
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
    
    c_med = pd.Series(c_payload["medians"])
    w_med = pd.Series(w_payload["medians"])
    g_med = pd.Series(g_payload["medians"])
    
    X_c_imp = pd.DataFrame([c_med.values]*len(X_c_te), columns=c_payload["features"], index=X_c_te.index)
    X_w_imp = pd.DataFrame([w_med.values]*len(X_w_te), columns=w_payload["features"], index=X_w_te.index)
    X_g_imp = pd.DataFrame([g_med.values]*len(X_g_te), columns=g_payload["features"], index=X_g_te.index)
    
    meta_models = fusion_payload["meta_models"]
    
    levels = [0.10, 0.20, 0.30]
    modes = ["Clinical", "Wearable", "Gut", "Random"]
    seeds = [42, 100, 2026]
    
    all_results = []
    
    for d in TARGETS:
        print(f"\nEvaluating Target: {d}")
        y_te = lbl_df.loc[test_idx, d].values
        
        c_pipe = c_payload["models"][d]
        w_pipe = w_payload["models"][d]
        g_pipe = g_payload["models"][d]
        
        p_c_full = c_pipe.predict_proba(X_c_te)[:, 1]
        p_w_full = w_pipe.predict_proba(X_w_te)[:, 1]
        p_g_full = g_pipe.predict_proba(X_g_te)[:, 1]
        
        p_c_imp = c_pipe.predict_proba(X_c_imp)[:, 1]
        p_w_imp = w_pipe.predict_proba(X_w_imp)[:, 1]
        p_g_imp = g_pipe.predict_proba(X_g_imp)[:, 1]
        
        dyn_preds = {
            "C": meta_models["Clinical_Only"][d].predict_proba(pd.DataFrame({"Clinical": p_c_full}))[:, 1],
            "W": meta_models["Wearable_Only"][d].predict_proba(pd.DataFrame({"Wearable": p_w_full}))[:, 1],
            "G": meta_models["Gut_Only"][d].predict_proba(pd.DataFrame({"Gut": p_g_full}))[:, 1],
            "CW": meta_models["Clinical_Wearable"][d].predict_proba(pd.DataFrame({"Clinical": p_c_full, "Wearable": p_w_full}))[:, 1],
            "CG": meta_models["Clinical_Gut"][d].predict_proba(pd.DataFrame({"Clinical": p_c_full, "Gut": p_g_full}))[:, 1],
            "WG": meta_models["Wearable_Gut"][d].predict_proba(pd.DataFrame({"Wearable": p_w_full, "Gut": p_g_full}))[:, 1],
            "CWG": meta_models["Full_Multimodal_Fusion"][d].predict_proba(pd.DataFrame({"Clinical": p_c_full, "Wearable": p_w_full, "Gut": p_g_full}))[:, 1],
        }
        
        for lvl in levels:
            for mode in modes:
                dyn_aucs = []
                conv_aucs = []
                
                for s in seeds:
                    np.random.seed(s)
                    
                    p_dyn = np.copy(dyn_preds["CWG"])
                    conv_c = np.copy(p_c_full)
                    conv_w = np.copy(p_w_full)
                    conv_g = np.copy(p_g_full)
                    
                    num_missing = int(len(test_idx) * lvl)
                    missing_idx = np.random.choice(np.arange(len(test_idx)), size=num_missing, replace=False)
                    
                    has_c = np.ones(len(test_idx), dtype=bool)
                    has_w = np.ones(len(test_idx), dtype=bool)
                    has_g = np.ones(len(test_idx), dtype=bool)
                    
                    if mode == "Clinical": has_c[missing_idx] = False
                    elif mode == "Wearable": has_w[missing_idx] = False
                    elif mode == "Gut": has_g[missing_idx] = False
                    elif mode == "Random":
                        rand_choices = np.random.choice(["C", "W", "G"], size=len(test_idx))
                        c_mask = rand_choices == "C"
                        w_mask = rand_choices == "W"
                        g_mask = rand_choices == "G"
                        has_c[missing_idx[c_mask[missing_idx]]] = False
                        has_w[missing_idx[w_mask[missing_idx]]] = False
                        has_g[missing_idx[g_mask[missing_idx]]] = False
                        
                    # Handle empty modality case (all 3 missing). 
                    # If all 3 missing, we use 0 probability for dynamic.
                    idx_CWG = has_c & has_w & has_g
                    idx_CW = has_c & has_w & ~has_g
                    idx_CG = has_c & has_g & ~has_w
                    idx_WG = has_w & has_g & ~has_c
                    idx_C = has_c & ~has_w & ~has_g
                    idx_W = has_w & ~has_c & ~has_g
                    idx_G = has_g & ~has_c & ~has_w
                    idx_None = ~has_c & ~has_w & ~has_g
                    
                    p_dyn[idx_CW] = dyn_preds["CW"][idx_CW]
                    p_dyn[idx_CG] = dyn_preds["CG"][idx_CG]
                    p_dyn[idx_WG] = dyn_preds["WG"][idx_WG]
                    p_dyn[idx_C] = dyn_preds["C"][idx_C]
                    p_dyn[idx_W] = dyn_preds["W"][idx_W]
                    p_dyn[idx_G] = dyn_preds["G"][idx_G]
                    p_dyn[idx_None] = 0.5 # Default fallback
                    
                    conv_c[~has_c] = p_c_imp[~has_c]
                    conv_w[~has_w] = p_w_imp[~has_w]
                    conv_g[~has_g] = p_g_imp[~has_g]
                    
                    X_m_conv = pd.DataFrame({"Clinical": conv_c, "Wearable": conv_w, "Gut": conv_g})
                    p_conv = meta_models["Full_Multimodal_Fusion"][d].predict_proba(X_m_conv)[:, 1]

                    dyn_aucs.append(roc_auc_score(y_te, p_dyn))
                    conv_aucs.append(roc_auc_score(y_te, p_conv))
                
                dyn_mean = np.mean(dyn_aucs)
                dyn_sd = np.std(dyn_aucs)
                conv_mean = np.mean(conv_aucs)
                conv_sd = np.std(conv_aucs)
                all_results.append({
                    "Target": d, "Level": lvl, "Mode": mode,
                    "Dynamic_AUC": dyn_mean, "Dynamic_SD": dyn_sd,
                    "Conv_AUC": conv_mean, "Conv_SD": conv_sd
                })
                
    pd.DataFrame(all_results).to_csv("final_results_missingness.csv", index=False)
    print("Done generating missingness metrics.")

if __name__ == "__main__":
    evaluate_missingness()
