import os
from typing import Literal

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Cookie Consent Clarifier Backend")

# Keep this strict in production; localhost is for the simulator.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type", "X-Owner-Token"],
)

SYSTEM_PROMPT = (
    "You are an AI assistant that ONLY analyzes cookie consent banners. "
    "Do NOT analyze any other part of the webpage. "
    "1. Read ONLY the cookie banner text provided. "
    "2. Summarize what the banner is asking the user to agree to. "
    "3. Identify privacy risks in neutral language. "
    "4. Do NOT tell the user to accept or reject. "
    "5. Stay unbiased and concise."
)


def build_prompt(mode: str, text: str) -> str:
    if mode == "explain":
        return (
            "Analyze this cookie consent banner and use this exact structure:\n"
            "- Simple Summary:\n"
            "- What Data Is Collected:\n"
            "- Who It May Be Shared With:\n"
            "- Privacy Risks (Neutral):\n"
            "- Important Details:\n"
            "- LEP-Friendly Version:\n\n"
            f"COOKIE BANNER TEXT:\n{text}"
        )
    if mode == "simplify":
        return (
            "Rewrite this cookie consent banner in plain English for someone with limited "
            "English proficiency. Use short sentences and simple words. Do not suggest "
            "accepting or rejecting. Then list what data is collected and who it may be "
            f"shared with.\n\nCOOKIE BANNER TEXT:\n{text}"
        )
    return (
        "List privacy risks from this cookie consent banner. Start each point with '-' and "
        "stay factual and neutral. Focus on: collected data, sharing, and manipulation tactics."
        f"\n\nCOOKIE BANNER TEXT:\n{text}"
    )


class AnalyzeRequest(BaseModel):
	banner_text: str
	banner_type: str
	mode: Literal["explain", "simplify", "risks"]


class AnalyzeResponse(BaseModel):
	text: str
	source: str


@app.get("/health")
def health() -> dict:
	return {"ok": True}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(
    payload: AnalyzeRequest,
    x_owner_token: str | None = Header(default=None),
) -> AnalyzeResponse:
    owner_token = os.getenv("OWNER_TOKEN", "").strip()
    if not owner_token:
        raise HTTPException(status_code=500, detail="OWNER_TOKEN is not configured on server")

    if x_owner_token != owner_token:
        raise HTTPException(status_code=403, detail="Owner access required")

    gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not gemini_api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on server")

    model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    temperature = float(os.getenv("LLM_TEMPERATURE", "0.3"))
    max_tokens = int(os.getenv("LLM_MAX_TOKENS", "500"))

    user_prompt = build_prompt(payload.mode, payload.banner_text)

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_api_key}",
            headers={
                "Content-Type": "application/json",
            },
            json={
                "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                "contents": [
                    {"role": "user", "parts": [{"text": user_prompt}]},
                ],
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens,
                },
            },
        )

    if resp.status_code >= 400:
        try:
            detail = resp.json().get("error", {}).get("message", "LLM request failed")
        except Exception:
            detail = f"LLM request failed with status {resp.status_code}"
        raise HTTPException(status_code=502, detail=detail)

    data = resp.json()
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        raise HTTPException(status_code=502, detail="LLM response format was unexpected")
    return AnalyzeResponse(text=text, source="backend")
