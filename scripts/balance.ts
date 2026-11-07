// Cân bằng: cho bot đấu bot nhiều ván 1v1 (mọi cặp pháo, xoay vòng), xuất tỷ lệ thắng theo pháo.
// Chạy: npm run balance -- --games 200 --level hard --map dao-noi [--seed 1] [--out plan/balance-report.md]
import { writeFileSync } from 'node:fs'
import {
  ALL_MOBILE_IDS, BotDriver, MAX_TURNS, TUNING, applyAction, createMatch, currentPlayer, isSettled,
  type BotCmd, type BotLevel,
} from '@gunb/shared'
import { loadMap } from '../server/src/mapLoader'

const args = new Map<string, string>()
for (let i = 2; i < process.argv.length; i += 2) args.set(process.argv[i]!.replace(/^--/, ''), process.argv[i + 1] ?? '')
const GAMES = Number(args.get('games') ?? 128)
const LEVEL = (args.get('level') ?? 'hard') as BotLevel
const MAP = args.get('map') ?? 'dao-noi'
const SEED = Number(args.get('seed') ?? 1)
const OUT = args.get('out')
const DT = 0.1

const map = loadMap(MAP)

interface Result { winner: -1 | 0 | 1; turns: number }

function play(seed: number, a: string, b: string): Result {
  const mask = map.mask.clone()
  const s = createMatch({ seed, mask, spawnZones: map.meta.spawnZones, players: [{ name: 'A', team: 0, mobileId: a }, { name: 'B', team: 1, mobileId: b }] })
  const drivers = [new BotDriver(LEVEL), new BotDriver(LEVEL)]
  const cmd: BotCmd = { angle: 45, dir: 0, fire: false, power: 0, slot: 0 }
  const env = { mask }
  let guard = 0
  while (s.phase !== 'ended' && guard++ < 200000) {
    if (s.phase === 'aiming') {
      const p = currentPlayer(s)
      drivers[p.id]!.step(s, mask, TUNING, DT, cmd)
      applyAction(s, { t: 'aim', id: p.id, angle: cmd.angle }, env)
      if (cmd.dir !== 0) applyAction(s, { t: 'move', id: p.id, dir: cmd.dir, dt: DT }, env)
      if (cmd.fire) applyAction(s, { t: 'fire', id: p.id, angle: cmd.angle, power: cmd.power, slot: cmd.slot }, env)
      else applyAction(s, { t: 'tick', dt: DT }, env)
    } else {
      applyAction(s, { t: 'tick', dt: DT }, env)
      if (isSettled(s)) applyAction(s, { t: 'endTurn' }, env)
    }
  }
  return { winner: (s.winner ?? -1) as -1 | 0 | 1, turns: Math.min(s.turnNo, MAX_TURNS) }
}

const ids = [...ALL_MOBILE_IDS] as string[]
const pairs: [string, string][] = []
for (const a of ids) for (const b of ids) pairs.push([a, b])
const stat = new Map(ids.map(id => [id, { games: 0, wins: 0, draws: 0 }]))
const matrix = new Map<string, { wins: number; games: number }>()
let team0Wins = 0, decided = 0, turnsSum = 0
const t0 = Date.now()
for (let g = 0; g < GAMES; g++) {
  const [a, b] = pairs[(g * 37) % pairs.length]!   // bước 37 nguyên tố cùng nhau với số cặp: ván nào cũng phủ đều các cặp
  const r = play(SEED * 100003 + g, a, b)
  turnsSum += r.turns
  const sa = stat.get(a)!, sb = stat.get(b)!
  sa.games++; sb.games++
  const key = `${a}|${b}`
  const m = matrix.get(key) ?? { wins: 0, games: 0 }
  m.games++
  if (r.winner === -1) { sa.draws++; sb.draws++ } else {
    decided++
    if (r.winner === 0) { sa.wins++; team0Wins++; m.wins++ } else sb.wins++
  }
  matrix.set(key, m)
  if ((g + 1) % 10 === 0) process.stderr.write(`\r${g + 1}/${GAMES} ván, ${((Date.now() - t0) / 1000).toFixed(0)} s`)
}
process.stderr.write('\n')

const pct = (x: number, n: number): string => (n === 0 ? '—' : `${(100 * x / n).toFixed(0)}%`)
const lines: string[] = []
lines.push(`# Báo cáo cân bằng`, '', `Bản đồ \`${MAP}\`, bot mức \`${LEVEL}\`, ${GAMES} ván 1v1 (xoay vòng mọi cặp pháo, ${TUNING.weather.chance * 100}% lượt có thời tiết), trung bình ${(turnsSum / GAMES).toFixed(1)} lượt/ván.`, '')
lines.push(`Đội Xanh (đi trước theo id) thắng ${pct(team0Wins, decided)} số ván phân thắng bại.`, '')
lines.push('| Pháo | Ván | Thắng | Hoà | Tỷ lệ thắng |', '|---|---|---|---|---|')
for (const id of ids) { const s = stat.get(id)!; lines.push(`| ${TUNING.mobiles[id]!.name} | ${s.games} | ${s.wins} | ${s.draws} | ${pct(s.wins, s.games - s.draws)} |`) }
lines.push('', '**Đối đầu** (hàng thắng cột, chỉ khi hàng ở đội Xanh; ô có ít ván nên nhiễu):', '')
lines.push(`| | ${ids.map(i => TUNING.mobiles[i]!.name).join(' | ')} |`, `|---|${ids.map(() => '---').join('|')}|`)
for (const a of ids) lines.push(`| ${TUNING.mobiles[a]!.name} | ${ids.map(b => { const m = matrix.get(`${a}|${b}`); return m ? pct(m.wins, m.games) : '—' }).join(' | ')} |`)
const text = lines.join('\n') + '\n'
console.log(text)
if (OUT) writeFileSync(OUT, text)
