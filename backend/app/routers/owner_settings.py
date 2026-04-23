from fastapi import APIRouter, Depends

from app.dependencies import get_storage, require_owner_auth
from app.models import OwnerSettings, UpdateOwnerSettingsRequest
from app.services import update_owner_settings
from app.storage import Storage

router = APIRouter(
    prefix="/api/owner",
    tags=["Owner"],
    dependencies=[Depends(require_owner_auth)],
)


@router.patch("/settings", response_model=OwnerSettings)
def patch_settings(
    body: UpdateOwnerSettingsRequest,
    storage: Storage = Depends(get_storage),
) -> OwnerSettings:
    return update_owner_settings(storage, body)
