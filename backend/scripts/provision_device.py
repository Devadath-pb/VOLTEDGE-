"""Provision one device key for an existing battery.

Run locally with the backend environment configured. The plaintext key is
printed once only; store it in the ESP32 firmware secrets file.
"""

import argparse
import hashlib
import secrets
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.device import Device


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--owner-id", required=True)
    parser.add_argument("--battery-id", required=True)
    parser.add_argument("--name", default="VoltEdge ESP32-C3")
    args = parser.parse_args()

    key = "ve_" + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(key.encode("utf-8")).hexdigest()
    engine = create_engine(settings.DATABASE_URL, connect_args={"sslmode": "require"})
    Session = sessionmaker(bind=engine)
    with Session.begin() as db:
        db.add(
            Device(
                owner_id=args.owner_id,
                battery_id=args.battery_id,
                name=args.name,
                key_hash=key_hash,
            )
        )

    print("Device provisioned.")
    print("DEVICE_KEY=" + key)
    print("Store this key securely; it cannot be recovered from the database.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
