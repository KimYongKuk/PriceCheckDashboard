import os
from pathlib import Path

import yaml
from supabase import create_client, Client


_config = None
_supabase_client = None


def _load_config() -> dict:
    """config.yaml 또는 환경변수에서 설정을 로드한다.
    환경변수가 설정되어 있으면 우선 사용 (배포 환경).
    없으면 config.yaml 사용 (로컬 개발).
    """
    global _config
    if _config is not None:
        return _config

    # 환경변수 우선 (Vercel, Railway, Render 등 배포 환경)
    if os.environ.get("SUPABASE_URL"):
        _config = {
            "supabase": {
                "url": os.environ["SUPABASE_URL"],
                "anon_key": os.environ["SUPABASE_ANON_KEY"],
            },
            "naver_api": {
                "client_id": os.environ.get("NAVER_CLIENT_ID", ""),
                "client_secret": os.environ.get("NAVER_CLIENT_SECRET", ""),
            },
            "slack": {
                "webhook_url": os.environ.get("SLACK_WEBHOOK_URL", ""),
                "enabled": os.environ.get("SLACK_ENABLED", "false").lower() == "true",
            },
            "collector": {
                "search_display": int(os.environ.get("COLLECTOR_DISPLAY", "100")),
                "request_delay_ms": int(os.environ.get("COLLECTOR_DELAY_MS", "150")),
                "exclude_keywords": ["세트", "묶음", "박스", "개입"],
            },
            "api": {
                "host": "0.0.0.0",
                "port": int(os.environ.get("PORT", "8000")),
                "cors_origins": os.environ.get(
                    "CORS_ORIGINS",
                    "http://localhost:3000,http://localhost:5173"
                ).split(","),
            },
        }
        return _config

    # 로컬 개발: config.yaml 사용
    config_path = Path(__file__).parent / "config.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        _config = yaml.safe_load(f)
    return _config


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        config = _load_config()
        sb = config["supabase"]
        _supabase_client = create_client(sb["url"], sb["anon_key"])
    return _supabase_client


def init_db():
    """Supabase는 마이그레이션 SQL로 테이블 생성 완료 상태. 연결만 확인."""
    client = get_supabase()
    client.table("products").select("id").limit(1).execute()


def get_config() -> dict:
    return _load_config()
