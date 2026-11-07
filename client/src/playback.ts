import type { ShotResult } from '@gunb/shared'
import { audio, type ShotSfx } from './audio'
import type { Fx } from './fx'
import type { ShotArt } from './shotArt'
import type { TerrainView } from './terrainView'

export interface PlaybackHooks {
  onDamage: (id: number, amount: number, hpAfter: number) => void
  /** Quả dịch chuyển chạm (item): xe người bắn sẽ tới đây khi phát lại xong. */
  onTeleport?: (x: number, y: number) => void
}

/** Phát lại ShotResult theo thời gian thật: mỗi viên đạn bay theo quỹ đạo của nó; tới `t` của sự kiện thì áp hố/sát thương/hiệu ứng. */
export class ShotPlayback {
  hashMatches: boolean | null = null
  private t = 0
  private ev = 0
  private tail = 0
  private done = false
  private readonly cursor: number[]

  constructor(private readonly result: ShotResult, private readonly view: TerrainView, private readonly fx: Fx, private readonly hooks: PlaybackHooks, art: ShotArt | null = null, private readonly sfx: ShotSfx | null = null) {
    this.cursor = result.paths.map(() => 0)
    fx.setShellArt(art)
    audio.fire(sfx?.fire)
    const p0 = result.paths[0]
    if (p0 && p0.length >= 6) fx.muzzle(p0[1] as number, p0[2] as number, Math.atan2((p0[5] as number) - (p0[2] as number), (p0[4] as number) - (p0[1] as number)))
  }

  get finished(): boolean { return this.done }

  /** Trả true khi đã xong (kể cả hiệu ứng nổ). */
  update(dt: number): boolean {
    if (this.done) return true
    this.t += dt
    const evs = this.result.events
    while (this.ev < evs.length && evs[this.ev]!.t <= this.t) {
      const e = evs[this.ev++]!
      switch (e.kind) {
        case 'explode': this.fx.explosion(e.x, e.y, e.r, true, this.view.sampleColor(e.x, e.y, e.r)); audio.explode(e.r, this.sfx?.boom); break
        case 'carve': this.view.carve(e.x, e.y, e.r); break
        case 'fill': this.view.fill(e.x, e.y, e.r); break
        case 'damage': this.hooks.onDamage(e.id, e.amount, e.hpAfter); audio.hit(); break
        case 'bolt': this.fx.bolt(e.x, e.y); audio.bolt(this.sfx?.bolt); break
        case 'split': this.fx.explosion(e.x, e.y, 16, false); break
        case 'teleport': this.fx.soulBurst(e.x, e.y); this.hooks.onTeleport?.(e.x, e.y); break
        default: break
      }
    }
    for (let k = 0; k < this.result.paths.length; k++) this.placeShell(k)
    if (this.t >= this.result.endT && this.ev >= evs.length) {
      this.tail += dt
      if (this.tail >= 0.6 && !this.fx.busy) {
        this.fx.hideProjectiles()
        this.hashMatches = this.view.mask.hash() === this.result.terrainHashAfter
        if (!this.hashMatches) console.warn('[playback] hash mask lệch so với kết quả mô phỏng')
        this.done = true
      }
    }
    return this.done
  }

  /** Đặt viên đạn thứ k theo đường bay: ẩn trước khi bắn (đạn bắn liền) và sau điểm cuối. */
  private placeShell(k: number): void {
    const path = this.result.paths[k]!
    const n = path.length / 3
    const tFirst = path[0] as number, tLast = path[(n - 1) * 3] as number
    if (this.t < tFirst || this.t >= tLast) { this.fx.setProjectile(k, 0, 0, false); return }
    let i = this.cursor[k]!
    while (i + 1 < n && (path[(i + 1) * 3] as number) <= this.t) i++
    this.cursor[k] = i
    const t0 = path[i * 3] as number, t1 = path[(i + 1) * 3] as number
    const f = t1 > t0 ? (this.t - t0) / (t1 - t0) : 0
    const x0 = path[i * 3 + 1] as number, y0 = path[i * 3 + 2] as number
    const x1 = path[(i + 1) * 3 + 1] as number, y1 = path[(i + 1) * 3 + 2] as number
    this.fx.setProjectile(k, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, true, Math.atan2(y1 - y0, x1 - x0))
  }
}
