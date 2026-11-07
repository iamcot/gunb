import { Sprite, Texture } from 'pixi.js'
import { TerrainMask, type DirtyRect } from '@gunb/shared'

/** Địa hình trên màn hình: canvas màu + mask va chạm, luôn khoét cùng một hố. Có lớp phủ mask (F3) để đối chiếu. */
const DIRT = '#8a5a36'
/** Viền cháy xém quanh hố: bề rộng (px) và màu. */
const CRATER_RIM = 12
const SCORCH = [34, 18, 8] as const

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

  constructor(img: HTMLImageElement, width: number, height: number) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
    this.ctx.drawImage(img, 0, 0)
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

  /** Đắp đất (Rùa Thành): vẽ hình tròn đất + vòng cỏ mỏng, mask đắp cùng tâm/bán kính. */
  fill(x: number, y: number, r: number): void {
    const c = this.ctx
    const cx = Math.round(x), cy = Math.round(y), cr = Math.round(r)
    c.save()
    c.fillStyle = DIRT
    c.beginPath(); c.arc(cx + 0.5, cy + 0.5, cr + 0.5, 0, Math.PI * 2); c.fill()
    c.strokeStyle = 'rgba(70,160,60,0.9)'; c.lineWidth = 3
    c.beginPath(); c.arc(cx + 0.5, cy + 0.5, cr - 1, Math.PI * 1.1, Math.PI * 1.9); c.stroke()
    c.restore()
    this.sprite.texture.source.update()
    const d = this.mask.fillCircle(cx, cy, cr, this.dirty)
    if (d.x1 > d.x0 && d.y1 > d.y0) {
      this.paintOverlay(d.x0, d.y0, d.x1, d.y1)
      this.maskSprite.texture.source.update()
    }
  }

  /** Đưa địa hình về như ban đầu (phím R ở chế độ tập). */
  reset(): void {
    this.ctx.putImageData(this.original, 0, 0)
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
