"""
config.py — Configuration parameters, feature schemas, synonym dictionaries,
unit conversion mappings, and physiological bounds for IMDIE.
"""

from typing import Dict, List, Set

# -----------------------------------------------------------------------------
# Modality Classification Keywords & Header Identifiers
# -----------------------------------------------------------------------------
CLINICAL_KEYWORDS: Set[str] = {
    "cbc", "complete blood count", "lipid profile", "fasting blood glucose", "fpg",
    "hba1c", "blood pressure", "systolic", "diastolic", "alt", "ast", "cholesterol",
    "triglycerides", "ldl", "hdl", "liver function test", "lft", "waist",
    "family history", "clinical laboratory report", "specimen", "blood / clinical measurements"
}

WEARABLE_KEYWORDS: Set[str] = {
    "apple health", "samsung health", "google fit", "fitbit", "garmin", "cgm",
    "continuous glucose monitor", "average_daily_steps", "active_minutes",
    "sedentary_time_minutes", "resting_heart_rate", "sleep_duration",
    "calories_burned", "average_glucose", "glucose_variability", "time_in_range",
    "time_above_range", "tir", "tar", "rhr", "steps",
    "wearable & cgm health report", "wearable", "average daily steps", "active minutes",
    "sedentary time", "resting heart rate", "heart rate variability", "sleep score",
    "stress level", "average cgm glucose", "monitoring period"
}

GUT_KEYWORDS: Set[str] = {
    "16s rrna", "microbiome", "akkermansia", "faecalibacterium", "bifidobacterium",
    "roseburia", "escherichia_shigella", "escherichia", "shigella", "blautia",
    "prevotella", "collinsella", "alistipes", "shannon_diversity_index", "shannon index",
    "gut microbiome", "relative abundance", "alpha diversity",
    "gut microbiome analysis report", "firmicutes", "bacteroidetes", "bacteroides",
    "proteobacteria", "shannon diversity index", "shannon diversity", "sample type stool"
}


# -----------------------------------------------------------------------------
# Canonical Feature Schemas per Modality
# -----------------------------------------------------------------------------
CLINICAL_FEATURES: List[str] = [
    "Patient_ID", "Age", "Gender", "Height", "Weight", "BMI",
    "Waist_Circumference", "Systolic_BP", "Diastolic_BP",
    "Fasting_Blood_Glucose", "HbA1c", "LDL", "HDL",
    "Triglycerides", "ALT", "AST", "Family_History_Diabetes",
    "Family_History_Hypertension", "Family_History_CVD"
]

WEARABLE_FEATURES: List[str] = [
    "Average_Daily_Steps", "Active_Minutes", "Sedentary_Time_Minutes",
    "Resting_Heart_Rate", "Sleep_Duration", "Calories_Burned",
    "Average_Glucose", "Glucose_Variability", "Time_In_Range",
    "Time_Above_Range", "Heart_Rate_Variability_RMSSD", "Sleep_Duration_Hours",
    "CGM_Average_Glucose", "CGM_Glucose_CV", "CGM_Time_In_Range", "CGM_Time_Above_Range",
    "Sleep_Efficiency_Score", "Autonomic_Stress_Score", "Activity_Energy_Expenditure",
    "Exercise_Frequency_Days"
]

GUT_FEATURES: List[str] = [
    "Akkermansia", "Faecalibacterium", "Bifidobacterium", "Roseburia", "Alistipes",
    "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia", "Shannon_Diversity_Index",
    "Bacteroides", "Firmicutes", "Bacteroidetes", "Proteobacteria", "Ruminococcus",
    "Coprococcus", "Subdoligranulum", "Enterococcus", "Eubacterium", "Parabacteroides",
    "Lactobacillus", "Klebsiella", "Streptococcus", "Eggerthella"
]


# -----------------------------------------------------------------------------
# Mandatory vs Optional Feature Schemas per Expert
# -----------------------------------------------------------------------------
CLINICAL_MANDATORY: Set[str] = {"Age", "Gender", "Height", "Weight", "BMI", "Systolic_BP", "Diastolic_BP", "Fasting_Blood_Glucose", "HbA1c"}
CLINICAL_OPTIONAL: Set[str] = {"Waist_Circumference", "LDL", "HDL", "Triglycerides", "ALT", "AST", "Family_History_Diabetes", "Family_History_Hypertension", "Family_History_CVD"}

WEARABLE_MANDATORY: Set[str] = {"Average_Daily_Steps", "Resting_Heart_Rate", "Average_Glucose"}
WEARABLE_OPTIONAL: Set[str] = {"Active_Minutes", "Sedentary_Time_Minutes", "Heart_Rate_Variability_RMSSD", "Sleep_Duration", "Sleep_Efficiency_Score", "Autonomic_Stress_Score", "Calories_Burned", "Exercise_Frequency_Days", "Glucose_Variability", "Time_In_Range", "Time_Above_Range"}

GUT_MANDATORY: Set[str] = {"Akkermansia", "Faecalibacterium", "Bifidobacterium", "Shannon_Diversity_Index"}
GUT_OPTIONAL: Set[str] = {"Roseburia", "Alistipes", "Escherichia_Shigella", "Collinsella", "Prevotella", "Blautia", "Bacteroides", "Firmicutes", "Bacteroidetes", "Proteobacteria", "Coprococcus", "Subdoligranulum"}


# -----------------------------------------------------------------------------
# Feature Synonym / Alias Mappings (Extracted key ➔ Canonical Key)
# -----------------------------------------------------------------------------
FEATURE_ALIASES: Dict[str, str] = {
    # Demographics & Anthropometry
    "patient id": "Patient_ID", "pid": "Patient_ID", "id": "Patient_ID", "patient_id": "Patient_ID", "patlent id": "Patient_ID", "patient": "Patient_ID", "patlent": "Patient_ID",
    "age": "Age", "years": "Age", "agc": "Age", "age sex": "Age",
    "gender": "Gender", "sex": "Gender", "gcnder": "Gender",
    "height": "Height", "height (cm)": "Height", "height_cm": "Height", "height cm": "Height", "ht": "Height", "helght": "Height",
    "weight": "Weight", "weight (kg)": "Weight", "weight_kg": "Weight", "weight kg": "Weight", "wt": "Weight", "welght": "Weight",
    "bmi": "BMI", "body mass index": "BMI",
    "waist": "Waist_Circumference", "waist circumference": "Waist_Circumference", "waist_cm": "Waist_Circumference", "waist circumference cm": "Waist_Circumference", "waist_circumference_cm": "Waist_Circumference", "waist_circumference": "Waist_Circumference", "wc": "Waist_Circumference", "walst clrcumference": "Waist_Circumference",
    
    # Vitals & Blood Pressure
    "blood pressure": "Blood_Pressure", "bp": "Blood_Pressure", "blood pressure reading": "Blood_Pressure", "repeat blood pressure": "Blood_Pressure", "blood pressurc": "Blood_Pressure",
    "sbp": "Systolic_BP", "systolic": "Systolic_BP", "systolic bp": "Systolic_BP", "systolic_bp": "Systolic_BP", "systolic blood pressure": "Systolic_BP",
    "dbp": "Diastolic_BP", "diastolic": "Diastolic_BP", "diastolic bp": "Diastolic_BP", "diastolic_bp": "Diastolic_BP", "diastolic blood pressure": "Diastolic_BP",

    # Clinical Labs
    "fpg": "Fasting_Blood_Glucose", "fbg": "Fasting_Blood_Glucose", "fbs": "Fasting_Blood_Glucose", "fasting glucose": "Fasting_Blood_Glucose", "fasting blood glucose": "Fasting_Blood_Glucose", "blood glucose": "Fasting_Blood_Glucose", "fasting_blood_glucose": "Fasting_Blood_Glucose", "fastlng blood glucosc": "Fasting_Blood_Glucose", "repeat fasting blood glucose": "Fasting_Blood_Glucose",
    "hba1c": "HbA1c", "a1c": "HbA1c", "glycated hemoglobin": "HbA1c", "hemoglobin a1c": "HbA1c", "hba1c %": "HbA1c", "hbalc": "HbA1c", "repeat hba1c": "HbA1c",
    "ldl": "LDL", "ldl cholesterol": "LDL", "ldl_cholesterol": "LDL", "ldl-c": "LDL", "ldl_c": "LDL", "ldl ch0lesterol": "LDL", "repeat ldl cholesterol": "LDL", "ldl mg dl": "LDL",
    "hdl": "HDL", "hdl cholesterol": "HDL", "hdl_cholesterol": "HDL", "hdl-c": "HDL", "hdl_c": "HDL", "hdl ch0lesterol": "HDL",
    "triglycerides": "Triglycerides", "tg": "Triglycerides", "triglyceride": "Triglycerides", "triglycerides mg/dl": "Triglycerides", "trlglycerldes": "Triglycerides", "triglycerides mg dl": "Triglycerides",
    "alt": "ALT", "sgpt": "ALT", "alt (sgpt)": "ALT", "alt sgpt": "ALT", "alanine aminotransferase": "ALT", "alanine transaminase": "ALT", "sgpt alt": "ALT",
    "ast": "AST", "sgot": "AST", "ast (sgot)": "AST", "ast sgot": "AST", "aspartate aminotransferase": "AST", "aspartate transaminase": "AST", "sgot ast": "AST",
    
    # Family History
    "family history diabetes": "Family_History_Diabetes", "family_history_diabetes": "Family_History_Diabetes", "family history of diabetes": "Family_History_Diabetes", "family history: diabetes": "Family_History_Diabetes", "diabetes": "Family_History_Diabetes", "dlabetes": "Family_History_Diabetes",
    "family history hypertension": "Family_History_Hypertension", "family_history_hypertension": "Family_History_Hypertension", "family history of hypertension": "Family_History_Hypertension", "family history: hypertension": "Family_History_Hypertension", "hypertension": "Family_History_Hypertension", "hypertenslon": "Family_History_Hypertension",
    "family history cvd": "Family_History_CVD", "family_history_cvd": "Family_History_CVD", "family history of cvd": "Family_History_CVD", "family history cardiovascular disease": "Family_History_CVD", "family history: cvd": "Family_History_CVD",

    # Wearables
    "steps": "Average_Daily_Steps", "daily steps": "Average_Daily_Steps", "average_daily_steps": "Average_Daily_Steps", "average daily steps": "Average_Daily_Steps", "average dally steps": "Average_Daily_Steps", "updated average daily steps": "Average_Daily_Steps",
    "active minutes": "Active_Minutes", "active_minutes": "Active_Minutes", "mvpa": "Active_Minutes", "active": "Active_Minutes", "actlve mlnutes": "Active_Minutes",
    "sedentary minutes": "Sedentary_Time_Minutes", "sedentary time": "Sedentary_Time_Minutes", "sedentary_time_minutes": "Sedentary_Time_Minutes", "sedentary time minutes": "Sedentary_Time_Minutes", "sedentary": "Sedentary_Time_Minutes", "sedentary tlme": "Sedentary_Time_Minutes",
    "resting heart rate": "Resting_Heart_Rate", "rhr": "Resting_Heart_Rate", "resting_heart_rate": "Resting_Heart_Rate", "heart rate": "Resting_Heart_Rate", "restlng heart rate": "Resting_Heart_Rate", "resting heart rate latest": "Resting_Heart_Rate", "average heart rate": "Resting_Heart_Rate",
    "heart rate variability": "Heart_Rate_Variability_RMSSD", "hrv": "Heart_Rate_Variability_RMSSD",
    "sleep duration": "Sleep_Duration", "sleep hours": "Sleep_Duration", "sleep_duration": "Sleep_Duration", "sleep_duration_hours": "Sleep_Duration", "sleep": "Sleep_Duration", "sleep duratlon": "Sleep_Duration",
    "sleep score": "Sleep_Efficiency_Score", "sleep efficiency": "Sleep_Efficiency_Score", "sleep_efficiency_score": "Sleep_Efficiency_Score",
    "stress level": "Autonomic_Stress_Score", "autonomic stress score": "Autonomic_Stress_Score", "autonomic_stress_score": "Autonomic_Stress_Score", "stress score": "Autonomic_Stress_Score",
    "calories burned": "Calories_Burned", "calories": "Calories_Burned", "activity_energy_expenditure": "Calories_Burned", "calories_burned": "Calories_Burned", "calorles burned": "Calories_Burned",
    "exercise frequency": "Exercise_Frequency_Days", "exercise_frequency_days": "Exercise_Frequency_Days", "exercise days": "Exercise_Frequency_Days",

    # CGM
    "average glucose": "Average_Glucose", "mean glucose": "Average_Glucose", "average cgm glucose": "Average_Glucose", "cgm average glucose": "Average_Glucose", "cgm_average_glucose": "Average_Glucose", "average_glucose": "Average_Glucose", "avg glucose": "Average_Glucose", "average glucose latest": "Average_Glucose", "average glucosc": "Average_Glucose", "estimated average glucose": "Average_Glucose",
    "glucose variability": "Glucose_Variability", "glucose sd": "Glucose_Variability", "glucose cv": "Glucose_Variability", "cgm_glucose_cv": "Glucose_Variability", "cgm glucose cv": "Glucose_Variability", "glucose_variability": "Glucose_Variability", "gv": "Glucose_Variability", "glucose varlablllty": "Glucose_Variability",
    "tir": "Time_In_Range", "time in range": "Time_In_Range", "time_in_range": "Time_In_Range", "cgm time in range": "Time_In_Range", "cgm_time_in_range": "Time_In_Range", "tlme in range": "Time_In_Range",
    "tar": "Time_Above_Range", "time above range": "Time_Above_Range", "time_above_range": "Time_Above_Range", "cgm time above range": "Time_Above_Range", "cgm_time_above_range": "Time_Above_Range", "tlme above range": "Time_Above_Range",
    "tbr": "CGM_Time_Below_Range", "time below range": "CGM_Time_Below_Range", "time_below_range": "CGM_Time_Below_Range", "cgm time below range": "CGM_Time_Below_Range", "cgm_time_below_range": "CGM_Time_Below_Range",

    # Microbiome
    "shannon diversity index": "Shannon_Diversity_Index", "shannon diversity": "Shannon_Diversity_Index", "shannon index": "Shannon_Diversity_Index", "shannon_diversity_index": "Shannon_Diversity_Index", "shannon dlverslty index": "Shannon_Diversity_Index",
    "firmicutes": "Firmicutes",
    "bacteroidetes": "Bacteroidetes",
    "proteobacteria": "Proteobacteria",
    "akkermansia": "Akkermansia", "akkermansia muciniphila": "Akkermansia", "akkermansla": "Akkermansia", "updated akkermansia": "Akkermansia",
    "faecalibacterium": "Faecalibacterium", "faecalibacterium prausnitzii": "Faecalibacterium", "faecallbacterlum": "Faecalibacterium",
    "bifidobacterium": "Bifidobacterium", "bifidobacterium longum": "Bifidobacterium", "blfldobacterlum": "Bifidobacterium",
    "roseburia": "Roseburia", "roseburia hominis": "Roseburia", "roseburla": "Roseburia",
    "bacteroides": "Bacteroides",
    "prevotella": "Prevotella", "prevotella copri": "Prevotella",
    "ruminococcus": "Ruminococcus",
    "blautia": "Blautia", "blautia hydrogenotrophica": "Blautia", "blautla": "Blautia",
    "collinsella": "Collinsella", "collinsella aerofaciens": "Collinsella", "colllnsella": "Collinsella",
    "escherichia_shigella": "Escherichia_Shigella", "escherichia": "Escherichia_Shigella", "shigella": "Escherichia_Shigella", "escherichia/shigella": "Escherichia_Shigella", "escherlchla shlgella": "Escherichia_Shigella",
    "coprococcus": "Coprococcus",
    "alistipes": "Alistipes", "alistipes putredinis": "Alistipes", "allstlpes": "Alistipes",
    "subdoligranulum": "Subdoligranulum",
    "enterococcus": "Enterococcus",
    "eubacterium": "Eubacterium",
    "parabacteroides": "Parabacteroides",
    "lactobacillus": "Lactobacillus",
    "klebsiella": "Klebsiella",
    "streptococcus": "Streptococcus",
    "eggerthella": "Eggerthella"
}


# -----------------------------------------------------------------------------
# Physiological Validation Ranges
# -----------------------------------------------------------------------------
PHYSIOLOGICAL_BOUNDS: Dict[str, Dict[str, float]] = {
    # Demographics & Body
    "Age": {"min": 18.0, "max": 100.0},
    "Height_cm": {"min": 120.0, "max": 230.0},
    "Weight_kg": {"min": 30.0, "max": 250.0},
    "BMI": {"min": 12.0, "max": 65.0},
    "Waist_Circumference_cm": {"min": 50.0, "max": 180.0},
    
    # Blood Pressure & Labs
    "Systolic_BP": {"min": 70.0, "max": 240.0},
    "Diastolic_BP": {"min": 40.0, "max": 140.0},
    "Fasting_Blood_Glucose": {"min": 50.0, "max": 400.0},
    "HbA1c": {"min": 3.5, "max": 16.0},
    "LDL_Cholesterol": {"min": 20.0, "max": 400.0},
    "HDL_Cholesterol": {"min": 10.0, "max": 120.0},
    "Triglycerides": {"min": 20.0, "max": 1000.0},
    "ALT": {"min": 2.0, "max": 500.0},
    "AST": {"min": 2.0, "max": 500.0},
    
    # Wearables
    "Average_Daily_Steps": {"min": 500.0, "max": 40000.0},
    "Active_Minutes": {"min": 0.0, "max": 360.0},
    "Sedentary_Time_Minutes": {"min": 60.0, "max": 1200.0},
    "Resting_Heart_Rate": {"min": 35.0, "max": 140.0},
    "Sleep_Duration": {"min": 2.0, "max": 16.0},
    "Calories_Burned": {"min": 500.0, "max": 8000.0},
    "Average_Glucose": {"min": 50.0, "max": 400.0},
    "Glucose_Variability": {"min": 2.0, "max": 80.0},
    "Time_In_Range": {"min": 0.0, "max": 100.0},
    "Time_Above_Range": {"min": 0.0, "max": 100.0},
    
    # Gut Microbiome
    "Akkermansia": {"min": 0.0, "max": 30.0},
    "Faecalibacterium": {"min": 0.0, "max": 40.0},
    "Bifidobacterium": {"min": 0.0, "max": 30.0},
    "Roseburia": {"min": 0.0, "max": 25.0},
    "Escherichia_Shigella": {"min": 0.0, "max": 25.0},
    "Blautia": {"min": 0.0, "max": 30.0},
    "Prevotella": {"min": 0.0, "max": 40.0},
    "Collinsella": {"min": 0.0, "max": 20.0},
    "Alistipes": {"min": 0.0, "max": 20.0},
    "Shannon_Diversity_Index": {"min": 0.5, "max": 6.0}
}
