"""
database/db.py — SQLAlchemy 2.x Engine, SessionLocal factory, Declarative Base, and get_db dependency.
"""

import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
try:
    from ..core.config import settings
except (ImportError, ValueError):
    from core.config import settings

logger = logging.getLogger("telemed.database")

# Create SQLAlchemy 2.x Engine
# Handles PostgreSQL or SQLite fallback for development/testing
db_url = settings.DATABASE_URL
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    echo=False,
    pool_pre_ping=True,
    connect_args=connect_args
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for SQLAlchemy models
Base = declarative_base()


def get_db() -> Generator:
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Verify database connectivity at startup."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info(f"Database connection verified successfully ({engine.name}).")
        return True
    except Exception as e:
        logger.warning(f"Database connection test note: {str(e)}")
        return False
