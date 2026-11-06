// Sinh bản đồ thử nghiệm: assets/maps/thu-nghiem/{terrain.png,map.json}. Chạy: npm run gen-test-map
// Không dùng thư viện ngoài: tự ghi PNG RGBA bằng zlib. Kết quả xác định (seed cố định).
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const W = 2400, H = 1200, SEED = 20260611
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'maps', 'thu-nghiem')

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(SEED)

// Độ cao mặt đất: tổng vài sóng sin ngẫu nhiên pha, đáy hố giữa bản đồ
const waves = [[1 / 520, 150], [1 / 230, 70], [1 / 95, 28], [1 / 41, 9]].map(([f, a]) => [f, a, rnd() * Math.PI * 2])
const surface = new Float64Array(W)
for (let x = 0; x < W; x++) {
  let h = 640
  for (const [f, a, p] of waves) h += Math.sin(x * f * 2 * Math.PI + p) * a
  surface[x] = h
}

const solid = new Uint8Array(W * H)
for (let x = 0; x < W; x++) for (let y = Math.round(surface[x]); y < H; y++) solid[y * W + x] = 1

// Vài hang tròn ngầm
for (let i = 0; i < 9; i++) {
  const cx = Math.floor(rnd() * W), cy = 800 + Math.floor(rnd() * 300), r = 40 + Math.floor(rnd() * 60)
  for (let y = Math.max(0, cy - r); y < Math.min(H, cy + r); y++)
    for (let x = Math.max(0, cx - r); x < Math.min(W, cx + r); x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) solid[y * W + x] = 0
}

// Tô màu: cỏ ở lớp trên cùng, đất nâu bên dưới có nhiễu nhẹ
const rgba = Buffer.alloc(W * H * 4)
for (let x = 0; x < W; x++) {
  let depth = 0
  for (let y = 0; y < H; y++) {
    const i = (y * W + x) * 4
    if (!solid[y * W + x]) { depth = 0; continue }
    const n = ((x * 73856093) ^ (y * 19349663)) & 15
    if (depth < 8) { rgba[i] = 70 + n; rgba[i + 1] = 150 + n; rgba[i + 2] = 60 }
    else { const k = Math.max(0, 1 - y / H * 0.5); rgba[i] = (130 + n) * k; rgba[i + 1] = (90 + n) * k; rgba[i + 2] = 55 * k }
    rgba[i + 3] = 255
    depth++
  }
}

// --- ghi PNG ---
const crcTable = new Uint32Array(256)
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0 }
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6   // 8 bit, RGBA
const raw = Buffer.alloc((W * 4 + 1) * H)
for (let y = 0; y < H; y++) rgba.copy(raw, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4)   // byte lọc = 0
const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
])

mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'terrain.png'), png)
writeFileSync(join(outDir, 'map.json'), JSON.stringify({
  id: 'thu-nghiem', name: 'Bản đồ thử nghiệm', width: W, height: H, terrain: 'terrain.png', backgrounds: [],
  spawnZones: { A: { x1: 100, x2: 600 }, B: { x1: 1800, x2: 2300 } },
}, null, 2) + '\n')
console.log(`đã ghi ${outDir} (${(png.length / 1024).toFixed(0)} KB)`)
