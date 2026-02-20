from backend.database import get_supabase


def get_db():
    yield get_supabase()
