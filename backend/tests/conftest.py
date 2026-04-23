import os
from pathlib import Path
import sys

from fastapi.testclient import TestClient
import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("OWNER_API_TOKEN", "test-owner-token")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")

from app.main import create_app
from app.storage import Storage


@pytest.fixture
def storage() -> Storage:
    return Storage()


@pytest.fixture
def client(storage: Storage) -> TestClient:
    app = create_app(storage)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def owner_headers() -> dict[str, str]:
    return {"Authorization": "Bearer test-owner-token"}
