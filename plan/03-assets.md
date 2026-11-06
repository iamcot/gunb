# 03 – Asset: tìm, tự làm, license

## 1. Nguyên tắc: game của mình, không phải bản sao

Dự án là game **cùng thể loại** bắn tọa độ theo lượt, lấy cảm hứng từ ký ức GunBound, nhưng **mọi thứ nhìn thấy và nghe thấy là của mình**:

- **Không** trích xuất / dùng lại sprite, bản đồ, nhạc, âm thanh, font, icon từ client GunBound hay bất kỳ bản server lậu, trang fan, bản "remake" nào. Tài sản đó thuộc nhà phát hành gốc.
- **Không** dùng tên game, tên xe (Armor, Trico, Boomer, Grub, Mage, Lightning, Bigfoot, Knight, Dragon...), tên bản đồ (Miramo, Nirvana, Sea of Hero, Metropolis...), tên/biểu tượng cấp bậc, tên trang phục của game gốc.
- **Không** vẽ lại "giống hệt" (trace, tô lại) một chiếc xe hay bản đồ cụ thể. Lấy *cơ chế* thể loại (góc, lực, gió, delay, phá địa hình, đạn tách, đạn lăn...) là bình thường – đó là của chung thể loại.
- **Không** đưa tên game gốc hay tên họa sĩ cụ thể vào prompt AI ("in GunBound style").
- Khác với `lmht-web` (dùng tài nguyên trích xuất từ game thương mại), repo này giữ sạch ngay từ đầu, để sau này có muốn công khai cũng không phải làm lại.

## 2. Quy trình ghi nguồn (bắt buộc)

Giống `fps-web`: mọi file trong `assets/` có một mục trong `assets/CREDITS.json`:

```json
{ "file": "sounds/explode_small.ogg", "author": "...", "source": "Freesound #12345",
  "license": "CC0", "url": "https://...", "modified": "cắt 0.4s đầu, giảm 3dB" }
```

- `license` chỉ nhận các giá trị: `Tự tạo`, `CC0`, `CC-BY-4.0`, `CC-BY-3.0`, `OFL`, `Kenney`, `Pixabay`, `Mua (tên cửa hàng + license)`, `AI (tên công cụ + gói)`.
- **Không nhận** `CC-BY-NC` (cấm thương mại – sau này muốn mở rộng sẽ vướng), `CC-BY-SA` cho code/asset gộp chung (dễ "lây" license), hay "không rõ".
- Task Phase 0 nên thêm 1 test: mọi file trong `assets/` (trừ `assets/source/`) đều có mục trong CREDITS.json và license nằm trong danh sách trên.
- Có trang "Ghi công" trong game, sinh tự động từ CREDITS.json (CC-BY bắt buộc ghi tên tác giả).

## 3. Nguồn asset miễn phí / hợp lệ

### Hình ảnh 2D
| Nguồn | License | Dùng cho |
|---|---|---|
| [Kenney.nl](https://kenney.nl/assets) | CC0 | Tank/xe, particle, UI, nút, icon, nền. Rất hợp làm placeholder đẹp và nhất quán |
| [OpenGameArt.org](https://opengameart.org) | tuỳ từng file (lọc CC0 / CC-BY) | Tileset địa hình, nền, hiệu ứng nổ |
| [itch.io – game assets](https://itch.io/game-assets/free) | tuỳ từng gói, đọc kỹ trang gói | Sprite hoạt hình, hiệu ứng nổ dạng sprite sheet, UI fantasy |
| [CraftPix.net](https://craftpix.net/freebies/) | license riêng của CraftPix (cho phép dùng trong game, cấm bán lại asset) | Nền 2D, nhân vật, GUI |
| [game-icons.net](https://game-icons.net) | CC-BY-3.0 (ghi tên tác giả) | Icon item, icon đạn, icon chỉ số |
| [Google Fonts](https://fonts.google.com) | OFL | Font có tiếng Việt: Be Vietnam Pro, Baloo 2, Nunito, Lexend |

### Âm thanh + nhạc
| Nguồn | License | Ghi chú |
|---|---|---|
| [Kenney Audio](https://kenney.nl/assets?q=audio) | CC0 | Click UI, tiếng nổ, tiếng động cơ |
| [Freesound.org](https://freesound.org) | từng file: CC0 / CC-BY / CC-BY-NC | Lọc **CC0 hoặc CC-BY**, bỏ NC |
| [Sonniss GDC Game Audio Bundle](https://sonniss.com/gameaudiogdc) | royalty-free, dùng thương mại được | Hàng chục GB hiệu ứng chất lượng cao, tải miễn phí hằng năm |
| [Incompetech (Kevin MacLeod)](https://incompetech.com/music/) | CC-BY-4.0 | Nhạc giao hưởng nhẹ, hợp sảnh chờ |
| [Pixabay Music / Sound Effects](https://pixabay.com/music/) | Pixabay Content License | Không cần ghi công nhưng vẫn ghi vào CREDITS |
| [OpenGameArt – Music](https://opengameart.org/art-search-advanced?field_art_type_tid%5B%5D=12) | tuỳ file | Có nhiều bản orchestral/chiptune CC0, CC-BY |

### Tự tạo bằng công cụ miễn phí (đầu ra là của mình)
- **jsfxr / sfxr** (https://sfxr.me): sinh tiếng bắn, nổ, nhảy, nhặt đồ kiểu retro trong vài giây. Rất hợp với game này.
- **BeepBox / JummBox** (trình duyệt), **LMMS**, **Bosca Ceoil**: tự soạn nhạc nền đơn giản.
- **Aseprite** (trả phí, rẻ) / **LibreSprite** / **Krita** (miễn phí): vẽ, sửa sprite, sprite sheet.
- **Inkscape**: vẽ vector (xe, UI) rồi xuất PNG nhiều kích thước.
- **Code**: địa hình thử nghiệm sinh bằng noise; hiệu ứng nổ, khói, mảnh đất bằng particle của Pixi – không cần ảnh.

## 4. Dùng AI để tạo asset

AI rất hợp với dự án nhỏ một người, nếu có quy trình:

### Hình ảnh (xe, nền, địa hình, avatar, trang phục)
- Công cụ: Midjourney, các model của OpenAI/Google, Leonardo, Stable Diffusion / Flux chạy máy nhà (ComfyUI). **Đọc điều khoản của gói đang dùng**: nhiều gói miễn phí giới hạn dùng thương mại; gói trả phí thường cho phép.
- Quy trình gợi ý:
  1. Viết **"bible" phong cách** 1 trang: bảng màu, độ dày nét viền, góc nhìn ngang, ánh sáng từ trên trái, tỉ lệ "chibi". Dùng lại cùng đoạn mô tả này trong mọi prompt + ảnh tham chiếu do chính mình tạo trước đó (style reference) để đồng bộ.
  2. Xe: prompt dạng *"side view 2D game sprite, cute mechanical snail tank with a cannon on its shell, bold outline, flat cel shading, plain white background"*. Sinh nhiều bản, chọn 1, rồi **tách lớp bằng tay** trong Krita/Aseprite: thân, nòng (để xoay riêng), bánh/chân (để chuyển động), mắt (để nháy).
  3. Xoá nền (công cụ remove background hoặc Krita), cắt vừa khít, xuất PNG 2 kích thước (1x, 2x).
  4. Địa hình: sinh ảnh rộng "side view terrain cross-section, floating island, grassy top, layered rock..." → đưa vào Krita, **xoá phần trời thành trong suốt** (kênh alpha chính là mask va chạm), kiểm tra không có pixel bán trong suốt lơ lửng.
  5. Nền xa: sinh 2–3 lớp (trời, núi xa, cây gần) cho parallax, cùng bảng màu với địa hình.
- Ảnh AI thường **sai chi tiết, không nhất quán giữa các khung hình** → dùng AI cho ảnh tĩnh (thân xe, nền, icon, avatar); chuyển động làm bằng code (xoay nòng, nảy thân, rung) thay vì vẽ nhiều khung.
- Lưu ý pháp lý: ở một số nước (ví dụ Mỹ) ảnh do AI tạo hoàn toàn có thể không được bảo hộ bản quyền; người khác dùng lại được. Không ảnh hưởng việc mình dùng, nhưng nên chỉnh sửa tay để thành tác phẩm của mình.

### Nhạc AI
- Suno, Udio, Stable Audio...: tạo nhạc sảnh chờ giao hưởng nhẹ, nhạc trận đấu kịch tính. **Gói miễn phí thường chỉ cho dùng phi thương mại**, đọc điều khoản trước. Không đưa tên bài/tên game gốc vào prompt; mô tả bằng tâm trạng và nhạc cụ ("light orchestral, playful, flute and pizzicato strings, loopable").
- Cắt điểm lặp (loop) trong Audacity để nhạc nền lặp liền mạch.

### Ghi vào CREDITS
`"license": "AI (Midjourney, gói Standard)"`, `"modified": "tách lớp, sửa tay mắt và nòng"`, và lưu prompt vào `assets/source/prompts/<file>.txt` để làm lại được.

## 5. Thông số kỹ thuật asset

| Loại | Thông số |
|---|---|
| Xe | Thân PNG ~96×72 px (bản 2x: 192×144), nhìn ngang, quay mặt sang **phải**; nòng tách riêng, tâm xoay ghi trong `mobiles/<id>/rig.json` (`pivot`, `muzzle`) |
| Đạn | 16–32 px, có thể có vệt khói (particle) |
| Địa hình | PNG có alpha, 2400×1200 px gợi ý (tối đa 4096×2048), alpha > 127 = đất |
| Nền | 2–3 lớp PNG/WebP, rộng ≥ 1.3 × chiều rộng màn hình 1920 |
| Hiệu ứng nổ | sprite sheet 8–12 khung hoặc particle bằng code |
| Icon (đạn, item, cấp bậc) | SVG hoặc PNG 64×64 |
| Âm thanh | `.ogg` + `.mp3` dự phòng, 44.1 kHz, chuẩn hoá −1 dBFS, hiệu ứng < 2 s |
| Nhạc | `.ogg`, lặp liền mạch, 1–3 phút, ~128 kbps |
| Atlas | Gộp sprite thành atlas lúc build (script dùng `sharp`), nén WebP |

## 6. Lộ trình asset theo phase

| Phase | Asset cần | Cách làm nhanh nhất |
|---|---|---|
| 0–2 | Địa hình, xe, đạn, nổ | Địa hình sinh bằng script; xe hình khối; nổ bằng particle; âm bằng jsfxr |
| 3 | 3 xe có hình | Kenney tank pack (CC0) sửa màu, hoặc AI theo mục 4 |
| 4–5 | UI phòng chờ, 1 bản đồ thật, nhạc | Kenney UI + font Google; AI vẽ bản đồ; nhạc Incompetech/AI |
| 6–9 | Thêm xe, bản đồ, trang phục, biểu tượng cấp bậc, nhạc từng bản đồ | AI + sửa tay, hoặc thuê họa sĩ freelance (ký thỏa thuận chuyển giao quyền) |
