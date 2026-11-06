import { randomBytes } from 'node:crypto'
import {
  MAX_PLAYERS, MOBILE_IDS, MsgType, decodeMsg, encodeMsg,
  type BotLevel, type Msg, type RoomInfo, type RoomMember, type RoomStatus, type RoomSummary, type Team,
} from '@gunb/shared'
import { MatchRunner, RECONNECT_GRACE_S } from './matchRunner'
import { listMapIds, loadMap } from './mapLoader'

export const LOAD_TIMEOUT_S = 45
const MAX_NAME = 20
const MAX_CHAT = 200

/** Cổng gửi nhị phân tối thiểu để test không cần ws thật. */
export interface Conn { send(data: Uint8Array): void; close(): void }

interface Member { pid: number; team: Team; mobileId: string; ready: boolean; pct: number; loaded: boolean; bot?: BotLevel; botName?: string }

interface Client { pid: number; name: string; token: string; conn: Conn | null; roomId: string | null; offlineAt: number }

class Room {
  status: RoomStatus = 'lobby'
  members: Member[] = []
  runner: MatchRunner | null = null
  loadTimer: ReturnType<typeof setTimeout> | null = null
  constructor(public id: string, public name: string, public hostPid: number, public max: number, public mapId: string, public turnTime: number) {}
}

/** Toàn bộ trạng thái sảnh + phòng. Không biết gì về mạng thật: nhận `Conn`, nhận/trả byte. */
export class Lobby {
  private readonly clients = new Map<number, Client>()
  private readonly byToken = new Map<string, Client>()
  private readonly rooms = new Map<string, Room>()
  private readonly byConn = new Map<Conn, Client>()
  private nextPid = 1
  private nextRoom = 1
  private nextBot = 1
  /** Chỉ test mới đổi: bước tick của MatchRunner không tự chạy. */
  constructor(private readonly opts: { autoTick?: boolean } = {}) {}

  // ---------- kết nối ----------
  connect(conn: Conn): void { this.byConn.set(conn, { pid: 0, name: '', token: '', conn, roomId: null, offlineAt: 0 }) }

  disconnect(conn: Conn): void {
    const c = this.byConn.get(conn)
    this.byConn.delete(conn)
    if (!c || c.pid === 0 || c.conn !== conn) return
    c.conn = null
    c.offlineAt = Date.now()
    const room = c.roomId ? this.rooms.get(c.roomId) : undefined
    if (!room) { this.drop(c); return }
    if (room.status === 'playing') room.runner?.onDisconnect(c.pid)
    else { this.leaveRoom(c) ; this.drop(c) ; return }
    this.pushRoom(room)
  }

  private drop(c: Client): void { this.clients.delete(c.pid); this.byToken.delete(c.token) }

  private send(c: Client, msg: { t: MsgType }): void { c.conn?.send(encodeMsg(msg)) }
  private sendPid(pid: number, msg: { t: MsgType }): void { const c = this.clients.get(pid); if (c) this.send(c, msg) }
  private err(c: Client, text: string): void { this.send(c, { t: MsgType.Error, text } as never) }

  onMessage(conn: Conn, data: Uint8Array): void {
    const c = this.byConn.get(conn)
    if (!c) return
    let m: Msg
    try { m = decodeMsg(data) } catch { return }
    if (c.pid === 0) {
      if (m.t === MsgType.Hello) this.hello(c, conn, m)
      return
    }
    switch (m.t) {
      case MsgType.ListRooms: this.sendList(c); break
      case MsgType.CreateRoom: this.createRoom(c, m); break
      case MsgType.JoinRoom: this.joinRoom(c, String(m.roomId)); break
      case MsgType.LeaveRoom: this.leaveRoom(c); this.sendList(c); break
      case MsgType.SetSeat: this.setSeat(c, m); break
      case MsgType.StartGame: this.startGame(c); break
      case MsgType.AddBot: this.addBot(c, m); break
      case MsgType.RemoveBot: this.removeBot(c, Number(m.pid)); break
      case MsgType.Chat: this.chat(c, m); break
      case MsgType.LoadProgress: this.loadProgress(c, m); break
      case MsgType.Input: { const r = this.runnerOf(c); if (r) r.onInput(c.pid, Number(m.dir), Number(m.angle)); break }
      case MsgType.Fire: { const r = this.runnerOf(c); if (r) r.onFire(c.pid, Number(m.angle), Number(m.power), m.slot as never); break }
      case MsgType.Skip: this.runnerOf(c)?.onSkip(c.pid); break
      case MsgType.NeedTerrain: this.runnerOf(c)?.sendTerrain(c.pid); break
    }
  }

  private runnerOf(c: Client): MatchRunner | null {
    const room = c.roomId ? this.rooms.get(c.roomId) : undefined
    return room?.status === 'playing' ? room.runner : null
  }

  private hello(c: Client, conn: Conn, m: Msg): void {
    const token = typeof m.token === 'string' ? m.token : ''
    const old = token ? this.byToken.get(token) : undefined
    if (old) {
      // vào lại: thay kết nối cũ
      const prev = old.conn
      old.conn = conn
      this.byConn.set(conn, old)
      if (prev && prev !== conn) { this.byConn.delete(prev); prev.close() }
      this.send(old, { t: MsgType.Welcome, pid: old.pid, token: old.token, name: old.name, resumed: true } as never)
      const room = old.roomId ? this.rooms.get(old.roomId) : undefined
      if (room) {
        this.pushRoom(room)
        if (room.status === 'playing') room.runner?.onReconnect(old.pid)
      } else this.sendList(old)
      return
    }
    c.pid = this.nextPid++
    c.token = randomBytes(12).toString('hex')
    c.name = (typeof m.name === 'string' ? m.name.trim().slice(0, MAX_NAME) : '') || `Người chơi ${c.pid}`
    this.clients.set(c.pid, c)
    this.byToken.set(c.token, c)
    this.send(c, { t: MsgType.Welcome, pid: c.pid, token: c.token, name: c.name, resumed: false } as never)
    this.sendList(c)
  }

  // ---------- phòng ----------
  private summary(r: Room): RoomSummary { return { id: r.id, name: r.name, players: r.members.length, max: r.max, status: r.status, mapId: r.mapId } }

  private sendList(c: Client): void {
    this.send(c, { t: MsgType.RoomList, rooms: [...this.rooms.values()].map(r => this.summary(r)) } as never)
  }

  private broadcastList(): void {
    for (const c of this.clients.values()) if (!c.roomId) this.sendList(c)
  }

  private info(r: Room): RoomInfo {
    const members: RoomMember[] = r.members.map(m => {
      if (m.bot) return { pid: m.pid, name: m.botName!, team: m.team, mobileId: m.mobileId, ready: true, connected: true, bot: m.bot }
      const c = this.clients.get(m.pid)
      return { pid: m.pid, name: c?.name ?? '?', team: m.team, mobileId: m.mobileId, ready: m.ready, connected: !!c?.conn }
    })
    return { id: r.id, name: r.name, hostPid: r.hostPid, max: r.max, mapId: r.mapId, turnTime: r.turnTime, status: r.status, members }
  }

  private pushRoom(r: Room): void {
    const msg = { t: MsgType.RoomState, room: this.info(r) }
    for (const m of r.members) this.sendPid(m.pid, msg)
  }

  private createRoom(c: Client, m: Msg): void {
    if (c.roomId) return this.err(c, 'Bạn đang ở trong một phòng')
    const maps = listMapIds()
    const mapId = typeof m.mapId === 'string' && maps.includes(m.mapId) ? m.mapId : maps[0]
    if (!mapId) return this.err(c, 'Server chưa có bản đồ nào')
    const max = Math.min(MAX_PLAYERS, Math.max(2, Math.floor(Number(m.max) || 4)))
    const turnTime = Math.min(60, Math.max(5, Math.floor(Number(m.turnTime) || 20)))
    const name = (typeof m.name === 'string' ? m.name.trim().slice(0, 30) : '') || `Phòng của ${c.name}`
    const room = new Room(`r${this.nextRoom++}`, name, c.pid, max, mapId, turnTime)
    this.rooms.set(room.id, room)
    this.addMember(room, c)
    this.broadcastList()
  }

  private addMember(room: Room, c: Client): void {
    const t0 = room.members.filter(x => x.team === 0).length
    const t1 = room.members.length - t0
    room.members.push({ pid: c.pid, team: t0 <= t1 ? 0 : 1, mobileId: MOBILE_IDS[0]!, ready: false, pct: 0, loaded: false })
    c.roomId = room.id
    this.pushRoom(room)
  }

  private joinRoom(c: Client, roomId: string): void {
    if (c.roomId) return this.err(c, 'Bạn đang ở trong một phòng')
    const room = this.rooms.get(roomId)
    if (!room) return this.err(c, 'Phòng không còn tồn tại')
    if (room.status !== 'lobby') return this.err(c, 'Phòng đang chơi')
    if (room.members.length >= room.max) return this.err(c, 'Phòng đã đầy')
    this.addMember(room, c)
    this.broadcastList()
  }

  private leaveRoom(c: Client): void {
    const room = c.roomId ? this.rooms.get(c.roomId) : undefined
    c.roomId = null
    if (!room) { this.send(c, { t: MsgType.RoomState, room: null } as never); return }
    room.members = room.members.filter(m => m.pid !== c.pid)
    this.send(c, { t: MsgType.RoomState, room: null } as never)
    if (room.status === 'playing' && room.runner) room.runner.onDisconnect(c.pid)   // bỏ giữa trận = rớt mạng vĩnh viễn (hết hạn thì xe bị loại)
    this.afterMemberGone(room)
  }

  private afterMemberGone(room: Room): void {
    const live = room.members.filter(m => !m.bot && this.clients.get(m.pid)?.roomId === room.id)
    if (room.status === 'playing') {
      // phòng đang chơi: còn ai ở lại (kể cả rớt mạng chờ vào lại) thì giữ
      if (!room.members.some(m => !m.bot)) this.closeRoom(room)
      else this.pushRoom(room)
    } else if (live.length === 0) this.closeRoom(room)
    else {
      if (!live.some(m => m.pid === room.hostPid)) room.hostPid = live[0]!.pid
      if (room.status === 'loading') this.cancelLoading(room)
      this.pushRoom(room)
    }
    this.broadcastList()
  }

  private closeRoom(room: Room): void {
    room.runner?.stop()
    if (room.loadTimer) clearTimeout(room.loadTimer)
    this.rooms.delete(room.id)
    this.broadcastList()
  }

  private addBot(c: Client, m: Msg): void {
    const room = c.roomId ? this.rooms.get(c.roomId) : undefined
    if (!room || room.status !== 'lobby' || room.hostPid !== c.pid) return
    if (room.members.length >= room.max) return this.err(c, 'Phòng đã đầy')
    const level: BotLevel = m.level === 'easy' || m.level === 'hard' ? m.level : 'normal'
    const n = this.nextBot++
    const label = { easy: 'Dễ', normal: 'Vừa', hard: 'Khó' }[level]
    room.members.push({
      pid: -n, team: m.team === 1 ? 1 : 0, mobileId: MOBILE_IDS[n % MOBILE_IDS.length]!, ready: true, pct: 100, loaded: true,
      bot: level, botName: `Máy ${n} (${label})`,
    })
    this.pushRoom(room)
    this.broadcastList()
  }

  private removeBot(c: Client, pid: number): void {
    const room = c.roomId ? this.rooms.get(c.roomId) : undefined
    if (!room || room.status !== 'lobby' || room.hostPid !== c.pid) return
    room.members = room.members.filter(x => !(x.bot && x.pid === pid))
    this.pushRoom(room)
    this.broadcastList()
  }

  private setSeat(c: Client, m: Msg): void {
    const room = c.roomId ? this.rooms.get(c.roomId) : undefined
    const me = room?.members.find(x => x.pid === c.pid)
    if (!room || !me || room.status !== 'lobby') return
    if (m.team === 0 || m.team === 1) { me.team = m.team; me.ready = false }
    if (typeof m.mobileId === 'string' && (MOBILE_IDS as readonly string[]).includes(m.mobileId)) me.mobileId = m.mobileId
    if (typeof m.ready === 'boolean') me.ready = m.ready
    this.pushRoom(room)
  }

  private chat(c: Client, m: Msg): void {
    const room = c.roomId ? this.rooms.get(c.roomId) : undefined
    const text = typeof m.text === 'string' ? m.text.trim().slice(0, MAX_CHAT) : ''
    if (!room || !text) return
    const msg = { t: MsgType.ChatMsg, from: c.name, text }
    for (const x of room.members) this.sendPid(x.pid, msg)
  }

  // ---------- bắt đầu + tải ----------
  private startGame(c: Client): void {
    const room = c.roomId ? this.rooms.get(c.roomId) : undefined
    if (!room || room.status !== 'lobby') return
    if (room.hostPid !== c.pid) return this.err(c, 'Chỉ chủ phòng mới bắt đầu được')
    if (room.members.length < 2) return this.err(c, 'Cần ít nhất 2 người')
    const t0 = room.members.filter(m => m.team === 0).length
    if (t0 === 0 || t0 === room.members.length) return this.err(c, 'Hai đội đều phải có người')
    if (!room.members.every(m => m.pid === room.hostPid || m.ready)) return this.err(c, 'Còn người chưa sẵn sàng')
    room.status = 'loading'
    for (const m of room.members) { m.pct = m.bot ? 100 : 0; m.loaded = !!m.bot }
    this.pushRoom(room)
    this.pushLoading(room)
    room.loadTimer = setTimeout(() => this.launch(room), LOAD_TIMEOUT_S * 1000)
    this.broadcastList()
  }

  private cancelLoading(room: Room): void {
    if (room.loadTimer) clearTimeout(room.loadTimer)
    room.loadTimer = null
    room.status = 'lobby'
    for (const m of room.members) m.ready = false
  }

  private pushLoading(room: Room): void {
    const msg = { t: MsgType.Loading, members: room.members.map(m => ({ pid: m.pid, pct: m.pct, ready: m.loaded })) }
    for (const m of room.members) this.sendPid(m.pid, msg)
  }

  private loadProgress(c: Client, m: Msg): void {
    const room = c.roomId ? this.rooms.get(c.roomId) : undefined
    const me = room?.members.find(x => x.pid === c.pid)
    if (!room || !me || room.status !== 'loading') return
    me.pct = Math.min(100, Math.max(0, Number(m.pct) || 0))
    me.loaded = m.ready === true
    this.pushLoading(room)
    if (room.members.every(x => x.loaded)) this.launch(room)
  }

  private launch(room: Room): void {
    if (room.status !== 'loading') return
    if (room.loadTimer) clearTimeout(room.loadTimer)
    room.loadTimer = null
    let map
    try { map = loadMap(room.mapId) } catch (e) {
      for (const m of room.members) this.sendPid(m.pid, { t: MsgType.Error, text: `Không tải được bản đồ: ${(e as Error).message}` } as never)
      this.cancelLoading(room); this.pushRoom(room); return
    }
    room.status = 'playing'
    const seed = (Math.random() * 0xffffffff) >>> 0
    const players = room.members.map(m => ({ pid: m.pid, name: m.bot ? m.botName! : this.clients.get(m.pid)?.name ?? '?', team: m.team, mobileId: m.mobileId, bot: m.bot }))
    const runner = new MatchRunner({
      seed, mask: map.mask, mapId: room.mapId, zones: map.meta.spawnZones, players, turnTime: room.turnTime,
      send: (pid, msg) => this.sendPid(pid, msg),
      onEnd: () => this.onMatchEnd(room),
    })
    room.runner = runner
    // người đã rớt mạng từ lúc tải: coi như rớt mạng
    for (const m of room.members) if (!m.bot && !this.clients.get(m.pid)?.conn) runner.onDisconnect(m.pid)
    if (this.opts.autoTick === false) runner.sendAll()
    else runner.start()
    this.pushRoom(room)
    this.broadcastList()
  }

  private onMatchEnd(room: Room): void {
    room.status = 'ended'
    // cho client xem bảng kết quả vài giây, sau đó đưa cả phòng về sảnh chờ
    setTimeout(() => {
      if (!this.rooms.has(room.id)) return
      room.runner = null
      room.status = 'lobby'
      room.members = room.members.filter(m => m.bot || !!this.clients.get(m.pid)?.conn)
      for (const m of room.members) m.ready = false
      if (!room.members.some(m => !m.bot)) return this.closeRoom(room)
      if (!room.members.some(m => m.pid === room.hostPid)) room.hostPid = room.members.find(m => !m.bot)!.pid
      this.pushRoom(room)
      this.broadcastList()
    }, 8000).unref?.()
    this.pushRoom(room)
  }

  /** Test: chạy một bước mô phỏng cho trận của phòng. */
  stepRoom(roomId: string, dt: number): void { this.rooms.get(roomId)?.runner?.step(dt) }
  roomIds(): string[] { return [...this.rooms.keys()] }
  runnerOfRoom(roomId: string): MatchRunner | null { return this.rooms.get(roomId)?.runner ?? null }

  /** Dọn người rớt mạng quá hạn ở sảnh (gọi định kỳ). */
  sweep(now = Date.now()): void {
    for (const c of [...this.clients.values()]) {
      if (c.conn || now - c.offlineAt < RECONNECT_GRACE_S * 1000) continue
      const room = c.roomId ? this.rooms.get(c.roomId) : undefined
      if (room) this.leaveRoom(c)
      this.drop(c)
    }
  }
}
