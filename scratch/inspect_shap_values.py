import sys
import numpy as np

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
    },
    'gut_data': {
        'Akkermansia_muciniphila': 3.5, 'Faecalibacterium_prausnitzii': 8.2
    }
}
val = V3SchemaValidator.validate_and_inspect_payload(raw)

for disease in ["Type2_Diabetes", "Prediabetes"]:
    res = generate_v3_xai_attribution(eng, val, disease)
    print(f"\n--- Disease: {disease} ---")
    for mod in ['clinical', 'wearable', 'gut']:
        if mod in res['attributions']:
            drivers = res['attributions'][mod]['all_features']
            top_3 = [(d['feature_name'], d['shap_value'], d['value']) for d in drivers[:5]]
            print(f"Modality [{mod}] Top 5:", top_3)
