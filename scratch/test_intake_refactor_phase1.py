"""
test_intake_refactor_phase1.py — Phase 1 Intelligent Extraction & Validation Unit Tests
"""

import unittest
import sys
from pathlib import Path

sys.path.insert(0, ".")

from multimodal_data_intake_engine import (
    template_detector,
    confidence,
    mapper,
    validator,
    resolver,
    engine
)

class TestPhase1IntakeEngine(unittest.TestCase):

    def test_template_detection(self):
        """Test document layout template detection across formats."""
        apollo_txt = "SUNRISE DIAGNOSTICS & APOLLO CLINICAL LAB REPORT\nHbA1c: 6.2 %"
        max_txt = "MAX HEALTHCARE DIAGNOSTICS\nFasting Blood Glucose: 112 mg/dL"
        gut_txt = "GUT MICROBIOME 16S RRNA TAXONOMY\nAkkermansia: 4.8 %"

        tmpl1, conf1, meta1 = template_detector.detect_report_template(apollo_txt)
        self.assertEqual(tmpl1, template_detector.ReportTemplate.APOLLO)
        self.assertGreaterEqual(conf1, 0.90)

        tmpl2, conf2, meta2 = template_detector.detect_report_template(max_txt)
        self.assertEqual(tmpl2, template_detector.ReportTemplate.MAX_HEALTHCARE)

        tmpl3, conf3, meta3 = template_detector.detect_report_template(gut_txt)
        self.assertEqual(tmpl3, template_detector.ReportTemplate.GUT_MICROBIOME)

    def test_multifactor_confidence_scoring(self):
        """Test multi-factor confidence calculation."""
        conf_regex = confidence.calculate_feature_multifactor_confidence("HbA1c", 6.2, "REGEX_PATIENT_ID", True, True, False)
        self.assertEqual(conf_regex, 1.00)

        conf_ocr = confidence.calculate_feature_multifactor_confidence("HbA1c", 6.2, "OCR_EXTRACTION", True, True, False)
        self.assertEqual(conf_ocr, 0.85)

        conf_suspicious = confidence.calculate_feature_multifactor_confidence("HbA1c", 14.5, "PATTERN_MATCH_VALUNIT", True, True, True)
        self.assertAlmostEqual(conf_suspicious, 0.8075, delta=0.01)

    def test_context_aware_canonical_mapping(self):
        """Test context-aware mapping and key disambiguation."""
        key1, mod1 = mapper.map_key_to_canonical("Fasting plasma glucose test")
        self.assertEqual(key1, "Fasting_Blood_Glucose")
        self.assertEqual(mod1, "CLINICAL")

        key2, mod2 = mapper.map_key_to_canonical("Average daily glucose (CGM)")
        self.assertEqual(key2, "Average_Glucose")
        self.assertEqual(mod2, "WEARABLE")

        key3, mod3 = mapper.map_key_to_canonical("Resting heart rate bpm")
        self.assertEqual(key3, "Resting_Heart_Rate")
        self.assertEqual(mod3, "WEARABLE")

    def test_suspicious_value_detection(self):
        """Test detection of extreme but physically possible clinical values."""
        is_susp, reason = validator.detect_suspicious_value("HbA1c", 14.5)
        self.assertTrue(is_susp)
        self.assertIn("Extremely high HbA1c", reason)

        is_susp_bp, reason_bp = validator.detect_suspicious_value("Systolic_BP", 195)
        self.assertTrue(is_susp_bp)
        self.assertIn("Hypertensive crisis", reason_bp)

    def test_composite_score_conflict_resolution(self):
        """Test confidence-based multi-report conflict resolution."""
        obs1 = {"value": 6.1, "confidence": 0.95, "source_type": "Official Laboratory Report", "timestamp": 100}
        obs2 = {"value": 6.4, "confidence": 0.80, "source_type": "Manual Entry", "timestamp": 200}

        selected, warnings, conflict = resolver.resolve_duplicate_feature("HbA1c", [obs1, obs2])
        self.assertEqual(selected, 6.1)
        self.assertIsNotNone(conflict)

if __name__ == "__main__":
    unittest.main()
