"""
consultation_routes.py — REST API Endpoints for Consultation Requests, Doctor Assignment & Controlled Health Record Consent Access.

Enforces:
- Patient consultation request creation and record selection
- Admin consultation queue & VERIFIED doctor assignment (Metadata only, zero clinical data)
- Doctor assignment response (ACCEPT / DECLINE)
- Authorized READ-ONLY doctor access to explicitly shared health records
- Immediate termination on revocation, reassignment, completion, cancellation, or doctor suspension
- Immutable audit trail
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field

from ..auth import get_current_user, require_role
from .. import database

router = APIRouter(tags=["Consultations & Controlled Access"])

require_patient_user = require_role(["PATIENT"])
require_doctor_user = require_role(["DOCTOR"])
require_admin_user = require_role(["ADMIN"])


class CreateConsultationRequest(BaseModel):
    specialization: str = Field(..., description="Requested medical specialization")
    category: str = Field("General Consultation", description="Consultation category")
    reason: str = Field(..., description="Reason for consultation request")
    urgency: str = Field("ROUTINE", description="Urgency: ROUTINE or SOON")
    message: Optional[str] = Field(None, description="Optional patient message")
    record_ids: Optional[List[str]] = Field(default=[], description="List of health record IDs to share")


class AssignDoctorRequest(BaseModel):
    doctor_id: str = Field(..., description="Target VERIFIED doctor ID")
    notes: Optional[str] = Field(None, description="Admin assignment notes")


class DoctorRespondRequest(BaseModel):
    action: str = Field(..., description="Action: ACCEPT or DECLINE")
    reason: Optional[str] = Field(None, description="Reason for response")


class CompleteConsultationRequest(BaseModel):
    notes: Optional[str] = Field(None, description="Completion summary notes")


# ------------------------------------------------------------------
# Patient Consultation Endpoints
# ------------------------------------------------------------------

@router.post("/api/v1/consultations", status_code=status.HTTP_201_CREATED)
def create_consultation(
    req: CreateConsultationRequest,
    current_user: dict = Depends(require_patient_user)
):
    """Patient creates a new consultation request with selected shared record IDs."""
    try:
        detail = database.create_consultation_request(
            user_id=current_user["user_id"],
            specialization=req.specialization,
            category=req.category,
            reason=req.reason,
            urgency=req.urgency,
            message=req.message,
            record_ids=req.record_ids
        )
        return {
            "message": "Consultation request created successfully.",
            "consultation": detail
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/v1/consultations", status_code=status.HTTP_200_OK)
def list_patient_consultations(current_user: dict = Depends(require_patient_user)):
    """List all consultation requests owned by the authenticated patient."""
    consultations = database.list_patient_consultations(current_user["user_id"])
    return {
        "count": len(consultations),
        "consultations": consultations
    }


@router.get("/api/v1/consultations/{consultation_id}", status_code=status.HTTP_200_OK)
def get_patient_consultation_detail(
    consultation_id: str,
    current_user: dict = Depends(require_patient_user)
):
    """Fetch detailed snapshot of a patient's consultation request."""
    detail = database.get_patient_consultation_detail(current_user["user_id"], consultation_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Consultation request not found or access denied.")
    return {"consultation": detail}


@router.post("/api/v1/consultations/{consultation_id}/cancel", status_code=status.HTTP_200_OK)
def cancel_patient_consultation(
    consultation_id: str,
    req: Optional[CompleteConsultationRequest] = None,
    current_user: dict = Depends(require_patient_user)
):
    """Patient cancels a pending or assigned consultation request."""
    try:
        reason_text = req.notes if req else None
        updated = database.cancel_patient_consultation(current_user["user_id"], consultation_id, reason=reason_text)
        return {
            "message": "Consultation request cancelled successfully.",
            "consultation": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/v1/consultations/{consultation_id}/records/{record_id}/revoke", status_code=status.HTTP_200_OK)
def revoke_shared_record(
    consultation_id: str,
    record_id: str,
    current_user: dict = Depends(require_patient_user)
):
    """Patient revokes access to a specific shared health record."""
    try:
        updated = database.revoke_shared_record_consent(current_user["user_id"], consultation_id, record_id)
        return {
            "message": f"Consent revoked for health record '{record_id}'.",
            "consultation": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ------------------------------------------------------------------
# Admin Queue & Assignment Endpoints
# ------------------------------------------------------------------

@router.get("/api/v1/admin/consultations", status_code=status.HTTP_200_OK)
def list_admin_consultations(
    verification_status: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(require_admin_user)
):
    """Admin Queue: List consultation requests with assignment metadata only (zero clinical data)."""
    filter_val = status or verification_status
    consultations = database.list_admin_consultations(status_filter=filter_val, search_query=search)
    return {
        "count": len(consultations),
        "consultations": consultations
    }


@router.post("/api/v1/admin/consultations/{consultation_id}/assign", status_code=status.HTTP_200_OK)
def assign_doctor(
    consultation_id: str,
    req: AssignDoctorRequest,
    current_user: dict = Depends(require_admin_user)
):
    """Admin assigns or reassigns a VERIFIED doctor to a consultation request."""
    try:
        updated = database.assign_doctor_to_consultation(
            admin_user_id=current_user["user_id"],
            consultation_id=consultation_id,
            doctor_id=req.doctor_id,
            notes=req.notes
        )
        return {
            "message": f"Doctor assigned successfully to consultation '{consultation_id}'.",
            "consultation": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/v1/admin/consultations/{consultation_id}/cancel", status_code=status.HTTP_200_OK)
def admin_cancel_consultation(
    consultation_id: str,
    req: Optional[CompleteConsultationRequest] = None,
    current_user: dict = Depends(require_admin_user)
):
    """Admin cancels a consultation request."""
    try:
        reason_text = req.notes if req else "Cancelled by admin"
        # Find patient user_id
        conn = database.get_db_connection()
        try:
            row = conn.execute("SELECT user_id FROM consultations WHERE consultation_id = ?", (consultation_id,)).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Consultation not found.")
            patient_user_id = row["user_id"]
        finally:
            conn.close()

        updated = database.cancel_patient_consultation(patient_user_id, consultation_id, reason=reason_text)
        return {
            "message": "Consultation cancelled by admin.",
            "consultation": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ------------------------------------------------------------------
# Doctor Workspace & Controlled Clinical Access Endpoints
# ------------------------------------------------------------------

@router.get("/api/v1/doctor/consultations", status_code=status.HTTP_200_OK)
def list_doctor_consultations(
    verification_status: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_doctor_user)
):
    """Doctor Workspace: List assigned consultations (Pending Acceptance, Active, Completed)."""
    filter_val = status or verification_status
    consultations = database.list_doctor_consultations(
        doctor_user_id=current_user["user_id"],
        status_filter=filter_val
    )
    return {
        "count": len(consultations),
        "consultations": consultations
    }


@router.post("/api/v1/doctor/consultations/{consultation_id}/respond", status_code=status.HTTP_200_OK)
def respond_to_assignment(
    consultation_id: str,
    req: DoctorRespondRequest,
    current_user: dict = Depends(require_doctor_user)
):
    """Doctor accepts or declines an assigned consultation."""
    try:
        res = database.respond_to_doctor_assignment(
            doctor_user_id=current_user["user_id"],
            consultation_id=consultation_id,
            action=req.action,
            reason=req.reason
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/v1/doctor/consultations/{consultation_id}/records/{record_id}", status_code=status.HTTP_200_OK)
def get_authorized_patient_record(
    consultation_id: str,
    record_id: str,
    current_user: dict = Depends(require_doctor_user)
):
    """
    Doctor Authorized Clinical View: Read-only access to an explicitly shared health record.
    Strictly validates: Doctor VERIFIED & not SUSPENDED, assigned doctor, consultation ACCEPTED/ACTIVE, record explicitly shared, consent not REVOKED.
    """
    record = database.get_doctor_authorized_patient_record(
        doctor_user_id=current_user["user_id"],
        consultation_id=consultation_id,
        record_id=record_id
    )

    if not record:
        raise HTTPException(
            status_code=403,
            detail="Clinical access denied. Verify that your doctor account is VERIFIED, consultation assignment is active, and consent is granted for this health record."
        )

    return {
        "status": "SUCCESS",
        "record": record
    }


@router.post("/api/v1/doctor/consultations/{consultation_id}/complete", status_code=status.HTTP_200_OK)
def complete_consultation(
    consultation_id: str,
    req: Optional[CompleteConsultationRequest] = None,
    current_user: dict = Depends(require_doctor_user)
):
    """Doctor marks a consultation complete, closing active clinical record access."""
    try:
        reason_text = req.notes if req else None
        res = database.complete_consultation(
            user_id_or_admin_id=current_user["user_id"],
            consultation_id=consultation_id,
            actor_role="DOCTOR",
            notes=reason_text
        )
        return {
            "message": "Consultation completed successfully. Clinical access closed.",
            "consultation": res
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ------------------------------------------------------------------
# Level 7C: Secure Consultation Messaging & Doctor Clinical Notes
# ------------------------------------------------------------------

class SendMessageRequest(BaseModel):
    content: str = Field(..., description="Message content string")


class SaveConsultationNoteRequest(BaseModel):
    assessment: str = Field(..., description="Doctor clinical assessment / observations")
    follow_up_guidance: Optional[str] = Field(None, description="Follow-up guidance or instructions")
    patient_summary: str = Field(..., description="Patient-visible consultation summary")


@router.post("/api/v1/consultations/{consultation_id}/messages", status_code=status.HTTP_201_CREATED)
def send_consultation_message(
    consultation_id: str,
    req: SendMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a secure consultation message (Patient owner or assigned VERIFIED doctor only).
    Admin role is strictly prohibited from accessing clinical messaging.
    """
    try:
        msg = database.send_consultation_message(
            sender_user_id=current_user["user_id"],
            consultation_id=consultation_id,
            content=req.content
        )
        return {
            "message": "Message sent successfully.",
            "data": msg
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/v1/consultations/{consultation_id}/messages", status_code=status.HTTP_200_OK)
def list_consultation_messages(
    consultation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    List messages for a consultation (Patient owner or assigned VERIFIED doctor only).
    Admin role is strictly prohibited from accessing clinical messages.
    """
    try:
        messages = database.list_consultation_messages(
            user_id=current_user["user_id"],
            consultation_id=consultation_id
        )
        return {
            "count": len(messages),
            "messages": messages
        }
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/api/v1/doctor/consultations/{consultation_id}/notes", status_code=status.HTTP_200_OK)
def save_doctor_consultation_note(
    consultation_id: str,
    req: SaveConsultationNoteRequest,
    current_user: dict = Depends(require_doctor_user)
):
    """
    Doctor creates or updates a clinical consultation note (Assigned VERIFIED doctor only).
    """
    try:
        note = database.upsert_doctor_consultation_note(
            doctor_user_id=current_user["user_id"],
            consultation_id=consultation_id,
            assessment=req.assessment,
            follow_up_guidance=req.follow_up_guidance,
            patient_summary=req.patient_summary
        )
        return {
            "message": "Doctor clinical note saved successfully.",
            "note": note
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/v1/consultations/{consultation_id}/notes", status_code=status.HTTP_200_OK)
def get_consultation_note(
    consultation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch doctor clinical consultation note (Patient owner or assigned VERIFIED doctor only).
    Admin role is strictly prohibited from accessing clinical notes.
    """
    try:
        note = database.get_consultation_note(
            user_id=current_user["user_id"],
            consultation_id=consultation_id
        )
        return {
            "note": note
        }
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
