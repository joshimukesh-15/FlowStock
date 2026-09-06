"""In-Memory Multi-Tenant WebSocket Connection Manager."""
from collections import defaultdict
from typing import Dict, Set, Any
from uuid import UUID
from fastapi import WebSocket


class ConnectionManager:
    """Manages active WebSocket connections grouped by tenant (organization_id)."""

    def __init__(self) -> None:
        self.active_connections: Dict[UUID, Set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket, organization_id: UUID) -> None:
        """Accept incoming connection and register under tenant."""
        await websocket.accept()
        self.active_connections[organization_id].add(websocket)

    def disconnect(self, websocket: WebSocket, organization_id: UUID) -> None:
        """Unregister websocket connection."""
        if organization_id in self.active_connections:
            self.active_connections[organization_id].discard(websocket)
            if not self.active_connections[organization_id]:
                del self.active_connections[organization_id]

    async def broadcast_to_tenant(self, organization_id: UUID, message: dict[str, Any]) -> None:
        """Broadcast JSON message to all active WebSocket connections of a specific tenant."""
        if organization_id not in self.active_connections:
            return

        dead_connections: Set[WebSocket] = set()
        for connection in list(self.active_connections[organization_id]):
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)

        for dead in dead_connections:
            self.disconnect(dead, organization_id)

    def get_connection_count(self, organization_id: UUID) -> int:
        """Return number of active connections for a tenant."""
        return len(self.active_connections.get(organization_id, set()))


ws_manager = ConnectionManager()
