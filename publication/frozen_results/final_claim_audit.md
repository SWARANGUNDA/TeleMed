# Final Phase 4D Claim Audit

This document summarizes the scientific status of each fundamental claim in the TeleMed-M3 manuscript following the final Phase 4 de-clamping, missingness, and baseline reproducibility audits.

| Claim | Evidence | Statistical Support | Final Status |
|---|---|---|---|
| A. Clinical is strongest single modality. | AUROC for Clinical_Only is strictly higher than Wearable_Only or Gut_Only across all 5 disease targets. | Evaluated via exact metrics on N=15,000 test set. | **SUPPORTED** |
| B. W+G retains measurable discrimination without Clinical. | W+G achieves AUROC of 0.6894 (T2D), 0.6607 (Adiposity), and 0.6621 (NAFLD), well above random chance (0.50). | Evaluated via exact metrics on N=15,000 test set. | **SUPPORTED** |
| C. Adding modalities improves performance. | C+W provides a numerically valid improvement over C alone. However, C+W+G provides almost identical performance to C+W, indicating diminishing returns for Gut. | Bootstrap testing demonstrates marginal or insignificant gains between P4 and P7. | **PARTIALLY SUPPORTED** |
| D. Dynamic routing handles simulated patient-level modality loss. | Model gracefully degrades from 0.7834 (0% missing) to 0.7744 (30% uniform missingness) on T2D. | Tested across all 5 targets under 10%, 20%, 30% missingness levels. | **SUPPORTED** |
| E. Dynamic routing outperforms conventional imputation. | Dynamic probability routing strictly outperformed median feature imputation at every missingness level (10-30%) across all targets. | Repeated evaluation across 3 distinct random seeds. | **SUPPORTED** |
| F. Dynamic routing outperforms early fusion. | Performance is essentially identical for 4/5 targets. A structural advantage was demonstrated for Prediabetes, but overall superiority cannot be claimed. | Evaluated against mathematically identical features and test splits. | **PARTIALLY SUPPORTED** |
| G. TeleMed-M3 demonstrates clinical validity. | The dataset is an entirely synthetic latent distribution. There is no biological validation or external real-world cohort validation. | N/A - Synthetic data limitation. | **NOT SUPPORTED** |

## Summary of Prohibited Scientific Language
- "clinical validation" -> "evaluated under synthetic conditions"
- "clinically proven" -> "mathematically demonstrated"
- "significant improvement" -> "numerical improvement" or "measurable discrimination"
- "real-world missingness robustness" -> "simulated patient-level modality missingness"
- "perfect prediction" -> "0.77 - 0.80 AUROC"
