from sqlalchemy.orm import Session

from app.models.battery import Battery
from app.schemas.battery import BatteryCreate


class BatteryService:

    @staticmethod
    def create_battery(db: Session, battery: BatteryCreate):

        db_battery = Battery(**battery.model_dump())

        db.add(db_battery)

        db.commit()

        db.refresh(db_battery)

        return db_battery