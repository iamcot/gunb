import { Application, Container, Graphics, Sprite } from 'pixi.js'
import {
  GAME_NAME, TUNING, hashSeed, makeWind, mulberry32, parseMap, simulateShot, windMagnitude, type Wind,
} from '@gunb/shared'
import { Camera } from './camera'
import { Fx } from './fx'
import { Hud } from './hud'
import { AimInput } from './input'
import { ShotPlayback } from './playback'
import { Practice } from './practice'
import { TerrainView } from './terrainView'
import { TuningPanel } from './tuningPanel'

const PAN_SPEED = 900     // px/s (WASD)
const FOLLOW_K = 6        // hệ số bám đạn (1/s)
const RETURN_S = 0.9      // sau khi bắn xong, camera quay về xe trong khoảng này

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
  const practice = new Practice(view.mask)
  const fx = new Fx()
  const projectile = new Graphics().circle(0, 0, 5).fill(0x111111).stroke({ color: 0xffffff, width: 1.5 })
  projectile.visible = false
  app.stage.addChild(world)
  world.addChild(view.sprite, practice.container, projectile, fx.container, view.maskSprite)

  const cam = new Camera(map.width, map.height, app.screen.width, app.screen.height)
  cam.y = map.height - app.screen.height
  cam.follow(practice.shooter.x, practice.shooter.y, 1)

  const hud = new Hud()
  const tuning = new TuningPanel()
  const aim = new AimInput()
  let wind: Wind = { x: 0, y: 0 }
  let playback: ShotPlayback | null = null
  let returnT = 0
  let lastHash: boolean | null = null
  let lastExplode = ''
  const projPos = { x: 0, y: 0, visible: false }
  hud.setWind(wind)

  aim.onFire = (angle, power) => {
    if (playback) return
    const result = simulateShot({
      mask: view.mask, vehicles: practice.vehicles, wind, shooterId: practice.shooter.id,
      facing: aim.facing, tilt: practice.tilt, fire: { angle, power, shotType: 'basic' },
    })
    const ex = result.events.find(e => e.kind === 'explode')
    lastExplode = ex && ex.kind === 'explode' ? `${ex.x.toFixed(0)}, ${ex.y.toFixed(0)}` : '— (ra ngoài)'
    aim.locked = true
    playback = new ShotPlayback(result, view, fx, {
      onDamage: (id, _amount, hpAfter) => practice.applyDamage(id, hpAfter),
      onProjectile: (x, y, visible) => { projPos.x = x; projPos.y = y; projPos.visible = visible },
    })
  }

  // Phím khác: camera, gió, hồi bia, panel
  const keys = new Set<string>()
  let dragging = false
  let debugOn = false
  const debugEl = document.getElementById('debug')!
  window.addEventListener('keydown', e => {
    keys.add(e.code)
    if (e.code === 'F3') { e.preventDefault(); debugOn = !debugOn; debugEl.style.display = debugOn ? 'block' : 'none'; view.maskSprite.visible = debugOn }
    else if (e.code === 'F6') { e.preventDefault(); tuning.toggle() }
    else if (e.repeat) return
    else if (e.code === 'KeyG' && !playback) { wind = makeWind(mulberry32(hashSeed(String(performance.now())))); hud.setWind(wind) }
    else if (e.code === 'KeyH' && !playback) { wind = { x: 0, y: 0 }; hud.setWind(wind) }
    else if (e.code === 'KeyR' && !playback) { view.reset(); practice.resetHp() }
  })
  window.addEventListener('keyup', e => keys.delete(e.code))
  window.addEventListener('blur', () => keys.clear())
  window.addEventListener('contextmenu', e => e.preventDefault())
  app.canvas.addEventListener('mousedown', e => { if (e.button === 2) dragging = true })
  window.addEventListener('mouseup', e => { if (e.button === 2) dragging = false })
  let mouseX = 0, mouseY = 0
  window.addEventListener('mousemove', e => {
    if (dragging) { cam.pan(-e.movementX, -e.movementY); returnT = 0 }
    mouseX = e.clientX
    mouseY = e.clientY
  })
  window.addEventListener('resize', () => cam.resize(app.screen.width, app.screen.height))

  app.ticker.add(t => {
    const dt = Math.min(0.1, t.deltaMS / 1000)
    aim.update(dt)
    practice.facing = aim.facing
    practice.setAngle(aim.angle)
    practice.draw()
    hud.setAim(aim.angle, aim.power, aim.lastPower)

    if (playback) {
      if (playback.update(dt)) {
        lastHash = playback.hashMatches
        playback = null
        aim.locked = false
        projPos.visible = false
        returnT = RETURN_S
      }
    }
    fx.update(dt)
    projectile.visible = projPos.visible
    projectile.position.set(projPos.x, projPos.y)

    // Camera: bám đạn khi đang bay, rồi quay về xe; còn lại điều khiển tay (WASD)
    if (projPos.visible) cam.follow(projPos.x, projPos.y, Math.min(1, dt * FOLLOW_K))
    else if (returnT > 0) { returnT -= dt; cam.follow(practice.shooter.x, practice.shooter.y, Math.min(1, dt * FOLLOW_K)) }
    let dx = 0, dy = 0
    if (keys.has('KeyA')) dx -= 1
    if (keys.has('KeyD')) dx += 1
    if (keys.has('KeyW')) dy -= 1
    if (keys.has('KeyS')) dy += 1
    if (dx || dy) { cam.pan(dx * PAN_SPEED * dt, dy * PAN_SPEED * dt); returnT = 0 }
    world.position.set(-cam.x + fx.shakeX, -cam.y + fx.shakeY)

    hud.setOffscreen(projPos.visible && projPos.y - cam.y < 0 ? projPos.x - cam.x : null, -projPos.y)

    if (debugOn) {
      const wx = Math.floor(mouseX + cam.x), wy = Math.floor(mouseY + cam.y)
      const s = practice.shooter
      const near = practice.vehicles.filter(v => v.id !== s.id).map(v => Math.abs(v.x - s.x)).sort((a, b) => a - b)[0] ?? 0
      debugEl.textContent =
        `FPS ${app.ticker.FPS.toFixed(0)}\n` +
        `camera ${cam.x.toFixed(0)}, ${cam.y.toFixed(0)}\n` +
        `chuột (bản đồ) ${wx}, ${wy}  [${view.mask.isSolid(wx, wy) ? 'ĐẤT' : 'trống'}]\n` +
        `góc ${aim.angle}°  lực ${aim.power.toFixed(1)} (trước: ${aim.lastPower.toFixed(1)})  hướng ${aim.facing}\n` +
        `độ dốc xe ${(practice.tilt * 180 / Math.PI).toFixed(1)}°\n` +
        `gió (${wind.x}, ${wind.y}) |${windMagnitude(wind).toFixed(1)}|\n` +
        `bia gần nhất cách ${near.toFixed(0)} px\n` +
        `điểm nổ gần nhất ${lastExplode}\n` +
        `tầm tối đa lý thuyết 45°: ${(TUNING.shots.basic.maxSpeed ** 2 / TUNING.gravity).toFixed(0)} px\n` +
        `hash mask ${view.mask.hash().toString(16)}  khớp kết quả bắn: ${lastHash === null ? '—' : lastHash ? 'có' : 'LỆCH'}\n` +
        `(lớp hồng = mask va chạm)`
    }
  })
}

main().catch(err => {
  console.error(err)
  document.body.insertAdjacentHTML('beforeend', `<pre style="position:fixed;top:40px;left:12px;color:#fff;background:#a00;padding:8px">${String(err)}</pre>`)
})
