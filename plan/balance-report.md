# Báo cáo cân bằng

Bản đồ `dao-noi`, bot mức `hard`, 640 ván 1v1 (xoay vòng mọi cặp pháo, 50% lượt có thời tiết), trung bình 6.9 lượt/ván.

Đội Xanh (đi trước theo id) thắng 49% số ván phân thắng bại.

| Pháo | Ván | Thắng | Hoà | Tỷ lệ thắng |
|---|---|---|---|---|
| Ốc Thiết Giáp | 160 | 96 | 0 | 60% |
| Chũi Khoan | 160 | 83 | 0 | 52% |
| Bọ Lôi | 160 | 81 | 0 | 51% |
| Cua Lăn | 160 | 56 | 0 | 35% |
| Diều Hâu Giấy | 160 | 102 | 0 | 64% |
| Nhím Chùm | 160 | 72 | 0 | 45% |
| Sứa Đèn | 160 | 93 | 0 | 58% |
| Rùa Thành | 160 | 57 | 0 | 36% |

**Đối đầu** (hàng thắng cột, chỉ khi hàng ở đội Xanh; ô có ít ván nên nhiễu):

| | Ốc Thiết Giáp | Chũi Khoan | Bọ Lôi | Cua Lăn | Diều Hâu Giấy | Nhím Chùm | Sứa Đèn | Rùa Thành |
|---|---|---|---|---|---|---|---|---|
| Ốc Thiết Giáp | 80% | 40% | 100% | 10% | 20% | 20% | 0% | 90% |
| Chũi Khoan | 50% | 60% | 50% | 60% | 40% | 50% | 60% | 60% |
| Bọ Lôi | 0% | 90% | 90% | 90% | 10% | 40% | 90% | 80% |
| Cua Lăn | 0% | 10% | 10% | 10% | 60% | 60% | 10% | 10% |
| Diều Hâu Giấy | 20% | 30% | 90% | 0% | 100% | 60% | 100% | 90% |
| Nhím Chùm | 40% | 60% | 30% | 40% | 40% | 80% | 30% | 30% |
| Sứa Đèn | 10% | 90% | 100% | 100% | 0% | 50% | 90% | 100% |
| Rùa Thành | 0% | 20% | 10% | 100% | 0% | 70% | 30% | 90% |

## Ghi chú

- Đây là số liệu bot-đấu-bot (mức Khó), chỉ để phát hiện pháo lệch quá xa; bot chưa biết dùng đạn đắp đất (Rùa Thành), lăn quanh vật cản (Cua Lăn) hay đọc gió ngược (Diều Hâu Giấy) tối ưu nên các pháo này có thể bị đánh giá thấp so với người chơi thật.
- Sau 3 vòng chỉnh (máu/sát thương), mọi pháo nằm trong khoảng 35–64%. Lần chạy đầu lệch 18–84%.
- Chạy lại: `npm run balance -- --games 640 --level hard --out plan/balance-report.md` (khoảng 3 phút).
