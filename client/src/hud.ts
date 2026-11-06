import { ANGLE_MAX, ANGLE_MIN, WIND_MAX, windMagnitude, type Wind } from '@gunb/shared'
import './ui/hud.css'

const WIND_LEVELS = 5

/** Vạch chia của đồng hồ góc (0..90°, tâm (8,56), bán kính 50 trong toạ độ SVG; trục Y hướng xuống). */
function dialTicks(): string {
  let s = ''
  for (let a = 0; a <= 90; a += 15) {
    const r = (a * Math.PI) / 180, c = Math.cos(r), n = Math.sin(r)
    const big = a % 45 === 0, r0 = big ? 38 : 42
    s += `<line class="dial-tick${big ? ' big' : ''}" x1="${8 + c * r0}" y1="${56 - n * r0}" x2="${8 + c * 47}" y2="${56 - n * 47}"/>`
  }
  return s
}

/**
 * HUD HTML (bảng điều khiển dưới cùng): ô thanh đạn (`#hud-shots`, shotBar.ts tự gắn vào), đồng hồ góc, thanh lực (kèm vạch lực
 * lần bắn trước), la bàn gió; gợi ý phím; mũi tên khi đạn bay quá mép trên. Kiểu dáng ở ui/hud.css.
 */
export class Hud {
  private readonly angleEl: HTMLElement
  private readonly needle: SVGElement
  private readonly fillEl: HTMLElement
  private readonly lastEl: HTMLElement
  private readonly lastNum: HTMLElement
  private readonly powerNum: HTMLElement
  private readonly compass: HTMLElement
  private readonly windArrow: HTMLElement
  private readonly windNum: HTMLElement
  private readonly windBars: HTMLElement[]
  private readonly windRev: HTMLElement
  private readonly offscreen: HTMLElement
  private readonly root: HTMLElement
  private readonly helpEl: HTMLElement
  private windKey = ''
  private aimKey = ''
  /** Gió đang hiện (đã tính chiều đạn đi ngược nếu có) — hiệu ứng gió nền (windFx.ts) đọc mỗi frame. */
  readonly wind: Wind = { x: 0, y: 0 }
  visible = false

  constructor() {
    const root = document.createElement('div')
    root.id = 'hud'
    root.innerHTML = `
      <div class="hud-help"></div>
      <div id="hud-shots"></div>
      <div class="hud-angle">
        <svg viewBox="0 0 64 62"><path class="dial-bg" d="M8 56 L58 56 A50 50 0 0 0 8 6 Z"/>${dialTicks()}
          <line class="needle" x1="8" y1="56" x2="54" y2="56"/><circle class="hub" cx="8" cy="56" r="6"/></svg>
        <div class="txt"><span class="cap">Góc</span><div class="val"><b>45</b><sup>°</sup></div></div>
      </div>
      <div class="hud-power">
        <div class="top"><span>Lực <b>0</b></span><span class="last"></span></div>
        <div class="hud-bar"><div class="hud-fill"></div><div class="hud-ticks"></div><div class="hud-last"></div></div>
        <div class="hud-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
      </div>
      <div class="hud-wind">
        <div class="hud-compass"><div class="hud-arrow"><svg viewBox="0 0 64 64"><path class="shaft" d="M14 28 H38 V19 L54 32 L38 45 V36 H14 Z"/></svg></div></div>
        <div class="hud-wtext"><span class="cap">Gió</span><b>0</b><div class="hud-wbars">${'<i></i>'.repeat(WIND_LEVELS)}</div><span class="hud-rev">đạn đi ngược</span></div>
      </div>`
    document.body.appendChild(root)
    this.root = root
    this.helpEl = root.querySelector('.hud-help')!
    this.angleEl = root.querySelector('.hud-angle .val b')!
    this.needle = root.querySelector('.needle')!
    this.fillEl = root.querySelector('.hud-fill')!
    this.lastEl = root.querySelector('.hud-last')!
    this.lastNum = root.querySelector('.hud-power .last')!
    this.powerNum = root.querySelector('.hud-power .top b')!
    this.compass = root.querySelector('.hud-compass')!
    this.windArrow = root.querySelector('.hud-arrow')!
    this.windNum = root.querySelector('.hud-wtext b')!
    this.windBars = Array.from(root.querySelectorAll<HTMLElement>('.hud-wbars i'))
    this.windRev = root.querySelector('.hud-rev')!
    this.offscreen = document.createElement('div')
    this.offscreen.id = 'offscreen'
    document.body.appendChild(this.offscreen)
  }

  setVisible(v: boolean): void {
    this.visible = v
    this.root.style.display = v ? 'flex' : 'none'
    if (!v) this.setOffscreen(null)
  }

  setHelp(text: string): void { this.helpEl.textContent = text }

  /** Gọi mỗi frame được (chỉ đụng DOM khi đổi). */
  setAim(angle: number, power: number, lastPower: number): void {
    const a = Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, angle))
    const p = Math.round(power)
    const key = `${a}|${p}|${lastPower}`
    if (key === this.aimKey) return
    this.aimKey = key
    this.angleEl.textContent = String(a)
    this.needle.style.transform = `rotate(${-a}deg)`
    this.fillEl.style.clipPath = `inset(0 ${100 - power}% 0 0 round 9px)`
    this.powerNum.textContent = String(p)
    this.lastEl.style.left = `${lastPower}%`
    this.lastEl.style.display = lastPower > 0 ? 'block' : 'none'
    this.lastNum.textContent = lastPower > 0 ? `lần trước ${lastPower.toFixed(0)}` : ''
  }

  /**
   * Mũi tên chỉ hướng gió ĐẨY viên đạn đang chọn: `windFactor` âm (Diều Hâu Giấy) thì mũi tên đảo chiều và có chữ "đạn đi ngược".
   * Gọi mỗi frame được (chỉ đụng DOM khi đổi).
   */
  setWind(w: Wind, windFactor = 1): void {
    const key = `${w.x},${w.y},${windFactor < 0}`
    if (key === this.windKey) return
    this.windKey = key
    const flip = windFactor < 0 ? -1 : 1
    this.wind.x = w.x; this.wind.y = w.y
    const mag = windMagnitude(w)
    const level = mag === 0 ? 0 : Math.max(1, Math.ceil((mag / WIND_MAX) * WIND_LEVELS))
    this.windNum.textContent = mag.toFixed(0)
    this.windArrow.style.transform = `rotate(${Math.atan2(w.y * flip, w.x * flip)}rad)`
    this.compass.classList.toggle('calm', mag === 0)
    this.windBars.forEach((b, i) => { b.className = i < level ? (level >= 4 ? 'on hi' : 'on') : '' })
    this.windRev.classList.toggle('on', flip < 0)
  }

  /** Đạn đang ở trên mép trên màn hình: hiện mũi tên chỉ vị trí x kèm độ cao. */
  setOffscreen(screenX: number | null, heightPx = 0): void {
    if (screenX === null) { this.offscreen.style.display = 'none'; return }
    this.offscreen.style.display = 'block'
    this.offscreen.style.left = `${Math.max(16, Math.min(window.innerWidth - 16, screenX))}px`
    this.offscreen.textContent = `▲ ${Math.round(heightPx)}`
  }
}
