import { GAME_NAME, type BotLevel } from '@gunb/shared'

export interface MenuHandlers { onHotseat: (perTeam: number) => void; onVsBot: (perTeam: number, level: BotLevel) => void; onPractice: () => void; onOnline: () => void }

/** Màn hình menu chính (overlay HTML). */
export class Menu {
  private readonly el: HTMLElement

  constructor(h: MenuHandlers) {
    this.el = document.createElement('div')
    this.el.className = 'overlay'
    this.el.innerHTML = `<div class="panel"><h1>${GAME_NAME}</h1>
      <p>Chơi chung một máy (hotseat)</p>
      <div class="row">${[1, 2, 3, 4].map(n => `<button data-n="${n}">${n} vs ${n}</button>`).join('')}</div>
      <p>Chơi với máy (bạn đội Xanh, máy đội Đỏ)</p>
      <div class="row"><select id="lvl"><option value="easy">Dễ</option><option value="normal" selected>Vừa</option><option value="hard">Khó</option></select>${[1, 2, 3, 4].map(n => `<button data-b="${n}">${n} vs ${n}</button>`).join('')}</div>
      <p>hoặc</p><div class="row"><button id="practice">Tập bắn (bia)</button><button id="online">Chơi online</button></div>
      <p><label style="cursor:pointer"><input type="checkbox" id="allskill"> Bật hết skill (thanh SS luôn đầy, bắn SS mọi lượt)</label></p></div>`
    this.el.querySelectorAll<HTMLButtonElement>('button[data-n]').forEach(b => b.addEventListener('click', () => h.onHotseat(Number(b.dataset.n))))
    this.el.querySelectorAll<HTMLButtonElement>('button[data-b]').forEach(b => b.addEventListener('click', () => h.onVsBot(Number(b.dataset.b), (this.el.querySelector('#lvl') as HTMLSelectElement).value as BotLevel)))
    this.el.querySelector('#practice')!.addEventListener('click', () => h.onPractice())
    this.el.querySelector('#online')!.addEventListener('click', () => h.onOnline())
    document.body.appendChild(this.el)
  }

  /** Trang debug: bật hết skill (SS luôn đầy) cho chơi chung máy / chơi với máy. */
  get allSkills(): boolean { return (this.el.querySelector('#allskill') as HTMLInputElement).checked }

  show(): void { this.el.style.display = 'flex' }
  hide(): void { this.el.style.display = 'none' }
}
