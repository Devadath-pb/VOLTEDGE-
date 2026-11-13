from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.device import Device
from app.models.telemetry import Telemetry
from app.services.battery_service import BatteryService


router = APIRouter(prefix="/api/battery", tags=["Live battery"])

LIVE_WINDOW_SECONDS = 15


def _iso(value):
    return value.isoformat() if value else None


def _state(telemetry: Telemetry) -> str:
    value = (telemetry.mode or telemetry.phase or "IDLE").strip().lower()
    return value if value in {"charging", "discharging", "idle"} else "idle"


def _reading(telemetry: Telemetry | None):
    if telemetry is None:
        return None

    cycle = telemetry.cycle
    return {
        "timestamp": _iso(telemetry.created_at),
        "voltage": telemetry.voltage,
        "current": telemetry.current,
        "power": telemetry.power,
        "temperature": telemetry.temperature,
        "soc": telemetry.soc,
        "soh": cycle.estimated_soh if cycle else None,
        "cycleCount": cycle.cycle_number if cycle else None,
        "state": _state(telemetry),
        "relay": telemetry.relay,
    }


def _latest_for_battery(db: Session, battery_id):
    return (
        db.query(Telemetry)
        .options(joinedload(Telemetry.cycle))
        .filter(Telemetry.battery_id == battery_id)
        .order_by(Telemetry.created_at.desc(), Telemetry.timestamp.desc())
        .first()
    )


def _payload(db: Session):
    battery = BatteryService.get_active_battery(db)
    if battery is None:
        return {
            "connected": False,
            "battery": None,
            "device": None,
            "reading": None,
            "lastCommunication": None,
            "demo": False,
        }

    latest = _latest_for_battery(db, battery.battery_id)
    last_communication = latest.created_at if latest else None
    age_seconds = (
        (datetime.now(timezone.utc) - last_communication).total_seconds()
        if last_communication
        else None
    )
    connected = age_seconds is not None and age_seconds <= LIVE_WINDOW_SECONDS
    device = (
        db.query(Device)
        .filter(Device.battery_id == battery.battery_id, Device.is_active.is_(True))
        .first()
    )

    return {
        "connected": connected,
        "battery": {
            "id": str(battery.battery_id),
            "serialNumber": battery.serial_number,
            "manufacturer": battery.manufacturer,
            "model": battery.model,
        },
        "device": {
            "id": str(device.device_id),
            "name": device.name,
            "lastSeenAt": _iso(device.last_seen_at),
        } if device else None,
        "reading": _reading(latest),
        "lastCommunication": _iso(last_communication),
        "demo": False,
    }


@router.get("/live")
def get_live_battery(db: Session = Depends(get_db)):
    return _payload(db)


@router.get("/status")
def get_battery_status(db: Session = Depends(get_db)):
    payload = _payload(db)
    return {
        "connected": payload["connected"],
        "device": payload["device"]["name"] if payload["device"] else None,
        "deviceId": payload["device"]["id"] if payload["device"] else None,
        "battery": payload["battery"],
        "lastCommunication": payload["lastCommunication"],
        "demo": False,
    }


@router.get("/history")
def get_battery_history(limit: int = 500, db: Session = Depends(get_db)):
    battery = BatteryService.get_active_battery(db)
    if battery is None:
        return []

    safe_limit = min(max(limit, 1), 1000)
    rows = (
        db.query(Telemetry)
        .options(joinedload(Telemetry.cycle))
        .filter(Telemetry.battery_id == battery.battery_id)
        .order_by(Telemetry.created_at.desc(), Telemetry.timestamp.desc())
        .limit(safe_limit)
        .all()
    )

    return [
        {
            "id": str(row.id),
            "timestamp": _iso(row.created_at),
            "voltage": row.voltage,
            "current": row.current,
            "power": row.power,
            "temperature": row.temperature,
            "soc": row.soc,
            "predictedSoh": row.cycle.estimated_soh if row.cycle else None,
            "cycle": row.cycle.cycle_number if row.cycle else None,
            "state": _state(row),
        }
        for row in reversed(rows)
    ]
