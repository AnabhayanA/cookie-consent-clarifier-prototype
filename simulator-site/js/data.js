/**
 * data.js — static banner content and fallback responses
 *
 * BANNERS        — the three cookie consent scenarios
 * FALLBACK       — prewritten responses used when no API key is provided
 */

export const BANNERS = {
  manipulative: {
    label: "Manipulative",
    type: "Manipulative — dark pattern design",
    title: "We value your privacy",
    body: "We use cookies and similar tracking technologies to enhance your browsing experience, personalise content and advertisements, analyse our website traffic, and understand where our visitors are coming from. By clicking 'Accept All', you consent to our use of cookies. You can customise your preferences at any time.",
    captured:
      "We use cookies to personalise content, show ads, and analyse traffic. 'Accept All' grants broad tracking consent. The reject option is intentionally tiny and low-contrast.",
  },
  neutral: {
    label: "Neutral",
    type: "Neutral — balanced choice design",
    title: "Cookie Preferences",
    body: "This site uses cookies to improve your experience. Analytics cookies help us understand how visitors use the site. Marketing cookies are used to show relevant content. You can accept all, decline optional cookies, or manage your preferences — all options are equally available.",
    captured:
      "Analytics cookies (site improvement) and marketing cookies (relevant ads). All three choices — Accept, Decline, Manage — are shown with equal visual weight.",
  },
  complex: {
    label: "Complex / Legal",
    type: "Complex — dense legal language",
    title: "Your Privacy Choices",
    body: "We and our 187 partners process personal data including IP addresses, device identifiers, and browsing behaviour using cookies and similar technologies. Processing is based on GDPR Article 6(1)(a) (consent) and Article 6(1)(f) (legitimate interests). Purposes include delivering and improving services, personalised advertising, analytics, and third-party content. You may withdraw consent at any time via our Privacy Centre, though this does not affect lawfulness of prior processing.",
    captured:
      "We and 187 partners process personal data under GDPR Article 6(1)(a) and 6(1)(f). Purposes: advertising, analytics, personalisation. Toggles may be pre-enabled.",
  },
};

/**
 * FALLBACK responses — shown when no OpenAI API key is set.
 * Shape: { [bannerKey]: { [mode]: { title, bullets?: string[], paras?: string[] } } }
 */
export const FALLBACK = {
  manipulative: {
    explain: {
      title: "What this banner is doing",
      paras: [
        "This banner gives more visual emphasis to 'Accept All' than to reject options.",
        "The phrase 'We value your privacy' is reassuring language, while the request still asks for broad tracking consent.",
        "The layout may make one choice easier to notice than others.",
      ],
    },
    simplify: {
      title: "In simple words",
      paras: [
        "The site asks to track activity and may share data with ad companies.",
        "One button is easier to notice. Other choices are available too.",
      ],
    },
    risks: {
      title: "Privacy risks to know",
      bullets: [
        "Your browsing history may be tracked across many websites",
        "Data may be shared with advertising partners",
        "Decline options may be less visible than accept options",
        "Broad consent may be difficult to withdraw later",
        "Personalised ad profiles may be built from your activity",
      ],
    },
  },

  neutral: {
    explain: {
      title: "What this banner is doing",
      paras: [
        "This banner presents Accept, Decline, and Manage Preferences with equal visual weight — a fair consent design.",
        "It separates analytics cookies (understanding traffic) from marketing cookies (ads), helping you decide per category.",
        "The balanced design does not visually push you toward any particular choice.",
      ],
    },
    simplify: {
      title: "In simple words",
      paras: [
        "The site uses cookies to count visits and to show relevant ads. Both types are explained clearly.",
        "All three choices are shown equally — you can say yes, no, or choose each type separately.",
        "Declining optional cookies often keeps core site features available.",
      ],
    },
    risks: {
      title: "Privacy risks to know",
      bullets: [
        "Analytics cookies: low impact — measure site traffic and usage",
        "Marketing cookies: moderate impact — can enable ad targeting",
        "Equal visual weight supports balanced choice visibility",
        "Declining optional cookies usually has limited impact on core access",
      ],
    },
  },

  complex: {
    explain: {
      title: "What this banner is doing",
      paras: [
        "This banner references 187 partners and two GDPR legal articles. The legal language makes it hard to quickly understand what you are agreeing to.",
        "'Legitimate interests' is a legal basis that can allow processing without explicit consent for some purposes.",
        "Some toggles may start as 'on', so each category may need review.",
      ],
    },
    simplify: {
      title: "In simple words",
      paras: [
        "A large number of companies want to collect and use your data for ads, personalisation, and tracking.",
        "The legal references mean this is covered by EU data law.",
        "Check which toggles are already turned on by default before saving.",
      ],
    },
    risks: {
      title: "Privacy risks to know",
      bullets: [
        "187+ partner companies may receive your personal data",
        "Default toggles may already be enabled — review each one",
        "'Legitimate interests' may allow processing without your explicit yes",
        "Dense legal language makes it hard to understand what you agree to",
        "Changing consent later is usually possible, but the process may take time",
      ],
    },
  },
};
