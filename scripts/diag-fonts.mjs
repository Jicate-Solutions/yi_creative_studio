// Validate that each .ttf in .fonts/ is loadable by opentype.js AND is actually the
// font its filename claims (reads the internal name table). Flags duplicates by hash.
import opentype from 'opentype.js'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const FONTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.fonts')
const files = readdirSync(FONTS_DIR).filter(f => f.endsWith('.ttf')).sort()
const byHash = new Map()

for (const f of files) {
  const buf = readFileSync(path.join(FONTS_DIR, f))
  const hash = createHash('md5').update(buf).digest('hex').slice(0, 8)
  let id = '??'
  try {
    const font = opentype.loadSync(path.join(FONTS_DIR, f))
    const name = font.names
    const family = name.fontFamily?.en || Object.values(name.fontFamily || {})[0] || '?'
    const sub = name.fontSubfamily?.en || Object.values(name.fontSubfamily || {})[0] || '?'
    id = `${family} / ${sub}`
  } catch (e) {
    id = `LOAD FAILED: ${e.message}`
  }
  const dupe = byHash.has(hash) ? `  ⚠ DUPLICATE of ${byHash.get(hash)}` : ''
  if (!byHash.has(hash)) byHash.set(hash, f)
  console.log(`${f.padEnd(26)} md5=${hash}  →  ${id}${dupe}`)
}
