# Event Search Bar Component - Hướng dẫn sử dụng

Component `EventSearchBarComponent` giờ đã được refactor để linh hoạt và có thể tùy chỉnh cho nhiều màn hình khác nhau.

## 1. Import Types

```typescript
import { EventSearchBarComponent, FilterConfig } from '../../shared/event-search-bar/event-search-bar.component';
```

## 2. Cấu hình Filters

Trong component TypeScript của bạn, định nghĩa filters:

```typescript
export class EventInfoComponent implements OnInit {
  // Cấu hình filters cho màn hình Event
  eventFilters: FilterConfig[] = [
    {
      key: 'vehicleType',
      label: 'Loại phương tiện',
      options: [
        { label: 'Ô tô, xe máy', value: '' },
        { label: 'Ô tô', value: 'car' },
        { label: 'Xe máy', value: 'motorbike' },
        { label: 'Xe đạp', value: 'bicycle' }
      ],
      defaultValue: ''
    },
    {
      key: 'camera',
      label: 'Camera',
      options: [
        { label: 'Camera 02', value: 'camera_02' },
        { label: 'Camera 01', value: 'camera_01' },
        { label: 'Camera 03', value: 'camera_03' }
      ],
      defaultValue: 'camera_02'
    },
    {
      key: 'behavior',
      label: 'Hành vi',
      options: [
        { label: 'Hành vi', value: '' },
        { label: 'Vượt đèn đỏ', value: 'red_light' },
        { label: 'Đi sai làn', value: 'wrong_lane' },
        { label: 'Quá tốc độ', value: 'speeding' }
      ],
      defaultValue: ''
    }
  ];

  handleSearch(params: any) {
    console.log('Search params:', params);
    // params sẽ chứa:
    // {
    //   timeRange: 'today',
    //   searchText: '29A12345',
    //   vehicleType: 'car',
    //   camera: 'camera_02',
    //   behavior: 'red_light',
    //   startDate: Date,
    //   endDate: Date
    // }
  }

  handleAdvancedSearch() {
    // Xử lý tìm kiếm nâng cao
  }
}
```

## 3. Sử dụng trong Template

```html
<app-event-search-bar
  [filters]="eventFilters"
  [showSearchInput]="true"
  [searchInputPlaceholder]="'biển số xe'"
  [showAdvancedSearch]="true"
  (searchTriggered)="handleSearch($event)"
  (advancedSearchTriggered)="handleAdvancedSearch()">
</app-event-search-bar>
```

## 4. Tùy chỉnh cho màn hình khác

Ví dụ cho màn hình Camera Management:

```typescript
export class CameraManagementComponent implements OnInit {
  cameraFilters: FilterConfig[] = [
    {
      key: 'zone',
      label: 'Khu vực',
      options: [
        { label: 'Tất cả khu vực', value: '' },
        { label: 'Khu A', value: 'zone_a' },
        { label: 'Khu B', value: 'zone_b' }
      ]
    },
    {
      key: 'status',
      label: 'Trạng thái',
      options: [
        { label: 'Tất cả', value: '' },
        { label: 'Hoạt động', value: 'active' },
        { label: 'Không hoạt động', value: 'inactive' }
      ]
    }
  ];
}
```

Template:
```html
<app-event-search-bar
  [filters]="cameraFilters"
  [showSearchInput]="true"
  [searchInputPlaceholder]="'tên camera'"
  [showAdvancedSearch]="false"
  (searchTriggered)="handleSearch($event)">
</app-event-search-bar>
```

## 5. Properties có thể tùy chỉnh

| Property | Type | Mặc định | Mô tả |
|----------|------|----------|-------|
| `filters` | `FilterConfig[]` | `[]` | Mảng các filter dropdowns |
| `showSearchInput` | `boolean` | `true` | Hiển thị ô input search |
| `searchInputPlaceholder` | `string` | `'biển số xe'` | Placeholder cho ô search |
| `showAdvancedSearch` | `boolean` | `true` | Hiển thị nút tìm kiếm nâng cao |

## 6. Events

- `searchTriggered`: Emit khi bấm nút Tìm kiếm hoặc Enter trong search input
- `advancedSearchTriggered`: Emit khi bấm nút Tìm kiếm nâng cao

## 7. Lưu ý

- Component tự động quản lý state của tất cả filters
- Dropdown thời gian (Chọn thời gian) luôn có sẵn và không cần cấu hình
- Khi chọn "Tùy chỉnh" trong dropdown thời gian, date range picker sẽ tự động hiển thị
- Tất cả giá trị được trả về trong object `searchParams` khi emit event `searchTriggered`
