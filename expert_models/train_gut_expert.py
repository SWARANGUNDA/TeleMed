"""
train_gut_expert.py — Training & Freezing Pipeline for Gut Microbiome Expert Model.

Executes:
1. Load Gut Microbiome Dataset & Master Patient Split
2. Fit Leakage-Safe Preprocessor on Train split
3. Fit & Benchmark Baselines (Dummy, Logistic Regression)
4. Train & Compare Candidate GBDT Architectures (XGBoost, LightGBM, CatBoost, Random Forest)
5. Select Best Validated Architecture
6. Tune Classification Thresholds on Validation fold ONLY
7. Fit Probability Calibrator on Validation fold
8. Fit SHAP TreeExplainer
9. Evaluate on untouched Test set
10. Freeze and Save Artifacts to expert_models/saved_models/gut_v1/
"""

import json
import logging

from . import (
    artifact_manager,
    baselines,
    calibration,
    config,
    data_loader,
    explainer,
    metrics,
    preprocessing,
    threshold_tuner,
    trainer,
)

logger = logging.getLogger("expert_models.train_gut")


def run_gut_expert_pipeline():
    """Run end-to-end training and freezing pipeline for Gut Microbiome Expert."""
    logger.info("==================================================================")
    logger.info("     GUT MICROBIOME EXPERT MODEL TRAINING & FREEZING PIPELINE     ")
    logger.info("==================================================================")

    # Step 1: Load dataset & master split
    X, y, splits, approved_predictors = data_loader.load_dataset_for_expert(
        dataset_path=config.GUT_DATASET_PATH,
        schema_filename="gut_features.json"
    )

    train_mask = (splits == "train")
    val_mask = (splits == "val")
    test_mask = (splits == "test")

    X_train, y_train = X[train_mask], y[train_mask]
    X_val, y_val = X[val_mask], y[val_mask]
    X_test, y_test = X[test_mask], y[test_mask]

    # Step 2: Fit Leakage-Safe Preprocessor
    preprocessor = preprocessing.ExpertPreprocessor(
        feature_order=approved_predictors,
        preserve_nans=True,
        scale_numeric=False
    )
    X_train_prep = preprocessor.fit_transform(X_train)
    X_val_prep = preprocessor.transform(X_val)
    X_test_prep = preprocessor.transform(X_test)

    # Step 3: Train & Benchmark Baselines
    logger.info("Evaluating Baseline Models...")
    base_lr = baselines.MultiDiseaseBaselineEstimator(baseline_type="logistic_regression")
    base_prep = preprocessing.ExpertPreprocessor(feature_order=approved_predictors, preserve_nans=False, scale_numeric=True)
    X_train_lr = base_prep.fit_transform(X_train)
    X_val_lr = base_prep.transform(X_val)
    base_lr.fit(X_train_lr, y_train.values)
    lr_val_probs = base_lr.predict_proba(X_val_lr)
    lr_report = metrics.evaluate_multilabel_predictions(y_val, lr_val_probs)
    logger.info("Baseline Logistic Regression Validation Macro F1: %.4f", lr_report["summary"]["macro_f1"])

    # Step 4 & 5: Train & Select Best Model Architecture
    best_estimator, best_type, candidate_reports = trainer.compare_and_select_best_architecture(
        X_train_prep, y_train.values, X_val_prep, y_val.values
    )

    val_raw_probs = best_estimator.predict_proba(X_val_prep)

    # Step 6: Tune Thresholds on Validation fold ONLY
    tuned_thresholds = threshold_tuner.tune_expert_thresholds(y_val, val_raw_probs)

    # Step 7: Fit Calibrator
    calibrator = calibration.DiseaseProbabilityCalibrator(method=config.CALIBRATION_METHOD)
    calibrator.fit(y_val.values, val_raw_probs)

    # Step 8: Fit SHAP Explainer
    explainer_engine = explainer.ExpertExplainer(best_estimator.estimators, approved_predictors)
    explainer_engine.fit_explainers(X_train_prep)

    # Step 9: Final Evaluation on Untouched Test Set
    test_raw_probs = best_estimator.predict_proba(X_test_prep)
    test_calib_probs = calibrator.calibrate_probas(test_raw_probs)
    test_eval_report = metrics.evaluate_multilabel_predictions(
        y_test, test_calib_probs, thresholds=tuned_thresholds
    )

    logger.info("==================================================================")
    logger.info("GUT MICROBIOME EXPERT TEST EVALUATION REPORT (UNTOUCHED TEST SET)")
    logger.info("==================================================================")
    logger.info("  Macro F1         : %.4f", test_eval_report["summary"]["macro_f1"])
    logger.info("  Micro F1         : %.4f", test_eval_report["summary"]["micro_f1"])
    logger.info("  Hamming Loss     : %.4f", test_eval_report["summary"]["hamming_loss"])
    logger.info("  Mean Brier Score : %.4f", test_eval_report["summary"]["mean_brier_score"])

    # Step 10: Freeze & Save Artifacts
    schema_data = data_loader.load_schema("gut_features.json")
    manager = artifact_manager.ExpertArtifactManager("gut", version=config.EXPERT_VERSION)

    training_config = {
        "best_architecture": best_type,
        "seed": config.RANDOM_SEED,
        "calibration_method": config.CALIBRATION_METHOD,
        "split_ratios": config.SPLIT_RATIOS
    }

    saved_path = manager.save_artifacts(
        model=best_estimator,
        preprocessor=preprocessor,
        calibrator=calibrator,
        thresholds=tuned_thresholds,
        feature_schema=schema_data,
        feature_order=approved_predictors,
        metrics=test_eval_report,
        training_config=training_config
    )

    report_file = config.REPORTS_DIR / "gut" / "gut_expert_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(test_eval_report, f, indent=2)

    logger.info("Gut Microbiome Expert pipeline completed. Artifacts frozen at: %s", saved_path)
    return saved_path


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    run_gut_expert_pipeline()
