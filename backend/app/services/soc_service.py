"""State-of-charge estimation from the existing ESP32 telemetry stream."""

from __future__ import annotations

from datetime import datetime, timezone


DEFAULT_RATED_CAPACITY_MAH = 3600.0
SOC_EMPTY_VOLTAGE = 3.0
SOC_FULL_VOLTAGE = 4.2
MAX_INTEGRATION_GAP_SECONDS = 300.0


def _clamp(value: float, minimum: float = 0.0, maximum: float = 100.0) -> float:
    return min(max(value, minimum), maximum)


def estimate_from_voltage(
    voltage: float | None,
    empty_voltage: float = SOC_EMPTY_VOLTAGE,
    full_voltage: float = SOC_FULL_VOLTAGE,
) -> float | None:
    """Return a clearly approximate SOC for a resting single-cell Li-ion voltage."""
    if voltage is None or full_voltage <= empty_voltage:
        return None
    percentage = ((float(voltage) - empty_voltage) / (full_voltage - empty_voltage)) * 100.0
    return round(_clamp(percentage), 3)


def signed_current_ma(current_ma: float | None, mode: str | None) -> float:
    """Convert the existing mode + INA219 current into battery charge direction."""
    if current_ma is None:
        return 0.0

    value = abs(float(current_ma))
    normalized_mode = (mode or "").strip().upper()
    if normalized_mode == "CHARGING":
        return value
    if normalized_mode == "DISCHARGING":
        return -value
    return 0.0


def integrate_soc(
    previous_soc: float,
    previous_current_ma: float | None,
    previous_mode: str | None,
    current_ma: float | None,
    current_mode: str | None,
    elapsed_seconds: float,
    rated_capacity_mah: float = DEFAULT_RATED_CAPACITY_MAH,
) -> float:
    """Integrate SOC using trapezoidal current in mA over elapsed seconds."""
    if rated_capacity_mah <= 0 or elapsed_seconds <= 0:
        return round(_clamp(previous_soc), 3)

    if elapsed_seconds > MAX_INTEGRATION_GAP_SECONDS:
        return round(_clamp(previous_soc), 3)

    previous_signed = signed_current_ma(previous_current_ma, previous_mode)
    current_signed = signed_current_ma(current_ma, current_mode)
    average_current_ma = (previous_signed + current_signed) / 2.0
    delta_percentage = average_current_ma * elapsed_seconds / (rated_capacity_mah * 36.0)
    return round(_clamp(float(previous_soc) + delta_percentage), 3)


def elapsed_since(previous_created_at: datetime | None, now: datetime | None = None) -> float | None:
    if previous_created_at is None:
        return None

    current_time = now or datetime.now(timezone.utc)
    previous_time = previous_created_at
    if previous_time.tzinfo is None:
        previous_time = previous_time.replace(tzinfo=timezone.utc)
    return (current_time - previous_time).total_seconds()
