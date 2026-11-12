from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BatteryCycleStart(BaseModel):
    battery_id: UUID
    notes: str | None = None


class PhaseTransitionRequest(BaseModel):
    phase: str = "DISCHARGING"  # CHARGING or DISCHARGING


class BatteryCycleResponse(BaseModel):
    id: UUID
    battery_id: UUID
    cycle_number: int
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    estimated_capacity_mah: float | None = None
    estimated_soh: float | None = None
    running_capacity_mah: float = 0.0
    charge_duration_seconds: float = 0.0
    discharge_duration_seconds: float = 0.0
    charge_energy_wh: float = 0.0
    discharge_energy_wh: float = 0.0
    charge_efficiency: float | None = None
    average_charge_temperature: float | None = None
    max_charge_temperature: float | None = None
    average_charge_voltage: float | None = None
    max_charge_voltage: float | None = None
    average_charge_current: float | None = None
    max_charge_current: float | None = None
    average_discharge_temperature: float | None = None
    max_discharge_temperature: float | None = None
    average_discharge_voltage: float | None = None
    max_discharge_voltage: float | None = None
    average_discharge_current: float | None = None
    max_discharge_current: float | None = None
    notes: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PhaseSummary(BaseModel):
    duration_seconds: float = 0.0
    average_voltage: float | None = None
    max_voltage: float | None = None
    average_current: float | None = None
    max_current: float | None = None
    average_temperature: float | None = None
    max_temperature: float | None = None
    energy_wh: float = 0.0


class CycleAnalysisResponse(BaseModel):
    cycle_id: UUID
    battery_id: UUID
    cycle_number: int
    status: str
    rated_capacity_mah: float | None = None
    estimated_capacity_mah: float | None = None
    running_capacity_mah: float = 0.0
    estimated_soh: float | None = None
    charge_energy_wh: float = 0.0
    discharge_energy_wh: float = 0.0
    charge_efficiency: float | None = None
    charging_summary: PhaseSummary
    discharging_summary: PhaseSummary
    telemetry_count: int = 0
    started_at: datetime
    completed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
