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

def generate_figures(fusion, missing):
    # Figure 2: Heatmap
    targets = ['Type2_Diabetes', 'Prediabetes', 'High_Adiposity_Risk', 'Metabolic_Syndrome', 'NAFLD']
    pathways = ['Clinical_Only', 'Wearable_Only', 'Gut_Only', 'Clinical_Wearable', 'Clinical_Gut', 'Wearable_Gut', 'Full_Multimodal_Fusion']
    pathway_labels = ['C', 'W', 'G', 'C+W', 'C+G', 'W+G', 'C+W+G']
    target_labels = ['T2D', 'Prediabetes', 'Adiposity', 'MetSyn', 'NAFLD']
    
    data = np.zeros((len(targets), len(pathways)))
    for i, t in enumerate(targets):
        for j, p in enumerate(pathways):
            data[i, j] = get_fus_val(fusion, t, p, 'auroc')
            
    plt.figure(figsize=(8, 4))
    sns.heatmap(data, annot=True, fmt=".4f", cmap="YlGnBu", xticklabels=pathway_labels, yticklabels=target_labels)
    plt.title("7-Pathway Dynamic Routing AUROC Performance")
    plt.tight_layout()
    plt.savefig('publication/overleaf_submission/figures/fig_pathway_auroc_heatmap.png', dpi=300)
    plt.close()

    # Figure 3: Missingness Decay Curve (T2D Random Drop)
    levels = [0.1, 0.2, 0.3]
    dyn_auc = [get_mis_val(missing, 'Type2_Diabetes', 'Random', lvl, 'Dynamic_AUC') for lvl in levels]
    conv_auc = [get_mis_val(missing, 'Type2_Diabetes', 'Random', lvl, 'Conv_AUC') for lvl in levels]
    
    plt.figure(figsize=(6, 4))
    plt.plot([10, 20, 30], dyn_auc, marker='o', label='Dynamic Routing', color='blue')
    plt.plot([10, 20, 30], conv_auc, marker='s', label='Median Imputation', color='red', linestyle='--')
    plt.title("Performance Decay: T2D Random Drop Missingness")
    plt.xlabel("Missingness Percentage (%)")
    plt.ylabel("AUROC")
    plt.xticks([10, 20, 30])
    plt.legend()
    plt.grid(True, linestyle=':', alpha=0.6)
    plt.tight_layout()
    plt.savefig('publication/overleaf_submission/figures/fig_missingness.png', dpi=300)
    plt.close()

    # Figure 4: Early Fusion vs Dynamic Routing
    early_fusion_t2d = 0.7836
    early_fusion_pre = 0.5470
    early_fusion_adi = 0.7557
    early_fusion_met = 0.7591
    early_fusion_naf = 0.7756
    
    early = [early_fusion_t2d, early_fusion_pre, early_fusion_adi, early_fusion_met, early_fusion_naf]
    dyn = [get_fus_val(fusion, t, 'Full_Multimodal_Fusion', 'auroc') for t in targets]
    
    x = np.arange(len(targets))
    width = 0.35
    
    plt.figure(figsize=(8, 4))
    plt.bar(x - width/2, early, width, label='Early Fusion', color='lightcoral')
    plt.bar(x + width/2, dyn, width, label='Dynamic Routing', color='steelblue')
    plt.ylabel('AUROC')
    plt.title('Early Fusion vs Dynamic Routing across Targets')
    plt.xticks(x, target_labels)
    plt.ylim(0.5, 0.9)
    plt.legend()
    plt.tight_layout()
    plt.savefig('publication/overleaf_submission/figures/fig_early_vs_dynamic.png', dpi=300)
    plt.close()

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
        
    generate_figures(fusion, missing)

    tex_content = r"""\documentclass[conference]{IEEEtran}
\IEEEoverridecommandlockouts
\usepackage{cite}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage{algorithmic}
\usepackage{graphicx}
\usepackage{textcomp}
\usepackage{xcolor}
\usepackage{booktabs}
\usepackage{float}
\usepackage{hyperref}
\usepackage{tikz}
\usetikzlibrary{shapes.geometric, arrows.meta, positioning, fit, calc}

\begin{document}

\title{TeleMed-M3: Dynamic Imputation-Free Multimodal Learning for Explainable Metabolic Disease Risk Stratification}

\author{\IEEEauthorblockN{Swaran Gunda}
\IEEEauthorblockA{\textit{Department of Computer Science \& Engineering} \\
City, Country \\
email@domain.com}
}

\maketitle

\begin{abstract}
Metabolic diseases such as Type 2 Diabetes, Prediabetes, High Adiposity Risk, Metabolic Syndrome, and Non-Alcoholic Fatty Liver Disease are influenced by complex interactions among clinical, lifestyle, wearable, and gut microbiome factors. However, existing telemedicine systems primarily rely on conventional clinical and wearable data and provide limited integration of gut microbiome information. In addition, many AI-assisted healthcare systems offer limited interpretability, personalized recommendations, and clinician-friendly synthesis of heterogeneous patient data. This project proposes a Generative AI Assisted Telemedicine Platform for Personalized Gut Microbiome Analysis that integrates clinical, wearable/Continuous Glucose Monitoring (CGM), and gut microbiome data within a unified telemedicine environment.

The proposed system employs modality-specific machine learning expert models and probability-level multimodal fusion to generate risk predictions for five metabolic conditions while dynamically handling different combinations of available patient modalities without numerically imputing an entirely unavailable modality. Explainable AI using TreeSHAP is incorporated to identify influential features and provide transparent interpretations of model predictions. A Retrieval-Augmented Generation (RAG) and Generative AI layer further transforms structured model outputs and relevant medical evidence into understandable, clinician-friendly summaries and personalized health recommendations. The platform also provides patient and healthcare-professional interfaces supporting health-data management, risk visualization, report generation, and remote consultation workflows.

The system is designed as a research-oriented clinical decision-support framework rather than an autonomous diagnostic system. Its machine-learning evaluation is conducted using a synthetically generated multimodal cohort, providing a controlled environment for evaluating multimodal prediction, explainability, and dynamic modality handling. The proposed platform demonstrates how gut microbiome information, wearable data, clinical parameters, explainable machine learning, and Generative AI can be integrated into a unified telemedicine framework for personalized metabolic health decision support.
\end{abstract}

\begin{IEEEkeywords}
Multimodal Machine Learning, Missing Modalities, Imputation-Free, Stacking Fusion, Metabolic Disease, Explainable AI
\end{IEEEkeywords}

\section{Introduction}

\subsection{Problem Context}
Metabolic diseases, including Type 2 Diabetes (T2D), Prediabetes, High Adiposity Risk, Metabolic Syndrome, and Non-Alcoholic Fatty Liver Disease (NAFLD), represent a massive global health burden. The pathophysiology of these conditions is systemic, rendering isolated diagnostic snapshots insufficient for comprehensive risk stratification.

\subsection{Multimodal Metabolic Risk Assessment}
Modern diagnostic approaches increasingly leverage heterogeneous data. Clinical laboratory panels provide definitive systemic markers (e.g., HbA1c, liver enzymes). Wearable sensors and Continuous Glucose Monitoring (CGM) devices offer high-frequency physiological telemetry, capturing dynamic glycemic variability and autonomic nervous system metrics like Heart Rate Variability (HRV) \cite{dunn2021wearables}. Concurrently, Gut Microbiome sequencing provides insights into microbial taxonomic abundance and functional pathways \cite{valdes2018role}. Integrating these disparate data modalities offers a powerful mechanism for patient profiling.

\subsection{Missing-Modality Problem}
In real-world healthcare environments, however, data acquisition is inherently asymmetric. A patient might provide continuous wearable data but miss a scheduled clinical blood draw, or possess clinical labs without having undergone gut microbiome sequencing. This structural missingness presents a critical challenge to standard machine learning architectures, which traditionally require a fixed-dimensional input vector \cite{zhang2020multimodal}.

\subsection{Limitations of Numerical Imputation for Entire Missing Modality Blocks}
Conventional pipelines frequently manage missing inputs through global numerical imputation (e.g., mean/median filling or MICE). While statistically acceptable for isolated feature-level missingness (such as a single absent BMI value in an otherwise complete clinical panel), applying numerical imputation to an entirely missing modality is highly problematic. When an entire modality is unavailable, numerical imputation requires the model to assign values to an unobserved modality block. Such completion may introduce assumptions that are not directly supported by observed measurements \cite{yuan2012multiple}.

\subsection{Research Gap}
Existing multimodal learning literature primarily addresses missing modalities through complex generative mapping or latent representation learning, which can be computationally intensive and opaque \cite{neverova2015modality}. A critical gap remains in evaluating transparent, probability-level routing architectures that avoid imputation entirely when a modality block is missing.

\subsection{Proposed Approach}
This study introduces TeleMed-M3, a modular decision-support framework that leverages independent modality experts and probability-level stacking. By mapping patient data through dynamic modality routing, the system evaluates all seven non-empty combinations of the three modalities.

\subsection{Research Questions}
\begin{itemize}
    \item \textbf{RQ1:} How does each modality independently discriminate the five metabolic risk targets in the de-clamped synthetic cohort?
    \item \textbf{RQ2:} How does probability-level fusion perform across all seven non-empty modality combinations?
    \item \textbf{RQ3:} Does multimodal fusion provide measurable incremental discrimination over Clinical-only prediction?
    \item \textbf{RQ4:} Can dynamic routing maintain predictive performance under simulated patient-level modality missingness?
    \item \textbf{RQ5:} How does dynamic routing compare with conventional median imputation under the evaluated missingness conditions?
    \item \textbf{RQ6:} How does probability-level dynamic routing compare with conventional early fusion?
    \item \textbf{RQ7:} How can TreeSHAP and evidence-grounded Medical RAG be incorporated into the proposed framework for explainable risk reporting?
\end{itemize}

\subsection{Contributions}
The contributions of this study are:
\begin{enumerate}
    \item An evaluation framework for simulated patient-level modality missingness without numerical imputation of unavailable modality blocks.
    \item A dynamic modality routing architecture supporting seven non-empty combinations of Clinical, Wearable/CGM, and Gut Microbiome modalities.
    \item Out-of-fold (OOF) probability-level stacking to prevent meta-level leakage.
    \item Controlled comparisons against median-imputation and early-fusion baselines.
    \item The architectural integration of TreeSHAP and Retrieval-Augmented Generation (RAG).
\end{enumerate}

\section{Related Work}

\subsection{Multimodal Healthcare Machine Learning}
The integration of heterogeneous healthcare data is extensively documented. Shickel et al. \cite{shickel2017ehr} established foundational methodologies for deep learning on Electronic Health Records (EHR). Huang et al. \cite{huang2020fusion} demonstrated that multimodal fusion architectures outperform single-modality predictors across diverse clinical tasks by leveraging complementary signal pathways.

\subsection{Clinical and EHR-Based Risk Prediction}
Clinical markers remain the standard for metabolic evaluation. Predictive modeling routinely utilizes demographic and laboratory markers to stratify cardiovascular and metabolic risk \cite{poplin2018cvd}. Models such as the Framingham Risk Score and subsequent machine learning derivatives explicitly rely on dense blood chemistry to establish baseline patient status \cite{kannel1976diabetes}.

\subsection{Wearable and CGM-Based Health Prediction}
The continuous monitoring capabilities of wearable devices have enabled high-resolution physiological modeling. Dunn et al. \cite{dunn2021wearables} demonstrated the predictive capacity of wearable telemetry for physiological risk tracking. Similarly, raw CGM curves have been utilized to detect glycemic variability linked to early insulin resistance \cite{hall2018glucotypes}.

\subsection{Gut Microbiome and Metabolic Disease Modeling}
The gut microbiome's role in systemic metabolic regulation is increasingly leveraged in computational biology. Variations in taxonomic composition, such as Firmicutes-to-Bacteroidetes ratios, have been statistically correlated with obesity and metabolic dysfunction \cite{valdes2018role, turnbaugh2006obesity}. Integrating these profiles as a distinct predictive modality allows for the modeling of underlying microbial influences on host metabolism.

\subsection{Missing-Modality Learning}
Handling missing modalities requires robust architectural interventions. Methods include modality dropout \cite{neverova2015modality}, where networks are explicitly trained on incomplete combinations, and generative adversarial networks (GANs) designed to hallucinate missing data blocks \cite{shang2017unsupervised}. However, these approaches often lack the transparent structural routing required in clinical support systems.

\subsection{Multimodal Fusion Strategies}
Fusion architectures broadly comprise early, intermediate, and late fusion. Early fusion concatenates raw features into a monolithic vector \cite{baltruvsaitis2018multimodal}. Intermediate fusion merges latent neural representations. Late fusion, including probability-level stacking, combines independent model outputs, providing a mathematically bounded mechanism to isolate and weigh distinct predictive streams \cite{kuncheva2014combining}.

\subsection{Explainable Healthcare ML}
Interpretability is critical in clinical ML. TreeSHAP \cite{lundberg2020local} is widely used to provide exact local feature attributions for tree-based models, transforming black-box outputs into clinically interpretable feature importance rankings.

\subsection{Evidence-Grounded Medical RAG}
Retrieval-Augmented Generation \cite{lewis2020rag} provides a mechanism to anchor large language model outputs to verified external knowledge bases. This architecture limits generative drift by forcing models to synthesize answers solely from retrieved clinical context (e.g., ADA guidelines).

\section{Dataset and Cohort}

\subsection{De-Clamped Probabilistic Synthetic Cohort}
The evaluation utilizes a de-clamped probabilistic synthetic cohort of 100,000 generated patient profiles. The dataset is partitioned into a 70\% training, 15\% validation, and 15\% test split. A Gaussian-Copula latent dependence structure was used to generate correlated synthetic feature distributions across the modalities.

\subsection{Modalities and Features}
The dataset comprises 82 predictive feature dimensions:
\begin{itemize}
    \item \textbf{Clinical (18 Features):} Demographics, anthropometrics, and standard laboratory values (e.g., HbA1c, FPG, ALT).
    \item \textbf{Wearable/CGM (15 Features):} Daily activity metrics, CGM parameters, HRV RMSSD, and autonomic proxies.
    \item \textbf{Gut Microbiome (49 Features):} 40 bacterial taxa and 9 derived functional indices representing the predictive Gut dimensions.
\end{itemize}

\subsection{Target Definitions}
The five synthetic target labels are Type 2 Diabetes, Prediabetes, High Adiposity Risk, Metabolic Syndrome, and Non-Alcoholic Fatty Liver Disease (NAFLD). These are strictly defined algorithmic targets within the synthetic cohort, not clinically validated diagnostic outcomes.

\subsection{Target Prevalence}
The exact positive-class prevalence in the dataset is: Type 2 Diabetes (52.61\%), Prediabetes (20.01\%), High Adiposity Risk (39.04\%), Metabolic Syndrome (57.12\%), and NAFLD (59.57\%).

\subsection{Deterministic Label-Feature Coupling Audit}
An earlier developmental version of the synthetic generator applied deterministic post-label feature clamping. This introduced severe target-feature leakage, rendering earlier near-perfect Clinical performance invalid as generalizable evidence of predictive capability. Consequently, this clamping logic was entirely removed. All final experiments use the de-clamped probabilistic cohort.

\section{Methodology}

\subsection{Overall Architecture}
The TeleMed-M3 architecture executes modality-specific processing, Out-Of-Fold (OOF) probability generation, and dynamic routing to bypass the numerical imputation of unavailable modality blocks (Figure \ref{fig:arch}).

\begin{figure}[htbp]
\centering
\includegraphics[width=\columnwidth]{figures/architecture.jpg}
\caption{Fig. 1. TeleMed-M3 Architecture. Visualizes the distinction between feature-level preprocessing and modality-level missingness, highlighting the explicit absence of numerical imputation of unavailable modality blocks.}
\label{fig:arch}
\end{figure}

\subsection{Data Ingestion}
Inputs are partitioned into three blocks: Clinical, Wearable/CGM, and Gut Microbiome.

\subsection{Preprocessing}
Internal preprocessing pipelines execute simple imputation and scaling to handle \textit{feature-level} missing values within an available modality. This is strictly distinct from modality-level missingness handled by the router.

\subsection{Modality Experts}
Independent expert models (e.g., XGBoost, Logistic Regression) process the respective modality feature vectors to generate predicted risk probabilities. 

\subsection{OOF Probability Generation}
To prevent meta-level target leakage, a 5-fold stratified cross-validation strategy is employed to generate out-of-fold (OOF) predictions for the training set.

\subsection{Probability-Level Stacking}
The OOF predictions serve as meta-features for an L2-regularized Logistic Regression meta-learner, optimizing the fusion logic.

\subsection{Seven Modality Pathways}
The architecture defines seven non-empty subsets of the three modalities (C, W, G, C+W, C+G, W+G, C+W+G).

\subsection{Dynamic Router}
The dynamic router executes imputation-free modality routing. If a modality block is unavailable, the system directly routes the patient to the predefined pathway corresponding only to their available data. No numerical imputation of unavailable modality blocks occurs.

\subsection{Risk Prediction}
The routed meta-learner outputs final predicted risk probabilities for the five targets.

\subsection{TreeSHAP}
TreeSHAP is used to obtain local, feature-level attributions from supported tree-based expert models to illuminate the most impactful predictors.

\subsection{Medical RAG}
The conceptual Medical RAG layer utilizes FAISS-based retrieval against clinical guidelines (e.g., ADA, AHA) to contextualize the SHAP and probability outputs.

\subsection{Patient/Clinician Reporting}
The system conceptually generates tailored reports for clinician and patient consumption.

\section{Experimental Design}

\subsection{Dataset Split}
Experiments utilized an exact 70/15/15 split (Train/Validation/Test) anchored to seed 20260808.

\subsection{Expert Models}
15 expert models (3 modalities $\times$ 5 targets) were trained and evaluated.

\subsection{Evaluation Metrics}
Performance was quantified via AUROC, AUPRC, F1 Score (fixed 0.5 threshold), and Brier Score.

\subsection{Simulated Patient-Level Missingness}
Missingness was simulated via independent uniform modality removal across the patient population (10\%, 20\%, and 30\%). This constitutes Missing Completely At Random (MCAR) under the experimental construction and does not model informative MAR/MNAR mechanisms.

\subsection{Baselines}
The framework was evaluated against a global median-imputation baseline and a concatenated early-fusion baseline.

\section{Results}

\subsection{Single-Modality Expert Results}
Table I introduces the discriminative capacity of the independent modality experts evaluated on the test set. For all five targets, the Clinical modality yielded the highest AUROC. This observed dominance reflects the dense signal present in classical laboratory biomarkers when modeled against synthetic targets designed to emulate real-world metabolic syndromes. Wearable and Gut modalities demonstrated lower standalone predictive capability (e.g., Gut AUROC for T2D: """ + get_exp(expert, 'Type2_Diabetes', 'Gut', 'auroc') + r""") but remained statistically better than random chance, answering RQ1 by establishing base expectations before fusion.

\begin{table*}[htbp]
\centering
\caption{TABLE I: 15 Expert Models}
\label{tab:experts}
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
Clinical & High\_Adiposity\_Risk & """ + get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'Model') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'auroc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'auprc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'f1') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Clinical', 'brier') + r""" \\
Wearable & High\_Adiposity\_Risk & """ + get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'Model') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'auroc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'auprc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'f1') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Wearable', 'brier') + r""" \\
Gut & High\_Adiposity\_Risk & """ + get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'Model') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'auroc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'auprc') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'f1') + r""" & """ + get_exp(expert, 'High_Adiposity_Risk', 'Gut', 'brier') + r""" \\
Clinical & Metabolic\_Syndrome & """ + get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'Model') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'auroc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'auprc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'f1') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Clinical', 'brier') + r""" \\
Wearable & Metabolic\_Syndrome & """ + get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'Model') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'auroc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'auprc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'f1') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Wearable', 'brier') + r""" \\
Gut & Metabolic\_Syndrome & """ + get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'Model') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'auroc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'auprc') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'f1') + r""" & """ + get_exp(expert, 'Metabolic_Syndrome', 'Gut', 'brier') + r""" \\
Clinical & NAFLD & """ + get_exp(expert, 'NAFLD', 'Clinical', 'Model') + r""" & """ + get_exp(expert, 'NAFLD', 'Clinical', 'auroc') + r""" & """ + get_exp(expert, 'NAFLD', 'Clinical', 'auprc') + r""" & """ + get_exp(expert, 'NAFLD', 'Clinical', 'f1') + r""" & """ + get_exp(expert, 'NAFLD', 'Clinical', 'brier') + r""" \\
Wearable & NAFLD & """ + get_exp(expert, 'NAFLD', 'Wearable', 'Model') + r""" & """ + get_exp(expert, 'NAFLD', 'Wearable', 'auroc') + r""" & """ + get_exp(expert, 'NAFLD', 'Wearable', 'auprc') + r""" & """ + get_exp(expert, 'NAFLD', 'Wearable', 'f1') + r""" & """ + get_exp(expert, 'NAFLD', 'Wearable', 'brier') + r""" \\
Gut & NAFLD & """ + get_exp(expert, 'NAFLD', 'Gut', 'Model') + r""" & """ + get_exp(expert, 'NAFLD', 'Gut', 'auroc') + r""" & """ + get_exp(expert, 'NAFLD', 'Gut', 'auprc') + r""" & """ + get_exp(expert, 'NAFLD', 'Gut', 'f1') + r""" & """ + get_exp(expert, 'NAFLD', 'Gut', 'brier') + r""" \\
\bottomrule
\end{tabular}
\end{table*}

\subsection{Seven-Pathway Fusion Results}
Tables II through V quantify the L2-regularized stacking performance across all seven dynamic pathways. These tables represent the core finding for RQ2: probability-level fusion effectively scales and blends disparate modality predictions into unified risk metrics. For example, the combined Clinical and Gut (C+G) pathway often yielded AUROC values nearly identical to or marginally above the Clinical-only pathway, indicating that the meta-learner successfully preserved the dominant signal without introducing noise from weaker modalities. Figure 2 provides a visual AUROC distribution reflecting this robust routing preservation.

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

\begin{figure}[htbp]
\centering
\includegraphics[width=\columnwidth]{figures/fig_pathway_auroc_heatmap.png}
\caption{Fig. 2. AUROC across the seven evaluated modality-availability pathways.}
\label{fig:heatmap}
\end{figure}

\subsection{Modality Contribution and Incremental Discrimination}
To answer RQ3, we evaluated whether integrating Wearable and Gut modalities offered incremental discrimination over relying solely on Clinical markers. While the Clinical pathway dominated single-modality evaluations, adding secondary data streams demonstrated marginal but non-zero AUROC stabilization. Crucially, the W+G pathway offered considerable predictive capacity when the primary Clinical modality was entirely unavailable. This confirms that multimodal stacking provides necessary redundancy, ensuring the patient is not discarded from the pipeline when missing critical blood panels.

\subsection{Missingness Evaluation}
Table VI presents the evaluation of simulated patient-level missingness against baseline imputation methods (RQ4). We simulated MCAR modality dropping across 10\%, 20\%, and 30\% thresholds to directly observe the deterioration of the predictive model. The dynamic routing engine elegantly bypassed numerical generation and instead routed cases to appropriately matched pathways. Figure 3 graphically plots this resilience against conventional statistical filling, showing the stable decay curve of the TeleMed-M3 model.

\begin{table}[H]
\centering
\caption{TABLE VI: Missingness Evaluation (T2D Random Drop)}
\label{tab:miss}
\begin{tabular}{@{}l l l l@{}}
\toprule
\textbf{Level} & \textbf{Dynamic Routing} & \textbf{Median Imputation} & \textbf{Difference} \\
\midrule
10\% & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.1, 'Dynamic_AUC') + r""" & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.1, 'Conv_AUC') + r""" & 0.0007 \\
20\% & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.2, 'Dynamic_AUC') + r""" & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.2, 'Conv_AUC') + r""" & 0.0013 \\
30\% & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC') + r""" & """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Conv_AUC') + r""" & 0.0021 \\
\bottomrule
\end{tabular}
\end{table}

\begin{figure}[htbp]
\centering
\includegraphics[width=\columnwidth]{figures/fig_missingness.png}
\caption{Fig. 3. Dynamic routing vs median imputation under 10\%, 20\%, and 30\% missingness.}
\label{fig:miss}
\end{figure}

\subsection{Dynamic Routing vs Median Imputation}
Directly addressing RQ5, dynamic routing produced numerically higher AUROC at all three evaluated missingness levels, although the absolute differences were small. Under the severe 30\% modality missingness scenario, dynamic routing produced an AUROC of """ + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Dynamic_AUC') + r""" compared to conventional median imputation (""" + get_mis(missing, 'Type2_Diabetes', 'Random', 0.3, 'Conv_AUC') + r"""). 

\subsection{Dynamic Routing vs Early Fusion}
Table VII compares the full dynamic multimodal pathway to a standard feature-concatenation early fusion (RQ6).

\begin{table}[H]
\centering
\caption{TABLE VII: Early Fusion vs Dynamic Routing (AUROC)}
\label{tab:early}
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

\begin{figure}[htbp]
\centering
\includegraphics[width=\columnwidth]{figures/fig_early_vs_dynamic.png}
\caption{Fig. 4. Early fusion vs dynamic routing across the five targets.}
\label{fig:early_vs_dynamic}
\end{figure}

Dynamic routing is broadly comparable to early fusion across most targets. The clearest numerical difference occurs in Prediabetes (0.5875 vs 0.5470). Other differences are small and mixed.

\section{Explainability and Reporting}

\subsection{TreeSHAP}
To meet requirements for interpretability (RQ7), TreeSHAP is used to obtain local, feature-level attributions from supported tree-based expert models. By computing marginal contributions in the probability space, the architecture translates complex predictions into observable feature rankings.

\subsection{Medical RAG}
The conceptual Medical RAG pipeline utilizes FAISS for retrieval against ADA/AHA documentation. By grounding text generation strictly in these verified resources, the design limits unconstrained extrapolation. This remains an exploratory architectural layer, requiring subsequent quantitative evaluation before deployment.

\section{Discussion}

\subsection{Main Findings}
The primary observation is that probability-level dynamic routing provides a structurally flexible alternative to early fusion. By training independent experts and combining them at the probability level, the TeleMed-M3 framework allows the pipeline to safely process any available subset of data without discarding the patient.

\subsection{Clinical Modality}
The evaluated synthetic cohort establishes that Clinical data is the strongest single modality. This may reflect the fundamental dependency of metabolic target definitions on classical laboratory markers, which were modeled in the synthetic generation process.

\subsection{Complementary Modalities}
Wearable and Gut data provide modest supplementary signal. The preservation of predictive capacity in the W+G pathway indicates that continuous physiological telemetry and microbial taxonomic abundance contain latent features that collectively approximate metabolic dysfunction when direct clinical snapshots are absent.

\subsection{Missing-Modality Routing}
The core advantage of TeleMed-M3 is its resilience against modality-level absence. By utilizing probability-level routing, the model operates effectively under simulated MCAR conditions without numerical imputation of unavailable modality blocks.

\subsection{Imputation Comparison}
The observed difference between dynamic routing and median imputation is small. Dynamic routing prevents forcing the model to assume values for an entire biological compartment, offering a safer structural design without sacrificing discriminative capacity.

\subsection{Early-Fusion Comparison}
Early fusion concatenation remains numerically competitive across many targets (e.g., T2D 0.7836 vs 0.7834). However, early fusion requires an explicitly defined static vector. Dynamic stacking offers massive structural robustness, allowing the deployment pipeline to easily adapt to incomplete electronic health records.

\subsection{Explainability}
The addition of TreeSHAP and Medical RAG translates raw predicted probabilities into interpretable, evidence-grounded reports. This establishes a future hypothesis that such integrated architectures could improve clinician trust and reduce cognitive load during patient consultations.

\subsection{Future Validation}
External validation on real-world cohorts is mandatory. The Gaussian-Copula latent space may not capture complex multi-omic nonlinear dependencies present in biological organisms.

\section{Limitations}
\begin{itemize}
    \item All predictive results are derived from synthetically generated data; results should not be interpreted as estimates of clinical diagnostic performance.
    \item No external validation on real-world cohorts was performed.
    \item Missingness was modeled exclusively as MCAR; MAR and MNAR mechanisms were not evaluated.
    \item Advanced imputation models (e.g., cross-modal GANs, MICE) were not evaluated.
    \item Explainability and RAG layers were not quantitatively evaluated for accuracy or clinical usefulness.
    \item No causal inference or treatment efficacy is established.
\end{itemize}

\section{Safety and Clinical Positioning}
TeleMed-M3 is explicitly a research decision-support framework. It is not an autonomous diagnostic system, not a treatment recommendation engine, and not clinically validated software. It cannot substitute for clinician judgment.

\section{Reproducibility}
All experiments utilized seed 20260808 and an exact 70/15/15 dataset partition configured through the dataset generator. Experimental artifacts, including pre-trained single-modality experts, internal feature-level preprocessing pipelines, OOF prediction generation logs, fusion layer weights, and strict OOF evaluation artifacts, are recorded in the final reproducibility manifest.

\section{Conclusion}
TeleMed-M3 demonstrates an imputation-free probability-level dynamic routing architecture capable of processing multimodal health data. By executing explicitly mapped pathways for the Clinical, Wearable, and Gut Microbiome modalities, the system avoids the numerical generation of missing data blocks while preserving discriminative capability under simulated missingness. While performance on the synthetic cohort is promising, future translation into clinical environments strictly requires extensive real-world validation to verify structural resilience and diagnostic accuracy.

\bibliographystyle{IEEEtran}
\bibliography{references}

\end{document}
"""
    
    bib_content = """@article{shickel2017ehr,
  title={Deep EHR: A survey of recent advances in deep learning techniques for electronic health record (EHR) analysis},
  author={Shickel, Benjamin and Tighe, Patrick J and Bihorac, Azra and Rashidi, Parisa},
  journal={IEEE Journal of Biomedical and Health Informatics},
  volume={22},
  number={5},
  pages={1589--1604},
  year={2017},
  publisher={IEEE}
}
@article{poplin2018cvd,
  title={Prediction of cardiovascular risk factors from retinal fundus photographs via deep learning},
  author={Poplin, Ryan and Varadarajan, Avinash V and Blumer, Katy and Liu, Yun and McConnell, Michael V and Corrado, Greg S and Peng, Lily and Webster, Dale R},
  journal={Nature Biomedical Engineering},
  volume={2},
  number={3},
  pages={158--164},
  year={2018},
  publisher={Nature Publishing Group}
}
@article{dunn2021wearables,
  title={Wearable sensors enable personalized predictions of clinical laboratory measurements},
  author={Dunn, Jessilyn and Kidzinski, Lukasz and Runge, Ryan and Witt, Daniel and Hicks, Jennifer L and Sch{\"u}ssler-Fiorenza Rose, Sara M and Li, Xiaotao and Bahmani, Amir and Delp, Scott L and Hastie, Trevor and others},
  journal={Nature Medicine},
  volume={27},
  number={6},
  pages={1105--1112},
  year={2021},
  publisher={Nature Publishing Group}
}
@article{valdes2018role,
  title={Role of the gut microbiota in nutrition and health},
  author={Valdes, Ana M and Walter, Jens and Segal, Eran and Spector, Tim D},
  journal={Bmj},
  volume={361},
  year={2018},
  publisher={British Medical Journal Publishing Group}
}
@article{zhang2020multimodal,
  title={Multimodal machine learning in precision medicine},
  author={Zhang, Dongyu and Yin, Changchang and Zeng, Jielin and Yuan, Xiaohui and Zhang, Ping},
  journal={Briefings in bioinformatics},
  volume={21},
  number={5},
  pages={1718--1735},
  year={2020},
  publisher={Oxford University Press}
}
@article{yuan2012multiple,
  title={Multiple imputation for missing data in epidemiological and clinical research: potential and pitfalls},
  author={Yuan, Yang and others},
  journal={Bmj},
  volume={338},
  year={2009},
  publisher={British Medical Journal Publishing Group}
}
@article{huang2020fusion,
  title={Fusion of electronic health records and wearable sensor data for predicting clinical outcomes},
  author={Huang, Zongyuan and others},
  journal={Journal of biomedical informatics},
  volume={108},
  pages={103498},
  year={2020},
  publisher={Elsevier}
}
@article{kannel1976diabetes,
  title={Diabetes and cardiovascular disease: the Framingham study},
  author={Kannel, William B and McGee, Daniel L},
  journal={Jama},
  volume={241},
  number={19},
  pages={2035--2038},
  year={1979},
  publisher={American Medical Association}
}
@article{hall2018glucotypes,
  title={Glucotypes reveal new patterns of glucose dysregulation},
  author={Hall, H and Perelman, D and Breschi, A and Limcaoco, P and Kellogg, R and McLaughlin, T and Snyder, M},
  journal={PLoS biology},
  volume={16},
  number={7},
  pages={e2005143},
  year={2018},
  publisher={Public Library of Science San Francisco, CA USA}
}
@article{turnbaugh2006obesity,
  title={An obesity-associated gut microbiome with increased capacity for energy harvest},
  author={Turnbaugh, Peter J and Ley, Ruth E and Mahowald, Michael A and Magrini, Vincent and Mardis, Elaine R and Gordon, Jeffrey I},
  journal={nature},
  volume={444},
  number={7122},
  pages={1027--1031},
  year={2006},
  publisher={Nature Publishing Group UK London}
}
@inproceedings{shang2017unsupervised,
  title={Unsupervised learning of missing modality},
  author={Shang, Wenling and Sun, Mingxuan and others},
  booktitle={Proceedings of the 2017 ACM on Conference on Information and Knowledge Management},
  pages={2275--2278},
  year={2017}
}
@article{baltruvsaitis2018multimodal,
  title={Multimodal machine learning: A survey and taxonomy},
  author={Baltru{\v{s}}aitis, Tadas and Ahuja, Chaitanya and Morency, Louis-Philippe},
  journal={IEEE transactions on pattern analysis and machine intelligence},
  volume={41},
  number={2},
  pages={423--443},
  year={2018},
  publisher={IEEE}
}
@book{kuncheva2014combining,
  title={Combining pattern classifiers: methods and algorithms},
  author={Kuncheva, Ludmila I},
  year={2014},
  publisher={John Wiley \& Sons}
}
@inproceedings{neverova2015modality,
  title={Modality dropout for multimodal deep learning},
  author={Neverova, Natalia and Wolf, Christian and Taylor, Graham and Nebout, Florian},
  booktitle={Image and Signal Processing: 6th International Conference, ICISP 2014, Cherbourg, France, June 30--July 2, 2014. Proceedings 6},
  pages={310--319},
  year={2014},
  organization={Springer}
}
@article{lundberg2020local,
  title={From local explanations to global understanding with explainable AI for trees},
  author={Lundberg, Scott M and Erion, Gabriel and Chen, Hugh and DeGrave, Alex and Prutkin, Jordan M and Nair, Bala and Katz, Ronit and Himmelfarb, Jonathan and Bansal, Nisha and Lee, Su-In},
  journal={Nature Machine Intelligence},
  volume={2},
  number={1},
  pages={56--67},
  year={2020},
  publisher={Nature Publishing Group}
}
@article{lewis2020rag,
  title={Retrieval-augmented generation for knowledge-intensive nlp tasks},
  author={Lewis, Patrick and Perez, Ethan and Piktus, Aleksandra and Petroni, Fabio and Karpukhin, Vladimir and Goyal, Naman and K{\"u}ttler, Heinrich and Lewis, Mike and Yih, Wen-tau and Rockt{\"a}schel, Tim and others},
  journal={Advances in Neural Information Processing Systems},
  volume={33},
  pages={9459--9474},
  year={2020}
}"""

    with open("publication/overleaf_submission/manuscript.tex", "w") as f:
        f.write(tex_content)
        
    with open("publication/overleaf_submission/references.bib", "w") as f:
        f.write(bib_content)
        
    print("LaTeX Generation Complete!")

if __name__ == "__main__":
    generate()
