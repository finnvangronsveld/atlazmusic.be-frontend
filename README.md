# ATLAZ — Frontend

A bold, modern single-page website for DJ ATLAZ. Includes a first-visit preloader with the ATLAZ logo and a progress bar, a centered hero logo, and a glassmorphism navbar that appears after you start scrolling.

## Structure
- `index.html` — markup
- `styles.css` — styling
- `script.js` — interactions (preloader, scroll navbar, smooth anchors)
- `scr/img/atlazmusicbeLOGO.png` — logo asset (make sure it exists)

## Run locally
This is a static site. You can open `index.html` directly in a browser. For best results (and to avoid any browser restrictions), serve it with a simple local server.

Optional commands (PowerShell) if you have Node.js installed:

```powershell
npx serve .
# or
npx http-server -p 5173 .
```

Then open the printed URL in your browser.

## Admin — Manage bookings

An admin page is available at `admin.html` to add bookings that appear on the site.

1) Start the backend (FastAPI):

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

2) Open `admin.html` in your browser (or via the local static server). Fill the form and submit.

Notes:
- The demo backend stores bookings in memory only. Restarting the backend clears the list.
- The frontend and admin read `meta[name="api-base"]` for the API base URL (defaults to `http://127.0.0.1:8000`).

## Notes
- The preloader shows only on the first visit per tab via `sessionStorage`. Reload in a new tab or clear session storage to see it again.
- The navbar becomes visible after ~40px of scroll for a clean landing view.
- Colors and intensity are controlled via CSS variables at the top of `styles.css`.

---
© ATLAZ