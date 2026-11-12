import hashlib
from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
def _hash_device_key(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def get_device_context(
    device_key: str | None = Header(default=None, alias="X-Device-Key"),
):
    if not device_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Device-Key is required",
        )

    db = SessionLocal()
    try:
        device = db.execute(
            text(
                "select device_id, owner_id, battery_id "
                "from public.lookup_device_by_key(:key_hash)"
            ),
            {"key_hash": _hash_device_key(device_key)},
        ).mappings().first()

        if device is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or inactive device key",
            )

        # The request-scoped claim makes the existing Supabase RLS policies
        # filter all queries to this device owner's data.
        db.execute(
            text("select set_config('request.jwt.claim.sub', :owner_id, true)"),
            {"owner_id": str(device["owner_id"])},
        )
        db.execute(
            text(
                "update public.devices set last_seen_at = :last_seen_at "
                "where device_id = :device_id"
            ),
            {
                "last_seen_at": datetime.now(timezone.utc),
                "device_id": str(device["device_id"]),
            },
        )
        db.commit()
        return {
            "device_id": device["device_id"],
            "owner_id": device["owner_id"],
            "battery_id": device["battery_id"],
        }
    except HTTPException:
        db.rollback()
        db.close()
        raise
    except Exception:
        db.rollback()
        db.close()
        raise
    finally:
        # The endpoint receives the context only; it opens its own scoped DB
        # session for the write so the RLS claim is set in that transaction.
        db.close()


def get_device_db(device_context=Depends(get_device_context)):
    db = SessionLocal()
    try:
        db.execute(
            text("select set_config('request.jwt.claim.sub', :owner_id, true)"),
            {"owner_id": str(device_context["owner_id"])},
        )
        yield db, device_context
    finally:
        db.close()
