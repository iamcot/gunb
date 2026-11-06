import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { MapFile } from '@gunb/shared'

interface Layer { sprite: Sprite; parallax: number; baseY: number; top: boolean }

/** Nền nhiều lớp phía sau bản đồ, cuộn chậm hơn địa hình (parallax). Dùng ảnh của bản đồ nếu có, không thì tự vẽ trời + núi xa + mây. */
export class Background {
  readonly container = new Container()
  private readonly layers: Layer[] = []
  private readonly sky = new Graphics()

  constructor(map: MapFile, images: HTMLImageElement[] | null, private viewW: number, private viewH: number) {
    this.container.addChild(this.sky)
    if (images && images.length === map.backgrounds.length && images.length > 0) {
      images.forEach((img, i) => this.addLayer(new Sprite(Texture.from(img)), map.backgrounds[i]!.parallax))
    } else {
      this.addLayer(new Sprite(Texture.from(clouds(map.width))), 0.15, true)
      this.addLayer(new Sprite(Texture.from(hills(map.width, 0x7aa6c9, 0.5, 220, 3))), 0.3)
      this.addLayer(new Sprite(Texture.from(hills(map.width, 0x5b8cb5, 0.7, 160, 7))), 0.5)
    }
    this.resize(viewW, viewH)
  }

  private addLayer(sprite: Sprite, parallax: number, top = false): void {
    this.container.addChild(sprite)
    this.layers.push({ sprite, parallax, baseY: 0, top })
  }

  resize(viewW: number, viewH: number): void {
    this.viewW = viewW; this.viewH = viewH
    this.sky.clear().rect(0, 0, viewW, viewH).fill({ color: 0x6fb2e8 })
    this.sky.rect(0, viewH * 0.55, viewW, viewH * 0.45).fill({ color: 0xcfe8fa, alpha: 0.9 })
    for (const l of this.layers) l.baseY = l.top ? 0 : viewH - l.sprite.height
  }

  /** Đặt vị trí các lớp theo camera (x, y là góc trên trái khung nhìn trong toạ độ bản đồ). */
  update(camX: number, camY: number): void {
    for (const l of this.layers) {
      l.sprite.x = -camX * l.parallax
      l.sprite.y = l.baseY - camY * l.parallax * 0.3
    }
  }
}

function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

/** Dải núi xa: tổng sin xác định (không dùng ngẫu nhiên), tô một màu. */
function hills(width: number, color: number, base: number, amp: number, k: number): HTMLCanvasElement {
  const h = 520, c = canvas(width, h), g = c.getContext('2d')!
  g.fillStyle = `#${color.toString(16).padStart(6, '0')}`
  g.beginPath(); g.moveTo(0, h)
  for (let x = 0; x <= width; x += 8) {
    const y = h * base + Math.sin(x / (170 + k * 25)) * amp * 0.35 + Math.sin(x / (61 + k * 9) + k) * amp * 0.12 + Math.sin(x / 400 + k * 2) * amp * 0.3
    g.lineTo(x, y)
  }
  g.lineTo(width, h); g.closePath(); g.fill()
  return c
}

/** Mây: vài cụm hình tròn mờ đặt theo công thức cố định. */
function clouds(width: number): HTMLCanvasElement {
  const h = 520, c = canvas(width, h), g = c.getContext('2d')!
  g.fillStyle = 'rgba(255,255,255,0.8)'
  for (let i = 0; i < 14; i++) {
    const cx = (i * 0.618033 % 1) * width, cy = 70 + ((i * 37) % 7) * 22
    for (let j = 0; j < 5; j++) { g.beginPath(); g.arc(cx + j * 34 - 68, cy + (j % 2) * 8, 26 + (j % 3) * 8, 0, Math.PI * 2); g.fill() }
  }
  return c
}
