import unittest
import sys

sys.path.insert(0, ".")
from scratch.test_intake_refactor_phase0 import TestPhase0IntakeEngine

suite = unittest.TestLoader().loadTestsFromTestCase(TestPhase0IntakeEngine)
res = unittest.TextTestRunner(verbosity=2).run(suite)
if res.failures:
    print("\n--- FAILURE TRACEBACK ---")
    print(res.failures[0][1])
if res.errors:
    print("\n--- ERROR TRACEBACK ---")
    print(res.errors[0][1])
