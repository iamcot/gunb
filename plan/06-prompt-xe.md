# 06 – Prompt vẽ xe (mobile) cho Gun Storm

Prompt viết bằng tiếng Việt để bạn dễ sửa. Mỗi xe có **một prompt hoàn chỉnh**, copy dán thẳng vào Dreamina. Nếu Dreamina hiểu tiếng Việt chưa tốt (vẽ sai chi tiết), gửi bản bạn đã sửa vào thread, mình dịch sang tiếng Anh giúp.

Nhắc luật (`03-assets.md`): không đưa tên game/xe thương mại vào prompt, không vẽ "giống hệt" xe của game khác. Lưu prompt vào `assets/source/prompts/xe-<id>.txt`, ghi license vào `assets/CREDITS.json`.

## Cách xe được dùng trong game (để hiểu vì sao prompt viết vậy)

- Xe nhìn **ngang, phẳng 2D, quay mặt sang phải**. Game tự lật khi xe quay trái.
- **Súng gắn ngay buồng lái**, có tay cầm quay về ghế: phi công ngồi ghế và cầm súng ngắm. Ghế để **trống** vì phi công là hình riêng (để sau này đổi nhân vật, trang phục).
- **Nòng chĩa chéo lên khoảng trống**, không đè lên thân, để mình cắt nòng ra thành hình riêng và cho xoay theo góc bắn.
- Hình được thu nhỏ còn khoảng 90 px chiều ngang trong game, nên cần **dáng to, rõ, dễ nhận ra từ xa**; chi tiết li ti sẽ mất.

## Đoạn phong cách chung (đã có sẵn trong từng prompt bên dưới)

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm chiếu từ góc trên bên trái. Bảng màu chính: xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, điểm nhấn san hô #FF7A59. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art. Nền trắng trơn, không bóng đổ dưới đất, không chữ, không logo.

**Ô "negative prompt" (nếu có):** `3D, phối cảnh, góc nghiêng 3/4, isometric, pixel art, người ngồi trong xe, chữ, logo, bóng đổ, cảnh nền`

## Gợi ý sửa prompt cho đẹp

- Muốn xe "có hồn": thêm tính cách (*hiền lành, cáu kỉnh, ngái ngủ, hăng máu*) và biểu cảm mắt/miệng.
- Muốn dáng dễ nhận: giữ **1 khối lớn đặc trưng** (vỏ ốc, mai rùa, mái vòm...) chiếm 50–60% hình.
- Muốn đồng bộ cả bộ xe: tạo xe đầu tiên ưng ý, rồi dùng nó làm **ảnh tham chiếu (reference image)** cho các xe sau.
- Nếu AI vẽ người ngồi vào ghế: thêm *"ghế trống, không có ai ngồi"*.
- Nếu ra 3D/nghiêng: nhấn lại *"phẳng 2D, nhìn ngang hoàn toàn, chỉ thấy một bên xích/bánh và một mắt"*.
- Nếu nòng đè lên thân: thêm *"nòng súng chĩa chéo lên trời, tách hẳn khỏi thân xe"*.

---

## 1. Ốc Thiết Giáp (`oc-thiet-giap`) – cân bằng, dễ chơi

Tính cách: hiền lành, chậm mà chắc, "bé ngoan" của dàn xe.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ dễ thương hình **con ốc sên máy**: vỏ ốc xoắn ốc to tròn bằng thép tán đinh, sơn sọc san hô và kem, chiếm hơn nửa thân xe; thân ốc mềm màu xanh lá nhạt bóng mượt, đầu ngóc lên với hai râu mắt, mắt to tròn long lanh, miệng cười hiền. Dưới bụng là một dải xích tank nhỏ màu xám đen. Giữa vỏ ốc và đầu là một buồng lái hở, có một chiếc ghế da nâu nhỏ **để trống** và kính chắn gió thấp. Ngay mép trước buồng lái là **một khẩu pháo đồng ngắn mập trên ụ xoay**, có hai tay cầm quay về phía ghế để phi công cầm ngắm, nòng chĩa chéo lên trời phía trước, không đè lên thân. Dáng mũm mĩm như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 2. Chũi Khoan (`chui-khoan`) – phá địa hình, đạn khoan

Tính cách: thợ mỏ lam lũ, hăng hái, lúc nào cũng dính đất.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con chuột chũi máy đào mỏ**: thân tròn trịa ghép từ các tấm thép màu nâu đất lấm lem bùn, mõm hồng nhọn, đội mũ thợ mỏ vàng có đèn pha nhỏ, hai móng xẻng to bằng thép ở phía trước, đi trên xích tank ngắn, phía sau có ống xả nhả khói. Trên lưng là buồng lái hở với ghế gỗ nhỏ **để trống**. Ngay mép trước buồng lái là **một ống phóng ngắn gắn mũi khoan xoắn ốc** (thép xám sọc san hô) trên ụ xoay, có hai tay cầm quay về ghế, nòng chĩa chéo lên trời phía trước, không đè lên thân. Biểu cảm hăng hái, má lấm bùn. Dáng mũm mĩm như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 3. Bọ Lôi (`bo-loi`) – đạn điện, bào giáp

Tính cách: lanh lợi, tích điện, lúc nào cũng lách tách tia lửa.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con bọ cánh cứng robot**: mai tròn bóng loáng màu xanh trời có sọc vàng chớp, hai râu là cuộn dây đồng phát sáng vàng, vài tia điện nhỏ lách tách quanh râu, sáu chân máy ngắn có khớp tròn. Mắt to lanh lợi. Phía trước mai là buồng lái hở với ghế nhỏ **để trống** và kính chắn gió cong. Ngay mép trước buồng lái là **một khẩu pháo điện kiểu cuộn tesla**, có các vòng đồng và đầu nòng phát sáng vàng, trên ụ xoay có hai tay cầm quay về ghế, nòng chĩa chéo lên trời phía trước, không đè lên thân. Dáng tròn gọn như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 4. Cua Lăn (`cua-lan`) – đạn lăn theo địa hình

Tính cách: ngư dân vạm vỡ, khoẻ mạnh, hơi ngang tàng.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con cua biển cơ khí**: mai cua to bè màu đỏ san hô có đốm kem, bụng tấm giáp màu kem, một càng cua khổng lồ giơ lên phía trước đầy oai vệ, chân cua ngắn gắn bánh xe tròn, có vài con hàu và dây thừng quấn trên mai như vừa đi biển về. Hai mắt cua thò lên trên cuống, nhìn ngang tàng. Trên mai là buồng lái hở với ghế nhỏ **để trống**. Ngay mép trước buồng lái là **một khẩu súng cối ống rộng ngắn** màu đồng có vành san hô, trên ụ xoay có hai tay cầm quay về ghế, nòng chĩa chéo lên trời phía trước, không đè lên thân. Dáng chắc nịch như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 5. Diều Hâu Giấy (`dieu-hau-giay`) – đạn đi ngược gió

Tính cách: nhẹ nhàng, bay bổng, mơ mộng.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con diều hâu làm bằng giấy và tre**: khung tre mảnh buộc dây, đôi cánh diều giấy gấp nếp màu kem và xanh trời xếp gọn hai bên, đầu chim nhọn có mắt to tinh nghịch, đuôi diều dài có tua vải san hô bay phấp phới, phía sau gắn chong chóng giấy nhỏ, đi trên hai bánh xe gỗ có nan. Giữa thân là ghế gỗ nhỏ **để trống** dưới đôi cánh. Ngay mép trước ghế là **một ống phóng tre thon dài có cánh giấy ở đuôi**, trên ụ xoay có hai tay cầm quay về ghế, nòng chĩa chéo lên trời phía trước, không đè lên thân. Dáng nhẹ, thanh thoát như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 6. Nhím Chùm (`nhim-chum`) – chùm gai tỏa 5 hướng

Tính cách: robot nhỏ hay cáu, xù gai khi tức.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con nhím robot tròn vo**: thân tròn như quả bóng phủ đầy gai kim loại ngắn đầu bo tròn màu xám thép, đầu gai sơn san hô, mặt nạ màu kem với đôi mắt cau có cáu kỉnh dễ thương và má phồng, đi trên xích tank ngắn. Trên đỉnh, giữa đám gai, là một nắp hầm tròn mở ra thành buồng lái với ghế nhỏ **để trống**. Ngay mép trước buồng lái là **một khẩu súng miệng loe có năm lỗ nòng** như bông hoa, màu thép xám đầu san hô, trên ụ xoay có hai tay cầm quay về ghế, nòng chĩa chéo lên trời phía trước, không đè lên thân. Dáng tròn xoe như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 7. Sứa Đèn (`sua-den`) – đạn chậm, xuyên đất mỏng

Tính cách: nhà khoa học lập dị, lơ đãng, phát sáng lung linh.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con sứa đèn lồng**: mái vòm kính trong suốt hình chuông sứa, bên trong toả ánh sáng xanh ngọc dịu, khung đồng thau có đinh tán, mép chuông gợn sóng, bên dưới thòng xuống những xúc tu là dây cáp mềm có bóng đèn nhỏ ở đầu, lơ lửng trên hai đệm hơi thay cho bánh xe. Đôi mắt lim dim lơ đãng. Bên trong mái vòm là ghế nhỏ **để trống**, nắp vòm mở hé. Ngay mép trước buồng lái là **một khẩu súng nòng dài mảnh như cột đèn đồng**, đầu nòng là bóng đèn phát sáng, trên ụ xoay có hai tay cầm quay về ghế, nòng chĩa chéo lên trời phía trước, không đè lên thân. Dáng mềm mại như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 8. Rùa Thành (`rua-thanh`) – máu trâu, dựng tường đất

Tính cách: ông lão điềm đạm, vững như núi.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con rùa già cõng toà lâu đài**: mai rùa là một thành đá nhỏ có tường răng cưa, cửa sổ vòm, rêu và cỏ xanh mọc trên đỉnh, vài bông hoa nhỏ; đầu rùa già hiền từ có râu bạc dài và lông mày rậm, bốn chân to chắc như cột. Trên chòi canh của lâu đài là buồng lái hở với ghế đá nhỏ **để trống**. Ngay mép trước buồng lái là **một khẩu súng cối đá to ngắn có hoa văn gạch**, trên ụ xoay có hai tay cầm quay về ghế, nòng chĩa chéo lên trời phía trước, không đè lên thân. Dáng to bè vững chãi nhưng vẫn dễ thương như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 9. Long Ngư Cơ (`long-ngu-co`, ẩn) – phun lửa

Tính cách: kiêu hãnh, bốc lửa, hiếm gặp.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **cá chép hoá rồng máy**: thân thon có vảy vàng óng xếp lớp, vây và mang màu san hô rực, râu rồng dài uốn lượn, đuôi xoè như ngọn lửa, lơ lửng trên hai động cơ phản lực nhỏ phụt lửa cam. Mắt sắc sảo kiêu hãnh. Trên lưng là buồng lái kiểu yên ngựa với ghế nhỏ **để trống**. Ngay mép trước buồng lái là **một khẩu súng phun lửa hình đầu rồng há miệng**, trên ụ xoay có hai tay cầm quay về ghế, nòng chĩa chéo lên trời phía trước, không đè lên thân. Dáng uyển chuyển như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 10. Kỳ Lân Sắt (`ky-lan-sat`, ẩn) – mạnh nhất, cực hiếm

Tính cách: hiệp sĩ cao quý, oai phong.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con kỳ lân chiến mã bằng sắt**: giáp bạc sáng bóng viền vàng và kem, một sừng xoắn ánh vàng trên trán, bờm là những dải ruy băng san hô bay phấp phới, bốn chân máy chắc khoẻ có móng guốc đồng. Ánh mắt oai phong cao quý. Trên lưng là buồng lái kiểu yên hiệp sĩ với ghế nhỏ **để trống**. Ngay mép trước buồng lái là **một khẩu pháo nòng dài thanh mảnh như ngọn giáo có các vòng vàng**, trên ụ xoay có hai tay cầm quay về ghế, nòng chĩa chéo lên trời phía trước, không đè lên thân. Dáng oai vệ nhưng vẫn dễ thương như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

---

## Sau khi có ảnh

Gửi ảnh vào thread, mình sẽ: xoá nền, tách nòng thành hình riêng, vá chỗ nòng che, thu về 192 px chiều ngang, đo điểm gắn nòng / đầu nòng / chỗ ngồi phi công cho `assets/mobiles/<id>/rig.json`, rồi đưa vào game.
