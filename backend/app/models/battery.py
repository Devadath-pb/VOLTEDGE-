import uuid

from sqlalchemy import Column, String, Integer, Float, Date, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base


class Battery(Base):
    __tablename__ = "batteries"

    battery_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
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

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )