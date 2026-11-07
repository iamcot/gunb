import { MOBILE_IDS, TUNING, aimRange, type AimRange, hashSeed, makeWind, mulberry32, simulateShot, windMagnitude, type ShotSlot, type Wind } from '@gunb/shared'
import { getShotArt, getShotSfx, preloadShotArt } from './shotArt'
import type { GameCtx, Mode } from './ctx'
import { AimInput } from './input'
import { ShotPlayback } from './playback'
import { Practice } from './practice'
import { ShotBar } from './shotBar'

const HELP = '↑↓ góc · ←→ quay hướng · 1/2/3 chọn đạn · giữ Space tích lực, nhả để bắn · M đổi pháo · G gió ngẫu nhiên · H gió 0 · R hồi bia + địa hình · Esc: menu'

/** Chế độ tập bắn (Phase 1): một xe đứng yên + 3 bia. */
export class PracticeMode implements Mode {
  private readonly range: AimRange = { min: 0, max: 90 }
  private readonly practice: Practice
  private readonly aim = new AimInput()
  private readonly shotBar: ShotBar
  private mobileIdx = 0
  private wind: Wind = { x: 0, y: 0 }
  private playback: ShotPlayback | null = null
  private lastHash: boolean | null = null
  private lastExplode = ''
  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.repeat || this.playback) return
    if (e.code === 'KeyG') { this.wind = makeWind(mulberry32(hashSeed(String(performance.now())))); this.ctx.hud.setWind(this.wind) }
    else if (e.code === 'KeyH') { this.wind = { x: 0, y: 0 }; this.ctx.hud.setWind(this.wind) }
    else if (e.code === 'KeyM') this.setMobile((this.mobileIdx + 1) % MOBILE_IDS.length)
    else if (e.code === 'KeyR') { this.ctx.view.reset(); this.practice.resetHp() }
  }

  constructor(private readonly ctx: GameCtx, mobileId?: string) {
    ctx.view.reset()
    this.practice = new Practice(ctx.view.mask)
    ctx.world.addChildAt(this.practice.container, ctx.world.getChildIndex(ctx.view.sprite) + 1)
    ctx.hud.setVisible(true)
    ctx.hud.setHelp(HELP)
    ctx.hud.setWind(this.wind)
    ctx.hud.setWeatherTurn(null)
    ctx.cam.follow(this.practice.shooter.x, this.practice.shooter.y, 1)
    window.addEventListener('keydown', this.onKey)
    this.aim.ssReady = true   // tập bắn: SS luôn sẵn sàng
    this.shotBar = new ShotBar(slot => { this.aim.slot = slot })
    this.setMobile(Math.max(0, MOBILE_IDS.findIndex(id => id === mobileId)))
    this.aim.onFire = (angle, power, slot) => this.fire(angle, power, slot)
  }

  private setMobile(i: number): void {
    this.mobileIdx = i
    const def = TUNING.mobiles[MOBILE_IDS[i]!]!
    this.practice.setMobile(def.id)
    preloadShotArt(def.id)
    this.aim.setRange(def.angleMin, def.angleMax)
  }

  private fire(angle: number, power: number, slot: ShotSlot): void {
    if (this.playback) return
    const { ctx, practice, aim } = this
    const result = simulateShot({
      mask: ctx.view.mask, vehicles: practice.vehicles, wind: this.wind, shooterId: practice.shooter.id,
      facing: aim.facing, tilt: practice.tilt, fire: { angle, power, slot },
    })
    const ex = result.events.find(e => e.kind === 'explode')
    this.lastExplode = ex && ex.kind === 'explode' ? `${ex.x.toFixed(0)}, ${ex.y.toFixed(0)}` : '— (ra ngoài)'
    aim.locked = true
    this.playback = new ShotPlayback(result, ctx.view, ctx.fx, {
      onDamage: (id, _amount, hpAfter) => practice.applyDamage(id, hpAfter),
    }, getShotArt(MOBILE_IDS[this.mobileIdx]!, slot), getShotSfx(MOBILE_IDS[this.mobileIdx]!, slot))
  }

  update(dt: number): void {
    const { ctx, practice, aim } = this
    const def = TUNING.mobiles[MOBILE_IDS[this.mobileIdx]!]!
    const r = aimRange(this.range, def, aim.facing, practice.tilt)
    aim.setRange(r.min, r.max)   // dải góc đổi theo dốc (xe slopeAim)
    aim.update(dt)
    practice.facing = aim.facing
    practice.setAngle(aim.angle)
    practice.draw()
    ctx.hud.setAim(aim.angle, aim.power, aim.lastPower)
    this.shotBar.update(TUNING.mobiles[MOBILE_IDS[this.mobileIdx]!]!, aim.slot, 100, 100)
    ctx.hud.setWind(this.wind, TUNING.mobiles[MOBILE_IDS[this.mobileIdx]!]!.shots[aim.slot].windFactor)
    if (this.playback && this.playback.update(dt)) {
      this.lastHash = this.playback.hashMatches
      this.playback = null
      aim.locked = false
      ctx.focus.x = practice.shooter.x; ctx.focus.y = practice.shooter.y; ctx.focus.t = 0.9
    }
  }

  debugText(): string {
    const { practice, aim, wind } = this
    const s = practice.shooter
    const near = practice.vehicles.filter(v => v.id !== s.id).map(v => Math.abs(v.x - s.x)).sort((a, b) => a - b)[0] ?? 0
    return `[tập bắn] pháo ${MOBILE_IDS[this.mobileIdx]}  đạn ${aim.slot + 1}\n` +
      `góc ${aim.angle}°  lực ${aim.power.toFixed(1)} (trước: ${aim.lastPower.toFixed(1)})  hướng ${aim.facing}\n` +
      `độ dốc xe ${(practice.tilt * 180 / Math.PI).toFixed(1)}°\n` +
      `gió (${wind.x}, ${wind.y}) |${windMagnitude(wind).toFixed(1)}|\n` +
      `bia gần nhất cách ${near.toFixed(0)} px\n` +
      `điểm nổ gần nhất ${this.lastExplode}\n` +
      `tầm tối đa lý thuyết 45°: ${(TUNING.mobiles[MOBILE_IDS[this.mobileIdx]!]!.shots[0].maxSpeed ** 2 / TUNING.gravity).toFixed(0)} px\n` +
      `khớp kết quả bắn: ${this.lastHash === null ? '—' : this.lastHash ? 'có' : 'LỆCH'}`
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKey)
    this.aim.dispose()
    this.shotBar.destroy()
    this.ctx.world.removeChild(this.practice.container)
    this.practice.container.destroy({ children: true })
    this.ctx.fx.hideProjectiles()
  }
}
