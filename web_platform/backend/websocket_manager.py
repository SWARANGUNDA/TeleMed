"""
websocket_manager.py — Real-Time WebSocket Connection Manager for TeleMed AI Platform.

Handles active client connections, user room subscriptions, and real-time event broadcasting
for push notifications, live chat messages, typing indicators, and online status.
"""

import json
import logging
from typing import Dict, List, Set, Any, Optional
from fastapi import WebSocket

logger = logging.getLogger("web_platform.websocket_manager")


class ConnectionManager:
    """Manages active WebSocket connections for push notifications and live consultation chat."""

    def __init__(self):
        # Map user_id -> list of active WebSockets
        self.active_user_connections: Dict[str, List[WebSocket]] = {}
        # Map consultation_id -> set of active WebSockets
        self.consultation_rooms: Dict[str, Set[WebSocket]] = {}

    async def connect_user(self, user_id: str, websocket: WebSocket):
        """Accept WebSocket connection and attach to user_id notification channel."""
        await websocket.accept()
        if user_id not in self.active_user_connections:
            self.active_user_connections[user_id] = []
        self.active_user_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected for user_id {user_id}. Total connections: {len(self.active_user_connections[user_id])}")

    def disconnect_user(self, user_id: str, websocket: WebSocket):
        """Disconnect WebSocket connection from user channel."""
        if user_id in self.active_user_connections:
            if websocket in self.active_user_connections[user_id]:
                self.active_user_connections[user_id].remove(websocket)
            if not self.active_user_connections[user_id]:
                del self.active_user_connections[user_id]
        logger.info(f"WebSocket disconnected for user_id {user_id}.")

    async def connect_chat(self, consultation_id: str, websocket: WebSocket):
        """Accept WebSocket connection and join consultation chat room."""
        await websocket.accept()
        if consultation_id not in self.consultation_rooms:
            self.consultation_rooms[consultation_id] = set()
        self.consultation_rooms[consultation_id].add(websocket)
        logger.info(f"WebSocket joined chat room {consultation_id}. Active participants: {len(self.consultation_rooms[consultation_id])}")

    def disconnect_chat(self, consultation_id: str, websocket: WebSocket):
        """Leave consultation chat room."""
        if consultation_id in self.consultation_rooms:
            self.consultation_rooms[consultation_id].discard(websocket)
            if not self.consultation_rooms[consultation_id]:
                del self.consultation_rooms[consultation_id]
        logger.info(f"WebSocket left chat room {consultation_id}.")

    async def send_user_notification(self, user_id: str, payload: Dict[str, Any]):
        """Send push notification message to all active WebSocket connections of a user."""
        if user_id in self.active_user_connections:
            msg_str = json.dumps(payload)
            for ws in list(self.active_user_connections[user_id]):
                try:
                    await ws.send_text(msg_str)
                except Exception as e:
                    logger.warning(f"Error sending WebSocket message to user {user_id}: {e}")

    async def broadcast_chat_message(self, consultation_id: str, payload: Dict[str, Any], sender_ws: Optional[WebSocket] = None):
        """Broadcast live message to all participants in a consultation chat room."""
        if consultation_id in self.consultation_rooms:
            msg_str = json.dumps(payload)
            for ws in list(self.consultation_rooms[consultation_id]):
                if ws != sender_ws:
                    try:
                        await ws.send_text(msg_str)
                    except Exception as e:
                        logger.warning(f"Error broadcasting chat message in room {consultation_id}: {e}")

    def get_online_users(self) -> List[str]:
        """Returns list of currently online user IDs with active WebSocket connections."""
        return list(self.active_user_connections.keys())


# Singleton instance
ws_manager = ConnectionManager()
