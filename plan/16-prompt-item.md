# Prompt vẽ icon item (tùy chọn)

Hệ thống item **đã chạy bằng code**; thiếu ảnh thì ô item hiện ký hiệu chữ (×2, ✚, 🌀, 🍃, ⏩). Ảnh dưới đây chỉ để đẹp hơn.

**Dùng ChatGPT (tạo ảnh), trong cùng chat đã vẽ các xe và HUD** để giữ đúng nét. Không vẽ chữ vào ảnh. Không bê icon item của game khác.

## Sau khi có ảnh
Đặt vào `assets/ui/items/<id>.png` (512×512, nền trong hoặc trắng — nền trắng thì mình tự xoá), thêm mục vào `assets/CREDITS.json`. Code tự nhận (`client/src/ui/items.ts`), hiển thị 26–30 px trên ô F1–F3 và trong phòng chờ.

## Đuôi style (thêm vào cuối mỗi prompt)
`Bold simple silhouette readable at 28 pixels, centered, flat front view. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background.`

## Negative prompt (dùng chung)
```
text, letters, numbers, watermark, logo of other games, 3d render, pixel art, photorealistic, glossy plastic UI, sci-fi neon, dark theme, cluttered details
```

| File | Item | Prompt (ghép thêm đuôi style) |
|---|---|---|
| `dual.png` | Bắn 2 lần | `Same art style, line weight and palette as the vehicle images in this chat. Single game icon, no text: two identical small round cannonballs flying side by side to the right with short coral speed streaks behind them.` |
| `heal.png` | Hồi máu | `Same art style, line weight and palette as the vehicle images in this chat. Single game icon, no text: a small round cream-colored medicine flask with a cork, filled with glowing green liquid, a tiny leaf tied to its neck.` |
| `teleport.png` | Dịch chuyển | `Same art style, line weight and palette as the vehicle images in this chat. Single game icon, no text: a small sky-blue glowing orb with a soft spiral swirl inside and three tiny sparkles around it.` |
| `windShield.png` | Lá chắn gió | `Same art style, line weight and palette as the vehicle images in this chat. Single game icon, no text: a small round wooden shield with a green leaf emblem, two short wind streaks bending around its edges.` |
| `fastTurn.png` | Đổi lượt nhanh | `Same art style, line weight and palette as the vehicle images in this chat. Single game icon, no text: a small cream pocket hourglass tilted forward with two coral forward-arrow chevrons beside it.` |
