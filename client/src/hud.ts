import { ANGLE_MAX, ANGLE_MIN, windMagnitude, type Wind } from '@gunb/shared'

/** HUD HTML: góc, thanh lực (kèm vạch lực lần bắn trước), gió, gợi ý phím, mũi tên khi đạn bay quá mép trên. */
export class Hud {
  private readonly angleEl: HTMLElement
  private readonly fillEl: HTMLElement
  private readonly lastEl: HTMLElement
  private readonly powerNum: HTMLElement
  private readonly windArrow: HTMLElement
  private readonly windNum: HTMLElement
  private readonly offscreen: HTMLElement
  private readonly root: HTMLElement
  private readonly helpEl: HTMLElement
  private windKey = ''

  constructor() {
    const root = document.createElement('div')
    root.id = 'hud'
    root.innerHTML = `
      <div class="hud-box" id="hud-angle">Góc <b>45</b>°</div>
      <div class="hud-box hud-power">
        <div class="hud-bar"><div class="hud-fill"></div><div class="hud-last"></div></div>
        <div class="hud-num">Lực <b>0</b></div>
      </div>
      <div class="hud-box hud-wind"><div class="hud-arrow">➤</div><div class="hud-wnum">Gió <b>0</b></div></div>
      <div class="hud-help">↑↓ góc · ←→ quay hướng · giữ Space tích lực, nhả để bắn · G gió ngẫu nhiên · H gió 0 · R hồi bia + địa hình · WASD / chuột phải kéo camera · F3 debug · F6 chỉnh số</div>`
    document.body.appendChild(root)
    this.root = root
    this.helpEl = root.querySelector('.hud-help')!
    this.angleEl = root.querySelector('#hud-angle b')!
    this.fillEl = root.querySelector('.hud-fill')!
    this.lastEl = root.querySelector('.hud-last')!
    this.powerNum = root.querySelector('.hud-num b')!
    this.windArrow = root.querySelector('.hud-arrow')!
    this.windNum = root.querySelector('.hud-wnum b')!
    this.offscreen = document.createElement('div')
    this.offscreen.id = 'offscreen'
    document.body.appendChild(this.offscreen)
  }

  setVisible(v: boolean): void {
    this.root.style.display = v ? 'flex' : 'none'
    if (!v) this.setOffscreen(null)
  }

  setHelp(text: string): void { this.helpEl.textContent = text }

  setAim(angle: number, power: number, lastPower: number): void {
    this.angleEl.textContent = String(Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, angle)))
    this.fillEl.style.width = `${power}%`
    this.powerNum.textContent = power.toFixed(0)
    this.lastEl.style.left = `${lastPower}%`
    this.lastEl.style.display = lastPower > 0 ? 'block' : 'none'
  }

  /**
   * Mũi tên chỉ hướng gió ĐẨY viên đạn đang chọn: `windFactor` âm (Diều Hâu Giấy) thì mũi tên đảo chiều và có chữ "ngược".
   * Gọi mỗi frame được (chỉ đụng DOM khi đổi).
   */
  setWind(w: Wind, windFactor = 1): void {
    const key = `${w.x},${w.y},${windFactor < 0}`
    if (key === this.windKey) return
    this.windKey = key
    const flip = windFactor < 0 ? -1 : 1
    this.windNum.innerHTML = windMagnitude(w).toFixed(0) + (flip < 0 ? ' <small>(đạn đi ngược)</small>' : '')
    this.windArrow.style.transform = `rotate(${Math.atan2(w.y * flip, w.x * flip)}rad)`
    this.windArrow.style.opacity = windMagnitude(w) === 0 ? '0.25' : '1'
  }

  /** Đạn đang ở trên mép trên màn hình: hiện mũi tên chỉ vị trí x kèm độ cao. */
  setOffscreen(screenX: number | null, heightPx = 0): void {
    if (screenX === null) { this.offscreen.style.display = 'none'; return }
    this.offscreen.style.display = 'block'
    this.offscreen.style.left = `${Math.max(16, Math.min(window.innerWidth - 16, screenX))}px`
    this.offscreen.textContent = `▲ ${Math.round(heightPx)}`
  }
}
