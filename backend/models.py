from datetime import datetime, timezone

from supabase import Client
from postgrest.exceptions import APIError


BATCH_SIZE = 500


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------

def get_all_products(client: Client, search: str | None = None, status: str | None = None) -> list[dict]:
    params = {}
    if search:
        params["p_search"] = search

    result = client.rpc("fn_products_with_prices", params).execute()

    results = []
    for row in result.data:
        lp = row.get("latest_price")
        pp = row.get("prev_price")

        # status 결정
        if row["target_price"] is None:
            row["status"] = "no_target"
        elif lp is not None and lp <= row["target_price"]:
            row["status"] = "goal_reached"
        else:
            row["status"] = "monitoring"

        # price_change
        if lp is not None and pp is not None:
            row["price_change"] = lp - pp
            row["price_change_rate"] = round((lp - pp) / pp * 100, 1) if pp != 0 else 0
        else:
            row["price_change"] = None
            row["price_change_rate"] = None

        results.append(row)

    if status:
        results = [r for r in results if r["status"] == status]

    return results


def get_product_by_id(client: Client, product_id: int) -> dict | None:
    result = client.table("products").select("*").eq("id", product_id).execute()
    return result.data[0] if result.data else None


def create_product(client: Client, keyword: str, target_price: int | None = None, memo: str | None = None) -> dict:
    row = {
        "keyword": keyword,
        "target_price": target_price,
        "memo": memo,
    }
    result = client.table("products").insert(row).execute()
    product = result.data[0]

    product["latest_price"] = None
    product["latest_shop"] = None
    product["latest_url"] = None
    product["latest_collected_at"] = None
    product["status"] = "no_target" if target_price is None else "monitoring"
    product["price_change"] = None
    product["price_change_rate"] = None
    return product


def update_product(client: Client, product_id: int, target_price=..., memo=..., is_active=...) -> dict | None:
    existing = get_product_by_id(client, product_id)
    if not existing:
        return None

    updates = {}
    if target_price is not ...:
        updates["target_price"] = target_price
    if memo is not ...:
        updates["memo"] = memo
    if is_active is not ...:
        updates["is_active"] = is_active

    if updates:
        client.table("products").update(updates).eq("id", product_id).execute()

    all_products = get_all_products(client)
    return next((p for p in all_products if p["id"] == product_id), existing)


def delete_product(client: Client, product_id: int) -> bool:
    existing = get_product_by_id(client, product_id)
    if not existing:
        return False
    client.table("products").delete().eq("id", product_id).execute()
    return True


# ---------------------------------------------------------------------------
# Prices
# ---------------------------------------------------------------------------

def get_price_history(client: Client, product_id: int, days: int = 30) -> list[dict]:
    result = client.rpc("fn_price_history", {
        "p_product_id": product_id,
        "p_days": days,
    }).execute()
    return result.data


def get_latest_prices(client: Client, product_id: int) -> dict | None:
    product = get_product_by_id(client, product_id)
    if not product:
        return None

    result = client.rpc("fn_latest_prices", {
        "p_product_id": product_id,
    }).execute()

    shops_list = result.data
    min_shop = shops_list[0] if shops_list else {}

    return {
        "product_id": product_id,
        "keyword": product["keyword"],
        "min_price": min_shop.get("price"),
        "shop": min_shop.get("shop_name"),
        "url": min_shop.get("url"),
        "collected_at": min_shop.get("collected_at"),
        "shops": shops_list,
    }


def get_price_stats(client: Client, product_id: int, days: int = 30) -> dict | None:
    product = get_product_by_id(client, product_id)
    if not product:
        return None

    result = client.rpc("fn_price_stats", {
        "p_product_id": product_id,
        "p_days": days,
    }).execute()

    if not result.data:
        return {
            "product_id": product_id,
            "period_days": days,
            "min_price": 0, "max_price": 0, "avg_price": 0,
            "current_price": 0, "price_at_start": 0,
            "change_from_start": 0, "change_rate_from_start": 0.0,
            "lowest_shop": "", "data_count": 0,
        }

    row = result.data[0]
    return {
        "product_id": product_id,
        "period_days": days,
        "min_price": row["min_price"],
        "max_price": row["max_price"],
        "avg_price": row["avg_price"],
        "current_price": row["current_price"],
        "price_at_start": row["price_at_start"],
        "change_from_start": row["change_from_start"],
        "change_rate_from_start": float(row["change_rate_from_start"]),
        "lowest_shop": row["lowest_shop"],
        "data_count": row["data_count"],
    }


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

def get_dashboard_summary(client: Client) -> dict:
    result = client.rpc("fn_dashboard_summary").execute()
    row = result.data[0]
    return {
        "total_products": row["total_products"],
        "goal_reached_count": row["goal_reached_count"],
        "today_collected_count": row["today_collected_count"],
        "avg_saving_rate": float(row["avg_saving_rate"]),
    }


# ---------------------------------------------------------------------------
# Recent Collections
# ---------------------------------------------------------------------------

def get_recent_collections(client: Client, limit: int = 10) -> list[dict]:
    result = client.rpc("fn_recent_collections", {"p_limit": limit}).execute()
    return result.data


# ---------------------------------------------------------------------------
# Collector helpers
# ---------------------------------------------------------------------------

def get_active_products(client: Client) -> list[dict]:
    result = client.table("products").select("*").eq("is_active", True).execute()
    return result.data


def insert_price_logs_batch(client: Client, rows: list[dict]) -> int:
    """배치 INSERT: BATCH_SIZE 단위로 나누어 삽입."""
    total = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        client.table("price_logs").insert(batch).execute()
        total += len(batch)
    return total


def insert_alerts_batch(client: Client, rows: list[dict]) -> int:
    """알림 배치 INSERT."""
    if not rows:
        return 0
    total = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i : i + BATCH_SIZE]
        client.table("alerts").insert(batch).execute()
        total += len(batch)
    return total


def check_recent_alert(client: Client, product_id: int, hours: int = 24) -> bool:
    cutoff = datetime.now(timezone.utc).isoformat()
    # hours 전 시각 계산
    from datetime import timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()

    result = (
        client.table("alerts")
        .select("id")
        .eq("product_id", product_id)
        .gte("notified_at", cutoff)
        .limit(1)
        .execute()
    )
    return len(result.data) > 0
