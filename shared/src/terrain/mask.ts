export interface DirtyRect { x0: number; y0: number; x1: number; y1: number }   // x1, y1 là biên loại trừ

const ALPHA_SOLID = 127

/**
 * Mặt nạ va chạm địa hình: 1 byte/ô, 1 = đất, 0 = trống. Toạ độ nguyên pixel, Y hướng xuống.
 * Ngoài biên (trái, phải, trên, dưới) đều coi là trống; đáy bản đồ là vực (rơi ra là chết).
 */
export class TerrainMask {
  readonly data: Uint8Array

  constructor(readonly width: number, readonly height: number, data?: Uint8Array) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new Error('kích thước mask không hợp lệ')
    }
    if (data && data.length !== width * height) throw new Error('độ dài data không khớp kích thước')
    this.data = data ?? new Uint8Array(width * height)
  }

  /** Tạo từ ảnh RGBA (4 byte/pixel): alpha > 127 là đất. */
  static fromAlpha(width: number, height: number, rgba: ArrayLike<number>): TerrainMask {
    if (rgba.length !== width * height * 4) throw new Error('độ dài rgba không khớp kích thước')
    const m = new TerrainMask(width, height)
    const d = m.data
    for (let i = 0, n = width * height; i < n; i++) d[i] = (rgba[i * 4 + 3] as number) > ALPHA_SOLID ? 1 : 0
    return m
  }

  clone(): TerrainMask {
    return new TerrainMask(this.width, this.height, this.data.slice())
  }

  isSolid(x: number, y: number): boolean {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) return false
    return this.data[iy * this.width + ix] === 1
  }

  /**
   * Khoét hố tròn tâm (cx, cy) bán kính r (cả ba làm tròn về số nguyên; ô thuộc hố khi dx²+dy² <= r²).
   * Thuần số nguyên nên mọi máy ra cùng kết quả. Ghi hình chữ nhật đã bị ảnh hưởng vào `out`
   * (đã cắt theo biên; rỗng nếu hố hoàn toàn ngoài bản đồ) rồi trả về chính `out`.
   */
  carveCircle(cx: number, cy: number, r: number, out: DirtyRect = { x0: 0, y0: 0, x1: 0, y1: 0 }): DirtyRect {
    const icx = Math.round(cx)
    const icy = Math.round(cy)
    const ir = Math.round(r)
    const x0 = Math.max(0, icx - ir)
    const x1 = Math.min(this.width, icx + ir + 1)
    const y0 = Math.max(0, icy - ir)
    const y1 = Math.min(this.height, icy + ir + 1)
    out.x0 = x0; out.y0 = y0; out.x1 = Math.max(x0, x1); out.y1 = Math.max(y0, y1)
    if (ir < 0 || x1 <= x0 || y1 <= y0) { out.x1 = out.x0; out.y1 = out.y0; return out }
    const r2 = ir * ir
    for (let y = y0; y < y1; y++) {
      const dy = y - icy
      const row = y * this.width
      for (let x = x0; x < x1; x++) {
        const dx = x - icx
        if (dx * dx + dy * dy <= r2) this.data[row + x] = 0
      }
    }
    return out
  }

  /** Đắp đất hình tròn (ngược của carveCircle): chỉ biến ô trống thành đất. Cùng quy ước làm tròn/biên như carveCircle. */
  fillCircle(cx: number, cy: number, r: number, out: DirtyRect = { x0: 0, y0: 0, x1: 0, y1: 0 }): DirtyRect {
    const icx = Math.round(cx), icy = Math.round(cy), ir = Math.round(r)
    const x0 = Math.max(0, icx - ir), x1 = Math.min(this.width, icx + ir + 1)
    const y0 = Math.max(0, icy - ir), y1 = Math.min(this.height, icy + ir + 1)
    out.x0 = x0; out.y0 = y0; out.x1 = Math.max(x0, x1); out.y1 = Math.max(y0, y1)
    if (ir < 0 || x1 <= x0 || y1 <= y0) { out.x1 = out.x0; out.y1 = out.y0; return out }
    const r2 = ir * ir
    for (let y = y0; y < y1; y++) {
      const dy = y - icy, row = y * this.width
      for (let x = x0; x < x1; x++) {
        const dx = x - icx
        if (dx * dx + dy * dy <= r2) this.data[row + x] = 1
      }
    }
    return out
  }

  /** Số ô đất còn lại. */
  countSolid(): number {
    let n = 0
    for (let i = 0; i < this.data.length; i++) n += this.data[i] as number
    return n
  }

  /** Băm FNV-1a 32-bit toàn bộ mask, để so sánh server/client. */
  hash(): number {
    let h = 0x811c9dc5
    const d = this.data
    for (let i = 0; i < d.length; i++) {
      h ^= d[i] as number
      h = Math.imul(h, 0x01000193)
    }
    return h >>> 0
  }
}
