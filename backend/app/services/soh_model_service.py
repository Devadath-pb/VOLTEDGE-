"""Runtime adapter for the SOH model supplied on the ai branch."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from statistics import pstdev
from datetime import timezone

import joblib
import pandas as pd


MODEL_PATH = Path(__file__).resolve().parents[1] / "ml" / "models" / "soh_model.pkl"
CURRENT_MA_TO_A = 1000.0
DEFAULT_MEASUREMENT_COLS = ["voltage", "current", "temperature"]


class SOHModelUnavailable(RuntimeError):
    pass


@lru_cache(maxsize=1)
def load_soh_artifact():
    if not MODEL_PATH.exists():
        raise SOHModelUnavailable(f"SOH model file is missing: {MODEL_PATH.name}")

    try:
        artifact = joblib.load(MODEL_PATH)
    except Exception as exc:
        raise SOHModelUnavailable("SOH model could not be loaded") from exc

    model = artifact.get("model", artifact) if isinstance(artifact, dict) else artifact
    feature_columns = (
        artifact.get("feature_columns")
        if isinstance(artifact, dict)
        else None
    ) or list(getattr(model, "feature_names_in_", []))

    if model is None or not feature_columns or not hasattr(model, "predict"):
        raise SOHModelUnavailable("SOH model artifact has no usable predictor")

    return {
        "model": model,
        "feature_columns": list(feature_columns),
        "measurement_cols": (
            artifact.get("measurement_cols")
            if isinstance(artifact, dict)
            else None
        ),
    }


def _numeric_values(rows, column: str) -> list[float]:
    values = []
    for row in rows:
        value = getattr(row, column, None)
        if value is not None:
            numeric = float(value)
            if column == "current":
                numeric /= CURRENT_MA_TO_A
            values.append(numeric)
    return values


def build_feature_row(rows, cycle_number: int, feature_columns: list[str]) -> dict[str, float]:
    values = {"cycle": float(cycle_number)}
    for column in ("voltage", "current", "temperature"):
        measurements = _numeric_values(rows, column)
        if not measurements:
            raise SOHModelUnavailable(
                f"Live telemetry has no usable {column} values for SOH inference"
            )
        values[f"{column}_mean"] = sum(measurements) / len(measurements)
        values[f"{column}_min"] = min(measurements)
        values[f"{column}_max"] = max(measurements)
        values[f"{column}_std"] = pstdev(measurements) if len(measurements) > 1 else 0.0

    missing = [column for column in feature_columns if column not in values]
    if missing:
        raise SOHModelUnavailable(
            f"Model requires unsupported live features: {', '.join(missing)}"
        )
    return {column: values[column] for column in feature_columns}


def _row_time_seconds(row) -> float | None:
    """Return a monotonic-ish device time, falling back to server time."""
    timestamp = getattr(row, "timestamp", None)
    if timestamp is not None:
        return float(timestamp) / 1000.0

    created_at = getattr(row, "created_at", None)
    if created_at is None:
        return None
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return created_at.timestamp()


def feature_window(rows, cycle_number: int) -> dict:
    """Describe the measured feature window without running model inference."""
    artifact = load_soh_artifact()
    feature_row = build_feature_row(rows, cycle_number, artifact["feature_columns"])
    times = [value for value in (_row_time_seconds(row) for row in rows) if value is not None]
    duration_seconds = max(times) - min(times) if len(times) > 1 else 0.0
    created_times = [row.created_at for row in rows if getattr(row, "created_at", None)]

    return {
        "sample_count": len(rows),
        "window_seconds": round(max(0.0, duration_seconds), 2),
        "started_at": min(created_times).isoformat() if created_times else None,
        "ended_at": max(created_times).isoformat() if created_times else None,
        "features": feature_row,
        "feature_columns": artifact["feature_columns"],
        "measurement_columns": artifact.get("measurement_cols") or DEFAULT_MEASUREMENT_COLS,
    }


def model_metadata() -> dict:
    artifact = load_soh_artifact()
    return {
        "model_name": type(artifact["model"]).__name__,
        "feature_columns": artifact["feature_columns"],
        "measurement_columns": artifact.get("measurement_cols") or DEFAULT_MEASUREMENT_COLS,
        "feature_importance": _feature_importance(artifact),
    }


def _feature_importance(artifact: dict) -> list[dict]:
    importances = getattr(artifact["model"], "feature_importances_", None)
    if importances is None:
        return []
    values = [
        {
            "feature": name,
            "importance": float(value),
            "importancePercent": round(float(value) * 100.0, 6),
        }
        for name, value in zip(artifact["feature_columns"], importances)
    ]
    values.sort(key=lambda item: item["importance"], reverse=True)
    return values


def predict(rows, cycle_number: int) -> dict:
    artifact = load_soh_artifact()
    feature_row = build_feature_row(rows, cycle_number, artifact["feature_columns"])
    frame = pd.DataFrame([feature_row], columns=artifact["feature_columns"])
    prediction = float(artifact["model"].predict(frame)[0])
    prediction = min(max(prediction, 0.0), 100.0)

    return {
        "prediction": round(prediction, 3),
        "feature_importance": _feature_importance(artifact),
        "model_name": type(artifact["model"]).__name__,
        "feature_columns": artifact["feature_columns"],
        "feature_row": feature_row,
        "window": feature_window(rows, cycle_number),
    }
