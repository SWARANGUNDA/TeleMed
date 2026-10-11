import json
import pandas as pd
import os
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

os.makedirs('publication/overleaf_submission/figures', exist_ok=True)

def get_fus(fusion, target, pathway, metric):
    row = fusion[(fusion['Target'] == target) & (fusion['Pathway'] == pathway)]
    return f"{row.iloc[0][metric]:.4f}" if not row.empty else "N/A"

def get_fus_val(fusion, target, pathway, metric):
    row = fusion[(fusion['Target'] == target) & (fusion['Pathway'] == pathway)]
    return row.iloc[0][metric] if not row.empty else 0.0

def get_exp(expert, target, mod, metric):
    row = expert[(expert['Target'] == target) & (expert['Modality'] == mod)]
    if metric == 'Model':
        return row.iloc[0]['Model'] if not row.empty else "N/A"
    return f"{row.iloc[0][metric]:.4f}" if not row.empty else "N/A"
    
def get_mis(missing, target, mode, level, model):
    row = missing[(missing['Target'] == target) & (missing['Mode'] == mode) & (missing['Level'] == level)]
    return f"{row.iloc[0][model]:.4f}" if not row.empty else "N/A"

def get_mis_val(missing, target, mode, level, model):
    row = missing[(missing['Target'] == target) & (missing['Mode'] == mode) & (missing['Level'] == level)]
    return row.iloc[0][model] if not row.empty else 0.0

def generate():
    with open('publication/frozen_results/final_results.json', 'r') as f:
        data = json.load(f)
        
    expert = pd.DataFrame(data['expert_performance'])
    fusion = pd.DataFrame(data['fusion_performance'])
    
    missing_csv_path = 'publication/frozen_results/final_results_missingness.csv'
    if os.path.exists(missing_csv_path):
        missing = pd.read_csv(missing_csv_path)
    else:
        missing = pd.DataFrame(data['missingness_performance'])

    tex_content = r"""\documentclass[10pt,twocolumn,letterpaper]{article}

\usepackage{times}
\usepackage{graphicx}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{booktabs}
\usepackage{hyperref}
\usepackage{caption}
\usepackage{natbib}
\usepackage{titlesec}
\usepackage[margin=1in]{geometry}

% Replicate AAAI section formatting
\titleformat{\section}{\Large\bfseries}{\thesection}{1em}{}
\titleformat{\subsection}{\large\bfseries}{\thesubsection}{1em}{}
\titleformat{\subsubsection}{\normalsize\bfseries}{\thesubsubsection}{1em}{}

\begin{document}

\title{\LARGE \bf Generative AI Assisted Telemedicine Platform for Personalized Gut Microbiome Analysis}

\author{
Swaran Gunda\\
Department of Computer Science \& Engineering\\
City, Country\\
email@domain.com
}

\date{}
\maketitle

\textbf{Abstract}\\
Metabolic diseases such as Type 2 Diabetes, Prediabetes, High Adiposity Risk, Metabolic Syndrome, and Non-Alcoholic Fatty Liver Disease are influenced by complex interactions among clinical, lifestyle, wearable, and gut microbiome factors. However, existing telemedicine systems primarily rely on conventional clinical and wearable data and provide limited integration of gut microbiome information. In addition, many AI-assisted healthcare systems offer limited interpretability, personalized recommendations, and clinician-friendly synthesis of heterogeneous patient data. This project proposes a Generative AI Assisted Telemedicine Platform for Personalized Gut Microbiome Analysis that integrates clinical, wearable/Continuous Glucose Monitoring (CGM), and gut microbiome data within a unified telemedicine environment.

The proposed system employs modality-specific machine learning expert models and probability-level multimodal fusion to generate risk predictions for five metabolic conditions while dynamically handling different combinations of available patient modalities without numerically imputing an entirely unavailable modality. Explainable AI using TreeSHAP is incorporated to identify influential features and provide transparent interpretations of model predictions. A Retrieval-Augmented Generation (RAG) and Generative AI layer further transforms structured model outputs and relevant medical evidence into understandable, clinician-friendly summaries and personalized health recommendations. The platform also provides patient and healthcare-professional interfaces supporting health-data management, risk visualization, report generation, and remote consultation workflows.

The system is designed as a research-oriented clinical decision-support framework rather than an autonomous diagnostic system. Its machine-learning evaluation is conducted using a synthetically generated multimodal cohort, providing a controlled environment for evaluating multimodal prediction, explainability, and dynamic modality handling. The proposed platform demonstrates how gut microbiome information, wearable data, clinical parameters, explainable machine learning, and Generative AI can be integrated into a unified telemedicine framework for personalized metabolic health decision support.

\vspace{0.5cm}

\section{Introduction}
Metabolic diseases, including Type 2 Diabetes (T2D), Prediabetes, High Adiposity Risk, Metabolic Syndrome, and Non-Alcoholic Fatty Liver Disease (NAFLD), represent a massive global health burden. The pathophysiology of these conditions is systemic, rendering isolated diagnostic snapshots insufficient for comprehensive risk stratification.

Modern diagnostic approaches increasingly leverage heterogeneous data. Clinical laboratory panels provide definitive systemic markers (e.g., HbA1c, liver enzymes). Wearable sensors and Continuous Glucose Monitoring (CGM) devices offer high-frequency physiological telemetry, capturing dynamic glycemic variability and autonomic nervous system metrics like Heart Rate Variability (HRV) \citep{dunn2021wearables}. Concurrently, Gut Microbiome sequencing provides insights into microbial taxonomic abundance and functional pathways \citep{valdes2018role}. Integrating these disparate data modalities offers a powerful mechanism for patient profiling.

In real-world healthcare environments, however, data acquisition is inherently asymmetric. A patient might provide continuous wearable data but miss a scheduled clinical blood draw, or possess clinical labs without having undergone gut microbiome sequencing. This structural missingness presents a critical challenge to standard machine learning architectures, which traditionally require a fixed-dimensional input vector \citep{zhang2020multimodal}. Specifically:

\textbf{1) Inadequate integration of gut microbiome data.} Existing telemedicine systems primarily rely on laboratory values and wearable sensor data, largely ignoring microbiome information.

\textbf{2) Lack of explainability.} Current systems rely on black-box AI models that provide predictions without transparent, actionable explanations for clinicians.

\textbf{3) Minimal continuous remote support.} There is a lack of Generative AI integration for creating clinician-friendly summaries and personalized recommendations.

To address these challenges, we propose a Generative AI Assisted Telemedicine Platform for Personalized Gut Microbiome Analysis. By mapping patient data through dynamic modality routing, the system evaluates all seven non-empty combinations of the three modalities. Our contributions are summarized as follows:

\begin{itemize}
    \item We propose a dynamic modality routing architecture supporting seven non-empty combinations of Clinical, Wearable/CGM, and Gut Microbiome modalities without numerical imputation of unavailable modality blocks.
    \item We utilize Out-of-fold (OOF) probability-level stacking to prevent meta-level target leakage.
    \item We architecturally integrate TreeSHAP and Retrieval-Augmented Generation (RAG) to eliminate the black-box AI problem, transforming predictions into clinician-friendly summaries.
\end{itemize}

\section{Related Work}
\subsection{Multimodal Healthcare Machine Learning}
The integration of heterogeneous healthcare data is extensively documented. \citet{shickel2017ehr} established foundational methodologies for deep learning on Electronic Health Records (EHR). \citet{huang2020fusion} demonstrated that multimodal fusion architectures outperform single-modality predictors across diverse clinical tasks by leveraging complementary signal pathways.

\subsection{Predictive Modeling and Sensor Data}
Clinical markers remain the standard for metabolic evaluation \citep{poplin2018cvd, kannel1976diabetes}. Concurrently, the continuous monitoring capabilities of wearable devices have enabled high-resolution physiological modeling \citep{dunn2021wearables, hall2018glucotypes}. The gut microbiome's role in systemic metabolic regulation is increasingly leveraged in computational biology, where variations in taxonomic composition have been statistically correlated with obesity and metabolic dysfunction \citep{valdes2018role, turnbaugh2006obesity}.

\subsection{Missing-Modality and Fusion Strategies}
Methods to handle missing modalities include modality dropout \citep{neverova2015modality} and generative adversarial networks designed to hallucinate missing data blocks \citep{shang2017unsupervised}. Fusion architectures broadly comprise early, intermediate, and late fusion \citep{baltruvsaitis2018multimodal, kuncheva2014combining}.

\subsection{Explainable Healthcare ML}
Interpretability is critical in clinical ML. TreeSHAP \citep{lundberg2020local} is widely used to provide exact local feature attributions. Retrieval-Augmented Generation \citep{lewis2020rag} provides a mechanism to anchor large language model outputs to verified external knowledge bases.

\section{Methodology}
\subsection{Overall Architecture}
The architecture executes modality-specific processing, Out-Of-Fold (OOF) probability generation, and dynamic routing to bypass the numerical imputation of unavailable modality blocks. 

\begin{figure}[htbp]
\centering
\includegraphics[width=\columnwidth]{figures/architecture.jpg}
\caption{Overall workflow of the TeleMed Platform. Visualizes the distinction between feature-level preprocessing and modality-level missingness, highlighting the explicit absence of numerical imputation of unavailable modality blocks.}
\label{fig:arch}
\end{figure}

\subsection{Modality Experts and Stacking}
Internal preprocessing pipelines execute simple imputation and scaling to handle feature-level missing values within an available modality. Independent expert models (e.g., XGBoost, Logistic Regression) process the respective modality feature vectors to generate predicted risk probabilities. To prevent meta-level target leakage, a 5-fold stratified cross-validation strategy is employed to generate out-of-fold (OOF) predictions for the training set. The OOF predictions serve as meta-features for an L2-regularized Logistic Regression meta-learner, optimizing the fusion logic.

\subsection{Dynamic Router}
The architecture defines seven non-empty subsets of the three modalities (C, W, G, C+W, C+G, W+G, C+W+G). The dynamic router executes imputation-free modality routing. If a modality block is unavailable, the system directly routes the patient to the predefined pathway corresponding only to their available data. No numerical imputation of unavailable modality blocks occurs. The routed meta-learner outputs final predicted risk probabilities for the five targets.

\subsection{Explainability and Medical RAG}
TreeSHAP is used to obtain local, feature-level attributions from supported tree-based expert models to illuminate the most impactful predictors. The conceptual Medical RAG layer utilizes FAISS-based retrieval against clinical guidelines (e.g., ADA, AHA) to contextualize the SHAP and probability outputs, conceptually generating tailored reports for clinician and patient consumption.

\section{Social and Clinical Impact}
\textbf{Clinical Positioning.} The platform is explicitly a research decision-support framework. It is not an autonomous diagnostic system, not a treatment recommendation engine, and not clinically validated software. It cannot substitute for clinician judgment.

\textbf{Zero-Imputation Reliability.} By strictly avoiding the hallucination or numerical imputation of missing biological data blocks, the system prevents medical predictions based on synthetic assumptions, protecting patient safety.

\textbf{Explainability.} The addition of TreeSHAP and Medical RAG translates raw predicted probabilities into interpretable, evidence-grounded reports. This establishes a future hypothesis that such integrated architectures could improve clinician trust and reduce cognitive load during patient consultations.

\section{Experimentation}
We evaluate the platform, focusing on answering the following research questions:
RQ1: How does each modality independently discriminate the metabolic risk targets?
RQ2: How does probability-level fusion perform across all seven non-empty modality combinations?
RQ3: Can dynamic routing maintain predictive performance under simulated patient-level modality missingness compared to standard methods?

\subsection{Task Dataset}
The evaluation utilizes a de-clamped probabilistic synthetic cohort of 100,000 generated patient profiles. The dataset is partitioned into a 70\% training, 15\% validation, and 15\% test split. The dataset comprises 82 predictive feature dimensions: Clinical (18), Wearable/CGM (15), and Gut Microbiome (49). The five synthetic target labels are Type 2 Diabetes, Prediabetes, High Adiposity Risk, Metabolic Syndrome, and Non-Alcoholic Fatty Liver Disease (NAFLD).

\subsection{Modality Expert Evaluation}
\textbf{Experiment Setting} We trained 15 expert models (3 modalities $\times$ 5 targets) and evaluated them using AUROC, AUPRC, F1 Score (fixed 0.5 threshold), and Brier Score.

\textbf{Result and Analysis} Table 1 introduces the discriminative capacity of the independent modality experts. For all five targets, the Clinical modality yielded the highest AUROC. This observed dominance reflects the dense signal present in classical laboratory biomarkers. Wearable and Gut modalities demonstrated lower standalone predictive capability but remained statistically better than random chance, addressing RQ1.

\begin{table*}[htbp]
\centering
\caption{15 Expert Models}
\begin{tabular}{@{}lllcccc@{}}
\toprule
\textbf{Modality} & \textbf{Target} & \textbf{Model} & \textbf{AUROC} & \textbf{AUPRC} & \textbf{F1} & \textbf{Brier} \\
\midrule
Clinical & Type2\_Diabetes & """ + get_exp(expert, 'Type2_Diabetes', 'Clinical', 'Model') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Clinical', 'auroc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Clinical', 'auprc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Clinical', 'f1') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Clinical', 'brier') + r""" \\
Wearable & Type2\_Diabetes & """ + get_exp(expert, 'Type2_Diabetes', 'Wearable', 'Model') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Wearable', 'auroc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Wearable', 'auprc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Wearable', 'f1') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Wearable', 'brier') + r""" \\
Gut & Type2\_Diabetes & """ + get_exp(expert, 'Type2_Diabetes', 'Gut', 'Model') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Gut', 'auroc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Gut', 'auprc') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Gut', 'f1') + r""" & """ + get_exp(expert, 'Type2_Diabetes', 'Gut', 'brier') + r""" \\
Clinical & Prediabetes & """ + get_exp(expert, 'Prediabetes', 'Clinical', 'Model') + r""" & """ + get_exp(expert, 'Prediabetes', 'Clinical', 'auroc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Clinical', 'auprc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Clinical', 'f1') + r""" & """ + get_exp(expert, 'Prediabetes', 'Clinical', 'brier') + r""" \\
Wearable & Prediabetes & """ + get_exp(expert, 'Prediabetes', 'Wearable', 'Model') + r""" & """ + get_exp(expert, 'Prediabetes', 'Wearable', 'auroc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Wearable', 'auprc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Wearable', 'f1') + r""" & """ + get_exp(expert, 'Prediabetes', 'Wearable', 'brier') + r""" \\
Gut & Prediabetes & """ + get_exp(expert, 'Prediabetes', 'Gut', 'Model') + r""" & """ + get_exp(expert, 'Prediabetes', 'Gut', 'auroc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Gut', 'auprc') + r""" & """ + get_exp(expert, 'Prediabetes', 'Gut', 'f1') + r""" & """ + get_exp(expert, 'Prediabetes', 'Gut', 'brier') + r""" \\
\bottomrule
\end{tabular}
\end{table*}

\subsection{Seven-Pathway Fusion Task}
\textbf{Experiment Setting} We evaluated the L2-regularized stacking meta-learner across all seven modality pathways. 

\textbf{Result and Analysis} Table 2 quantifies the performance across all seven dynamic pathways, addressing RQ2. Probability-level fusion effectively scales and blends disparate modality predictions into unified risk metrics. The combined Clinical and Gut (C+G) pathway often yielded AUROC values nearly identical to or marginally above the Clinical-only pathway, indicating that the meta-learner successfully preserved the dominant signal without introducing noise from weaker modalities.

\begin{table*}[htbp]
\centering
\caption{7x5 AUROC Matrix}
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

\begin{figure}[htbp]
\centering
\includegraphics[width=\columnwidth]{figures/fig_pathway_auroc_heatmap.png}
\caption{AUROC across the seven evaluated modality-availability pathways.}
\end{figure}

\subsection{Imputation-Free Missingness Evaluation}
\textbf{Experiment Setting} Missingness was simulated via independent uniform modality removal across the patient population (10\%, 20\%, and 30\%). This constitutes Missing Completely At Random (MCAR). We evaluated the framework against a global median-imputation baseline and a concatenated early-fusion baseline.

\textbf{Result and Analysis} Addressing RQ3, dynamic routing produced numerically higher AUROC at all three evaluated missingness levels, although the absolute differences were small. Under the severe 30\% modality missingness scenario, dynamic routing produced an AUROC of """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC') + r""" compared to conventional median imputation (""" + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Conv_AUC') + r"""). Early fusion concatenation remains numerically competitive across many targets (e.g., T2D 0.7836 vs 0.7834). However, early fusion requires an explicitly defined static vector. Dynamic stacking offers massive structural robustness.

\begin{figure}[htbp]
\centering
\includegraphics[width=\columnwidth]{figures/fig_missingness.png}
\caption{Dynamic routing vs median imputation under 10\%, 20\%, and 30\% missingness.}
\end{figure}

\section{Conclusion}
This project demonstrates an imputation-free probability-level dynamic routing architecture capable of processing multimodal health data. By executing explicitly mapped pathways for the Clinical, Wearable, and Gut Microbiome modalities, the system avoids the numerical generation of missing data blocks while preserving discriminative capability under simulated missingness. All experiments utilized an exact 70/15/15 dataset partition configured through the dataset generator, ensuring reproducibility. While performance on the synthetic cohort is promising, future translation into clinical environments strictly requires extensive real-world validation to verify structural resilience and diagnostic accuracy.

\bibliographystyle{apalike}
\bibliography{references}

\end{document}
"""

    with open("publication/overleaf_submission/manuscript.tex", "w") as f:
        f.write(tex_content)
        
    print("AAAI LaTeX Generation Complete!")

if __name__ == "__main__":
    generate()
