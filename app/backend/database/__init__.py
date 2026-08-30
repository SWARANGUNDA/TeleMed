from .db import engine, SessionLocal, Base, get_db, check_db_connection

def init_db():
    """PostgreSQL Initialization bridge (tables created via Alembic / ORM)."""
    check_db_connection()

try:
    from ..database_legacy import *
except (ImportError, ValueError):
    try:
        from ..backend.database_legacy import *
    except (ImportError, ValueError):
        try:
            from database_legacy import *
        except Exception:
            pass



