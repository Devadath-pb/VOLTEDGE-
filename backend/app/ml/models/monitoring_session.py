import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class MonitoringSessionStatus(str, PyEnum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class MonitoringSessionTestStatus(str, PyEnum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    INCOMPLETE_TEST = "INCOMPLETE_TEST"


class MonitoringSession(Base):
    __tablename__ = "monitoring_sessions"

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

    status = Column(
        Enum(
            MonitoringSessionStatus,
            name="monitoring_session_status"
        ),
        nullable=False,
        default=MonitoringSessionStatus.ACTIVE
    )

    test_status = Column(
        String(30),
        nullable=False,
        default="ACTIVE"
    )

    running_capacity_mah = Column(
        Float,
        nullable=True,
        default=0.0
    )

    estimated_capacity_mah = Column(
        Float,
        nullable=True
    )

    estimated_soh = Column(
        Float,
        nullable=True
    )

    start_time = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    end_time = Column(DateTime(timezone=True))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    battery = relationship("Battery")

    telemetry = relationship(
        "Telemetry",
        back_populates="monitoring_session"
    )
