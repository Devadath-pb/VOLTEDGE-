from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.battery import Battery
from app.models.monitoring_session import (
    MonitoringSession,
    MonitoringSessionStatus,
)
from app.schemas.monitoring_session import MonitoringSessionStart
from app.services.capacity_service import CapacityService


class SessionService:

    @staticmethod
    def get_all_sessions(db: Session):
        """Return all monitoring sessions ordered by newest first."""

        return (
            db.query(MonitoringSession)
            .order_by(MonitoringSession.start_time.desc())
            .all()
        )

    @staticmethod
    def get_session_by_id(db: Session, session_id: UUID):
        """Return a single monitoring session by ID."""

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

        return session

    @staticmethod
    def get_sessions_by_battery(
        db: Session,
        battery_id: UUID,
    ):
        """Return monitoring sessions for one battery ordered by newest first."""

        battery = (
            db.query(Battery)
            .filter(Battery.battery_id == battery_id)
            .first()
        )

        if battery is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Battery not found",
            )

        return (
            db.query(MonitoringSession)
            .filter(MonitoringSession.battery_id == battery_id)
            .order_by(MonitoringSession.start_time.desc())
            .all()
        )

    @staticmethod
    def start_session(
        db: Session,
        session: MonitoringSessionStart,
    ):

        battery = (
            db.query(Battery)
            .filter(Battery.battery_id == session.battery_id)
            .first()
        )

        if battery is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Battery not found",
            )

        now = datetime.now(timezone.utc)

        active_sessions = (
            db.query(MonitoringSession)
            .filter(MonitoringSession.status == MonitoringSessionStatus.ACTIVE)
            .all()
        )

        for active_session in active_sessions:
            active_session.status = MonitoringSessionStatus.COMPLETED
            active_session.end_time = now
            CapacityService.finalize_capacity(db, active_session)

        db_session = MonitoringSession(
            battery_id=session.battery_id,
            status=MonitoringSessionStatus.ACTIVE,
            test_status="ACTIVE",
            running_capacity_mah=0.0,
            start_time=now,
        )

        db.add(db_session)

        db.commit()

        db.refresh(db_session)

        return db_session

    @staticmethod
    def stop_session(db: Session):

        active_sessions = (
            db.query(MonitoringSession)
            .filter(MonitoringSession.status == MonitoringSessionStatus.ACTIVE)
            .all()
        )

        if not active_sessions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active monitoring session found",
            )

        now = datetime.now(timezone.utc)

        for active_session in active_sessions:
            active_session.status = MonitoringSessionStatus.COMPLETED
            active_session.end_time = now
            CapacityService.finalize_capacity(db, active_session)

        db.commit()

        active_session = active_sessions[0]

        db.refresh(active_session)

        return active_session

    @staticmethod
    def get_active_session(db: Session):

        return (
            db.query(MonitoringSession)
            .filter(MonitoringSession.status == MonitoringSessionStatus.ACTIVE)
            .first()
        )

    @staticmethod
    def get_session_analysis(db: Session, session_id: UUID):

        return CapacityService.summarize_session(db, session_id)
