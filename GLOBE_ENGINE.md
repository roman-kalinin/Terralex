# TerraLex Globe Engine — Developer Documentation

Everything lives in a single file: **`terralex-landing.html`**. The HTML, CSS, and all JavaScript are self-contained. There is no build step, no framework, no bundler.

---

## Table of Contents

1. [How to Run Locally](#1-how-to-run-locally)
2. [Big Picture — What the Engine Does](#2-big-picture)
3. [Coordinate System](#3-coordinate-system)
4. [Globe Construction](#4-globe-construction)
5. [Particles — the Unified Dot Pool](#5-particles)
6. [Morph Shapes](#6-morph-shapes)
7. [OBJ Shape Loader](#7-obj-shape-loader)
8. [The Render Loop](#8-the-render-loop)
9. [Scroll Detection & Section Transitions](#9-scroll-detection)
10. [Firm Dots, Hover & Tooltip](#10-firm-dots)
11. [The Shape Editor (Online HUD)](#11-the-shape-editor)
12. [editor-server.js](#12-editor-serverjs)
13. [Key Constants & Globals](#13-key-constants--globals)
14. [How to Add a New Shape or Section](#14-how-to-add-a-new-shape-or-section)
15. [Known Gotchas](#15-known-gotchas)

---

## 1. How to Run Locally

The page fetches `.obj` files via `fetch()`. Browsers block `fetch()` when the page is opened as a `file://` URL, so you must serve it over HTTP.

```bash
# from the Terralex folder:
node editor-server.js
# open: http://localhost:8080/terralex-landing.html
```

`editor-server.js` is a small custom Node.js server (no dependencies) that:
- Serves all static files in the folder on port 8080
- Exposes a `POST /save` endpoint used by the shape editor to write changes back to the HTML file

You can use `npx serve . -l 8080` as a read-only fallback, but the editor's "Apply to file" button won't work without `editor-server.js`.

---

## 2. Big Picture

The page is a scrollable landing page where a **fixed canvas** sits behind all HTML content. As the user scrolls:

- While the **hero section** is visible → the canvas shows a rotating 3D particle globe
- As the user scrolls past the hero → the globe **morphs** into a 3D shape (city, handshake, compass, etc.) that fills the right or left half of the screen, matching that section's content
- Scrolling back to the top → the shape dissolves back into the globe

Everything on the canvas — globe dots, morph shape dots — is drawn as tiny filled circles on a single `<canvas>` element (`#masterCanvas`). There is no Three.js, WebGL, or 3D library. It is pure Canvas 2D with manual 3D projection math.

```
┌─────────────────────────────────────┐
│  fixed <canvas id="masterCanvas">   │  ← drawn every frame (requestAnimationFrame)
│                                     │
│  fixed <div id="globeInteract">     │  ← captures mouse/drag events
│  fixed <svg id="lines">             │  ← firm hover line (SVG, cleared each frame)
│  fixed .tooltip                     │  ← firm name card
│                                     │
│  scrollable HTML sections on top    │  ← z-index > canvas, white background on text panes
└─────────────────────────────────────┘
```

---

## 3. Coordinate System

Understanding this is essential before touching anything.

### Globe-local space (3D)

The globe lives in a right-handed 3D coordinate system centred at `(0, 0, 0)`:

- **+X** = right on screen (at rotation=0)
- **+Y** = up (away from viewer, because globe centre is below the viewport)
- **+Z** = toward viewer

The globe's centre is positioned **below** the viewport bottom edge:

```
globeCX = W / 2                    (horizontally centred)
globeCY = H + GLOBE_R * 0.52      (below the bottom edge)
GLOBE_R = max(W, H) * 0.72
```

This means only the top third of the globe is visible in the viewport — the classic "globe peering up" look.

### Screen-space projection

`globeProject(x, y, z, cosR, sinR)` converts a 3D globe-local point to screen pixels:

```
// 1. Apply Y-axis rotation (globe spin):
rx = x * cosR + z * sinR
rz = -x * sinR + z * cosR

// 2. Apply fixed X-axis tilt (TILT = -0.42 radians ≈ -24°):
screen_x = globeCX + rx
screen_y = globeCY - (ry * cosT - rz * sinT)
depth    = ry * sinT + rz * cosT
```

`TILT` is a constant — the globe is always tilted slightly toward the viewer. `cosR/sinR` are module-level variables updated every frame by the render loop.

### The canonical rule for shape generators

**Shape generators must never use the live `cosR/sinR`.** They call `screenTo3D()`, which always uses `cosR=1, sinR=0` as a canonical basis:

```javascript
function screenTo3D(sx, sy, rDepth) {
  const rx = sx - globeCX;
  const rz = rDepth;
  const ry = (globeCY - sy + rz * sinT) / cosT;
  return [rx, ry, rz];   // canonical: cosR=1, sinR=0
}
```

This keeps cached morph targets rotation-independent. The render loop's yaw rotation is applied on top at draw time, so the shape always lands in the right place regardless of the globe's current spin angle. If you break this rule — using live `cosR/sinR` inside a shape generator — cached shapes will jump position when the globe rotates.

---

## 4. Globe Construction

### Land mask

The globe uses a 720×360 offscreen canvas as a land/ocean bitmask. It fetches TopoJSON from a CDN:

```
https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json
```

`buildMask(rings)` renders land polygons in white on a black background. `isLand(lat, lon)` samples one pixel to check whether a lat/lon is land.

### `precomputeGlobe()`

Sweeps a latitude/longitude grid (1.5° land, 7° ocean) and builds `gDots[]`:

```javascript
gDots[i] = {
  p3:     [x, y, z],   // 3D globe-space position at GLOBE_R radius
  firm:   null | firm, // non-null if this dot was snapped to a law firm
  isOcean: bool
}
```

Land dots are densely packed (~1.5° grid). Ocean dots are sparse (~7° grid) and rendered very faintly. Each firm is snapped to its nearest land grid dot.

---

## 5. Particles

`buildParticles()` creates one `Particle` per entry in `gDots[]`. Particles are the actual things drawn on screen.

```javascript
class Particle {
  gIdx        // index into gDots — links back to globe dot
  cx, cy, cz  // current interpolated 3D position (eases toward target)
  tx3, ty3, tz3  // 3D morph target
  size        // random scatter for visual variety in morph mode
  baseAlpha   // random scatter
}
```

Every frame, each particle's `cx/cy/cz` eases toward its target:

```javascript
// target = blend of globe position and morph target
wx = gx * globeT + tx3 * (1 - globeT)
wy = gy * globeT + ty3 * (1 - globeT)
wz = gz * globeT + tz3 * (1 - globeT)

// ease
cx += (wx - cx) * 0.038
```

`globeT` is the master blend value: `1.0` = fully globe, `0.0` = fully morphed. It eases toward `targetGlobeT` which is set by the scroll position.

---

## 6. Morph Shapes

### Built-in shapes

Defined as generator functions in `shapeMap`:

| Name | Shape | Used by section |
|------|-------|----------------|
| `globe` | (no morph — globe mode) | hero, CTA |
| `shield` | Shield silhouette | stories |
| `network` | Node-edge graph | (available) |
| `search` | Magnifying glass | (available) |
| `book` | Open book | (available) |
| `calendar` | Monthly grid | events |
| `scatter` | Random fill | fallback |

Each generator takes `n` (number of particles) and returns an array of `[x, y, z]` globe-space coordinates.

### `setMorphTargets(name, force)`

Looks up the generator from `shapeMap[name]`, generates targets (or reuses from `morphCache`), and writes them to `particles[i].tx3/ty3/tz3`. Also computes the shape centroid `morphCX/CY/CZ` used as a rotation pivot.

```javascript
const morphCache = {}
// keyed by "name:particleCount"
// cleared when: force=true, editor changes a value, or window resizes
```

The cache ensures scroll-back re-uses the same random sample — no jumping.

---

## 7. OBJ Shape Loader

OBJ files are Wavefront `.obj` — a plain-text mesh format exported from Blender, Spline, or any 3D tool.

### Loading

```javascript
loadOBJFromURL('handshake-obj', '3d assets/handshake.obj', {
  side:  'left',   // which screen half to fill
  scale: 1.25,     // size multiplier after auto-fit
  rotX:  -19,      // pre-fit rotation in degrees
  rotY:  -95,
  rotZ:  62,
  axes:  'xyz',    // how OBJ axes map to screen axes (see below)
})
```

Internally: `fetch()` the file → `parseOBJ()` → `sampleMesh()` → register a generator in `shapeMap`.

### `axes` option

OBJ exporters use different axis conventions. The `axes` option maps the three OBJ axes to `[screenX, screenY, depth]`:

- `'xyz'` — OBJ X→screenX, OBJ Y→screenY, OBJ Z→depth (default)
- `'xzy'` — OBJ X→screenX, OBJ Z→screenY, OBJ Y→depth (common for Z-up models)
- Prefix with `-` to negate an axis: `'-xzy'`

### `fitToPanel(rawPts, side, scaleMul, rDepth)`

After axis remapping and pre-fit rotation, raw OBJ points are scaled and translated to fill the target panel half (`panelBounds(side)`), then converted to globe-space via `screenTo3D()`. Aspect ratio is always preserved.

### `window._objOpts[name]`

The single source of truth for each OBJ shape's live parameters:

```javascript
_objOpts['handshake-obj'] = {
  side:    'left',
  scale:   1.25,
  rotX:    -19, rotY: -95, rotZ: 62,
  offsetX: 0, offsetY: 0,
}
```

Seeded synchronously when `loadOBJ()` is called. The editor HUD reads from and writes to this object. The shape generator closure reads from it on every regeneration — so changing a value in `_objOpts` and calling `setMorphTargets(name, true)` immediately updates the shape.

### Offset system

`offsetX` and `offsetY` are **screen pixels** — 100 = 100px shift on screen, 1:1.

```javascript
// Applied after fitToPanel, in globe-local space:
dx = offsetX           // screen_x = globeCX + local_x  →  delta is 1:1
dy = -offsetY / cosT   // screen_y = globeCY - local_y*cosT  →  divide by cosT (~0.91)
```

---

## 8. The Render Loop

`draw(ts)` is called every frame via `requestAnimationFrame`.

### Passes

**Pass 1 — Land + ocean dots**

For each particle:
1. Compute weighted 3D target (blend of globe position and morph target)
2. Ease `cx/cy/cz` toward target
3. Subtract shape centroid pivot, apply cursor pitch rotation, apply yaw rotation, re-add pivot
4. Project to screen with the projection formula
5. Draw circle. Ocean dots are pixel-rect, very faint.

**Pass 2 — Firm dots**

Rendered on top of land dots. Computed from exact lat/lon every frame (not from the particle pool). Animated pulse glow. Hover detection within 40px radius.

**Pass 3 — Hover line + tooltip**

If a firm is hovered: draw SVG rising line + circle cap, show tooltip card. SVG is cleared and rebuilt every frame.

### Rotation

```javascript
rotation      // cumulative Y-axis spin (user drag + auto-rotation)
tiltYaw       // cursor-driven Y tilt (only active in morph mode)
tiltPitch     // cursor-driven X tilt (only active in morph mode)

// Blend: in globe mode = full spin + tilt. In morph mode = tilt only.
totalYaw = (rotation + tiltYaw) * globeT + tiltYaw * (1 - globeT)
cosR = Math.cos(totalYaw)
sinR = Math.sin(totalYaw)
```

This means shapes stop inheriting the globe's random spin angle as soon as morphing begins — they settle into a stable orientation.

---

## 9. Scroll Detection

`detectSection()` runs on every scroll event.

1. Measures how much of the **hero section** is still visible → sets `targetGlobeT` (0–1)
2. Finds which `.split-section[data-shape]` occupies the most viewport area → calls `setMorphTargets(shape)` if it changed

Sections declare their shape via a `data-shape` attribute:

```html
<div class="split-section odd" id="proof" data-shape="city-obj">
```

The `odd`/`even` class controls layout (text left/dots right vs. dots left/text right). The `side` option in `loadOBJFromURL` should match: odd sections have dots on the right, even sections have dots on the left.

---

## 10. Firm Dots

`firmDots[]` is separate from the particle pool — these are computed from exact lat/lon every frame and drawn on top. They are never affected by the morph — they always show on the globe.

```javascript
firmDots[i] = { f: firmObject, p3: [x, y, z] }
```

Hover shows a rising SVG line (animated via `lineAnim` easing 0→1) and a tooltip card. The tooltip repositions itself to avoid going off the right edge.

---

## 11. The Shape Editor

The shape editor is a dark floating HUD (`#objEditor`) that appears in the bottom-right corner whenever an OBJ shape section is visible. It lets you visually adjust a shape and write the new values directly into the HTML file.

### What it shows

- **Shape name** — which OBJ is currently active
- **Scale** — uniform size multiplier (0.1 – 3.0)
- **Rotate X/Y/Z** — pre-fit rotation in degrees (±180)
- **Offset X/Y** — screen-pixel shift after fitting (±500, or type any number)

Each control has both a slider and a number input. They stay in sync. You can type values beyond the slider range in the number input.

### How live preview works

Every time you move a slider or type a value:

1. The new value is written to `window._objOpts[shapeName]`
2. The morph cache entry for this shape is deleted
3. `setMorphTargets(shapeName, true)` is called — regenerates the shape immediately
4. The canvas updates on the next frame — you see the change in real time

No page reload is needed for preview.

### How "Apply to file" works

This is the step that makes changes permanent across page reloads.

1. The editor fetched `terralex-landing.html` from the server when the page loaded, and keeps the full HTML string in memory as `htmlSource`
2. When you click **Apply to file**, it runs `patchOpts(htmlSource, shapeName, currentValues)` — a regex that finds the relevant `loadOBJFromURL(...)` call in the HTML string and rewrites the options block with your new values
3. The patched HTML string is sent to `editor-server.js` via `POST /save`
4. The server writes it to disk with `fs.writeFileSync`
5. On success, `htmlSource` is updated to the patched version so subsequent Applies build on the latest state

```
browser slider change
  → _objOpts updated
  → setMorphTargets(name, true)
  → shape re-renders live

"Apply to file" click
  → patchOpts() rewrites the JS source in memory
  → POST /save { filename, content }
  → editor-server.js writes terralex-landing.html to disk
  → next page refresh loads the new values
```

### What gets written

Only the managed keys (`scale`, `rotX`, `rotY`, `rotZ`, `offsetX`, `offsetY`) are rewritten. Non-editor keys (`side`, `axes`, `depth`) are preserved from the existing opts block. Zero-valued rotation and offset keys are omitted to keep the source clean.

### Reset button

Re-reads `htmlSource` (the last saved state on disk) and restores sliders + `_objOpts` to those values. Does not write anything to disk.

### Dirty tracking

`dirtyShapes` is a `Set` of shape names the user has touched with sliders since the last Apply. When the editor's initial fetch of `htmlSource` completes, it calls `parseAllOpts()` to populate `_objOpts` — but shapes in `dirtyShapes` are skipped so in-progress edits are not overwritten by the async fetch completing late.

---

## 12. editor-server.js

A minimal Node.js HTTP server, no npm dependencies.

```
GET  /*           → serves static files from the Terralex folder
POST /save        → writes a file to disk
OPTIONS /*        → CORS preflight
```

### POST /save

Expects JSON body: `{ filename: "terralex-landing.html", content: "<full HTML>" }`

- Path traversal protection: the resolved path must stay inside `__dirname`
- Writes with `fs.writeFileSync` (synchronous, atomic on most OS)
- Returns `{ ok: true }` or `{ ok: false, error: "..." }`

Run it: `node editor-server.js` — starts on port 8080.

---

## 13. Key Constants & Globals

| Name | Type | Description |
|------|------|-------------|
| `TILT` | const | Globe X-tilt in radians (-0.42 ≈ -24°). Constant. |
| `cosT / sinT` | const | Precomputed from TILT. Used in all projection math. |
| `GLOBE_R` | let | Globe radius. `max(W,H) * 0.72`. Recomputed on resize. |
| `globeCX / globeCY` | let | Globe centre in screen pixels. Centre of the globe projection. |
| `globeT` | let | Master blend: 1=globe, 0=morph. Eases toward `targetGlobeT`. |
| `targetGlobeT` | let | Target blend value. Set by scroll detection from hero visibility. |
| `cosR / sinR` | let | Current Y-axis rotation. Updated every frame by render loop. |
| `rotation` | let | Cumulative globe spin from auto-rotation + drag. |
| `tiltYaw / tiltPitch` | let | Cursor-driven tilt angles. Active in morph mode only. |
| `gDots[]` | array | Globe dot data. One entry per dot. Built by `precomputeGlobe()`. |
| `particles[]` | array | One per gDot. Carry current interpolated 3D position. |
| `firmDots[]` | array | Exact lat/lon positions for the 20 law firms. |
| `morphCX/CY/CZ` | let | Centroid of current morph targets. Used as rotation pivot. |
| `morphCache` | object | Cache of generated targets keyed by `"name:n"`. |
| `shapeMap` | object | `name → generator(n)`. All shapes registered here. |
| `objShapeMap` | object | Tracks which shape names came from OBJ files. |
| `currentShape` | let | Name of the currently active shape. |
| `pendingShape` | let | Shape requested before its OBJ file finished loading. |
| `window._objOpts` | object | Live parameters for each OBJ shape. Editor reads/writes here. |

---

## 14. How to Add a New Shape or Section

### Option A — Add a hand-coded shape

1. Write a generator function:
```javascript
function shapeMyThing(n) {
  const side = 'right';   // or 'left'
  const b    = panelBounds(side);
  const lz   = morphDepth();
  const pts  = [];
  // ... push screenTo3D(sx, sy, lz) for each point ...
  return pts;
}
```
2. Register it: `shapeMap['my-thing'] = shapeMyThing;`
3. Add `data-shape="my-thing"` to a section element.

### Option B — Add an OBJ shape

1. Export a mesh from Blender/Spline as `.obj` and drop it in `3d assets/`
2. Add a `loadOBJFromURL` call near the bottom of the script (before the globe fetch):
```javascript
loadOBJFromURL('my-model', '3d assets/MyModel.obj', {
  side:  'right',
  scale: 1.0,
  axes:  'xyz',   // adjust if model looks wrong
});
```
3. Add `data-shape="my-model"` to the target section.
4. Use the shape editor to tune scale/rotation/offset, then click "Apply to file".

### Choosing `axes`

If your shape appears flat, rotated 90°, or inside-out, the OBJ axes don't match what the engine expects. Try:
- `'xyz'` — default (Y-up models from most exporters)
- `'xzy'` — Z-up models (common in Blender with default export settings)
- `'-xzy'` — Z-up, mirrored X

### Choosing `side`

- Sections with class `odd` have text LEFT, dots RIGHT → use `side: 'right'`
- Sections with class `even` have dots LEFT, text RIGHT → use `side: 'left'`

---

## 15. Known Gotchas

**`screenTo3D` must always use the canonical basis.**
Shape generators call `screenTo3D()`, which internally uses `cosR=1, sinR=0`. If you ever modify `screenTo3D` to use the live `cosR/sinR` again, cached morph targets will bake in the rotation angle at generation time and the shape will jump to the wrong position on every frame where the angle differs.

**`morphCache` is keyed by `"name:particleCount"`.** Particle count only changes when `buildParticles()` runs (page load or window resize). If you change `_objOpts` for a shape, you must also delete its cache entry (`delete morphCache[name + ':' + particles.length]`) and call `setMorphTargets(name, true)` — otherwise the stale cached points will still be used.

**The globe's centre is off-screen.** `globeCY = H + GLOBE_R * 0.52` — the centre is below the viewport. Morph targets generated via `screenTo3D` with an on-screen `sy` value will produce a `ry` (local Y) that is large and positive, placing the point near the top of the globe. This is intentional.

**`editor-server.js` must be running for "Apply to file" to work.** The editor silently shows `⚠ fetch failed` if the server is down. `npx serve` does not expose `POST /save`.

**OBJ files must be accessible over HTTP.** The `fetch()` call for OBJ files will fail silently with a CORS/protocol error if you open the HTML as a `file://` URL. Always use the local server.

**`htmlSource` in the editor is the full HTML at fetch time.** If you edit the file externally while the page is open, the editor's in-memory `htmlSource` is stale. Reload the page to sync.
