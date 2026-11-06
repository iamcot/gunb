import { GAME_NAME } from '@gunb/shared'

export interface MenuHandlers { onHotseat: (perTeam: number) => void; onPractice: () => void }

/** Màn hình menu chính (overlay HTML). */
export class Menu {
  private readonly el: HTMLElement

  constructor(h: MenuHandlers) {
    this.el = document.createElement('div')
    this.el.className = 'overlay'
    this.el.innerHTML = `<div class="panel"><h1>${GAME_NAME}</h1>
      <p>Chơi chung một máy (hotseat)</p>
      <div class="row">${[1, 2, 3, 4].map(n => `<button data-n="${n}">${n} vs ${n}</button>`).join('')}</div>
      <p>hoặc</p><div class="row"><button id="practice">Tập bắn (bia)</button></div></div>`
    this.el.querySelectorAll<HTMLButtonElement>('button[data-n]').forEach(b => b.addEventListener('click', () => h.onHotseat(Number(b.dataset.n))))
    this.el.querySelector('#practice')!.addEventListener('click', () => h.onPractice())
    document.body.appendChild(this.el)
  }

  show(): void { this.el.style.display = 'flex' }
  hide(): void { this.el.style.display = 'none' }
}
