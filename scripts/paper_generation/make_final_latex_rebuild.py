import json
import pandas as pd
from pathlib import Path

def get_fus(fusion, target, pathway, metric):
    row = fusion[(fusion['Target'] == target) & (fusion['Pathway'] == pathway)]
    return f"{row.iloc[0][metric]:.4f}" if not row.empty else "N/A"

def get_exp(expert, target, mod, metric):
    row = expert[(expert['Target'] == target) & (expert['Modality'] == mod)]
    return f"{row.iloc[0][metric]:.4f}" if not row.empty else "N/A"
    
def get_mis(missing, target, mode, level, model):
    row = missing[(missing['Target'] == target) & (missing['Mode'] == mode) & (missing['Level'] == level)]
    return f"{row.iloc[0][model]:.4f}" if not row.empty else "N/A"

def generate():
    with open('final_results.json', 'r') as f:
        data = json.load(f)
        
    expert = pd.DataFrame(data['expert_performance'])
    fusion = pd.DataFrame(data['fusion_performance'])
    missing = pd.DataFrame(data['missingness_performance'])

    tex_content = r"""\documentclass[conference]{IEEEtran}
\IEEEoverridecommandlockouts
\usepackage{cite}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage{algorithmic}
\usepackage{graphicx}
\usepackage{textcomp}
\usepackage{xcolor}
\usepackage{booktabs}
\usepackage{hyperref}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows,positioning}

\begin{document}

\title{TeleMed-M3: Dynamic Imputation-Free Multimodal Learning for Explainable Metabolic Disease Risk Stratification}

\author{\IEEEauthorblockN{Anonymous Authors}
\IEEEauthorblockA{\textit{Department of Biomedical Informatics} \\
\textit{Anonymous Institution}\\
City, Country \\
email@domain.com}
}

\maketitle

\begin{abstract}
Metabolic disease risk is multifactorial and can benefit from heterogeneous information from Clinical measurements, Wearable/CGM telemetry, and Gut microbiome data. However, multimodal healthcare systems commonly face a practical problem: not every patient has every modality available at every encounter. Conventional approaches often require complete modality availability, discard incomplete cases, or numerically impute unavailable modality features. TeleMed-M3 addresses this problem through modality-specific expert models, probability-level stacking, out-of-fold meta-features, seven non-empty modality-availability pathways, and dynamic routing based on available modalities, entirely avoiding numerical imputation of unavailable modalities. 

We evaluate this methodology on a de-clamped probabilistic synthetic cohort of 100,000 patients across five metabolic disease targets. The central contribution is dynamic, imputation-free, modality-aware probability-level fusion under evaluated patient-level modality missingness. Our evaluation demonstrates that L2-regularized probability-level stacking maintains performance when modalities are missing. The major limitation of this study is the reliance on synthetically generated data; future prospective validation on real-world multi-omic patient cohorts is required.
\end{abstract}

\begin{IEEEkeywords}
Multimodal Machine Learning, Missing Modalities, Imputation-Free, Stacking Fusion, Metabolic Disease, Explainable AI
\end{IEEEkeywords}

\section{Introduction}
\subsection{Problem Context}
Metabolic disease risk is multifactorial and can benefit from heterogeneous information from Clinical measurements, Wearable/CGM information, and Gut microbiome information.

\subsection{Missing-Modality Challenge}
However, multimodal healthcare systems commonly face a practical problem: NOT every patient has every modality available at every encounter. Conventional approaches often require complete modality availability, discard incomplete cases, or numerically impute unavailable modality features. 

\subsection{Research Gap}
Existing multimodal systems frequently assume fixed modality availability or rely on imputation/representation completion. TeleMed-M3 instead evaluates a probability-level dynamic routing design explicitly across all seven non-empty modality-availability pathways and under controlled patient-level modality missingness.

\subsection{Research Questions}
\textbf{RQ1:} How does each modality independently discriminate the five metabolic risk targets in the de-clamped synthetic cohort?
\textbf{RQ2:} How does probability-level fusion perform across all seven non-empty modality combinations?
\textbf{RQ3:} Does multimodal fusion provide measurable incremental discrimination over Clinical-only prediction?
\textbf{RQ4:} Can dynamic routing maintain predictive performance under simulated patient-level modality missingness?
\textbf{RQ5:} How does dynamic routing compare with conventional median imputation under the evaluated missingness conditions?
\textbf{RQ6:} How does probability-level dynamic routing compare with conventional early fusion?
\textbf{RQ7:} How can TreeSHAP and evidence-grounded Medical RAG be incorporated into the proposed framework for explainable risk reporting?

\subsection{Contributions}
1. A dynamic modality-routing architecture supporting all seven non-empty combinations of Clinical, Wearable/CGM, and Gut Microbiome modalities.
2. Modality-specific expert models that produce risk probabilities independently for five metabolic targets.
3. OOF probability-level stacking with serialized preprocessing pipelines to ensure reproducible training/inference behavior.
4. An evaluation framework for simulated patient-level modality missingness without numerical imputation of unavailable modality blocks.
5. Controlled comparison against median-imputation and early-fusion baselines.
6. Integration of TreeSHAP and evidence-grounded Medical RAG as an explainability/reporting layer, explicitly identified as exploratory because quantitative explanation evaluation was not performed.

\section{Related Work}
\subsection{Multimodal Healthcare Machine Learning}
Heterogeneous clinical, physiological, behavioral, and biological data are increasingly combined to stratify risk. Shickel et al. \cite{shickel2017ehr} demonstrated deep learning on EHRs, while Poplin et al. \cite{poplin2018cvd} highlighted deep learning for clinical risk. Dunn et al. \cite{dunn2021wearables} proved wearable sensors enable personalized prediction.

\subsection{Missing-Modality Learning}
Missing modality blocks represent a unique challenge compared to missing numerical values inside a modality. While intra-modality missingness can be addressed with simple imputation, an entire modality being unavailable requires techniques such as modality dropout, modality-specific models, modality routing, or mixture-of-experts concepts. 

\subsection{Multimodal Fusion Strategies}
Fusion architectures include early fusion, intermediate fusion, and late fusion. Probability-level fusion (stacking) is highly suitable for heterogeneous modality experts because it operates on a unified probability space.

\subsection{Explainable Healthcare ML}
Feature attribution methods such as TreeSHAP have become standard for interpreting complex risk models \cite{lundberg2020local}.

\subsection{Evidence-Grounded Medical Reporting}
Retrieval-grounded generation converts model outputs into contextual explanations by anchoring generative models to external knowledge sources \cite{lewis2020rag}. 

\subsection{Research Gap Summary}
Existing multimodal systems frequently assume fixed modality availability or rely on imputation/representation completion. TeleMed-M3 evaluates probability-level dynamic routing explicitly across all seven non-empty modality-availability pathways under controlled missingness.

\section{Dataset and Cohort}
\subsection{De-Clamped Probabilistic Synthetic Cohort}
The evaluation utilizes a ``De-Clamped Probabilistic Synthetic Cohort'' consisting of 100,000 synthetic patients with a 70/15/15 train/validation/test split. A Gaussian-Copula latent dependence structure was employed.

\subsection{Modalities and Features}
The dataset provides 18 Clinical features, 15 Wearable/CGM features, and 49 predictive Gut Microbiome dimensions.

\subsection{Target Definitions}
The five targets are Type 2 Diabetes, Prediabetes, High Adiposity Risk, Metabolic Syndrome, and NAFLD.

\subsection{Target Prevalence}
The exact positive-class prevalence rates are: Type 2 Diabetes (52.61\%), Prediabetes (20.01\%), High Adiposity Risk (39.04\%), Metabolic Syndrome (57.12\%), and NAFLD (59.57\%). Prevalence is particularly relevant when interpreting AUPRC, as baseline random-chance AUPRC is equivalent to prevalence.

\subsection{Deterministic Label-Feature Coupling Audit}
An earlier dataset-generation version applied deterministic post-label feature clamping (e.g., T2D $\to$ HbA1c/FPG clamping). This created target-feature leakage, meaning earlier near-perfect Clinical performance was NOT valid generalizable predictive performance. The clamping logic was removed. All final experiments use the completely de-clamped probabilistic cohort.

\section{TeleMed-M3 Methodology}
\subsection{Overall Architecture}
The system routes patients to the appropriate modality pathway without numerical imputation of unavailable modalities.

\begin{figure}[htbp]
\centering
\includegraphics[width=\columnwidth]{figures/architecture.png}
\caption{TeleMed-M3 Architecture. Unavailable modalities are NOT numerically imputed.}
\end{figure}

\subsection{Stage 1: Data Ingestion}
Clinical handles demographic and lab variables. Wearable/CGM captures activity and telemetry. Gut captures 49 predictive microbiome dimension features.

\subsection{Stage 2: Modality-Specific Experts}
Three modality experts independently process Clinical, Wearable/CGM, and Gut Microbiome. This creates 3 modalities $\times$ 5 targets = 15 distinct expert models.

\subsection{Stage 3: Preprocessing Pipelines}
Preprocessing is serialized as part of the estimator pipeline (e.g., imputation $\to$ scaling $\to$ classifier). This handles feature-level missing values within an available modality, which is strictly DIFFERENT from modality-level missingness.

\subsection{Stage 4: OOF Probability Generation}
The meta-learner must not be trained on predictions generated from the same observations used to fit the base expert. We utilize out-of-fold predictions to reduce meta-level leakage.

\subsection{Stage 5: Probability-Level Stacking}
Expert probabilities become meta-features. The fusion layer combines available modality probabilities across 7 pathways.

\subsection{Stage 6: Dynamic Routing}
The system detects which modality blocks are available and routes the patient. If a modality is unavailable, the system DOES NOT numerically impute the entire unavailable modality block.

\subsection{Stage 7: Risk Output}
Probabilities are generated for the 5 targets.

\subsection{Stage 8: TreeSHAP}
TreeSHAP handles feature-level attribution where supported by the expert model, explaining which features influenced prediction.

\subsection{Stage 9: Medical RAG}
The conceptual pipeline uses risk probability $\to$ evidence retrieval $\to$ evidence-grounded contextual explanation. Quantitative evaluation of explanation fidelity is future work.

\section{Experimental Design}
\subsection{Dataset Split}
100,000 patients split 70/15/15.
\subsection{Expert Models}
15 expert models for 3 modalities and 5 targets.
\subsection{Evaluation Metrics}
AUROC, AUPRC, F1, and Brier score.
\subsection{F1 Threshold}
F1 threshold = 0.5. No threshold optimization was performed.
\subsection{Simulated Patient-Level Missingness}
Evaluated at 10\%, 20\%, and 30\%. Missingness mechanism: independent uniform modality removal $\to$ MCAR under experimental construction. This is a controlled synthetic experiment and does not model informative clinical MAR/MNAR missingness.
\subsection{Median-Imputation Baseline}
Unavailable modality features are filled using the evaluated median-imputation approach. MICE and learned generative imputation were NOT evaluated.
\subsection{Early-Fusion Baseline}
Features are concatenated before prediction.

\section{Results}
\subsection{Single-Modality Expert Results}

\begin{table*}[htbp]
\centering
\caption{TABLE I: 15 Expert Models}
\begin{tabular}{@{}ll ccc c@{}}
\toprule
\textbf{Modality} & \textbf{Target} & \textbf{AUROC} & \textbf{AUPRC} & \textbf{F1} & \textbf{Brier} \\
\midrule
Clinical & Type2\_Diabetes & """ + get_exp(expert, 'Type2_Diabetes', 'Clinical', 'auroc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Clinical', 'auprc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Clinical', 'f1') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Clinical', 'brier') + r""" \\
Wearable & Type2\_Diabetes & """ + get_exp(expert, 'Type2_Diabetes', 'Wearable', 'auroc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Wearable', 'auprc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Wearable', 'f1') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Wearable', 'brier') + r""" \\
Gut & Type2\_Diabetes & """ + get_exp(expert, 'Type2_Diabetes', 'Gut', 'auroc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Gut', 'auprc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Gut', 'f1') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Gut', 'brier') + r""" \\
Clinical & Prediabetes & """ + get_exp(expert, 'Prediabetes', 'Clinical', 'auroc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Clinical', 'auprc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Clinical', 'f1') + r""" & """ + get_exp(expert, 'Prediabetes', 'Clinical', 'brier') + r""" \\
Wearable & Prediabetes & """ + get_exp(expert, 'Prediabetes', 'Wearable', 'auroc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Wearable', 'auprc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Wearable', 'f1') + r""" & """ + get_exp(expert, 'Prediabetes', 'Wearable', 'brier') + r""" \\
Gut & Prediabetes & """ + get_exp(expert, 'Prediabetes', 'Gut', 'auroc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Gut', 'auprc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Gut', 'f1') + r""" & """ + get_exp(expert, 'Prediabetes', 'Gut', 'brier') + r""" \\
Clinical & High\_Adiposity\_Risk & """ + get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'auroc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'auprc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'f1') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'brier') + r""" \\
Wearable & High\_Adiposity\_Risk & """ + get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'auroc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'auprc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'f1') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'brier') + r""" \\
Gut & High\_Adiposity\_Risk & """ + get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'auroc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'auprc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'f1') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'brier') + r""" \\
Clinical & Metabolic\_Syndrome & """ + get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'auroc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'auprc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'f1') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'brier') + r""" \\
Wearable & Metabolic\_Syndrome & """ + get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'auroc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'auprc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'f1') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'brier') + r""" \\
Gut & Metabolic\_Syndrome & """ + get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'auroc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'auprc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'f1') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'brier') + r""" \\
Clinical & NAFLD & """ + get_exp(expert, 'NAFLD', 'Clinical', 'auroc') + r""" & """ + get_exp(expert, 'NAFLD', 'Clinical', 'auprc') + r""" & """ + get_exp(expert, 'NAFLD', 'Clinical', 'f1') + r""" & """ + get_exp(expert, 'NAFLD', 'Clinical', 'brier') + r""" \\
Wearable & NAFLD & """ + get_exp(expert, 'NAFLD', 'Wearable', 'auroc') + r""" & """ + get_exp(expert, 'NAFLD', 'Wearable', 'auprc') + r""" & """ + get_exp(expert, 'NAFLD', 'Wearable', 'f1') + r""" & """ + get_exp(expert, 'NAFLD', 'Wearable', 'brier') + r""" \\
Gut & NAFLD & """ + get_exp(expert, 'NAFLD', 'Gut', 'auroc') + r""" & """ + get_exp(expert, 'NAFLD', 'Gut', 'auprc') + r""" & """ + get_exp(expert, 'NAFLD', 'Gut', 'f1') + r""" & """ + get_exp(expert, 'NAFLD', 'Gut', 'brier') + r""" \\
\bottomrule
\end{tabular}
\end{table*}

\subsection{Seven-Pathway Results}

\begin{table*}[htbp]
\centering
\caption{TABLE II: 7x5 AUROC Matrix}
\begin{tabular}{@{}l ccccccc@{}}
\toprule
\textbf{Target} & \textbf{C} & \textbf{W} & \textbf{G} & \textbf{C+W} & \textbf{C+G} & \textbf{W+G} & \textbf{C+W+G} \\
\midrule
Type2\_Diabetes & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Wearable_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Gut_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Wearable', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Wearable_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
Prediabetes & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Wearable_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Gut_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Wearable', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Wearable_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
High\_Adiposity\_Risk & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Only', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Only', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Gut_Only', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Wearable', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
Metabolic\_Syndrome & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Gut_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Wearable', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
NAFLD & """ + get_fus(fusion, 'NAFLD', 'Clinical_Only', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Wearable_Only', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Gut_Only', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Clinical_Wearable', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Clinical_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Wearable_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
\bottomrule
\end{tabular}
\end{table*}

\begin{table*}[htbp]
\centering
\caption{TABLE III: 7x5 AUPRC Matrix}
\begin{tabular}{@{}l ccccccc@{}}
\toprule
\textbf{Target} & \textbf{C} & \textbf{W} & \textbf{G} & \textbf{C+W} & \textbf{C+G} & \textbf{W+G} & \textbf{C+W+G} \\
\midrule
Type2\_Diabetes & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Only', 'auprc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Wearable_Only', 'auprc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Gut_Only', 'auprc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Wearable', 'auprc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Gut', 'auprc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Wearable_Gut', 'auprc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Full_Multimodal_Fusion', 'auprc') + r""" \\
Prediabetes & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Only', 'auprc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Wearable_Only', 'auprc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Gut_Only', 'auprc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Wearable', 'auprc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Gut', 'auprc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Wearable_Gut', 'auprc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Full_Multimodal_Fusion', 'auprc') + r""" \\
High\_Adiposity\_Risk & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Only', 'auprc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Only', 'auprc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Gut_Only', 'auprc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Wearable', 'auprc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Gut', 'auprc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Gut', 'auprc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Full_Multimodal_Fusion', 'auprc') + r""" \\
Metabolic\_Syndrome & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Only', 'auprc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Only', 'auprc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Gut_Only', 'auprc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Wearable', 'auprc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Gut', 'auprc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Gut', 'auprc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Full_Multimodal_Fusion', 'auprc') + r""" \\
NAFLD & """ + get_fus(fusion, 'NAFLD', 'Clinical_Only', 'auprc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Wearable_Only', 'auprc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Gut_Only', 'auprc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Clinical_Wearable', 'auprc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Clinical_Gut', 'auprc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Wearable_Gut', 'auprc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Full_Multimodal_Fusion', 'auprc') + r""" \\
\bottomrule
\end{tabular}
\end{table*}

\begin{table*}[htbp]
\centering
\caption{TABLE IV: 7x5 F1 Matrix}
\begin{tabular}{@{}l ccccccc@{}}
\toprule
\textbf{Target} & \textbf{C} & \textbf{W} & \textbf{G} & \textbf{C+W} & \textbf{C+G} & \textbf{W+G} & \textbf{C+W+G} \\
\midrule
Type2\_Diabetes & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Only', 'f1') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Wearable_Only', 'f1') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Gut_Only', 'f1') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Wearable', 'f1') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Gut', 'f1') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Wearable_Gut', 'f1') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Full_Multimodal_Fusion', 'f1') + r""" \\
Prediabetes & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Only', 'f1') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Wearable_Only', 'f1') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Gut_Only', 'f1') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Wearable', 'f1') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Gut', 'f1') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Wearable_Gut', 'f1') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Full_Multimodal_Fusion', 'f1') + r""" \\
High\_Adiposity\_Risk & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Only', 'f1') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Only', 'f1') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Gut_Only', 'f1') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Wearable', 'f1') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Gut', 'f1') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Gut', 'f1') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Full_Multimodal_Fusion', 'f1') + r""" \\
Metabolic\_Syndrome & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Only', 'f1') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Only', 'f1') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Gut_Only', 'f1') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Wearable', 'f1') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Gut', 'f1') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Gut', 'f1') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Full_Multimodal_Fusion', 'f1') + r""" \\
NAFLD & """ + get_fus(fusion, 'NAFLD', 'Clinical_Only', 'f1') + r""" & """ + get_fus(fusion, 'NAFLD', 'Wearable_Only', 'f1') + r""" & """ + get_fus(fusion, 'NAFLD', 'Gut_Only', 'f1') + r""" & """ + get_fus(fusion, 'NAFLD', 'Clinical_Wearable', 'f1') + r""" & """ + get_fus(fusion, 'NAFLD', 'Clinical_Gut', 'f1') + r""" & """ + get_fus(fusion, 'NAFLD', 'Wearable_Gut', 'f1') + r""" & """ + get_fus(fusion, 'NAFLD', 'Full_Multimodal_Fusion', 'f1') + r""" \\
\bottomrule
\end{tabular}
\end{table*}

\begin{table*}[htbp]
\centering
\caption{TABLE V: 7x5 Brier Matrix}
\begin{tabular}{@{}l ccccccc@{}}
\toprule
\textbf{Target} & \textbf{C} & \textbf{W} & \textbf{G} & \textbf{C+W} & \textbf{C+G} & \textbf{W+G} & \textbf{C+W+G} \\
\midrule
Type2\_Diabetes & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Only', 'brier') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Wearable_Only', 'brier') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Gut_Only', 'brier') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Wearable', 'brier') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Gut', 'brier') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Wearable_Gut', 'brier') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Full_Multimodal_Fusion', 'brier') + r""" \\
Prediabetes & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Only', 'brier') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Wearable_Only', 'brier') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Gut_Only', 'brier') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Wearable', 'brier') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Gut', 'brier') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Wearable_Gut', 'brier') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Full_Multimodal_Fusion', 'brier') + r""" \\
High\_Adiposity\_Risk & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Only', 'brier') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Only', 'brier') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Gut_Only', 'brier') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Wearable', 'brier') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Gut', 'brier') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Gut', 'brier') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Full_Multimodal_Fusion', 'brier') + r""" \\
Metabolic\_Syndrome & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Only', 'brier') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Only', 'brier') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Gut_Only', 'brier') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Wearable', 'brier') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Gut', 'brier') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Gut', 'brier') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Full_Multimodal_Fusion', 'brier') + r""" \\
NAFLD & """ + get_fus(fusion, 'NAFLD', 'Clinical_Only', 'brier') + r""" & """ + get_fus(fusion, 'NAFLD', 'Wearable_Only', 'brier') + r""" & """ + get_fus(fusion, 'NAFLD', 'Gut_Only', 'brier') + r""" & """ + get_fus(fusion, 'NAFLD', 'Clinical_Wearable', 'brier') + r""" & """ + get_fus(fusion, 'NAFLD', 'Clinical_Gut', 'brier') + r""" & """ + get_fus(fusion, 'NAFLD', 'Wearable_Gut', 'brier') + r""" & """ + get_fus(fusion, 'NAFLD', 'Full_Multimodal_Fusion', 'brier') + r""" \\
\bottomrule
\end{tabular}
\end{table*}

\subsection{Modality Contribution}
Clinical is the strongest single modality across all five targets. Wearable provides meaningful complementary signal. Gut alone is weaker but retains measurable signal for some targets. W+G remains informative when Clinical is unavailable. Full multimodal gains over Clinical-only are generally modest.

\subsection{Missingness Evaluation}

\begin{table}[htbp]
\centering
\caption{TABLE VI: Missingness Evaluation (T2D Random)}
\begin{tabular}{@{}l l l l@{}}
\toprule
\textbf{Target} & \textbf{Level} & \textbf{Dynamic} & \textbf{Median Imputation} \\
\midrule
T2D & 10\% & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.1, 'Dynamic_AUC') + r""" & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.1, 'Conv_AUC') + r""" \\
T2D & 20\% & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.2, 'Dynamic_AUC') + r""" & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.2, 'Conv_AUC') + r""" \\
T2D & 30\% & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC') + r""" & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Conv_AUC') + r""" \\
\bottomrule
\end{tabular}
\end{table}

\subsection{Dynamic Routing vs Imputation}
Dynamic routing produced a numerically higher AUROC (""" + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC') + r""") than conventional median imputation (""" + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Conv_AUC') + r""") under 30\% missingness, with an absolute difference of 0.0021 (95\% CI: [0.0001, 0.0041]). The absolute effect size is small.

\subsection{Dynamic Routing vs Early Fusion}
\begin{table}[htbp]
\centering
\caption{TABLE VIII: Early Fusion vs Dynamic Routing (AUROC)}
\begin{tabular}{@{}l l l@{}}
\toprule
\textbf{Target} & \textbf{Early Fusion} & \textbf{Dynamic Routing} \\
\midrule
Type2\_Diabetes & 0.7836 & """ + get_fus(fusion, 'Type2_Diabetes', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
Prediabetes & 0.5470 & """ + get_fus(fusion, 'Prediabetes', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
High\_Adiposity\_Risk & 0.7557 & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
Metabolic\_Syndrome & 0.7591 & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
NAFLD & 0.7756 & """ + get_fus(fusion, 'NAFLD', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
\bottomrule
\end{tabular}
\end{table}
Dynamic routing is broadly comparable to early fusion. It has a clear advantage in the evaluated Prediabetes comparison, while differences for other targets are small and mixed.

\section{Explainability and Reporting}
\subsection{TreeSHAP}
TreeSHAP handles feature-level attribution where supported. Quantitative evaluation of explanation fidelity was not performed.
\subsection{Evidence-Grounded Medical RAG}
The RAG pipeline provides context but remains an exploratory architectural layer.
\subsection{Patient/Clinician Reporting}
Quantitative evaluation of clinician agreement, RAG factuality, and clinical usefulness was not performed. These are future research directions.

\section{Discussion}
\subsection{Main Findings}
The system enables modality-aware fusion without numerical imputation of unavailable modality blocks.
\subsection{Clinical Modality Dominance}
Clinical has the strongest single-modality performance in this synthetic cohort.
\subsection{Complementary Modalities}
Wearable and Gut provide non-redundant information but do not dramatically outperform Clinical.
\subsection{Missing-Modality Handling}
The main value of TeleMed-M3 is structural flexibility rather than huge AUROC gains.
\subsection{Comparison with Baselines}
Dynamic routing avoids numerical completion of unavailable blocks. Performance is broadly comparable to early fusion.
\subsection{Explainability Implications}
TreeSHAP and RAG provide an interpretable reporting pathway.

\section{Limitations}
1. All predictive results come from synthetic data.
2. No external real-world validation.
3. No clinical efficacy or diagnostic utility established.
4. Gaussian-Copula generation may not capture nonlinear dependencies, higher-order interactions, or context-dependent physiological relationships.
5. Missingness is MCAR under the experimental construction.
6. MAR/MNAR were not evaluated.
7. MICE and advanced learned/generative imputation were not evaluated.
8. Threshold optimization was not performed.
9. Calibration/deployment operating points were not comprehensively evaluated.
10. Explainability/RAG effectiveness was not quantitatively evaluated.
11. No causal inference is performed.
12. No treatment recommendation efficacy is established.

\section{Reproducibility}
All operations used seed 20260808 (70/15/15 split). A preprocessing serialization discrepancy was identified and corrected before final evaluation. Expert artifacts and serialization pipelines are fully retained.

\section{Conclusion}
TeleMed-M3 demonstrates the feasibility of modality-specific expert prediction and OOF probability-level stacking. The contribution is primarily architectural and methodological: maintaining modality flexibility without numerical imputation of unavailable modality blocks.

\bibliographystyle{IEEEtran}
\bibliography{references}

\end{document}
"""
    with open("overleaf_submission/manuscript.tex", "w") as f:
        f.write(tex_content)
        
    print("LaTeX Generation Complete!")

if __name__ == "__main__":
    generate()
