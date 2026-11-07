import { Sprite, Texture } from 'pixi.js'
import { TerrainMask, type DirtyRect } from '@gunb/shared'

/** Địa hình trên màn hình: canvas màu + mask va chạm, luôn khoét cùng một hố. Có lớp phủ mask (F3) để đối chiếu. */
const DIRT = [0x8a, 0x5a, 0x36] as const   // màu đất đắp khi chưa có vân
/** Viền cháy xém quanh hố: bề rộng (px) và màu. */
const CRATER_RIM = 12
const SCORCH = [34, 18, 8] as const
/** Đất đắp (Rùa Thành): tô bằng vân đất lặp `assets/textures/dirt-tile.png`, mép tối dày FILL_RIM px, mặt trên phủ cỏ dày FILL_GRASS px. */
const DIRT_TILE_URL = '/textures/dirt-tile.png'
const FILL_RIM = 2, FILL_GRASS = 5
const RIM_SHADE = 0.55
const GRASS = [86, 168, 58] as const, GRASS_DARK = [52, 118, 40] as const

/** Vân đất dùng chung (tải một lần); chưa tải xong thì đất đắp tô màu DIRT. */
let dirtTile: ImageData | null = null
let dirtLoading = false
function loadDirtTile(): void {
  if (dirtLoading) return
  dirtLoading = true
  const img = new Image()
  img.src = DIRT_TILE_URL
  img.decode().then(() => {
    const c = document.createElement('canvas')
    c.width = img.naturalWidth; c.height = img.naturalHeight
    const g = c.getContext('2d')!
    g.drawImage(img, 0, 0)
    dirtTile = g.getImageData(0, 0, c.width, c.height)
  }).catch(() => console.warn('[terrain] không tải được', DIRT_TILE_URL))
}

export class TerrainView {
  readonly canvas: HTMLCanvasElement
  readonly mask: TerrainMask
  readonly sprite: Sprite
  readonly maskSprite: Sprite
  private readonly ctx: CanvasRenderingContext2D
  private readonly overlayCtx: CanvasRenderingContext2D
  private readonly overlayImg: ImageData
  private readonly original: ImageData
  private readonly originalMask: TerrainMask
  private readonly dirty: DirtyRect = { x0: 0, y0: 0, x1: 0, y1: 0 }
  /** 1 = điểm ảnh thuộc đất đắp (để vẽ lại mép/cỏ khi đắp chồng). */
  private readonly filled: Uint8Array

  constructor(img: HTMLImageElement, width: number, height: number) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
    this.ctx.drawImage(img, 0, 0)
    this.filled = new Uint8Array(width * height)
    loadDirtTile()
    this.original = this.ctx.getImageData(0, 0, width, height)
    this.mask = TerrainMask.fromAlpha(width, height, this.original.data)
    this.originalMask = this.mask.clone()
    this.sprite = new Sprite(Texture.from(this.canvas))

    const oc = document.createElement('canvas')
    oc.width = width
    oc.height = height
    this.overlayCtx = oc.getContext('2d', { willReadFrequently: true })!
    this.overlayImg = this.overlayCtx.createImageData(width, height)
    this.paintOverlay(0, 0, width, height)
    this.maskSprite = new Sprite(Texture.from(oc))
    this.maskSprite.visible = false
  }

  /**
   * Khoét hố: mask khoét trước, rồi xử lý từng điểm ảnh quanh hố theo đúng mask (không khử răng cưa bằng alpha,
   * nên mép hố sắc, không còn viền mờ bán trong suốt): ô trống → trong suốt hẳn; ô đất sát mép → viền tối 1–2 px;
   * xa dần → cháy xém nhạt dần, có lốm đốm.
   */
  carve(x: number, y: number, r: number): void {
    const cx = Math.round(x), cy = Math.round(y), cr = Math.round(r)
    const d = this.mask.carveCircle(cx, cy, cr, this.dirty)
    this.paintCrater(cx, cy, cr)
    if (d.x1 > d.x0 && d.y1 > d.y0) {
      this.paintOverlay(d.x0, d.y0, d.x1, d.y1)
      this.maskSprite.texture.source.update()
    }
  }

  private paintCrater(cx: number, cy: number, cr: number): void {
    const W = this.mask.width, H = this.mask.height, m = this.mask.data
    const R = cr + CRATER_RIM + 1
    const x0 = Math.max(0, cx - R), y0 = Math.max(0, cy - R), x1 = Math.min(W, cx + R + 1), y1 = Math.min(H, cy + R + 1)
    if (x1 <= x0 || y1 <= y0) return
    const img = this.ctx.getImageData(x0, y0, x1 - x0, y1 - y0)
    const px = img.data, bw = x1 - x0
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = ((y - y0) * bw + (x - x0)) * 4
        if (m[y * W + x] === 0) { px[i + 3] = 0; continue }
        const dx = x - cx, dy = y - cy
        const e = Math.sqrt(dx * dx + dy * dy) - cr   // khoảng cách tới mép hố
        if (e > CRATER_RIM) continue
        // mép: ô đất có ô trống kề bên → viền tối
        const edge = (x > 0 && m[y * W + x - 1] === 0) || (x < W - 1 && m[y * W + x + 1] === 0) ||
          (y > 0 && m[(y - 1) * W + x] === 0) || (y < H - 1 && m[(y + 1) * W + x] === 0)
        let k: number
        if (edge) k = 0.72
        else if (e < 2.5) k = 0.5
        else {
          const f = 1 - (e - 2.5) / (CRATER_RIM - 2.5)
          const n = ((x * 73856093) ^ (y * 19349663)) & 1023   // lốm đốm cố định theo vị trí
          k = 0.6 * f * f * (0.6 + 0.8 * n / 1023)
        }
        px[i] = px[i]! + (SCORCH[0] - px[i]!) * k
        px[i + 1] = px[i + 1]! + (SCORCH[1] - px[i + 1]!) * k
        px[i + 2] = px[i + 2]! + (SCORCH[2] - px[i + 2]!) * k
        px[i + 3] = 255
      }
    }
    this.ctx.putImageData(img, x0, y0)
    this.sprite.texture.source.update()
  }

  /** Màu đất trung bình quanh điểm nổ (lấy từ ảnh gốc) để tô mảnh đất văng ra; null nếu xung quanh toàn không khí. */
  sampleColor(x: number, y: number, r: number): number | null {
    const W = this.mask.width, H = this.mask.height, d = this.original.data
    let sr = 0, sg = 0, sb = 0, n = 0
    for (let k = 0; k < 7; k++) {
      const a = Math.PI * (k / 6)   // nửa dưới vụ nổ (trục Y hướng xuống)
      const px = Math.round(x + Math.cos(a) * r * 0.7), py = Math.round(y + Math.sin(a) * r * 0.7)
      if (px < 0 || py < 0 || px >= W || py >= H) continue
      const i = (py * W + px) * 4
      if (d[i + 3]! < 128) continue
      sr += d[i]!; sg += d[i + 1]!; sb += d[i + 2]!; n++
    }
    if (n === 0) return null
    return ((sr / n) << 16) | ((sg / n) << 8) | (sb / n | 0)
  }

  /** Đắp đất (Rùa Thành): mask đắp hình tròn, rồi tô lại cả vùng đất đắp quanh đó bằng vân đất + mép tối + cỏ ở mặt trên
   *  (tô lại cả vùng để các vòng đắp chồng liền nhau, không có viền bên trong). */
  fill(x: number, y: number, r: number): void {
    const cx = Math.round(x), cy = Math.round(y), cr = Math.round(r)
    const W = this.mask.width, H = this.mask.height
    const x0 = Math.max(0, cx - cr), x1 = Math.min(W, cx + cr + 1), y0 = Math.max(0, cy - cr), y1 = Math.min(H, cy + cr + 1)
    for (let py = y0; py < y1; py++) for (let px = x0; px < x1; px++) {
      const dx = px - cx, dy = py - cy
      if (dx * dx + dy * dy <= cr * cr && !this.mask.isSolid(px, py)) this.filled[py * W + px] = 1
    }
    const d = this.mask.fillCircle(cx, cy, cr, this.dirty)
    // tô lại vùng rộng hơn một chút: mép/cỏ của vòng cũ có thể đổi khi vòng mới đè lên
    const pad = FILL_GRASS + 1
    const rx0 = Math.max(0, x0 - pad), ry0 = Math.max(0, y0 - pad), rx1 = Math.min(W, x1 + pad), ry1 = Math.min(H, y1 + pad)
    this.paintFilled(rx0, ry0, rx1, ry1)
    this.sprite.texture.source.update()
    if (d.x1 > d.x0 && d.y1 > d.y0) {
      this.paintOverlay(d.x0, d.y0, d.x1, d.y1)
      this.maskSprite.texture.source.update()
    }
  }

  private paintFilled(x0: number, y0: number, x1: number, y1: number): void {
    const w = x1 - x0, h = y1 - y0
    if (w <= 0 || h <= 0) return
    const img = this.ctx.getImageData(x0, y0, w, h), px = img.data
    const W = this.mask.width, m = this.mask
    const tile = dirtTile
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      if (!this.filled[y * W + x] || !m.isSolid(x, y)) continue
      const i = ((y - y0) * w + (x - x0)) * 4
      let grass = 0
      for (let k = 1; k <= FILL_GRASS; k++) if (!m.isSolid(x, y - k)) { grass = k; break }
      let rim = false
      for (let k = 1; k <= FILL_RIM && !rim; k++) rim = !m.isSolid(x - k, y) || !m.isSolid(x + k, y) || !m.isSolid(x, y + k)
      if (grass) {
        const g = grass === FILL_GRASS || (x * 7 + y * 3) % 5 === 0 ? GRASS_DARK : GRASS
        px[i] = g[0]; px[i + 1] = g[1]; px[i + 2] = g[2]; px[i + 3] = 255
        continue
      }
      let r: number = DIRT[0], gg: number = DIRT[1], b: number = DIRT[2]
      if (tile) {
        const t = ((y % tile.height) * tile.width + (x % tile.width)) * 4
        r = tile.data[t]!; gg = tile.data[t + 1]!; b = tile.data[t + 2]!
      }
      const k = rim ? RIM_SHADE : 1
      px[i] = r * k; px[i + 1] = gg * k; px[i + 2] = b * k; px[i + 3] = 255
    }
    this.ctx.putImageData(img, x0, y0)
  }

  /** Đưa địa hình về như ban đầu (phím R ở chế độ tập). */
  reset(): void {
    this.ctx.putImageData(this.original, 0, 0)
    this.filled.fill(0)
    this.mask.data.set(this.originalMask.data)
    this.sprite.texture.source.update()
    this.paintOverlay(0, 0, this.mask.width, this.mask.height)
    this.maskSprite.texture.source.update()
  }

  /** Dựng lại địa hình theo mask nhận từ server (vào lại trận, hoặc hash lệch): xoá điểm ảnh ở ô trống, giữ ảnh gốc ở ô đặc. */
  applyMask(m: TerrainMask): void {
    if (m.width !== this.mask.width || m.height !== this.mask.height) throw new Error('kích thước mask không khớp')
    const img = new ImageData(new Uint8ClampedArray(this.original.data), m.width, m.height)
    const px = img.data
    for (let i = 0; i < m.data.length; i++) {
      if (m.data[i] === 0) px[i * 4 + 3] = 0
      else if (px[i * 4 + 3]! <= 127) { px[i * 4] = 138; px[i * 4 + 1] = 90; px[i * 4 + 2] = 54; px[i * 4 + 3] = 255 }   // đất đắp thêm (không có trong ảnh gốc)
    }
    this.ctx.putImageData(img, 0, 0)
    this.mask.data.set(m.data)
    this.sprite.texture.source.update()
    this.paintOverlay(0, 0, m.width, m.height)
    this.maskSprite.texture.source.update()
  }

  private paintOverlay(x0: number, y0: number, x1: number, y1: number): void {
    const w = this.mask.width, px = this.overlayImg.data, m = this.mask.data
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 4
        const solid = m[y * w + x] === 1
        px[i] = 255; px[i + 1] = 0; px[i + 2] = 200; px[i + 3] = solid ? 110 : 0
      }
    }
    this.overlayCtx.putImageData(this.overlayImg, 0, 0, x0, y0, x1 - x0, y1 - y0)
  }
}
