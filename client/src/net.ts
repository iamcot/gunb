import { MsgType, decodeMsg, encodeMsg, type Msg } from '@gunb/shared'

export type NetStatus = 'connecting' | 'open' | 'down'

const TOKEN_KEY = 'gunb.token'
const RETRY_MS = 1500
const MAX_RETRY = 40          // ~60 s, khớp thời gian server giữ chỗ

function store(op: 'get' | 'set' | 'del', v?: string): string | null {
  try {
    if (op === 'get') return sessionStorage.getItem(TOKEN_KEY)
    if (op === 'set') sessionStorage.setItem(TOKEN_KEY, v!)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch { /* trình duyệt chặn storage: bỏ qua, chỉ mất khả năng vào lại */ }
  return null
}

/** Kết nối WebSocket tới server: gửi Hello kèm token cũ (để vào lại trận), tự nối lại khi rớt. Token lưu theo từng tab. */
export class NetClient {
  pid = 0
  onMessage: (m: Msg) => void = () => {}
  onStatus: (s: NetStatus) => void = () => {}
  private ws: WebSocket | null = null
  private retries = 0
  private closed = false
  private retryTimer = 0

  constructor(private readonly name: string) {}

  connect(): void {
    this.closed = false
    this.onStatus('connecting')
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'
    this.ws = ws
    ws.onopen = () => {
      this.retries = 0
      this.sendRaw({ t: MsgType.Hello, name: this.name, token: store('get') ?? undefined })
    }
    ws.onmessage = ev => {
      let m: Msg
      try { m = decodeMsg(new Uint8Array(ev.data as ArrayBuffer)) } catch { return }
      if (m.t === MsgType.Welcome) { this.pid = m.pid as number; store('set', m.token as string); this.onStatus('open') }
      this.onMessage(m)
    }
    ws.onclose = () => {
      if (this.ws !== ws) return
      this.ws = null
      if (this.closed) return
      this.onStatus('down')
      if (++this.retries > MAX_RETRY) { store('del'); return }
      this.retryTimer = window.setTimeout(() => this.connect(), RETRY_MS)
    }
  }

  private sendRaw(msg: Msg): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(encodeMsg(msg))
  }

  send(msg: Msg): void { this.sendRaw(msg) }

  /** Ngắt hẳn (thoát khỏi chế độ online) và quên token. */
  close(): void {
    this.closed = true
    window.clearTimeout(this.retryTimer)
    store('del')
    this.ws?.close()
    this.ws = null
  }
}
