"""
deep_postgres_audit.py — Deep System Audit for PostgreSQL Executables, Services, and PATH.
"""

import os
import sys
import subprocess
from pathlib import Path

print("=======================================================")
print("DEEP POSTGRESQL SYSTEM INSTALLATION AUDIT")
print("=======================================================")

# 1. Search PATH environment variable
print("\n--- 1. PATH Environment Variable Inspection ---")
path_dirs = os.environ.get("PATH", "").split(os.pathsep)
pg_path_entries = [p for p in path_dirs if "postgres" in p.lower() or "edb" in p.lower()]
if pg_path_entries:
    print(f"Found PostgreSQL entries in PATH ({len(pg_path_entries)}):")
    for p in pg_path_entries:
        print(f"  - {p}")
else:
    print("NO PostgreSQL or EnterpriseDB entries found in system PATH.")

# 2. Run 'where psql' and 'where postgres'
print("\n--- 2. Executable Lookup via 'where' CLI ---")
for cmd in ["psql", "postgres", "pg_ctl", "pgadmin4"]:
    try:
        res = subprocess.run(["where", cmd], capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            print(f"WHERE {cmd}: PASS -> {res.stdout.strip()}")
        else:
            print(f"WHERE {cmd}: NOT FOUND IN PATH")
    except Exception as e:
        print(f"WHERE {cmd}: Error ({str(e)})")

# 3. Check Common Program Files Directories
print("\n--- 3. Common Directory Paths Audit ---")
target_dirs = [
    Path("C:/Program Files/PostgreSQL"),
    Path("C:/Program Files (x86)/PostgreSQL"),
    Path("C:/Program Files/EnterpriseDB"),
    Path("C:/PostgreSQL"),
    Path("C:/tools/postgresql"),
    Path(os.environ.get("LOCALAPPDATA", "")) / "Programs" / "PostgreSQL"
]

found_installed_paths = []

for d in target_dirs:
    print(f"Checking path: {d}")
    if d.exists():
        print(f"  -> EXISTS: {d}")
        try:
            subdirs = list(d.iterdir())
            for s in subdirs:
                print(f"     Subfolder/File: {s}")
                bin_dir = s / "bin"
                if bin_dir.exists():
                    found_installed_paths.append(str(bin_dir))
                    exes = [f.name for f in bin_dir.glob("*.exe")]
                    print(f"     Found bin directory: {bin_dir} (Executables: {len(exes)})")
        except Exception as e:
            print(f"     Error reading directory: {str(e)}")
    else:
        print(f"  -> DOES NOT EXIST")

# 4. Deep Drive C Scan for postgres.exe / psql.exe
print("\n--- 4. Drive Scan for Executables (postgres.exe / psql.exe / pg_ctl.exe) ---")
scan_roots = [
    Path("C:/Program Files"),
    Path("C:/Program Files (x86)"),
    Path("C:/Users") / os.environ.get("USERNAME", "") / "AppData"
]

found_exes = []
for root in scan_roots:
    if root.exists():
        try:
            for ex in ["postgres.exe", "psql.exe", "pg_ctl.exe", "pgAdmin4.exe"]:
                for matched in root.glob(f"**/{ex}"):
                    found_exes.append(str(matched))
        except Exception as e:
            print(f"Scan error in {root}: {str(e)}")

if found_exes:
    print(f"Found PostgreSQL Executables on Disk ({len(found_exes)}):")
    for fe in set(found_exes):
        print(f"  - {fe}")
else:
    print("NO PostgreSQL executables (postgres.exe, psql.exe, pg_ctl.exe, pgAdmin4.exe) found under standard program roots.")

# 5. Search Windows Services
print("\n--- 5. Windows Services Registry Check ---")
try:
    res = subprocess.run(["powershell", "-Command", "Get-Service | Where-Object {$_.Name -like '*postgres*' -or $_.DisplayName -like '*postgres*'} | Select-Object Name, Status, DisplayName | Format-List"], capture_output=True, text=True, timeout=5)
    out = res.stdout.strip()
    if out:
        print(f"Found Windows Services:\n{out}")
    else:
        print("NO Windows Services matching '*postgres*' found in service manager.")
except Exception as e:
    print(f"Error querying Windows services: {str(e)}")

print("\n=======================================================")
print("AUDIT SUMMARY")
print("=======================================================")
if found_exes or found_installed_paths:
    print(f"PostgreSQL IS INSTALLED on disk, but PATH may be missing.")
    print(f"Installed Locations: {found_installed_paths or found_exes}")
else:
    print("PostgreSQL IS NOT INSTALLED on this machine.")
