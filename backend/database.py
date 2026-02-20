from pathlib import Path

import yaml
from supabase import create_client, Client


_config = None
_supabase_client = None


def _load_config() -> dict:
    global _config
    if _config is None:
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
