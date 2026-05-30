// Build valid TTF fonts for the Sharp text overlay (opentype.js).
//
// WHY: opentype.js (lib/sharp/text-to-path.ts) can only read TTF/OTF/WOFF1, NOT WOFF2.
// The repo shipped valid `.woff2` files but the `.ttf` siblings for Montserrat/Inter were
// corrupt (newline bytes). This script regenerates real TTFs by decompressing WOFF2 with
// wawoff2 (Google's official WOFF2 codec, WASM — no native build), and downloads the two
// missing families (Oswald, Open Sans) from Fontsource via jsDelivr.
//
// Run: node scripts/build-fonts.mjs
import { decompress } from 'wawoff2'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const FONTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.fonts')

// Families whose VALID, genuine .woff2 already live in .fonts/ — just decompress to .ttf.
// NOTE: the repo's bundled montserrat-*/inter-* .woff2 were placeholder duplicates
// ("Montserrat Thin"), so those are fetched fresh from Fontsource below instead.
const LOCAL = ['poppins-regular', 'poppins-bold']

// Fetch genuine woff2 from Fontsource (jsDelivr), then decompress to TTF.
// Fontsource weight 400 = regular, 700 = bold.
const REMOTE = [
  { out: 'montserrat-regular', url: 'https://cdn.jsdelivr.net/npm/@fontsource/montserrat/files/montserrat-latin-400-normal.woff2' },
  { out: 'montserrat-bold', url: 'https://cdn.jsdelivr.net/npm/@fontsource/montserrat/files/montserrat-latin-700-normal.woff2' },
  { out: 'inter-regular', url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-400-normal.woff2' },
  { out: 'inter-bold', url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-700-normal.woff2' },
  { out: 'oswald-regular', url: 'https://cdn.jsdelivr.net/npm/@fontsource/oswald/files/oswald-latin-400-normal.woff2' },
  { out: 'oswald-bold', url: 'https://cdn.jsdelivr.net/npm/@fontsource/oswald/files/oswald-latin-700-normal.woff2' },
  { out: 'open-sans-regular', url: 'https://cdn.jsdelivr.net/npm/@fontsource/open-sans/files/open-sans-latin-400-normal.woff2' },
  { out: 'open-sans-bold', url: 'https://cdn.jsdelivr.net/npm/@fontsource/open-sans/files/open-sans-latin-700-normal.woff2' },
]

function sig(buf) {
  return Buffer.from(buf.slice(0, 4)).toString('hex')
}

async function toTtf(name, woff2Buf) {
  const ttf = Buffer.from(await decompress(woff2Buf))
  const s = sig(ttf)
  if (s !== '00010000' && s !== '4f54544f') {
    throw new Error(`${name}: decompressed output is not a valid TTF/OTF (sig=${s})`)
  }
  const out = path.join(FONTS_DIR, `${name}.ttf`)
  writeFileSync(out, ttf)
  console.log(`  ✓ ${name}.ttf  (${ttf.length} bytes, sig=${s})`)
}

console.log('Decompressing local WOFF2 → TTF:')
for (const name of LOCAL) {
  const src = path.join(FONTS_DIR, `${name}.woff2`)
  if (!existsSync(src)) {
    console.warn(`  ⚠ skip ${name}: ${name}.woff2 not found`)
    continue
  }
  await toTtf(name, readFileSync(src))
}

console.log('\nFetching + decompressing remote fonts:')
for (const { out, url } of REMOTE) {
  const res = await fetch(url)
  if (!res.ok) {
    console.error(`  ✗ ${out}: HTTP ${res.status} for ${url}`)
    continue
  }
  await toTtf(out, Buffer.from(await res.arrayBuffer()))
}

console.log('\nDone. Validate with: node scripts/diag-fonts.mjs')
