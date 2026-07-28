from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.telemetry import TelemetryCreate, TelemetryResponse
from app.services.telemetry_service import TelemetryService

router = APIRouter(
    prefix="/telemetry",
    tags=["Telemetry"],
)

session_telemetry_router = APIRouter(
    prefix="/sessions",
    tags=["Telemetry"],
)


@session_telemetry_router.get(
    "/{session_id}/telemetry",
    response_model=list[TelemetryResponse],
)
def get_telemetry_by_session(
    session_id: UUID,
    db: Session = Depends(get_db),
):
    return TelemetryService.get_telemetry_by_session(db, session_id)


@router.post(
    "",
    response_model=TelemetryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_telemetry(
    telemetry: TelemetryCreate,
    db: Session = Depends(get_db),
):
    return TelemetryService.create_telemetry(db, telemetry)
