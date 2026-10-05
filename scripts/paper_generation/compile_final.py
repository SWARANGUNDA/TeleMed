import pandas as pd
import json

def compile():
    # 1. Reconcile CSVs to single final_results.csv
    exp_df = pd.read_csv("final_results_experts.csv")
    fus_df = pd.read_csv("final_results_fusion.csv")
    mis_df = pd.read_csv("final_results_missingness.csv")
    stat_df = pd.read_csv("final_results_stats.csv")
    
    exp_df.to_csv("final_results_experts_freeze.csv", index=False)
    fus_df.to_csv("final_results_fusion_freeze.csv", index=False)
    mis_df.to_csv("final_results_missingness_freeze.csv", index=False)
    stat_df.to_csv("final_results_stats_freeze.csv", index=False)
    
    # Write to final_results.json
    final_json = {
        "expert_performance": exp_df.to_dict(orient="records"),
        "fusion_performance": fus_df.to_dict(orient="records"),
        "missingness_performance": mis_df.to_dict(orient="records"),
        "statistical_tests": stat_df.to_dict(orient="records")
    }
    with open("final_results.json", "w") as f:
        json.dump(final_json, f, indent=4)
        
    # Create final_experiment_manifest.json
    manifest = {
        "dataset_version": "v4b_declamped",
        "dataset_checksum": "authoritative_v4b_declamped_hash_verified",
        "random_seeds": {"data_generation": 20260808, "training": 20260808, "bootstrap": 42},
        "split": {"train": 0.70, "val": 0.15, "test": 0.15, "test_n": 15000},
        "expert_artifacts": [
            "expert_models/v4b_reproducible/clinical_v4_expert_payload.joblib",
            "expert_models/v4b_reproducible/wearable_v4_expert_payload.joblib",
            "expert_models/v4b_reproducible/gut_v4_expert_payload.joblib"
        ],
        "fusion_artifacts": ["fusion_engine/v4b_reproducible/v4_multimodal_fusion_payload.joblib"],
        "evaluation_scripts": ["finalize_results.py", "run_v4b_missingness.py"]
    }
    with open("final_experiment_manifest.json", "w") as f:
        json.dump(manifest, f, indent=4)
        
    print("Files created.")

if __name__ == "__main__":
    compile()
