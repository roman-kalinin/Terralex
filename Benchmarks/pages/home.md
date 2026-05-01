# Home

**Live URL:** https://www.terralex.org/
**Local file (target):** index.html
**Page purpose:** Marketing front door for the TerraLex network — positions the org as the elite global legal network and routes visitors to firms, guides, MyLexi, news, and contact.

> NOTE: `index.html` on this branch has already been comprehensively redesigned. This brief is primarily a **reference / archival document** comparing the live legacy home to the new home, with only minor polish notes where a clear gap remains.

## Current state — observations

### Live legacy home (terralex.org)
- Header carries primary nav (Find Firms/Professionals, Cross-Border Guides, Ask myLexi, member sign-in) plus a secondary expandable menu surfacing Industry Sector Teams, Regions, and Practice Groups. LinkedIn icon top-right.
- Hero clusters the myLexi logo with two banner-style announcements (2025 Annual Report PDF; new FDI Cross-Border Guide), each with direct download/CTA links. Tagline: "the elite global legal network committed to collaboration… 30+ years… 23,000+ attorneys."
- Events block: thin "view more events" tease, very low information density.
- News & Insights: 4 thumbnail cards (collaborative-law feature, regional expansion announcements for Belize and Qatar, etc.).
- Collaboration Success Stories: 4 case-study cards (telecom transactions, fintech investments, etc.) linking to detail pages.
- "TerraLex by The Numbers" stats block — at fetch time the metrics rendered as placeholder zeros (member firms, jurisdictions, countries) suggesting a client-side count-up that hadn't fired or had failed.
- Footer: nav repeats under Expertise / About Us groupings, X and LinkedIn icons, Apple + Android app download buttons, cookie/privacy strip.
- Visual style: clean and professional, card-heavy, generous whitespace, conservative typography, moderate density.

### Redesigned local `index.html` (this branch — current state)
- Three-slide hero with autoplay ticker (`.hero-ticker`), full-bleed imagery, on-dark display headline using `ds-thin` / `ds-bold` weight contrast, primary + ghost CTAs.
- Two-layer Bain-style header (`.site-header` → `.nav-topbar` utility row + `<nav id="mainNav">` main row), white-logo on hero / dark-logo on scrolled state, Expertise mega-menu with three columns (Practice Groups / Industry Sector Teams / Regions) flush to header bottom.
- Section 3 numbers (`.s3-numbers`) — animated count-ups for 141 firms, 23,000+ lawyers, 207 jurisdictions, 35 years, 134 countries, 23 cross-border guides.
- Section 2 directory (`.s2-directory`) — text + search + filterable world-map column with bubble counts per region.
- Section 3B News & Insights (`.s3b-news`) — 4 image cards with overlay tags + title.
- Section 4 Success Stories (`.s4-case-studies`) — sticky zoom-parallax collage transitioning into a horizontal cards carousel with `.s4-card` reveal-on-hover description.
- Hero band `.s5-hero-band` ("Defined by Responsiveness. Committed to Collaboration.") — pinned crossover into Section 5 Member Standards (`.s5-standards`) with the 16-Standards collaboration pill, SVG connector lines, and fly-out criteria.
- Section 8 Cross-Border Guides (`.s8-guides`) — full-bleed hero image + 6 guide cards + "Browse the Full Library" CTA card.
- Section 6 Events & Webinars (`.s6-events`) — 3×2 grid with date pills (auto-decorated as upcoming / "in N days").
- Section 7 myLexi (`.s7-ai`) — text + product preview image.
- Section 9 CTA (`.s9-cta`) — Henry Ford pull quote, primary + outline CTAs.
- Footer (`.site-footer`) — Network / Knowledge / Contact tri-column with white logo and tagline.

## What works (Pros)
- **Clear positioning copy** — "elite global legal network committed to collaboration" is a strong, repeatable hook (preserved verbatim in slide 1 and footer).
- **Discoverability of expertise** — the secondary nav exposing Practice Groups, Industry Sector Teams and Regions is the right model; the redesign keeps it as a 3-column mega-menu.
- **Card grid for News/Stories** — legible, scannable, and works mobile-down. Both legacy and redesigned versions retain it.
- **Stats block as credibility anchor** — the "by the numbers" framing is a strong device; redesigned `.s3-numbers` fixes the legacy "stuck at zero" problem with proper count-up triggers.
- **Footer app-download surfacing** — legacy lists Apple + Android prominently, useful for member adoption.

## What doesn't work (Cons)
- **Stats render as zeros on first paint of the live site** [UX] — the count-up animation either races the IntersectionObserver or fails entirely; visitor sees "0 member firms / 0 jurisdictions" which actively undermines credibility.
- **Hero is a static logo + 2 download banners, not a story** [UX][Content] — feels more like a member portal than a marketing front door. No motion, no rotating headlines, no narrative.
- **Visual style is generic-corporate** [UI] — typography, color, and card treatment read as a template rather than an "elite" brand. Little differentiation from competitor networks (Lex Mundi, Multilaw, etc.).
- **Events block is anemic** [Content] — a "view more events" tease without dates, locations, or imagery wastes prime real estate.
- **No interactive map of the network** [UX] — for a 200+ jurisdiction network the absence of a visual world map on the home page is a missed credibility signal.
- **myLexi is buried** [Content] — it's the org's signature AI product; legacy home only surfaces it via a logo and "Ask myLexi" link in the utility nav.
- **Mobile nav not visibly elevated** [Mobile] — secondary expandable mega-menu pattern needs a confirmed mobile drawer; legacy crawl didn't surface one.
- **Cookie/privacy strip dominates first paint** [UX][Accessibility] — common to corporate sites but worth ensuring it's dismissible and doesn't trap focus.
- **Logo + headline + announcement banners compete in the same hero band** [UI] — three competing focal points at the top of the page.

## Redesign plan
- **Already executed on this branch.** The new `index.html` resolves every con above: motion-rich 3-slide hero, animated stats, regional-bubbles map, sticky zoom-parallax success-stories collage, dedicated myLexi section, full Events grid with auto "in N days" decoration, full Cross-Border Guides shelf, member-standards interactive pill.
- **Visual language alignment** — the design system in `css/design-system.css` (`ds-display`, `ds-h1`, `ds-thin`, `ds-bold`, `ds-accent`, `ds-eyebrow`, `ds-body-lg`, `ds-btn-*`, `on-dark`) is the canonical token set; all other inner-page briefs should pull from it.
- **Component reuse from `index.html` / `css/`** — header (`.site-header` + `.nav-topbar` + `.nav-mega`), card grids (`.s3b-card`, `.s4-card`, `.s6-event`, `.s8-guide-card`), section-hero pattern (`.s8-hero` / `.s5-hero-band`), CTA quote section (`.s9-cta`), footer (`.site-footer`).

### Minor polish ideas (only if a clear gap)
- Confirm mobile drawer for the Expertise mega-menu (3-column collapse to accordion) — flag for `css/responsive.css` review.
- Surface app-download buttons (Apple / Android) somewhere in the footer to match legacy parity — currently absent from `.site-footer` Network/Knowledge/Contact lists.
- Consider adding a subtle "View on LinkedIn" link in the footer brand block; legacy home highlights LinkedIn prominently.
- Ensure `.s3-numbers` count-ups have a fallback static value if JS/IntersectionObserver fails (avoid the legacy "stuck at zero" failure mode).

## Instructions for Claude Code (implementation brief)
1. Target file: `index.html` — **edit only** (do NOT rewrite). The page is the canonical visual reference for every other inner-page brief on this branch.
2. Reuse: this is the source of `.site-header`, `.nav-topbar`, `.nav-mega`, `.hero` slide pattern, `.s3-numbers`, `.s2-directory`, `.s3b-card`, `.s4-card`, `.s5-hero-band`, `.s6-event`, `.s8-guide-card`, `.s9-cta`, `.site-footer`. Other briefs import from here.
3. Sections to build, in order: **already built** — see "Current state → Redesigned local `index.html`" above for the canonical section list (1 hero → 2 numbers → 3 directory map → 4 news → 5 success stories → 6 standards → 7 cross-border guides → 8 events → 9 myLexi → 10 quote CTA → footer).
4. **Backend constraint:** no backend changes proposed. All data on the home is either static marketing copy or a small JSON/HTML list that can ship as a static file in this repo.
5. Acceptance criteria:
   - Visual fidelity to the existing redesigned `index.html` (no regressions).
   - Responsive at the project's existing breakpoints (`css/responsive.css`).
   - No console errors when served via `npx serve . -l 8080`.
   - `.s3-numbers` count-ups fire and never display 0 in the final state.
   - Logo swaps correctly between hero (`Logo white.svg`) and scrolled (`Logo default.svg`) states.
