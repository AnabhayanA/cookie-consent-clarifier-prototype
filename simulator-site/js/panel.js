/**
 * panel.js — the AI-assisted extension panel component
 *
 * Behaviour:
 *  - If the user has set a Groq API key (stored in sessionStorage),
 *    clicking a mode button calls the model and shows the live response.
 *  - If no key is set, it shows prewritten fallback text from data.js.
 *  - API key is NEVER persisted to localStorage — cleared when tab closes.
 *  - The panel never recommends accepting or rejecting cookies.
 */
import { html, useState, useEffect } from "./deps.js?v=10";
import { BANNERS, FALLBACK, RISK }   from "./data.js?v=10";
import { callAI }                    from "./ai.js?v=10";

const MODE_TITLES = {
  explain:  "What this banner says",
  simplify: "Simple summary",
  risks:    "Privacy risk",
};

const RISK_LABELS = { low: "Low risk", med: "Medium risk", high: "High risk" };
const TOOLKIT_TITLES = {
  scan: "Tricky Wording Check",
  compare: "Choice Compare",
  checklist: "Before You Choose",
};

function runDarkPatternScan(text) {
  const lower = text.toLowerCase();
  const rules = [
    { hit: /accept all|agree|allow all/.test(lower), label: "The banner pushes the yes option with strong words." },
    { hit: /partners|third[- ]party|share/.test(lower), label: "It says your data may be shared with other companies." },
    { hit: /personalis|targeted|ads?/.test(lower), label: "It may track you for ads or personalization." },
    { hit: /legitimate interests|article 6|gdpr/.test(lower), label: "It uses legal terms that can be hard to understand." },
    { hit: /withdraw|manage|settings/.test(lower), label: "You can change choices, but it may take extra taps." },
  ];

  const findings = rules.filter((r) => r.hit).map((r) => r.label);
  if (!findings.length) {
    return ["No obvious pressure words were found in this snippet."];
  }
  return findings;
}

/* ── Sub-components ──────────────────────────────────────────────── */

function RiskBar({ level }) {
  return html`
    <div className="risk-wrap">
      <div className="risk-hdr">
        <span>Privacy risk</span>
        <span className=${"risk-lbl " + level}>${RISK_LABELS[level]}</span>
      </div>
      <div className="risk-track">
        <div className=${"risk-fill " + level} />
      </div>
    </div>
  `;
}

/**
 * Renders AI text or fallback content.
 * If the text contains bullet-style lines (starting with • or -), renders a list.
 * Otherwise splits on blank lines to produce paragraphs.
 */
function ResponseBody({ text }) {
  if (!text) return null;

  const lines = text.split("\n").filter((l) => l.trim());
  const isBulleted = lines.some((l) => /^[•\-\*]/.test(l.trim()));

  if (isBulleted) {
    return html`
      <ul className="resp-bullets">
        ${lines.map(
          (line, i) => html`<li key=${i}>${line.replace(/^[•\-\*]\s*/, "")}</li>`
        )}
      </ul>
    `;
  }

  const paras = text.split(/\n\n+/).filter((p) => p.trim());
  return html`${paras.map((p, i) => html`<p key=${i}>${p.trim()}</p>`)}`;
}

function FallbackBody({ bannerKey, mode }) {
  const fb = FALLBACK[bannerKey][mode];
  if (!fb) return null;

  if (fb.bullets) {
    return html`
      <ul className="resp-bullets">
        ${fb.bullets.map((b, i) => html`<li key=${i}>${b}</li>`)}
      </ul>
    `;
  }

  return html`${(fb.paras || []).map((p, i) => html`<p key=${i}>${p}</p>`)}`;
}

/* ── Main panel component ────────────────────────────────────────── */

/**
 * @param {{ bannerKey: string }} props
 */
export function ExtPanel({ bannerKey, open, onClose }) {
  const banner = BANNERS[bannerKey];

  // API key — session only
  const [apiKey,       setApiKeyState] = useState(() => sessionStorage.getItem("cc_key") || "");
  const [showSettings, setShowSettings] = useState(false);

  // Panel state
  const [activeMode, setActiveMode] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [aiText,     setAiText]     = useState(null);   // null = show fallback
  const [error,      setError]      = useState(null);
  const [toolkitMode, setToolkitMode] = useState(null);

  // Reset when the user switches banner type
  useEffect(() => {
    setActiveMode(null);
    setToolkitMode(null);
    setAiText(null);
    setError(null);
  }, [bannerKey]);

  function handleToolkit(mode) {
    setToolkitMode((prev) => (prev === mode ? null : mode));
  }

  function persistKey(value) {
    if (value) sessionStorage.setItem("cc_key", value);
    else       sessionStorage.removeItem("cc_key");
    setApiKeyState(value);
  }

  async function handleMode(mode) {
    // Toggle off if already active
    if (activeMode === mode) {
      setActiveMode(null);
      setAiText(null);
      setError(null);
      return;
    }

    setActiveMode(mode);
    setError(null);
    setAiText(null);

    const key = apiKey.trim();
    if (!key) return; // no key → show fallback (already handled in render)

    setLoading(true);
    try {
      const text = await callAI({
        bannerText: banner.captured,
        bannerType: banner.type,
        mode,
        apiKey: key,
      });
      setAiText(text);
    } catch (e) {
      setError(`AI error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  const keyIsSet = apiKey.trim().startsWith("gsk_") || apiKey.trim().length > 20;
  const risk     = RISK[bannerKey];

  return html`
    <aside className=${"ext-panel" + (open ? " open" : "")}>
      <div className="ext-head">
        <div className="ext-head-row">
          <div>
            <h2>Cookie Helper</h2>
            <p className="ext-sub">Simple cookie help</p>
          </div>
          <button className="panel-close" onClick=${onClose} title="Close">✕</button>
        </div>
        <span className="detected-pill">
          <span className="pulse" />
          Banner found. Pick a button to learn what it means.
        </span>
      </div>

      <div className="ext-body">

        <div className="settings-toggle" onClick=${() => setShowSettings((v) => !v)}>
          <span>${showSettings ? "▲" : "▼"} AI options</span>
          <span className=${"key-dot " + (keyIsSet ? "on" : "off")}>
            ${keyIsSet ? "AI on" : "Local mode"}
          </span>
        </div>

        ${showSettings && html`
          <div className="settings-body">
            <label className="key-label">Groq API key (free - <a href="https://console.groq.com" target="_blank">get one here</a>)</label>
            <input
              type="password"
              className="key-input"
              placeholder="gsk_..."
              value=${apiKey}
              onInput=${(e) => persistKey(e.target.value)}
            />
            <p className="key-note">
              Free tier, no card needed. Saved only for this tab and cleared on close.
              Sent to Groq directly, not saved by this demo.
            </p>
          </div>
        `}

        <div className="captured">
          <span className="blk-lbl">Banner text</span>
          <p>${banner.captured}</p>
        </div>

        <div className="act-grid">
          ${[
            ["explain",  "What this says"],
            ["simplify", "Simple words"],
            ["risks",    "Show privacy risk"],
          ].map(
            ([key, label]) => html`
              <button
                key=${key}
                className=${"act-btn" + (activeMode === key ? " active" : "")}
                onClick=${() => handleMode(key)}
              >
                ${label}
              </button>
            `
          )}
        </div>

        <div className="toolkit-block">
          <span className="blk-lbl">Quick tools</span>
          <div className="toolkit-grid">
            <button className=${"mini-btn" + (toolkitMode === "scan" ? " active" : "")} onClick=${() => handleToolkit("scan")}>Find tricky wording</button>
            <button className=${"mini-btn" + (toolkitMode === "compare" ? " active" : "")} onClick=${() => handleToolkit("compare")}>Compare options</button>
            <button className=${"mini-btn" + (toolkitMode === "checklist" ? " active" : "")} onClick=${() => handleToolkit("checklist")}>Quick checklist</button>
          </div>
        </div>

        ${toolkitMode && html`
          <div className="mini-card">
            <h4>${TOOLKIT_TITLES[toolkitMode]}</h4>
            ${toolkitMode === "scan" && html`
              <ul className="resp-bullets">
                ${runDarkPatternScan(banner.captured).map((item, i) => html`<li key=${i}>${item}</li>`)}
              </ul>
            `}
            ${toolkitMode === "compare" && html`
              <table className="compare-table">
                <thead>
                  <tr><th>Option</th><th>What it usually means</th></tr>
                </thead>
                <tbody>
                  <tr><td>Accept all</td><td>More tracking can be turned on.</td></tr>
                  <tr><td>Reject optional</td><td>Usually only required cookies stay on.</td></tr>
                  <tr><td>Manage</td><td>You pick each cookie group yourself.</td></tr>
                </tbody>
              </table>
            `}
            ${toolkitMode === "checklist" && html`
              <ul className="resp-bullets">
                <li>Check if Reject is as easy to find as Accept.</li>
                <li>Look for mentions of sharing data with other companies.</li>
                <li>Turn off any switches you do not want before saving.</li>
                <li>Check how to change your choice later.</li>
              </ul>
            `}
          </div>
        `}

        ${loading && html`
          <div className="loading-box">
            <span className="spinner" />
            <span>AI is reading this banner...</span>
          </div>
        `}

        ${error && html`<p className="err-note">${error} Showing local analysis below.</p>`}

        ${!loading && activeMode && html`
          <div className="resp-card">
            <${RiskBar} level=${risk} />
            <span className=${"resp-source " + (aiText ? "ai" : "demo")}>
              ${aiText ? "AI answer" : "Local answer"}
            </span>
            <h4>${MODE_TITLES[activeMode]}</h4>
            ${aiText
              ? html`<${ResponseBody} text=${aiText} />`
              : html`<${FallbackBody} bannerKey=${bannerKey} mode=${activeMode} />`
            }
          </div>
        `}

        <p className="neutral-note">
          This helper explains cookie banners.
          You choose what to click.
        </p>

      </div>
    </aside>
  `;
}
