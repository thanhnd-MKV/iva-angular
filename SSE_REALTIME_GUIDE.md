# SSE Real-time Data Update Guide

## Tổng quan
Component `doi-tuong-nhan-dien` (Đối tượng nhận diện) sử dụng **SSEService** để nhận dữ liệu real-time từ backend qua SSE (Server-Sent Events).

## Cách hoạt động

### 1. SSEService
Sử dụng service có sẵn tại `src/app/core/services/sse.service.ts`:
- Quản lý EventSource connections
- Auto-reconnection khi mất kết nối
- Support multiple SSE channels
- NgZone integration để đảm bảo change detection

### 2. Khởi tạo SSE Connection
- Khi component được khởi tạo (`ngOnInit`), kết nối đến SSE channel `objectRecognition`
- Endpoint: `${apiUrl}/api/admin/notification/sse/connect?name=objectRecognition`
- SSEService tự động handle reconnection

### 2. Nhận dữ liệu real-time
- Backend gửi data mới qua SSE stream
- Data format: JSON theo cấu trúc `BeDataResponse`
```typescript
interface BeDataResponse {
  success: boolean;
  code: string;
  message: string | null;
  data: {
    age_range: { [key: string]: number };
    gender: { [hour: string]: { Female?: number; Male?: number; Unknown?: number } };
    complexion: { [hour: string]: { White?: number; Black?: number; Asian?: number; ... } };
  };
}
```

### 3. Cập nhật Charts
- Khi nhận data mới, method `updateChartsFromRealTimeData()` được gọi
- Charts được update trực tiếp qua chart instances (không re-render)
- Change detection được trigger để cập nhật UI

### 4. SSEService Features
- ✅ Auto-reconnection khi mất kết nối (5s delay)
- ✅ Multiple SSE channels support
- ✅ NgZone integration
- ✅ Proper cleanup on disconnect
- ✅ Connection status tracking

### 5. Filter Changes
- Hiện tại: SSE sử dụng single channel cho tất cả statistics
- Filter-specific data được load qua HTTP API (`loadHumanStatistics()`)
- Nếu backend hỗ trợ filter-specific SSE channels trong tương lai, có thể enable reconnection logic

## Code Changes

### Các thay đổi chính:
1. ✅ Sử dụng SSEService có sẵn thay vì tự implement EventSource
2. ✅ Xóa fake data stream và UI toggle button
3. ✅ Subscribe đến SSE channel `objectRecognition`
4. ✅ Tích hợp với existing real-time update methods
5. ✅ Cleanup proper với Subscription.unsubscribe()

### Properties mới:
```typescript
private sseSubscription: Subscription | null = null;
private readonly SSE_CHANNEL = 'objectRecognition';
```

### Methods mới:
- `connectSSE()`: Subscribe đến SSE channel qua SSEService
- `disconnectSSE()`: Unsubscribe và cleanup
- `handleSSEData()`: Xử lý data từ SSE
- `reconnectSSEWithFilters()`: Placeholder cho filter-specific reconnection

### Injected Services:
```typescript
constructor(
  private sseService: SSEService,
  // ... other services
) {}
```

## Backend Requirements

Backend SSE endpoint đã được implement tại:
```
GET /api/admin/notification/sse/connect?name={channelName}
```

Channels hỗ trợ:
- `objectRecognition` - Nhận diện đối tượng (human statistics)
- `trafficIn` - Lưu lượng vào
- `trafficOut` - Lưu lượng ra  
- `trafficViolation` - Vi phạm giao thông

Response format:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"success": true, "data": {...}}
```

## Testing

### 1. Kiểm tra SSE connection:
Mở DevTools → Network → Filter "sse" hoặc "connect"

### 2. Console logs:
- `🔌 Connecting to SSE channel: objectRecognition` - Đang connect
- `✅ SSE Connected: objectRecognition` - Đã connect thành công (từ SSEService)
- `📨 SSE Message [objectRecognition]: [data]` - Nhận được data mới
- `📊 Processing SSE data:` - Đang xử lý data
- `❌ SSE Error [objectRecognition]:` - Lỗi connection
- `🔄 SSE Reconnecting [objectRecognition] in 5s...` - Đang reconnect

### 3. Test reconnection:
- Tắt backend server → SSEService sẽ tự động reconnect sau 5s
- Check console logs để thấy reconnection attempts

### 4. Debug SSEService:
```typescript
// Check connection status
sseService.isConnected('objectRecognition')

// Manual disconnect
sseService.disconnect('objectRecognition')

// Disconnect all channels
sseService.disconnectAll()
```

## Lợi ích của SSE

✅ **Efficiency**: Chỉ server push data khi có thay đổi, không cần polling  
✅ **Real-time**: Data được cập nhật ngay lập tức  
✅ **Auto-reconnect**: Tự động kết nối lại khi mất kết nối  
✅ **Standard Protocol**: Sử dụng HTTP standard, dễ implement  
✅ **Browser Support**: Hỗ trợ rộng rãi trên các browsers  

## Migration từ Fake Data

❌ **Removed**:
- `useFakeData` flag
- Fake data toggle button trong UI
- `generateFakeData()` method
- `getTimeMultiplier()` method
- `startFakeDataStream()` method
- `stopFakeDataStream()` method
- `startFakeDataStreamManually()` method
- Custom EventSource implementation
- Custom reconnection logic

✅ **Replaced with**:
- SSEService injection
- Subscription to `objectRecognition` channel
- SSEService built-in reconnection (5s delay)
- Clean RxJS subscription management

## Troubleshooting

### SSE không connect:
1. Kiểm tra backend endpoint `/api/admin/notification/sse/connect?name=objectRecognition`
2. Kiểm tra CORS settings (SSEService sử dụng `withCredentials: true`)
3. Xem console logs từ SSEService
4. Check network tab cho SSE connection

### Data không update:
1. Kiểm tra data format từ backend có đúng `BeDataResponse` interface
2. Xem console logs: `📊 Processing SSE data`
3. Kiểm tra `updateChartsFromRealTimeData()` method
4. Verify `handleSSEData()` được gọi

### Connection bị disconnect liên tục:
1. Kiểm tra backend stability
2. Review SSEService error logs
3. Kiểm tra network conditions
4. SSEService tự động reconnect sau 5s

### Change detection issues:
1. SSEService sử dụng NgZone để trigger change detection
2. Component sử dụng `OnPush` strategy với `cdr.markForCheck()`
3. Check `updateChartsFromRealTimeData()` gọi `cdr.markForCheck()`
