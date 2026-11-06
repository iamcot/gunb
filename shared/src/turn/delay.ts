export interface DelayInfo {
  id: number
  hp: number
  delay: number
  lastActed: number   // số thứ tự lượt gần nhất đã đi (-1 nếu chưa đi)
}

/** Còn sống: hp > 0. */
const alive = (p: DelayInfo): boolean => p.hp > 0

/** So sánh thứ tự đi: delay nhỏ hơn trước; bằng nhau thì ai lâu chưa đi hơn; rồi theo id. */
export function compareTurnOrder(a: DelayInfo, b: DelayInfo): number {
  return a.delay - b.delay || a.lastActed - b.lastActed || a.id - b.id
}

/** Người đi lượt kế (bỏ qua người chết). Trả undefined nếu không còn ai. */
export function pickNext<T extends DelayInfo>(players: readonly T[]): T | undefined {
  let best: T | undefined
  for (const p of players) if (alive(p) && (!best || compareTurnOrder(p, best) < 0)) best = p
  return best
}

/** Thứ tự đi hiện tại của những người còn sống (để hiện danh sách lượt sắp tới). */
export function turnOrder<T extends DelayInfo>(players: readonly T[]): T[] {
  return players.filter(alive).sort(compareTurnOrder)
}
