import { TEAM_NAMES, TUNING, type MatchState, type PlayerStats, type Team } from '@gunb/shared'
import { fillPortraits } from './ui/portrait'

const esc = (s: string): string => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Sau khi hồn thoát xác cuối cùng vỡ, chờ thêm chừng này giây (cho tia sáng tắt) rồi mới hiện bảng kết quả. Chỉ là nhịp hình. */
export const RESULTS_DELAY_S = 0.9

export interface ResultsButton { id: string; label: string; cls?: string }

/** HTML bảng kết quả kiểu giao diện sảnh: băng rôn đội thắng, 2 cột đội, mỗi người một thẻ (ảnh xe, máu còn, sát thương, hạ gục, số phát, vụ nổ sát nhất), ngôi sao cho sát thương cao nhất. */
/** `you`: phe của người xem (để ghi Chiến thắng / Thất bại) và id của họ nếu có (đánh dấu "bạn"); null = hotseat, chỉ ghi đội nào thắng. */
export function resultsHtml(m: MatchState, stats: PlayerStats[] | null, you: { team: Team; id?: number } | null, buttons: ResultsButton[], note = ''): string {
  const win = m.winner === -1 ? -1 : m.winner as Team
  const youTeam = you?.team, youId = you?.id ?? null
  const banner = win === -1 ? 'Hoà!' : youTeam === undefined ? `${TEAM_NAMES[win]} thắng!` : youTeam === win ? 'Chiến thắng!' : 'Thất bại!'
  const sub = win === -1 ? 'Hai đội cùng gục' : `${TEAM_NAMES[win]} thắng trận`
  const maxDmg = stats ? Math.max(0, ...stats.map(s => s.damage)) : 0
  const col = (team: Team): string => {
    const rows = m.players.filter(p => p.team === team).map(p => {
      const s = stats?.[p.id]
      const mvp = s && maxDmg > 0 && s.damage === maxDmg
      const name = TUNING.mobiles[p.mobileId]?.name ?? p.mobileId
      const hp = p.hp > 0 ? `<span class="gs-badge ready">${Math.round(p.hp)} HP</span>` : '<span class="gs-badge off">Đã hạ</span>'
      const nums = s
        ? `<div class="ge-nums"><span><b>${Math.round(s.damage)}</b>Sát thương</span><span><b>${s.kills}</b>Hạ</span><span><b>${s.shots}</b>Số phát</span>` +
          `<span><b>${Number.isFinite(s.closest) ? Math.round(s.closest) : '—'}</b>Nổ sát (px)</span></div>`
        : ''
      return `<div class="gs-slot ge-row${p.id === youId ? ' me' : ''}${p.hp > 0 ? '' : ' dead'}">` +
        `<div class="pic"><img data-portrait="${esc(p.mobileId)}" alt=""><span class="fallback">${esc(name)}</span></div>` +
        `<div class="who"><b>${esc(p.name)}${p.id === youId ? ' (bạn)' : ''}${mvp ? ' <i class="ge-mvp" title="Sát thương cao nhất">★</i>' : ''}</b><small>${esc(name)}</small>${hp}${nums}</div></div>`
    }).join('')
    return `<div class="gs-team t${team}${win === team ? ' won' : ''}"><h4><img src="/ui/team-${team === 0 ? 'blue' : 'red'}.png" alt="" onerror="this.remove()">${esc(TEAM_NAMES[team])}${win === team ? ' · Thắng' : ''}</h4>${rows}</div>`
  }
  const btns = buttons.map(b => `<button class="gs-btn ${b.cls ?? ''}" id="${b.id}">${esc(b.label)}</button>`).join('')
  const cls = win === -1 ? 'draw' : youTeam === undefined ? `t${win}` : youTeam === win ? 'win' : 'lose'
  return `<div class="ge-card ${cls}"><div class="ge-hd"><div class="ge-title">${banner}</div><div class="ge-sub">${sub}</div></div>` +
    `<div class="ge-bd">${col(0)}${col(1)}</div><div class="ge-ft"><span class="ge-note">${esc(note)}</span>${btns}</div></div>`
}

/** Tạo lớp phủ bảng kết quả (mờ màn chơi phía sau) và gắn vào trang. */
export function showResults(html: string): HTMLElement {
  const el = document.createElement('div')
  el.className = 'gs gs-end'
  el.innerHTML = html
  fillPortraits(el)
  document.body.appendChild(el)
  return el
}
