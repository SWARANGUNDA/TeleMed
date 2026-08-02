"""
test_ai_orchestration_phase2.py — AI Orchestration & Explainability Layer Unit Tests
"""

import unittest
import sys
from pathlib import Path

sys.path.insert(0, ".")

from multimodal_data_intake_engine.prediction_orchestrator import PredictionOrchestrator

class TestAIOrchestrationLayer(unittest.TestCase):

    def setUp(self):
        self.orchestrator = PredictionOrchestrator()

    def test_all_7_pathways_ai_orchestration(self):
        """Test AI orchestration metadata assembly across all 7 pathways."""
        pathways = ["C", "W", "G", "C+W", "C+G", "W+G", "C+W+G"]

        patient_profile = {
            "clinical_features": {"HbA1c": 6.2, "Fasting_Blood_Glucose": 112},
            "wearable_features": {"Average_Daily_Steps": 8400},
            "gut_features": {"Akkermansia": 4.5}
        }
        quality_scores = {"overall_quality_score": 85.0}

        for path in pathways:
            meta = self.orchestrator.build_orchestration_metadata(
                patient_profile=patient_profile,
                quality_scores=quality_scores,
                effective_pathway=path
            )

            self.assertIn("pipeline_execution_metadata", meta)
            self.assertIn("model_contributions", meta)
            self.assertIn("missing_feature_impact_analysis", meta)
            self.assertIn("prediction_audit_log", meta)
            self.assertIn("fusion_reliability", meta)
            self.assertEqual(meta["pipeline_execution_metadata"]["active_pathway"], path)
            self.assertEqual(meta["prediction_audit_log"]["active_pathway"], path)

    def test_probability_invariance_guard(self):
        """Verify disease probabilities remain 100% exact matches after AI orchestration wrapping."""
        raw_prediction = {
            "predictions": {
                "Diabetes": {"probability": 0.35, "risk_level": "Moderate"},
                "Hypertension": {"probability": 0.62, "risk_level": "High"},
                "NAFLD": {"probability": 0.14, "risk_level": "Low"}
            }
        }

        patient_profile = {
            "clinical_features": {"HbA1c": 6.2, "Systolic_BP": 136},
            "wearable_features": {},
            "gut_features": {}
        }

        meta = self.orchestrator.build_orchestration_metadata(
            patient_profile=patient_profile,
            quality_scores={"overall_quality_score": 80.0},
            effective_pathway="C",
            predictions=raw_prediction
        )

        # Assert raw disease probabilities are 100% untouched
        self.assertEqual(raw_prediction["predictions"]["Diabetes"]["probability"], 0.35)
        self.assertEqual(raw_prediction["predictions"]["Hypertension"]["probability"], 0.62)
        self.assertEqual(raw_prediction["predictions"]["NAFLD"]["probability"], 0.14)
        self.assertIn("pipeline_execution_metadata", meta)

    def test_fusion_reliability_ratings(self):
        """Test fusion reliability assignment across single vs multi-modality pathways."""
        single_meta = self.orchestrator.build_orchestration_metadata(
            patient_profile={"clinical_features": {"HbA1c": 6.0}},
            quality_scores={"overall_quality_score": 75.0},
            effective_pathway="C"
        )
        self.assertEqual(single_meta["fusion_reliability"], "N/A (Single Modality)")

        multi_meta = self.orchestrator.build_orchestration_metadata(
            patient_profile={"clinical_features": {"HbA1c": 6.0}, "wearable_features": {"Average_Daily_Steps": 8000}, "gut_features": {"Akkermansia": 5.0}},
            quality_scores={"overall_quality_score": 85.0},
            effective_pathway="C+W+G"
        )
        self.assertEqual(multi_meta["fusion_reliability"], "High")

if __name__ == "__main__":
    unittest.main()
