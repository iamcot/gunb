import type { MobileDef, ShotSlot } from '@gunb/shared'

/** Thanh chọn đạn (1 / 2 / SS): tên đạn, delay, thanh SS. Bấm hoặc phím 1/2/3. Nằm trong `#hud-shots` của HUD (kiểu dáng ở ui/hud.css). */
export class ShotBar {
  private readonly el: HTMLElement
  private readonly btns: HTMLButtonElement[] = []
  private readonly fill: HTMLElement
  private last = ''

  constructor(onPick: (slot: ShotSlot) => void) {
    this.el = document.createElement('div')
    this.el.id = 'shotbar'
    for (let i = 0; i < 3; i++) {
      const b = document.createElement('button')
      b.addEventListener('click', () => onPick(i as ShotSlot))
      b.addEventListener('keydown', e => e.preventDefault())   // Space/Enter không "bấm" nút này
      this.el.appendChild(b)
      this.btns.push(b)
    }
    this.fill = document.createElement('div')
    this.fill.className = 'ss-fill'
    this.btns[2]!.appendChild(this.fill)
    ;(document.getElementById('hud-shots') ?? document.body).appendChild(this.el)   // nằm trong bảng điều khiển HUD (hud.ts)
  }

  update(def: MobileDef, slot: ShotSlot, ss: number, ssMax: number): void {
    const ready = ss >= ssMax
    const key = `${def.id}|${slot}|${ss.toFixed(0)}|${ready}`
    if (key === this.last) return
    this.last = key
    def.shots.forEach((sh, i) => {
      const b = this.btns[i]!
      b.innerHTML = `<span class="sb-key">${i + 1}</span><span class="sb-name">${i === 2 ? 'SS · ' : ''}${sh.name}</span><small>delay ${sh.delay}${i === 2 && !ready ? ` · ${Math.floor((ss / ssMax) * 100)}%` : ''}</small>`
      b.className = (i === slot ? 'sel ' : '') + (i === 2 ? (ready ? 'ss ready' : 'ss locked') : '')
      b.disabled = i === 2 && !ready
    })
    this.fill.style.width = `${Math.min(100, (ss / ssMax) * 100)}%`
    this.btns[2]!.appendChild(this.fill)
  }

  setVisible(v: boolean): void { this.el.style.display = v ? 'flex' : 'none' }
  destroy(): void { this.el.remove() }
}
