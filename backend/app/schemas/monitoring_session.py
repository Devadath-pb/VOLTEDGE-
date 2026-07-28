from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class MonitoringSessionStart(BaseModel):
    battery_id: UUID


class MonitoringSessionResponse(BaseModel):
    id: UUID
    battery_id: UUID
    status: str
    start_time: datetime
    end_time: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
