"""
test_phase3_platform.py — Phase 3 Platform Reliability, Security & Observability Tests
"""

import unittest
import sys
from pathlib import Path

sys.path.insert(0, ".")

from fastapi.testclient import TestClient
from web_platform.backend.main import app
from web_platform.backend.platform_observability import mask_patient_id
from web_platform.backend.security import sanitize_filename, validate_uploaded_file

client = TestClient(app)

class TestPhase3Platform(unittest.TestCase):

    def test_health_check_endpoints(self):
        """Verify /health and /api/v1/health endpoints return HEALTHY status and subsystem readiness."""
        res_v1 = client.get("/api/v1/health")
        self.assertEqual(res_v1.status_code, 200)
        data_v1 = res_v1.json()
        self.assertEqual(data_v1["status"], "HEALTHY")
        self.assertIn("database_connectivity", data_v1)
        self.assertIn("subsystems", data_v1)

        res_root = client.get("/health")
        self.assertEqual(res_root.status_code, 200)
        data_root = res_root.json()
        self.assertEqual(data_root["status"], "HEALTHY")

    def test_request_id_and_process_time_middleware(self):
        """Verify x-request-id and x-process-time-ms headers are assigned to responses."""
        res = client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertIn("x-request-id", res.headers)
        self.assertIn("x-process-time-ms", res.headers)
        self.assertTrue(res.headers["x-request-id"].startswith("req-"))

    def test_patient_id_pii_masking(self):
        """Verify Patient ID PII is masked according to HIPAA privacy guidelines."""
        self.assertEqual(mask_patient_id("P000301"), "P***01")
        self.assertEqual(mask_patient_id("AP-987654"), "A***54")
        self.assertEqual(mask_patient_id("P_GUEST"), "P_GUEST")
        self.assertEqual(mask_patient_id(None), "P_GUEST")

    def test_filename_sanitization(self):
        """Verify filename sanitization strips relative directory traversal sequences."""
        self.assertEqual(sanitize_filename("../../etc/passwd"), "passwd")
        self.assertEqual(sanitize_filename("report (1) & <script>.pdf"), "report_1_script.pdf")

    def test_file_size_limit_enforcement(self):
        """Verify files larger than 25MB are rejected."""
        large_bytes = b"0" * (26 * 1024 * 1024)  # 26 MB
        is_valid, msg, clean_name = validate_uploaded_file("large_report.pdf", large_bytes)
        self.assertFalse(is_valid)
        self.assertIn("exceeds 25 MB limit", msg)

    def test_magic_byte_signature_verification(self):
        """Verify spoofed file extensions with invalid magic headers are rejected."""
        spoofed_pdf_bytes = b"THIS_IS_PLAIN_TEXT_NOT_A_REAL_PDF"
        is_valid, msg, clean_name = validate_uploaded_file("fake_report.pdf", spoofed_pdf_bytes)
        self.assertFalse(is_valid)
        self.assertIn("Invalid file content signature", msg)

        real_pdf_bytes = b"%PDF-1.4 test content..."
        is_valid_real, msg_real, clean_real = validate_uploaded_file("real_report.pdf", real_pdf_bytes)
        self.assertTrue(is_valid_real)

if __name__ == "__main__":
    unittest.main()
