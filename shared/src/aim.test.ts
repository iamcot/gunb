import { expect, it } from 'vitest'
import { aimDir, aimRange } from './aim'

it('aimDir: 0° ngang, 90° thẳng lên, facing trái đảo x, tilt cộng vào độ nâng', () => {
  const o = { x: 0, y: 0 }
  expect(aimDir(o, 0, 1).x).toBeCloseTo(1); expect(aimDir(o, 0, 1).y).toBeCloseTo(0)
  expect(aimDir(o, 90, 1).y).toBeCloseTo(-1)
  expect(aimDir(o, 0, -1).x).toBeCloseTo(-1)
  const t = Math.PI / 6
  expect(aimDir(o, 0, 1, t).y).toBeCloseTo(-Math.sin(t))      // dốc lên bên phải, bắn sang phải → nâng thêm
  expect(aimDir(o, 0, -1, t).y).toBeCloseTo(Math.sin(t))      // bắn sang trái → hạ xuống
})

it('aimRange: xe thường giữ nguyên dải; xe slopeAim dịch theo dốc ở phía bắn, kẹp 0..90', () => {
  const r = { min: 0, max: 0 }
  const deg = Math.PI / 180
  expect(aimRange(r, { angleMin: 0, angleMax: 90 }, 1, 20 * deg)).toEqual({ min: 0, max: 90 })
  const bug = { angleMin: 20, angleMax: 45, slopeAim: true }
  expect(aimRange(r, bug, 1, 0)).toEqual({ min: 20, max: 45 })
  expect(aimRange(r, bug, 1, 25 * deg)).toEqual({ min: 45, max: 70 })    // quay phía bắn lên dốc 25°
  expect(aimRange(r, bug, -1, 25 * deg)).toEqual({ min: 0, max: 20 })    // phía bắn chúi xuống dốc
  expect(aimRange(r, bug, -1, -60 * deg)).toEqual({ min: 80, max: 90 })
})
