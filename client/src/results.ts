import { TEAM_NAMES, type MatchState, type PlayerStats, type Team } from '@gunb/shared'

const esc = (s: string): string => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** HTML bảng kết quả: đội thắng, mỗi người một dòng (máu còn, sát thương, hạ gục, phát sát nhất) và đánh dấu ngôi sao sát thương cao nhất. */
export function resultsHtml(m: MatchState, stats: PlayerStats[] | null): string {
  const title = m.winner === -1 ? 'Hoà!' : `${TEAM_NAMES[m.winner as Team]} thắng!`
  const maxDmg = stats ? Math.max(0, ...stats.map(s => s.damage)) : 0
  const rows = m.players.map(p => {
    const s = stats?.[p.id]
    const star = s && maxDmg > 0 && s.damage === maxDmg ? ' ★' : ''
    return `<tr><td style="color:${p.team === 0 ? '#60a5fa' : '#f87171'}">${esc(p.name)}${star}</td><td>${p.hp > 0 ? Math.round(p.hp) + ' HP' : 'đã hạ'}</td>` +
      (s ? `<td>${Math.round(s.damage)}</td><td>${s.kills}</td><td>${s.shots}</td><td>${Number.isFinite(s.closest) ? Math.round(s.closest) + ' px' : '—'}</td>` : '') + '</tr>'
  }).join('')
  const head = stats ? '<tr><th>Người chơi</th><th>Máu</th><th>Sát thương</th><th>Hạ</th><th>Số phát</th><th>Nổ sát nhất</th></tr>' : ''
  return `<h2>${title}</h2><table class="results">${head}${rows}</table>`
}
