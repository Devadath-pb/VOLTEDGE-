import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Battery(Base):
    __tablename__ = "batteries"

    battery_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    owner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("auth.users.id"),
        nullable=False,
        index=True,
    )

    serial_number = Column(String(100), unique=True, nullable=False)

    manufacturer = Column(String(100))

    model = Column(String(100))

    chemistry = Column(String(50))

    rated_capacity_mah = Column(Integer)

    nominal_voltage = Column(Float)

    manufacture_date = Column(Date)

    purchase_date = Column(Date)

    installation_date = Column(Date)

    status = Column(String(30), default="Active")

    is_active = Column(Boolean, default=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    cycles = relationship(
        "BatteryCycle",
        back_populates="battery",
        cascade="all, delete-orphan"
    )
