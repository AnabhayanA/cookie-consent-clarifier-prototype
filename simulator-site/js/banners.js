/**
 * banners.js — the three cookie consent banner components
 *
 * ManipulativeBanner  — large accept, tiny reject, reassuring wording
 * NeutralBanner       — equal-weight buttons, clear category separation
 * ComplexBanner       — legal language, interactive toggles (some pre-enabled)
 */
import { html, useState } from "./deps.js?v=10";
import { BANNERS } from "./data.js?v=10";

export function ManipulativeBanner({ onDecision }) {
  const b = BANNERS.manipulative;
  return html`
    <div className="cookie-banner">
      <p className="bm-title">${b.title}</p>
      <p className="bm-text">${b.body}</p>
      <div className="bm-actions">
        <button className="btn-accept-all" onClick=${() => onDecision("accept-all")}>Accept All</button>
        <button className="btn-manage-sm" onClick=${() => onDecision("manage")}>Manage settings</button>
        <button className="btn-reject-sm" onClick=${() => onDecision("reject-all")}>Reject all</button>
      </div>
    </div>
  `;
}

export function NeutralBanner({ onDecision }) {
  const b = BANNERS.neutral;
  return html`
    <div className="cookie-banner">
      <p className="bn-title">${b.title}</p>
      <p className="bn-text">${b.body}</p>
      <div className="bn-actions">
        <button className="btn-eq-accept" onClick=${() => onDecision("accept-all")}>Accept All</button>
        <button className="btn-eq-decline" onClick=${() => onDecision("reject-all")}>Decline All</button>
        <button className="btn-eq-manage" onClick=${() => onDecision("manage")}>Manage Preferences</button>
      </div>
    </div>
  `;
}

export function ComplexBanner({ onDecision }) {
  const b = BANNERS.complex;
  const [toggles, setToggles] = useState({
    analytics: true,
    marketing: true,
    personal: true,
    third: false,
  });

  const flip = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  const rows = [
    ["analytics", "Analytics"],
    ["marketing", "Marketing"],
    ["personal",  "Personalisation"],
    ["third",     "Third-Party"],
  ];

  return html`
    <div className="cookie-banner">
      <p className="bc-title">${b.title}</p>
      <div className="bc-layout">
        <div>
          <p className="bc-text">${b.body}</p>
          <button className="btn-save" onClick=${() => onDecision("save-preferences", toggles)}>
            Save Preferences
          </button>
        </div>
        <div className="toggles-col">
          <div className="toggle-row">
            <span className="toggle-lbl">Strictly Necessary</span>
            <button className="tog locked" disabled=${true} />
          </div>
          ${rows.map(
            ([key, name]) => html`
              <div className="toggle-row" key=${key}>
                <span className="toggle-lbl">${name}</span>
                <button
                  className=${"tog " + (toggles[key] ? "on" : "off")}
                  onClick=${() => flip(key)}
                />
              </div>
            `
          )}
        </div>
      </div>
    </div>
  `;
}
