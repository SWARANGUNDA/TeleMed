"""
test_reliability_phase2.py — Phase 2 Prediction Reliability Layer & 7-Pathway Invariance Tests
"""

import unittest
import sys
from pathlib import Path

sys.path.insert(0, ".")

from multimodal_data_intake_engine.prediction_reliability_layer import PredictionReliabilityLayer

class TestPhase2ReliabilityLayer(unittest.TestCase):

    def setUp(self):
        self.layer = PredictionReliabilityLayer()

    def test_all_7_pathways_reliability_evaluation(self):
        """Test reliability calculation across all 7 pathways (C, W, G, C+W, C+G, W+G, C+W+G)."""
        pathways = ["C", "W", "G", "C+W", "C+G", "W+G", "C+W+G"]

        patient_profile = {
            "clinical_features": {"HbA1c": 6.2, "Fasting_Blood_Glucose": 112, "Systolic_BP": 130},
            "wearable_features": {"Average_Daily_Steps": 8400, "Active_Minutes": 45},
            "gut_features": {"Akkermansia": 4.5}
        }
        quality_scores = {"overall_quality_score": 85.0}

        for path in pathways:
            report = self.layer.evaluate_reliability(
                patient_profile=patient_profile,
                quality_scores=quality_scores,
                prediction_output=None,
                effective_pathway=path
            )

            self.assertIn("overall_confidence", report)
            self.assertIn("confidence_grade", report)
            self.assertIn("modality_reliability", report)
            self.assertIn("missing_feature_impact_analysis", report)
            self.assertIn("prediction_audit_trail", report)
            self.assertEqual(report["prediction_audit_trail"]["active_pathway"], path)

    def test_probability_invariance_guard(self):
        """Verify disease probabilities remain 100% identical before and after reliability wrapping."""
        raw_prediction_output = {
            "predictions": {
                "Diabetes": {"probability": 0.35, "risk_level": "Moderate"},
                "Hypertension": {"probability": 0.62, "risk_level": "High"},
                "CVD": {"probability": 0.18, "risk_level": "Low"}
            }
        }

        patient_profile = {
            "clinical_features": {"HbA1c": 6.2, "Systolic_BP": 136},
            "wearable_features": {},
            "gut_features": {}
        }
        quality_scores = {"overall_quality_score": 75.0}

        rel_report = self.layer.evaluate_reliability(
            patient_profile=patient_profile,
            quality_scores=quality_scores,
            prediction_output=raw_prediction_output,
            effective_pathway="C"
        )

        # Assert raw predictions were NOT modified by reliability evaluation
        self.assertEqual(raw_prediction_output["predictions"]["Diabetes"]["probability"], 0.35)
        self.assertEqual(raw_prediction_output["predictions"]["Hypertension"]["probability"], 0.62)
        self.assertEqual(raw_prediction_output["predictions"]["CVD"]["probability"], 0.18)

    def test_clinical_contradiction_warning(self):
        """Test detection of contradiction between normal biomarkers and high disease risk."""
        contradictory_prediction = {
            "predictions": {
                "Diabetes": {"probability": 0.92, "risk_level": "High"}
            }
        }
        normal_patient_profile = {
            "clinical_features": {"HbA1c": 5.2, "Fasting_Blood_Glucose": 88.0},
            "wearable_features": {},
            "gut_features": {}
        }

        rel_report = self.layer.evaluate_reliability(
            patient_profile=normal_patient_profile,
            quality_scores={"overall_quality_score": 90.0},
            prediction_output=contradictory_prediction,
            effective_pathway="C"
        )

        warnings = rel_report.get("consistency_warnings", [])
        self.assertGreaterEqual(len(warnings), 1)
        self.assertEqual(warnings[0]["type"], "CLINICAL_CONTRADICTION")
        self.assertIn("Contradiction", warnings[0]["message"])

    def test_missing_feature_impact_analysis(self):
        """Test identification of missing critical biomarkers."""
        partial_profile = {
            "clinical_features": {"HbA1c": 6.1},
            "wearable_features": {},
            "gut_features": {}
        }
        rel_report = self.layer.evaluate_reliability(
            patient_profile=partial_profile,
            quality_scores={"overall_quality_score": 65.0},
            prediction_output=None,
            effective_pathway="C"
        )

        impacts = rel_report["missing_feature_impact_analysis"]
        self.assertIn("Fasting_Blood_Glucose", impacts["missing_critical"])
        self.assertIn("Systolic_BP", impacts["missing_critical"])
        self.assertGreaterEqual(impacts["missing_critical_count"], 2)

if __name__ == "__main__":
    unittest.main()
