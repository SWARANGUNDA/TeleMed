import os
import random
import math
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# Distinctly Telugu Names
telugu_first_names = [
    "Venkata", "Sai", "Krishna", "Rama", "Lakshmi", "Srinivasa", 
    "Suresh", "Ramesh", "Mahesh", "Bhavani", "Swati", "Anusha", 
    "Karthik", "Vamshi", "Ramakrishna", "Pavan", "Teja", "Kavya", "Sindhu"
]
telugu_surnames = [
    "Yarlagadda", "Nandamuri", "Akkineni", "Daggubati", "Konda", 
    "Pothineni", "Ghattamaneni", "Allu", "Konidela", "Uppalapati",
    "Golla", "Bokka", "Mekala", "Gaddam", "Dasari"
]

# Canonical 40 V4 Microbial Taxa
gut_taxa_40 = [
    "Akkermansia muciniphila", "Faecalibacterium prausnitzii", "Roseburia intestinalis",
    "Bifidobacterium longum", "Bifidobacterium adolescentis", "Bacteroides thetaiotaomicron",
    "Bacteroides vulgatus", "Bacteroides fragilis", "Bacteroides uniformis",
    "Prevotella copri", "Ruminococcus bromii", "Ruminococcus gnavus",
    "Blautia wexlerae", "Blautia hansenii", "Collinsella aerofaciens",
    "Escherichia coli", "Klebsiella pneumoniae", "Coprococcus eutactus",
    "Alistipes putredinis", "Alistipes finegoldii", "Subdoligranulum variable",
    "Enterococcus faecalis", "Eubacterium rectale", "Eubacterium hallii",
    "Parabacteroides distasonis", "Lactobacillus acidophilus", "Lactobacillus rhamnosus",
    "Streptococcus thermophilus", "Eggerthella lenta", "Christensenella minuta",
    "Methanobrevibacter smithii", "Dialister invisus", "Holdemanella biformis",
    "Barnesiella intestinihominis", "Anaerostipes caccae", "Phascolarctobacterium faecium",
    "Veillonella parvula", "Fusobacterium nucleatum", "Bilophila wadsworthia",
    "Sutterella wadsworthensis"
]

def generate_patient_data(profile_type):
    if profile_type == "Healthy_Young":
        age = random.randint(20, 35)
        weight = random.randint(55, 75)
        sys_bp, dia_bp = random.randint(110, 120), random.randint(70, 80)
        fbg = random.randint(80, 95)
        hba1c = round(random.uniform(4.5, 5.4), 1)
        steps = random.randint(8000, 14000)
    elif profile_type == "Diabetic_Elderly":
        age = random.randint(60, 80)
        weight = random.randint(75, 100)
        sys_bp, dia_bp = random.randint(135, 160), random.randint(85, 95)
        fbg = random.randint(126, 180)
        hba1c = round(random.uniform(6.5, 9.0), 1)
        steps = random.randint(2000, 5000)
    elif profile_type == "Athlete":
        age = random.randint(22, 40)
        weight = random.randint(65, 85)
        sys_bp, dia_bp = random.randint(100, 115), random.randint(60, 75)
        fbg = random.randint(75, 90)
        hba1c = round(random.uniform(4.5, 5.2), 1)
        steps = random.randint(12000, 20000)
    else: # Prediabetic_MiddleAged
        age = random.randint(40, 55)
        weight = random.randint(70, 95)
        sys_bp, dia_bp = random.randint(120, 135), random.randint(80, 85)
        fbg = random.randint(100, 125)
        hba1c = round(random.uniform(5.7, 6.4), 1)
        steps = random.randint(4000, 8000)

    gender = random.choice(["Male", "Female"])
    height = random.randint(155, 185)
    bmi = round(weight / ((height/100)**2), 1)

    # 40 Canonical Taxa Realistic Generation (sums to ~95.5%, leaving 4.5% other taxa)
    base_weights = {
        "Akkermansia muciniphila": 3.8 if profile_type == "Healthy_Young" else 0.85,
        "Faecalibacterium prausnitzii": 9.2 if profile_type != "Diabetic_Elderly" else 4.1,
        "Roseburia intestinalis": 4.6 if profile_type != "Diabetic_Elderly" else 1.9,
        "Bifidobacterium longum": 5.1,
        "Bifidobacterium adolescentis": 3.1,
        "Bacteroides thetaiotaomicron": 6.2,
        "Bacteroides vulgatus": 10.2,
        "Bacteroides fragilis": 4.1,
        "Bacteroides uniformis": 3.9,
        "Prevotella copri": 7.8,
        "Ruminococcus bromii": 2.4,
        "Ruminococcus gnavus": 1.8,
        "Blautia wexlerae": 4.4,
        "Blautia hansenii": 2.3,
        "Collinsella aerofaciens": 1.6,
        "Escherichia coli": 0.9,
        "Klebsiella pneumoniae": 0.4,
        "Coprococcus eutactus": 2.6,
        "Alistipes putredinis": 1.8,
        "Alistipes finegoldii": 1.5,
        "Subdoligranulum variable": 2.1,
        "Enterococcus faecalis": 0.5,
        "Eubacterium rectale": 3.7,
        "Eubacterium hallii": 2.2,
        "Parabacteroides distasonis": 1.8,
        "Lactobacillus acidophilus": 1.2,
        "Lactobacillus rhamnosus": 0.8,
        "Streptococcus thermophilus": 1.1,
        "Eggerthella lenta": 0.7,
        "Christensenella minuta": 1.3,
        "Methanobrevibacter smithii": 0.8,
        "Dialister invisus": 1.2,
        "Holdemanella biformis": 0.8,
        "Barnesiella intestinihominis": 1.2,
        "Anaerostipes caccae": 1.4,
        "Phascolarctobacterium faecium": 1.7,
        "Veillonella parvula": 0.8,
        "Fusobacterium nucleatum": 0.4,
        "Bilophila wadsworthia": 0.5,
        "Sutterella wadsworthensis": 0.7
    }

    raw_taxa = {}
    for t in gut_taxa_40:
        base = base_weights.get(t, 1.0)
        noise = random.uniform(0.88, 1.12)
        raw_taxa[t] = max(0.1, base * noise)

    total_raw = sum(raw_taxa.values())
    target_sum = 95.5
    taxa_vals = {t: round((raw_taxa[t] / total_raw) * target_sum, 2) for t in gut_taxa_40}

    # 9 Ecological & Functional Indices Derived Computation
    vals_list = [taxa_vals[t] for t in gut_taxa_40]
    total_val = sum(vals_list)
    p_frac = [v / total_val for v in vals_list]
    shannon = round(-sum(p * math.log(p) for p in p_frac if p > 0), 4)
    simpson = round(1.0 - sum(p * p for p in p_frac), 4)
    richness = float(len([v for v in vals_list if v > 0]))
    pielou = round(shannon / math.log(max(richness, 2)), 4)

    scfa_idx = round(sum(vals_list[i] for i in [1, 2, 3, 4, 10, 17, 18, 20, 22, 23, 31, 34]) / 12.0, 4)
    butyrate_idx = round(sum(vals_list[i] for i in [1, 2, 17, 20, 22, 23, 34]) / 7.0, 4)
    barrier_idx = round(sum(vals_list[i] for i in [0, 1, 3, 4, 29]) / 5.0, 4)
    infl_idx = round(sum(vals_list[i] for i in [11, 14, 15, 16, 21, 28, 37, 38]) / 8.0, 4)

    firmicutes_idx = [1, 2, 10, 11, 12, 13, 17, 20, 21, 22, 23, 25, 26, 27, 29, 31, 32, 34, 35, 36]
    bacteroidetes_idx = [5, 6, 7, 8, 9, 18, 19, 24, 33]
    firmicutes = sum(vals_list[i] for i in firmicutes_idx)
    bacteroidetes = sum(vals_list[i] for i in bacteroidetes_idx)
    log_fb = round(math.log((firmicutes + 0.01) / (bacteroidetes + 0.01)), 4)

    # Combine all 40 taxa + 9 derived indices = 49 Canonical Model Features
    gut_all = {}
    for t in gut_taxa_40:
        gut_all[t] = f"{taxa_vals[t]:.2f} %"

    gut_all["Shannon Diversity Index"] = f"{shannon:.4f}"
    gut_all["Simpson Diversity"] = f"{simpson:.4f}"
    gut_all["Observed Richness"] = f"{richness:.1f}"
    gut_all["Pielou Evenness"] = f"{pielou:.4f}"
    gut_all["SCFA Producer Index"] = f"{scfa_idx:.4f}"
    gut_all["Butyrate Producer Index"] = f"{butyrate_idx:.4f}"
    gut_all["Barrier Associated Index"] = f"{barrier_idx:.4f}"
    gut_all["Inflammation Associated Index"] = f"{infl_idx:.4f}"
    gut_all["Log Firmicutes Bacteroidetes Ratio"] = f"{log_fb:.4f}"
    
    return {
        "Clinical": {
            "Age": age, "Gender": gender, "Height (cm)": height, "Weight (kg)": weight, "BMI": bmi,
            "Waist Circumference (cm)": random.randint(75, 110),
            "Systolic BP (mmHg)": sys_bp, "Diastolic BP (mmHg)": dia_bp,
            "Fasting Blood Glucose (mg/dL)": fbg, "HbA1c (%)": hba1c,
            "Triglycerides (mg/dL)": random.randint(90, 250),
            "HDL (mg/dL)": random.randint(35, 65), "LDL (mg/dL)": random.randint(90, 160),
            "ALT (U/L)": random.randint(15, 60), "AST (U/L)": random.randint(15, 50)
        },
        "Wearable": {
            "Average Daily Steps": steps,
            "Active Minutes/Day": random.randint(10, 60),
            "Sedentary Time (min/day)": random.randint(300, 700),
            "Resting Heart Rate (bpm)": random.randint(55, 85),
            "HRV RMSSD (ms)": random.randint(20, 70),
            "Sleep Duration (hours)": round(random.uniform(5.0, 8.5), 1),
            "Sleep Efficiency Score": random.randint(65, 95),
            "Autonomic Stress Score": random.randint(30, 80),
            "Activity Energy Expenditure (kcal)": random.randint(200, 800),
            "Exercise Frequency (Days/Week)": random.randint(0, 5),
            "CGM Average Glucose (mg/dL)": random.randint(95, 140),
            "CGM Glucose CV (%)": random.randint(10, 30),
            "CGM Time In Range (%)": random.randint(50, 95),
            "CGM Time Above Range (%)": random.randint(5, 40),
            "CGM Time Below Range (%)": random.randint(0, 10)
        },
        "Gut Microbiome": gut_all,
        "_dob": datetime.date.today() - datetime.timedelta(days=age*365)
    }

def create_single_modality_pdf(filename, patient_name, data, modality_name, modality_data, headers, report_type_label):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], alignment=1, fontSize=16, spaceAfter=10, textColor=colors.HexColor('#1E3A8A'))
    subtitle_style = ParagraphStyle('SubtitleStyle', parent=styles['Heading2'], spaceAfter=8, fontSize=12, textColor=colors.HexColor('#0F172A'))
    elements = []
    
    elements.append(Paragraph("<b>TeleMed Central Diagnostic Laboratory</b>", title_style))
    elements.append(Paragraph("123 Health Avenue, Medical District, NY 10001 | Phone: 1-800-TELEMED", ParagraphStyle('Address', alignment=1, fontSize=8, textColor=colors.gray, spaceAfter=12)))
    
    patient_info = [
        ["Patient Name:", patient_name, "Report Date:", datetime.date.today().strftime('%B %d, %Y')],
        ["DOB:", data["_dob"].strftime('%B %d, %Y'), "Accession No:", f"TM-{random.randint(10000,99999)}"],
        ["Provider:", "Dr. TeleMed AI System", "Test Panel:", report_type_label]
    ]
    
    t_info = Table(patient_info, colWidths=[80, 190, 80, 190])
    t_info.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0F172A')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTNAME', (1,0), (1,-1), 'Helvetica'),
        ('FONTNAME', (3,0), (3,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
    ]))
    elements.append(t_info)
    elements.append(Spacer(1, 10))
    
    is_gut = len(modality_data) > 25
    table_style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTSIZE', (0, 1), (-1, -1), 7.5 if is_gut else 8.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5 if is_gut else 5),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5 if is_gut else 5),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')])
    ])

    elements.append(Paragraph(f"<b>{modality_name}</b>", subtitle_style))
    table_data = [headers]
    for key, val in modality_data.items():
        if key != "_dob":
            table_data.append([key, str(val)])
    t = Table(table_data, colWidths=[320, 220])
    t.setStyle(table_style)
    elements.append(t)
    elements.append(Spacer(1, 10))

    disclaimer = "CLINICAL DISCLAIMER: This document is a simulated synthetic medical report intended for system testing and validation only. The metrics presented do not belong to a real patient and should not be used for diagnosis."
    elements.append(Paragraph(f"<i>{disclaimer}</i>", ParagraphStyle('Disclaimer', fontSize=7, textColor=colors.gray, alignment=1)))

    doc.build(elements)

os.makedirs("test_reports/separated_pdf_reports", exist_ok=True)
profiles = ["Healthy_Young", "Diabetic_Elderly", "Athlete", "Prediabetic_MiddleAged"]

print("Generating 20 patients x 3 separated PDF reports (including full 49-feature Gut reports)...")
for i in range(1, 21):
    first_name = random.choice(telugu_first_names)
    last_name = random.choice(telugu_surnames)
    if i == 1:
        first_name = "Pavan"
        last_name = "Konidela"
    full_name = f"{first_name} {last_name}"
    
    profile = profiles[i % 4] 
    data = generate_patient_data(profile)
    
    # 1. Clinical PDF
    clinical_file = f"test_reports/separated_pdf_reports/P{i}_{first_name}_Clinical.pdf"
    create_single_modality_pdf(clinical_file, full_name, data, "Clinical Laboratory Panel", data["Clinical"], ["Biomarker", "Measured Value"], "Isolated Clinical Profile")
    
    # 2. Wearable PDF
    wearable_file = f"test_reports/separated_pdf_reports/P{i}_{first_name}_Wearable.pdf"
    create_single_modality_pdf(wearable_file, full_name, data, "Wearable Telemetry & CGM (30-Day Average)", data["Wearable"], ["Metric", "Aggregated Value"], "Isolated Wearable Profile")
    
    # 3. Gut PDF (49 features: 40 taxa + 9 derived indices)
    gut_file = f"test_reports/separated_pdf_reports/P{i}_{first_name}_Gut.pdf"
    create_single_modality_pdf(gut_file, full_name, data, "Gut Microbiome Metagenomic Profile (49 Features)", data["Gut Microbiome"], ["Bacterial Taxa / Metagenomic Metric", "Relative Abundance / Index Value"], "Isolated Gut Microbiome Profile")
    
    print(f"[{i}/20] Generated separated reports for {full_name}")

print("Successfully generated all separated PDF reports with 49-feature Gut representation!")
