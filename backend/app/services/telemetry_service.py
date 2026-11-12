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
