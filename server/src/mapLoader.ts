import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TerrainMask, parseMap, type MapFile } from '@gunb/shared'
import { decodePngAlpha } from './png'

export const ASSETS_DIR = resolve(fileURLToPath(new URL('../../assets', import.meta.url)))

export interface LoadedMap { meta: MapFile; mask: TerrainMask }

const cache = new Map<string, LoadedMap>()

/** Danh sách bản đồ (thư mục con của assets/maps có map.json). */
export function listMapIds(dir = join(ASSETS_DIR, 'maps')): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter(n => existsSync(join(dir, n, 'map.json'))).sort()
}

/** Đọc bản đồ và dựng mask từ alpha của ảnh địa hình. Mask trả về là bản gốc để sao chép (`clone`), không sửa trực tiếp. */
export function loadMap(mapId: string, dir = join(ASSETS_DIR, 'maps')): LoadedMap {
  if (!/^[a-z0-9-]+$/i.test(mapId)) throw new Error('mapId không hợp lệ')
  const key = `${dir}|${mapId}`
  const hit = cache.get(key)
  if (hit) return hit
  const meta = parseMap(JSON.parse(readFileSync(join(dir, mapId, 'map.json'), 'utf8')))
  const png = decodePngAlpha(readFileSync(join(dir, mapId, meta.terrain)))
  if (png.width !== meta.width || png.height !== meta.height) throw new Error(`terrain.png không khớp map.json (${mapId})`)
  const rgba = new Uint8Array(png.width * png.height * 4)
  for (let i = 0; i < png.alpha.length; i++) rgba[i * 4 + 3] = png.alpha[i]!
  const loaded = { meta, mask: TerrainMask.fromAlpha(meta.width, meta.height, rgba) }
  cache.set(key, loaded)
  return loaded
}
