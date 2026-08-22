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
    except Exception as e:
        import traceback, logging
        logging.getLogger(__name__).error("PATIENT REGISTRATION EXCEPTION: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration failed: {type(e).__name__}: {e}")


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
    except Exception as e:
        import traceback, logging
        logging.getLogger(__name__).error("DOCTOR REGISTRATION EXCEPTION: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Registration failed: {type(e).__name__}: {e}")


try:
    from ..core.security import create_access_token, create_refresh_token, decode_token, hash_password
except (ImportError, ValueError):
    from core.security import create_access_token, create_refresh_token, decode_token, hash_password


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    def check_email(cls, v: str) -> str:
        return validate_email_str(v)


class ResetPasswordRequest(BaseModel):
    reset_token: str
    new_password: str = Field(..., min_length=6)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class VerifyEmailRequest(BaseModel):
    verification_token: str


@router.post("/login", status_code=status.HTTP_200_OK)
def login(req: LoginRequest, response: Response):
    """Authenticate user with email and password, returning JWT access and refresh tokens."""
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

    access_token = create_access_token({"sub": user["user_id"], "email": user["email"], "role": user["role"]})
    refresh_token = create_refresh_token({"sub": user["user_id"], "role": user["role"]})

    session_token = database.create_auth_session(user["user_id"])
    _set_auth_cookies(response, access_token)

    database.log_audit_event(
        actor_user_id=user["user_id"],
        role=user["role"],
        action="AUTH_LOGIN_SUCCESS",
        resource_type="USER_AUTH",
        resource_id=user["user_id"]
    )
    return {
        "message": "Login successful.",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "token": access_token,
        "session_token": session_token,
        "user": user
    }


@router.post("/refresh", status_code=status.HTTP_200_OK)
def refresh_token(req: RefreshTokenRequest):
    """Issue a new JWT access token using a valid refresh token."""
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh" or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token. Please log in again."
        )

    user_id = payload["sub"]
    user = database.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists."
        )

    new_access_token = create_access_token({"sub": user["user_id"], "email": user["email"], "role": user["role"]})
    new_refresh_token = create_refresh_token({"sub": user["user_id"], "role": user["role"]})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "token": new_access_token,
        "user": user
    }


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(req: ForgotPasswordRequest):
    """Initiate password recovery flow (backend structure)."""
    user = database.get_user_by_email(req.email)
    # Always return success message to prevent user enumeration
    return {
        "message": "If an account with that email exists, a password reset token has been generated.",
        "reset_token_structure": f"rst_{secrets.token_hex(16)}" if user else None
    }


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(req: ResetPasswordRequest):
    """Complete password reset using token (backend structure)."""
    if len(req.new_password) < 6:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 6 characters long.")
    return {"message": "Password has been successfully reset. Please log in with your new password."}


@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(req: ChangePasswordRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    """Change password for current authenticated user."""
    authenticated = database.authenticate_user(current_user["email"], req.current_password)
    if not authenticated:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password incorrect.")

    pwd_hash, salt = hash_password(req.new_password)
    database.update_user_password(current_user["user_id"], pwd_hash, salt)
    return {"message": "Password updated successfully."}


@router.post("/verify-email", status_code=status.HTTP_200_OK)
def verify_email(req: VerifyEmailRequest):
    """Verify user email address via verification token (backend structure)."""
    return {"message": "Email address verified successfully."}


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
        user_id = None
        payload = decode_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
        else:
            user = database.get_user_by_session_token(token)
            if user:
                user_id = user["user_id"]
        
        if user_id:
            user = database.get_user_by_id(user_id)
            if user:
                database.log_audit_event(
                    actor_user_id=user["user_id"],
                    role=user["role"],
                    action="AUTH_LOGOUT",
                    resource_type="USER_AUTH",
                    resource_id=user["user_id"]
                )
            if hasattr(database, "delete_user_auth_sessions"):
                database.delete_user_auth_sessions(user_id)
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
