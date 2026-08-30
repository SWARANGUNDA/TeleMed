import sys
import traceback

sys.path.insert(0, '.')
from expert_models.v3_inference_engine import V3InferenceEngine
from multimodal_data_intake_engine.v3_schema_validator import V3SchemaValidator
from web_platform.backend.services.xai_service import generate_v3_xai_attribution

eng = V3InferenceEngine()
raw = {
    'patient_id': 'P_TEST',
    'clinical_data': {
        'Glucose': 126.0, 'HbA1c': 6.8, 'Systolic_BP': 138.0, 'Diastolic_BP': 88.0, 'BMI': 28.4, 'Age': 45, 'Gender': 'Male'
    },
    'wearable_data': {
        'Resting_Heart_Rate': 72.0, 'Total_Steps': 6500.0, 'Total_Sleep_Duration_Hours': 6.5
    }
}
val = V3SchemaValidator.validate_and_inspect_payload(raw)

diseases = ["Type2_Diabetes", "Prediabetes", "High_Adiposity_Risk", "Metabolic_Syndrome", "NAFLD"]
for dis in diseases:
    try:
        res = generate_v3_xai_attribution(eng, val, dis)
        print(f"Disease [{dis}]: SUCCESS!")
    except Exception as e:
        print(f"Disease [{dis}]: EXCEPTION {type(e).__name__}: {e}")
        traceback.print_exc()
