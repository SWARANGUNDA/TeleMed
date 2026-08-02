"""
auth_routes.py — FastAPI Endpoints for User Registration, Authentication, and Session Management.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field, field_validator
import re
from .. import database
from ..auth import get_current_user
from ..security import validate_password_strength, filter_profile_update, sanitize_string

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & Profile Management"])

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def validate_email_str(v: str) -> str:
    v = v.strip().lower()
    if not EMAIL_REGEX.match(v):
        raise ValueError("Invalid email address format.")
    return v


class PatientRegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="Password (minimum 6 characters)")
    full_name: str = Field(..., min_length=2)
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(None, gt=0, lt=300)
    weight_kg: Optional[float] = Field(None, gt=0, lt=500)
    contact_number: Optional[str] = ""

    @field_validator("email")

    def check_email(cls, v: str) -> str:
        return validate_email_str(v)


class DoctorRegisterRequest(BaseModel):
    email: str = Field(..., description="Doctor email address")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters, must include upper, lower, digit, special)")
    full_name: str = Field(..., min_length=2, max_length=100)
    specialization: str = Field(..., min_length=2)
    registration_number: str = Field(..., min_length=3, description="Medical License / Registration Identifier")
    experience_years: int = Field(0, ge=0, le=70)
    contact_number: Optional[str] = ""
    hospital_affiliation: Optional[str] = ""

    @field_validator("email")

    def check_email(cls, v: str) -> str:
        return validate_email_str(v)


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")

    def check_email(cls, v: str) -> str:
        return validate_email_str(v)


class AdminBootstrapRequest(BaseModel):
    bootstrap_key: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = "System Administrator"


import secrets
from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Request, Response, status

from .. import config, database
from ..security import validate_password_strength
from ..auth import get_current_user


def _set_auth_cookies(response: Response, token: str):
    csrf_token = secrets.token_hex(16)
    response.set_cookie(
        key="telemed_auth_token",
        value=token,
        httponly=True,
        samesite="lax",
        path="/",
        secure=config.IS_PRODUCTION
    )
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,
        samesite="lax",
        path="/",
        secure=config.IS_PRODUCTION
    )


@router.post("/register/patient", status_code=status.HTTP_201_CREATED)
def register_patient(req: PatientRegisterRequest, response: Response):
    """Register a new patient account and initialize patient profile."""
    # Level 11: Enforce strong password policy
    valid, pwd_msg = validate_password_strength(req.password)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=pwd_msg)
    try:
        profile_data = req.model_dump()
        user = database.create_user(
            email=req.email,
            password=req.password,
            role="PATIENT",
            profile_data=profile_data
        )
        token = database.create_auth_session(user["user_id"])
        _set_auth_cookies(response, token)
        return {
            "message": "Patient registration successful.",
            "token": token,
            "user": user
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed. Please try again.")


@router.post("/register/doctor", status_code=status.HTTP_201_CREATED)
def register_doctor(req: DoctorRegisterRequest, response: Response):
    """
    Register a new doctor account and professional profile foundation.
    Newly registered doctors default to PENDING verification status and cannot access patient data.
    """
    # Level 11: Enforce strong password policy
    valid, pwd_msg = validate_password_strength(req.password)
    if not valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=pwd_msg)
    try:
        profile_data = req.model_dump()
        user = database.create_user(
            email=req.email,
            password=req.password,
            role="DOCTOR",
            profile_data=profile_data
        )
        token = database.create_auth_session(user["user_id"])
        _set_auth_cookies(response, token)
        return {
            "message": "Doctor registration successful. Account is PENDING admin verification.",
            "token": token,
            "user": user
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed. Please try again.")


@router.post("/login", status_code=status.HTTP_200_OK)
def login(req: LoginRequest, response: Response):
    """Authenticate user with email and password, returning active auth token."""
    user = database.authenticate_user(req.email, req.password)
    if not user:
        database.log_audit_event(
            actor_user_id="ANONYMOUS",
            role="ANONYMOUS",
            action="AUTH_LOGIN_FAILED",
            resource_type="USER_AUTH",
            outcome="FAILED",
            context={"email": req.email}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password."
        )

    token = database.create_auth_session(user["user_id"])
    _set_auth_cookies(response, token)
    database.log_audit_event(
        actor_user_id=user["user_id"],
        role=user["role"],
        action="AUTH_LOGIN_SUCCESS",
        resource_type="USER_AUTH",
        resource_id=user["user_id"]
    )
    return {
        "message": "Login successful.",
        "token": token,
        "user": user
    }


@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    response: Response,
    authorization: Optional[str] = Header(None),
    x_session_token: Optional[str] = Header(None),
    telemed_auth_token: Optional[str] = Cookie(None)
):
    """Revoke and purge current user authentication session token."""
    token: Optional[str] = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    elif x_session_token:
        token = x_session_token.strip()
    elif telemed_auth_token:
        token = telemed_auth_token.strip()

    if token:
        user = database.get_user_by_session_token(token)
        if user:
            database.log_audit_event(
                actor_user_id=user["user_id"],
                role=user["role"],
                action="AUTH_LOGOUT",
                resource_type="USER_AUTH",
                resource_id=user["user_id"]
            )
        database.delete_auth_session(token)

    response.delete_cookie(key="telemed_auth_token", path="/")
    response.delete_cookie(key="csrf_token", path="/")
    return {"message": "Logout successful."}


@router.get("/me", status_code=status.HTTP_200_OK)
def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetch profile and active session details for current authenticated user."""
    return {"user": current_user}


@router.put("/profile", status_code=status.HTTP_200_OK)
def update_profile(
    body: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update demographic/contact profile fields for authenticated patient or doctor with strict backend field whitelisting."""
    role = current_user.get("role")
    if role not in ("PATIENT", "DOCTOR"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only patient and doctor profiles can be updated via this endpoint.")

    # Level 11: Strip privilege escalation fields
    safe_body = filter_profile_update(body)
    if not safe_body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid updatable fields provided.")

    try:
        if role == "DOCTOR":
            updated_user = database.update_doctor_profile(current_user["user_id"], safe_body)
        else:
            updated_user = database.update_patient_profile(current_user["user_id"], safe_body)
        return {
            "message": "Profile updated successfully.",
            "user": updated_user
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


from .. import database, config
from ..auth import get_current_user


@router.post("/bootstrap-admin", status_code=status.HTTP_200_OK)
def bootstrap_initial_admin(
    req: Optional[AdminBootstrapRequest] = None,
    x_bootstrap_key: Optional[str] = Header(None)
):
    """
    Secure administration bootstrap endpoint.
    Allowed ONLY under explicit secure development/bootstrap configuration (e.g. env-controlled).
    Rejects requests in default/production mode, and permanently locks once an admin account exists.
    """
    key_provided = req.bootstrap_key if (req and req.bootstrap_key) else x_bootstrap_key
    env_enabled = config.ALLOW_ADMIN_BOOTSTRAP
    key_valid = bool(config.ADMIN_BOOTSTRAP_KEY) and (key_provided == config.ADMIN_BOOTSTRAP_KEY)

    if not (env_enabled or key_valid):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin bootstrap endpoint is disabled in default runtime configuration. Set TELEMED_ALLOW_ADMIN_BOOTSTRAP=true or supply valid bootstrap key."
        )

    b_email = (req.email if req and req.email else config.DEMO_ADMIN_EMAIL).strip().lower()
    b_pass = req.password if (req and req.password) else config.DEMO_ADMIN_PASSWORD
    b_name = req.full_name if (req and req.full_name) else "System Administrator"

    success, msg, admin_user = database.bootstrap_admin(
        email=b_email,
        password=b_pass,
        full_name=b_name
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=msg
        )

    return {
        "message": msg,
        "admin": admin_user
    }
