/**
 * panel.js — the AI-assisted extension panel component
 *
 * Behaviour:
 *  - AI calls are routed to the backend (owner-only access control).
 *  - If backend AI is unavailable, it shows prewritten fallback text from data.js.
 *  - The panel never recommends accepting or rejecting cookies.
 */
import { html, useState, useEffect } from "./deps.js?v=10";
import { BANNERS, FALLBACK }   from "./data.js?v=10";
import { callAI }                    from "./ai.js?v=10";

const MODE_TITLES = {
  explain:  "What this banner says",
  simplify: "Simple summary",
  risks:    "Privacy risk",
};

const RISK_LABELS = { low: "Low risk", med: "Medium risk", high: "High risk" };
const RISK_MEANING = {
  low: "Low means balanced consent design with lower pressure and narrower tracking signals.",
  med: "Medium means meaningful privacy concerns exist, but pressure or scope is mixed.",
  high: "High means stronger pressure patterns or broad data-sharing/tracking signals.",
};
const TOOLKIT_TITLES = {
  scan: "Tricky Wording Check",
  compare: "Choice Compare",
  checklist: "Before You Choose",
};

const RISK_SIGNAL_RULES = [
  {
    pattern: /accept all|allow all|agree to all/,
    weight: 2,
    reason: "Strong consent wording can nudge users toward full tracking.",
  },
  {
    pattern: /tiny|low-contrast|hard to find|less visible|hidden reject/,
    weight: 3,
    reason: "Reject controls appear harder to notice than accept controls.",
  },
  {
    pattern: /partners|third[- ]party|share/,
    weight: 2,
    reason: "Data may be shared with external companies.",
  },
  {
    pattern: /ads?|advertis|personalis|profil/,
    weight: 2,
    reason: "Banner indicates ad targeting or profiling activity.",
  },
  {
    pattern: /legitimate interests|article 6|gdpr|lawfulness/,
    weight: 1,
    reason: "Dense legal framing may reduce clarity for users.",
  },
  {
    pattern: /pre-enabled|preenabled|default on|toggles? may be pre-enabled/,
    weight: 2,
    reason: "Some consent controls may start enabled by default.",
  },
];

const RISK_MITIGATION_RULES = [
  {
    pattern: /equal visual weight|equally available|all three choices/,
    weight: -2,
    reason: "Choice options appear balanced instead of one-sided.",
  },
  {
    pattern: /decline|reject|manage/,
    weight: -1,
    reason: "Clear alternatives to full acceptance are present.",
  },
];

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function computeRiskFromText(text) {
  const lower = (text || "").toLowerCase();
  let score = 0;
  const reasons = [];

  for (const rule of RISK_SIGNAL_RULES) {
    if (rule.pattern.test(lower)) {
      score += rule.weight;
      reasons.push(rule.reason);
    }
  }

  for (const rule of RISK_MITIGATION_RULES) {
    if (rule.pattern.test(lower)) {
      score += rule.weight;
      reasons.push(rule.reason);
    }
  }

  const partnerMatch = lower.match(/(\d{2,4})\s+partners?/);
  if (partnerMatch) {
    const count = Number(partnerMatch[1]);
    if (count >= 100) {
      score += 3;
      reasons.push("A large number of partners may receive personal data.");
    } else if (count >= 20) {
      score += 2;
      reasons.push("Multiple partner organizations may receive personal data.");
    }
  }

  score = clamp(score, 0, 10);

  let level = "low";
  if (score >= 5) level = "high";
  else if (score >= 2) level = "med";

  return {
    level,
    score,
    reasons: reasons.length ? reasons : ["No strong high-risk or pressure signals were detected in this banner text."],
  };
}

/* ── Sub-components ──────────────────────────────────────────────── */

function RiskBar({ level, score, reasons = [] }) {
  return html`
    <div className="risk-wrap">
      <div className="risk-hdr">
        <span>Privacy risk</span>
        <span className=${"risk-lbl " + level}>${RISK_LABELS[level]}</span>
      </div>
      <div className="risk-track">
        <div className=${"risk-fill " + level} />
      </div>
      <p>Signal score: ${score}/10</p>
      <p>${RISK_MEANING[level]}</p>
      ${reasons.length > 0 && html`
        <ul className="resp-bullets">
          ${reasons.map((item, i) => html`<li key=${i}>${item}</li>`)}
        </ul>
      `}
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

    setLoading(true);
    try {
      const text = await callAI({
        bannerText: banner.captured,
        bannerType: banner.type,
        mode,
      });
      setAiText(text);
    } catch (e) {
      setError(`AI error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }
  const riskAssessment = computeRiskFromText(banner.captured);

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
        <p className="key-note">
          AI is processed through the backend service.
          If backend access is unavailable, local analysis is shown.
        </p>

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

        ${error && html`<p className="err-note">${error} Using local analysis below.</p>`}

        ${!loading && activeMode && html`
          <div className="resp-card">
            <${RiskBar}
              level=${riskAssessment.level}
              score=${riskAssessment.score}
              reasons=${riskAssessment.reasons}
            />
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
