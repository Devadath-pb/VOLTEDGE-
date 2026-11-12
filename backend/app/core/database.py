from fastapi import Depends
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings
from app.core.security import get_current_user_id

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"},
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

Base = declarative_base()


def get_db(user_id=Depends(get_current_user_id)):
    db = SessionLocal()
    try:
        db.execute(
            text("select set_config('request.jwt.claim.sub', :user_id, true)"),
            {"user_id": str(user_id)},
        )
        yield db
    finally:
        db.close()
