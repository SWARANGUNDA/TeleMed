TeleMed-M3: Dynamic Imputation-Free Multimodal Learning for Explainable Metabolic Disease Risk Stratification

GUNDA SWARAN
CSE
Keshav Memorial Institute of Technology
Hyderabad, India
swarangunda23@gmail.com

KOLIPAKA VISHAL
CSE
Keshav Memorial Institute of Technology
Hyderabad, India
kolipakavishal06@gmail.com

PAGIDIPALLI SUNNY KIRAN
CSE (Core)
Keshav Memorial Institute of Technology (KMIT)
Hyderabad, India
sunnykmithyd@gmail.com

CHIKYALA MEDHANSH RAO
CSE
Keshav Memorial Institute of Technology
Hyderabad, India
medhanshrao.07@gmail.com

AITHA THADHAGATH RAM
CSE
Keshav Memorial Institute of Technology
Hyderabad, India
thadhagath.ram.aitha1108@gmail.com

Abstract
Metabolic diseases such as Type 2 Diabetes (T2D), Prediabetes, High Adiposity Risk, Metabolic Syndrome, and Non-Alcoholic Fatty Liver Disease (NAFLD) are influenced by multiple interacting clinical and behavioral factors. Conventional telemedicine and health-analysis systems commonly rely on clinical and wearable information while providing limited integration of gut microbiome data and limited mechanisms for interpreting heterogeneous patient information. This work presents TeleMed-M3, a dynamic multimodal learning framework developed within a Generative AI assisted telemedicine platform for personalized gut microbiome analysis. The framework integrates three complementary modalities: clinical data, wearable/Continuous Glucose Monitoring (CGM) data, and gut microbiome profiles.
TeleMed-M3 employs modality-specific machine learning expert models followed by probability-level stacking across seven non-empty modality-availability pathways: Clinical, Wearable, Gut, Clinical+Wearable, Clinical+Gut, Wearable+Gut, and Clinical+Wearable+Gut. The dynamic routing mechanism handles unavailable modality blocks without numerically imputing the missing modality. Out-of-Fold probability generation is used during fusion training, while TreeSHAP provides feature-level explanations for applicable tree-based models. A Medical Retrieval-Augmented Generation component is incorporated to support evidence-grounded, clinician-friendly reporting from structured model outputs and relevant medical evidence.
The framework is evaluated using a 100,000-patient synthetically generated multimodal cohort containing 82 predictive features across the three modalities and five metabolic risk targets. Experiments evaluate individual modality performance, multimodal fusion, simulated patient-level modality missingness, median-imputation comparison, and early-fusion comparison. The results show that Clinical is the strongest single modality across the evaluated targets, while multimodal pathways provide modest incremental discrimination in several settings. Under the evaluated simulated missingness conditions, dynamic routing maintains predictive performance without numerically filling an entirely unavailable modality. The system is intended as a research-oriented clinical decision-support framework, and the reported results do not constitute clinical validation or autonomous diagnosis.

Keywords: Multimodal Machine Learning, Gut Microbiome, Telemedicine, Dynamic Modality Routing, Explainable AI, TreeSHAP, Retrieval-Augmented Generation, Metabolic Disease Risk Stratification

1. INTRODUCTION
1.1 Background
Metabolic diseases, including Type 2 Diabetes (T2D), Prediabetes, High Adiposity Risk, Metabolic Syndrome, and Non-Alcoholic Fatty Liver Disease (NAFLD), are influenced by multiple interacting physiological and behavioral factors. Risk assessment can therefore involve heterogeneous information sources rather than a single type of measurement. Clinical information provides laboratory and physiological measurements, wearable and Continuous Glucose Monitoring (CGM) systems provide longitudinal physiological observations, and gut microbiome profiling provides information about microbial composition and derived microbiome characteristics that have been investigated in relation to metabolic health.
These data sources differ substantially in their structure, dimensionality, sampling characteristics, and availability across patients. Integrating them within a unified computational framework can provide a broader representation of patient information for metabolic risk assessment. However, multimodal integration also introduces practical challenges, particularly when one or more modalities are unavailable for a patient.
The proposed work addresses this challenge through a multimodal learning framework that separates modality-specific prediction from cross-modal fusion. Clinical, wearable/CGM, and gut microbiome information are processed through dedicated expert models, after which their predicted risk probabilities are combined according to the modalities available for an individual patient. This design enables the system to evaluate multiple modality-availability configurations while avoiding numerical imputation of an entirely unavailable modality.

1.2 Problem Statement
Existing telemedicine systems commonly make use of clinical records and wearable information, while integration of gut microbiome data into the same patient-level analysis remains less common. This creates several challenges for multimodal personalized health analysis.
First, clinical, wearable, and microbiome information are often maintained as separate data sources, making synchronized multimodal analysis difficult. Second, machine-learning predictions may be difficult for healthcare professionals to interpret when the underlying models provide limited explanation of their outputs. Third, heterogeneous patient information can be difficult to summarize into a form that is understandable to both patients and healthcare professionals. Finally, patients may not have all required modalities available at the time of assessment.
From a machine-learning perspective, this last issue represents patient-level structural modality missingness. A patient may have clinical and wearable measurements but no gut microbiome profile, or may have microbiome information without current wearable data. Conventional fixed-input multimodal models may require numerical imputation or reconstruction of the unavailable modality. Such an approach can introduce unsupported information into the model input rather than explicitly representing the absence of the modality.
Therefore, there is a need for a multimodal telemedicine framework that can integrate clinical, wearable/CGM, and gut microbiome information, provide interpretable risk estimates, generate understandable reports, and dynamically operate using the modalities actually available for each patient.

1.3 Research Gap
Existing research provides methods for healthcare prediction using electronic health records, wearable data, gut microbiome information, multimodal fusion, missing-modality handling, and explainable artificial intelligence. However, these areas are often studied independently or through architectures that require a fixed multimodal input configuration.
Missing-modality approaches may use reconstruction, generative completion, or representation-learning strategies to compensate for unavailable information. An alternative approach is to explicitly route patients according to the modalities that are available and combine modality-specific predictions at the probability level without numerically reconstructing an entirely missing modality.
The present work investigates this routing-based approach in a metabolic-risk setting involving clinical, wearable/CGM, and gut microbiome modalities. In addition, it combines predictive modeling with TreeSHAP-based explanation and an exploratory Medical RAG layer for evidence-grounded report generation within a telemedicine platform.

1.4 Research Questions
RQ1: How effectively do the individual Clinical, Wearable/CGM, and Gut Microbiome expert models discriminate the five metabolic risk targets?
RQ2: How does probability-level fusion perform across the seven non-empty modality-availability pathways?
RQ3: Does multimodal fusion provide measurable incremental discrimination relative to Clinical-only prediction?
RQ4: How does dynamic modality routing perform under simulated patient-level modality missingness?
RQ5: How does dynamic routing compare with conventional median imputation when an entire modality is unavailable?
RQ6: How does probability-level dynamic routing compare with conventional early feature fusion?
RQ7: How can TreeSHAP and evidence-grounded Medical RAG be incorporated into the framework to support interpretable and clinician-friendly risk reporting?

1.5 Contributions
Multimodal Telemedicine Framework: A unified framework integrating Clinical, Wearable/CGM, and Gut Microbiome information for metabolic risk assessment within a telemedicine environment.
Dynamic Imputation-Free Modality Routing: A seven-pathway routing mechanism that operates on the modalities available for an individual patient without numerically imputing an entirely unavailable modality block.
Probability-Level Multimodal Fusion: An Out-of-Fold probability-level stacking approach that combines modality-specific expert predictions while controlling meta-level training leakage within the evaluated fusion pipeline.
Explainable Risk Assessment: Integration of TreeSHAP-based feature attribution for interpretable predictions from applicable tree-based expert models.
Generative and Evidence-Grounded Reporting: Integration of an exploratory Medical Retrieval-Augmented Generation layer with Generative AI to transform structured model outputs and retrieved medical evidence into clinician-friendly health summaries.
Controlled Multimodal Evaluation: Systematic evaluation of seven modality-availability pathways, simulated patient-level modality missingness, median-imputation comparison, and early-fusion comparison using a controlled synthetic multimodal cohort.

2. RELATED WORK
2.1 AI in Healthcare and Electronic Health Records
Artificial intelligence and machine learning have been increasingly applied to Electronic Health Records (EHRs) for clinical prediction, risk stratification, patient phenotyping, and healthcare analytics. These approaches can learn patterns from structured clinical variables and laboratory measurements. However, EHR-based models often rely on information collected during clinical encounters and may provide limited representation of continuously changing physiological and behavioral characteristics.

2.2 Wearable and Continuous Glucose Monitoring Data
Wearable devices and Continuous Glucose Monitoring (CGM) systems provide longitudinal physiological information such as physical activity, heart rate, sleep, stress, and glucose-related patterns. Machine learning can use these observations to capture temporal characteristics that may not be represented in point-in-time clinical measurements. However, wearable and CGM data can vary in availability and measurement characteristics, motivating their integration with complementary clinical and biological modalities.

2.3 Gut Microbiome and Metabolic Disease
The gut microbiome has been investigated extensively in relation to metabolic health, including obesity, insulin resistance, and Type 2 Diabetes. Microbiome profiles can provide a complementary biological perspective for patient-level analysis. However, microbiome data are typically high-dimensional and are not routinely available for every patient in telemedicine environments. Integrating microbiome information with clinical and wearable data therefore presents both an opportunity and a data-integration challenge.

2.4 Multimodal Learning and Fusion
Multimodal machine learning combines heterogeneous information sources to obtain a more comprehensive representation of a patient. Fusion strategies can broadly be categorized as early feature-level fusion, intermediate representation-level fusion, and late decision- or probability-level fusion. While these approaches can exploit complementary information across modalities, conventional multimodal systems may assume that all modalities are available during inference. This creates challenges when an entire modality is unavailable for a patient.

2.5 Missing-Modality Learning
Missing-modality learning addresses situations where one or more complete data modalities are unavailable. Existing approaches include numerical imputation, modality reconstruction, modality dropout, and representation-learning strategies. Although these methods can allow fixed-input models to operate with incomplete data, reconstruction or imputation of an entirely unavailable modality introduces assumptions about information that was not directly observed. The proposed work instead uses explicit modality-availability routing across seven non-empty pathways and combines predictions from the modalities that are actually available, without numerically reconstructing an unavailable modality.

2.6 Explainable AI and Retrieval-Augmented Generation
Explainable AI methods can improve the interpretability of machine-learning predictions by identifying the contribution of input features to individual outputs. TreeSHAP provides a game-theoretic approach for explaining predictions from tree-based models and is incorporated in TeleMed-M3 for applicable expert models. These explanations are intended to support interpretation rather than provide causal conclusions.
Retrieval-Augmented Generation (RAG) combines information retrieval with language generation, allowing generated responses to be conditioned on information retrieved from an external knowledge source. In TeleMed-M3, a Medical RAG component is incorporated to support evidence-grounded summaries using structured model outputs and relevant medical evidence. The generated reports are intended for research-oriented decision support and educational communication rather than autonomous diagnosis or treatment.

3. DATASET AND COHORT
3.1 Synthetic Cohort Generation
Due to patient privacy regulations and the scarcity of real-world, open-access datasets containing synchronized clinical, wearable, and microbiome profiles for the same individuals, this research utilizes a large-scale, synthetically generated multimodal cohort. A probabilistic generative pipeline was developed using a Gaussian Copula-based latent variable model to synthesize 100,000 patient records. This methodology involved establishing a physiological correlation matrix to map underlying biological relationships (e.g., systemic inflammation, insulin resistance, autonomic stress, and gut dysbiosis) and applying stochastic binomial sampling to assign disease ground-truth labels. This provides a controlled environment to systematically evaluate multimodal fusion architectures and modality-level missingness.

3.2 De-Clamping and Leakage Control
To ensure the robustness of the machine-learning evaluation, the synthetic generation process employed a "de-clamped" architecture. This means the pipeline intentionally introduced probabilistic biological variance and noise into the data relationships, preventing the machine learning models from easily memorizing deterministic generation rules. Furthermore, rigorous data isolation protocols were enforced to prevent any meta-level target leakage across the modalities during synthesis.

3.3 Feature/Modality Composition
The multimodal dataset comprises 82 distinct predictive feature dimensions distributed across three targeted health modalities:
* Clinical Data (18 features): Standard anthropometric measurements (e.g., Age, BMI) and laboratory biomarkers (e.g., Fasting Glucose, HbA1c, LDL/HDL cholesterol, liver enzymes).
* Wearable/CGM Data (15 features): Continuous physiological telemetry, including metrics such as average heart rate, heart rate variability (HRV), daily step count, sleep duration, and continuous glucose variability indices.
* Gut Microbiome Data (49 features): Representing 40 distinct bacterial taxonomic relative abundances (e.g., Firmicutes, Bacteroidetes, Akkermansia muciniphila) and 9 derived functional/ecological indices (e.g., Shannon Diversity).

3.4 Target Variables
The cohort includes five multi-label binary target variables representing distinct yet biologically interconnected metabolic conditions. These conditions are evaluated independently as risk probabilities:
1. Type 2 Diabetes
2. Prediabetes
3. High Adiposity Risk
4. Metabolic Syndrome
5. Non-Alcoholic Fatty Liver Disease (NAFLD)

3.5 Target Prevalence
The synthetic dataset was engineered to reflect probabilistic clinical distributions based on underlying continuous disease liabilities. The exact prevalence rates across the 100,000-patient cohort are as follows: Type 2 Diabetes (52.6%), Prediabetes (20.0%), High Adiposity Risk (39.0%), Metabolic Syndrome (57.1%), and Non-Alcoholic Fatty Liver Disease (59.6%). Note that Prediabetes and Type 2 Diabetes were engineered to be mutually exclusive clinical states within the generative logic to mimic strict medical diagnostic boundaries.

3.6 Train/Validation/Test Split
To facilitate rigorous model training, hyperparameter tuning, and final evaluation, the dataset was deterministically partitioned using a 70/15/15 split:
* Training Set (70,000 patients): Utilized for training the independent modality experts and for generating the Out-of-Fold (OOF) predictions used to train the stacking meta-learner.
* Validation Set (15,000 patients): Utilized for hyperparameter optimization and early stopping mechanisms during training.
* Test Set (15,000 patients): A strictly sequestered hold-out set utilized exclusively for final performance reporting and missingness simulation.

4. METHODOLOGY
4.1 Overall Architecture
TeleMed-M3 uses a modular probability-level fusion architecture designed to operate when one or more complete data modalities are unavailable. Patient inputs are partitioned into Clinical, Wearable/CGM, and Gut Microbiome blocks and processed by independent modality-specific expert models. The experts generate target-specific risk probabilities, which are subsequently combined through probability-level stacking. A dynamic routing mechanism selects the appropriate fusion pathway according to the modalities available for the patient, avoiding numerical imputation of an entirely unavailable modality block.

4.2 Modality-Specific Expert Models
Three modality-specific expert groups are used for the five binary targets, resulting in 15 expert models. The final model for each modality-target combination was selected through model development and validation from candidate algorithms including Logistic Regression, XGBoost, LightGBM, CatBoost, and ExtraTrees. The selected models therefore vary according to the target and modality rather than using a single classifier for every expert.
Each expert operates on its corresponding feature block. Internal preprocessing pipelines handle feature-level missing values within an available modality, using the preprocessing appropriate to the estimator. This should be distinguished from modality-level missingness, where an entire Clinical, Wearable/CGM, or Gut block is unavailable and is handled by the routing mechanism rather than numerical imputation.

4.3 Out-of-Fold Prediction and Probability-Level Stacking
The fusion layer uses late probability-level stacking. For each target, modality-specific experts first generate predicted probabilities. To reduce meta-level target leakage, 5-fold stratified cross-validation is used on the training partition to generate Out-of-Fold (OOF) predictions. Each OOF prediction is produced by an expert that was not fitted on the corresponding observation, and the resulting probabilities form the training features for the fusion layer. 
An L2-regularized Logistic Regression meta-learner combines the available expert probabilities. The final reproducible implementation fits preprocessing within the appropriate training folds, avoiding the earlier scaler-leakage issue identified during the pipeline audit. The resulting fusion models operate on predicted probabilities rather than concatenating the 82 raw features.

4.4 Seven Modality-Availability Pathways and Dynamic Routing
For three modalities, there are exactly 7 non-empty modality combinations:
1. C — Clinical
2. W — Wearable/CGM
3. G — Gut Microbiome
4. C+W — Clinical + Wearable/CGM
5. C+G — Clinical + Gut Microbiome
6. W+G — Wearable/CGM + Gut Microbiome
7. C+W+G — Clinical + Wearable/CGM + Gut Microbiome
For a patient, the router identifies the available modality blocks and selects the corresponding predefined pathway. If a complete modality is unavailable, its probability is not generated through numerical or generative reconstruction; instead, the patient is routed using only the observed modalities. Thus, modality-level missingness is handled structurally while feature-level missingness within an available block remains part of the expert preprocessing pipeline. 

4.5 Explainability and Medical RAG
TreeSHAP is used to obtain local feature-level attributions from the supported tree-based expert models, providing information about which input variables contributed to individual predictions. These attributions are intended to improve model interpretability and are not treated as causal explanations or clinical diagnoses.
The reporting layer incorporates a conceptual Medical Retrieval-Augmented Generation (RAG) component. A FAISS-based retrieval mechanism is intended to retrieve relevant medical guidance, including sources such as ADA and AHA materials, which can then be considered alongside model probabilities and explanatory information when generating patient- or clinician-oriented summaries. The RAG component is positioned as an evidence-grounding and reporting layer; its retrieval configuration and quantitative generation quality were not independently evaluated in the current experimental protocol.

5. EXPERIMENTAL DESIGN
5.1 Evaluation Metrics
All final predictive evaluations were performed on the strictly held-out 15,000-patient test partition. Performance was assessed using four complementary metrics: Area Under the Receiver Operating Characteristic Curve (AUROC) for discrimination, Area Under the Precision-Recall Curve (AUPRC) for precision-recall performance under class imbalance, F1-score for the balance between precision and recall, and Brier Score for the accuracy of probabilistic predictions. F1-score was calculated using a fixed probability threshold of 0.5, with no test-set threshold optimization. 

5.2 Simulated Patient-Level Modality Missingness
To evaluate dynamic routing under incomplete multimodal availability, patient-level modality missingness was simulated at 10%, 20%, and 30%. The experiment independently and uniformly removed complete modality blocks from patients, corresponding to Missing Completely At Random (MCAR) under the experimental construction. The router then selected the pathway corresponding to the modalities remaining available for each patient.
This experiment represents a controlled synthetic missingness evaluation and does not model informative Missing At Random (MAR) or Missing Not At Random (MNAR) mechanisms that may occur in clinical settings.

5.3 Baselines
Two comparison strategies were evaluated.
Median-Imputation Baseline: For the evaluated T2D random-modality-drop experiment, an entirely unavailable modality block was populated using conventional global median values before prediction. This provides a direct comparison between numerical completion of the missing modality and dynamic routing using only the observed modalities. Advanced approaches such as MICE and learned generative imputation were not evaluated. 
Early-Fusion Baseline: An early-fusion model was constructed by concatenating the 82 predictive features from the Clinical, Wearable/CGM, and Gut Microbiome modalities into a single feature vector before prediction. This provides a comparison between conventional feature-level fusion and the proposed probability-level dynamic routing strategy.

6. RESULTS
6.1 Expert Model Performance
The evaluation of the individual modality experts (RQ1) demonstrated that the Clinical modality provided the highest discriminative capacity across all targets. For Type 2 Diabetes, the Clinical expert achieved an AUROC of 0.7777, outperforming the Wearable/CGM expert (0.6772) and the Gut Microbiome expert (0.5949). This performance hierarchy—where classical clinical biomarkers provided the strongest standalone predictive signal—was consistent across Prediabetes, High Adiposity Risk, Metabolic Syndrome, and NAFLD.

6.2 Seven-Pathway Fusion Performance (AUROC, AUPRC, F1, Brier)
Evaluating the late-fusion meta-learner across all seven modality-availability pathways (RQ2 and RQ3) revealed that full multimodal fusion provided modest incremental discrimination over the Clinical-only baseline.
* AUROC: The full C+W+G fusion pathway for Type 2 Diabetes achieved an AUROC of 0.7834, representing a marginal improvement over the 0.7777 achieved by the Clinical-only pathway. 
* AUPRC: Precision-recall performance followed a similar trend. For Prediabetes (the lowest prevalence target), the C+W+G pathway achieved an AUPRC of 0.2431 versus 0.2418 for Clinical-only.
* Safety Net Pathways: F1 scores and Brier scores demonstrated stable calibration across all fused pathways. Notably, when Clinical data was entirely unavailable, the Wearable+Gut (W+G) pathway maintained a functional predictive safety net, achieving an AUROC of 0.6894 for T2D.

6.3 Missingness Experiment
Under simulated patient-level missingness (RQ4 and RQ5), the dynamic routing architecture proved structurally resilient. For Type 2 Diabetes under the severe 30% random missingness condition (MCAR), dynamic routing achieved an AUROC of 0.7743. In direct comparison, attempting to populate the entirely missing modality blocks using conventional global median imputation resulted in a lower AUROC of 0.7722. This confirms that explicitly routing patients based on their observed data outperforms numerically filling unobserved biological blocks.

6.4 Early-Fusion Comparison
When compared to the early-feature fusion baseline (RQ6), the probability-level dynamic routing approach performed highly competitively. The early-fusion classifier operating on the fully concatenated 82-feature vector achieved an AUROC of 0.7836 for Type 2 Diabetes, essentially matching the late-fusion C+W+G pathway (0.7834). However, while early fusion requires a rigid, fully populated input vector to operate, the proposed late-fusion architecture seamlessly adapts to missing modality blocks without requiring any numerical imputation.

6.5 Explainability Examples
Addressing RQ7, TreeSHAP attributions successfully extracted the most influential features from the tree-based experts for individual predictions. Clinical markers like Fasting Glucose and HbA1c consistently ranked as top global drivers for T2D risk within the clinical expert, while specific microbial abundances (e.g., Bacteroidetes ratios) localized the risk within the gut expert. These raw SHAP attributions can be ingested by the Medical RAG component, demonstrating the framework's capability to synthesize structured machine learning output and external medical guidelines into human-readable, evidence-grounded reports.

7. DISCUSSION
7.1 Clinical Modality as the Primary Signal
The evaluation shows that the Clinical modality provides the strongest standalone discriminative signal across all five evaluated metabolic targets. This result is consistent with the composition of the synthetic cohort, which includes laboratory, anthropometric, and physiological variables that provide substantial predictive information for the evaluated targets. However, because the cohort is synthetic, this observation should be interpreted as a property of the evaluated data-generation and modeling framework rather than as evidence of clinical diagnostic superiority.

7.2 Contribution of Additional Modalities
Adding Wearable/CGM and Gut Microbiome information produced modest incremental changes over Clinical-only prediction in the evaluated seven-pathway experiments. The complete C+W+G pathway improved T2D AUROC from 0.7777 to 0.7834 and produced similarly small changes for several other targets. At the same time, the W+G pathway retained measurable discrimination when Clinical data was unavailable, with a T2D AUROC of 0.6894.
These findings suggest that the additional modalities can provide complementary predictive information, while also demonstrating that their contribution should not be interpreted as universally superior to Clinical-only prediction.

7.3 Behavior of Dynamic Routing Under Modality Missingness
The simulated missingness experiment provides evidence that dynamic routing can operate without numerically reconstructing an entirely unavailable modality. In the evaluated T2D random-modality-drop experiment, dynamic routing produced numerically higher AUROC than the median-imputation baseline at 10%, 20%, and 30% missingness, with differences of 0.0007, 0.0013, and 0.0021, respectively. The 30% comparison yielded an absolute difference of 0.0021 with a reported 95% confidence interval of [0.0001, 0.0041]. 
The small magnitude of these differences is important. The results support the feasibility of structural routing under the evaluated synthetic MCAR conditions, but they do not establish general superiority over imputation methods or robustness to real-world informative missingness.

7.4 Practical Implications for Telemedicine
From a system-design perspective, TeleMed-M3 demonstrates how modality-specific prediction, dynamic pathway selection, TreeSHAP explanations, and an evidence-grounded reporting layer can be combined within a telemedicine architecture. The principal practical advantage of the routing design is its ability to select a predefined pathway according to the modalities available for a patient rather than requiring every modality to be present.
The framework therefore provides a basis for research-oriented multimodal decision support in which available clinical, wearable/CGM, and microbiome information can be processed through a common fusion architecture. However, real-world clinical utility, workflow effectiveness, and patient benefit remain to be established through external validation and prospective evaluation.

8. LIMITATIONS
This study has several important limitations. First, all predictive results were obtained from a synthetically generated cohort, and no external validation using real-world patient data was performed. Therefore, the reported performance should not be interpreted as an estimate of clinical diagnostic performance.
Second, the synthetic cohort uses a Gaussian-Copula latent dependence structure, which may not capture the full range of nonlinear, higher-order, and context-dependent relationships present in real physiological and microbiome data.
Third, modality missingness was evaluated only under MCAR conditions constructed through independent uniform modality removal. MAR and MNAR mechanisms were not evaluated. Fourth, advanced imputation approaches such as MICE and learned generative or cross-modal imputation methods were not compared.
Fifth, F1 was evaluated using a fixed probability threshold of 0.5, and deployment-specific threshold optimization and comprehensive calibration analysis were outside the experimental scope. Finally, the Medical RAG component remains conceptual/exploratory; retrieval quality, hallucination rates, explanation fidelity, and clinician agreement were not quantitatively evaluated.

9. SAFETY AND CLINICAL POSITIONING
TeleMed-M3 is explicitly positioned as a research-oriented clinical decision-support framework, not an autonomous diagnostic or treatment system. The predicted risk probabilities and generated summaries are intended to assist healthcare professionals in interpreting heterogeneous multimodal information and should not replace professional medical judgment.
The system does not establish clinical efficacy, diagnostic utility, or treatment effectiveness. Any future clinical deployment would require validation on appropriate human cohorts, assessment of safety and calibration under real clinical conditions, evaluation of informative missingness, and continuous clinical oversight.

10. CONCLUSION
TeleMed-M3 presents a probability-level multimodal learning framework for metabolic risk stratification using Clinical, Wearable/CGM, and Gut Microbiome information. By separating modality-specific prediction from cross-modal fusion, the framework supports seven non-empty modality-availability pathways and can operate without numerically reconstructing an entirely unavailable modality.
Evaluation on the 100,000-patient synthetic cohort showed that Clinical information provided the strongest standalone predictive signal, while multimodal pathways produced modest incremental discrimination and retained measurable signal when subsets of modalities were unavailable. Under the evaluated synthetic MCAR conditions, dynamic routing produced numerically higher AUROC than the tested median-imputation baseline, although the absolute differences were small.
TreeSHAP provides local feature-level attribution for supported tree-based experts, while the Medical RAG component provides an exploratory mechanism for evidence-grounded reporting. Together, these components establish a research framework for interpretable multimodal telemedicine analysis, while clinical validation, external generalization, and real-world safety remain future requirements.

[UNNUMBERED] REPRODUCIBILITY AND DATA AVAILABILITY
The codebase, trained models, synthetic generation scripts, and reproducibility audits for the TeleMed-M3 project are available in the project repository. Due to the synthetic nature of the dataset, it is fully reproducible from the provided parameters, eliminating privacy concerns related to patient health information.

[UNNUMBERED] REFERENCES
[Insert standard bibliography generated via BibTeX or Zotero matching the citations provided in the text.]
