"""
websocket_routes.py — FastAPI WebSocket Router for Push Notifications & Live Consultation Chat.
"""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional

from ..websocket_manager import ws_manager
from .. import database

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
            if raw_text == "ping":
                await websocket.send_text(json.dumps({"event": "pong"}))
                continue
            try:
                msg = json.loads(raw_text)
                evt_type = msg.get("event") or msg.get("type") or "chat_message"
                sender_id = msg.get("sender_id")
                content = msg.get("content")

                sender_name = msg.get("sender_name")
                sender_role = msg.get("sender_role")
                msg_id = msg.get("message_id")
                timestamp = msg.get("timestamp")

                # Handle Typing Indicators
                if evt_type in ("typing_start", "typing_stop"):
                    payload = {
                        "event": evt_type,
                        "type": evt_type,
                        "consultation_id": consultation_id,
                        "sender_id": sender_id,
                        "sender_name": sender_name,
                        "sender_role": sender_role
                    }
                    await ws_manager.broadcast_chat_message(consultation_id, payload, sender_ws=websocket)
                    continue

                # If direct WS chat message with content, persist to SQLite DB
                if evt_type == "chat_message" and content and sender_id:
                    try:
                        saved = database.send_consultation_message(
                            sender_user_id=sender_id,
                            consultation_id=consultation_id,
                            content=content
                        )
                        msg_id = saved["message_id"]
                        timestamp = saved["created_at"]
                        sender_name = saved["sender_name"]
                        sender_role = saved["sender_role"]
                    except Exception as err:
                        logger.warning(f"Note: direct WS message save handled via HTTP/WS sync: {err}")

                payload = {
                    "event": evt_type,
                    "type": evt_type,
                    "consultation_id": consultation_id,
                    "sender_id": sender_id,
                    "sender_name": sender_name,
                    "sender_role": sender_role,
                    "content": content,
                    "timestamp": timestamp,
                    "message_id": msg_id
                }
                # Broadcast live event to all chat room participants
                await ws_manager.broadcast_chat_message(consultation_id, payload)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect_chat(consultation_id, websocket)
    except Exception as e:
        logger.warning(f"Chat WebSocket error for consultation {consultation_id}: {e}")
        ws_manager.disconnect_chat(consultation_id, websocket)
