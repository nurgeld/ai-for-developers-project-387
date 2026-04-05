from datetime import date, datetime

import pytest

from app.errors import ApiException
from app.models import CreateBookingRequest, UpdateOwnerSettingsRequest
from app.services import create_booking, list_owner_bookings, list_slots, update_owner_settings
from app.time_utils import UTC


def test_create_booking_rejects_invalid_grid(storage):
    with pytest.raises(ApiException) as exc_info:
        create_booking(
            storage,
            CreateBookingRequest(
                eventTypeId="event-type-15",
                guestName="Alice",
                guestEmail="alice@example.com",
                startAt=datetime(2035, 1, 10, 9, 10, tzinfo=UTC),
            ),
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.payload.error == "INVALID_SLOT_TIME"


def test_update_owner_settings_rejects_inverted_workday(storage):
    with pytest.raises(ApiException) as exc_info:
        update_owner_settings(
            storage,
            UpdateOwnerSettingsRequest(workDayStart="18:00", workDayEnd="09:00"),
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.payload.error == "VALIDATION_ERROR"


def test_update_owner_settings_rejects_blank_name(storage):
    with pytest.raises(ApiException) as exc_info:
        update_owner_settings(
            storage,
            UpdateOwnerSettingsRequest.model_construct(name="   "),
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.payload.error == "VALIDATION_ERROR"


def test_list_owner_bookings_uses_inclusive_end_date(storage):
    create_booking(
        storage,
        CreateBookingRequest(
            eventTypeId="event-type-15",
            guestName="Alice",
            guestEmail="alice@example.com",
            startAt=datetime(2035, 1, 10, 9, 0, tzinfo=UTC),
        ),
    )
    create_booking(
        storage,
        CreateBookingRequest(
            eventTypeId="event-type-15",
            guestName="Bob",
            guestEmail="bob@example.com",
            startAt=datetime(2035, 1, 10, 9, 30, tzinfo=UTC),
        ),
    )
    create_booking(
        storage,
        CreateBookingRequest(
            eventTypeId="event-type-15",
            guestName="Carol",
            guestEmail="carol@example.com",
            startAt=datetime(2035, 1, 11, 9, 0, tzinfo=UTC),
        ),
    )

    bookings = list_owner_bookings(
        storage,
        end_date=date(2035, 1, 10),
        now=datetime(2035, 1, 1, 0, 0, tzinfo=UTC),
    )

    assert len(bookings) == 2
    assert {booking.guestName for booking in bookings} == {"Alice", "Bob"}


def test_list_slots_marks_overlapping_booking_as_booked(storage):
    create_booking(
        storage,
        CreateBookingRequest(
            eventTypeId="event-type-30",
            guestName="Alice",
            guestEmail="alice@example.com",
            startAt=datetime(2035, 1, 10, 9, 0, tzinfo=UTC),
        ),
    )

    slots = list_slots(
        storage,
        event_type_id="event-type-15",
        start_date=date(2035, 1, 10),
        end_date=date(2035, 1, 10),
        now=datetime(2035, 1, 9, 0, 0, tzinfo=UTC),
    )

    first_two_slots = slots[:2]
    assert len(first_two_slots) == 2
    assert all(slot.isBooked for slot in first_two_slots)


def test_list_slots_rejects_inverted_date_range(storage):
    with pytest.raises(ApiException) as exc_info:
        list_slots(
            storage,
            event_type_id="event-type-15",
            start_date=date(2035, 1, 11),
            end_date=date(2035, 1, 10),
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.payload.error == "VALIDATION_ERROR"


def test_list_owner_bookings_rejects_inverted_date_range(storage):
    with pytest.raises(ApiException) as exc_info:
        list_owner_bookings(
            storage,
            start_date=date(2035, 1, 11),
            end_date=date(2035, 1, 10),
        )

    assert exc_info.value.status_code == 400
    assert exc_info.value.payload.error == "VALIDATION_ERROR"
