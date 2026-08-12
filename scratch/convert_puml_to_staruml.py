"""
convert_puml_to_staruml.py — Converts PlantUML diagrams into StarUML (.mdj) JSON format.
Creates 14 diagram-specific .mdj files + 1 master project file telemed_v4_architecture.mdj.
Removes superseded .puml files.
"""

import json
import uuid
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
UML_DIR = REPO_ROOT / "docs" / "uml"

def gen_id(prefix="AAAA"):
    return f"AAAA{uuid.uuid4().hex[:20].upper()}"

def build_mdj_project(name, elements):
    proj_id = gen_id("PRJ")
    model_id = gen_id("MDL")
    diag_id = gen_id("DIA")
    
    diagram_type = "UMLClassDiagram"
    if "Use Case" in name or "use_case" in name:
        diagram_type = "UMLUseCaseDiagram"
    elif "Component" in name or "component" in name or "Pipeline" in name or "ML" in name:
        diagram_type = "UMLComponentDiagram"
    elif "Deployment" in name or "deployment" in name:
        diagram_type = "UMLDeploymentDiagram"
    elif "Sequence" in name or "sequence" in name or "assessment" in name or "prediction" in name or "xai" in name or "report" in name or "auth" in name:
        diagram_type = "UMLSequenceDiagram"
    elif "ER" in name or "database" in name:
        diagram_type = "ERDDataModel"

    owned_elements = []
    views = []
    
    x, y = 40, 40
    for idx, el in enumerate(elements):
        el_id = gen_id("ELE")
        el_type = el.get("type", "UMLClass")
        el_name = el.get("name", f"Element_{idx}")
        
        element_obj = {
            "_type": el_type,
            "_id": el_id,
            "_parent": { "$ref": model_id },
            "name": el_name
        }
        
        if "attributes" in el:
            element_obj["attributes"] = [
                {
                    "_type": "UMLAttribute",
                    "_id": gen_id("ATT"),
                    "_parent": { "$ref": el_id },
                    "name": attr_name,
                    "type": attr_type
                }
                for attr_name, attr_type in el["attributes"]
            ]
            
        if "operations" in el:
            element_obj["operations"] = [
                {
                    "_type": "UMLOperation",
                    "_id": gen_id("OPR"),
                    "_parent": { "$ref": el_id },
                    "name": op_name
                }
                for op_name in el["operations"]
            ]

        if "columns" in el:
            element_obj["columns"] = [
                {
                    "_type": "ERDColumn",
                    "_id": gen_id("COL"),
                    "_parent": { "$ref": el_id },
                    "name": col_name,
                    "type": col_type,
                    "primaryKey": is_pk,
                    "foreignKey": is_fk
                }
                for col_name, col_type, is_pk, is_fk in el["columns"]
            ]

        owned_elements.append(element_obj)
        
        # View object
        view_type = el_type + "View"
        if el_type == "ERDEntity":
            view_type = "ERDEntityView"
            
        views.append({
            "_type": view_type,
            "_id": gen_id("VIW"),
            "_parent": { "$ref": diag_id },
            "model": { "$ref": el_id },
            "font": "Arial;13;0",
            "left": x,
            "top": y,
            "width": 220,
            "height": 140
        })
        
        x += 240
        if x > 900:
            x = 40
            y += 180

    diagram_obj = {
        "_type": diagram_type if diagram_type != "ERDDataModel" else "ERDDiagram",
        "_id": diag_id,
        "_parent": { "$ref": model_id },
        "name": name,
        "ownedViews": views
    }

    model_obj = {
        "_type": "UMLModel" if diagram_type != "ERDDataModel" else "ERDDataModel",
        "_id": model_id,
        "_parent": { "$ref": proj_id },
        "name": name + " Model",
        "ownedElements": [diagram_obj] + owned_elements
    }

    return {
        "_type": "Project",
        "_id": proj_id,
        "name": f"TeleMed AI Platform — {name}",
        "ownedElements": [model_obj]
    }

# Definitions of diagram models matching current implementation
DIAGRAM_SPECS = {
    "01_use_case_diagram": {
        "title": "System Use-Case Diagram (V4 Architecture)",
        "elements": [
            {"type": "UMLActor", "name": "Patient"},
            {"type": "UMLActor", "name": "Doctor"},
            {"type": "UMLActor", "name": "Administrator"},
            {"type": "UMLUseCase", "name": "UC-1.1: Register & Authenticate (JWT)"},
            {"type": "UMLUseCase", "name": "UC-2.1: Upload Multimodal Data (CSV/PDF)"},
            {"type": "UMLUseCase", "name": "UC-2.5: Execute Health Assessment"},
            {"type": "UMLUseCase", "name": "UC-3.1: View 5 Disease Risk Predictions"},
            {"type": "UMLUseCase", "name": "UC-3.2: View TreeSHAP Feature Attributions"},
            {"type": "UMLUseCase", "name": "UC-4.1: View RAG Report & Download PDF"},
            {"type": "UMLUseCase", "name": "UC-5.1: Doctor Workspace & Consultation Notes"},
            {"type": "UMLUseCase", "name": "UC-6.1: Admin Verification & Audit Logging"}
        ]
    },
    "02_system_component_diagram": {
        "title": "High-Level System Component Diagram",
        "elements": [
            {"type": "UMLComponent", "name": "React Vite Frontend SPA"},
            {"type": "UMLComponent", "name": "FastAPI Application Core"},
            {"type": "UMLComponent", "name": "Auth & RBAC Service"},
            {"type": "UMLComponent", "name": "Multimodal Intake Engine"},
            {"type": "UMLComponent", "name": "Clinical Expert (18 Features)"},
            {"type": "UMLComponent", "name": "Wearable Expert (15 Features)"},
            {"type": "UMLComponent", "name": "Gut Expert (49 Model Features)"},
            {"type": "UMLComponent", "name": "V4 Stacking Fusion Engine"},
            {"type": "UMLComponent", "name": "TreeSHAP Explainability Engine"},
            {"type": "UMLComponent", "name": "Medical RAG Evidence Synthesizer"},
            {"type": "UMLComponent", "name": "PostgreSQL 17 Database"},
            {"type": "UMLComponent", "name": "Redis Session Store"},
            {"type": "UMLComponent", "name": "Celery Asynchronous Workers"},
            {"type": "UMLComponent", "name": "Prometheus Observability Engine"}
        ]
    },
    "03_backend_class_diagram": {
        "title": "Backend Class Diagram (FastAPI & SQLAlchemy ORM)",
        "elements": [
            {
                "type": "UMLClass", "name": "User",
                "attributes": [("user_id", "String PK"), ("email", "String"), ("password_hash", "String"), ("role", "String")]
            },
            {
                "type": "UMLClass", "name": "PatientProfile",
                "attributes": [("patient_id", "String PK"), ("user_id", "String FK"), ("full_name", "String"), ("age", "Integer"), ("gender", "String")]
            },
            {
                "type": "UMLClass", "name": "DoctorProfile",
                "attributes": [("doctor_id", "String PK"), ("user_id", "String FK"), ("specialization", "String"), ("verification_status", "String")]
            },
            {
                "type": "UMLClass", "name": "HealthRecord",
                "attributes": [("record_id", "String PK"), ("user_id", "String FK"), ("effective_pathway", "String"), ("prediction_snapshot", "Text"), ("xai_snapshot", "Text")]
            },
            {
                "type": "UMLClass", "name": "Consultation",
                "attributes": [("consultation_id", "String PK"), ("patient_id", "String"), ("assigned_doctor_id", "String FK"), ("reason", "Text"), ("status", "String")]
            },
            {
                "type": "UMLClass", "name": "V3InferenceEngine",
                "operations": ["predict_clinical(X)", "predict_wearable(X)", "predict_gut(X)", "predict_multimodal(data)"]
            },
            {
                "type": "UMLClass", "name": "V3ScientificRouter",
                "operations": ["route_prediction(payload)", "evaluate_stasis_pathway(pathway)"]
            },
            {
                "type": "UMLClass", "name": "XAIService",
                "operations": ["get_shap_explanations(record)", "compute_treeshap_attributions(model, X)"]
            },
            {
                "type": "UMLClass", "name": "MedicalRAGEngine",
                "operations": ["retrieve_medical_evidence(query)", "generate_comprehensive_report(snapshot)"]
            }
        ]
    },
    "04_intake_preprocessing_class_diagram": {
        "title": "Data Intake & Preprocessing Class Diagram",
        "elements": [
            {
                "type": "UMLClass", "name": "MultimodalIntakeEngine",
                "operations": ["process_intake(raw_payload)", "extract_from_csv(path)", "extract_from_pdf_ocr(path)"]
            },
            {
                "type": "UMLClass", "name": "SchemaValidator",
                "operations": ["validate_clinical_features(data)", "validate_wearable_features(data)", "validate_gut_features(data)"]
            },
            {
                "type": "UMLClass", "name": "ModalityDetector",
                "operations": ["detect_active_modalities(payload)", "determine_effective_pathway(modalities)"]
            },
            {
                "type": "UMLClass", "name": "FeatureNormalizer",
                "operations": ["normalize_clinical(data)", "normalize_wearable(data)", "normalize_gut(data)", "compute_v4_gut_indices(taxa)"]
            },
            {
                "type": "UMLClass", "name": "ClinicalSchema18",
                "attributes": [("18 Biomarker Features", "Float"), ("Includes Age & Gender", "Metadata/Feature"), ("Patient_ID", "Excluded (Metadata Only)")]
            },
            {
                "type": "UMLClass", "name": "WearableSchema15",
                "attributes": [("15 CGM & Wearable Features", "Float"), ("Excludes Age & Gender", "Excluded"), ("Patient_ID", "Excluded (Metadata Only)")]
            },
            {
                "type": "UMLClass", "name": "GutSchema49",
                "attributes": [("40 Canonical Species Taxa", "Float"), ("1 Other_Taxa", "Float"), ("9 Derived Ecological Indices", "Float"), ("Patient_ID", "Excluded (Metadata Only)")]
            }
        ]
    },
    "05_ml_pipeline_component_diagram": {
        "title": "ML Pipeline & Multi-Expert Inference Engine Diagram",
        "elements": [
            {"type": "UMLComponent", "name": "Clinical Preprocessing & Scaler"},
            {"type": "UMLComponent", "name": "Wearable Preprocessing & Scaler"},
            {"type": "UMLComponent", "name": "Gut Normalizer & Ecological Index Engine"},
            {"type": "UMLComponent", "name": "Clinical Expert Engine (18 Features)"},
            {"type": "UMLComponent", "name": "Wearable Expert Engine (15 Features)"},
            {"type": "UMLComponent", "name": "Gut Microbiome Expert Engine (49 Features)"},
            {"type": "UMLComponent", "name": "7 Modality Pathways (C, W, G, C+W, C+G, W+G, C+W+G)"},
            {"type": "UMLComponent", "name": "V4 Stacking Fusion Meta-Learner"},
            {"type": "UMLComponent", "name": "Isotonic/Sigmoid Dynamic Calibrator"},
            {"type": "UMLComponent", "name": "5 Multi-Organ Target Predictions"},
            {"type": "UMLComponent", "name": "TreeSHAP Explainable AI Module"},
            {"type": "UMLComponent", "name": "Medical RAG Report Generator"}
        ]
    },
    "06_deployment_diagram": {
        "title": "Infrastructure Deployment Diagram (Docker / Production)",
        "elements": [
            {"type": "UMLNode", "name": "Client Workstation (Web Browser)"},
            {"type": "UMLNode", "name": "Docker Container: telemed-frontend (Nginx/Vite :5173)"},
            {"type": "UMLNode", "name": "Docker Container: telemed-backend (Uvicorn/FastAPI :8000)"},
            {"type": "UMLNode", "name": "Docker Container: telemed-db (PostgreSQL 17 :5432)"},
            {"type": "UMLNode", "name": "Docker Container: telemed-redis (Redis Store :6379)"},
            {"type": "UMLNode", "name": "Docker Container: telemed-celery (Asynchronous Task Workers)"},
            {"type": "UMLNode", "name": "Docker Container: telemed-prometheus (Metrics Collector :9090)"}
        ]
    },
    "07_patient_assessment_sequence": {
        "title": "Complete Patient Assessment Sequence Diagram",
        "elements": [
            {"type": "UMLClass", "name": "1. Patient Interface (IntakePage.jsx)"},
            {"type": "UMLClass", "name": "2. FastAPI Intake Router (intake_routes.py)"},
            {"type": "UMLClass", "name": "3. Security & Auth Middleware (security.py)"},
            {"type": "UMLClass", "name": "4. Multimodal Intake Engine (intake_service.py)"},
            {"type": "UMLClass", "name": "5. Feature Normalizer & Preprocessing"},
            {"type": "UMLClass", "name": "6. V4 Multi-Expert Models (v3_inference_engine.py)"},
            {"type": "UMLClass", "name": "7. Stacking Fusion Router (v3_scientific_router.py)"},
            {"type": "UMLClass", "name": "8. TreeSHAP XAI Engine (xai_service.py)"},
            {"type": "UMLClass", "name": "9. Medical RAG Engine (rag_service_wrapper.py)"},
            {"type": "UMLClass", "name": "10. PostgreSQL Persistence Store (health_records)"}
        ]
    },
    "08_multimodal_prediction_sequence": {
        "title": "Multimodal Prediction & Modality Execution Sequence",
        "elements": [
            {"type": "UMLClass", "name": "Client Request (POST /api/v3/predict)"},
            {"type": "UMLClass", "name": "Predict Router (predict_routes.py)"},
            {"type": "UMLClass", "name": "Modality Detector Engine"},
            {"type": "UMLClass", "name": "Clinical Expert (C - 18 features)"},
            {"type": "UMLClass", "name": "Wearable Expert (W - 15 features)"},
            {"type": "UMLClass", "name": "Gut Expert (G - 49 features)"},
            {"type": "UMLClass", "name": "Stacking Fusion Meta-Model"},
            {"type": "UMLClass", "name": "5 Disease Risk Output Generator"},
            {"type": "UMLClass", "name": "PostgreSQL Record Snapshot Inserter"}
        ]
    },
    "09_xai_sequence": {
        "title": "Explainable AI (TreeSHAP) Sequence Diagram",
        "elements": [
            {"type": "UMLClass", "name": "User XAI View (XAIPage.jsx)"},
            {"type": "UMLClass", "name": "XAI Router (xai_routes.py)"},
            {"type": "UMLClass", "name": "PostgreSQL Health Record Store"},
            {"type": "UMLClass", "name": "XAI Service (xai_service.py)"},
            {"type": "UMLClass", "name": "TreeSHAP Explainer Engine"},
            {"type": "UMLClass", "name": "Global & Directional Importance Calculator"},
            {"type": "UMLClass", "name": "XAI Snapshot Cache Writer"}
        ]
    },
    "10_report_generation_sequence": {
        "title": "Medical RAG & PDF Report Generation Sequence",
        "elements": [
            {"type": "UMLClass", "name": "User Report View (ReportPage.jsx)"},
            {"type": "UMLClass", "name": "RAG Router (rag_routes.py)"},
            {"type": "UMLClass", "name": "PostgreSQL Record Store"},
            {"type": "UMLClass", "name": "Medical RAG Engine (rag_service_wrapper.py)"},
            {"type": "UMLClass", "name": "ChromaDB Medical Vector Store"},
            {"type": "UMLClass", "name": "Clinical Evidence Synthesizer"},
            {"type": "UMLClass", "name": "ReportLab PDF Export Engine"}
        ]
    },
    "11_database_er_diagram": {
        "title": "Entity Relationship (ER) Database Diagram",
        "elements": [
            {
                "type": "ERDEntity", "name": "users",
                "columns": [("user_id", "VARCHAR", True, False), ("email", "VARCHAR", False, False), ("password_hash", "VARCHAR", False, False), ("role", "VARCHAR", False, False)]
            },
            {
                "type": "ERDEntity", "name": "patient_profiles",
                "columns": [("patient_id", "VARCHAR", True, False), ("user_id", "VARCHAR", False, True), ("full_name", "VARCHAR", False, False), ("age", "INTEGER", False, False)]
            },
            {
                "type": "ERDEntity", "name": "doctor_profiles",
                "columns": [("doctor_id", "VARCHAR", True, False), ("user_id", "VARCHAR", False, True), ("specialization", "VARCHAR", False, False), ("verification_status", "VARCHAR", False, False)]
            },
            {
                "type": "ERDEntity", "name": "health_records",
                "columns": [("record_id", "VARCHAR", True, False), ("user_id", "VARCHAR", False, True), ("effective_pathway", "VARCHAR", False, False), ("prediction_snapshot", "TEXT", False, False), ("xai_snapshot", "TEXT", False, False)]
            },
            {
                "type": "ERDEntity", "name": "consultations",
                "columns": [("consultation_id", "VARCHAR", True, False), ("patient_id", "VARCHAR", False, False), ("assigned_doctor_id", "VARCHAR", False, True), ("status", "VARCHAR", False, False)]
            },
            {
                "type": "ERDEntity", "name": "audit_events",
                "columns": [("event_id", "VARCHAR", True, False), ("actor_user_id", "VARCHAR", False, False), ("action", "VARCHAR", False, False), ("event_hash", "VARCHAR", False, False)]
            }
        ]
    },
    "12_frontend_component_diagram": {
        "title": "React Frontend Component & Routing Architecture",
        "elements": [
            {"type": "UMLComponent", "name": "App.jsx (Router & Provider Container)"},
            {"type": "UMLComponent", "name": "AuthContext (JWT & User State)"},
            {"type": "UMLComponent", "name": "IntakePage.jsx (Multimodal Entry)"},
            {"type": "UMLComponent", "name": "DashboardPage.jsx (Risk Gauge & Summary)"},
            {"type": "UMLComponent", "name": "ReportPage.jsx (RAG Report & PDF View)"},
            {"type": "UMLComponent", "name": "XAIPage.jsx (TreeSHAP Bar & Beeswarm Plots)"},
            {"type": "UMLComponent", "name": "ConsultationWorkspacePage.jsx (Doctor Workspace)"},
            {"type": "UMLComponent", "name": "AdminDashboardPage.jsx (Audit & System Health)"},
            {"type": "UMLComponent", "name": "apiClient.js (Axios Auth Interceptor Client)"}
        ]
    },
    "13_auth_rbac_sequence": {
        "title": "JWT Authentication & Role-Based Access Control (RBAC)",
        "elements": [
            {"type": "UMLClass", "name": "User Client (LoginPage.jsx)"},
            {"type": "UMLClass", "name": "Auth Router (auth_routes.py)"},
            {"type": "UMLClass", "name": "Security Engine (security.py)"},
            {"type": "UMLClass", "name": "PostgreSQL User & Session Store"},
            {"type": "UMLClass", "name": "JWT Token Generator & Decoder"},
            {"type": "UMLClass", "name": "Protected Route RBAC Middleware"}
        ]
    },
    "16_v4_model_architecture": {
        "title": "Frozen V4 Multi-Expert Model Ecosystem Architecture",
        "elements": [
            {
                "type": "UMLClass", "name": "ClinicalExpertVector",
                "attributes": [("18 Numerical Biomarker Features", "Included"), ("Age & Gender", "Included"), ("Patient_ID", "Excluded (Metadata Only)")]
            },
            {
                "type": "UMLClass", "name": "WearableExpertVector",
                "attributes": [("15 CGM & Wearable Features", "Included"), ("Age & Gender", "Excluded"), ("Patient_ID", "Excluded (Metadata Only)")]
            },
            {
                "type": "UMLClass", "name": "GutExpertVector",
                "attributes": [("40 Canonical Species Taxa", "Included"), ("1 Other_Taxa", "Included"), ("9 Derived Ecological Indices", "Included"), ("Patient_ID", "Excluded (Metadata Only)")]
            },
            {
                "type": "UMLClass", "name": "V4StackingMetaLearner",
                "operations": ["predict_type2_diabetes()", "predict_prediabetes()", "predict_high_adiposity_risk()", "predict_metabolic_syndrome()", "predict_nafld()"]
            },
            {
                "type": "UMLClass", "name": "DiseaseTargetOutputs",
                "attributes": [("Type2_Diabetes", "Risk Probability"), ("Prediabetes", "Risk Probability"), ("High_Adiposity_Risk", "Risk Probability"), ("Metabolic_Syndrome", "Risk Probability"), ("NAFLD", "Risk Probability")]
            }
        ]
    }
}

def main():
    print("Starting conversion to StarUML (.mdj) files...")
    
    # 1. Generate individual .mdj files
    master_models = []
    
    for key, spec in DIAGRAM_SPECS.items():
        mdj_content = build_mdj_project(spec["title"], spec["elements"])
        file_path = UML_DIR / f"{key}.mdj"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(mdj_content, f, indent=2)
        print(f"  [OK] Created StarUML file: {file_path.name}")
        master_models.append(mdj_content["ownedElements"][0])
        
        # Remove superseded .puml file if present
        puml_path = UML_DIR / f"{key}.puml"
        if puml_path.exists():
            puml_path.unlink()
            print(f"  [REMOVED] Superseded PlantUML file: {puml_path.name}")

    # 2. Build Master StarUML Project File
    master_proj_id = gen_id("PRJ")
    master_project = {
        "_type": "Project",
        "_id": master_proj_id,
        "name": "TeleMed AI Platform — Complete Frozen V4 Architecture Master Project",
        "ownedElements": master_models
    }
    
    master_path = UML_DIR / "telemed_v4_architecture.mdj"
    with open(master_path, "w", encoding="utf-8") as f:
        json.dump(master_project, f, indent=2)
    print(f"  [OK] Created Master StarUML Project file: {master_path.name}")
    print("\nAll StarUML conversion operations completed successfully 100%!")

if __name__ == "__main__":
    main()
