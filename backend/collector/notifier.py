import logging

import requests

logger = logging.getLogger(__name__)


def send_slack_alert(
    webhook_url: str,
    keyword: str,
    price: int,
    target_price: int,
    shop: str,
    url: str,
) -> bool:
    saving_rate = ((target_price - price) / target_price) * 100 if target_price else 0

    message = {
        "text": (
            f":bell: 목표가 도달 알림!\n\n"
            f"상품: {keyword}\n"
            f"현재 최저가: ₩{price:,} ({shop})\n"
            f"목표가: ₩{target_price:,}\n"
            f"절감율: {saving_rate:.1f}%\n\n"
            f":point_right: 구매 링크: {url}"
        )
    }

    try:
        resp = requests.post(webhook_url, json=message, timeout=10)
        if resp.status_code == 200:
            logger.info(f"[{keyword}] Slack 알림 발송 성공")
            return True
        else:
            logger.warning(f"[{keyword}] Slack 알림 실패: status={resp.status_code}")
            return False
    except requests.RequestException as e:
        logger.warning(f"[{keyword}] Slack 알림 발송 실패: {e}")
        return False
