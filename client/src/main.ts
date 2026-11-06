import { Application, Container, Sprite, Texture } from 'pixi.js'
import { GAME_NAME, TerrainMask, parseMap } from '@gunb/shared'
import { Camera } from './camera'

const PAN_SPEED = 900   // px/s (WASD / phím mũi tên)

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = url
  await img.decode()
  return img
}

async function main(): Promise<void> {
  document.getElementById('title')!.textContent = GAME_NAME
  const mapId = new URLSearchParams(location.search).get('map') ?? 'thu-nghiem'
  const base = `/maps/${mapId}/`
  const map = parseMap(await (await fetch(base + 'map.json')).json())

  // Ảnh địa hình → canvas (để sau này xoá hố bằng destination-out) + mask va chạm từ alpha
  const img = await loadImage(base + map.terrain)
  if (img.naturalWidth !== map.width || img.naturalHeight !== map.height) throw new Error('kích thước terrain.png không khớp map.json')
  const canvas = document.createElement('canvas')
  canvas.width = map.width
  canvas.height = map.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  const mask = TerrainMask.fromAlpha(map.width, map.height, ctx.getImageData(0, 0, map.width, map.height).data)

  const host = document.getElementById('game')!
  const app = new Application()
  await app.init({ resizeTo: window, backgroundAlpha: 0, antialias: false, resolution: window.devicePixelRatio, autoDensity: true })
  host.appendChild(app.canvas)

  const world = new Container()
  app.stage.addChild(world)
  world.addChild(new Sprite(Texture.from(canvas)))

  const cam = new Camera(map.width, map.height, app.screen.width, app.screen.height)
  cam.pan(0, 0)
  cam.y = map.height - app.screen.height   // bắt đầu nhìn từ đáy bản đồ lên
  cam.pan(0, 0)

  // Điều khiển camera: giữ chuột phải kéo, hoặc WASD / mũi tên
  const keys = new Set<string>()
  let dragging = false
  window.addEventListener('keydown', e => {
    keys.add(e.code)
    if (e.code === 'F3') { e.preventDefault(); debugEl.style.display = debugEl.style.display === 'none' || !debugEl.style.display ? 'block' : 'none' }
  })
  window.addEventListener('keyup', e => keys.delete(e.code))
  window.addEventListener('blur', () => keys.clear())
  window.addEventListener('contextmenu', e => e.preventDefault())
  const canvasEl = app.canvas
  canvasEl.addEventListener('mousedown', e => { if (e.button === 2) dragging = true })
  window.addEventListener('mouseup', e => { if (e.button === 2) dragging = false })
  let mouseX = 0, mouseY = 0
  window.addEventListener('mousemove', e => {
    if (dragging) cam.pan(-e.movementX, -e.movementY)
    mouseX = e.clientX
    mouseY = e.clientY
  })
  window.addEventListener('resize', () => cam.resize(app.screen.width, app.screen.height))

  const debugEl = document.getElementById('debug')!
  app.ticker.add(t => {
    const dt = t.deltaMS / 1000
    let dx = 0, dy = 0
    if (keys.has('KeyA') || keys.has('ArrowLeft')) dx -= 1
    if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1
    if (keys.has('KeyW') || keys.has('ArrowUp')) dy -= 1
    if (keys.has('KeyS') || keys.has('ArrowDown')) dy += 1
    if (dx || dy) cam.pan(dx * PAN_SPEED * dt, dy * PAN_SPEED * dt)
    world.position.set(-cam.x, -cam.y)

    if (debugEl.style.display === 'block') {
      const wx = Math.floor(mouseX + cam.x), wy = Math.floor(mouseY + cam.y)
      debugEl.textContent =
        `FPS ${app.ticker.FPS.toFixed(0)}\n` +
        `camera ${cam.x.toFixed(0)}, ${cam.y.toFixed(0)}\n` +
        `chuột (bản đồ) ${wx}, ${wy}\n` +
        `ô dưới chuột: ${mask.isSolid(wx, wy) ? 'ĐẤT' : 'trống'}\n` +
        `hash mask ${mask.hash().toString(16)}`
    }
  })
}

main().catch(err => {
  console.error(err)
  document.body.insertAdjacentHTML('beforeend', `<pre style="position:fixed;top:40px;left:12px;color:#fff;background:#a00;padding:8px">${String(err)}</pre>`)
})
