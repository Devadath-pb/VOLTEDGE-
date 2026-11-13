from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.battery import Battery
from app.models.battery_cycle import BatteryCycle
from app.models.monitoring_session import (
    MonitoringSession,
    MonitoringSessionStatus,
)
from app.models.telemetry import Telemetry
from app.schemas.telemetry import TelemetryCreate
from app.services.capacity_service import CapacityService
from app.services.cycle_service import CycleService
from app.services.soc_service import (
    DEFAULT_RATED_CAPACITY_MAH,
    elapsed_since,
    estimate_from_voltage,
    integrate_soc,
)


class TelemetryService:

    @staticmethod
    def get_telemetry_by_session(
        db: Session,
        session_id: UUID,
    ):
        """Return telemetry for one monitoring session ordered by timestamp."""
        session = (
            db.query(MonitoringSession)
            .filter(MonitoringSession.id == session_id)
            .first()
        )

        if session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Monitoring session not found",
            )

        return (
            db.query(Telemetry)
            .filter(Telemetry.session_id == session_id)
            .order_by(Telemetry.timestamp.asc())
            .all()
        )

    @staticmethod
    def get_telemetry_by_cycle(
        db: Session,
        cycle_id: UUID,
    ):
        """Return telemetry for one battery cycle ordered by timestamp."""
        cycle = (
            db.query(BatteryCycle)
            .filter(BatteryCycle.id == cycle_id)
            .first()
        )

        if cycle is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Battery cycle not found",
            )

        return (
            db.query(Telemetry)
            .filter(Telemetry.cycle_id == cycle_id)
            .order_by(Telemetry.timestamp.asc())
            .all()
        )

    @staticmethod
    def create_telemetry(
        db: Session,
        telemetry: TelemetryCreate,
    ):
        # Look for active BatteryCycle
        active_cycle = CycleService.get_active_cycle(db, telemetry.battery_id)
        active_session = (
            db.query(MonitoringSession)
            .filter(MonitoringSession.status == MonitoringSessionStatus.ACTIVE)
            .first()
        )

        # If no active cycle exists, but telemetry is received, check if an active battery exists to start cycle
        if active_cycle is None:
            active_battery = (
                db.query(Battery)
                .filter(Battery.is_active == True)
                .first()
            )
            if active_battery:
                from app.schemas.battery_cycle import BatteryCycleStart
                active_cycle = CycleService.start_cycle(
                    db,
                    BatteryCycleStart(battery_id=active_battery.battery_id)
                )

        tele_data = telemetry.model_dump()

        if active_session:
            tele_data["session_id"] = active_session.id

        if active_cycle:
            tele_data["cycle_id"] = active_cycle.id
            tele_data["battery_id"] = active_cycle.battery_id
            tele_data["phase"] = tele_data.get("phase") or active_cycle.status or tele_data.get("mode")

        # Use a device-provided SOC when available. Until the OTA firmware is
        # installed, calculate SOC from the existing voltage/current stream.
        battery = (
            db.query(Battery)
            .filter(Battery.battery_id == tele_data.get("battery_id"))
            .first()
            if tele_data.get("battery_id")
            else None
        )
        rated_capacity_mah = float(
            battery.rated_capacity_mah
            if battery and battery.rated_capacity_mah and battery.rated_capacity_mah > 0
            else DEFAULT_RATED_CAPACITY_MAH
        )

        if tele_data.get("soc") is not None:
            tele_data["soc"] = max(0.0, min(100.0, float(tele_data["soc"])))
            tele_data["soc_method"] = "device"
        else:
            previous = (
                db.query(Telemetry)
                .filter(Telemetry.battery_id == tele_data.get("battery_id"))
                .order_by(Telemetry.created_at.desc(), Telemetry.timestamp.desc())
                .first()
                if tele_data.get("battery_id")
                else None
            )
            previous_soc = previous.soc if previous and previous.soc is not None else None
            if previous_soc is None and previous is not None:
                previous_soc = estimate_from_voltage(previous.voltage)

            if previous is None or previous_soc is None:
                tele_data["soc"] = estimate_from_voltage(tele_data.get("voltage"))
                tele_data["soc_method"] = "voltage_estimate"
            else:
                elapsed_seconds = elapsed_since(previous.created_at)
                if elapsed_seconds is None or elapsed_seconds > 300:
                    tele_data["soc"] = estimate_from_voltage(tele_data.get("voltage"))
                    tele_data["soc_method"] = "voltage_estimate"
                else:
                    tele_data["soc"] = integrate_soc(
                        previous_soc=previous_soc,
                        previous_current_ma=previous.current,
                        previous_mode=previous.mode,
                        current_ma=tele_data.get("current"),
                        current_mode=tele_data.get("mode"),
                        elapsed_seconds=elapsed_seconds,
                        rated_capacity_mah=rated_capacity_mah,
                    )
                    tele_data["soc_method"] = "coulomb_counted"

        db_telemetry = Telemetry(**tele_data)

        db.add(db_telemetry)
        db.commit()
        db.refresh(db_telemetry)

        if active_session:
            CapacityService.update_running_capacity(
                db,
                active_session,
                db_telemetry
            )

        if active_cycle:
            CycleService.update_cycle_telemetry_stats(
                db,
                active_cycle,
                db_telemetry
            )

        return db_telemetry
