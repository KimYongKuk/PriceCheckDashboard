import time
import logging

import requests

logger = logging.getLogger(__name__)


def search_products(
    keyword: str,
    client_id: str,
    client_secret: str,
    display: int = 30,
    max_retries: int = 3,
) -> list[dict]:
    url = "https://openapi.naver.com/v1/search/shop.json"
    headers = {
        "X-Naver-Client-Id": client_id,
        "X-Naver-Client-Secret": client_secret,
    }
    params = {
        "query": keyword,
        "display": display,
        "sort": "sim",
    }

    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            return data.get("items", [])
        except requests.RequestException as e:
            logger.warning(f"[{keyword}] API 호출 실패 (시도 {attempt}/{max_retries}): {e}")
            if attempt < max_retries:
                time.sleep(1)

    logger.error(f"[{keyword}] API 호출 최종 실패")
    return []
