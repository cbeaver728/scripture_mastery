/* Renders icon-192.png / icon-512.png (an open book on a night-blue tile).
   Run: node tools/make-icons.js     No dependencies beyond core Node. */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

/* ------------------------------ PNG writer ------------------------------ */
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function writePNG(file, w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]));
}

/* ------------------------------ geometry ------------------------------ */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mix = (a, b, t) => a + (b - a) * t;

function segDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay, wx = px - ax, wy = py - ay;
  const L = vx * vx + vy * vy;
  const t = L === 0 ? 0 : clamp((wx * vx + wy * vy) / L, 0, 1);
  const dx = px - (ax + t * vx), dy = py - (ay + t * vy);
  return Math.hypot(dx, dy);
}
function quadPoints(p0, c, p1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0],
      u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]
    ]);
  }
  return out;
}
function polyline(points) {
  const segs = [];
  for (let i = 1; i < points.length; i++) {
    segs.push([points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]]);
  }
  return segs;
}
function roundRectDist(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r), qy = Math.abs(py - cy) - (hh - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

/* -------------------------------- render -------------------------------- */
function render(S, opts) {
  opts = opts || {};
  const k = S / 512;                       // design space is 512
  const px = (x) => x * k;
  const cx = S / 2, cy = S / 2;
  const corner = opts.maskable ? 0 : 0.215; // the launcher mask rounds maskable icons

  /* Open-book outline. Maskable icons keep the glyph inside the 80% safe zone. */
  const F = opts.maskable ? 0.62 : 0.86, C = 256;
  const s = (x, y) => [px(C + (x - C) * F), px(C + (y - C) * F)];

  const segs = [];
  const left = []
    .concat(quadPoints(s(256, 152), s(150, 112), s(72, 132), 22))
    .concat([s(72, 132), s(72, 352)])
    .concat(quadPoints(s(72, 352), s(150, 372), s(256, 402), 22));
  const right = []
    .concat(quadPoints(s(256, 152), s(362, 112), s(440, 132), 22))
    .concat([s(440, 132), s(440, 352)])
    .concat(quadPoints(s(440, 352), s(362, 372), s(256, 402), 22));
  segs.push(...polyline(left), ...polyline(right));
  segs.push([...s(256, 152), ...s(256, 402)]);          // the spine

  const stroke = px(opts.maskable ? 30 : 27) / 2;
  const buf = Buffer.alloc(S * S * 4);

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const fx = x + 0.5, fy = y + 0.5;

      /* tile: night-blue vertical gradient with a warm glow behind the book */
      const g = y / S;
      let r = mix(30, 13, g), gr = mix(37, 17, g), b = mix(80, 40, g);
      const glow = Math.max(0, 1 - Math.hypot(fx - cx, fy - cy * 0.94) / (S * 0.44));
      r += glow * glow * 46; gr += glow * glow * 34; b += glow * glow * 6;

      /* gold book stroke */
      let d = Infinity;
      for (let i = 0; i < segs.length; i++) {
        const sg = segs[i];
        const dd = segDist(fx, fy, sg[0], sg[1], sg[2], sg[3]);
        if (dd < d) d = dd;
      }
      const ink = clamp(stroke + 0.5 - d, 0, 1);
      if (ink > 0) {
        const shade = clamp(0.78 + (1 - fy / S) * 0.3, 0, 1);   // lighter at the top
        r = mix(r, 233 * shade + 22, ink);
        gr = mix(gr, 189 * shade + 18, ink);
        b = mix(b, 110 * shade + 10, ink);
      }

      /* rounded-tile mask */
      const a = corner === 0 ? 1
        : clamp(0.5 - roundRectDist(fx, fy, cx, cy, S / 2, S / 2, S * corner), 0, 1);
      const o = (y * S + x) * 4;
      buf[o] = Math.round(clamp(r, 0, 255));
      buf[o + 1] = Math.round(clamp(gr, 0, 255));
      buf[o + 2] = Math.round(clamp(b, 0, 255));
      buf[o + 3] = Math.round(a * 255);
    }
  }
  return buf;
}

const root = path.join(__dirname, '..');
[
  { file: 'icon-192.png', size: 192, opts: {} },
  { file: 'icon-512.png', size: 512, opts: {} },
  { file: 'icon-maskable-512.png', size: 512, opts: { maskable: true } }
].forEach(({ file, size, opts }) => {
  const out = path.join(root, file);
  writePNG(out, size, size, render(size, opts));
  console.log('wrote', out, fs.statSync(out).size, 'bytes');
});
