# 01 – Phân tích tính khả thi làm trên web

## Kết luận ngắn

**Khả thi cao, và dễ hơn `fps-web` nhiều về mặt kỹ thuật.** Game theo lượt, 2D, ít đối tượng chuyển động cùng lúc, nên không có các bài toán khó nhất của fps-web (dự đoán chuyển động, nội suy, bù trễ khi bắn). Phần khó thật sự nằm ở **cảm giác bắn** (cân chỉnh số liệu) và **khối lượng hình ảnh/âm thanh** để game trông "có hồn", không nằm ở công nghệ.

Ước lượng thô (làm theo kiểu giao từng task cho Claude Code, mỗi tối vài task):

| Mốc | Nội dung | Thời gian ước tính |
|---|---|---|
| Prototype chơi được offline (hotseat 2 người) | Phase 0–2 | 1–2 tuần |
| MVP online LAN, 3 pháo, 1 map, bot | Phase 0–5 | 4–6 tuần |
| Bản "đầy đủ" (6–8 pháo, 4–5 map, sự kiện thời tiết, item, phòng chờ, cấp bậc, trang phục) | Phase 6–9 | thêm 2–3 tháng, chủ yếu là làm asset và cân bằng |

## Từng mảng kỹ thuật

### 1. Render 2D – Dễ

- Pixi.js v8 vẽ hàng nghìn sprite ở 60 fps trên máy yếu; một bản đồ 2400×1200 px + vài chục sprite + particle là quá nhẹ.
- Camera: pan theo đạn, kéo bằng chuột / phím, zoom nhẹ. Nền nhiều lớp (parallax) cho chiều sâu.
- Hiển thị tốt trên điện thoại được nếu muốn (Phase 9).

### 2. Địa hình phá hủy theo pixel – Trung bình (làm một lần là xong)

Cách làm đã được chứng minh (Worms, Liero, các bản clone artillery trên web):

- **Dữ liệu va chạm**: `TerrainMask` là `Uint8Array(w*h)`, 1 = đất, 0 = trống. Bản đồ 2400×1200 = 2,9 MB, chấp nhận được cả trên server. Có thể giảm 1/2 độ phân giải (mỗi ô 2×2 px) nếu cần.
- **Nguồn**: kênh alpha của ảnh `terrain.png` (alpha > 127 là đất). Không cần vẽ mask riêng.
- **Khoét hố**: `carveCircle(cx, cy, r)` số nguyên, chỉ duyệt ô vuông bao quanh, O(r²). Thêm biến thể "đào đường hầm" (khoét theo đoạn) và "đắp đất" (một số đạn thêm đất, mở rộng về sau).
- **Hiển thị**: texture địa hình nằm trên một canvas; mỗi lần nổ vẽ hình tròn với `globalCompositeOperation = 'destination-out'` rồi cập nhật texture (Pixi cho phép cập nhật lại source). Viền cháy xém quanh hố vẽ thêm một vòng màu tối mờ trước khi xoá → trông "đã" mà rẻ.
- **Va chạm đạn**: mỗi bước mô phỏng kiểm tra đoạn từ vị trí cũ → mới, bước nhỏ hơn 1 px (DDA), nên đạn nhanh không xuyên qua mảng đất mỏng.
- **Đồng bộ**: carve là số nguyên ⇒ mọi máy ra cùng mask. Mỗi lượt so `hash(mask)` (FNV-1a trên các hàng bị đổi) giữa server và client để phát hiện lệch.

### 3. Vật lý đạn + gió – Dễ về code, Khó về cân chỉnh

- Chất điểm + trọng lực + gió + (tuỳ đạn) lực cản. Tích phân Euler bán ẩn với bước cố định 1/120 s là đủ chính xác và ổn định.
- Các kiểu đạn đặc trưng của thể loại đều mô phỏng được bằng vài dòng: đạn tách đôi/tách ba khi lên đỉnh quỹ đạo, đạn lăn theo mặt đất, đạn khoan, đạn ngược gió (`windFactor < 0`), đạn có gió dọc, sét đánh thẳng xuống từ điểm nổ, đạn nảy...
- **Rủi ro**: "bắn có sướng tay không" phụ thuộc gần như hoàn toàn vào số liệu: tốc độ tối đa, trọng lực, ảnh hưởng gió, tốc độ thanh lực, bán kính hố, delay. Cần bảng chỉnh số liệu trực tiếp trong game (F6) + chế độ tập bắn vào bia như fps-web.
- Người chơi lâu năm tính "công thức" góc/lực/gió; muốn có chiều sâu đó thì vật lý phải **nhất quán và đoán được** – không thêm ngẫu nhiên vào quỹ đạo.

### 4. Xe di chuyển trên địa hình – Trung bình

- Xe là một "chân" ở giữa đáy + chiều rộng. Mỗi bước tìm mặt đất ở vài cột dưới thân, tính góc nghiêng từ 2 điểm tiếp đất trái/phải, leo được nếu dốc < `MAX_SLOPE_DEG`.
- Không có đất dưới chân → rơi (trọng lực), rơi khỏi đáy bản đồ → chết. Rơi xa → mất máu.
- Đây là chỗ hay bị bug "rung" / "kẹt" nhất; cần debug overlay vẽ điểm tiếp đất và test đơn vị.

### 5. Lượt chơi + delay – Dễ

- State thuần: mỗi người có `delay`. Sau hành động: `delay += baseDelay(shot) + moved * delayPerPx + itemDelay`. Lượt kế = người còn sống có `delay` nhỏ nhất; bằng nhau thì ai lâu chưa bắn hơn đi trước.
- Đồng hồ lượt chạy trên server; hết giờ ⇒ cộng delay phạt, chuyển lượt.
- Gió sinh từ RNG có seed của trận, đổi đầu mỗi lượt.
- Viết thành reducer thuần `applyAction(state, action)` nên test được hết bằng vitest.

### 6. Multiplayer realtime – Dễ hơn fps-web nhiều

- Mô hình **server quyết định**, client chỉ gửi ý định. Trong lượt của mình client gửi `move` (giữ phím → gửi trạng thái phím ~20 lần/s), `aim` (góc, để người khác thấy nòng xoay), `charge` (để người khác thấy thanh lực), `fire`.
- Di chuyển: server mô phỏng `mobileMove`, phát vị trí; client người đang đi có thể tự mô phỏng trước cho mượt (dùng chung code `shared/`), lệch thì kéo về. Vì chỉ một người di chuyển một lúc nên rất nhẹ.
- Phát bắn: server tính trọn rồi gửi kết quả (xem `00-overview.md`). Không có bài toán bù trễ.
- Phòng chờ, chọn đội, chọn pháo, sẵn sàng, chủ phòng bắt đầu, vào lại khi rớt mạng (giữ chỗ 60 s, bot tạm đánh thay hoặc bỏ lượt).
- Lưu lượng nhỏ: vài KB mỗi lượt. Một server Node nhỏ chạy được nhiều phòng.
- Chơi qua Internet: cần host server có địa chỉ công khai (VPS, Fly.io, Render, Railway…) hoặc dùng tunnel (Cloudflare Tunnel, Tailscale) khi chơi với bạn bè. LAN thì chạy như fps-web.

### 7. Bot AI – Dễ đến Trung bình

- Vì đã có `simulateShot` thuần, bot chỉ cần **tìm kiếm**: thử các cặp (góc, lực) trên lưới thô rồi tinh chỉnh quanh điểm tốt nhất, chấm điểm theo sát thương ước tính lên địch − lên đồng đội + bonus đục đất dưới chân địch.
- Độ khó = thêm sai số ngẫu nhiên vào góc/lực, giới hạn số lần thử. Chạy trong vài chục ms, trên server hoặc client (offline).

### 8. Âm thanh – Dễ về code

- Web Audio API, đã có kinh nghiệm ở fps-web. Nhạc nền lặp, hiệu ứng nổ/bắn/gió. Khó là **có** nhạc hay, xem `03-assets.md`.

### 9. Lưu tài khoản, cấp bậc, trang phục – Trung bình, để sau

- Bản nội bộ: lưu file JSON / SQLite trên server (`node:sqlite` có sẵn trong Node 24, không cần thêm thư viện).
- Trang phục cộng chỉ số là tính năng "meta"; nên làm **sau** khi gameplay đã vui, và có công tắc tắt cộng chỉ số trong phòng (đấu công bằng).

## Bảng độ khó tổng hợp

| Mảng | Độ khó kỹ thuật | Rủi ro chính |
|---|---|---|
| Render 2D, camera, HUD | ★☆☆ | – |
| Địa hình pixel phá hủy | ★★☆ | hiệu năng cập nhật texture nếu bản đồ quá lớn → cập nhật vùng con |
| Vật lý đạn + gió | ★☆☆ code / ★★★ cân chỉnh | cảm giác bắn |
| Xe đi trên dốc, rơi | ★★☆ | kẹt, rung, xuyên đất |
| Lượt + delay | ★☆☆ | – |
| Mạng (theo lượt) | ★★☆ | rớt mạng giữa lượt, vào lại |
| Bot | ★★☆ | bot quá giỏi / quá ngu |
| Asset (hình, nhạc) | ★★★ | khối lượng lớn, license |
| Cân bằng nhiều pháo | ★★★ | cần chơi thử nhiều |

## Những điều nên quyết sớm

1. **Tên game, tên đội, phong cách mỹ thuật** (gợi ý: hoạt hình 2D vẽ tay sáng màu, xe là sinh vật/máy móc kỳ quặc). Quyết sớm để mọi asset đi cùng một phong cách.
2. **Phạm vi chơi**: chỉ nội bộ bạn bè (LAN/tunnel) hay công khai? Nếu công khai thì cần tài khoản, chống gian lận, và **bắt buộc** asset có license rõ ràng.
3. **Nền tảng**: chỉ máy tính, hay cả điện thoại (cần điều khiển cảm ứng: kéo để chỉnh góc, giữ nút để tích lực)?
4. **Trang phục cộng chỉ số**: có hay không, và có cho tắt trong phòng không.

## Học được gì từ 2 repo tham khảo

- **fps-web**: dùng lại nguyên mô hình làm việc (CLAUDE.md + plan theo phase + PROGRESS.md + mẫu báo cáo), monorepo `shared/server/client`, msgpack + ws, debug overlay F3, bảng chỉnh số F6, `assets/CREDITS.json` ghi nguồn từng file, script đóng gói file chạy cho Windows/Mac (task 18) để bạn bè chạy server không cần cài Node.
- **lmht-web**: học cách tải trước tài nguyên + màn chờ có % theo từng người, server chỉ bắt đầu khi mọi người `ready`, đường dẫn tài nguyên tương đối để chơi LAN bằng IP. **Không** học cách lấy asset: repo đó trích xuất tài nguyên gốc của game thương mại; với dự án này không làm như vậy (xem `03-assets.md`).
