# 06 – Prompt vẽ xe (mobile) cho Gun Storm

Dùng cùng style bible với bản đồ để đồng bộ. Mỗi xe: tạo **thân xe không có nòng** + **nòng riêng** (2 lần tạo), hoặc tạo 1 ảnh có nòng rồi tách tay trong Krita.

Nhắc luật (`03-assets.md`): không đưa tên game/xe thương mại vào prompt, không vẽ "giống hệt" xe của game khác. Lưu prompt vào `assets/source/prompts/xe-<id>.txt`, ghi license vào `assets/CREDITS.json`.

## Yêu cầu kỹ thuật (sau khi tạo)

| Mục | Yêu cầu |
|---|---|
| Thân | Nhìn ngang, **quay mặt sang phải**, nền trắng → xoá thành trong suốt. Xuất 192×144 (2x) và 96×72 (1x) |
| Nòng | Ảnh riêng, nằm ngang chĩa sang phải, đuôi nòng ở bên trái (đó là tâm xoay) |
| Rig | `assets/mobiles/<id>/rig.json`: `pivot` (điểm gắn nòng trên thân), `muzzle` (đầu nòng). Mình/Claude Code đo giúp được |
| Chuyển động | Không cần vẽ nhiều khung: xoay nòng, nảy thân, nháy mắt làm bằng code |

Mẹo cho đồng bộ giữa các xe: tạo cùng 1 công cụ, cùng seed/style reference (Dreamina: dùng ảnh xe đầu tiên làm "reference image" cho các xe sau), cùng tỉ lệ khung 4:3.

## Style bible (dán đầu mọi prompt)

> bright cheerful 2D hand-painted game art, bold clean outlines, flat cel shading with soft gradients, warm light from top-left, palette: sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, accent coral #FF7A59. Side view, no text, no characters, no logos.

## Khung chung cho thân xe

> {style bible}. 2D game sprite of a small cute armored artillery vehicle, **{mô tả xe}**, strict side view facing right, chunky toy-like proportions, compact body fits in a 4:3 frame, small wheels or legs at the bottom, a round mounting socket on top where a cannon attaches, **no cannon barrel**, big expressive eye, plain solid white background, centered, full body visible, no shadow on the ground.

## Khung chung cho nòng

> {style bible}. 2D game sprite of a single detached cannon barrel, **{mô tả nòng}**, horizontal pointing right, round pivot joint at the left end, isolated, plain solid white background, no shadow.

## Từng xe

### 1. Ốc Thiết Giáp (`oc-thiet-giap`) – cân bằng, dễ chơi
- Thân: *a mechanical snail with a big riveted spiral metal shell in coral and cream, soft green body with two eye stalks, small tank treads underneath*
- Nòng: *short sturdy brass cannon with a riveted band*

### 2. Chũi Khoan (`chui-khoan`) – phá địa hình, đạn khoan
- Thân: *a chubby mechanical mole digger, earth brown fur-like metal plates, miner helmet with a lamp, big shovel claws in front, small treads*
- Nòng: *stubby launcher tube ending in a spiral drill bit, steel grey with coral stripes*

### 3. Bọ Lôi (`bo-loi`) – đạn điện, bào giáp
- Thân: *a round beetle robot with a glossy sky-blue shell, two antenna coils glowing yellow, tiny sparks, six short mechanical legs*
- Nòng: *tesla coil cannon with copper rings and a glowing yellow tip*

### 4. Cua Lăn (`cua-lan`) – đạn lăn theo địa hình
- Thân: *a sturdy crab-shaped vehicle with a coral red shell, one big claw raised, cream belly plate, four little legs with wheels*
- Nòng: *wide short mortar tube shaped like a crab claw, coral and cream*

### 5. Diều Hâu Giấy (`dieu-hau-giay`) – đạn đi ngược gió
- Thân: *a light wooden glider cart with folded paper kite wings in cream and sky blue, bamboo frame, small spoked wheels, a little pinwheel on the back*
- Nòng: *slim bamboo launcher tube with paper fins*

### 6. Nhím Chùm (`nhim-chum`) – chùm gai tỏa 5 hướng
- Thân: *a round hedgehog robot covered in short rounded metal spikes, cream face plate, grumpy cute eyes, small treads*
- Nòng: *a cannon with a flared five-hole muzzle like a pepperbox, gunmetal with coral tips*

### 7. Sứa Đèn (`sua-den`) – đạn chậm, xuyên đất mỏng
- Thân: *a glass dome vehicle shaped like a jellyfish lantern, soft glowing cyan inside, brass frame, dangling short tentacle cables, hover pads instead of wheels*
- Nòng: *long thin brass lamp-post barrel with a glowing bulb at the tip*

### 8. Rùa Thành (`rua-thanh`) – máu trâu, dựng tường đất
- Thân: *a big slow tortoise tank whose shell is a little stone castle with crenellations and grass on top, earth brown and grass green, thick stubby legs*
- Nòng: *thick short stone mortar with a brick pattern*

### 9. Long Ngư Cơ (`long-ngu-co`, ẩn) – phun lửa
- Thân: *a sleek mechanical carp-dragon hybrid, golden scales and coral fins, whiskers, flame-shaped tail, hovering on small jets*
- Nòng: *dragon-head shaped flamethrower barrel with open mouth*

### 10. Kỳ Lân Sắt (`ky-lan-sat`, ẩn) – mạnh nhất, hiếm
- Thân: *a noble iron unicorn-shaped war machine, polished silver armor with cream and gold trim, a single horn, sturdy mechanical legs*
- Nòng: *long elegant lance-like cannon with gold rings*

## Gợi ý khi kết quả chưa ưng
- Ra cảnh nền/đất: thêm *"isolated sprite, nothing else in the image"*.
- Ra góc 3/4: nhấn *"strict flat side profile, orthographic"*.
- Nòng dính vào thân dù đã ghi "no cannon": cứ để, gửi mình, mình tách và đo `pivot`/`muzzle`.
- Gửi ảnh vào thread này, mình sẽ xoá nền, cắt khít, resize 1x/2x và tạo `rig.json`.
