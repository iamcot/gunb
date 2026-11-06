import { Container, Graphics } from 'pixi.js'
import { WEATHER_NAMES, type Weather } from '@gunb/shared'

const DESC: Record<Weather['kind'], string> = {
  whirl: 'đạn đi qua cột bị nâng lên',
  storm: 'đạn đi vào mây thì sét đánh xuống',
  mirror: 'gió bị đảo chiều trong dải nước',
  portal: 'đạn vào cổng này ra cổng kia',
}

/** Vẽ sự kiện thời tiết của lượt (cột lốc, mây giông, gương nước, cổng đôi) + dòng chữ báo trên HUD. Hoạt hình theo thời gian. */
export class WeatherView {
  readonly container = new Container()
  private readonly g = new Graphics()
  private readonly label: HTMLElement
  private w: Weather | null = null
  private t = 0
  private lastKey = ''

  constructor(private readonly mapH: number) {
    this.container.addChild(this.g)
    this.label = document.createElement('div')
    this.label.id = 'weather'
    this.label.style.display = 'none'
    document.body.appendChild(this.label)
  }

  /** Gọi mỗi frame với thời tiết hiện tại của lượt; chỉ cập nhật chữ khi đổi. */
  set(w: Weather | null, key: string): void {
    if (key === this.lastKey) return
    this.lastKey = key
    this.w = w
    this.label.style.display = w ? 'block' : 'none'
    if (w) this.label.innerHTML = `<b>${WEATHER_NAMES[w.kind]}</b> · ${DESC[w.kind]}`
  }

  update(dt: number): void {
    this.t += dt
    const g = this.g, w = this.w
    g.clear()
    if (!w) return
    const t = this.t
    switch (w.kind) {
      case 'whirl': {
        g.rect(w.x - w.hw, 0, w.hw * 2, this.mapH).fill({ color: 0xffffff, alpha: 0.1 })
        for (let i = 0; i < 12; i++) {
          const y = ((i * 110 - t * 260) % this.mapH + this.mapH) % this.mapH
          const sway = Math.sin(t * 3 + i) * w.hw * 0.5
          g.ellipse(w.x + sway, y, w.hw * 0.7, 9).stroke({ color: 0xffffff, width: 3, alpha: 0.55 })
        }
        break
      }
      case 'mirror': {
        g.rect(w.x - w.hw, 0, w.hw * 2, this.mapH).fill({ color: 0x38bdf8, alpha: 0.16 })
        for (let i = 0; i < 14; i++) {
          const y = i * 90 + 20
          g.moveTo(w.x - w.hw, y)
          for (let k = 0; k <= 10; k++) g.lineTo(w.x - w.hw + (k * w.hw * 2) / 10, y + Math.sin(t * 2 + k + i) * 8)
          g.stroke({ color: 0xbae6fd, width: 2, alpha: 0.6 })
        }
        break
      }
      case 'storm': {
        for (let i = -3; i <= 3; i++) g.circle(w.x + i * (w.hw / 3.3), w.y + Math.sin(t + i) * 6 + Math.abs(i) * 5, w.hh * (1 - Math.abs(i) * 0.1)).fill({ color: 0x475569, alpha: 0.92 })
        if (Math.sin(t * 7) > 0.8) g.moveTo(w.x, w.y).lineTo(w.x - 14, w.y + 60).lineTo(w.x + 8, w.y + 55).lineTo(w.x - 6, w.y + 120).stroke({ color: 0xfde047, width: 4 })
        break
      }
      case 'portal': {
        for (const [x, y, c] of [[w.x, w.y, 0xfb923c], [w.x2, w.y2, 0xa78bfa]] as const) {
          g.circle(x, y, w.hw).fill({ color: c, alpha: 0.25 })
          g.circle(x, y, w.hw).stroke({ color: c, width: 5, alpha: 0.9 })
          g.circle(x, y, w.hw * (0.45 + 0.15 * Math.sin(t * 5))).stroke({ color: 0xffffff, width: 3, alpha: 0.7 })
        }
        break
      }
    }
  }

  destroy(): void {
    this.label.remove()
    this.container.destroy({ children: true })
  }
}
