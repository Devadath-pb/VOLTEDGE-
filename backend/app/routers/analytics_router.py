from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.battery_cycle import BatteryCycle
from app.models.telemetry import Telemetry
from app.services.battery_service import BatteryService
from app.services.soh_model_service import (
    SOHModelUnavailable,
    feature_window,
    model_metadata,
    predict,
)


router = APIRouter(prefix="/api/analytics", tags=["Analytics"])
DEFAULT_RATED_CAPACITY_MAH = 3600.0
MAX_TELEMETRY_ROWS = 2000
MIN_FEATURE_SAMPLES = 10
MIN_FEATURE_WINDOW_SECONDS = 10.0


def _iso(value):
    return value.isoformat() if value else None


def _group_by_cycle(rows):
    groups = defaultdict(list)
    for row in rows:
        cycle_number = row.cycle.cycle_number if row.cycle else 0
        groups[int(cycle_number)].append(row)
    return dict(sorted(groups.items()))


def _load_context(db: Session):
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
            detail="Not enough telemetry for SOH feature collection",
        )

    groups = _group_by_cycle(list(reversed(rows)))
    latest_cycle_number, latest_rows = next(reversed(groups.items()))
    latest_cycle = next(
        (row.cycle for row in reversed(latest_rows) if row.cycle is not None),
        None,
    )
    if latest_cycle is None:
        latest_cycle = (
            db.query(BatteryCycle)
            .filter(
                BatteryCycle.battery_id == battery.battery_id,
                BatteryCycle.cycle_number == latest_cycle_number,
            )
            .first()
        )

    return battery, rows, groups, latest_cycle_number, latest_rows, latest_cycle


def _feature_status(snapshot: dict):
    ready = (
        snapshot["sample_count"] >= MIN_FEATURE_SAMPLES
        and snapshot["window_seconds"] >= MIN_FEATURE_WINDOW_SECONDS
    )
    if ready:
        message = "Enough time-spaced readings are collected for prediction."
    elif snapshot["sample_count"] < MIN_FEATURE_SAMPLES:
        message = f"Collect at least {MIN_FEATURE_SAMPLES} readings before predicting."
    else:
        message = f"Collect readings for at least {MIN_FEATURE_WINDOW_SECONDS:g} seconds before predicting."
    return {
        **snapshot,
        "ready": ready,
        "message": message,
        "minimum_samples": MIN_FEATURE_SAMPLES,
        "minimum_window_seconds": MIN_FEATURE_WINDOW_SECONDS,
    }


def _prediction_for_cycle(cycle: BatteryCycle | None):
    if cycle is None or cycle.estimated_soh is None:
        return None
    return float(cycle.estimated_soh)


def _response(
    battery,
    groups,
    latest_cycle_number,
    latest_rows,
    latest_cycle,
    snapshot,
    metadata,
    prediction_timestamp=None,
):
    rated_capacity_mah = float(
        battery.rated_capacity_mah
        if battery.rated_capacity_mah and battery.rated_capacity_mah > 0
        else DEFAULT_RATED_CAPACITY_MAH
    )
    predicted_soh = _prediction_for_cycle(latest_cycle)
    predicted_capacity_mah = (
        latest_cycle.estimated_capacity_mah
        if latest_cycle and latest_cycle.estimated_capacity_mah is not None
        else (rated_capacity_mah * predicted_soh / 100.0 if predicted_soh is not None else None)
    )
    degradation = []
    for cycle_number, cycle_rows in groups.items():
        cycle = next((row.cycle for row in reversed(cycle_rows) if row.cycle is not None), None)
        stored_soh = _prediction_for_cycle(cycle)
        degradation.append({
            "cycle": cycle_number,
            "soh": None,
            "predicted": stored_soh,
        })

    return {
        "predictedSoh": predicted_soh,
        "predictionAvailable": predicted_soh is not None,
        "predictedCapacityAh": round(predicted_capacity_mah / 1000.0, 3) if predicted_capacity_mah is not None else None,
        "ratedCapacityAh": round(rated_capacity_mah / 1000.0, 3),
        "timestamp": _iso(latest_rows[-1].created_at) or datetime.now(timezone.utc).isoformat(),
        "predictionTimestamp": prediction_timestamp,
        "model": f"{metadata['model_name']} · soh_model.pkl",
        "pipeline": {
            "collection": "complete" if snapshot["ready"] else "running",
            "preprocessing": "complete" if snapshot["ready"] else "queued",
            "featureExtraction": "complete" if snapshot["ready"] else "queued",
            "inference": "complete" if predicted_soh is not None else "waiting",
            "updated": predicted_soh is not None,
        },
        "featureCollection": snapshot,
        "degradation": degradation,
        "actualVsPredicted": [],
        "forecast": [],
        "featureImportance": metadata["feature_importance"],
        "featureColumns": metadata["feature_columns"],
        "measurementColumns": metadata["measurement_columns"],
        "latestCycle": latest_cycle_number,
    }


@router.get("/soh")
def get_soh_prediction(db: Session = Depends(get_db)):
    """Return collected features and the last manually stored prediction.

    This endpoint deliberately does not run model inference. Telemetry can be
    collected every second, while SOH inference only happens via POST /soh/predict.
    """
    try:
        battery, rows, groups, latest_cycle_number, latest_rows, latest_cycle = _load_context(db)
        snapshot = _feature_status(feature_window(latest_rows, latest_cycle_number))
        metadata = model_metadata()
    except SOHModelUnavailable as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    return _response(
        battery,
        groups,
        latest_cycle_number,
        latest_rows,
        latest_cycle,
        snapshot,
        metadata,
    )


@router.post("/soh/predict")
def predict_soh(db: Session = Depends(get_db)):
    """Run one SOH prediction over the current time-spaced feature window."""
    try:
        battery, rows, groups, latest_cycle_number, latest_rows, latest_cycle = _load_context(db)
        snapshot = _feature_status(feature_window(latest_rows, latest_cycle_number))
        metadata = model_metadata()
    except SOHModelUnavailable as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    if not snapshot["ready"]:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=snapshot["message"])
    if latest_cycle is None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Telemetry is not attached to an active battery cycle")

    try:
        result = predict(latest_rows, latest_cycle_number)
    except SOHModelUnavailable as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    latest_cycle.estimated_soh = result["prediction"]
    latest_cycle.estimated_capacity_mah = round(
        float(
            battery.rated_capacity_mah
            if battery.rated_capacity_mah and battery.rated_capacity_mah > 0
            else DEFAULT_RATED_CAPACITY_MAH
        )
        * result["prediction"]
        / 100.0,
        2,
    )
    db.commit()
    db.refresh(latest_cycle)

    return _response(
        battery,
        groups,
        latest_cycle_number,
        latest_rows,
        latest_cycle,
        snapshot,
        metadata,
        prediction_timestamp=datetime.now(timezone.utc).isoformat(),
    )
