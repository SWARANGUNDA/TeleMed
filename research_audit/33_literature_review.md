# Phase 33: Literature Review & Gap Analysis

## Overview
This document reviews the current state of multimodal medical AI and missing data strategies in clinical machine learning, establishing the foundation for our zero-imputation dynamic routing architecture.

## 1. Multimodal Clinical AI
**State of the Art:** Recent works (e.g., *Acosta et al., 2022, Nat Med*) emphasize the necessity of combining disparate modalities (e.g., EHR, imaging, genomics, wearables) to achieve comprehensive patient representation. However, most existing frameworks assume complete datasets during inference or rely on modality-specific early fusion mechanisms that fail when entire modalities are missing.

**The TeleMed Gap:** While multimodal fusion is mature, the integration of high-frequency wearable time-series (CGM, HR) with point-in-time clinical panels and compositional gut microbiome data remains largely unexplored, particularly at the scale of 100,000 patients.

## 2. Missing Modality Strategies in Deep Learning
**State of the Art:** 
- **Statistical Imputation:** Mean, median, or KNN imputation (e.g., *Van Buuren, 2018*) are standard but introduce severe bias and variance suppression when an entire modality block (e.g., 51 gut microbiome features) is missing.
- **Generative Imputation:** GANs and VAEs (e.g., *Yoon et al., GAIN, 2018*) attempt to synthesize missing features. While effective for sparse missingness, generating entirely unobserved modalities (e.g., hallucinating a gut microbiome from a Fitbit) creates clinical risk and ungrounded "hallucinated" features.
- **Latent Space Fusion:** Approaches like multimodal transformers attempt to align modalities in a shared latent space, but often require complex masking strategies during training.

**The TeleMed Gap:** The literature lacks architectures that fundamentally reject imputation in favor of dynamically routing patients to specialized, modality-specific expert models based on their available data configuration.

## 3. Explainability in Multi-Stage Fusion
**State of the Art:** TreeSHAP (*Lundberg et al., 2020*) and LIME are standard for tabular data. However, in late-fusion (stacking) models, attributing the meta-learner's decision back to the original raw features (e.g., specific gut taxa) across disparate base models is computationally complex and often ignored.

**The TeleMed Gap:** Our architecture provides dual-level explainability: meta-learner modality weights (clinical vs wearable vs gut) and expert-level raw feature TreeSHAP, addressing the "black-box" criticism of stacked ensembles.

## Scientific Positioning for Manuscript
Our manuscript will position the **Zero-Imputation Dynamic Routing Framework** as a deterministic, mathematically sound alternative to generative or statistical imputation, proven through rigorous ablation and missing-modality simulation (Phase 22).
