import {
  MOBILE_IDS, MsgType, TEAM_NAMES, TUNING, decodeMaskRle, parseMap,
  type Msg, type MatchStartMsg, type RoomInfo, type RoomSummary, type Snapshot, type ShotResultNet, type TerrainMask,
} from '@gunb/shared'
import type { GameCtx, Mode } from './ctx'
import { NetClient, type NetStatus } from './net'
import { OnlineMode } from './onlineMode'

const NAME_KEY = 'gunb.name'
const esc = (s: string): string => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const TEAM_COLOR = ['#60a5fa', '#f87171']

export interface OnlineHost {
  ctx: GameCtx
  startMode(m: Mode): void      // vào màn chơi
  stopMode(): void              // thoát màn chơi nhưng không hiện menu (quay về phòng chờ)
  exit(): void                  // rời chế độ online, về menu
}

/** Tải trước tài nguyên bản đồ, báo % (0–100). */
async function preloadMap(mapId: string, onPct: (pct: number) => void): Promise<void> {
  const base = `/maps/${encodeURIComponent(mapId)}/`
  onPct(2)
  const meta = parseMap(await (await fetch(base + 'map.json')).json())
  const files = [meta.terrain, ...meta.backgrounds.map(b => b.file)]
  let done = 0
  for (const f of files) {
    const r = await fetch(base + f)
    if (!r.ok) throw new Error(`không tải được ${f}`)
    await r.blob()
    onPct(5 + (95 * ++done) / files.length)
  }
  onPct(100)
}

type Screen = 'name' | 'connecting' | 'lobby' | 'room' | 'loading' | 'game'

/** Luồng màn hình online: nhập tên → danh sách phòng → phòng chờ → tải → chơi. Mọi thứ do tin nhắn từ server dẫn dắt. */
export class OnlineFlow {
  private net: NetClient | null = null
  private el: HTMLElement | null = null
  private banner: HTMLElement
  private screen: Screen = 'name'
  private rooms: RoomSummary[] = []
  private room: RoomInfo | null = null
  private chat: string[] = []
  private loadPct = new Map<number, { pct: number; ready: boolean }>()
  private loadingRoom = ''
  private pendingStart: MatchStartMsg | null = null
  private mode: OnlineMode | null = null
  private shellFor = ''
  private errText = ''

  constructor(private readonly host: OnlineHost, private readonly onBack: () => void) {
    this.banner = document.createElement('div')
    this.banner.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:6px;text-align:center;background:#b45309;color:#fff;z-index:30;display:none'
    this.banner.textContent = 'Mất kết nối, đang thử nối lại… (giữ chỗ trong 60 giây)'
    document.body.appendChild(this.banner)
    this.show('name')
  }

  /** Rời chế độ online (chế độ chơi do host huỷ). Báo server rời phòng rồi ngắt. */
  dispose(): void {
    if (this.room) this.net?.send({ t: MsgType.LeaveRoom })
    this.net?.close()
    this.net = null
    this.mode = null
    this.el?.remove()
    this.banner.remove()
  }

  // ---------- màn hình ----------
  private panel(html: string): HTMLElement {
    this.el?.remove()
    const el = document.createElement('div')
    el.className = 'overlay'
    el.innerHTML = `<div class="panel online">${html}</div>`
    document.body.appendChild(el)
    this.el = el
    return el
  }

  private show(s: Screen): void {
    this.screen = s
    this.shellFor = ''
    if (s === 'name') this.renderName()
    else if (s === 'connecting') this.panel('<h2>Đang kết nối…</h2>')
    else if (s === 'lobby') this.renderLobby()
    else if (s === 'room') this.renderRoom()
    else if (s === 'loading') this.renderLoading()
    else { this.el?.remove(); this.el = null }
  }

  private renderName(): void {
    let saved = ''
    try { saved = localStorage.getItem(NAME_KEY) ?? '' } catch { /* bỏ qua */ }
    const el = this.panel(`<h2>Chơi online</h2><p>Tên của bạn</p><input id="nm" maxlength="20" value="${esc(saved)}" placeholder="Nhập tên">
      <div class="err">${esc(this.errText)}</div><div class="row"><button id="back">Quay lại</button><button id="go">Vào sảnh</button></div>`)
    const input = el.querySelector<HTMLInputElement>('#nm')!
    const go = (): void => {
      const name = input.value.trim() || `Người chơi ${Math.floor(Math.random() * 900 + 100)}`
      try { localStorage.setItem(NAME_KEY, name) } catch { /* bỏ qua */ }
      this.errText = ''
      this.connect(name)
    }
    el.querySelector('#go')!.addEventListener('click', go)
    el.querySelector('#back')!.addEventListener('click', () => this.onBack())
    input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go() })
    input.focus()
  }

  private connect(name: string): void {
    const net = new NetClient(name)
    this.net = net
    net.onMessage = m => this.onMessage(m)
    net.onStatus = s => this.onStatus(s)
    this.show('connecting')
    net.connect()
  }

  private renderLobby(): void {
    const el = this.panel(`<h2>Sảnh phòng</h2>
      <div class="rooms" id="rooms"></div>
      <div class="row" style="margin-top:10px"><input id="rn" maxlength="30" placeholder="Tên phòng">
        <select id="rmax">${[2, 3, 4, 5, 6, 7, 8].map(n => `<option value="${n}"${n === 4 ? ' selected' : ''}>${n} người</option>`).join('')}</select>
        <select id="rtime">${[15, 20, 30, 45].map(n => `<option value="${n}"${n === 20 ? ' selected' : ''}>${n}s/lượt</option>`).join('')}</select>
        <button id="mk">Tạo phòng</button></div>
      <div class="err">${esc(this.errText)}</div>
      <div class="row" style="margin-top:8px"><button id="leave">Thoát</button></div>`)
    for (const id of ['rn']) el.querySelector(`#${id}`)!.addEventListener('keydown', e => e.stopPropagation())
    el.querySelector('#mk')!.addEventListener('click', () => this.net?.send({
      t: MsgType.CreateRoom, name: (el.querySelector<HTMLInputElement>('#rn')!).value, mapId: this.host.ctx.map.id,
      max: Number((el.querySelector<HTMLSelectElement>('#rmax')!).value), turnTime: Number((el.querySelector<HTMLSelectElement>('#rtime')!).value),
    }))
    el.querySelector('#leave')!.addEventListener('click', () => this.host.exit())
    this.updateRoomList()
  }

  private updateRoomList(): void {
    const box = this.el?.querySelector('#rooms')
    if (!box || this.screen !== 'lobby') return
    const label = { lobby: 'chờ', loading: 'đang tải', playing: 'đang chơi', ended: 'kết thúc' }
    box.innerHTML = this.rooms.length === 0 ? '<i style="opacity:.7">Chưa có phòng nào, hãy tạo phòng.</i>' :
      this.rooms.map(r => `<div class="rrow"><b>${esc(r.name)}</b><span>${r.players}/${r.max} · ${label[r.status]}</span>
        <button data-id="${esc(r.id)}"${r.status !== 'lobby' || r.players >= r.max ? ' disabled' : ''}>Vào</button></div>`).join('')
    box.querySelectorAll<HTMLButtonElement>('button[data-id]').forEach(b => b.addEventListener('click', () => this.net?.send({ t: MsgType.JoinRoom, roomId: b.dataset.id })))
  }

  private renderRoom(): void {
    const r = this.room
    if (!r) return
    if (this.shellFor !== r.id) {
      const el = this.panel(`<h2 id="rtitle"></h2><div id="members"></div>
        <div class="chat"><div id="chatlog"></div><input id="chatin" maxlength="200" placeholder="Nhắn tin, Enter để gửi"></div>
        <div class="err" id="rerr"></div><div class="row" id="ractions"></div>`)
      this.shellFor = r.id
      const cin = el.querySelector<HTMLInputElement>('#chatin')!
      cin.addEventListener('keydown', e => {
        e.stopPropagation()
        if (e.key === 'Enter' && cin.value.trim()) { this.net?.send({ t: MsgType.Chat, text: cin.value }); cin.value = '' }
      })
      this.renderChat()
    }
    const el = this.el!
    const me = this.net?.pid ?? 0
    const mine = r.members.find(m => m.pid === me)
    el.querySelector('#rtitle')!.textContent = `${r.name} (${r.members.length}/${r.max}) · ${r.turnTime}s/lượt`
    el.querySelector('#members')!.innerHTML = r.members.map(m => {
      const isMe = m.pid === me
      const mob = isMe && r.status === 'lobby'
        ? `<select data-mob>${MOBILE_IDS.map(id => `<option value="${id}"${id === m.mobileId ? ' selected' : ''}>${esc(TUNING.mobiles[id]!.name)}</option>`).join('')}</select>`
        : esc(TUNING.mobiles[m.mobileId]?.name ?? m.mobileId)
      const team = isMe && r.status === 'lobby'
        ? `<button data-team>${TEAM_NAMES[m.team]} ⇄</button>` : `<span>${TEAM_NAMES[m.team]}</span>`
      return `<div class="mrow"><b style="color:${TEAM_COLOR[m.team]}">${esc(m.name)}${m.pid === r.hostPid ? ' ★' : ''}${isMe ? ' (bạn)' : ''}</b>${team}${mob}
        <span>${!m.connected ? 'mất kết nối' : m.ready || m.pid === r.hostPid ? '✔ sẵn sàng' : '…'}</span></div>`
    }).join('')
    el.querySelector('[data-team]')?.addEventListener('click', () => this.net?.send({ t: MsgType.SetSeat, team: mine!.team === 0 ? 1 : 0 }))
    el.querySelector<HTMLSelectElement>('[data-mob]')?.addEventListener('change', e => this.net?.send({ t: MsgType.SetSeat, mobileId: (e.target as HTMLSelectElement).value }))
    const actions = el.querySelector('#ractions')!
    const isHost = r.hostPid === me
    actions.innerHTML = `<button id="lv">Rời phòng</button>` +
      (isHost ? `<button id="st">Bắt đầu</button>` : `<button id="rd">${mine?.ready ? 'Bỏ sẵn sàng' : 'Sẵn sàng'}</button>`)
    actions.querySelector('#lv')!.addEventListener('click', () => { this.net?.send({ t: MsgType.LeaveRoom }) })
    actions.querySelector('#st')?.addEventListener('click', () => this.net?.send({ t: MsgType.StartGame }))
    actions.querySelector('#rd')?.addEventListener('click', () => this.net?.send({ t: MsgType.SetSeat, ready: !mine?.ready }))
    el.querySelector('#rerr')!.textContent = this.errText
  }

  private renderChat(): void {
    const log = this.el?.querySelector('#chatlog')
    if (!log) return
    log.innerHTML = this.chat.slice(-30).map(l => `<div>${l}</div>`).join('')
    log.scrollTop = log.scrollHeight
  }

  private renderLoading(): void {
    const r = this.room
    if (!r) return
    const el = this.el && this.shellFor === 'loading:' + r.id ? this.el : this.panel('<h2>Đang tải bản đồ…</h2><div id="lbars"></div><div class="err" id="lerr"></div>')
    this.shellFor = 'loading:' + r.id
    el.querySelector('#lbars')!.innerHTML = r.members.map(m => {
      const st = this.loadPct.get(m.pid) ?? { pct: 0, ready: false }
      return `<div class="lrow"><span>${esc(m.name)}</span><div class="bar"><i style="width:${Math.round(st.pct)}%"></i></div><span>${st.ready ? '✔' : Math.round(st.pct) + '%'}</span></div>`
    }).join('')
  }

  private async startLoading(room: RoomInfo): Promise<void> {
    this.loadingRoom = room.id
    this.loadPct.clear()
    this.show('loading')
    let last = -1
    try {
      await preloadMap(room.mapId, pct => {
        const p = Math.round(pct)
        if (p !== last && this.loadingRoom === room.id) { last = p; this.net?.send({ t: MsgType.LoadProgress, pct: p, ready: false }) }
      })
      if (this.loadingRoom === room.id) this.net?.send({ t: MsgType.LoadProgress, pct: 100, ready: true })
    } catch (e) {
      this.errText = `Tải thất bại: ${(e as Error).message}`
      const t = this.el?.querySelector('#lerr'); if (t) t.textContent = this.errText
    }
  }

  // ---------- tin nhắn ----------
  private onStatus(s: NetStatus): void {
    this.banner.style.display = s === 'down' && this.screen !== 'name' ? 'block' : 'none'
    if (s === 'down' && this.net && this.screen === 'connecting') { this.errText = 'Không kết nối được tới server'; this.net.close(); this.net = null; this.show('name') }
  }

  private onMessage(m: Msg): void {
    switch (m.t) {
      case MsgType.Welcome:
        if (!m.resumed && (this.mode || this.screen === 'room' || this.screen === 'loading' || this.screen === 'game')) {
          // server đã quên mình (hết hạn giữ chỗ): về sảnh
          this.leaveGame(); this.room = null; this.show('lobby')
        } else if (this.screen === 'connecting') this.show('lobby')
        break
      case MsgType.RoomList:
        this.rooms = m.rooms as RoomSummary[]
        this.updateRoomList()
        break
      case MsgType.RoomState: this.onRoomState(m.room as RoomInfo | null); break
      case MsgType.ChatMsg:
        this.chat.push(`<b>${esc(String(m.from))}:</b> ${esc(String(m.text))}`)
        this.renderChat()
        break
      case MsgType.Loading:
        for (const x of m.members as { pid: number; pct: number; ready: boolean }[]) this.loadPct.set(x.pid, x)
        if (this.screen === 'loading') this.renderLoading()
        break
      case MsgType.MatchStart:
        if (this.mode && this.pendingStart?.seed === m.seed) break          // vào lại: giữ nguyên chế độ đang chạy, chỉ nhận địa hình mới
        this.leaveGame()
        this.pendingStart = m as unknown as MatchStartMsg
        break
      case MsgType.Terrain: {
        const mask = decodeMaskRle(m.w as number, m.h as number, m.rle as Uint8Array)
        if (this.mode) this.mode.onTerrain(mask)
        else if (this.pendingStart) this.enterGame(this.pendingStart, mask)
        break
      }
      case MsgType.Snapshot: this.mode?.onSnapshot(m.s as Snapshot); break
      case MsgType.Shot: this.mode?.onShot(m.result as ShotResultNet); break
      case MsgType.Error:
        this.errText = String(m.text)
        { const t = this.el?.querySelector('.err'); if (t) t.textContent = this.errText }
        break
    }
  }

  private onRoomState(room: RoomInfo | null): void {
    this.room = room
    this.errText = ''
    if (!room) {
      this.chat = []
      this.leaveGame()
      this.show('lobby')
      this.net?.send({ t: MsgType.ListRooms })
      return
    }
    if (room.status === 'lobby') {
      if (this.mode) this.leaveGame()
      if (this.screen !== 'room') this.show('room')
      else this.renderRoom()
    } else if (room.status === 'loading') {
      if (this.screen !== 'loading' || this.loadingRoom !== room.id) void this.startLoading(room)
      else this.renderLoading()
    }
    // 'playing' / 'ended': màn chơi tự lo (MatchStart đến sau)
  }

  private enterGame(start: MatchStartMsg, mask: TerrainMask): void {
    this.mode = new OnlineMode(this.host.ctx, this.net!, start, mask, () => { this.leaveGame(); this.show('lobby'); this.net?.send({ t: MsgType.ListRooms }) })
    this.host.startMode(this.mode)
    this.show('game')
  }

  private leaveGame(): void {
    this.pendingStart = null
    if (this.mode) { this.mode = null; this.host.stopMode() }
  }
}
