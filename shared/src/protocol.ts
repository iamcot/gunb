import { decode, encode } from '@msgpack/msgpack'

/** Số loại message. Thêm loại mới ở cuối, không đổi số cũ. */
export enum MsgType {
  Hello = 0,
}

export interface Msg {
  t: MsgType
  [key: string]: unknown
}

export function encodeMsg(msg: Msg): Uint8Array {
  return encode(msg)
}

export function decodeMsg(data: Uint8Array): Msg {
  const m = decode(data) as Msg
  if (m === null || typeof m !== 'object' || typeof m.t !== 'number') throw new Error('message không hợp lệ')
  return m
}
