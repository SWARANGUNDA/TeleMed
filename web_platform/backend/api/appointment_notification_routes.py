"""
appointment_notification_routes.py — FastAPI Endpoints for Level 8 Appointment Scheduling & In-App Notifications.
Strictly enforces RBAC and recipient privacy boundaries.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from .. import database
from ..auth import get_current_user, require_role

router = APIRouter(prefix="/api/v1", tags=["Level 8: Appointments & Notifications"])


class AvailabilitySlotItem(BaseModel):
    slot_start: str = Field(..., description="UTC Start ISO string")
    slot_end: str = Field(..., description="UTC End ISO string")


class ConfigureAvailabilityRequest(BaseModel):
    slots: List[AvailabilitySlotItem]


class BookAppointmentRequest(BaseModel):
    consultation_id: str = Field(..., description="Active consultation ID")
    slot_id: str = Field(..., description="Available doctor slot ID")
    notes: Optional[str] = Field(None, description="Optional booking notes")


class UpdateAppointmentStatusRequest(BaseModel):
    status: str = Field(..., description="CONFIRMED, COMPLETED, CANCELLED, RESCHEDULED")
    reason: Optional[str] = Field(None, description="Reason for cancellation or reschedule")
    new_slot_id: Optional[str] = Field(None, description="New slot ID if rescheduling")


# ------------------------------------------------------------------
# Notifications Endpoints
# ------------------------------------------------------------------

@router.get("/notifications", status_code=status.HTTP_200_OK)
def get_notifications(
    unread_only: bool = False,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Fetch persistent in-app notifications for the authenticated user."""
    notifs = database.get_user_notifications(current_user["user_id"], unread_only=unread_only)
    unread_count = sum(1 for n in notifs if n["is_read"] == 0)
    return {
        "status": "SUCCESS",
        "unread_count": unread_count,
        "notifications": notifs
    }


@router.post("/notifications/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Mark a notification as read."""
    success = database.mark_notification_read(current_user["user_id"], notification_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    return {"status": "SUCCESS", "message": "Notification marked as read."}


@router.post("/notifications/read-all", status_code=status.HTTP_200_OK)
def mark_all_notifications_read(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Mark all notifications as read for current user."""
    count = database.mark_all_notifications_read(current_user["user_id"])
    return {"status": "SUCCESS", "marked_read_count": count}


# ------------------------------------------------------------------
# Doctor Availability Endpoints
# ------------------------------------------------------------------

@router.post("/doctor/availability", status_code=status.HTTP_201_CREATED)
def configure_doctor_availability(
    req: ConfigureAvailabilityRequest,
    current_user: Dict[str, Any] = Depends(require_role(["DOCTOR"]))
):
    """Configure availability slots for a VERIFIED doctor."""
    try:
        slots_list = [s.model_dump() for s in req.slots]
        all_slots = database.set_doctor_availability_slots(current_user["user_id"], slots_list)
        return {
            "status": "SUCCESS",
            "message": f"Successfully configured availability slots.",
            "slots": all_slots
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/doctors", status_code=status.HTTP_200_OK)
def list_verified_doctors(
    specialization: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List verified doctors for patient appointment booking and specialist consultation."""
    doctors = database.list_doctors(status="VERIFIED")
    if specialization and specialization.upper() != "ALL":
        doctors = [d for d in doctors if d.get("doctor_profile", {}).get("specialization") == specialization]
    return {
        "status": "SUCCESS",
        "doctors": doctors
    }


@router.get("/doctors/{doctor_id}/availability", status_code=status.HTTP_200_OK)
def list_doctor_availability(
    doctor_id: str,
    available_only: bool = True,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List available consultation slots for a specific doctor."""
    slots = database.list_doctor_availability_slots(doctor_id, available_only=available_only)
    return {
        "status": "SUCCESS",
        "doctor_id": doctor_id,
        "slots": slots
    }


# ------------------------------------------------------------------
# Appointment Endpoints
# ------------------------------------------------------------------

@router.post("/appointments", status_code=status.HTTP_201_CREATED)
def book_consultation_appointment(
    req: BookAppointmentRequest,
    current_user: Dict[str, Any] = Depends(require_role(["PATIENT"]))
):
    """Patient books a consultation appointment slot."""
    try:
        apt = database.book_appointment(
            user_id=current_user["user_id"],
            consultation_id=req.consultation_id,
            slot_id=req.slot_id,
            notes=req.notes or ""
        )
        return {
            "status": "SUCCESS",
            "message": "Appointment successfully booked.",
            "appointment": apt
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/appointments", status_code=status.HTTP_200_OK)
def list_user_appointments(
    status_filter: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """List appointments for Patient, Doctor, or Admin."""
    apts = database.list_user_appointments(
        user_id=current_user["user_id"],
        role=current_user["role"],
        status_filter=status_filter
    )
    return {
        "status": "SUCCESS",
        "count": len(apts),
        "appointments": apts
    }


@router.post("/appointments/{appointment_id}/status", status_code=status.HTTP_200_OK)
def update_appointment_status(
    appointment_id: str,
    req: UpdateAppointmentStatusRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Cancel, complete, or reschedule an appointment."""
    try:
        apt = database.update_appointment_status(
            user_id=current_user["user_id"],
            role=current_user["role"],
            appointment_id=appointment_id,
            new_status=req.status,
            reason=req.reason,
            new_slot_id=req.new_slot_id
        )
        return {
            "status": "SUCCESS",
            "message": f"Appointment status updated to '{req.status}'.",
            "appointment": apt
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
