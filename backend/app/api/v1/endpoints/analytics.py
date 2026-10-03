"""Executive Dashboard and Operations Analytics API Endpoints."""
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_current_tenant_id,
    get_current_user,
    require_warehouse_or_admin,
)
from app.models.user import User
from app.core.database import get_db
from app.schemas.analytics import (
    DashboardSummaryResponse,
    DemandForecastSummary,
    AutoDraftPORequest,
    AutoDraftPOResponse,
)
from app.services.analytics import analytics_service

router = APIRouter()


@router.get("/dashboard", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve comprehensive executive dashboard metrics backed by real SQL queries."""
    return await analytics_service.get_dashboard_summary(
        db, organization_id=organization_id
    )


@router.get("/demand-forecast", response_model=DemandForecastSummary)
async def get_demand_forecast(
    current_user: User = Depends(get_current_user),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve real-time algorithmic demand forecasting, days-of-inventory runway,
    sales velocity, and automated replenishment recommendations.
    """
    return await analytics_service.get_demand_forecast(
        db, organization_id=organization_id
    )


@router.post("/demand-forecast/auto-draft-po", response_model=AutoDraftPOResponse)
async def auto_draft_purchase_order(
    payload: AutoDraftPORequest,
    current_user: User = Depends(require_warehouse_or_admin),
    organization_id: UUID = Depends(get_current_tenant_id),
    db: AsyncSession = Depends(get_db),
):
    """
    1-Click Automated Replenishment: Automatically drafts a Purchase Order
    for a depleted or at-risk product with the primary supplier.
    """
    return await analytics_service.auto_draft_po(
        db, organization_id=organization_id, obj_in=payload
    )
