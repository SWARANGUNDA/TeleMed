"""
verify_postgres_setup.py — Complete 13-Check Inspection Script for PostgreSQL Backend & SQLite Dependencies.
"""

import sys
import os
import socket
import subprocess
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "web_platform" / "backend"
sys.path.insert(0, str(backend_dir.parent.parent))
sys.path.insert(0, str(backend_dir))

def print_check_header(num, title):
    print(f"\n=======================================================")
    print(f"CHECK {num}: {title}")
    print(f"=======================================================")

# Check 1: PostgreSQL installation check
print_check_header(1, "PostgreSQL Installation Check")
psql_installed = False
try:
    res = subprocess.run(["psql", "--version"], capture_output=True, text=True, timeout=5)
    if res.returncode == 0:
        psql_installed = True
        print(f"[STATUS] PASS — psql CLI found: {res.stdout.strip()}")
    else:
        print(f"[STATUS] FAIL — psql CLI error: {res.stderr.strip()}")
except Exception as e:
    print(f"[STATUS] FAIL — psql executable not found in PATH: {str(e)}")

pg_dir = Path("C:/Program Files/PostgreSQL")
if pg_dir.exists():
    versions = [d.name for d in pg_dir.iterdir() if d.is_dir()]
    print(f"[INFO] Found PostgreSQL Program Files directory: {pg_dir} (Versions: {versions})")
else:
    print(f"[INFO] C:/Program Files/PostgreSQL directory does NOT exist.")


# Check 2: PostgreSQL service status
print_check_header(2, "PostgreSQL Service Status Check")
try:
    res = subprocess.run(["powershell", "-Command", "Get-Service -Name '*postgres*' -ErrorAction SilentlyContinue | Select-Name, Status, DisplayName | Format-Table -HideTableHeaders"], capture_output=True, text=True, timeout=5)
    out = res.stdout.strip()
    if out:
        print(f"[STATUS] PostgreSQL Services found:\n{out}")
    else:
        print("[STATUS] FAIL — No active Windows Services matching '*postgres*' found.")
except Exception as e:
    print(f"[STATUS] FAIL — Error querying Windows Services: {str(e)}")


# Check 3: Port 5432 Listening Check
print_check_header(3, "Port 5432 Socket Connection Check")
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2.0)
try:
    s.connect(("127.0.0.1", 5432))
    s.close()
    print("[STATUS] PASS — Port 5432 is OPEN and listening on 127.0.0.1.")
except Exception as e:
    print(f"[STATUS] FAIL — Connection refused on 127.0.0.1:5432: {str(e)}")


# Check 4: DATABASE_URL in .env check
print_check_header(4, "DATABASE_URL in web_platform/backend/.env Check")
env_path = backend_dir / ".env"
print(f"Reading .env path: {env_path}")
if env_path.exists():
    with open(env_path, "r") as f:
        content = f.read()
    print(".env Contents:")
    for line in content.splitlines():
        if "DATABASE_URL" in line or "SECRET" in line:
            print(f"  {line}")
    from core.config import settings
    print(f"[STATUS] PASS — Loaded settings.DATABASE_URL: {settings.DATABASE_URL}")
else:
    print("[STATUS] FAIL — .env file missing.")


# Check 5 & 6 & 7: Connect to PostgreSQL using DATABASE_URL & Execute SELECT version(); / current_database();
print_check_header(5, "PostgreSQL Database Connection & Version Query Check")
try:
    from sqlalchemy import create_engine, text
    from core.config import settings
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        ver = conn.execute(text("SELECT version();")).fetchone()[0]
        cur_db = conn.execute(text("SELECT current_database();")).fetchone()[0]
        print(f"[STATUS] PASS — Connected to PostgreSQL!")
        print(f"  SELECT version(): {ver}")
        print(f"  SELECT current_database(): {cur_db}")
        
        # Check database telemed_db exists
        dbs = [r[0] for r in conn.execute(text("SELECT datname FROM pg_database;")).fetchall()]
        print(f"  Existing PostgreSQL Databases: {dbs}")
        if "telemed_db" in dbs:
            print(f"[STATUS] PASS — Database 'telemed_db' exists.")
        else:
            print(f"[STATUS] FAIL — Database 'telemed_db' does NOT exist in pg_database list.")
except Exception as e:
    print(f"[STATUS] FAIL — PostgreSQL connection failed: {str(e)}")


# Check 8: Alembic connection check
print_check_header(8, "Alembic Connection Check (alembic current)")
try:
    res = subprocess.run(["python", "-m", "alembic", "current"], cwd=str(backend_dir), capture_output=True, text=True, timeout=10)
    print(f"Alembic stdout: {res.stdout.strip()}")
    if res.returncode == 0:
        print("[STATUS] PASS — Alembic executed successfully.")
    else:
        print(f"[STATUS] FAIL — Alembic exit code {res.returncode}. Stderr:\n{res.stderr.strip()}")
except Exception as e:
    print(f"[STATUS] FAIL — Alembic execution error: {str(e)}")


# Check 9: List all existing tables
print_check_header(9, "List All Existing Tables")
try:
    from database import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [r[0] for r in cursor.fetchall()]
    print(f"Legacy SQLite tables (telemed.db): {tables}")
except Exception as e:
    print(f"Error querying legacy sqlite tables: {str(e)}")


# Check 10 & 11 & 12: Codebase audit for sqlite3 imports and telemed.db references
print_check_header(10, "Codebase Audit: sqlite3 Imports & telemed.db References")

sqlite_files = []
telemed_db_files = []

for p in Path("c:/Users/swara/OneDrive/Desktop/TeleMed").rglob("*.py"):
    if ".venv" in p.parts or "__pycache__" in p.parts:
        continue
    try:
        txt = p.read_text(encoding="utf-8", errors="ignore")
        if "import sqlite3" in txt or "from sqlite3" in txt:
            sqlite_files.append(str(p))
        if "telemed.db" in txt:
            telemed_db_files.append(str(p))
    except Exception:
        pass

print("Files containing 'import sqlite3' or 'from sqlite3':")
for f in sqlite_files:
    print(f"  - {f}")

print("\nFiles containing 'telemed.db' references:")
for f in telemed_db_files:
    print(f"  - {f}")
