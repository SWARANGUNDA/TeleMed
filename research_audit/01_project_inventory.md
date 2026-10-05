# 01 Project Inventory Audit

## 1. Scope & Objective
This document provides a systematic inventory of all scientific, architectural, and data components within the TeleMed repository as part of Phase 1 of the publication-readiness audit.

## ML Models
**Total Files:** 16

```text
- ai\models\__init__.py
- ai\models\clinical\clinical_v4_expert_payload.joblib
- ai\models\clinical\__init__.py
- ai\models\fusion\v4_multimodal_fusion_payload.joblib
- ai\models\fusion\wg_logistic_regression_stacker.joblib
- ai\models\fusion\__init__.py
- ai\models\gut_microbiome\gut_v4_expert_payload.joblib
- ai\models\gut_microbiome\__init__.py
- ai\models\wearable_cgm\wearable_v4_expert_payload.joblib
- ai\models\wearable_cgm\__init__.py
- expert_models\v4_artifacts\clinical_v4_expert_payload.joblib
- expert_models\v4_artifacts\gut_v4_expert_payload.joblib
- expert_models\v4_artifacts\v4_expert_classifier_comparison.csv
- expert_models\v4_artifacts\v4_expert_test_metrics_with_95ci.csv
- expert_models\v4_artifacts\v4_selected_expert_models_summary.json
... and 1 more files
```

## Data Generation
**Total Files:** 51

```text
- .\generate_pdf_reports.py
- .\generate_test_reports.py
- ai\datasets\generation\generate_multimodal_v4_dataset.py
- ai\datasets\generation\__init__.py
- ai\datasets\generation\clinical\analyze_dataset.py
- ai\datasets\generation\clinical\anthropometry.py
- ai\datasets\generation\clinical\comorbidity.py
- ai\datasets\generation\clinical\config.py
- ai\datasets\generation\clinical\demographics.py
- ai\datasets\generation\clinical\disease_rules.py
- ai\datasets\generation\clinical\exporter.py
- ai\datasets\generation\clinical\family_history.py
- ai\datasets\generation\clinical\laboratory.py
- ai\datasets\generation\clinical\main.py
- ai\datasets\generation\clinical\missingness.py
... and 36 more files
```

## Datasets
**Total Files:** 271

```text
- ai\datasets\final\clinical_v4.csv
- ai\datasets\final\gut_v4.csv
- ai\datasets\final\labels_v4.csv
- ai\datasets\final\patient_metadata_v4.csv
- ai\datasets\final\test_ids_v4.csv
- ai\datasets\final\train_ids_v4.csv
- ai\datasets\final\v4_final_scientific_qc_audit.json
- ai\datasets\final\v4_final_statistical_validation.csv
- ai\datasets\final\v4_qc_and_signal_audit.json
- ai\datasets\final\val_ids_v4.csv
- ai\datasets\final\wearable_v4.csv
- ai\datasets\schemas\clinical_features.json
- ai\datasets\schemas\gut_features.json
- ai\datasets\schemas\gut_features_v2.json
- ai\datasets\schemas\wearable_features.json
... and 256 more files
```

## Frontend
**Total Files:** 353

```text
- app\frontend\Dockerfile
- app\frontend\index.html
- app\frontend\package-lock.json
- app\frontend\package.json
- app\frontend\postcss.config.js
- app\frontend\tailwind.config.js
- app\frontend\vercel.json
- app\frontend\vite.config.js
- app\frontend\dist\index.html
- app\frontend\dist\manifest.webmanifest
- app\frontend\dist\robots.txt
- app\frontend\dist\sitemap.xml
- app\frontend\dist\sw.js
- app\frontend\dist\vite.svg
- app\frontend\dist\assets\AboutPage-DL4FcJ7J.js
... and 338 more files
```

## Backend
**Total Files:** 3664

```text
- app\backend\.env
- app\backend\.env.example
- app\backend\alembic.ini
- app\backend\api_standardizer.py
- app\backend\auth.py
- app\backend\celery_app.py
- app\backend\config.py
- app\backend\database_legacy.py
- app\backend\Dockerfile
- app\backend\logging_config.py
- app\backend\main.py
- app\backend\platform_observability.py
- app\backend\prometheus_metrics.py
- app\backend\requirements.txt
- app\backend\security.py
... and 3649 more files
```

## Tests
**Total Files:** 92

```text
- tests\__init__.py
- tests\e2e\test_all_combination_pathways_dom.py
- tests\e2e\test_final_audit.py
- tests\e2e\test_full_app_audit.py
- tests\e2e\test_level2_patient_portal.py
- tests\e2e\test_level3_health_records.py
- tests\e2e\test_level5_consultations.py
- tests\e2e\test_ocr_c001_audit.py
- tests\e2e\__init__.py
- tests\fixtures\__init__.py
- tests\fixtures\medical_reports\c001\c001_report.docx
- tests\fixtures\medical_reports\c001\c001_report.jpg
- tests\fixtures\medical_reports\c001\c001_report.json
- tests\fixtures\medical_reports\c001\c001_report.pdf
- tests\fixtures\medical_reports\c001\c001_report.png
... and 77 more files
```

## Documentation
**Total Files:** 98

```text
- .\Doctor_Review_Report.docx
- .\README.md
- .\TeleMed_AI_v4_Master_Technical_Report_FINAL.docx
- .\TeleMed_Comprehensive_Architecture_Review.docx
- .gemini\antigravity-ide\brain\fb0b32e7-7707-4ace-8ef3-b0bd28a0f02e\walkthrough.md
- ai\datasets\final\V4_DATASET_SPECIFICATION.md
- ai\datasets\schemas\V4_DATASET_SPECIFICATION.md
- archive\ARCHIVE_INDEX.md
- archive\experimental_code\expert_models_reports\phase3_final_audit_report.md
- archive\experimental_code\expert_models_reports\final_expert_comparison\comparison_report.md
- archive\experimental_code\expert_models_reports\publication_v4\FINAL_V4_PUBLICATION_RESULTS_REPORT.md
- archive\experimental_code\expert_models_reports\publication_v4\FINAL_V4_TEST_EVALUATION_REPORT.md
- archive\experimental_code\expert_models_reports\publication_v4\SPRINT_25_3_V3_V4_STATISTICAL_COMPARISON_REPORT.md
- archive\experimental_code\expert_models_reports\publication_v4\SPRINT_25_4_XAI_SCIENTIFIC_ANALYSIS_REPORT.md
- archive\experimental_code\expert_models_reports\publication_v4\v3_vs_v4_report.md
... and 83 more files
```

## 2. Classification according to Prompt Rules
- **[A] Implemented:** The core architecture, synthetic data generation, UI, and test suites are physically present.
- **[E] Hypothesis:** The Zero-imputation robustness and TreeSHAP causality.
- **[G] Unsupported (Requires Experimentation):** The exact baseline statistical superiority metrics are pending reproducible evaluation scripts.
