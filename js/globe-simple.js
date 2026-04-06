/**
 * TerraLex Globe — Continent Region Bubbles
 *
 * Forked from globe-widget.js (commit 6f5a2bc). Same rendering pipeline,
 * same constants, same projection. Stripped: drag, zoom, click, hover,
 * tooltips, firm markers, clustering. Added: continent region bubbles.
 */
(function() {

  // ── Constants (identical to original) ──────────────────────
  var LAND_SPACING    = 1.5;
  var OCEAN_SPACING   = 7.0;
  var AUTO_ROTATE     = 0.0003;
  var DOT_SIZE_DIVISOR = 500;
  var GLOBE_SCALE     = 0.44;
  var MASK_W = 720, MASK_H = 360;
  var TWO_PI = Math.PI * 2;
  var ZOOM_DEFAULT    = 1.5;
  var TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

  // ── Continent regions ──────────────────────────────────────
  var REGIONS = [
    { name: 'North\nAmerica',                    num: 35, lat: 45,  lon: -100, color: '#1e3a5f' },
    { name: 'Central America\n& the Caribbean',   num: 12, lat: 15,  lon: -78,  color: '#4d7a9e' },
    { name: 'South\nAmerica',                     num: 10, lat: -15, lon: -58,  color: '#3a9e8f' },
    { name: 'Europe',                              num: 37, lat: 50,  lon: 15,   color: '#6b9e3a' },
    { name: 'Middle East\n& Africa',               num: 25, lat: 5,   lon: 25,   color: '#b8c94e' },
    { name: 'Asia Pacific',                        num: 20, lat: 30,  lon: 110,  color: '#2b6e5f' }
  ];

  // ── Canvas setup (identical to original) ───────────────────
  var canvas = document.getElementById('globeCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var container = canvas.parentElement;
  var W, H;

  function resizeCanvas() {
    W = container.offsetWidth;
    H = container.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Globe geometry (identical to original) ─────────────────
  var GLOBE_R, globeCX, globeCY;
  var zoom = ZOOM_DEFAULT;

  function updateGlobeDims() {
    var base = Math.min(W, H) * GLOBE_SCALE;
    GLOBE_R = base * zoom;
    globeCX = W * 0.5;
    globeCY = H * 0.5;
  }

  /** Convert latitude/longitude to 3D cartesian coords on sphere of radius r */
  function latLonTo3D(lat, lon, r) {
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (lon + 180) * Math.PI / 180;
    return [
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    ];
  }

  /** Project 3D point to 2D screen coords with yaw + pitch rotation.
   *  Returns [screenX, screenY, depth] — depth > 0 means front-facing. */
  var rotation = 0;
  var pitch = 0.44;  // initial tilt ~25° back (identical to original)

  function globeProject(x, y, z, cosYaw, sinYaw) {
    var rx = x * cosYaw + z * sinYaw;
    var ry = y;
    var rz = -x * sinYaw + z * cosYaw;
    var cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    var ry2 = ry * cosP - rz * sinP;
    var rz2 = ry * sinP + rz * cosP;
    return [globeCX + rx, globeCY - ry2, rz2];
  }

  // ── Land mask (identical to original) ──────────────────────
  var landMaskCtx = null;

  function buildMask(rings) {
    var oc = document.createElement('canvas');
    oc.width = MASK_W; oc.height = MASK_H;
    var mc = oc.getContext('2d', { willReadFrequently: true });
    mc.fillStyle = '#000'; mc.fillRect(0, 0, MASK_W, MASK_H);
    mc.fillStyle = '#fff';
    for (var i = 0; i < rings.length; i++) {
      var ring = rings[i];
      if (ring.length < 3) continue;
      mc.beginPath();
      for (var p = 0; p < ring.length; p++) {
        var px = ((ring[p][0] + 180) / 360) * MASK_W;
        var py = ((90 - ring[p][1]) / 180) * MASK_H;
        p === 0 ? mc.moveTo(px, py) : mc.lineTo(px, py);
      }
      mc.closePath(); mc.fill();
    }
    landMaskCtx = mc;
  }

  function isLand(lat, lon) {
    if (!landMaskCtx) return false;
    var px = Math.max(0, Math.min(Math.floor(((lon + 180) / 360) * MASK_W), MASK_W - 1));
    var py = Math.max(0, Math.min(Math.floor(((90 - lat) / 180) * MASK_H), MASK_H - 1));
    return landMaskCtx.getImageData(px, py, 1, 1).data[0] > 128;
  }

  /** Decode TopoJSON into an array of polygon rings (identical to original) */
  function topoRings(topo) {
    var arcs = topo.arcs;
    var scale = topo.transform ? topo.transform.scale : [1,1];
    var trans = topo.transform ? topo.transform.translate : [0,0];
    var dec = arcs.map(function(arc) {
      var x = 0, y = 0;
      return arc.map(function(d) { x += d[0]; y += d[1]; return [x*scale[0]+trans[0], y*scale[1]+trans[1]]; });
    });
    function stitch(ids) {
      var pts = [];
      for (var k = 0; k < ids.length; k++) {
        var id = ids[k];
        var ap = id >= 0 ? dec[id].slice() : dec[~id].slice().reverse();
        if (pts.length === 0) pts.push.apply(pts, ap);
        else pts.push.apply(pts, ap.slice(1));
      }
      return pts;
    }
    var rings = [];
    function extract(geo) {
      if (!geo) return;
      if (geo.type === 'Polygon') geo.arcs.forEach(function(r) { rings.push(stitch(r)); });
      else if (geo.type === 'MultiPolygon') geo.arcs.forEach(function(p) { p.forEach(function(r) { rings.push(stitch(r)); }); });
      else if (geo.type === 'GeometryCollection') geo.geometries.forEach(extract);
    }
    extract(topo.objects.land);
    return rings;
  }

  // ── Globe dots (identical to original) ─────────────────────
  var gDots = [];
  function precomputeGlobe() {
    gDots = [];
    for (var lat = -90; lat <= 90; lat += LAND_SPACING) {
      var cosLat = Math.cos(lat * Math.PI / 180);
      var lonStep = LAND_SPACING / Math.max(cosLat, 0.08);
      for (var lon = -180; lon < 180; lon += lonStep) {
        if (!isLand(lat, lon)) continue;
        gDots.push({ lat: lat, lon: lon, isOcean: false });
      }
    }
    for (var lat2 = -90; lat2 <= 90; lat2 += OCEAN_SPACING) {
      var cosLat2 = Math.cos(lat2 * Math.PI / 180);
      var lonStep2 = OCEAN_SPACING / Math.max(cosLat2, 0.08);
      for (var lon2 = -180; lon2 < 180; lon2 += lonStep2) {
        if (!isLand(lat2, lon2)) gDots.push({ lat: lat2, lon: lon2, isOcean: true });
      }
    }
  }

  var dotPositions = [];
  function buildDotPositions() {
    dotPositions = gDots.map(function(d) {
      return { p3: latLonTo3D(d.lat, d.lon, GLOBE_R), isOcean: d.isOcean };
    });
  }

  // Pre-compute region 3D positions
  var regionDots = [];
  function buildRegionDots() {
    regionDots = REGIONS.map(function(r) {
      return { r: r, p3: latLonTo3D(r.lat, r.lon, GLOBE_R) };
    });
  }

  // ── Interaction state ───────────────────────────────────────
  var DRAG_SENSITIVITY = 0.003;
  var PITCH_LIMIT = 1.2;
  var mouseX = -9999, mouseY = -9999;
  var hoveredRegion = -1;
  var isDragging = false, mouseIsDown = false;
  var dragStartX = 0, dragStartY = 0, dragRot = 0, dragPitch = 0;
  var DRAG_THRESHOLD = 4;

  canvas.style.pointerEvents = 'auto';

  canvas.addEventListener('mousemove', function(e) {
    var rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    if (mouseIsDown && !isDragging) {
      if (Math.abs(e.clientX - dragStartX) > DRAG_THRESHOLD || Math.abs(e.clientY - dragStartY) > DRAG_THRESHOLD) {
        isDragging = true;
        canvas.style.cursor = 'grabbing';
      }
    }
    if (isDragging) {
      rotation = dragRot + (e.clientX - dragStartX) * DRAG_SENSITIVITY;
      pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, dragPitch + (e.clientY - dragStartY) * DRAG_SENSITIVITY));
    }
  });
  canvas.addEventListener('mousedown', function(e) {
    mouseIsDown = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    dragRot = rotation; dragPitch = pitch;
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', function() {
    mouseIsDown = false;
    isDragging = false;
    canvas.style.cursor = '';
  });
  canvas.addEventListener('mouseleave', function() {
    mouseX = -9999; mouseY = -9999;
    hoveredRegion = -1;
    if (!mouseIsDown) canvas.style.cursor = '';
  });

  // Touch support
  canvas.addEventListener('touchstart', function(e) {
    var t = e.touches[0];
    var rect = container.getBoundingClientRect();
    mouseX = t.clientX - rect.left; mouseY = t.clientY - rect.top;
    isDragging = true; dragStartX = t.clientX; dragStartY = t.clientY;
    dragRot = rotation; dragPitch = pitch;
  }, { passive: true });
  canvas.addEventListener('touchmove', function(e) {
    var t = e.touches[0];
    var rect = container.getBoundingClientRect();
    mouseX = t.clientX - rect.left; mouseY = t.clientY - rect.top;
    if (isDragging) {
      rotation = dragRot + (t.clientX - dragStartX) * DRAG_SENSITIVITY;
      pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, dragPitch + (t.clientY - dragStartY) * DRAG_SENSITIVITY));
    }
  }, { passive: true });
  window.addEventListener('touchend', function() { isDragging = false; }, { passive: true });

  // ── Draw loop ──────────────────────────────────────────────
  var animating = false;
  var cosYaw = 1, sinYaw = 0;

  function draw(ts) {
    if (!animating) return;
    requestAnimationFrame(draw);

    var now = (ts || 0) * 0.001;

    // Auto-rotate (pause while dragging)
    if (!isDragging) rotation -= AUTO_ROTATE;

    ctx.clearRect(0, 0, W, H);
    cosYaw = Math.cos(rotation); sinYaw = Math.sin(rotation);

    var zoomShrink = 1.0 / Math.pow(zoom / ZOOM_DEFAULT, 0.6);
    var dotBase = Math.max(0.5, (GLOBE_R / DOT_SIZE_DIVISOR) * zoomShrink);

    // ── Pass 1: Globe surface dots (identical to original) ──
    for (var i = 0; i < dotPositions.length; i++) {
      var d = dotPositions[i];
      var proj = globeProject(d.p3[0], d.p3[1], d.p3[2], cosYaw, sinYaw);
      var screenX = proj[0], screenY = proj[1], depth = proj[2];

      if (d.isOcean) {
        if (depth > 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          ctx.fillRect(screenX - 0.5, screenY - 0.5, 1, 1);
        }
        continue;
      }
      if (depth <= 0) continue;
      if (screenX < -10 || screenX > W + 10 || screenY < -20 || screenY > H + 20) continue;
      var depthNorm = Math.max(0, Math.min(depth / GLOBE_R, 1));
      var alphaScale = Math.max(0.4, 1.0 - (zoom - ZOOM_DEFAULT) * 0.25);
      var alpha = (0.25 + 0.55 * depthNorm) * alphaScale;
      var size = dotBase * (0.55 + 0.45 * depthNorm);
      ctx.fillStyle = 'rgba(60,70,90,' + alpha.toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(screenX, screenY, size, 0, TWO_PI); ctx.fill();
    }

    // ── Pass 2: Continent region bubbles ─────────────────
    var newHovered = -1;

    for (var ri = 0; ri < regionDots.length; ri++) {
      var rd = regionDots[ri];
      var reg = rd.r;
      var proj2 = globeProject(rd.p3[0], rd.p3[1], rd.p3[2], cosYaw, sinYaw);
      var sx = proj2[0], sy = proj2[1], depthZ = proj2[2];
      if (depthZ < 0) continue;

      var depthFactor = Math.max(0, depthZ / GLOBE_R);
      var fade = Math.min(1, depthFactor * 2.5);
      var pulse = 0.5 + 0.5 * Math.sin(now * 1.6 + ri * 1.1);
      var bubbleR = 36 + 6 * depthFactor;

      // Hover detection
      var dx = mouseX - sx, dy = mouseY - sy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var isHovered = dist < bubbleR + 10;
      if (isHovered) newHovered = ri;

      // Scale up on hover
      var hoverScale = (isHovered) ? 1.18 : 1.0;
      var drawR = bubbleR * hoverScale;

      ctx.save();
      ctx.globalAlpha = fade;

      // Outer pulse ring
      var pulseR = drawR + 8 + pulse * 8;
      ctx.beginPath();
      ctx.arc(sx, sy, pulseR, 0, TWO_PI);
      ctx.strokeStyle = reg.color;
      ctx.lineWidth = isHovered ? 2 : 1.5;
      ctx.globalAlpha = fade * (isHovered ? 0.3 : 0.15) * (0.5 + 0.5 * pulse);
      ctx.stroke();

      // Main ring
      ctx.globalAlpha = fade;
      ctx.beginPath();
      ctx.arc(sx, sy, drawR, 0, TWO_PI);
      ctx.strokeStyle = reg.color;
      ctx.lineWidth = isHovered ? 3.5 : 2.5;
      ctx.stroke();

      // White fill
      ctx.beginPath();
      ctx.arc(sx, sy, drawR - 5, 0, TWO_PI);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = isHovered ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = isHovered ? 14 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Number
      ctx.fillStyle = reg.color;
      ctx.font = '700 ' + Math.round(20 + 4 * depthFactor) + 'px "Source Sans 3", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(reg.num, sx, sy);

      // Stem + label
      if (depthFactor > 0.2) {
        var labelAlpha = Math.min(1, (depthFactor - 0.2) / 0.35) * fade;
        ctx.globalAlpha = isHovered ? Math.min(1, labelAlpha * 1.4) : labelAlpha;

        ctx.beginPath();
        ctx.moveTo(sx, sy + drawR);
        ctx.lineTo(sx, sy + drawR + 14);
        ctx.strokeStyle = isHovered ? reg.color : 'rgba(120,135,150,0.35)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = isHovered ? reg.color : 'rgba(40,50,60,0.85)';
        ctx.font = (isHovered ? '700 ' : '600 ') + '15px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        var lines = reg.name.split('\n');
        for (var li = 0; li < lines.length; li++) {
          ctx.fillText(lines[li], sx, sy + drawR + 30 + li * 18);
        }
      }

      ctx.restore();
    }

    hoveredRegion = newHovered;
    if (!isDragging) canvas.style.cursor = newHovered >= 0 ? 'pointer' : 'grab';
  }

  // ── Resize (identical to original) ─────────────────────────
  window.addEventListener('resize', function() {
    resizeCanvas();
    updateGlobeDims();
    if (landMaskCtx) {
      buildDotPositions();
      buildRegionDots();
    }
  });

  // ── Init ───────────────────────────────────────────────────
  var dataLoaded = false;

  function initData() {
    if (dataLoaded) return Promise.resolve();
    return fetch(TOPO_URL).then(function(r) { return r.json(); })
      .then(function(topo) {
        buildMask(topoRings(topo));
        precomputeGlobe();
        resizeCanvas();
        updateGlobeDims();
        buildDotPositions();
        buildRegionDots();
        dataLoaded = true;
      });
  }

  function startGlobe() {
    initData().then(function() {
      resizeCanvas();
      updateGlobeDims();
      buildDotPositions();
      buildRegionDots();
      animating = true;
      requestAnimationFrame(draw);
    }).catch(function(err) {
      console.error('[Globe] Failed to initialize:', err);
    });
  }

  function stopGlobe() {
    animating = false;
  }

  // ── View switcher ──────────────────────────────────────────
  function setupSwitcher() {
    var btns = document.querySelectorAll('.s2-switch-btn');
    var mapView = document.getElementById('s2ViewMap');
    var globeView = document.getElementById('s2ViewGlobe');
    if (!btns.length || !mapView || !globeView) return;

    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function() {
        var view = this.getAttribute('data-view');
        for (var j = 0; j < btns.length; j++) btns[j].classList.remove('active');
        this.classList.add('active');

        if (view === 'map') {
          mapView.classList.add('active');
          globeView.classList.remove('active');
          stopGlobe();
        } else {
          mapView.classList.remove('active');
          globeView.classList.add('active');
          startGlobe();
        }
      });
    }
  }

  // ── Boot (lazy init via ScrollTrigger, identical to original) ──
  var started = false;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setupSwitcher(); });
  } else {
    setupSwitcher();
  }

  // Pre-load data when section scrolls near
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: '.s2-directory',
      start: 'top bottom',
      once: true,
      onEnter: function() { initData(); }
    });
  }

  window.globeSimple = { start: startGlobe, stop: stopGlobe };

})();
