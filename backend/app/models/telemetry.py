import uuid

from sqlalchemy import BigInteger, Boolean, Column, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Telemetry(Base):
    __tablename__ = "telemetry"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("monitoring_sessions.id"),
        nullable=True
    )

    battery_id = Column(
        UUID(as_uuid=True),
        ForeignKey("batteries.battery_id"),
        nullable=True
    )

    cycle_id = Column(
        UUID(as_uuid=True),
        ForeignKey("battery_cycles.id"),
        nullable=True
    )

    phase = Column(String(50), nullable=True)

    voltage = Column(Float, nullable=False)

    current = Column(Float, nullable=False)

    power = Column(Float, nullable=False)

    soc = Column(Float, nullable=True)

    soc_method = Column(String(30), nullable=True)

    energy_wh = Column(Float, nullable=True)

    temperature = Column(Float)

    mode = Column(String(50), nullable=False)

    relay = Column(Boolean, nullable=False)

    timestamp = Column(BigInteger, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    monitoring_session = relationship(
        "MonitoringSession",
        back_populates="telemetry"
    )

    cycle = relationship(
        "BatteryCycle",
        back_populates="telemetry"
    )
