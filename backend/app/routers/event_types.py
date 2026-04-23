from fastapi import APIRouter, Depends

from app.dependencies import get_storage, require_owner_auth
from app.models import CreateEventTypeRequest, EventType, UpdateEventTypeRequest
from app.services import (
    create_event_type,
    delete_event_type,
    list_event_types,
    update_event_type,
)
from app.storage import Storage

router = APIRouter(prefix="/api/event-types", tags=["Public"])


@router.get("", response_model=list[EventType])
def get_event_types(storage: Storage = Depends(get_storage)) -> list[EventType]:
    return list_event_types(storage)


router_owner = APIRouter(
    prefix="/api/owner/event-types",
    tags=["Owner"],
    dependencies=[Depends(require_owner_auth)],
)


@router_owner.post("", response_model=EventType)
def create_owner_event_type(
    body: CreateEventTypeRequest,
    storage: Storage = Depends(get_storage),
) -> EventType:
    return create_event_type(storage, body)


@router_owner.patch("/{id}", response_model=EventType)
def patch_event_type(
    id: str,
    body: UpdateEventTypeRequest,
    storage: Storage = Depends(get_storage),
) -> EventType:
    return update_event_type(storage, id, body)


@router_owner.delete("/{id}", status_code=204)
def remove_event_type(id: str, storage: Storage = Depends(get_storage)) -> None:
    delete_event_type(storage, id)
    return None
