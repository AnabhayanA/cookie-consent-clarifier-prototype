# Cookie Consent Clarifier Prototype

A React-based simulator plus a FastAPI backend that helps users understand cookie consent banners in plain language.

The project is built to:
- Detect and display banner text patterns.
- Explain banner meaning in neutral language.
- Highlight potential privacy risks and dark-pattern wording.
- Keep AI provider credentials on the backend only.
- Restrict model access to the owner via an owner token.

## What This Project Includes

- `simulator-site/`: Frontend simulator (React via `htm`/ES modules) that renders a fake website and a cookie helper side panel.
- `backend/`: FastAPI service that performs owner-gated AI analysis and calls Groq server-side.

## Folder-by-Folder Guide

```text
cookie-consent-clarifier-prototype/
├─ backend/
│  ├─ main.py            # FastAPI app, auth checks, AI endpoint, Groq call
│  ├─ requirements.txt   # Python dependencies for backend runtime
│  └─ .env.example       # Template for OWNER_TOKEN and GROQ_API_KEY
├─ simulator-site/
│  ├─ index.html         # Frontend entry page
│  ├─ css/
│  │  └─ styles.css      # Visual styling for fake site + helper panel
│  └─ js/
│     ├─ app.js          # Root UI, site layout, banner simulation switching
│     ├─ banners.js      # Banner components (manipulative/neutral/complex)
│     ├─ data.js         # Static banner text, risk levels, fallback responses
│     ├─ panel.js        # Cookie Helper panel interactions and rendering
│     ├─ ai.js           # Frontend AI client -> backend `/api/analyze`
│     └─ deps.js         # Frontend dependency exports
├─ index.html            # Optional root entry (project-level)
└─ README.md             # Project documentation
```

## Architecture and Flow

1. User opens simulator UI at `simulator-site/index.html`.
2. User selects a banner pattern and clicks a helper action (`What this says`, `Simple words`, `Show privacy risk`).
3. Frontend calls backend endpoint: `POST /api/analyze`.
4. Backend verifies `X-Owner-Token` against `OWNER_TOKEN`.
5. If valid, backend calls Groq using `GROQ_API_KEY` (server-side only).
6. Frontend displays AI text on success.
7. If backend/auth/AI is unavailable, frontend shows local fallback analysis.

## Security Model (Owner-Only AI)

The AI provider key is never entered in frontend UI and never sent from the browser to Groq directly.

Enforcement is done on the backend:
- Required request header: `X-Owner-Token`
- Required backend env values:
  - `OWNER_TOKEN`
  - `GROQ_API_KEY`
- Behavior:
  - Missing/invalid owner token -> `403 Owner access required`
  - Missing provider key -> `500 GROQ_API_KEY is not configured on server`

## Website / Simulator Highlights

The simulator intentionally contains a polished fake website and multiple consent patterns so behavior can be demoed clearly.

Highlights:
- Three banner styles with different UX intent:
  - Manipulative (accept-biased)
  - Neutral (balanced controls)
  - Complex / legal-heavy
- Sliding Cookie Helper side panel with:
  - AI analysis actions
  - Quick tools (tricky wording scan, compare options, checklist)
  - Local fallback responses when AI is unavailable
- Rich page content to simulate real-world context:
  - Hero section, recipe cards, article content, techniques grid, ingredient cards
  - Interactive React batch calculator
- Privacy-neutral tone: helper explains, user decides.

## Backend API

### `GET /health`
Simple health check.

Response:
```json
{ "ok": true }
```

### `POST /api/analyze`
Owner-gated AI analysis endpoint.

Headers:
- `Content-Type: application/json`
- `X-Owner-Token: <OWNER_TOKEN>`

Request body:
```json
{
  "banner_text": "...",
  "banner_type": "Manipulative — dark pattern design",
  "mode": "explain"
}
```

`mode` values:
- `explain`
- `simplify`
- `risks`

Success response:
```json
{
  "text": "...",
  "source": "backend"
}
```

## Run Locally

### 1) Start backend
From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` and set:

```env
OWNER_TOKEN=replace-with-strong-owner-token
GROQ_API_KEY=gsk_replace_with_real_key
GROQ_MODEL=llama-3.1-8b-instant
LLM_TEMPERATURE=0.3
LLM_MAX_TOKENS=500
```

Run backend:

```powershell
uvicorn main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

### 2) Start frontend simulator
From project root:

```powershell
python -m http.server 5500
```

Open:
- `http://127.0.0.1:5500/simulator-site/index.html`

### 3) Set owner token in browser session (for local simulator testing)

In browser DevTools console:

```js
sessionStorage.setItem("cc_owner_token", "<OWNER_TOKEN>");
```

Optional (override backend URL without code changes):

```js
sessionStorage.setItem("cc_backend_url", "http://127.0.0.1:8000");
```

## Troubleshooting

- `AI error: Backend is offline or unreachable.`
  - Start FastAPI backend and verify port `8000` is listening.

- `AI error: Owner token missing or invalid.`
  - Ensure `sessionStorage.cc_owner_token` matches backend `OWNER_TOKEN` exactly.

- `AI error: Backend AI key is not configured.`
  - Set `GROQ_API_KEY` in `backend/.env` and restart backend.

- Getting only fallback responses
  - Confirm backend is reachable from browser.
  - Confirm token is valid.
  - Check backend logs for 403/500/502 status codes.

## Notes

- This is a prototype and not legal advice.
- Current analysis quality depends on prompts and model behavior.
- For production, consider stricter origin controls, rate limiting, audit logging, and moving token handling fully to extension background/service worker context.
