from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_storage, require_owner_auth
from app.models import Booking, CreateBookingRequest
from app.services import cancel_booking, create_booking, list_owner_bookings
from app.storage import Storage

router = APIRouter(prefix="/api/bookings", tags=["Public"])


@router.post("", response_model=Booking)
def post_booking(
    body: CreateBookingRequest,
    storage: Storage = Depends(get_storage),
) -> Booking:
    return create_booking(storage, body)


router_owner = APIRouter(
    prefix="/api/owner/bookings",
    tags=["Owner"],
    dependencies=[Depends(require_owner_auth)],
)


@router_owner.get("", response_model=list[Booking])
def list_bookings(
    eventTypeId: Optional[str] = Query(None),
    startDate: Optional[date] = Query(None),
    endDate: Optional[date] = Query(None),
    storage: Storage = Depends(get_storage),
) -> list[Booking]:
    return list_owner_bookings(
        storage,
        event_type_id=eventTypeId,
        start_date=startDate,
        end_date=endDate,
    )


@router_owner.delete("/{id}", status_code=204)
def delete_owner_booking(id: str, storage: Storage = Depends(get_storage)) -> None:
    cancel_booking(storage, id)
    return None
