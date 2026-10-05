import re
import pathlib
import json

def extract_fusion_matrices(log_file):
    targets = ["TYPE2_DIABETES", "PREDIABETES", "HIGH_ADIPOSITY_RISK", "METABOLIC_SYNDROME", "NAFLD"]
    pathways = ["Clinical_Only", "Wearable_Only", "Gut_Only", "Clinical_Wearable", "Clinical_Gut", "Wearable_Gut", "Full_Multimodal_Fusion"]
    
    auroc_mat = {t: {} for t in targets}
    auprc_mat = {t: {} for t in targets}
    f1_mat = {t: {} for t in targets}
    brier_mat = {t: {} for t in targets}
    
    current_target = None
    if not pathlib.Path(log_file).exists(): return {}
    with open(log_file, "r") as f:
        for line in f:
            if "TARGET DISEASE:" in line:
                current_target = line.split("TARGET DISEASE:")[1].strip()
            if "-> Test AUROC:" in line:
                m = re.search(r'\s*([A-Za-z_]+)\s*\(.*Test AUROC:\s*([\d.]+)\s*\[.*\]\s*\|\s*F1:\s*([\d.]+)', line)
                if m:
                    pathway = m.group(1)
                    auroc_mat[current_target][pathway] = m.group(2)
                    f1_mat[current_target][pathway] = m.group(3)
                    # For AUPRC/Brier, if they aren't printed we might not have them.
                    # Wait, train_v4b_fusion.py didn't print AUPRC or Brier in the main log output string, it just printed F1.
                    # Let's check if it printed them. We might need to update the regex if it did.
                    m_brier = re.search(r'Brier:\s*([\d.]+)', line)
                    m_auprc = re.search(r'AUPRC:\s*([\d.]+)', line)
                    if m_brier: brier_mat[current_target][pathway] = m_brier.group(1)
                    if m_auprc: auprc_mat[current_target][pathway] = m_auprc.group(1)
                    
    return {"AUROC": auroc_mat, "AUPRC": auprc_mat, "F1": f1_mat, "Brier": brier_mat}

def print_matrix(name, matrix):
    print(f"\n### Table: {name} Matrix")
    targets = ["TYPE2_DIABETES", "PREDIABETES", "HIGH_ADIPOSITY_RISK", "METABOLIC_SYNDROME", "NAFLD"]
    pathways = ["Clinical_Only", "Wearable_Only", "Gut_Only", "Clinical_Wearable", "Clinical_Gut", "Wearable_Gut", "Full_Multimodal_Fusion"]
    
    print("| Target | P1 (C) | P2 (W) | P3 (G) | P4 (C+W) | P5 (C+G) | P6 (W+G) | P7 (C+W+G) |")
    print("|---|---|---|---|---|---|---|---|")
    for t in targets:
        row = [t]
        for p in pathways:
            row.append(matrix.get(t, {}).get(p, "N/A"))
        print("| " + " | ".join(row) + " |")

def generate_report():
    matrices = extract_fusion_matrices(".system_generated/tasks/task-1641.log")
    print_matrix("7x5 AUROC", matrices["AUROC"])
    print_matrix("7x5 F1", matrices["F1"])

if __name__ == "__main__":
    generate_report()
