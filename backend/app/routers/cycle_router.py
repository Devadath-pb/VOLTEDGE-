from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.battery_cycle import (
    BatteryCycleResponse,
    BatteryCycleStart,
    CycleAnalysisResponse,
    PhaseTransitionRequest,
)
from app.services.cycle_service import CycleService

router = APIRouter(
    prefix="/cycles",
    tags=["Battery Cycles"],
)

battery_cycle_router = APIRouter(
    prefix="/batteries",
    tags=["Battery Cycles"],
)


@router.get(
    "",
    response_model=list[BatteryCycleResponse],
)
def get_all_cycles(
    battery_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    return CycleService.get_all_cycles(db, battery_id)


@router.get(
    "/active",
    response_model=BatteryCycleResponse | None,
)
def get_active_cycle(
    battery_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    return CycleService.get_active_cycle(db, battery_id)


@router.get(
    "/{cycle_id}",
    response_model=BatteryCycleResponse,
)
def get_cycle(
    cycle_id: UUID,
    db: Session = Depends(get_db),
):
    return CycleService.get_cycle_by_id(db, cycle_id)


@router.get(
    "/{cycle_id}/analysis",
    response_model=CycleAnalysisResponse,
)
def get_cycle_analysis(
    cycle_id: UUID,
    db: Session = Depends(get_db),
):
    return CycleService.summarize_cycle(db, cycle_id)


@battery_cycle_router.get(
    "/{battery_id}/cycles",
    response_model=list[BatteryCycleResponse],
)
def get_cycles_by_battery(
    battery_id: UUID,
    db: Session = Depends(get_db),
):
    return CycleService.get_all_cycles(db, battery_id)


@router.post(
    "/start",
    response_model=BatteryCycleResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_cycle(
    start_data: BatteryCycleStart,
    db: Session = Depends(get_db),
):
    return CycleService.start_cycle(db, start_data)


@router.post(
    "/toggle-phase",
    response_model=BatteryCycleResponse,
)
def toggle_phase(
    transition: PhaseTransitionRequest | None = None,
    cycle_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    target_phase = transition.phase if transition else "DISCHARGING"
    return CycleService.transition_phase(db, cycle_id, target_phase)


@router.post(
    "/stop",
    response_model=BatteryCycleResponse,
)
def stop_cycle(
    cycle_id: UUID | None = None,
    db: Session = Depends(get_db),
):
    return CycleService.stop_cycle(db, cycle_id)
