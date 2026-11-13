from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.telemetry import Telemetry
from app.services.battery_service import BatteryService
from app.services.soh_model_service import SOHModelUnavailable, predict


router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
DEFAULT_RATED_CAPACITY_MAH = 3600.0
MAX_TELEMETRY_ROWS = 2000


def _iso(value):
    return value.isoformat() if value else None


def _group_by_cycle(rows):
    groups = defaultdict(list)
    for row in rows:
        cycle_number = row.cycle.cycle_number if row.cycle else 0
        groups[int(cycle_number)].append(row)
    return dict(sorted(groups.items()))


@router.get("/soh")
def get_soh_prediction(db: Session = Depends(get_db)):
    battery = BatteryService.get_active_battery(db)
    if battery is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No battery is assigned to this account",
        )

    rows = (
        db.query(Telemetry)
        .options(joinedload(Telemetry.cycle))
        .filter(Telemetry.battery_id == battery.battery_id)
        .order_by(Telemetry.created_at.desc(), Telemetry.timestamp.desc())
        .limit(MAX_TELEMETRY_ROWS)
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not enough telemetry for SOH prediction",
        )

    groups = _group_by_cycle(list(reversed(rows)))
    latest_cycle, latest_rows = next(reversed(groups.items()))

    try:
        latest = predict(latest_rows, latest_cycle)
        degradation = [
            {
                "cycle": cycle_number,
                "soh": None,
                "predicted": predict(cycle_rows, cycle_number)["prediction"],
            }
            for cycle_number, cycle_rows in groups.items()
        ]
    except SOHModelUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    rated_capacity_mah = float(
        battery.rated_capacity_mah
        if battery.rated_capacity_mah and battery.rated_capacity_mah > 0
        else DEFAULT_RATED_CAPACITY_MAH
    )
    predicted_soh = latest["prediction"]

    return {
        "predictedSoh": predicted_soh,
        "predictedCapacityAh": round(rated_capacity_mah * predicted_soh / 100.0 / 1000.0, 3),
        "ratedCapacityAh": round(rated_capacity_mah / 1000.0, 3),
        "timestamp": _iso(rows[0].created_at) or datetime.now(timezone.utc).isoformat(),
        "model": f"{latest['model_name']} · soh_model.pkl",
        "pipeline": {
            "collection": "complete",
            "preprocessing": "complete",
            "featureExtraction": "complete",
            "inference": "complete",
            "updated": True,
        },
        "degradation": degradation,
        "actualVsPredicted": [],
        "forecast": [],
        "featureImportance": latest["feature_importance"],
    }
