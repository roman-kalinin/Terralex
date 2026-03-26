# TerraLex Landing Page

Single-page marketing site for TerraLex — a global network of independent law firms.

## Tech Stack

- **HTML/CSS/JS** — no build tool, no framework
- **GSAP 3.12.5** + ScrollTrigger — scroll-pinned animations
- **Lenis 1.1.14** — smooth scroll
- **Canvas 2D** — interactive globe with firm markers
- **Google Fonts** — Source Sans 3, DM Sans

## Quick Start

```bash
npx serve . -l 8080
# Open http://localhost:8080
```

A local server is required — `fetch()` calls for `firms.json` and TopoJSON fail on `file://`.

## Project Structure

```
index.html              Main page (~870 lines, HTML only)
firms.json              Globe firm data (140+ countries)

css/
  tokens.css            Design tokens (colors, fonts, spacing, z-index)
  base.css              Shared component classes (headings, body, labels, buttons)
  header.css            Site header, topbar, nav, mega dropdown
  hero.css              Hero slides, content, ticker strip
  sections.css          Section-specific layout (S2-S9 + footer)
  chat-widget.css       myLexi chat panel

js/
  scroll-setup.js       Lenis init, GSAP register, nav scroll, dropdown
  hero-slider.js        Slide auto-advance, progress bars, ticker
  s3-counters.js        Number counter animation
  s4-zoom-parallax.js   Zoom timeline, frame scrub, card scroll
  entrance-animations.js ScrollTrigger batch reveals for all sections
  s5-criteria-flyout.js  Criteria DOM build, SVG lines, comet animation
  globe-widget.js       Canvas 2D globe (clustering, drag/zoom, tooltips)
  chat-widget.js        Chat panel open/close

assets/
  images/               Production images organized by section
    hero/               Hero slide backgrounds
    events/             S6 event card images
    guides/             S8 guide card backgrounds
    case-studies/       S4 card images + collage photos
    frames/             S4 video scrubber frames (001-071)
    misc/               Backgrounds, AI preview, etc.
  logos/                Logo white/default, myLexi, Betty
  icons/                SVG icons
```

## Design System

`css/tokens.css` defines all design tokens. `css/base.css` provides shared component classes:

**Headings:** `.h-hero`, `.h-section`, `.h-display`, `.h-card` (with `--lg`, `--md`, `--sm` sizes)
**Body text:** `.body-lg` (20px), `.body-md` (16px), `.body-sm` (13px)
**Labels:** `.label` (10px uppercase), `.label-lg` (12px), `.label-stat` (13px)
**Buttons:** `.btn-primary`, `.btn-white`, `.btn-outline`, `.btn-ghost`
**Modifiers:** `.--bold`, `.--light`, `.--on-dark`, `.--on-light`

Section-specific styles in `sections.css` still use legacy class names. These can be migrated to the shared classes incrementally.

## Script Load Order

Scripts must load in this order (dependencies flow top-to-bottom):

1. `scroll-setup.js` — initializes Lenis + GSAP (required by everything else)
2. `hero-slider.js` — no deps beyond DOM
3. `s3-counters.js` — uses GSAP + ScrollTrigger
4. `s4-zoom-parallax.js` — uses GSAP + ScrollTrigger
5. `entrance-animations.js` — uses GSAP + ScrollTrigger
6. `s5-criteria-flyout.js` — uses ScrollTrigger
7. `globe-widget.js` — self-contained, uses ScrollTrigger
8. `chat-widget.js` — no deps

## Key Components

### Interactive Globe (`js/globe-widget.js`)
Canvas 2D renderer drawing ~15k dots from TopoJSON land mask. Features: firm markers with clustering, drag rotation, scroll zoom, click-to-zoom with animated transitions, country borders at high zoom, tooltip cards with flag images.

### S5 Criteria Animation (`js/s5-criteria-flyout.js`)
16 member criteria items fly out from a central "Collaboration" pill on scroll. SVG connecting lines with animated comet gradients. Clockwise stagger order with quartic ease-out.

### S4 Case Studies (`js/s4-zoom-parallax.js`)
Scroll-pinned zoom parallax with 71-frame video scrubber and horizontal card carousel.

## Deployment

Hosted on GitHub Pages. Push to `main` to deploy.
