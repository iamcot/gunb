import { WebSocketServer } from 'ws'
import { GAME_NAME, SERVER_PORT } from '@gunb/shared'

const port = Number(process.env.GUNB_PORT ?? SERVER_PORT)
const wss = new WebSocketServer({ port })
wss.on('connection', (ws, req) => {
  console.log(`[server] kết nối từ ${req.socket.remoteAddress}`)
  ws.on('close', () => console.log('[server] ngắt kết nối'))
})
console.log(`[server] ${GAME_NAME} nghe ở ws://localhost:${port}`)
