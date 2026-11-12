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
    def get_active_battery(db: Session):
        """Fetch the currently active battery."""
        active = db.query(Battery).filter(Battery.is_active == True).first()
        if not active:
            active = db.query(Battery).first()
        return active

    @staticmethod
    def set_active_battery(db: Session, battery_id: UUID):
        """Mark a specific battery as active and deactivate all others."""
        target = db.query(Battery).filter(Battery.battery_id == battery_id).first()
        if not target:
            return None

        db.query(Battery).update({Battery.is_active: False}, synchronize_session=False)
        target.is_active = True
        db.commit()
        db.refresh(target)
        return target

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
    def create_battery(db: Session, battery: BatteryCreate, owner_id: UUID):

        db_battery = Battery(**battery.model_dump(), owner_id=owner_id)

        db.add(db_battery)

        db.commit()

        db.refresh(db_battery)

        return db_battery
