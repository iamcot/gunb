# 13 – Prompt ảnh hiệu ứng thời tiết trong trận

Thay phần hiệu ứng đang vẽ bằng code cho **Cột lốc**, **Gương nước** và **Mây giông**. Icon trên thanh HUD đã có (`assets/ui/hud/weather-*.png`), file này là ảnh **trong bản đồ**.

Công cụ: ChatGPT (tạo ảnh), làm trong cùng chat đã vẽ 4 icon thời tiết để hợp nét và màu.

Yêu cầu chung:
- **Nền trong suốt (transparent PNG).** Nếu công cụ không cho nền trong suốt thì dùng **nền xanh lá thuần #00FF00**, mình sẽ tự tách. Đừng dùng nền trắng: hiệu ứng có nhiều mảng trắng, mờ nên tách rất khó.
- Cột lốc và gương nước là **dải dọc lặp liền mạch trên–dưới**: game sẽ xếp chồng ảnh từ đỉnh tới đáy màn hình và cho trôi (lốc trôi lên, nước chảy xuống), nên mép trên và mép dưới phải nối khít với nhau.
- Không có chữ, khung viền, bóng đổ, cảnh nền.

## Đoạn phong cách chung (đã có trong mỗi prompt)
`Same art style, line weight and palette as the weather icons in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading.`

---

## 1. Cột lốc – `weather-whirl-strip.png` (dọc, khoảng 512×2048)
```
Same art style, line weight and palette as the weather icons in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading. A tall vertical strip of a magical updraft wind column for a 2D side-view game, seen from the side: spiraling ribbons of cream and mint-green wind wrapping around a soft glowing column, a few green and coral leaves caught in the spiral, small upward arrow-shaped wind streaks. Semi-transparent glowing center, the column fills the strip width evenly from top to bottom with no top or bottom end, seamlessly tileable vertically (top edge matches bottom edge). Transparent background, no ground, no sky, no text, no frame.
```

## 2. Gương nước – `weather-mirror-strip.png` (dọc, khoảng 512×2048)
```
Same art style, line weight and palette as the weather icons in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading. A tall vertical strip of a magical flowing water curtain for a 2D side-view game, seen from the side: translucent sky-blue water falling straight down with light wavy stripes, soft white highlight streaks, small bubbles, both left and right edges are gently rippling with a thin bright foam line and a thin golden rim. Semi-transparent so the scene behind shows through, fills the strip evenly from top to bottom with no top or bottom end, seamlessly tileable vertically (top edge matches bottom edge). Transparent background, no ground, no sky, no text, no frame.
```

## 3. Mây giông – `weather-storm-cloud.png` (ngang, khoảng 1024×512)
```
Same art style, line weight and palette as the weather icons in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading. A wide fluffy dark storm cloud for a 2D side-view game, about twice as wide as tall: slate blue-grey puffy cloud with a lighter blue-grey top and soft cream highlights, darker flat-ish underside, a few small glints of yellow light inside the cloud. No rain, no lightning, no ground. Transparent background, no text, no frame.
```

## 4. Tia sét – `weather-storm-bolt.png` (dọc, khoảng 256×1024)
```
Same art style, line weight and palette as the weather icons in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading. A single long zigzag lightning bolt pointing straight down, bright yellow with a white-hot core and orange edge, a couple of tiny side branches, the bolt fills the image height from top to bottom. Transparent background, no cloud, no rain, no text, no frame.
```

---

## Ráp vào game (Claude làm)
- Bỏ file vào `assets/ui/weather/` (hoặc gửi vào thread). Claude tách nền nếu cần, kiểm tra lặp dọc, ghi CREDITS.
- Cột lốc: xếp dọc ảnh phủ từ trên mép bản đồ tới đáy (camera nhìn được lên trên tới nửa màn hình), trôi lên; bề ngang co theo vùng ảnh hưởng.
- Gương nước: tương tự, nước chảy xuống.
- Mây giông: đặt đúng khung mây của vùng ảnh hưởng, nhấp nhô nhẹ; tia sét loé theo nhịp như hiện tại, mưa vẫn vẽ bằng code.
