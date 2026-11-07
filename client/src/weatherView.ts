import { Container, Graphics, Sprite, Texture, TilingSprite } from 'pixi.js'
import { WEATHER_KINDS, WEATHER_NAMES, type Weather, type WeatherKind } from '@gunb/shared'

const DESC: Record<WeatherKind, string> = {
  whirl: 'đạn đi qua cột bị nâng lên',
  storm: 'đạn đi vào mây thì sét đánh xuống',
  mirror: 'gió bị đảo chiều trong dải nước',
  portal: 'đạn vào cổng này ra cổng kia',
}

/** Icon vẽ sẵn (SVG) cho chữ báo; có ảnh `assets/ui/hud/weather-<kind>.png` (plan/11-prompt-hud.md) thì dùng ảnh. */
const ICON_SVG: Record<WeatherKind, string> = {
  whirl: '<svg viewBox="0 0 32 32" fill="none" stroke="#2f7c2d" stroke-width="3" stroke-linecap="round"><path d="M4 6h24M7 11h18M10 16h13M12 21h9M14 26h5"/></svg>',
  storm: '<svg viewBox="0 0 32 32"><path d="M8 19a6 6 0 0 1 1-12 8 8 0 0 1 15 2 5 5 0 0 1 0 10z" fill="#7b8599" stroke="#4f3420" stroke-width="2"/><path d="M17 16l-5 8h4l-2 6 7-9h-4l2-5z" fill="#ffd25e" stroke="#4f3420" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  mirror: '<svg viewBox="0 0 32 32" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12q3-3 6 0t6 0 6 0 6 0M4 20q3-3 6 0t6 0 6 0 6 0" stroke="#3f86c4" stroke-width="2.5"/><path d="M9 5h14m-3-3 3 3-3 3M23 28H9m3-3-3 3 3 3" stroke="#d9573a" stroke-width="2"/></svg>',
  portal: '<svg viewBox="0 0 32 32" fill="none" stroke-width="3"><circle cx="10" cy="16" r="7" stroke="#fb923c"/><circle cx="22" cy="16" r="7" stroke="#a78bfa"/></svg>',
}
const iconArt = new Map<WeatherKind, string>()   // kind → url ảnh đã tải được
for (const k of WEATHER_KINDS) {
  const url = `/ui/hud/weather-${k}.png`
  const img = new Image()
  img.onload = () => iconArt.set(k, url)
  img.src = url
}

/** Icon HTML của một loại thời tiết (ảnh nếu đã tải được, không thì SVG vẽ sẵn) — dùng cho thanh trên (hud.ts). */
export function weatherIconHtml(kind: WeatherKind): string {
  const art = iconArt.get(kind)
  return art ? `<img src="${art}" alt="">` : ICON_SVG[kind]
}

/** Icon "trời quang" (lượt không có thời tiết): ảnh `assets/ui/hud/weather-clear.png` nếu có, không thì mặt trời SVG. */
const CLEAR_SVG = '<svg viewBox="0 0 32 32"><g stroke="#e8902a" stroke-width="2.5" stroke-linecap="round"><path d="M16 2v4M16 26v4M2 16h4M26 16h4M6 6l3 3M23 23l3 3M6 26l3-3M23 9l3-3"/></g><circle cx="16" cy="16" r="7" fill="#ffd25e" stroke="#7a5233" stroke-width="2"/></svg>'
let clearArt = ''
{ const img = new Image(); img.onload = () => { clearArt = img.src }; img.src = '/ui/hud/weather-clear.png' }
export function clearIconHtml(): string {
  return clearArt ? `<img src="${clearArt}" alt="">` : CLEAR_SVG
}

/** Ảnh hiệu ứng trong bản đồ (plan/13-prompt-thoi-tiet.md): dải lặp dọc cho cột lốc / gương nước; chưa có/chưa tải xong thì vẽ bằng code.
 *  `width` = bề ngang ảnh so với vùng ảnh hưởng, `speed` = px/s (âm = trôi lên). */
interface StripDef { url: string; width: number; speed: number; alpha: number; sway: number; swayHz: number; tex: Texture | null }
const STRIPS: Partial<Record<WeatherKind, StripDef>> = {
  whirl: { url: '/ui/weather/whirl-strip.png', width: 1.5, speed: -220, alpha: 0.85, sway: 0.08, swayHz: 0.6, tex: null },
  mirror: { url: '/ui/weather/mirror-strip.png', width: 1.15, speed: 90, alpha: 0.7, sway: 0.04, swayHz: 0.35, tex: null },
}
for (const d of Object.values(STRIPS)) {
  const img = new Image()
  img.onload = () => { d.tex = Texture.from(img) }
  img.src = d.url
}

/** Mây giông + tia sét bằng ảnh (thiếu file thì vẽ bằng code). Mây rộng CLOUD_ART_W × bề ngang khung mây; sét dài BOLT_ART_LEN px. */
const CLOUD_ART_W = 1.3, BOLT_ART_LEN = 330
let cloudTex: Texture | null = null, boltTex: Texture | null = null
{
  const c = new Image(); c.onload = () => { cloudTex = Texture.from(c) }; c.src = '/ui/weather/storm-cloud.png'
  const b = new Image(); b.onload = () => { boltTex = Texture.from(b) }; b.onerror = () => { /* chưa có ảnh sét: vẽ bằng code */ }; b.src = '/ui/weather/storm-bolt.png'
}

const ORANGE = 0xfb923c, PURPLE = 0xa78bfa
const LIGHTNING_EVERY = 2.4   // s giữa hai tia sét trang trí của Mây giông
const LIGHTNING_LEN = 0.28    // s mỗi lần loé
const BOLT_SEGS = 9
/** Cột lốc / gương nước vẽ thêm phía trên mép bản đồ (tỉ lệ chiều cao bản đồ): camera nhìn được lên trên tới nửa màn hình. */
const SKY_ABOVE = 1
/** Lá xoáy quanh cột lốc: cách nhau LEAF_GAP px theo chiều dọc, bay lên LEAF_RISE px/s, quay quanh cột LEAF_SPIN rad/s, dài LEAF_SIZE px. */
const LEAF_GAP = 45, LEAF_RISE = 260, LEAF_SPIN = 3.2, LEAF_SIZE = 20
/** Gương nước: một giọt mỗi DROP_GAP px, rơi DROP_FALL px/s; bong bóng nổi BUBBLE_RISE px/s. */
const DROP_GAP = 45, DROP_FALL = 380, BUBBLE_RISE = 60

/** Số giả ngẫu nhiên 0..1 từ một số nguyên (chỉ để vẽ, không phải gameplay). */
const hash01 = (n: number): number => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

/**
 * Vẽ sự kiện thời tiết của lượt (cột lốc, mây giông, gương nước, cổng đôi) + chữ báo trên HUD (bay từ giữa màn hình lên khi đổi).
 * Hoạt hình theo thời gian; chỉ để nhìn, vùng ảnh hưởng thật nằm ở shared/weather.ts.
 */
export class WeatherView {
  readonly container = new Container()
  private readonly g = new Graphics()
  private readonly label: HTMLElement
  private stripArt: TilingSprite | null = null
  private stripBack: TilingSprite | null = null   // lớp sau: cùng ảnh, lật ngang, trôi nhanh hơn, mờ hơn -> có chiều sâu
  private cloud: Sprite | null = null
  private bolt: Sprite | null = null
  private w: Weather | null = null
  private t = 0
  private lastKey = ''

  constructor(private readonly mapH: number) {
    this.container.addChild(this.g)
    this.label = document.createElement('div')
    this.label.id = 'weather'
    this.label.style.display = 'none'
    ;(document.getElementById('hud-top') ?? document.body).prepend(this.label)   // nằm trên vòng gió, đẩy vòng gió xuống (hud.ts)
  }

  /** Gọi mỗi frame với thời tiết hiện tại của lượt; chỉ cập nhật chữ khi đổi. */
  set(w: Weather | null, key: string): void {
    if (key === this.lastKey) return
    this.lastKey = key
    const changed = (w?.kind ?? null) !== (this.w?.kind ?? null) || w?.x !== this.w?.x
    this.w = w
    this.label.style.display = w ? 'flex' : 'none'
    if (!w) return
    this.label.innerHTML = `<div class="wx-ico">${weatherIconHtml(w.kind)}</div>` +
      `<div class="wx-txt"><b>${WEATHER_NAMES[w.kind]}</b><span>${DESC[w.kind]}</span></div>`
    this.label.className = `k-${w.kind}`
    if (changed) { void this.label.offsetWidth; this.label.classList.add('pop') }   // chạy lại hoạt ảnh báo
  }

  update(dt: number): void {
    this.t += dt
    const g = this.g, w = this.w
    g.clear()
    if (this.stripArt) this.stripArt.visible = false
    if (this.stripBack) this.stripBack.visible = false
    if (this.cloud) this.cloud.visible = false
    if (this.bolt) this.bolt.visible = false
    if (!w) return
    const strip = STRIPS[w.kind]
    if (strip?.tex) { this.drawStripArt(w, strip, strip.tex); return }
    switch (w.kind) {
      case 'whirl': this.drawWhirl(g, w); break
      case 'storm': this.drawStorm(g, w); break
      case 'mirror': this.drawMirror(g, w); break
      case 'portal': this.drawPortal(g, w.x, w.y, w.hw, ORANGE, 1); this.drawPortal(g, w.x2, w.y2, w.hw, PURPLE, -1); this.drawLink(g, w); break
    }
  }

  /** Cột lốc / gương nước bằng ảnh: hai lớp dải lặp dọc phủ từ trên mép bản đồ tới đáy, trôi theo `speed`, lắc nhẹ ngang;
   *  thêm lá xoáy quanh cột (lốc) hoặc giọt nước + bong bóng (gương) vẽ bằng code cho có chuyển động. */
  private drawStripArt(w: Weather, d: StripDef, tex: Texture): void {
    if (!this.stripArt || !this.stripBack) {
      this.stripBack = new TilingSprite({ texture: tex, width: 1, height: 1 })
      this.stripArt = new TilingSprite({ texture: tex, width: 1, height: 1 })
      this.container.addChildAt(this.stripBack, 0)
      this.container.addChildAt(this.stripArt, 1)
    }
    const t = this.t, H = this.mapH * (1 + SKY_ABOVE), top = -this.mapH * SKY_ABOVE
    const width = w.hw * 2 * d.width, k = width / tex.width, tileH = tex.height * k
    const sway = Math.sin(t * d.swayHz * Math.PI * 2) * w.hw * d.sway
    const a = this.stripArt
    if (a.texture !== tex) a.texture = tex
    a.visible = true
    a.alpha = d.alpha
    a.position.set(w.x - width / 2 + sway, top)
    a.width = width; a.height = H
    a.tileScale.set(k, k)
    a.tilePosition.set(0, ((t * d.speed) % tileH + tileH) % tileH)
    // lớp sau: hẹp hơn chút, lật ngang (scale.x âm, neo ở mép phải), lắc ngược pha
    const b = this.stripBack, bw = width * 0.85, bk = bw / tex.width, bH = tex.height * bk
    if (b.texture !== tex) b.texture = tex
    b.visible = true
    b.alpha = d.alpha * 0.45
    b.position.set(w.x + bw / 2 - sway, top)
    b.width = bw; b.height = H
    b.scale.x = -1
    b.tileScale.set(bk, bk)
    b.tilePosition.set(0, ((t * d.speed * 1.6 + bH * 0.37) % bH + bH) % bH)
    this.g.rect(w.x - w.hw, top, w.hw * 2, H).fill({ color: 0xffffff, alpha: 0.06 })   // vùng ảnh hưởng thật
    if (w.kind === 'whirl') this.drawWhirlLeaves(w, top, H, sway)
    else if (w.kind === 'mirror') this.drawDrops(w, top, H, sway)
  }

  /** Lá + vệt gió xoắn ốc quanh cột lốc, bay lên; lá phía sau cột nhỏ và mờ hơn. */
  private drawWhirlLeaves(w: Weather, top: number, H: number, sway: number): void {
    const g = this.g, t = this.t, hw = w.hw, n = Math.ceil(H / LEAF_GAP)
    for (let i = 0; i < n; i++) {
      const yy = ((i * LEAF_GAP + hash01(i) * LEAF_GAP - t * LEAF_RISE) % H + H) % H, y = top + yy
      const ang = t * LEAF_SPIN + i * 2.4
      const depth = Math.cos(ang)                       // 1 = phía trước cột
      const cx = w.x + sway + Math.sin(ang) * hw * (1.05 + 0.25 * hash01(i + 9))
      if (i % 3 === 0) {                                // vệt gió cong theo vòng xoắn
        const a2 = ang - 0.7, x2 = w.x + sway + Math.sin(a2) * hw * 0.85, y2 = y + 22
        const am = ang - 0.35, xm = w.x + sway + Math.sin(am) * hw * 1.05
        g.moveTo(cx, y).quadraticCurveTo(xm, y + 11, x2, y2).stroke({ color: 0xffffff, width: 3, alpha: 0.25 + 0.35 * Math.max(0, depth), cap: 'round' })
        continue
      }
      const sz = LEAF_SIZE * (0.75 + 0.25 * depth) * (0.8 + 0.4 * hash01(i + 3))
      const rot = t * 5 * (hash01(i + 5) < 0.5 ? -1 : 1) + i
      const flat = 0.5 + 0.5 * Math.abs(Math.sin(t * 6 + i))   // lá lật -> nhìn dẹt lại
      const ux = Math.cos(rot) * sz, uy = Math.sin(rot) * sz, vx = -uy * 1.1 * flat, vy = ux * 1.1 * flat
      g.moveTo(cx + ux, y + uy).quadraticCurveTo(cx + vx, y + vy, cx - ux, y - uy).quadraticCurveTo(cx - vx, y - vy, cx + ux, y + uy)
        .fill({ color: hash01(i + 1) < 0.65 ? 0x7cc66a : 0xf08a64, alpha: depth > 0 ? 1 : 0.5 })
        .stroke({ color: 0x5a3b22, width: 1.5, alpha: depth > 0 ? 1 : 0.5 })
    }
  }

  /** Giọt nước rơi nhanh + bong bóng lắc lư nổi lên trong dải gương nước. */
  private drawDrops(w: Weather, top: number, H: number, sway: number): void {
    const g = this.g, t = this.t, hw = w.hw, n = Math.ceil(H / DROP_GAP)
    for (let i = 0; i < n; i++) {
      const x = w.x + sway + (hash01(i) * 2 - 1) * hw * 0.85
      const yy = ((i * DROP_GAP + hash01(i + 2) * DROP_GAP + t * DROP_FALL) % H + H) % H
      g.moveTo(x, top + yy).lineTo(x, top + yy + 14).stroke({ color: 0xffffff, width: 2, alpha: 0.55, cap: 'round' })
      if (i % 2 === 0) {
        const by = ((i * DROP_GAP - t * BUBBLE_RISE) % H + H) % H
        const bx = w.x + sway + (hash01(i + 7) * 2 - 1) * hw * 0.7 + Math.sin(t * 3 + i) * 6
        g.circle(bx, top + by, 3 + 3 * hash01(i + 4)).stroke({ color: 0xffffff, width: 1.5, alpha: 0.7 })
      }
    }
  }

  /** Cột lốc: cột sáng + phễu xoắn (vòng elip trôi lên, rộng dần lên trên) + mũi tên đi lên + lá cuốn quanh. */
  private drawWhirl(g: Graphics, w: Weather): void {
    const t = this.t, H = this.mapH * (1 + SKY_ABOVE), top = -this.mapH * SKY_ABOVE, x0 = w.x, hw = w.hw
    g.rect(x0 - hw, top, hw * 2, H).fill({ color: 0xffffff, alpha: 0.07 })
    g.rect(x0 - hw * 0.55, top, hw * 1.1, H).fill({ color: 0xe8fff0, alpha: 0.08 })
    const RINGS = Math.round(22 * (1 + SKY_ABOVE)), gap = H / RINGS
    for (let i = 0; i < RINGS; i++) {
      const yy = ((i * gap - t * 240) % H + H) % H, y = top + yy
      const up = 1 - yy / H                                  // 0 ở đáy, 1 ở đỉnh
      const rx = hw * (0.35 + 0.6 * up)
      const cx = x0 + Math.sin(t * 2.4 + y * 0.012) * hw * 0.22
      g.ellipse(cx, y, rx, 7 + up * 6).stroke({ color: 0xffffff, width: 3, alpha: 0.35 + 0.4 * Math.sin(Math.PI * up) })
    }
    for (let i = 0; i < 10; i++) {                           // mũi tên ^ trôi lên
      const yy = ((i * (H / 10) - t * 180) % H + H) % H, y = top + yy
      const a = 0.5 * Math.min(1, yy / 120, (H - yy) / 120)
      g.moveTo(x0 - 14, y + 12).lineTo(x0, y).lineTo(x0 + 14, y + 12).stroke({ color: 0xffffff, width: 4, alpha: a, cap: 'round', join: 'round' })
    }
    for (let i = 0; i < 16; i++) {                           // lá cuốn
      const yy = ((hash01(i) * H - t * (150 + i * 9)) % H + H) % H, y = top + yy
      const up = 1 - yy / H
      const ang = t * (3 + (i % 3)) + i * 1.7
      const rx = hw * (0.35 + 0.6 * up)
      const lx = x0 + Math.cos(ang) * rx
      const front = Math.sin(ang) > 0
      g.ellipse(lx, y + Math.sin(ang) * 6, 5, 2.5 + Math.abs(Math.cos(ang * 2)) * 2)
        .fill({ color: i % 3 === 0 ? 0xFF7A59 : i % 3 === 1 ? 0x46A843 : 0x8cc63f, alpha: front ? 0.95 : 0.45 })
    }
  }

  /** Mây giông: cụm mây hai tầng màu, mưa rơi dưới mây, tia sét loé theo nhịp. */
  private drawStorm(g: Graphics, w: Weather): void {
    const t = this.t, { x, y, hw, hh } = w
    const cycle = Math.floor(t / LIGHTNING_EVERY), inCycle = t - cycle * LIGHTNING_EVERY
    const flash = inCycle < LIGHTNING_LEN ? 1 - inCycle / LIGHTNING_LEN : 0
    let bottom = y + hh * 0.7
    if (cloudTex) {
      if (!this.cloud) { this.cloud = new Sprite(cloudTex); this.cloud.anchor.set(0.5, 0.5); this.container.addChild(this.cloud) }
      const c = this.cloud, cw = hw * 2 * CLOUD_ART_W, k = cw / cloudTex.width
      c.visible = true
      c.scale.set(k)
      c.position.set(x, y + Math.sin(t * 0.9) * 4)
      bottom = y + cloudTex.height * k * 0.38
    }
    // mưa
    const RAIN = 46, rainLen = 520
    for (let i = 0; i < RAIN; i++) {
      const rx = x - hw * 0.9 + hash01(i) * hw * 1.8
      const ry = bottom + ((hash01(i + 99) * rainLen + t * (520 + (i % 5) * 40)) % rainLen)
      const a = 0.45 * (1 - (ry - bottom) / rainLen)
      g.moveTo(rx, ry).lineTo(rx - 4, ry + 16).stroke({ color: 0xbfd9f2, width: 2, alpha: a })
    }
    // tia sét: ảnh nếu có, không thì đường gấp khúc cố định theo số lần loé
    if (flash > 0 && boltTex) {
      if (!this.bolt) { this.bolt = new Sprite(boltTex); this.bolt.anchor.set(0.5, 0); this.container.addChildAt(this.bolt, 0) }
      const b = this.bolt, k = BOLT_ART_LEN / boltTex.height
      b.visible = true
      b.scale.set(k * (hash01(cycle * 7) < 0.5 ? -1 : 1), k)
      b.position.set(x + (hash01(cycle) - 0.5) * hw, bottom - 10)
      b.alpha = flash
    } else if (flash > 0) {
      let bx = x + (hash01(cycle) - 0.5) * hw, by = bottom
      g.moveTo(bx, by)
      for (let k = 1; k <= BOLT_SEGS; k++) { bx += (hash01(cycle * 31 + k) - 0.5) * 46; by += 26 + hash01(cycle * 17 + k) * 16; g.lineTo(bx, by) }
      g.stroke({ color: 0xffd25e, width: 7, alpha: flash, join: 'round', cap: 'round' })
      bx = x + (hash01(cycle) - 0.5) * hw; by = bottom
      g.moveTo(bx, by)
      for (let k = 1; k <= BOLT_SEGS; k++) { bx += (hash01(cycle * 31 + k) - 0.5) * 46; by += 26 + hash01(cycle * 17 + k) * 16; g.lineTo(bx, by) }
      g.stroke({ color: 0xffffff, width: 2.5, alpha: flash, join: 'round', cap: 'round' })
    }
    if (cloudTex) return
    // mây: tầng tối dưới, tầng sáng trên, viền nâu như art của game
    const PUFFS = 7
    for (let i = 0; i < PUFFS; i++) {
      const f = i / (PUFFS - 1) - 0.5
      const px = x + f * hw * 1.7, py = y + Math.sin(t * 0.9 + i) * 4 + Math.abs(f) * hh * 0.5
      const r = hh * (1 - Math.abs(f) * 0.6)
      g.circle(px, py + 6, r).fill({ color: 0x4a5266 }).stroke({ color: 0x4f3420, width: 3, alpha: 0.6 })
    }
    for (let i = 0; i < PUFFS; i++) {
      const f = i / (PUFFS - 1) - 0.5
      const px = x + f * hw * 1.6, py = y - hh * 0.25 + Math.sin(t * 0.9 + i) * 4 + Math.abs(f) * hh * 0.5
      g.circle(px, py, hh * (0.8 - Math.abs(f) * 0.5)).fill({ color: 0x7b8599 })
    }
    for (let i = 1; i < PUFFS - 1; i += 2) {
      const f = i / (PUFFS - 1) - 0.5
      g.circle(x + f * hw * 1.5 - hh * 0.15, y - hh * 0.45 + Math.abs(f) * hh * 0.5, hh * 0.32).fill({ color: 0xa3adbf, alpha: 0.9 })
    }
    if (flash > 0) g.ellipse(x, y, hw * 1.05, hh * 1.1).fill({ color: 0xfff6d0, alpha: 0.35 * flash })
  }

  /** Gương nước: màn nước có hai mép gợn sóng, vệt sáng chảy xuống, bọt nổi lên, mũi tên hai chiều báo gió đảo. */
  private drawMirror(g: Graphics, w: Weather): void {
    const t = this.t, H = this.mapH * (1 + SKY_ABOVE), top = -this.mapH * SKY_ABOVE, x0 = w.x, hw = w.hw
    g.rect(x0 - hw, top, hw * 2, H).fill({ color: 0x6FB2E8, alpha: 0.18 })
    for (let s = -1; s <= 1; s += 2) {                       // mép gợn sóng
      g.moveTo(x0 + s * hw, top)
      for (let y = top; y <= top + H; y += 24) g.lineTo(x0 + s * (hw + Math.sin(t * 2.2 + y * 0.03) * 5), y)
      g.stroke({ color: 0xd6ebfa, width: 3, alpha: 0.75 })
    }
    for (let i = 0; i < 6; i++) {                            // vệt sáng chảy xuống
      const lx = x0 - hw * 0.8 + (i / 5) * hw * 1.6
      const y = top + ((hash01(i + 7) * H + t * (90 + i * 15)) % H)
      g.moveTo(lx, y).lineTo(lx, y + 70).stroke({ color: 0xffffff, width: 3, alpha: 0.28 })
    }
    for (let i = 0; i < 18; i++) {                           // bọt
      const y = top + ((hash01(i + 40) * H - t * (40 + (i % 4) * 12)) % H + H) % H
      const bx = x0 + (hash01(i + 3) - 0.5) * hw * 1.6 + Math.sin(t * 2 + i) * 6
      g.circle(bx, y, 2 + (i % 3) * 1.5).stroke({ color: 0xffffff, width: 1.5, alpha: 0.6 })
    }
    for (let k = 0; k < 4; k++) {                            // ⇄ gió đảo chiều
      const y = top + H * (0.15 + k * 0.22) + Math.sin(t * 1.5 + k) * 6
      const a = 0.55 + 0.25 * Math.sin(t * 3 + k)
      const L = hw * 0.55
      g.moveTo(x0 - L, y - 6).lineTo(x0 + L, y - 6).moveTo(x0 + L - 8, y - 12).lineTo(x0 + L, y - 6).lineTo(x0 + L - 8, y)
        .stroke({ color: 0xffffff, width: 3, alpha: a, cap: 'round', join: 'round' })
      g.moveTo(x0 + L, y + 8).lineTo(x0 - L, y + 8).moveTo(x0 - L + 8, y + 2).lineTo(x0 - L, y + 8).lineTo(x0 - L + 8, y + 14)
        .stroke({ color: 0xFF7A59, width: 3, alpha: a, cap: 'round', join: 'round' })
    }
  }

  /** Một cổng: quầng sáng, vành nét đứt xoay, 3 nhánh xoắn ốc, hạt bị hút vào tâm. `spin` = chiều xoay. */
  private drawPortal(g: Graphics, x: number, y: number, r: number, c: number, spin: 1 | -1): void {
    const t = this.t
    g.circle(x, y, r * 1.45).fill({ color: c, alpha: 0.1 })
    g.circle(x, y, r * 1.15).fill({ color: c, alpha: 0.14 })
    g.circle(x, y, r).fill({ color: 0x2a1f3d, alpha: 0.35 })
    for (let arm = 0; arm < 3; arm++) {
      const base = spin * t * 3 + (arm * Math.PI * 2) / 3
      g.moveTo(x + Math.cos(base) * r * 0.15, y + Math.sin(base) * r * 0.15)
      for (let k = 1; k <= 10; k++) {
        const f = 0.15 + (k / 10) * 0.85, a = base + spin * f * 2.6
        g.lineTo(x + Math.cos(a) * r * f, y + Math.sin(a) * r * f)
      }
      g.stroke({ color: 0xffffff, width: 3, alpha: 0.65, cap: 'round' })
    }
    const DASH = 10
    for (let i = 0; i < DASH; i++) {
      const a0 = spin * t * 1.2 + (i * Math.PI * 2) / DASH
      g.moveTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r).arc(x, y, r, a0, a0 + (Math.PI * 2) / DASH * 0.6)
    }
    g.stroke({ color: c, width: 5, alpha: 0.95, cap: 'round' })
    g.circle(x, y, r + 4).stroke({ color: 0x4f3420, width: 2, alpha: 0.5 })
    for (let i = 0; i < 8; i++) {
      const f = 1 - ((t * 0.7 + i / 8) % 1), a = i * 2.4 + spin * t
      g.circle(x + Math.cos(a) * r * 1.4 * f, y + Math.sin(a) * r * 1.4 * f, 2.5 * f + 1).fill({ color: c, alpha: 0.9 * f })
    }
    g.circle(x, y, r * (0.18 + 0.06 * Math.sin(t * 6))).fill({ color: 0xffffff, alpha: 0.85 })
  }

  /** Chấm mờ nối hai cổng để người chơi biết cặp cổng thông nhau. */
  private drawLink(g: Graphics, w: Weather): void {
    const dx = w.x2 - w.x, dy = w.y2 - w.y, len = Math.hypot(dx, dy)
    const n = Math.floor(len / 22), off = (this.t * 0.8) % 1
    for (let i = 1; i < n; i++) {
      const f = (i + off) / n
      g.circle(w.x + dx * f, w.y + dy * f, 2.5).fill({ color: 0xffffff, alpha: 0.3 })
    }
  }

  destroy(): void {
    this.label.remove()
    this.container.destroy({ children: true })
  }
}
