# Inner-page implementation kit

Single source of truth for the **inner-pages-redesign** subagents. Each subagent **must** consume this file before generating its target HTML.

## Stack

- Static HTML + CSS + minimal JS. Served via `npx serve . -l 8080`.
- Existing modular CSS in `css/`:
  - `css/tokens.css` — design tokens (colors, typography, spacing, transitions)
  - `css/base.css` — reset + shared typography classes (`.ds-display`, `.ds-h1`, `.ds-bold`, `.ds-thin`, `.ds-accent`, `.ds-body-lg`, `.ds-body-sm`, `.ds-eyebrow`, etc.) + button classes (`.ds-btn`, `.ds-btn-primary`, `.ds-btn-ghost`, `.ds-btn-lg`)
  - `css/header.css` — `.site-header` (fixed two-layer nav, scrolled state)
  - `css/sections.css` — large library of section patterns (`s2-`, `s3-`, `s4-`, `s5-`, `s6-`, `s7-`, `s8-`, `s9-`, `s3b-news`, footer) — **read this** to find a matching pattern before inventing new CSS
  - `css/responsive.css` — breakpoint overrides
  - `css/design-system.css` — `.ds-*` utility/component classes
- Per-page CSS file: each page should add a `css/<slug>.css` for page-specific styles, kept thin. Example: `css/firms.css`, `css/firm-profile.css`, `css/mylexi.css` already exist.
- Fonts (loaded in `<head>`): Source Sans 3 (400/600/700) + DM Sans (400/500). Already in tokens.

## Required `<head>` block

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TerraLex — <PAGE TITLE></title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">

<link rel="stylesheet" href="css/tokens.css">
<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/header.css">
<link rel="stylesheet" href="css/sections.css">
<link rel="stylesheet" href="css/responsive.css">
<link rel="stylesheet" href="css/design-system.css">

<!-- Page-specific stylesheet (create if needed) -->
<link rel="stylesheet" href="css/<SLUG>.css">
</head>
<body>
```

## Required header (paste verbatim, adjust active state)

The inner pages **do not** sit on a hero — they have a white/scrolled header from the start. Add `class="site-header scrolled has-solid-bg"` to skip the hero-mode transparent state. (Existing `firms.html` does this; if a class is missing in CSS, add it to your page CSS as `.site-header.has-solid-bg { background: #fff; border-bottom: 1px solid rgba(0,0,0,0.06); }` and confirm scroll behavior still works.)

```html
<header class="site-header scrolled has-solid-bg" id="siteHeader">
  <div class="nav-topbar">
    <a href="#">Member Directory</a><span class="sep">|</span>
    <a href="sign-in.html">TLC Sign-On</a><span class="sep">|</span>
    <a href="mylexi.html">Ask myLexi</a><span class="sep">|</span>
    <a href="contact-us.html">Contact Us</a>
  </div>
  <nav id="mainNav">
    <a href="index.html" class="nav-logo">
      <img class="logo-hero" src="assets/logos/Logo white.svg" alt="TerraLex">
      <img class="logo-scrolled" src="assets/logos/Logo default.svg" alt="TerraLex">
    </a>
    <div class="nav-links">
      <a href="insights-cross-border-guides.html">Cross-Border Guides</a>
      <div class="nav-dropdown">
        <a href="practice-groups-industry-sector-teams.html" class="nav-dropdown-trigger">Expertise <svg class="dropdown-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 1 5 5 9 1"/></svg></a>
        <div class="nav-mega">
          <div class="mega-col">
            <h4>Practice Groups</h4>
            <a href="practice-group-detail.html">Antitrust &amp; Competition</a>
            <a href="practice-group-detail.html">Bankruptcy / Insolvency</a>
            <a href="practice-group-detail.html">Construction &amp; Infrastructure</a>
            <a href="practice-group-detail.html">Energy &amp; Environmental</a>
            <a href="practice-group-detail.html">Finance &amp; Banking</a>
            <a href="practice-group-detail.html">Global Trade &amp; Policy</a>
            <a href="practice-group-detail.html">Immigration</a>
            <a href="practice-group-detail.html">Insurance</a>
            <a href="practice-group-detail.html">Intellectual Property, Licensing &amp; Technology</a>
            <a href="practice-group-detail.html">International Litigation &amp; Arbitration</a>
            <a href="practice-group-detail.html">Labor &amp; Employment</a>
            <a href="practice-group-detail.html">Mergers &amp; Acquisitions</a>
            <a href="practice-group-detail.html">Real Estate</a>
            <a href="practice-group-detail.html">Regulatory, Investigations &amp; Compliance</a>
            <a href="practice-group-detail.html">Tax &amp; Wealth Services</a>
          </div>
          <div class="mega-col">
            <h4>Industry Sector Teams</h4>
            <a href="industry-sector-team-detail.html">Automotive</a>
            <a href="industry-sector-team-detail.html">Aviation</a>
            <a href="industry-sector-team-detail.html">Education Services</a>
            <a href="industry-sector-team-detail.html">ESG</a>
            <a href="industry-sector-team-detail.html">Food &amp; Beverage</a>
            <a href="industry-sector-team-detail.html">Hospitality</a>
            <a href="industry-sector-team-detail.html">Life Sciences</a>
            <a href="industry-sector-team-detail.html">Mining</a>
            <a href="industry-sector-team-detail.html">Retail</a>
            <a href="industry-sector-team-detail.html">Sports &amp; Entertainment</a>
            <a href="industry-sector-team-detail.html">Technology &amp; Digital Business</a>
          </div>
          <div class="mega-col">
            <h4>Regions</h4>
            <a href="firms.html">Africa &amp; the Middle East</a>
            <a href="firms.html">Asia-Pacific</a>
            <a href="firms.html">Europe</a>
            <a href="firms.html">Latin America &amp; the Caribbean</a>
            <a href="firms.html">North America</a>
          </div>
        </div>
      </div>
      <a href="events.html">Events Hub</a>
      <a href="news.html">Global Insights</a>
      <a href="success-stories.html">Success Stories</a>
      <a href="about.html">About TerraLex</a>
    </div>
    <div class="nav-actions">
      <button class="nav-search-btn" aria-label="Search" onclick="location.href='search.html'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
      <button class="nav-hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
</header>
```

## Required footer (paste verbatim)

```html
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <img class="footer-logo" src="assets/logos/Logo white.svg" alt="TerraLex">
      <p class="footer-tagline ds-body-sm on-dark">The elite global legal network committed to collaboration. 141 member firms in 207 jurisdictions and 134 countries.</p>
    </div>
    <div class="footer-nav-group">
      <p class="footer-nav-heading ds-eyebrow on-dark">Network</p>
      <ul class="footer-nav-list">
        <li><a href="about.html">About TerraLex</a></li>
        <li><a href="firms.html">Member Directory</a></li>
        <li><a href="practice-groups-industry-sector-teams.html">Practice Groups &amp; Industry Sector Teams</a></li>
        <li><a href="https://www.linkedin.com/company/terralex/">Follow us on LinkedIn</a></li>
      </ul>
    </div>
    <div class="footer-nav-group">
      <p class="footer-nav-heading ds-eyebrow on-dark">Knowledge</p>
      <ul class="footer-nav-list">
        <li><a href="insights-cross-border-guides.html">Cross-Border Guides</a></li>
        <li><a href="mylexi.html">myLexi AI-Powered Assistant</a></li>
        <li><a href="news.html">Insights</a></li>
        <li><a href="events.html">Events</a></li>
      </ul>
    </div>
    <div class="footer-nav-group">
      <p class="footer-nav-heading ds-eyebrow on-dark">Contact</p>
      <ul class="footer-nav-list">
        <li><a href="sign-in.html">TLC Sign-On (Members Only)</a></li>
        <li><a href="contact-us.html">Contact Us</a></li>
        <li><a href="terms-and-conditions.html">Terms and Conditions</a></li>
        <li><a href="privacy-policy.html">Privacy Policy</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p class="footer-copy">© 2026 TerraLex. All rights reserved.</p>
  </div>
</footer>
```

## Inner-page hero conventions

Inner pages do NOT use the rotating hero from `index.html`. Instead, use a **compact page hero** ~40-50vh tall with:
- Eyebrow (ds-eyebrow class) for breadcrumb-like context (e.g. "Member Firm Profile", "Cross-Border Guide")
- H1 in `.h-hero` or `.ds-display` (responsive headline)
- Optional subhead in `.ds-body-lg`
- Optional dark/blue background image with overlay following Section 1 patterns

Reference `firms.css` and `mylexi.css` to see the page-hero conventions already in use.

## Card / list patterns

For card grids reuse:
- `.s4-card` family (sections.css ~line ~462+) — image-bg cards with practice + region pills
- `.s3b-news` family — news/article cards with image + title + excerpt
- `.s6-event` — event cards with date / location

For long-form readable bodies:
- Wrap content in `.ds-prose` (if available in design-system.css) or set max-width: 70ch on body containers.

## Do NOT propose backend features

The live terralex.org backend stays as-is. We are **only redesigning presentation**:
- Forms can submit to the same endpoints they already do (or `action="#"` placeholders).
- Search, filters, etc. that exist today can be re-skinned. New search backends, schema changes, or new auth flows are out of scope.
- Anything dynamic that wasn't already on the live site = do not add.

## Conflict-handling rule (IMPORTANT)

The brief was written from a markdown-only fetch of the live site. The screenshot at `Benchmarks/screenshots/<NN-slug>.png` is the actual rendered state. If the brief and the screenshot disagree (e.g. brief says "no member-firm grid", screenshot shows three group leaders), **STOP and report the conflict in your final message** instead of building either version. Do not silently pick.

## Acceptance checklist

Before reporting a page complete:
1. File served via `npx serve . -l 8080` opens with no console errors.
2. Header + footer paste verbatim from above (with active-link adjustments).
3. Stylesheet imports in the order listed in the head block.
4. Page-specific styles in `css/<slug>.css`, ≤300 lines, prefixed with a page-scope class to avoid global leakage.
5. Responsive at 1440 / 1024 / 768 / 375 widths (eyeball check: no horizontal scroll, no overflow).
6. All anchor links target real or placeholder slugs from this kit.
