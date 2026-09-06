"""WebSocket Real-Time API Endpoint."""
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import ws_manager

router = APIRouter()


@router.websocket("/ws/{organization_id}")
async def websocket_endpoint(websocket: WebSocket, organization_id: UUID):
    """
    Establish a real-time WebSocket connection scoped to a specific tenant organization.
    Receives pings and responds with pongs to maintain liveness.
    """
    await ws_manager.connect(websocket, organization_id)
    try:
        # Send initial connection acknowledgment
        await websocket.send_json({
            "event": "CONNECTED",
            "data": {
                "organization_id": str(organization_id),
                "message": "Connected to FlowStock real-time stream.",
            },
        })

        while True:
            # Await client messages (e.g. heartbeat ping or queries)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            elif data == "status":
                await websocket.send_json({
                    "event": "STATUS",
                    "data": {
                        "active_connections": ws_manager.get_connection_count(organization_id)
                    },
                })
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, organization_id)
    except Exception:
        ws_manager.disconnect(websocket, organization_id)
