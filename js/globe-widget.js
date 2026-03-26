/**
 * TerraLex Interactive Globe Widget
 *
 * Canvas 2D globe with firm markers, clustering, drag/zoom, and tooltips.
 * Firm data loaded from firms.json — edit that file to add/remove firms.
 *
 * Dependencies: GSAP ScrollTrigger (optional, for lazy init + pause/resume)
 * External data: world-atlas land-110m.json (CDN), flagcdn.com (flags)
 */
(function() {

  // ── Constants ───────────────────────────────────────────────
  var LAND_SPACING    = 1.5;   // degrees between land dots
  var OCEAN_SPACING   = 7.0;   // degrees between ocean dots (sparser)
  var AUTO_ROTATE     = 0.0003; // radians/frame auto-rotation speed
  var PITCH_LIMIT     = 1.2;   // max vertical tilt in radians
  var ZOOM_MIN        = 0.6;
  var ZOOM_MAX        = 4.0;
  var ZOOM_DEFAULT    = 1.5;
  var ZOOM_STEP       = 0.25;  // per Ctrl+scroll click
  var DRAG_THRESHOLD  = 4;     // px before mousemove counts as drag
  var HOVER_RADIUS    = 55;    // px hover detection distance
  var DRAG_SENSITIVITY = 0.003; // rotation per px of drag
  var CLICK_ZOOM_DURATION = 2000; // ms for click-to-zoom animation
  var DOT_SIZE_DIVISOR = 500;  // GLOBE_R / this = base dot radius
  var GLOBE_SCALE     = 0.44;  // fraction of min(W,H) for base radius
  var MASK_W = 720, MASK_H = 360; // land mask resolution
  var TWO_PI = Math.PI * 2;
  var FLAG_CDN = 'https://flagcdn.com/w40/';
  var BORDER_ZOOM_THRESHOLD = 1.3;  // zoom level where country outlines start appearing
  var BORDER_FADE_RANGE     = 0.4;  // zoom range over which borders fade in (1.3 → 1.7)
  var LABEL_ZOOM_THRESHOLD  = 2.0;  // zoom level where country name labels appear
  var TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
  var FIRMS_URL = 'firms.json';

  // ── Firm data (loaded async from firms.json) ────────────────
  // Schema per entry: { country, cc, lat, lon, firm, firms[] }
  // - country: display name
  // - cc: ISO 3166-1 alpha-2 code (for flag lookup)
  // - lat/lon: capital city coordinates
  // - firm: short display name for the dot label
  // - firms[]: full list of firm names in that country
  // To add a new country: add an entry to firms.json with these fields.
  // To add a firm to an existing country: push to its firms[] array.
  var firms = [];

  // ── Validate firm entries on load ───────────────────────────
  function validateFirms(data) {
    var valid = [];
    for (var i = 0; i < data.length; i++) {
      var f = data[i];
      if (!f.country || !f.cc || typeof f.lat !== 'number' || typeof f.lon !== 'number') {
        console.warn('[Globe] Skipping invalid firm entry at index ' + i + ':', f);
        continue;
      }
      if (f.lat < -90 || f.lat > 90 || f.lon < -180 || f.lon > 180) {
        console.warn('[Globe] Out-of-range coordinates for ' + f.country + ' (lat:' + f.lat + ', lon:' + f.lon + ')');
        continue;
      }
      if (!f.firms || !f.firms.length) f.firms = [f.firm || f.country];
      if (!f.firm) f.firm = f.firms[0];
      valid.push(f);
    }
    return valid;
  }

  // ── Canvas setup ────────────────────────────────────────────
  var canvas = document.getElementById('globeCanvas');
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
  resizeCanvas();

  // ── Globe geometry ──────────────────────────────────────────
  var GLOBE_R, globeCX, globeCY;
  var zoom = ZOOM_DEFAULT;

  function updateGlobeDims() {
    var base = Math.min(W, H) * GLOBE_SCALE;
    GLOBE_R = base * zoom;
    globeCX = W * 0.5;
    globeCY = H * 0.5;
  }
  updateGlobeDims();

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
  function globeProject(x, y, z, cosYaw, sinYaw) {
    var rx = x * cosYaw + z * sinYaw;
    var ry = y;
    var rz = -x * sinYaw + z * cosYaw;
    var cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    var ry2 = ry * cosP - rz * sinP;
    var rz2 = ry * sinP + rz * cosP;
    return [globeCX + rx, globeCY - ry2, rz2];
  }

  // ── Land mask (built once from TopoJSON) ────────────────────
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

  /** Decode TopoJSON into an array of polygon rings (coordinate arrays) */
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

  /** Decode TopoJSON into per-country ring arrays for border drawing */
  var countryPolygons = [];
  function topoCountryRings(topo) {
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
    var countries = [];
    var geos = topo.objects.countries.geometries;
    for (var i = 0; i < geos.length; i++) {
      var geo = geos[i];
      var rings = [];
      if (geo.type === 'Polygon') geo.arcs.forEach(function(r) { rings.push(stitch(r)); });
      else if (geo.type === 'MultiPolygon') geo.arcs.forEach(function(p) { p.forEach(function(r) { rings.push(stitch(r)); }); });
      if (rings.length) countries.push(rings);
    }
    return countries;
  }

  // ── Globe dots (land + ocean) ───────────────────────────────
  var gDots = [];
  function precomputeGlobe() {
    gDots = [];
    // Land dots — dense grid, only where land mask is white
    for (var lat = -90; lat <= 90; lat += LAND_SPACING) {
      var cosLat = Math.cos(lat * Math.PI / 180);
      var lonStep = LAND_SPACING / Math.max(cosLat, 0.08);
      for (var lon = -180; lon < 180; lon += lonStep) {
        if (!isLand(lat, lon)) continue;
        gDots.push({ lat: lat, lon: lon, isOcean: false });
      }
    }
    // Ocean dots — sparser grid for subtle background texture
    for (var lat2 = -90; lat2 <= 90; lat2 += OCEAN_SPACING) {
      var cosLat2 = Math.cos(lat2 * Math.PI / 180);
      var lonStep2 = OCEAN_SPACING / Math.max(cosLat2, 0.08);
      for (var lon2 = -180; lon2 < 180; lon2 += lonStep2) {
        if (!isLand(lat2, lon2)) gDots.push({ lat: lat2, lon: lon2, isOcean: true });
      }
    }
  }

  // 3D positions of globe dots (recalculated on zoom change)
  var dotPositions = [];
  function buildDotPositions() {
    dotPositions = gDots.map(function(d) {
      return { p3: latLonTo3D(d.lat, d.lon, GLOBE_R), isOcean: d.isOcean };
    });
  }

  // 3D positions of firm markers
  var firmDots = [];
  function buildFirmDots() {
    firmDots = firms.map(function(f) {
      return { f: f, p3: latLonTo3D(f.lat, f.lon, GLOBE_R) };
    });
  }

  // ── Haversine distance (degrees) ────────────────────────────
  /** Returns great-circle distance in degrees between two lat/lon points */
  function haversineDeg(lat1, lon1, lat2, lon2) {
    var toRad = Math.PI / 180;
    var dLat = (lat2 - lat1) * toRad;
    var dLon = (lon2 - lon1) * toRad;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(lat1*toRad)*Math.cos(lat2*toRad) *
            Math.sin(dLon/2)*Math.sin(dLon/2);
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) / toRad;
  }

  // ── Clustering (cached — only recalculates when zoom changes) ─
  var cachedClusters = null;
  var cachedClusterZoom = -1;

  /** Greedy clustering: groups nearby firms within radiusDeg.
   *  Returns [{ lat, lon, count, members[] }] */
  function clusterFirms(radiusDeg) {
    if (radiusDeg <= 0) return firms.map(function(f) { return { lat:f.lat, lon:f.lon, count:1, members:[f] }; });
    var used = {};
    var clusters = [];
    for (var i = 0; i < firms.length; i++) {
      if (used[i]) continue;
      var members = [firms[i]];
      used[i] = true;
      for (var j = i + 1; j < firms.length; j++) {
        if (used[j]) continue;
        if (haversineDeg(firms[i].lat, firms[i].lon, firms[j].lat, firms[j].lon) < radiusDeg) {
          members.push(firms[j]);
          used[j] = true;
        }
      }
      var cLat = 0, cLon = 0;
      members.forEach(function(m) { cLat += m.lat; cLon += m.lon; });
      clusters.push({ lat: cLat/members.length, lon: cLon/members.length, count: members.length, members: members });
    }
    return clusters;
  }

  /** Get clusters, using cache if zoom hasn't changed */
  function getClusters() {
    var clusterRadius = Math.max(0, (ZOOM_MAX - zoom) / 2.4) * 15;
    var zoomKey = Math.round(zoom * 100); // quantize to avoid float drift
    if (cachedClusterZoom !== zoomKey) {
      cachedClusters = clusterFirms(clusterRadius);
      cachedClusterZoom = zoomKey;
    }
    return cachedClusters;
  }

  /** Invalidate cluster cache (call after firms data changes or zoom animation) */
  function invalidateClusters() {
    cachedClusterZoom = -1;
  }

  // ── Interaction state ───────────────────────────────────────
  var rotation = 0;    // yaw (horizontal) in radians
  var pitch = 0.44;    // initial tilt ~25° back (top tilted toward viewer)
  var cosYaw = 1, sinYaw = 0;
  var isDragging = false, mouseIsDown = false;
  var dragStartX = 0, dragStartY = 0, dragRot = 0, dragPitch = 0;
  var mouseX = -9999, mouseY = -9999;
  var lineAnim = 0;    // tooltip line animation progress (0→1)
  var hoveredItem = null;
  var animating = false;

  var interactEl = document.getElementById('globeInteract');
  var tooltipEl = document.getElementById('globeTooltip');
  var ttFlag = document.getElementById('ttFlag');

  // ── Globe hints ─────────────────────────────────────────────
  var scrollHintEl = document.getElementById('globeScrollHint');
  var escHintEl = document.getElementById('globeEscHint');
  var scrollHintShown = false;
  var escHintTimer = null;

  interactEl.addEventListener('mouseenter', function() {
    if (scrollHintShown) return;
    scrollHintShown = true;
    scrollHintEl.classList.add('show');
    setTimeout(function() { scrollHintEl.classList.remove('show'); }, 3000);
  });

  function showEscHint() {
    if (zoom <= ZOOM_DEFAULT + 0.15) { escHintEl.classList.remove('show'); return; }
    escHintEl.classList.add('show');
    clearTimeout(escHintTimer);
    escHintTimer = setTimeout(function() { escHintEl.classList.remove('show'); }, 3000);
  }

  function updateZoomResetBtn() { showEscHint(); }

  window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && zoom > ZOOM_DEFAULT + 0.15) {
      escHintEl.classList.remove('show');
      var startPitch = pitch, startZoom = zoom;
      var targetZoom = ZOOM_DEFAULT, targetPitch = 0.44;
      var deltaPitchEsc = targetPitch - startPitch;
      var startTime = null;
      var lastEaseEsc = 0;
      if (zoomAnim) cancelAnimationFrame(zoomAnim);
      function escStep(ts) {
        if (!startTime) startTime = ts;
        var t = Math.min((ts - startTime) / CLICK_ZOOM_DURATION, 1);
        var ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
        var easeStep = ease - lastEaseEsc;
        lastEaseEsc = ease;
        zoom = startZoom + (targetZoom - startZoom) * ease;
        pitch += deltaPitchEsc * easeStep;
        updateGlobeDims(); buildDotPositions(); buildFirmDots(); invalidateClusters();
        if (t < 1) { zoomAnim = requestAnimationFrame(escStep); }
        else { zoomAnim = null; }
      }
      zoomAnim = requestAnimationFrame(escStep);
    }
  });
  var ttFirm = document.getElementById('ttFirm');
  var ttLoc = document.getElementById('ttLoc');

  // ── Mouse events ────────────────────────────────────────────
  interactEl.addEventListener('mousemove', function(e) {
    var rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    if (mouseIsDown && !isDragging) {
      if (Math.abs(e.clientX - dragStartX) > DRAG_THRESHOLD || Math.abs(e.clientY - dragStartY) > DRAG_THRESHOLD) {
        isDragging = true;
        interactEl.style.cursor = 'grabbing';
      }
    }
    if (isDragging) {
      rotation = dragRot + (e.clientX - dragStartX) * DRAG_SENSITIVITY;
      pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, dragPitch + (e.clientY - dragStartY) * DRAG_SENSITIVITY));
    }
  });
  interactEl.addEventListener('mousedown', function(e) {
    mouseIsDown = true; dragStartX = e.clientX; dragStartY = e.clientY; dragRot = rotation; dragPitch = pitch;
  });
  window.addEventListener('mouseup', function() {
    mouseIsDown = false;
    isDragging = false;
    if (interactEl) interactEl.style.cursor = '';
  });
  interactEl.addEventListener('mouseleave', function() {
    mouseX = -9999; mouseY = -9999;
  });

  // ── Touch events ────────────────────────────────────────────
  interactEl.addEventListener('touchstart', function(e) {
    var t = e.touches[0];
    var rect = container.getBoundingClientRect();
    mouseX = t.clientX - rect.left; mouseY = t.clientY - rect.top;
    isDragging = true; dragStartX = t.clientX; dragStartY = t.clientY; dragRot = rotation; dragPitch = pitch;
  }, { passive: true });
  interactEl.addEventListener('touchmove', function(e) {
    var t = e.touches[0];
    var rect = container.getBoundingClientRect();
    mouseX = t.clientX - rect.left; mouseY = t.clientY - rect.top;
    if (isDragging) {
      rotation = dragRot + (t.clientX - dragStartX) * DRAG_SENSITIVITY;
      pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, dragPitch + (t.clientY - dragStartY) * DRAG_SENSITIVITY));
    }
  }, { passive: true });
  window.addEventListener('touchend', function() { isDragging = false; }, { passive: true });

  // ── Zoom (Ctrl/Cmd + scroll wheel) ──────────────────────────
  interactEl.addEventListener('wheel', function(e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    var delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom + delta));
    updateGlobeDims();
    buildDotPositions();
    buildFirmDots();
    invalidateClusters();
    updateZoomResetBtn();
  }, { passive: false });

  // ── Click on cluster → zoom in + rotate to center ───────────
  var zoomAnim = null;
  interactEl.addEventListener('click', function(e) {
    if (Math.abs(e.clientX - dragStartX) > 5 || Math.abs(e.clientY - dragStartY) > 5) return;
    if (hoveredItem && hoveredItem.count > 1) {
      var cluster = hoveredItem;

      // Compute target yaw so cluster faces camera (rx = 0 in globeProject)
      var pos3D = latLonTo3D(cluster.lat, cluster.lon, 1);
      var px = pos3D[0], py = pos3D[1], pz = pos3D[2];
      var targetRot = Math.atan2(-px, pz);
      // Normalize to shortest rotation path
      var diff = targetRot - rotation;
      diff = diff - Math.round(diff / TWO_PI) * TWO_PI;
      targetRot = rotation + diff;

      // Compute target pitch so cluster is vertically centered
      var cR = Math.cos(targetRot), sR = Math.sin(targetRot);
      var rz = -px * sR + pz * cR;
      var targetPitch = Math.atan2(py, rz);
      targetPitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, targetPitch));

      var targetZoom = Math.min(zoom * 2.5, ZOOM_MAX);
      var startRot = rotation, startPitch = pitch, startZoom = zoom;
      var deltaRot = targetRot - startRot;
      var deltaPitch = targetPitch - startPitch;
      var startTime = null;
      var lastEase = 0;

      if (zoomAnim) cancelAnimationFrame(zoomAnim);

      function animStep(ts) {
        if (!startTime) startTime = ts;
        var t = Math.min((ts - startTime) / CLICK_ZOOM_DURATION, 1);
        // Cubic ease-in-out
        var ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;

        // Apply incremental delta so auto-rotate isn't overwritten
        var easeStep = ease - lastEase;
        lastEase = ease;
        zoom = startZoom + (targetZoom - startZoom) * ease;
        rotation += deltaRot * easeStep;
        pitch += deltaPitch * easeStep;
        updateGlobeDims();
        buildDotPositions();
        buildFirmDots();
        invalidateClusters();

        updateZoomResetBtn();
        if (t < 1) {
          zoomAnim = requestAnimationFrame(animStep);
        } else {
          zoomAnim = null;
        }
      }
      zoomAnim = requestAnimationFrame(animStep);
    }
  });

  // ── Draw loop ───────────────────────────────────────────────
  function draw(ts) {
    if (!animating) return;
    requestAnimationFrame(draw);

    var now = (ts || 0) * 0.001;
    if (!isDragging) rotation -= AUTO_ROTATE;
    ctx.clearRect(0, 0, W, H);
    cosYaw = Math.cos(rotation); sinYaw = Math.sin(rotation);

    var zoomShrink = 1.0 / Math.pow(zoom / ZOOM_DEFAULT, 0.6);
    var dotBase = Math.max(0.5, (GLOBE_R / DOT_SIZE_DIVISOR) * zoomShrink);

    // ── Pass 1: Globe surface dots ──────────────────────
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

    // ── Pass 1.5: Country border outlines (visible when zoomed) ──
    if (zoom >= BORDER_ZOOM_THRESHOLD && countryPolygons.length) {
      var borderAlpha = Math.min((zoom - BORDER_ZOOM_THRESHOLD) / BORDER_FADE_RANGE, 1);
      ctx.strokeStyle = 'rgba(180,190,210,' + (borderAlpha * 0.5).toFixed(3) + ')';
      ctx.lineWidth = 0.5 + 0.5 * borderAlpha;
      for (var ci = 0; ci < countryPolygons.length; ci++) {
        var rings = countryPolygons[ci];
        for (var ri = 0; ri < rings.length; ri++) {
          var ring = rings[ri];
          ctx.beginPath();
          var moved = false;
          for (var vi = 0; vi < ring.length; vi++) {
            var lon = ring[vi][0], lat = ring[vi][1];
            var p3 = latLonTo3D(lat, lon, GLOBE_R);
            var pr = globeProject(p3[0], p3[1], p3[2], cosYaw, sinYaw);
            if (pr[2] <= 0) { moved = false; continue; }
            if (!moved) { ctx.moveTo(pr[0], pr[1]); moved = true; }
            else ctx.lineTo(pr[0], pr[1]);
          }
          ctx.stroke();
        }
      }
    }

    // ── Pass 2: Firm markers (clustered) ────────────────
    var clustered = getClusters();

    var activeItem = null;
    var bestDist = HOVER_RADIUS;

    for (var ci = 0; ci < clustered.length; ci++) {
      var cluster = clustered[ci];
      var pos3D = latLonTo3D(cluster.lat, cluster.lon, GLOBE_R);
      var proj2 = globeProject(pos3D[0], pos3D[1], pos3D[2], cosYaw, sinYaw);
      var sx = proj2[0], sy = proj2[1], depthZ = proj2[2];
      if (depthZ < 0) continue;

      var depthFactor = Math.max(0, depthZ / GLOBE_R);
      var pulse = 0.5 + 0.5 * Math.sin(now * 1.6 + ci * 1.1);

      if (cluster.count > 1) {
        // Cluster dot — size scales logarithmically with count
        var countScale = 1 + Math.log2(cluster.count) * 0.6;
        var clusterSize = dotBase * (3.0 + 1.2 * depthFactor) * countScale;
        var clusterPulse = 0.5 + 0.5 * Math.sin(now * 1.2 + ci * 0.7);
        // Glow halo
        var glowRadius = clusterSize * 2.5;
        var glowGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowRadius);
        glowGrad.addColorStop(0, 'rgba(77,101,134,' + (0.1 * clusterPulse).toFixed(3) + ')');
        glowGrad.addColorStop(1, 'rgba(77,101,134,0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath(); ctx.arc(sx, sy, glowRadius, 0, TWO_PI); ctx.fill();
        // Solid circle
        ctx.fillStyle = 'rgba(77,101,134,' + (0.75 + 0.25 * depthFactor).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(sx, sy, clusterSize, 0, TWO_PI); ctx.fill();
        // Count label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold ' + (Math.round(clusterSize * 0.9)) + 'px DM Sans, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(cluster.count, sx, sy + 0.5);
      } else {
        // Single firm — pulsing dot
        var firmSize = dotBase * (2.4 + 1.8 * depthFactor) * (1 + 0.5 * pulse);
        var firmAlpha = Math.min((0.5 + 0.5 * depthFactor) * (0.7 + 0.3 * pulse), 1);
        var firmGlow = firmSize * 3;
        var firmGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, firmGlow);
        firmGrad.addColorStop(0, 'rgba(77,101,134,' + (0.14 * pulse).toFixed(3) + ')');
        firmGrad.addColorStop(1, 'rgba(77,101,134,0)');
        ctx.fillStyle = firmGrad;
        ctx.beginPath(); ctx.arc(sx, sy, firmGlow, 0, TWO_PI); ctx.fill();
        ctx.fillStyle = 'rgba(50,60,80,' + firmAlpha.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(sx, sy, firmSize, 0, TWO_PI); ctx.fill();
        // Country label at high zoom
        if (zoom >= LABEL_ZOOM_THRESHOLD) {
          var labelAlpha = Math.min((zoom - LABEL_ZOOM_THRESHOLD) * 2, 0.7);
          ctx.fillStyle = 'rgba(60,70,90,' + labelAlpha.toFixed(3) + ')';
          ctx.font = '500 ' + Math.round(10 + zoom * 1.5) + 'px DM Sans, sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(cluster.members[0].country, sx + firmSize + 6, sy);
        }
      }

      // Hover detection
      if (!isDragging) {
        var dx = mouseX - sx, dy = mouseY - sy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          activeItem = { cl: cluster, sx: sx, sy: sy };
        }
      }
    }

    // ── Pass 3: Hover tooltip (drawn on canvas, no SVG) ─────
    if (activeItem) {
      hoveredItem = activeItem.cl;
      lineAnim = Math.min(lineAnim + 0.07, 1);
      var ax = activeItem.sx, ay = activeItem.sy;
      var topY = ay - 70 * lineAnim;

      // Highlight ring
      ctx.strokeStyle = 'rgba(77,101,134,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ax, ay, dotBase * 2.5 + 3, 0, TWO_PI); ctx.stroke();

      // Rising line (canvas instead of SVG to avoid DOM thrashing)
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax, topY);
      ctx.strokeStyle = 'rgba(77,101,134,0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dot at top of line
      ctx.beginPath();
      ctx.arc(ax, topY, 2.5 * lineAnim, 0, TWO_PI);
      ctx.fillStyle = '#4d6586';
      ctx.fill();

      // Position tooltip HTML element
      var ttX = ax + 16 > W - 220 ? ax - 220 : ax + 16;
      tooltipEl.style.left = ttX + 'px';
      tooltipEl.style.top = (topY - 50) + 'px';
      tooltipEl.style.opacity = '1';

      // Fill tooltip content
      var hovered = activeItem.cl;
      if (hovered.count === 1) {
        var f = hovered.members[0];
        ttFlag.src = FLAG_CDN + f.cc + '.png';
        ttFlag.onerror = function() { this.style.display = 'none'; };
        ttFlag.style.display = '';
        if (f.firms && f.firms.length > 1) {
          ttFirm.textContent = f.firms.join(', ');
        } else {
          ttFirm.textContent = f.firm;
        }
        ttLoc.textContent = f.country;
      } else {
        ttFlag.style.display = 'none';
        var totalFirms = hovered.members.reduce(function(s, m) { return s + (m.firms ? m.firms.length : 1); }, 0);
        ttFirm.textContent = totalFirms + ' firms in ' + hovered.count + ' countries';
        ttLoc.textContent = hovered.members.map(function(m) { return m.country; }).join(', ');
      }
    } else {
      hoveredItem = null;
      lineAnim = Math.max(lineAnim - 0.08, 0);
      if (lineAnim < 0.01) tooltipEl.style.opacity = '0';
    }

    interactEl.style.cursor = activeItem ? 'pointer' : (isDragging ? 'grabbing' : 'grab');
  }

  // ── Resize (land mask is NOT rebuilt — only dot positions) ──
  window.addEventListener('resize', function() {
    resizeCanvas();
    updateGlobeDims();
    if (landMaskCtx) {
      buildDotPositions();
      buildFirmDots();
      invalidateClusters();
    }
  });

  // ── Init: fetch topology + firms, then start ───────────────
  function startGlobe() {
    Promise.all([
      fetch(TOPO_URL).then(function(r) { return r.json(); }),
      fetch(FIRMS_URL).then(function(r) { return r.json(); }).catch(function(err) {
        console.warn('[Globe] Failed to load firms.json, using empty set:', err);
        return [];
      })
    ]).then(function(results) {
      var topo = results[0];
      firms = validateFirms(results[1]);
      buildMask(topoRings(topo));
      countryPolygons = topoCountryRings(topo);
      precomputeGlobe();
      buildDotPositions();
      buildFirmDots();
      invalidateClusters();
      animating = true;
      requestAnimationFrame(draw);
    }).catch(function(err) {
      console.error('[Globe] Failed to initialize:', err);
    });
  }

  // Lazy init via ScrollTrigger (if available)
  var started = false;
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: '.s2-directory',
      start: 'top bottom',
      end: 'bottom top',
      onEnter: function() { if (!started) { started = true; startGlobe(); } else { animating = true; requestAnimationFrame(draw); } },
      onLeave: function() { animating = false; },
      onEnterBack: function() { animating = true; requestAnimationFrame(draw); },
      onLeaveBack: function() { animating = false; }
    });
  } else {
    startGlobe();
  }

})();
