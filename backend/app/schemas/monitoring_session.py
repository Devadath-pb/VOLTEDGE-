from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MonitoringSessionStart(BaseModel):
    battery_id: UUID


class MonitoringSessionResponse(BaseModel):
    id: UUID
    battery_id: UUID
    status: str
    test_status: str = "ACTIVE"
    running_capacity_mah: float | None = 0.0
    estimated_capacity_mah: float | None = None
    estimated_soh: float | None = None
    start_time: datetime
    end_time: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SessionAnalysisResponse(BaseModel):
    session_id: UUID
    battery_id: UUID
    rated_capacity_mah: float | None = None
    estimated_capacity_mah: float | None = None
    estimated_soh: float | None = None
    test_status: str
    duration_seconds: float
    average_current: float
    average_voltage: float
    average_temperature: float | None = None
    telemetry_count: int
    telemetry_points: int

    model_config = ConfigDict(from_attributes=True)
