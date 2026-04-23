from datetime import datetime

from app.models import Booking
from app.time_utils import UTC


def test_create_booking_returns_contract_error_for_invalid_slot(client):
    response = client.post(
        "/api/bookings",
        json={
            "eventTypeId": "event-type-15",
            "guestName": "Alice",
            "guestEmail": "alice@example.com",
            "startAt": "2035-01-10T09:10:00Z",
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "INVALID_SLOT_TIME"


def test_list_slots_maps_request_validation_to_contract_error(client):
    response = client.get(
        "/api/slots",
        params={
            "eventTypeId": "event-type-15",
            "startDate": "not-a-date",
            "endDate": "2035-01-10",
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "VALIDATION_ERROR"


def test_list_slots_rejects_inverted_date_range(client):
    response = client.get(
        "/api/slots",
        params={
            "eventTypeId": "event-type-15",
            "startDate": "2035-01-11",
            "endDate": "2035-01-10",
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "VALIDATION_ERROR"


def test_owner_bookings_end_date_filter_is_inclusive(client, storage, owner_headers):
    storage.save_booking(
        Booking(
            id="booking-1",
            eventTypeId="event-type-15",
            eventTypeName="Встреча 15 минут",
            guestName="Alice",
            guestEmail="alice@example.com",
            startAt=datetime(2035, 1, 10, 9, 0, tzinfo=UTC),
            endAt=datetime(2035, 1, 10, 9, 15, tzinfo=UTC),
            createdAt=datetime(2035, 1, 1, 9, 0, tzinfo=UTC),
        )
    )
    storage.save_booking(
        Booking(
            id="booking-2",
            eventTypeId="event-type-15",
            eventTypeName="Встреча 15 минут",
            guestName="Bob",
            guestEmail="bob@example.com",
            startAt=datetime(2035, 1, 10, 17, 45, tzinfo=UTC),
            endAt=datetime(2035, 1, 10, 18, 0, tzinfo=UTC),
            createdAt=datetime(2035, 1, 1, 9, 0, tzinfo=UTC),
        )
    )
    storage.save_booking(
        Booking(
            id="booking-3",
            eventTypeId="event-type-15",
            eventTypeName="Встреча 15 минут",
            guestName="Carol",
            guestEmail="carol@example.com",
            startAt=datetime(2035, 1, 11, 9, 0, tzinfo=UTC),
            endAt=datetime(2035, 1, 11, 9, 15, tzinfo=UTC),
            createdAt=datetime(2035, 1, 1, 9, 0, tzinfo=UTC),
        )
    )

    response = client.get(
        "/api/owner/bookings",
        params={"endDate": "2035-01-10"},
        headers=owner_headers,
    )

    assert response.status_code == 200
    assert [booking["id"] for booking in response.json()] == ["booking-1", "booking-2"]


def test_update_owner_settings_returns_contract_validation_error(client, owner_headers):
    response = client.patch(
        "/api/owner/settings",
        json={
            "workDayStart": "18:00",
            "workDayEnd": "09:00",
        },
        headers=owner_headers,
    )

    assert response.status_code == 400
    assert response.json()["error"] == "VALIDATION_ERROR"


def test_update_owner_settings_rejects_blank_name(client, owner_headers):
    response = client.patch(
        "/api/owner/settings",
        json={
            "name": "   ",
        },
        headers=owner_headers,
    )

    assert response.status_code == 400
    assert response.json()["error"] == "VALIDATION_ERROR"


def test_create_event_type_rejects_duplicate_duration(client, owner_headers):
    response = client.post(
        "/api/owner/event-types",
        json={
            "name": "Another short call",
            "description": "Duplicate duration",
            "durationMinutes": 15,
        },
        headers=owner_headers,
    )

    assert response.status_code == 409
    assert response.json()["error"] == "DUPLICATE_DURATION"


def test_create_booking_rejects_invalid_email(client):
    response = client.post(
        "/api/bookings",
        json={
            "eventTypeId": "event-type-15",
            "guestName": "Alice",
            "guestEmail": "not-an-email",
            "startAt": "2035-01-10T09:00:00Z",
        },
    )

    assert response.status_code == 400
    assert response.json()["error"] == "VALIDATION_ERROR"


def test_owner_bookings_reject_inverted_date_range(client, owner_headers):
    response = client.get(
        "/api/owner/bookings",
        params={
            "startDate": "2035-01-11",
            "endDate": "2035-01-10",
        },
        headers=owner_headers,
    )

    assert response.status_code == 400
    assert response.json()["error"] == "VALIDATION_ERROR"


def test_owner_endpoints_require_authorization_header(client):
    response = client.get("/api/owner/bookings")

    assert response.status_code == 401
    assert response.json()["error"] == "UNAUTHORIZED"


def test_owner_endpoints_reject_invalid_token(client):
    response = client.get(
        "/api/owner/bookings",
        headers={"Authorization": "Bearer wrong-token"},
    )

    assert response.status_code == 403
    assert response.json()["error"] == "FORBIDDEN"


def test_cors_preflight_allows_configured_origin(client):
    response = client.options(
        "/api/bookings",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_cors_preflight_blocks_non_allowlisted_origin(client):
    response = client.options(
        "/api/bookings",
        headers={
            "Origin": "https://evil.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 400
    assert response.headers.get("access-control-allow-origin") is None


def test_security_headers_are_present(client):
    response = client.get("/api/settings")

    assert response.status_code == 200
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
