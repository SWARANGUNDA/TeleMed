import re
import pathlib

def extract_log_data(log_file):
    data = []
    if not pathlib.Path(log_file).exists(): return data
    with open(log_file, "r") as f:
        for line in f:
            if "-> Test AUROC:" in line:
                # e.g.: Clinical.Type2_Diabetes (XGBoost) -> Test AUROC: 0.7812 [0.77, 0.79] | F1: 0.75 | Brier: 0.18
                # OR: Clinical_Wearable (LogisticRegression) -> Test AUROC: 0.7850 ...
                m = re.search(r'([A-Za-z0-9_.]+)\s*\(([^)]+)\)\s*->\s*Test AUROC:\s*([\d.]+).*?F1:\s*([\d.]+)(?:.*?Brier:\s*([\d.]+))?', line)
                if m:
                    brier = m.group(5) if m.group(5) else "N/A"
                    data.append({
                        "name": m.group(1),
                        "model": m.group(2).strip(),
                        "auroc": m.group(3),
                        "f1": m.group(4),
                        "brier": brier
                    })
    return data

def generate_report():
    experts = extract_log_data(".system_generated/tasks/task-1567.log")
    fusion = extract_log_data(".system_generated/tasks/task-1641.log")
    
    print("TABLE A: 15 Expert Models — De-Clamped Dataset")
    print("| Modality | Target | Model | AUROC | F1 | Brier |")
    print("|---|---|---|---|---|---|")
    for row in experts:
        mod_dis = row['name'].split('.')
        if len(mod_dis) == 2:
            print(f"| {mod_dis[0]} | {mod_dis[1]} | {row['model']} | {row['auroc']} | {row['f1']} | {row['brier']} |")
            
    print("\nTABLE B: 7 x 5 AUROC Matrix")
    # We will just print the fusion ones
    print("| Pathway | Target | AUROC |")
    print("|---|---|---|")
    targets = []
    current_target = ""
    with open(".system_generated/tasks/task-1641.log", "r") as f:
        for line in f:
            if "TARGET DISEASE:" in line:
                current_target = line.split("TARGET DISEASE:")[1].strip()
            if "-> Test AUROC:" in line:
                m = re.search(r'\s*([A-Za-z_]+)\s*\(.*Test AUROC:\s*([\d.]+)', line)
                if m:
                    print(f"| {m.group(1)} | {current_target} | {m.group(2)} |")

if __name__ == "__main__":
    generate_report()
