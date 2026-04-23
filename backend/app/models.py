from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, field_validator, model_validator

from app.time_utils import parse_clock


DurationMinutes = Literal[15, 30]


def _validate_required_text(value: str, field_name: str) -> str:
    normalized_value = value.strip()
    if not normalized_value:
        raise ValueError(f"{field_name} must not be empty")
    return normalized_value


def _validate_email(value: str) -> str:
    normalized_value = value.strip()
    if normalized_value.count("@") != 1:
        raise ValueError("guestEmail must be a valid email address")

    local_part, domain = normalized_value.split("@")
    if not local_part or not domain or "." not in domain:
        raise ValueError("guestEmail must be a valid email address")

    return normalized_value


class EventType(BaseModel):
    id: str
    name: str
    description: str
    durationMinutes: DurationMinutes


class CreateEventTypeRequest(BaseModel):
    name: str
    description: str
    durationMinutes: DurationMinutes

    @field_validator("name")
    def validate_name(cls, value: str) -> str:
        return _validate_required_text(value, "name")

    @field_validator("durationMinutes")
    def validate_duration(cls, v: int) -> int:
        if v not in (15, 30):
            raise ValueError("durationMinutes must be 15 or 30")
        return v


class UpdateEventTypeRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

    @field_validator("name")
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _validate_required_text(value, "name")


class OwnerSettings(BaseModel):
    name: str
    avatarUrl: Optional[str] = None
    workDayStart: str = "09:00"
    workDayEnd: str = "18:00"

    @field_validator("name")
    def validate_name(cls, value: str) -> str:
        return _validate_required_text(value, "name")

    @field_validator("workDayStart", "workDayEnd")
    def validate_work_time_format(cls, value: str) -> str:
        parse_clock(value)
        return value

    @model_validator(mode="after")
    def validate_work_time_range(self) -> "OwnerSettings":
        if parse_clock(self.workDayStart) >= parse_clock(self.workDayEnd):
            raise ValueError("workDayStart must be earlier than workDayEnd")
        return self


class UpdateOwnerSettingsRequest(BaseModel):
    name: Optional[str] = None
    avatarUrl: Optional[str] = None
    workDayStart: Optional[str] = None
    workDayEnd: Optional[str] = None

    @field_validator("name")
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        return _validate_required_text(value, "name")

    @field_validator("workDayStart", "workDayEnd")
    def validate_optional_work_time_format(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        parse_clock(value)
        return value


class Slot(BaseModel):
    startAt: datetime
    endAt: datetime
    isBooked: bool


class Booking(BaseModel):
    id: str
    eventTypeId: str
    eventTypeName: str
    guestName: str
    guestEmail: str
    startAt: datetime
    endAt: datetime
    createdAt: datetime


class CreateBookingRequest(BaseModel):
    eventTypeId: str
    guestName: str
    guestEmail: str
    startAt: datetime

    @field_validator("guestName")
    def validate_guest_name(cls, value: str) -> str:
        return _validate_required_text(value, "guestName")

    @field_validator("guestEmail")
    def validate_guest_email(cls, value: str) -> str:
        return _validate_email(value)


class ConflictError(BaseModel):
    error: Literal["SLOT_ALREADY_BOOKED"] = "SLOT_ALREADY_BOOKED"
    message: str = "Выбранный слот уже занят. Пожалуйста, выберите другое время."


class InvalidSlotTimeError(BaseModel):
    error: Literal["INVALID_SLOT_TIME"] = "INVALID_SLOT_TIME"
    message: str = "Недопустимое время начала слота. Время должно соответствовать сетке и быть в рамках рабочих часов."


class DuplicateDurationError(BaseModel):
    error: Literal["DUPLICATE_DURATION"] = "DUPLICATE_DURATION"
    message: str = "Тип события с такой длительностью уже существует. Разрешено только по одному типу для 15 и 30 минут."


class NotFoundError(BaseModel):
    error: Literal["NOT_FOUND"] = "NOT_FOUND"
    message: str


class UnauthorizedError(BaseModel):
    error: Literal["UNAUTHORIZED"] = "UNAUTHORIZED"
    message: str = "Missing or invalid authorization header. Use Bearer token."


class ForbiddenError(BaseModel):
    error: Literal["FORBIDDEN"] = "FORBIDDEN"
    message: str = "Provided token does not grant access to this resource."


class ValidationError(BaseModel):
    error: Literal["VALIDATION_ERROR"] = "VALIDATION_ERROR"
    message: str
    details: Optional[list[str]] = None
