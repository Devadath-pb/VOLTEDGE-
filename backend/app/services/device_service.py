import hashlib
import secrets
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.device import Device


class DeviceService:
    @staticmethod
    def provision_for_battery(
        db: Session,
        owner_id: UUID,
        battery_id: UUID,
        name: str,
    ):
        plaintext_key = "ve_" + secrets.token_urlsafe(32)
        key_hash = hashlib.sha256(plaintext_key.encode("utf-8")).hexdigest()
        device = Device(
            owner_id=owner_id,
            battery_id=battery_id,
            name=name,
            key_hash=key_hash,
        )
        db.add(device)
        db.commit()
        db.refresh(device)
        return device, plaintext_key
