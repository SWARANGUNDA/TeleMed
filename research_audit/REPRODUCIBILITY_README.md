# TeleMed AI V4 Reproducibility Guide

## Environment
- Python 3.12.10
- scikit-learn 1.8.0
- CatBoost 1.2.10
- SHAP 0.52.0

## Data Generation
Run i/datasets/generation/dataset_generator.py (Fixed seed: 20260808)

## Expert Models
Run i/evaluation/evaluate_all_experts.py

## Fusion Engine
Run i/evaluation/fusion_evaluator.py

## Master Phase 7 Evaluation
Run i/evaluation/run_phase7_evaluation.py

## Paper Compilation
Compile 
esearch_audit/manuscript.tex with pdflatex and bibtex.
