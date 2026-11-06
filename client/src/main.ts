import { Application, Container } from 'pixi.js'
import { GAME_NAME, parseMap, type BotLevel } from '@gunb/shared'
import { audio } from './audio'
import { Background } from './background'
import { Camera } from './camera'
import type { GameCtx, Mode } from './ctx'
import { Fx } from './fx'
import { HotseatMode } from './hotseatMode'
import { Hud } from './hud'
import { Menu } from './menu'
import { OnlineFlow } from './onlineFlow'
import { SelectScreen } from './selectScreen'
import { PracticeMode } from './practiceMode'
import { TerrainView } from './terrainView'
import { TuningPanel } from './tuningPanel'
import { WindFx } from './windFx'

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
  const mapId = new URLSearchParams(location.search).get('map') ?? 'dao-noi-ve'
  const base = `/maps/${mapId}/`
  const map = parseMap(await (await fetch(base + 'map.json')).json())
  const img = await loadImage(base + map.terrain)
  if (img.naturalWidth !== map.width || img.naturalHeight !== map.height) throw new Error('kích thước terrain.png không khớp map.json')
  const view = new TerrainView(img, map.width, map.height)

  const app = new Application()
  await app.init({ resizeTo: window, backgroundAlpha: 0, antialias: false, resolution: window.devicePixelRatio, autoDensity: true })
  document.getElementById('game')!.appendChild(app.canvas)

  const bgImages: HTMLImageElement[] | null = map.backgrounds.length > 0
    ? await Promise.all(map.backgrounds.map(b => loadImage(base + b.file))).catch(() => null) : null
  const background = new Background(map, bgImages, app.screen.width, app.screen.height)
  app.stage.addChild(background.container)
  const windFx = new WindFx(app.screen.width, app.screen.height)   // lá + vệt gió, giữa nền và địa hình
  app.stage.addChild(windFx.container)
  const world = new Container()
  const fx = new Fx()
  app.stage.addChild(world)
  world.addChild(view.sprite, fx.container, view.maskSprite)

  const cam = new Camera(map.width, map.height, app.screen.width, app.screen.height)
  cam.y = map.height - app.screen.height
  cam.pan(0, 0)

  const hud = new Hud()
  hud.setVisible(false)
  const tuning = new TuningPanel()
  const ctx: GameCtx = {
    app, world, view, cam, hud, fx, map, keys: new Set<string>(),
    focus: { x: 0, y: 0, t: 0 },
  }

  let mode: Mode | null = null
  const menuBtn = document.getElementById('menubtn') as HTMLButtonElement
  const menu = new Menu({
    onHotseat: n => chooseMobiles(n),
    onVsBot: (n, level) => chooseMobiles(n, level),
    onPractice: () => { setMode(new PracticeMode(ctx)) },
    onOnline: () => startOnline(),
  })
  function setMode(m: Mode | null): void {
    mode?.destroy()
    mode = m
    fx.hideProjectiles()
    // chế độ mới đã đặt điểm camera trong constructor (lượt đầu) nên không xoá; chỉ xoá khi về menu
    if (!m) ctx.focus.t = 0
    if (m) { menu.hide(); menuBtn.style.display = 'block' } else { view.reset(); menu.show(); menuBtn.style.display = 'none'; hud.setVisible(false) }
  }
  let select: SelectScreen | null = null
  function chooseMobiles(n: number, botLevel?: BotLevel): void {
    menu.hide()
    select = new SelectScreen(n, {
      onStart: ids => { select?.destroy(); select = null; startHotseat(n, ids, botLevel) },
      onBack: () => { select?.destroy(); select = null; menu.show() },
    })
  }
  function startHotseat(n: number, ids: string[], botLevel?: BotLevel): void {
    setMode(new HotseatMode(ctx, { perTeam: n, mobileIds: ids, botLevel }, () => startHotseat(n, ids, botLevel), () => setMode(null)))
  }
  let online: OnlineFlow | null = null
  function startOnline(): void {
    menu.hide()
    online = new OnlineFlow({
      ctx,
      startMode: m => setMode(m),
      stopMode: () => { mode?.destroy(); mode = null; fx.hideProjectiles(); ctx.focus.t = 0; view.reset(); hud.setVisible(false); menuBtn.style.display = 'block' },
      exit: () => toMenu(),
    }, () => toMenu())
    menuBtn.style.display = 'block'
  }
  /** Về menu chính từ bất cứ đâu (đóng luôn phiên online nếu có). */
  function toMenu(): void {
    online?.dispose()
    online = null
    setMode(null)
  }
  menuBtn.addEventListener('click', () => toMenu())

  let dragging = false
  let debugOn = false
  const debugEl = document.getElementById('debug')!
  window.addEventListener('keydown', e => {
    ctx.keys.add(e.code)
    if (e.code === 'F3') { e.preventDefault(); debugOn = !debugOn; debugEl.style.display = debugOn ? 'block' : 'none'; view.maskSprite.visible = debugOn }
    else if (e.code === 'F6') { e.preventDefault(); tuning.toggle() }
    else if (e.code === 'Escape' && mode) toMenu()
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
  window.addEventListener('resize', () => { cam.resize(app.screen.width, app.screen.height); background.resize(app.screen.width, app.screen.height); windFx.resize(app.screen.width, app.screen.height) })

  // Âm thanh: trình duyệt chỉ cho phát sau thao tác đầu tiên của người dùng
  const muteBtn = document.getElementById('mutebtn') as HTMLButtonElement
  const syncMute = (): void => { muteBtn.textContent = audio.muted ? '🔇 Tắt tiếng' : '🔊 Âm thanh' }
  syncMute()
  muteBtn.addEventListener('click', () => { audio.unlock(); audio.setMuted(!audio.muted); syncMute(); audio.startMusic() })
  const firstGesture = (): void => { audio.unlock(); audio.startMusic(); window.removeEventListener('pointerdown', firstGesture); window.removeEventListener('keydown', firstGesture) }
  window.addEventListener('pointerdown', firstGesture)
  window.addEventListener('keydown', firstGesture)

  app.ticker.add(t => {
    const dt = Math.min(0.1, t.deltaMS / 1000)
    mode?.update(dt)
    fx.update(dt)
    const lead = fx.lead()

    // Camera: bám đạn khi đang bay, rồi quay về xe; còn lại điều khiển tay (WASD / chuột phải)
    const k = Math.min(1, dt * FOLLOW_K)
    if (lead) cam.follow(lead.x, lead.y, k)
    else if (ctx.focus.t > 0) { ctx.focus.t -= dt; cam.follow(ctx.focus.x, ctx.focus.y, k) }
    let dx = 0, dy = 0
    if (ctx.keys.has('KeyA')) dx -= 1
    if (ctx.keys.has('KeyD')) dx += 1
    if (ctx.keys.has('KeyW')) dy -= 1
    if (ctx.keys.has('KeyS')) dy += 1
    if (dx || dy) { cam.pan(dx * PAN_SPEED * dt, dy * PAN_SPEED * dt); ctx.focus.t = 0 }
    world.position.set(-cam.x + fx.shakeX, -cam.y + fx.shakeY)
    background.update(cam.x, cam.y)
    windFx.update(dt, cam.x, cam.y, hud.wind, hud.visible)

    hud.setOffscreen(lead && lead.y - cam.y < 0 ? lead.x - cam.x : null, lead ? -lead.y : 0)

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
