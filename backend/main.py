from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_connection, init_db
from openai_service import estimate_macros


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FoodRequest(BaseModel):
    description: str


@app.get("/api/foods")
def get_foods():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM foods ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.post("/api/foods")
async def add_food(req: FoodRequest):
    description = req.description.strip()
    if not description:
        raise HTTPException(status_code=400, detail="Description cannot be empty")

    try:
        result = await estimate_macros(description)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI error: {str(e)}")

    items = result.get("items", [])
    saved = []
    clarifications = []

    conn = get_connection()

    for item in items:
        if item.get("needs_clarification"):
            clarifications.append({
                "description": item["description"],
                "clarification_message": item.get("clarification_message", "Please specify a quantity."),
            })
            continue

        cursor = conn.execute(
            "INSERT INTO foods (description, calories, protein_g, carbs_g, fat_g) VALUES (?, ?, ?, ?, ?)",
            (
                item["description"],
                round(item["calories"], 1),
                round(item["protein_g"], 1),
                round(item["carbs_g"], 1),
                round(item["fat_g"], 1),
            ),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM foods WHERE id = ?", (cursor.lastrowid,)).fetchone()
        saved.append(dict(row))

    conn.close()

    return {"saved": saved, "clarifications": clarifications}


@app.delete("/api/foods/{food_id}")
def delete_food(food_id: int):
    conn = get_connection()
    cursor = conn.execute("DELETE FROM foods WHERE id = ?", (food_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Food not found")
    conn.commit()
    conn.close()
    return {"detail": "Deleted"}
