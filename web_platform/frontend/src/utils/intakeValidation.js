// Canonical Alias Normalizer Map
export const CANONICAL_ALIASES = {
  'patient_id': 'Patient_ID', 'patient id': 'Patient_ID', 'pid': 'Patient_ID', 'id': 'Patient_ID',
  'age': 'Age', 'years': 'Age',
  'gender': 'Gender', 'sex': 'Gender',
  'height': 'Height', 'height_cm': 'Height', 'height cm': 'Height', 'height (cm)': 'Height',
  'weight': 'Weight', 'weight_kg': 'Weight', 'weight kg': 'Weight', 'weight (kg)': 'Weight',
  'bmi': 'BMI', 'body mass index': 'BMI',
  'waist': 'Waist_Circumference', 'waist_circumference': 'Waist_Circumference', 'waist_circumference_cm': 'Waist_Circumference', 'waist_cm': 'Waist_Circumference', 'waist circumference': 'Waist_Circumference', 'waist circumference cm': 'Waist_Circumference',
  'systolic_bp': 'Systolic_BP', 'systolic bp': 'Systolic_BP', 'sbp': 'Systolic_BP', 'systolic': 'Systolic_BP', 'systolic blood pressure': 'Systolic_BP',
  'diastolic_bp': 'Diastolic_BP', 'diastolic bp': 'Diastolic_BP', 'dbp': 'Diastolic_BP', 'diastolic': 'Diastolic_BP', 'diastolic blood pressure': 'Diastolic_BP',
  'fasting_blood_glucose': 'Fasting_Blood_Glucose', 'fasting blood glucose': 'Fasting_Blood_Glucose', 'fpg': 'Fasting_Blood_Glucose', 'fbg': 'Fasting_Blood_Glucose', 'fasting glucose': 'Fasting_Blood_Glucose', 'blood glucose': 'Fasting_Blood_Glucose',
  'hba1c': 'HbA1c', 'a1c': 'HbA1c', 'glycated hemoglobin': 'HbA1c', 'hemoglobin a1c': 'HbA1c', 'hba1c %': 'HbA1c',
  'triglycerides': 'Triglycerides', 'tg': 'Triglycerides', 'triglyceride': 'Triglycerides', 'triglycerides mg/dl': 'Triglycerides',
  'hdl': 'HDL', 'hdl_cholesterol': 'HDL', 'hdl cholesterol': 'HDL', 'hdl-c': 'HDL', 'hdl_c': 'HDL',
  'ldl': 'LDL', 'ldl_cholesterol': 'LDL', 'ldl cholesterol': 'LDL', 'ldl-c': 'LDL', 'ldl_c': 'LDL',
  'alt': 'ALT', 'sgpt': 'ALT', 'alanine aminotransferase': 'ALT', 'alanine transaminase': 'ALT',
  'ast': 'AST', 'sgot': 'AST', 'aspartate aminotransferase': 'AST', 'aspartate transaminase': 'AST',
  'family_history_diabetes': 'Family_History_Diabetes', 'family history diabetes': 'Family_History_Diabetes', 'family history of diabetes': 'Family_History_Diabetes',
  'family_history_hypertension': 'Family_History_Hypertension', 'family history hypertension': 'Family_History_Hypertension', 'family history of hypertension': 'Family_History_Hypertension',
  'family_history_cvd': 'Family_History_CVD', 'family history cvd': 'Family_History_CVD', 'family history of cvd': 'Family_History_CVD', 'family history cardiovascular disease': 'Family_History_CVD',

  // Wearables
  'average_daily_steps': 'Average_Daily_Steps', 'average daily steps': 'Average_Daily_Steps', 'steps': 'Average_Daily_Steps', 'daily steps': 'Average_Daily_Steps',
  'active_minutes': 'Active_Minutes', 'active minutes': 'Active_Minutes', 'mvpa': 'Active_Minutes',
  'sedentary_time_minutes': 'Sedentary_Time_Minutes', 'sedentary time minutes': 'Sedentary_Time_Minutes', 'sedentary minutes': 'Sedentary_Time_Minutes', 'sedentary time': 'Sedentary_Time_Minutes',
  'resting_heart_rate': 'Resting_Heart_Rate', 'resting heart rate': 'Resting_Heart_Rate', 'rhr': 'Resting_Heart_Rate', 'heart rate': 'Resting_Heart_Rate',
  'heart_rate_variability_rmssd': 'Heart_Rate_Variability_RMSSD', 'heart rate variability': 'Heart_Rate_Variability_RMSSD', 'hrv': 'Heart_Rate_Variability_RMSSD', 'rmssd': 'Heart_Rate_Variability_RMSSD',
  'sleep_duration': 'Sleep_Duration', 'sleep duration': 'Sleep_Duration', 'sleep_duration_hours': 'Sleep_Duration', 'sleep hours': 'Sleep_Duration',
  'sleep_efficiency_score': 'Sleep_Efficiency_Score', 'sleep efficiency': 'Sleep_Efficiency_Score', 'sleep score': 'Sleep_Efficiency_Score',
  'autonomic_stress_score': 'Autonomic_Stress_Score', 'autonomic stress score': 'Autonomic_Stress_Score', 'stress score': 'Autonomic_Stress_Score', 'stress level': 'Autonomic_Stress_Score',
  'calories_burned': 'Calories_Burned', 'calories burned': 'Calories_Burned', 'activity_energy_expenditure': 'Calories_Burned', 'calories': 'Calories_Burned',
  'exercise_frequency_days': 'Exercise_Frequency_Days', 'exercise frequency': 'Exercise_Frequency_Days', 'exercise days': 'Exercise_Frequency_Days',

  // CGM / Glucose
  'average_glucose': 'Average_Glucose', 'average glucose': 'Average_Glucose', 'cgm_average_glucose': 'Average_Glucose', 'cgm average glucose': 'Average_Glucose', 'mean glucose': 'Average_Glucose', 'average cgm glucose': 'Average_Glucose',
  'glucose_variability': 'Glucose_Variability', 'glucose variability': 'Glucose_Variability', 'cgm_glucose_cv': 'Glucose_Variability', 'cgm glucose cv': 'Glucose_Variability', 'glucose cv': 'Glucose_Variability',
  'time_in_range': 'Time_In_Range', 'time in range': 'Time_In_Range', 'cgm_time_in_range': 'Time_In_Range', 'cgm time in range': 'Time_In_Range', 'tir': 'Time_In_Range',
  'time_above_range': 'Time_Above_Range', 'time above range': 'Time_Above_Range', 'cgm_time_above_range': 'Time_Above_Range', 'cgm time above range': 'Time_Above_Range', 'tar': 'Time_Above_Range',

  // Microbiome
  'shannon_diversity_index': 'Shannon_Diversity_Index', 'shannon diversity index': 'Shannon_Diversity_Index', 'shannon diversity': 'Shannon_Diversity_Index', 'shannon index': 'Shannon_Diversity_Index',
  'akkermansia': 'Akkermansia', 'faecalibacterium': 'Faecalibacterium', 'roseburia': 'Roseburia', 'bifidobacterium': 'Bifidobacterium',
  'bacteroides': 'Bacteroides', 'prevotella': 'Prevotella', 'ruminococcus': 'Ruminococcus', 'blautia': 'Blautia',
  'collinsella': 'Collinsella', 'escherichia_shigella': 'Escherichia_Shigella', 'escherichia shigella': 'Escherichia_Shigella', 'e. coli/shigella': 'Escherichia_Shigella', 'coprococcus': 'Coprococcus', 'alistipes': 'Alistipes',
  'subdoligranulum': 'Subdoligranulum', 'enterococcus': 'Enterococcus', 'eubacterium': 'Eubacterium', 'parabacteroides': 'Parabacteroides',
  'lactobacillus': 'Lactobacillus', 'klebsiella': 'Klebsiella', 'streptococcus': 'Streptococcus', 'eggerthella': 'Eggerthella',
  'firmicutes': 'Firmicutes', 'bacteroidetes': 'Bacteroidetes', 'proteobacteria': 'Proteobacteria',
  'ruminococcus': 'Ruminococcus',

  // Wearable additional aliases
  'sleep_efficiency_score': 'Sleep_Efficiency_Score', 'sleep efficiency score': 'Sleep_Efficiency_Score',
  'autonomic_stress_score': 'Autonomic_Stress_Score', 'autonomic stress score': 'Autonomic_Stress_Score',
  'exercise_frequency_days': 'Exercise_Frequency_Days', 'exercise frequency days': 'Exercise_Frequency_Days',
  'calories_burned': 'Calories_Burned', 'activity_energy_expenditure': 'Calories_Burned', 'activity energy expenditure': 'Calories_Burned',
  'heart_rate_variability_rmssd': 'Heart_Rate_Variability_RMSSD', 'heart rate variability rmssd': 'Heart_Rate_Variability_RMSSD'
};

export function normalizeRawKey(rawKey) {
  if (!rawKey) return '';
  const clean = String(rawKey).toLowerCase().trim().replace(/[:_=\-\/\(\)]+/g, ' ').replace(/\s+/g, ' ');
  return CANONICAL_ALIASES[clean] || rawKey;
}

export function normalizeExtractedDict(extractedDict) {
  if (!extractedDict || typeof extractedDict !== 'object') return {};
  const normalized = {};
  Object.entries(extractedDict).forEach(([rawK, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      const canonicalKey = normalizeRawKey(rawK);
      let numVal = val;
      if (typeof val === 'object' && val.raw_value !== undefined) {
        numVal = val.raw_value;
      }
      if (typeof numVal === 'string' && numVal.trim() !== 'Male' && numVal.trim() !== 'Female' && !isNaN(parseFloat(numVal))) {
        numVal = parseFloat(numVal);
      }
      normalized[canonicalKey] = numVal;
    }
  });
  return normalized;
}

export const CLIENT_PHYSIOLOGICAL_BOUNDS = {
  Age: { min: 18, max: 100 },
  Height: { min: 120, max: 230 },
  Weight: { min: 30, max: 250 },
  BMI: { min: 12, max: 65 },
  Waist_Circumference: { min: 50, max: 180 },
  Systolic_BP: { min: 70, max: 240 },
  Diastolic_BP: { min: 40, max: 140 },
  Fasting_Blood_Glucose: { min: 50, max: 400 },
  HbA1c: { min: 3.5, max: 16.0 },
  Triglycerides: { min: 20, max: 1000 },
  HDL: { min: 10, max: 120 },
  LDL: { min: 20, max: 400 },
  ALT: { min: 2, max: 500 },
  AST: { min: 2, max: 500 },

  Average_Daily_Steps: { min: 500, max: 40000 },
  Active_Minutes: { min: 0, max: 360 },
  Sedentary_Time_Minutes: { min: 60, max: 1200 },
  Resting_Heart_Rate: { min: 35, max: 140 },
  Sleep_Duration: { min: 2, max: 16 },
  Calories_Burned: { min: 500, max: 8000 },
  Average_Glucose: { min: 50, max: 400 },
  Glucose_Variability: { min: 2, max: 80 },
  Time_In_Range: { min: 0, max: 100 },
  Time_Above_Range: { min: 0, max: 100 },

  Shannon_Diversity_Index: { min: 0.5, max: 6.0 },
  Akkermansia: { min: 0, max: 30 },
  Faecalibacterium: { min: 0, max: 40 },
  Bifidobacterium: { min: 0, max: 30 },
  Roseburia: { min: 0, max: 25 },
  Escherichia_Shigella: { min: 0, max: 25 },
  Blautia: { min: 0, max: 30 },
  Prevotella: { min: 0, max: 40 },
  Collinsella: { min: 0, max: 20 },
  Alistipes: { min: 0, max: 20 },
  Bacteroides: { min: 0, max: 50 }
};

export function validateClientField(fieldName, value) {
  if (value === '' || value === null || value === undefined) return '';
  const bounds = CLIENT_PHYSIOLOGICAL_BOUNDS[fieldName];
  if (!bounds) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return `Must be a valid number`;
  if (num < bounds.min || num > bounds.max) {
    return `Must be [${bounds.min} - ${bounds.max}]`;
  }
  return '';
}
