from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TelemetryCreate(BaseModel):
    voltage: float
    current: float
    power: float
    soc: float | None = None
    temperature: float | None = None
    mode: str = Field(..., min_length=1, max_length=50)
    relay: bool
    timestamp: int = Field(..., ge=0)
    battery_id: UUID | None = None
    cycle_id: UUID | None = None
    phase: str | None = None
    energy_wh: float | None = None


class TelemetryResponse(BaseModel):
    id: UUID
    session_id: UUID | None = None
    battery_id: UUID | None = None
    cycle_id: UUID | None = None
    phase: str | None = None
    voltage: float
    current: float
    power: float
    soc: float | None = None
    energy_wh: float | None = None
    temperature: float | None
    mode: str
    relay: bool
    timestamp: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
