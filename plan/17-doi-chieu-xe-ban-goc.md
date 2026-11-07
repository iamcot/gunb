# 17 – Đối chiếu cơ chế xe với game gốc + kế hoạch sửa

Ngày: 2026-11-07. Nguồn: danh sách xe/đạn/thông số game gốc người dùng dán trong thread. Đối chiếu với code `main` (8 xe) + PR #11 (Cú Thiên Văn).

## Nguyên tắc (bắt buộc)

- Gun Storm là **game riêng cùng thể loại**, không phải bản sao. Danh sách gốc chỉ dùng để tham khảo **cơ chế đạn** (đạn làm gì) và **tỉ lệ cân bằng tương đối** (delay đạn 1 : đạn 2 : SS, sát thương SS so với đạn 1, xe trâu vs xe cơ động).
- **Giữ nguyên** tên, hình, phi công, âm thanh và bản sắc riêng của từng xe. Không đổi tên xe thành tên gốc, không chép nguyên bộ chỉ số (HP 1000, delay 250/400/800...). Số của mình luôn suy ra theo tỉ lệ trên thang của mình (HP ~100).
- Không thêm toàn bộ roster gốc. Chỉ đề xuất cơ chế mới khi nó **thiếu hẳn** trong game và đáng có, và gắn vào xe đã có hoặc 2 xe ẩn đã có ảnh (Long Ngư Cơ, Kỳ Lân Sắt), với thiết kế riêng.
- Chỗ mình cố ý khác gốc (bắn bằng đuôi của Bọ Lôi, đắp đất của Rùa Thành, xuyên đất mỏng của Sứa Đèn...) là bản sắc, **giữ lại**.

## 1. Tỉ lệ chung

| | Gốc | Mình | Nhận xét |
|---|---|---|---|
| HP | 950–1200 (cao nhất/thấp nhất ≈ 1,26) | 95–148 (≈ 1,56) | Thang /10 hợp lý. Rùa Thành 148 lệch xa nhưng bù bằng đạn yếu (cân bằng 36%), giữ. |
| Delay đạn 1 : 2 : SS | 250 : 400 : 800 ≈ **1 : 1,6 : 3,2** | ~110 : 160 : 230 ≈ **1 : 1,5 : 2,1** | SS của mình rẻ delay hơn gốc nhiều. |
| Sát thương SS / đạn 1 | ≈ 3× | 2,2–2,9× | Gần đúng, không cần đổi. |
| Delay theo thời gian lượt | +10 delay mỗi giây suy nghĩ (Rùa 12) | **Không có**, chỉ phạt khi hết giờ | Thiếu: nghĩ lâu không bị thiệt. |
| Delay đi lại | theo thời gian | 0,2/px (đi hết xăng ≈ 24) | Ổn. |
| Khiên (HP xanh hồi mỗi vòng) | Có cho 4 xe | Không có | Thiếu cả một kiểu xe. |
| Loại xe (máy/sinh học/khiên) ảnh hưởng sát thương | Có | Không | **Không làm**: phức tạp, ít người chơi để ý. |

## 2. Đối chiếu từng xe

Mức giống: ●●● gần đúng cơ chế, ●●○ cùng ý nhưng khác chi tiết, ●○○ khác hẳn.

| Xe mình | Gần với | Đạn | Gốc làm gì | Mình đang làm gì | Mức |
|---|---|---|---|---|---|
| **Ốc Thiết Giáp** | Armor | 1 | Một quả nặng, nổ rộng, phá đất tốt | `basic`, nổ 70 px | ●●● |
| | | 2 | **Một** đạn 2 đầu: đầu 1 nổ khi chạm, đầu 2 bay tiếp tới vật kế; trúng cả 2 thì đầu 2 xuyên giáp | `burst` 2 quả bắn cách 0,3 s cùng đường | ●●○ |
| | | SS | Đạn thường, bay đủ ~2,5 s thì **phình to** và mạnh hơn hẳn | `basic` to | ●○○ |
| **Chũi Khoan** | Nakmachine | 1 | Đạn thường | Khoan theo hướng bay 90 px | ●○○ (cố ý, giữ) |
| | | 2 | Chui xuống đất rồi **trồi lên mặt đất** mới nổ | Khoan ngang 160 px | ●○○ |
| | | SS | **Xuyên mọi địa hình**, chỉ nổ khi chạm xe (cả xác) | Khoan thẳng xuống 220 px | ●○○ |
| **Bọ Lôi** | Lightning | 1 | Chạm đâu thì **sét giáng thẳng từ trên xuống** chỗ đó (bị đất che thì sét đánh vào đất) + dư chấn | `basic` + bào giáp (giữ: bản sắc) | ●○○ |
| | | 2 | Như đạn 1 nhưng **2 tia sét chéo** từ hai bên | `splitAtApex` 3 quả | ●○○ |
| | | SS | Vùng nổ lớn, **mọi xe trong vùng** đều bị sét đánh | Nổ + 1 tia sét đúng điểm nổ (thực chất là vụ nổ thứ 2) | ●●○ |
| **Cua Lăn** | Raon Launcher | 1 | 3 đĩa xoay, khoét nhiều đất | Bi lăn 260 px | ●○○ (cố ý, giữ) |
| | | 2 | 2 quả **mìn nằm chờ**, tới lượt người bắn thì bò về địch gần | Bi lăn xa | ●○○ |
| | | SS | Con lớn **bò theo hướng bắn, gặp vách quay đầu**, 5–7 s tự nổ, chạm xe thì nổ | Bi lăn 520 px, gặp vách thì nổ | ●●○ |
| **Diều Hâu Giấy** | Boomer | 1 | Rất nhẹ, ăn gió mạnh | `windFactor −1,3` | ●●● (ngược gió là bản sắc) |
| | | 2 | **4** quả cùng lúc, mỗi quả yếu | `burst` 2 quả nối đuôi | ●●○ |
| | | SS | Bay đủ vài giây thì **hoá vàng**, sát thương rất cao; chưa kịp thì chỉ bằng đạn 1 | `basic` to, ngược gió mạnh hơn | ●○○ |
| **Nhím Chùm** | Bigfoot | 1 | 4 tên lửa, tỏa rộng khi bay xa | `spread` 5 | ●●● |
| | | 2 | 6 lựu đạn, tỏa ngay sau khi bắn | `spread` 3 rộng | ●●○ |
| | | SS | 9 tên lửa | `spread` 7 | ●●● |
| **Sứa Đèn** | Mage (ít chắc) | 1 | Laser nổ khi chạm | Xuyên đất mỏng (bản sắc, giữ) | ●○○ |
| | | 2 | **2 tia xoắn quanh nhau**, mỗi tia va chạm riêng | Xuyên đất dày hơn | ●○○ |
| | | SS | Vùng lớn **xoá khiên** + trúng thẳng rất đau | Xuyên 3 lần, nổ to | ●○○ |
| | | xe | Có **khiên** hồi mỗi vòng | Không | ●○○ |
| **Rùa Thành** | Turtle (chỉ chỉ số) | 1 | Dòng nước | `basic` | ●●● |
| | | 2 | 2 dòng xoắn, ~3 s thì nhập làm một | Đắp tường đất (bản sắc, giữ) | ●○○ |
| | | SS | Quả lớn, vài giây sau **tách 6 quả** tỏa ra | Đắp núi đá, sát thương 25 | ●○○ |
| | | xe | Giáp cao nhất, chậm | Giáp 0,22, chậm, góc hẹp | ●●● |
| **Cú Thiên Văn** (PR #11) | A.Sate | 1 | Cầu dẫn, vệ tinh trên đầu xe bắn laser vào điểm chạm, vật cản giữa đường hứng tia | Vệ tinh trên đầu, tia chéo | ●●● |
| | | 2 | Vệ tinh cao hơn, 3 tia | 3 tia cách 30 px | ●●● |
| | | SS | Vệ tinh tới ngay trên mục tiêu, **quét 5 tia** từ trái sang phải | 1 cột sáng to, đốt sâu | ●●○ (khác có chủ đích, giữ) |
| **Long Ngư Cơ** (ẩn) | Dragon | – | Cầu lửa nhẹ / 4 cầu lửa tỏa / quả cầu gọi 4 rồng con vây vào tâm | Có ảnh, **chưa có MobileDef** | – |
| **Kỳ Lân Sắt** (ẩn) | Knight | – | Kiếm trên trời bắn kiếm nhỏ (giống A.Sate) | Có ảnh, **chưa có MobileDef** | – |

### Chỗ lệch về chỉ số xe (không bắt buộc sửa)

- Ốc Thiết Giáp: gốc là xe giáp dày, máu ít, chậm; mình là "cân bằng, dễ chơi". **Giữ** vai trò của mình (xe dễ chơi cho người mới).
- Chũi Khoan: gốc giáp cao, chậm, leo dốc tốt; mình giáp thấp (0,05), nhanh, nhiều xăng. Đề xuất nhẹ: giáp lên ~0,12, xăng 140 → 115. Leo dốc riêng từng xe chưa có (`maxSlopeDeg` là chung), không làm.
- Diều Hâu Giấy đang mạnh nhất (64%); khi SS đổi sang "hoá vàng có điều kiện" thì sẽ tự giảm, chạy lại cân bằng rồi mới chỉnh số.

## 3. Cơ chế còn thiếu

**Đáng thêm** (thiếu hẳn, làm gameplay phong phú):
1. Delay tính theo thời gian suy nghĩ.
2. Đạn đổi theo thời gian bay (phình to / hoá vàng): thưởng cho bắn góc cao.
3. Xuyên mọi địa hình, chỉ nổ khi chạm xe.
4. Sét giáng từ trên trời (bị đất che), nhiều mục tiêu.
5. Khiên hồi mỗi vòng.
6. Hút / đẩy xe (kéo vào hố, đẩy rơi vực): kiểu "gậy ông đập lưng ông" mà game hiện chưa có cách nào khác ngoài khoét đất.

**Chưa đề xuất** (tốn công hoặc trùng): mìn nằm chờ qua lượt (cần thực thể sống qua lượt trong `MatchState` + giao thức), đạn bám xe gây sát thương liên tục, vệ tinh tích lũy sức mạnh, loại xe khắc nhau, tên lửa dẫn đường theo cầu dẫn. Ghi lại để quyết sau.

## 4. Kế hoạch sửa

Mỗi task: sửa → test cho behavior mới → `npm run typecheck` + `npm test` → `npm run balance` → cập nhật PROGRESS. Task có ⚠️ **đổi kiểu trong `shared/`** (thêm nhánh `Behavior`, trường `MobileDef`/`PlayerState`/`Tuning`, event mới), cần người dùng đồng ý trước theo CLAUDE.md.

### Đợt A – Nhịp lượt (ảnh hưởng mọi xe)
- **A1. Delay SS** (chỉ số): SS ≈ 2,8–3× đạn 1 (khoảng 300–330 thay vì ~230). Chỉ sửa `mobiles/*.ts`.
- **A2. Delay theo giây** ⚠️: `Tuning.turn.delayPerSecond` (gợi ý ~4/s, suy từ tỉ lệ gốc 10/s trên 250 → mình 110) cộng theo thời gian đã dùng trong lượt; tùy chọn `MobileDef.delayPerSecondMul` cho Rùa Thành chậm hơn. Bảng lượt hiện delay đang tăng. Sửa `tuning.ts`, `match.ts` (tick), `turnHud`.

### Đợt B – Behavior mới, dùng lại cho nhiều xe ⚠️
- **B1. `airGrow`** (sau `afterS` giây bay thì nhân bán kính/sát thương): Ốc Thiết Giáp SS "Đạn khổng lồ" (phình to), Diều Hâu Giấy SS "Đại bàng" (hoá vàng, nhân sát thương lớn hơn). Client đổi ảnh đạn khi qua mốc (event `grow`).
- **B2. `tandem`**: Ốc Thiết Giáp đạn 2 thành một đạn 2 tầng; trúng đủ 2 thì tầng 2 bỏ qua giáp. Thay `burst`.
- **B3. `ghost`**: Chũi Khoan SS bay xuyên mọi địa hình, để lại hầm nhỏ, chỉ nổ khi chạm xe hoặc ra khỏi bản đồ. Đạn 1 giữ khoan (bản sắc).
- **B4. `drill` hướng `resurface`**: Chũi Khoan đạn 2 khoan xuống rồi ngóc lên, nổ khi ra tới mặt đất.
- **B5. Sét thật**: `lightning` có `from: 'sky'` (tia từ mép trên xuống, chạm đất trước thì dừng) + `angles` (tia chéo). Bọ Lôi đạn 1 = cầu điện + 1 tia + bào giáp; đạn 2 = 2 tia chéo; SS = mọi xe trong bán kính bị một tia. Client dùng lại `storm-bolt.png`.
- **B6. `roller` thêm `turnAtWall` + `fuseS`**: Cua Lăn SS bò, gặp vách quay đầu, hết giờ tự nổ.
- **B7. `splitAfter`** (tách theo thời gian, không đợi đỉnh): Rùa Thành SS (xem câu hỏi 2).
- **B8. `twin`**: 2 viên xoắn quanh đường bay, va chạm riêng: Sứa Đèn đạn 2.
- Diều Hâu Giấy đạn 2: đổi `burst` 2 → `spread` 4 quả yếu (không cần behavior mới). Nhím Chùm đạn 2: `spread` 3 → 6 quả nhỏ (tùy chọn).

### Đợt C – Hệ thống ⚠️
- **C1. Khiên**: `MobileDef.shield` + `PlayerState.shield`, hồi đầu mỗi vòng; sát thương trừ khiên trước. Gán cho Sứa Đèn (giảm HP tương ứng). SS Sứa Đèn xoá khiên trong vùng rộng. Thanh máu thêm phần khiên; Snapshot thêm trường.
- **C2. Hai xe ẩn** (thiết kế riêng, không chép đạn gốc):
  - Long Ngư Cơ (lửa): đạn 1 cầu lửa nhẹ (`gravityFactor` thấp); đạn 2 4 cầu tỏa mạnh dần theo quãng bay (mạnh ở tầm gần); SS cầu đỏ gọi 4 "cá rồng con" từ nửa vòng tròn bơi vào tâm (`converge`).
  - Kỳ Lân Sắt: **không** làm kiếm trên trời (trùng Cú Thiên Văn). Cho cơ chế hút/đẩy: đạn 2 "Sừng từ" hút xe về tâm, SS "Húc trời" đẩy văng xe ra xa (có thể rơi vực). Cần `mobileMove` xử lý xe bị đẩy rồi rơi.
  - Cả 2 chỉ ra khi chọn Ngẫu nhiên (đã có trong plan Phase 6).

### Thứ tự đề xuất
A1 → A2 → B1 → B5 → B3/B4 → B2 → B6 → B8 → C1 → C2 → B7. Mỗi đợt một PR, chạy lại `npm run balance` cuối mỗi đợt.

## 5. Cần người dùng quyết

1. Đồng ý cho đổi kiểu trong `shared/` theo các task ⚠️ không (làm từng đợt)?
2. Rùa Thành SS: giữ "Núi đá" đắp đất, hay đổi thành quả tách 6 (B7) và để đắp đất chỉ ở đạn 2?
3. Bọ Lôi đạn 2: bỏ "Chùm ba" (tách ở đỉnh) để đổi sang 2 tia sét chéo?
4. Mìn nằm chờ qua lượt (Cua Lăn đạn 2): có muốn làm sau không (tốn công nhất)?
