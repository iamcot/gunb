import { TUNING, resetTuning } from '@gunb/shared'

interface Row { label: string; get: () => number; set: (v: number) => void; step: number }

const ROWS: Row[] = [
  { label: 'Trọng lực (px/s²)', get: () => TUNING.gravity, set: v => { TUNING.gravity = v }, step: 10 },
  { label: 'Hệ số gió (px/s² mỗi đơn vị)', get: () => TUNING.windScale, set: v => { TUNING.windScale = v }, step: 0.5 },
  { label: 'Thời gian tích lực (s)', get: () => TUNING.powerChargeS, set: v => { TUNING.powerChargeS = v }, step: 0.1 },
  { label: 'Đạn 1: tốc độ tối đa (px/s)', get: () => TUNING.shots.basic.maxSpeed, set: v => { TUNING.shots.basic.maxSpeed = v }, step: 20 },
  { label: 'Đạn 1: ảnh hưởng gió', get: () => TUNING.shots.basic.windFactor, set: v => { TUNING.shots.basic.windFactor = v }, step: 0.1 },
  { label: 'Đạn 1: bán kính sát thương', get: () => TUNING.shots.basic.blastRadius, set: v => { TUNING.shots.basic.blastRadius = v }, step: 5 },
  { label: 'Đạn 1: bán kính hố', get: () => TUNING.shots.basic.carveRadius, set: v => { TUNING.shots.basic.carveRadius = v }, step: 5 },
  { label: 'Đạn 1: sát thương', get: () => TUNING.shots.basic.damage, set: v => { TUNING.shots.basic.damage = v }, step: 5 },
]

/** Bảng F6: chỉnh thông số gameplay trực tiếp, có tác dụng từ phát bắn kế tiếp. */
export class TuningPanel {
  private readonly el: HTMLElement
  private readonly inputs: HTMLInputElement[] = []

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'tuning'
    this.el.style.display = 'none'
    const title = document.createElement('div')
    title.className = 'tuning-title'
    title.textContent = 'Chỉnh số (F6)'
    this.el.appendChild(title)
    for (const row of ROWS) {
      const label = document.createElement('label')
      const span = document.createElement('span')
      span.textContent = row.label
      const input = document.createElement('input')
      input.type = 'number'
      input.step = String(row.step)
      input.addEventListener('input', () => { const v = parseFloat(input.value); if (Number.isFinite(v)) row.set(v) })
      input.addEventListener('keydown', e => e.stopPropagation())   // không kích hoạt phím điều khiển game
      input.addEventListener('keyup', e => e.stopPropagation())
      label.append(span, input)
      this.el.appendChild(label)
      this.inputs.push(input)
    }
    const btns = document.createElement('div')
    const copy = document.createElement('button')
    copy.textContent = 'Copy JSON'
    copy.addEventListener('click', () => { void navigator.clipboard?.writeText(JSON.stringify(TUNING, null, 2)); copy.textContent = 'Đã copy'; setTimeout(() => { copy.textContent = 'Copy JSON' }, 1200) })
    const reset = document.createElement('button')
    reset.textContent = 'Về mặc định'
    reset.addEventListener('click', () => { resetTuning(); this.refresh() })
    btns.append(copy, reset)
    this.el.appendChild(btns)
    document.body.appendChild(this.el)
    this.refresh()
  }

  private refresh(): void { ROWS.forEach((r, i) => { this.inputs[i]!.value = String(r.get()) }) }

  toggle(): void {
    const show = this.el.style.display === 'none'
    this.el.style.display = show ? 'block' : 'none'
    if (show) this.refresh()
  }
}
