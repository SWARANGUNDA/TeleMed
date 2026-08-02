"""
celery_app.py — Celery App Instance Configuration for Asynchronous Background Tasks.
"""

import os
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "telemed_tasks",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["web_platform.backend.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,
    broker_connection_retry_on_startup=True
)
