import os
import sys
import json
from pathlib import Path

# Ensure UTF-8 stdout on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from multimodal_data_intake_engine.engine import MultimodalIntakeEngine
from multimodal_data_intake_engine.extractor import detect_file_format_by_header

# Ground Truth Map: (Expected Modality, Expected Canonical Feature List)
GROUND_TRUTH = {
    "01_standard_apollo.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_Diabetes", "Family_History_Hypertension", "Family_History_CVD", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned", "Average_Glucose", "Glucose_Variability", "Time_In_Range",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia"
    ]),
    "02_vertical_layout.txt": ("Multimodal Report", [
        "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "Family_History_Diabetes", "Family_History_Hypertension", "Family_History_CVD", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned", "Average_Glucose", "Glucose_Variability", "Time_Above_Range",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Shannon_Diversity_Index"
    ]),
    "03_compact.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_Diabetes", "Family_History_Hypertension", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned", "Average_Glucose", "Glucose_Variability", "Time_In_Range", "Time_Above_Range",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia"
    ]),
    "04_random_order.txt": ("Multimodal Report", [
        "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_Diabetes", "Family_History_Hypertension", "Family_History_CVD", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned", "Average_Glucose", "Glucose_Variability", "Time_In_Range", "Time_Above_Range",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Shannon_Diversity_Index"
    ]),
    "05_unit_conversion.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_Diabetes", "Family_History_Hypertension", "Family_History_CVD", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned", "Average_Glucose", "Glucose_Variability", "Time_In_Range", "Time_Above_Range",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia", "Shannon_Diversity_Index"
    ]),
    "06_ocr_noise.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_Diabetes", "Family_History_Hypertension", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned", "Average_Glucose", "Glucose_Variability", "Time_In_Range", "Time_Above_Range",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia", "Shannon_Diversity_Index"
    ]),
    "07_csv_export.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_CVD", "BMI",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia"
    ]),
    "08_conflicts.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_Diabetes", "Family_History_Hypertension", "Family_History_CVD", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned", "Average_Glucose", "Glucose_Variability", "Time_In_Range", "Time_Above_Range",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia", "Shannon_Diversity_Index"
    ]),
    "09_noisy_header_footer.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_Diabetes", "Family_History_Hypertension", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned", "Average_Glucose", "Glucose_Variability", "Time_In_Range", "Time_Above_Range",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia", "Shannon_Diversity_Index"
    ]),
    "13_ultimate_mixed_stress.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia", "Shannon_Diversity_Index"
    ]),
    "14_table_based.txt": ("Clinical Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "BMI"
    ]),
    "15_reference_range_confusion.txt": ("Clinical Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "BMI"
    ]),
    "16_multiple_similar_labels.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "BMI",
        "Average_Glucose", "Resting_Heart_Rate"
    ]),
    "17_corrected_updated.txt": ("Clinical Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "BMI"
    ]),
    "18_extreme_edge_cases.txt": ("Clinical Report", [
        "Patient_ID", "Age", "Gender", "Weight", "Height", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "LDL", "HDL", "Triglycerides", "ALT", "AST"
    ]),
    "Duplicate _Conflicting.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_Diabetes", "Family_History_Hypertension", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned", "Average_Glucose", "Glucose_Variability", "Time_In_Range", "Time_Above_Range",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia", "Shannon_Diversity_Index"
    ]),
    "missing_labes.txt": ("Multimodal Report", [
        "Systolic_BP", "Diastolic_BP", "Active_Minutes", "Resting_Heart_Rate", "Calories_Burned", "Glucose_Variability"
    ]),
    "multipage.txt": ("Multimodal Report", [
        "Patient_ID", "Age", "Gender", "Height", "Weight", "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
        "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_Diabetes", "Family_History_Hypertension", "Family_History_CVD", "BMI",
        "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes", "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned", "Average_Glucose", "Glucose_Variability", "Time_In_Range", "Time_Above_Range",
        "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia", "Shannon_Diversity_Index"
    ]),
    "overall_info.txt": ("Clinical Report", [
        "Height", "Weight", "HbA1c", "LDL", "HDL", "AST", "BMI"
    ]),
    "PL142.pdf": ("Clinical Report", [
        "Age", "HbA1c", "AST"
    ]),
    "samplesmartreportclinics.pdf": ("Multimodal Report", [
        "Patient_ID", "Gender", "Height", "Weight", "Systolic_BP", "Diastolic_BP", "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL", "Triglycerides", "ALT", "AST",
        "Average_Glucose", "Glucose_Variability"
    ]),
    "Cholesterol-and-Lipids-Panel-Sample-Report.pdf": ("Clinical Report", [
        "Patient_ID", "LDL", "HDL", "Triglycerides"
    ])
}


def run_precision_recall_audit():
    reports_dir = Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "reports_preprocessing")))
    if not reports_dir.exists():
        print(f"Error: Directory {reports_dir} does not exist!")
        return

    files = sorted(list(reports_dir.iterdir()))
    print("=========================================================================================================")
    print("                      RIGOROUS PREPROCESSING PIPELINE EVALUATION (PRECISION / RECALL / F1)")
    print("=========================================================================================================\n")

    engine = MultimodalIntakeEngine()
    audit_table = []
    
    total_tp = 0
    total_fp = 0
    total_fn = 0
    total_expected = 0
    total_extracted = 0

    for fpath in files:
        if fpath.is_dir():
            continue
        fname = fpath.name
        mime_type = detect_file_format_by_header(str(fpath))

        exp_modality, expected_features = GROUND_TRUTH.get(fname, ("Unknown Document Type", []))
        exp_feat_set = set(expected_features)

        try:
            res = engine.process_reports([str(fpath)])
            doc_meta = res["processed_reports_metadata"][0]
            detected_modality = doc_meta.get("modality", "Unknown Document Type")
            patient_profile = res["patient_profile"]

            # Extracted canonical features across modalities
            clin_feats = patient_profile.get("clinical_features", {})
            wear_feats = patient_profile.get("wearable_features", {})
            gut_feats = patient_profile.get("gut_features", {})

            extracted_keys = set()
            for k in clin_feats.keys():
                extracted_keys.add(k)
            for k in wear_feats.keys():
                extracted_keys.add(k)
            for k in gut_feats.keys():
                extracted_keys.add(k)

            # True Positives: Extracted features that were expected
            tp_set = extracted_keys.intersection(exp_feat_set)
            # False Positives: Extracted features that were NOT in expected ground truth
            fp_set = extracted_keys - exp_feat_set
            # False Negatives / Missing: Expected features that were NOT extracted
            fn_set = exp_feat_set - extracted_keys

            tp = len(tp_set)
            fp = len(fp_set)
            fn = len(fn_set)

            precision = (tp / (tp + fp)) * 100.0 if (tp + fp) > 0 else 0.0
            recall = (tp / (tp + fn)) * 100.0 if (tp + fn) > 0 else 0.0
            f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

            total_tp += tp
            total_fp += fp
            total_fn += fn
            total_expected += len(expected_features)
            total_extracted += len(extracted_keys)

            entry = {
                "file": fname,
                "mime": mime_type,
                "exp_modality": exp_modality,
                "det_modality": detected_modality,
                "expected_count": len(expected_features),
                "extracted_count": len(extracted_keys),
                "tp": tp,
                "fp": fp,
                "fn": fn,
                "missing": sorted(list(fn_set)),
                "false_positives": sorted(list(fp_set)),
                "precision": round(precision, 1),
                "recall": round(recall, 1),
                "f1": round(f1, 1)
            }
            audit_table.append(entry)

            mod_match = "MATCH" if exp_modality == detected_modality else "DIFF"

            print(f"File: {fname}")
            print(f"   MIME: {mime_type} | Modality: Exp='{exp_modality}' vs Det='{detected_modality}' [{mod_match}]")
            print(f"   Expected: {len(expected_features)} | Extracted: {len(extracted_keys)} | TP: {tp} | FP: {fp} | FN (Missing): {fn}")
            print(f"   Precision: {precision:.1f}% | Recall: {recall:.1f}% | F1-Score: {f1:.1f}%")
            if fp_set:
                print(f"   False Positives: {list(fp_set)}")
            if fn_set:
                print(f"   Missing (FN)   : {list(fn_set)}")
            print("-" * 80)

        except Exception as e:
            print(f"CRASH {fname}: {e}")
            import traceback
            traceback.print_exc()

    overall_p = (total_tp / (total_tp + total_fp)) * 100.0 if (total_tp + total_fp) > 0 else 0.0
    overall_r = (total_tp / (total_tp + total_fn)) * 100.0 if (total_tp + total_fn) > 0 else 0.0
    overall_f1 = (2 * overall_p * overall_r / (overall_p + overall_r)) if (overall_p + overall_r) > 0 else 0.0

    print("\n=========================================================================================================")
    print("                                      OVERALL PIPELINE PERFORMANCE")
    print("=========================================================================================================")
    print(f"Total Expected Canonical Features : {total_expected}")
    print(f"Total Extracted Canonical Features: {total_extracted}")
    print(f"Total True Positives (TP)        : {total_tp}")
    print(f"Total False Positives (FP)       : {total_fp}")
    print(f"Total False Negatives (FN)       : {total_fn}")
    print(f"Micro-Average Precision          : {overall_p:.2f}%")
    print(f"Micro-Average Recall             : {overall_r:.2f}%")
    print(f"Micro-Average F1-Score           : {overall_f1:.2f}%")
    print("=========================================================================================================\n")

    with open("scratch/precision_recall_audit.json", "w", encoding="utf-8") as out_f:
        json.dump({
            "summary": {
                "total_expected": total_expected,
                "total_extracted": total_extracted,
                "total_tp": total_tp,
                "total_fp": total_fp,
                "total_fn": total_fn,
                "precision": round(overall_p, 2),
                "recall": round(overall_r, 2),
                "f1_score": round(overall_f1, 2)
            },
            "per_file": audit_table
        }, out_f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    run_precision_recall_audit()
