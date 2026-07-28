from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TelemetryCreate(BaseModel):
    voltage: float
    current: float
    power: float
    temperature: float | None = None
    mode: str = Field(..., min_length=1, max_length=50)
    relay: bool
    timestamp: int = Field(..., ge=0)


class TelemetryResponse(BaseModel):
    id: UUID
    session_id: UUID
    voltage: float
    current: float
    power: float
    temperature: float | None
    mode: str
    relay: bool
    timestamp: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
