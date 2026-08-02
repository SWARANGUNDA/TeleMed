from .db import engine, SessionLocal, Base, get_db, check_db_connection

# Re-export legacy persistence functions for backward compatibility
import importlib.util
from pathlib import Path

_legacy_db_path = Path(__file__).resolve().parent.parent / "database.py"
if _legacy_db_path.exists():
    _spec = importlib.util.spec_from_file_location("web_platform.backend.database_legacy", _legacy_db_path)
    _legacy_db = importlib.util.module_from_spec(_spec)
    _legacy_db.__package__ = "web_platform.backend"
    _spec.loader.exec_module(_legacy_db)

    for _attr in dir(_legacy_db):
        if not _attr.startswith("_"):
            globals()[_attr] = getattr(_legacy_db, _attr)

__all__ = ["engine", "SessionLocal", "Base", "get_db", "check_db_connection"]

