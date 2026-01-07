# Location Service - Hướng dẫn sử dụng

## Mô tả
`LocationService` là service dùng để quản lý danh sách các khu vực (locations) trong hệ thống. Service này sử dụng RxJS để cache dữ liệu và tránh gọi API không cần thiết.

## Tính năng
- ✅ Cache dữ liệu tự động với `shareReplay(1)`
- ✅ Chỉ gọi API một lần, các lần sau lấy từ cache
- ✅ Hỗ trợ force refresh khi cần
- ✅ Observable pattern để reactive updates
- ✅ Error handling tự động

## Cách sử dụng

### 1. Import service vào component

```typescript
import { LocationService } from '../../shared/services/location.service';
```

### 2. Inject vào constructor

```typescript
constructor(private locationService: LocationService) {}
```

### 3. Sử dụng trong component

#### Cách 1: Subscribe trực tiếp (đơn giản)

```typescript
export class YourComponent implements OnInit {
  locationOptions: LocationOption[] = [];

  constructor(private locationService: LocationService) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  private loadLocations(): void {
    this.locationService.getLocations().subscribe({
      next: (locations) => {
        this.locationOptions = locations;
        console.log('Locations loaded:', locations);
      },
      error: (error) => {
        console.error('Error loading locations:', error);
      }
    });
  }
}
```

#### Cách 2: Sử dụng async pipe (khuyến nghị)

```typescript
export class YourComponent implements OnInit {
  locationOptions$: Observable<LocationOption[]>;

  constructor(private locationService: LocationService) {}

  ngOnInit(): void {
    this.locationOptions$ = this.locationService.getLocations();
  }
}
```

Template:
```html
<div *ngFor="let location of locationOptions$ | async">
  {{ location.label }}
</div>
```

#### Cách 3: Lấy giá trị hiện tại (synchronous)

```typescript
const currentLocations = this.locationService.getCurrentLocations();
console.log('Current locations:', currentLocations);
```

### 4. Force refresh khi cần

```typescript
// Refresh lại dữ liệu từ API
this.locationService.refreshLocations().subscribe({
  next: (locations) => {
    console.log('Locations refreshed:', locations);
  }
});
```

### 5. Clear cache

```typescript
// Xóa cache và reset về giá trị mặc định
this.locationService.clearCache();
```

## API Reference

### Methods

#### `getLocations(forceRefresh?: boolean): Observable<LocationOption[]>`
Lấy danh sách locations. Tự động cache kết quả.
- `forceRefresh`: (optional) Set `true` để bắt buộc gọi lại API

**Ví dụ:**
```typescript
// Lấy từ cache (nếu có)
this.locationService.getLocations().subscribe(...);

// Force reload từ API
this.locationService.getLocations(true).subscribe(...);
```

#### `refreshLocations(): Observable<LocationOption[]>`
Làm mới dữ liệu từ API.

**Ví dụ:**
```typescript
this.locationService.refreshLocations().subscribe(locations => {
  console.log('Refreshed:', locations);
});
```

#### `getCurrentLocations(): LocationOption[]`
Lấy giá trị hiện tại của locations (synchronous).

**Ví dụ:**
```typescript
const locations = this.locationService.getCurrentLocations();
```

#### `clearCache(): void`
Xóa cache và reset về giá trị mặc định.

**Ví dụ:**
```typescript
this.locationService.clearCache();
```

### Properties

#### `locations$: Observable<LocationOption[]>`
Observable stream của locations, có thể subscribe để nhận updates.

**Ví dụ:**
```typescript
this.locationService.locations$.subscribe(locations => {
  console.log('Locations updated:', locations);
});
```

## Interface

```typescript
export interface LocationOption {
  label: string;  // Tên hiển thị (ví dụ: "Hà Nội")
  value: string;  // Giá trị (ví dụ: "ha-noi")
}
```

## Ví dụ thực tế

### Ví dụ 1: Dropdown filter location

```typescript
// Component
export class StatisticsComponent implements OnInit {
  locationOptions$: Observable<LocationOption[]>;
  selectedLocation = '';

  constructor(private locationService: LocationService) {}

  ngOnInit(): void {
    this.locationOptions$ = this.locationService.getLocations();
  }

  onLocationChange(value: string): void {
    this.selectedLocation = value;
    this.loadData();
  }

  private loadData(): void {
    // Load data với filter location
  }
}
```

```html
<!-- Template -->
<select [(ngModel)]="selectedLocation" (change)="onLocationChange($event.target.value)">
  <option *ngFor="let location of locationOptions$ | async" [value]="location.value">
    {{ location.label }}
  </option>
</select>
```

### Ví dụ 2: Multi-component sharing

```typescript
// Component A
export class ComponentA implements OnInit {
  constructor(private locationService: LocationService) {}

  ngOnInit(): void {
    // Component A gọi lần đầu - sẽ fetch từ API
    this.locationService.getLocations().subscribe(locations => {
      console.log('Component A:', locations);
    });
  }
}

// Component B
export class ComponentB implements OnInit {
  constructor(private locationService: LocationService) {}

  ngOnInit(): void {
    // Component B gọi sau - sẽ lấy từ cache, KHÔNG gọi API
    this.locationService.getLocations().subscribe(locations => {
      console.log('Component B:', locations);
    });
  }
}
```

## Best Practices

1. **Sử dụng async pipe khi có thể** - Tự động unsubscribe, tránh memory leaks
   ```typescript
   locationOptions$ = this.locationService.getLocations();
   ```

2. **Không cần force refresh thường xuyên** - Cache tự động hoạt động hiệu quả
   ```typescript
   // ✅ Good - lấy từ cache
   this.locationService.getLocations()
   
   // ❌ Bad - gọi API mỗi lần không cần thiết
   this.locationService.getLocations(true)
   ```

3. **Chỉ refresh khi có thay đổi dữ liệu** - Ví dụ: sau khi thêm/xóa location
   ```typescript
   onLocationAdded(): void {
     this.locationService.refreshLocations().subscribe();
   }
   ```

4. **Unsubscribe khi không dùng async pipe**
   ```typescript
   private subscription: Subscription;
   
   ngOnInit(): void {
     this.subscription = this.locationService.getLocations().subscribe(...);
   }
   
   ngOnDestroy(): void {
     this.subscription?.unsubscribe();
   }
   ```

## Lưu ý

- Service này được provide ở `root` level, nên chỉ có 1 instance duy nhất trong toàn app
- Dữ liệu được cache trong memory, sẽ mất khi refresh trang
- API endpoint: `/api/admin/camera/list`
- Tự động xử lý lỗi và trả về danh sách mặc định khi có lỗi
