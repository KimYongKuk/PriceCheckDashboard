from supabase import Client

from fastapi import APIRouter, Depends, HTTPException, Query

from backend.api.dependencies import get_db
from backend.api.schemas import (
    PriceHistoryItem,
    LatestPriceResponse,
    PriceStatsResponse,
    RecentCollectionItem,
)
from backend import models

router = APIRouter(prefix="/prices", tags=["prices"])


@router.get("/recent", response_model=list[RecentCollectionItem])
def recent_collections(
    limit: int = Query(10, ge=1, le=100, description="최근 수집 건수"),
    db: Client = Depends(get_db),
):
    return models.get_recent_collections(db, limit=limit)


@router.get("/{product_id}", response_model=list[PriceHistoryItem])
def price_history(
    product_id: int,
    days: int = Query(30, ge=0, description="최근 N일 (0=전체)"),
    db: Client = Depends(get_db),
):
    product = models.get_product_by_id(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="해당 상품을 찾을 수 없습니다.")
    return models.get_price_history(db, product_id, days=days)


@router.get("/{product_id}/latest", response_model=LatestPriceResponse)
def latest_prices(
    product_id: int,
    db: Client = Depends(get_db),
):
    result = models.get_latest_prices(db, product_id)
    if result is None:
        raise HTTPException(status_code=404, detail="해당 상품을 찾을 수 없습니다.")
    return result


@router.get("/{product_id}/stats", response_model=PriceStatsResponse)
def price_stats(
    product_id: int,
    days: int = Query(30, ge=0, description="통계 산출 기간 (0=전체)"),
    db: Client = Depends(get_db),
):
    result = models.get_price_stats(db, product_id, days=days)
    if result is None:
        raise HTTPException(status_code=404, detail="해당 상품을 찾을 수 없습니다.")
    return result
