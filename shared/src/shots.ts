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
  | { kind: 'drill'; length: number; tunnelRadius: number; direction: 'velocity' | 'horizontal' | 'down'; speed: number
      /** Lặn rồi trồi (Chũi Khoan đạn 2): lặn `diveLength` px theo `direction` (chui xuyên đất, không để lại hầm), rồi uốn cong dần (bán kính cua `turnRadius` px, không gấp khúc) sang hướng chếch lên `riseDeg`° (so với phương ngang, về phía đang bắn) và đi tối đa `riseMax` px cho tới khi chui ra khỏi mặt đất thì nổ ở chỗ trồi lên (`length` bị bỏ qua). Hết `riseMax` mà chưa ra thì nổ ngay tại đó. */
      resurface?: { diveLength: number; turnRadius: number; riseDeg: number; riseMax: number } }
  /** Xuyên mọi địa hình (Chũi Khoan SS): bay như đạn thường nhưng không va đất, khoét hầm bán kính `tunnelRadius` dọc đường; chỉ nổ khi chạm xe (kể cả đồng đội và xác xe), ra khỏi bản đồ thì thôi. */
  | { kind: 'ghost' }
  /** Nổ như đạn thường, rồi `delay` s sau có tia sét giáng thẳng xuống đúng điểm nổ (thêm một vụ nổ với thông số riêng). */
  | { kind: 'lightning'; delay: number; damage: number; blastRadius: number; carveRadius: number
      /** Các tia sét giáng xuống chỗ đạn chạm, mỗi phần tử là độ lệch khỏi phương thẳng đứng (độ; 0 = thẳng từ trời xuống, ±35 = chéo từ hai bên). Mặc định [0]; mảng rỗng = không có tia ở chỗ chạm. Tia đi từ trời xuống và dừng ở vật rắn đầu tiên trên đường (đất hoặc xe): có đất che phía trên thì sét đánh vào đất, không trúng xe. */
      angles?: number[]
      /** Tia chéo không chụm vào một điểm: mỗi tia lệch `spread` px ra phía nó đi tới (tia từ trái rơi bên trái điểm chạm, tia từ phải rơi bên phải). Mặc định 0. */
      spread?: number
      /** Dư chấn: mỗi xe trúng sét chịu thêm `damage` (đã trừ giáp) sau `delay` s kể từ tia trúng nó; mỗi xe chỉ một lần mỗi phát bắn. */
      aftershock?: { delay: number; damage: number }
      /** Sét vùng (SS): mọi xe còn sống trừ người bắn trong `radius` px quanh chỗ chạm (trong hay ngoài vòng nổ) bị một tia riêng từ trời đánh thẳng xuống, cách nhau `stagger` s; mỗi tia nổ bán kính `blastRadius`, hố `carveRadius`, sát thương `damage`. */
      area?: { radius: number; damage: number; blastRadius: number; carveRadius: number; stagger: number } }

  /** Bắn cùng lúc `count` quả tỏa đều quanh hướng bắn, cách nhau `spreadDeg` độ (không đổi tốc độ). */
  | { kind: 'spread'; count: number; spreadDeg: number }
  /** Chạm đất thì lăn theo mặt đất về hướng đang bay tới `distance` px (tốc độ `speed` px/s); gặp xe, vách cao hoặc hết quãng thì nổ; hết đất thì rơi tiếp. */
  | { kind: 'roller'; distance: number; speed: number
      /** Bò dài (Cua Lăn SS): bỏ qua `distance`; gặp vách dốc thì quay đầu thay vì nổ; tự nổ sau `fuseS` s kể từ lần chạm đất đầu; chạm xe nào (trừ người bắn trong 0,3 s đầu) cũng nổ. */
      crawl?: { fuseS: number } }
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
  | { kind: 'satellite'; from: 'sky' | 'shooter'; altitude: number; delay: number; count: number; spacing: number; interval: number; halfWidth: number; depth: number; damage: number
      /** Tia không chính xác tuyệt đối: mỗi tia lệch ngẫu nhiên (có seed, xác định theo lệnh bắn) tối đa ±`jitter` px theo phương ngang. Mặc định 0. */
      jitter?: number
      /** Quét: các tia đi lần lượt từ trái sang phải (cách nhau `spacing`, đối xứng quanh điểm nhắm) thay vì giữa-phải-trái. */
      sweep?: boolean }
  /** Sau khi nổ ở điểm chạm (đạn đánh dấu, không cần sát thương) triệu hồi `count` con vật xếp nửa vòng tròn bán kính `radius` phía trên điểm chạm rồi bò vào tâm: mỗi con tới tâm sau `delay` s (cách nhau `interval` s) thì nổ với thông số riêng. */
  | { kind: 'converge'; count: number; radius: number; delay: number; interval: number; damage: number; blastRadius: number; carveRadius: number }
  /** Đạn hai đầu (Ốc Thiết Giáp đ2): hai quả nối đuôi nhau cách `gapS` s, cùng hướng/lực. Đầu 1 nổ với `damage` của đạn; đầu 2 bay tiếp (qua hố đầu 1 vừa khoét) tới vật kế tiếp rồi nổ với `secondDamage`, và **bỏ qua giáp** của xe đã trúng đầu 1 trong phát bắn này. */
  | { kind: 'tandem'; gapS: number; secondDamage: number }
  /** Bay `afterS` s rồi tách thành `count` quả con tỏa đều ±`spreadDeg`/2·(count−1) quanh hướng bay (Rùa Thành SS). Quả con nổ theo thông số `child` (nhỏ hơn); chạm đất/xe trước khi tách thì nổ cả quả với thông số của đạn. */
  | { kind: 'splitAfter'; afterS: number; count: number; spreadDeg: number; child: { blastRadius: number; carveRadius: number; damage: number } }
  /** Xoắn rồi chụm (Sứa Đèn đ2, Rùa Thành đ2, Cua Lăn đ1): bắn cùng lúc `count` viên (2 = hai tia/dòng nước, 3 = ba đĩa) quanh một trục bay chung; mỗi viên lệch khỏi trục theo phương vuông góc vận tốc một đoạn
   *  `radius`·(1 − t/`convergeS`)·sin(pha + 2π·`turns`·t/`convergeS`) px (pha chia đều 2π cho các viên), nên xoắn rộng dần rồi hẹp về 0 sau `convergeS` s và bay chồng lên nhau. Mỗi viên va chạm, nổ và tính `damage` riêng
   *  (viên nào chạm trước nổ trước, viên kia bay tiếp). */
  | { kind: 'twin'; count: number; radius: number; convergeS: number; turns: number }
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
  /** Vụ nổ xoá sạch khiên của mọi xe trong vùng nổ (kể cả khi sát thương ở rìa làm tròn về 0) trước khi tính sát thương (Sứa Đèn SS). */
  shieldBreak?: boolean
  /** Đường bay cong quay lại (boomerang, Diều Hâu Giấy): thêm gia tốc ngang `returnAccel` px/s² hướng NGƯỢC chiều bắn (về phía người bắn), tăng tuyến tính từ 0 tới đủ sau `rampS` s kể từ lúc quả đạn rời nòng. Dùng được cùng mọi `behavior` bay (basic, spread, airGrow...). */
  curve?: { returnAccel: number; rampS: number }
}
