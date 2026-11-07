import { audio } from './audio'
import { ANGLE_MAX, ANGLE_MIN, TUNING, clamp, type ShotSlot } from '@gunb/shared'

const REPEAT_DELAY = 0.3      // s giữ phím trước khi lặp
const REPEAT_SLOW = 8         // độ/s lúc mới lặp
const REPEAT_FAST = 40        // độ/s sau khi giữ lâu
const REPEAT_RAMP = 1.2       // s để tăng từ chậm lên nhanh
const POWER_PER_DRAG_PX = 0.25 // tụ lực bằng chuột: mỗi px kéo ngang cộng/trừ bấy nhiêu lực (kéo phải +, kéo trái −)

/**
 * Điều khiển ngắm: ↑↓ góc, giữ Space hoặc chuột trái (bấm trên khung game) tích lực, nhả để bắn. Với chuột: lực tự tăng theo thời gian, kéo chuột sang phải tăng thêm, sang trái giảm bớt; hết giờ lượt khi đang tụ thì mode gọi `release()` để bắn luôn.
 * ←→: ở chế độ `moveMode` là đi (đọc `moveDir`), không thì đổi hướng (`facing`).
 */
export class AimInput {
  angle = 45
  angleMin = ANGLE_MIN
  angleMax = ANGLE_MAX
  slot: ShotSlot = 0
  ssReady = false
  facing: 1 | -1 = 1
  power = 0
  lastPower = 0
  charging = false
  locked = false
  onFire: (angle: number, power: number, slot: ShotSlot) => void = () => {}
  moveDir: -1 | 0 | 1 = 0
  private up = 0
  private down = 0
  private left = false
  private right = false
  private acc = 0
  private readonly onKeyDown = (e: KeyboardEvent): void => this.keyDown(e)
  private readonly onKeyUp = (e: KeyboardEvent): void => this.keyUp(e)
  private readonly onBlur = (): void => this.cancel()
  private readonly onMouseDown = (e: MouseEvent): void => {
    // chỉ bấm lên khung game (canvas): bấm vào ô đạn, nút HUD... không tụ lực; chuột phải dành cho kéo camera
    if (e.button !== 0 || this.locked || this.charging || !(e.target instanceof HTMLCanvasElement)) return
    this.startCharge(); this.mouseCharge = true; this.dragX = 0
  }
  private dragX = 0   // tổng px chuột kéo ngang từ lần update trước (chỉ cộng dồn khi đang tụ bằng chuột)
  private mouseCharge = false
  private readonly onMouseMove = (e: MouseEvent): void => { if (this.mouseCharge) this.dragX += e.movementX }
  private readonly onMouseUp = (e: MouseEvent): void => { if (e.button === 0 && this.charging) this.release() }

  constructor(private readonly moveMode = false) {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
    window.addEventListener('mousedown', this.onMouseDown)
    window.addEventListener('mouseup', this.onMouseUp)
    window.addEventListener('mousemove', this.onMouseMove)
  }

  /** Đặt dải góc hợp lệ của pháo (kẹp lại góc hiện tại). */
  setRange(min: number, max: number): void {
    this.angleMin = min
    this.angleMax = max
    this.angle = clamp(this.angle, min, max)
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    window.removeEventListener('mousedown', this.onMouseDown)
    window.removeEventListener('mouseup', this.onMouseUp)
    window.removeEventListener('mousemove', this.onMouseMove)
  }

  private keyDown(e: KeyboardEvent): void {
    if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'Space') e.preventDefault()
    if (e.code === 'ArrowLeft') this.left = true
    else if (e.code === 'ArrowRight') this.right = true
    if (e.repeat || this.locked) return
    switch (e.code) {
      case 'ArrowUp': this.up = 1e-6; this.angle = clamp(this.angle + 1, this.angleMin, this.angleMax); break
      case 'ArrowDown': this.down = 1e-6; this.angle = clamp(this.angle - 1, this.angleMin, this.angleMax); break
      case 'ArrowLeft': if (!this.moveMode) this.facing = -1; break
      case 'ArrowRight': if (!this.moveMode) this.facing = 1; break
      case 'Space': this.startCharge(); break
      case 'Digit1': this.slot = 0; break
      case 'Digit2': this.slot = 1; break
      case 'Digit3': if (this.ssReady) this.slot = 2; break
    }
  }

  private keyUp(e: KeyboardEvent): void {
    if (e.code === 'ArrowLeft') this.left = false
    else if (e.code === 'ArrowRight') this.right = false
    if (e.code === 'ArrowUp') this.up = 0
    else if (e.code === 'ArrowDown') this.down = 0
    else if (e.code === 'Space' && this.charging) this.release()
  }

  private startCharge(): void {
    this.charging = true; this.power = 0
    audio.chargeStart()
  }

  /** Thả lực: bắn với lực hiện tại (nhả phím/chuột, hoặc hết giờ lượt khi đang tụ). */
  release(): void {
    if (!this.charging) return
    this.charging = false
    this.mouseCharge = false
    audio.chargeStop()
    if (!this.locked) {
      this.lastPower = this.power
      this.onFire(this.angle, this.power, this.slot)
    }
  }

  /** Hủy thao tác dở (mất focus, bị khóa). */
  cancel(): void {
    this.up = this.down = 0
    this.left = this.right = false
    this.moveDir = 0
    this.charging = false
    this.mouseCharge = false
    this.power = 0
    audio.chargeStop()
  }

  update(dt: number): void {
    if (this.locked) { this.cancel(); return }
    if (this.slot === 2 && !this.ssReady) this.slot = 0
    this.moveDir = this.moveMode ? ((this.right ? 1 : 0) - (this.left ? 1 : 0)) as -1 | 0 | 1 : 0
    if (this.charging) {
      // lực tự tăng theo thời gian; tụ bằng chuột thì kéo phải cộng thêm, kéo trái trừ bớt: lực nào mạnh hơn thì lực trượt về phía đó
      this.power = clamp(this.power + (100 / TUNING.powerChargeS) * dt + this.dragX * POWER_PER_DRAG_PX, 0, 100)
      this.dragX = 0
    }
    const dir = (this.up > 0 ? 1 : 0) - (this.down > 0 ? 1 : 0)
    if (this.up > 0) this.up += dt
    if (this.down > 0) this.down += dt
    const held = Math.max(this.up, this.down)
    if (dir !== 0 && held > REPEAT_DELAY) {
      const k = Math.min(1, (held - REPEAT_DELAY) / REPEAT_RAMP)
      this.acc += dir * (REPEAT_SLOW + (REPEAT_FAST - REPEAT_SLOW) * k) * dt
      const whole = Math.trunc(this.acc)
      if (whole !== 0) { this.angle = clamp(this.angle + whole, this.angleMin, this.angleMax); this.acc -= whole }
    } else this.acc = 0
  }
}
