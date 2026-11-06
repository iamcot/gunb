import { TerrainMask } from './mask'

/**
 * Nén mask bằng RLE: dãy độ dài các đoạn liên tiếp, bắt đầu bằng đoạn ô trống (có thể dài 0), xen kẽ trống/đất.
 * Mỗi độ dài ghi dạng varint (7 bit/byte). Dùng để gửi địa hình đầy đủ khi lệch hash hoặc khi vào lại trận.
 */
export function encodeMaskRle(mask: TerrainMask): Uint8Array {
  const out: number[] = []
  const d = mask.data
  let cur = 0, run = 0
  const push = (n: number): void => { while (n >= 0x80) { out.push((n & 0x7f) | 0x80); n = Math.floor(n / 128) } out.push(n) }
  for (let i = 0; i < d.length; i++) {
    if (d[i] === cur) run++
    else { push(run); cur = d[i] as number; run = 1 }
  }
  push(run)
  return Uint8Array.from(out)
}

export function decodeMaskRle(width: number, height: number, rle: Uint8Array): TerrainMask {
  const mask = new TerrainMask(width, height)
  const total = width * height
  let pos = 0, i = 0, cur = 0
  while (i < rle.length) {
    let n = 0, shift = 1
    for (;;) {
      if (i >= rle.length) throw new Error('RLE hỏng: thiếu byte')
      const b = rle[i++] as number
      n += (b & 0x7f) * shift
      if (b < 0x80) break
      shift *= 128
    }
    if (pos + n > total) throw new Error('RLE hỏng: vượt kích thước mask')
    if (cur === 1) mask.data.fill(1, pos, pos + n)
    pos += n
    cur ^= 1
  }
  if (pos !== total) throw new Error('RLE hỏng: thiếu dữ liệu')
  return mask
}
