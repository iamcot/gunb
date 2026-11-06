# Prompt vẽ nhân vật gốc (phi công nam, nữ)

Mục tiêu: 2 nhân vật **gốc** (base) để sau này gắn item (mũ, tóc, áo, kính, phụ kiện…) chồng lên như búp bê giấy.
Vì vậy bản gốc phải "trơn": không mũ, không kính, không phụ kiện, quần áo bó đơn giản, tóc ngắn gọn sát đầu (để item tóc/mũ đè lên được).

**Dùng ChatGPT (tạo ảnh), trong cùng chat đã vẽ các xe** để giữ đúng nét. Mỗi nhân vật vẽ 2 tư thế:
1. **Ngồi lái** (nhìn ngang, quay phải) – dùng trong trận, đặt vào ghế xe (`pilot` trong `rig.json`).
2. **Đứng toàn thân** (3/4 hơi nghiêng cũng được, nhưng nên nhìn ngang) – dùng ở menu, phòng chờ, màn chọn đồ.

Sau khi có ảnh mình sẽ: xoá nền, tách đầu / thân / tay để gắn item, đo điểm neo (đầu, mặt, lưng, tay).

## Đoạn style chung (đã có ở cuối mỗi prompt)
`Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.`

## Negative prompt (dùng chung)
```
hat, helmet, goggles, glasses, scarf, cape, backpack, weapon, jewelry, long hair covering face, 3d render, pixel art, realistic proportions, background scenery, ground shadow, text, watermark, extra fingers
```

---

## 1. Phi công nam – ngồi lái
```
Same art style, line weight, palette and camera as the vehicle images in this chat. 2D game sprite of a chibi boy pilot, about 2.5 heads tall, pure side view facing right, sitting upright on an invisible seat, both hands forward gripping two control levers (draw only his hands, no levers). Base character for a dress-up system: short neat dark-brown hair close to the head, no hat, no goggles, no accessories. Cheerful determined face, big expressive eyes. Plain fitted pilot jumpsuit in sky blue with cream collar and simple brown belt and short brown boots, no logos, no badges. Clean simple silhouette so hats, hair and outfits can be layered on later. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

## 2. Phi công nữ – ngồi lái
```
Same art style, line weight, palette and camera as the vehicle images in this chat, and same body proportions as the boy pilot. 2D game sprite of a chibi girl pilot, about 2.5 heads tall, pure side view facing right, sitting upright on an invisible seat, both hands forward gripping two control levers (draw only her hands, no levers). Base character for a dress-up system: short bob hair in warm chestnut brown that stays above the shoulders, no hat, no goggles, no hair ornaments, no accessories. Bright confident face, big expressive eyes. Plain fitted pilot jumpsuit in coral with cream collar and simple brown belt and short brown boots, no logos, no badges. Clean simple silhouette so hats, hair and outfits can be layered on later. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

## 3. Phi công nam – đứng toàn thân
```
Same boy pilot as before, same face, hair and jumpsuit. Full body standing pose, side view facing right, relaxed stance with arms slightly away from the body (not covering the torso), feet slightly apart, whole character visible from head to boots. Base character for a dress-up system: no hat, no goggles, no accessories, nothing in his hands. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left. Plain white background, no shadow, no text, no logo.
```

## 4. Phi công nữ – đứng toàn thân
```
Same girl pilot as before, same face, hair and jumpsuit. Full body standing pose, side view facing right, relaxed stance with arms slightly away from the body (not covering the torso), feet slightly apart, whole character visible from head to boots. Base character for a dress-up system: no hat, no goggles, no accessories, nothing in her hands. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left. Plain white background, no shadow, no text, no logo.
```

---

## Gợi ý
- Vẽ nam trước, ưng rồi mới vẽ nữ trong cùng chat ("same body proportions as the boy pilot") để 2 người cùng tỉ lệ, item dùng chung được.
- Nếu nó vẽ thêm mũ / kính: nhắn thêm "remove the hat and goggles, keep everything else the same".
- Nếu ra 3D hoặc góc nghiêng: nhắn "flat 2D, pure side profile like the vehicles".
- Không cần vẽ item lúc này; item (mũ, tóc, áo, cánh…) sẽ có prompt riêng, vẽ trên nền trắng, cùng tỉ lệ đầu.
