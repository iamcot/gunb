import type { ShotResult } from '@gunb/shared'
import type { Fx } from './fx'
import type { TerrainView } from './terrainView'

export interface PlaybackHooks {
  onDamage: (id: number, amount: number, hpAfter: number) => void
  onProjectile: (x: number, y: number, visible: boolean) => void
}

/** Phát lại ShotResult theo thời gian thật: đạn bay theo quỹ đạo, tới `t` của sự kiện thì áp hố/sát thương/hiệu ứng. */
export class ShotPlayback {
  hashMatches: boolean | null = null
  private t = 0
  private ev = 0
  private tail = 0
  private done = false

  constructor(private readonly result: ShotResult, private readonly view: TerrainView, private readonly fx: Fx, private readonly hooks: PlaybackHooks) {}

  get finished(): boolean { return this.done }

  /** Trả true khi đã xong (kể cả hiệu ứng nổ). */
  update(dt: number): boolean {
    if (this.done) return true
    this.t += dt
    const evs = this.result.events
    while (this.ev < evs.length && evs[this.ev]!.t <= this.t) {
      const e = evs[this.ev++]!
      if (e.kind === 'explode') this.fx.explosion(e.x, e.y, e.r)
      else if (e.kind === 'carve') this.view.carve(e.x, e.y, e.r)
      else if (e.kind === 'damage') this.hooks.onDamage(e.id, e.amount, e.hpAfter)
    }
    const path = this.result.paths[0]!
    if (this.t < this.result.endT) {
      // tìm đoạn [i, i+1] chứa t (mẫu thưa, quét tuyến tính từ cuối đoạn trước là đủ nhanh cho ~vài trăm điểm)
      let i = 0
      const n = path.length / 3
      while (i + 1 < n && (path[(i + 1) * 3] as number) <= this.t) i++
      if (i + 1 < n) {
        const t0 = path[i * 3] as number, t1 = path[(i + 1) * 3] as number
        const k = t1 > t0 ? (this.t - t0) / (t1 - t0) : 0
        const x = (path[i * 3 + 1] as number) + ((path[(i + 1) * 3 + 1] as number) - (path[i * 3 + 1] as number)) * k
        const y = (path[i * 3 + 2] as number) + ((path[(i + 1) * 3 + 2] as number) - (path[i * 3 + 2] as number)) * k
        this.hooks.onProjectile(x, y, true)
      }
    } else {
      this.hooks.onProjectile(0, 0, false)
      if (this.ev >= evs.length) {
        this.tail += dt
        if (this.tail >= 0.6 && !this.fx.busy) {
          this.hashMatches = this.view.mask.hash() === this.result.terrainHashAfter
          if (!this.hashMatches) console.warn('[playback] hash mask lệch so với server/simulateShot')
          this.done = true
        }
      }
    }
    return this.done
  }
}
