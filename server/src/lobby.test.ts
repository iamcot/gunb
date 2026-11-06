import { describe, expect, it } from 'vitest'
import { MsgType, TerrainMask, decodeMaskRle, decodeMsg, encodeMsg, type Msg } from '@gunb/shared'
import { Lobby, type Conn } from './lobby'

class Fake implements Conn {
  inbox: Msg[] = []
  closed = false
  pid = 0
  token = ''
  constructor(private readonly lobby: Lobby) { lobby.connect(this) }
  send(d: Uint8Array): void { this.inbox.push(decodeMsg(d)) }
  close(): void { this.closed = true }
  say(m: { t: MsgType }): void { this.lobby.onMessage(this, encodeMsg(m)) }
  last(t: MsgType): Msg | undefined { return [...this.inbox].reverse().find(m => m.t === t) }
  all(t: MsgType): Msg[] { return this.inbox.filter(m => m.t === t) }
  hello(name: string, token?: string): void {
    this.say({ t: MsgType.Hello, name, token } as never)
    const w = this.last(MsgType.Welcome)!
    this.pid = w.pid as number; this.token = w.token as string
  }
}

function setup(): { lobby: Lobby; a: Fake; b: Fake; roomId: string } {
  const lobby = new Lobby({ autoTick: false })
  const a = new Fake(lobby), b = new Fake(lobby)
  a.hello('An'); b.hello('Bình')
  a.say({ t: MsgType.CreateRoom, name: 'p', max: 2, mapId: 'thu-nghiem', turnTime: 20 } as never)
  const roomId = lobby.roomIds()[0]!
  b.say({ t: MsgType.JoinRoom, roomId } as never)
  b.say({ t: MsgType.SetSeat, team: 1, ready: true } as never)
  return { lobby, a, b, roomId }
}

function startMatch(): ReturnType<typeof setup> {
  const s = setup()
  s.a.say({ t: MsgType.StartGame } as never)
  s.a.say({ t: MsgType.LoadProgress, pct: 100, ready: true } as never)
  s.b.say({ t: MsgType.LoadProgress, pct: 100, ready: true } as never)
  return s
}

describe('Lobby', () => {
  it('tạo phòng, vào phòng, chọn đội, chat', () => {
    const { a, b } = setup()
    const room = (b.last(MsgType.RoomState)!.room as { members: { team: number; ready: boolean }[] })
    expect(room.members).toHaveLength(2)
    expect(room.members[1]).toMatchObject({ team: 1, ready: true })
    a.say({ t: MsgType.Chat, text: 'xin chào' } as never)
    expect(b.last(MsgType.ChatMsg)).toMatchObject({ from: 'An', text: 'xin chào' })
  })

  it('chỉ chủ phòng bắt đầu; cần đủ sẵn sàng và hai đội', () => {
    const { a, b } = setup()
    b.say({ t: MsgType.StartGame } as never)
    expect(b.last(MsgType.Error)).toBeTruthy()
    a.say({ t: MsgType.StartGame } as never)
    expect((a.last(MsgType.RoomState)!.room as { status: string }).status).toBe('loading')
  })

  it('bắt đầu khi mọi người tải xong: gửi MatchStart + Terrain + Snapshot', () => {
    const { a, b } = startMatch()
    for (const c of [a, b]) {
      const ms = c.last(MsgType.MatchStart)!
      expect(ms.mapId).toBe('thu-nghiem')
      expect(ms.youId).toBe(c === a ? 0 : 1)
      const t = c.last(MsgType.Terrain)!
      const mask = decodeMaskRle(t.w as number, t.h as number, t.rle as Uint8Array)
      expect(mask).toBeInstanceOf(TerrainMask)
      expect(c.last(MsgType.Snapshot)).toBeTruthy()
    }
  })

  it('bắn: người đến lượt nhận Shot, người khác bắn bị bỏ qua, hash khớp mask server', () => {
    const { lobby, a, b, roomId } = startMatch()
    const runner = lobby.runnerOfRoom(roomId)!
    const cur = runner.state.turnPlayerId
    const [shooter, other] = cur === 0 ? [a, b] : [b, a]
    other.say({ t: MsgType.Fire, angle: 45, power: 60, slot: 0 } as never)
    expect(a.last(MsgType.Shot)).toBeUndefined()
    shooter.say({ t: MsgType.Fire, angle: 45, power: 60, slot: 0 } as never)
    const shot = a.last(MsgType.Shot)!.result as { terrainHashAfter: string | number; endT: number }
    expect(b.last(MsgType.Shot)).toBeTruthy()
    expect(b.last(MsgType.Shot)!.shooter).toBeTypeOf('number')
    expect([0, 1, 2]).toContain(b.last(MsgType.Shot)!.slot)
    expect(shot.terrainHashAfter).toBe(runner.mask.hash())
    expect(runner.state.phase).toBe('resolving')
    for (let i = 0; i < 600 && runner.state.phase === 'resolving'; i++) lobby.stepRoom(roomId, 1 / 30)
    expect(runner.state.phase).toBe('aiming')
    expect(runner.state.turnNo).toBe(2)
  })

  it('rớt mạng rồi vào lại bằng token: nhận lại MatchStart + Terrain + Snapshot', () => {
    const { lobby, a, b, roomId } = startMatch()
    lobby.disconnect(b)
    const b2 = new Fake(lobby)
    b2.hello('Bình', b.token)
    expect(b2.last(MsgType.Welcome)).toMatchObject({ resumed: true, pid: b.pid })
    expect(b2.last(MsgType.MatchStart)).toBeTruthy()
    expect(b2.last(MsgType.Terrain)).toBeTruthy()
    expect(b2.last(MsgType.Snapshot)).toBeTruthy()
    expect(lobby.runnerOfRoom(roomId)).toBeTruthy()
    void a
  })

  it('người đến lượt rớt mạng thì bị bỏ lượt; quá 60 s thì bị loại và trận kết thúc', () => {
    const { lobby, a, b, roomId } = startMatch()
    const runner = lobby.runnerOfRoom(roomId)!
    lobby.disconnect(b)
    for (let i = 0; i < 30 * 70 && runner.state.phase !== 'ended'; i++) lobby.stepRoom(roomId, 1 / 30)
    expect(runner.state.phase).toBe('ended')
    expect(runner.state.winner).toBe(0)
    expect(a.last(MsgType.Snapshot)).toBeTruthy()
  })

  it('NeedTerrain gửi lại địa hình hiện tại', () => {
    const { a } = startMatch()
    const before = a.all(MsgType.Terrain).length
    a.say({ t: MsgType.NeedTerrain } as never)
    expect(a.all(MsgType.Terrain).length).toBe(before + 1)
  })

  it('chủ phòng thêm bot: bot tự ngắm và bắn khi tới lượt, bot không cần tải/sẵn sàng', () => {
    const lobby = new Lobby({ autoTick: false })
    const a = new Fake(lobby)
    a.hello('An')
    a.say({ t: MsgType.CreateRoom, name: 'p', max: 2, mapId: 'thu-nghiem', turnTime: 20 } as never)
    const roomId = lobby.roomIds()[0]!
    a.say({ t: MsgType.AddBot, level: 'easy', team: 1 } as never)
    const room = a.last(MsgType.RoomState)!.room as { members: { bot?: string; ready: boolean; team: number }[] }
    expect(room.members[1]).toMatchObject({ bot: 'easy', ready: true, team: 1 })
    a.say({ t: MsgType.StartGame } as never)
    a.say({ t: MsgType.LoadProgress, pct: 100, ready: true } as never)
    const runner = lobby.runnerOfRoom(roomId)!
    expect(runner).toBeTruthy()
    // đến lượt người: bỏ lượt để tới bot
    if (runner.state.turnPlayerId === 0) a.say({ t: MsgType.Skip } as never)
    let shots = 0
    for (let i = 0; i < 30 * 40 && shots === 0; i++) { lobby.stepRoom(roomId, 1 / 30); shots = a.all(MsgType.Shot).length }
    expect(shots).toBe(1)
  })

  it('người thường không thêm được bot', () => {
    const { b, lobby } = setup()
    b.say({ t: MsgType.AddBot, level: 'hard', team: 0 } as never)
    expect(lobby.roomIds()).toHaveLength(1)
    expect((b.last(MsgType.RoomState)!.room as { members: unknown[] }).members).toHaveLength(2)
  })
})
