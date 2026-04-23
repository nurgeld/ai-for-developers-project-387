from pathlib import Path
import sys

from fastapi.testclient import TestClient
import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.main import create_app
from app.storage import Storage


@pytest.fixture
def storage() -> Storage:
    return Storage()


@pytest.fixture(autouse=True)
def owner_api_token(monkeypatch: pytest.MonkeyPatch) -> str:
    token = "test-owner-token"
    monkeypatch.setenv("OWNER_API_TOKEN", token)
    return token


@pytest.fixture
def owner_auth_headers(owner_api_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {owner_api_token}"}


@pytest.fixture
def client(storage: Storage) -> TestClient:
    app = create_app(storage)
    with TestClient(app) as test_client:
        yield test_client
