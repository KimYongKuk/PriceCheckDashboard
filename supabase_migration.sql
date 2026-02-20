-- ============================================================
-- Supabase (PostgreSQL) Migration
-- SQLite -> Supabase 스키마 + RPC 함수 전체 마이그레이션
-- Supabase SQL Editor에 붙여넣고 실행하세요.
-- ============================================================

-- =========================
-- 1. 테이블 생성
-- =========================

CREATE TABLE IF NOT EXISTS products (
    id          BIGSERIAL PRIMARY KEY,
    keyword     TEXT NOT NULL UNIQUE,
    target_price INTEGER,
    memo        TEXT,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_logs (
    id           BIGSERIAL PRIMARY KEY,
    product_id   BIGINT NOT NULL,
    shop_name    TEXT NOT NULL,
    price        INTEGER NOT NULL,
    product_url  TEXT,
    raw_data     JSONB,
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_price_logs_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_price_logs_product_date
    ON price_logs(product_id, collected_at);

CREATE INDEX IF NOT EXISTS idx_price_logs_collected
    ON price_logs(collected_at);

CREATE TABLE IF NOT EXISTS alerts (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL,
    triggered_price INTEGER NOT NULL,
    target_price    INTEGER NOT NULL,
    shop_name       TEXT NOT NULL,
    notified_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_alerts_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alerts_product
    ON alerts(product_id);

-- =========================
-- 2. updated_at 자동 갱신 트리거
-- =========================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- 3. RPC 함수: 상품 목록 + 최신/이전 가격
-- =========================

CREATE OR REPLACE FUNCTION fn_products_with_prices(p_search TEXT DEFAULT NULL)
RETURNS TABLE (
    id              BIGINT,
    keyword         TEXT,
    target_price    INTEGER,
    memo            TEXT,
    is_active       BOOLEAN,
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ,
    latest_price    INTEGER,
    latest_shop     TEXT,
    latest_url      TEXT,
    latest_collected_at TIMESTAMPTZ,
    prev_price      INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.keyword,
        p.target_price,
        p.memo,
        p.is_active,
        p.created_at,
        p.updated_at,
        lp.price        AS latest_price,
        lp.shop_name    AS latest_shop,
        lp.product_url  AS latest_url,
        lp.collected_at AS latest_collected_at,
        pp.price        AS prev_price
    FROM products p
    LEFT JOIN LATERAL (
        SELECT pl.price, pl.shop_name, pl.product_url, pl.collected_at
        FROM price_logs pl
        WHERE pl.product_id = p.id
          AND pl.collected_at::date = (
              SELECT MAX(pl2.collected_at)::date
              FROM price_logs pl2
              WHERE pl2.product_id = p.id
          )
        ORDER BY pl.price ASC
        LIMIT 1
    ) lp ON TRUE
    LEFT JOIN LATERAL (
        SELECT MIN(pl3.price) AS price
        FROM price_logs pl3
        WHERE pl3.product_id = p.id
          AND pl3.collected_at::date = (
              SELECT MAX(pl4.collected_at)::date
              FROM price_logs pl4
              WHERE pl4.product_id = p.id
                AND pl4.collected_at::date < (
                    SELECT MAX(pl5.collected_at)::date
                    FROM price_logs pl5
                    WHERE pl5.product_id = p.id
                )
          )
    ) pp ON TRUE
    WHERE (p_search IS NULL OR p.keyword ILIKE '%' || p_search || '%')
    ORDER BY p.created_at DESC;
END;
$$;

-- =========================
-- 4. RPC 함수: 가격 히스토리 (일별 집계)
-- =========================

CREATE OR REPLACE FUNCTION fn_price_history(p_product_id BIGINT, p_days INT DEFAULT 30)
RETURNS TABLE (
    date            DATE,
    min_price       INTEGER,
    max_price       INTEGER,
    collected_count BIGINT,
    shop            TEXT,
    url             TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH daily AS (
        SELECT
            pl.collected_at::date AS d,
            MIN(pl.price)  AS min_p,
            MAX(pl.price)  AS max_p,
            COUNT(*)       AS cnt
        FROM price_logs pl
        WHERE pl.product_id = p_product_id
          AND (p_days = 0 OR pl.collected_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL)
        GROUP BY pl.collected_at::date
        ORDER BY d ASC
    )
    SELECT
        daily.d       AS date,
        daily.min_p   AS min_price,
        daily.max_p   AS max_price,
        daily.cnt     AS collected_count,
        detail.shop_name AS shop,
        detail.product_url AS url
    FROM daily
    LEFT JOIN LATERAL (
        SELECT pl2.shop_name, pl2.product_url
        FROM price_logs pl2
        WHERE pl2.product_id = p_product_id
          AND pl2.collected_at::date = daily.d
          AND pl2.price = daily.min_p
        LIMIT 1
    ) detail ON TRUE;
END;
$$;

-- =========================
-- 5. RPC 함수: 최신 가격 (쇼핑몰별)
-- =========================

CREATE OR REPLACE FUNCTION fn_latest_prices(p_product_id BIGINT)
RETURNS TABLE (
    shop_name    TEXT,
    price        INTEGER,
    url          TEXT,
    collected_at TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
DECLARE
    latest_date DATE;
BEGIN
    SELECT MAX(pl.collected_at)::date INTO latest_date
    FROM price_logs pl
    WHERE pl.product_id = p_product_id;

    IF latest_date IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT pl.shop_name, pl.price, pl.product_url AS url, pl.collected_at
    FROM price_logs pl
    WHERE pl.product_id = p_product_id
      AND pl.collected_at::date = latest_date
    ORDER BY pl.price ASC;
END;
$$;

-- =========================
-- 6. RPC 함수: 가격 통계
-- =========================

CREATE OR REPLACE FUNCTION fn_price_stats(p_product_id BIGINT, p_days INT DEFAULT 30)
RETURNS TABLE (
    min_price            INTEGER,
    max_price            INTEGER,
    avg_price            INTEGER,
    data_count           BIGINT,
    current_price        INTEGER,
    price_at_start       INTEGER,
    change_from_start    INTEGER,
    change_rate_from_start NUMERIC,
    lowest_shop          TEXT
) LANGUAGE plpgsql AS $$
DECLARE
    v_min     INTEGER;
    v_max     INTEGER;
    v_avg     INTEGER;
    v_count   BIGINT;
    v_current INTEGER;
    v_start   INTEGER;
    v_shop    TEXT;
BEGIN
    SELECT MIN(pl.price), MAX(pl.price), AVG(pl.price)::INTEGER, COUNT(*)
    INTO v_min, v_max, v_avg, v_count
    FROM price_logs pl
    WHERE pl.product_id = p_product_id
      AND (p_days = 0 OR pl.collected_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL);

    IF v_count = 0 THEN
        RETURN QUERY SELECT 0, 0, 0, 0::BIGINT, 0, 0, 0, 0.0::NUMERIC, ''::TEXT;
        RETURN;
    END IF;

    -- 현재가 (최신 날짜의 최저가)
    SELECT MIN(pl.price) INTO v_current
    FROM price_logs pl
    WHERE pl.product_id = p_product_id
      AND pl.collected_at::date = (
          SELECT MAX(pl2.collected_at)::date
          FROM price_logs pl2
          WHERE pl2.product_id = p_product_id
      );

    -- 기간 시작 시점 가격
    SELECT MIN(pl.price) INTO v_start
    FROM price_logs pl
    WHERE pl.product_id = p_product_id
      AND pl.collected_at::date = (
          SELECT MIN(pl2.collected_at)::date
          FROM price_logs pl2
          WHERE pl2.product_id = p_product_id
            AND (p_days = 0 OR pl2.collected_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL)
      );

    IF v_start IS NULL THEN v_start := v_current; END IF;

    -- 최저가 쇼핑몰
    SELECT pl.shop_name INTO v_shop
    FROM price_logs pl
    WHERE pl.product_id = p_product_id AND pl.price = v_min
    ORDER BY pl.collected_at DESC
    LIMIT 1;

    RETURN QUERY SELECT
        v_min,
        v_max,
        v_avg,
        v_count,
        v_current,
        v_start,
        v_current - v_start,
        CASE WHEN v_start > 0
             THEN ROUND((v_current - v_start)::NUMERIC / v_start * 100, 1)
             ELSE 0.0
        END,
        COALESCE(v_shop, '');
END;
$$;

-- =========================
-- 7. RPC 함수: 대시보드 요약
-- =========================

CREATE OR REPLACE FUNCTION fn_dashboard_summary()
RETURNS TABLE (
    total_products       BIGINT,
    goal_reached_count   BIGINT,
    today_collected_count BIGINT,
    avg_saving_rate      NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
    v_total      BIGINT;
    v_goal       BIGINT;
    v_today      BIGINT;
    v_avg_saving NUMERIC;
BEGIN
    -- 활성 상품 수
    SELECT COUNT(*) INTO v_total
    FROM products WHERE is_active = TRUE;

    -- 목표 달성 수: 최신 최저가 <= target_price
    SELECT COUNT(*) INTO v_goal
    FROM products p
    WHERE p.target_price IS NOT NULL
      AND p.is_active = TRUE
      AND EXISTS (
          SELECT 1 FROM price_logs pl
          WHERE pl.product_id = p.id
            AND pl.collected_at::date = (
                SELECT MAX(pl2.collected_at)::date
                FROM price_logs pl2
                WHERE pl2.product_id = p.id
            )
            AND pl.price <= p.target_price
      );

    -- 오늘 수집 건수
    SELECT COUNT(*) INTO v_today
    FROM price_logs
    WHERE collected_at::date = CURRENT_DATE;

    -- 평균 절약률
    SELECT COALESCE(ROUND(AVG(saving_rate), 1), 0) INTO v_avg_saving
    FROM (
        SELECT
            (first_p.fprice - latest_p.lprice)::NUMERIC
                / NULLIF(first_p.fprice, 0) * 100 AS saving_rate
        FROM products p
        INNER JOIN LATERAL (
            SELECT MIN(pl.price) AS lprice
            FROM price_logs pl
            WHERE pl.product_id = p.id
              AND pl.collected_at::date = (
                  SELECT MAX(pl2.collected_at)::date
                  FROM price_logs pl2
                  WHERE pl2.product_id = p.id
              )
        ) latest_p ON latest_p.lprice IS NOT NULL
        INNER JOIN LATERAL (
            SELECT MIN(pl.price) AS fprice
            FROM price_logs pl
            WHERE pl.product_id = p.id
              AND pl.collected_at::date = (
                  SELECT MIN(pl2.collected_at)::date
                  FROM price_logs pl2
                  WHERE pl2.product_id = p.id
              )
        ) first_p ON first_p.fprice IS NOT NULL AND first_p.fprice > 0
        WHERE p.is_active = TRUE
    ) rates;

    RETURN QUERY SELECT v_total, v_goal, v_today, v_avg_saving;
END;
$$;

-- =========================
-- 8. RPC 함수: 최근 수집 내역
-- =========================

CREATE OR REPLACE FUNCTION fn_recent_collections(p_limit INT DEFAULT 10)
RETURNS TABLE (
    id             BIGINT,
    product_name   TEXT,
    shop           TEXT,
    price          INTEGER,
    previous_price INTEGER,
    collected_at   TIMESTAMPTZ
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        pl.id,
        p.keyword       AS product_name,
        pl.shop_name    AS shop,
        pl.price,
        COALESCE(
            (SELECT pl2.price
             FROM price_logs pl2
             WHERE pl2.product_id = pl.product_id
               AND pl2.shop_name = pl.shop_name
               AND pl2.collected_at < pl.collected_at
             ORDER BY pl2.collected_at DESC
             LIMIT 1),
            pl.price
        ) AS previous_price,
        pl.collected_at
    FROM price_logs pl
    JOIN products p ON pl.product_id = p.id
    ORDER BY pl.collected_at DESC
    LIMIT p_limit;
END;
$$;
