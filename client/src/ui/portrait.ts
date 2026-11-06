/** Ảnh chân dung xe cho giao diện sảnh/phòng: ghép thân + nòng theo `rig.json` (cùng cách VehicleViews ghép), nòng ngóc lên một góc cố định, cắt sát viền. */

interface Rig {
  body: string; barrel: string
  pivot: [number, number]; barrelPivot: [number, number]
  reverse?: boolean; barrelBehind?: boolean; catapult?: boolean
}

/** Góc nòng trên ảnh chân dung (độ, so với phương ngang). Chỉ là hình. */
const PORTRAIT_AIM_DEG = 28

const cache = new Map<string, Promise<string | null>>()

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = url
  await img.decode()
  return img
}

async function render(mobileId: string): Promise<string | null> {
  const base = `/mobiles/${encodeURIComponent(mobileId)}/`
  const res = await fetch(base + 'rig.json')
  if (!res.ok) return null
  const rig = await res.json() as Rig
  const [body, barrel] = await Promise.all([loadImage(base + rig.body), loadImage(base + rig.barrel)])
  const bw = body.naturalWidth, bh = body.naturalHeight
  const W = Math.ceil(bw * 2.4), H = Math.ceil(bh * 2.6)
  const cv = document.createElement('canvas')
  cv.width = W; cv.height = H
  const g = cv.getContext('2d')!
  const flip = rig.reverse ? -1 : 1
  const a = (PORTRAIT_AIM_DEG * Math.PI) / 180
  // giống Pixi: khung lật theo flip; nòng xoay atan2(d.y*flip, d.x) với d = (cos a, −sin a), rồi lật thêm flip
  const rot = rig.catapult ? 0 : Math.atan2(-Math.sin(a) * flip, Math.cos(a))
  g.translate(W / 2, H / 2)
  g.scale(flip, 1)
  const drawBody = (): void => g.drawImage(body, -bw / 2, -bh / 2)
  const drawBarrel = (): void => {
    g.save()
    g.translate((rig.pivot[0] - 0.5) * bw, (rig.pivot[1] - 0.5) * bh)
    g.rotate(rot)
    g.scale(flip, 1)
    g.drawImage(barrel, -rig.barrelPivot[0] * barrel.naturalWidth, -rig.barrelPivot[1] * barrel.naturalHeight)
    g.restore()
  }
  if (rig.barrelBehind) { drawBarrel(); drawBody() } else { drawBody(); drawBarrel() }
  // cắt theo vùng có điểm ảnh
  const px = g.getImageData(0, 0, W, H).data
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (px[(y * W + x) * 4 + 3]! > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  }
  if (x1 < 0) return null
  const pad = 4
  const out = document.createElement('canvas')
  out.width = x1 - x0 + 1 + pad * 2; out.height = y1 - y0 + 1 + pad * 2
  out.getContext('2d')!.drawImage(cv, x0 - pad, y0 - pad, out.width, out.height, 0, 0, out.width, out.height)
  return out.toDataURL('image/png')
}

/** URL ảnh (data:) của xe, quay mặt sang phải; null nếu xe chưa có ảnh. Có cache. */
export function portraitUrl(mobileId: string): Promise<string | null> {
  let p = cache.get(mobileId)
  if (!p) { p = render(mobileId).catch(() => null); cache.set(mobileId, p) }
  return p
}

/** Điền ảnh cho mọi `<img data-portrait="id">` trong `root` (chưa có ảnh thì giữ chữ thay thế). */
export function fillPortraits(root: ParentNode): void {
  root.querySelectorAll<HTMLImageElement>('img[data-portrait]').forEach(img => {
    const id = img.dataset.portrait!
    if (img.dataset.loaded === id) return
    img.dataset.loaded = id
    void portraitUrl(id).then(url => {
      if (img.dataset.portrait !== id) return
      if (url) { img.src = url; img.classList.remove('empty') } else img.classList.add('empty')
    })
  })
}
