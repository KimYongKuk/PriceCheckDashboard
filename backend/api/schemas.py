from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class ProductCreate(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=100)
    target_price: int | None = Field(None, gt=0)
    memo: str | None = Field(None, max_length=500)


class ProductUpdate(BaseModel):
    target_price: int | None = None
    memo: str | None = None
    is_active: bool | None = None


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class ProductResponse(BaseModel):
    id: int
    keyword: str
    target_price: int | None
    memo: str | None
    is_active: bool
    created_at: str
    updated_at: str
    latest_price: int | None = None
    latest_shop: str | None = None
    latest_url: str | None = None
    latest_collected_at: str | None = None
    status: str = "no_target"
    price_change: int | None = None
    price_change_rate: float | None = None


class PriceHistoryItem(BaseModel):
    date: str
    min_price: int
    max_price: int
    shop: str | None = None
    url: str | None = None
    collected_count: int


class ShopPrice(BaseModel):
    shop_name: str
    price: int
    url: str | None = None


class LatestPriceResponse(BaseModel):
    product_id: int
    keyword: str
    min_price: int | None = None
    shop: str | None = None
    url: str | None = None
    collected_at: str | None = None
    shops: list[ShopPrice] = []


class PriceStatsResponse(BaseModel):
    product_id: int
    period_days: int
    min_price: int
    max_price: int
    avg_price: int
    current_price: int
    price_at_start: int
    change_from_start: int
    change_rate_from_start: float
    lowest_shop: str
    data_count: int


class DashboardSummaryResponse(BaseModel):
    total_products: int
    goal_reached_count: int
    today_collected_count: int
    avg_saving_rate: float


class RecentCollectionItem(BaseModel):
    id: int
    product_name: str
    shop: str
    price: int
    previous_price: int
    collected_at: str


class ErrorResponse(BaseModel):
    detail: str
    error_code: str
