from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.monitoring_session import (
    MonitoringSession,
    MonitoringSessionStatus,
)
from app.models.telemetry import Telemetry
from app.schemas.telemetry import TelemetryCreate


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
    def create_telemetry(
        db: Session,
        telemetry: TelemetryCreate,
    ):

        active_session = (
            db.query(MonitoringSession)
            .filter(MonitoringSession.status == MonitoringSessionStatus.ACTIVE)
            .first()
        )

        if active_session is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active monitoring session found",
            )

        db_telemetry = Telemetry(
            session_id=active_session.id,
            **telemetry.model_dump()
        )

        db.add(db_telemetry)

        db.commit()

        db.refresh(db_telemetry)

        return db_telemetry
