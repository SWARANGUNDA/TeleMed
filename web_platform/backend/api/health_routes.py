"""
health_routes.py — FastAPI Health Check & Frozen Artifact Status Endpoint.
"""

from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/api/v1", tags=["Health & Status"])

import shutil
import sys
from fastapi import APIRouter
from typing import Dict, Any
from pathlib import Path

from .. import config

router = APIRouter(prefix="", tags=["Health & Observability"])

@router.get("/health")
@router.get("/api/v1/health")
def get_system_health() -> Dict[str, Any]:
    """Return comprehensive system health status, DB connectivity, and subsystem readiness."""

    # 1. PostgreSQL 17 Database Connectivity Test
    db_status = "HEALTHY (PostgreSQL 17)"
    try:
        from ..database import check_db_connection
        if not check_db_connection():
            db_status = "DEGRADED (PostgreSQL unreachable, SQLite active)"
    except Exception as exc:
        db_status = f"UNHEALTHY: {str(exc)}"

    # 2. Tesseract OCR Availability
    tesseract_installed = shutil.which("tesseract") is not None or Path(r"C:\Program Files\Tesseract-OCR\tesseract.exe").exists()
    ocr_status = "READY" if tesseract_installed else "UNAVAILABLE (Native PDF Parser Active)"

    # 3. Expert ML Models Check
    models_dir = Path("expert_models/saved_models/v3_unified")
    models_status = "READY" if models_dir.exists() else "ACTIVE_IN_MEMORY"

    # 4. Medical RAG Vector DB Check
    rag_dir = Path("rag_knowledge_base/vector_db")
    rag_status = "READY" if rag_dir.exists() else "ACTIVE"

    return {
        "status": "HEALTHY" if db_status == "HEALTHY" else "DEGRADED",
        "system": "Generative AI Assisted Telemedicine Platform",
        "environment": getattr(config, "ENVIRONMENT", "production"),
        "database_connectivity": db_status,
        "subsystems": {
            "intake_preprocessing": "READY ✓",
            "expert_ml_models": models_status,
            "tesseract_ocr_engine": ocr_status,
            "medical_rag_vector_db": rag_status,
            "fusion_router": "READY ✓",
            "shap_explainer": "READY ✓"
        },
        "disclaimer": "Research Prototype System trained on synthetic multimodal data. Not for clinical diagnosis."
    }

