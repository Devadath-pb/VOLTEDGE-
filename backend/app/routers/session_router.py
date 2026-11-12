from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.monitoring_session import (
    MonitoringSessionResponse,
    MonitoringSessionStart,
    SessionAnalysisResponse,
)
from app.services.session_service import SessionService

router = APIRouter(
    prefix="/sessions",
    tags=["Monitoring Sessions"],
)

battery_session_router = APIRouter(
    prefix="/batteries",
    tags=["Monitoring Sessions"],
)


@router.get(
    "",
    response_model=list[MonitoringSessionResponse],
)
def get_all_sessions(
    db: Session = Depends(get_db),
):
    return SessionService.get_all_sessions(db)


@router.get(
    "/active",
    response_model=MonitoringSessionResponse | None,
)
def get_active_session(
    db: Session = Depends(get_db),
):
    return SessionService.get_active_session(db)


@router.get(
    "/{session_id}",
    response_model=MonitoringSessionResponse,
)
def get_session(
    session_id: UUID,
    db: Session = Depends(get_db),
):
    return SessionService.get_session_by_id(db, session_id)


@router.get(
    "/{session_id}/analysis",
    response_model=SessionAnalysisResponse,
)
def get_session_analysis(
    session_id: UUID,
    db: Session = Depends(get_db),
):
    return SessionService.get_session_analysis(db, session_id)


@battery_session_router.get(
    "/{battery_id}/sessions",
    response_model=list[MonitoringSessionResponse],
)
def get_sessions_by_battery(
    battery_id: UUID,
    db: Session = Depends(get_db),
):
    return SessionService.get_sessions_by_battery(db, battery_id)


@router.post(
    "/start",
    response_model=MonitoringSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_session(
    session: MonitoringSessionStart,
    db: Session = Depends(get_db),
):
    return SessionService.start_session(db, session)


@router.post(
    "/stop",
    response_model=MonitoringSessionResponse,
)
def stop_session(
    db: Session = Depends(get_db),
):
    return SessionService.stop_session(db)
