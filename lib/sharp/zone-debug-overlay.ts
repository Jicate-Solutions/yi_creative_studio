/**
 * Zone Debug Overlay (v40.6)
 * Draws visual zone boundary markers on the generated poster image.
 * Enabled via DEBUG_ZONE_OVERLAY=true in .env.local — NEVER on in production.
 *
 * Shows:
 *  - Red bands:   forbidden header (0–headerEnd%) and footer (footerStart–100%)
 *  - Green band:  allowed content zone (headerEnd–footerStart%)
 *  - Orange line: ACTUAL logo bar bottom (real Sharp bar height)
 *  - Blue band:   Sharp event-text render zone (renderZoneStart–renderZoneEnd%)
 *  - Info panel:  All key pixel values printed top-right for quick verification
 */

import sharp from 'sharp'

export interface ZoneDebugConfig {
  /** Header forbidden zone threshold (default: 40) */
  headerEndPercent: number
  /** Footer forbidden zone start threshold (default: 65) */
  footerStartPercent: number
  /** Actual Sharp logo bar height in pixels (brand+vertical+initiative rows) */
  actualHeaderBarPx?: number
  /** Actual Sharp footer bar height in pixels */
  actualFooterBarPx?: number
  /** Sharp event-text render zone start % (default: 55) */
  renderZoneStart?: number
  /** Sharp event-text render zone end % (default: 70) */
  renderZoneEnd?: number
}

export async function addZoneDebugOverlay(
  imageBuffer: Buffer,
  config: ZoneDebugConfig
): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata()
  const W = meta.width!
  const H = meta.height!

  const {
    headerEndPercent,
    footerStartPercent,
    actualHeaderBarPx,
    actualFooterBarPx,
    renderZoneStart,
    renderZoneEnd,
  } = config

  // Threshold pixel boundaries (what spatial verifier enforces)
  const headerEndY   = Math.round(H * headerEndPercent  / 100)
  const footerStartY = Math.round(H * footerStartPercent / 100)
  const renderStartY = renderZoneStart != null ? Math.round(H * renderZoneStart / 100) : null
  const renderEndY   = renderZoneEnd   != null ? Math.round(H * renderZoneEnd   / 100) : null
  const contentMidY  = Math.round((headerEndY + footerStartY) / 2)

  // Actual bar heights (what Sharp physically draws)
  const actualHdrY = actualHeaderBarPx ?? null
  const actualFtrY = actualFooterBarPx != null ? H - actualFooterBarPx : null

  // Gap B: difference between actual bar bottom and threshold
  const gapBpx = actualHdrY != null ? headerEndY - actualHdrY : null

  // Info panel lines
  const infoLines = [
    `CANVAS: ${W}×${H}px`,
    `────────────────────────────`,
    `THRESHOLD header end:  ${headerEndY}px (${headerEndPercent}%)`,
    `THRESHOLD footer start: ${footerStartY}px (${footerStartPercent}%)`,
    `────────────────────────────`,
    actualHdrY != null ? `ACTUAL logo bar bottom: ${actualHdrY}px` : `ACTUAL logo bar: unknown`,
    actualFtrY != null ? `ACTUAL footer bar top:  ${actualFtrY}px` : `ACTUAL footer bar: unknown`,
    `────────────────────────────`,
    gapBpx != null
      ? `GAP B (dead zone): ${gapBpx}px ← content here is FINE`
      : `GAP B: N/A`,
    `────────────────────────────`,
    renderStartY != null ? `Sharp render zone: ${renderStartY}–${renderEndY}px` : ``,
    `CONTENT ZONE: ${headerEndY}–${footerStartY}px`,
  ].filter(Boolean)

  const lh = 22   // line height
  const panelW = 320
  const panelH = infoLines.length * lh + 16
  const panelX = W - panelW - 8
  const panelY = 8

  const infoPanel = `
    <rect x="${panelX}" y="${panelY}" width="${panelW}" height="${panelH}" rx="6" fill="rgba(0,0,0,0.82)"/>
    ${infoLines.map((line, i) => `
      <text x="${panelX + 10}" y="${panelY + 20 + i * lh}"
            font-family="monospace" font-size="14" font-weight="${line.startsWith('─') ? 'normal' : 'bold'}"
            fill="${line.includes('GAP B') ? '#ffaa00' : line.includes('ACTUAL') ? '#ff9933' : line.includes('THRESHOLD') ? '#ff6666' : line.includes('CONTENT') || line.includes('Sharp render') ? '#66ff88' : '#dddddd'}">${line}</text>
    `).join('')}
  `

  const renderZoneSVG = (renderStartY !== null && renderEndY !== null) ? `
    <rect x="0" y="${renderStartY}" width="${W}" height="${renderEndY - renderStartY}"
          fill="rgba(30,100,255,0.13)"/>
    <line x1="0" y1="${renderStartY}" x2="${W}" y2="${renderStartY}"
          stroke="rgba(80,160,255,0.9)" stroke-width="2" stroke-dasharray="14,7"/>
    <line x1="0" y1="${renderEndY}" x2="${W}" y2="${renderEndY}"
          stroke="rgba(80,160,255,0.9)" stroke-width="2" stroke-dasharray="14,7"/>
    <rect x="8" y="${renderStartY + 6}" width="310" height="26" rx="4" fill="rgba(0,0,0,0.75)"/>
    <text x="16" y="${renderStartY + 24}" font-family="monospace" font-size="16" font-weight="bold"
          fill="rgba(100,180,255,1)">Sharp text: y=${renderStartY}px–${renderEndY}px (${renderZoneStart}–${renderZoneEnd}%)</text>
  ` : ''

  // Actual logo bar line (orange) — where the bar ACTUALLY ends
  const actualBarSVG = actualHdrY != null ? `
    <line x1="0" y1="${actualHdrY}" x2="${W}" y2="${actualHdrY}"
          stroke="rgba(255,160,0,0.95)" stroke-width="3" stroke-dasharray="8,5"/>
    <rect x="8" y="${actualHdrY - 30}" width="360" height="26" rx="4" fill="rgba(0,0,0,0.85)"/>
    <text x="16" y="${actualHdrY - 12}" font-family="monospace" font-size="16" font-weight="bold"
          fill="rgba(255,160,0,1)">ACTUAL logo bar bottom = ${actualHdrY}px  (threshold=${headerEndY}px, gap=${gapBpx}px)</text>
  ` : ''

  const actualFtrSVG = actualFtrY != null ? `
    <line x1="0" y1="${actualFtrY}" x2="${W}" y2="${actualFtrY}"
          stroke="rgba(255,160,0,0.95)" stroke-width="3" stroke-dasharray="8,5"/>
    <rect x="8" y="${actualFtrY + 4}" width="280" height="26" rx="4" fill="rgba(0,0,0,0.85)"/>
    <text x="16" y="${actualFtrY + 22}" font-family="monospace" font-size="16" font-weight="bold"
          fill="rgba(255,160,0,1)">ACTUAL footer bar top = ${actualFtrY}px</text>
  ` : ''

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">

  <!-- FORBIDDEN ZONES (red tint) -->
  <rect x="0" y="0" width="${W}" height="${headerEndY}" fill="rgba(255,40,40,0.18)"/>
  <rect x="0" y="${footerStartY}" width="${W}" height="${H - footerStartY}" fill="rgba(255,40,40,0.18)"/>

  <!-- CONTENT ZONE (green tint) -->
  <rect x="0" y="${headerEndY}" width="${W}" height="${footerStartY - headerEndY}" fill="rgba(40,220,80,0.08)"/>

  ${renderZoneSVG}

  <!-- HEADER THRESHOLD LINE (red dashed) -->
  <line x1="0" y1="${headerEndY}" x2="${W}" y2="${headerEndY}"
        stroke="rgba(255,60,60,1)" stroke-width="3" stroke-dasharray="22,9"/>
  <rect x="8" y="${headerEndY - 34}" width="340" height="30" rx="5" fill="rgba(0,0,0,0.85)"/>
  <text x="16" y="${headerEndY - 12}" font-family="monospace" font-size="20" font-weight="bold"
        fill="#ff4444">THRESHOLD: y=${headerEndY}px = ${headerEndPercent}% ▲ header forbidden end</text>

  <!-- FOOTER THRESHOLD LINE (red dashed) -->
  <line x1="0" y1="${footerStartY}" x2="${W}" y2="${footerStartY}"
        stroke="rgba(255,60,60,1)" stroke-width="3" stroke-dasharray="22,9"/>
  <rect x="8" y="${footerStartY + 4}" width="340" height="30" rx="5" fill="rgba(0,0,0,0.85)"/>
  <text x="16" y="${footerStartY + 26}" font-family="monospace" font-size="20" font-weight="bold"
        fill="#ff4444">THRESHOLD: y=${footerStartY}px = ${footerStartPercent}% ▼ footer forbidden start</text>

  ${actualBarSVG}
  ${actualFtrSVG}

  <!-- CORNER LABELS -->
  <rect x="8" y="8" width="270" height="32" rx="5" fill="rgba(0,0,0,0.78)"/>
  <text x="18" y="30" font-family="monospace" font-size="20" font-weight="bold"
        fill="#ff5555">FORBIDDEN  0px → ${headerEndY}px</text>

  <rect x="8" y="${contentMidY - 20}" width="310" height="32" rx="5" fill="rgba(0,0,0,0.65)"/>
  <text x="18" y="${contentMidY + 4}" font-family="monospace" font-size="20" font-weight="bold"
        fill="#44ff88">CONTENT  ${headerEndY}px → ${footerStartY}px</text>

  <rect x="8" y="${H - 44}" width="270" height="32" rx="5" fill="rgba(0,0,0,0.78)"/>
  <text x="18" y="${H - 20}" font-family="monospace" font-size="20" font-weight="bold"
        fill="#ff5555">FORBIDDEN  ${footerStartY}px → ${H}px</text>

  <!-- PIXEL RULER (right edge every 10%) -->
  ${[10, 20, 30, 40, 50, 60, 65, 70, 80, 90].map(pct => {
    const y = Math.round(H * pct / 100)
    const px = y
    return `
    <line x1="${W - 55}" y1="${y}" x2="${W}" y2="${y}" stroke="rgba(255,255,255,0.55)" stroke-width="1"/>
    <rect x="${W - 108}" y="${y - 14}" width="100" height="22" rx="3" fill="rgba(0,0,0,0.65)"/>
    <text x="${W - 104}" y="${y + 4}" font-family="monospace" font-size="14" font-weight="bold"
          fill="rgba(220,220,220,1)">${pct}%=${px}px</text>`
  }).join('')}

  <!-- INFO PANEL (top-right) -->
  ${infoPanel}

</svg>`

  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer()
}
