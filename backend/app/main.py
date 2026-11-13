from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import Battery, BatteryCycle, MonitoringSession, Telemetry
from app.routers.battery_router import router as battery_router
from app.routers.cycle_router import (
    battery_cycle_router,
    router as cycle_router,
)
from app.routers.session_router import (
    battery_session_router,
    router as session_router,
)
from app.routers.telemetry_router import (
    router as telemetry_router,
    session_telemetry_router,
)
from app.routers.device_router import router as device_router
from app.routers.live_router import router as live_router
from app.routers.analytics_router import router as analytics_router

app = FastAPI(
    title="VoltEdge API",
    version="1.0.0",
    description="AI Powered Battery Lifecycle Intelligence Platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(battery_router)
app.include_router(session_router)
app.include_router(battery_session_router)
app.include_router(telemetry_router)
app.include_router(session_telemetry_router)
app.include_router(cycle_router)
app.include_router(battery_cycle_router)
app.include_router(device_router)
app.include_router(live_router)
app.include_router(analytics_router)


@app.get("/")
def root():
    return {
        "status": "running",
        "project": "VoltEdge",
        "version": "1.0.0",
    }
