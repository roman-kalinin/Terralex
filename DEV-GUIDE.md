# TerraLex Landing Page — Developer Guide

## Quick start

```bash
cd Terralex
node editor-server.js        # serves on :8080 + POST /save for live editor
# or: npx serve . -l 8080    # read-only fallback
open http://localhost:8080/terralex-landing.html
```

A local server is **required** — `fetch()` calls (TopoJSON, `firms.json`) fail on `file://`.

---

## Architecture

Everything lives in a single file: **`terralex-landing.html`** (~3600 lines).

```
Line ranges (approximate):
  1–13      Head: meta, fonts, GSAP/Lenis CDN scripts
 14–1790    <style> — all CSS
   100–457    Header (two-layer nav, Bain-style)
   458–627    Section 2 (Globe + directory)
   628–704    Section 3 (Numbers)
   705–1029   Section 4 (Case studies / video cards)
  1030–1154   Section 5 (Member standards)
  1155–1335   Section 6 (Events)
  1336–1419   Section 7 (AI / myLexi)
  1420–1591   Section 8 (Cross-border guides)
  1592–1686   Section 9 (CTA)
  1687–1790   Footer
1795–2488   HTML body (sections 1–9 + footer)
2490–2628   <script> Hero slideshow
2629–3000   <script> Lenis, GSAP ScrollTrigger, nav logic, entrance animations
3001–3610   <script> Interactive globe widget (IIFE)
```

### External files

| File | Purpose |
|------|---------|
| `firms.json` | Globe firm data — edit this to add/remove firms |
| `Content/` | All images, organized by section |
| `globe-widget.html` | Legacy standalone globe (reference only, not used) |

### CDN dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| GSAP | 3.12.5 | Scroll-triggered animations |
| ScrollTrigger | 3.12.5 | Viewport-based triggers |
| Lenis | 1.1.14 | Smooth scroll |
| world-atlas | 2 | TopoJSON land boundaries for globe |
| flagcdn.com | — | Country flag images (24px) |
| Google Fonts | — | Source Sans 3, DM Sans |

---

## The globe widget (Section 2)

### How it works

The globe is a **Canvas 2D** renderer — every dot is drawn individually as a vector circle each frame. No WebGL, no textures.

**Rendering pipeline (each frame):**
1. Auto-rotate yaw (or apply drag offset)
2. Clear canvas
3. **Pass 1 — Globe surface**: Loop through `dotPositions[]`, project each 3D→2D via `globeProject()`, draw land dots as filled circles with depth-based opacity, ocean dots as faint 1px squares
4. **Pass 2 — Firm markers**: Get cached clusters, project each cluster center, draw glow + solid circle (single firm = pulsing dot, cluster = sized circle with count label)
5. **Pass 3 — Tooltip**: If mouse near a marker, draw highlight ring + rising line + position the HTML tooltip card

**Key math:**
- `latLonTo3D(lat, lon, radius)` → `[x, y, z]` on sphere
- `globeProject(x, y, z, cosYaw, sinYaw)` → `[screenX, screenY, depth]` with yaw + pitch rotation
- Depth > 0 = front-facing (visible), depth ≤ 0 = back of globe (hidden)

### Data flow

```
firms.json ──fetch──→ validateFirms() ──→ firms[]
                                              │
world-atlas CDN ──fetch──→ topoRings() ──→ buildMask()
                                              │
                                         precomputeGlobe() ──→ gDots[]
                                              │
                                         buildDotPositions() ──→ dotPositions[]
                                         buildFirmDots() ──→ firmDots[]
                                              │
                                         draw() loop (requestAnimationFrame)
                                              │
                                         getClusters() ──→ cached cluster result
```

### Interaction

| Action | Behavior |
|--------|----------|
| Drag | Rotate globe (yaw + pitch). 4px threshold before drag starts (so clicks still work) |
| Ctrl + Scroll | Zoom in/out (0.6× – 3.0×, default 1.25×) |
| Hover firm dot | Rising line + tooltip card with flag, firm name(s), country |
| Click cluster | 2s cubic ease-in-out animation: rotates + zooms to center that cluster, splits it into individual dots |

### Performance notes

- **Clustering is cached** — only recalculated when zoom level changes, not every frame
- **Tooltip line** is drawn on canvas (not SVG DOM) to avoid layout thrashing
- **Land mask** is built once from TopoJSON, never rebuilt on resize
- **Lazy init** via ScrollTrigger — globe only loads when Section 2 enters viewport
- **Pause/resume** — animation loop stops when section scrolls out of view

---

## How to add/remove firms

Edit **`firms.json`**. Each entry:

```json
{
  "country": "Japan",
  "cc": "jp",
  "lat": 35.68,
  "lon": 139.69,
  "firm": "Iwata Godo · Kikkawa · Yuasa",
  "firms": ["Iwata Godo", "Kikkawa Law Offices", "Yuasa and Hara"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `country` | string | Display name in tooltip |
| `cc` | string | ISO 3166-1 alpha-2 code (for flag: `flagcdn.com/w40/{cc}.png`) |
| `lat` | number | Latitude (-90 to 90), typically capital city |
| `lon` | number | Longitude (-180 to 180) |
| `firm` | string | Short label for the dot (shown when single, unclustered) |
| `firms` | string[] | Full list of firm names in that country |

**One entry per country.** If adding a firm to an existing country, push to its `firms[]` array and update the `firm` display string.

Validation runs on load — bad entries are skipped with a console warning.

### Where to find country codes + coordinates

- Country codes: https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
- Capital coordinates: search "{capital} coordinates" — use decimal degrees

---

## Header

Two-layer nav (Bain.com style):

```
┌─────────────────────────────────────────────┐
│ .nav-topbar  (Login | Language | Search)     │  ← hides on scroll down
├─────────────────────────────────────────────┤
│ nav  (Logo | About | Expertise▼ | …)        │  ← always visible
└─────────────────────────────────────────────┘
```

- **Scroll behavior**: Topbar hides when scrolling down, reappears when scrolling up (CSS `max-height:0 + opacity:0` transition, toggled by `.topbar-hidden` class in JS)
- **Expertise dropdown**: Click-toggle mega dropdown with 3 columns (Industry Sectors, Regions, Practice Groups). Class `.open` on `.nav-dropdown`. Closes on outside click or Escape.
- **Scrolled state**: After 10px scroll, `.scrolled` class adds `background: rgba(0,0,0,0.85)` + backdrop blur

---

## Animations

All entrance animations use GSAP ScrollTrigger (lines ~2878–3000):

```js
ScrollTrigger.batch('.s3-numbers .stat-block', {
  onEnter: batch => gsap.from(batch, { y: 40, opacity: 0, stagger: 0.15 }),
  start: 'top 85%'
});
```

Each section has its own batch with appropriate trigger points. Globe section uses a separate ScrollTrigger for lazy init + pause/resume.

### Lenis smooth scroll

Lenis handles smooth scrolling. GSAP ticker is hooked into Lenis via:
```js
gsap.ticker.add(time => lenis.raf(time * 1000));
lenis.on('scroll', ScrollTrigger.update);
```

To prevent scroll hijacking on the globe: `data-lenis-prevent` attribute on `.s2-globe-col`.

---

## Section-by-section

| # | Class | Content | Notes |
|---|-------|---------|-------|
| Hero | `.hero` | Full-screen slideshow, 4 slides with auto-advance | Timer-based, with ticker progress bars |
| 2 | `.s2-directory` | Text left (42%), interactive globe right | Globe in `<canvas>`, firms from `firms.json` |
| 3 | `.s3-numbers` | Stat blocks (160+, 120+, etc.) | Animated counters on scroll |
| 4 | `.s4-case-studies` | Video + card tiles | Masonry-style grid, images from Content folder |
| 5 | `.s5-standards` | 3 standard pillars | Fade-in stagger |
| 6 | `.s6-events` | Events carousel | Background image + overlapping cards |
| 7 | `.s7-ai` | myLexi AI preview | Two-column: text + screenshot |
| 8 | `.s8-guides` | Cross-border guide cards (6) | Hover reveals cropped cover image |
| 9 | `.s9-cta` | Quote / call to action | Simple centered text |

---

## CSS conventions

- BEM-ish naming: `.s2-globe-col`, `.s4-card-tile`, `.s8-card-title`
- Section prefix = `s{n}-` (e.g., `s2-` for Section 2)
- Fonts: `Source Sans 3` for body, `DM Sans` for UI elements (tooltip, nav)
- Colors: mostly neutral grays (#1a1a1a, #555, #888) with accent blue `rgba(77,101,134,…)` for globe markers
- Responsive: `@media (max-width: 900px)` breakpoint for mobile stacking

---

## Git branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable baseline |
| `approved-design-motion` | Current working branch with all latest changes |
| `feature/design-polish` | v1 design (client rejected, kept for reference) |
| `feature/redesign-v2` | Redesign work |

---

## Common tasks

**Change globe colors:** Search for `rgba(77,101,134` in the globe script — that's the marker blue. Land dots use `rgba(60,70,90,…)`.

**Change globe zoom range:** Edit constants at top of globe IIFE: `ZOOM_MIN`, `ZOOM_MAX`, `ZOOM_DEFAULT`.

**Change clustering sensitivity:** `getClusters()` computes `clusterRadius` from zoom. Adjust the `* 15` multiplier to change how aggressively nearby firms merge.

**Add a new section:** Add CSS block with `s{n}-` prefix, HTML between existing sections, and a ScrollTrigger batch in the animations script block.

**Update header nav links:** HTML is around line ~1870–1960. Dropdown content is in `.nav-mega` div.
