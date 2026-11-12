from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.device_security import get_device_db
from app.schemas.battery_cycle import BatteryCycleStart, PhaseTransitionRequest
from app.schemas.telemetry import TelemetryCreate, TelemetryResponse
from app.services.battery_service import BatteryService
from app.services.cycle_service import CycleService
from app.services.telemetry_service import TelemetryService


router = APIRouter(prefix="/device", tags=["Device ingestion"])


@router.get("/battery")
def device_active_battery(db_and_context=Depends(get_device_db)):
    db, _ = db_and_context
    return BatteryService.get_active_battery(db)


@router.post("/cycle/start")
def device_start_cycle(db_and_context=Depends(get_device_db)):
    db, context = db_and_context
    return CycleService.start_cycle(db, BatteryCycleStart(battery_id=context["battery_id"]))


@router.post("/cycle/phase")
def device_change_phase(transition: PhaseTransitionRequest, db_and_context=Depends(get_device_db)):
    db, context = db_and_context
    active = CycleService.get_active_cycle(db, context["battery_id"])
    return CycleService.transition_phase(db, active.id if active else None, transition.phase)


@router.post("/cycle/stop")
def device_stop_cycle(db_and_context=Depends(get_device_db)):
    db, context = db_and_context
    active = CycleService.get_active_cycle(db, context["battery_id"])
    return CycleService.stop_cycle(db, active.id if active else None)


@router.post("/telemetry", response_model=TelemetryResponse, status_code=status.HTTP_201_CREATED)
def ingest_device_telemetry(
    telemetry: TelemetryCreate,
    db_and_context=Depends(get_device_db),
):
    db, context = db_and_context
    telemetry.battery_id = context["battery_id"]
    return TelemetryService.create_telemetry(db, telemetry)


@router.get("/status")
def device_status(db_and_context=Depends(get_device_db)):
    _, context = db_and_context
    return {"status": "connected", "device_id": str(context["device_id"]), "battery_id": str(context["battery_id"])}
