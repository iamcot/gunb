import { Application, Container, Graphics } from 'pixi.js'
import { GAME_NAME, parseMap } from '@gunb/shared'
import { Camera } from './camera'
import type { GameCtx, Mode } from './ctx'
import { Fx } from './fx'
import { HotseatMode } from './hotseatMode'
import { Hud } from './hud'
import { Menu } from './menu'
import { PracticeMode } from './practiceMode'
import { TerrainView } from './terrainView'
import { TuningPanel } from './tuningPanel'

const PAN_SPEED = 900     // px/s (WASD)
const FOLLOW_K = 6        // hệ số bám đạn / quay về xe (1/s)

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
  const img = await loadImage(base + map.terrain)
  if (img.naturalWidth !== map.width || img.naturalHeight !== map.height) throw new Error('kích thước terrain.png không khớp map.json')
  const view = new TerrainView(img, map.width, map.height)

  const app = new Application()
  await app.init({ resizeTo: window, backgroundAlpha: 0, antialias: false, resolution: window.devicePixelRatio, autoDensity: true })
  document.getElementById('game')!.appendChild(app.canvas)

  const world = new Container()
  const fx = new Fx()
  const projectile = new Graphics().circle(0, 0, 5).fill(0x111111).stroke({ color: 0xffffff, width: 1.5 })
  projectile.visible = false
  app.stage.addChild(world)
  world.addChild(view.sprite, projectile, fx.container, view.maskSprite)

  const cam = new Camera(map.width, map.height, app.screen.width, app.screen.height)
  cam.y = map.height - app.screen.height
  cam.pan(0, 0)

  const hud = new Hud()
  hud.setVisible(false)
  const tuning = new TuningPanel()
  const ctx: GameCtx = {
    app, world, view, cam, hud, fx, map, keys: new Set<string>(), projectile,
    proj: { x: 0, y: 0, visible: false }, focus: { x: 0, y: 0, t: 0 },
  }

  let mode: Mode | null = null
  const menuBtn = document.getElementById('menubtn') as HTMLButtonElement
  const menu = new Menu({
    onHotseat: n => startHotseat(n),
    onPractice: () => { setMode(new PracticeMode(ctx)) },
  })
  function setMode(m: Mode | null): void {
    mode?.destroy()
    mode = m
    ctx.proj.visible = false
    ctx.focus.t = 0
    if (m) { menu.hide(); menuBtn.style.display = 'block' } else { view.reset(); menu.show(); menuBtn.style.display = 'none'; hud.setVisible(false) }
  }
  function startHotseat(n: number): void {
    setMode(new HotseatMode(ctx, { perTeam: n }, () => startHotseat(n), () => setMode(null)))
  }
  menuBtn.addEventListener('click', () => setMode(null))

  let dragging = false
  let debugOn = false
  const debugEl = document.getElementById('debug')!
  window.addEventListener('keydown', e => {
    ctx.keys.add(e.code)
    if (e.code === 'F3') { e.preventDefault(); debugOn = !debugOn; debugEl.style.display = debugOn ? 'block' : 'none'; view.maskSprite.visible = debugOn }
    else if (e.code === 'F6') { e.preventDefault(); tuning.toggle() }
    else if (e.code === 'Escape' && mode) setMode(null)
  })
  window.addEventListener('keyup', e => ctx.keys.delete(e.code))
  window.addEventListener('blur', () => ctx.keys.clear())
  window.addEventListener('contextmenu', e => e.preventDefault())
  app.canvas.addEventListener('mousedown', e => { if (e.button === 2) dragging = true })
  window.addEventListener('mouseup', e => { if (e.button === 2) dragging = false })
  let mouseX = 0, mouseY = 0
  window.addEventListener('mousemove', e => {
    if (dragging) { cam.pan(-e.movementX, -e.movementY); ctx.focus.t = 0 }
    mouseX = e.clientX
    mouseY = e.clientY
  })
  window.addEventListener('resize', () => cam.resize(app.screen.width, app.screen.height))

  app.ticker.add(t => {
    const dt = Math.min(0.1, t.deltaMS / 1000)
    mode?.update(dt)
    fx.update(dt)
    projectile.visible = ctx.proj.visible
    projectile.position.set(ctx.proj.x, ctx.proj.y)

    // Camera: bám đạn khi đang bay, rồi quay về xe; còn lại điều khiển tay (WASD / chuột phải)
    const k = Math.min(1, dt * FOLLOW_K)
    if (ctx.proj.visible) cam.follow(ctx.proj.x, ctx.proj.y, k)
    else if (ctx.focus.t > 0) { ctx.focus.t -= dt; cam.follow(ctx.focus.x, ctx.focus.y, k) }
    let dx = 0, dy = 0
    if (ctx.keys.has('KeyA')) dx -= 1
    if (ctx.keys.has('KeyD')) dx += 1
    if (ctx.keys.has('KeyW')) dy -= 1
    if (ctx.keys.has('KeyS')) dy += 1
    if (dx || dy) { cam.pan(dx * PAN_SPEED * dt, dy * PAN_SPEED * dt); ctx.focus.t = 0 }
    world.position.set(-cam.x + fx.shakeX, -cam.y + fx.shakeY)

    hud.setOffscreen(ctx.proj.visible && ctx.proj.y - cam.y < 0 ? ctx.proj.x - cam.x : null, -ctx.proj.y)

    if (debugOn) {
      const wx = Math.floor(mouseX + cam.x), wy = Math.floor(mouseY + cam.y)
      debugEl.textContent =
        `FPS ${app.ticker.FPS.toFixed(0)}\n` +
        `camera ${cam.x.toFixed(0)}, ${cam.y.toFixed(0)}\n` +
        `chuột (bản đồ) ${wx}, ${wy}  [${view.mask.isSolid(wx, wy) ? 'ĐẤT' : 'trống'}]\n` +
        `hash mask ${view.mask.hash().toString(16)}\n` +
        (mode ? mode.debugText() : '[menu]') + '\n(lớp hồng = mask va chạm)'
    }
  })
}

main().catch(err => {
  console.error(err)
  document.body.insertAdjacentHTML('beforeend', `<pre style="position:fixed;top:40px;left:12px;color:#fff;background:#a00;padding:8px">${String(err)}</pre>`)
})
