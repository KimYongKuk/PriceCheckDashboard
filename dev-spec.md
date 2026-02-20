# 상품 가격 모니터링 시스템 - 백엔드 개발 기획안

## 1. 프로젝트 개요

사용자가 등록한 상품 키워드에 대해 여러 쇼핑몰의 가격 데이터를 주기적으로 수집하고, 최저가 추이를 분석하여 API로 제공하는 시스템이다. 프론트엔드(Next.js)는 별도 구현되어 있으며, 이 기획안은 백엔드(FastAPI + 수집 스크립트)만을 다룬다.

### 시스템 구성

```
[cron] → [collector/main.py] → [네이버 쇼핑 API] → [SQLite]
                                                        ↑
[Next.js 프론트] → [FastAPI 서버] ─────────────────────┘
                        ↓
                  [Slack Webhook] (알림)
```

### 기술 스택

| 구성 요소 | 기술 | 비고 |
|-----------|------|------|
| API 서버 | FastAPI | uvicorn으로 실행 |
| 데이터 수집 | Python (requests) | cron으로 스케줄 실행 |
| 데이터베이스 | SQLite | 단일 파일, 수집기와 API가 공유 |
| 알림 | Slack Incoming Webhook | HTTP POST |
| 설정 관리 | YAML (config.yaml) | API 키, Slack URL 등 |

---

## 2. 폴더 구조

```
price-monitor/
├── backend/
│   ├── collector/
│   │   ├── main.py              # 수집 메인 스크립트 (cron 실행 대상)
│   │   ├── naver_api.py         # 네이버 쇼핑 API 호출 모듈
│   │   ├── filter.py            # 상품명 필터링 로직
│   │   └── notifier.py          # Slack 알림 발송
│   ├── api/
│   │   ├── main.py              # FastAPI 엔트리포인트
│   │   ├── routers/
│   │   │   ├── products.py      # 키워드 CRUD 라우터
│   │   │   └── prices.py        # 가격 조회/통계 라우터
│   │   ├── schemas.py           # Pydantic 요청/응답 스키마
│   │   └── dependencies.py      # DB 세션 등 의존성
│   ├── database.py              # SQLite 연결, 테이블 생성
│   ├── models.py                # SQLAlchemy 모델 (선택) 또는 raw SQL 쿼리 모듈
│   ├── config.yaml              # 설정 파일
│   ├── requirements.txt
│   └── README.md
├── price_monitor.db             # SQLite DB 파일 (gitignore 대상)
└── frontend/                    # Next.js 프로젝트 (별도 관리, 이 기획안 범위 밖)
```

---

## 3. 데이터베이스 설계

### 3.1 products 테이블 (모니터링 키워드)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | INTEGER | PK, AUTOINCREMENT | |
| keyword | TEXT | NOT NULL, UNIQUE | 검색 키워드 (상품명) |
| target_price | INTEGER | NULLABLE | 목표가 (원). null이면 알림 없이 추이만 수집 |
| memo | TEXT | NULLABLE | 사용자 메모 |
| is_active | BOOLEAN | DEFAULT TRUE | 비활성화 시 수집 스킵 |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### 3.2 price_logs 테이블 (수집된 가격 데이터)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | INTEGER | PK, AUTOINCREMENT | |
| product_id | INTEGER | FK → products.id, NOT NULL | |
| shop_name | TEXT | NOT NULL | 쇼핑몰명 (쿠팡, G마켓 등) |
| price | INTEGER | NOT NULL | 가격 (원) |
| product_url | TEXT | NULLABLE | 해당 쇼핑몰 상품 링크 |
| collected_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | 수집 시각 |

**인덱스:**
- `idx_price_logs_product_date` ON price_logs(product_id, collected_at)
- `idx_price_logs_collected` ON price_logs(collected_at)

### 3.3 alerts 테이블 (발송된 알림 이력)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|---------|------|
| id | INTEGER | PK, AUTOINCREMENT | |
| product_id | INTEGER | FK → products.id, NOT NULL | |
| triggered_price | INTEGER | NOT NULL | 알림 발동 시 최저가 |
| target_price | INTEGER | NOT NULL | 당시 설정된 목표가 |
| shop_name | TEXT | NOT NULL | 최저가 쇼핑몰 |
| notified_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

---

## 4. 데이터 수집 로직 (collector)

### 4.1 실행 흐름

```
1. config.yaml에서 네이버 API 키 로드
2. products 테이블에서 is_active = TRUE인 키워드 목록 조회
3. 각 키워드에 대해:
   a. 네이버 쇼핑 API 호출 (검색)
   b. 응답 결과를 필터링 (상품명 매칭)
   c. 필터링된 결과를 price_logs에 INSERT
   d. 최저가가 target_price 이하인지 체크
   e. 조건 충족 시 Slack 알림 발송 + alerts 테이블 기록
4. 로그 출력 (수집 건수, 소요 시간)
```

### 4.2 네이버 쇼핑 API 호출 (naver_api.py)

**API 엔드포인트:** `https://openapi.naver.com/v1/search/shop.json`

**요청 헤더:**
```
X-Naver-Client-Id: {client_id}
X-Naver-Client-Secret: {client_secret}
```

**요청 파라미터:**
| 파라미터 | 값 | 설명 |
|---------|-----|------|
| query | 키워드 (예: "빼빼로 오리지널 54g") | 검색어 |
| display | 30 | 한 번에 가져올 결과 수 (최대 100) |
| sort | asc | 가격 낮은순 정렬 |

**응답 중 사용할 필드:**
```json
{
  "items": [
    {
      "title": "<b>빼빼로</b> <b>오리지널</b> <b>54g</b>",  // HTML 태그 포함
      "lprice": "1180",                                      // 최저가 (문자열)
      "mallName": "쿠팡",                                     // 쇼핑몰명
      "link": "https://..."                                   // 상품 링크
    }
  ]
}
```

**주의사항:**
- `title`에서 HTML 태그(`<b>`, `</b>`)를 제거한 후 필터링에 사용할 것
- `lprice`는 문자열이므로 int 변환 필요
- API 호출 간 100ms 이상 딜레이를 줘서 rate limit 방지

### 4.3 상품 필터링 로직 (filter.py)

네이버 쇼핑 API 검색 결과에는 묶음팩, 다른 용량, 유사 상품 등이 섞여 들어오므로 정확한 상품만 걸러내야 한다.

**필터링 규칙:**
1. 검색된 `title`에서 HTML 태그 제거
2. 키워드의 핵심 토큰 추출 (상품명, 용량, 수량 등)
   - 예: "빼빼로 오리지널 54g" → ["빼빼로", "오리지널", "54g"]
3. 검색 결과의 title에 모든 핵심 토큰이 포함되어 있는지 확인
4. 묶음/멀티팩 제외 키워드 체크: title에 "세트", "묶음", "박스", "입", "개입", "x", "X" 등이 포함되면 제외 (단, 원래 키워드에 해당 단어가 있으면 제외하지 않음)

**필터링 함수 시그니처:**
```python
def filter_products(keyword: str, items: list[dict]) -> list[dict]:
    """
    Args:
        keyword: 등록된 검색 키워드
        items: 네이버 API 응답의 items 리스트
    Returns:
        필터링을 통과한 상품 리스트
    """
```

### 4.4 알림 로직 (notifier.py)

**알림 발송 조건:**
1. 해당 상품의 target_price가 설정되어 있음 (NOT NULL)
2. 수집된 최저가 ≤ target_price
3. 동일 상품에 대해 최근 24시간 내 알림을 보낸 적 없음 (alerts 테이블 조회로 중복 방지)

**Slack 메시지 포맷:**
```
🔔 목표가 도달 알림!

상품: 빼빼로 오리지널 54g
현재 최저가: ₩1,180 (쿠팡)
목표가: ₩1,200
절감율: 1.7%

👉 구매 링크: https://...
```

### 4.5 스케줄링

cron 표현식: `0 9,18 * * *` (매일 09:00, 18:00 실행)

```bash
# crontab -e
0 9,18 * * * cd /path/to/price-monitor && python -m backend.collector.main >> logs/collector.log 2>&1
```

---

## 5. API 설계 (FastAPI)

### 5.1 서버 실행

```bash
uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5.2 CORS 설정

프론트엔드(Next.js)에서 호출하므로 CORS 미들웨어 필수.
```python
allow_origins=["http://localhost:3000"]
```

### 5.3 엔드포인트 상세

---

#### `GET /products` — 키워드 목록 조회

**설명:** 등록된 모든 모니터링 키워드를 최신 가격 정보와 함께 반환한다.

**쿼리 파라미터:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| search | string | null | 키워드 검색 필터 (LIKE 검색) |
| status | string | null | 상태 필터: "goal_reached", "monitoring", "no_target" |

**응답 (200):**
```json
[
  {
    "id": 1,
    "keyword": "빼빼로 오리지널 54g",
    "target_price": 1200,
    "memo": "편의점보다 싸게 사기",
    "is_active": true,
    "created_at": "2026-01-15T09:00:00",
    "updated_at": "2026-01-15T09:00:00",
    "latest_price": 1180,
    "latest_shop": "쿠팡",
    "latest_url": "https://...",
    "latest_collected_at": "2026-02-20T09:00:00",
    "status": "goal_reached",
    "price_change": -20,
    "price_change_rate": -1.7
  }
]
```

**status 결정 로직:**
- `target_price`가 NULL → `"no_target"`
- `latest_price` ≤ `target_price` → `"goal_reached"`
- `latest_price` > `target_price` → `"monitoring"`

**price_change / price_change_rate:**
- 직전 수집 데이터 대비 가격 변동 (원 / %)
- 데이터가 1건 이하면 `null`

---

#### `POST /products` — 키워드 등록

**요청 Body:**
```json
{
  "keyword": "빼빼로 오리지널 54g",
  "target_price": 1200,
  "memo": "편의점보다 싸게 사기"
}
```

**유효성 검사:**
- `keyword`: 필수, 1~100자, 중복 불가
- `target_price`: 선택, 양의 정수
- `memo`: 선택, 최대 500자

**응답 (201):** 생성된 product 객체 반환

**에러:**
- 409 Conflict: 동일 키워드 이미 존재

---

#### `PUT /products/{id}` — 키워드 수정

**요청 Body:**
```json
{
  "target_price": 1100,
  "memo": "목표가 하향 조정",
  "is_active": true
}
```

**응답 (200):** 수정된 product 객체 반환

**에러:**
- 404 Not Found: 해당 id 없음

---

#### `DELETE /products/{id}` — 키워드 삭제

**설명:** 해당 키워드와 연관된 price_logs, alerts도 함께 삭제 (CASCADE).

**응답 (204):** No Content

**에러:**
- 404 Not Found: 해당 id 없음

---

#### `GET /prices/{product_id}` — 가격 이력 조회

**설명:** 특정 상품의 일별 최저가 이력을 반환한다. 하루에 여러 번 수집되더라도 해당 날짜의 최저가 1건만 반환.

**쿼리 파라미터:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| days | int | 30 | 최근 N일 데이터 (7, 30, 90, 전체=0) |

**응답 (200):**
```json
[
  {
    "date": "2026-02-14",
    "min_price": 1350,
    "max_price": 1500,
    "shop": "G마켓",
    "url": "https://...",
    "collected_count": 8
  },
  {
    "date": "2026-02-15",
    "min_price": 1280,
    "max_price": 1450,
    "shop": "쿠팡",
    "url": "https://...",
    "collected_count": 10
  }
]
```

**SQL 참고:**
```sql
SELECT
  DATE(collected_at) as date,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM price_logs
WHERE product_id = ?
  AND collected_at >= DATE('now', '-30 days')
GROUP BY DATE(collected_at)
ORDER BY date ASC
```
min_price에 해당하는 row의 shop_name, product_url을 함께 반환해야 하므로 서브쿼리 또는 윈도우 함수 사용.

---

#### `GET /prices/{product_id}/latest` — 최신 최저가

**설명:** 가장 최근 수집에서의 최저가 정보를 반환.

**응답 (200):**
```json
{
  "product_id": 1,
  "keyword": "빼빼로 오리지널 54g",
  "min_price": 1180,
  "shop": "쿠팡",
  "url": "https://...",
  "collected_at": "2026-02-20T09:00:00",
  "shops": [
    { "shop_name": "쿠팡", "price": 1180, "url": "https://..." },
    { "shop_name": "G마켓", "price": 1350, "url": "https://..." },
    { "shop_name": "11번가", "price": 1400, "url": "https://..." }
  ]
}
```

---

#### `GET /prices/{product_id}/stats` — 통계

**쿼리 파라미터:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| days | int | 30 | 통계 산출 기간 |

**응답 (200):**
```json
{
  "product_id": 1,
  "period_days": 30,
  "min_price": 1180,
  "max_price": 1500,
  "avg_price": 1295,
  "current_price": 1180,
  "price_at_start": 1350,
  "change_from_start": -170,
  "change_rate_from_start": -12.6,
  "lowest_shop": "쿠팡",
  "data_count": 58
}
```

---

#### `GET /dashboard/summary` — 대시보드 요약

**설명:** 대시보드 상단 요약 카드에 필요한 집계 데이터를 한 번에 반환.

**응답 (200):**
```json
{
  "total_products": 12,
  "goal_reached_count": 3,
  "today_collected_count": 156,
  "avg_saving_rate": 8.5
}
```

**산출 로직:**
- `total_products`: products 테이블에서 is_active = TRUE 개수
- `goal_reached_count`: status가 "goal_reached"인 상품 수
- `today_collected_count`: 오늘 날짜의 price_logs 건수
- `avg_saving_rate`: 전체 상품의 (등록 첫 수집가 - 현재 최저가) / 첫 수집가 평균 (%)

---

## 6. 설정 파일 (config.yaml)

```yaml
naver_api:
  client_id: "YOUR_NAVER_CLIENT_ID"
  client_secret: "YOUR_NAVER_CLIENT_SECRET"

slack:
  webhook_url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  enabled: true

collector:
  search_display: 30          # 네이버 API 검색 결과 수
  request_delay_ms: 150       # API 호출 간 딜레이 (ms)
  exclude_keywords:            # 묶음/세트 제외 키워드
    - "세트"
    - "묶음"
    - "박스"
    - "개입"

database:
  path: "../price_monitor.db"

api:
  host: "0.0.0.0"
  port: 8000
  cors_origins:
    - "http://localhost:3000"
```

---

## 7. 에러 처리

### API 에러 응답 형식
```json
{
  "detail": "해당 상품을 찾을 수 없습니다.",
  "error_code": "PRODUCT_NOT_FOUND"
}
```

### 에러 코드 정의
| HTTP 상태 | error_code | 설명 |
|-----------|-----------|------|
| 400 | INVALID_REQUEST | 유효성 검사 실패 |
| 404 | PRODUCT_NOT_FOUND | 상품 ID 없음 |
| 409 | DUPLICATE_KEYWORD | 동일 키워드 존재 |
| 500 | INTERNAL_ERROR | 서버 내부 오류 |

### 수집 스크립트 에러 처리
- 네이버 API 호출 실패: 3회 재시도 (1초 간격), 실패 시 로그 기록 후 다음 키워드로 진행
- DB 쓰기 실패: 로그 기록, 해당 건 스킵
- Slack 알림 실패: 로그 기록, 수집은 정상 진행 (알림 실패가 수집을 막으면 안 됨)

---

## 8. 개발 우선순위

아래 순서로 구현한다. 각 단계가 완료되면 동작 확인 후 다음 단계로 진행.

| 순서 | 작업 | 산출물 | 검증 방법 |
|------|------|--------|----------|
| 1 | DB 초기화 + 테이블 생성 | database.py | 테이블 생성 확인, SQLite CLI로 조회 |
| 2 | 네이버 쇼핑 API 연동 | naver_api.py | 단건 키워드 검색 후 결과 출력 |
| 3 | 상품 필터링 로직 | filter.py | 테스트 키워드로 필터링 정확도 확인 |
| 4 | 수집 스크립트 통합 | collector/main.py | 수동 실행 → DB에 데이터 적재 확인 |
| 5 | FastAPI 기본 세팅 + products CRUD | api/ | Swagger UI에서 CRUD 동작 확인 |
| 6 | 가격 조회/통계 API | prices 라우터 | 수집된 데이터 기반으로 응답 확인 |
| 7 | 대시보드 요약 API | dashboard 라우터 | 집계 수치 정합성 확인 |
| 8 | Slack 알림 | notifier.py | 테스트 알림 발송 확인 |
| 9 | cron 등록 + 운영 안정화 | crontab | 스케줄 실행 로그 확인 |

---

## 9. requirements.txt

```
fastapi>=0.115.0
uvicorn>=0.34.0
pyyaml>=6.0
requests>=2.32.0
pydantic>=2.0
```

SQLite는 Python 내장(sqlite3)이므로 별도 설치 불필요.
SQLAlchemy는 선택사항. raw SQL로 충분하면 사용하지 않아도 됨.
