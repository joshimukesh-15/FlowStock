"""Executive Dashboard and Operations Analytics API Endpoints."""
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_tenant_id, get_current_user
from app.models.user import User
from app.core.database import get_db
from app.schemas.analytics import DashboardSummaryResponse
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
