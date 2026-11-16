from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.device import Device
from app.schemas.battery import BatteryCreate, BatteryResponse
from app.schemas.device import DeviceProvisionRequest
from app.services.battery_service import BatteryService
from app.services.device_service import DeviceService

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
    owner_id: UUID = Depends(get_current_user_id),
):
    return BatteryService.get_active_battery(db, owner_id)


@router.post(
    "/{battery_id}/set-active",
    response_model=BatteryResponse,
)
def set_active_battery(
    battery_id: UUID,
    db: Session = Depends(get_db),
    owner_id: UUID = Depends(get_current_user_id),
):
    battery = BatteryService.set_active_battery(db, battery_id, owner_id)
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
    owner_id: UUID = Depends(get_current_user_id),
):
    return BatteryService.get_all_batteries(db, owner_id)


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
    try:
        return BatteryService.create_battery(db, battery, owner_id)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A battery with this serial number already exists.",
        ) from exc


@router.post(
    "/{battery_id}/device-key",
    status_code=status.HTTP_201_CREATED,
)
def provision_device_key(
    battery_id: UUID,
    request: DeviceProvisionRequest | None = None,
    db: Session = Depends(get_db),
    owner_id: UUID = Depends(get_current_user_id),
):
    battery = BatteryService.get_battery_by_id(db, battery_id, owner_id)
    if battery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )

    existing = db.query(Device).filter(Device.battery_id == battery_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This battery already has a registered device. Rebind or rotate that device instead.",
        )

    try:
        device, plaintext_key = DeviceService.provision_for_battery(
            db,
            owner_id,
            battery_id,
            (request.name if request else "VoltEdge ESP32-C3"),
        )
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This battery already has a registered device. Rebind or rotate that device instead.",
        ) from exc
    return {
        "device_id": str(device.device_id),
        "battery_id": str(device.battery_id),
        "name": device.name,
        "device_key": plaintext_key,
        "warning": "Save this key now. It is shown only once and cannot be recovered.",
    }


@router.get(
    "/{battery_id}",
    response_model=BatteryResponse,
)
def get_battery_by_id(
    battery_id: UUID,
    db: Session = Depends(get_db),
    owner_id: UUID = Depends(get_current_user_id),
):
    battery = BatteryService.get_battery_by_id(db, battery_id, owner_id)

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
    owner_id: UUID = Depends(get_current_user_id),
):
    battery = BatteryService.delete_battery(db, battery_id, owner_id)

    if battery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Battery not found",
        )

    return {
        "message": "Battery deleted successfully.",
    }
