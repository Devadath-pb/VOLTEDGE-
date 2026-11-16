from pydantic import BaseModel, Field


class DeviceProvisionRequest(BaseModel):
    name: str = Field(default="VoltEdge ESP32-C3", min_length=2, max_length=100)
