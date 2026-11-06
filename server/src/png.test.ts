import { deflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { loadMap } from './mapLoader'
import { decodePngAlpha } from './png'

const crcTable = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc32 = (b: Buffer): number => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
function png(w: number, h: number, depth: number, color: number, rows: number[][], extra: Buffer[] = [], interlace = 0): Uint8Array {
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = depth; ihdr[9] = color; ihdr[12] = interlace
  const raw = Buffer.from(rows.flatMap(r => [0, ...r]))
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), ...extra, chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

describe('decodePngAlpha', () => {
  it('RGBA 8 bit', () => {
    const r = decodePngAlpha(png(3, 2, 8, 6, [[1, 2, 3, 0, 4, 5, 6, 128, 7, 8, 9, 255], [0, 0, 0, 255, 0, 0, 0, 10, 0, 0, 0, 200]]))
    expect(Array.from(r.alpha)).toEqual([0, 128, 255, 255, 10, 200])
  })
  it('RGBA 16 bit lấy byte cao; xám+alpha; RGB không có alpha', () => {
    expect(Array.from(decodePngAlpha(png(2, 1, 16, 6, [[0, 0, 0, 0, 0, 0, 0xff, 0x00, 0, 0, 0, 0, 0, 0, 0x10, 0xff]])).alpha)).toEqual([0xff, 0x10])
    expect(Array.from(decodePngAlpha(png(2, 1, 8, 4, [[50, 7, 60, 250]])).alpha)).toEqual([7, 250])
    expect(Array.from(decodePngAlpha(png(1, 1, 8, 2, [[1, 2, 3]])).alpha)).toEqual([255])
  })
  it('palette + tRNS, 8 bit và 2 bit', () => {
    const plte = chunk('PLTE', Buffer.from([0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255]))
    const trns = chunk('tRNS', Buffer.from([0, 100]))
    expect(Array.from(decodePngAlpha(png(4, 1, 8, 3, [[0, 1, 2, 3]], [plte, trns])).alpha)).toEqual([0, 100, 255, 255])
    expect(Array.from(decodePngAlpha(png(4, 1, 2, 3, [[0b00011011]], [plte, trns])).alpha)).toEqual([0, 100, 255, 255])
  })
  it('từ chối PNG xen kẽ và dữ liệu không phải PNG', () => {
    expect(() => decodePngAlpha(png(1, 1, 8, 6, [[0, 0, 0, 0]], [], 1))).toThrow(/xen kẽ/)
    expect(() => decodePngAlpha(new Uint8Array([1, 2, 3]))).toThrow()
  })
})

describe('loadMap', () => {
  it('mask server dựng từ terrain.png trùng mask client (hash đã quan sát trên trình duyệt)', () => {
    const { meta, mask } = loadMap('thu-nghiem')
    expect(meta.width).toBe(2400)
    expect(mask.hash().toString(16)).toBe('24fc261a')
  })
  it('chặn mapId lạ', () => { expect(() => loadMap('../x')).toThrow() })
})
