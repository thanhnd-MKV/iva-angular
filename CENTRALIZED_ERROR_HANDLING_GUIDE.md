# Centralized Error Handling System

## Tổng quan
Hệ thống error handling tập trung giúp bắt và xử lý tất cả lỗi HTTP request trong ứng dụng một cách thống nhất.

## Các thành phần chính

### 1. ErrorHandlerInterceptor
- Bắt tất cả HTTP errors
- Tự động phân loại và format error messages
- Hiển thị snackbar cho các errors phù hợp
- Lưu trữ errors vào ErrorHandlerService

### 2. ErrorHandlerService
- Quản lý global error state
- Cung cấp observables cho components subscribe
- Phân loại errors (network, server, client, timeout, unknown)
- Generate error messages tiếng Việt
- Quản lý lifecycle của errors (handled/unhandled)

### 3. BaseErrorHandlerComponent
- Base class cho các components cần error handling
- Tự động subscribe global errors
- Cung cấp hasError và errorMessage properties
- Abstract methods cho retry logic

## Cách sử dụng

### Option 1: Extend BaseErrorHandlerComponent (Khuyến nghị)

```typescript
export class YourComponent extends BaseErrorHandlerComponent implements OnInit {
  constructor(
    // your dependencies
  ) {
    super(); // Bắt buộc call super()
  }

  override ngOnInit() {
    super.ngOnInit(); // Bắt buộc call super.ngOnInit()
  }

  // Implement required abstract methods
  protected initializeComponent(): void {
    // Khởi tạo component của bạn
    this.loadData();
  }

  protected onRetry(): void {
    // Logic retry khi user click "Thử lại"
    this.markErrorAsHandled();
    this.loadData();
  }

  // Your component methods
  loadData() {
    this.service.getData().subscribe({
      next: (data) => {
        // Handle success
      },
      error: (error) => {
        // Error sẽ được interceptor bắt tự động
        // Không cần snackBar.open nữa
        console.error('Error:', error);
      }
    });
  }
}
```

### Option 2: Manual Error Handling

```typescript
export class YourComponent implements OnInit, OnDestroy {
  hasError = false;
  errorMessage = '';
  
  constructor(private errorHandler: ErrorHandlerService) {}

  ngOnInit() {
    // Subscribe to global errors
    this.errorHandler.globalError$.subscribe(error => {
      if (error && !error.handled) {
        this.hasError = true;
        this.errorMessage = error.message;
      } else {
        this.hasError = false;
        this.errorMessage = '';
      }
    });
  }

  onRetry() {
    const currentError = this.errorHandler.getCurrentGlobalError();
    if (currentError) {
      this.errorHandler.markErrorAsHandled(currentError.id);
    }
    this.loadData();
  }
}
```

### Update HTML Template

```html
<app-base-table
  [hasError]="hasError"
  [errorMessage]="errorMessage"
  (refresh)="onRetry()">
</app-base-table>
```

## Error Types và Messages

### Network Errors (status: 0)
- Type: 'network'
- Message: "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn."
- Snackbar: Không tự đóng, có nút "Thử lại"

### Server Errors (5xx)
- Type: 'server'
- Message: "Server đang gặp sự cố. Vui lòng thử lại sau vài phút."

### Client Errors (4xx)
- Type: 'client'
- 401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
- 403: "Bạn không có quyền truy cập dữ liệu này."
- 404: "Không tìm thấy dữ liệu yêu cầu."
- 408: "Yêu cầu đã hết thời gian chờ. Vui lòng thử lại."

### Timeout Errors
- Type: 'timeout'
- Message: "Yêu cầu đã hết thời gian chờ. Vui lòng thử lại."

## Configuration

### Snackbar Display Rules
- 401 errors: Không hiển thị snackbar (sẽ redirect to login)
- Network errors: Snackbar không tự đóng
- Other errors: Snackbar tự đóng sau 5s

### Error Storage
- Giữ tối đa 50 errors gần nhất
- Mỗi error có unique ID và timestamp
- Track handled/unhandled status

## Debug Tools

### ErrorDisplayComponent
- Component hiển thị danh sách errors (cho development)
- Floating button ở góc phải màn hình
- Badge hiển thị số lượng unhandled errors
- Có thể mark errors as handled hoặc clear all

### Console Logging
- Tất cả errors được log chi tiết
- Include original error object và request info
- Track error lifecycle (creation, handling)

## Best Practices

1. **Component Level**: Extend BaseErrorHandlerComponent cho auto handling
2. **Service Calls**: Chỉ cần handle success case, error sẽ được interceptor bắt
3. **User Feedback**: Sử dụng hasError và errorMessage từ base component
4. **Retry Logic**: Implement onRetry() method cho specific retry behavior
5. **Manual Errors**: Dùng errorHandler.reportError() cho non-HTTP errors

## Migration Guide

### Old Code:
```typescript
this.service.getData().subscribe({
  next: (data) => { /* handle success */ },
  error: (error) => {
    this.snackBar.open('Lỗi khi tải dữ liệu', 'Đóng');
    this.hasError = true;
    this.errorMessage = 'Custom error message';
  }
});
```

### New Code:
```typescript
// With BaseErrorHandlerComponent
this.service.getData().subscribe({
  next: (data) => { /* handle success */ },
  error: (error) => {
    // Error handled automatically by interceptor
    console.error('Error:', error);
  }
});
```

## Troubleshooting

### Error không hiển thị
- Kiểm tra component có extend BaseErrorHandlerComponent không
- Kiểm tra có call super.ngOnInit() không
- Kiểm tra template có pass hasError và errorMessage không

### Snackbar hiển thị duplicate
- Remove manual snackBar.open() calls
- Error sẽ được interceptor handle tự động

### Custom error handling
- Override handleGlobalError() method trong component
- Hoặc sử dụng errorHandler.reportError() cho manual errors