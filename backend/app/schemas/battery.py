from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BatteryCreate(BaseModel):
    serial_number: str = Field(..., min_length=3, max_length=100)
    manufacturer: str = Field(..., min_length=2, max_length=100)
    model: str = Field(..., min_length=2, max_length=100)
    chemistry: str = Field(..., min_length=2, max_length=50)

    rated_capacity_mah: int = Field(..., gt=0)
    nominal_voltage: float = Field(..., gt=0)

    manufacture_date: date | None = None
    purchase_date: date | None = None
    installation_date: date | None = None


class BatteryResponse(BaseModel):
    battery_id: UUID

    serial_number: str
    manufacturer: str
    model: str
    chemistry: str

    rated_capacity_mah: int
    nominal_voltage: float

    status: str
    is_active: bool = False

    model_config = ConfigDict(from_attributes=True)