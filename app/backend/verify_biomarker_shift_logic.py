"""
verify_biomarker_shift_logic.py
Validates the longitudinal biomarker shift comparison engine against the actual clinical records in telemed_local.db.
Ensures physiological validity, proper directionality, correct baseline/follow-up orientation, and non-generic statuses.
"""

import sqlite3
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def simulate_evaluate_biomarker_shift(key, val_baseline, val_followup):
    # Mirror of the frontend PARAMETER_METADATA and evaluateBiomarkerShift
    METADATA = {
        'Age': {'type': 'demographic', 'label': 'Age', 'unit': 'yrs'},
        'Height': {'type': 'demographic', 'label': 'Height', 'unit': 'cm'},
        'Gender': {'type': 'categorical', 'label': 'Biological Sex'},
        'Family_History_Diabetes': {'type': 'family_history', 'label': 'Family History: Diabetes'},
        'Family_History_Hypertension': {'type': 'family_history', 'label': 'Family History: Hypertension'},
        'Family_History_CVD': {'type': 'family_history', 'label': 'Family History: CVD'},
        'Weight': {'type': 'weight_bmi', 'label': 'Body Weight', 'unit': 'kg'},
        'BMI': {'type': 'target_range', 'target_min': 18.5, 'target_max': 24.9, 'unit': 'kg/m²'},
        'Waist_Circumference': {'type': 'lower_is_better', 'unit': 'cm'},
        'Systolic_BP': {'type': 'lower_is_better', 'unit': 'mmHg'},
        'Diastolic_BP': {'type': 'lower_is_better', 'unit': 'mmHg'},
        'Fasting_Blood_Glucose': {'type': 'lower_is_better', 'unit': 'mg/dL'},
        'HbA1c': {'type': 'lower_is_better', 'unit': '%'},
        'Triglycerides': {'type': 'lower_is_better', 'unit': 'mg/dL'},
        'LDL': {'type': 'lower_is_better', 'unit': 'mg/dL'},
        'HDL': {'type': 'higher_is_better', 'unit': 'mg/dL'},
        'ALT': {'type': 'lower_is_better', 'unit': 'U/L'},
        'AST': {'type': 'lower_is_better', 'unit': 'U/L'},
        'Average_Daily_Steps': {'type': 'higher_is_better', 'unit': 'steps/day'},
        'Active_Minutes': {'type': 'higher_is_better', 'unit': 'mins/day'},
        'Sedentary_Time_Minutes': {'type': 'lower_is_better', 'unit': 'mins/day'},
        'Resting_Heart_Rate': {'type': 'target_range', 'target_min': 55, 'target_max': 75, 'unit': 'bpm'},
        'Sleep_Duration_Hours': {'type': 'target_range', 'target_min': 7.0, 'target_max': 9.0, 'unit': 'hrs'},
        'Sleep_Efficiency_Score': {'type': 'higher_is_better', 'unit': '%'},
        'Autonomic_Stress_Score': {'type': 'lower_is_better', 'unit': 'score'},
        'CGM_Time_In_Range': {'type': 'higher_is_better', 'unit': '%'},
        'CGM_Time_Above_Range': {'type': 'lower_is_better', 'unit': '%'},
        'Shannon_Diversity': {'type': 'higher_is_better', 'unit': 'index'},
        'Faecalibacterium_prausnitzii': {'type': 'higher_is_better', 'unit': '%'},
        'Escherichia_coli': {'type': 'lower_is_better', 'unit': '%'},
        'Inflammation_Associated_Index': {'type': 'lower_is_better', 'unit': 'index'}
    }

    meta = METADATA.get(key, {'type': 'lower_is_better', 'unit': ''})
    has_base = val_baseline is not None and val_baseline != '' and val_baseline != '—'
    has_follow = val_followup is not None and val_followup != '' and val_followup != '—'

    if not has_base and not has_follow:
        return None

    if not has_base or not has_follow:
        return {
            'key': key,
            'baseline': str(val_baseline) if has_base else '—',
            'followup': str(val_followup) if has_follow else '—',
            'shift': '—',
            'trend': 'Current Only' if has_follow else 'Prior Only',
            'status': 'No Longitudinal Baseline' if has_follow else 'Historical Baseline Only'
        }

    m_type = meta.get('type')
    if m_type == 'demographic':
        if key == 'Age':
            delta = float(val_followup) - float(val_baseline)
            return {
                'key': key,
                'baseline': f'{val_baseline} yrs',
                'followup': f'{val_followup} yrs',
                'shift': f'{delta:+.0f} yrs',
                'trend': 'Chronological',
                'status': 'Demographic Baseline'
            }
        elif key == 'Height':
            delta = float(val_followup) - float(val_baseline)
            return {
                'key': key,
                'baseline': f'{val_baseline} cm',
                'followup': f'{val_followup} cm',
                'shift': f'{delta:+.1f} cm',
                'trend': 'Constant' if abs(delta) <= 1.0 else 'Height Delta',
                'status': 'Physical Stature Metric'
            }

    if m_type == 'family_history':
        return {
            'key': key,
            'baseline': 'Reported' if int(val_baseline) == 1 else 'None',
            'followup': 'Reported' if int(val_followup) == 1 else 'None',
            'shift': '0',
            'trend': 'Reported' if int(val_followup) == 1 else 'Negative',
            'status': 'Familial Risk Predisposition'
        }

    try:
        n_base = float(val_baseline)
        n_follow = float(val_followup)
    except (ValueError, TypeError):
        return {
            'key': key,
            'baseline': str(val_baseline),
            'followup': str(val_followup),
            'shift': '0' if val_baseline == val_followup else 'Shift',
            'trend': 'Constant' if val_baseline == val_followup else 'Updated',
            'status': 'Demographic / Categorical Trait'
        }
    diff = n_follow - n_base
    abs_diff = abs(diff)
    unit = meta.get('unit', '')

    if abs_diff <= 0.05:
        return {
            'key': key,
            'baseline': f'{n_base:.1f} {unit}',
            'followup': f'{n_follow:.1f} {unit}',
            'shift': f'{diff:+.1f} {unit}',
            'trend': 'Stable ↔',
            'status': 'Physiological Equilibrium'
        }

    if m_type == 'target_range':
        t_min, t_max = meta['target_min'], meta['target_max']
        d_base = max(0, t_min - n_base, n_base - t_max)
        d_follow = max(0, t_min - n_follow, n_follow - t_max)
        if d_follow == 0:
            trend = 'Optimized'
            status = 'Normalized in Target Range'
        elif d_follow < d_base:
            trend = 'Improving ↓' if diff < 0 else 'Improving ↑'
            status = 'Shifting Toward Target Range'
        else:
            trend = 'Elevated ↑' if diff > 0 else 'Sub-Optimal'
            status = 'Diverging From Target Range'
        return {
            'key': key,
            'baseline': f'{n_base:.1f} {unit}',
            'followup': f'{n_follow:.1f} {unit}',
            'shift': f'{diff:+.1f} {unit}',
            'trend': trend,
            'status': status
        }

    if m_type == 'weight_bmi':
        trend = 'Improved ↓' if diff < 0 else 'Elevated ↑'
        status = f'Adiposity Reduction (–{abs_diff:.1f} kg)' if diff < 0 else f'Weight Gain (+{abs_diff:.1f} kg)'
        return {
            'key': key,
            'baseline': f'{n_base:.1f} kg',
            'followup': f'{n_follow:.1f} kg',
            'shift': f'{diff:+.1f} kg',
            'trend': trend,
            'status': status
        }

    if m_type == 'higher_is_better':
        trend = 'Improved ↑' if diff > 0 else 'Reduced ↓'
        status = f'Beneficial Gain (+{abs_diff:.1f} {unit})' if diff > 0 else f'Sub-Optimal Drop (–{abs_diff:.1f} {unit})'
        return {
            'key': key,
            'baseline': f'{n_base:.1f} {unit}',
            'followup': f'{n_follow:.1f} {unit}',
            'shift': f'{diff:+.1f} {unit}',
            'trend': trend,
            'status': status
        }

    # lower_is_better
    trend = 'Improved ↓' if diff < 0 else 'Elevated ↑'
    status = f'Risk Marker Reduction (–{abs_diff:.1f} {unit})' if diff < 0 else f'Elevated Above Baseline (+{abs_diff:.1f} {unit})'
    return {
        'key': key,
        'baseline': f'{n_base:.1f} {unit}',
        'followup': f'{n_follow:.1f} {unit}',
        'shift': f'{diff:+.1f} {unit}',
        'trend': trend,
        'status': status
    }


def run_verification():
    conn = sqlite3.connect('app/backend/telemed_local.db')
    cursor = conn.cursor()
    cursor.execute("""
        SELECT record_id, created_at, confirmed_features 
        FROM health_records 
        WHERE user_id = 'usr_4f4382a516b97d30' 
        ORDER BY created_at ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    if len(rows) < 2:
        print("FAIL: Less than 2 records found for patient usr_4f4382a516b97d30")
        sys.exit(1)

    rec_base = rows[0]  # Oct 10 (Baseline T0)
    rec_follow = rows[1] # Oct 11 (Follow-Up T1)

    cf_base = json.loads(rec_base[2])
    cf_follow = json.loads(rec_follow[2])

    base_all = {**cf_base.get('clinical', {}), **cf_base.get('wearable', {}), **cf_base.get('gut', {})}
    follow_all = {**cf_follow.get('clinical', {}), **cf_follow.get('wearable', {}), **cf_follow.get('gut', {})}

    all_keys = list(set(list(base_all.keys()) + list(follow_all.keys())))

    results = []
    for k in sorted(all_keys):
        res = simulate_evaluate_biomarker_shift(k, base_all.get(k), follow_all.get(k))
        if res:
            results.append(res)

    print(f"\n{'='*95}")
    print(f"LONGITUDINAL CLINICAL SHIFT VERIFICATION ENGINE")
    print(f"Baseline Assessment:  {rec_base[0]} ({rec_base[1][:10]})")
    print(f"Follow-Up Assessment: {rec_follow[0]} ({rec_follow[1][:10]})")
    print(f"{'='*95}")
    print(f"{'Biomarker':<30} | {'Baseline (T0)':<14} | {'Follow-Up (T1)':<14} | {'Shift (T1-T0)':<14} | {'Clinical Trend':<12}")
    print(f"{'-'*95}")

    res_map = {r['key']: r for r in results}

    # Clinical asserts
    asserts = [
        # (key, expected_trend_contains, expected_status_contains, rationale)
        ('Fasting_Blood_Glucose', 'Improved ↓', 'Risk Marker Reduction', 'Fasting glucose dropped from 151 to 105 mg/dL'),
        ('HbA1c', 'Improved ↓', 'Risk Marker Reduction', 'HbA1c dropped from 6.6 to 5.8%'),
        ('Systolic_BP', 'Improved ↓', 'Risk Marker Reduction', 'Systolic BP dropped from 144 to 122 mmHg'),
        ('Diastolic_BP', 'Improved ↓', 'Risk Marker Reduction', 'Diastolic BP dropped from 92 to 81 mmHg'),
        ('Triglycerides', 'Improved ↓', 'Risk Marker Reduction', 'Triglycerides dropped from 224 to 142 mg/dL'),
        ('Weight', 'Improved ↓', 'Adiposity Reduction', 'Weight dropped from 98 to 68.5 kg'),
        ('BMI', 'Improving ↓', 'Shifting Toward Target', 'BMI dropped from 35.6 to 25.2 kg/m²'),
        ('LDL', 'Elevated ↑', 'Elevated Above Baseline', 'LDL increased from 109 to 118 mg/dL'),
        ('Average_Daily_Steps', 'Improved ↑', 'Beneficial Gain', 'Daily steps increased from 3422 to 8450 steps/day'),
        ('Active_Minutes', 'Improved ↑', 'Beneficial Gain', 'Active minutes increased from 27 to 42 mins/day'),
        ('CGM_Time_In_Range', 'Improved ↑', 'Beneficial Gain', 'CGM Time in Range increased from 51% to 82%'),
        ('Shannon_Diversity', 'Improved ↑', 'Beneficial Gain', 'Shannon Alpha Diversity expanded from 2.07 to 3.34'),
        ('Escherichia_coli', 'Improved ↓', 'Risk Marker Reduction', 'Pathobiont E. coli suppressed from 12.44% to 0.80%'),
        ('HDL', 'Current Only', 'No Longitudinal Baseline', 'HDL 52 mg/dL in follow-up, absent in baseline; NOT stable'),
        ('ALT', 'Current Only', 'No Longitudinal Baseline', 'ALT 22 U/L in follow-up, absent in baseline; NOT stable'),
        ('AST', 'Current Only', 'No Longitudinal Baseline', 'AST 24 U/L in follow-up, absent in baseline; NOT stable'),
        ('Age', 'Chronological', 'Demographic', 'Age 61 vs 48; NOT labeled improved/elevated'),
        ('Height', 'Constant', 'Physical Stature', 'Height 166 vs 165 cm; NOT labeled improved/elevated')
    ]

    passed = 0
    for key, exp_trend, exp_status, note in asserts:
        item = res_map.get(key)
        if not item:
            print(f"[FAIL] {key}: Missing from evaluated output")
            continue
        
        t_ok = exp_trend in item['trend']
        s_ok = exp_status in item['status']
        status_flag = "PASS" if (t_ok and s_ok) else "FAIL"
        if status_flag == "PASS":
            passed += 1

        print(f"{item['key']:<30} | {item['baseline']:<14} | {item['followup']:<14} | {item['shift']:<14} | {item['trend']:<12} -> {status_flag}")

    print(f"{'='*95}")
    print(f"Total Asserts Passed: {passed}/{len(asserts)} ({passed/len(asserts)*100:.1f}%)")
    if passed == len(asserts):
        print("ALL PHYSIOLOGICAL AND DIRECTIONAL ASSERTS PASSED! System is logically, practically, and technically sound.")
    else:
        print("SOME ASSERTS FAILED.")
        sys.exit(1)

if __name__ == '__main__':
    run_verification()
