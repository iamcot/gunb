import {
  GAME_NAME, MAX_PLAYERS, MOBILE_IDS, MsgType, TEAM_NAMES, TUNING, decodeMaskRle, parseMap,
  type BotLevel, type Msg, type MatchStartMsg, type RoomInfo, type RoomSummary, type PlayerStats, type Snapshot, type ShotResultNet, type TerrainMask,
} from '@gunb/shared'
import type { GameCtx, Mode } from './ctx'
import { NetClient, type NetStatus } from './net'
import { OnlineMode } from './onlineMode'
import { MAPS, mapCard } from './ui/maps'
import { fillPortraits } from './ui/portrait'
import './ui/lobby.css'

const NAME_KEY = 'gunb.name'
const esc = (s: string): string => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
const MOBILE_KEY = 'gunb.mobile'          // xe chọn lần trước (chỉ là tiện ích giao diện)
const LOGO_URL = '/ui/logo.png'
/** Icon nút đã có ảnh trong `assets/ui/icons/` (thêm tên khi có file mới). Chưa có ảnh thì dùng ký tự thay thế. */
const ICONS = new Set(['create', 'quick-join', 'refresh', 'ready', 'start', 'switch-team', 'leave', 'add-bot', 'chat', 'remove'])
/** `only`: nút chỉ có icon (không kèm chữ). */
const ico = (name: string, fallback = '', only = false): string =>
  ICONS.has(name) ? `<img class="ico${only ? ' only' : ''}" src="/ui/icons/${name}.png" alt="">` : fallback ? fallback + (only ? '' : ' ') : ''
const TURN_TIMES = [15, 20, 30, 45]
const TOAST_MS = 4000
const BOT_LABEL: Record<string, string> = { easy: 'Dễ', normal: 'Vừa', hard: 'Khó' }
const roomNum = (id: string): string => id.replace(/^r/, '')
/** Mức đầy của thanh chỉ số = giá trị lớn nhất trong các xe hiện có. */
const STAT_MAX = (() => {
  const all = MOBILE_IDS.map(id => TUNING.mobiles[id]!)
  return { hp: Math.max(...all.map(d => d.hp)), armor: Math.max(0.01, ...all.map(d => d.armor)), move: Math.max(...all.map(d => d.fuel * d.speedMul)) }
})()

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
  private myName = ''
  private roomFilter: 'all' | 'wait' = 'all'
  private botLevel: BotLevel = 'normal'
  private toastTimer = 0

  /** `onBack` null: không có nút Quay lại (trang login là trang đầu tiên). */
  constructor(private readonly host: OnlineHost, private readonly onBack: (() => void) | null) {
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
  /** Khung toàn màn hình (thay cho khung cũ). `framed`: có viền + thanh tiêu đề như sảnh/phòng. */
  private panel(html: string, framed = false, title = ''): HTMLElement {
    this.el?.remove()
    const el = document.createElement('div')
    el.className = 'gs'
    el.innerHTML = framed
      ? `<div class="gs-frame"><div class="gs-top"><div class="gs-logo"><img src="${LOGO_URL}" alt="${esc(GAME_NAME)}"></div><div class="gs-title">${title}</div>
          <div class="gs-who"><span class="dot"></span>${esc(this.myName)}</div></div>${html}<div class="gs-toast"></div></div>`
      : html
    document.body.appendChild(el)
    this.el = el
    return el
  }

  private show(s: Screen): void {
    this.screen = s
    this.shellFor = ''
    if (s === 'name') this.renderName()
    else if (s === 'connecting') this.panel(`<div class="gs-card"><div class="gs-logo"><img src="${LOGO_URL}" alt="${esc(GAME_NAME)}"></div><p>Đang kết nối tới server…</p><div class="gs-spin"></div></div>`)
    else if (s === 'lobby') this.renderLobby()
    else if (s === 'room') this.renderRoom()
    else if (s === 'loading') this.renderLoading()
    else { this.el?.remove(); this.el = null }
  }

  /** Báo lỗi ngắn ở đáy khung (tự ẩn). */
  private toast(text: string): void {
    const t = this.el?.querySelector<HTMLElement>('.gs-toast, .gs-err')
    if (!t) return
    t.textContent = text
    if (!t.classList.contains('gs-toast')) return
    t.classList.toggle('on', text !== '')
    clearTimeout(this.toastTimer)
    if (text) this.toastTimer = window.setTimeout(() => t.classList.remove('on'), TOAST_MS)
  }

  private renderName(): void {
    let saved = ''
    try { saved = localStorage.getItem(NAME_KEY) ?? '' } catch { /* bỏ qua */ }
    const el = this.panel(`<div class="gs-card"><div class="gs-logo"><img src="${LOGO_URL}" alt="${esc(GAME_NAME)}"></div><p>Chơi online · Tên của bạn</p>
      <input id="nm" maxlength="20" value="${esc(saved)}" placeholder="Nhập tên">
      <div class="gs-err">${esc(this.errText)}</div>
      <div class="row">${this.onBack ? '<button class="gs-btn" id="back">Quay lại</button>' : ''}<button class="gs-btn primary" id="go">Vào sảnh</button></div></div>`)
    const input = el.querySelector<HTMLInputElement>('#nm')!
    const go = (): void => {
      const name = input.value.trim() || `Người chơi ${Math.floor(Math.random() * 900 + 100)}`
      try { localStorage.setItem(NAME_KEY, name) } catch { /* bỏ qua */ }
      this.errText = ''
      this.myName = name
      this.connect(name)
    }
    el.querySelector('#go')!.addEventListener('click', go)
    el.querySelector('#back')?.addEventListener('click', () => this.onBack?.())
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

  // ----- sảnh: danh sách phòng -----
  private renderLobby(): void {
    const pick = this.savedMobile()
    const def = TUNING.mobiles[pick]!
    const el = this.panel(`<div class="gs-body">
        <div class="gs-col">
          <div class="gs-toolbar">
            <button class="gs-btn primary" id="mk">${ico('create', '＋')}Tạo phòng</button>
            <button class="gs-btn go" id="quick">${ico('quick-join')}Vào nhanh</button>
            <button class="gs-btn sky" id="refresh">${ico('refresh', '↻')}Làm mới</button>
            <div class="gs-tabs"><button class="gs-tab" data-f="all">Tất cả</button><button class="gs-tab" data-f="wait">Đang chờ</button></div>
          </div>
          <div class="gs-rooms" id="rooms"></div>
        </div>
        <div class="gs-col">
          <div class="gs-box gs-me">
            <div class="stage"><img data-portrait="${esc(pick)}" alt=""><span class="fallback">${esc(def.name)}</span></div>
            <div class="nm">${esc(this.myName)}</div>
            <div class="gs-tip">Xe quen dùng: <b>${esc(def.name)}</b></div>
          </div>
          <div class="gs-box gs-tip"><h3>Cách chơi</h3><ul>
            <li><b>Tạo phòng</b>: chọn số người, thời gian lượt, bản đồ.</li>
            <li><b>Vào nhanh</b>: vào phòng đang chờ còn chỗ.</li>
            <li>Trong phòng: chọn xe, đổi đội, bấm <b>Sẵn sàng</b>. Chủ phòng thêm máy vào chỗ trống và bấm <b>Bắt đầu</b>.</li>
          </ul></div>
          <div class="gs-spacer"></div>
          <div class="gs-side-actions"><span></span><button class="gs-btn" id="leave">${ico('leave')}Thoát</button></div>
        </div>
      </div>`, true, 'Sảnh chờ')
    fillPortraits(el)
    el.querySelector('#mk')!.addEventListener('click', () => this.openCreate())
    el.querySelector('#quick')!.addEventListener('click', () => {
      const r = this.rooms.find(x => x.status === 'lobby' && x.players < x.max)
      if (r) this.net?.send({ t: MsgType.JoinRoom, roomId: r.id })
      else this.openCreate()
    })
    el.querySelector('#refresh')!.addEventListener('click', () => this.net?.send({ t: MsgType.ListRooms }))
    el.querySelectorAll<HTMLButtonElement>('[data-f]').forEach(b => b.addEventListener('click', () => { this.roomFilter = b.dataset.f as 'all' | 'wait'; this.updateRoomList() }))
    el.querySelector('#leave')!.addEventListener('click', () => this.host.exit())
    this.updateRoomList()
    if (this.errText) this.toast(this.errText)
  }

  private updateRoomList(): void {
    const box = this.el?.querySelector('#rooms')
    if (!box || this.screen !== 'lobby') return
    this.el!.querySelectorAll<HTMLButtonElement>('[data-f]').forEach(b => b.classList.toggle('on', b.dataset.f === this.roomFilter))
    const label = { lobby: 'Đang chờ', loading: 'Đang tải', playing: 'Đang chơi', ended: 'Kết thúc' }
    const list = this.roomFilter === 'wait' ? this.rooms.filter(r => r.status === 'lobby' && r.players < r.max) : this.rooms
    box.innerHTML = list.length === 0
      ? `<div class="gs-empty"><b>☁</b>${this.rooms.length === 0 ? 'Chưa có phòng nào. Bấm <u>Tạo phòng</u> để mở phòng đầu tiên!' : 'Không có phòng nào đang chờ.'}</div>`
      : list.map(r => {
        const full = r.players >= r.max
        const open = r.status === 'lobby' && !full
        const chip = r.status !== 'lobby' ? `<span class="gs-chip play">${label[r.status]}</span>` : full ? '<span class="gs-chip full">Đầy</span>' : '<span class="gs-chip wait">Đang chờ</span>'
        const map = mapCard(r.mapId)
        return `<div class="gs-room${open ? '' : ' off'}" data-id="${esc(r.id)}">
          <div class="thumb" style='background:${map.thumb}'></div>
          <div><div class="name"><span class="num">${esc(roomNum(r.id))}</span>${esc(r.name)}</div>
            <div class="meta">${chip}<span class="gs-chip">👤 ${r.players}/${r.max}</span><span class="gs-chip">${Math.floor(r.max / 2)} vs ${Math.floor(r.max / 2)}</span><span class="gs-chip">${esc(map.name)}</span></div></div></div>`
      }).join('')
    box.querySelectorAll<HTMLElement>('.gs-room:not(.off)').forEach(b => b.addEventListener('click', () => this.net?.send({ t: MsgType.JoinRoom, roomId: b.dataset.id })))
  }

  /** Hộp thoại tạo phòng. */
  private openCreate(): void {
    const frame = this.el?.querySelector('.gs-frame')
    if (!frame || frame.querySelector('.gs-modal')) return
    let perTeam = 2, turnTime = 20
    let mapId = MAPS.some(m => m.id === this.host.ctx.map.id) ? this.host.ctx.map.id : MAPS[0]?.id ?? this.host.ctx.map.id
    const m = document.createElement('div')
    m.className = 'gs-modal'
    m.innerHTML = `<div class="gs-dialog"><div class="hd">Tạo phòng</div><div class="bd">
        <label for="rn">Tên phòng</label><input id="rn" maxlength="30" placeholder="Phòng của ${esc(this.myName)}">
        <label>Số người</label><div class="gs-stepper"><button id="pm">◀</button><b id="pv"></b><button id="pp">▶</button></div>
        <label>Thời gian lượt</label><div class="gs-seg" id="tt">${TURN_TIMES.map(n => `<button data-t="${n}">${n} giây</button>`).join('')}</div>
        <label>Bản đồ</label><span></span>
        <div class="gs-maps">${MAPS.map(x => `<button class="gs-map" data-m="${esc(x.id)}"><div class="thumb" style='background:${x.thumb}'></div><span>${esc(x.name)}</span></button>`).join('')}</div>
      </div><div class="ft"><button class="gs-btn" id="cx">Huỷ</button><button class="gs-btn primary" id="ok">Tạo phòng</button></div></div>`
    frame.appendChild(m)
    const sync = (): void => {
      m.querySelector('#pv')!.textContent = `${perTeam} vs ${perTeam}`
      m.querySelectorAll<HTMLButtonElement>('[data-t]').forEach(b => b.classList.toggle('on', Number(b.dataset.t) === turnTime))
      m.querySelectorAll<HTMLButtonElement>('[data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === mapId))
    }
    const maxPerTeam = Math.floor(MAX_PLAYERS / 2)
    m.querySelector('#pm')!.addEventListener('click', () => { perTeam = perTeam <= 1 ? maxPerTeam : perTeam - 1; sync() })
    m.querySelector('#pp')!.addEventListener('click', () => { perTeam = perTeam >= maxPerTeam ? 1 : perTeam + 1; sync() })
    m.querySelectorAll<HTMLButtonElement>('[data-t]').forEach(b => b.addEventListener('click', () => { turnTime = Number(b.dataset.t); sync() }))
    m.querySelectorAll<HTMLButtonElement>('[data-m]').forEach(b => b.addEventListener('click', () => { mapId = b.dataset.m!; sync() }))
    const close = (): void => m.remove()
    const input = m.querySelector<HTMLInputElement>('#rn')!
    const ok = (): void => {
      this.net?.send({ t: MsgType.CreateRoom, name: input.value, mapId, max: perTeam * 2, turnTime })
      close()
    }
    input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') ok(); if (e.key === 'Escape') close() })
    m.querySelector('#cx')!.addEventListener('click', close)
    m.querySelector('#ok')!.addEventListener('click', ok)
    m.addEventListener('click', e => { if (e.target === m) close() })
    sync()
    input.focus()
  }

  // ----- phòng chờ + chọn xe -----
  private renderRoom(): void {
    const r = this.room
    if (!r) return
    if (this.shellFor !== r.id) {
      const el = this.panel(`<div class="gs-body">
          <div class="gs-col">
            <div class="gs-box gs-info" id="rinfo"></div>
            <div class="gs-teams"><div class="gs-team t0" id="team0"></div><div class="gs-mid" id="ractions"></div><div class="gs-team t1" id="team1"></div></div>
            <div class="gs-box gs-chat"><div class="log" id="gschat"></div><div class="row">${ico('chat')}<input id="chatin" maxlength="200" placeholder="Nhắn tin, Enter để gửi"></div></div>
          </div>
          <div class="gs-col">
            <div class="gs-box gs-detail" id="mdetail"></div>
            <div class="gs-box"><h3>Chọn xe</h3><div class="gs-grid" id="mgrid"></div></div>
          </div>
        </div>`, true, `<span class="num" id="rnum"></span><span id="rtitle"></span>`)
      this.shellFor = r.id
      const cin = el.querySelector<HTMLInputElement>('#chatin')!
      cin.addEventListener('keydown', e => {
        e.stopPropagation()
        if (e.key === 'Enter' && cin.value.trim()) { this.net?.send({ t: MsgType.Chat, text: cin.value }); cin.value = '' }
      })
      this.renderChat()
      // vào phòng mới: dùng lại xe đã chọn lần trước
      const saved = this.savedMobile()
      const mine0 = r.members.find(m => m.pid === this.net?.pid)
      if (r.status === 'lobby' && mine0 && mine0.mobileId !== saved) this.net?.send({ t: MsgType.SetSeat, mobileId: saved })
    }
    const el = this.el!
    const me = this.net?.pid ?? 0
    const mine = r.members.find(m => m.pid === me)
    const isHost = r.hostPid === me
    const editable = r.status === 'lobby'
    const perTeam = Math.max(1, Math.floor(r.max / 2))
    const map = mapCard(r.mapId)
    el.querySelector('#rnum')!.textContent = roomNum(r.id)
    el.querySelector('#rtitle')!.textContent = r.name
    el.querySelector('#rinfo')!.innerHTML = `<div class="thumb" style='background:${map.thumb}'><span>${esc(map.name)}</span></div>
      <dl><dt>Số người</dt><dd>${perTeam} vs ${perTeam} (${r.members.length}/${r.max})</dd><dt>Thời gian lượt</dt><dd>${r.turnTime} giây</dd>
        <dt>Bản đồ</dt><dd>${esc(map.name)}</dd><dt>Chủ phòng</dt><dd>${esc(r.members.find(m => m.pid === r.hostPid)?.name ?? '?')}</dd></dl>`

    for (const team of [0, 1] as const) {
      const members = r.members.filter(m => m.team === team)
      const slots = Math.max(perTeam, members.length)
      let html = `<h4><img src="/ui/team-${team === 0 ? 'blue' : 'red'}.png" alt="" onerror="this.remove()">${esc(TEAM_NAMES[team])}</h4>`
      for (let i = 0; i < slots; i++) {
        const m = members[i]
        if (!m) {
          html += `<div class="gs-slot emptyslot"><div>Chỗ trống${isHost && editable ? `<br><button class="gs-btn sm" data-bot="${team}">${ico('add-bot', '＋')}Thêm máy</button>` : ''}</div></div>`
          continue
        }
        const def = TUNING.mobiles[m.mobileId]
        const badge = !m.connected ? '<span class="gs-badge off">Mất kết nối</span>'
          : m.pid === r.hostPid ? '<span class="gs-badge host">Chủ phòng</span>'
          : m.ready || m.bot ? '<span class="gs-badge ready">Sẵn sàng</span>' : '<span class="gs-badge">Đang chọn…</span>'
        html += `<div class="gs-slot${m.pid === me ? ' me' : ''}">
          <div class="pic"><img data-portrait="${esc(m.mobileId)}" alt=""><span class="fallback">${esc(def?.name ?? m.mobileId)}</span></div>
          <div class="who"><b>${esc(m.name)}${m.pid === me ? ' (bạn)' : ''}</b><small>${esc(def?.name ?? m.mobileId)}${m.bot ? ` · Máy ${BOT_LABEL[m.bot] ?? ''}` : ''}</small>${badge}</div>
          ${m.bot && isHost && editable ? `<button class="gs-btn sm rm" data-rm="${m.pid}" title="Bỏ máy">${ico('remove', '✕', true)}</button>` : ''}</div>`
      }
      el.querySelector(`#team${team}`)!.innerHTML = html
    }
    el.querySelectorAll<HTMLButtonElement>('[data-rm]').forEach(b => b.addEventListener('click', () => this.net?.send({ t: MsgType.RemoveBot, pid: Number(b.dataset.rm) })))
    el.querySelectorAll<HTMLButtonElement>('[data-bot]').forEach(b => b.addEventListener('click', () =>
      this.net?.send({ t: MsgType.AddBot, level: this.botLevel, team: Number(b.dataset.bot) })))

    const actions = el.querySelector('#ractions')!
    actions.innerHTML = `<div class="vs">VS</div>` +
      (isHost ? `<button class="gs-btn primary big" id="st"${editable ? '' : ' disabled'}>${ico('start')}Bắt đầu</button>`
        : `<button class="gs-btn ${mine?.ready ? '' : 'go '}big" id="rd"${editable ? '' : ' disabled'}>${mine?.ready ? 'Huỷ' : ico('ready') + 'Sẵn sàng'}</button>`) +
      `<button class="gs-btn sky" id="team"${editable ? '' : ' disabled'}>${ico('switch-team', '⇄')}Đổi đội</button>` +
      (isHost && editable ? `<select id="blv" title="Mức máy khi thêm vào chỗ trống">${(['easy', 'normal', 'hard'] as const).map(l => `<option value="${l}"${l === this.botLevel ? ' selected' : ''}>Máy: ${BOT_LABEL[l]}</option>`).join('')}</select>` : '')
    actions.insertAdjacentHTML('beforeend', `<button class="gs-btn" id="lv">${ico('leave')}Rời phòng</button>`)
    actions.querySelector('#lv')!.addEventListener('click', () => { this.net?.send({ t: MsgType.LeaveRoom }) })
    actions.querySelector('#st')?.addEventListener('click', () => this.net?.send({ t: MsgType.StartGame }))
    actions.querySelector('#rd')?.addEventListener('click', () => this.net?.send({ t: MsgType.SetSeat, ready: !mine?.ready }))
    actions.querySelector('#team')?.addEventListener('click', () => { if (mine) this.net?.send({ t: MsgType.SetSeat, team: mine.team === 0 ? 1 : 0 }) })
    actions.querySelector<HTMLSelectElement>('#blv')?.addEventListener('change', e => { this.botLevel = (e.target as HTMLSelectElement).value as BotLevel })

    this.renderMobilePicker(mine?.mobileId ?? MOBILE_IDS[0], editable && !!mine && !(mine.ready && !isHost))
    fillPortraits(el)
    if (this.errText) this.toast(this.errText)
  }

  /** Cột phải phòng chờ: thẻ chỉ số xe đang chọn + lưới chọn xe. Đã bấm Sẵn sàng thì khoá chọn xe. */
  private renderMobilePicker(current: string, canPick: boolean): void {
    const el = this.el!
    const d = TUNING.mobiles[current]
    if (d) {
      const stat = (label: string, v: number, txt: string): string => `<div class="gs-stat"><span>${label}</span><div class="bar"><i style="width:${Math.round(Math.max(0, Math.min(1, v)) * 100)}%"></i></div><b>${txt}</b></div>`
      el.querySelector('#mdetail')!.innerHTML = `
        <div class="gs-me"><div class="stage"><img data-portrait="${esc(d.id)}" alt=""><span class="fallback">${esc(d.name)}</span></div></div>
        <div class="nm">${esc(d.name)}</div><div class="role">${esc(d.role)}</div>
        ${stat('Máu', d.hp / STAT_MAX.hp, String(d.hp))}
        ${stat('Giáp', d.armor / STAT_MAX.armor, `${Math.round(d.armor * 100)}%`)}
        ${stat('Cơ động', (d.fuel * d.speedMul) / STAT_MAX.move, String(Math.round(d.fuel * d.speedMul)))}
        ${stat('Góc bắn', (d.angleMax - d.angleMin) / 90, `${d.angleMin}–${d.angleMax}°`)}
        <div class="gs-shots">${d.shots.map((s, i) => `<div${i === 2 ? ' class="ss"' : ''}><b>${i === 2 ? 'SS' : i + 1}. ${esc(s.name)}</b><span>${s.damage} st · delay ${s.delay}</span></div>`).join('')}</div>`
    }
    el.querySelector('#mgrid')!.innerHTML = MOBILE_IDS.map(id => `<button class="gs-pick${id === current ? ' on' : ''}" data-mob="${esc(id)}" title="${esc(TUNING.mobiles[id]!.name)}"${canPick ? '' : ' disabled'}>
        <img data-portrait="${esc(id)}" alt=""><span class="fallback">${esc(TUNING.mobiles[id]!.name)}</span></button>`).join('') +
      `<button class="gs-pick" id="mrand" title="Ngẫu nhiên"${canPick ? '' : ' disabled'}><img src="/ui/random-mobile.png" alt="?"></button>`
    const pick = (id: string): void => {
      try { localStorage.setItem(MOBILE_KEY, id) } catch { /* bỏ qua */ }
      this.net?.send({ t: MsgType.SetSeat, mobileId: id })
    }
    el.querySelectorAll<HTMLButtonElement>('[data-mob]').forEach(b => b.addEventListener('click', () => pick(b.dataset.mob!)))
    el.querySelector('#mrand')!.addEventListener('click', () => pick(MOBILE_IDS[Math.floor(Math.random() * MOBILE_IDS.length)]!))
  }

  private savedMobile(): string {
    let id: string | null = null
    try { id = localStorage.getItem(MOBILE_KEY) } catch { /* bỏ qua */ }
    return id && TUNING.mobiles[id] && (MOBILE_IDS as readonly string[]).includes(id) ? id : MOBILE_IDS[0]
  }

  private renderChat(): void {
    const log = this.el?.querySelector('#gschat')
    if (!log) return
    log.innerHTML = this.chat.length === 0 ? '<div class="sys">Chào mừng vào phòng! Nhắn tin cho cả phòng ở ô bên dưới.</div>' : this.chat.slice(-30).map(l => `<div>${l}</div>`).join('')
    log.scrollTop = log.scrollHeight
  }

  private renderLoading(): void {
    const r = this.room
    if (!r) return
    const map = mapCard(r.mapId)
    const el = this.el && this.shellFor === 'loading:' + r.id ? this.el
      : this.panel(`<div class="gs-load" style='background:${map.thumb}'><div class="bigname">${esc(map.name)}</div><div class="gs-lrows" id="lbars"></div><div class="gs-err" id="lerr"></div></div>`, true, 'Đang tải bản đồ…')
    this.shellFor = 'loading:' + r.id
    el.querySelector('#lbars')!.innerHTML = r.members.map(m => {
      const st = this.loadPct.get(m.pid) ?? { pct: 0, ready: false }
      return `<div class="gs-lrow t${m.team}"><img data-portrait="${esc(m.mobileId)}" alt=""><div><b>${esc(m.name)}</b><div class="bar"><i style="width:${Math.round(st.pct)}%"></i></div></div><b>${st.ready ? '✔' : Math.round(st.pct) + '%'}</b></div>`
    }).join('')
    fillPortraits(el)
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
      this.toast(this.errText)
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
        this.myName = String(m.name ?? this.myName)
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
      case MsgType.Stats: this.mode?.onStats(m.stats as PlayerStats[]); break
      case MsgType.Shot: this.mode?.onShot(m.result as ShotResultNet, Number(m.shooter), Number(m.slot)); break
      case MsgType.Error:
        this.errText = String(m.text)
        this.toast(this.errText)
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
      // vừa hết trận: để người chơi xem hết bảng kết quả, họ bấm Về phòng chờ (hoặc hết giờ đếm) thì mới chuyển
      if (this.mode?.holdingResults) { this.mode.roomReady(); return }
      if (this.mode) this.leaveGame()
      if (this.screen !== 'room') this.show('room')
      else this.renderRoom()
    } else if (room.status === 'loading') {
      if (this.mode) this.leaveGame()   // chủ phòng đã bắt đầu ván mới khi mình còn xem bảng kết quả
      if (this.screen !== 'loading' || this.loadingRoom !== room.id) void this.startLoading(room)
      else this.renderLoading()
    }
    // 'playing' / 'ended': màn chơi tự lo (MatchStart đến sau)
  }

  private enterGame(start: MatchStartMsg, mask: TerrainMask): void {
    this.mode = new OnlineMode(this.host.ctx, this.net!, start, mask,
      () => { this.leaveGame(); this.show('lobby'); this.net?.send({ t: MsgType.ListRooms }) },
      () => { this.leaveGame(); if (this.room?.status === 'lobby') this.show('room'); else this.show('lobby') })
    this.host.startMode(this.mode)
    this.show('game')
  }

  private leaveGame(): void {
    this.pendingStart = null
    if (this.mode) { this.mode = null; this.host.stopMode() }
  }
}
