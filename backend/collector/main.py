import time
import json
import logging

from backend.database import get_supabase, get_config
from backend import models
from backend.collector.naver_api import search_products
from backend.collector.filter import filter_products
from backend.collector.notifier import send_slack_alert

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# supabase/httpx 내부 디버그 로그 억제
for _noisy in ("httpx", "httpcore", "h2", "hpack", "hpack.hpack", "hpack.table"):
    logging.getLogger(_noisy).setLevel(logging.WARNING)


def run():
    start_time = time.time()
    config = get_config()

    # 설정 로드
    naver_config = config["naver_api"]
    slack_config = config.get("slack", {})
    collector_config = config.get("collector", {})

    client_id = naver_config["client_id"]
    client_secret = naver_config["client_secret"]
    display = collector_config.get("search_display", 30)
    delay_ms = collector_config.get("request_delay_ms", 150)
    exclude_keywords = collector_config.get("exclude_keywords", [])

    slack_enabled = slack_config.get("enabled", False)
    webhook_url = slack_config.get("webhook_url", "")

    # Supabase 클라이언트
    client = get_supabase()

    products = models.get_active_products(client)
    logger.info(f"수집 대상 키워드: {len(products)}개")

    # ── 메모리 버퍼 (수집-저장 분리) ──
    price_buffer: list[dict] = []
    alert_buffer: list[dict] = []

    for product in products:
        keyword = product["keyword"]
        product_id = product["id"]
        target_price = product["target_price"]

        logger.info(f"[{keyword}] 수집 시작...")

        # 네이버 쇼핑 API 호출
        items = search_products(keyword, client_id, client_secret, display=display)

        if not items:
            logger.warning(f"[{keyword}] 검색 결과 없음")
            time.sleep(delay_ms / 1000)
            continue

        # 필터링
        filtered = filter_products(keyword, items, exclude_keywords=exclude_keywords)
        logger.info(f"[{keyword}] 검색 {len(items)}건 → 필터 통과 {len(filtered)}건")

        if not filtered:
            time.sleep(delay_ms / 1000)
            continue

        # ── 버퍼에 축적 (네트워크 호출 없음) ──
        for i, item in enumerate(filtered):
            # 원본 API 응답에서 매칭되는 raw 데이터 찾기
            raw = items[i] if i < len(items) else None

            price_buffer.append({
                "product_id": product_id,
                "shop_name": item["shop_name"],
                "price": item["price"],
                "product_url": item.get("product_url"),
                "raw_data": json.dumps(raw, ensure_ascii=False) if raw else None,
            })

        # 최저가 확인 및 알림 체크
        min_item = min(filtered, key=lambda x: x["price"])
        min_price = min_item["price"]

        if target_price and min_price <= target_price:
            # 최근 알림 여부는 DB에서 직접 확인 (읽기 1회)
            if not models.check_recent_alert(client, product_id):
                logger.info(f"[{keyword}] 목표가 도달! {min_price:,}원 <= {target_price:,}원")

                # Slack 알림 (즉시 발송)
                if slack_enabled and webhook_url:
                    send_slack_alert(
                        webhook_url=webhook_url,
                        keyword=keyword,
                        price=min_price,
                        target_price=target_price,
                        shop=min_item["shop_name"],
                        url=min_item.get("product_url", ""),
                    )

                # 알림 기록은 버퍼에 추가
                alert_buffer.append({
                    "product_id": product_id,
                    "triggered_price": min_price,
                    "target_price": target_price,
                    "shop_name": min_item["shop_name"],
                })

        # API 호출 간 딜레이
        time.sleep(delay_ms / 1000)

    # ── 수집 완료: 일괄 DB 저장 ──
    saved_prices = 0
    saved_alerts = 0

    if price_buffer:
        try:
            saved_prices = models.insert_price_logs_batch(client, price_buffer)
            logger.info(f"price_logs 일괄 저장 완료: {saved_prices}건")
        except Exception as e:
            logger.error(f"price_logs 일괄 저장 실패: {e}")

    if alert_buffer:
        try:
            saved_alerts = models.insert_alerts_batch(client, alert_buffer)
            logger.info(f"alerts 일괄 저장 완료: {saved_alerts}건")
        except Exception as e:
            logger.error(f"alerts 일괄 저장 실패: {e}")

    elapsed = time.time() - start_time
    logger.info(
        f"수집 완료: {len(products)}개 키워드, "
        f"{saved_prices}건 가격 + {saved_alerts}건 알림 저장, "
        f"{elapsed:.1f}초 소요"
    )


if __name__ == "__main__":
    run()
