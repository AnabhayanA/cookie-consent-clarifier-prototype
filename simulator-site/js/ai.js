/**
 * ai.js — frontend AI client
 *
 * AI inference is handled by the backend so provider keys and auth rules
 * stay server-side. The frontend sends only banner data + requested mode.
 */

const DEFAULT_BACKEND_BASE = "http://127.0.0.1:8000";

function getAnalyzeEndpoint() {
  const configured =
    window.__CC_BACKEND_URL__ ||
    sessionStorage.getItem("cc_backend_url") ||
    DEFAULT_BACKEND_BASE;

  if (configured.endsWith("/api/analyze")) return configured;
  return `${configured.replace(/\/$/, "")}/api/analyze`;
}

async function parseApiError(response) {
  let detail = "";
  try {
    const err = await response.json();
    detail = err?.detail || "";
  } catch {
    detail = "";
  }

  if (response.status === 403) {
    return "Owner token missing or invalid.";
  }
  if (response.status === 500 && detail.includes("GEMINI_API_KEY")) {
    return "Backend AI key is not configured.";
  }
  return detail || `Backend returned ${response.status}`;
}

/**
 * @param {{ bannerText: string, bannerType: string, mode: "explain"|"simplify"|"risks" }} params
 * @returns {Promise<string>}
 */
export async function callAI({ bannerText, bannerType, mode }) {
  const ownerToken = sessionStorage.getItem("cc_owner_token") || "";
  const endpoint = getAnalyzeEndpoint();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ownerToken ? { "X-Owner-Token": ownerToken } : {}),
      },
      body: JSON.stringify({
        banner_text: bannerText,
        banner_type: bannerType,
        mode,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === "AbortError") {
      throw new Error("Backend request timed out.");
    }
    throw new Error("Backend is offline or unreachable.");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const message = await parseApiError(response);
    throw new Error(message);
  }

  const data = await response.json();
  return (data?.text || "").trim();
}

