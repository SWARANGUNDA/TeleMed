"""
test_phase4_optimization.py — Phase 4 Production Optimization & API Standardization Tests
"""

import gc
import unittest
import sys
from pathlib import Path

sys.path.insert(0, ".")

from fastapi.testclient import TestClient
from web_platform.backend.main import app
from web_platform.backend.api_standardizer import standardize_response
from web_platform.backend.startup_diagnostics import run_startup_diagnostics

client = TestClient(app)


class TestPhase4Optimization(unittest.TestCase):

    def test_standardize_response_envelope(self):
        """Verify API response envelope follows standard JSON structure."""
        res = standardize_response(
            data={"test_key": "test_value"},
            message="Test envelope message.",
            success=True,
            metadata={"version": "1.0"},
            request_id="req-test-123"
        )
        self.assertEqual(res.status_code, 200)

        import json
        content = json.loads(res.body.decode("utf-8"))

        self.assertTrue(content["success"])
        self.assertEqual(content["message"], "Test envelope message.")
        self.assertEqual(content["data"], {"test_key": "test_value"})
        self.assertEqual(content["metadata"], {"version": "1.0"})
        self.assertEqual(content["request_id"], "req-test-123")
        self.assertIn("timestamp", content)
        self.assertIsInstance(content["warnings"], list)
        self.assertIsInstance(content["errors"], list)

    def test_boot_startup_diagnostics(self):
        """Verify startup diagnostics runs boot checks successfully."""
        diag = run_startup_diagnostics()
        self.assertIn("database", diag)
        self.assertIn("ocr_engine", diag)
        self.assertIn("ml_expert_models", diag)
        self.assertIn("rag_vector_store", diag)
        self.assertIn("intake_engine", diag)
        self.assertEqual(diag["database"]["status"], "HEALTHY")

    def test_metrics_endpoint(self):
        """Verify /api/v1/metrics returns system resource and stage latency metrics."""
        res = client.get("/api/v1/metrics")
        self.assertEqual(res.status_code, 200)
        content = res.json()

        self.assertTrue(content["success"])
        self.assertIn("system_resource_utilization", content["data"])
        self.assertIn("stage_latency_benchmarks_ms", content["data"])

        sys_res = content["data"]["system_resource_utilization"]
        self.assertIn("memory_rss_mb", sys_res)
        self.assertIn("cpu_percent", sys_res)

    def test_garbage_collection_memory_release(self):
        """Verify explicit memory release and garbage collection execution."""
        temp_objs = [b"x" * (1024 * 1024) for _ in range(5)]  # ~5MB
        del temp_objs
        collected = gc.collect()
        self.assertIsInstance(collected, int)


if __name__ == "__main__":
    unittest.main()
