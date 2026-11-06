# Tiến độ

Đánh dấu `[x]` khi task xong và đã qua tiêu chí nghiệm thu. Ghi chú ngắn nếu có quyết định quan trọng.

## Lên kế hoạch
- [x] Viết plan: 00-overview, 01-kha-thi, 02-phases, 03-assets, CLAUDE.md

## Phase 0 – Khung dự án
- [x] 0.1 Monorepo + scripts — workspaces shared/server/client (@gunb/*), vite + tsx watch, dev.mjs, typecheck + vitest pass; local Node 22 (nvmrc ghi 24)
- [x] 0.2 Hằng số, math, RNG, protocol rỗng — constants/branding/math (Vec2, mulberry32, hashSeed)/protocol (msgpack, MsgType.Hello)
- [x] 0.3 TerrainMask ⚠️ — mask.ts (fromAlpha, isSolid, carveCircle trả DirtyRect, hash FNV-1a), surface.ts (groundYBelow, slopeAt dương = dốc lên bên phải); 9 test
- [x] 0.4 Định dạng bản đồ + bản đồ thử + render tĩnh — map/types+parseMap, scripts/gen-test-map.mjs (PNG tự ghi bằng zlib, không thêm thư viện), client Pixi 8.6.6 + camera (chuột phải kéo / WASD) + F3; assets.test.ts kiểm tra CREDITS.json

## Phase 1 – Bắn offline ⚠️
- [x] 1.1 stepProjectile + va chạm mask — physics/projectile.ts (Euler bán ẩn, quét đoạn ≤1px); test tầm xa v²/g sai số <1%, không xuyên tấm 2px
- [x] 1.2 simulateShot + ShotResult — shot/simulateShot.ts (đạn `basic`, quỹ đạo [t,x,y], events explode/carve/damage/out, hash sau bắn); thông số trong tuning.ts + shots.ts; sanitizeFire; aim.ts, wind.ts
- [x] 1.3 Điều khiển ngắm + thanh lực — client/input.ts (↑↓ giữ để tăng tốc, ←→ quay hướng, Space tích lực), hud.ts (góc, lực + vạch lực lần trước, gió)
- [x] 1.4 Playback + camera theo đạn + hiệu ứng tạm — playback.ts, fx.ts (vòng nổ + rung), terrainView.ts (hố + viền cháy, lớp phủ mask F3), mũi tên khi đạn bay quá mép trên
- [x] 1.5 Gió + bia tập bắn + bảng chỉnh số F6 — practice.ts (xe + 3 bia, chọn chỗ đứng phẳng nhất), G/H/R, tuningPanel.ts (F6, Copy JSON); xe chưa rơi khi mất đất (Phase 2)

## Phase 2 – Xe + lượt (hotseat) ⚠️
- [x] 2.1 mobileMove — physics/mobileMove.ts (đi theo dốc ≤55°, dừng trước vách, nhiên liệu, rơi + sát thương, rơi khỏi đáy chết); thông số trong tuning.move; 7 test
- [x] 2.2 Xe hiển thị + nòng xoay — client/vehicleView.ts (thân nghiêng theo dốc, nòng, tên + thanh máu, mũi tên lượt, hình quạt dải góc); sprite thật để Phase 3+
- [x] 2.3 Trạng thái trận + reducer — match.ts (createMatch spawn có seed, ưu tiên chỗ ≤30°; applyAction aim/move/fire/skip/tick/endTurn; sửa trực tiếp state + mask, không I/O); 9 test
- [x] 2.4 Delay + thứ tự lượt + đồng hồ lượt — turn/delay.ts (hoà delay: lâu chưa đi hơn, rồi id), turnHud.ts (đồng hồ, nhiên liệu, danh sách lượt); hết giờ cộng delay phạt
- [x] 2.5 Hotseat 2v2 + kết thúc trận — menu 1v1..4v4 + Tập bắn, hotseatMode.ts, bảng kết quả + Ván mới; Esc về menu. Mask hiển thị và mask trận tách riêng, so hash để phát hiện lệch

## Phase 3 – 3 pháo đầu tiên + SS
- [x] 3.1 Hệ thống behavior cho đạn — shots.ts (Behavior: basic, burst, splitAtApex, drill [theo vận tốc/ngang/xuống], lightning + armorBreak), mobiles/*.ts (Ốc Thiết Giáp, Chũi Khoan, Bọ Lôi, thông số trong Tuning.mobiles), simulateShot nhiều viên đạn + vụ nổ trễ; mỗi behavior có test. `roller` để Phase 6
- [x] 3.2 Thanh SS — PlayerState.ss, cộng theo sát thương gây ra/nhận + mỗi lượt (tuning.ss), đầy mới bắn được đạn SS, dùng xong về 0; 5 test
- [x] 3.3 Chọn pháo + HUD đạn — selectScreen.ts (thẻ chỉ số + Ngẫu nhiên), shotBar.ts (1/2/3, delay, thanh SS), F6 chỉnh theo pháo/đạn, tập bắn đổi pháo bằng M
- [x] Sửa lỗi 1v1: người đến lượt tự chết lúc đang ngắm thì kết thúc lượt ngay (match.ts tick)

## Phase 4 – Online ⚠️
- [x] 4.1 Transport + phòng chờ — server/main.ts (http phục vụ client/dist + ws ở /ws; in địa chỉ LAN), lobby.ts (phòng, chọn đội/pháo/sẵn sàng, chủ phòng bắt đầu, chat), client/net.ts + onlineFlow.ts (nhập tên → sảnh → phòng chờ). Giao thức msgpack trong shared/protocol.ts
- [x] 4.2 Tải trước + màn chờ — client tải map.json/terrain/nền kèm %, mỗi người báo LoadProgress, server bắt đầu khi mọi người xong hoặc quá 45 s; server tự đọc mask từ terrain.png (server/png.ts + mapLoader.ts, không thêm thư viện)
- [x] 4.3 Đồng bộ lượt — server/matchRunner.ts giữ trận thật (tick 30 Hz, snapshot 15 Hz), client onlineMode.ts chỉ gửi Input/Fire và vẽ snapshot (làm mượt vị trí); không dự đoán phía client
- [x] 4.4 Phát bắn online + kiểm tra hash — server gửi Shot (không kèm mask), client phát lại và so hash; lệch thì NeedTerrain → server gửi địa hình nén RLE (shared/terrain/rle.ts)
- [x] 4.5 Rớt mạng + vào lại — token theo tab (sessionStorage), nối lại tự động; rớt mạng thì bỏ lượt của người đó, giữ chỗ 60 s rồi bị loại; vào lại nhận MatchStart + Terrain + Snapshot. Test: server/lobby.test.ts. Chạy thật: `npm run play`

- [x] Bản đồ phẳng "Đảo nổi" (assets/maps/dao-noi, sinh bởi gen-test-map.mjs) làm mặc định để test khoét đất; thu-nghiem giữ lại

## Phase 5 – Bot + hoàn thiện MVP
- [x] 5.1 Bot — shared/bot.ts: `planShot` (mô phỏng thật: quét góc, chia đôi lực, tinh chỉnh; 3 mức Dễ/Vừa/Khó với sai số cố ý) + `BotDriver` (ngắm dần, đi tới địch nếu không có phát nào trúng, rồi bắn). Khó trúng ~82%, ~58 ms/lần; test: trong dải góc, xác định, không sửa trận, <100 ms. `ShotInput.skipHash` để bot bỏ tính hash
- [x] 5.2 Bot vào phòng + chế độ offline — chủ phòng bấm "+ Máy" (chọn mức, đội) / ✕ để bỏ; menu "Chơi với máy" 1v1..4v4 (người đội Xanh, máy đội Đỏ), chạy hoàn toàn trên trình duyệt
- [x] 5.3 Bảng kết quả — shared/stats.ts (sát thương, hạ gục, số phát, vụ nổ sát địch nhất), client/results.ts; online: server gửi Stats khi hết trận, về phòng chờ giữ nguyên đội sau 8 s
- [ ] 5.4 Bản đồ đầu tiên "thật" — phần code đã xong: nền parallax (client/background.ts, dùng `backgrounds` của map.json, không có thì tự vẽ), âm thanh + nhạc nền tạo bằng code (client/audio.ts, nút 🔊 bật/tắt). CÒN: ảnh địa hình + nền + nhạc thật theo `plan/05-prompt-asset-map.md`, và đọc `music` từ map.json khi có file. Ảnh Dreamina đã có: assets/maps/dao-noi-ve (terrain + 3 lớp nền, chưa có nhạc, chưa đặt làm mặc định; đã đặt làm map mặc định trong client; nhạc music.ogg đã có nhưng client chưa phát)

## Phase 6 – Nội dung
- [x] 6.1 Thêm 5 pháo — Cua Lăn (roller), Diều Hâu Giấy (windFactor âm), Nhím Chùm (spread), Sứa Đèn (pierce), Rùa Thành (build, đắp đất: event `fill`, `TerrainMask.fillCircle`); mỗi hành vi có test (shots2.test.ts). Pháo ẩn Long Ngư Cơ / Kỳ Lân Sắt chưa làm
- [ ] 6.2 Thêm bản đồ — chưa làm (cần ảnh; có thể làm bản sinh bằng code)
- [x] 6.3 Thời tiết — shared/weather.ts: Cột lốc, Mây giông, Gương nước, Cổng đôi; suy ra từ seed+lượt (không cần đồng bộ thêm), chance trong `Tuning.weather`; client vẽ + chữ báo (weatherView.ts)
- [x] 6.4 Cân bằng — `npm run balance` (bot đấu bot, mọi cặp pháo), kết quả `plan/balance-report.md`; đã chỉnh 3 vòng

## Phase 7–9
Chưa tách task chi tiết; xem `02-phases.md`.
- [ ] Ảnh xe (plan/06-prompt-xe.md): client vẽ sprite nếu có `assets/mobiles/<id>/rig.json` (thân + nòng xoay theo góc, lật theo hướng, nghiêng theo dốc), không có thì vẫn vẽ hình khối. Đã có: oc-thiet-giap (ChatGPT, nòng vẽ sau bệ `barrelBehind`), bo-loi (ChatGPT, `reverse`: quay đít bắn bằng đuôi, cốc 20–45° so với thân), chui-khoan (ChatGPT, cả đầu + mũi khoan ngóc lên theo góc), cua-lan (ChatGPT, tay kìm cầm đá xoay quanh đĩa vai), dieu-hau-giay (ChatGPT, đầu chim + nỏ ngóc theo góc), nhim-chum (ChatGPT, quạt 5 ống xoay quanh đĩa), sua-den (ChatGPT, cần đèn lồng xoay quanh đĩa), rua-thanh (ChatGPT, máy bắn đá: ngắm chỉ xoay tia, bắn thì cần vung `catapult`), long-ngu-co và ky-lan-sat (ChatGPT, đầu xoay theo góc; chưa có MobileDef nên chưa vào trận). Phi công nam (`assets/pilots/nam/`, ChatGPT) ngồi vào ghế mọi xe theo `pilot` trong rig. Chưa: phi công nữ, chọn nhân vật, item – prompt ở `plan/08-prompt-nhan-vat.md`
- [x] Góc bắn = góc nòng so với phương ngang, không cộng độ dốc (`aimDir` trong simulateShot bỏ tilt). Thêm `aimRange` + `MobileDef.slopeAim`: Bọ Lôi 20–45° so với thân, đứng dốc quay đuôi lên thì nâng được cao hơn (server kẹp lại khi ngắm/di chuyển/bắn).
- [x] Sửa: vào trận chơi máy / 2 người 1 máy camera không về xe (setMode trong main.ts xoá điểm camera mà constructor HotseatMode vừa đặt); giờ chỉ xoá khi về menu.
- [x] Ảnh đạn: `assets/mobiles/<id>/shots.json` + shot-1..3.png (vẽ nằm ngang chĩa phải, xoay theo hướng bay; client/shotArt.ts). Tin Shot từ server có thêm `shooter` + `slot` (shared/protocol.ts) để client vẽ đúng ảnh đạn và cú vung máy bắn đá của người bắn. Đã có: oc-thiet-giap, chui-khoan, bo-loi, cua-lan, dieu-hau-giay, nhim-chum, sua-den, rua-thanh (đủ 8 xe). `upright: true` trong shots.json = không xoay theo đường bay, chỉ lật trái/phải (dùng cho Tường đất, Núi đá của Rùa Thành).
- [x] Sửa: vào trận online camera bay tới xe đi lượt đầu (có thể là đối thủ/bot); giờ lượt đầu camera về xe của mình trước.
- [x] Giao diện sảnh online (code) — client/ui/lobby.css + onlineFlow.ts vẽ lại: sảnh (danh sách phòng dạng thẻ có ảnh bản đồ, lọc Đang chờ, Vào nhanh, Làm mới), hộp thoại Tạo phòng (1v1..4v4, thời gian lượt, chọn bản đồ có ảnh), phòng chờ (2 cột đội, chỗ trống + Thêm máy, Sẵn sàng/Bắt đầu/Đổi đội/Rời phòng, chat), chọn xe (lưới ảnh xe + thẻ chỉ số + Ngẫu nhiên; nhớ xe lần trước), màn tải có ảnh xe. Ảnh xe ghép từ rig.json (ui/portrait.ts), danh sách bản đồ đọc assets/maps/*/map.json lúc build (ui/maps.ts). Không đổi giao thức. Ảnh trang trí (plan/10-prompt-ui-sanh.md) đã gắn đủ: nền sảnh, logo, bục xe, ô Ngẫu nhiên, huy hiệu 2 đội, 10 icon nút (assets/ui/)
