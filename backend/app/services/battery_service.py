from uuid import UUID

from sqlalchemy.orm import Session

from app.models.battery import Battery
from app.models.monitoring_session import MonitoringSession
from app.models.telemetry import Telemetry
from app.schemas.battery import BatteryCreate


class BatteryService:

    @staticmethod
    def get_all_batteries(db: Session):

        return db.query(Battery).all()

    @staticmethod
    def get_battery_by_id(
        db: Session,
        battery_id: UUID,
    ):

        return (
            db.query(Battery)
            .filter(Battery.battery_id == battery_id)
            .first()
        )

    @staticmethod
    def delete_battery(
        db: Session,
        battery_id: UUID,
    ):
        """Delete a battery and all monitoring data linked to it."""

        battery = (
            db.query(Battery)
            .filter(Battery.battery_id == battery_id)
            .first()
        )

        if battery is None:
            return None

        sessions = (
            db.query(MonitoringSession)
            .filter(MonitoringSession.battery_id == battery_id)
            .all()
        )

        session_ids = [
            session.id
            for session in sessions
        ]

        if session_ids:
            (
                db.query(Telemetry)
                .filter(Telemetry.session_id.in_(session_ids))
                .delete(synchronize_session=False)
            )

        (
            db.query(MonitoringSession)
            .filter(MonitoringSession.battery_id == battery_id)
            .delete(synchronize_session=False)
        )

        db.delete(battery)

        db.commit()

        return battery

    @staticmethod
    def create_battery(
        db: Session,
        battery: BatteryCreate,
    ):

        db_battery = Battery(**battery.model_dump())

        db.add(db_battery)

        db.commit()

        db.refresh(db_battery)

        return db_battery
