import { expect, it } from 'vitest'
import { aimDir } from './aim'

it('aimDir: 0° ngang, 90° thẳng lên, facing trái đảo x, tilt cộng vào độ nâng', () => {
  const o = { x: 0, y: 0 }
  expect(aimDir(o, 0, 1).x).toBeCloseTo(1); expect(aimDir(o, 0, 1).y).toBeCloseTo(0)
  expect(aimDir(o, 90, 1).y).toBeCloseTo(-1)
  expect(aimDir(o, 0, -1).x).toBeCloseTo(-1)
  const t = Math.PI / 6
  expect(aimDir(o, 0, 1, t).y).toBeCloseTo(-Math.sin(t))      // dốc lên bên phải, bắn sang phải → nâng thêm
  expect(aimDir(o, 0, -1, t).y).toBeCloseTo(Math.sin(t))      // bắn sang trái → hạ xuống
})
