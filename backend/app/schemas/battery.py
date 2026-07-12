from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BatteryCreate(BaseModel):
    serial_number: str
    manufacturer: str
    model: str
    chemistry: str

    rated_capacity_mah: int
    nominal_voltage: float

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

    model_config = ConfigDict(from_attributes=True)