# 02 – Kế hoạch theo giai đoạn

Mỗi task: **Làm gì**, **Nghiệm thu** (điều kiện xong), **Test tay**. Khi một phase quá dài, tách ra file riêng `plan/NN-phaseX-*.md` giống fps-web.

Tổng quan:

| Phase | Tên | Kết quả |
|---|---|---|
| 0 | Khung dự án | Monorepo chạy, bản đồ hiện lên, kéo camera được |
| 1 | Bắn offline ⚠️ | 1 pháo đứng yên bắn được: góc, lực, gió, hố, máu |
| 2 | Xe + lượt (hotseat) ⚠️ | 2–4 người chơi chung một máy, đi trên dốc, rơi vực, delay |
| 3 | 3 pháo đầu tiên + SS | Mỗi pháo 3 loại đạn khác biệt |
| 4 | Online ⚠️ | Phòng chờ, chơi qua LAN, vào lại khi rớt mạng |
| 5 | Bot + hoàn thiện MVP | Đấu bot offline/online, bảng kết quả, ván mới |
| — | **MVP xong** | |
| 6 | Nội dung | Thêm pháo, thêm bản đồ, sự kiện thời tiết |
| 7 | Item + chiến thuật | Item dùng trong trận (bắn đôi, dịch chuyển, hồi máu...) |
| 8 | Meta | Tài khoản, cấp bậc bằng biểu tượng, trang phục, cửa hàng xu ảo |
| 9 | Đánh bóng + phát hành | Âm thanh, hiệu ứng, cảm ứng điện thoại, đóng gói, deploy |

---

## Phase 0 – Khung dự án

### 0.1 Monorepo + scripts
- **Làm:** npm workspaces `shared/server/client`, TypeScript strict, Vite cho client, `tsx watch` cho server, `npm run dev` chạy cả hai (học `fps-web/dev.mjs`), `typecheck`, `test` (vitest). `.nvmrc` Node 24.
- **Nghiệm thu:** `npm run dev` mở trang trắng có chữ tên game; `npm run typecheck` và `npm test` pass (1 test mẫu).

### 0.2 Hằng số, math, RNG, protocol rỗng
- **Làm:** `constants.ts`, `branding.ts`, `math.ts` (Vec2 dạng `{x,y}` + hàm thao tác vào biến có sẵn, `clamp`, `mulberry32`, `hashSeed`), `protocol.ts` (msgpack, enum `MsgType`).
- **Nghiệm thu:** test RNG cùng seed ra cùng dãy.

### 0.3 TerrainMask ⚠️ (nền của mọi thứ)
- **Làm:** `terrain/mask.ts`: tạo từ alpha ảnh (`fromAlpha(width, height, Uint8Array rgba)`), `isSolid(x,y)` (ngoài biên trái/phải/trên = trống, dưới đáy = trống → rơi chết), `carveCircle(cx,cy,r)` trả về hình chữ nhật bị đổi, `hash()`. `terrain/surface.ts`: `groundYBelow(x, yFrom)`, `slopeAt(x, halfWidth)`.
- **Nghiệm thu:** test: carve giữa khối đặc tạo đúng số ô trống ≈ πr² (sai số nhỏ); carve 2 lần trên 2 mask giống nhau cho hash bằng nhau; carve sát biên không lỗi.

### 0.4 Định dạng bản đồ + bản đồ thử + render tĩnh
- **Làm:** `assets/maps/thu-nghiem/map.json` (`width, height, terrain: "terrain.png", backgrounds[], spawnZones: {A:[x1,x2], B:[x1,x2]}, music`). Ảnh địa hình **sinh bằng script** (`scripts/gen-test-map.mjs`, noise 1D → đồi núi + vài hang, tô 2 màu) để chưa cần họa sĩ. Client: Pixi app, nền gradient, texture địa hình, camera kéo bằng chuột phải / phím WASD, giới hạn trong bản đồ.
- **Nghiệm thu:** mở trang thấy bản đồ; kéo camera mượt 60 fps.
- **Test tay:** kéo camera hết 4 phía, không thấy khoảng đen ngoài bản đồ (trừ phía trên là bầu trời).

---

## Phase 1 – Bắn offline ⚠️

### 1.1 stepProjectile + va chạm mask
- **Làm:** `physics/projectile.ts`: state `{x,y,vx,vy,t,alive}`, `step(state, accel, dt, mask)` kiểm tra đoạn cũ→mới bằng bước ≤ 1 px; trả về điểm va chạm. Ra ngoài biên trái/phải/đáy ⇒ kết thúc (không nổ). Bay quá cao vẫn tiếp tục (hiện mũi tên chỉ vị trí ở mép trên màn hình – làm ở 1.4).
- **Nghiệm thu:** test: không gió, bắn 45° trên mặt phẳng → tầm xa khớp công thức `v²/g` sai số < 1%; đạn rất nhanh không xuyên tấm đất dày 2 px.

### 1.2 simulateShot + ShotResult
- **Làm:** `shot/simulateShot.ts` theo đúng mô tả ở `00-overview.md`: nhận state trận (mask, danh sách xe, gió) + lệnh bắn, chạy hết, áp hố vào **một bản sao** mask, tính sát thương theo khoảng cách tới tâm nổ (giảm tuyến tính tới 0 ở mép bán kính), giáp giảm sát thương. Kiểu đạn đầu tiên: `basic` (1 đạn, nổ khi chạm).
- **Nghiệm thu:** test: cùng input 2 lần ⇒ ShotResult giống hệt; nổ ngay cạnh xe ⇒ trúng gần tối đa; xa hơn bán kính ⇒ 0.

### 1.3 Điều khiển ngắm + thanh lực
- **Làm:** `input.ts`: ↑↓ chỉnh góc (giữ phím tăng nhanh dần, mỗi lần bấm 1°), ←→ đổi hướng, giữ Space tích lực (0→100 trong `POWER_CHARGE_S` = 2 s, chạm 100 dừng lại), nhả để bắn. HUD HTML: thước lực có **vạch lực lần bắn trước** (người chơi dòng game này rất cần), góc hiện số, gió hiện mũi tên + số.
- **Nghiệm thu:** bắn được vào bản đồ thử; vạch lực lần trước hiện đúng.

### 1.4 Playback + camera theo đạn + hiệu ứng tạm
- **Làm:** client phát lại ShotResult theo thời gian; camera đi theo đạn rồi về xe; đạn ra khỏi mép trên ⇒ mũi tên chỉ vị trí x; nổ: vòng tròn mở rộng + rung nhẹ màn hình; khoét texture (`destination-out`) + viền cháy.
- **Nghiệm thu:** hố trên hình khớp đúng mask (bật overlay F3 vẽ mask để so).

### 1.5 Gió + bia tập bắn + bảng chỉnh số F6
- **Làm:** `wind.ts` sinh gió từ RNG (phím G đổi gió ở chế độ tập); 3 bia đứng yên ở các khoảng cách; bảng F6 chỉnh `GRAVITY`, `WIND_SCALE`, `maxSpeed`, `POWER_CHARGE_S`, bán kính nổ, có nút "Copy JSON" (như fps-web). F3: fps, góc, lực, gió, vị trí chuột trên bản đồ, khoảng cách tới bia.
- **Nghiệm thu:** chỉnh số trong F6 có tác dụng ngay ở phát bắn tiếp theo.
- **Test tay:** bắn trúng 3 bia ở gió 0; đổi gió lớn, quan sát đạn lệch đúng hướng mũi tên.

---

## Phase 2 – Xe + lượt (hotseat) ⚠️

### 2.1 mobileMove
- **Làm:** `physics/mobileMove.ts`: xe có `x, y, facing, tilt, fuel, vy, onGround`. Đi trái/phải theo bề mặt, leo dốc < `MAX_SLOPE_DEG`, hết nhiên liệu thì dừng, không có đất ⇒ rơi; chạm đất sau khi rơi ⇒ trừ máu theo độ cao; rơi khỏi đáy ⇒ chết.
- **Nghiệm thu:** test: đi trên mặt phẳng tốn đúng nhiên liệu; gặp vách 80° thì dừng; carve dưới chân ⇒ rơi xuống đáy hố.
- **Test tay:** F3 hiện 2 điểm tiếp đất + góc nghiêng; đi qua đồi không rung, không kẹt.

### 2.2 Xe hiển thị + nòng xoay
- **Làm:** sprite placeholder (thân hình khối + nòng là thanh), thân nghiêng theo `tilt`, nòng xoay theo góc; thanh máu nhỏ + tên trên đầu; dải góc hợp lệ của pháo vẽ thành hình quạt mờ khi đang ngắm.

### 2.3 Trạng thái trận + reducer
- **Làm:** `match.ts`: `MatchState` (players, teams, mask hash, wind, turn, turnEndsAt, seed), `applyAction(state, action)` cho `move/aim/fire/skip/timeout`. Hàm thuần, server và offline dùng chung.
- **Nghiệm thu:** test chuỗi hành động ⇒ state cuối đúng.

### 2.4 Delay + thứ tự lượt + đồng hồ lượt
- **Làm:** `turn/delay.ts` đúng như `01-kha-thi.md` mục 5. HUD: danh sách thứ tự lượt sắp tới (avatar + delay), đồng hồ đếm ngược, cảnh báo 5 giây cuối.
- **Nghiệm thu:** test: người dùng đạn delay lớn bị đẩy lượt về sau; hoà delay xử lý đúng; người chết bị bỏ qua.

### 2.5 Hotseat 2v2 + kết thúc trận
- **Làm:** màn hình chọn số người, đội, vị trí xuất phát ngẫu nhiên trong vùng xuất phát (có seed, không chồng lên nhau); điều kiện thắng; bảng kết quả đơn giản; nút "Ván mới".
- **Test tay:** 4 người chơi chung bàn phím một ván trọn vẹn.

---

## Phase 3 – 3 pháo đầu tiên + đạn SS

Thông số từng pháo trong `shared/src/mobiles/<id>.ts`: `hp, armor, width, height, angleMin, angleMax, moveSpeed, fuel, shots: {1, 2, ss}`. Mỗi đạn: `maxSpeed, windFactor, gravityFactor, radius, damage, carveRadius, delay, behavior`. **Tên và thiết kế là của mình**, gợi ý (đổi thoải mái):

| Id (tên tạm) | Vai trò | Đạn 1 | Đạn 2 | SS |
|---|---|---|---|---|
| `oc-sen` Ốc Sên Thép | cân bằng, dễ chơi | 1 quả nổ vừa | 2 quả bắn liền nhau | quả lớn khoét hố sâu |
| `chuot-chui` Chuột Chũi Khoan | phá địa hình | đạn khoan xuyên đất 1 đoạn rồi nổ | đạn đào rãnh ngang | mũi khoan lớn đục thẳng xuống |
| `bo-dien` Bọ Cánh Cứng Điện | bào giáp | đạn điện giảm giáp mục tiêu 2 lượt | đạn tách 3 khi tới đỉnh quỹ đạo | sét giáng thẳng xuống từ điểm nổ |

### 3.1 Hệ thống "behavior" cho đạn
- **Làm:** `shot/behaviors/*.ts`: `basic`, `burst` (n quả cách nhau Δt), `splitAtApex(n, spreadDeg)`, `drill(len)`, `roller` (lăn theo mặt đất – để Phase 6), `lightning` (tia dọc từ điểm nổ), `armorBreak(turns)`. Mỗi behavior là hàm thuần thêm event vào ShotResult.
- **Nghiệm thu:** mỗi behavior có ít nhất 1 test.

### 3.2 Thanh SS
- **Làm:** tích theo sát thương gây ra + nhận vào (hệ số trong config), đầy thì được chọn SS một lần, dùng xong về 0.

### 3.3 Chọn pháo + HUD đạn
- **Làm:** màn hình chọn pháo (ảnh tạm, chỉ số dạng thanh), HUD 3 nút đạn (phím 1/2/3 hoặc Q/W/E), hiện delay của từng đạn.
- **Test tay:** chơi hotseat 3 pháo khác nhau, cảm nhận rõ sự khác biệt.

---

## Phase 4 – Online ⚠️

### 4.1 Transport + phòng chờ
- **Làm:** server `ws` phục vụ luôn trang game (như lmht-web, đường dẫn tương đối, in địa chỉ LAN khi khởi động). Lobby: danh sách phòng, tạo phòng (tên, số người tối đa, bản đồ, thời gian lượt), vào phòng. Trong phòng: chọn đội, chọn pháo, sẵn sàng, chủ phòng bấm bắt đầu, chat.
- **Nghiệm thu:** 2 tab vào cùng phòng thấy nhau đổi đội/đổi pháo realtime.

### 4.2 Tải trước + màn chờ
- **Làm:** như lmht-web: `assets.json` theo bản đồ/pháo, tải song song, % từng người; server chỉ bắt đầu khi tất cả `ready` (hoặc quá 45 s).

### 4.3 Đồng bộ lượt
- **Làm:** server chạy `MatchState` + đồng hồ lượt. Client gửi `move` (trạng thái phím), `aim`, `charge`, `fire`; server kiểm tra đúng người đúng lượt, kẹp giá trị, phát cho phòng. Người khác thấy xe di chuyển (nội suy 100 ms), nòng xoay, thanh lực đang tích.
- **Nghiệm thu:** 2 máy trong LAN chơi trọn 1 ván 1v1.

### 4.4 Phát bắn online + kiểm tra hash
- **Làm:** server `simulateShot` → gửi ShotResult; client playback; so `terrainHashAfter`, lệch thì xin `terrainSnapshot` (nén theo dải chạy RLE).
- **Nghiệm thu:** 30 lượt liên tiếp không lệch hash (ghi log). Thử chèn lỗi cố ý ở client để thấy cơ chế tự sửa chạy.

### 4.5 Rớt mạng + vào lại
- **Làm:** giữ chỗ 60 s; tới lượt người đang rớt thì bỏ lượt (cộng delay); vào lại nhận snapshot đầy đủ (state + mask).
- **Test tay:** tắt tab giữa trận, mở lại trong 60 s, tiếp tục chơi được.

---

## Phase 5 – Bot + hoàn thiện MVP

### 5.1 Bot ⚠️
- **Làm:** `server/src/bots/` (code tìm kiếm đặt ở `shared/` để offline dùng được): tìm góc/lực như `01-kha-thi.md` mục 7; 3 mức Dễ/Vừa/Khó; bot biết di chuyển ra khỏi hố sâu. Benchmark: bot Khó trúng ≥ 70% ở gió ngẫu nhiên.
- **Nghiệm thu:** test bot không bao giờ chọn góc ngoài dải; thời gian suy nghĩ < 100 ms.

### 5.2 Thêm bot vào phòng + chế độ offline
- **Làm:** chủ phòng thêm bot vào ô trống; menu chính có "Chơi với máy" chạy hoàn toàn trên trình duyệt.

### 5.3 Kết thúc trận + bảng điểm
- **Làm:** bảng kết quả: sát thương gây ra, số mạng hạ, phát bắn chính xác nhất; quay về phòng chờ giữ nguyên đội.

### 5.4 Bản đồ đầu tiên "thật"
- **Làm:** 1 bản đồ có ảnh địa hình vẽ tay/AI (theo `03-assets.md`), nền parallax 2–3 lớp, nhạc nền.
- **MVP xong** khi đạt "Định nghĩa xong" trong `00-overview.md`.

---

## Phase 6 – Nội dung

- 6.1 Thêm pháo (mỗi pháo 1 task): gợi ý ý tưởng gốc: **Cua Lăn** (đạn lăn theo địa hình), **Diều Giấy** (đạn chịu gió ngược, gió càng mạnh càng bay xa), **Nhím Chùm** (đạn tỏa 5 hướng), **Sứa Bóng Đèn** (đạn bay chậm, xuyên đất mỏng), **Rùa Pháo Đài** (máu trâu, dải góc hẹp, đạn đắp đất làm tường), và 1–2 **pháo ẩn** mở khoá ngẫu nhiên khi chọn "Ngẫu nhiên".
- 6.2 Thêm bản đồ (mỗi bản đồ 1 task): mỗi bản đồ có 1 đặc điểm: hang ngầm nhiều tầng, cầu treo mỏng dễ gãy, đảo nổi giữa trời, đáy là dung nham/nước...; có biến thể "A/B" (lật ngang, đổi vùng xuất phát).
- 6.3 Sự kiện thời tiết (mỗi lượt có xác suất xuất hiện ở một cột x ngẫu nhiên, đạn đi qua thì bị ảnh hưởng): **Cột lốc** (đẩy đạn lên), **Mây giông** (đạn đi qua phóng thêm sét), **Gương nước** (đổi hướng gió của đạn), **Cổng đôi** (đạn vào cổng này ra cổng kia). Đều là thiết kế của mình.
- 6.4 Bảng chỉnh cân bằng: chạy bot đấu bot hàng nghìn ván (script `npm run balance`) xuất tỷ lệ thắng theo pháo.

## Phase 7 – Item + chiến thuật

- Trước trận chọn tối đa 3 item (ô giới hạn). Gợi ý: Bắn 2 lần (delay cao), Hồi máu nhỏ, Dịch chuyển (bắn quả dịch chuyển, chỗ rơi là chỗ đứng mới), Lá chắn gió (lượt này gió = 0 cho mình), Đổi lượt nhanh (giảm delay).
- Mỗi item một task, ghi rõ delay trong config.

## Phase 8 – Meta (để sau cùng, chỉ khi gameplay đã vui)

- 8.1 Tài khoản đơn giản (tên + mật khẩu băm, `node:sqlite`), lưu thắng/thua.
- 8.2 **Cấp bậc bằng biểu tượng** theo điểm kinh nghiệm: tự thiết kế dãy biểu tượng riêng (ví dụ: Hạt Giống → Mầm → Lá → Cành → Cây → Rừng → Núi → Mây → Sao), không dùng bộ biểu tượng của game cũ.
- 8.3 Trang phục (mũ, áo, cánh, phụ kiện) hiển thị trên avatar, có thể cộng chỉ số nhỏ (HP, giáp, sát thương, sức đào). Phòng có công tắc "Đấu công bằng" tắt cộng chỉ số.
- 8.4 Cửa hàng dùng **xu trong game** kiếm được từ trận đấu. Không làm thanh toán tiền thật (nếu muốn làm thì là dự án pháp lý riêng).

## Phase 9 – Đánh bóng + phát hành

- 9.1 Âm thanh đầy đủ: nhạc sảnh chờ, nhạc từng bản đồ, hiệu ứng bắn/nổ/rơi/lượt mới/gió lớn, giọng thông báo ngắn ("Lượt của bạn!", "Bắn trúng!").
- 9.2 Hiệu ứng: khói, mảnh đất văng, chữ sát thương bật lên, chữ khen khi bắn góc cao trúng đích, quay chậm phát cuối hạ người chơi cuối cùng.
- 9.3 Điều khiển cảm ứng cho điện thoại.
- 9.4 Đóng gói file chạy server cho Windows/Mac (tái dùng `fps-web/plan/18-packaging.md`) và hướng dẫn deploy lên VPS / dịch vụ cloud.
