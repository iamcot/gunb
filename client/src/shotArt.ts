import { Texture } from 'pixi.js'
import { audio, type ShotSfx } from './audio'

/** `assets/mobiles/<id>/shots.json`: ảnh 3 loại đạn (vẽ nằm ngang, đầu chĩa sang phải), `length` = chiều dài khi vẽ (px bản đồ),
 *  `upright` = không xoay theo đường bay, chỉ lật trái/phải theo hướng bay (đạn có "đầu trên" như cục đất có lâu đài).
 *  `fire` / `boom` / `bolt` (tuỳ chọn) = file âm thanh lúc bắn / lúc nổ / lúc sét giáng; thiếu thì dùng tiếng tạo bằng code. */
interface ShotsFile { shots: { file: string; length: number; upright?: boolean; fire?: string; boom?: string; bolt?: string }[] }
export interface ShotArt { tex: Texture; length: number; upright: boolean }

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
      return sfx
    }))
    const arts = await Promise.all(f.shots.map(async s => {
      const img = new Image()
      img.src = base + s.file
      await img.decode()
      return { tex: Texture.from(img), length: s.length * SHOT_ART_SCALE, upright: s.upright === true }
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
