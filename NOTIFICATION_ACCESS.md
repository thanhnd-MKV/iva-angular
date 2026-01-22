# 🔔 Cách truy cập Notification Test

## Cách nhanh nhất:

Mở browser và truy cập trực tiếp:
```
http://localhost:4200/notification-test
```

## Hoặc từ browser console:

Mở DevTools (F12) và chạy:
```javascript
window.location.href = '/notification-test';
```

## Giao diện có sẵn:

✅ **Connect với Fake Data** - Test ngay không cần backend
✅ **Connect thật (Real API)** - Kết nối với server
✅ **Disconnect** - Ngắt kết nối
✅ **Clear Notifications** - Xóa tất cả thông báo

## Sau khi truy cập:

1. Click nút **"Connect với Fake Data"**
2. Sau 8-12 giây sẽ bắt đầu nhận thông báo giả
3. Xem notifications hiển thị realtime
4. Toast notification sẽ popup ở góc màn hình

---

**Lưu ý**: Icon thông báo trên header hiện đang là placeholder "Under Development". Route `/notification-test` là trang riêng để test tính năng SSE Multi Notification mới.
