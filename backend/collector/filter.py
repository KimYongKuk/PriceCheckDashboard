import re

# 수량 단위 패턴: 숫자 + 단위
_QTY_PATTERN = re.compile(r"^(\d+)(개|캔|입|팩|봉|병|포|매|장|ea|p)$", re.IGNORECASE)

# 수량 단위 변형 목록 (제목에서 매칭할 때 사용)
_QTY_UNITS = ["개", "캔", "입", "팩", "봉", "병", "포", "매", "장", "ea", "p"]


def clean_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)


def _is_qty_token(token: str) -> tuple[bool, str]:
    """수량 토큰인지 판별. (True, 숫자) 또는 (False, '') 반환."""
    m = _QTY_PATTERN.match(token)
    if m:
        return True, m.group(1)
    return False, ""


def _match_qty_in_title(number: str, title: str) -> bool:
    """제목에서 수량 변형 매칭. '30개', '30캔', 'x30', '30입' 등."""
    for unit in _QTY_UNITS:
        if f"{number}{unit}" in title:
            return True
    # x30, X30, X 30 패턴
    if re.search(rf"x\s*{number}\b", title, re.IGNORECASE):
        return True
    return False


def filter_products(
    keyword: str,
    items: list[dict],
    exclude_keywords: list[str] | None = None,
) -> list[dict]:
    tokens = keyword.lower().split()
    keyword_lower = keyword.lower()
    exclude = exclude_keywords or ["세트", "묶음", "박스", "개입"]

    result = []
    for item in items:
        title = clean_html(item.get("title", "")).lower()

        # 토큰 매칭: 수량 토큰은 유연하게, 나머지는 정확히
        matched = True
        for token in tokens:
            is_qty, number = _is_qty_token(token)
            if is_qty:
                if not _match_qty_in_title(number, title):
                    matched = False
                    break
            else:
                if token not in title:
                    matched = False
                    break
        if not matched:
            continue

        # 제외 키워드 체크 (원래 키워드에 포함된 경우 제외하지 않음)
        excluded = False
        for ex in exclude:
            if ex.lower() in title and ex.lower() not in keyword_lower:
                excluded = True
                break
        if excluded:
            continue

        result.append({
            "title": clean_html(item.get("title", "")),
            "price": int(item.get("lprice", 0)),
            "shop_name": item.get("mallName", ""),
            "product_url": item.get("link", ""),
        })

    return result
