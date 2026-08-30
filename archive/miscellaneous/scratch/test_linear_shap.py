import sys
import numpy as np
import shap

sys.path.insert(0, '.')
from expert_models.v3_inference_engine import V3InferenceEngine

eng = V3InferenceEngine()
c_res = eng.predict_clinical({
    'Glucose': 126.0, 'HbA1c': 6.8, 'Systolic_BP': 138.0, 'Diastolic_BP': 88.0, 'BMI': 28.4, 'Age': 45, 'Gender': 'Male'
})
X_scaled = c_res['scaled_input']
clf = eng.clinical_payload['models']['Type2_Diabetes']
features = eng.clinical_payload['features']

print("Model type:", type(clf))
print("Coef shape:", clf.coef_.shape)
print("X_scaled shape:", X_scaled.shape)

# Direct Linear SHAP calculation (w_i * X_scaled_i)
coefs = clf.coef_[0]
linear_shap = X_scaled[0] * coefs

for feat, coef, x_s, s in zip(features, coefs, X_scaled[0], linear_shap):
    print(f"Feature: {feat:25s} Coef: {coef:+.4f}  X_scaled: {x_s:+.4f}  SHAP: {s:+.4f}")
