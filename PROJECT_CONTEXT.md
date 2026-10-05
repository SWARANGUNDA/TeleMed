# TeleMed AI - Project Context

This file serves as a persistent context guide for the AI assistant across long conversations or new chat sessions.

## 1. Project Overview
**TeleMed AI** is a Generative AI-Assisted Multimodal Telemedicine Platform focused on clinical decision-support for multi-disease chronic metabolic risk assessment (Type 2 Diabetes, Prediabetes, Obesity, Metabolic Syndrome, and NAFLD). 

## 2. Core Architecture & Tech Stack
- **Backend:** Python (FastAPI, Asynchronous)
- **Frontend:** React 18 + Vite
- **Machine Learning:** CatBoost, Unified TreeSHAP (Explainable AI)
- **Database:** SQLite (local development) / PostgreSQL + Redis (production)

## 3. Key Subsystems
1. **Intelligent Multimodal Data Intake Engine (IMDIE):** Extracts structured parameters from multi-format medical reports (PDF, OCR, CSV, etc.) using a 15-stage pipeline.
2. **7-Pathway Multimodal Fusion Engine:** Adaptive late-fusion meta-learner accommodating missing modalities across Clinical, Wearable, and Gut Microbiome data.
3. **Unified TreeSHAP XAI:** Provides granular feature-level SHAP attributions and effect directionality.
4. **Grounded Medical RAG Engine:** Zero-hallucination clinical synthesis grounded in authoritative practice guidelines (ADA, WHO, AASLD).
5. **Security-Hardened Telemedicine Web Platform:** Implements RBAC (Patient, Doctor, Admin), webRTC teleconsultations, and audit governance.

## 4. Crucial Directories
- `app/backend/`: FastAPI source code and backend logic.
- `app/frontend/`: React + Vite frontend application.
- `ai/`: Machine learning models, fusion inference, and TreeSHAP explainability scripts.
- `services/`: RAG engines and IMDIE multimodal intake services.
- `tests/`: Automated regression and security test suite.
- `research_audit/`: LaTeX manuscript and audit reports for the research paper.
- `docs/` & `reports/`: Comprehensive project documentation.

## 5. Current State
- **Tests:** 147/147 passing.
- **Frontend:** Builds perfectly with 0 errors.
- **Current Focus:** Research audit, LaTeX manuscript (`manuscript.tex`), and final evaluation reviews.

*(Note: This file is automatically maintained by the AI Assistant via custom rules.)*
