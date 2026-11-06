# 05 – Prompt + yêu cầu kỹ thuật để tạo bản đồ "thật" (task 5.4)

Mục tiêu: 1 bản đồ có ảnh địa hình đẹp, nền parallax 2–3 lớp, nhạc nền. Code đã sẵn khung (nền parallax, nhạc/âm thanh tạo bằng code làm placeholder). Bạn tạo file theo bảng dưới, bỏ vào `assets/maps/<id>/`, rồi giao Claude Code task "ráp bản đồ <id>".

Nhắc luật (`03-assets.md`): không đưa tên GunBound / họa sĩ / bản đồ có thật vào prompt; license ghi vào `assets/CREDITS.json`; lưu prompt vào `assets/source/prompts/<tên file>.txt`.

## 1. Danh sách file cần có

Thư mục: `assets/maps/<id>/` (ví dụ `dao-may`, chỉ chữ thường/số/gạch ngang).

| File | Kích thước | Yêu cầu |
|---|---|---|
| `terrain.png` | **2400×1200**, PNG RGBA | Alpha > 127 = đất (va chạm). Phần trời **trong suốt hoàn toàn** (alpha = 0). Không có pixel bán trong suốt lơ lửng, không có vùng đất nhỏ li ti ngoài đảo |
| `bg-1-far.png` | rộng ≥ 2400, cao 1200 (hoặc 1080), PNG/WebP | Lớp xa nhất: trời + mây + núi mờ. Có thể mờ, ít chi tiết, **không trong suốt** |
| `bg-2-mid.png` | rộng ≥ 2400, cao ~ 700 | Lớp giữa: đảo/núi xa, nền **trong suốt** phía trên |
| `bg-3-near.png` (tuỳ chọn) | rộng ≥ 2400, cao ~ 500 | Lớp gần: mây gần, lá, đảo nhỏ; nền trong suốt |
| `music.ogg` | 1–3 phút, ~128 kbps | Lặp liền mạch (cắt đúng điểm loop) |

Quy ước bố cục địa hình (để chơi được):
- Mặt trên của đảo **tương đối phẳng** (dao động ±15 px), rộng khoảng x = 220…2180; chỗ đứng hai đội ở **x ≈ 420–880 (đội Xanh)** và **x ≈ 1520–1980 (đội Đỏ)**.
- Dưới đảo là **trời trống** (rơi ra khỏi đáy bản đồ y = 1200 là chết). Độ dày đảo 300–400 px ở giữa, thon dần ra mép.
- Có thể thêm vài mảng đá nhỏ lơ lửng ở rìa (ngoài hai vùng xuất phát).

## 2. Prompt gợi ý (sửa tuỳ công cụ)

Dùng cùng một "bible phong cách" cho mọi ảnh để đồng bộ:

> **Style bible:** bright cheerful 2D hand-painted game art, bold clean outlines, flat cel shading with soft gradients, warm light from top-left, palette: sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, accent coral #FF7A59. Side view, no text, no characters, no logos.

**Địa hình (`terrain.png`)**
> {style bible}. Side-view cross-section of a large floating island in the sky, flat grassy top surface with tiny gentle bumps, thick layered earth and rock underneath tapering to a rounded bottom with a few hanging roots and small stalactites, a few embedded boulders, island spans about 80% of the image width, **plain solid white background**, wide 2:1 aspect ratio, no shadows on the background.

Xử lý: đưa vào Krita/Photoshop → xoá nền trắng thành trong suốt (magic wand + feather 0) → kiểm tra không còn viền trắng → co/giãn về 2400×1200 → xuất PNG. Kiểm bằng cách bật lớp mask F3 trong game.

**Nền xa (`bg-1-far.png`)**
> {style bible}. Wide panoramic sky background, soft gradient from sky blue at top to pale cream at the horizon, a few large soft fluffy clouds, very distant faint mountain silhouettes, low contrast, calm, no ground, 21:9 aspect ratio.

**Nền giữa (`bg-2-mid.png`)**
> {style bible}. Several distant small floating islands with tiny trees and waterfalls falling into the void, hazy blueish tint (atmospheric perspective), **plain solid white background** (to be made transparent), panoramic.

**Nền gần (`bg-3-near.png`, tuỳ chọn)**
> {style bible}. A few large soft foreground clouds and drifting leaves, slightly blurred, **plain solid white background**, panoramic.

**Nhạc (`music.ogg`)** — công cụ nhạc AI (đọc điều khoản dùng thương mại của gói đang dùng):
> Light orchestral adventure loop, playful and bright, flute and pizzicato strings with soft marimba, medium tempo about 100 BPM, builds gently, seamless loop, no vocals, no reference to any existing song or game.

Cắt điểm lặp trong Audacity (cắt ở zero-crossing, crossfade 0.5 s), xuất `.ogg`.

## 3. Sau khi có file

1. Bỏ vào `assets/maps/<id>/`, tạo `map.json` (hoặc để Claude Code tạo) theo mẫu:
   ```json
   {
     "id": "<id>", "name": "Tên hiển thị", "width": 2400, "height": 1200, "terrain": "terrain.png",
     "backgrounds": [
       { "file": "bg-1-far.png", "parallax": 0.15 },
       { "file": "bg-2-mid.png", "parallax": 0.35 },
       { "file": "bg-3-near.png", "parallax": 0.6 }
     ],
     "spawnZones": { "A": { "x1": 420, "x2": 880 }, "B": { "x1": 1520, "x2": 1980 } },
     "music": "music.ogg"
   }
   ```
2. Thêm **mỗi file** vào `assets/CREDITS.json` (`"license": "AI (tên công cụ + gói)"`, `"modified"`: các bước sửa tay), lưu prompt vào `assets/source/prompts/`.
3. Giao Claude Code: *"Đọc CLAUDE.md, plan/05-prompt-asset-map.md. Ráp bản đồ <id> (task 5.4): đặt làm mặc định, nhạc nền theo `music` của map, kiểm tra spawn đứng được."*
