import { describe, expect, it } from 'vitest'
import { parseMap } from './loadMap'

const ok = {
  id: 'x', name: 'X', width: 100, height: 50, terrain: 'terrain.png', backgrounds: [{ file: 'a.png', parallax: 0.5 }],
  spawnZones: { A: { x1: 0, x2: 30 }, B: { x1: 70, x2: 100 } },
}

describe('parseMap', () => {
  it('nhận map hợp lệ', () => { expect(parseMap(ok).spawnZones.B.x2).toBe(100) })
  it('từ chối vùng xuất phát ngoài bản đồ', () => {
    expect(() => parseMap({ ...ok, spawnZones: { A: { x1: 0, x2: 30 }, B: { x1: 70, x2: 120 } } })).toThrow(/spawnZones\.B/)
  })
  it('từ chối thiếu trường', () => { expect(() => parseMap({ ...ok, terrain: undefined })).toThrow(/terrain/) })
})
