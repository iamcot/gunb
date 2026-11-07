# 06 – Prompt vẽ xe (mobile) cho Gun Storm

Prompt viết bằng tiếng Việt để bạn dễ sửa. Mỗi xe có **một prompt hoàn chỉnh**, copy dán thẳng vào Dreamina. Nếu Dreamina hiểu tiếng Việt chưa tốt (vẽ sai chi tiết), gửi bản bạn đã sửa vào thread, mình dịch sang tiếng Anh giúp.

Nhắc luật (`03-assets.md`): không đưa tên game/xe thương mại vào prompt, không vẽ "giống hệt" xe của game khác. Lưu prompt vào `assets/source/prompts/xe-<id>.txt`, ghi license vào `assets/CREDITS.json`.

## Cách xe được dùng trong game (để hiểu vì sao prompt viết vậy)

- Xe nhìn **ngang, phẳng 2D, quay mặt sang phải**. Game tự lật khi xe quay trái.
- **Vũ khí là một bộ phận của chính con xe**, đúng với kiểu đạn của nó (đuôi phóng sét, mõm khoan, càng ném bi, miệng phun lửa...), không phải khẩu súng gắn thêm. Bộ phận đó phải là **một khối rời có khớp xoay tròn nhìn rõ**, chĩa chéo lên trời về phía trước, **không đè lên thân**: mình cắt nó ra thành hình riêng và cho xoay theo góc bắn. Dù bộ phận nằm ở đuôi xe thì đầu phóng vẫn phải vòng lên chĩa về phía trước (vì đạn luôn bay về hướng xe quay mặt).
- **Ghế phi công để trống**, có cần điều khiển hoặc dây cương nối tới bộ phận vũ khí. Phi công là hình riêng (để sau này đổi nhân vật, trang phục).
- Hình được thu nhỏ còn khoảng 90 px chiều ngang trong game, nên cần **dáng to, rõ, dễ nhận ra từ xa**; chi tiết li ti sẽ mất.

## Đoạn phong cách chung (đã có sẵn trong từng prompt bên dưới)

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. ... Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

Style này cố ý khớp với ảnh nền map Đảo nổi (anime vẽ tay, màu nước), nhưng giữ viền đậm để xe không bị chìm vào nền khi nhỏ.

**Ô "negative prompt" (nếu có):** `3D, phối cảnh, góc nghiêng 3/4, isometric, pixel art, ô vuông pixel, ảnh 3D render, người ngồi trong xe, khẩu súng gắn thêm, tháp pháo, chữ, logo, bóng đổ, cảnh nền`

## Gợi ý sửa prompt cho đẹp

- Muốn xe "có hồn": thêm tính cách (*hiền lành, cáu kỉnh, ngái ngủ, hăng máu*) và biểu cảm mắt/miệng.
- Nếu vũ khí to át cả thân: thêm *"vũ khí không lớn hơn thân"*. Nếu vũ khí bé tí: thêm *"vũ khí to hầm hố, dài gần bằng thân xe, là điểm nhấn số một"* và **đưa câu mô tả vũ khí lên ngay đầu prompt** (AI coi trọng chữ ở đầu hơn).
- Nếu vũ khí chĩa ra sau: thêm *"miệng phóng chĩa về phía trước bên phải, cùng hướng với mặt xe"*.
- Muốn dáng dễ nhận: giữ **1 khối lớn đặc trưng** (vỏ ốc, mai rùa, mái vòm...) chiếm 50–60% hình.
- Muốn đồng bộ cả bộ xe: tạo xe đầu tiên ưng ý, rồi dùng nó làm **ảnh tham chiếu (reference image)** cho các xe sau.
- Nếu AI vẽ người ngồi vào ghế: thêm *"ghế trống, không có ai ngồi"*.
- Nếu ra 3D/nghiêng: nhấn lại *"phẳng 2D, nhìn ngang hoàn toàn, chỉ thấy một bên xích/bánh và một mắt"*.
- Nếu bộ phận vũ khí đè lên thân: thêm *"bộ phận vũ khí chĩa chéo lên trời, tách hẳn khỏi thân xe, khớp xoay nhìn rõ"*.
- Nếu AI vẫn vẽ thêm một khẩu súng: thêm vào negative *"khẩu súng gắn thêm, tháp pháo"*.

---

## 1. Ốc Thiết Giáp (`oc-thiet-giap`) – cân bằng, dễ chơi

Tính cách: hiền lành, chậm mà chắc, "bé ngoan" của dàn xe.

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ dễ thương hình **con ốc sên máy**: vỏ ốc xoắn ốc to tròn bằng thép tán đinh, sơn sọc san hô và kem, chiếm hơn nửa thân xe; thân ốc mềm màu xanh lá nhạt bóng mượt, đầu ngóc lên với hai râu mắt, mắt to tròn long lanh, miệng cười hiền. Dưới bụng là một dải xích tank nhỏ màu xám đen. Giữa vỏ ốc và đầu là một buồng lái hở, có một chiếc ghế da nâu nhỏ **để trống** và kính chắn gió thấp. **Vũ khí là chóp xoắn của vỏ ốc**: từ tâm vòng xoắn thò ra một nòng pháo đồng ngắn mập, gắn trên khớp xoay tròn lớn ở giữa vỏ, nòng chĩa chéo lên trời về phía trước, không đè lên thân. Trước ghế có hai cần gạt nối tới khớp xoay. Dáng mũm mĩm như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 2. Chũi Khoan (`chui-khoan`) – phá địa hình, đạn khoan

Tính cách: thợ mỏ lam lũ, hăng hái, lúc nào cũng dính đất.

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ hình **con chuột chũi máy đào mỏ**: thân tròn trịa ghép từ các tấm thép màu nâu đất lấm lem bùn, đội mũ thợ mỏ vàng có đèn pha nhỏ, hai móng xẻng to bằng thép ở phía trước, đi trên xích tank ngắn, phía sau có ống xả nhả khói. Trên lưng là buồng lái hở với ghế gỗ nhỏ **để trống**. **Vũ khí là chiếc mõm khoan**: cả cái mõm là một mũi khoan xoắn ốc to bằng thép xám sọc san hô, nối với đầu bằng khớp xoay tròn, mõm khoan ngóc chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng hai cần gạt trước ghế. Biểu cảm hăng hái, má lấm bùn. Dáng mũm mĩm như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 3. Bọ Lôi (`bo-loi`) – đạn điện, bào giáp

Tính cách: lanh lợi, tích điện, lúc nào cũng lách tách tia lửa.

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ hình **con bọ cánh cứng robot**: mai tròn bóng loáng màu xanh trời có sọc vàng chớp, hai râu là cuộn dây đồng phát sáng vàng, vài tia điện nhỏ lách tách quanh râu, sáu chân máy ngắn có khớp tròn. Mắt to lanh lợi. Phía trước mai là buồng lái hở với ghế nhỏ **để trống** và kính chắn gió cong. **Vũ khí là cái bụng đuôi**: phần bụng sau của con bọ là một bầu phóng sét to như cái mỏ lớn, có các vòng đồng và miệng phóng phát sáng vàng chứa sẵn một quả cầu sét; bầu này nối với thân bằng khớp xoay tròn ở đuôi và **cong vòng lên trên lưng như đuôi bọ cạp**, miệng phóng chĩa chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng cần gạt có dây điện nối ra đuôi. Dáng tròn gọn như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 4. Cua Lăn (`cua-lan`) – đạn lăn theo địa hình

Tính cách: ngư dân vạm vỡ, khoẻ mạnh, hơi ngang tàng.

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ hình **con cua biển cơ khí**: mai cua to bè màu đỏ san hô có đốm kem, bụng tấm giáp màu kem, chân cua ngắn gắn bánh xe tròn, có vài con hàu và dây thừng quấn trên mai như vừa đi biển về. Hai mắt cua thò lên trên cuống, nhìn ngang tàng. Trên mai là buồng lái hở với ghế nhỏ **để trống**. **Vũ khí là chiếc càng khổng lồ**: càng cua là cánh tay máy ném bi, gắn vào vai bằng khớp xoay tròn, đang kẹp một viên bi đá tròn, càng giơ chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng hai cần gạt trước ghế. Dáng chắc nịch như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 5. Diều Hâu Giấy (`dieu-hau-giay`) – đạn đi ngược gió

Tính cách: nhẹ nhàng, bay bổng, mơ mộng.

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ hình **con diều hâu làm bằng giấy và tre**: khung tre mảnh buộc dây, đôi cánh diều giấy gấp nếp màu kem và xanh trời xếp gọn hai bên, mắt to tinh nghịch trên đầu, đuôi diều dài có tua vải san hô bay phấp phới, phía sau gắn chong chóng giấy nhỏ, đi trên hai bánh xe gỗ có nan. Giữa thân là ghế gỗ nhỏ **để trống** dưới đôi cánh. **Vũ khí là cái đầu chim**: cổ và đầu diều hâu là một cây nỏ tre, mỏ chim là miệng nỏ đang ngậm một phi tiêu giấy gấp, cổ nối thân bằng khớp xoay tròn, đầu ngẩng chéo lên trời về phía trước, không đè lên thân. Phi công cầm dây cương nối tới cổ chim. Dáng nhẹ, thanh thoát như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 6. Nhím Chùm (`nhim-chum`) – chùm gai tỏa 5 hướng

Tính cách: robot nhỏ hay cáu, xù gai khi tức.

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ hình **con nhím robot tròn vo**: thân tròn như quả bóng phủ đầy gai kim loại ngắn đầu bo tròn màu xám thép, đầu gai sơn san hô, mặt nạ màu kem với đôi mắt cau có cáu kỉnh dễ thương và má phồng, đi trên xích tank ngắn. Trên đỉnh, giữa đám gai, là một nắp hầm tròn mở ra thành buồng lái với ghế nhỏ **để trống**. **Vũ khí là chùm gai trên lưng**: phía sau buồng lái là một bó năm ống gai to xếp toả như bông hoa, đầu gai san hô, cả bó gắn trên khớp xoay tròn, chĩa chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng cần gạt trước ghế. Dáng tròn xoe như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 7. Sứa Đèn (`sua-den`) – đạn chậm, xuyên đất mỏng

Tính cách: nhà khoa học lập dị, lơ đãng, phát sáng lung linh.

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ hình **con sứa đèn lồng**: mái vòm kính trong suốt hình chuông sứa, bên trong toả ánh sáng xanh ngọc dịu, khung đồng thau có đinh tán, mép chuông gợn sóng, bên dưới thòng xuống những xúc tu là dây cáp mềm có bóng đèn nhỏ ở đầu, lơ lửng trên hai đệm hơi thay cho bánh xe. Đôi mắt lim dim lơ đãng. Bên trong mái vòm là ghế nhỏ **để trống**, nắp vòm mở hé. **Vũ khí là một xúc tu dài nhất**: xúc tu này cứng như cần câu bằng đồng, gốc gắn vào mép chuông bằng khớp xoay tròn, cong lên và chĩa chéo lên trời về phía trước, đầu xúc tu là một chiếc đèn lồng phát sáng chứa quả cầu ánh sáng, không đè lên thân. Phi công điều khiển bằng cần gạt trong vòm. Dáng mềm mại như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 8. Rùa Thành (`rua-thanh`) – máu trâu, dựng tường đất

Tính cách: ông lão điềm đạm, vững như núi.

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ hình **con rùa già cõng toà lâu đài**: mai rùa là một thành đá nhỏ có tường răng cưa, cửa sổ vòm, rêu và cỏ xanh mọc trên đỉnh, vài bông hoa nhỏ; đầu rùa già hiền từ có râu bạc dài và lông mày rậm, bốn chân to chắc như cột. Ở cổng lâu đài phía trước là buồng lái hở với ghế đá nhỏ **để trống**. **Vũ khí là tháp canh của lâu đài**: tháp tròn trên đỉnh mai là một máy bắn đá, cánh tay gỗ to có gầu đựng tảng đá, gắn trên khớp xoay tròn, chĩa chéo lên trời về phía trước, không đè lên thân. Phi công điều khiển bằng cần gạt có xích nối lên tháp. Dáng to bè vững chãi nhưng vẫn dễ thương như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

## Cú Thiên Văn (`cu-thien-van`) – gọi vệ tinh bắn laser

Prompt xe, đạn, vệ tinh và âm thanh gom riêng ở `plan/15-prompt-cu-thien-van.md`.

## 9. Long Ngư Cơ (`long-ngu-co`, ẩn) – phun lửa

Tính cách: kiêu hãnh, bốc lửa, hiếm gặp.

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ hình **cá chép hoá rồng máy**: thân thon có vảy vàng óng xếp lớp, vây và mang màu san hô rực, râu rồng dài uốn lượn, đuôi xoè như ngọn lửa, lơ lửng trên hai động cơ phản lực nhỏ phụt lửa cam. Mắt sắc sảo kiêu hãnh. Trên lưng là buồng lái kiểu yên ngựa với ghế nhỏ **để trống**. **Vũ khí là cái đầu rồng**: đầu cá chép hoá rồng há miệng phun lửa, có lửa cam le lói trong họng, nối với thân bằng khớp cổ xoay tròn, đầu ngẩng chéo lên trời về phía trước, không đè lên thân. Phi công cầm dây cương nối tới đầu rồng. Dáng uyển chuyển như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

## 10. Kỳ Lân Sắt (`ky-lan-sat`, ẩn) – mạnh nhất, cực hiếm

Tính cách: hiệp sĩ cao quý, oai phong.

> Tranh minh hoạ game 2D phong cách anime vẽ tay như phim hoạt hình Nhật, màu nước mềm và trong trẻo, đổ bóng cel hai tầng, nét viền nâu sẫm rõ ràng và đủ dày để vẫn nhìn rõ khi thu nhỏ, ánh nắng ấm từ góc trên bên trái, bảng màu xanh trời #6FB2E8, xanh cỏ #46A843, nâu đất #7A5233, kem #F6E7C8, san hô #FF7A59. Xe là một linh vật đáng yêu tỉ lệ chibi, dáng khối lớn rõ ràng dễ nhận từ xa. Một chiếc xe pháo nhỏ hình **con kỳ lân chiến mã bằng sắt**: giáp bạc sáng bóng viền vàng và kem, bờm là những dải ruy băng san hô bay phấp phới, bốn chân máy chắc khoẻ có móng guốc đồng. Ánh mắt oai phong cao quý. Trên lưng là buồng lái kiểu yên hiệp sĩ với ghế nhỏ **để trống**. **Vũ khí là cái đầu và chiếc sừng**: đầu kỳ lân nối với cổ bằng khớp xoay tròn, chiếc sừng xoắn vàng dài như ngọn giáo là nòng phóng năng lượng, đầu ngẩng chéo lên trời về phía trước, không đè lên thân. Phi công cầm dây cương nối tới đầu. Dáng oai vệ nhưng vẫn dễ thương như đồ chơi, vừa khung 4:3. Tỉ lệ: bộ phận vũ khí to, hầm hố, là điểm nhấn số một của hình, dài gần bằng thân xe; chĩa chéo lên về phía trước bên phải. Hình 2D phẳng, nhìn ngang đúng một bên, quay mặt sang phải, không phối cảnh, không 3D, không pixel art, không ô vuông pixel, nền trắng trơn, không bóng đổ, không chữ, không logo.

---

## Sau khi có ảnh

Gửi ảnh vào thread, mình sẽ: xoá nền, tách bộ phận vũ khí thành hình riêng, vá chỗ nó che, thu về 192 px chiều ngang, đo khớp xoay / miệng phóng / chỗ ngồi phi công cho `assets/mobiles/<id>/rig.json`, rồi đưa vào game.

---

# Prompt tiếng Anh (dùng cái này nếu Dreamina hiểu tiếng Việt kém)

AI tạo ảnh hiểu tiếng Anh tốt hơn nhiều. **Nên dùng ChatGPT (tạo ảnh), trong cùng cuộc chat đã ra con Bọ Lôi** để giữ đúng style (câu đầu mỗi prompt yêu cầu giống style con bọ). Nếu tạo ở chat mới thì đính kèm ảnh con bọ làm mẫu. Mỗi prompt xếp theo thứ tự quan trọng: **góc nhìn → vũ khí (to) → thân → buồng lái → style**. Sửa phần mô tả thì giữ nguyên thứ tự này.

**Negative prompt (dùng chung):**
```
3d render, three-quarter view, perspective, isometric, front view, pixel art, person, pilot, human face on cockpit, small weapon, extra gun turret, text, watermark, background scenery, ground shadow
```

**Đuôi style (đã có ở cuối mỗi prompt):** `Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.`

### 1. Ốc Thiết Giáp
```
Same art style, line weight, palette and camera as the robot beetle image. 2D game sprite, pure side view facing right, flat orthographic profile, whole vehicle visible, compact chunky proportions. Its weapon is a BIG, thick, clearly visible brass cannon mounted on top of the spiral shell on a large round golden pivot joint: the barrel is as long as the shell is wide, wider than the snail's head, with riveted bands and a dark muzzle, pointing forward to the right and slightly up, drawn in pure side profile. A chibi mech vehicle shaped like a mechanical snail. Big riveted spiral metal shell striped coral and cream, soft light-green snail body, head raised with two eye stalks and big friendly eyes, no human face, small tank tread underneath. Small open cockpit between the shell and the head with an empty brown seat and two red-knob control levers. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

### 2. Chũi Khoan
```
Same art style, line weight, palette and camera as the robot beetle image. 2D game sprite, pure side view facing right, flat orthographic profile, whole vehicle visible, compact chunky proportions. Its weapon is its snout: a BIG spiral drill launcher, steel grey with coral stripes, as long as half the body, attached to the head by a large round golden pivot joint, pointing forward to the right on the same horizontal axis as the body, drawn in pure side profile. A chibi mech vehicle shaped like a mining mole. Chubby body of muddy earth-brown riveted metal plates, yellow miner helmet with a small headlamp, big shovel claws, short tank treads, exhaust pipe puffing smoke at the back, eager eyes, no human face. Small open cockpit on its back with an empty wooden seat and two red-knob control levers. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

### 3. Bọ Lôi
Xe này **quay đít về phía địch khi bắn**: miệng phóng ở ngay đít, sát thân, cùng trục ngang với đầu (đối xứng với đầu qua thân).
```
2D game sprite, strict side view facing right, flat orthographic profile, whole vehicle visible. A chibi mech vehicle shaped like a robot beetle that fires from its rear end. At the very back of the body, hugging the abdomen with NO tail, sits a big round golden cup launcher holding a crackling glowing yellow lightning orb, opening straight backward to the left, exactly level with the head on the same horizontal axis, mirroring the head on the opposite end of the body, mounted on a large round golden pivot joint. Glossy sky-blue shell with big yellow lightning-bolt stripes, two copper coil antennae with gold ball tips and small sparks, six chunky mechanical legs, insect head with mandibles and big clever eye, no human face. Small open cockpit on top of the shell with an empty brown seat and two red-knob control levers. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

### 4. Cua Lăn
```
Same art style, line weight, palette and camera as the robot beetle image. 2D game sprite, pure side view facing right, flat orthographic profile, whole vehicle visible, compact chunky proportions. Its weapon is one BIG mechanical claw, as long as the body, attached to the front shoulder by a large round golden pivot joint, holding a round grey stone ball in its pincers, pointing forward to the right and slightly up, drawn in pure side profile. A chibi mech vehicle shaped like a sea crab. Wide coral-red riveted shell with cream spots, cream belly armor, short crab legs ending in small wheels, a few barnacles and a coil of rope on the shell, two eye stalks with a tough confident look, no human face. Small open cockpit on top of the shell with an empty brown seat and two red-knob control levers. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

### 5. Diều Hâu Giấy
```
Same art style, line weight, palette and camera as the robot beetle image. 2D game sprite, pure side view facing right, flat orthographic profile, whole vehicle visible, compact chunky proportions. Its weapon is its head and neck: a BIG bamboo crossbow shaped like a hawk head, as long as half the body, the beak holding a folded paper dart, attached to the body by a large round golden pivot joint, pointing forward to the right and slightly up, drawn in pure side profile. A chibi vehicle shaped like a hawk made of paper and bamboo. Light bamboo frame tied with string, folded paper kite wings in cream and sky blue tucked at the sides, long kite tail with coral ribbons, small paper pinwheel at the back, two spoked wooden wheels, sharp playful eye. Open wooden seat in the middle under the wings, empty, with reins leading to the neck. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

### 6. Nhím Chùm
```
Same art style, line weight, palette and camera as the robot beetle image. 2D game sprite, pure side view facing right, flat orthographic profile, whole vehicle visible, compact chunky proportions. Its weapon is a BIG bundle of five thick spike launcher tubes fanned out like a flower, coral tips, as long as half the body, on a large round golden pivot joint on top of its back, pointing forward to the right and slightly up, drawn in pure side profile. A chibi mech vehicle shaped like a round robot hedgehog. Ball-shaped body covered in short rounded steel spikes with coral tips, cream face plate, grumpy frowning eyes, no human face, short tank treads. Small round open hatch cockpit on top behind the launcher with an empty brown seat and a red-knob control lever. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

### 7. Sứa Đèn
```
Same art style, line weight, palette and camera as the robot beetle image. 2D game sprite, pure side view facing right, flat orthographic profile, whole vehicle visible, compact chunky proportions. Its weapon is one BIG stiff brass tentacle arm, as long as the body, attached to the front rim of the bell by a large round golden pivot joint, ending in a big glowing lantern holding a ball of light, pointing forward to the right and slightly up, drawn in pure side profile. A chibi vehicle shaped like a jellyfish lantern. Transparent glass bell dome glowing soft teal inside, riveted brass frame, wavy rim, short dangling cable tentacles with tiny bulbs, floating on two hover pads, sleepy eyes on the brass frame, no human face. Empty brown seat inside the glass dome with a red-knob control lever, dome hatch half open. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

### 8. Rùa Thành
```
Same art style, line weight, palette and camera as the robot beetle image. 2D game sprite, pure side view facing right, flat orthographic profile, whole vehicle visible, compact chunky proportions. Its weapon is a BIG catapult arm rising from the castle tower, as long as the body, with a bucket holding a boulder, on a large round golden pivot joint on top of the castle, pointing forward to the right and slightly up, drawn in pure side profile. A chibi vehicle shaped like an old tortoise carrying a small stone castle on its back. Stone castle shell with crenellated walls, arched windows, moss, grass and tiny flowers on top, old wise tortoise head with long white beard and bushy eyebrows, four thick pillar legs, no human face. Small open cockpit at the castle gate in front with an empty stone seat and a chain lever. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

### 9. Long Ngư Cơ
```
Same art style, line weight, palette and camera as the robot beetle image. 2D game sprite, pure side view facing right, flat orthographic profile, whole vehicle visible, compact chunky proportions. Its weapon is its BIG dragon head with a wide open fire-breathing mouth glowing orange, as large as half the body, attached by a large round golden neck pivot joint, pointing forward to the right and slightly up, drawn in pure side profile. A chibi mech vehicle shaped like a golden carp turning into a dragon. Sleek body with layered golden scales, bright coral fins, long flowing whiskers, flame-shaped tail, hovering on two small jet engines with orange flames, proud sharp eye. Saddle-style open cockpit on the back with an empty brown seat and reins leading to the head. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```

### 10. Kỳ Lân Sắt
```
Same art style, line weight, palette and camera as the robot beetle image. 2D game sprite, pure side view facing right, flat orthographic profile, whole vehicle visible, compact chunky proportions. Its weapon is a BIG spiral golden horn shaped like a jousting lance, as long as the body, on the head, the head attached by a large round golden neck pivot joint, pointing forward to the right and slightly up, drawn in pure side profile. A chibi mech vehicle shaped like an iron unicorn war horse. Polished silver armor with gold and cream trim, mane of flowing coral ribbons, four strong mechanical legs with brass hooves, noble heroic eye. Knight saddle cockpit on the back with an empty brown seat and reins leading to the head. Hand-painted anime game art, soft watercolor shading, two-tone cel shading, thick dark brown outlines, warm light from top-left, palette sky blue #6FB2E8, grass green #46A843, earth brown #7A5233, cream #F6E7C8, coral #FF7A59. Plain white background, no shadow, no text, no logo.
```
