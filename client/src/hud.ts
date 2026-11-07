import { ANGLE_MAX, ANGLE_MIN, ITEM_SLOTS, TUNING, type ItemId, WEATHER_NAMES, WIND_MAX, weatherForTurn, windMagnitude, type Wind } from '@gunb/shared'
import { audio } from './audio'
import './ui/hud.css'
import { clearIconHtml, weatherIconHtml } from './weatherView'
import { itemIconHtml, itemTitle } from './ui/items'

const WIND_LEVELS = 5
const WEATHER_AHEAD = 5   // số lượt thời tiết sắp tới hiện trên thanh trên

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
 * Thanh trên (`#topbar`): trái = Esc + âm thanh, rồi thời tiết lượt này + các lượt sắp tới; phải = ô item F1–F3 (`setItems`; bấm hoặc phím F1–F3 để dùng).
 * Giữa trên (`#hud-top`): báo thời tiết (weatherView.ts gắn vào đầu) rồi vòng gió bên dưới, có báo thời tiết thì vòng gió bị đẩy xuống.
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
  private readonly topbar: HTMLElement
  private readonly top: HTMLElement
  private readonly soundBtn: HTMLElement
  private readonly wxNow: HTMLElement
  private readonly wxNext: HTMLElement
  private readonly itemEls: HTMLButtonElement[]
  private itemsKey = ''
  private itemsUsable = false
  /** Người chơi bấm ô item (chuột hoặc F1–F3). Mode đang chạy gán. */
  onItem: ((slot: number) => void) | null = null
  private weatherKey = ''
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
      </div>`
    document.body.appendChild(root)
    this.root = root

    const bar = document.createElement('div')
    bar.id = 'topbar'
    bar.innerHTML = `
      <div class="tb-sys"><button class="tb-btn" data-a="esc" title="Về menu (Esc)"><img src="/ui/icons/leave.png" alt=""><small>ESC</small></button>
        <button class="tb-btn" data-a="sound" title="Bật/tắt âm thanh"><b class="tb-snd">🔊</b><small>ÂM</small></button></div>
      <div class="tb-wx"><div class="tb-now" title="Thời tiết lượt này"></div>
        <div class="tb-queue"><span class="cap">Sắp tới</span><div class="tb-next"></div></div></div>
      <div class="tb-space"></div>
      <div class="tb-items">${Array.from({ length: ITEM_SLOTS }, (_, i) => `<button class="tb-slot" data-item="${i}" disabled><small>F${i + 1}</small><span class="ic"></span></button>`).join('')}</div>`
    document.body.appendChild(bar)
    this.topbar = bar
    this.soundBtn = bar.querySelector('.tb-snd')!
    this.wxNow = bar.querySelector('.tb-now')!
    this.wxNext = bar.querySelector('.tb-next')!
    this.itemEls = Array.from(bar.querySelectorAll<HTMLButtonElement>('.tb-slot'))
    this.itemEls.forEach((b, i) => b.addEventListener('click', () => { if (this.itemsUsable) this.onItem?.(i) }))
    bar.querySelector('[data-a="esc"]')!.addEventListener('click', () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' })))
    bar.querySelector('[data-a="sound"]')!.addEventListener('click', () => { audio.unlock(); audio.setMuted(!audio.muted); this.syncSound() })
    this.syncSound()
    this.setWeatherTurn(null)

    const top = document.createElement('div')
    top.id = 'hud-top'
    top.innerHTML = `
      <div class="hud-wind">
        <div class="hud-compass"><div class="hud-arrow"><svg viewBox="0 0 64 64"><path class="shaft" d="M52 23 L66 32 L52 41 Z"/></svg></div>
          <div class="hud-wtext"><b>0</b><span class="cap">Gió</span></div></div>
        <div class="hud-wbars">${'<i></i>'.repeat(WIND_LEVELS)}</div><span class="hud-rev">đạn đi ngược</span>
      </div>`
    document.body.appendChild(top)
    this.top = top
    this.helpEl = root.querySelector('.hud-help')!
    this.angleEl = root.querySelector('.hud-angle .val b')!
    this.needle = root.querySelector('.needle')!
    this.fillEl = root.querySelector('.hud-fill')!
    this.lastEl = root.querySelector('.hud-last')!
    this.lastNum = root.querySelector('.hud-power .last')!
    this.powerNum = root.querySelector('.hud-power .top b')!
    this.compass = top.querySelector('.hud-compass')!
    this.windArrow = top.querySelector('.hud-arrow')!
    this.windNum = top.querySelector('.hud-wtext b')!
    this.windBars = Array.from(top.querySelectorAll<HTMLElement>('.hud-wbars i'))
    this.windRev = top.querySelector('.hud-rev')!
    this.offscreen = document.createElement('div')
    this.offscreen.id = 'offscreen'
    document.body.appendChild(this.offscreen)
  }

  setVisible(v: boolean): void {
    this.visible = v
    this.root.style.display = v ? 'flex' : 'none'
    this.topbar.style.display = v ? 'flex' : 'none'
    this.top.style.display = v ? 'flex' : 'none'
    document.body.classList.toggle('in-match', v)
    if (v) this.syncSound()
    if (!v) this.setOffscreen(null)
  }

  setHelp(text: string): void { this.helpEl.textContent = text }

  /**
   * Ô item trên thanh trên. `items` = ô của mình (null = trống/đã dùng; cả mảng null = không có ô, ví dụ đang xem người khác),
   * `used` = item đã dùng lượt này (sáng ô đó lên nếu còn hiện), `usable` = đang lượt mình và chưa dùng item. Gọi mỗi frame được.
   */
  setItems(items: readonly (ItemId | null)[] | null, used: ItemId | null, usable: boolean): void {
    const key = `${items?.join() ?? '-'}|${used}|${usable}`
    if (key === this.itemsKey) return
    this.itemsKey = key
    this.itemsUsable = usable
    this.itemEls.forEach((b, i) => {
      const id = items?.[i] ?? null
      b.disabled = !usable || !id
      b.classList.toggle('has', !!id)
      b.title = id ? `${itemTitle(id)} — F${i + 1}` : 'Ô item trống'
      b.querySelector('.ic')!.innerHTML = id ? itemIconHtml(id) : ''
    })
    this.topbar.classList.toggle('item-used', !!used)
    this.topbar.querySelector('.tb-items')!.setAttribute('data-used', used ? TUNING.items[used].name : '')
  }

  /** Phím F1..F3 → ô 0..2 (trả true nếu đã xử lý). */
  itemKey(code: string): boolean {
    const m = /^F([1-9])$/.exec(code)
    if (!m) return false
    const i = Number(m[1]) - 1
    if (i >= ITEM_SLOTS) return false
    if (this.itemsUsable && !this.itemEls[i]!.disabled) this.onItem?.(i)
    return true
  }

  private syncSound(): void {
    this.soundBtn.textContent = audio.muted ? '🔇' : '🔊'
    const old = document.getElementById('mutebtn')
    if (old) old.textContent = audio.muted ? '🔇 Tắt tiếng' : '🔊 Âm thanh'
  }

  /**
   * Thời tiết lượt này + WEATHER_AHEAD lượt sau, suy ra từ seed + số lượt (giống server, shared/weather.ts).
   * null = không có thời tiết (tập bắn). Gọi mỗi frame được (chỉ tính lại khi đổi lượt).
   */
  setWeatherTurn(seed: number | null, turnNo = 0, mapW = 0, mapH = 0): void {
    const key = seed === null ? '-' : `${seed}:${turnNo}`
    if (key === this.weatherKey) return
    this.weatherKey = key
    if (seed === null) {
      this.wxNow.className = 'tb-now none'
      this.wxNow.innerHTML = '<small>Không có thời tiết</small>'
      this.wxNext.innerHTML = ''
      return
    }
    const now = weatherForTurn(seed, turnNo, mapW, mapH, TUNING.weather)
    this.wxNow.className = 'tb-now' + (now ? ` k-${now.kind}` : ' k-clear')
    this.wxNow.innerHTML = now ? `<i>${weatherIconHtml(now.kind)}</i><span><small>Lượt này</small><b>${WEATHER_NAMES[now.kind]}</b></span>` : `<i>${clearIconHtml()}</i><span><small>Lượt này</small><b>Trời quang</b></span>`
    let html = ''
    for (let k = 1; k <= WEATHER_AHEAD; k++) {
      const w = weatherForTurn(seed, turnNo + k, mapW, mapH, TUNING.weather)
      html += w ? `<i class="k-${w.kind}" title="+${k} lượt: ${WEATHER_NAMES[w.kind]}">${weatherIconHtml(w.kind)}</i>` : `<i class="clear" title="+${k} lượt: trời quang">${clearIconHtml()}</i>`
    }
    this.wxNext.innerHTML = html
  }

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
