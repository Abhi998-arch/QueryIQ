
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "queryiq.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                category TEXT NOT NULL,
                department TEXT NOT NULL,
                confidence REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        columns = [
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(queries)"
            ).fetchall()
        ]

        if "status" not in columns:
            connection.execute("""
                ALTER TABLE queries
                ADD COLUMN status TEXT NOT NULL DEFAULT 'Pending'
            """)


initialize_database()
