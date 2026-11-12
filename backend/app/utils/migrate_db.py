from sqlalchemy import text
from app.core.database import engine


def migrate_database():
    """Ensure database schema includes new MonitoringSession columns."""
    statements = [
        "ALTER TABLE monitoring_sessions ADD COLUMN IF NOT EXISTS test_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE';",
        "ALTER TABLE monitoring_sessions ADD COLUMN IF NOT EXISTS running_capacity_mah FLOAT DEFAULT 0.0;",
        "ALTER TABLE monitoring_sessions ADD COLUMN IF NOT EXISTS estimated_capacity_mah FLOAT NULL;",
        "ALTER TABLE monitoring_sessions ADD COLUMN IF NOT EXISTS estimated_soh FLOAT NULL;",
    ]

    with engine.connect() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
        conn.commit()
    print("Database migration check completed.")


if __name__ == "__main__":
    migrate_database()
