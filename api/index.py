"""Vercel Serverless Function 진입점 — FastAPI 앱을 그대로 사용."""

import sys
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.api.main import app  # noqa: E402, F401
