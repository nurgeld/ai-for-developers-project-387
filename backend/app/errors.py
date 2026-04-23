from typing import Optional

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ValidationError as PydanticValidationError

from app.models import (
    ConflictError,
    DuplicateDurationError,
    ForbiddenError,
    InvalidSlotTimeError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)


class ApiException(Exception):
    def __init__(self, status_code: int, payload: BaseModel):
        self.status_code = status_code
        self.payload = payload
        super().__init__(str(payload))


def build_validation_details(exc: RequestValidationError | PydanticValidationError) -> list[str]:
    details: list[str] = []
    for error in exc.errors():
        location = ".".join(str(part) for part in error["loc"])
        details.append(f"{location}: {error['msg']}")
    return details


def validation_error(message: str, details: Optional[list[str]] = None) -> ApiException:
    return ApiException(
        status_code=400,
        payload=ValidationError(message=message, details=details),
    )


def invalid_slot_time_error() -> ApiException:
    return ApiException(status_code=400, payload=InvalidSlotTimeError())


def duplicate_duration_error() -> ApiException:
    return ApiException(status_code=409, payload=DuplicateDurationError())


def conflict_error() -> ApiException:
    return ApiException(status_code=409, payload=ConflictError())


def not_found_error(message: str) -> ApiException:
    return ApiException(status_code=404, payload=NotFoundError(message=message))


def unauthorized_error(
    message: str = "Missing or invalid authorization header. Use Bearer token.",
) -> ApiException:
    return ApiException(status_code=401, payload=UnauthorizedError(message=message))


def forbidden_error(
    message: str = "Provided token does not grant access to this resource.",
) -> ApiException:
    return ApiException(status_code=403, payload=ForbiddenError(message=message))


async def api_exception_handler(_: Request, exc: ApiException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.payload.model_dump())


async def request_validation_exception_handler(
    _: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    payload = ValidationError(
        message="Request validation failed",
        details=build_validation_details(exc),
    )
    return JSONResponse(status_code=400, content=payload.model_dump())
