// Paste this into mcp__figma-console__figma_execute to get lean design info
// Returns only what's needed for implementation: layout, colors, typography, spacing

const sel = figma.currentPage.selection;
if (!sel.length) return { error: "Nothing selected" };

function color(paint) {
  if (!paint || paint.type !== "SOLID") return null;
  const { r, g, b, a } = paint.color;
  const toHex = v => Math.round(v * 255).toString(16).padStart(2, "0");
  return a < 1
    ? `rgba(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)},${Math.round(a*100)/100})`
    : `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function gradient(paint) {
  if (!paint || paint.type !== "GRADIENT_LINEAR") return null;
  const stops = paint.gradientStops.map(s => {
    const { r, g, b, a } = s.color;
    return `rgba(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)},${Math.round(a*100)/100}) ${Math.round(s.position*100)}%`;
  });
  return `linear-gradient(${stops.join(", ")})`;
}

function fills(node) {
  if (!node.fills || !node.fills.length) return undefined;
  const f = node.fills[0];
  return color(f) || gradient(f) || f.type;
}

function font(node) {
  if (node.type !== "TEXT") return undefined;
  const s = node.fontName, sz = node.fontSize, w = node.fontWeight;
  return `${sz}px ${s.family} ${w}, ls:${node.letterSpacing?.value ?? 0}, lh:${typeof node.lineHeight === "object" ? node.lineHeight.value : "auto"}`;
}

function extract(node, depth = 0) {
  if (depth > 5) return null;
  const out = {
    name: node.name,
    type: node.type,
    w: Math.round(node.width),
    h: Math.round(node.height),
    x: Math.round(node.x),
    y: Math.round(node.y),
  };
  const f = fills(node);
  if (f) out.fill = f;
  if (node.opacity !== undefined && node.opacity !== 1) out.opacity = Math.round(node.opacity * 100) / 100;
  if (node.cornerRadius) out.radius = node.cornerRadius;
  const fo = font(node);
  if (fo) out.font = fo;
  if (node.type === "TEXT") out.text = node.characters.slice(0, 120);
  if (node.layoutMode) {
    out.layout = node.layoutMode;
    out.gap = node.itemSpacing;
    out.pad = `${node.paddingTop} ${node.paddingRight} ${node.paddingBottom} ${node.paddingLeft}`;
    out.align = node.primaryAxisAlignItems + "/" + node.counterAxisAlignItems;
  }
  if ("children" in node && node.children.length) {
    out.children = node.children.map(c => extract(c, depth + 1)).filter(Boolean);
  }
  return out;
}

return sel.map(n => extract(n));
