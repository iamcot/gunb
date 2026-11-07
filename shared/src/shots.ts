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
  /** Như `basic`, nhưng bay đủ `afterS` s thì "lớn lên": khi nổ nhân bán kính nổ / hố / sát thương (chưa đủ giờ thì nổ như thông số gốc của đạn). */
  | { kind: 'airGrow'; afterS: number; blastMul: number; carveMul: number; damageMul: number }
  /** Nổ như đạn thường, rồi `delay` s sau vệ tinh bắn `count` tia laser nhắm vào điểm nổ: tia giữa đúng điểm nổ, các tia sau lần lượt nhắm lệch
   *  ±`spacing` px theo phương ngang (phải, trái, phải xa...), cách nhau `interval` s. `from: 'sky'` = vệ tinh ở tận trời, tia thẳng đứng xuống;
   *  `from: 'shooter'` = vệ tinh ở trên đầu xe bắn `altitude` px (chỗ vệ tinh luôn bay theo xe), tia chéo từ đó tới điểm nhắm. Mỗi tia rộng 2×`halfWidth` px, đi thẳng qua điểm nhắm
   *  và đốt xuyên `depth` px đất tính từ chỗ chạm đất đầu tiên (khoét rãnh dọc theo tia), gây `damage` lên mọi xe nằm trên tia (giảm theo khoảng cách tới tia). */
  | { kind: 'satellite'; from: 'sky' | 'shooter'; altitude: number; delay: number; count: number; spacing: number; interval: number; halfWidth: number; depth: number; damage: number }
  /** Item Dịch chuyển: chạm đất/xe thì không nổ, chỉ báo event `teleport` (chỗ đứng mới của người bắn). */
  | { kind: 'teleport' }

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
