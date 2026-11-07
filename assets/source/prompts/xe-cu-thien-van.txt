# 15 – Xe mới Cú Thiên Văn (`cu-thien-van`): prompt ảnh + âm thanh

Xe bắn **cầu sáng**; chạm đâu thì một **vệ tinh** hiện ra, ngắm rồi bắn **tia laser** vào đó. Đạn 1, 2: vệ tinh ở trên đầu xe bắn, tia **chéo, mảnh** từ đó tới điểm chạm. SS: vệ tinh ở tận trời, tia **thẳng đứng, to**. Tia đốt xuyên đất và trúng mọi xe nằm trên tia (SS trúng cả xe nấp dưới mái đất mỏng).
Thiết kế riêng của game: tên, hình, chỉ số không lấy từ game nào.

Gameplay đã chạy được khi chưa có ảnh: xe vẽ bằng hình khối, đạn là chấm tròn, vệ tinh và tia laser vẽ bằng code, tiếng tạo bằng code. Có ảnh/tiếng nào thì gửi vào thread, mình gắn vào.

## Thông số (shared/src/mobiles/cuThienVan.ts)

Vệ tinh **luôn bay theo** trên đầu xe (cao 170 px, nghiêng chéo về phía trước). Cầu sáng **không gây sát thương, không khoét đất**, chỉ đánh dấu; sát thương đến hoàn toàn từ laser.

| | Đạn 1 – Đốm sáng | Đạn 2 – Ba tia | SS – Cột sáng |
|---|---|---|---|
| Laser | 1 tia chéo từ vệ tinh trên đầu xe, rộng 16 px, 42 sát thương, đốt sâu 30 px | 3 tia chéo (nhắm giữa, phải, trái cách 30 px, nối nhau 0.15 s), rộng 14 px, 26 mỗi tia, sâu 26 px | Vệ tinh bay tới trên điểm chạm, xoay ngang, bắn 1 tia thẳng đứng từ trời, rộng 52 px, 90 sát thương, đốt sâu 110 px |
| Vệ tinh bắn sau | 0.5 s | 0.5 s | 0.6 s |
| Delay | 115 | 160 | 230 |

Xe: máu 96, giáp 0.08, góc 10–80°, nhiên liệu 110. Laser tính khoảng cách từ xe tới **đường tia**: nằm trên tia thì gần như đủ sát thương, lệch ra ngoài bề rộng tia là trượt hẳn.

---

## 1. Ảnh xe (ChatGPT, cùng chat đã vẽ các xe khác)

Tính cách: cô bé mê ngắm sao, tò mò, mắt tròn xoe.

**Tiếng Việt** (dán thẳng nếu công cụ hiểu tốt):

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ hình **con cú mèo nhà thiên văn**: thân tròn ú như quả trứng, bộ lông màu xanh đêm điểm những chấm sao vàng nhỏ, bụng màu kem, đôi mắt tròn rất to như hai ống kính bằng đồng có viền đinh tán, hai túm lông tai nhọn, hai chân móng vuốt bằng đồng bám trên hai bánh xe gỗ. Trên lưng có buồng lái hở với ghế nhỏ **để trống**. **Vũ khí là một chiếc kính thiên văn bằng đồng thau to**: ống kính dài có vài khấc nối, đầu ống loe ra và chứa một quả cầu ánh sáng xanh ngọc phát sáng, gắn trên lưng cú bằng một khớp xoay tròn to nhìn rõ, chĩa chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng cần gạt nối tới kính. Dáng mềm mại như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

**Tiếng Anh** (nên dùng với ChatGPT):
```
Same art style, line weight, palette and camera as the robot beetle image. 2D game sprite, pure side view facing right, flat orthographic profile, whole vehicle visible, compact chunky proportions. Its weapon is one BIG brass telescope, as long as the body, with a few segmented rings and a flared mouth holding a glowing teal ball of light, mounted on the owl's back by a large round golden pivot joint, pointing forward to the right and diagonally up, drawn in pure side profile, not overlapping the body. A chibi vehicle shaped like a round astronomer owl: egg-shaped body with midnight-blue feathers dotted with tiny golden stars, cream belly, two huge round brass-rimmed lens eyes with rivets, pointy ear tufts, brass talons gripping two wooden wheels, no human face. Small open cockpit on its back with an empty brown seat and a red-knob control lever linked to the telescope. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```
Negative prompt dùng chung như `plan/06-prompt-xe.md`.

## 2. Ảnh đạn (một ảnh đủ 3 viên)
```
Same art style, line weight and palette as the vehicle images in this chat. A game projectile sprite sheet: three separate projectiles in one row from left to right with lots of empty space between them, each drawn flat 2D in pure side view, small chunky readable shapes. 1) a small glowing teal orb of starlight with a white core and four tiny sparkle points. 2) three tiny glowing teal star orbs held together in a small triangle. 3) a big glowing orb of starlight, teal and white, with a thin golden ring around it like a small planet and a few twinkling star sparkles. No motion trails, no smoke, no explosion, no launcher, no vehicle. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Plain white background, no shadow, no text, no labels, no numbers.
```

## 3. Ảnh vệ tinh – `satellite.png` (vuông, khoảng 512×512)
Game vẽ vệ tinh rộng khoảng 64 px, nhấp nhô trên trời, mắt kính phía dưới sáng dần rồi bắn tia laser **thẳng xuống**. Tia laser game tự vẽ, ảnh **không** cần tia.
Nền trong suốt; không được thì nền xanh lá thuần #00FF00 (giống `plan/14-prompt-no-khoi.md`).
```
Same art style, line weight and palette as the owl vehicle in this chat. A small cute satellite for a 2D side-view game, seen straight from the side: a round brass body like a little owl head with two pointy ear tufts on top, two wide solar panel wings shaped like owl feathers, deep blue panels with thin gold lines, one on each side, and one big round glass lens eye at the BOTTOM of the body looking straight down, glowing soft teal. Symmetrical, centered, wings spread horizontally. No laser beam, no light rays, no stars, no ground. Hand-painted anime game art, two-tone cel shading, thick dark brown outlines. Transparent background, no text, no frame.
```

## 4. Âm thanh (ElevenLabs Sound Effects, như `plan/11-prompt-am-thanh.md`)

| Tên file | Độ dài | Prompt |
|---|---|---|
| `cu-thien-van_fire-1` | 0.7 s | `A small orb of starlight is launched from a brass telescope: soft magical chime whoosh with a twinkling shimmer. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cu-thien-van_boom-1` | 0.8 s | `A small orb of starlight lands on the ground: soft sparkling pop with a tiny magical ping, quiet and short. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cu-thien-van_beam-1` | 1.4 s | `A thin laser beam fires straight down from a satellite in the sky and blasts the ground: short rising electronic charge whine, a sharp bright zap, then a punchy explosion with sizzling burn and a few falling dirt bits. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cu-thien-van_fire-2` | 0.8 s | `Three small orbs of starlight are launched together: layered twinkling chimes with a quick whoosh. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cu-thien-van_boom-2` | 0.7 s | `A tiny orb of starlight lands on the ground: very soft sparkling pop, quiet and short. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cu-thien-van_beam-2` | 1.0 s | `A quick thin laser zap from the sky hits the ground: short high electronic pew, then a small sharp explosion pop with a little sizzle. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cu-thien-van_fire-3` | 1.0 s | `A big glowing star orb is launched from a brass telescope: deep magical hum, rising shimmering chime and a strong whoosh. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cu-thien-van_boom-3` | 1.0 s | `A big orb of starlight lands on the ground: bright sparkling burst with a soft magical chime, not an explosion. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cu-thien-van_beam-3` | 2.5 s | `A huge laser pillar blasts down from a satellite in the sky: long rising charge whine, a massive roaring energy beam, then a big heavy explosion as it burns deep into the ground, crackling fire and a deep rumbling tail. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |

Mỗi phát có hai tiếng nổ: `boom` là lúc **cầu sáng chạm đất** (nhỏ, lấp lánh, chỉ để báo điểm ngắm), `beam` là lúc **laser bắn xuống và nổ** (tiếng chính, đã gồm cả tiếng nổ ở đáy tia nên game không phát thêm `boom` lúc đó).

## Sau khi có ảnh / tiếng
Gửi vào thread, mình sẽ: tách kính thiên văn thành nòng xoay (`assets/mobiles/cu-thien-van/rig.json`), cắt 3 viên đạn (`shot-1..3.png` + `shots.json`, khai báo thêm `"beam"` cho tiếng laser), đặt vệ tinh vào `assets/fx/satellite.png`, ghi `assets/CREDITS.json`.
