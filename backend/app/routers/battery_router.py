from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.battery import BatteryCreate, BatteryResponse
from app.services.battery_service import BatteryService

router = APIRouter(
    prefix="/batteries",
    tags=["Batteries"],
)


@router.post(
    "/",
    response_model=BatteryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_battery(
    battery: BatteryCreate,
    db: Session = Depends(get_db),
):
    return BatteryService.create_battery(db, battery)