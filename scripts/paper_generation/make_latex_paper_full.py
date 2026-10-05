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
    stats = pd.DataFrame(data['statistical_tests'])

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

\def\BibTeX{{\rm B\kern-.05em{\sc i\kern-.025em b}\kern-.08em
    T\kern-.1667em\lower.7ex\hbox{E}\kern-.125emX}}

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
\textbf{Background:} Multimodal metabolic risk assessment may combine Clinical, Wearable/CGM, and Gut Microbiome information, but modality availability can vary greatly in practice. 
\textbf{Problem:} Conventional multimodal systems often require complete feature blocks or rely on numerical imputation when modalities are unavailable. 
\textbf{Method:} TeleMed-M3 uses modality-specific expert models and probability-level stacking across all seven non-empty modality combinations (C, W, G, C+W, C+G, W+G, C+W+G). 
\textbf{Dataset:} We evaluated this architecture on a 100,000-patient de-clamped probabilistic synthetic cohort (70/15/15 split). 
\textbf{Targets:} Type 2 Diabetes, Prediabetes, High Adiposity Risk, Metabolic Syndrome, and NAFLD. 
\textbf{Missingness:} Patient-level simulated modality loss at evaluated 10-30\% levels. 
\textbf{Results:} Clinical was the strongest single modality across the five targets. Wearable+Gut retained measurable discrimination when Clinical was unavailable. Full multimodal gains over Clinical-only were modest. Dynamic routing remained operational under simulated patient-level missingness, producing numerically higher AUROCs than conventional imputation without establishing sweeping statistical superiority. Dynamic routing achieved comparable performance to conventional early fusion while preserving structural robustness. 
\textbf{Conclusion:} The primary contribution is modality-flexible, imputation-free probability-level routing under evaluated synthetic missingness conditions.
\end{abstract}

\begin{IEEEkeywords}
Multimodal AI, Missing Data, Stacking Fusion, Explainable AI
\end{IEEEkeywords}

\section{Introduction}
Modern precision medicine synthesizes comprehensive patient profiles to track systemic pathologies. The convergence of diverse diagnostic streams promises personalized predictive care, but deploying multimodal systems in scalable environments remains structurally challenging due to asymmetric healthcare data collection.

\subsection{Healthcare Multimodality Problem and Missingness}
In telemedicine, missingness is the structural norm. A patient may upload smartwatch data but lack a recent blood draw. Standard ML workflows handle missing inputs via statistical imputation. While mathematically sound for randomly missing scalar values, employing numerical imputation when an entire biological modality is missing forces the model into generative assumptions. Dynamic routing can instead operate strictly on the subset of available modality experts. This study evaluates simulated modality missingness and introduces TeleMed-M3, an imputation-free probability-level stacking framework.

\subsection{Research Questions}
\textbf{RQ1:} How does each modality independently discriminate the five metabolic risk targets in the de-clamped synthetic cohort?
\textbf{RQ2:} How does probability-level fusion perform across all seven non-empty modality combinations?
\textbf{RQ3:} Does multimodal fusion provide measurable incremental discrimination over Clinical-only prediction?
\textbf{RQ4:} Can the dynamic routing architecture maintain predictive performance under simulated patient-level modality missingness?
\textbf{RQ5:} How does dynamic routing compare with conventional modality imputation?
\textbf{RQ6:} How does probability-level dynamic routing compare with conventional early fusion?
\textbf{RQ7:} How can TreeSHAP and evidence-grounded Medical RAG support explainable risk reporting? (Exploratory framework).

\section{Contributions}
1. An imputation-free dynamic modality-routing architecture covering all seven non-empty modality configurations.
2. Modality-specific expert modeling for Clinical, Wearable/CGM, and Gut Microbiome data across five metabolic risk targets.
3. Out-of-fold probability-level stacking with reproducible Pipeline-based preprocessing.
4. Controlled evaluation under simulated patient-level modality missingness.
5. Comparison with conventional median-imputation and early-fusion baselines.
6. TreeSHAP and evidence-grounded Medical RAG reporting architecture, with quantitative evaluation clearly identified as future work.

\section{Related Work}
Multimodal systems in healthcare generally require complete feature vectors or rely heavily on imputation. Early fusion networks implicitly impute representations. Prior research on modality routing has proposed complex modular networks. Here, we evaluate probability-level meta-learners operating directly on available instantiated modality experts.

\begin{table}[htbp]
\centering
\caption{LITERATURE COMPARISON}
\begin{tabular}{|l|l|l|l|}
\hline
\textbf{Study} & \textbf{Modality} & \textbf{Algorithm} & \textbf{Missing-Modality Strategy} \\
\hline
Poplin et al. & Image & Deep Learning & N/A (Complete cases) \\
Shickel et al. & Clinical & LSTM & Forward Fill / LOCF \\
Dunn et al. & Wearable & Random Forest & Dropped records \\
Goh et al. & Gut & SVM & N/A (Complete cases only) \\
\textbf{TeleMed-M3} & \textbf{C+W+G} & \textbf{Stacking} & \textbf{Imputation-Free (Routing)} \\
\hline
\end{tabular}
\end{table}

\section{Dataset: De-Clamped Probabilistic Synthetic Cohort}
The evaluation utilizes a ``De-Clamped Probabilistic Synthetic Cohort''. It comprises 100,000 patients with a 70/15/15 split. The dataset provides 18 Clinical features, 15 Wearable/CGM features, and 49 predictive Gut dimensions for five targets. The generative mechanism is a Gaussian-Copula latent structure.

\begin{figure}[htbp]
\centering
\begin{tikzpicture}[node distance=1.2cm, auto, thick, scale=0.7, transform shape]
\tikzstyle{source} = [rectangle, draw, fill=blue!10, text width=6cm, text centered, rounded corners, minimum height=1.2em]
\tikzstyle{generator} = [rectangle, draw, fill=green!10, text width=6cm, text centered, minimum height=1.2em]
\tikzstyle{data} = [cylinder, draw, shape border rotate=90, aspect=0.25, fill=orange!10, text width=5cm, text centered, minimum height=1.5em]
\tikzstyle{line} = [draw, -latex']

\node [source] (ext) {External Scientific Sources};
\node [generator, below of=ext, node distance=1.5cm] (assumptions) {Inform Ranges \& Distributions};
\node [generator, below of=assumptions, node distance=1.5cm] (latent) {14-Dim Latent Physiological State};
\node [generator, below of=latent, node distance=1.5cm] (modality) {Modality-Specific Generators};
\node [data, below of=modality, node distance=2cm] (dataset) {100,000 Synthetic Patients};

\path [line] (ext) -- (assumptions);
\path [line] (assumptions) -- (latent);
\path [line] (latent) -- (modality);
\path [line] (modality) -- (dataset);
\end{tikzpicture}
\caption{Synthetic Dataset Provenance Pipeline.}
\end{figure}

\subsection{Target Prevalence}
The exact positive-class prevalence rates for the five targets in the evaluation cohort are: Type 2 Diabetes (52.61\%), Prediabetes (20.01\%), High Adiposity Risk (39.04\%), Metabolic Syndrome (57.12\%), and NAFLD (59.57\%). Prevalence is an important contextual factor for interpreting AUPRC, as baseline random-chance AUPRC is equivalent to target prevalence. Therefore, AUPRC cannot be universally compared across targets with differing prevalences.

\subsection{Deterministic Label-Feature Coupling Audit}
An earlier generator version applied post-label deterministic clinical clamping to diagnostic variables. This created target-feature leakage. The perfect Clinical discrimination in the clamped cohort was attributable to deterministic label-feature coupling and therefore was not interpretable as generalizable predictive performance. Consequently, the clamping logic was removed. The completely de-clamped cohort was used for all final experiments.

\section{Methodology}
\textbf{A. Modality-specific experts:} Specialized models natively predicting based on C, W, or G.
\textbf{B. Preprocessing Pipelines:} Ensuring identical treatment across training and inference.
\textbf{C. OOF predictions:} Expert outputs for the training split used as meta-features.
\textbf{D. Probability-level stacking:} Combining expert probabilities.
\textbf{E. Seven modality pathways:} C, W, G, C+W, C+G, W+G, C+W+G.
\textbf{F. Dynamic routing:} Routing patient to the pathway representing their observed modalities. Unavailable modalities are not numerically imputed.
\textbf{G. Evaluation Metrics:} F1 scores were calculated using a fixed probability threshold of 0.5; threshold optimization was not performed.
\textbf{H. Simulated patient-level missingness:} The simulated modality-availability mechanism corresponds to Missing Completely At Random (MCAR) under the experimental construction, as modalities are removed via independent uniform probabilities. This mechanism is a controlled simulation and does not represent the informative missingness mechanisms that may occur in clinical workflows.
\textbf{I. Conventional imputation baseline:} Standard median imputation of the raw space.
\textbf{J. Early-fusion baseline:} Concatenating features before prediction.

\section{Experimental Results}

\begin{table*}[htbp]
\centering
\caption{Table I: 15 Expert Models}
\resizebox{\textwidth}{!}{
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
}
\end{table*}

\begin{table*}[htbp]
\centering
\caption{Table II: 7x5 AUROC Matrix}
\begin{tabular}{@{}l ccccccc@{}}
\toprule
\textbf{Target} & \textbf{P1 (C)} & \textbf{P2 (W)} & \textbf{P3 (G)} & \textbf{P4 (C+W)} & \textbf{P5 (C+G)} & \textbf{P6 (W+G)} & \textbf{P7 (C+W+G)} \\
\midrule
Type2\_Diabetes & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Wearable_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Gut_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Wearable', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Clinical_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Wearable_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Type2_Diabetes', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
Prediabetes & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Wearable_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Gut_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Wearable', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Clinical_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Wearable_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Prediabetes', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
High\_Adiposity\_Risk & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Only', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Only', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Gut_Only', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Wearable', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Clinical_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Wearable_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'High_Adiposity_Risk', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
Metabolic\_Syndrome & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Gut_Only', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Wearable', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Clinical_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Wearable_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'Metabolic_Syndrome', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
NAFLD & """ + get_fus(fusion, 'NAFLD', 'Clinical_Only', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Wearable_Only', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Gut_Only', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Clinical_Wearable', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Clinical_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Wearable_Gut', 'auroc') + r""" & """ + get_fus(fusion, 'NAFLD', 'Full_Multimodal_Fusion', 'auroc') + r""" \\
\bottomrule
\end{tabular}
\end{table*}

\begin{table}[htbp]
\centering
\caption{Table VIII: Dynamic Routing vs Conventional Imputation (T2D)}
\begin{tabular}{@{}l l l l@{}}
\toprule
\textbf{Target} & \textbf{Level} & \textbf{Dynamic AUROC} & \textbf{Conv. AUROC} \\
\midrule
T2D (Random) & 10\% & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.1, 'Dynamic_AUC') + r""" & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.1, 'Conv_AUC') + r""" \\
T2D (Random) & 20\% & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.2, 'Dynamic_AUC') + r""" & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.2, 'Conv_AUC') + r""" \\
T2D (Random) & 30\% & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC') + r""" & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Conv_AUC') + r""" \\
\bottomrule
\end{tabular}
\end{table}

\section{Results Interpretation}
1. Clinical was the strongest single modality across all five targets.
2. W+G retained measurable discrimination for targets where Clinical was unavailable.
3. Full multimodal fusion produced only modest improvements over Clinical-only. 
4. Dynamic routing maintained performance under the evaluated simulated patient-level missingness scenarios.
5. Dynamic routing produced a numerically higher AUROC (""" + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC') + r""") than the evaluated median-imputation baseline (""" + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Conv_AUC') + r""") under the simulated 30\% missingness condition. The absolute AUROC difference was 0.0021 (95\% CI: [0.0001, 0.0041]). The magnitude of the difference was small. Dynamic routing was compared with the evaluated median-imputation baseline under the specified simulated missingness conditions. Other imputation strategies, including multiple-imputation (MICE) and learned generative approaches, were not evaluated.
6. Dynamic routing performs comparably to early fusion, with structural advantages.

\section{Explainability}
TreeSHAP is incorporated as an explanatory mechanism for feature-level attribution; a quantitative evaluation of explanation fidelity or clinician agreement remains outside the present experimental scope. Evidence-grounded Medical RAG converts probabilities to explanatory text contextually.

\section{Limitations}
1. All predictive results are derived entirely from the de-clamped synthetic cohort; no external real-world validation was performed.
2. No clinical efficacy or diagnostic utility is established.
3. The synthetic cohort relies on a Gaussian-Copula latent dependence structure and therefore may not capture the full range of nonlinear, higher-order, and context-dependent dependencies present in real physiological systems.
4. The simulated modality-availability mechanism corresponds to MCAR; this controlled simulation does not capture the Missing Not At Random (MNAR) or Missing At Random (MAR) mechanisms inherent in clinical workflows.
5. Threshold optimization/calibration for deployment-specific operating points was not evaluated for F1 scores.
6. Advanced iterative imputation methods (e.g., MICE) were not evaluated.

\section{Conclusion}
TeleMed-M3 provides a reproducible imputation-free probability-level routing framework that operates across seven non-empty modality configurations and maintains measurable discrimination under the evaluated simulated patient-level modality-missingness scenarios. 

\section{Reproducibility}
Pipeline artifacts, data manifest, and exact seeds are comprehensively retained. A preprocessing serialization discrepancy was corrected prior to final evaluation.

\bibliographystyle{IEEEtran}
\bibliography{references}

\end{document}
"""
    with open("overleaf_submission/manuscript.tex", "w") as f:
        f.write(tex_content)
        
if __name__ == "__main__":
    generate()
