# Hướng dẫn SSE Multi Notification

## Tổng quan

Tính năng SSE Multi Notification cho phép kết nối đến endpoint `/sse/admin/notification/connect-multi` để nhận nhiều loại thông báo cùng lúc (alarm, traffic-event) thông qua một kết nối duy nhất.

## Endpoint

```
GET /sse/admin/notification/connect-multi?names=alarm&names=traffic-event
```

### Query Parameters
- `names`: Tên các kênh thông báo (có thể lặp lại nhiều lần)
  - `alarm`: Thông báo cảnh báo (cháy, xâm nhập, lỗi hệ thống, camera offline, nhiệt độ cao)
  - `traffic-event`: Sự kiện giao thông (tai nạn, tắc nghẽn, đỗ xe không đúng nơi, đi sai làn, vượt quá tốc độ)

## Cách sử dụng

### 1. Sử dụng SSEService

```typescript
import { SSEService } from './core/services/sse.service';

constructor(private sseService: SSEService) {}

// Kết nối với fake data (để test)
this.sseService.connectMulti(['alarm', 'traffic-event'], true)
  .subscribe({
    next: (notification) => {
      console.log('Received:', notification);
      // notification.event: 'alarm' hoặc 'traffic-event'
      // notification.data: dữ liệu thông báo
    },
    error: (error) => {
      console.error('Error:', error);
    }
  });

// Kết nối với API thật
this.sseService.connectMulti(['alarm', 'traffic-event'], false)
  .subscribe({
    next: (notification) => {
      // Xử lý thông báo
    }
  });
```

### 2. Test với component có sẵn

Truy cập: `/notification-test`

Component này cung cấp giao diện để:
- Kết nối với fake data (test không cần backend)
- Kết nối với API thật
- Xem danh sách thông báo nhận được
- Hiển thị thống kê số lượng alarm và traffic-event

## Cấu trúc dữ liệu

### Alarm Notification

```typescript
{
  event: 'alarm',
  data: {
    id: string,              // alarm_1234567890_1
    type: string,            // fire, intrusion, system-error, camera-offline, high-temperature
    severity: string,        // critical, high, medium, low
    title: string,           // Cảnh báo #1
    message: string,         // Phát hiện sự cố cần xử lý
    location: string,        // Tầng 1 - Khu A
    timestamp: string,       // ISO 8601 format
    camera: string,          // CAM_15
    status: string           // new, acknowledged, resolved
  }
}
```

### Traffic Event Notification

```typescript
{
  event: 'traffic-event',
  data: {
    id: string,              // traffic_1234567890_1
    type: string,            // accident, congestion, illegal-parking, wrong-way, speeding
    title: string,           // Sự kiện giao thông #1
    message: string,         // Phát hiện vi phạm hoặc sự cố giao thông
    location: string,        // Đường Lê Lợi
    timestamp: string,       // ISO 8601 format
    lane: string,            // Lane 2
    vehicleType: string,     // car, motorbike, truck, bus
    licensePlate: string,    // 29A-12345
    status: string           // detected, processing, resolved
  }
}
```

## Fake Data

SSEService có tích hợp fake data generator cho mục đích testing:

- **Alarm**: Tạo thông báo mới mỗi 8 giây
- **Traffic Event**: Tạo thông báo mới mỗi 12 giây

Dữ liệu fake bao gồm:
- Ngẫu nhiên các loại cảnh báo/sự kiện
- Ngẫu nhiên mức độ nghiêm trọng
- Ngẫu nhiên vị trí
- Timestamp thời gian thực
- Thông tin camera/xe ngẫu nhiên

## Tính năng

### Auto Reconnect
- Tự động kết nối lại khi mất kết nối
- Heartbeat check mỗi 30 giây
- Timeout sau 60 giây không nhận được tin nhắn

### Toast Notifications
- Hiển thị toast notification khi nhận được thông báo mới
- Màu sắc khác nhau cho từng loại:
  - **Alarm Critical/High**: Đỏ (error) - 8 giây
  - **Alarm Medium/Low**: Cam (warning) - 5 giây
  - **Traffic Event**: Xanh (info) - 5 giây

### Logging
- Log chi tiết trong console
- Emoji để dễ phân biệt:
  - 🔌 Connection
  - 📨 Message received
  - 💓 Heartbeat/Keepalive
  - ❌ Error
  - 🔄 Reconnect
  - 🧪 Fake data

## Ví dụ thực tế

### Trong một component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SSEService } from '../../core/services/sse.service';
import { NotificationService } from '../../shared/components/notification/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-component',
  template: `...`
})
export class MyComponent implements OnInit, OnDestroy {
  private sseSubscription?: Subscription;

  constructor(
    private sseService: SSEService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Kết nối SSE khi component init
    this.connectSSE();
  }

  ngOnDestroy(): void {
    // Ngắt kết nối khi component bị destroy
    if (this.sseSubscription) {
      this.sseSubscription.unsubscribe();
    }
  }

  private connectSSE(): void {
    this.sseSubscription = this.sseService
      .connectMulti(['alarm', 'traffic-event'], false)
      .subscribe({
        next: (notification) => {
          this.handleNotification(notification);
        },
        error: (error) => {
          console.error('SSE Error:', error);
          // Auto reconnect logic đã được xử lý bên trong service
        }
      });
  }

  private handleNotification(notification: any): void {
    const { event, data } = notification;
    
    if (event === 'alarm') {
      // Xử lý alarm
      if (data.severity === 'critical') {
        this.notificationService.error(
          data.title,
          `${data.message} tại ${data.location}`,
          10000
        );
        // Play sound, show modal, etc.
      }
    } else if (event === 'traffic-event') {
      // Xử lý traffic event
      this.notificationService.info(
        data.title,
        `${data.type} tại ${data.location}`
      );
      // Update map, refresh list, etc.
    }
  }
}
```

## Notes

1. **Fake Data Mode**: Chỉ nên dùng cho development/testing
2. **Token**: SSE tự động lấy token từ `sessionStorage.getItem('TOKEN')`
3. **Connection Key**: Mỗi kết nối được identify bằng `multi_${names.join('_')}`
4. **Memory Management**: Component tự động cleanup khi unsubscribe/destroy
5. **Error Handling**: Service tự động xử lý reconnect, không cần xử lý thủ công

## Troubleshooting

### Không nhận được thông báo
1. Kiểm tra console log xem có kết nối thành công không
2. Kiểm tra token có hợp lệ không
3. Kiểm tra network tab trong DevTools
4. Thử với fake data mode để đảm bảo code logic đúng

### Kết nối bị ngắt liên tục
1. Kiểm tra network stability
2. Kiểm tra backend có gửi keepalive không
3. Tăng timeout nếu cần (hiện tại: 60s)

### Memory leak
1. Đảm bảo unsubscribe trong ngOnDestroy
2. Không subscribe nhiều lần mà không unsubscribe
3. Sử dụng takeUntil pattern nếu cần

## API Backend Requirements

Backend cần implement endpoint SSE với format:

```
GET /sse/admin/notification/connect-multi?names=alarm&names=traffic-event
Content-Type: text/event-stream
Headers:
  - sso-session-id: {token}
  
Response:
event: alarm
data: {"id":"...","type":"fire",...}

event: traffic-event
data: {"id":"...","type":"accident",...}

: keepalive
```

Keepalive comments (`:`) nên được gửi mỗi 20-30 giây để duy trì kết nối.
