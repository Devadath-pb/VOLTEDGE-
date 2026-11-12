from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas.battery import BatteryCreate, BatteryResponse
from app.services.battery_service import BatteryService

router = APIRouter(
    prefix="/batteries",
    tags=["Batteries"],
)


@router.get(
    "/active",
    response_model=BatteryResponse | None,
)
def get_active_battery(
    db: Session = Depends(get_db),
):
    return BatteryService.get_active_battery(db)


@router.post(
    "/{battery_id}/set-active",
    response_model=BatteryResponse,
)
def set_active_battery(
    battery_id: UUID,
    db: Session = Depends(get_db),
):
    battery = BatteryService.set_active_battery(db, battery_id)
    if battery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )
    return battery


@router.get(
    "/",
    response_model=list[BatteryResponse],
)
def get_all_batteries(
    db: Session = Depends(get_db),
):
    return BatteryService.get_all_batteries(db)


@router.post(
    "/",
    response_model=BatteryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_battery(
    battery: BatteryCreate,
    db: Session = Depends(get_db),
    owner_id: UUID = Depends(get_current_user_id),
):
    return BatteryService.create_battery(db, battery, owner_id)


@router.get(
    "/{battery_id}",
    response_model=BatteryResponse,
)
def get_battery_by_id(
    battery_id: UUID,
    db: Session = Depends(get_db),
):
    battery = BatteryService.get_battery_by_id(db, battery_id)

    if battery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )

    return battery


@router.delete(
    "/{battery_id}",
)
def delete_battery(
    battery_id: UUID,
    db: Session = Depends(get_db),
):
    battery = BatteryService.delete_battery(db, battery_id)

    if battery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )

    return {
        "message": "Battery deleted successfully.",
    }
