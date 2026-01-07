# Tracking Map System - Hướng dẫn sử dụng

## Tổng quan

Hệ thống tracking map cho phép hiển thị lộ trình di chuyển của đối tượng (xe, người, sự kiện) trên bản đồ với các marker SVG tùy chỉnh.

## Các thành phần

### 1. TrackingService (`tracking.service.ts`)

Service quản lý dữ liệu tracking, có thể tái sử dụng cho nhiều màn hình khác nhau.

**Chức năng chính:**
- Gọi API lấy tracking events
- Sắp xếp events theo thời gian
- Chuyển đổi dữ liệu sang format cho map
- Validate tọa độ GPS
- Cache dữ liệu với RxJS BehaviorSubject

**Methods:**
```typescript
// Generic tracking method
getTrackingData(apiEndpoint: string, params: TrackingRequestParams): Observable<TrackingLocation[]>

// Convenience methods
trackVehicleByLicensePlate(licensePlate: string, fromUtc?, toUtc?, apiEndpoint?): Observable<TrackingLocation[]>
trackObjectById(objectId: string, fromUtc?, toUtc?, apiEndpoint?): Observable<TrackingLocation[]>
trackByEventType(eventType: string, fromUtc?, toUtc?, apiEndpoint?): Observable<TrackingLocation[]>

// Helper methods
setTrackingTarget(target: string): void
getCurrentTrackingData(): TrackingLocation[]
clearTrackingData(): void
```

### 2. TrackingMapComponent (`tracking-map.component.ts`)

Component hiển thị map với tracking route và markers.

**Features:**
- Hiển thị polyline animated cho route
- 3 loại marker SVG:
  - `event-start-map.svg` - Marker đầu tiên (màu xanh lá)
  - `event-base-map.svg` - Các marker ở giữa (màu xanh dương)
  - `event-end-map.svg` - Marker cuối cùng (màu cam)
- Auto-zoom để fit tất cả markers
- Click marker để show info window
- Highlight selected event

**Inputs:**
```typescript
@Input() locations: TrackingLocation[] = [];
@Input() trackingTarget: string = '';
@Input() selectedEventId: string = '';
```

## Cách sử dụng

### Bước 1: Import TrackingService

```typescript
import { TrackingService, TrackingLocation } from '../../shared/services/tracking.service';

constructor(private trackingService: TrackingService) {}
```

### Bước 2: Thêm TrackingMapComponent vào template

```html
<app-tracking-map
  [locations]="trackingLocations"
  [trackingTarget]="trackingTarget"
  [selectedEventId]="selectedEventId">
</app-tracking-map>
```

### Bước 3: Load tracking data

**Ví dụ 1: Track theo biển số xe**

```typescript
export class VehicleTrackingComponent implements OnInit {
  trackingLocations: TrackingLocation[] = [];
  trackingTarget: string = '';
  selectedEventId: string = '';

  constructor(private trackingService: TrackingService) {}

  trackVehicle(licensePlate: string): void {
    this.trackingService.trackVehicleByLicensePlate(
      licensePlate,
      this.fromUtc,
      this.toUtc,
      '/api/admin/events/vehicle/track'
    ).subscribe({
      next: (locations) => {
        this.trackingLocations = locations;
        this.trackingTarget = licensePlate;
        console.log('✅ Loaded', locations.length, 'tracking points');
      },
      error: (error) => {
        console.error('❌ Tracking error:', error);
      }
    });
  }
}
```

**Ví dụ 2: Track theo object ID**

```typescript
trackPerson(objectId: string): void {
  this.trackingService.trackObjectById(
    objectId,
    this.fromUtc,
    this.toUtc,
    '/api/admin/events/person/track'
  ).subscribe({
    next: (locations) => {
      this.trackingLocations = locations;
      this.trackingTarget = objectId;
    }
  });
}
```

**Ví dụ 3: Generic tracking với custom params**

```typescript
trackCustom(): void {
  this.trackingService.getTrackingData('/api/admin/events/custom-track', {
    eventType: 'TRAFFIC_VIOLATION',
    location: 'Hà Nội',
    fromUtc: '2024-01-01T00:00:00Z',
    toUtc: '2024-01-31T23:59:59Z',
    cameraSn: 'CAM-001'
  }).subscribe({
    next: (locations) => {
      this.trackingLocations = locations;
      this.trackingTarget = 'Traffic Violations in Hà Nội';
    }
  });
}
```

### Bước 4: Highlight selected event (optional)

```typescript
onEventSelected(eventId: string): void {
  this.selectedEventId = eventId;
  // Component sẽ tự động highlight và pan to marker
}
```

## Cấu trúc dữ liệu API

### Request Params

```typescript
interface TrackingRequestParams {
  licensePlate?: string;      // Biển số xe
  objectId?: string;           // ID đối tượng
  eventType?: string;          // Loại event
  fromUtc?: string;            // Thời gian bắt đầu (ISO string)
  toUtc?: string;              // Thời gian kết thúc (ISO string)
  cameraSn?: string;           // Serial number camera
  location?: string;           // Khu vực
  page?: number;               // Phân trang
  pageSize?: number;
}
```

### Response Format

API cần trả về danh sách events với cấu trúc:

```typescript
{
  "success": true,
  "data": {
    "events": [
      {
        "eventId": "evt-001",
        "latitude": 21.0285,
        "longitude": 105.8542,
        "eventTime": "2024-12-25T10:30:00Z",
        "cameraSn": "CAM-001",
        "cameraName": "Camera Hà Nội",
        "location": "Hà Nội",
        "thumbnailUrl": "https://...",
        "eventType": "VEHICLE_TRACKING"
      },
      // ... more events
    ]
  }
}
```

**Lưu ý quan trọng:**
- Events phải có GPS hợp lệ (`latitude`, `longitude`)
- Service sẽ tự động sắp xếp theo `eventTime` (cũ nhất trước)
- Tọa độ không hợp lệ (0,0 hoặc out of range) sẽ bị lọc bỏ

## Customization

### Thay đổi icon markers

Chỉnh sửa file trong `src/assets/icon/`:
- `event-start-map.svg` - Icon marker đầu
- `event-base-map.svg` - Icon marker giữa
- `event-end-map.svg` - Icon marker cuối

### Thay đổi màu polyline

Trong `tracking-map.component.ts`, method `drawPolylineWithAnimation()`:

```typescript
this.polyline = new google.maps.Polyline({
  strokeColor: '#7B68EE',  // Thay đổi màu ở đây
  strokeOpacity: 1,
  strokeWeight: 4
});
```

### Thay đổi kích thước markers

Trong `tracking-map.component.ts`, method `createEventMarkers()`:

```typescript
if (isFirst) {
  iconSize = new google.maps.Size(40, 40);  // Kích thước marker đầu
} else if (isLast) {
  iconSize = new google.maps.Size(40, 40);  // Kích thước marker cuối
} else {
  iconSize = new google.maps.Size(32, 32);  // Kích thước marker giữa
}
```

## Ví dụ complete component

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingMapComponent } from '../../shared/components/tracking-map/tracking-map.component';
import { TrackingService, TrackingLocation } from '../../shared/services/tracking.service';

@Component({
  selector: 'app-vehicle-tracking',
  standalone: true,
  imports: [CommonModule, TrackingMapComponent],
  template: `
    <div class="tracking-container">
      <div class="search-bar">
        <input 
          type="text" 
          [(ngModel)]="searchText"
          placeholder="Nhập biển số xe..."
          (keyup.enter)="search()">
        <button (click)="search()">Tìm kiếm</button>
      </div>

      <app-tracking-map
        [locations]="trackingLocations"
        [trackingTarget]="trackingTarget"
        [selectedEventId]="selectedEventId">
      </app-tracking-map>
    </div>
  `
})
export class VehicleTrackingComponent implements OnInit {
  searchText: string = '';
  trackingLocations: TrackingLocation[] = [];
  trackingTarget: string = '';
  selectedEventId: string = '';

  constructor(private trackingService: TrackingService) {}

  ngOnInit(): void {
    // Subscribe to tracking data updates
    this.trackingService.trackingData$.subscribe(locations => {
      this.trackingLocations = locations;
    });
  }

  search(): void {
    if (!this.searchText.trim()) return;

    this.trackingService.trackVehicleByLicensePlate(
      this.searchText,
      undefined, // fromUtc - optional
      undefined, // toUtc - optional
      '/api/admin/events/vehicle/track'
    ).subscribe({
      next: (locations) => {
        console.log('✅ Found', locations.length, 'tracking points');
        this.trackingTarget = this.searchText;
      },
      error: (error) => {
        console.error('❌ Tracking error:', error);
        alert('Không tìm thấy dữ liệu tracking');
      }
    });
  }
}
```

## Best Practices

1. **Validation dữ liệu đầu vào**
   - Kiểm tra biển số/object ID trước khi gọi API
   - Validate time range hợp lệ

2. **Error handling**
   - Luôn xử lý error trong subscribe
   - Hiển thị thông báo cho user khi không có dữ liệu

3. **Performance**
   - Service đã cache dữ liệu với BehaviorSubject
   - Chỉ load lại khi cần thiết
   - Limit số lượng events nếu quá nhiều (sử dụng pagination)

4. **Memory management**
   - Component tự động cleanup markers trong ngOnDestroy
   - Unsubscribe observables khi component destroy

5. **Reusability**
   - Sử dụng TrackingService cho tất cả tracking features
   - Không hard-code API endpoints
   - Truyền API endpoint qua parameter

## Troubleshooting

**Markers không hiển thị:**
- Kiểm tra GPS coordinates hợp lệ
- Kiểm tra SVG icons tồn tại trong `assets/icon/`
- Check console logs để xem markers có được tạo không

**Map không zoom đúng:**
- Đảm bảo có ít nhất 2 locations
- Method `calculateOptimalZoom()` cần ít nhất 2 points

**Polyline không hiển thị:**
- Cần ít nhất 2 locations
- Kiểm tra `drawPolylineWithAnimation()` có được gọi không

**Info window không hiển thị:**
- Kiểm tra `googleMapComponent` đã ready chưa
- Check projection và bounds của map
