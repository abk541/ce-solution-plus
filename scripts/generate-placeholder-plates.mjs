/**
 * Generates the placeholder image plates in /public/images.
 *
 * These are art-directed abstract plates, not photographs. They carry the site
 * palette, have real atmospheric depth (layered light, haze, vignette, grain)
 * and a restrained structural motif, so the page reads as designed rather than
 * unfinished — while never implying a client, facility, or program that
 * CE Solution Plus does not actually support.
 *
 * Run:  node scripts/generate-placeholder-plates.mjs
 * Delete this script and /public/images once real photography is supplied.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../public/images');

const INK = '#10283E';
const NAVY = '#163B5C';
const NAVY_LIGHT = '#1F5078';
const STEEL = '#BFD0DC';
const ACCENT = '#FF5C3D';
const SIGNAL = '#F2F3EF';

/** Deterministic PRNG so regenerating never churns the files. */
function rng(seed) {
  let state = [...seed].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 17);
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
}

const n = (value) => Math.round(value * 100) / 100;

/* ------------------------------------------------------------------ *
 * Structural motifs
 *
 * Each returns bare SVG geometry. Opacity stays low across the board — the
 * motif is the substrate the light sits on, never the subject.
 * ------------------------------------------------------------------ */

function contour(w, h, seed) {
  const rand = rng(seed);
  const lines = [];
  const count = 58;
  for (let i = 0; i < count; i += 1) {
    const baseY = (h / (count - 1)) * i;
    const d = (baseY - h * 0.56) / (h * 0.5);
    const envelope = Math.exp(-d * d * 1.6);
    const amp = envelope * h * 0.2;
    if (amp < 1) continue;
    const phase = rand() * Math.PI * 2;
    const pts = [];
    for (let x = 0; x <= w; x += w / 120) {
      const nx = x / w;
      const y =
        baseY +
        amp *
          (Math.sin(nx * 4.4 + phase) * 0.6 +
            Math.sin(nx * 11.2 - phase * 1.3) * 0.2 +
            Math.sin(nx * 2.1 + phase * 0.5) * 0.24);
      pts.push(`${n(x)},${n(y)}`);
    }
    const accent = i % 13 === 6;
    lines.push(
      `<polyline points="${pts.join(' ')}" fill="none" stroke="${accent ? ACCENT : STEEL}" stroke-width="${accent ? 1.6 : 1}" stroke-opacity="${n((accent ? 0.34 : 0.13) * envelope + 0.03)}"/>`,
    );
  }
  return lines.join('');
}

function lattice(w, h, seed) {
  const rand = rng(seed);
  const parts = [];
  const cols = 14;
  const cw = w / cols;
  const rows = Math.max(5, Math.round(h / cw));
  const ch = h / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = c * cw;
      const y = r * ch;
      const op = n(0.05 + rand() * 0.12);
      parts.push(
        `<rect x="${n(x)}" y="${n(y)}" width="${n(cw)}" height="${n(ch)}" fill="none" stroke="${STEEL}" stroke-opacity="${op}" stroke-width="1"/>`,
      );
      if (rand() > 0.82) {
        parts.push(
          `<rect x="${n(x)}" y="${n(y)}" width="${n(cw)}" height="${n(ch)}" fill="${NAVY_LIGHT}" fill-opacity="${n(0.2 + rand() * 0.5)}"/>`,
        );
      }
      if (rand() > 0.965) {
        parts.push(
          `<rect x="${n(x + cw * 0.38)}" y="${n(y + ch * 0.38)}" width="${n(cw * 0.24)}" height="${n(ch * 0.24)}" fill="${ACCENT}" fill-opacity="0.55"/>`,
        );
      }
    }
  }
  return parts.join('');
}

function strata(w, h, seed) {
  const rand = rng(seed);
  const parts = [];
  let y = 0;
  let band = 0;
  while (y < h) {
    const bh = h * (0.025 + rand() * 0.06);
    const accent = band % 7 === 3;
    parts.push(
      `<rect x="0" y="${n(y)}" width="${w}" height="${n(Math.min(bh, h - y))}" fill="${NAVY_LIGHT}" fill-opacity="${n(0.08 + rand() * 0.24)}"/>`,
    );
    parts.push(
      `<line x1="0" y1="${n(y)}" x2="${w}" y2="${n(y)}" stroke="${accent ? ACCENT : STEEL}" stroke-opacity="${accent ? 0.34 : 0.12}" stroke-width="1"/>`,
    );
    y += bh;
    band += 1;
  }
  return parts.join('');
}

function radial(w, h, seed) {
  const rand = rng(seed);
  const cx = w * 0.68;
  const cy = h * 0.46;
  const max = Math.hypot(w, h) * 0.55;
  const parts = [];
  for (let r = max / 26; r < max; r += max / 26) {
    const accent = Math.abs(r - max * 0.42) < max / 52;
    parts.push(
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none" stroke="${accent ? ACCENT : STEEL}" stroke-opacity="${accent ? 0.42 : n(0.06 + rand() * 0.08)}" stroke-width="${accent ? 1.6 : 1}"/>`,
    );
  }
  for (let a = 0; a < 360; a += 15) {
    const rad = (a * Math.PI) / 180;
    const inner = a % 45 === 0 ? max * 0.06 : max * 0.78;
    parts.push(
      `<line x1="${n(cx + Math.cos(rad) * inner)}" y1="${n(cy + Math.sin(rad) * inner)}" x2="${n(cx + Math.cos(rad) * max)}" y2="${n(cy + Math.sin(rad) * max)}" stroke="${STEEL}" stroke-opacity="${a % 45 === 0 ? 0.16 : 0.08}" stroke-width="1"/>`,
    );
  }
  return parts.join('');
}

function nodes(w, h, seed) {
  const rand = rng(seed);
  const points = Array.from({ length: 54 }, () => ({ x: rand() * w, y: rand() * h }));
  const parts = [];
  points.forEach((p, i) => {
    points.slice(i + 1).forEach((q) => {
      const dist = Math.hypot(p.x - q.x, p.y - q.y);
      const reach = Math.min(w, h) * 0.24;
      if (dist < reach) {
        parts.push(
          `<line x1="${n(p.x)}" y1="${n(p.y)}" x2="${n(q.x)}" y2="${n(q.y)}" stroke="${STEEL}" stroke-opacity="${n(0.16 - (dist / reach) * 0.13)}" stroke-width="1"/>`,
        );
      }
    });
  });
  points.forEach((p, i) => {
    const accent = i % 13 === 4;
    parts.push(
      `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${accent ? 4 : 2}" fill="${accent ? ACCENT : STEEL}" fill-opacity="${accent ? 0.7 : 0.26}"/>`,
    );
  });
  return parts.join('');
}

function blueprint(w, h, seed) {
  const rand = rng(seed);
  const parts = [];
  const step = Math.min(w, h) / 14;
  for (let x = 0; x <= w; x += step) {
    parts.push(
      `<line x1="${n(x)}" y1="0" x2="${n(x)}" y2="${h}" stroke="${STEEL}" stroke-opacity="${x % (step * 4) === 0 ? 0.13 : 0.06}" stroke-width="1"/>`,
    );
  }
  for (let y = 0; y <= h; y += step) {
    parts.push(
      `<line x1="0" y1="${n(y)}" x2="${w}" y2="${n(y)}" stroke="${STEEL}" stroke-opacity="${y % (step * 4) === 0 ? 0.13 : 0.06}" stroke-width="1"/>`,
    );
  }
  for (let i = 0; i < 9; i += 1) {
    const rx = Math.round((rand() * w * 0.72) / step) * step;
    const ry = Math.round((rand() * h * 0.72) / step) * step;
    const rw = step * (1 + Math.floor(rand() * 4));
    const rh = step * (1 + Math.floor(rand() * 3));
    const accent = i === 3;
    parts.push(
      `<rect x="${n(rx)}" y="${n(ry)}" width="${n(rw)}" height="${n(rh)}" fill="${NAVY_LIGHT}" fill-opacity="${n(0.35 + rand() * 0.35)}" stroke="${accent ? ACCENT : STEEL}" stroke-opacity="${accent ? 0.55 : 0.18}" stroke-width="1.2"/>`,
    );
  }
  return parts.join('');
}

const GENERATORS = { contour, lattice, strata, radial, nodes, blueprint };

/* ------------------------------------------------------------------ *
 * Plate composition
 *
 * Depth comes from stacked light, not from more geometry:
 *   base navy -> fill light -> motif -> key light -> haze -> vignette -> grain
 * ------------------------------------------------------------------ */
function plate({ w, h, type, seed, key = ACCENT, keyAt = [0.72, 0.3] }) {
  const body = GENERATORS[type](w, h, seed);
  const m = Math.min(w, h) * 0.035;
  const tick = m * 0.55;

  const marks = [
    `M${n(m)} ${n(m + tick)}V${n(m)}H${n(m + tick)}`,
    `M${n(w - m - tick)} ${n(m)}H${n(w - m)}V${n(m + tick)}`,
    `M${n(w - m)} ${n(h - m - tick)}V${n(h - m)}H${n(w - m - tick)}`,
    `M${n(m + tick)} ${n(h - m)}H${n(m)}V${n(h - m - tick)}`,
  ]
    .map((d) => `<path d="${d}" fill="none" stroke="${STEEL}" stroke-opacity="0.28" stroke-width="1.5"/>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" preserveAspectRatio="xMidYMid slice">
<!-- PLACEHOLDER ART — generated by scripts/generate-placeholder-plates.mjs.
     Replace with real client photography before launch. -->
<defs>
  <radialGradient id="key" cx="${n(keyAt[0] * 100)}%" cy="${n(keyAt[1] * 100)}%" r="72%">
    <stop offset="0" stop-color="${key}" stop-opacity="0.22"/>
    <stop offset="0.45" stop-color="${key}" stop-opacity="0.06"/>
    <stop offset="1" stop-color="${key}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="fill" cx="18%" cy="82%" r="68%">
    <stop offset="0" stop-color="${NAVY_LIGHT}" stop-opacity="0.55"/>
    <stop offset="1" stop-color="${NAVY_LIGHT}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="haze" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="${INK}" stop-opacity="0.92"/>
    <stop offset="0.4" stop-color="${INK}" stop-opacity="0.32"/>
    <stop offset="1" stop-color="${INK}" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="vig" cx="50%" cy="46%" r="76%">
    <stop offset="0.45" stop-color="${INK}" stop-opacity="0"/>
    <stop offset="1" stop-color="${INK}" stop-opacity="0.82"/>
  </radialGradient>
  <!-- Motif fades toward the lower edge so overlaid type always has clean ground. -->
  <linearGradient id="motifmask" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.95"/>
    <stop offset="0.55" stop-color="#fff" stop-opacity="0.7"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0.12"/>
  </linearGradient>
  <mask id="motif">
    <rect width="${w}" height="${h}" fill="url(#motifmask)"/>
  </mask>
</defs>
<rect width="${w}" height="${h}" fill="${NAVY}"/>
<rect width="${w}" height="${h}" fill="url(#fill)"/>
<g mask="url(#motif)">${body}</g>
<rect width="${w}" height="${h}" fill="url(#key)"/>
<rect width="${w}" height="${h}" fill="url(#haze)"/>
<rect width="${w}" height="${h}" fill="url(#vig)"/>
${marks}
</svg>`;
}

/**
 * Key-light position and hue are varied per plate so a row of cards reads as a
 * set of distinct images rather than one texture repeated.
 */
const PLATES = [
  { name: 'ce-operations-floor', w: 2400, h: 1200, type: 'contour', keyAt: [0.78, 0.26] },
  { name: 'ce-markets-band', w: 2400, h: 1400, type: 'lattice', keyAt: [0.2, 0.22] },
  { name: 'ce-trust-band', w: 2400, h: 1400, type: 'radial', keyAt: [0.7, 0.4] },
  { name: 'ce-national-security', w: 800, h: 1000, type: 'blueprint', keyAt: [0.5, 0.2] },
  { name: 'ce-intelligence', w: 800, h: 1000, type: 'nodes', keyAt: [0.66, 0.3] },
  { name: 'ce-cyber', w: 800, h: 1000, type: 'lattice', keyAt: [0.34, 0.24], key: SIGNAL },
  { name: 'ce-facilities', w: 800, h: 1000, type: 'blueprint', keyAt: [0.24, 0.34] },
  { name: 'ce-readiness', w: 800, h: 1000, type: 'contour', keyAt: [0.6, 0.36] },
  { name: 'ce-logistics', w: 800, h: 1000, type: 'strata', keyAt: [0.4, 0.28] },
];

await mkdir(OUT_DIR, { recursive: true });

for (const spec of PLATES) {
  const svg = plate({ ...spec, seed: spec.name });
  await writeFile(resolve(OUT_DIR, `${spec.name}.svg`), svg, 'utf8');
  console.log(`wrote ${spec.name}.svg  (${spec.w}x${spec.h}, ${spec.type})`);
}

/* Fine grain overlay reused by the page chrome. */
const grainSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
<rect width="200" height="200" filter="url(#g)" opacity="0.55"/>
</svg>`;
await writeFile(resolve(OUT_DIR, 'grain.svg'), grainSvg, 'utf8');
console.log('wrote grain.svg');
