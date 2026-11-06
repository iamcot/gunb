import { ANGLE_MAX, ANGLE_MIN, TUNING, clamp } from '@gunb/shared'

const REPEAT_DELAY = 0.3      // s giữ phím trước khi lặp
const REPEAT_SLOW = 8         // độ/s lúc mới lặp
const REPEAT_FAST = 40        // độ/s sau khi giữ lâu
const REPEAT_RAMP = 1.2       // s để tăng từ chậm lên nhanh

/** Điều khiển ngắm: ↑↓ góc, ←→ đổi hướng, giữ Space tích lực, nhả để bắn. */
export class AimInput {
  angle = 45
  facing: 1 | -1 = 1
  power = 0
  lastPower = 0
  charging = false
  locked = false
  onFire: (angle: number, power: number) => void = () => {}
  private up = 0
  private down = 0
  private acc = 0

  constructor() {
    window.addEventListener('keydown', e => this.keyDown(e))
    window.addEventListener('keyup', e => this.keyUp(e))
    window.addEventListener('blur', () => this.cancel())
  }

  private keyDown(e: KeyboardEvent): void {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Space') e.preventDefault()
    if (e.repeat || this.locked) return
    switch (e.code) {
      case 'ArrowUp': this.up = 1e-6; this.angle = clamp(this.angle + 1, ANGLE_MIN, ANGLE_MAX); break
      case 'ArrowDown': this.down = 1e-6; this.angle = clamp(this.angle - 1, ANGLE_MIN, ANGLE_MAX); break
      case 'ArrowLeft': this.facing = -1; break
      case 'ArrowRight': this.facing = 1; break
      case 'Space': this.charging = true; this.power = 0; break
    }
  }

  private keyUp(e: KeyboardEvent): void {
    if (e.code === 'ArrowUp') this.up = 0
    else if (e.code === 'ArrowDown') this.down = 0
    else if (e.code === 'Space' && this.charging) {
      this.charging = false
      if (!this.locked) {
        this.lastPower = this.power
        this.onFire(this.angle, this.power)
      }
    }
  }

  /** Hủy thao tác dở (mất focus, bị khóa). */
  cancel(): void {
    this.up = this.down = 0
    this.charging = false
    this.power = 0
  }

  update(dt: number): void {
    if (this.locked) { this.cancel(); return }
    if (this.charging) this.power = Math.min(100, this.power + (100 / TUNING.powerChargeS) * dt)
    const dir = (this.up > 0 ? 1 : 0) - (this.down > 0 ? 1 : 0)
    if (this.up > 0) this.up += dt
    if (this.down > 0) this.down += dt
    const held = Math.max(this.up, this.down)
    if (dir !== 0 && held > REPEAT_DELAY) {
      const k = Math.min(1, (held - REPEAT_DELAY) / REPEAT_RAMP)
      this.acc += dir * (REPEAT_SLOW + (REPEAT_FAST - REPEAT_SLOW) * k) * dt
      const whole = Math.trunc(this.acc)
      if (whole !== 0) { this.angle = clamp(this.angle + whole, ANGLE_MIN, ANGLE_MAX); this.acc -= whole }
    } else this.acc = 0
  }
}
