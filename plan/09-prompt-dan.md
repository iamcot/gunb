# Prompt vẽ đạn cho từng xe

Mỗi xe có 3 loại đạn (đạn 1, đạn 2, đạn SS), tên lấy từ `shared/src/mobiles/*.ts`.
**Một prompt = một ảnh có đủ 3 viên đạn của xe đó**, xếp hàng ngang, cách xa nhau, nền trắng. Mình sẽ tự cắt ra từng viên.

Dùng ChatGPT (tạo ảnh) **trong cùng chat đã vẽ các xe** để đạn hợp màu, hợp nét với xe.

Quy ước để mình dùng được trong game:
- Đạn vẽ **nằm ngang, đầu đạn chĩa sang phải** (hướng bay). Game sẽ tự xoay theo đường bay.
- Đạn nhỏ gọn, hình khối rõ, đọc được khi thu nhỏ còn khoảng 16–40 px.
- **Không vẽ vệt khói, vệt lửa dài, tia nổ** (hiệu ứng mình làm riêng trong game). Viên đạn tự phát sáng thì được.
- Viên đạn SS (thứ 3) to và hoành tráng hơn 2 viên kia.

## Đoạn đầu chung (đã có trong mỗi prompt)
`Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, horizontal, pointing to the right (flight direction), small chunky readable shapes.`

## Đoạn đuôi chung (đã có trong mỗi prompt)
`No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.`

## Negative prompt (dùng chung)
```
motion blur, speed lines, smoke trail, fire trail, explosion, vehicle, hand, character, text, label, number, 3d render, pixel art, background scenery, shadow
```

---

## 1. Ốc Thiết Giáp – Đạn nổ / Đạn đôi / Đạn khổng lồ
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, horizontal, pointing to the right (flight direction), small chunky readable shapes. 1) a round brass cannonball shell with a small coral tip and a riveted band. 2) the same shell but slimmer, as a pair of two small identical shells stacked one above the other. 3) a huge heavy brass cannon shell three times bigger, coral and cream spiral stripes like the snail's shell, glowing orange rivets. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

## 2. Chũi Khoan – Mũi khoan / Đào rãnh / Khoan thẳng xuống
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, horizontal, pointing to the right (flight direction), small chunky readable shapes. 1) a small spinning drill bit with coral and steel spiral stripes and a brass back cap. 2) a longer flat digging drill with a wide shovel-like tip and brass fins. 3) a big heavy drill bit, twice as long, coral and steel stripes, gold collar with rivets, glowing tip. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

## 3. Bọ Lôi – Điện giật / Chùm ba / Sét giáng
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, horizontal, pointing to the right (flight direction), small chunky readable shapes. 1) a glowing electric orb, pale yellow core inside a small golden cage, tiny sparks. 2) three small electric orbs grouped in a tight triangle. 3) a big crackling thunder sphere, bright yellow-white core, blue-white lightning arcs wrapped around it, golden cage rings. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

## 4. Cua Lăn – Bi lăn / Bi lăn xa / Cầu đá
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, small chunky readable shapes. 1) a round grey stone ball with a few cracks, like the boulder the crab holds. 2) a smoother, polished round stone ball with a coral stripe around it. 3) a big rocky boulder, twice as big, with barnacles and moss patches, a brass band around the middle. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

## 5. Diều Hâu Giấy – Phi tiêu giấy / Phi tiêu đôi / Đại bàng
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, horizontal, pointing to the right (flight direction), small chunky readable shapes. 1) a folded paper dart arrow, cream paper with blue cloud pattern, coral paper tip. 2) the same paper dart but as a pair, two small darts one above the other. 3) a big folded origami eagle with wings spread, cream and sky-blue paper with cloud patterns, coral beak, flying to the right. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

## 6. Nhím Chùm – Chùm gai / Gai ba / Mưa gai
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, horizontal, pointing to the right (flight direction), small chunky readable shapes. 1) a single small rocket spike: cream body, sky-blue band, gold ring, coral cone tip. 2) a slightly bigger rocket spike of the same design with small fins. 3) a big rocket spike twice as large with gold rivets and a glowing coral tip. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

## 7. Sứa Đèn – Bóng đèn / Chùm đèn / Đèn khổng lồ
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, small chunky readable shapes. 1) a small glowing light bulb orb, warm yellow light inside a thin brass cap, soft glow. 2) a small cluster of three tiny glowing bulbs held together by a brass ring. 3) a big glowing jellyfish-shaped lantern orb, mint-green glass dome, warm yellow core, short wavy glowing tentacles at the back. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

## 8. Rùa Thành – Đạn đá / Tường đất / Núi đá
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, small chunky readable shapes. 1) a rough grey boulder like the one in the catapult bucket. 2) a chunk of earth and castle bricks clumped together with grass on top. 3) a big rocky mountain chunk with moss, a tiny castle tower and a little blue flag on top. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

## 9. Long Ngư Cơ (xe ẩn, chưa có thông số – tên đạn dự kiến: Cầu lửa / Lửa ba / Rồng lửa)
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, horizontal, pointing to the right (flight direction), small chunky readable shapes. 1) a round fireball with a golden-yellow core and coral flame petals around it. 2) three small fireballs grouped together. 3) a big fire spirit shaped like a small golden dragon-carp head made of flames, flying to the right. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

## 10. Kỳ Lân Sắt (xe ẩn, chưa có thông số – tên đạn dự kiến: Giáo sáng / Giáo đôi / Sừng thần)
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, horizontal, pointing to the right (flight direction), small chunky readable shapes. 1) a short golden spiral spear tip like the unicorn's horn, softly glowing. 2) two small golden spiral spear tips one above the other. 3) a big shining golden spiral horn lance with a cream light core and a small blue banner with a white flower emblem at its back. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

---

## Sau khi có ảnh
Gửi ảnh vào thread, mình sẽ cắt từng viên, xoá nền, thu về kích thước hợp lý và lưu vào `assets/mobiles/<id>/shot-1.png`, `shot-2.png`, `shot-3.png` (kèm CREDITS). Phần client vẽ đạn bằng ảnh là việc riêng, làm sau khi có đủ ảnh.
