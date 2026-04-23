import secrets

from fastapi import Header, Request

from app.errors import forbidden_error, unauthorized_error
from app.storage import Storage


def get_storage(request: Request) -> Storage:
    return request.app.state.storage


def require_owner_auth(
    request: Request,
    authorization: str | None = Header(default=None),
) -> None:
    owner_api_token = request.app.state.owner_api_token

    if authorization is None:
        raise unauthorized_error()

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise unauthorized_error()

    if not secrets.compare_digest(token, owner_api_token):
        raise forbidden_error()
