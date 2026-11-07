# Prompt vẽ ảnh HUD trong trận (tùy chọn)

HUD trong trận (bảng điều khiển dưới, bảng lượt, báo thời tiết) và hiệu ứng thời tiết **đã chạy bằng code** (CSS + Pixi, bảng màu của game). Ảnh dưới đây chỉ thay icon vẽ sẵn cho đẹp hơn; thiếu ảnh nào thì code vẫn dùng icon SVG.

**Dùng ChatGPT (tạo ảnh), trong cùng chat đã vẽ các xe và giao diện sảnh** để giữ đúng nét. Không vẽ chữ vào ảnh. Không bê icon thời tiết của game khác.

## Đuôi style (đã có ở cuối mỗi prompt)
`Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59.`

## Negative prompt (dùng chung)
```
text, letters, numbers, watermark, logo of other games, 3d render, pixel art, photorealistic, glossy plastic UI, sci-fi neon, dark theme, cluttered details, drop shadow on background
```

## Sau khi có ảnh
Đặt vào `assets/ui/hud/` đúng tên file, thêm mục vào `assets/CREDITS.json` (nguồn: ChatGPT, license như các ảnh khác). Nền trắng thì mình tự xoá nền. Code tự nhận ảnh khi có file (`client/src/weatherView.ts`), không cần sửa gì thêm.

---

## 1. Icon 4 sự kiện thời tiết – `assets/ui/hud/weather-<kind>.png` (512×512, hiển thị 26 px)
Nằm trong ô tròn trên chữ báo thời tiết. Hình phải đọc được khi rất nhỏ: một khối chính, viền dày, ít chi tiết.

**1a. Cột lốc – `weather-whirl.png`**
```
Same art style, line weight and palette as the vehicle images in this chat. Single game icon, no text: a small cheerful green-and-white whirlwind funnel spinning upward, two tiny leaves caught in it, a small upward arrow-like swirl at the top. Bold simple silhouette readable at 26 pixels, centered, flat front view. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background.
```
**1b. Mây giông – `weather-storm.png`**
```
Same art style, line weight and palette as the vehicle images in this chat. Single game icon, no text: a chubby dark grey-blue thundercloud with a bright yellow zigzag lightning bolt coming out of the bottom and three short rain streaks. Bold simple silhouette readable at 26 pixels, centered, flat front view. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background.
```
**1c. Gương nước – `weather-mirror.png`**
```
Same art style, line weight and palette as the vehicle images in this chat. Single game icon, no text: a tall oval sheet of clear blue water like a magic mirror with gentle wavy surface lines, a small white curved arrow and a small coral curved arrow circling it in opposite directions to show reversal. Bold simple silhouette readable at 26 pixels, centered, flat front view. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background.
```
**1d. Cổng đôi – `weather-portal.png`**
```
Same art style, line weight and palette as the vehicle images in this chat. Single game icon, no text: two small round swirling magic portals side by side, the left one orange, the right one soft purple, linked by a short dotted arc. Bold simple silhouette readable at 26 pixels, centered, flat front view. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background.
```

**1e. Trời quang – `weather-clear.png`** (lượt không có thời tiết, hiện trên thanh trên; làm trong cùng chat đã vẽ 4 icon kia)
```
Same art style, line weight and palette as the four weather icons in this chat. Single game icon, no text: a small round warm yellow sun with no face with short chunky rays and one tiny soft white cloud peeking at the bottom right, calm clear-sky feeling. Bold simple silhouette readable at 26 pixels, centered, flat front view. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Transparent background (or pure green #00FF00 if transparency is not possible).
```
