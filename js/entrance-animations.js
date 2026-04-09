/* entrance-animations.js — All ScrollTrigger batch reveals */
(function(){
  gsap.registerPlugin(ScrollTrigger);

  const ta = 'play none none none';          // toggleActions shorthand
  const e3 = 'power3.out';                   // default ease

  // ── Viewport-aware trigger start ───────────────────────
  // Designed at 1083px viewport height. On smaller screens,
  // push triggers closer to center so animations don't fire too early.
  const DESIGN_VH = 1083;
  function triggerStart(pct) {
    // pct = intended percentage on design screen (e.g. 85)
    // On smaller viewports, reduce the % so trigger fires later
    var vh = window.innerHeight;
    if (vh >= DESIGN_VH) return 'top ' + pct + '%';
    // Scale: how many design-pixels from viewport top the trigger point was
    var designPx = DESIGN_VH * (pct / 100);
    // Same pixel distance as % of actual viewport
    var scaled = Math.min(pct, (designPx / vh) * 100);
    // Clamp so it doesn't go above 95% (would never fire)
    scaled = Math.min(scaled, 95);
    return 'top ' + Math.round(scaled) + '%';
  }

  // Helper: standard from-below reveal
  function reveal(target, opts = {}) {
    const defaults = {
      autoAlpha: 0,
      y: 40,
      duration: 1,
      ease: e3,
      scrollTrigger: {
        trigger: opts.trigger || target,
        start: triggerStart(85),
        toggleActions: ta
      }
    };
    delete opts.trigger;
    gsap.from(target, Object.assign(defaults, opts));
  }

  // ── S1 HERO ──────────────────────────────────────────────
  // Only animate the first active slide's content (others appear via slider)
  gsap.from('.slide-1 .hero-headline', {
    autoAlpha: 0, y: 40, duration: 1.1, ease: e3, delay: 0.3
  });
  gsap.from('.slide-1 .hero-body', {
    autoAlpha: 0, y: 30, duration: 0.9, ease: e3, delay: 0.55
  });
  gsap.from('.slide-1 .hero-ctas', {
    autoAlpha: 0, y: 20, duration: 0.7, ease: e3, delay: 0.75
  });
  gsap.from('.hero-ticker', {
    autoAlpha: 0, y: 20, duration: 0.6, ease: e3, delay: 0.9
  });

  // ── S2 DIRECTORY ─────────────────────────────────────────
  reveal('.s2-label',   { y: 30, duration: 0.8, trigger: '.s2-text-col' });
  reveal('.s2-heading', { y: 40, duration: 1,   trigger: '.s2-text-col', delay: 0.1 });
  reveal('.s2-sub',     { y: 30, duration: 0.8, trigger: '.s2-text-col', delay: 0.2 });
  reveal('.s2-search',  { y: 30, duration: 0.8, trigger: '.s2-text-col', delay: 0.35 });

  // ── S2 MAP REGIONS ─────────────────────────────────────
  reveal('.s2-map-title', { y: 20, duration: 0.8, trigger: '.s2-globe-col' });
  gsap.from('.s2-region', {
    autoAlpha: 0, y: 40, scale: 0.6,
    duration: 0.7, ease: e3, stagger: 0.1,
    scrollTrigger: { trigger: '.s2-globe-col', start: triggerStart(75), toggleActions: ta }
  });

  // ── S3 NUMBERS ───────────────────────────────────────────
  reveal('.s3-label',   { y: 30, duration: 0.8, trigger: '.s3-header' });
  reveal('.s3-heading', { y: 40, duration: 1,   trigger: '.s3-header', delay: 0.1 });
  gsap.from('.s3-cell', {
    autoAlpha: 0, y: 50, duration: 0.8, ease: e3, stagger: 0.1,
    scrollTrigger: { trigger: '.s3-grid', start: triggerStart(85), toggleActions: ta }
  });

  // ── S3B NEWS & INSIGHTS ─────────────────────────────────
  reveal('.s3b-heading', { y: 40, duration: 1, trigger: '.s3b-header' });

  // Cards: staggered slide in from the left
  gsap.from('.s3b-card', {
    autoAlpha: 0, x: -80,
    duration: 0.8, ease: e3, stagger: 0.12,
    scrollTrigger: { trigger: '.s3b-track', start: triggerStart(85), toggleActions: ta }
  });

  reveal('.s3b-see-all', { y: 20, duration: 0.6, trigger: '.s3b-footer', delay: 0.1 });

  // ── S4 CASE STUDIES (header only — cards/zoom have their own pins) ──
  reveal('.s4-label',   { y: 30, duration: 0.8, trigger: '#s4Header' });
  reveal('.s4-heading', { y: 40, duration: 1,   trigger: '#s4Header', delay: 0.1 });
  reveal('.s4-cards-label',   { y: 30, duration: 0.8, trigger: '.s4-cards-header' });
  reveal('.s4-cards-heading', { y: 40, duration: 1,   trigger: '.s4-cards-header', delay: 0.1 });

  // ── S5 HERO BAND (pinned parallax text) ──────────────────
  gsap.from('.s5-hero-tag', {
    autoAlpha: 0, y: 20, duration: 0.8, ease: e3,
    scrollTrigger: { trigger: '.s5-hero-text', start: triggerStart(85), toggleActions: ta }
  });
  gsap.from('.s5-hero-light', {
    autoAlpha: 0, y: 40, duration: 1, ease: e3, delay: 0.1,
    scrollTrigger: { trigger: '.s5-hero-text', start: triggerStart(85), toggleActions: ta }
  });
  gsap.from('.s5-hero-bold', {
    autoAlpha: 0, y: 40, duration: 1, ease: e3, delay: 0.15,
    scrollTrigger: { trigger: '.s5-hero-text', start: triggerStart(85), toggleActions: ta }
  });

  // ── S5 STANDARDS (body section below band) ───────────────
  reveal('.s5-label',   { y: 30, duration: 0.8, trigger: '.s5-header' });
  reveal('.s5-heading', { y: 40, duration: 1,   trigger: '.s5-header', delay: 0.1 });
  reveal('.s5-sub',     { y: 30, duration: 0.8, trigger: '.s5-header', delay: 0.2 });
  // Criteria fly-out — entrance handled by its own ScrollTrigger

  // ── S6 EVENTS ────────────────────────────────────────────
  reveal('.s6-label',   { y: 30, duration: 0.8, trigger: '.s6-header' });
  reveal('.s6-heading', { y: 40, duration: 1,   trigger: '.s6-header', delay: 0.1 });
  reveal('.s6-sub',     { y: 30, duration: 0.8, trigger: '.s6-header', delay: 0.2 });
  reveal('.s6-view-all',{ y: 20, duration: 0.6, trigger: '.s6-header', delay: 0.3 });
  gsap.from('.s6-event', {
    autoAlpha: 0, y: 50, duration: 0.8, ease: e3, stagger: 0.1,
    scrollTrigger: { trigger: '.s6-grid', start: triggerStart(85), toggleActions: ta }
  });

  // ── S7 AI ────────────────────────────────────────────────
  reveal('.s7-label-row', { y: 30, duration: 0.8, trigger: '.s7-content' });
  reveal('.s7-heading',   { y: 40, duration: 1,   trigger: '.s7-content', delay: 0.1 });
  reveal('.s7-desc',      { y: 30, duration: 0.8, trigger: '.s7-content', delay: 0.2 });
  reveal('.s7-image',     { y: 50, duration: 1,   trigger: '.s7-ai',     delay: 0.25 });

  // ── S8 CROSS-BORDER GUIDES ───────────────────────────────
  reveal('.s8-label',   { y: 30, duration: 0.8, trigger: '.s8-text' });
  reveal('.s8-heading', { y: 40, duration: 1, trigger: '.s8-text', delay: 0.1 });
  gsap.from('.s8-guide-card', {
    autoAlpha: 0, y: 50, duration: 0.8, ease: e3, stagger: 0.1,
    scrollTrigger: { trigger: '.s8-guides-track', start: triggerStart(85), toggleActions: ta }
  });

  // ── S9 CTA ───────────────────────────────────────────────
  gsap.to('.s9-bg-img', {
    yPercent: 20,
    ease: 'none',
    scrollTrigger: { trigger: '.s9-cta', start: 'top bottom', end: 'bottom top', scrub: true }
  });
  // S9 container shrink: starts covering the full section (edge to edge,
  // top to bottom), shrinks to a centered ~1200px box with 120px top/bottom
  // insets as the user scrolls in.
  (function setupS9Shrink(){
    var section = document.querySelector('.s9-cta');
    var rect    = document.querySelector('.s9-bg-overlay');
    if (!section || !rect) return;
    var TARGET_W = 1200;
    var TARGET_TB = 120;
    function sideInset() {
      return Math.max(0, (section.offsetWidth - TARGET_W) / 2);
    }
    gsap.fromTo(rect,
      { top: 0, right: 0, bottom: 0, left: 0 },
      {
        top: TARGET_TB,
        bottom: TARGET_TB,
        left:  sideInset,
        right: sideInset,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end:   'top 25%',
          scrub: true,
          invalidateOnRefresh: true
        }
      }
    );
  })();
  reveal('.s9-eyebrow', { y: 30, duration: 0.8, trigger: '.s9-inner' });
  reveal('.s9-quote',   { y: 40, duration: 1,   trigger: '.s9-inner', delay: 0.1 });
  reveal('.s9-attribution', { y: 20, duration: 0.6, trigger: '.s9-inner', delay: 0.2 });
  reveal('.s9-sub',     { y: 30, duration: 0.8, trigger: '.s9-inner', delay: 0.25 });
  reveal('.s9-actions', { y: 20, duration: 0.6, trigger: '.s9-inner', delay: 0.3 });

  // ── FOOTER ───────────────────────────────────────────────
  reveal('.footer-brand',  { y: 30, duration: 0.8, trigger: '.site-footer' });
  gsap.from('.footer-nav-group', {
    autoAlpha: 0, y: 30, duration: 0.8, ease: e3, stagger: 0.1,
    scrollTrigger: { trigger: '.footer-inner', start: triggerStart(90), toggleActions: ta }
  });
  reveal('.footer-bottom', { y: 20, duration: 0.6, trigger: '.footer-bottom' });

})();
