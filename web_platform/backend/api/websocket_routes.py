"""
websocket_routes.py — FastAPI WebSocket Router for Push Notifications & Live Consultation Chat.
"""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional

from ..websocket_manager import ws_manager

logger = logging.getLogger("web_platform.websocket_routes")
router = APIRouter(tags=["Real-Time WebSockets"])


@router.websocket("/ws/notifications/{user_id}")
async def websocket_notifications_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time patient/doctor in-app push notifications.
    Events: AI_ANALYSIS_COMPLETED, DOCTOR_REVIEW_COMPLETED, APPOINTMENT_CONFIRMED, NEW_MESSAGE, NEW_REPORT.
    """
    await ws_manager.connect_user(user_id, websocket)
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "event": "CONNECTED",
            "user_id": user_id,
            "message": "Real-time notification channel active."
        }))
        while True:
            # Keep-alive heartbeat ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text(json.dumps({"event": "pong"}))
    except WebSocketDisconnect:
        ws_manager.disconnect_user(user_id, websocket)
    except Exception as e:
        logger.warning(f"Notification WebSocket error for user {user_id}: {e}")
        ws_manager.disconnect_user(user_id, websocket)


@router.websocket("/ws/chat/{consultation_id}")
async def websocket_chat_endpoint(websocket: WebSocket, consultation_id: str):
    """
    WebSocket endpoint for live patient-doctor consultation chat workspace.
    Events:
    - chat_message: Live message broadcast
    - typing_start / typing_stop: Live typing indicator
    - read_receipt: Message delivery/read confirmation
    """
    await ws_manager.connect_chat(consultation_id, websocket)
    try:
        await websocket.send_text(json.dumps({
            "event": "JOINED_CHAT",
            "consultation_id": consultation_id,
            "message": "Connected to live consultation room."
        }))
        while True:
            raw_text = await websocket.receive_text()
            try:
                msg = json.loads(raw_text)
                evt_type = msg.get("type", "chat_message")
                payload = {
                    "event": evt_type,
                    "consultation_id": consultation_id,
                    "sender_id": msg.get("sender_id"),
                    "sender_name": msg.get("sender_name"),
                    "content": msg.get("content"),
                    "timestamp": msg.get("timestamp"),
                    "message_id": msg.get("message_id")
                }
                # Broadcast live event to chat room participants
                await ws_manager.broadcast_chat_message(consultation_id, payload, sender_ws=websocket)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect_chat(consultation_id, websocket)
    except Exception as e:
        logger.warning(f"Chat WebSocket error for consultation {consultation_id}: {e}")
        ws_manager.disconnect_chat(consultation_id, websocket)
