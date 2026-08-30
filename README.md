# TeleMed AI: Generative AI-Assisted Multimodal Telemedicine Platform

[![Tests](https://img.shields.io/badge/Tests-142%2F142%20Passing-success)](tests/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Asynchronous-009688)](app/backend/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB)](app/frontend/)
[![ROC-AUC](https://img.shields.io/badge/ML%20Performance-ROC--AUC%20%3E%200.996-blueviolet)](ai/models/)
[![XAI](https://img.shields.io/badge/Explainability-Unified%20TreeSHAP-orange)](ai/explainability/)
[![RAG](https://img.shields.io/badge/Clinical%20RAG-Zero--Hallucination%20Guardrails-green)](services/medical_rag/)

TeleMed is a clinical decision-support and telemedicine web platform designed for multi-disease chronic metabolic risk assessment (Type 2 Diabetes, Prediabetes, Obesity, Metabolic Syndrome, and NAFLD). It integrates **Intelligent Multimodal Data Intake (IMDIE)**, **Multi-Expert Machine Learning**, **7-Pathway Dynamic Late Fusion**, **Unified TreeSHAP Explainable AI**, and **Grounded Medical Retrieval-Augmented Generation (RAG)** into an intuitive, role-based teleconsultation experience.

---

## 📑 Table of Contents
- [System Architecture](#system-architecture)
- [Quick Start](#quick-start)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Project Documentation](#project-documentation)
- [Repository Structure](#repository-structure)
- [License & Disclaimer](#license--disclaimer)

---

## 🏛️ System Architecture

TeleMed is built upon five foundational subsystems:

1. **Intelligent Multimodal Data Intake Engine (IMDIE)** (`services/multimodal_intake/`):
   - 15-stage pipeline extracting structured clinical parameters from multi-format medical reports (PDF, OCR scanned images, CSV, TXT, JSON).
   - Automated synonym mapping, unit conversion, physiological bound checking, and data quality scoring.
2. **7-Pathway Multimodal Fusion Engine** (`ai/inference/`, `ai/models/fusion/`):
   - Adaptive late-fusion meta-learner accommodating missing modalities across all 7 combinations ($C, W, G, C+W, C+G, W+G, C+W+G$).
   - Clinical-Anchor routing with verified remote multiomics triage stacker for NAFLD.
3. **Unified TreeSHAP Explainable AI (XAI)** (`ai/explainability/`):
   - Granular feature-level SHAP attributions, effect directionality, and modality-level decision weighting.
4. **Grounded Medical RAG Engine** (`services/medical_rag/`):
   - Zero-hallucination clinical synthesis grounded in authoritative practice guidelines (ADA 2024, WHO 2023, AASLD 2023, AHA 2022, ISAPP 2023).
   - 6-tier evidence provenance tagging and citation guardrails.
5. **Security-Hardened Telemedicine Web Platform** (`app/backend/`, `app/frontend/`):
   - Role-Based Access Control (Patient, Doctor, Admin), sliding rate limiting, real-time WebRTC teleconsultations, doctor credential verification, and immutable audit governance.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) PostgreSQL 17 and Redis for production mode

### 1. Backend Setup & Startup
```powershell
# Create environment file
cp .env.example .env

# Install backend dependencies
pip install -r app/backend/requirements.txt

# Start backend development server
python -m uvicorn app.backend.main:app --port 8000 --reload
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 2. Frontend Setup & Startup
```powershell
# Install frontend dependencies
npm --prefix app/frontend install

# Start Vite development server
npm --prefix app/frontend run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

### 3. Demo Login Accounts

| Role | Email | Password |
|---|---|---|
| **Patient** | `patient@telemed.ai` | `PatSec#2026!HealthApp` |
| **Doctor** | `doctor@telemed.ai` | `DocSec#2026!MedPortal` |
| **Admin** | `admin@telemed.ai` | `Password123!` |

---

## 🧪 Testing & Quality Assurance

Run the unified 16-suite regression test harness:
```powershell
python -m unittest tests/integration/test_v3_e2e_integration.py tests/security/test_auth_rbac.py tests/e2e/test_level2_patient_portal.py tests/e2e/test_level3_health_records.py tests/security/test_level4_doctor_verification.py tests/e2e/test_level5_consultations.py tests/integration/test_level6_consistency_e2e.py tests/integration/test_level6_rag.py tests/integration/test_level6_report_recommendations.py tests/integration/test_level7_notes_messaging.py tests/integration/test_level7d_admin_dashboard.py tests/integration/test_level8_appointments_notifications.py tests/integration/test_level10_system_operations.py tests/security/test_level11_security_hardening.py tests/security/test_level12_audit_governance.py tests/e2e/test_full_app_audit.py
```
**Results**: **142 / 142 tests passing (100% OK)** in ~88 seconds.

Build and validate the frontend production bundle:
```powershell
npm --prefix app/frontend run build
```
**Results**: **2507 modules transformed, 0 build errors**.

---

## 📚 Project Documentation

- 🗺️ **[Project Map & Directory Layout](docs/PROJECT_MAP.md)**: Full codebase structure, directory index, and module responsibilities.
- 🎯 **[Active Components Matrix](docs/ACTIVE_COMPONENTS.md)**: Authoritative index of active production components vs archived research assets.
- 🎓 **[Reviewer & B.Tech Defense Guide](docs/REVIEW_GUIDE.md)**: Step-by-step evaluator instructions, test verification commands, and architectural talking points.
- 🗄️ **[Archive & Research Evolution Index](archive/ARCHIVE_INDEX.md)**: Comprehensive catalog of preserved V1/V2/V3 datasets, models, and research milestones.

---

## ⚖️ License & Disclaimer

**Research & Educational Use Only**: This software is an academic research prototype developed for educational and decision-support demonstration purposes. Predictive risk scores, explainability visualizations, and RAG-generated recommendations do not constitute clinical diagnosis or medical prescriptions. Always consult a certified healthcare professional for medical advice.
