# CLAUDE.md – Luật làm việc cho dự án game bắn tọa độ (gunb)

File này đặt ở gốc repo. Claude Code đọc nó mỗi phiên. **Tuân thủ tuyệt đối.**

## Trước khi code
1. Đọc `plan/00-overview.md` và file phase đang được giao (ví dụ `plan/02-phases.md`).
2. Đọc `plan/PROGRESS.md` để biết task nào đã xong.
3. Nếu yêu cầu mơ hồ hoặc mâu thuẫn với plan: **dừng lại và hỏi**, không tự đoán.

## Phạm vi
- Chỉ làm **đúng task được giao**. Không làm trước task sau, không "tiện tay" refactor chỗ khác.
- Không viết lại cả file khi chỉ cần sửa vài dòng.
- Không đổi interface/kiểu dữ liệu trong `shared/` nếu task không yêu cầu. Nếu thấy cần đổi: dừng, giải thích lý do, chờ đồng ý.
- Không thêm thư viện ngoài danh sách trong `00-overview.md`. Cần thêm thì hỏi trước.
- Không xoá code debug/overlay đã có.

## Quy ước bắt buộc
- Toạ độ = pixel bản đồ, gốc trên trái, **trục Y hướng xuống**. Thời gian tính bằng giây.
- Góc bắn là độ nguyên 0–90 + `facing = 1 | -1`; chỉ đổi sang radian trong `aimDir()`.
- Server quyết định kết quả phát bắn (`simulateShot` trong `shared/`), client chỉ phát lại `ShotResult`.
- RNG luôn có seed (`mulberry32`), không dùng `Math.random()` trong `shared/`.
- Mọi thông số gameplay (tốc độ, damage, thời gian...) nằm trong file config của `shared/`, **không hardcode** trong logic.
- Code chạy ở cả client và server đặt trong `shared/`, không import Pixi hay DOM trong `shared/`.
- Không cấp phát object mới (`{x, y}` mới, mảng tạm) trong vòng lặp mỗi frame/tick; dùng biến tạm tái sử dụng.

## Asset
- Mọi file trong `assets/` phải có mục trong `assets/CREDITS.json` với license hợp lệ (xem `plan/03-assets.md`).
- Không dùng tên, hình, nhạc, bản đồ của GunBound hay game thương mại khác. Game này là thiết kế riêng.

## Khi sửa bug
1. Mô tả **nguyên nhân giả định** và **cách xác minh** (log, debug overlay, test) trước khi sửa.
2. Xác minh rồi mới sửa. Sửa **một nguyên nhân mỗi lần**.
3. Nếu sửa 2 lần chưa xong: dừng, tóm tắt những gì đã thử, đề xuất hướng khác. Không sửa vòng vòng.
4. Không "sửa" bằng cách tăng/giảm hằng số ngẫu nhiên cho tới khi có vẻ chạy.

## Sau mỗi task
1. Chạy `npm run typecheck` và `npm test`, phải pass.
2. Cập nhật `plan/PROGRESS.md` (đánh dấu task, ghi chú ngắn).
3. Báo cáo theo mẫu:
   - **Đã làm:** ...
   - **File thay đổi:** ...
   - **Cách test tay:** các bước cụ thể để người dùng tự kiểm tra
   - **Chưa chắc / cần người dùng quyết:** ...
