
from pathlib import Path
from typing import Literal

import joblib
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.app.database import get_connection


app = FastAPI(
    title="QueryIQ API",
    description="Intelligent Customer Query Classification System",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = (
    Path(__file__).resolve().parents[1]
    / "ml"
    / "models"
    / "query_classifier.joblib"
)

model = joblib.load(MODEL_PATH)

DEPARTMENTS = {
    "Billing": "Finance",
    "Technical Support": "Technical Team",
    "Account Management": "Account Support",
    "Order Management": "Order Support",
    "General Inquiry": "Customer Support"
}

STATUSES = ["Pending", "In Progress", "Resolved"]


class QueryRequest(BaseModel):
    query: str = Field(min_length=5, max_length=2000)


class StatusUpdate(BaseModel):
    status: Literal["Pending", "In Progress", "Resolved"]


@app.get("/")
def home():
    return {
        "message": "Welcome to QueryIQ!",
        "status": "API is running"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/predict")
def predict_query(request: QueryRequest):
    try:
        prediction = model.predict([request.query])[0]
        probabilities = model.predict_proba([request.query])[0]

        confidence = float(max(probabilities))
        department = DEPARTMENTS[prediction]

        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO queries (
                    query,
                    category,
                    department,
                    confidence
                )
                VALUES (?, ?, ?, ?)
                """,
                (
                    request.query,
                    prediction,
                    department,
                    round(confidence * 100, 2)
                )
            )

            query_id = cursor.lastrowid

        return {
            "id": query_id,
            "query": request.query,
            "category": prediction,
            "department": department,
            "confidence": round(confidence * 100, 2),
            "status": "Pending",
            "message": "Query classified and saved successfully",
            "note": (
                "Experimental prediction. "
                "Confidence is not a guarantee of correctness."
            )
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )


@app.get("/queries")
def get_queries(
    limit: int = Query(default=50, ge=1, le=100)
):
    try:
        with get_connection() as connection:
            rows = connection.execute(
                """
                SELECT
                    id,
                    query,
                    category,
                    department,
                    confidence,
                    status,
                    created_at
                FROM queries
                ORDER BY id DESC
                LIMIT ?
                """,
                (limit,)
            ).fetchall()

        queries = [dict(row) for row in rows]

        return {
            "total": len(queries),
            "queries": queries
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve query history: {str(error)}"
        )


@app.patch("/queries/{query_id}/status")
def update_query_status(
    query_id: int,
    request: StatusUpdate
):
    try:
        with get_connection() as connection:
            existing = connection.execute(
                "SELECT id FROM queries WHERE id = ?",
                (query_id,)
            ).fetchone()

            if existing is None:
                raise HTTPException(
                    status_code=404,
                    detail="Query not found."
                )

            connection.execute(
                """
                UPDATE queries
                SET status = ?
                WHERE id = ?
                """,
                (request.status, query_id)
            )

        return {
            "message": "Query status updated successfully",
            "id": query_id,
            "status": request.status
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not update query status: {str(error)}"
        )


@app.get("/analytics")
def get_analytics():
    try:
        with get_connection() as connection:

            total = connection.execute(
                "SELECT COUNT(*) FROM queries"
            ).fetchone()[0]

            average_confidence = connection.execute(
                "SELECT AVG(confidence) FROM queries"
            ).fetchone()[0]

            category_rows = connection.execute(
                """
                SELECT category, COUNT(*) AS count
                FROM queries
                GROUP BY category
                ORDER BY count DESC
                """
            ).fetchall()

            department_rows = connection.execute(
                """
                SELECT department, COUNT(*) AS count
                FROM queries
                GROUP BY department
                ORDER BY count DESC
                """
            ).fetchall()

            status_rows = connection.execute(
                """
                SELECT status, COUNT(*) AS count
                FROM queries
                GROUP BY status
                """
            ).fetchall()

        category_distribution = [
            {
                "category": row["category"],
                "count": row["count"],
                "percentage": round(
                    (row["count"] / total) * 100, 2
                ) if total else 0
            }
            for row in category_rows
        ]

        department_distribution = [
            {
                "department": row["department"],
                "count": row["count"],
                "percentage": round(
                    (row["count"] / total) * 100, 2
                ) if total else 0
            }
            for row in department_rows
        ]

        status_counts = {
            row["status"]: row["count"]
            for row in status_rows
        }

        status_distribution = [
            {
                "status": status,
                "count": status_counts.get(status, 0),
                "percentage": round(
                    (status_counts.get(status, 0) / total) * 100, 2
                ) if total else 0
            }
            for status in STATUSES
        ]

        resolved = status_counts.get("Resolved", 0)

        return {
            "total_queries": total,
            "average_confidence": round(
                average_confidence or 0, 2
            ),
            "category_distribution": category_distribution,
            "department_distribution": department_distribution,
            "status_distribution": status_distribution,
            "pending_queries": status_counts.get("Pending", 0),
            "in_progress_queries": status_counts.get("In Progress", 0),
            "resolved_queries": resolved,
            "resolution_rate": round(
                (resolved / total) * 100, 2
            ) if total else 0
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve analytics: {str(error)}"
        )
