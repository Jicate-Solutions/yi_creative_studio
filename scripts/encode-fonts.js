const fs = require('fs')
const path = require('path')

const FONTS_DIR = path.join(__dirname, '..', 'public', 'fonts')
const OUTPUT_FILE = path.join(__dirname, '..', 'lib', 'config', 'embedded-fonts.ts')

const fontFiles = {
  poppins: {
    regular: 'Poppins-Regular.woff2',
    bold: 'Poppins-Bold.woff2',
  },
  montserrat: {
    regular: 'Montserrat-Regular.woff2',
    bold: 'Montserrat-Bold.woff2',
  },
  inter: {
    regular: 'Inter-Regular.woff2',
    bold: 'Inter-Bold.woff2',
  },
}

function encodeFont(filename) {
  const filePath = path.join(FONTS_DIR, filename)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Font file not found: ${filePath}`)
    process.exit(1)
  }

  const buffer = fs.readFileSync(filePath)
  return `data:font/woff2;base64,${buffer.toString('base64')}`
}

console.log('🔧 Encoding fonts to base64...\n')

// Generate TypeScript file
let output = `// Auto-generated font embeddings
// DO NOT EDIT MANUALLY - Run: node scripts/encode-fonts.js

export const EMBEDDED_FONTS = {\n`

for (const [family, weights] of Object.entries(fontFiles)) {
  output += `  ${family}: {\n`
  for (const [weight, filename] of Object.entries(weights)) {
    console.log(`📦 Encoding ${filename}...`)
    const base64 = encodeFont(filename)
    output += `    ${weight}: '${base64}',\n`
  }
  output += `  },\n`
}

output += `} as const\n\n`
output += `export type FontFamily = 'poppins' | 'montserrat' | 'inter'\n`
output += `export type FontWeight = 'regular' | 'bold'\n`

fs.writeFileSync(OUTPUT_FILE, output)
console.log(`\n✅ Generated ${OUTPUT_FILE}`)
console.log(`📊 File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`)
