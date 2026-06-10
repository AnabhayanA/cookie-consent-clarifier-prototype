/**
 * ai.js — Groq API integration (free tier, no credit card required)
 *
 * Uses llama-3.1-8b-instant via Groq's OpenAI-compatible endpoint.
 * Get a free key (no billing) at: https://console.groq.com → API Keys
 * Keys start with gsk_...
 *
 * Usage:
 *   import { callAI } from "./ai.js";
 *   const text = await callAI({ bannerText, bannerType, mode, apiKey });
 */

const SYSTEM_PROMPT =
  "You are an AI assistant that ONLY analyzes cookie consent banners. " +
  "Do NOT analyze any other part of the webpage. " +
  "Your task: " +
  "1. Read ONLY the cookie banner text provided. " +
  "2. Summarize what the banner is asking the user to agree to. " +
  "3. Identify any privacy risks mentioned or implied. " +
  "4. Explain everything in simple, neutral language. " +
  "5. Do NOT tell the user to accept or reject anything. " +
  "6. Stay unbiased and supportive. " +
  "7. Provide a simplified version for LEP users (Limited English Proficiency). " +
  "8. Never use persuasive wording, urgency, or emotional pressure. " +
  "9. Present options as information only and let the user decide.";

const PROMPTS = {
  explain: (text) =>
    `Analyze this cookie consent banner and respond using EXACTLY this format:\n\n` +
    `- Simple Summary:\n` +
    `- What Data Is Collected:\n` +
    `- Who It May Be Shared With:\n` +
    `- Privacy Risks (Neutral):\n` +
    `- Important Details:\n` +
    `- LEP-Friendly Version:\n\n` +
    `COOKIE BANNER TEXT:\n${text}`,

  simplify: (text) =>
    `Rewrite this cookie consent banner in plain English for someone with limited English proficiency. ` +
    `Use short sentences and simple words. Do not suggest accepting or rejecting, and avoid persuasive words. ` +
    `Then list what data is collected and who it may be shared with.\n\n` +
    `COOKIE BANNER TEXT:\n${text}`,

  risks: (text) =>
    `List the privacy risks from this cookie consent banner. ` +
    `Start each point with "•". Be factual and neutral — do not recommend accepting or rejecting. ` +
    `Focus on: what data is collected, who gets it, and any manipulation tactics.\n\n` +
    `COOKIE BANNER TEXT:\n${text}`,
};

/**
 * @param {{ bannerText: string, bannerType: string, mode: "explain"|"simplify"|"risks", apiKey: string }}
 * @returns {Promise<string>}
 */
export async function callAI({ bannerText, bannerType, mode, apiKey }) {
  const userContent = PROMPTS[mode](bannerText);

  // Groq uses the same API format as OpenAI
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: userContent },
      ],
      max_tokens: 500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Groq returned ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

