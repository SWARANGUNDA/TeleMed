import json
import pandas as pd
import pathlib

def generate_paper():
    with open('final_results.json', 'r') as f:
        data = json.load(f)
        
    expert = pd.DataFrame(data['expert_performance'])
    fusion = pd.DataFrame(data['fusion_performance'])
    missing = pd.DataFrame(data['missingness_performance'])
    stats = pd.DataFrame(data['statistical_tests'])

    # Helper function to get metric
    def get_fus(target, pathway, metric):
        row = fusion[(fusion['Target'] == target) & (fusion['Pathway'] == pathway)]
        return f"{row.iloc[0][metric]:.4f}" if not row.empty else "N/A"

    def get_exp(target, mod, metric):
        row = expert[(expert['Target'] == target) & (expert['Modality'] == mod)]
        return f"{row.iloc[0][metric]:.4f}" if not row.empty else "N/A"
        
    def get_mis(target, mode, level, model):
        row = missing[(missing['Target'] == target) & (missing['Mode'] == mode) & (missing['Level'] == level)]
        return f"{row.iloc[0][model]:.4f}" if not row.empty else "N/A"

    md_content = f"""# TeleMed-M3: Dynamic Imputation-Free Multimodal Learning for Explainable Metabolic Disease Risk Stratification

**Abstract**
*Background:* Multimodal metabolic risk assessment may combine Clinical, Wearable/CGM, and Gut Microbiome information, but modality availability can vary greatly. *Problem:* Conventional multimodal systems often require complete feature blocks or rely on numerical imputation when modalities are unavailable, which may introduce unwanted distributional assumptions. *Method:* TeleMed-M3 uses modality-specific expert models and probability-level stacking across all seven non-empty modality combinations (C, W, G, C+W, C+G, W+G, C+W+G). We evaluated this architecture on a 100,000-patient de-clamped probabilistic synthetic cohort (70/15/15 split). *Results:* Clinical was the strongest single modality across all five targets (e.g., T2D AUROC {get_fus('Type2_Diabetes', 'Clinical_Only', 'auroc')}). Wearable+Gut retained measurable discrimination when Clinical was unavailable (T2D AUROC {get_fus('Type2_Diabetes', 'Wearable_Gut', 'auroc')}). Full multimodal gains over Clinical-only were mathematically valid but modest. The dynamic routing architecture outperformed conventional median imputation at simulated 10-30% patient-level missingness (e.g., 30% uniform random T2D AUROC {get_mis('Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC')} vs. {get_mis('Type2_Diabetes', 'Random', 0.3, 'Conv_AUC')}). *Conclusion:* The primary contribution is modality-flexible, imputation-free probability-level routing under evaluated synthetic missingness conditions, demonstrating robust degradation without universal raw-performance superiority over early fusion.

## 1. Introduction
Metabolic disease is highly multifactorial, requiring diverse lenses of measurement. Clinical measurements are strong predictive markers but may be unavailable at every encounter. Wearables provide longitudinal behavioral and physiological information, while the gut microbiome provides complementary biological information. However, multimodal systems face heterogeneous modality availability; a patient may have clinical labs but lack wearable data. Conventional numerical imputation can introduce unwarranted assumptions about unavailable modalities. Dynamic routing can instead operate strictly on the subset of available modality experts. This study evaluates simulated modality missingness and introduces TeleMed-M3, an imputation-free probability-level stacking framework.

## 2. Research Questions
**RQ1:** How does each modality independently discriminate the five metabolic risk targets in the de-clamped synthetic cohort?
**RQ2:** How does probability-level fusion perform across all seven non-empty modality combinations?
**RQ3:** Does multimodal fusion provide measurable incremental discrimination over Clinical-only prediction?
**RQ4:** Can the dynamic routing architecture maintain predictive performance under simulated patient-level modality missingness?
**RQ5:** How does dynamic routing compare with conventional modality imputation?
**RQ6:** How does probability-level dynamic routing compare with conventional early fusion?
**RQ7:** How can TreeSHAP and evidence-grounded Medical RAG support explainable risk reporting? (Methodological/exploratory framework).

## 3. Contributions
1. An imputation-free dynamic modality-routing architecture covering all seven non-empty modality configurations.
2. Modality-specific expert modeling for Clinical, Wearable/CGM, and Gut Microbiome data across five metabolic risk targets.
3. Out-of-fold (OOF) probability-level stacking with reproducible Pipeline-based preprocessing.
4. Controlled evaluation under simulated patient-level modality missingness.
5. Comparison with conventional median-imputation and early-fusion baselines.
6. TreeSHAP and evidence-grounded Medical RAG reporting architecture as an exploratory methodology for explainability.

## 4. Related Work
Multimodal fusion in digital health frequently defaults to early concatenation with mean/median imputation or advanced generative imputation. Works exploring flexible modality availability highlight the necessity of sub-network routing. In contrast to purely generative imputation, our approach bypasses missing features entirely by fusing predictions strictly from instantiated modality-specific experts.

## 5. Dataset: De-Clamped Probabilistic Synthetic Cohort
The evaluation utilized a 100,000-patient synthetic cohort mapped to five metabolic targets. The dataset contains 18 Clinical features, 15 Wearable/CGM features, and 49 predictive Gut dimensions. The distributions were generated using a Gaussian-Copula latent structure to model multivariate covariance. The data was split 70% Train, 15% Validation, and 15% Test. 

### 5.1. Deterministic Label-Feature Coupling Audit
An earlier generation mechanism applied post-label deterministic clinical clamping to diagnostic variables. This induced target-feature leakage resulting in artificial ~0.99 AUROCs. The near-perfect Clinical discrimination in the clamped cohort was attributable to deterministic label-feature coupling and therefore was not interpretable as generalizable predictive performance. TeleMed-M3 was comprehensively re-evaluated strictly on the de-clamped probabilistic synthetic cohort. 

## 6. Methodology
**A. Modality-Specific Experts:** Independent tree-based and linear classifiers trained on C, W, and G.
**B. Preprocessing Pipelines:** Strict `sklearn.pipeline.Pipeline` enforcement to prevent scaling leakage.
**C. Probability-Level Stacking:** OOF predictions from base learners formulate the meta-feature space.
**D. Seven Modality Pathways:** Meta-learners trained on all non-empty subsets (C, W, G, C+W, C+G, W+G, C+W+G).
**E. Dynamic Routing:** Patient data routes to the specific pre-trained meta-learner corresponding to their available modalities. No unavailable variables are imputed.
**F. Simulated Missingness:** Modalities were artificially dropped at patient-level independent uniform probabilities.
**G. Baselines:** Compared against global median-imputation on concatenated features, and Early-Fusion frameworks.

## 7. Experimental Results

### Table I: 15 Expert Models
| Modality | Target | AUROC | AUPRC | F1 | Brier |
|---|---|---|---|---|---|
| Clinical | Type2_Diabetes | {get_exp('Type2_Diabetes', 'Clinical', 'auroc')} | {get_exp('Type2_Diabetes', 'Clinical', 'auprc')} | {get_exp('Type2_Diabetes', 'Clinical', 'f1')} | {get_exp('Type2_Diabetes', 'Clinical', 'brier')} |
| Wearable | Type2_Diabetes | {get_exp('Type2_Diabetes', 'Wearable', 'auroc')} | {get_exp('Type2_Diabetes', 'Wearable', 'auprc')} | {get_exp('Type2_Diabetes', 'Wearable', 'f1')} | {get_exp('Type2_Diabetes', 'Wearable', 'brier')} |
| Gut | Type2_Diabetes | {get_exp('Type2_Diabetes', 'Gut', 'auroc')} | {get_exp('Type2_Diabetes', 'Gut', 'auprc')} | {get_exp('Type2_Diabetes', 'Gut', 'f1')} | {get_exp('Type2_Diabetes', 'Gut', 'brier')} |
| Clinical | Prediabetes | {get_exp('Prediabetes', 'Clinical', 'auroc')} | {get_exp('Prediabetes', 'Clinical', 'auprc')} | {get_exp('Prediabetes', 'Clinical', 'f1')} | {get_exp('Prediabetes', 'Clinical', 'brier')} |
| Wearable | Prediabetes | {get_exp('Prediabetes', 'Wearable', 'auroc')} | {get_exp('Prediabetes', 'Wearable', 'auprc')} | {get_exp('Prediabetes', 'Wearable', 'f1')} | {get_exp('Prediabetes', 'Wearable', 'brier')} |
| Gut | Prediabetes | {get_exp('Prediabetes', 'Gut', 'auroc')} | {get_exp('Prediabetes', 'Gut', 'auprc')} | {get_exp('Prediabetes', 'Gut', 'f1')} | {get_exp('Prediabetes', 'Gut', 'brier')} |
| Clinical | High_Adiposity_Risk | {get_exp('High_Adiposity_Risk', 'Clinical', 'auroc')} | {get_exp('High_Adiposity_Risk', 'Clinical', 'auprc')} | {get_exp('High_Adiposity_Risk', 'Clinical', 'f1')} | {get_exp('High_Adiposity_Risk', 'Clinical', 'brier')} |
| Wearable | High_Adiposity_Risk | {get_exp('High_Adiposity_Risk', 'Wearable', 'auroc')} | {get_exp('High_Adiposity_Risk', 'Wearable', 'auprc')} | {get_exp('High_Adiposity_Risk', 'Wearable', 'f1')} | {get_exp('High_Adiposity_Risk', 'Wearable', 'brier')} |
| Gut | High_Adiposity_Risk | {get_exp('High_Adiposity_Risk', 'Gut', 'auroc')} | {get_exp('High_Adiposity_Risk', 'Gut', 'auprc')} | {get_exp('High_Adiposity_Risk', 'Gut', 'f1')} | {get_exp('High_Adiposity_Risk', 'Gut', 'brier')} |
| Clinical | Metabolic_Syndrome | {get_exp('Metabolic_Syndrome', 'Clinical', 'auroc')} | {get_exp('Metabolic_Syndrome', 'Clinical', 'auprc')} | {get_exp('Metabolic_Syndrome', 'Clinical', 'f1')} | {get_exp('Metabolic_Syndrome', 'Clinical', 'brier')} |
| Wearable | Metabolic_Syndrome | {get_exp('Metabolic_Syndrome', 'Wearable', 'auroc')} | {get_exp('Metabolic_Syndrome', 'Wearable', 'auprc')} | {get_exp('Metabolic_Syndrome', 'Wearable', 'f1')} | {get_exp('Metabolic_Syndrome', 'Wearable', 'brier')} |
| Gut | Metabolic_Syndrome | {get_exp('Metabolic_Syndrome', 'Gut', 'auroc')} | {get_exp('Metabolic_Syndrome', 'Gut', 'auprc')} | {get_exp('Metabolic_Syndrome', 'Gut', 'f1')} | {get_exp('Metabolic_Syndrome', 'Gut', 'brier')} |
| Clinical | NAFLD | {get_exp('NAFLD', 'Clinical', 'auroc')} | {get_exp('NAFLD', 'Clinical', 'auprc')} | {get_exp('NAFLD', 'Clinical', 'f1')} | {get_exp('NAFLD', 'Clinical', 'brier')} |
| Wearable | NAFLD | {get_exp('NAFLD', 'Wearable', 'auroc')} | {get_exp('NAFLD', 'Wearable', 'auprc')} | {get_exp('NAFLD', 'Wearable', 'f1')} | {get_exp('NAFLD', 'Wearable', 'brier')} |
| Gut | NAFLD | {get_exp('NAFLD', 'Gut', 'auroc')} | {get_exp('NAFLD', 'Gut', 'auprc')} | {get_exp('NAFLD', 'Gut', 'f1')} | {get_exp('NAFLD', 'Gut', 'brier')} |

### Table II: 7x5 AUROC Matrix
| Target | P1 (C) | P2 (W) | P3 (G) | P4 (C+W) | P5 (C+G) | P6 (W+G) | P7 (C+W+G) |
|---|---|---|---|---|---|---|---|
| Type2_Diabetes | {get_fus('Type2_Diabetes', 'Clinical_Only', 'auroc')} | {get_fus('Type2_Diabetes', 'Wearable_Only', 'auroc')} | {get_fus('Type2_Diabetes', 'Gut_Only', 'auroc')} | {get_fus('Type2_Diabetes', 'Clinical_Wearable', 'auroc')} | {get_fus('Type2_Diabetes', 'Clinical_Gut', 'auroc')} | {get_fus('Type2_Diabetes', 'Wearable_Gut', 'auroc')} | {get_fus('Type2_Diabetes', 'Full_Multimodal_Fusion', 'auroc')} |
| Prediabetes | {get_fus('Prediabetes', 'Clinical_Only', 'auroc')} | {get_fus('Prediabetes', 'Wearable_Only', 'auroc')} | {get_fus('Prediabetes', 'Gut_Only', 'auroc')} | {get_fus('Prediabetes', 'Clinical_Wearable', 'auroc')} | {get_fus('Prediabetes', 'Clinical_Gut', 'auroc')} | {get_fus('Prediabetes', 'Wearable_Gut', 'auroc')} | {get_fus('Prediabetes', 'Full_Multimodal_Fusion', 'auroc')} |
| High_Adiposity_Risk | {get_fus('High_Adiposity_Risk', 'Clinical_Only', 'auroc')} | {get_fus('High_Adiposity_Risk', 'Wearable_Only', 'auroc')} | {get_fus('High_Adiposity_Risk', 'Gut_Only', 'auroc')} | {get_fus('High_Adiposity_Risk', 'Clinical_Wearable', 'auroc')} | {get_fus('High_Adiposity_Risk', 'Clinical_Gut', 'auroc')} | {get_fus('High_Adiposity_Risk', 'Wearable_Gut', 'auroc')} | {get_fus('High_Adiposity_Risk', 'Full_Multimodal_Fusion', 'auroc')} |
| Metabolic_Syndrome | {get_fus('Metabolic_Syndrome', 'Clinical_Only', 'auroc')} | {get_fus('Metabolic_Syndrome', 'Wearable_Only', 'auroc')} | {get_fus('Metabolic_Syndrome', 'Gut_Only', 'auroc')} | {get_fus('Metabolic_Syndrome', 'Clinical_Wearable', 'auroc')} | {get_fus('Metabolic_Syndrome', 'Clinical_Gut', 'auroc')} | {get_fus('Metabolic_Syndrome', 'Wearable_Gut', 'auroc')} | {get_fus('Metabolic_Syndrome', 'Full_Multimodal_Fusion', 'auroc')} |
| NAFLD | {get_fus('NAFLD', 'Clinical_Only', 'auroc')} | {get_fus('NAFLD', 'Wearable_Only', 'auroc')} | {get_fus('NAFLD', 'Gut_Only', 'auroc')} | {get_fus('NAFLD', 'Clinical_Wearable', 'auroc')} | {get_fus('NAFLD', 'Clinical_Gut', 'auroc')} | {get_fus('NAFLD', 'Wearable_Gut', 'auroc')} | {get_fus('NAFLD', 'Full_Multimodal_Fusion', 'auroc')} |

### Table III: Patient-Level Simulated Missingness (T2D & Prediabetes Subset)
| Target | Level | Mode | Dynamic AUROC | Conventional AUROC |
|---|---|---|---|---|
| T2D | 10% | Random Uniform | {get_mis('Type2_Diabetes', 'Random', 0.1, 'Dynamic_AUC')} | {get_mis('Type2_Diabetes', 'Random', 0.1, 'Conv_AUC')} |
| T2D | 20% | Random Uniform | {get_mis('Type2_Diabetes', 'Random', 0.2, 'Dynamic_AUC')} | {get_mis('Type2_Diabetes', 'Random', 0.2, 'Conv_AUC')} |
| T2D | 30% | Random Uniform | {get_mis('Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC')} | {get_mis('Type2_Diabetes', 'Random', 0.3, 'Conv_AUC')} |
| Prediabetes | 10% | Random Uniform | {get_mis('Prediabetes', 'Random', 0.1, 'Dynamic_AUC')} | {get_mis('Prediabetes', 'Random', 0.1, 'Conv_AUC')} |
| Prediabetes | 20% | Random Uniform | {get_mis('Prediabetes', 'Random', 0.2, 'Dynamic_AUC')} | {get_mis('Prediabetes', 'Random', 0.2, 'Conv_AUC')} |
| Prediabetes | 30% | Random Uniform | {get_mis('Prediabetes', 'Random', 0.3, 'Dynamic_AUC')} | {get_mis('Prediabetes', 'Random', 0.3, 'Conv_AUC')} |

## 8. Interpretation & Discussion
1. **Clinical Dominance:** Clinical was the strongest single modality across all five targets. 
2. **Alternative Modality Utility:** W+G retained measurable discrimination for targets where Clinical was unavailable (e.g., T2D AUROC {get_fus('Type2_Diabetes', 'Wearable_Gut', 'auroc')}).
3. **Multimodal Gains:** Full multimodal fusion produced only modest numerical improvements over Clinical-only. 
4. **Imputation Superiority:** The evaluated dynamic routing approach produced higher AUROC ({get_mis('Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC')}) relative to the evaluated median-imputation baseline ({get_mis('Type2_Diabetes', 'Random', 0.3, 'Conv_AUC')}) under simulated 30% random missingness.
5. **Early Fusion Comparison:** Dynamic routing achieved equivalent performance to Early Fusion for most targets while providing structural resilience to missingness.

## 9. Explainability
TreeSHAP is incorporated as an explanatory mechanism for feature-level attribution; a quantitative evaluation of explanation fidelity or clinician agreement remains outside the present experimental scope. Evidence-grounded Medical RAG serves as an architectural design for translating model probabilities into explanatory context without executing diagnostic directives.

## 10. Limitations
The entire cohort is mathematically synthetic; therefore, the results do not establish diagnostic or treatment efficacy. There is no external clinical validation, and the generative distributions may not capture true biological heterogeneity. The missingness mechanism is entirely simulated. 

## 11. Conclusion
TeleMed-M3 provides a reproducible imputation-free probability-level routing framework that operates across seven non-empty modality configurations and maintains measurable discrimination under the evaluated simulated patient-level modality-missingness scenarios. 

## 12. Reproducibility
All artifacts, including the de-clamped Gaussian-Copula generator, Pipeline models, probability matrices, and statistical bootstraps, are rigorously preserved and versioned. Exact train/val/test seeds and patient subsets were identically locked across all baseline comparisons.
"""

    with open("RESEARCH_PAPER_V4.md", "w") as f:
        f.write(md_content)
        
    print("Markdown generated.")

if __name__ == "__main__":
    generate_paper()
