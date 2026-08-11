import sys
from pathlib import Path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from web_platform.backend.database_legacy import SessionLocal, pg_models, verify_password, authenticate_user

def check_users():
    session = SessionLocal()
    try:
        users = session.query(pg_models.User).all()
        print(f"Total Users in DB: {len(users)}")
        for u in users:
            print(f"User ID: {u.user_id} | Email: '{u.email}' | Role: {u.role} | PwdHash: {u.password_hash[:16]}... | Salt: {u.salt}")
            
        test_passwords = ["patient123", "password123", "password", "Patient123!", "Admin123!", "Doctor123!"]
        for p in test_passwords:
            res = authenticate_user("patient@telemed.ai", p)
            if res:
                print(f"[MATCH SUCCESS] Password for 'patient@telemed.ai' is: '{p}'")
                break
        else:
            print("[MATCH FAILED] None of the test passwords matched for patient@telemed.ai")

    finally:
        session.close()

if __name__ == "__main__":
    check_users()
