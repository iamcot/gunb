# Prompt vẽ ảnh giao diện sảnh chờ / phòng chờ

Giao diện sảnh (danh sách phòng, tạo phòng, phòng chờ, chọn xe, màn tải) **đã chạy bằng code** (CSS, bảng màu của game, ảnh xe lấy từ `assets/mobiles`). Ảnh dưới đây chỉ để thay phần trang trí cho đẹp hơn; thiếu ảnh nào thì giao diện vẫn dùng bản vẽ bằng code.

Phạm vi hiện tại: chỉ sảnh + phòng + chọn xe. **Chưa** cần item, đồ thời trang, cấp bậc, cửa hàng.

**Dùng ChatGPT (tạo ảnh), trong cùng chat đã vẽ các xe và nhân vật** để giữ đúng nét. Nếu tạo ở chat mới thì đính kèm 1–2 ảnh xe (Bọ Lôi, Ốc Thiết Giáp) làm mẫu.

Học bố cục từ game cũ, nhưng **không** bê khung, icon, linh vật, tên chế độ hay chữ của game gốc. Không vẽ chữ vào ảnh (chữ do code vẽ, để dịch và đổi được), trừ logo.

## Đuôi style (đã có ở cuối mỗi prompt)
`Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59.`

## Negative prompt (dùng chung)
```
text, letters, numbers, watermark, logo of other games, 3d render, pixel art, photorealistic, glossy plastic UI, sci-fi neon, dark theme, cluttered details, characters cut off at edges
```

## Sau khi có ảnh
Đặt vào `assets/ui/` theo tên file ở từng mục, thêm mục vào `assets/CREDITS.json` (nguồn: ChatGPT, license như các ảnh xe). Báo mình để gắn vào giao diện (nền sảnh, icon nút, bục xe…). Nền trắng thì mình tự xoá nền.

---

## 1. Nền sảnh – `assets/ui/lobby-bg.jpg` (1920×1080) ✅ đã có
Nằm sau khung sảnh, khung che khoảng 90% giữa, nên chi tiết đẹp nhất nên ở **mép trái/phải và dưới**.
```
Same art style, line weight and palette as the vehicle and pilot images in this chat. Wide 16:9 game lobby background, no characters, no UI. A bright sunny sky with big soft cumulus clouds, several small floating grass islands drifting at the left and right edges with tiny waterfalls, wooden rope bridges and a few windmills, a distant floating island with a little workshop town in the far background, birds and paper kites in the sky. The center of the image is calm open sky with only soft clouds so a UI panel can sit on top of it. Bottom edge: rolling green hills with small flowers. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. No text, no logo.
```

## 2. Logo – `assets/ui/logo.png` (1024×512, nền trắng) ✅ đã có (bản 2a)
AI vẽ chữ hay sai; nếu chữ lỗi thì chỉ lấy phần biểu tượng (bản 2b), chữ để code vẽ.

**2a. Có chữ**
```
Same art style, line weight and palette as the vehicle and pilot images in this chat. Game logo for a cheerful artillery game called "GUN STORM". Chunky rounded bold letters in cream with thick dark brown outline and a coral drop shadow, the letter O shaped like a round brass cannon muzzle, a small swirl of wind and a cartoon cannonball arcing over the words leaving a dotted trajectory, little cloud puffs at the ends. Centered, flat front view. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no other text.
```
**2b. Chỉ biểu tượng**
```
Same art style, line weight and palette as the vehicle and pilot images in this chat. Game emblem, no text: a round badge shaped like a brass cannon muzzle seen from the front, with a swirl of wind around it and a small cartoon cannonball arcing over the top leaving a dotted trajectory, two tiny clouds at the sides. Centered, flat front view. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no text.
```

## 3. Bục đứng xe – `assets/ui/podium.png` (1024×512, nền trắng) ✅ đã có
Đặt dưới xe ở thẻ chi tiết xe (phòng chờ) và thẻ người chơi (sảnh).
```
Same art style, line weight and palette as the vehicle and pilot images in this chat. 2D game prop, pure side view, flat orthographic profile: a small floating grass island platform used as a display podium, flat grassy top that is wide and level so a vehicle can stand on it, earth-brown rock underside tapering down with a few hanging roots and tiny crystals, a couple of small flowers at the edges, no objects on top. Centered, whole object visible. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

## 4. Ô "Ngẫu nhiên" trong lưới chọn xe – `assets/ui/random-mobile.png` (512×512, nền trắng) ✅ đã có
```
Same art style, line weight and palette as the vehicle and pilot images in this chat. 2D game icon: a wooden mystery crate with brass corners, a big painted question mark on the front in coral, a few small stars and a puff of smoke popping out of the slightly open lid, side view slightly from the front, chunky cute proportions. Centered, whole object visible. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no other text.
```

## 5. Huy hiệu đội – `assets/ui/team-blue.png`, `assets/ui/team-red.png` (512×512, nền trắng) ✅ đã có cả hai
Vẽ bản Xanh trước, ưng rồi nhắn bản Đỏ: "Same emblem, same shape and details, but recolor the shield to coral red and the bird to a cream fox".
```
Same art style, line weight and palette as the vehicle and pilot images in this chat. 2D game team emblem: a rounded wooden shield with a brass rim, the face painted sky blue with a cream paper-kite bird silhouette in the middle, two small crossed cartoon cannons behind the shield, a small coral ribbon at the bottom with no writing. Flat front view, centered. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text.
```

## 6. Bộ icon nút – `assets/ui/icons/<tên>.png` (mỗi icon 512×512, nền trắng)
Vẽ từng icon một, cùng chat, câu đầu giữ nguyên để các icon đồng bộ. Thay phần `<VẬT>` theo bảng. Có file mới thì thêm tên vào `ICONS` trong `client/src/onlineFlow.ts`.

```
Same art style, line weight and palette as the vehicle and pilot images in this chat. 2D game UI icon, same style as the previous icons in this chat: <VẬT>. Chunky cute proportions, bold simple silhouette readable at 48 pixels, slight 3/4 front view, centered, whole object visible. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text.
```

| File | Nút | `<VẬT>` |
|---|---|---|
| `create.png` ✅ | Tạo phòng | a small wooden signpost with a coral flag being planted into a tuft of grass, a tiny hammer leaning on it |
| `quick-join.png` ✅ | Vào nhanh | a brass cannon firing a cream paper airplane with speed lines |
| `refresh.png` ✅ | Làm mới | two curved coral arrows chasing each other in a circle around a small cloud |
| `ready.png` ✅ | Sẵn sàng | a raised cartoon gauntlet hand giving a thumbs up, brass cuff, small sparkle |
| `start.png` ✅ | Bắt đầu | a lit cannon fuse with a bright spark and a puff of smoke, cannonball about to launch |
| `switch-team.png` ✅ | Đổi đội | two small shields, one sky blue and one coral red, swapping places with curved arrows between them |
| `leave.png` ✅ | Rời phòng | a wooden door half open with a coral arrow pointing out |
| `add-bot.png` ✅ | Thêm máy | a cute round little robot head with a brass antenna and a green plus badge |
| `remove.png` ✅ | Bỏ máy | a coral round badge with brass rim and a big cream horizontal minus bar in the middle (a minus sign, NOT a plus sign) |
| `chat.png` ✅ | Chat | a cream speech bubble with three brown dots, a small paper kite tail |

---

## Gợi ý
- Nếu ảnh ra tối hoặc kiểu kim loại bóng bẩy: nhắn "brighter, softer, more watercolor, like the vehicle images".
- Nếu AI tự vẽ chữ vào icon/nền: nhắn "remove all text and letters, keep everything else".
- Nếu nền sảnh quá rối ở giữa: nhắn "make the center 70% calm open sky with only soft clouds".
- Thứ tự nên làm: nền sảnh → bục xe → ô ngẫu nhiên → icon nút → huy hiệu đội → logo. Hai mục đầu đổi diện mạo nhiều nhất.
