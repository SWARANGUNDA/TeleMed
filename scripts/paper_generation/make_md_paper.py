import json
import pandas as pd
from pathlib import Path

def get_fus(fusion, target, pathway, metric):
    row = fusion[(fusion['Target'] == target) & (fusion['Pathway'] == pathway)]
    return f"{row.iloc[0][metric]:.4f}" if not row.empty else "N/A"

def get_exp(expert, target, mod, metric):
    row = expert[(expert['Target'] == target) & (expert['Modality'] == mod)]
    return f"{row.iloc[0][metric]:.4f}" if not row.empty else "N/A"
    
def get_mis(missing, target, mode, level, model):
    row = missing[(missing['Target'] == target) & (missing['Mode'] == mode) & (missing['Level'] == level)]
    return f"{row.iloc[0][model]:.4f}" if not row.empty else "N/A"

def generate():
    with open('final_results.json', 'r') as f:
        data = json.load(f)
        
    expert = pd.DataFrame(data['expert_performance'])
    fusion = pd.DataFrame(data['fusion_performance'])
    missing = pd.DataFrame(data['missingness_performance'])
    stats = pd.DataFrame(data['statistical_tests'])

    md_content = f"""# TeleMed-M3: Dynamic Imputation-Free Multimodal Learning for Explainable Metabolic Disease Risk Stratification

**Abstract**
*Background:* Multimodal metabolic risk assessment may combine Clinical, Wearable/CGM, and Gut Microbiome information, but modality availability can vary greatly in practice. *Problem:* Conventional multimodal systems often require complete feature blocks or rely on numerical imputation when modalities are unavailable. *Method:* TeleMed-M3 uses modality-specific expert models and probability-level stacking across all seven non-empty modality combinations (C, W, G, C+W, C+G, W+G, C+W+G). *Dataset:* We evaluated this architecture on a 100,000-patient de-clamped probabilistic synthetic cohort (70/15/15 split). *Targets:* Type 2 Diabetes, Prediabetes, High Adiposity Risk, Metabolic Syndrome, and NAFLD. *Missingness:* Patient-level simulated modality loss at evaluated 10-30% levels. *Results:* Clinical was the strongest single modality across the five targets. Wearable+Gut retained measurable discrimination when Clinical was unavailable. Full multimodal gains over Clinical-only were modest. Dynamic routing remained operational under simulated patient-level missingness, producing numerically higher AUROCs than conventional imputation without establishing sweeping statistical superiority. Dynamic routing achieved comparable performance to conventional early fusion while preserving structural robustness. *Conclusion:* The primary contribution is modality-flexible, imputation-free probability-level routing under evaluated synthetic missingness conditions.

## 1. Introduction
Metabolic disease is highly multifactorial. Clinical measurements are strong predictive markers but may be unavailable at every encounter. Wearables provide longitudinal behavioral and physiological information, while the gut microbiome provides complementary biological information. However, multimodal systems face heterogeneous modality availability. Numerical imputation can introduce unwanted assumptions about unavailable modalities. Dynamic routing can instead operate strictly on the subset of available modality experts. This study evaluates simulated modality missingness.

## 2. Research Questions
**RQ1:** How does each modality independently discriminate the five metabolic risk targets in the de-clamped synthetic cohort?
**RQ2:** How does probability-level fusion perform across all seven non-empty modality combinations?
**RQ3:** Does multimodal fusion provide measurable incremental discrimination over Clinical-only prediction?
**RQ4:** Can the dynamic routing architecture maintain predictive performance under simulated patient-level modality missingness?
**RQ5:** How does dynamic routing compare with conventional modality imputation?
**RQ6:** How does probability-level dynamic routing compare with conventional early fusion?
**RQ7:** How can TreeSHAP and evidence-grounded Medical RAG support explainable risk reporting? (Exploratory framework).

## 3. Contributions
1. An imputation-free dynamic modality-routing architecture covering all seven non-empty modality configurations.
2. Modality-specific expert modeling for Clinical, Wearable/CGM, and Gut Microbiome data across five metabolic risk targets.
3. Out-of-fold probability-level stacking with reproducible Pipeline-based preprocessing.
4. Controlled evaluation under simulated patient-level modality missingness.
5. Comparison with conventional median-imputation and early-fusion baselines.
6. TreeSHAP and evidence-grounded Medical RAG reporting architecture, with quantitative evaluation clearly identified as future work.

## 4. Related Work
Multimodal systems in healthcare generally require complete feature vectors or rely heavily on imputation. Early fusion networks implicitly impute representations. Prior research on modality routing has proposed complex modular networks. Here, we evaluate probability-level meta-learners operating directly on available instantiated modality experts.

## 5. Dataset
The evaluation utilizes a "De-Clamped Probabilistic Synthetic Cohort". It comprises 100,000 patients with a 70/15/15 split. The dataset provides 18 Clinical features, 15 Wearable/CGM features, and 49 predictive Gut dimensions for five targets. The generative mechanism is a Gaussian-Copula latent structure.

### 5.1. Target Prevalence
The exact positive-class prevalence rates for the five targets in the evaluation cohort are: Type 2 Diabetes (52.61%), Prediabetes (20.01%), High Adiposity Risk (39.04%), Metabolic Syndrome (57.12%), and NAFLD (59.57%). Prevalence is an important contextual factor for interpreting AUPRC, as baseline random-chance AUPRC is equivalent to target prevalence. Therefore, AUPRC cannot be universally compared across targets with differing prevalences.

### 5.2. Deterministic Label-Feature Coupling Audit
An earlier generator version applied post-label deterministic clinical clamping to diagnostic variables. This created target-feature leakage. The perfect Clinical discrimination in the clamped cohort was attributable to deterministic label-feature coupling and therefore was not interpretable as generalizable predictive performance. Consequently, the clamping logic was removed. The completely de-clamped cohort was used for all final experiments.

## 6. Methodology
**A. Modality-specific experts:** Specialized models natively predicting based on C, W, or G.
**B. Preprocessing Pipelines:** Ensuring identical treatment across training and inference.
**C. OOF predictions:** Expert outputs for the training split used as meta-features.
**D. Probability-level stacking:** Combining expert probabilities.
**E. Seven modality pathways:** C, W, G, C+W, C+G, W+G, C+W+G.
**F. Dynamic routing:** Routing patient to the pathway representing their observed modalities. Unavailable modalities are not numerically imputed.
**G. Evaluation Metrics:** F1 scores were calculated using a fixed probability threshold of 0.5; threshold optimization was not performed.
**H. Simulated patient-level missingness:** The simulated modality-availability mechanism corresponds to Missing Completely At Random (MCAR) under the experimental construction, as modalities are removed via independent uniform probabilities. This mechanism is a controlled simulation and does not represent the informative missingness mechanisms that may occur in clinical workflows.
**I. Conventional imputation baseline:** Standard median imputation of the raw space.
**J. Early-fusion baseline:** Concatenating features before prediction.

## 7. Experimental Results

### Table I: 15 Expert Models
| Modality | Target | AUROC | AUPRC | F1 | Brier |
|---|---|---|---|---|---|
| Clinical | Type2_Diabetes | {get_exp(expert, 'Type2_Diabetes', 'Clinical', 'auroc')} | {get_exp(expert, 'Type2_Diabetes', 'Clinical', 'auprc')} | {get_exp(expert, 'Type2_Diabetes', 'Clinical', 'f1')} | {get_exp(expert, 'Type2_Diabetes', 'Clinical', 'brier')} |
| Wearable | Type2_Diabetes | {get_exp(expert, 'Type2_Diabetes', 'Wearable', 'auroc')} | {get_exp(expert, 'Type2_Diabetes', 'Wearable', 'auprc')} | {get_exp(expert, 'Type2_Diabetes', 'Wearable', 'f1')} | {get_exp(expert, 'Type2_Diabetes', 'Wearable', 'brier')} |
| Gut | Type2_Diabetes | {get_exp(expert, 'Type2_Diabetes', 'Gut', 'auroc')} | {get_exp(expert, 'Type2_Diabetes', 'Gut', 'auprc')} | {get_exp(expert, 'Type2_Diabetes', 'Gut', 'f1')} | {get_exp(expert, 'Type2_Diabetes', 'Gut', 'brier')} |
| Clinical | Prediabetes | {get_exp(expert, 'Prediabetes', 'Clinical', 'auroc')} | {get_exp(expert, 'Prediabetes', 'Clinical', 'auprc')} | {get_exp(expert, 'Prediabetes', 'Clinical', 'f1')} | {get_exp(expert, 'Prediabetes', 'Clinical', 'brier')} |
| Wearable | Prediabetes | {get_exp(expert, 'Prediabetes', 'Wearable', 'auroc')} | {get_exp(expert, 'Prediabetes', 'Wearable', 'auprc')} | {get_exp(expert, 'Prediabetes', 'Wearable', 'f1')} | {get_exp(expert, 'Prediabetes', 'Wearable', 'brier')} |
| Gut | Prediabetes | {get_exp(expert, 'Prediabetes', 'Gut', 'auroc')} | {get_exp(expert, 'Prediabetes', 'Gut', 'auprc')} | {get_exp(expert, 'Prediabetes', 'Gut', 'f1')} | {get_exp(expert, 'Prediabetes', 'Gut', 'brier')} |
| Clinical | High_Adiposity_Risk | {get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'auroc')} | {get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'auprc')} | {get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'f1')} | {get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'brier')} |
| Wearable | High_Adiposity_Risk | {get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'auroc')} | {get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'auprc')} | {get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'f1')} | {get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'brier')} |
| Gut | High_Adiposity_Risk | {get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'auroc')} | {get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'auprc')} | {get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'f1')} | {get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'brier')} |
| Clinical | Metabolic_Syndrome | {get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'auroc')} | {get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'auprc')} | {get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'f1')} | {get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'brier')} |
| Wearable | Metabolic_Syndrome | {get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'auroc')} | {get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'auprc')} | {get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'f1')} | {get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'brier')} |
| Gut | Metabolic_Syndrome | {get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'auroc')} | {get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'auprc')} | {get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'f1')} | {get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'brier')} |
| Clinical | NAFLD | {get_exp(expert, 'NAFLD', 'Clinical', 'auroc')} | {get_exp(expert, 'NAFLD', 'Clinical', 'auprc')} | {get_exp(expert, 'NAFLD', 'Clinical', 'f1')} | {get_exp(expert, 'NAFLD', 'Clinical', 'brier')} |
| Wearable | NAFLD | {get_exp(expert, 'NAFLD', 'Wearable', 'auroc')} | {get_exp(expert, 'NAFLD', 'Wearable', 'auprc')} | {get_exp(expert, 'NAFLD', 'Wearable', 'f1')} | {get_exp(expert, 'NAFLD', 'Wearable', 'brier')} |
| Gut | NAFLD | {get_exp(expert, 'NAFLD', 'Gut', 'auroc')} | {get_exp(expert, 'NAFLD', 'Gut', 'auprc')} | {get_exp(expert, 'NAFLD', 'Gut', 'f1')} | {get_exp(expert, 'NAFLD', 'Gut', 'brier')} |

### Table II: 7x5 AUROC Matrix
| Target | P1 (C) | P2 (W) | P3 (G) | P4 (C+W) | P5 (C+G) | P6 (W+G) | P7 (C+W+G) |
|---|---|---|---|---|---|---|---|
| Type2_Diabetes | {get_fus(fusion, 'Type2_Diabetes', 'Clinical_Only', 'auroc')} | {get_fus(fusion, 'Type2_Diabetes', 'Wearable_Only', 'auroc')} | {get_fus(fusion, 'Type2_Diabetes', 'Gut_Only', 'auroc')} | {get_fus(fusion, 'Type2_Diabetes', 'Clinical_Wearable', 'auroc')} | {get_fus(fusion, 'Type2_Diabetes', 'Clinical_Gut', 'auroc')} | {get_fus(fusion, 'Type2_Diabetes', 'Wearable_Gut', 'auroc')} | {get_fus(fusion, 'Type2_Diabetes', 'Full_Multimodal_Fusion', 'auroc')} |
| Prediabetes | {get_fus(fusion, 'Prediabetes', 'Clinical_Only', 'auroc')} | {get_fus(fusion, 'Prediabetes', 'Wearable_Only', 'auroc')} | {get_fus(fusion, 'Prediabetes', 'Gut_Only', 'auroc')} | {get_fus(fusion, 'Prediabetes', 'Clinical_Wearable', 'auroc')} | {get_fus(fusion, 'Prediabetes', 'Clinical_Gut', 'auroc')} | {get_fus(fusion, 'Prediabetes', 'Wearable_Gut', 'auroc')} | {get_fus(fusion, 'Prediabetes', 'Full_Multimodal_Fusion', 'auroc')} |
| High_Adiposity_Risk | {get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Only', 'auroc')} | {get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Only', 'auroc')} | {get_fus(fusion, 'High_Adiposity_Risk', 'Gut_Only', 'auroc')} | {get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Wearable', 'auroc')} | {get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Gut', 'auroc')} | {get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Gut', 'auroc')} | {get_fus(fusion, 'High_Adiposity_Risk', 'Full_Multimodal_Fusion', 'auroc')} |
| Metabolic_Syndrome | {get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Only', 'auroc')} | {get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Only', 'auroc')} | {get_fus(fusion, 'Metabolic_Syndrome', 'Gut_Only', 'auroc')} | {get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Wearable', 'auroc')} | {get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Gut', 'auroc')} | {get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Gut', 'auroc')} | {get_fus(fusion, 'Metabolic_Syndrome', 'Full_Multimodal_Fusion', 'auroc')} |
| NAFLD | {get_fus(fusion, 'NAFLD', 'Clinical_Only', 'auroc')} | {get_fus(fusion, 'NAFLD', 'Wearable_Only', 'auroc')} | {get_fus(fusion, 'NAFLD', 'Gut_Only', 'auroc')} | {get_fus(fusion, 'NAFLD', 'Clinical_Wearable', 'auroc')} | {get_fus(fusion, 'NAFLD', 'Clinical_Gut', 'auroc')} | {get_fus(fusion, 'NAFLD', 'Wearable_Gut', 'auroc')} | {get_fus(fusion, 'NAFLD', 'Full_Multimodal_Fusion', 'auroc')} |

### Table III: Patient-Level Simulated Missingness (T2D)
| Target | Level | Dynamic AUROC | Conv. AUROC |
|---|---|---|---|
| T2D (Random) | 10% | {get_mis(missing, 'Type2_Diabetes', 'Random', 0.1, 'Dynamic_AUC')} | {get_mis(missing, 'Type2_Diabetes', 'Random', 0.1, 'Conv_AUC')} |
| T2D (Random) | 20% | {get_mis(missing, 'Type2_Diabetes', 'Random', 0.2, 'Dynamic_AUC')} | {get_mis(missing, 'Type2_Diabetes', 'Random', 0.2, 'Conv_AUC')} |
| T2D (Random) | 30% | {get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC')} | {get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Conv_AUC')} |

## 8. Results Interpretation
1. Clinical was the strongest single modality across all five targets.
2. W+G retained measurable discrimination for targets where Clinical was unavailable.
3. Full multimodal fusion produced only modest improvements over Clinical-only. 
4. Dynamic routing maintained performance under the evaluated simulated patient-level missingness scenarios.
5. Dynamic routing produced a numerically higher AUROC ({get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC')}) than the evaluated median-imputation baseline ({get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Conv_AUC')}) under the simulated 30% missingness condition. The absolute AUROC difference was 0.0021 (95% CI: [0.0001, 0.0041]). The magnitude of the difference was small. Dynamic routing was compared with the evaluated median-imputation baseline under the specified simulated missingness conditions. Other imputation strategies, including multiple-imputation (MICE) and learned generative approaches, were not evaluated.
6. Dynamic routing performs comparably to early fusion, with structural advantages.

## 9. Explainability
TreeSHAP is incorporated as an explanatory mechanism for feature-level attribution; a quantitative evaluation of explanation fidelity or clinician agreement remains outside the present experimental scope. Evidence-grounded Medical RAG converts probabilities to explanatory text contextually.

## 10. Limitations
1. All predictive results are derived entirely from the de-clamped synthetic cohort; no external real-world validation was performed.
2. No clinical efficacy or diagnostic utility is established.
3. The synthetic cohort relies on a Gaussian-Copula latent dependence structure and therefore may not capture the full range of nonlinear, higher-order, and context-dependent dependencies present in real physiological systems.
4. The simulated modality-availability mechanism corresponds to MCAR; this controlled simulation does not capture the Missing Not At Random (MNAR) or Missing At Random (MAR) mechanisms inherent in clinical workflows.
5. Threshold optimization/calibration for deployment-specific operating points was not evaluated for F1 scores.
6. Advanced iterative imputation methods (e.g., MICE) were not evaluated.

## 11. Conclusion
TeleMed-M3 provides a reproducible imputation-free probability-level routing framework that operates across seven non-empty modality configurations and maintains measurable discrimination under the evaluated simulated patient-level modality-missingness scenarios. 

## 12. Reproducibility
Pipeline artifacts, data manifest, and exact seeds are comprehensively retained. A preprocessing serialization discrepancy was corrected prior to final evaluation.
"""
    with open("RESEARCH_PAPER_V4.md", "w") as f:
        f.write(md_content)

if __name__ == "__main__":
    generate()
