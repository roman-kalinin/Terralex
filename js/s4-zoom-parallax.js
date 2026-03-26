/* s4-zoom-parallax.js — Zoom timeline, frame scrub, card scroll, hero band */
// ── Section 4: Case Studies ──────────────────────────────────────
(function initS4() {
  const container = document.getElementById('s4ZoomContainer');
  const track     = document.getElementById('s4Track');

  // ── ZoomParallax ─────────────────────────────────────────────
  // Scales: [video, tile1, tile2, tile3, tile4, tile5, tile6]
  const tileEndScales = [3, 5, 6, 5, 6, 8, 9];

  // Rebuildable zoom timeline — called on init and from dev panel
  var _zoomTl = null;
  var _zoomST = null;
  window.__zoomDuration = 0.75;  // fraction of scroll where zoom completes

  window.__rebuildZoom = function() {
    // Kill previous
    if (_zoomTl) _zoomTl.kill();
    if (_zoomST) _zoomST.kill();
    // Reset scales and opacity
    tileEndScales.forEach(function(_, i) {
      var t = document.getElementById('s4T' + i);
      if (t) gsap.set(t, { scale: 1 });
    });
    // Reset tile-0 inner to its grid slot
    var inner0 = document.querySelector('#s4T0 .s4-inner');
    if (inner0) gsap.set(inner0, { top: '-12.75vh', left: '-3vw' });

    _zoomTl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
      }
    });
    _zoomST = _zoomTl.scrollTrigger;

    tileEndScales.forEach(function(endScale, i) {
      var tile = document.getElementById('s4T' + i);
      if (!tile) return;
      _zoomTl.to(tile, {
        scale: endScale,
        ease: 'none',
        duration: window.__zoomDuration,
      }, 0);
    });

    // Counter-drift: animate tile-0's inner from grid slot to center
    var inner0 = document.querySelector('#s4T0 .s4-inner');
    if (inner0) {
      _zoomTl.to(inner0, {
        top: 0,
        left: 0,
        ease: 'none',
        duration: window.__zoomDuration,
      }, 0);
    }

  };
  window.__rebuildZoom();

  // Phase B: frame-sequence scrub (replaces laggy video currentTime)
  (function() {
    var frameImg = document.getElementById('s4FrameImg');
    if (!frameImg) return;

    var TOTAL = 71;
    var BASE  = 'assets/images/frames/ezgif-frame-';

    // Pre-load all frames into an array so swapping is instant
    var frames = [];
    for (var i = 1; i <= TOTAL; i++) {
      var img = new Image();
      img.src = BASE + (i < 10 ? '00' + i : i < 100 ? '0' + i : i) + '.jpg';
      frames.push(img);
    }

    var currentFrame = 0;

    ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: function(self) {
        // Map full scroll progress → frames (0→TOTAL-1)
        var idx = Math.round(self.progress * (TOTAL - 1));
        idx = Math.max(0, Math.min(TOTAL - 1, idx));
        if (idx !== currentFrame) {
          currentFrame = idx;
          frameImg.src = frames[idx].src;
        }
      }
    });
  })();

  // ── Phase 4: horizontal card scroll ──────────────────────────
  function buildCardScroll() {
    const trackWidth = track.scrollWidth;
    const viewW = window.innerWidth;
    const travel = Math.max(trackWidth - viewW + 80, 0);

    ScrollTrigger.create({
      trigger: '#s4Cards',
      start: 'bottom bottom',
      end: '+=' + travel,
      pin: true,
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      animation: gsap.to(track, {
        x: -travel,
        ease: 'none',
      }),
    });
  }

  requestAnimationFrame(buildCardScroll);

  // ── "Elite by Design" hero band ──
  // The hero band sits between S4 and S5 in the DOM.
  // We pin it so that when S4 scrolls up after the carousel,
  // the hero band stays fixed and S4 reveals it from below.
  // S5 (z-index 2) then scrolls up over it.
  // ── "Elite by Design" hero band ──
  // Fixed to viewport bottom at z-index 1, hidden behind S4 (z-index 2).
  // As S4 scrolls up after the carousel, the hero band peeks from below.
  // When the hero band's natural position reaches viewport bottom,
  // it unfixes and scrolls normally.
  var hero = document.getElementById('s5HeroBand');
  if (hero) {
    var heroFixed = false;

    function fixHero() {
      if (heroFixed) return;
      heroFixed = true;
      hero.style.position = 'fixed';
      hero.style.bottom = '0';
      hero.style.top = 'auto';
      hero.style.left = '0';
      hero.style.width = '100%';
      hero.style.zIndex = '1';
    }
    function unfixHero() {
      if (!heroFixed) return;
      heroFixed = false;
      hero.style.position = '';
      hero.style.bottom = '';
      hero.style.top = '';
      hero.style.left = '';
      hero.style.width = '';
      hero.style.zIndex = '';
    }

    // Fix hero to viewport bottom when cards pin starts.
    // Unfix when hero's own element bottom reaches viewport bottom
    // (i.e. it has scrolled to its natural position).
    ScrollTrigger.create({
      trigger: '#s4Cards',
      start: 'top top',
      endTrigger: hero,
      end: 'bottom bottom',
      onEnter: fixHero,
      onLeave: unfixHero,
      onEnterBack: fixHero,
      onLeaveBack: unfixHero,
    });
  }
})();
