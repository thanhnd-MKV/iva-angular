# Error Handling Guide for Base Table Component

## Overview
The `base-table` component now supports comprehensive error handling to properly display server connection issues instead of showing generic "no data" messages.

## Implementation

### 1. Component Properties
Add these properties to your parent component that uses `base-table`:

```typescript
export class YourComponent {
  // Existing properties...
  
  // Error handling properties
  hasError = false;
  errorMessage = '';
  
  // Your other code...
}
```

### 2. HTML Template
Pass the error properties to the base-table component:

```html
<app-base-table 
  [title]="'Your Title'" 
  [data]="tableData" 
  [columnsToDisplay]="columnsToDisplay"
  [columnDefs]="columnDefs" 
  [actions]="['edit', 'delete', 'info', 'create']"
  [hasError]="hasError"
  [errorMessage]="errorMessage"
  (edit)="handleEdit($event)"
  (delete)="handleDelete($event)"
  (refresh)="onRefreshData()">
</app-base-table>
```

### 3. Service Call with Error Handling
Update your data loading method to handle different error scenarios:

```typescript
loadTableData(): void {
  const params = {
    current: this.pageNumber + 1,
    size: this.pageSize,
    // ... other params
  };

  this.loading = true;
  this.hasError = false; // Reset error state

  this.yourService.getData(params).subscribe(
    (resp) => {
      this.loading = false;
      if (resp.success) {
        this.tableData = resp.data.records;
        this.totalItems = resp.data.total;
        this.hasError = false; // Clear error state on success
      } else {
        // Handle API failure response
        this.hasError = true;
        this.errorMessage = resp.message || 'Không thể tải dữ liệu từ server';
        this.tableData = [];
      }
    },
    (error) => {
      this.loading = false;
      console.error('Error loading data:', error);
      
      // Set error state based on error type
      this.hasError = true;
      this.tableData = [];
      
      // Provide specific error messages based on HTTP status codes
      if (error.status === 0) {
        this.errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn.';
      } else if (error.status >= 500) {
        this.errorMessage = 'Server đang gặp sự cố. Vui lòng thử lại sau vài phút.';
      } else if (error.status === 404) {
        this.errorMessage = 'Không tìm thấy dữ liệu yêu cầu.';
      } else if (error.status === 403) {
        this.errorMessage = 'Bạn không có quyền truy cập dữ liệu này.';
      } else if (error.status === 401) {
        this.errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else {
        this.errorMessage = error.error?.message || 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.';
      }
    }
  );
}
```

## Error State Behavior

### Visual Display
When `hasError` is `true`, the base-table component will show:
- ⚠️ Server connection error icon with pulse animation
- Custom error message from `errorMessage` property
- Red "Thử lại" (Try Again) button instead of the normal "Làm mới" button
- "Đang kết nối..." loading text instead of "Đang tải..." when retrying

### User Interaction
- Users can click "Thử lại" to retry the operation
- The error state automatically clears when new data loads successfully
- Loading states show appropriate messages based on error vs normal operation

## Error Message Guidelines

### Network Connection Issues (status: 0)
```
"Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng của bạn."
```

### Server Errors (status: 500+)
```
"Server đang gặp sự cố. Vui lòng thử lại sau vài phút."
```

### Not Found (status: 404)
```
"Không tìm thấy dữ liệu yêu cầu."
```

### Forbidden (status: 403)
```
"Bạn không có quyền truy cập dữ liệu này."
```

### Unauthorized (status: 401)
```
"Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
```

### API Failure Response
```typescript
// When API returns success: false
this.errorMessage = resp.message || 'Không thể tải dữ liệu từ server';
```

### Generic Error
```
"Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại."
```

## Implementation Example
See `camera-list.component.ts` and `camera-list.component.html` for a complete working example of the error handling implementation.

## Benefits
1. **Better User Experience**: Users see meaningful error messages instead of confusing "no data" messages
2. **Clear Visual Distinction**: Different styling for error states vs empty data states
3. **Actionable Feedback**: Users can retry operations with a clearly labeled button
4. **Consistent Error Handling**: Standardized error messages across all table components
5. **Proper Loading States**: Different loading messages for normal vs error retry operations