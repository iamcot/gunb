import { MOBILE_IDS, TUNING, resetTuning, type ShotDef } from '@gunb/shared'

interface Row { label: string; get: () => number; set: (v: number) => void; step: number }

const SLOT_NAMES = ['Đạn 1', 'Đạn 2', 'Đạn SS']

/** Bảng F6: chỉnh thông số gameplay trực tiếp, có tác dụng từ phát bắn kế tiếp. */
export class TuningPanel {
  private readonly el: HTMLElement
  private readonly rowsEl: HTMLElement
  private mobileId: string = MOBILE_IDS[0]
  private slot = 0

  constructor() {
    this.el = document.createElement('div')
    this.el.id = 'tuning'
    this.el.style.display = 'none'
    this.el.innerHTML = '<div class="tuning-title">Chỉnh số (F6)</div>'
    const sel = document.createElement('div')
    const mSel = document.createElement('select')
    for (const id of MOBILE_IDS) mSel.add(new Option(TUNING.mobiles[id]!.name, id))
    const sSel = document.createElement('select')
    SLOT_NAMES.forEach((n, i) => sSel.add(new Option(n, String(i))))
    mSel.addEventListener('change', () => { this.mobileId = mSel.value; this.build() })
    sSel.addEventListener('change', () => { this.slot = Number(sSel.value); this.build() })
    for (const s of [mSel, sSel]) { s.addEventListener('keydown', e => e.stopPropagation()); s.addEventListener('keyup', e => e.stopPropagation()) }
    sel.append(mSel, sSel)
    this.el.appendChild(sel)
    this.rowsEl = document.createElement('div')
    this.el.appendChild(this.rowsEl)
    const btns = document.createElement('div')
    const copy = document.createElement('button')
    copy.textContent = 'Copy JSON'
    copy.addEventListener('click', () => { void navigator.clipboard?.writeText(JSON.stringify(TUNING, null, 2)); copy.textContent = 'Đã copy'; setTimeout(() => { copy.textContent = 'Copy JSON' }, 1200) })
    const reset = document.createElement('button')
    reset.textContent = 'Về mặc định'
    reset.addEventListener('click', () => { resetTuning(); this.build() })
    btns.append(copy, reset)
    this.el.appendChild(btns)
    document.body.appendChild(this.el)
    this.build()
  }

  private rows(): Row[] {
    const m = TUNING.mobiles[this.mobileId]!
    const sh = (): ShotDef => m.shots[this.slot as 0 | 1 | 2]
    return [
      { label: 'Trọng lực (px/s²)', get: () => TUNING.gravity, set: v => { TUNING.gravity = v }, step: 10 },
      { label: 'Hệ số gió (px/s²/đơn vị)', get: () => TUNING.windScale, set: v => { TUNING.windScale = v }, step: 0.5 },
      { label: 'Thời gian tích lực (s)', get: () => TUNING.powerChargeS, set: v => { TUNING.powerChargeS = v }, step: 0.1 },
      { label: 'Tốc độ đi (px/s)', get: () => TUNING.move.speed, set: v => { TUNING.move.speed = v }, step: 5 },
      { label: 'Thời gian lượt (s)', get: () => TUNING.turn.timeS, set: v => { TUNING.turn.timeS = v }, step: 1 },
      { label: 'SS: cộng theo sát thương gây ra', get: () => TUNING.ss.perDamageDealt, set: v => { TUNING.ss.perDamageDealt = v }, step: 0.1 },
      { label: 'SS: cộng theo sát thương nhận', get: () => TUNING.ss.perDamageTaken, set: v => { TUNING.ss.perDamageTaken = v }, step: 0.1 },
      { label: 'SS: cộng mỗi lượt', get: () => TUNING.ss.perTurn, set: v => { TUNING.ss.perTurn = v }, step: 1 },
      { label: `${m.name}: máu`, get: () => m.hp, set: v => { m.hp = v }, step: 50 },
      { label: `${m.name}: giáp (0..1)`, get: () => m.armor, set: v => { m.armor = v }, step: 0.05 },
      { label: `${m.name}: nhiên liệu`, get: () => m.fuel, set: v => { m.fuel = v }, step: 10 },
      { label: `${SLOT_NAMES[this.slot]}: tốc độ tối đa`, get: () => sh().maxSpeed, set: v => { sh().maxSpeed = v }, step: 20 },
      { label: `${SLOT_NAMES[this.slot]}: ảnh hưởng gió`, get: () => sh().windFactor, set: v => { sh().windFactor = v }, step: 0.1 },
      { label: `${SLOT_NAMES[this.slot]}: bán kính sát thương`, get: () => sh().blastRadius, set: v => { sh().blastRadius = v }, step: 5 },
      { label: `${SLOT_NAMES[this.slot]}: bán kính hố`, get: () => sh().carveRadius, set: v => { sh().carveRadius = v }, step: 5 },
      { label: `${SLOT_NAMES[this.slot]}: sát thương`, get: () => sh().damage, set: v => { sh().damage = v }, step: 10 },
      { label: `${SLOT_NAMES[this.slot]}: delay`, get: () => sh().delay, set: v => { sh().delay = v }, step: 10 },
    ]
  }

  private build(): void {
    this.rowsEl.innerHTML = ''
    for (const row of this.rows()) {
      const label = document.createElement('label')
      const span = document.createElement('span')
      span.textContent = row.label
      const input = document.createElement('input')
      input.type = 'number'
      input.step = String(row.step)
      input.value = String(row.get())
      input.addEventListener('input', () => { const v = parseFloat(input.value); if (Number.isFinite(v)) row.set(v) })
      input.addEventListener('keydown', e => e.stopPropagation())   // không kích hoạt phím điều khiển game
      input.addEventListener('keyup', e => e.stopPropagation())
      label.append(span, input)
      this.rowsEl.appendChild(label)
    }
  }

  toggle(): void {
    const show = this.el.style.display === 'none'
    this.el.style.display = show ? 'block' : 'none'
    if (show) this.build()
  }
}
