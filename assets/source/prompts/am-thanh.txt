# 11 – Prompt tạo nhạc nền + âm thanh đạn

Công cụ gợi ý: **ElevenLabs** (gói Premium, giống nhạc bản đồ Đảo nổi đã có).
- Nhạc: mục **Music**, chọn "Instrumental" (không lời).
- Hiệu ứng: mục **Sound Effects**, tắt "Loop", đặt **Duration** đúng số giây ghi ở từng dòng, **Prompt influence ≈ 0.6**. Mỗi prompt tạo 4 bản, chọn bản nghe gọn nhất.

Nhắc luật (`03-assets.md`): không đưa tên game gốc, tên bài nhạc, tên nghệ sĩ vào prompt. Mô tả bằng tâm trạng, nhạc cụ, chất liệu. Prompt dưới đây đã viết sẵn theo luật đó.

## Cách gửi file cho Claude

- Giữ nguyên file gốc (mp3/wav đều được), **đặt tên đúng cột "Tên file"** ở các bảng dưới (ví dụ `oc-thiet-giap_fire-1.mp3`).
- Bỏ tất cả vào **một thư mục trên máy** rồi báo đường dẫn thư mục, hoặc nén thành **một file zip** rồi gửi vào thread. (Gửi từng file lẻ vào thread sẽ mất tên file nên khó ghép.)
- Không cần cắt, chuẩn hoá hay đổi sang ogg: Claude sẽ cắt khoảng lặng, chuẩn hoá −1 dBFS, làm vòng lặp liền mạch cho nhạc, xuất `.ogg` và ghi `CREDITS.json`.
- Thiếu file nào thì game dùng âm thanh tạo bằng code như hiện tại cho file đó, nên có thể gửi dần.

## Đoạn đuôi chung cho mọi hiệu ứng (đã có trong mỗi prompt)
`Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.`

---

## A. Nhạc nền

| Tên file | Dùng ở | Độ dài |
|---|---|---|
| `music_lobby` | Menu, sảnh online, phòng chờ, chọn xe | 60–90 s |
| `music_battle` | Trong trận, khi bản đồ chưa có nhạc riêng (Đảo nổi đã có nhạc riêng) | 90–120 s |

**`music_lobby`**
```
Light orchestral lobby music for a cheerful fantasy artillery game. Playful and warm, nostalgic, sunny sky islands mood. Flute and clarinet melody, pizzicato strings, glockenspiel sparkles, soft harp arpeggios, light hand percussion and gentle brushed snare. Medium tempo around 100 BPM, major key. Relaxed but inviting, makes you want to press Ready. Steady energy from start to end with no big intro, no fade out and no final ending chord so it can loop seamlessly. Instrumental only, no vocals.
```

**`music_battle`**
```
Upbeat adventurous orchestral battle music for a turn-based cartoon artillery game. Exciting but not stressful, a sense of aiming and anticipation. Driving staccato strings, bouncy pizzicato bass, brass stabs, playful woodwind runs, taiko and snare groove, occasional cymbal swells. Tempo around 128 BPM, minor key with heroic lifts. Steady energy throughout with no long intro, no fade out and no final ending so it can loop seamlessly. Instrumental only, no vocals.
```

---

## B. Âm thanh chung

| Tên file | Khi nào | Độ dài |
|---|---|---|
| `sfx_turn` | Tới lượt mình | 1.0 s |
| `sfx_hit` | Xe trúng đạn, mất máu | 0.6 s |

**`sfx_turn`**
```
Short bright two-note chime announcing it is your turn, glockenspiel and soft bell, rising, friendly and clear. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.
```

**`sfx_hit`**
```
A small armored vehicle gets hit: metallic clang on thick metal plate with a short crunchy impact and a few rattling bolts. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.
```

---

## C. Âm thanh đạn từng xe

Mỗi viên đạn có 2 tiếng: **fire** (lúc bắn ra khỏi nòng) và **boom** (lúc chạm đất / nổ). Viên số 3 là đạn SS nên to và hoành tráng hơn.
Độ dài: fire 0.6–1.0 s, boom 1.2–2.0 s (luật asset: hiệu ứng dưới 2 s).

### 1. Ốc Thiết Giáp – Đạn nổ / Đạn đôi / Đạn khổng lồ

| Tên file | Độ dài | Prompt |
|---|---|---|
| `oc-thiet-giap_fire-1` | 0.8 s | `A sturdy brass cannon fires a round shell: deep solid boom with a short metallic ring of the barrel and a puff of air. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `oc-thiet-giap_boom-1` | 1.4 s | `Medium explosion of a cannon shell hitting the ground: punchy blast, dirt and small rocks scattering, short rumble tail. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `oc-thiet-giap_fire-2` | 1.0 s | `A brass cannon fires two lighter shells in quick succession, two tight pops a quarter second apart, slight metallic ring. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `oc-thiet-giap_boom-2` | 1.2 s | `Small sharp explosion of a light shell hitting earth: quick crack, dirt spray, short tail. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `oc-thiet-giap_fire-3` | 1.0 s | `A huge heavy brass cannon fires a giant shell: very deep thunderous boom, barrel recoil clank, low air whoosh. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `oc-thiet-giap_boom-3` | 2.0 s | `Massive explosion of a giant shell: huge deep blast, ground shaking rumble, rocks and earth raining down, long low tail. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |

### 2. Chũi Khoan – Mũi khoan / Đào rãnh / Khoan thẳng xuống

(Trong game mũi khoan chỉ đào chưa tới nửa giây rồi nổ, nhìn gần như một phát nổ thường, nên tiếng boom là **tiếng nổ chính**, chỉ có một chút tiếng khoan/cào đất ở đầu.)

| Tên file | Độ dài | Prompt |
|---|---|---|
| `chui-khoan_fire-1` | 0.8 s | `A pneumatic launcher shoots a spinning drill bit: compressed air thunk followed by a short rising whirring drill spin. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `chui-khoan_boom-1` | 1.2 s | `A drill shell hits the ground and explodes: a very quick drill grind for a split second, then a punchy dirt explosion with small rocks scattering. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `chui-khoan_fire-2` | 0.8 s | `A pneumatic launcher shoots a wide flat digging drill: heavy air thunk and a low whirring spin. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `chui-khoan_boom-2` | 1.2 s | `A digging shell hits the ground and explodes: a very short crunchy scrape of soil, then a medium punchy explosion with dirt spray and a short tail. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `chui-khoan_fire-3` | 1.0 s | `A big heavy drill is launched: powerful air cannon blast and a deep motor revving up to high speed. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `chui-khoan_boom-3` | 1.8 s | `A giant drill punches into the ground and detonates: half a second of loud grinding rock, then a big heavy explosion with collapsing earth and falling rubble. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |

### 3. Bọ Lôi – Điện giật / Chùm ba / Sét giáng

| Tên file | Độ dài | Prompt |
|---|---|---|
| `bo-loi_fire-1` | 0.7 s | `An electric orb is launched: sharp electric zap and crackle with a rising buzzing hum. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `bo-loi_boom-1` | 1.4 s | `An electric orb bursts on impact: bright electric discharge, crackling sparks, a short popping blast and fading buzz. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `bo-loi_fire-2` | 0.8 s | `A cluster of three small electric orbs is launched: triple quick zaps layered together with a buzzing hum. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `bo-loi_boom-2` | 1.2 s | `A small electric orb pops on impact: quick spark crackle and a light zap burst. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `bo-loi_fire-3` | 1.0 s | `A big crackling thunder sphere is launched: heavy electric surge, deep buzzing charge and loud arcing crackle. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `bo-loi_boom-3` | 1.4 s | `A thunder sphere hits the ground: electric blast with sparks, short static crackle tail. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `bo-loi_bolt-3` | 2.0 s | `A lightning bolt strikes down from the sky: sharp cracking thunder clap, sizzling electricity, short rolling thunder tail. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |

(`bo-loi_bolt-3` là tiếng tia sét giáng xuống sau khi đạn SS chạm đất.)

### 4. Cua Lăn – Bi lăn / Bi lăn xa / Cầu đá

| Tên file | Độ dài | Prompt |
|---|---|---|
| `cua-lan_fire-1` | 0.7 s | `A big mechanical claw hurls a stone ball: quick heavy throw whoosh with a creaky metal joint snap. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cua-lan_boom-1` | 1.4 s | `A stone ball rolls a moment over rocky ground then smashes: short rumbling roll, then a crunchy rock impact blast with debris. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cua-lan_fire-2` | 0.7 s | `A mechanical claw throws a polished stone ball fast: sharp whoosh and a springy metal snap. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cua-lan_boom-2` | 1.4 s | `A smooth stone ball rolls fast over the ground and cracks apart: quick rolling rumble then a sharp stone crack and small blast. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cua-lan_fire-3` | 1.0 s | `A mechanical claw heaves a huge boulder: heavy strained metal creak, then a big low whoosh. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `cua-lan_boom-3` | 2.0 s | `A huge boulder rolls and crashes: deep heavy rolling rumble, then a massive rock-shattering explosion with falling rubble. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |

### 5. Diều Hâu Giấy – Phi tiêu giấy / Phi tiêu đôi / Đại bàng

| Tên file | Độ dài | Prompt |
|---|---|---|
| `dieu-hau-giay_fire-1` | 0.6 s | `A wooden crossbow shoots a folded paper dart: tight string twang and a crisp paper flutter whoosh. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `dieu-hau-giay_boom-1` | 1.3 s | `A magic paper dart explodes on impact: crisp paper burst, a puff blast and paper confetti fluttering down. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `dieu-hau-giay_fire-2` | 0.8 s | `A wooden crossbow shoots two paper darts in quick succession: two string twangs and paper flutter whooshes. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `dieu-hau-giay_boom-2` | 1.2 s | `A small paper dart pops on impact: light papery burst and a small puff. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `dieu-hau-giay_fire-3` | 1.0 s | `A big origami eagle is launched into the wind: strong crossbow thunk, large paper wings flapping, and a soft eagle-like whistle of wind. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `dieu-hau-giay_boom-3` | 2.0 s | `A giant magic paper eagle dives and explodes: rushing wind swoop, big airy blast, swirling gust and lots of paper scraps fluttering. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |

### 6. Nhím Chùm – Chùm gai / Gai ba / Mưa gai

(Đạn bắn ra 3–7 gai cùng lúc nên tiếng nổ phải **ngắn, gọn**, game sẽ phát chồng lên nhau.)

| Tên file | Độ dài | Prompt |
|---|---|---|
| `nhim-chum_fire-1` | 0.8 s | `A fan of five small rocket spikes launches at once: quick layered whooshes and hissing mini rocket ignitions. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `nhim-chum_boom-1` | 0.8 s | `A small rocket spike hits the ground: very short sharp pop explosion with a tiny dirt spray. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `nhim-chum_fire-2` | 0.8 s | `Three rocket spikes launch at once: layered rocket whooshes with a hissing ignition. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `nhim-chum_boom-2` | 1.0 s | `A rocket spike explodes on impact: short punchy pop blast with dirt spray. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `nhim-chum_fire-3` | 1.0 s | `A big salvo of seven rocket spikes launches: dense layered rocket whooshes, loud hissing ignition burst. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `nhim-chum_boom-3` | 1.0 s | `A heavy rocket spike explodes on impact: compact punchy blast with crackle and dirt debris. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |

### 7. Sứa Đèn – Bóng đèn / Chùm đèn / Đèn khổng lồ

| Tên file | Độ dài | Prompt |
|---|---|---|
| `sua-den_fire-1` | 0.8 s | `A glowing lantern orb is launched: soft magical bloop, warm glassy chime and a gentle shimmering hum. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `sua-den_boom-1` | 1.4 s | `A magic light orb bursts on impact: glass shatter tinkle, bright shimmering pop and a warm whoosh of light. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `sua-den_fire-2` | 0.8 s | `A cluster of three small lantern bulbs is launched: three soft magical bloops with glassy chimes. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `sua-den_boom-2` | 1.3 s | `Small glowing bulbs burst on impact: light glass tinkles and sparkly magic pops. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `sua-den_fire-3` | 1.0 s | `A giant jellyfish lantern is launched: deep watery magical bloop, swelling shimmering hum and bubbly glass chimes. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `sua-den_boom-3` | 2.0 s | `A giant magic lantern explodes: big bright magical blast, large glass dome shattering, shimmering sparkle tail and a deep watery whoomp. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |

### 8. Rùa Thành – Đạn đá / Tường đất / Núi đá

(Đạn 2 và SS không phá đất mà **đắp đất**, nên tiếng "boom" là tiếng đất đá trồi lên, không phải tiếng nổ.)

| Tên file | Độ dài | Prompt |
|---|---|---|
| `rua-thanh_fire-1` | 0.9 s | `A wooden catapult launches a rock: creaky wooden arm swing, rope snap and a heavy thud of the arm hitting its stop. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `rua-thanh_boom-1` | 1.4 s | `A heavy rock smashes into the ground: solid stone crunch impact, rocks cracking and debris falling. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `rua-thanh_fire-2` | 0.9 s | `A wooden catapult flings a clump of magic earth: wooden creak, soft rope snap and a muddy whoosh. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `rua-thanh_boom-2` | 1.4 s | `A wall of earth rises from the ground: deep rumbling soil push, crumbling dirt and a solid thump as it settles. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `rua-thanh_fire-3` | 1.0 s | `A big wooden catapult launches a huge magic boulder: loud straining wood creak, heavy rope snap and a deep thud. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |
| `rua-thanh_boom-3` | 2.0 s | `A rocky mountain bursts up out of the ground: heavy earthquake rumble, grinding rock rising, stones tumbling and a big settling thud. Stylized fantasy cartoon game sound effect, crisp, punchy, clean studio quality, dry mix, no music, no voice, no ambience.` |

---

## D. Ráp vào game (Claude làm)

- Nhạc sảnh/trận chung: `assets/audio/lobby.ogg`, `assets/audio/battle.ogg`; khai báo trong `assets/audio/sounds.json`. Nhạc riêng bản đồ vẫn lấy từ `music` của `map.json` (ưu tiên hơn nhạc trận chung).
- Âm thanh chung: `assets/audio/turn.ogg`, `assets/audio/hit.ogg`, khai báo trong `assets/audio/sounds.json` mục `sfx`.
- Âm thanh đạn: `assets/mobiles/<id>/fire-1.ogg`, `boom-1.ogg`… khai báo trong `shots.json` của xe, mỗi viên thêm `"fire"`, `"boom"` (và `"bolt"` cho Bọ Lôi SS). Viên nào chưa khai báo thì dùng tiếng tạo bằng code.
- Prompt đã dùng lưu ở `assets/source/prompts/am-thanh.txt` (chép từ file này), CREDITS ghi `"license": "AI (ElevenLabs, gói Premium)"`.
