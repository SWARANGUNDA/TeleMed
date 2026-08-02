import json
with open('scratch/modality_and_source_breakdown.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('=== FALSE POSITIVES ===')
for item in data['per_file_detailed']:
    if item['fp']:
        print(f"{item['file']}: FP = {item['fp']}")

print('\n=== FALSE NEGATIVES (MISSING) ===')
for item in data['per_file_detailed']:
    if item['fn']:
        print(f"{item['file']}: FN ({len(item['fn'])}) = {item['fn']}")
