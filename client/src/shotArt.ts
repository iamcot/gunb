import { Texture } from 'pixi.js'
import { audio, type ShotSfx } from './audio'

/** `assets/mobiles/<id>/shots.json`: ảnh 3 loại đạn (vẽ nằm ngang, đầu chĩa sang phải), `length` = chiều dài khi vẽ (px bản đồ),
 *  `upright` = không xoay theo đường bay, chỉ lật trái/phải theo hướng bay (đạn có "đầu trên" như cục đất có lâu đài).
 *  `fire` / `boom` / `bolt` / `beam` (tuỳ chọn) = file âm thanh lúc bắn / lúc nổ / lúc sét giáng / lúc vệ tinh bắn laser; thiếu thì dùng tiếng tạo bằng code. */
interface ShotsFile { shots: { file: string; length: number; upright?: boolean; fire?: string; boom?: string; bolt?: string; beam?: string; trail?: 'smoke'; arcs?: number; dig?: string; streak?: string; grow?: GrowFile }[] }
/** `trail: "smoke"` = đạn xả khói + lửa ở đuôi khi bay.
 *  `arcs` = số tia điện (vân sét) nhoáng quanh viên đạn mỗi frame (đạn sét; càng lớn càng nhiều).
 *  `dig` (Chũi Khoan đạn 2/SS) = tên file âm thanh phát lặp khi đạn chui xuyên đất (lúc đó đạn còn vẽ tối + nhòe + rung, bụi đất bắn ra).
 *  `streak` (`#rrggbb`, thường là đạn SS) = vệt xé gió/xé lửa dài sau viên đạn + quầng sáng.
 *  `grow` (đạn airGrow, Ốc / Diều SS) = dạng sau khi "lớn lên": ảnh riêng `file` (+ `length`) nếu có, không thì dùng lại ảnh cũ phóng `scale` lần và nhuộm `tint` (#rrggbb). */
interface GrowFile { file?: string; length?: number; scale?: number; tint?: string }
export interface GrowArt { tex: Texture | null; length: number; scale: number; tint: number }
export interface ShotArt { tex: Texture; length: number; upright: boolean; trail: boolean; arcs: number; dig: boolean; streak: number; grow: GrowArt | null }

/** Phóng to ảnh đạn khi vẽ (chỉ là hình, va chạm vẫn theo shared/). */
const SHOT_ART_SCALE = 2

const cache = new Map<string, (ShotArt | null)[]>()
const sfxCache = new Map<string, ShotSfx[]>()
const loading = new Set<string>()

/** Tải trước ảnh đạn của xe (gọi khi vào trận); chưa tải xong thì getShotArt trả null (vẽ đạn tròn mặc định). */
export function preloadShotArt(mobileId: string): void {
  if (cache.has(mobileId) || loading.has(mobileId)) return
  loading.add(mobileId)
  const base = `/mobiles/${encodeURIComponent(mobileId)}/`
  void (async () => {
    const res = await fetch(base + 'shots.json')
    if (!res.ok) { cache.set(mobileId, []); return }
    const f = await res.json() as ShotsFile
    sfxCache.set(mobileId, f.shots.map(s => {
      const sfx: ShotSfx = {}
      if (s.fire) audio.load(sfx.fire = base + s.fire)
      if (s.boom) audio.load(sfx.boom = base + s.boom)
      if (s.bolt) audio.load(sfx.bolt = base + s.bolt)
      if (s.beam) audio.load(sfx.beam = base + s.beam)
      if (s.dig) audio.load(sfx.dig = base + s.dig)
      return sfx
    }))
    const arts = await Promise.all(f.shots.map(async s => {
      const img = new Image()
      img.src = base + s.file
      await img.decode()
      let grow: GrowArt | null = null
      if (s.grow) {
        let gtex: Texture | null = null
        if (s.grow.file) {
          const gi = new Image()
          gi.src = base + s.grow.file
          try { await gi.decode(); gtex = Texture.from(gi) } catch { gtex = null }   // thiếu ảnh thì dùng lại ảnh cũ
        }
        grow = { tex: gtex, length: (s.grow.length ?? s.length) * SHOT_ART_SCALE, scale: gtex ? 1 : (s.grow.scale ?? 1.4), tint: s.grow.tint ? parseInt(s.grow.tint.replace('#', ''), 16) : 0xffffff }
      }
      return { tex: Texture.from(img), length: s.length * SHOT_ART_SCALE, upright: s.upright === true, trail: s.trail === 'smoke', arcs: s.arcs ?? 0, dig: !!s.dig, streak: s.streak ? parseInt(s.streak.replace('#', ''), 16) : 0, grow }
    }))
    cache.set(mobileId, arts)
  })().catch(() => cache.set(mobileId, [])).finally(() => loading.delete(mobileId))
}

/** Ảnh đạn `slot` (0, 1, 2) của xe, hoặc null nếu chưa có. */
export function getShotArt(mobileId: string, slot: number): ShotArt | null {
  return cache.get(mobileId)?.[slot] ?? null
}

/** Tiếng bắn/nổ của đạn `slot` (0, 1, 2), hoặc null nếu shots.json chưa tải hay không khai báo. */
export function getShotSfx(mobileId: string, slot: number): ShotSfx | null {
  return sfxCache.get(mobileId)?.[slot] ?? null
}
