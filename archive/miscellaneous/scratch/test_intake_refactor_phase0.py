"""
test_intake_refactor_phase0.py — Comprehensive Phase 0 Preprocessing & Intake Unit Tests
"""

import unittest
import sys, os
from pathlib import Path

sys.path.insert(0, ".")

from multimodal_data_intake_engine import (
    extractor,
    normalizer,
    validator,
    fuser,
    resolver,
    quality_scorer,
    engine
)

class TestPhase0IntakeEngine(unittest.TestCase):

    def test_file_format_detection(self):
        """Test file detection using magic header bytes."""
        txt_bytes = b"Fasting_Blood_Glucose: 110 mg/dL"
        csv_bytes = b"Age,Gender,HbA1c\n45,Male,6.2"
        pdf_bytes = b"%PDF-1.4\n1 0 obj..."

        self.assertEqual(extractor.detect_file_format_by_header(txt_bytes, "test.txt"), "txt")
        self.assertEqual(extractor.detect_file_format_by_header(csv_bytes, "test.csv"), "csv")
        self.assertEqual(extractor.detect_file_format_by_header(pdf_bytes, "test.pdf"), "pdf")

    def test_extraction_confidence_scores(self):
        """Verify extraction confidence scores are attached to features."""
        sample_txt = "Patient_ID: P0001\nAge: 52\nGender: Female\nHbA1c: 6.2 %"
        extracted = extractor.extract_key_value_pairs_from_text(sample_txt)
        
        self.assertIn("Patient_ID", extracted)
        self.assertIn("extraction_confidence", extracted["Patient_ID"])
        self.assertEqual(extracted["Patient_ID"]["extraction_confidence"], 1.00)
        
        self.assertIn("HbA1c", extracted)
        self.assertGreaterEqual(extracted["HbA1c"]["extraction_confidence"], 0.85)

    def test_unit_normalization(self):
        """Verify canonical unit conversions."""
        # Weight in lbs -> kg
        wt_norm = normalizer.normalize_feature_value("Weight", "180 lbs")
        self.assertAlmostEqual(wt_norm, 81.6, delta=0.2)

        # Fasting glucose in mmol/L -> mg/dL
        gl_norm = normalizer.normalize_feature_value("Fasting_Blood_Glucose", "6.5 mmol/L")
        self.assertAlmostEqual(gl_norm, 117.1, delta=0.5)

        # Active minutes in hours -> minutes
        act_norm = normalizer.normalize_feature_value("Active_Minutes", "1.5 hours/day")
        self.assertEqual(act_norm, 90.0)

    def test_physiological_bounds_and_filtering(self):
        """Verify physiological bounds checking and non-numeric value filtering."""
        # Valid HbA1c
        valid, _ = validator.validate_feature_value("HbA1c", 6.2)
        self.assertTrue(valid)

        # Extreme impossible HbA1c
        valid_bad, explanation = validator.validate_feature_value("HbA1c", 85.0)
        self.assertFalse(valid_bad)

        # Test non-numeric string string filtering
        clean_dict, warnings, _, _ = validator.validate_feature_dict({
            "HbA1c": "6.2",
            "AST": "Sample Hemolyzed"
        })
        self.assertIn("HbA1c", clean_dict)
        self.assertNotIn("AST", clean_dict)

    def test_patient_id_conflict_guard(self):
        """Verify strict Patient ID mismatch detection and warning flag."""
        doc1 = {
            "CLINICAL": {"Patient_ID": {"raw_value": "P_101"}, "HbA1c": {"raw_value": "6.1"}}
        }
        doc2 = {
            "CLINICAL": {"Patient_ID": {"raw_value": "P_909"}, "HbA1c": {"raw_value": "6.4"}}
        }
        profile, warnings = fuser.fuse_multiple_reports([doc1, doc2])
        self.assertTrue(profile.patient_id_conflict)
        self.assertIn("Patient ID Mismatch", profile.different_patient_warning)

    def test_end_to_end_intake_engine(self):
        """Verify end-to-end MultimodalIntakeEngine execution."""
        sample_doc = (
            "Patient_ID: P_E2E_01\n"
            "Age: 48\n"
            "Gender: Male\n"
            "Systolic_BP: 128 mmHg\n"
            "Diastolic_BP: 82 mmHg\n"
            "Fasting_Blood_Glucose: 108 mg/dL\n"
            "HbA1c: 6.1 %\n"
            "Average_Daily_Steps: 8400 steps/day\n"
            "Active_Minutes: 45 min/day\n"
        )
        engine_instance = engine.MultimodalIntakeEngine()
        result = engine_instance.process_reports([sample_doc])

        self.assertIn("patient_profile", result)
        self.assertIn("data_quality_scores", result)
        self.assertGreaterEqual(result["data_quality_scores"]["overall_quality_score"], 40.0)

if __name__ == "__main__":
    unittest.main()
