from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.battery import Battery
from app.models.battery_cycle import BatteryCycle, BatteryCycleStatus
from app.models.telemetry import Telemetry
from app.schemas.battery_cycle import (
    BatteryCycleStart,
    CycleAnalysisResponse,
    PhaseSummary,
)


class CycleService:

    @staticmethod
    def get_all_cycles(db: Session, battery_id: UUID | None = None):
        """Return all battery cycles, optionally filtered by battery."""
        query = db.query(BatteryCycle)
        if battery_id:
            query = query.filter(BatteryCycle.battery_id == battery_id)
        return query.order_by(BatteryCycle.started_at.desc()).all()

    @staticmethod
    def get_cycle_by_id(db: Session, cycle_id: UUID):
        """Fetch a single battery cycle by ID."""
        cycle = (
            db.query(BatteryCycle)
            .filter(BatteryCycle.id == cycle_id)
            .first()
        )
        if cycle is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Battery cycle not found",
            )
        return cycle

    @staticmethod
    def get_active_cycle(db: Session, battery_id: UUID | None = None):
        """Return currently active battery cycle."""
        query = db.query(BatteryCycle).filter(
            BatteryCycle.status.in_(
                [BatteryCycleStatus.STARTED.value, BatteryCycleStatus.CHARGING.value, BatteryCycleStatus.DISCHARGING.value]
            )
        )
        if battery_id:
            query = query.filter(BatteryCycle.battery_id == battery_id)
        return query.order_by(BatteryCycle.started_at.desc()).first()

    @staticmethod
    def start_cycle(db: Session, start_data: BatteryCycleStart):
        """Start a new battery cycle (initial phase: CHARGING)."""
        battery = (
            db.query(Battery)
            .filter(Battery.battery_id == start_data.battery_id)
            .first()
        )
        if battery is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Battery not found",
            )

        now = datetime.now(timezone.utc)

        # Finalize any existing active cycles for this battery
        active_cycles = (
            db.query(BatteryCycle)
            .filter(
                BatteryCycle.battery_id == start_data.battery_id,
                BatteryCycle.status.in_(
                    [BatteryCycleStatus.STARTED.value, BatteryCycleStatus.CHARGING.value, BatteryCycleStatus.DISCHARGING.value]
                )
            )
            .all()
        )
        for active in active_cycles:
            CycleService.stop_cycle(db, active.id)

        # Get highest cycle number for battery
        last_cycle = (
            db.query(func.max(BatteryCycle.cycle_number))
            .filter(BatteryCycle.battery_id == start_data.battery_id)
            .scalar()
        )
        next_cycle_number = (last_cycle or 0) + 1

        new_cycle = BatteryCycle(
            battery_id=start_data.battery_id,
            cycle_number=next_cycle_number,
            status=BatteryCycleStatus.CHARGING.value,
            started_at=now,
            running_capacity_mah=0.0,
            notes=start_data.notes,
        )

        db.add(new_cycle)
        db.commit()
        db.refresh(new_cycle)
        return new_cycle

    @staticmethod
    def transition_phase(db: Session, cycle_id: UUID | None = None, target_phase: str = "DISCHARGING"):
        """Transition active cycle from CHARGING to DISCHARGING phase."""
        cycle = None
        if cycle_id:
            cycle = CycleService.get_cycle_by_id(db, cycle_id)
        else:
            cycle = CycleService.get_active_cycle(db)

        if cycle is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active battery cycle found to transition",
            )

        cycle.status = target_phase.upper()
        db.commit()
        db.refresh(cycle)
        return cycle

    @staticmethod
    def update_cycle_telemetry_stats(db: Session, cycle: BatteryCycle, latest_telemetry: Telemetry):
        """Continuously integrate capacity, energy, and statistics on new telemetry."""
        telemetries = (
            db.query(Telemetry)
            .filter(Telemetry.cycle_id == cycle.id)
            .order_by(Telemetry.timestamp.asc())
            .all()
        )

        if not telemetries:
            return

        charge_tels = [t for t in telemetries if (t.phase == "CHARGING" or t.mode == "CHARGING")]
        discharge_tels = [t for t in telemetries if (t.phase == "DISCHARGING" or t.mode == "DISCHARGING")]

        # Discharge capacity calculation (Trapezoidal integration)
        running_capacity = 0.0
        discharge_duration = 0.0
        discharge_energy = 0.0

        for i in range(1, len(discharge_tels)):
            t_prev = discharge_tels[i - 1]
            t_curr = discharge_tels[i]
            dt_sec = (t_curr.timestamp - t_prev.timestamp) / 1000.0

            if 0 < dt_sec < 3600:
                avg_current_ma = (t_prev.current + t_curr.current) / 2.0
                running_capacity += avg_current_ma * (dt_sec / 3600.0)

                # Energy (Wh) = Power (W) * dt(h)
                p_prev = (t_prev.voltage * t_prev.current) / 1000.0
                p_curr = (t_curr.voltage * t_curr.current) / 1000.0
                avg_power_w = (p_prev + p_curr) / 2.0
                discharge_energy += avg_power_w * (dt_sec / 3600.0)
                discharge_duration += dt_sec

        # Charge energy calculation
        charge_duration = 0.0
        charge_energy = 0.0

        for i in range(1, len(charge_tels)):
            t_prev = charge_tels[i - 1]
            t_curr = charge_tels[i]
            dt_sec = (t_curr.timestamp - t_prev.timestamp) / 1000.0

            if 0 < dt_sec < 3600:
                p_prev = (t_prev.voltage * t_prev.current) / 1000.0
                p_curr = (t_curr.voltage * t_curr.current) / 1000.0
                avg_power_w = (p_prev + p_curr) / 2.0
                charge_energy += avg_power_w * (dt_sec / 3600.0)
                charge_duration += dt_sec

        # Charging Stats
        if charge_tels:
            c_volts = [t.voltage for t in charge_tels]
            c_currs = [t.current for t in charge_tels]
            c_temps = [t.temperature for t in charge_tels if t.temperature is not None]

            cycle.average_charge_voltage = round(sum(c_volts) / len(c_volts), 2)
            cycle.max_charge_voltage = round(max(c_volts), 2)
            cycle.average_charge_current = round(sum(c_currs) / len(c_currs), 2)
            cycle.max_charge_current = round(max(c_currs), 2)
            if c_temps:
                cycle.average_charge_temperature = round(sum(c_temps) / len(c_temps), 2)
                cycle.max_charge_temperature = round(max(c_temps), 2)

        # Discharging Stats
        if discharge_tels:
            d_volts = [t.voltage for t in discharge_tels]
            d_currs = [t.current for t in discharge_tels]
            d_temps = [t.temperature for t in discharge_tels if t.temperature is not None]

            cycle.average_discharge_voltage = round(sum(d_volts) / len(d_volts), 2)
            cycle.max_discharge_voltage = round(max(d_volts), 2)
            cycle.average_discharge_current = round(sum(d_currs) / len(d_currs), 2)
            cycle.max_discharge_current = round(max(d_currs), 2)
            if d_temps:
                cycle.average_discharge_temperature = round(sum(d_temps) / len(d_temps), 2)
                cycle.max_discharge_temperature = round(max(d_temps), 2)

        cycle.running_capacity_mah = round(running_capacity, 2)
        cycle.charge_duration_seconds = round(charge_duration, 2)
        cycle.discharge_duration_seconds = round(discharge_duration, 2)
        cycle.charge_energy_wh = round(charge_energy, 4)
        cycle.discharge_energy_wh = round(discharge_energy, 4)

        db.commit()

    @staticmethod
    def stop_cycle(db: Session, cycle_id: UUID | None = None):
        """Finalize battery cycle, calculate final capacity, SOH, and efficiencies."""
        cycle = None
        if cycle_id:
            cycle = CycleService.get_cycle_by_id(db, cycle_id)
        else:
            cycle = CycleService.get_active_cycle(db)

        if cycle is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active battery cycle found to stop",
            )

        now = datetime.now(timezone.utc)
        cycle.status = BatteryCycleStatus.COMPLETED.value
        cycle.completed_at = now

        # Finalize estimated capacity & SOH
        cycle.estimated_capacity_mah = cycle.running_capacity_mah

        battery = db.query(Battery).filter(Battery.battery_id == cycle.battery_id).first()
        if battery and battery.rated_capacity_mah and battery.rated_capacity_mah > 0:
            soh = (cycle.estimated_capacity_mah / float(battery.rated_capacity_mah)) * 100.0
            cycle.estimated_soh = round(max(0.0, min(100.0, soh)), 2)

        # Efficiency
        if cycle.charge_energy_wh and cycle.charge_energy_wh > 0:
            eff = (cycle.discharge_energy_wh / cycle.charge_energy_wh) * 100.0
            cycle.charge_efficiency = round(max(0.0, min(100.0, eff)), 2)

        db.commit()
        db.refresh(cycle)
        return cycle

    @staticmethod
    def summarize_cycle(db: Session, cycle_id: UUID):
        """Generate cycle analysis summary DTO."""
        cycle = CycleService.get_cycle_by_id(db, cycle_id)
        battery = db.query(Battery).filter(Battery.battery_id == cycle.battery_id).first()

        telemetry_count = (
            db.query(Telemetry)
            .filter(Telemetry.cycle_id == cycle.id)
            .count()
        )

        charging_summary = PhaseSummary(
            duration_seconds=cycle.charge_duration_seconds,
            average_voltage=cycle.average_charge_voltage,
            max_voltage=cycle.max_charge_voltage,
            average_current=cycle.average_charge_current,
            max_current=cycle.max_charge_current,
            average_temperature=cycle.average_charge_temperature,
            max_temperature=cycle.max_charge_temperature,
            energy_wh=cycle.charge_energy_wh,
        )

        discharging_summary = PhaseSummary(
            duration_seconds=cycle.discharge_duration_seconds,
            average_voltage=cycle.average_discharge_voltage,
            max_voltage=cycle.max_discharge_voltage,
            average_current=cycle.average_discharge_current,
            max_current=cycle.max_discharge_current,
            average_temperature=cycle.average_discharge_temperature,
            max_temperature=cycle.max_discharge_temperature,
            energy_wh=cycle.discharge_energy_wh,
        )

        return CycleAnalysisResponse(
            cycle_id=cycle.id,
            battery_id=cycle.battery_id,
            cycle_number=cycle.cycle_number,
            status=cycle.status,
            rated_capacity_mah=float(battery.rated_capacity_mah) if battery and battery.rated_capacity_mah else None,
            estimated_capacity_mah=cycle.estimated_capacity_mah,
            running_capacity_mah=cycle.running_capacity_mah,
            estimated_soh=cycle.estimated_soh,
            charge_energy_wh=cycle.charge_energy_wh,
            discharge_energy_wh=cycle.discharge_energy_wh,
            charge_efficiency=cycle.charge_efficiency,
            charging_summary=charging_summary,
            discharging_summary=discharging_summary,
            telemetry_count=telemetry_count,
            started_at=cycle.started_at,
            completed_at=cycle.completed_at,
        )
