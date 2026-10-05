# Phase 34: Related Work Matrix

| Reference Approach | Modalities Supported | Missing Data Strategy | Explainability | Cohort Size | Code Availability | Core Limitation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Traditional EHR Risk Models** (e.g., Framingham, QRISK) | Clinical Only | Mean/Median Imputation | None / Linear Coefs | >100,000 | Variable | Ignores continuous lifestyle & microbiome factors |
| **Deep Multimodal Fusion** (e.g., Acosta et al., 2022) | Clinical + Imaging | Requires Complete Data | Saliency Maps | 5,000 - 50,000 | Yes | Cannot handle entire missing modalities at inference |
| **Generative Imputation** (GAIN, VAEs) | Tabular / Clinical | Generative Synthesis | None | < 10,000 | Yes | Hallucinates unobserved physiological systems, risking clinical error |
| **Late Fusion / Stacking ensembles** | Any | Complete Case Analysis | Global Permutation | < 10,000 | Yes | Often drop patients with missing modalities, limiting clinical utility |
| **Our Approach (TeleMed Zero-Imputation)** | Clinical + Wearable (CGM) + Gut Microbiome | **Zero-Imputation Dynamic Routing** | Dual-Level (Meta-Weights + TreeSHAP) | 100,000 | Yes | Relies on availability of multiple trained expert baselines |

## Key Differentiators to Highlight in Manuscript:
1. **Scale & Complexity:** Integrating Gut Microbiome (40 taxa) and continuous Wearable metrics (CGM) alongside traditional clinical panels on a massive $N=100,000$ cohort.
2. **Methodological Safety:** Refusing to hallucinate clinical data (Zero-Imputation) in favor of dynamically routing to the optimal sub-model based on the patient's specific available data configuration ($2^3 - 1 = 7$ pathways).
3. **Rigorous Validation:** Statistical proof (bootstrap CIs, paired tests) demonstrating the robustness of this routing approach under 30% simulated missingness.
