import pandas as pd
import numpy as np
from pathlib import Path

def analyze_coupling():
    targets = ["Type2_Diabetes", "Prediabetes", "High_Adiposity_Risk", "Metabolic_Syndrome", "NAFLD"]
    clinical_feats = [
        "Age", "Gender", "Height", "Weight", "BMI", "Waist_Circumference",
        "Systolic_BP", "Diastolic_BP", "Fasting_Blood_Glucose", "HbA1c",
        "Triglycerides", "HDL", "LDL", "ALT", "AST",
        "Family_History_Diabetes", "Family_History_Hypertension", "Family_History_CVD"
    ]

    print("=== COUPLING ANALYSIS: CONDITION A (CLAMPED) ===")
    cond_a_lbl = pd.read_csv("ai/datasets/final/labels_v4.csv")
    cond_a_clin = pd.read_csv("ai/datasets/final/clinical_v4.csv")

    for t in targets:
        print(f"\nTarget: {t}")
        corrs = []
        for f in clinical_feats:
            if cond_a_clin[f].notna().sum() > 0:
                corr = cond_a_lbl[t].corr(cond_a_clin[f])
                corrs.append((f, corr))
        corrs.sort(key=lambda x: abs(x[1]), reverse=True)
        for f, c in corrs[:5]:
            print(f"  {f}: {c:.4f}")

    print("\n=== COUPLING ANALYSIS: CONDITION B (DECLAMPED) ===")
    cond_b_lbl = pd.read_csv("ai/datasets/v4b_declamped/labels_v4.csv")
    cond_b_clin = pd.read_csv("ai/datasets/v4b_declamped/clinical_v4.csv")

    for t in targets:
        print(f"\nTarget: {t}")
        corrs = []
        for f in clinical_feats:
            if cond_b_clin[f].notna().sum() > 0:
                corr = cond_b_lbl[t].corr(cond_b_clin[f])
                corrs.append((f, corr))
        corrs.sort(key=lambda x: abs(x[1]), reverse=True)
        for f, c in corrs[:5]:
            print(f"  {f}: {c:.4f}")

if __name__ == "__main__":
    analyze_coupling()
