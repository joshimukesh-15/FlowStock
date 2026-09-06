"""Automated Integration Tests for Phase 12: Background Jobs and Automation."""
from datetime import date, timedelta
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_available_jobs(async_client: AsyncClient):
    """Verify listing available automated jobs with schedule and metadata."""
    resp = await async_client.get("/api/v1/jobs/available")
    assert resp.status_code == 200
    jobs = resp.json()
    assert len(jobs) >= 3

    job_names = {j["name"] for j in jobs}
    assert "low_stock_scanner" in job_names
    assert "overdue_invoices_detector" in job_names
    assert "daily_digest" in job_names

    for j in jobs:
        assert j["title"]
        assert j["description"]
        assert j["schedule_interval"]


@pytest.mark.asyncio
async def test_trigger_low_stock_scanner_job(async_client: AsyncClient):
    """Verify manually triggering the low-stock replenishment scanner job."""
    resp = await async_client.post("/api/v1/jobs/low_stock_scanner/run")
    assert resp.status_code == 200
    data = resp.json()

    assert "low_stock_scanner" in data["message"]
    execution = data["job_execution"]
    assert execution["job_name"] == "low_stock_scanner"
    assert execution["status"] == "SUCCESS"
    assert execution["triggered_by"] == "MANUAL"
    assert execution["duration_ms"] is not None
    assert "Scanned" in execution["result_summary"]

    # Verify job appears in history list
    list_resp = await async_client.get("/api/v1/jobs")
    assert list_resp.status_code == 200
    history = list_resp.json()
    assert any(h["id"] == execution["id"] for h in history)


@pytest.mark.asyncio
async def test_trigger_overdue_invoices_job(async_client: AsyncClient):
    """Verify background job detects past-due invoices, transitions status to OVERDUE, and alerts finance."""
    # 1. Fetch customer
    cust_resp = await async_client.get("/api/v1/customers")
    assert cust_resp.status_code == 200
    customer = cust_resp.json()[0]

    # 2. Create an invoice with past due date
    past_date = str(date.today() - timedelta(days=7))
    invoice_payload = {
        "customer_id": customer["id"],
        "tax_rate": 18.0,
        "due_date": past_date,
        "notes": "Testing overdue background scanner",
        "items": [
            {
                "description": "Standard Industrial Bearing Set",
                "quantity": 2,
                "unit_price": 500.0,
            }
        ],
    }
    create_inv_resp = await async_client.post("/api/v1/invoices", json=invoice_payload)
    assert create_inv_resp.status_code == 201
    invoice = create_inv_resp.json()
    assert invoice["status"] == "ISSUED"

    # 3. Trigger overdue invoice detector job
    job_resp = await async_client.post("/api/v1/jobs/overdue_invoices_detector/run")
    assert job_resp.status_code == 200
    job_data = job_resp.json()
    assert job_data["job_execution"]["status"] == "SUCCESS"

    # 4. Fetch invoice again and verify transitioned to OVERDUE
    check_inv_resp = await async_client.get(f"/api/v1/invoices/{invoice['id']}")
    assert check_inv_resp.status_code == 200
    updated_inv = check_inv_resp.json()
    assert updated_inv["status"] == "OVERDUE"

    # 5. Verify notification was created for overdue invoice
    notifs_resp = await async_client.get("/api/v1/notifications")
    assert notifs_resp.status_code == 200
    notifs = notifs_resp.json()
    matching_notifs = [n for n in notifs if invoice["invoice_number"] in n["title"] or invoice["invoice_number"] in n["message"]]
    assert len(matching_notifs) >= 1
    assert matching_notifs[0]["type"] == "DANGER"


@pytest.mark.asyncio
async def test_jobs_multi_tenant_isolation(async_client: AsyncClient):
    """Verify tenant isolation on job executions."""
    orgs_resp = await async_client.get("/api/v1/organizations")
    assert orgs_resp.status_code == 200
    orgs = orgs_resp.json()
    acme = next((o for o in orgs if o["slug"] == "acme"), None)
    apex = next((o for o in orgs if o["slug"] == "apex"), None)
    assert acme is not None and apex is not None

    # Run a job under Acme
    acme_run = await async_client.post(
        "/api/v1/jobs/daily_digest/run",
        headers={"X-Organization-Id": acme["id"]},
    )
    assert acme_run.status_code == 200
    acme_job_id = acme_run.json()["job_execution"]["id"]

    # Fetch Acme jobs
    acme_jobs_resp = await async_client.get(
        "/api/v1/jobs", headers={"X-Organization-Id": acme["id"]}
    )
    assert acme_jobs_resp.status_code == 200
    acme_job_ids = {j["id"] for j in acme_jobs_resp.json()}
    assert acme_job_id in acme_job_ids

    # Fetch Apex jobs
    apex_jobs_resp = await async_client.get(
        "/api/v1/jobs", headers={"X-Organization-Id": apex["id"]}
    )
    assert apex_jobs_resp.status_code == 200
    apex_job_ids = {j["id"] for j in apex_jobs_resp.json()}
    assert acme_job_id not in apex_job_ids
