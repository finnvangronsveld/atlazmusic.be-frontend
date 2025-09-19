# ATLAZ Bookings FastAPI Backend

A minimal FastAPI service to serve bookings to the frontend.

## Quickstart

1. Create a virtual environment and install dependencies

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

2. Run the server

```bash
uvicorn backend.app.main:app --reload --port 8000
```

The API will be available at http://127.0.0.1:8000.

## Endpoints

- GET `/api/health` → `{ "status": "ok" }`
- GET `/api/bookings` → `Booking[]` (sorted ascending)
- POST `/api/bookings` → `Booking` (append to in-memory list)

## Booking model

```json
{
  "date": "YYYY-MM-DD",
  "start": "HH:mm",
  "end": "HH:mm",
  "name": "Event name",
  "venue": "Venue name, City",
  "link": "https://..."
}
```

Note: This uses an in-memory list, replace with a real database for production.
