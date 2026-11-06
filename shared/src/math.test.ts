import { describe, expect, it } from 'vitest'
import { clamp, hashSeed, mulberry32 } from './math'

describe('mulberry32', () => {
  it('cùng seed ra cùng dãy', () => {
    const a = mulberry32(12345), b = mulberry32(12345)
    for (let i = 0; i < 100; i++) expect(a()).toBe(b())
  })
  it('khác seed ra dãy khác, giá trị trong [0,1)', () => {
    const a = mulberry32(1), b = mulberry32(2)
    expect(a()).not.toBe(b())
    const r = mulberry32(7)
    for (let i = 0; i < 1000; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1) }
  })
})

describe('hashSeed / clamp', () => {
  it('hashSeed ổn định', () => { expect(hashSeed('abc')).toBe(hashSeed('abc')); expect(hashSeed('abc')).not.toBe(hashSeed('abd')) })
  it('clamp', () => { expect(clamp(5, 0, 3)).toBe(3); expect(clamp(-1, 0, 3)).toBe(0); expect(clamp(2, 0, 3)).toBe(2) })
})
