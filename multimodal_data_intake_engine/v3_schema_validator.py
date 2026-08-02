"""
v3_schema_validator.py — Schema Validator & Modality Detector for Unified Multimodal v3.2.2.

Validates incoming patient payloads against exact v3 feature schemas:
- Clinical v3 (18 features)
- Wearable v3 (10 Standard + 5 CGM features)
- Gut v3 (20 Taxa RAW relative abundance)

Detects modality availability, feature completeness, and CGM measurement status.
Strictly isolates missing feature imputation tracking without modifying raw inputs.
"""

import logging
from typing import Dict, Any, Tuple, List, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s]: %(message)s")
logger = logging.getLogger("v3_schema_validator")

CLINICAL_V3_FEATURES = [
    "Age", "Gender", "Height", "Weight", "BMI", "Waist_Circumference",
    "Systolic_BP", "Diastolic_BP", "Fasting_Blood_Glucose", "HbA1c",
    "Triglycerides", "HDL", "LDL", "ALT", "AST",
    "Family_History_Diabetes", "Family_History_Hypertension", "Family_History_CVD"
]

WEARABLE_STD_V3_FEATURES = [
    "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes",
    "Resting_Heart_Rate", "Heart_Rate_Variability_RMSSD", "Sleep_Duration_Hours",
    "Sleep_Efficiency_Score", "Autonomic_Stress_Score", "Activity_Energy_Expenditure",
    "Exercise_Frequency_Days"
]

WEARABLE_CGM_V3_FEATURES = [
    "CGM_Average_Glucose", "CGM_Glucose_CV", "CGM_Time_In_Range",
    "CGM_Time_Above_Range", "CGM_Time_Below_Range"
]

GUT_V3_TAXA_FEATURES = [
    "Akkermansia", "Faecalibacterium", "Roseburia", "Bifidobacterium", "Bacteroides",
    "Prevotella", "Ruminococcus", "Blautia", "Collinsella", "Escherichia_Shigella",
    "Coprococcus", "Alistipes", "Subdoligranulum", "Enterococcus", "Eubacterium",
    "Parabacteroides", "Lactobacillus", "Klebsiella", "Streptococcus", "Eggerthella"
]

class V3SchemaValidator:
    @staticmethod
    def validate_and_inspect_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Inspects raw JSON payload, normalizes key casings, detects modality availability,
        and identifies feature completeness.
        """
        patient_id = payload.get("patient_id", "UNKNOWN_PATIENT")
        
        raw_clinical = payload.get("clinical_data", None) or payload.get("clinical", None)
        raw_wearable = payload.get("wearable_data", None) or payload.get("wearable", None)
        raw_gut      = payload.get("gut_data", None) or payload.get("gut", None)

        clinical_dict, c_present, c_supplied, c_missing = V3SchemaValidator._inspect_modality(raw_clinical, CLINICAL_V3_FEATURES)
        wearable_dict, w_present, w_supplied, w_missing = V3SchemaValidator._inspect_wearable(raw_wearable)
        gut_dict,      g_present, g_supplied, g_missing = V3SchemaValidator._inspect_modality(raw_gut, GUT_V3_TAXA_FEATURES)

        modalities_supplied = []
        if c_present: modalities_supplied.append("clinical")
        if w_present: modalities_supplied.append("wearable")
        if g_present: modalities_supplied.append("gut")

        missing_modalities = [m for m in ["clinical", "wearable", "gut"] if m not in modalities_supplied]

        # Determine CGM status
        cgm_supplied_count = sum(1 for f in WEARABLE_CGM_V3_FEATURES if f in w_supplied)
        if c_present and not w_present and not g_present:
            modality_mask = "C"
        elif w_present and not c_present and not g_present:
            modality_mask = "W"
        elif g_present and not c_present and not w_present:
            modality_mask = "G"
        elif c_present and w_present and not g_present:
            modality_mask = "C+W"
        elif c_present and g_present and not w_present:
            modality_mask = "C+G"
        elif w_present and g_present and not c_present:
            modality_mask = "W+G"
        elif c_present and w_present and g_present:
            modality_mask = "C+W+G"
        else:
            modality_mask = "NONE"

        return {
            "patient_id": patient_id,
            "modality_mask": modality_mask,
            "modalities_supplied": modalities_supplied,
            "missing_modalities": missing_modalities,
            "clinical_data": clinical_dict,
            "clinical_present": c_present,
            "clinical_supplied_features": c_supplied,
            "clinical_missing_features": c_missing,
            "wearable_data": wearable_dict,
            "wearable_present": w_present,
            "wearable_supplied_features": w_supplied,
            "wearable_missing_features": w_missing,
            "cgm_supplied_count": cgm_supplied_count,
            "gut_data": gut_dict,
            "gut_present": g_present,
            "gut_supplied_features": g_supplied,
            "gut_missing_features": g_missing
        }

    @staticmethod
    def _inspect_modality(data: Optional[Dict[str, Any]], expected_features: List[str]) -> Tuple[Dict[str, float], bool, List[str], List[str]]:
        if not data or not isinstance(data, dict):
            return {}, False, [], expected_features

        normalized = {k.strip(): v for k, v in data.items() if v is not None}
        if not normalized:
            return {}, False, [], expected_features

        supplied = []
        missing = []
        cleaned_dict = {}

        # Canonical feature alias map for V3 schema matching
        ALIASES = {
            "sleep_duration_hours": ["sleep_duration", "sleep_duration_hours", "sleep_hours"],
            "activity_energy_expenditure": ["calories_burned", "activity_energy_expenditure", "calories"],
            "exercise_frequency_days": ["exercise_frequency", "exercise_frequency_days", "exercise_days"],
            "cgm_average_glucose": ["average_glucose", "cgm_average_glucose", "cgm average glucose", "mean glucose"],
            "cgm_glucose_cv": ["glucose_variability", "cgm_glucose_cv", "cgm glucose cv", "glucose cv"],
            "cgm_time_in_range": ["time_in_range", "cgm_time_in_range", "cgm time in range", "tir"],
            "cgm_time_above_range": ["time_above_range", "cgm_time_above_range", "cgm time above range", "tar"],
            "cgm_time_below_range": ["time_below_range", "cgm_time_below_range", "cgm time below range", "tbr"]
        }

        for f in expected_features:
            f_lower = f.lower()
            alias_list = ALIASES.get(f_lower, [f_lower])
            matched_key = next((k for k in normalized.keys() if k.lower() in alias_list), None)
            if matched_key is not None and normalized[matched_key] is not None:
                try:
                    val = float(normalized[matched_key])
                    cleaned_dict[f] = val
                    supplied.append(f)
                except (ValueError, TypeError):
                    missing.append(f)
            else:
                missing.append(f)

        present = len(supplied) > 0
        return cleaned_dict, present, supplied, missing

    @staticmethod
    def _inspect_wearable(data: Optional[Dict[str, Any]]) -> Tuple[Dict[str, float], bool, List[str], List[str]]:
        all_expected = WEARABLE_STD_V3_FEATURES + WEARABLE_CGM_V3_FEATURES
        return V3SchemaValidator._inspect_modality(data, all_expected)
