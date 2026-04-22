#!/usr/bin/env python3
"""Signal Archaeology — Spectral Notation Canvas"""

from PIL import Image, ImageDraw, ImageFont
import random, math

random.seed(2024)

W, H = 2400, 3200
M = 140

FONTS = r"C:\Users\Admin\.claude\plugins\cache\anthropic-agent-skills\example-skills\00756142ab04\skills\canvas-design\canvas-fonts"

BG       = (8, 10, 18)
INDIGO   = (58, 54, 186)
INDIGO_M = (84, 82, 206)
AMBER    = (222, 165, 82)
AMBER_LT = (242, 206, 150)
CYAN     = (74, 206, 194)
WHITE_W  = (226, 224, 212)
GHOST    = (126, 129, 144)

def lc(c1, c2, t):
    t = max(0.0, min(1.0, t))
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def nl():
    return Image.new('RGBA', (W, H), (0, 0, 0, 0))

def ac(base, layer):
    return Image.alpha_composite(base, layer)

def ton(text, font, x, y, color, alpha):
    l = nl()
    ImageDraw.Draw(l).text((x, y), text, font=font, fill=(*color, alpha))
    return l

base = Image.new('RGBA', (W, H), (*BG, 255))

# GRAIN
gl = nl(); gd = ImageDraw.Draw(gl)
for _ in range(55000):
    gd.point(
        (random.randint(0, W-1), random.randint(0, H-1)),
        fill=(random.randint(14, 26), random.randint(14, 26), random.randint(16, 28), random.randint(5, 16))
    )
base = ac(base, gl)

# VERTICAL GUIDES
vl = nl(); vd = ImageDraw.Draw(vl)
for i in range(1, 12):
    vx = M + int((W - 2*M) * i / 12)
    a = 30 if i % 3 == 0 else 11
    vd.line([(vx, M+90), (vx, H-M-90)], fill=(*GHOST, a), width=1)
base = ac(base, vl)

# SPECTRAL BANDS
zone_top = int(H * 0.205)
zone_bot = int(H * 0.795)
zone_h   = zone_bot - zone_top

bl = nl(); bd = ImageDraw.Draw(bl)
n_bands = 82
for i in range(n_bands):
    t = i / (n_bands - 1)
    y = zone_top + int(t * zone_h) + random.randint(-3, 3)
    bh = random.choice([1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 6, 7, 8, 10, 12, 15, 20])

    if t < 0.28:
        col = lc(INDIGO, INDIGO_M, t / 0.28)
    elif t < 0.52:
        col = lc(INDIGO_M, AMBER, (t - 0.28) / 0.24)
    elif t < 0.73:
        col = lc(AMBER, AMBER_LT, (t - 0.52) / 0.21)
    else:
        col = lc(AMBER_LT, CYAN, (t - 0.73) / 0.27)

    dist = abs(t - 0.5) * 2
    # Boost cyan zone (t > 0.70) so it reads against the dark background
    cyan_lift = max(0.0, 0.22 * (t - 0.68)) if t > 0.68 else 0
    a = int(255 * (0.04 + 0.78 * math.pow(1 - dist, 1.7) + cyan_lift))
    ml = random.choice([0, 0, 0, 0, M//4, M//2, M, int(M * 1.5)])
    mr = random.choice([0, 0, 0, 0, M//4, M//2, M, int(M * 1.5)])
    bd.rectangle([(ml, y), (W - mr, y + bh)], fill=(*col, a))
base = ac(base, bl)

# INTERFERENCE RINGS
rcx = W // 2
rcy = int(H * 0.50)

# Radial warmth glow at center
gw = nl(); gd2 = ImageDraw.Draw(gw)
for gi in range(30):
    gt = gi / 29
    gr2 = int(40 + gt * 420)
    gar = int(255 * 0.07 * (1 - gt)**2.2)
    if gar > 0:
        gd2.ellipse([(rcx-gr2, rcy-int(gr2*0.42)), (rcx+gr2, rcy+int(gr2*0.42))],
                    fill=(*lc(AMBER, AMBER_LT, gt), gar))
base = ac(base, gw)

rl = nl(); rd = ImageDraw.Draw(rl)
for ri in range(24):
    t = ri / 23
    rx = int(85 + t * 950)
    ry = int(40 + t * 390)
    # Innermost rings get stronger presence
    inner_boost = max(0, 0.28 * (1 - t * 3.5)) if ri < 6 else 0
    a = int(255 * (0.46 * (1 - t)**1.3 + 0.018 + inner_boost))
    col_r = lc(AMBER_LT, WHITE_W, t * 0.50)
    rd.ellipse([(rcx-rx, rcy-ry), (rcx+rx, rcy+ry)], outline=(*col_r, a), width=1)
rd.line([(rcx-18, rcy), (rcx+18, rcy)], fill=(*AMBER_LT, 52), width=1)
rd.line([(rcx, rcy-18), (rcx, rcy+18)], fill=(*AMBER_LT, 52), width=1)
rd.ellipse([(rcx-3, rcy-3), (rcx+3, rcy+3)], fill=(*AMBER_LT, 115))
base = ac(base, rl)

# SIGNAL NODES
nl_ = nl(); nd = ImageDraw.Draw(nl_)
node_cols = [INDIGO_M, AMBER, AMBER_LT, CYAN, WHITE_W]
for _ in range(145):
    nx = int(W/2 + random.gauss(0, W * 0.255))
    ny = int(zone_top + zone_h*0.5 + random.gauss(0, zone_h * 0.225))
    if M + 10 < nx < W - M - 10 and zone_top - 140 < ny < zone_bot + 140:
        nc = random.choice(node_cols)
        gr = random.randint(11, 32)
        nd.ellipse([(nx-gr, ny-gr), (nx+gr, ny+gr)], fill=(*nc, random.randint(9, 38)))
        cr = random.randint(2, 5)
        nd.ellipse([(nx-cr, ny-cr), (nx+cr, ny+cr)], fill=(*nc, random.randint(145, 230)))
base = ac(base, nl_)

# ANOMALY MARKERS + key frequency bands
kfl = nl(); kfd = ImageDraw.Draw(kfl)
key_freqs = [
    (0.18, 5), (0.35, 3), (0.50, 4), (0.65, 3), (0.82, 5),
]
for kft, kfh in key_freqs:
    ky = zone_top + int(kft * zone_h)
    if kft < 0.28:
        kc = lc(INDIGO, INDIGO_M, kft/0.28)
    elif kft < 0.52:
        kc = lc(INDIGO_M, AMBER, (kft-0.28)/0.24)
    elif kft < 0.73:
        kc = lc(AMBER, AMBER_LT, (kft-0.52)/0.21)
    else:
        kc = lc(AMBER_LT, CYAN, (kft-0.73)/0.27)
    kfd.rectangle([(M, ky), (W-M, ky+kfh)], fill=(*kc, 110))
base = ac(base, kfl)

al = nl(); ad = ImageDraw.Draw(al)
anomalies = [
    (W//2 - 320, int(H * 0.38)),
    (W//2 + 245, int(H * 0.58)),
    (W//2 - 75,  int(H * 0.47)),
]
for ax, ay in anomalies:
    ad.line([(ax-9, ay), (ax+9, ay)], fill=(*AMBER_LT, 80), width=1)
    ad.line([(ax, ay-9), (ax, ay+9)], fill=(*AMBER_LT, 80), width=1)
base = ac(base, al)

# FONTS
f_jura = ImageFont.truetype(f"{FONTS}/Jura-Light.ttf", 58)
f_dm   = ImageFont.truetype(f"{FONTS}/DMMono-Regular.ttf", 22)
f_dmxs = ImageFont.truetype(f"{FONTS}/DMMono-Regular.ttf", 18)
f_crim = ImageFont.truetype(f"{FONTS}/CrimsonPro-Italic.ttf", 52)

# TITLE
base = ac(base, ton("S I G N A L   A R C H A E O L O G Y", f_jura, M, M, WHITE_W, 200))
base = ac(base, ton("REF. 001.7 — A", f_dm, M, M + 74, GHOST, 112))

# Header rule
hl = nl(); hd = ImageDraw.Draw(hl)
hd.line([(M, M+112), (W-M, M+112)], fill=(*GHOST, 34), width=1)
base = ac(base, hl)

# ZONE MEASUREMENT LABELS (left) + tick marks along top/bottom zone edges
tl = nl(); td = ImageDraw.Draw(tl)
for tf, lbl in [(0,"λ 004.220"),(0.25,"λ 004.385"),(0.5,"λ 004.500"),(0.75,"λ 004.615"),(1,"λ 004.800")]:
    yz = zone_top + int(tf * zone_h)
    base = ac(base, ton(lbl, f_dmxs, M, yz - 14, GHOST, 80))
    td.line([(M+90, yz), (M+132, yz)], fill=(*GHOST, 40), width=1)
# Tick marks along top zone boundary (every col guide)
for i in range(0, 13):
    tx = M + int((W - 2*M) * i / 12)
    td.line([(tx, zone_top-6), (tx, zone_top)], fill=(*GHOST, 38), width=1)
    td.line([(tx, zone_bot), (tx, zone_bot+6)], fill=(*GHOST, 38), width=1)
# Zone boundary lines (very subtle)
td.line([(M, zone_top), (W-M, zone_top)], fill=(*GHOST, 22), width=1)
td.line([(M, zone_bot), (W-M, zone_bot)], fill=(*GHOST, 22), width=1)
# Center landmark — midpoint frequency rule (slightly more prominent)
center_y = zone_top + zone_h // 2
td.line([(M, center_y), (W-M, center_y)], fill=(*AMBER_LT, 38), width=1)
base = ac(base, tl)

# WAVELENGTH LABELS (above zone)
zone_w = W - 2*M
for j, wl in enumerate(["280 nm","320 nm","360 nm","400 nm","440 nm","480 nm","520 nm"]):
    wx = M + int(zone_w * j / 6)
    base = ac(base, ton(wl, f_dmxs, wx - 20, zone_top - 42, GHOST, 56))

# ITALIC PHRASE — centered
phrase = "residues of transmission"
tmp_d = ImageDraw.Draw(Image.new('RGB', (1, 1)))
bb = tmp_d.textbbox((0, 0), phrase, font=f_crim)
tw = bb[2] - bb[0]
base = ac(base, ton(phrase, f_crim, (W - tw) // 2, rcy + 142, AMBER_LT, 140))

# RIGHT MARGIN LABEL (rotated 90°)
rot_txt = "FREQUENCY  ANALYSIS  —  SERIES I"
tmp2_d = ImageDraw.Draw(Image.new('RGB', (1, 1)))
bb2 = tmp2_d.textbbox((0, 0), rot_txt, font=f_dmxs)
tw2, th2 = bb2[2] - bb2[0], bb2[3] - bb2[1]
rt_img = Image.new('RGBA', (tw2 + 20, th2 + 10), (0, 0, 0, 0))
ImageDraw.Draw(rt_img).text((10, 5), rot_txt, font=f_dmxs, fill=(*GHOST, 66))
rt_rot = rt_img.rotate(90, expand=True)
px = W - M + 18
py = (H - rt_rot.height) // 2
pl = nl()
pl.paste(rt_rot, (px, py))
base = ac(base, pl)

# FOOTER
fl = nl(); fd = ImageDraw.Draw(fl)
fd.line([(M, H-M-60), (W-M, H-M-60)], fill=(*GHOST, 34), width=1)
base = ac(base, fl)
base = ac(base, ton("SPECTRAL SURVEY  —  SERIES I", f_dm, M, H-M-40, GHOST, 86))
base = ac(base, ton("2026", f_dm, W-M-58, H-M-40, GHOST, 86))

# SAVE
out = r"C:\Users\Admin\Documents\GitHub\yicreatives-studio\signal-archaeology.png"
base.convert('RGB').save(out)
print(f"Saved: {out}")
