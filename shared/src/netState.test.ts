import { expect, it } from 'vitest'
import { applyAction, createMatch } from './match'
import { TerrainMask } from './terrain/mask'
import { applySnapshot, snapshotOf } from './netState'
import { decodeMsg, encodeMsg, MsgType } from './protocol'

it('snapshot khứ hồi qua msgpack: bản sao ở client giống hệt trận gốc', () => {
  const W = 2400, H = 1200, G = 800
  const mask = new TerrainMask(W, H)
  for (let y = G; y < H; y++) mask.data.fill(1, y * W, (y + 1) * W)
  const mk = () => createMatch({ seed: 5, mask, spawnZones: { A: { x1: 100, x2: 600 }, B: { x1: 1800, x2: 2300 } }, players: [0, 1, 2, 3].map(i => ({ name: `P${i}`, team: (i % 2) as 0 | 1, mobileId: ['oc-thiet-giap', 'chui-khoan', 'bo-loi', 'oc-thiet-giap'][i]! })) })
  const server = mk(), client = mk()
  const m = mask.clone()
  applyAction(server, { t: 'aim', id: 0, angle: 60 }, { mask: m })
  for (let i = 0; i < 20; i++) applyAction(server, { t: 'move', id: 0, dir: 1, dt: 1 / 30 }, { mask: m })
  applyAction(server, { t: 'fire', id: 0, angle: 60, power: 55, slot: 0 }, { mask: m })
  const wire = decodeMsg(encodeMsg({ t: MsgType.Snapshot, s: snapshotOf(server) }))
  applySnapshot(client, wire.s as never)
  expect(client).toEqual(server)
})
