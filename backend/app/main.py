from fastapi import FastAPI
from app.routers.battery_router import router as battery_router
from app.core.database import Base, engine
# Import all models BEFORE create_all()
from app.models import Battery

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VoltEdge API",
    version="1.0.0",
    description="AI Powered Battery Lifecycle Intelligence Platform"
)

app.include_router(battery_router)
@app.get("/")
def root():
    return {
        "status": "running",
        "project": "VoltEdge",
        "version": "1.0.0"
    }