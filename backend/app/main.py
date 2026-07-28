from fastapi import FastAPI

from app.core.database import Base, engine
from app.models import Battery, MonitoringSession, Telemetry
from app.routers.battery_router import router as battery_router
from app.routers.session_router import (
    battery_session_router,
    router as session_router,
)
from app.routers.telemetry_router import (
    router as telemetry_router,
    session_telemetry_router,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VoltEdge API",
    version="1.0.0",
    description="AI Powered Battery Lifecycle Intelligence Platform",
)

app.include_router(battery_router)
app.include_router(session_router)
app.include_router(battery_session_router)
app.include_router(telemetry_router)
app.include_router(session_telemetry_router)


@app.get("/")
def root():
    return {
        "status": "running",
        "project": "VoltEdge",
        "version": "1.0.0",
    }
