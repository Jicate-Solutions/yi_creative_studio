
import sharp from 'sharp'
import { overlayLogosOnImage, type LogoPlacement, type LogoPosition } from '../lib/sharp/logo-overlay'
import path from 'path'
import fs from 'fs'

// Mock constants usually from config
const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'output')
const MOCK_LOGO_SIZE = 100

async function createPlaceholderLogo(color: string, text: string): Promise<Buffer> {
    const svg = `
    <svg width="${MOCK_LOGO_SIZE}" height="${MOCK_LOGO_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" />
      <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">${text}</text>
    </svg>
  `
    return sharp(Buffer.from(svg)).png().toBuffer()
}

async function runTest() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true })
    }

    console.log('Generating assets...')
    const baseImage = await sharp({
        create: {
            width: 1080,
            height: 1350,
            channels: 4,
            background: { r: 50, g: 50, b: 50, alpha: 1 }
        }
    }).png().toBuffer()

    const logos = await Promise.all([
        createPlaceholderLogo('#FF0000', '1'),
        createPlaceholderLogo('#00FF00', '2'),
        createPlaceholderLogo('#0000FF', '3'),
        createPlaceholderLogo('#FFFF00', '4'),
        createPlaceholderLogo('#00FFFF', '5'),
        createPlaceholderLogo('#FF00FF', '6'),
        createPlaceholderLogo('#AA00AA', '7'), // Extra wide test
    ])


    const logoDataUris = logos.map(b => `data:image/png;base64,${b.toString('base64')}`)

    const placements: LogoPlacement[] = [
        { logoId: '1', position: 'top-1', logo: { file_url: logoDataUris[0] } },
        { logoId: '2', position: 'top-2', logo: { file_url: logoDataUris[1] } },
        { logoId: '3', position: 'top-3', logo: { file_url: logoDataUris[2] } },
        { logoId: '4', position: 'top-4', logo: { file_url: logoDataUris[3] } },
        { logoId: '5', position: 'top-5', logo: { file_url: logoDataUris[4] } },
        { logoId: '6', position: 'top-6', logo: { file_url: logoDataUris[5] } },
    ]

    console.log('Running Test 1: Crowded Angled Strip (FIXED)...')
    const result1 = await overlayLogosOnImage({
        baseImageBuffer: baseImage,
        logosPlacements: placements,
        defaultLogoSize: 120, // Intentional large size
        padding: 10,
        backgroundColor: '#FFFFFF',
        stripMode: { enabled: true, rows: ['header'] },
        stripShape: 'angled' as any
    })

    await sharp(result1).toFile(path.join(OUTPUT_DIR, 'test-conflict-angled-FIXED.png'))
    console.log('Saved test-conflict-angled-FIXED.png')

    console.log('Running Test 2: Edge Curved Strip (FIXED)...')
    const placements2: LogoPlacement[] = [
        { logoId: '1', position: 'top-1', logo: { file_url: logoDataUris[0] } },
        { logoId: '6', position: 'top-6', logo: { file_url: logoDataUris[5] } },
    ]
    const result2 = await overlayLogosOnImage({
        baseImageBuffer: baseImage,
        logosPlacements: placements2,
        defaultLogoSize: 120,
        padding: 10,
        backgroundColor: '#FFFFFF',
        stripMode: { enabled: true, rows: ['header'] },
        stripShape: 'curved' as any
    })

    await sharp(result2).toFile(path.join(OUTPUT_DIR, 'test-conflict-curved-edge-FIXED.png'))
    console.log('Saved test-conflict-curved-edge-FIXED.png')
}

runTest().catch(console.error)
