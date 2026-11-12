from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.battery import Battery
from app.models.monitoring_session import MonitoringSession
from app.models.telemetry import Telemetry


class CapacityService:

    @staticmethod
    def update_running_capacity(
        db: Session,
        session: MonitoringSession,
        new_telemetry: Telemetry,
    ) -> None:
        """
        Numerically integrate discharge current using trapezoidal rule.
        Updates running_capacity_mah in place.
        """
        if not new_telemetry.mode or new_telemetry.mode.upper() != "DISCHARGING":
            return

        # Fetch previous telemetry record for this session
        previous_telemetry = (
            db.query(Telemetry)
            .filter(
                Telemetry.session_id == session.id,
                Telemetry.id != new_telemetry.id,
            )
            .order_by(Telemetry.timestamp.desc())
            .first()
        )

        if not previous_telemetry or not previous_telemetry.mode:
            return

        if previous_telemetry.mode.upper() != "DISCHARGING":
            return

        dt_raw = new_telemetry.timestamp - previous_telemetry.timestamp
        if dt_raw <= 0:
            return

        # Handle millisecond vs second timestamps
        dt_seconds = dt_raw / 1000.0 if dt_raw > 500 else float(dt_raw)

        # Ignore unrealistic sample gaps (e.g. > 5 minutes)
        if dt_seconds > 300:
            return

        prev_curr = abs(previous_telemetry.current)
        curr_curr = abs(new_telemetry.current)

        average_current = (prev_curr + curr_curr) / 2.0
        delta_capacity = average_current * (dt_seconds / 3600.0)

        current_running = session.running_capacity_mah or 0.0
        session.running_capacity_mah = current_running + delta_capacity

        db.commit()

    @staticmethod
    def calculate_soh(
        estimated_capacity_mah: float,
        rated_capacity_mah: float,
    ) -> float:
        """Calculate and clamp State of Health (SOH) between 0% and 100%."""
        if not rated_capacity_mah or rated_capacity_mah <= 0:
            return 0.0

        raw_soh = (estimated_capacity_mah / float(rated_capacity_mah)) * 100.0
        return min(max(raw_soh, 0.0), 100.0)

    @staticmethod
    def validate_session(
        session: MonitoringSession,
        telemetry_list: list[Telemetry],
    ) -> bool:
        """
        Validate whether session qualifies for valid SOH & capacity estimation.
        Conditions:
        - Must contain discharge telemetry
        - Telemetry count exceeds threshold (min 3)
        - Duration exceeds threshold (min 10s)
        - Initial battery voltage >= 4.15V
        - Final battery voltage <= 3.0V
        """
        if not telemetry_list or len(telemetry_list) < 3:
            return False

        discharge_points = [
            t for t in telemetry_list
            if t.mode and t.mode.upper() == "DISCHARGING"
        ]

        if not discharge_points:
            return False

        # Calculate duration
        start_ts = telemetry_list[0].timestamp
        end_ts = telemetry_list[-1].timestamp
        dt_raw = end_ts - start_ts
        duration_seconds = dt_raw / 1000.0 if dt_raw > 500 else float(dt_raw)

        if duration_seconds < 10.0:
            return False

        # Voltage conditions
        max_voltage = max(t.voltage for t in discharge_points)
        final_voltage = discharge_points[-1].voltage

        if max_voltage < 4.15:
            return False

        if final_voltage > 3.0:
            return False

        return True

    @staticmethod
    def finalize_capacity(db: Session, session: MonitoringSession) -> None:
        """Finalize estimated capacity and SOH upon session completion."""
        telemetry_list = (
            db.query(Telemetry)
            .filter(Telemetry.session_id == session.id)
            .order_by(Telemetry.timestamp.asc())
            .all()
        )

        battery = (
            db.query(Battery)
            .filter(Battery.battery_id == session.battery_id)
            .first()
        )

        is_valid = CapacityService.validate_session(session, telemetry_list)

        if is_valid:
            final_cap = session.running_capacity_mah or 0.0
            session.estimated_capacity_mah = round(final_cap, 2)
            session.test_status = "COMPLETED"

            if battery and battery.rated_capacity_mah:
                soh = CapacityService.calculate_soh(
                    session.estimated_capacity_mah,
                    battery.rated_capacity_mah,
                )
                session.estimated_soh = round(soh, 2)
            else:
                session.estimated_soh = None
        else:
            session.estimated_capacity_mah = None
            session.estimated_soh = None
            session.test_status = "INCOMPLETE_TEST"

        db.commit()

    @staticmethod
    def summarize_session(db: Session, session_id: UUID) -> dict:
        """Generate comprehensive session analysis summary."""
        session = (
            db.query(MonitoringSession)
            .filter(MonitoringSession.id == session_id)
            .first()
        )

        if session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Monitoring session not found",
            )

        battery = (
            db.query(Battery)
            .filter(Battery.battery_id == session.battery_id)
            .first()
        )

        telemetry_list = (
            db.query(Telemetry)
            .filter(Telemetry.session_id == session_id)
            .order_by(Telemetry.timestamp.asc())
            .all()
        )

        telemetry_count = len(telemetry_list)

        if telemetry_count > 0:
            start_ts = telemetry_list[0].timestamp
            end_ts = telemetry_list[-1].timestamp
            dt_raw = end_ts - start_ts
            duration_seconds = dt_raw / 1000.0 if dt_raw > 500 else float(dt_raw)

            avg_current = sum(abs(t.current) for t in telemetry_list) / telemetry_count
            avg_voltage = sum(t.voltage for t in telemetry_list) / telemetry_count

            temp_points = [t.temperature for t in telemetry_list if t.temperature is not None]
            avg_temp = (sum(temp_points) / len(temp_points)) if temp_points else None
        else:
            duration_seconds = 0.0
            avg_current = 0.0
            avg_voltage = 0.0
            avg_temp = None

        rated_cap = battery.rated_capacity_mah if battery else None

        return {
            "session_id": session.id,
            "battery_id": session.battery_id,
            "rated_capacity_mah": rated_cap,
            "estimated_capacity_mah": session.estimated_capacity_mah,
            "estimated_soh": session.estimated_soh,
            "test_status": session.test_status or "ACTIVE",
            "duration_seconds": round(duration_seconds, 2),
            "average_current": round(avg_current, 2),
            "average_voltage": round(avg_voltage, 2),
            "average_temperature": round(avg_temp, 2) if avg_temp is not None else None,
            "telemetry_count": telemetry_count,
            "telemetry_points": telemetry_count,
        }
