import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { WebSocketServer, type WebSocket } from 'ws'
import { GAME_NAME, SERVER_PORT } from '@gunb/shared'
import { Lobby, type Conn } from './lobby'

const port = Number(process.env.GUNB_PORT ?? SERVER_PORT)
const DIST = resolve(fileURLToPath(new URL('../../client/dist', import.meta.url)))
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg',
}

// Phục vụ bản build của client (npm run build) để chơi chỉ cần một cổng; khi dev thì Vite lo phần này.
const http = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]!)
  if (!existsSync(DIST)) { res.writeHead(404).end('Chưa build client: chạy "npm run build" rồi mở lại.'); return }
  let file = normalize(join(DIST, url === '/' ? 'index.html' : url))
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html')
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
})

const lobby = new Lobby()
const wss = new WebSocketServer({ server: http, path: '/ws', maxPayload: 64 * 1024 })
wss.on('connection', (ws: WebSocket, req) => {
  const conn: Conn = { send: d => { if (ws.readyState === ws.OPEN) ws.send(d) }, close: () => ws.close() }
  console.log(`[server] kết nối từ ${req.socket.remoteAddress}`)
  lobby.connect(conn)
  ws.on('message', (data: Buffer) => lobby.onMessage(conn, new Uint8Array(data.buffer, data.byteOffset, data.byteLength)))
  ws.on('close', () => { lobby.disconnect(conn); console.log('[server] ngắt kết nối') })
  ws.on('error', () => ws.close())
})
setInterval(() => lobby.sweep(), 5000).unref()

http.listen(port, () => {
  console.log(`[server] ${GAME_NAME} chạy ở http://localhost:${port} (ws: /ws)`)
  for (const list of Object.values(networkInterfaces()))
    for (const i of list ?? []) if (i.family === 'IPv4' && !i.internal) console.log(`[server] LAN: http://${i.address}:${port}`)
})
