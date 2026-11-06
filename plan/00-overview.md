# 00 – Tổng quan: game bắn tọa độ trên web (tên tạm "Pháo Gió")

> Tên **"Pháo Gió"** chỉ là tên tạm. Đổi tên chỉ cần sửa `shared/src/branding.ts` và file này.

## Cách dùng bộ plan này

- Giống `fps-web`: **mỗi phiên Claude Code chỉ giao một task** (ví dụ "làm task 1.3"). Prompt mẫu:
  > Đọc CLAUDE.md, plan/00-overview.md và plan/02-phases.md. Làm task 1.3. Xong thì báo cáo theo mẫu trong CLAUDE.md.
- Tự test tay theo mục "Cách test tay" của task rồi mới giao task tiếp.
- Task đánh dấu ⚠️ là task khó, nên dùng model mạnh nhất.
- Bộ file:
  | File | Nội dung |
  |---|---|
  | `00-overview.md` | Mục tiêu, stack, kiến trúc, quy ước (file này) |
  | `01-kha-thi.md` | Phân tích tính khả thi làm trên web, rủi ro, độ khó từng mảng |
  | `02-phases.md` | Kế hoạch chi tiết theo giai đoạn, từng task có tiêu chí nghiệm thu |
  | `03-assets.md` | Cách tìm / tự làm asset, license, quy trình ghi nguồn |
  | `04-the-gioi.md` | Tên xe, nhân vật, cấp bậc |
  | `PROGRESS.md` | Đánh dấu task đã xong |

## Mục tiêu

Game **bắn tọa độ 2D theo lượt** (thể loại "artillery", cùng dòng với Worms / GunBound / Pocket Tanks) chạy trên trình duyệt, chơi nội bộ với bạn bè qua LAN/Internet. Tái hiện **cảm giác** của dòng game tuổi thơ: căn góc, giữ lực, đọc gió, phá địa hình cho đối thủ rơi vực, thứ tự lượt theo delay. **Không sao chép** GunBound: tên game, tên xe, nhân vật, sprite, bản đồ, nhạc, icon cấp bậc đều là của mình (xem `03-assets.md` mục 1).

Nguyên tắc: **cảm giác bắn đã tay trước, đẹp sau**. Bản MVP chạy được bằng hình khối/placeholder.

## Lối chơi cốt lõi (bản đầu)

- 2 đội, 1v1 đến 4v4. Mỗi người một xe (gọi là **"pháo"**), có máu, giáp, góc nòng cho phép (min/max) riêng.
- Lượt của mình: được di chuyển (tốn **nhiên liệu**, có giới hạn mỗi lượt), chỉnh góc (↑↓), quay đầu (←→ khi đứng yên đổi hướng), chọn đạn (1 / 2 / SS), giữ **Space** để tích lực, nhả để bắn. Hết giờ lượt (mặc định 20 s) thì mất lượt.
- **Gió**: đổi mỗi lượt, có hướng (vector 2D, có cả thành phần dọc) và độ lớn 0–N. Hiện trên HUD bằng mũi tên + số.
- **Delay**: mỗi hành động cộng delay (bắn đạn 1 ít, đạn 2 nhiều hơn, SS nhiều nhất, đi xa cũng cộng, dùng item cộng). Người có delay nhỏ nhất đi lượt kế. Đây là luật làm nên chiều sâu chiến thuật.
- **Địa hình phá hủy** theo pixel: đạn nổ khoét hố; xe mất chỗ đứng thì rơi; rơi ra khỏi đáy bản đồ là chết ngay.
- Thanh **SS** tích dần theo sát thương gây ra/nhận vào, đầy thì dùng được đạn SS.
- Thắng khi đội kia chết hết (hoặc hết số lượt tối đa thì so tổng máu).

## Stack (chỉ dùng những thư viện này)

Giữ cùng "hệ" với `fps-web` để tái dùng kinh nghiệm, script đóng gói, cấu trúc monorepo.

| Việc | Thư viện | Ghi chú |
|---|---|---|
| Ngôn ngữ / runtime | TypeScript, Node 24 | như fps-web |
| Client build | Vite | |
| Render 2D | `pixi.js` (v8) | WebGL/WebGPU, sprite, particle, filter. Không dùng engine nặng (Phaser) vì phần khó nhất (địa hình pixel, vật lý đạn) phải tự viết đằng nào cũng vậy |
| Vật lý | **tự viết** trong `shared/` | Không dùng Box2D/Matter: đạn là chất điểm + gió + trọng lực, va chạm với mask bitmap. Đơn giản, kiểm soát được, chạy chung client/server |
| Mạng | `ws` (server), WebSocket trình duyệt (client) | |
| Mã hoá message | `@msgpack/msgpack` | |
| Âm thanh | Web Audio API thuần (học từ `fps-web/client/src/audio`) | không thêm Howler |
| Test | `vitest` | |
| Chạy server dev | `tsx` | |
| Xử lý ảnh lúc build (tuỳ chọn) | `sharp` (chỉ trong `scripts/`) | tạo mask từ PNG, cắt atlas |

Ghi version cứng trong `package.json` (không dùng `^`). Cần thêm thư viện khác: hỏi trước.

## Kiến trúc

```
gunb/
  CLAUDE.md
  plan/
  package.json              # npm workspaces
  shared/src/
    constants.ts            # tick, thời gian lượt, giới hạn phòng
    branding.ts             # tên game, tên đội
    math.ts                 # vec2, rng có seed (mulberry32), clamp
    terrain/mask.ts         # TerrainMask: Uint8Array w*h, isSolid, carveCircle, hash
    terrain/surface.ts      # tìm mặt đất dưới 1 điểm, độ dốc
    physics/projectile.ts   # stepProjectile (thuần), va chạm mask theo đoạn
    physics/mobileMove.ts   # đi trên dốc, rơi, nhiên liệu
    shot/simulateShot.ts    # mô phỏng TRỌN một phát bắn -> ShotResult (quỹ đạo + sự kiện)
    mobiles/*.ts            # thông số từng xe + đạn (config, không hardcode trong logic)
    turn/delay.ts           # chọn lượt kế theo delay
    wind.ts                 # sinh gió mỗi lượt từ seed
    match.ts                # state trận + reducer (applyAction)
    protocol.ts             # kiểu message + encode/decode
    map/types.ts, map/loadMap.ts
  server/src/
    main.ts, transport.ts, lobby.ts, room.ts, matchRunner.ts, bots/
  client/src/
    main.ts, input.ts, loop.ts
    net/transport.ts
    render/terrain.ts       # texture địa hình + xoá vùng theo hố
    render/mobiles.ts, render/projectiles.ts, render/fx.ts, render/camera.ts
    hud/ (HTML/CSS: thanh lực, góc, gió, delay list, máu)
    audio/
    debug/overlay.ts        # F3: tick, quỹ đạo dự đoán (chỉ bật ở chế độ debug), hash địa hình
  assets/
    maps/<id>/{map.json, terrain.png, mask.png, bg-*.png}
    mobiles/<id>/...
    sounds/  music/  ui/
    CREDITS.json
```

### Luồng một phát bắn (quan trọng, đọc kỹ)

Game theo lượt nên **không cần prediction / lag compensation** như fps-web. Cách làm:

1. Client gửi `fire { angle, power, shotType }` (đã kẹp hợp lệ).
2. Server gọi `simulateShot(matchState, fire)` (code trong `shared/`), chạy trọn quỹ đạo với bước cố định `DT_SIM = 1/120 s` cho tới khi mọi đạn kết thúc. Kết quả `ShotResult`:
   - `paths`: điểm quỹ đạo của từng đạn, lấy mẫu mỗi 2 bước (để client vẽ),
   - `events`: danh sách theo thời gian `{t, kind: 'explode'|'carve'|'damage'|'fall'|'death'|'split', ...}`,
   - `terrainHashAfter`.
3. Server áp `events` vào state thật, gửi `ShotResult` cho mọi client.
4. Client **phát lại** (playback) quỹ đạo theo thời gian, áp `carve` vào mask + texture khi tới `t`, rồi so `terrainHashAfter` (lệch thì xin lại mask đầy đủ).

Nhờ vậy client không cần mô phỏng trùng bit với server (`Math.sin`/`Math.cos` có thể khác nhau giữa các trình duyệt). Chỉ `carveCircle` (số nguyên) phải cho kết quả giống nhau ở mọi nơi, và có test cho việc này.

Chế độ offline (hotseat/bot) dùng đúng hàm `simulateShot` đó trong trình duyệt.

## Quy ước bắt buộc

- Toạ độ thế giới = **pixel của bản đồ**, gốc ở góc trên trái, **trục Y hướng xuống** (khớp ảnh). Thời gian tính bằng giây.
- Góc bắn `angle` tính bằng **độ nguyên** (0–90 so với phương ngang, về phía xe đang quay mặt), lưu kèm `facing = 1 | -1`. Đổi sang radian trong 1 hàm duy nhất `aimDir(angle, facing, tilt)`. Góc hiển thị cho người chơi là **góc so với thân xe** (xe nghiêng theo dốc), giống cảm giác dòng game này.
- Vận tốc ban đầu: `v0 = power/100 * shot.maxSpeed`, `power` 0–100 (có thể lẻ 0.1).
- Gia tốc trên đạn: `a = (wind.x * windScale, gravity + wind.y * windScale)`; từng loại đạn có `windFactor` riêng (có thể âm).
- Mọi thông số gameplay (tốc độ, damage, delay, bán kính hố, thời gian lượt...) nằm trong config của `shared/`, **không hardcode** trong logic.
- `shared/` không import Pixi hay DOM.
- Không cấp phát object mới trong vòng lặp mỗi frame/bước mô phỏng; dùng biến tạm tái sử dụng.
- RNG luôn có seed (`mulberry32`), seed của trận do server sinh; mọi thứ ngẫu nhiên (gió, vị trí xuất phát, sự kiện bản đồ) đi qua RNG này.

## Hằng số khởi điểm (`shared/src/constants.ts`)

```ts
export const DT_SIM = 1 / 120;          // bước mô phỏng đạn
export const GRAVITY = 420;             // px/s² – chỉnh khi chơi thử
export const WIND_MAX = 26;             // độ lớn gió tối đa (đơn vị hiển thị)
export const WIND_SCALE = 6;            // px/s² cho 1 đơn vị gió
export const TURN_TIME_S = 20;
export const MOVE_FUEL_PER_TURN = 120;  // px đi ngang được mỗi lượt
export const MAX_SLOPE_DEG = 55;        // dốc hơn thì không leo được
export const FALL_DAMAGE_PER_PX = 0.15; // rơi xa thì mất máu
export const MAX_PLAYERS = 8;
export const MAX_TURNS = 60;
```

Số liệu là **điểm xuất phát**, chỉnh bằng bảng debug F6 khi chơi thử (giống fps-web).

## Định nghĩa "xong" bản MVP

2–8 người (2 đội) vào cùng phòng qua LAN, chọn 1 trong 3 pháo, vào 1 bản đồ phá hủy được; thay phiên bắn theo delay, gió đổi mỗi lượt, đạn khoét địa hình, xe rơi vực chết, hết trận hiện bảng kết quả, chơi tiếp ván mới. Có chế độ offline đấu bot để tập.
