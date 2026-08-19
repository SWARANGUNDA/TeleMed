import json
import urllib.request

base_url = 'http://localhost:8000'
email = 'patient_acceptance@telemed.ai'
password = 'Password123!'

login_data = json.dumps({'email': email, 'password': password}).encode('utf-8')
req = urllib.request.Request(f'{base_url}/api/v1/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as r:
    token = json.loads(r.read().decode())['access_token']

headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'}

pred_payload = json.dumps({
    'clinical_data': {'Glucose': 126.0, 'HbA1c': 6.8, 'Systolic_BP': 138.0, 'Diastolic_BP': 88.0, 'BMI': 28.4, 'Age': 45, 'Gender': 'Male'},
    'wearable_data': {'Resting_Heart_Rate': 72.0, 'Total_Steps': 6500.0, 'Total_Sleep_Duration_Hours': 6.5}
}).encode('utf-8')

req = urllib.request.Request(f'{base_url}/api/v3/predict', data=pred_payload, headers=headers)
pred_res = json.loads(urllib.request.urlopen(req).read().decode())

xai_payload = json.dumps({'disease': 'Type2_Diabetes', 'predict_response': pred_res}).encode('utf-8')
req = urllib.request.Request(f'{base_url}/api/v3/xai', data=xai_payload, headers=headers)
xai_res = json.loads(urllib.request.urlopen(req).read().decode())

print("Root Keys:", list(xai_res.keys()))
print("Attributions Keys:", list(xai_res.get('attributions', {}).keys()))
clin = xai_res.get('attributions', {}).get('clinical', {})
print("Clinical Keys:", list(clin.keys()))
print("All Features Count:", len(clin.get('all_features', [])))
if clin.get('all_features'):
    print("First feature sample:", clin['all_features'][0])
