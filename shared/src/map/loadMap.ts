import type { MapFile, SpawnZone } from './types'

function fail(msg: string): never { throw new Error(`map.json: ${msg}`) }

function isObj(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null && !Array.isArray(v) }

function parseZone(v: unknown, name: string, width: number): SpawnZone {
  if (!isObj(v)) fail(`thiếu spawnZones.${name}`)
  const { x1, x2 } = v
  if (typeof x1 !== 'number' || typeof x2 !== 'number') fail(`spawnZones.${name} phải có x1, x2 là số`)
  if (!(0 <= x1 && x1 < x2 && x2 <= width)) fail(`spawnZones.${name} nằm ngoài bản đồ hoặc x1 >= x2`)
  return { x1, x2 }
}

/** Kiểm tra và chuyển JSON thô thành MapFile; ném lỗi tiếng Việt nếu sai. */
export function parseMap(raw: unknown): MapFile {
  if (!isObj(raw)) fail('không phải object')
  const { id, name, width, height, terrain, backgrounds, spawnZones, music } = raw
  if (typeof id !== 'string' || id === '') fail('thiếu id')
  if (typeof name !== 'string') fail('thiếu name')
  if (typeof width !== 'number' || !Number.isInteger(width) || width <= 0) fail('width phải là số nguyên dương')
  if (typeof height !== 'number' || !Number.isInteger(height) || height <= 0) fail('height phải là số nguyên dương')
  if (typeof terrain !== 'string' || terrain === '') fail('thiếu terrain')
  if (!Array.isArray(backgrounds)) fail('backgrounds phải là mảng')
  const bgs = backgrounds.map((b, i) => {
    if (!isObj(b) || typeof b.file !== 'string' || typeof b.parallax !== 'number') fail(`backgrounds[${i}] sai định dạng`)
    return { file: b.file, parallax: b.parallax }
  })
  if (!isObj(spawnZones)) fail('thiếu spawnZones')
  const map: MapFile = {
    id, name, width, height, terrain, backgrounds: bgs,
    spawnZones: { A: parseZone(spawnZones.A, 'A', width), B: parseZone(spawnZones.B, 'B', width) },
  }
  if (music !== undefined) {
    if (typeof music !== 'string') fail('music phải là chuỗi')
    map.music = music
  }
  return map
}
