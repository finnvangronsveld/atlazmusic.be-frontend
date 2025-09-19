from __future__ import annotations

from datetime import datetime, date, time, timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

app = FastAPI(title="ATLAZ Bookings API", version="0.1.0")

# Allow front-end (same host during dev) and optionally localhost ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",  # Adjust for production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Booking(BaseModel):
    date: str = Field(..., description="YYYY-MM-DD")
    start: Optional[str] = Field(None, description="HH:mm")
    end: Optional[str] = Field(None, description="HH:mm")
    name: str
    venue: str
    link: Optional[str] = Field(None, description="External details URL")

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError as e:
            raise ValueError("date must be YYYY-MM-DD") from e
        return v

    @field_validator("start", "end")
    @classmethod
    def validate_time(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError as e:
            raise ValueError("time must be HH:mm") from e
        return v


# In-memory store (replace with DB)
BOOKINGS: List[Booking] = [
    Booking(date="2025-10-18", start="22:00", end="02:00", name="Warehouse Night", venue="Warehouse 27, Antwerp", link="https://example.com/warehouse-night"),
    Booking(date="2025-11-02", start="23:00", end="03:00", name="Nightshift", venue="Brussels", link="https://example.com/nightshift"),
]


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/bookings", response_model=List[Booking])
async def get_bookings():
    # Sort ascending by date then start
    def key(b: Booking):
        return (b.date, b.start or "00:00")
    return sorted(BOOKINGS, key=key)


@app.post("/api/bookings", response_model=Booking)
async def add_booking(booking: Booking):
    BOOKINGS.append(booking)
    return booking
