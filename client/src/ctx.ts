import type { Application, Container } from 'pixi.js'
import type { MapFile } from '@gunb/shared'
import type { Camera } from './camera'
import type { Fx } from './fx'
import type { Hud } from './hud'
import type { TerrainView } from './terrainView'

/** Điểm camera cần quay về (đặt bởi chế độ chơi), sau đó hết giờ thì trả lại điều khiển tay. */
export interface CameraFocus { x: number; y: number; t: number }

/** Mọi thứ dùng chung giữa các chế độ chơi. */
export interface GameCtx {
  app: Application
  world: Container
  view: TerrainView
  cam: Camera
  hud: Hud
  fx: Fx
  map: MapFile
  keys: Set<string>
  focus: CameraFocus
}

/** Một chế độ chơi (tập bắn, hotseat...). */
export interface Mode {
  update(dt: number): void
  debugText(): string
  destroy(): void
}
