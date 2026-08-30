import sqlite3, datetime

conn = sqlite3.connect('web_platform/backend/telemed_local.db')
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

now = datetime.datetime.now(datetime.timezone.utc).isoformat()

# Update patient profiles with real human names
cursor.execute("UPDATE patient_profiles SET full_name = 'Aravind Bhatiya' WHERE user_id = 'usr_patient'")
cursor.execute("UPDATE patient_profiles SET full_name = 'Ramu Sharma' WHERE user_id = 'usr_ramu'")
cursor.execute("UPDATE patient_profiles SET full_name = 'Swaran Gunda' WHERE user_id = 'usr_b7382376018214c0'")

# Clear existing consultations
cursor.execute("DELETE FROM consultations")

# Insert 5 Real Target Specialty Consultations for the 5 Target Labels
target_consultations = [
    {
        'consultation_id': 'cons_target_01_cardiology',
        'patient_id': 'pat_c13f10a99bddf1f9',
        'user_id': 'usr_8a939305423f2f5f', # Aravind Bhatiya
        'assigned_doctor_id': None,
        'specialization': 'Cardiology',
        'category': 'Cardiovascular Disease Risk',
        'reason': 'Chest pressure during exertion and elevated cardiovascular risk assessment score.',
        'urgency': 'SOON',
        'message': 'Patient submitted AI cardiology intake report.',
        'status': 'REQUESTED'
    },
    {
        'consultation_id': 'cons_target_02_internal_endo',
        'patient_id': 'pat_7c0a4c62365daa37',
        'user_id': 'usr_2cb303d27e051969', # Swaran Gunda
        'assigned_doctor_id': 'doc_cc738da6760ac4ac', # Dr. Arjun Sarkaar
        'specialization': 'Internal Medicine & Endocrinology',
        'category': 'Metabolic & Diabetes Triage',
        'reason': 'Fasting blood glucose elevated at 134 mg/dL and HbA1c review.',
        'urgency': 'ROUTINE',
        'message': 'Reviewing metabolic panel and AI diabetes prediction summary.',
        'status': 'ASSIGNED'
    },
    {
        'consultation_id': 'cons_target_03_pulmonology',
        'patient_id': 'pat_72967361dc6bd14d',
        'user_id': 'usr_af6d9d70ab594696', # Ram Krishna
        'assigned_doctor_id': 'usr_doctor', # Dr. Sarah Jenkins
        'specialization': 'Pulmonology',
        'category': 'Respiratory Health Evaluation',
        'reason': 'Persistent nocturnal cough and reduced spirography performance.',
        'urgency': 'SOON',
        'message': 'Patient attached pulmonary intake report and chest X-ray notes.',
        'status': 'ACTIVE'
    },
    {
        'consultation_id': 'cons_target_04_neurology',
        'patient_id': 'pat_6a39aa7c7e1e96e0',
        'user_id': 'usr_7b11fe48b9fbca88', # Rahul Reddy
        'assigned_doctor_id': 'doc_cc738da6760ac4ac', # Dr. Arjun Sarkaar
        'specialization': 'Neurology',
        'category': 'Neuro-vascular Triage',
        'reason': 'Frequent migraine with aura episodes and visual disturbances.',
        'urgency': 'ROUTINE',
        'message': 'Treatment plan issued and headache diary reviewed.',
        'status': 'COMPLETED'
    },
    {
        'consultation_id': 'cons_target_05_general',
        'patient_id': 'pat_3b581e03bd958f6e',
        'user_id': 'usr_703c21735d627e49', # Rahul Sharma
        'assigned_doctor_id': 'usr_doctor', # Dr. Sarah Jenkins
        'specialization': 'General Medicine',
        'category': 'Primary Care Intake',
        'reason': 'Annual wellness checkup and vital sign baseline confirmation.',
        'urgency': 'ROUTINE',
        'message': 'Primary care baseline review accepted by physician.',
        'status': 'ACCEPTED'
    }
]

for c in target_consultations:
    cursor.execute("""
        INSERT INTO consultations (
            consultation_id, patient_id, user_id, assigned_doctor_id, specialization, category, reason, urgency, message, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (c['consultation_id'], c['patient_id'], c['user_id'], c['assigned_doctor_id'], c['specialization'], c['category'], c['reason'], c['urgency'], c['message'], c['status'], now, now))

conn.commit()
print(f"Successfully updated database with {len(target_consultations)} real 5-target-label consultation records.")
conn.close()
