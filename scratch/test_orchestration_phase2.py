"""
test_orchestration_phase2.py — Phase 2 Prediction Orchestration & Explainability Engine Unit Tests
"""

import unittest
import sys
from pathlib import Path

sys.path.insert(0, ".")

from multimodal_data_intake_engine.prediction_orchestrator import PredictionOrchestrator

class TestPhase2Orchestrator(unittest.TestCase):

    def setUp(self):
        self.orchestrator = PredictionOrchestrator()

    def test_model_contributions_all_7_pathways(self):
        """Verify model contribution breakdowns across all 7 pathways."""
        pathways = {
            "C": "Clinical_Expert_v3",
            "W": "Wearable_Expert_v3",
            "G": "Gut_Expert_v3",
            "C+W": "Clinical_Expert_v3",
            "C+G": "Clinical_Expert_v3",
            "W+G": "Wearable_Expert_v3",
            "C+W+G": "Clinical_Expert_v3"
        }

        for path, primary_model in pathways.items():
            contribs = self.orchestrator.compute_model_contributions(path)
            self.assertIn(primary_model, contribs)
            self.assertGreater(contribs[primary_model], 0.0)
            self.assertAlmostEqual(sum(contribs.values()), 100.0, delta=0.1)

    def test_missing_feature_impact_analysis(self):
        """Verify missing feature impact calculation and affected disease mapping."""
        missing = ["HbA1c", "Systolic_BP", "ALT"]
        impacts = self.orchestrator.analyze_missing_feature_impacts(missing)

        self.assertEqual(impacts["total_missing_count"], 3)
        self.assertIn("Type2_Diabetes", impacts["affected_diseases"])
        self.assertIn("Hypertension", impacts["affected_diseases"])
        self.assertIn("NAFLD", impacts["affected_diseases"])

    def test_consistency_validation_warnings(self):
        """Test consistency checks for pathway mismatch and out-of-bounds probabilities."""
        profile = {"clinical_features": {"HbA1c": 6.2}}
        out_of_bounds_preds = {
            "predictions": {
                "Diabetes": {"probability": 1.45}
            }
        }
        # Pathway mismatch: profile has clinical, but pathway claims W
        warnings = self.orchestrator.validate_consistency(profile, "W", out_of_bounds_preds)
        self.assertGreaterEqual(len(warnings), 2)
        warn_types = [w["type"] for w in warnings]
        self.assertIn("PATHWAY_MISMATCH", warn_types)
        self.assertIn("PROBABILITY_OUT_OF_BOUNDS", warn_types)

    def test_probability_invariance_guard(self):
        """Verify disease probabilities remain 100% exact matches after orchestration metadata payload assembly."""
        patient_profile = {
            "clinical_features": {"HbA1c": 6.2, "Fasting_Blood_Glucose": 112},
            "wearable_features": {"Average_Daily_Steps": 8400},
            "gut_features": {}
        }
        quality_scores = {"overall_quality_score": 82.0}

        original_predictions = {
            "Type2_Diabetes": {"probability": 0.28, "risk_level": "Low"},
            "Prediabetes": {"probability": 0.74, "risk_level": "High"},
            "Hypertension": {"probability": 0.42, "risk_level": "Moderate"}
        }

        meta = self.orchestrator.build_orchestration_metadata(
            patient_profile=patient_profile,
            quality_scores=quality_scores,
            effective_pathway="C+W",
            predictions=original_predictions
        )

        # Assert disease probabilities in original_predictions were NOT altered by orchestrator
        self.assertEqual(original_predictions["Type2_Diabetes"]["probability"], 0.28)
        self.assertEqual(original_predictions["Prediabetes"]["probability"], 0.74)
        self.assertEqual(original_predictions["Hypertension"]["probability"], 0.42)
        self.assertIn("model_contributions", meta)
        self.assertIn("pipeline_execution_metadata", meta)

if __name__ == "__main__":
    unittest.main()
