from pathlib import Path
from urllib.parse import quote_plus

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    # Prefer the Supabase/PostgreSQL connection string. The split fields are
    # retained only for compatibility with the original local setup.
    DATABASE_URL: str | None = None
    DATABASE_HOST: str | None = None
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str | None = None
    DATABASE_USER: str | None = None
    DATABASE_PASSWORD: str | None = None
    SUPABASE_URL: str = "https://aodbornvsdkskpcbuhve.supabase.co"
    SUPABASE_JWT_AUDIENCE: str = "authenticated"

    DEBUG: bool = False

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        case_sensitive=True,
        extra="ignore",
    )

    @model_validator(mode="after")
    def build_database_url(self):
        if self.DATABASE_URL:
            return self

        required = (
            self.DATABASE_HOST,
            self.DATABASE_NAME,
            self.DATABASE_USER,
            self.DATABASE_PASSWORD,
        )
        if all(value is not None for value in required):
            user = quote_plus(self.DATABASE_USER or "")
            password = quote_plus(self.DATABASE_PASSWORD or "")
            host = self.DATABASE_HOST or "localhost"
            self.DATABASE_URL = (
                f"postgresql://{user}:{password}@{host}:"
                f"{self.DATABASE_PORT}/{self.DATABASE_NAME}"
            )
            return self

        raise ValueError(
            "DATABASE_URL is required. Set it to the Supabase connection string."
        )

settings = Settings()
