# 06 – Prompt vẽ xe (mobile) cho Gun Storm

Prompt viết bằng tiếng Việt để bạn dễ sửa. Mỗi xe có **một prompt hoàn chỉnh**, copy dán thẳng vào Dreamina. Nếu Dreamina hiểu tiếng Việt chưa tốt (vẽ sai chi tiết), gửi bản bạn đã sửa vào thread, mình dịch sang tiếng Anh giúp.

Nhắc luật (`03-assets.md`): không đưa tên game/xe thương mại vào prompt, không vẽ "giống hệt" xe của game khác. Lưu prompt vào `assets/source/prompts/xe-<id>.txt`, ghi license vào `assets/CREDITS.json`.

## Cách xe được dùng trong game (để hiểu vì sao prompt viết vậy)

- Xe nhìn **ngang, phẳng 2D, quay mặt sang phải**. Game tự lật khi xe quay trái.
- **Vũ khí là một bộ phận của chính con xe**, đúng với kiểu đạn của nó (đuôi phóng sét, mõm khoan, càng ném bi, miệng phun lửa...), không phải khẩu súng gắn thêm. Bộ phận đó phải là **một khối rời có khớp xoay tròn nhìn rõ**, chĩa chéo lên trời về phía trước, **không đè lên thân**: mình cắt nó ra thành hình riêng và cho xoay theo góc bắn. Dù bộ phận nằm ở đuôi xe thì đầu phóng vẫn phải vòng lên chĩa về phía trước (vì đạn luôn bay về hướng xe quay mặt).
- **Ghế phi công để trống**, có cần điều khiển hoặc dây cương nối tới bộ phận vũ khí. Phi công là hình riêng (để sau này đổi nhân vật, trang phục).
- Hình được thu nhỏ còn khoảng 90 px chiều ngang trong game, nên cần **dáng to, rõ, dễ nhận ra từ xa**; chi tiết li ti sẽ mất.

## Đoạn phong cách chung (đã có sẵn trong từng prompt bên dưới)

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm chiếu từ góc trên bên trái. Bảng màu chính: xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, điểm nhấn san hô #FF7A59. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art. Nền trắng trơn, không bóng đổ dưới đất, không chữ, không logo.

**Ô "negative prompt" (nếu có):** `3D, phối cảnh, góc nghiêng 3/4, isometric, pixel art, người ngồi trong xe, khẩu súng gắn thêm, tháp pháo, chữ, logo, bóng đổ, cảnh nền`

## Gợi ý sửa prompt cho đẹp

- Muốn xe "có hồn": thêm tính cách (*hiền lành, cáu kỉnh, ngái ngủ, hăng máu*) và biểu cảm mắt/miệng.
- Muốn dáng dễ nhận: giữ **1 khối lớn đặc trưng** (vỏ ốc, mai rùa, mái vòm...) chiếm 50–60% hình.
- Muốn đồng bộ cả bộ xe: tạo xe đầu tiên ưng ý, rồi dùng nó làm **ảnh tham chiếu (reference image)** cho các xe sau.
- Nếu AI vẽ người ngồi vào ghế: thêm *"ghế trống, không có ai ngồi"*.
- Nếu ra 3D/nghiêng: nhấn lại *"phẳng 2D, nhìn ngang hoàn toàn, chỉ thấy một bên xích/bánh và một mắt"*.
- Nếu bộ phận vũ khí đè lên thân: thêm *"bộ phận vũ khí chĩa chéo lên trời, tách hẳn khỏi thân xe, khớp xoay nhìn rõ"*.
- Nếu AI vẫn vẽ thêm một khẩu súng: thêm vào negative *"khẩu súng gắn thêm, tháp pháo"*.

---

## 1. Ốc Thiết Giáp (`oc-thiet-giap`) – cân bằng, dễ chơi

Tính cách: hiền lành, chậm mà chắc, "bé ngoan" của dàn xe.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ dễ thương hình **con ốc sên máy**: vỏ ốc xoắn ốc to tròn bằng thép tán đinh, sơn sọc san hô và kem, chiếm hơn nửa thân xe; thân ốc mềm màu xanh lá nhạt bóng mượt, đầu ngóc lên với hai râu mắt, mắt to tròn long lanh, miệng cười hiền. Dưới bụng là một dải xích tank nhỏ màu xám đen. Giữa vỏ ốc và đầu là một buồng lái hở, có một chiếc ghế da nâu nhỏ **để trống** và kính chắn gió thấp. **Vũ khí là chóp xoắn của vỏ ốc**: từ tâm vòng xoắn thò ra một nòng pháo đồng ngắn mập, gắn trên khớp xoay tròn lớn ở giữa vỏ, nòng chĩa chéo lên trời về phía trước, không đè lên thân. Trước ghế có hai cần gạt nối tới khớp xoay. Dáng mũm mĩm như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 2. Chũi Khoan (`chui-khoan`) – phá địa hình, đạn khoan

Tính cách: thợ mỏ lam lũ, hăng hái, lúc nào cũng dính đất.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con chuột chũi máy đào mỏ**: thân tròn trịa ghép từ các tấm thép màu nâu đất lấm lem bùn, đội mũ thợ mỏ vàng có đèn pha nhỏ, hai móng xẻng to bằng thép ở phía trước, đi trên xích tank ngắn, phía sau có ống xả nhả khói. Trên lưng là buồng lái hở với ghế gỗ nhỏ **để trống**. **Vũ khí là chiếc mõm khoan**: cả cái mõm là một mũi khoan xoắn ốc to bằng thép xám sọc san hô, nối với đầu bằng khớp xoay tròn, mõm khoan ngóc chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng hai cần gạt trước ghế. Biểu cảm hăng hái, má lấm bùn. Dáng mũm mĩm như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 3. Bọ Lôi (`bo-loi`) – đạn điện, bào giáp

Tính cách: lanh lợi, tích điện, lúc nào cũng lách tách tia lửa.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con bọ cánh cứng robot**: mai tròn bóng loáng màu xanh trời có sọc vàng chớp, hai râu là cuộn dây đồng phát sáng vàng, vài tia điện nhỏ lách tách quanh râu, sáu chân máy ngắn có khớp tròn. Mắt to lanh lợi. Phía trước mai là buồng lái hở với ghế nhỏ **để trống** và kính chắn gió cong. **Vũ khí là cái bụng đuôi**: phần bụng sau của con bọ là một bầu phóng sét to như cái mỏ lớn, có các vòng đồng và miệng phóng phát sáng vàng chứa sẵn một quả cầu sét; bầu này nối với thân bằng khớp xoay tròn ở đuôi và **cong vòng lên trên lưng như đuôi bọ cạp**, miệng phóng chĩa chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng cần gạt có dây điện nối ra đuôi. Dáng tròn gọn như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 4. Cua Lăn (`cua-lan`) – đạn lăn theo địa hình

Tính cách: ngư dân vạm vỡ, khoẻ mạnh, hơi ngang tàng.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con cua biển cơ khí**: mai cua to bè màu đỏ san hô có đốm kem, bụng tấm giáp màu kem, chân cua ngắn gắn bánh xe tròn, có vài con hàu và dây thừng quấn trên mai như vừa đi biển về. Hai mắt cua thò lên trên cuống, nhìn ngang tàng. Trên mai là buồng lái hở với ghế nhỏ **để trống**. **Vũ khí là chiếc càng khổng lồ**: càng cua là cánh tay máy ném bi, gắn vào vai bằng khớp xoay tròn, đang kẹp một viên bi đá tròn, càng giơ chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng hai cần gạt trước ghế. Dáng chắc nịch như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 5. Diều Hâu Giấy (`dieu-hau-giay`) – đạn đi ngược gió

Tính cách: nhẹ nhàng, bay bổng, mơ mộng.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con diều hâu làm bằng giấy và tre**: khung tre mảnh buộc dây, đôi cánh diều giấy gấp nếp màu kem và xanh trời xếp gọn hai bên, mắt to tinh nghịch trên đầu, đuôi diều dài có tua vải san hô bay phấp phới, phía sau gắn chong chóng giấy nhỏ, đi trên hai bánh xe gỗ có nan. Giữa thân là ghế gỗ nhỏ **để trống** dưới đôi cánh. **Vũ khí là cái đầu chim**: cổ và đầu diều hâu là một cây nỏ tre, mỏ chim là miệng nỏ đang ngậm một phi tiêu giấy gấp, cổ nối thân bằng khớp xoay tròn, đầu ngẩng chéo lên trời về phía trước, không đè lên thân. Phi công cầm dây cương nối tới cổ chim. Dáng nhẹ, thanh thoát như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 6. Nhím Chùm (`nhim-chum`) – chùm gai tỏa 5 hướng

Tính cách: robot nhỏ hay cáu, xù gai khi tức.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con nhím robot tròn vo**: thân tròn như quả bóng phủ đầy gai kim loại ngắn đầu bo tròn màu xám thép, đầu gai sơn san hô, mặt nạ màu kem với đôi mắt cau có cáu kỉnh dễ thương và má phồng, đi trên xích tank ngắn. Trên đỉnh, giữa đám gai, là một nắp hầm tròn mở ra thành buồng lái với ghế nhỏ **để trống**. **Vũ khí là chùm gai trên lưng**: phía sau buồng lái là một bó năm ống gai to xếp toả như bông hoa, đầu gai san hô, cả bó gắn trên khớp xoay tròn, chĩa chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng cần gạt trước ghế. Dáng tròn xoe như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 7. Sứa Đèn (`sua-den`) – đạn chậm, xuyên đất mỏng

Tính cách: nhà khoa học lập dị, lơ đãng, phát sáng lung linh.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con sứa đèn lồng**: mái vòm kính trong suốt hình chuông sứa, bên trong toả ánh sáng xanh ngọc dịu, khung đồng thau có đinh tán, mép chuông gợn sóng, bên dưới thòng xuống những xúc tu là dây cáp mềm có bóng đèn nhỏ ở đầu, lơ lửng trên hai đệm hơi thay cho bánh xe. Đôi mắt lim dim lơ đãng. Bên trong mái vòm là ghế nhỏ **để trống**, nắp vòm mở hé. **Vũ khí là một xúc tu dài nhất**: xúc tu này cứng như cần câu bằng đồng, gốc gắn vào mép chuông bằng khớp xoay tròn, cong lên và chĩa chéo lên trời về phía trước, đầu xúc tu là một chiếc đèn lồng phát sáng chứa quả cầu ánh sáng, không đè lên thân. Phi công điều khiển bằng cần gạt trong vòm. Dáng mềm mại như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 8. Rùa Thành (`rua-thanh`) – máu trâu, dựng tường đất

Tính cách: ông lão điềm đạm, vững như núi.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con rùa già cõng toà lâu đài**: mai rùa là một thành đá nhỏ có tường răng cưa, cửa sổ vòm, rêu và cỏ xanh mọc trên đỉnh, vài bông hoa nhỏ; đầu rùa già hiền từ có râu bạc dài và lông mày rậm, bốn chân to chắc như cột. Ở cổng lâu đài phía trước là buồng lái hở với ghế đá nhỏ **để trống**. **Vũ khí là tháp canh của lâu đài**: tháp tròn trên đỉnh mai là một máy bắn đá, cánh tay gỗ to có gầu đựng tảng đá, gắn trên khớp xoay tròn, chĩa chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng cần gạt có xích nối lên tháp. Dáng to bè vững chãi nhưng vẫn dễ thương như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 9. Long Ngư Cơ (`long-ngu-co`, ẩn) – phun lửa

Tính cách: kiêu hãnh, bốc lửa, hiếm gặp.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **cá chép hoá rồng máy**: thân thon có vảy vàng óng xếp lớp, vây và mang màu san hô rực, râu rồng dài uốn lượn, đuôi xoè như ngọn lửa, lơ lửng trên hai động cơ phản lực nhỏ phụt lửa cam. Mắt sắc sảo kiêu hãnh. Trên lưng là buồng lái kiểu yên ngựa với ghế nhỏ **để trống**. **Vũ khí là cái đầu rồng**: đầu cá chép hoá rồng há miệng phun lửa, có lửa cam le lói trong họng, nối với thân bằng khớp cổ xoay tròn, đầu ngẩng chéo lên trời về phía trước, không đè lên thân. Phi công cầm dây cương nối tới đầu rồng. Dáng uyển chuyển như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 10. Kỳ Lân Sắt (`ky-lan-sat`, ẩn) – mạnh nhất, cực hiếm

Tính cách: hiệp sĩ cao quý, oai phong.

> Phong cách game 2D vẽ tay tươi sáng vui nhộn, nét viền đen đậm và sạch, tô màu phẳng kiểu hoạt hình với chuyển màu nhẹ, ánh sáng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Một chiếc xe pháo nhỏ hình **con kỳ lân chiến mã bằng sắt**: giáp bạc sáng bóng viền vàng và kem, bờm là những dải ruy băng san hô bay phấp phới, bốn chân máy chắc khoẻ có móng guốc đồng. Ánh mắt oai phong cao quý. Trên lưng là buồng lái kiểu yên hiệp sĩ với ghế nhỏ **để trống**. **Vũ khí là cái đầu và chiếc sừng**: đầu kỳ lân nối với cổ bằng khớp xoay tròn, chiếc sừng xoắn vàng dài như ngọn giáo là nòng phóng năng lượng, đầu ngẩng chéo lên trời về phía trước, không đè lên thân. Phi công cầm dây cương nối tới đầu. Dáng oai vệ nhưng vẫn dễ thương như đồ chơi, vừa khung 4:3. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, nền trắng trơn, không bóng đổ, không chữ, không logo.

---

## Sau khi có ảnh

Gửi ảnh vào thread, mình sẽ: xoá nền, tách bộ phận vũ khí thành hình riêng, vá chỗ nó che, thu về 192 px chiều ngang, đo khớp xoay / miệng phóng / chỗ ngồi phi công cho `assets/mobiles/<id>/rig.json`, rồi đưa vào game.
