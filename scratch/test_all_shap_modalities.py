import sys
import numpy as np
import shap

sys.path.insert(0, '.')
from expert_models.v3_inference_engine import V3InferenceEngine

eng = V3InferenceEngine()

def get_shap_attributions(clf, X):
    if hasattr(clf, "coef_"):
        coefs = clf.coef_
        if len(coefs.shape) > 1 and coefs.shape[0] == 1:
            coefs = coefs[0]
        intercept = clf.intercept_[0] if hasattr(clf, "intercept_") else 0.0
        shap_vals = X[0] * coefs
        return shap_vals, float(intercept)

    try:
        explainer = shap.TreeExplainer(clf)
        sv = explainer.shap_values(X)
        exp_val = getattr(explainer, "expected_value", 0.0)
    except Exception:
        explainer = shap.Explainer(clf, X)
        sv = explainer(X)
        sv = sv.values if hasattr(sv, 'values') else sv
        exp_val = getattr(explainer, "base_values", 0.0)

    if isinstance(sv, list):
        sv = sv[1] if len(sv) > 1 else sv[0]
    if isinstance(sv, np.ndarray):
        if len(sv.shape) == 3:
            sv = sv[0, :, 1]
        elif len(sv.shape) == 2:
            sv = sv[0]

    if isinstance(exp_val, (list, np.ndarray)):
        arr = np.array(exp_val).flatten()
        exp_val = float(arr[1]) if len(arr) > 1 else float(arr[0])

    return sv, float(exp_val)

print("=== WEARABLE MODELS ===")
w_res = eng.predict_wearable({
    'Resting_Heart_Rate': 72.0, 'Total_Steps': 6500.0, 'Total_Sleep_Duration_Hours': 6.5
})
X_w = w_res['scaled_input']
for dis_key, model in eng.wearable_payload['models'].items():
    s_vals, base = get_shap_attributions(model, X_w)
    print(f"\nWearable Model [{dis_key}] ({type(model).__name__}): Base Val={base:.4f}")
    features = eng.wearable_payload['features']
    sorted_feats = sorted(zip(features, s_vals), key=lambda x: abs(x[1]), reverse=True)
    for f_name, val in sorted_feats[:3]:
        print(f"  {f_name:28s}: {val:+.4f}")

print("\n=== GUT MODELS ===")
g_res = eng.predict_gut({
    'Akkermansia_muciniphila': 3.5, 'Faecalibacterium_prausnitzii': 8.2
})
X_g = g_res['scaled_input']
for dis_key, model in eng.gut_payload['models'].items():
    s_vals, base = get_shap_attributions(model, X_g)
    print(f"\nGut Model [{dis_key}] ({type(model).__name__}): Base Val={base:.4f}")
    features = eng.gut_payload['features']
    sorted_feats = sorted(zip(features, s_vals), key=lambda x: abs(x[1]), reverse=True)
    for f_name, val in sorted_feats[:3]:
        print(f"  {f_name:28s}: {val:+.4f}")
