// Builds profile/banner.png, rendered with ImageScript itself
import { Image } from 'imagescript';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const fontDir = process.env.FONT_DIR ?? '/usr/share/fonts/truetype/dejavu/';
const fonts = ['DejaVuSansMono.ttf', 'DejaVuSansMono-Bold.ttf', 'DejaVuSans.ttf', 'DejaVuSans-Bold.ttf'].map((f) => readFileSync(fontDir + f));
const version = JSON.parse(readFileSync(root + 'node_modules/imagescript/package.json', 'utf8')).version;
const MONO = 'font-family="DejaVu Sans Mono, monospace"', SANS = 'font-family="DejaVu Sans, sans-serif"';
const FG = '#F2F4F8', DIM = '#9aa3b5';
const render = async (name, svg) => writeFileSync(root + 'profile/' + name, await (await Image.renderSVG(svg, { font: fonts, scale: 2 })).encodePNG());

// ---- banner: live numbers, new pixel pattern every day ----
{
  const BG = '#141821', BRAND = ['#FFC857', '#FF8C61', '#E85D8C', '#8E6CEF', '#4C7DF0'];
  let stars = 0, npm = 0, cdn = 0, jsr = 0;
  const j = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); };
  stars = (await j('https://api.github.com/repos/matmen/ImageScript')).stargazers_count;
  npm = (await j('https://api.npmjs.org/downloads/point/last-month/imagescript')).downloads; // last 30 days
  cdn = (await j('https://data.jsdelivr.com/v1/stats/packages/npm/imagescript?period=month')).hits.total; // last 30 days
  const rows = (await j('https://api.jsr.io/scopes/matmen/packages/imagescript/downloads')).total;
  const cut = Math.max(...rows.map((r) => Date.parse(r.timeBucket))) - 30 * 864e5;
  jsr = rows.filter((r) => r.kind === 'npm_tarball' && Date.parse(r.timeBucket) > cut).reduce((n, r) => n + r.count, 0); // jsr_meta is metadata, not downloads
  const total = npm + cdn + jsr;
  const k = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n / 1000) + 'k');
  console.log('downloads 30d:', npm, cdn, jsr, '=', total);

  let seed = (Math.floor(Date.now() / 864e5) * 2654435761) >>> 0;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const wordmark = 'data:image/svg+xml;base64,' + readFileSync(root + 'assets/wordmark.svg').toString('base64');
  const W = 900, H = 280;
  let b = `<rect width="${W}" height="${H}" rx="14" fill="${BG}"/>`;
  for (let x = 30; x < 45; x++) for (let y = 0; y < 14; y++) {
    const fall = Math.min(1, (x - 29) / 13);
    if (rnd() < fall * 0.92) {
      const t = Math.min(4, Math.floor(((x - 30) / 15 * 0.6 + y / 14 * 0.4) * 5));
      b += `<rect x="${x * 20 + 2}" y="${y * 20 + 2}" width="16" height="16" rx="4" fill="${BRAND[t]}" opacity="${(0.12 + rnd() * 0.7).toFixed(2)}"/>`;
    }
  }
  b += `<image href="${wordmark}" x="40" y="34" width="405" height="70"/>`;
  b += `<text x="46" y="140" ${SANS} font-size="18" fill="${FG}">Pure TypeScript image processing that runs everywhere.</text>`;
  [[`${stars} ★`, 'on GitHub', 0], [k(total), 'downloads, last 30 days', 170], ['0', 'dependencies', 400]].forEach(([v, l, dx]) => {
    b += `<text x="${46 + dx}" y="196" ${MONO} font-size="30" font-weight="bold" fill="${FG}">${v}</text><text x="${46 + dx}" y="218" ${MONO} font-size="12" fill="${DIM}">${l}</text>`;
  });
  b += `<rect x="46" y="236" width="40" height="3" rx="1.5" fill="${BRAND[0]}"/><rect x="90" y="236" width="40" height="3" rx="1.5" fill="${BRAND[2]}"/><rect x="134" y="236" width="40" height="3" rx="1.5" fill="${BRAND[4]}"/>`;
  b += `<text x="46" y="262" ${MONO} font-size="12" fill="${DIM}">rendered with ImageScript v${version}</text>`;
  await render('banner.png', `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${b}</svg>`);
}
