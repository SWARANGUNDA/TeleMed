import json
import sys
from pathlib import Path

# Ensure UTF-8 stdout
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, ".")
from multimodal_data_intake_engine.engine import MultimodalIntakeEngine
from multimodal_data_intake_engine.config import CLINICAL_FEATURES, WEARABLE_FEATURES, GUT_FEATURES

with open("scratch/precision_recall_audit.json", "r", encoding="utf-8") as f:
    audit_data = json.load(f)

# Modality breakdown buckets
modality_metrics = {
    "Clinical": {"exp": 0, "ext": 0, "tp": 0, "fp": 0, "fn": 0},
    "Wearable": {"exp": 0, "ext": 0, "tp": 0, "fp": 0, "fn": 0},
    "Gut": {"exp": 0, "ext": 0, "tp": 0, "fp": 0, "fn": 0}
}

# Synthetic vs Real PDF breakdown
source_type_metrics = {
    "Synthetic Text & CSV (19 files)": {"exp": 0, "ext": 0, "tp": 0, "fp": 0, "fn": 0},
    "Real PDF Reports (3 files)": {"exp": 0, "ext": 0, "tp": 0, "fp": 0, "fn": 0}
}

print("=========================================================================================================")
print("                               Detailed Feature Analysis & Breakdown")
print("=========================================================================================================\n")

# Import GROUND_TRUTH from test_reports_preprocessing.py
from scratch.test_reports_preprocessing import GROUND_TRUTH

engine = MultimodalIntakeEngine()
reports_dir = Path("reports_preprocessing")

per_file_detailed = []

for fpath in sorted(list(reports_dir.iterdir())):
    if fpath.is_dir():
        continue
    fname = fpath.name
    exp_mod, exp_list = GROUND_TRUTH.get(fname, ("Unknown", []))
    exp_set = set(exp_list)

    # Classify expected features by modality
    exp_clin = [f for f in exp_list if f in CLINICAL_FEATURES]
    exp_wear = [f for f in exp_list if f in WEARABLE_FEATURES]
    exp_gut = [f for f in exp_list if f in GUT_FEATURES]

    # Run intake
    res = engine.process_reports([str(fpath)])
    patient_profile = res["patient_profile"]
    doc_meta = res["processed_reports_metadata"][0]
    det_mod = doc_meta.get("modality", "Unknown")

    c_ext = set(patient_profile.get("clinical_features", {}).keys())
    w_ext = set(patient_profile.get("wearable_features", {}).keys())
    g_ext = set(patient_profile.get("gut_features", {}).keys())

    all_ext = c_ext | w_ext | g_ext

    # Compute TP, FP, FN overall
    tp_set = all_ext & exp_set
    fp_set = all_ext - exp_set
    fn_set = exp_set - all_ext

    # Compute per-modality TP, FP, FN
    c_tp = len(c_ext & set(exp_clin))
    c_fp = len(c_ext - set(exp_clin))
    c_fn = len(set(exp_clin) - c_ext)

    w_tp = len(w_ext & set(exp_wear))
    w_fp = len(w_ext - set(exp_wear))
    w_fn = len(set(exp_wear) - w_ext)

    g_tp = len(g_ext & set(exp_gut))
    g_fp = len(g_ext - set(exp_gut))
    g_fn = len(set(exp_gut) - g_ext)

    modality_metrics["Clinical"]["exp"] += len(exp_clin)
    modality_metrics["Clinical"]["ext"] += len(c_ext)
    modality_metrics["Clinical"]["tp"] += c_tp
    modality_metrics["Clinical"]["fp"] += c_fp
    modality_metrics["Clinical"]["fn"] += c_fn

    modality_metrics["Wearable"]["exp"] += len(exp_wear)
    modality_metrics["Wearable"]["ext"] += len(w_ext)
    modality_metrics["Wearable"]["tp"] += w_tp
    modality_metrics["Wearable"]["fp"] += w_fp
    modality_metrics["Wearable"]["fn"] += w_fn

    modality_metrics["Gut"]["exp"] += len(exp_gut)
    modality_metrics["Gut"]["ext"] += len(g_ext)
    modality_metrics["Gut"]["tp"] += g_tp
    modality_metrics["Gut"]["fp"] += g_fp
    modality_metrics["Gut"]["fn"] += g_fn

    # Source type accumulation
    src_key = "Real PDF Reports (3 files)" if fname.endswith(".pdf") else "Synthetic Text & CSV (19 files)"
    source_type_metrics[src_key]["exp"] += len(exp_list)
    source_type_metrics[src_key]["ext"] += len(all_ext)
    source_type_metrics[src_key]["tp"] += len(tp_set)
    source_type_metrics[src_key]["fp"] += len(fp_set)
    source_type_metrics[src_key]["fn"] += len(fn_set)

    per_file_detailed.append({
        "file": fname,
        "exp_modality": exp_mod,
        "det_modality": det_mod,
        "expected_features": exp_list,
        "extracted_features": sorted(list(all_ext)),
        "tp": sorted(list(tp_set)),
        "fp": sorted(list(fp_set)),
        "fn": sorted(list(fn_set)),
        "precision": round(len(tp_set)/(len(all_ext))*100, 1) if all_ext else 0.0,
        "recall": round(len(tp_set)/(len(exp_set))*100, 1) if exp_set else 0.0,
        "f1": round(2*len(tp_set)/(len(all_ext)+len(exp_set))*100, 1) if (all_ext or exp_set) else 0.0
    })

print("--- MODALITY BREAKDOWN ---")
for mod, counts in modality_metrics.items():
    tp, fp, fn = counts["tp"], counts["fp"], counts["fn"]
    p = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0
    r = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0
    f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0
    print(f"{mod:<10} | Exp: {counts['exp']:<3} | Ext: {counts['ext']:<3} | TP: {tp:<3} | FP: {fp:<3} | FN: {fn:<3} | P: {p:.2f}% | R: {r:.2f}% | F1: {f1:.2f}%")

print("\n--- SOURCE TYPE BREAKDOWN ---")
for src, counts in source_type_metrics.items():
    tp, fp, fn = counts["tp"], counts["fp"], counts["fn"]
    p = (tp / (tp + fp) * 100) if (tp + fp) > 0 else 0
    r = (tp / (tp + fn) * 100) if (tp + fn) > 0 else 0
    f1 = (2 * p * r / (p + r)) if (p + r) > 0 else 0
    print(f"{src:<32} | Exp: {counts['exp']:<3} | Ext: {counts['ext']:<3} | TP: {tp:<3} | FP: {fp:<3} | FN: {fn:<3} | P: {p:.2f}% | R: {r:.2f}% | F1: {f1:.2f}%")

with open("scratch/modality_and_source_breakdown.json", "w", encoding="utf-8") as f:
    json.dump({
        "modality_breakdown": modality_metrics,
        "source_breakdown": source_type_metrics,
        "per_file_detailed": per_file_detailed
    }, f, indent=2, ensure_ascii=False)
