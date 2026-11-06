import { describe, expect, it } from 'vitest'
import { pickNext, turnOrder, type DelayInfo } from './delay'

const p = (id: number, delay: number, lastActed = -1, hp = 100): DelayInfo => ({ id, hp, delay, lastActed })

describe('delay', () => {
  it('delay nhỏ nhất đi trước', () => { expect(pickNext([p(1, 50), p(2, 10), p(3, 30)])!.id).toBe(2) })
  it('hoà delay: ai lâu chưa đi hơn đi trước, rồi tới id', () => {
    expect(pickNext([p(1, 10, 5), p(2, 10, 3)])!.id).toBe(2)
    expect(pickNext([p(2, 10), p(1, 10)])!.id).toBe(1)
  })
  it('người chết bị bỏ qua', () => {
    expect(pickNext([p(1, 0, -1, 0), p(2, 99)])!.id).toBe(2)
    expect(pickNext([p(1, 0, -1, 0)])).toBeUndefined()
  })
  it('người dùng đạn delay lớn bị đẩy về sau', () => {
    const a = p(1, 0), b = p(2, 0)
    a.delay += 250      // đạn nặng
    b.delay += 100
    expect(turnOrder([a, b]).map(x => x.id)).toEqual([2, 1])
  })
})
