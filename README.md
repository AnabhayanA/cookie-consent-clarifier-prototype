# Cookie Consent Clarifier Mockup

A React-based simulator plus a FastAPI backend mockup that helps users understand cookie consent banners in plain language.

The project is built to:
- Detect and display banner text patterns.
- Explain banner meaning in neutral language.
- Highlight potential privacy risks and dark-pattern wording.
- Keep AI provider credentials on the backend only.
- Restrict model access to the owner via an owner token.

## What This Project Includes

- `simulator-site/`: Frontend simulator (React via `htm`/ES modules) that renders a fake website and a cookie helper side panel.
- `backend/`: FastAPI service that performs owner-gated AI analysis and calls Gemini server-side.

## Folder-by-Folder Guide

```text
cookie-consent-clarifier-prototype/
├─ backend/
│  ├─ main.py            # FastAPI app, auth checks, AI endpoint, Gemini call
│  ├─ requirements.txt   # Python dependencies for backend runtime
│  └─ .env.example       # Template for OWNER_TOKEN and GEMINI_API_KEY
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
5. If valid, backend calls Gemini using `GEMINI_API_KEY` (server-side only).
6. Frontend displays AI text on success.
7. If backend/auth/AI is unavailable, frontend shows local fallback analysis.

## Security Model (Owner-Only AI)

The AI provider key is never entered in frontend UI and never sent from the browser to Gemini directly.

Enforcement is done on the backend:
- Required request header: `X-Owner-Token`
- Required backend env values:
  - `OWNER_TOKEN`
  - `GEMINI_API_KEY`
- Behavior:
  - Missing/invalid owner token -> `403 Owner access required`
  - Missing provider key -> `500 GEMINI_API_KEY is not configured on server`

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

## How Privacy Risk Works

Privacy risk in this mockup has two layers: a dynamic signal-based visual level and a generated risk explanation.

1. Dynamic visual level (risk bar)
  - The frontend scans the captured banner text for risk signals (for example: pressure wording, hard-to-see reject controls, partner-sharing language, ad profiling terms, legal complexity, and pre-enabled toggles).
  - It also scans for mitigation signals (for example: balanced choice visibility and clear decline/manage options).
  - These signals are scored to produce a level:
    - score `0-1` -> `low`
    - score `2-4` -> `med`
    - score `5+` -> `high`
  - The panel shows the level, score, and matched reason bullets for transparency.

2. Generated explanation (AI or local fallback)
   - When the user clicks `Show privacy risk`, the panel requests mode `risks`.
   - Backend prompt asks the model to list neutral, factual risks focused on:
     - what data is collected,
     - who data may be shared with,
     - manipulation tactics in wording/design.
   - If backend AI is unavailable (token, key, network, provider error), the panel shows local fallback risk bullets from `FALLBACK[<banner>].risks`.

What this means in practice:
- The risk bar is based on detected text signals, not a hardcoded scenario label.
- The text explanation is dynamic when AI works, otherwise it falls back to predefined bullets.
- The helper is informational only and does not advise accept/reject decisions.

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
GEMINI_API_KEY=replace_with_real_key
GEMINI_MODEL=gemini-1.5-flash
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
  - Set `GEMINI_API_KEY` in `backend/.env` and restart backend.

- Getting only fallback responses
  - Confirm backend is reachable from browser.
  - Confirm token is valid.
  - Check backend logs for 403/500/502 status codes.

## Notes

- This is a mockup and not legal advice.
- Current analysis quality depends on prompts and model behavior.
- For production, consider stricter origin controls, rate limiting, audit logging, and moving token handling fully to extension background/service worker context.
