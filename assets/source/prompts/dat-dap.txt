# 12 – Prompt vẽ đất đắp (Tường đất / Núi đá của Rùa Thành)

Hiện tại đất đắp được vẽ bằng các hình tròn nâu trơn có viền xanh, nhìn rất "nhựa". Để đẹp mà vẫn giữ được mọi hình dạng (đắp chồng nhiều vòng, bị bắn khoét dở), game sẽ **tô vùng đất đắp bằng một ảnh vân đất lặp liền mạch (seamless tile)**, rồi tự vẽ thêm viền tối và lớp cỏ mỏng ở mép trên. Vì vậy chỉ cần **1 ảnh vân**, không cần vẽ cả cái gò.

## File cần có

| File | Kích thước | Yêu cầu |
|---|---|---|
| `dirt-tile.png` | 512×512 (hoặc 1024×1024, mình tự thu nhỏ) | Vân đất đá **lặp liền mạch 4 cạnh**, phủ kín ảnh, không có viền, không có cỏ, không có bầu trời |

Công cụ: ChatGPT (tạo ảnh) hoặc Dreamina như ảnh địa hình. Nếu dùng ChatGPT, nên làm trong chat đã vẽ địa hình Đảo nổi để hợp màu.

## Prompt
```
Bright cheerful 2D hand-painted game art, flat cel shading with soft gradients, warm light from top-left, palette: earth brown #7A5233 with darker brown #5A3B22 and lighter tan #9C6B42, a few cream #F6E7C8 highlights. A seamless tileable square texture of packed magical earth seen from the side: layered soil with small embedded rounded pebbles and a few flat stones, thin root threads, tiny cracks, subtle horizontal strata. Evenly distributed detail with no focal point, so it tiles perfectly on all four edges. Fills the whole square edge to edge. No grass, no sky, no outline border, no shadow, no text, no logo.
```

## Negative prompt
```
grass, sky, horizon, border, frame, vignette, perspective, 3d render, photo, large single rock, text, watermark
```

## Kiểm tra trước khi gửi
- Ghép thử 2×2 ảnh cạnh nhau (hoặc gửi luôn, mình kiểm): không thấy đường nối.
- Màu gần với phần đất của `assets/maps/dao-noi-ve/terrain.png` để đất đắp không bị lệch tông so với đảo.
