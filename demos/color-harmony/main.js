import { mountDemoBar } from '../../src/lib/chrome.js';
mountDemoBar();

/* ═══════════════════════════════════════════════════════════════════════════
   Colour maths.

   The browser can render oklch() but gives us no way to ASK about it — is
   this in gamut? what is its contrast against that? So we convert down to
   linear sRGB ourselves. It is about thirty lines and it unlocks live gamut
   checking and contrast scoring, which is the whole point of the page.
   ═══════════════════════════════════════════════════════════════════════════ */

/** OKLCH → OKLab → linear sRGB. Björn Ottosson's matrices. */
function oklchToLinearRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const encodeSrgb = (v) =>
  v <= 0.0031308 ? 12.92 * v : 1.055 * Math.abs(v) ** (1 / 2.4) - 0.055;

/** True when any linear channel escapes [0,1] — i.e. the colour clips. */
const outOfGamut = (L, C, h) =>
  oklchToLinearRgb(L, C, h).some((v) => v < -0.0001 || v > 1.0001);

/** OKLCH → 0..255 sRGB triple, clamped. */
function toRgb255(L, C, h) {
  return oklchToLinearRgb(L, C, h).map((v) =>
    Math.round(Math.min(1, Math.max(0, encodeSrgb(v))) * 255)
  );
}

/** WCAG 2.1 relative luminance and contrast ratio. */
function wcagRatio(rgbA, rgbB) {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = lum(rgbA);
  const b = lum(rgbB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * APCA (Accessible Perceptual Contrast Algorithm), W3C draft 0.1.9.
 *
 * Unlike WCAG's symmetric ratio, APCA is polarity-aware: dark-text-on-light
 * and light-text-on-dark are computed differently, because the eye does not
 * treat them the same. That asymmetry is exactly what WCAG 2.1 misses, and
 * why dark themes routinely "pass" WCAG while being hard to read.
 *
 * Returns a signed Lc; the sign carries polarity, so we report |Lc|.
 */
function apca(textRgb, bgRgb) {
  const Y = (rgb) => {
    const [r, g, b] = rgb.map((v) => (v / 255) ** 2.4);
    return 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  };

  // Soft clamp of very dark colours toward black.
  const clampY = (y) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414);

  const Ytxt = clampY(Y(textRgb));
  const Ybg = clampY(Y(bgRgb));

  if (Math.abs(Ybg - Ytxt) < 0.0005) return 0;

  let Lc;
  if (Ybg > Ytxt) {
    // Normal polarity: dark text on a light background.
    Lc = (Ybg ** 0.56 - Ytxt ** 0.57) * 1.14;
    Lc = Lc < 0.001 ? 0 : Lc - 0.027;
  } else {
    // Reverse polarity: light text on a dark background.
    Lc = (Ybg ** 0.65 - Ytxt ** 0.62) * 1.14;
    Lc = Lc > -0.001 ? 0 : Lc + 0.027;
  }
  return Lc * 100;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Palette generation
   ═══════════════════════════════════════════════════════════════════════════ */

const state = { hue: 265, chroma: 0.18, tint: 0.015 };

// Dense at the ends where UI needs fine steps, sparser through the middle.
const STOPS = [97, 93, 87, 79, 70, 62, 54, 46, 38, 30, 22, 14];

/**
 * Chroma taper. A colour at 97% or 14% lightness simply cannot hold much
 * chroma — the gamut narrows to a point at both ends of the lightness axis.
 * This scales chroma by how far the step is from mid-lightness.
 */
const taper = (l) => {
  const d = Math.abs(l - 55) / 55; // 0 at mid, 1 at the extremes
  return 0.3 + 0.7 * (1 - d ** 1.5);
};

const step = (l, hue = state.hue, chroma = state.chroma, tapered = true) => ({
  l,
  c: chroma * (tapered ? taper(l) : 1),
  h: hue,
  css: `oklch(${l}% ${(chroma * (tapered ? taper(l) : 1)).toFixed(4)} ${hue})`,
});

const rgbOf = (s) => toRgb255(s.l / 100, s.c, s.h);

/* --- 1 · Harmonies --------------------------------------------------------- */

const HARMONIES = [
  ['Monochromatic', 'h, one hue', (h) => [h, h, h, h]],
  ['Complementary', 'h, h + 180', (h) => [h, h, h + 180, h + 180]],
  ['Split complementary', 'h, h + 150, h + 210', (h) => [h, h + 150, h + 210, h]],
  ['Triadic', 'h, h + 120, h + 240', (h) => [h, h + 120, h + 240, h]],
  ['Analogous', 'h − 30, h, h + 30', (h) => [h - 30, h, h + 30, h + 60]],
  ['Tetradic', 'h, h + 90, h + 180, h + 270', (h) => [h, h + 90, h + 180, h + 270]],
];

const harmoniesEl = document.getElementById('harmonies');

function renderHarmonies() {
  harmoniesEl.innerHTML = HARMONIES.map(([name, formula, fn]) => {
    const swatches = fn(state.hue)
      .map((h, i) => {
        // Vary lightness across the set so it reads as a usable palette
        // rather than four equally-loud colours competing for attention.
        const l = [72, 60, 48, 82][i];
        return `<i style="background: ${step(l, ((h % 360) + 360) % 360).css}"></i>`;
      })
      .join('');
    return `<div class="harmony">
              <h3>${name}</h3>
              <p>${formula}</p>
              <div class="harmony__swatches">${swatches}</div>
            </div>`;
  }).join('');
}

/* --- 2 · Ramps ------------------------------------------------------------- */

const rampsEl = document.getElementById('ramps');

function rampRow(label, hue, tapered, chroma = state.chroma) {
  const cells = STOPS.map((l) => {
    const s = step(l, hue, chroma, tapered);
    const oog = outOfGamut(s.l / 100, s.c, s.h);
    // Label colour flips at the midpoint so it stays legible on every step.
    const fg = l > 55 ? 'oklch(20% 0 0)' : 'oklch(97% 0 0)';
    return `<i style="background:${s.css};color:${fg}" data-oog="${oog}" data-css="${s.css}" title="${s.css}">${l}</i>`;
  }).join('');
  return `<div class="ramp-row"><span>${label}</span><div class="ramp">${cells}</div></div>`;
}

function renderRamps() {
  rampsEl.innerHTML = [
    rampRow('tapered', state.hue, true),
    rampRow('untapered', state.hue, false),
    rampRow('accent 2', (state.hue + 150) % 360, true),
    rampRow('danger', 25, true, 0.19),
    rampRow('success', 150, true, 0.15),
  ].join('');
}

/* --- 3 · Neutrals ---------------------------------------------------------- */

const neutralsEl = document.getElementById('neutrals');

function renderNeutrals() {
  neutralsEl.innerHTML = [
    rampRow('pure grey', state.hue, false, 0),
    rampRow(`tinted ${state.tint.toFixed(3)}`, state.hue, false, state.tint),
  ].join('');
}

/* --- 4 · Roles ------------------------------------------------------------- */

// The indirection layer. Components below reference ONLY these names.
function roles() {
  const n = (l) => step(l, state.hue, state.tint, false).css;
  return {
    '--role-surface': n(16),
    '--role-raised': n(22),
    '--role-border': n(32),
    '--role-text': n(95),
    '--role-muted': n(68),
    '--role-accent': step(62, state.hue).css,
    '--role-accent-hover': step(70, state.hue).css,
    '--role-on-accent': step(14, state.hue, state.chroma * 0.3).css,
    '--role-danger': step(58, 25, 0.19).css,
    '--role-success': step(62, 150, 0.15).css,
  };
}

const mock = document.getElementById('mock');

document.getElementById('bars').innerHTML = [45, 62, 38, 80, 55, 92, 70]
  .map((h) => `<i style="height:${h}%"></i>`)
  .join('');

function renderRoles() {
  const r = roles();
  for (const [k, v] of Object.entries(r)) mock.style.setProperty(k, v);
  return r;
}

/* --- 5 · Contrast ---------------------------------------------------------- */

const contrastEl = document.getElementById('contrast');

// Parse the oklch() strings we generated ourselves — cheaper and more precise
// than round-tripping through getComputedStyle.
const parse = (css) => {
  const [, l, c, h] = css.match(/oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\)/);
  return toRgb255(Number(l) / 100, Number(c), Number(h));
};

function renderContrast() {
  const r = roles();
  const PAIRS = [
    ['body text on surface', '--role-text', '--role-surface', 90],
    ['muted text on surface', '--role-muted', '--role-surface', 60],
    ['body text on raised', '--role-text', '--role-raised', 90],
    ['muted text on raised', '--role-muted', '--role-raised', 60],
    ['accent button label', '--role-on-accent', '--role-accent', 75],
    ['danger button label', '--role-on-accent', '--role-danger', 75],
    ['border on surface', '--role-border', '--role-surface', 30],
  ];

  contrastEl.innerHTML = PAIRS.map(([name, fgKey, bgKey, target]) => {
    const fg = parse(r[fgKey]);
    const bg = parse(r[bgKey]);
    const lc = Math.abs(apca(fg, bg));
    const wc = wcagRatio(fg, bg);

    const cls = lc >= target ? 'pass' : lc >= target - 15 ? 'warn' : 'fail';
    const label = lc >= target ? 'pass' : lc >= target - 15 ? 'tight' : 'fail';

    return `<tr>
      <td>${name}</td>
      <td><span class="sample" style="background:${r[bgKey]};color:${r[fgKey]}">Sample text</span></td>
      <td class="n">${lc.toFixed(1)}</td>
      <td class="n">${wc.toFixed(2)}:1</td>
      <td><span class="verdict ${cls}">${label} · needs ${target}</span></td>
    </tr>`;
  }).join('');
}

/* --- Wiring ---------------------------------------------------------------- */

function refresh() {
  renderHarmonies();
  renderRamps();
  renderNeutrals();
  renderRoles();
  renderContrast();
}

function bind(id, apply, format) {
  const el = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  const update = () => {
    apply(Number(el.value));
    out.textContent = format(Number(el.value));
    refresh();
  };
  el.addEventListener('input', update);
  update();
}

bind('hue', (v) => (state.hue = v), (v) => `${v}°`);
bind('chroma', (v) => (state.chroma = v / 100), (v) => (v / 100).toFixed(2));
bind('tint', (v) => (state.tint = v / 100), (v) => (v / 100).toFixed(3));

// Copy every swatch by clicking it.
document.addEventListener('click', async (e) => {
  const cell = e.target.closest('.ramp i[data-css]');
  if (!cell) return;
  try {
    await navigator.clipboard.writeText(cell.dataset.css);
    const prev = cell.textContent;
    cell.textContent = '✓';
    setTimeout(() => (cell.textContent = prev), 800);
  } catch {
    /* clipboard needs a secure context */
  }
});

document.getElementById('copy').onclick = async (e) => {
  const r = roles();
  const scale = STOPS.map((l) => `  --brand-${l}: ${step(l).css};`).join('\n');
  const semantic = Object.entries(r)
    .map(([k, v]) => `  ${k.replace('--role-', '--')}: ${v};`)
    .join('\n');
  const css = `:root {\n  /* primitives */\n${scale}\n\n  /* semantic roles */\n${semantic}\n}`;
  try {
    await navigator.clipboard.writeText(css);
    e.target.textContent = 'Copied ✓';
    setTimeout(() => (e.target.textContent = 'Copy as CSS'), 1400);
  } catch {
    /* clipboard needs a secure context */
  }
};
