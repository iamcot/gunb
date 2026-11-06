import { Sprite, Texture } from 'pixi.js'
import { TerrainMask, type DirtyRect } from '@gunb/shared'

/** Địa hình trên màn hình: canvas màu + mask va chạm, luôn khoét cùng một hố. Có lớp phủ mask (F3) để đối chiếu. */
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

  /** Khoét hố: vòng cháy xém trên phần đất còn lại, rồi xoá hình tròn; mask khoét cùng tâm/bán kính. */
  carve(x: number, y: number, r: number): void {
    const c = this.ctx
    const cx = Math.round(x), cy = Math.round(y), cr = Math.round(r)
    c.save()
    c.globalCompositeOperation = 'source-atop'
    c.fillStyle = 'rgba(25,12,0,0.5)'
    c.beginPath(); c.arc(cx + 0.5, cy + 0.5, cr + 6, 0, Math.PI * 2); c.fill()
    c.globalCompositeOperation = 'destination-out'
    c.beginPath(); c.arc(cx + 0.5, cy + 0.5, cr + 0.5, 0, Math.PI * 2); c.fill()
    c.restore()
    this.sprite.texture.source.update()
    const d = this.mask.carveCircle(cx, cy, cr, this.dirty)
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
    for (let i = 0; i < m.data.length; i++) if (m.data[i] === 0) px[i * 4 + 3] = 0
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
