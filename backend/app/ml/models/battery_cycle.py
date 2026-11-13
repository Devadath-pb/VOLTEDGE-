import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class BatteryCycleStatus(str, enum.Enum):
    STARTED = "STARTED"
    CHARGING = "CHARGING"
    DISCHARGING = "DISCHARGING"
    COMPLETED = "COMPLETED"


class BatteryCycle(Base):
    __tablename__ = "battery_cycles"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    battery_id = Column(
        UUID(as_uuid=True),
        ForeignKey("batteries.battery_id"),
        nullable=False
    )

    cycle_number = Column(Integer, nullable=False, default=1)

    status = Column(
        String(30),
        nullable=False,
        default=BatteryCycleStatus.CHARGING.value
    )

    started_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    completed_at = Column(DateTime(timezone=True), nullable=True)

    estimated_capacity_mah = Column(Float, nullable=True)

    estimated_soh = Column(Float, nullable=True)

    running_capacity_mah = Column(Float, default=0.0, nullable=False)

    charge_duration_seconds = Column(Float, default=0.0, nullable=False)

    discharge_duration_seconds = Column(Float, default=0.0, nullable=False)

    charge_energy_wh = Column(Float, default=0.0, nullable=False)

    discharge_energy_wh = Column(Float, default=0.0, nullable=False)

    charge_efficiency = Column(Float, nullable=True)

    average_charge_temperature = Column(Float, nullable=True)
    max_charge_temperature = Column(Float, nullable=True)
    average_charge_voltage = Column(Float, nullable=True)
    max_charge_voltage = Column(Float, nullable=True)
    average_charge_current = Column(Float, nullable=True)
    max_charge_current = Column(Float, nullable=True)

    average_discharge_temperature = Column(Float, nullable=True)
    max_discharge_temperature = Column(Float, nullable=True)
    average_discharge_voltage = Column(Float, nullable=True)
    max_discharge_voltage = Column(Float, nullable=True)
    average_discharge_current = Column(Float, nullable=True)
    max_discharge_current = Column(Float, nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    battery = relationship(
        "Battery",
        back_populates="cycles"
    )

    telemetry = relationship(
        "Telemetry",
        back_populates="cycle",
        cascade="all, delete-orphan"
    )
