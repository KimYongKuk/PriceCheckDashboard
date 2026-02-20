from supabase import Client

from fastapi import APIRouter, Depends

from backend.api.dependencies import get_db
from backend.api.schemas import DashboardSummaryResponse
from backend import models

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def dashboard_summary(
    db: Client = Depends(get_db),
):
    return models.get_dashboard_summary(db)
