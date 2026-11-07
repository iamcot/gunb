import type { MobileDef } from './types'

/** Cua Lăn: đạn 1 ba đĩa xoắn chụm; đạn 2 lăn theo địa hình; SS con cua lớn bò theo hướng bắn, gặp vách thì quay đầu, 6 s tự nổ. */
export const CUA_LAN: MobileDef = {
  id: 'cua-lan', name: 'Cua Lăn', role: 'Đạn lăn theo địa hình',
  hp: 1050, armor: 0.1, radius: 18, speedMul: 0.95, fuel: 110, angleMin: 0, angleMax: 65, muzzle: { px: 31, py: -13, ox: 49, oy: 0 },
  shots: [
    { name: 'Ba đĩa', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 55, carveRadius: 42, damage: 150, delay: 300, behavior: { kind: 'twin', count: 3, radius: 26, convergeS: 2, turns: 1.5 } },
        { name: 'Cua mìn', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 50, carveRadius: 28, damage: 220, delay: 480, behavior: { kind: 'mine', count: 2, spreadDeg: 8, crawlPx: 110, detect: 220, mineDamage: 380, mineBlast: 70, mineCarve: 40 } },
    { name: 'Cua khổng lồ', maxSpeed: 800, windFactor: 1, gravityFactor: 1, blastRadius: 110, carveRadius: 80, damage: 850, delay: 960, behavior: { kind: 'roller', distance: 0, speed: 90, crawl: { fuseS: 6 } } },
  ],
}
