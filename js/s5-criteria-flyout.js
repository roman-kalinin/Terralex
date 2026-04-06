/* s5-criteria-flyout.js — Criteria DOM, SVG lines, comet animation */
(function() {
  // ── Data ────────────────────────────────────────────────
  var criteria = [
    { bold: 'Market Standing', light: '' },
    { bold: 'Law Capability', light: 'Strong Commercial ' },
    { bold: 'Continuous Improvement & Innovation', light: 'Commitment to ' },
    { bold: 'Responsiveness', light: '' },
    { bold: 'Follow Up - Clients', light: ' and Other Members' },
    { bold: 'International Focus', light: ' & Clients' },
    { bold: 'Reciprocity', light: 'Capacity for ' },
    { bold: 'Geographical Coverage', light: ' in Designated Jurisdiction' },
    { bold: 'English Language', light: ' Capability and Website' },
    { bold: 'Dues on Time', light: 'Payment of ' },
    { bold: 'Transparent Billing', light: ' and Managing Expectations of Cost' },
    { bold: 'Referral Tracking', light: ' - In and Out' },
    { bold: 'Representatives', light: 'Quality Member ' },
    { bold: 'Attendance at Meetings', light: '' },
    { bold: 'Feedback', light: 'Committed to ' },
    { bold: 'Engagement', light: ' with TerraLex' }
  ];

  var targets = [
    { x: -30, y: -26 }, { x: 26, y: -30 }, { x: -36, y: -10 },
    { x: -28, y: 18 },  { x: 33, y: -13 }, { x: -2, y: 33 },
    { x: 8, y: -23 },  { x: 30, y: 22 },  { x: -26, y: 32 },
    { x: -5, y: -28 },  { x: 19, y: 34 },  { x: 34, y: 11 },
    { x: -34, y: 6 },   { x: 36, y: 0 },   { x: -19, y: -32 },
    { x: -10, y: 26 }
  ];

  // ── DOM refs (cached once) ──────────────────────────────
  var innerEl  = document.getElementById('s5PinInner');
  var headerEl = document.getElementById('s5Header');
  var pillEl   = document.getElementById('s5Pill');
  var areaEl   = document.getElementById('s5Criteria');
  var linesSvg = document.getElementById('s5Lines');
  var mapBgEl  = document.querySelector('.s5-map-bg');
  if (!areaEl || !innerEl || !pillEl) return;

  // ── Create item elements + SVG lines ────────────────────
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var items = [];
  var lines = [];
  for (var i = 0; i < criteria.length; i++) {
    var el = document.createElement('div');
    el.className = 's5-criteria-item';
    var c = criteria[i];
    if (c.light && c.light[0] !== ' ') {
      el.innerHTML = '<span class="s5-cr-light">' + c.light + '</span><span class="s5-cr-bold">' + c.bold + '</span>';
    } else if (c.light) {
      el.innerHTML = '<span class="s5-cr-bold">' + c.bold + '</span><span class="s5-cr-light">' + c.light + '</span>';
    } else {
      el.innerHTML = '<span class="s5-cr-bold">' + c.bold + '</span>';
    }
    areaEl.appendChild(el);
    items.push(el);

    var line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('class', 's5-line');
    linesSvg.appendChild(line);

    // Comet gradient: tail (0%) = transparent, head (100%) = full blue
    var grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', 's5grad' + i);
    grad.setAttribute('gradientUnits', 'userSpaceOnUse');
    var stop0 = document.createElementNS(SVG_NS, 'stop');
    stop0.setAttribute('offset', '0%');
    stop0.setAttribute('stop-color', '#4a9ede');
    stop0.setAttribute('stop-opacity', '0');
    var stop1 = document.createElementNS(SVG_NS, 'stop');
    stop1.setAttribute('offset', '100%');
    stop1.setAttribute('stop-color', '#4a9ede');
    stop1.setAttribute('stop-opacity', '1');
    grad.appendChild(stop0);
    grad.appendChild(stop1);
    linesSvg.querySelector('defs').appendChild(grad);

    var pulse = document.createElementNS(SVG_NS, 'line');
    pulse.setAttribute('class', 's5-line-pulse');
    pulse.setAttribute('stroke', 'url(#s5grad' + i + ')');
    linesSvg.appendChild(pulse);

    lines.push({ base: line, pulse: pulse, grad: grad });
  }

  // ── Layout measurement ──────────────────────────────────
  var lw = 0, lh = 0;

  function measure() {
    lw = innerEl.offsetWidth;
    lh = innerEl.offsetHeight;
    // Pill center relative to innerEl (the absolute-positioned area covers innerEl)
    var ir = innerEl.getBoundingClientRect();
    var pr = pillEl.getBoundingClientRect();
    var px = (pr.left - ir.left) + pr.width * 0.5;
    var py = (pr.top - ir.top) + pr.height * 0.5;
    for (var j = 0; j < items.length; j++) {
      items[j].style.left = (px - items[j].offsetWidth * 0.5) + 'px';
      items[j].style.top  = (py - items[j].offsetHeight * 0.5) + 'px';
    }
  }
  measure();
  window.addEventListener('resize', measure);

  // ── Animation loop ──────────────────────────────────────
  var progress = 0;
  var running = false;

  // Pill center coords (relative to innerEl)
  var pillCX = 0, pillCY = 0;

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    var now = performance.now() * 0.001;

    // Pill center
    var ir = innerEl.getBoundingClientRect();
    var pr = pillEl.getBoundingClientRect();
    pillCX = (pr.left - ir.left) + pr.width * 0.5;
    pillCY = (pr.top - ir.top) + pr.height * 0.5;

    // Header: slide up + fade over 15–45% of scroll
    if (headerEl) {
      var hp = Math.max(0, Math.min(1, (progress - 0.15) / 0.3));
      hp = 1 - (1 - hp) * (1 - hp); // ease-out quad
      headerEl.style.transform = 'translateY(' + (-hp * 120) + 'px)';
      headerEl.style.opacity = 1 - hp;
    }

    // Map BG: fade in over 60–85% of scroll (after most criteria have flown out)
    if (mapBgEl) {
      var mp = Math.max(0, Math.min(1, (progress - 0.5) / 0.4));
      var ep = 1 - (1 - mp) * (1 - mp); // ease-out quad
      mapBgEl.style.opacity = (0.225 * ep).toFixed(3);
    }

    // Items: fly out over 35–100% of scroll (no drift — static once placed)
    for (var i = 0; i < items.length; i++) {
      var t = targets[i];
      var p = Math.max(0, (progress - 0.35) / 0.65);
      var clockOrder = [9,6,1,4,13,11,7,10,5,15,8,3,12,2,0,14];
      var seq = clockOrder.indexOf(i);
      var stagger = seq * 0.055;
      var ip = Math.max(0, Math.min(1, (p - stagger) / 0.25));
      ip = 1 - (1 - ip) * (1 - ip) * (1 - ip); // ease-out cubic

      var dx = (t.x / 100) * lw * ip;
      var dy = (t.y / 100) * lh * ip;
      var scale = 0.3 + 0.7 * ip;
      var alpha = ip;

      items[i].style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
      items[i].style.opacity = alpha;

      // SVG line from block edge to pill center
      var ln = lines[i];
      if (ip > 0.05) {
        var elR = items[i].getBoundingClientRect();
        var ecx = (elR.left - ir.left) + elR.width * 0.5;
        var ecy = (elR.top - ir.top) + elR.height * 0.5;
        // Find closest point on block edge toward pill
        var adx = pillCX - ecx, ady = pillCY - ecy;
        var halfW = elR.width * 0.5, halfH = elR.height * 0.5;
        var sx = adx === 0 ? 0 : Math.min(Math.abs(halfW / adx), Math.abs(halfH / ady));
        var edgeX = ecx + adx * sx;
        var edgeY = ecy + ady * sx;
        // Line length for dash animation
        var lineDx = pillCX - edgeX, lineDy = pillCY - edgeY;
        var lineLen = Math.sqrt(lineDx * lineDx + lineDy * lineDy);

        // Base line (static, faint)
        ln.base.setAttribute('x1', edgeX);
        ln.base.setAttribute('y1', edgeY);
        ln.base.setAttribute('x2', pillCX);
        ln.base.setAttribute('y2', pillCY);
        ln.base.setAttribute('stroke', 'rgba(10,10,15,' + (0.08 * ip).toFixed(3) + ')');

        // Comet pulse — gradient segment moves from edge toward center
        var rawCycle = (now * 0.28 + i * 0.3) % 1;
        // Strong ease-out: fast launch, long deceleration toward center
        var inv = 1 - rawCycle;
        var easedCycle = 1 - inv * inv * inv * inv; // quartic ease-out
        // Comet stretches at launch, compresses as it slows
        var cometFrac = 0.18 + 0.14 * (1 - easedCycle); // longer tail when fast
        var cometLen = lineLen * cometFrac;
        var headT = easedCycle;
        var tailT = Math.max(0, headT - cometLen / lineLen);
        // Gradient coords: tail (transparent) → head (full blue)
        var tailX = edgeX + (pillCX - edgeX) * tailT;
        var tailY = edgeY + (pillCY - edgeY) * tailT;
        var headX = edgeX + (pillCX - edgeX) * headT;
        var headY = edgeY + (pillCY - edgeY) * headT;
        ln.grad.setAttribute('x1', tailX);
        ln.grad.setAttribute('y1', tailY);
        ln.grad.setAttribute('x2', headX);
        ln.grad.setAttribute('y2', headY);
        // Draw only the comet segment
        ln.pulse.setAttribute('x1', tailX);
        ln.pulse.setAttribute('y1', tailY);
        ln.pulse.setAttribute('x2', headX);
        ln.pulse.setAttribute('y2', headY);
        // Pulse visible as soon as item starts appearing, full strength once ip > 0.3
        ln.pulse.style.opacity = Math.min(0.6, ip / 0.3 * 0.6);
      } else {
        ln.base.setAttribute('stroke', 'transparent');
        ln.pulse.style.opacity = 0;
      }
    }
  }

  function start() { if (!running) { running = true; requestAnimationFrame(tick); } }
  function stop()  { running = false; }

  // ── ScrollTrigger for scroll progress (scrubbed) ───────
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: '#s5PinWrap',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: function(self) { progress = self.progress; }
    });
    // Separate trigger for animation start/stop — uses the section element
    // so it only stops when the section is fully out of view
    ScrollTrigger.create({
      trigger: '.s5-standards',
      start: 'top bottom',
      end: 'bottom top',
      onEnter: start, onEnterBack: start,
      onLeave: stop,  onLeaveBack: stop
    });
  }
})();
