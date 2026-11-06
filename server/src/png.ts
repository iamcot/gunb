import { inflateSync } from 'node:zlib'

export interface PngAlpha { width: number; height: number; alpha: Uint8Array }

const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }

/**
 * Đọc kênh alpha của file PNG (không cần thư viện ngoài). Hỗ trợ không xen kẽ (non-interlaced), màu 0/2/3/4/6, độ sâu 1–16 bit.
 * Dùng để dựng mask va chạm địa hình trên server từ `terrain.png`.
 */
export function decodePngAlpha(buf: Uint8Array): PngAlpha {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  if (buf.length < 8 || sig.some((b, i) => buf[i] !== b)) throw new Error('không phải file PNG')
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  let pos = 8
  let width = 0, height = 0, depth = 0, color = 0, interlace = 0
  let palette: Uint8Array | null = null
  let trns: Uint8Array | null = null
  const idat: Uint8Array[] = []
  while (pos + 8 <= buf.length) {
    const len = dv.getUint32(pos)
    const type = String.fromCharCode(buf[pos + 4]!, buf[pos + 5]!, buf[pos + 6]!, buf[pos + 7]!)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') { width = dv.getUint32(pos + 8); height = dv.getUint32(pos + 12); depth = data[8]!; color = data[9]!; interlace = data[12]! }
    else if (type === 'PLTE') palette = data
    else if (type === 'tRNS') trns = data
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    pos += 12 + len
  }
  if (!width || !height) throw new Error('PNG thiếu IHDR')
  if (interlace !== 0) throw new Error('PNG xen kẽ (interlaced) chưa hỗ trợ: hãy xuất lại không xen kẽ')
  const ch = CHANNELS[color]
  if (!ch) throw new Error(`kiểu màu PNG ${color} không hỗ trợ`)
  if (color === 3 && !palette) throw new Error('PNG palette thiếu PLTE')

  const raw = inflateSync(Buffer.concat(idat))
  const bitsPerPixel = ch * depth
  const rowBytes = Math.ceil((width * bitsPerPixel) / 8)
  const bpp = Math.max(1, bitsPerPixel >> 3)
  if (raw.length < (rowBytes + 1) * height) throw new Error('dữ liệu PNG bị cắt')

  // bỏ lọc từng hàng, ghi vào `img` (rowBytes * height)
  const img = new Uint8Array(rowBytes * height)
  for (let y = 0; y < height; y++) {
    const f = raw[y * (rowBytes + 1)]!
    const src = y * (rowBytes + 1) + 1
    const dst = y * rowBytes
    for (let i = 0; i < rowBytes; i++) {
      const x = raw[src + i]!
      const a = i >= bpp ? img[dst + i - bpp]! : 0
      const b = y > 0 ? img[dst - rowBytes + i]! : 0
      const c = i >= bpp && y > 0 ? img[dst - rowBytes + i - bpp]! : 0
      let v: number
      switch (f) {
        case 0: v = x; break
        case 1: v = x + a; break
        case 2: v = x + b; break
        case 3: v = x + ((a + b) >> 1); break
        case 4: { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break }
        default: throw new Error(`bộ lọc PNG ${f} không hợp lệ`)
      }
      img[dst + i] = v & 255
    }
  }

  const alpha = new Uint8Array(width * height)
  const bytesPerSample = depth >> 3   // 0 khi độ sâu < 8 (chỉ gặp ở màu 0 và 3)
  for (let y = 0; y < height; y++) {
    const row = y * rowBytes
    for (let x = 0; x < width; x++) {
      let a = 255
      if (color === 6) a = img[row + x * 4 * bytesPerSample + 3 * bytesPerSample]!      // 16 bit: lấy byte cao
      else if (color === 4) a = img[row + x * 2 * bytesPerSample + bytesPerSample]!
      else if (color === 3) {
        let idx: number
        if (depth === 8) idx = img[row + x]!
        else { const bit = x * depth, byte = img[row + (bit >> 3)]!; idx = (byte >> (8 - depth - (bit & 7))) & ((1 << depth) - 1) }
        a = trns && idx < trns.length ? trns[idx]! : 255
      }
      alpha[y * width + x] = a
    }
  }
  return { width, height, alpha }
}
