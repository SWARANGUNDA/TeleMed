# TeleMed AI Platform — Complete Architecture & UML Documentation Package

This directory contains the official, implementation-accurate UML documentation package and architecture visualizations for the **TeleMed AI Platform (Frozen V4 Architecture)**.

## Project Details
- **Project Version:** V4.0 (Frozen Production Release)
- **Date Generated:** August 12, 2026
- **Architecture Integrity:** 100% verified against current Python/FastAPI backend, React frontend, SQLAlchemy ORM schema, and frozen V4 ML artifacts.

---

## Index of Generated Diagrams

| File | Diagram Type | Syntax | Description |
| :--- | :--- | :--- | :--- |
| [`01_use_case_diagram.puml`](01_use_case_diagram.puml) | Use-Case Diagram | PlantUML | Patient, Doctor, and Administrator system interactions. |
| [`02_system_component_diagram.puml`](02_system_component_diagram.puml) | System Component Diagram | PlantUML | High-level system architecture (Frontend, Backend, ML, DB, Redis, Celery, Prometheus). |
| [`03_backend_class_diagram.puml`](03_backend_class_diagram.puml) | Backend Class Diagram | PlantUML | FastAPI routes, controllers, services, repositories, and ORM entity models. |
| [`04_intake_preprocessing_class_diagram.puml`](04_intake_preprocessing_class_diagram.puml) | Intake Class Diagram | PlantUML | Intake engine, schema validation, feature normalizer (18 C, 15 W, 49 G features). |
| [`05_ml_pipeline_component_diagram.puml`](05_ml_pipeline_component_diagram.puml) | ML Pipeline Diagram | PlantUML | 3 single-modality experts, 7 pathway combinations, Stacking Fusion, XAI & RAG. |
| [`06_deployment_diagram.puml`](06_deployment_diagram.puml) | Deployment Diagram | PlantUML | Docker containerization, ports, services (FastAPI, Nginx, PostgreSQL, Redis, Celery). |
| [`07_patient_assessment_sequence.puml`](07_patient_assessment_sequence.puml) | Sequence Diagram | PlantUML | Complete patient assessment flow from upload to report & persistence. |
| [`08_multimodal_prediction_sequence.puml`](08_multimodal_prediction_sequence.puml) | Sequence Diagram | PlantUML | Dynamic modality execution and 7-pathway multimodal prediction flow. |
| [`09_xai_sequence.puml`](09_xai_sequence.puml) | Sequence Diagram | PlantUML | TreeSHAP explainable AI attribution calculation and caching flow. |
| [`10_report_generation_sequence.puml`](10_report_generation_sequence.puml) | Sequence Diagram | PlantUML | Medical RAG evidence retrieval and ReportLab PDF document export. |
| [`11_database_er_diagram.puml`](11_database_er_diagram.puml) | ER Diagram | PlantUML | Database entity relationship diagram (PostgreSQL / SQLAlchemy ORM). |
| [`12_frontend_component_diagram.puml`](12_frontend_component_diagram.puml) | Frontend Component Diagram | PlantUML | React SPA routing, page containers, contexts, components, API client. |
| [`13_auth_rbac_sequence.puml`](13_auth_rbac_sequence.puml) | Sequence Diagram | PlantUML | JWT authentication and Role-Based Access Control (RBAC) authorization. |
| [`14_end_to_end_activity.mmd`](14_end_to_end_activity.mmd) | Activity Diagram | Mermaid | End-to-end platform workflow flowchart. |
| [`15_data_flow_diagram.mmd`](15_data_flow_diagram.mmd) | Data Flow Diagram | Mermaid | DFD Level 0 & Level 1 data flows across subsystems and stores. |
| [`16_v4_model_architecture.puml`](16_v4_model_architecture.puml) | Model Architecture | PlantUML | Dedicated V4 multi-expert model ecosystem, feature schemas & 5 disease targets. |

---

## How to Render PlantUML Diagrams (`.puml`)

PlantUML files can be rendered into PNG or SVG images using PlantUML CLI or VS Code extensions:

```bash
# Using PlantUML CLI (requires Java and Graphviz)
java -jar plantuml.jar docs/uml/*.puml

# Or using docker
docker run --rm -v $(pwd)/docs/uml:/work plantuml/plantuml *.puml
```

## How to Render Mermaid Diagrams (`.mmd`)

Mermaid diagrams can be viewed directly in GitHub markdown or rendered via Mermaid CLI:

```bash
# Using Mermaid CLI (mmdc)
npx -y @mermaid-js/mermaid-cli -i docs/uml/14_end_to_end_activity.mmd -o docs/uml/14_end_to_end_activity.png
npx -y @mermaid-js/mermaid-cli -i docs/uml/15_data_flow_diagram.mmd -o docs/uml/15_data_flow_diagram.png
```

---

## Inspected Source Code Modules
- **Backend API & ORM:** `web_platform/backend/main.py`, `models/models.py`, `api/*.py`, `services/*.py`
- **ML & Inference Engines:** `expert_models/v3_inference_engine.py`, `fusion_engine/v3_scientific_router.py`
- **Data Intake:** `multimodal_data_intake_engine/`
- **Frontend SPA:** `web_platform/frontend/src/App.jsx`, `pages/*.jsx`, `components/*.jsx`
- **Deployment:** `docker-compose.yml`, `docker-compose.prod.yml`, `Dockerfile`
