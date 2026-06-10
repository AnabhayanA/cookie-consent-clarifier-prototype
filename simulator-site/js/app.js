/**
 * app.js — root React component + render
 *
 * Fake website: "The Cookie Jar" (cookie baking site).
 * Banner auto-appears after 2.5 s, panel slides in 900 ms later.
 */
import { html, useState, useEffect, createRoot } from "./deps.js?v=10";
import { BANNERS }                               from "./data.js?v=10";
import { ManipulativeBanner, NeutralBanner, ComplexBanner } from "./banners.js?v=10";
import { ExtPanel }                              from "./panel.js?v=10";

const BANNER_COMPONENTS = {
  manipulative: ManipulativeBanner,
  neutral:      NeutralBanner,
  complex:      ComplexBanner,
};

const RECIPES = [
  { name: "Classic Chocolate Chip", time: "25 min", yield: "24 cookies", diff: "Easy",   emoji: "🍪", desc: "The all-time favourite. Crisp edges, chewy centre, and pools of melted chocolate. This recipe uses browned butter for extra depth of flavour." },
  { name: "Snickerdoodle",          time: "20 min", yield: "30 cookies", diff: "Easy",   emoji: "🌟", desc: "Pillowy soft cookies rolled in cinnamon sugar. Cream of tartar gives snickerdoodles their signature tangy flavour and chewy texture." },
  { name: "Oatmeal Raisin",         time: "30 min", yield: "28 cookies", diff: "Easy",   emoji: "🌾", desc: "Hearty and wholesome. Rolled oats give these cookies their rustic chew, while nutmeg and cinnamon make them taste like home." },
  { name: "Double Chocolate Fudge", time: "35 min", yield: "20 cookies", diff: "Medium", emoji: "🍫", desc: "Rich cocoa dough studded with chocolate chunks. Bake until just set for a fudgy brownie-like texture that chocolate lovers will adore." },
  { name: "Lemon Shortbread",       time: "40 min", yield: "36 cookies", diff: "Easy",   emoji: "🍋", desc: "Buttery and melt-in-your-mouth. Bright lemon zest lifts the rich shortbread base. Perfect with afternoon tea." },
  { name: "Peanut Butter Blossoms", time: "22 min", yield: "24 cookies", diff: "Easy",   emoji: "🥜", desc: "Soft peanut butter cookies crowned with a chocolate kiss. A classic combination that never gets old." },
];

const TIPS = [
  { title: "Room Temperature Butter", body: "Cold butter won't cream properly and leads to dense cookies. Take it out 45–60 minutes before you start. It should indent easily when pressed but still hold its shape." },
  { title: "Chill the Dough",         body: "Refrigerating cookie dough for at least 30 minutes (or overnight) intensifies flavour, prevents spreading, and gives you thicker, chewier cookies. Worth the wait every time." },
  { title: "Use a Kitchen Scale",     body: "Volume measurements for flour can vary by up to 20% depending on how you scoop. Weighing ensures consistency. 1 cup of all-purpose flour = 120–130 g." },
  { title: "Don't Over-Bake",         body: "Cookies continue to cook on the hot pan after you pull them out. Take them out when the edges are set but the centres still look slightly underdone. They'll firm up perfectly as they cool." },
];

const INGREDIENTS = [
  { name: "All-Purpose Flour", role: "Structure",         note: "Provides the backbone. Too much makes cookies cakey; too little causes spreading and flat results." },
  { name: "Butter",            role: "Flavour & Texture", note: "Fat content determines spread and richness. Browned butter adds a nutty, caramel depth." },
  { name: "Brown Sugar",       role: "Moisture & Chew",   note: "Molasses content retains moisture, making cookies chewy and giving subtle caramel notes." },
  { name: "Eggs",              role: "Binding & Lift",    note: "Extra yolk = chewier. Extra white = cakier. Room temperature eggs incorporate more evenly." },
  { name: "Baking Soda",       role: "Leavening",         note: "Reacts with acidic ingredients to produce lift and promote beautiful Maillard browning." },
  { name: "Vanilla Extract",   role: "Depth",             note: "Use pure extract — imitation vanilla has a harsher aftertaste and far less complexity." },
];

const BASE_BATCH = {
  flour: 280,
  butter: 170,
  sugar: 150,
  brownSugar: 180,
  eggs: 2,
  chocolate: 220,
};

function BatchCalculator() {
  const [batchSize, setBatchSize] = useState(1);
  const scale = Number(batchSize) || 1;

  return html`
    <section className="calc-block">
      <div className="calc-head">
        <h2>React Batch Calculator</h2>
        <p>Adjust batch size and ingredient totals update instantly.</p>
      </div>

      <div className="calc-controls">
        <label htmlFor="batchRange">Batch size: ${scale}x</label>
        <input
          id="batchRange"
          type="range"
          min="1"
          max="8"
          step="1"
          value=${scale}
          onInput=${(e) => setBatchSize(e.target.value)}
        />
      </div>

      <div className="calc-grid">
        <div className="calc-item"><span>Flour</span><strong>${Math.round(BASE_BATCH.flour * scale)} g</strong></div>
        <div className="calc-item"><span>Unsalted Butter</span><strong>${Math.round(BASE_BATCH.butter * scale)} g</strong></div>
        <div className="calc-item"><span>White Sugar</span><strong>${Math.round(BASE_BATCH.sugar * scale)} g</strong></div>
        <div className="calc-item"><span>Brown Sugar</span><strong>${Math.round(BASE_BATCH.brownSugar * scale)} g</strong></div>
        <div className="calc-item"><span>Eggs</span><strong>${Math.max(1, Math.round(BASE_BATCH.eggs * scale))}</strong></div>
        <div className="calc-item"><span>Chocolate Chunks</span><strong>${Math.round(BASE_BATCH.chocolate * scale)} g</strong></div>
      </div>
    </section>
  `;
}

function App() {
  const [bannerKey,     setBannerKey]     = useState("manipulative");
  const [bannerVisible, setBannerVisible] = useState(false);
  const [panelOpen,     setPanelOpen]     = useState(false);
  const [consentState,  setConsentState]  = useState(null);

  // Auto-show banner after 2.5 s, slide in panel 900 ms later
  useEffect(() => {
    const t1 = setTimeout(() => setBannerVisible(true), 2500);
    const t2 = setTimeout(() => setPanelOpen(true),     3400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function switchBanner(key) {
    if (key === bannerKey) return;
    setBannerVisible(false);
    setPanelOpen(false);
    setConsentState(null);
    setBannerKey(key);
    setTimeout(() => setBannerVisible(true), 500);
    setTimeout(() => setPanelOpen(true),     1300);
  }

  function handleConsentDecision(decision, details = null) {
    const decisionLabel =
      decision === "accept-all"
        ? "Accepted all cookies"
        : decision === "reject-all"
        ? "Rejected optional cookies"
        : decision === "manage"
        ? "Opened cookie settings"
        : "Saved custom cookie preferences";

    setConsentState({ label: decisionLabel, details });
    setPanelOpen(true);

    if (decision === "accept-all" || decision === "reject-all" || decision === "save-preferences") {
      setBannerVisible(false);
    }
  }

  const BannerComponent = BANNER_COMPONENTS[bannerKey];

  return html`
    <div className=${"app-root" + (panelOpen ? " panel-open" : "")}>
      <div className="page">

        <div className="browser-shell">
          <div className="browser-dot red" />
          <div className="browser-dot amber" />
          <div className="browser-dot green" />
          <div className="address-bar">https://www.thecookiejar.com/recipes/chocolate-chip</div>
          <button className="ext-chip" onClick=${() => setPanelOpen(true)}>Cookie Companion</button>
        </div>

        <nav className="site-nav">
          <span className="site-logo">🍪 The Cookie Jar</span>
          <ul className="site-links">
            <li>Recipes</li>
            <li>Techniques</li>
            <li>Ingredients</li>
            <li>Community</li>
            <li>About</li>
          </ul>
        </nav>

        <div className="sim-bar">
          <span>Privacy consent patterns:</span>
          ${Object.entries(BANNERS).map(([key, val]) => html`
            <button key=${key}
              className=${"sw-btn" + (bannerKey === key ? " active" : "")}
              onClick=${() => switchBanner(key)}
            >${val.label}</button>
          `)}
        </div>

        ${consentState && html`
          <div className="consent-status">
            <span className="consent-dot" />
            <span>${consentState.label}</span>
          </div>
        `}

        <div className="site-body">

          <div className="hero-block">
            <p className="hero-eyebrow">Welcome to The Cookie Jar</p>
            <h1>Bake the Perfect Cookie,<br/>Every Single Time.</h1>
            <p className="hero-sub">
              From classic chocolate chip to elaborate sandwich cookies — trusted recipes,
              science-backed techniques, and everything you need to become a confident home baker.
            </p>
            <div className="hero-btns">
              <button className="btn-hero-primary">Browse All Recipes</button>
              <button className="btn-hero-secondary">Start with Basics</button>
            </div>
            <div className="hero-stats">
              <div className="stat"><strong>240+</strong><span>Recipes</span></div>
              <div className="stat"><strong>4.9 ★</strong><span>Avg Rating</span></div>
              <div className="stat"><strong>1.2 M</strong><span>Bakes Made</span></div>
            </div>
          </div>

          <div className="section-head">
            <h2>Featured Recipes</h2>
            <a className="see-all">See all →</a>
          </div>
          <div className="card-row">
            ${RECIPES.slice(0, 3).map(r => html`
              <div className="recipe-card" key=${r.name}>
                <div className="recipe-thumb">${r.emoji}</div>
                <div className="recipe-info">
                  <h3>${r.name}</h3>
                  <div className="recipe-meta">
                    <span>⏱ ${r.time}</span>
                    <span>🍪 ${r.yield}</span>
                    <span className="diff-badge">${r.diff}</span>
                  </div>
                  <p>${r.desc}</p>
                </div>
              </div>
            `)}
          </div>

          <div className="article-block">
            <span className="article-label">Deep Dive</span>
            <h2>The Science of a Perfect Chocolate Chip Cookie</h2>
            <p>Every ingredient in a cookie serves a precise chemical purpose. Understanding what each one does gives you the power to tweak any recipe to your exact preference — chewier, crispier, thicker, or flatter. Here's what's really happening inside your oven.</p>
            <h3>Why Butter Temperature Changes Everything</h3>
            <p>Butter is an emulsion of fat and water. When you cream softened butter with sugar, you trap millions of tiny air bubbles that expand during baking and give cookies lift. Cold butter won't cream — the fat is too firm to incorporate air. Melted butter produces a dense, chewy cookie with more spread because there's no air structure holding the dough up.</p>
            <p>Brown butter takes things further. By cooking butter until the milk solids caramelise, you drive off water, concentrate the fat, and create dozens of new flavour compounds through the Maillard reaction — the same process that browns steak and toasts bread. The result is a cookie with toffee, hazelnut, and caramel undertones that straight butter simply can't achieve.</p>
            <h3>The Role of Sugar: White vs. Brown</h3>
            <p>White granulated sugar promotes spreading and creates crisp edges through caramelisation. Brown sugar contains molasses — acidic, hygroscopic, and packed with flavour compounds. More brown sugar means a chewier, moister, more flavourful cookie. Most classic recipes use roughly 60% brown to 40% white sugar.</p>
            <h3>Flour, Protein, and Gluten</h3>
            <p>All-purpose flour contains around 10–12% protein. When mixed with liquid, these proteins form gluten — the elastic network that gives structure. In cookies, too much gluten is the enemy of tenderness. That's why most recipes tell you to mix just until combined. Replacing a few tablespoons of flour with cornstarch reduces protein further and produces an ultra-soft, bakery-style texture.</p>
            <h3>The Egg Question</h3>
            <p>The whole egg contributes fat from the yolk and protein from the white. Fat adds richness and tenderness; protein provides structure. Using an extra yolk creates a richer, chewier cookie. Extra whites make a cakier, drier texture. Room temperature eggs incorporate more evenly — cold eggs can cause the butter-sugar mixture to seize.</p>
            <h3>Chilling the Dough: Patience Always Pays Off</h3>
            <p>Resting dough in the refrigerator firms up the fat so cookies spread more slowly and end up thicker. It also lets the flour fully hydrate and gives enzymes time to break down starch into sugars, intensifying sweetness and flavour. A 24–72 hour rest makes a measurably better cookie. Most professional bakers swear by it.</p>
          </div>

          <div className="section-head"><h2>Essential Techniques</h2></div>
          <div className="tips-grid">
            ${TIPS.map(t => html`
              <div className="tip-card" key=${t.title}>
                <h4>${t.title}</h4>
                <p>${t.body}</p>
              </div>
            `)}
          </div>

          <div className="section-head"><h2>Know Your Ingredients</h2></div>
          <div className="ingredients-grid">
            ${INGREDIENTS.map(i => html`
              <div className="ing-card" key=${i.name}>
                <div className="ing-top">
                  <strong>${i.name}</strong>
                  <span className="ing-role">${i.role}</span>
                </div>
                <p>${i.note}</p>
              </div>
            `)}
          </div>

          <${BatchCalculator} />

          <div className="section-head">
            <h2>More to Bake</h2>
            <a className="see-all">See all →</a>
          </div>
          <div className="card-row">
            ${RECIPES.slice(3).map(r => html`
              <div className="recipe-card" key=${r.name}>
                <div className="recipe-thumb">${r.emoji}</div>
                <div className="recipe-info">
                  <h3>${r.name}</h3>
                  <div className="recipe-meta">
                    <span>⏱ ${r.time}</span>
                    <span>🍪 ${r.yield}</span>
                    <span className="diff-badge">${r.diff}</span>
                  </div>
                  <p>${r.desc}</p>
                </div>
              </div>
            `)}
          </div>

          <div className="newsletter-block">
            <h2>Get Weekly Recipes in Your Inbox</h2>
            <p>Join 180,000 home bakers who get our best cookie recipes, technique guides, and seasonal favourites delivered every Tuesday.</p>
            <div className="newsletter-form">
              <input type="email" className="nl-input" placeholder="you@example.com" />
              <button className="nl-btn">Subscribe</button>
            </div>
            <p className="nl-note">No spam. Unsubscribe any time. We take your privacy seriously.</p>
          </div>

          <footer className="site-footer">
            <div className="footer-cols">
              <div>
                <strong>🍪 The Cookie Jar</strong>
                <p>Your home for trusted cookie recipes and baking science since 2019.</p>
              </div>
              <div>
                <strong>Recipes</strong>
                <ul>
                  <li>Drop Cookies</li><li>Bar Cookies</li><li>Rolled and Cut</li>
                  <li>Sandwich Cookies</li><li>No-Bake</li>
                </ul>
              </div>
              <div>
                <strong>Learn</strong>
                <ul>
                  <li>Cookie Science</li><li>Troubleshooting</li>
                  <li>Equipment Guide</li><li>Ingredient Swaps</li>
                </ul>
              </div>
              <div>
                <strong>Company</strong>
                <ul>
                  <li>About Us</li><li>Privacy Policy</li>
                  <li>Terms of Use</li><li>Contact</li>
                </ul>
              </div>
            </div>
            <p className="footer-copy">© 2026 The Cookie Jar. All rights reserved.</p>
          </footer>

        </div>

        ${bannerVisible && html`
          <${BannerComponent} onDecision=${handleConsentDecision} />
        `}
      </div>

      <${ExtPanel}
        bannerKey=${bannerKey}
        open=${panelOpen}
        onClose=${() => setPanelOpen(false)}
      />
    </div>
  `;
}

createRoot(document.getElementById("root")).render(html`<${App} />`);
