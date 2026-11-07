/** Ảnh chân dung xe cho giao diện sảnh/phòng: ghép thân + nòng theo `rig.json` (cùng cách VehicleViews ghép), nòng ngóc lên một góc cố định, cắt sát viền. */

interface Rig {
  body: string; barrel: string; width?: number; pilot?: [number, number]
  pivot: [number, number]; barrelPivot: [number, number]
  reverse?: boolean; barrelBehind?: boolean; catapult?: boolean
}

/** Góc nòng trên ảnh chân dung (độ, so với phương ngang). Chỉ là hình. */
const PORTRAIT_AIM_DEG = 28

interface PilotInfo { sit: string; hip: [number, number]; sitHeight: number }
let pilotP: Promise<{ info: PilotInfo; sit: HTMLImageElement } | null> | null = null
function loadPilot(): Promise<{ info: PilotInfo; sit: HTMLImageElement } | null> {
  pilotP ??= (async () => {
    const res = await fetch('/pilots/nam/pilot.json')
    if (!res.ok) return null
    const info = await res.json() as PilotInfo
    return { info, sit: await loadImage('/pilots/nam/' + info.sit) }
  })().catch(() => null)
  return pilotP
}

const cache = new Map<string, Promise<string | null>>()

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = url
  await img.decode()
  return img
}

async function render(mobileId: string, withPilot: boolean): Promise<string | null> {
  const base = `/mobiles/${encodeURIComponent(mobileId)}/`
  const res = await fetch(base + 'rig.json')
  if (!res.ok) return null
  const rig = await res.json() as Rig
  const pil = withPilot && rig.pilot ? await loadPilot() : null
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
  // phi công ngồi trên ghế (giống VehicleViews): vẽ trên thân, dưới nòng; nòng sau thân thì vẽ trên cùng
  const drawPilot = (): void => {
    if (!pil || !rig.pilot) return
    const k = (pil.info.sitHeight * bw / (rig.width ?? bw)) / pil.sit.naturalHeight
    g.drawImage(pil.sit, (rig.pilot[0] - 0.5) * bw - pil.info.hip[0] * pil.sit.naturalWidth * k, (rig.pilot[1] - 0.5) * bh - pil.info.hip[1] * pil.sit.naturalHeight * k, pil.sit.naturalWidth * k, pil.sit.naturalHeight * k)
  }
  if (rig.barrelBehind) { drawBarrel(); drawBody(); drawPilot() } else { drawBody(); drawPilot(); drawBarrel() }
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
export function portraitUrl(mobileId: string, withPilot = false): Promise<string | null> {
  const key = withPilot ? mobileId + '|pilot' : mobileId
  let p = cache.get(key)
  if (!p) { p = render(mobileId, withPilot).catch(() => null); cache.set(key, p) }
  return p
}

/** Điền ảnh cho mọi `<img data-portrait="id">` trong `root` (chưa có ảnh thì giữ chữ thay thế). */
export function fillPortraits(root: ParentNode): void {
  root.querySelectorAll<HTMLImageElement>('img[data-portrait]').forEach(img => {
    const id = img.dataset.portrait!
    const withPilot = img.dataset.pilot === '1'
    const key = withPilot ? id + '|pilot' : id
    if (img.dataset.loaded === key) return
    img.dataset.loaded = key
    void portraitUrl(id, withPilot).then(url => {
      if (img.dataset.portrait !== id) return
      if (url) { img.src = url; img.classList.remove('empty') } else img.classList.add('empty')
    })
  })
}
