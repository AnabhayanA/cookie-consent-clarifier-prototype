# Cookie Consent Clarifier Prototype

This prototype helps users better understand cookie consent notices by:

- Detecting likely cookie banner text on the current web page.
- Rewriting that text into plain-language key points.
- Classifying consent flow style (for example: granular opt-in, implied consent, accept-biased).
- Flagging possible dark pattern signals in banner wording.
- Suggesting practical privacy actions (reject/manage preferences).

## Project Structure

- `backend/` - FastAPI API that explains cookie notices.
- `extension/` - Chrome extension popup + content script.

## 1. Run the Backend (FastAPI)

From `backend/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

API will be available at `http://127.0.0.1:8000`.

Health check:

```powershell
curl http://127.0.0.1:8000/health
```

## 2. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension/` folder.

## 3. Test the Prototype

1. Open a website that shows a cookie banner.
2. Click the extension icon.
3. Press **Analyze Current Page**.

You should see a simplified summary, key points, and suggested actions.
You should also see a consent type classification and any dark pattern signals found.

## 4. Run the Fake Website Simulator

From the project root:

```powershell
python -m http.server 5500
```

Then open:

`http://127.0.0.1:5500/simulator-site/index.html`

This page includes multiple simulated cookie banners (granular opt-in, accept-biased, implied consent, legitimate interest) so users can test the extension behavior safely.

## Notes

- This is rule-based, not legal advice.
- Detection quality depends on each website's HTML structure.
- For production, replace heuristics with a stronger NLP or LLM pipeline and multilingual support.
