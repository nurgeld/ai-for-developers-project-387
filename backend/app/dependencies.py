import hmac
import os

from fastapi import Header, Request

from app.errors import forbidden_error, unauthorized_error
from app.storage import Storage


def get_storage(request: Request) -> Storage:
    return request.app.state.storage


def require_owner_auth(authorization: str | None = Header(default=None)) -> None:
    configured_token = os.getenv("OWNER_API_TOKEN")

    if not configured_token:
        raise unauthorized_error("Owner API token is not configured.")

    if authorization is None:
        raise unauthorized_error()

    parts = authorization.split(" ")
    if len(parts) != 2:
        raise unauthorized_error()

    scheme, token = parts
    if scheme.lower() != "bearer" or not token:
        raise unauthorized_error()

    if not hmac.compare_digest(token, configured_token):
        raise forbidden_error()
