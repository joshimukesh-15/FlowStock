"""Automated Tests for Real-Time WebSockets (Phase 13)."""
import pytest
from uuid import UUID
from starlette.testclient import TestClient
from app.main import app
from app.core.websocket_manager import ws_manager
from app.core.database import AsyncSessionLocal
from app.services.notification import notification_service

ORG_A = "00000000-0000-0000-0000-000000000001"
ORG_B = "00000000-0000-0000-0000-000000000002"


def test_websocket_connect_and_heartbeat():
    """Verify client connects and can exchange heartbeat ping/pong."""
    client = TestClient(app)
    with client.websocket_connect(f"/api/v1/ws/{ORG_A}") as websocket:
        # Initial connect message
        init_data = websocket.receive_json()
        assert init_data["event"] == "CONNECTED"
        assert init_data["data"]["organization_id"] == ORG_A

        # Heartbeat ping
        websocket.send_text("ping")
        pong = websocket.receive_text()
        assert pong == "pong"

        # Status query
        websocket.send_text("status")
        status_data = websocket.receive_json()
        assert status_data["event"] == "STATUS"
        assert status_data["data"]["active_connections"] >= 1


@pytest.mark.asyncio
async def test_websocket_broadcast_and_isolation():
    """Verify messages broadcast to Tenant A are received by Tenant A and not Tenant B."""
    tenant_a_uuid = UUID(ORG_A)
    tenant_b_uuid = UUID(ORG_B)

    client = TestClient(app)
    with client.websocket_connect(f"/api/v1/ws/{ORG_A}") as ws_a:
        ws_a.receive_json()  # Consume CONNECTED

        with client.websocket_connect(f"/api/v1/ws/{ORG_B}") as ws_b:
            ws_b.receive_json()  # Consume CONNECTED

            # Broadcast to Tenant A
            test_payload = {
                "event": "TEST_NOTIFICATION",
                "data": {"title": "Real-Time Test Alert", "amount": 5000},
            }
            await ws_manager.broadcast_to_tenant(tenant_a_uuid, test_payload)

            # Tenant A receives the message
            received_a = ws_a.receive_json()
            assert received_a["event"] == "TEST_NOTIFICATION"
            assert received_a["data"]["title"] == "Real-Time Test Alert"

            # Tenant B confirms isolation (ping/pong returns immediately without leaked message)
            ws_b.send_text("ping")
            pong_b = ws_b.receive_text()
            assert pong_b == "pong"


@pytest.mark.asyncio
async def test_notification_creation_broadcasts_websocket():
    """Verify creating a notification automatically emits NOTIFICATION_CREATED over WebSocket."""
    tenant_a_uuid = UUID(ORG_A)
    client = TestClient(app)
    with client.websocket_connect(f"/api/v1/ws/{ORG_A}") as ws_a:
        ws_a.receive_json()  # Consume CONNECTED

        async with AsyncSessionLocal() as session:
            notif = await notification_service.create_notification(
                session,
                organization_id=tenant_a_uuid,
                title="Low Stock Alert: SKU-PKG-01",
                message="Product stock is below reorder point.",
                type="WARNING",
                link="/inventory",
            )
            assert notif.id is not None

        # Confirm WebSocket received the real-time event
        msg = ws_a.receive_json()
        assert msg["event"] == "NOTIFICATION_CREATED"
        assert msg["data"]["title"] == "Low Stock Alert: SKU-PKG-01"
        assert msg["data"]["type"] == "WARNING"


@pytest.mark.asyncio
async def test_order_and_inventory_websocket_events():
    """Verify order and inventory events are correctly routed to tenant websockets."""
    tenant_a_uuid = UUID(ORG_A)
    client = TestClient(app)
    with client.websocket_connect(f"/api/v1/ws/{ORG_A}") as ws_a:
        ws_a.receive_json()  # Consume CONNECTED

        # Broadcast order event
        await ws_manager.broadcast_to_tenant(tenant_a_uuid, {
            "event": "ORDER_UPDATED",
            "data": {
                "order_number": "SO-LIVE-01",
                "status": "CONFIRMED",
                "total_amount": 7500.0,
                "action": "CONFIRMED",
            },
        })
        order_msg = ws_a.receive_json()
        assert order_msg["event"] == "ORDER_UPDATED"
        assert order_msg["data"]["order_number"] == "SO-LIVE-01"

        # Broadcast inventory event
        await ws_manager.broadcast_to_tenant(tenant_a_uuid, {
            "event": "INVENTORY_UPDATED",
            "data": {
                "sku": "SKU-TEST-01",
                "movement_type": "IN",
                "quantity_change": 50,
                "new_stock": 150,
            },
        })
        inv_msg = ws_a.receive_json()
        assert inv_msg["event"] == "INVENTORY_UPDATED"
        assert inv_msg["data"]["quantity_change"] == 50
