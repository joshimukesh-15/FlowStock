"""Automated Integration Tests for Phase 11: Notifications and Audit Log."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_and_read_notifications(async_client: AsyncClient):
    """Verify listing notifications, fetching unread count, and marking notifications as read."""
    # 1. Fetch initial unread count
    count_resp = await async_client.get("/api/v1/notifications/unread-count")
    assert count_resp.status_code == 200
    initial_unread = count_resp.json()["unread_count"]
    assert initial_unread >= 1

    # 2. Fetch list of notifications
    list_resp = await async_client.get("/api/v1/notifications")
    assert list_resp.status_code == 200
    notifs = list_resp.json()
    assert len(notifs) >= 1

    # 3. Mark the first unread notification as read
    target_notif = next((n for n in notifs if not n["is_read"]), notifs[0])
    notif_id = target_notif["id"]

    patch_resp = await async_client.patch(f"/api/v1/notifications/{notif_id}/read")
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["id"] == notif_id
    assert updated["is_read"] is True
    assert updated["read_at"] is not None

    # 4. Mark all as read
    mark_all_resp = await async_client.post("/api/v1/notifications/mark-all-read")
    assert mark_all_resp.status_code == 200
    assert mark_all_resp.json()["unread_count"] == 0

    # Verify unread count is now 0
    final_count = await async_client.get("/api/v1/notifications/unread-count")
    assert final_count.json()["unread_count"] == 0


@pytest.mark.asyncio
async def test_order_confirmation_triggers_audit_and_notification(async_client: AsyncClient):
    """Verify confirming an order automatically writes to audit trail and generates a notification."""
    # 1. Fetch a customer and warehouse
    cust_resp = await async_client.get("/api/v1/customers")
    assert cust_resp.status_code == 200
    customer = cust_resp.json()[0]

    prod_resp = await async_client.get("/api/v1/products")
    product = prod_resp.json()[0]

    # Ensure stock exists
    await async_client.post(
        "/api/v1/inventory/movement",
        json={
            "product_id": product["id"],
            "movement_type": "IN",
            "quantity": 10,
            "reference": "Stock for Audit Test",
        },
    )

    # 2. Create draft order
    order_payload = {
        "customer_id": customer["id"],
        "items": [
            {
                "product_id": product["id"],
                "quantity": 1,
                "unit_price": product["price"] or 150.0,
            }
        ],
    }
    create_order_resp = await async_client.post("/api/v1/orders", json=order_payload)
    assert create_order_resp.status_code == 201
    order = create_order_resp.json()

    # 3. Confirm order
    confirm_resp = await async_client.post(f"/api/v1/orders/{order['id']}/confirm")
    assert confirm_resp.status_code == 200

    # 4. Verify audit trail has ORDER_CONFIRMED entry
    audit_resp = await async_client.get(f"/api/v1/audit?entity_type=Order&action=ORDER_CONFIRMED")
    assert audit_resp.status_code == 200
    audits = audit_resp.json()
    order_audits = [a for a in audits if a["entity_name"] == order["order_number"]]
    assert len(order_audits) >= 1
    assert order_audits[0]["action"] == "ORDER_CONFIRMED"
    assert "reserved" in order_audits[0]["details"]

    # 5. Verify notification was created
    notif_resp = await async_client.get("/api/v1/notifications")
    assert notif_resp.status_code == 200
    matching_notifs = [n for n in notif_resp.json() if order["order_number"] in n["title"]]
    assert len(matching_notifs) >= 1
    assert matching_notifs[0]["type"] == "INFO"


@pytest.mark.asyncio
async def test_audit_and_notifications_multi_tenant_isolation(async_client: AsyncClient):
    """Verify complete multi-tenant isolation on audit logs and notifications."""
    orgs_resp = await async_client.get("/api/v1/organizations")
    assert orgs_resp.status_code == 200
    orgs = orgs_resp.json()
    acme = next((o for o in orgs if o["slug"] == "acme"), None)
    apex = next((o for o in orgs if o["slug"] == "apex"), None)
    assert acme is not None and apex is not None

    # Acme notifications
    acme_notifs_resp = await async_client.get(
        "/api/v1/notifications", headers={"X-Organization-Id": acme["id"]}
    )
    assert acme_notifs_resp.status_code == 200
    acme_notifs = acme_notifs_resp.json()
    assert len(acme_notifs) >= 1
    acme_notif_ids = {n["id"] for n in acme_notifs}

    # Apex notifications
    apex_notifs_resp = await async_client.get(
        "/api/v1/notifications", headers={"X-Organization-Id": apex["id"]}
    )
    assert apex_notifs_resp.status_code == 200
    apex_notifs = apex_notifs_resp.json()
    apex_notif_ids = {n["id"] for n in apex_notifs}

    # Verify no intersection of notification IDs
    assert acme_notif_ids.isdisjoint(apex_notif_ids)

    # Cross-tenant read modification should return 404
    sample_acme_notif_id = next(iter(acme_notif_ids))
    cross_tenant_patch = await async_client.patch(
        f"/api/v1/notifications/{sample_acme_notif_id}/read",
        headers={"X-Organization-Id": apex["id"]},
    )
    assert cross_tenant_patch.status_code == 404

    # Audit log isolation
    acme_audits_resp = await async_client.get(
        "/api/v1/audit", headers={"X-Organization-Id": acme["id"]}
    )
    assert acme_audits_resp.status_code == 200
    acme_audits = acme_audits_resp.json()
    acme_audit_ids = {a["id"] for a in acme_audits}

    apex_audits_resp = await async_client.get(
        "/api/v1/audit", headers={"X-Organization-Id": apex["id"]}
    )
    assert apex_audits_resp.status_code == 200
    apex_audits = apex_audits_resp.json()
    apex_audit_ids = {a["id"] for a in apex_audits}

    assert acme_audit_ids.isdisjoint(apex_audit_ids)
