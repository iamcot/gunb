# 17 – Đối chiếu cơ chế xe với game gốc + kế hoạch sửa (bản 2)

Ngày: 2026-11-07. Nguồn: danh sách xe/đạn/thông số game gốc người dùng dán trong thread. Đối chiếu với code `main` (8 xe) + PR #11 (Cú Thiên Văn, còn mở ở thread khác).

## Nguyên tắc (đã chốt với người dùng)

- **Cơ chế đạn bám sát game gốc.** Đó là điểm làm nên sức hút của thể loại, nên mình làm đúng cách đạn hoạt động: đạn bay thế nào, tách/xoắn/lặn/hoá vàng khi nào, trúng ai thì sao.
- **Đổi hết phần nhìn và phần nhận diện:** tên xe, hình xe, phi công, hình đạn, âm thanh, bản đồ đều của riêng mình. Không dùng tên/hình/nhạc của game gốc hay game thương mại khác (CLAUDE.md). Không đổi tên xe thành tên gốc.
- **Chỉ số lấy theo tỉ lệ**, không chép nguyên con số của bản gốc: số của mình tự đặt, giữ tỉ lệ tương đối (HP giữa các xe, delay đạn 1 : 2 : SS, sát thương SS / đạn 1).
- Không thêm cả roster gốc. Xe mới chỉ khi cơ chế thiếu hẳn.
- Bản sắc cũ nào **mâu thuẫn** với cơ chế gốc thì nhường cơ chế gốc (Bọ Lôi bắn đuôi, Rùa Thành đắp đất, Sứa Đèn xuyên đất mỏng). Code `build` (đắp đất) vẫn giữ trong `shared/`, không xoá, có thể dùng cho item sau này.

## 1. Tỉ lệ chung

| | Gốc | Mình hiện tại | Hướng sửa |
|---|---|---|---|
| HP | 950–1200 | 95–148 | **Nhân 10** (xem mục 2) |
| Delay đạn 1 : 2 : SS | 250 : 400 : 800 (1 : 1,6 : 3,2) | ~110 : 160 : 230 (1 : 1,5 : 2,1) | SS ≈ 3,2× đạn 1; đạn 2 ≈ 1,6× |
| Delay theo giây suy nghĩ | +10/s (một xe 12/s) | Không có | Thêm |
| Delay xe | ~480–550 | 0 (bắt đầu bằng 0) | Chỉ đổi thứ tự lượt nếu muốn xe chậm đi sau; hoãn, xem mục 5 |
| Khiên hồi mỗi vòng | 4 xe | Không | Thêm (Sứa Đèn) |
| Loại xe khắc nhau (máy/sinh học/khiên) | Có | Không | Không làm, trừ dư chấn sét (mục 3) |

## 2. HP 100 hay 1000: có làm tròn không?

Đúng, thang 100 chịu làm tròn nhiều hơn dù tỉ lệ như nhau. Code tính `Math.round(damage × (1 − d/r) × (1 − giáp))` thành số nguyên **cho từng phát trúng**:
- Đạn nhiều viên (4 rồng, 6 bóng nước, 8–9 tên lửa, 5 tia vệ tinh, dư chấn sét ~7) mỗi viên bị làm tròn riêng. Sai số tối đa 0,5 mỗi viên, tức đến ~2–5% sát thương ở viên nhỏ, cộng dồn.
- Sát thương theo khoảng cách (rìa vụ nổ) chỉ có ~10–20 bậc thay vì 100–200.
- Giáp 0,08 / 0,1 / 0,15 / 0,22 khó phân biệt khi sát thương chỉ vài điểm.
- Chênh lệch giữa xe cũng khó chỉnh tinh (máu 95 vs 100 vs 105).

**Đề xuất (task A0):** nhân HP và sát thương ×10 (HP ~1000, đạn 1 ~100–200, SS ~350–500 theo tỉ lệ), delay ×2,5 (đạn 250 / 400 / 800), item heal/rơi/vận tốc... nhân tương ứng; thanh máu UI chia lại. Chỉ là con số (không đổi kiểu), nhưng đụng `mobiles/*.ts`, `items.ts`, `tuning.ts` (rơi, phạt), test và bot nên làm **một lần, trước mọi việc khác**. Tỉ lệ cân bằng giữ nguyên nên `plan/balance-report.md` vẫn tham khảo được; vẫn chạy lại.

## 3. Đối chiếu từng xe và đích cần sửa

Mức giống: ●●● gần đúng, ●●○ cùng ý khác chi tiết, ●○○ khác hẳn.

### Sứa Đèn ↔ xe khiên-laser (Mage) – hiện ●○○
| Đạn | Cơ chế gốc cần làm | Hiện tại |
|---|---|---|
| Xe | **Khiên** (máu xanh) ~22% HP, hồi một lượng mỗi vòng; sát thương trừ khiên trước | Không có khiên |
| 1 | **Một tia laser**, bay như đạn, nổ khi chạm đất/xe | Quả cầu xuyên đất mỏng |
| 2 | **Hai tia khác màu xoắn quanh nhau**, sau một lúc **chụm lại**. **Mỗi tia có sát thương riêng**, chụm lại mà trúng cả hai là mạnh nhất. Có khi một tia chạm đất/xe thì tia kia bay tiếp | Xuyên đất dày hơn |
| SS | Quả cầu sáng, vùng nổ rộng **xoá khiên** của mọi xe trong vùng, trúng trực tiếp thì đau | Xuyên 3 lần, nổ to |

Cần: `beam` (đạn là tia: vẽ dải sáng theo vận tốc, không phải viên), `twin` (2 viên xoắn quanh trục bay, bán kính xoắn giảm dần về 0 sau `convergeS` giây, mỗi viên va chạm và tính damage riêng), `shield` (C1) + `shieldBreak` ở SS. Bỏ `pierce` khỏi Sứa Đèn (giữ code).

### Chũi Khoan ↔ xe đào đất (Nakmachine) – hiện ●○○
| Đạn | Cơ chế gốc cần làm | Hiện tại |
|---|---|---|
| 1 | Đạn thường, nổ khi chạm | Khoan 90 px |
| 2 | **Chạm đất thì lặn xuống, chạy ngầm rồi trồi lên mặt đất mới nổ** | Khoan ngang 160 px, nổ ở cuối hầm |
| SS | Mini-chũi **xuyên mọi địa hình**, chỉ nổ khi chạm **xe** (cả đồng đội và xác xe), sát thương thấp, trúng điểm yếu mới mạnh | Khoan thẳng xuống |

Cần: `drill` thêm `resurface` (đào theo hướng bay tới khi gặp không khí phía trên rồi nổ ở đó; tối đa `maxLength`, không ra thì nổ cuối đường), `ghost` (bay xuyên đất, khoét hầm nhỏ, nổ khi chạm xe kể cả xác). Hố nổ ở chỗ trồi lên, không phải chỗ lặn.

### Bọ Lôi ↔ xe sét (Lightning) – hiện ●○○
Đã sai từ gốc: trước đây nhầm với xe tia điện kiểu khác nên cho **bắn bằng đuôi** (`reverse`, `slopeAim`, góc 20–45° so với thân). Sửa lại là **xe thường, nòng phía trước**.
| Đạn | Cơ chế gốc cần làm | Hiện tại |
|---|---|---|
| 1 | Cầu điện bay, **chạm đâu thì một tia sét giáng thẳng từ trời xuống đúng chỗ đó**; có đất phủ trên đầu xe thì sét đánh vào đất, không trúng xe. Sau đó có **dư chấn** thêm sát thương (≈ 8% HP, hơi nhiều với xe máy hơn xe khác) | Điện giật nổ + bào giáp |
| 2 | Như 1 nhưng **hai tia sét chéo** từ hai bên rơi xuống chỗ chạm | Chùm ba tách ở đỉnh |
| SS | Mũi tên điện tạo **vùng tròn lớn**; **mọi xe trong hoặc ngoài vòng** đều bị sét đánh (một mức sát thương cố định), hợp bắn hai xe cùng lúc | Nổ + 1 tia |

Cần: `lightning` thêm `from: 'sky'` (tia chạy từ mép trên bản đồ xuống, dừng ở bề mặt đất đầu tiên), `angleDeg` (tia chéo), `aftershock`, và `areaBolt` (tìm mọi xe trong bán kính + ngoài, mỗi xe một tia riêng). Bỏ `armorBreak` khỏi Bọ Lôi (bào giáp không phải cơ chế của xe sét gốc; code `armorBreak` vẫn giữ). Client: bỏ `reverse` trong rig, đặt nòng phía đầu; **ảnh xe Bọ Lôi hiện vẽ quay đuôi nên có thể cần vẽ lại** (`plan/06-prompt-xe.md`), kiểm sau khi code xong.

### Diều Hâu Giấy ↔ xe boomerang (Boomer) – hiện ●○○
Chỉ bắt chước "đi ngược gió" là chưa đủ. Cơ chế gốc: đạn là **boomerang rất nhẹ**, đường bay **cong vòng và quay lại** tùy gió, khó điều khiển nhưng bắn được những góc mà xe khác không bắn được (góc rộng, chỉ ~1/3 là góc "thật").
| Đạn | Cơ chế gốc cần làm | Hiện tại |
|---|---|---|
| 1 | **1 boomerang**, lực gió rất mạnh, đường bay uốn quay lại | `basic` gió ngược |
| 2 | **4 boomerang** cùng lúc, mỗi cái yếu hơn | 2 quả nối đuôi |
| SS | Như 1, bay đủ `goldenAfterS` giây thì **hoá vàng**, sát thương gấp nhiều lần (chưa đủ thời gian thì chỉ bằng đạn 1) | `basic` to |

Cần: behavior `boomerang`: ngoài trọng lực và gió (hệ số lớn), có **lực hồi** hướng về phía người bắn (hoặc vuông góc với vận tốc, làm quỹ đạo cong), tăng dần theo thời gian bay. Va chạm xe/đất tính cả lúc bay đi lẫn bay về. Đạn 2: 4 quả lệch pha nhẹ. SS: `airGrow` (B1) đổi ảnh + nhân sát thương/bán kính khi qua mốc. Task có rủi ro: cần **prototype + overlay vẽ quỹ đạo** (F4) để chỉnh hằng số đến khi bắn được cảm giác "quay lại" trước khi chốt thông số; mỗi vòng chỉnh sửa một nguyên nhân (CLAUDE.md).

### Rùa Thành ↔ xe nước (Turtle) – hiện ●○○
Đắp đất dựng thành ở **cả 2 đạn** là dở (ý kiến người dùng) và lệch cơ chế. Đổi thành:
| Đạn | Cơ chế gốc cần làm | Hiện tại |
|---|---|---|
| 1 | **Một dòng nước**, sát thương vừa | Đạn đá |
| 2 | **Hai dòng nước xoắn quanh nhau**, sau ~3 s **nhập làm một**, trúng cả hai thì rất đau | Tường đất |
| SS | Quả nước lớn, vài giây sau **tách thành 6 quả nhỏ** tỏa ra; đứng đúng chỗ tách thì 400–600 (cả 6 trúng) | Núi đá |
| Xe | Giáp cao nhất, chậm, **delay theo giây cao hơn (12 thay vì 10)** | Giáp 0,22, chậm |

Cần: dùng lại `twin` (như Sứa Đèn đạn 2, bán kính xoắn và thời gian chụm khác) và `splitAfter` (B7: tách theo thời gian, không phải đỉnh). Đắp đất chỉ còn trong code, hết dùng trong xe.

### Ốc Thiết Giáp ↔ xe giáp (Armor) – hiện ●●○
| Đạn | Cơ chế gốc cần làm | Hiện tại |
|---|---|---|
| 1 | Một quả nặng, nổ rộng, khoét nhiều đất | `basic` ✔ |
| 2 | **Một đạn hai đầu**: đầu 1 nổ khi chạm, đầu 2 **bay tiếp** tới vật kế; trúng cả hai sát thương cao hơn, đầu 2 **bỏ qua giáp** nếu đầu 1 đã trúng | 2 quả nối đuôi riêng |
| SS | Đạn thường, bay **~2,5 s thì phình to**, sát thương lớn hơn hẳn nếu trúng | `basic` to |

Cần: `tandem` (B2) và `airGrow` (B1, dùng chung với SS Diều Hâu).

### Cua Lăn ↔ xe đĩa/mìn (Raon Launcher) – hiện ●○○
| Đạn | Cơ chế gốc cần làm | Hiện tại |
|---|---|---|
| 1 | **3 đĩa xoay quanh nhau**, khoét nhiều đất | Bi lăn |
| 2 | **2 quả mìn**: nằm lại; khi có địch ở gần, râu đỏ + quay; **tới lượt người bắn thì bò chậm về phía địch gần nhất**, chạm là nổ; bị hút nhiều hơn với xe máy | Bi lăn xa |
| SS | Con lớn **bò theo hướng bắn**, gặp vách dốc quá thì **quay đầu**, 5–7 s tự nổ, chạm xe nào cũng nổ | Cầu đá lăn, gặp vách nổ |

Cần: `orbit` (3 viên xoắn chung, dùng lại `twin` mở rộng N viên), `roller` thêm `turnAtWall`, `fuseS`, `explodeOnVehicle`, và **mìn nằm chờ qua lượt**: thêm thực thể sống lâu trong `MatchState` (`mines[]`), tick bò ở đầu lượt người bắn, giao thức Snapshot/Shot thêm mìn, client vẽ. Đây là task lớn nhất; làm cuối.

### Nhím Chùm ↔ xe tên lửa (Bigfoot) – hiện ●●○
Đã giống ý. Chỉnh theo gốc: đạn 1 = 4 tên lửa tỏa rộng khi bay xa (hơn là 5); đạn 2 = 6 quả tỏa ngay sau khi bắn (hơn là 3); SS = 9 quả (hơn là 7). Chỉ đổi `count`/`spreadDeg`, thêm hệ số "tỏa tăng dần theo quãng bay" (`spreadGrowth`, đạn 1).

### Cú Thiên Văn ↔ xe vệ tinh (A.Sate) – ●●● (theo PR #11)
PR #11 còn mở ở thread khác (vệ tinh hiện lơ lửng trên đầu xe, quả cầu không gây sát thương, tia gây sát thương). Plan này **không đụng Cú Thiên Văn**, chỉ ghi các điểm lệch để làm **sau khi #11 merge**, trên nhánh mới từ main:
- Đạn 1/2: vật cản giữa vệ tinh và điểm chạm hứng tia (kiểm tra có chưa); vệ tinh ở đạn 2 cao gấp ~3 đạn 1; tia hơi lệch (không chính xác tuyệt đối).
- SS: vệ tinh bay tới trên đầu điểm chạm, **quét 5 tia từ trái sang phải**, mỗi tia cách một khoảng nhỏ (hiện là 1 cột to).
- Xe: giáp/HP đã ổn.

### Hai xe ẩn (đã có ảnh, chưa có `MobileDef`)
- **Long Ngư Cơ ↔ xe rồng (Dragon):** đạn 1 một cầu lửa nhẹ; đạn 2 **4 cầu lửa** (tỏa ra nếu bay lâu, mạnh nhất khi bắn gần, góc thấp); SS cầu đỏ, chạm đâu thì **4 con rồng nhỏ hiện thành nửa vòng tròn rồi bò vào tâm**, đất ở phía trên cao làm giảm sát thương. Cần `spread` (đã có), `summon`/`converge` (mới, kiểu vệ tinh nhưng bay vào tâm).
- **Kỳ Lân Sắt ↔ xe kiếm (Knight):** cơ chế cùng họ vệ tinh nhưng khác thông số: đạn 1 **kiếm lớn** bắn nhiều kiếm nhỏ (kém chính xác hơn vệ tinh), đạn 2 gấp đôi độ cao với 5 kiếm (chính xác hơn), SS kiếm quét. Dùng lại `satellite` của #11 với thông số khác, chờ #11 merge.
- Cả 2 chỉ xuất hiện qua nút Ngẫu nhiên (kế hoạch cũ).

## 4. Cơ chế gốc còn thiếu trong game (tổng hợp)

| Cơ chế | Dùng cho | Task |
|---|---|---|
| Đạn là tia (vẽ dải) | Sứa Đèn | B3 |
| 2/3 viên xoắn rồi chụm (`twin`/`orbit`) | Sứa Đèn đ2, Rùa Thành đ2, Cua Lăn đ1 | B3 |
| Lặn rồi trồi lên mặt đất nổ (`resurface`) | Chũi Khoan đ2 | B4 |
| Xuyên mọi địa hình, nổ khi chạm xe cả xác (`ghost`) | Chũi Khoan SS | B4 |
| Sét giáng từ trời + dư chấn + sét vùng | Bọ Lôi | B5 |
| Boomerang cong quay lại theo gió | Diều Hâu Giấy | B6 (prototype trước) |
| Đạn đổi dạng theo thời gian bay (`airGrow`) | Ốc SS, Diều SS | B1 |
| Đạn hai đầu (`tandem`) | Ốc đ2 | B2 |
| Tách theo thời gian (`splitAfter`) | Rùa SS | B7 |
| Bò, quay đầu ở vách, tự nổ (`roller` mở rộng) | Cua Lăn SS | B8 |
| Khiên hồi theo vòng, xoá khiên | Sứa Đèn | C1 |
| Mìn nằm chờ qua lượt, bò về địch | Cua Lăn đ2 | C3 |
| Delay theo giây | tất cả | A2 |
| Hút/đẩy xe (xe J.D. gốc) | chưa có xe cần | để sau, không làm lần này |

## 5. Kế hoạch sửa

Mỗi task: viết test cho cơ chế mới → `npm run typecheck` + `npm test` → mở overlay F4 xác minh quỹ đạo bằng mắt → `npm run balance` → ghi PROGRESS. Task đổi kiểu trong `shared/` (nhánh `Behavior`, `ShotEvent`, trường `MobileDef`/`PlayerState`/`MatchState`/protocol) ⚠️ cần người dùng đồng ý (CLAUDE.md); việc gộp nhiều task cùng một đợt nên xin đồng ý theo đợt.

**Đợt A – Nền số**
- A0. Nhân HP/sát thương ×10, delay ×2,5; chỉnh item, rơi, thanh máu; chạy lại test + balance. (Không đổi kiểu.)
- A1. Delay đạn theo tỉ lệ gốc (đ1 : đ2 : SS ≈ 1 : 1,6 : 3,2).
- A2. ⚠️ Delay theo giây suy nghĩ (`Tuning.turn.delayPerSecond`, xe riêng `delayPerSecondMul`; Rùa Thành ×1,2).

**Đợt B – Cơ chế đạn mới (mỗi cơ chế một PR nhỏ, có test + ảnh quỹ đạo)**
- B1. ⚠️ `airGrow` → Ốc SS phình, Diều SS hoá vàng.
- B2. ⚠️ `tandem` → Ốc đ2.
- B3. ⚠️ `beam` + `twin`/`orbit` → Sứa Đèn đ1, đ2; Rùa Thành đ1, đ2 (đạn nước); Cua Lăn đ1 (3 đĩa).
- B4. ⚠️ `drill.resurface` + `ghost` → Chũi Khoan đ2, SS.
- B5. ⚠️ Sét giáng từ trời + dư chấn + sét vùng → Bọ Lôi; bỏ `reverse`/`slopeAim` khỏi Bọ Lôi, đổi rig. Kiểm tra ảnh xe.
- B6. ⚠️ `boomerang` → Diều Hâu Giấy (prototype quỹ đạo trước, chỉnh bằng overlay).
- B7. ⚠️ `splitAfter` → Rùa Thành SS.
- B8. ⚠️ `roller` mở rộng → Cua Lăn SS.
- B9. Nhím Chùm 4 / 6 / 9 quả (chỉ đổi số).

**Đợt C – Hệ thống**
- C1. ⚠️ Khiên (`MobileDef.shield`, `PlayerState.shield`, hồi mỗi vòng; Snapshot thêm trường; thanh máu có phần xanh) + SS Sứa Đèn xoá khiên.
- C2. Hai xe ẩn (sau #11 merge, vì Kỳ Lân Sắt dùng `satellite`).
- C3. ⚠️ Mìn nằm chờ (`MatchState.mines`, giao thức, client) → Cua Lăn đ2.
- C4. Cú Thiên Văn: sửa theo mục 3 (sau #11 merge).

**Thứ tự:** A0 → A1 → B1 → B5 → B4 → B3 → B7 → B2 → B9 → A2 → B6 → B8 → C1 → C2 → C4 → C3. Chọn B5, B4, B3 sớm vì người dùng chỉ rõ là thiếu nhất. B6 để sau A0 vì cần nhiều vòng chỉnh. Cuối mỗi đợt chạy lại `npm run balance` và chỉnh số.

**Rủi ro:**
- Bot (`shared/bot.ts`) quét góc + lực, chưa biết đạn cong/xoắn/quay lại; sẽ phải kiểm lại mô phỏng cho từng cơ chế và có thể giảm độ chính xác bot với Diều Hâu và Cua Lăn.
- Tia xoắn và boomerang tốn tick va chạm hơn; cần giữ `simulateShot` dưới 100 ms (test bot hiện có).
- Mìn qua lượt đổi giao thức online và việc phát lại Shot nên làm sau cùng.

## 6. Đã chốt (người dùng đồng ý ngày 2026-11-07)

1. Được đổi kiểu dữ liệu trong `shared/` cho các task ⚠️ ở đợt B, C (vẫn làm từng task một, mỗi task một PR, ghi rõ kiểu nào đổi trong PR).
2. Làm A0 (nhân HP/sát thương ×10, delay ×2,5) trước mọi việc khác.
3. Bọ Lôi thành xe thường, nòng phía trước; vẽ lại ảnh nếu rig cũ không hợp.
4. Mìn nằm chờ (C3) làm cuối cùng.

Việc code bắt đầu từ A0, thực hiện ở thread/PR riêng, không gộp vào PR plan này.

## 7. Hình ảnh và âm thanh cần chuẩn bị (theo thứ tự làm)

Quy ước đã có: ảnh đạn PNG nền trong suốt, vẽ **nằm ngang, đầu chĩa phải**, đặt ở `assets/mobiles/<id>/shot-N.png` kèm `shots.json` (độ dài vẽ, `fire`, `boom`); hiệu ứng chung ở `assets/fx/`; âm `.ogg` ở cùng thư mục xe. Mọi file mới phải vào `assets/CREDITS.json`. Code chạy được khi thiếu file (vẽ bằng code), nên chuẩn bị muộn hơn code cũng không chặn việc.

| Task | Hình cần | Âm cần |
|---|---|---|
| **B1** Ốc SS, Diều SS | Ốc: `shot-3` dạng nhỏ + `shot-3-big` (đạn phình to, cùng phong cách). Diều: `shot-3` boomerang thường + `shot-3-gold` (hoá vàng, sáng) | Tiếng "phình to" (nhỏ), tiếng hoá vàng (chuông ngắn, sáng) |
| **B5** Bọ Lôi | **Xe vẽ lại nếu cần**: thân + nòng, nòng ở phía đầu, hướng phải (prompt `plan/06-prompt-xe.md`). Đạn: `shot-1`, `shot-2` cầu điện, `shot-3` mũi tên điện. FX: tia sét dọc từ trời (dải dọc ghép được, có thể dùng lại `storm-bolt.png`), tia sét chéo, dư chấn (tia điện nhỏ quanh xe), vòng điện cho SS | Sét giáng (đã có `bolt-3.ogg`, thêm 1 bản ngắn cho tia chéo), dư chấn (rè điện nhẹ) |
| **B4** Chũi Khoan | `shot-2` mũi chũi lặn, `shot-3` mini-chũi xuyên đất (hơi mờ viền). FX: đất bật ra chỗ lặn và chỗ trồi (dùng lại `dirt-*.png`, thêm 1 nắp đất nứt nếu muốn) | Tiếng lặn xuống đất, tiếng trồi lên (đất vỡ), tiếng xuyên đất của mini-chũi |
| **B3** Sứa Đèn (tia) | `shot-1` **một tia laser** (dải dài, đầu sáng, đuôi mờ), `shot-2` **hai tia hai màu khác nhau** (hai ảnh `shot-2a`, `shot-2b`), `shot-3` quả cầu sáng lớn. FX: nổ laser, vòng xoá khiên, vệt khiên bị vỡ | Tiếng bắn tia (1, 2 tia), tiếng 2 tia chụm lại, nổ laser, khiên vỡ |
| **B3** Rùa Thành (nước) | `shot-1` dòng nước, `shot-2a/2b` hai dòng nước, `shot-3` quả nước lớn + `water-small` (quả nhỏ sau khi tách). FX: bắn tung nước, vòng nước tách | Tiếng nước bắn, tiếng nước tách thành 6 (B7), nổ nước |
| **B3** Cua Lăn đ1 | `shot-1` đĩa (xoay), 3 đĩa dùng chung một ảnh | Tiếng đĩa xoay (vù), nổ đất nặng |
| **B6** Diều Hâu Giấy | `shot-1/2` boomerang (xoay được quanh tâm; đạn 2 dùng chung ảnh cho 4 quả) | Tiếng boomerang xoay vù vù (loop ngắn), tiếng quay về |
| **B2** Ốc đ2 | `shot-2` đầu trước + `shot-2b` đầu sau (tách được 2 hình) | Nổ đầu 1 (nhẹ), nổ đầu 2 (nặng) |
| **B8** Cua SS | Con lớn bò: 2–4 khung chạy hoặc ảnh xoay nhẹ | Tiếng bước chân nặng |
| **C1** Khiên | Icon khiên nhỏ cho thanh máu (có thể vẽ bằng code) | Tiếng trúng khiên, khiên vỡ |
| **C2** Long Ngư Cơ | Đạn: cầu lửa nhỏ (đ1), cầu lửa (đ2, dùng chung), quả cầu đỏ (SS), **rồng con** (hướng phải, lật được). FX: lửa nổ | Tiếng lửa bắn, rồng con hiện ra, rồng con lao vào |
| **C2** Kỳ Lân Sắt | Kiếm lớn dẫn đường, kiếm nhỏ (nhiều), kiếm SS | Tiếng kiếm bay, kiếm cắm |
| **C3** Cua mìn | Mìn: nằm yên, râu đỏ quay (2 khung), đang bò | Bíp khi phát hiện địch, nổ |
| **C4** Cú Thiên Văn | Dùng ảnh #11 + thêm tia SS quét 5 tia | Dùng âm #11 |

**Làm trước:** B1, B5, B4, B3 (khớp thứ tự code). Xe Bọ Lôi quay đầu nòng là việc cần ảnh sớm nhất vì ảnh cũ vẽ bắn bằng đuôi.
