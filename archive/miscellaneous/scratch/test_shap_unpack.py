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

def get_shap_attributions(clf, X):
    if hasattr(clf, "coef_"):
        coefs = clf.coef_
        if len(coefs.shape) > 1 and coefs.shape[0] == 1:
            coefs = coefs[0]
        intercept = clf.intercept_[0] if hasattr(clf, "intercept_") else 0.0
        shap_vals = X[0] * coefs
        return shap_vals, intercept

    # Tree / Ensemble Models (XGBoost, CatBoost, RandomForest, ExtraTrees)
    try:
        explainer = shap.TreeExplainer(clf)
        sv = explainer.shap_values(X)
        exp_val = getattr(explainer, "expected_value", 0.0)
    except Exception:
        explainer = shap.Explainer(clf, X)
        sv = explainer(X)
        sv = sv.values if hasattr(sv, 'values') else sv
        exp_val = getattr(explainer, "base_values", 0.0)

    # Handle multi-class / binary output arrays
    if isinstance(sv, list):
        sv = sv[1] if len(sv) > 1 else sv[0]
    if isinstance(sv, np.ndarray):
        if len(sv.shape) == 3: # (samples, features, classes)
            sv = sv[0, :, 1]
        elif len(sv.shape) == 2: # (samples, features)
            sv = sv[0]

    if isinstance(exp_val, (list, np.ndarray)):
        arr = np.array(exp_val).flatten()
        exp_val = float(arr[1]) if len(arr) > 1 else float(arr[0])

    return sv, float(exp_val)

for dis_key, model in eng.clinical_payload['models'].items():
    s_vals, base = get_shap_attributions(model, X_scaled)
    print(f"\nClinical Model [{dis_key}] ({type(model).__name__}): Base Val={base:.4f}")
    features = eng.clinical_payload['features']
    sorted_feats = sorted(zip(features, s_vals), key=lambda x: abs(x[1]), reverse=True)
    for f_name, val in sorted_feats[:5]:
        print(f"  {f_name:28s}: {val:+.4f}")
