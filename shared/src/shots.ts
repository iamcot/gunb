/** Ô đạn: 0 = đạn 1, 1 = đạn 2, 2 = đạn SS (cần đầy thanh SS). */
export type ShotSlot = 0 | 1 | 2
export const SS_SLOT: ShotSlot = 2

/** Kiểu hành vi của đạn. Mỗi kiểu là một nhánh trong `simulateShot` (xem shot/simulateShot.ts). */
export type Behavior =
  | { kind: 'basic' }
  /** `count` quả bắn liền nhau, cách nhau `interval` s, cùng hướng/lực (mỗi quả lệch thêm `angleStepDeg` độ so với quả trước). */
  | { kind: 'burst'; count: number; interval: number; angleStepDeg: number }
  /** Khi lên tới đỉnh quỹ đạo thì tách thành `count` quả, tỏa ± `spreadDeg` độ quanh hướng bay. */
  | { kind: 'splitAtApex'; count: number; spreadDeg: number }
  /** Chạm đất thì khoan tiếp `length` px (theo vận tốc / ngang / thẳng xuống) với tốc độ `speed` px/s, đào hầm bán kính `tunnelRadius`, rồi nổ. */
  | { kind: 'drill'; length: number; tunnelRadius: number; direction: 'velocity' | 'horizontal' | 'down'; speed: number }
  /** Nổ như đạn thường, rồi `delay` s sau có tia sét giáng thẳng xuống đúng điểm nổ (thêm một vụ nổ với thông số riêng). */
  | { kind: 'lightning'; delay: number; damage: number; blastRadius: number; carveRadius: number }

  /** Bắn cùng lúc `count` quả tỏa đều quanh hướng bắn, cách nhau `spreadDeg` độ (không đổi tốc độ). */
  | { kind: 'spread'; count: number; spreadDeg: number }
  /** Chạm đất thì lăn theo mặt đất về hướng đang bay tới `distance` px (tốc độ `speed` px/s); gặp xe, vách cao hoặc hết quãng thì nổ; hết đất thì rơi tiếp. */
  | { kind: 'roller'; distance: number; speed: number }
  /** Chạm lớp đất dày ≤ `maxThickness` px thì xuyên qua (khoét lỗ bán kính `holeRadius` ở chỗ vào/ra), tối đa `maxPierce` lần; dày hơn thì nổ. */
  | { kind: 'pierce'; maxThickness: number; maxPierce: number; holeRadius: number }
  /** Nổ không khoét mà ĐẮP đất: `count` hình tròn bán kính `radius` xếp chồng thẳng đứng từ điểm nổ lên trên (bỏ qua nếu chạm xe). */
  | { kind: 'build'; radius: number; count: number }

export interface ShotDef {
  name: string
  maxSpeed: number        // px/s khi lực = 100
  windFactor: number      // hệ số ảnh hưởng gió (có thể âm)
  gravityFactor: number
  blastRadius: number     // bán kính gây sát thương (px)
  carveRadius: number     // bán kính khoét hố (px)
  damage: number          // sát thương tối đa (khi nổ sát tâm xe)
  delay: number           // delay cộng sau khi bắn
  behavior: Behavior
  /** Mục tiêu trúng đạn bị giảm giáp `amount` (tuyệt đối) trong `turns` lượt của chính nó. */
  armorBreak?: { turns: number; amount: number }
}
