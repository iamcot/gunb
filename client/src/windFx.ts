import { Container, Sprite, Texture } from 'pixi.js'
import { WIND_MAX, windMagnitude, type Wind } from '@gunb/shared'

/**
 * Hiệu ứng gió nền (chỉ để nhìn, không ảnh hưởng gameplay): lá cây / cánh hoa bay theo gió và vệt gió khi gió mạnh.
 * Vẽ trong toạ độ màn hình, nằm giữa nền parallax và địa hình; trôi ngược camera một phần để có cảm giác chiều sâu.
 * Pool sprite cố định, trạng thái trong Float32Array — không cấp phát gì mỗi frame.
 */
const LEAVES = 36            // số lá/cánh hoa tối đa
const STREAKS = 18           // số vệt gió tối đa
const LEAF_MIN = 6           // gió 0 vẫn có vài lá rơi chậm
const PX_PER_WIND = 13       // px/s mỗi đơn vị gió (lá); vệt gió nhanh gấp STREAK_MUL
const STREAK_MUL = 2.2
const STREAK_FROM = 6        // gió từ mức này mới có vệt
const PARALLAX = 0.7         // lá trôi theo camera bao nhiêu phần (1 = dính vào bản đồ)
const MARGIN = 60
const FADE_K = 3             // 1/s: tốc độ hiện/ẩn khi đổi số lượng

function makeTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): Texture {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  draw(c.getContext('2d')!)
  return Texture.from(c)
}

function leafTex(fill: string, vein: string): Texture {
  return makeTex(28, 16, g => {
    g.fillStyle = fill; g.strokeStyle = '#4f3420'; g.lineWidth = 1.5
    g.beginPath(); g.moveTo(2, 8); g.quadraticCurveTo(14, -2, 26, 8); g.quadraticCurveTo(14, 18, 2, 8); g.closePath(); g.fill(); g.stroke()
    g.strokeStyle = vein; g.lineWidth = 1; g.beginPath(); g.moveTo(4, 8); g.lineTo(23, 8); g.stroke()
  })
}

export class WindFx {
  readonly container = new Container()
  private readonly sprites: Sprite[] = []
  private readonly px = new Float32Array(LEAVES + STREAKS)
  private readonly py = new Float32Array(LEAVES + STREAKS)
  private readonly ph = new Float32Array(LEAVES + STREAKS)    // pha dao động riêng
  private readonly sp = new Float32Array(LEAVES + STREAKS)    // hệ số tốc độ riêng 0.7..1.3
  private readonly fade = new Float32Array(LEAVES + STREAKS)  // 0..1
  private t = 0
  private lastCamX = Number.NaN
  private lastCamY = 0

  constructor(private viewW: number, private viewH: number) {
    const leafTexs = [leafTex('#46A843', '#2f7c2d'), leafTex('#8cc63f', '#46A843'), leafTex('#ffb199', '#FF7A59'), leafTex('#F6E7C8', '#c9a46a')]
    const streak = makeTex(64, 4, g => {
      const gr = g.createLinearGradient(0, 0, 64, 0)
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr; g.fillRect(0, 1, 64, 2)
    })
    for (let i = 0; i < LEAVES + STREAKS; i++) {
      const isLeaf = i < LEAVES
      const s = new Sprite(isLeaf ? leafTexs[i % leafTexs.length]! : streak)
      s.anchor.set(0.5)
      s.visible = false
      const k = (i * 0.618034) % 1          // rải đều, không cần ngẫu nhiên
      this.px[i] = k * viewW
      this.py[i] = ((i * 0.381966 + 0.13) % 1) * viewH
      this.ph[i] = k * Math.PI * 2
      this.sp[i] = 0.7 + ((i * 0.7548777) % 1) * 0.6
      if (isLeaf) s.scale.set(0.6 + this.sp[i]! * 0.4)
      this.sprites.push(s)
      this.container.addChild(s)
    }
  }

  resize(viewW: number, viewH: number): void { this.viewW = viewW; this.viewH = viewH }

  /** `wind`: gió đang hiện trên HUD; `on`: false thì ẩn dần (menu, sảnh). */
  update(dt: number, camX: number, camY: number, wind: Wind, on: boolean): void {
    this.t += dt
    const dcx = Number.isNaN(this.lastCamX) ? 0 : camX - this.lastCamX
    const dcy = Number.isNaN(this.lastCamX) ? 0 : camY - this.lastCamY
    this.lastCamX = camX; this.lastCamY = camY
    const mag = windMagnitude(wind)
    const k = Math.min(1, mag / WIND_MAX)
    const nLeaves = on ? Math.round(LEAF_MIN + k * (LEAVES - LEAF_MIN)) : 0
    const nStreaks = on && mag > STREAK_FROM ? Math.round(((mag - STREAK_FROM) / (WIND_MAX - STREAK_FROM)) * STREAKS) : 0
    const W = this.viewW + MARGIN * 2, H = this.viewH + MARGIN * 2
    const fk = Math.min(1, dt * FADE_K)
    const t = this.t
    for (let i = 0; i < LEAVES + STREAKS; i++) {
      const s = this.sprites[i]!
      const isLeaf = i < LEAVES
      const want = isLeaf ? (i < nLeaves ? 1 : 0) : (i - LEAVES < nStreaks ? 1 : 0)
      this.fade[i] = this.fade[i]! + (want - this.fade[i]!) * fk
      const f = this.fade[i]!
      if (f < 0.02) { s.visible = false; continue }
      const sp = this.sp[i]!, ph = this.ph[i]!
      let vx: number, vy: number
      if (isLeaf) {
        vx = wind.x * PX_PER_WIND * sp + Math.sin(t * 1.3 + ph) * 18
        vy = wind.y * PX_PER_WIND * sp + 26 * sp + Math.sin(t * 2.1 + ph * 1.7) * 30   // lá luôn rơi nhẹ + chao lượn
      } else {
        vx = wind.x * PX_PER_WIND * STREAK_MUL * sp
        vy = wind.y * PX_PER_WIND * STREAK_MUL * sp
      }
      let x = this.px[i]! + vx * dt - dcx * PARALLAX
      let y = this.py[i]! + vy * dt - dcy * PARALLAX
      // ra khỏi khung (cả lề) thì quay vòng sang phía đối diện
      x = ((x + MARGIN) % W + W) % W - MARGIN
      y = ((y + MARGIN) % H + H) % H - MARGIN
      this.px[i] = x; this.py[i] = y
      s.visible = true
      s.position.set(x, y)
      if (isLeaf) {
        s.rotation = Math.atan2(vy, vx) * 0.4 + Math.sin(t * 3 * sp + ph) * 0.9
        s.scale.y = (0.6 + sp * 0.4) * Math.cos(t * 4 * sp + ph)   // lật mặt lá
        s.alpha = 0.85 * f
      } else {
        s.rotation = Math.atan2(vy, vx)
        s.scale.set(0.8 + sp * 0.8 + k, 1)
        s.alpha = (0.15 + 0.4 * k) * f * (0.6 + 0.4 * Math.sin(t * 5 + ph))
      }
    }
  }
}
