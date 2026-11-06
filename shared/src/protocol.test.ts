import { expect, it } from 'vitest'
import { decodeMsg, encodeMsg, MsgType } from './protocol'

it('encode/decode khứ hồi', () => {
  const m = decodeMsg(encodeMsg({ t: MsgType.Hello, name: 'An' }))
  expect(m.t).toBe(MsgType.Hello)
  expect(m.name).toBe('An')
})

it('từ chối message không có t', () => {
  expect(() => decodeMsg(encodeMsg({} as never))).toThrow()
})
