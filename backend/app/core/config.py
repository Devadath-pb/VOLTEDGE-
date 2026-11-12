from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    DATABASE_URL: str
    SUPABASE_URL: str = "https://aodbornvsdkskpcbuhve.supabase.co"
    SUPABASE_JWT_AUDIENCE: str = "authenticated"

    DEBUG: bool = False

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        case_sensitive=True,
    )

settings = Settings()
