# 14 – Prompt ảnh vụ nổ và khói

Thay phần vụ nổ đang vẽ bằng code (hình tròn cam, khói xám, chấm mảnh đất) bằng ảnh vẽ tay, và thêm hiệu ứng đạn trúng xe (mục 7, 8).

Game sẽ **không** dùng ảnh động nhiều khung, vì AI vẽ các khung liên tiếp thường không khớp nhau. Thay vào đó, game dùng vài ảnh tĩnh làm "hạt":
- phóng to dần;
- xoay;
- mờ dần;
- tung ra nhiều bản cùng lúc.

Cách này vẫn ra vụ nổ chuyển động. Kích thước vụ nổ vẫn theo bán kính nổ của từng viên đạn như hiện tại.

Công cụ: ChatGPT (tạo ảnh). Nên làm trong cùng chat đã vẽ icon thời tiết và mây giông để hợp nét và màu.

Yêu cầu chung:
- **Nền trong suốt (transparent PNG).** Nếu công cụ không cho nền trong suốt thì dùng **nền xanh lá thuần #00FF00**. Đừng dùng nền trắng, vì khói và lõi lửa có nhiều mảng trắng, rất khó tách.
- Ảnh nhìn thẳng từ bên hông (game 2D), không phối cảnh.
- Không có chữ, khung viền, bóng đổ, mặt đất, bầu trời.
- Ảnh có nhiều hình (khói, mảnh đất) thì các hình **cách xa nhau**, không chạm nhau, để mình cắt ra từng cái.

## Đoạn phong cách chung (đã có trong mỗi prompt)
`Same art style, line weight and palette as the weather icons and storm cloud in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading.`

---

## 1. Quả cầu nổ – `fx-fireball.png` (vuông, khoảng 1024×1024)
Lõi của vụ nổ. Game phóng to nhanh rồi mờ đi, có thể xoay ngẫu nhiên để mỗi phát trông khác nhau.
```
Same art style, line weight and palette as the weather icons and storm cloud in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading. A single round cartoon explosion burst for a 2D side-view game, seen straight on: a puffy cluster of fire balls, white-hot yellow center, golden yellow middle, orange then coral-red outer puffs, a few short pointed flame tips around the edge. Roughly round and centered, fills most of the square. No smoke, no debris, no ground. Transparent background, no text, no frame.
```

## 2. Cụm khói – `fx-smoke-puffs.png` (vuông, khoảng 1024×1024, lưới 2×2)
Bốn cụm khói khác nhau. Game tung nhiều cụm bay lên, to dần và mờ đi sau vụ nổ. Khói nên **sáng màu trung tính** để game tô đậm/nhạt hoặc ám màu được.
```
Same art style, line weight and palette as the weather icons and storm cloud in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading. A sprite sheet of four separate cartoon smoke puffs arranged in a 2 by 2 grid with lots of empty space between them, each puff a soft round cloud of 3 to 5 bumps, light warm grey with a lighter cream top and a slightly darker grey underside, each puff a slightly different shape. Puffs do not touch each other. No fire, no ground. Transparent background, no text, no frame.
```

## 3. Mảnh đất văng – `fx-dirt-chunks.png` (ngang, khoảng 1024×512)
Các cục đất, đá nhỏ văng ra khi đạn nổ trên mặt đất. Game sẽ ám màu theo màu đất chỗ nổ, nên vẽ **màu nâu đất trung tính**.
```
Same art style, line weight and palette as the weather icons and storm cloud in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading. A sprite sheet of eight separate small chunks of earth and pebbles in two rows with lots of empty space between them: lumpy dirt clods, a couple of flat rock shards, one clod with a tiny tuft of grass, warm earth brown with lighter tan top highlights. Chunks do not touch each other. No smoke, no fire. Transparent background, no text, no frame.
```

## 4. Vòng sóng nổ – `fx-shockwave.png` (vuông, khoảng 512×512)
Vòng loé ra ngay lúc nổ, game phóng to rất nhanh rồi tắt.
```
Same art style, line weight and palette as the weather icons and storm cloud in this chat: bright cheerful 2D hand-painted game art. A single thin glowing ring for an explosion shockwave, seen straight on: pale yellow-white ring with a soft warm orange outer glow, slightly uneven brush stroke, empty transparent center. Centered in the square. Transparent background, no text, no frame.
```

## 5. Lửa đầu nòng – `fx-muzzle-flash.png` (ngang, khoảng 512×256)
Chớp lửa ở đầu nòng lúc bắn. Game xoay theo hướng nòng.
```
Same art style, line weight and palette as the weather icons and storm cloud in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading. A single cartoon muzzle flash pointing to the right, seen from the side: a short star-shaped burst of flame, white-hot yellow core at the left end, golden and orange pointed flame tips spreading to the right, small and punchy. Transparent background, no gun, no smoke, no text, no frame.
```

## 6. (Tuỳ chọn) Tia lửa – `fx-spark.png` (vuông, khoảng 256×256)
Ngôi sao loé nhỏ, game rắc nhiều hạt này quanh vụ nổ. Không có ảnh này thì tia lửa vẫn vẽ bằng code.
```
Same art style, line weight and palette as the weather icons and storm cloud in this chat: bright cheerful 2D hand-painted game art. A single small four-pointed sparkle star, bright yellow-white center, golden points, soft warm glow. Centered. Transparent background, no text, no frame.
```

## 7. Va chạm đạn với xe – `fx-hit-impact.png` (vuông, khoảng 1024×1024)
Hiện ngay chỗ đạn trúng xe, đè lên vụ nổ thường: một "bụp" kiểu truyện tranh cho biết đã trúng. Game phóng to nhanh, lắc nhẹ, rồi tắt trong khoảng 0,3 giây.
```
Same art style, line weight and palette as the weather icons and storm cloud in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading. A single comic-book style hit impact burst for a 2D game, seen straight on: a jagged spiky star shape with 8 to 10 uneven sharp points, white-hot center, bright yellow middle, coral-red outer rim, a few small white impact streaks radiating out between the points. Centered, fills most of the square. No text, no letters, no smoke. Transparent background, no frame.
```

## 8. Mảnh kim loại văng khi trúng xe – `fx-hit-bits.png` (ngang, khoảng 1024×512)
Vài mảnh nhỏ văng ra từ xe bị trúng (game ám màu theo đội).
```
Same art style, line weight and palette as the weather icons and storm cloud in this chat: bright cheerful 2D hand-painted game art, thick dark brown outlines, two-tone cel shading. A sprite sheet of eight separate small cartoon debris pieces in two rows with lots of empty space between them: bent metal plates, a tiny bolt, a tiny gear, a small rivet, a screw, light neutral grey-silver with cream highlights. Pieces do not touch each other. Transparent background, no text, no frame.
```

---

## Ráp vào game (Claude làm)
- Gửi ảnh vào thread hoặc bỏ vào `assets/fx/`. Claude tách nền nếu cần, cắt từng hình, ghi CREDITS.
- `client/src/fx.ts` đổi các hạt lửa, khói, mảnh đất, sóng nổ, lửa đầu nòng sang ảnh. Vụ nổ to hay nhỏ vẫn theo bán kính nổ, kết quả phát bắn không đổi.
- Thiếu ảnh nào thì phần đó vẫn vẽ bằng code như bây giờ.
